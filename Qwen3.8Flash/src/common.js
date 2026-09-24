import * as THREE from 'three';
import * as TX from './textures.js';

export const timeU = { value: 0 };

export const GLSL_HASH = `
float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
`;

export function makeCtx() {
  const root = new THREE.Group();
  const grad = TX.gradientMap();
  const refs = {
    signMats: [], doors: [], fans: [], chime: null, interiorFlicker: [],
    traffic: null, vendingMats: [], eaves: [],
  };
  const updaters = [];

  const toon = (color, opts = {}) => new THREE.MeshToonMaterial({ color, gradientMap: grad, ...opts });

  const OUT = new THREE.LineBasicMaterial({ color: 0x0b101f });
  function edges(mesh, angle = 34) {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), OUT);
    e.scale.setScalar(1.008);
    e.renderOrder = 3;
    mesh.add(e);
  }

  function box(parent, w, h, d, m, x = 0, y = 0, z = 0, o = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    if (o.rx) mesh.rotation.x = o.rx;
    if (o.ry) mesh.rotation.y = o.ry;
    if (o.rz) mesh.rotation.z = o.rz;
    mesh.castShadow = o.cast !== false;
    mesh.receiveShadow = o.recv !== false;
    if (o.edge !== false) edges(mesh, o.edge ?? 34);
    parent.add(mesh);
    return mesh;
  }

  function tube(parent, a, b, r, m, seg = 8) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m);
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function plane(parent, w, h, m, x, y, z, o = {}) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    mesh.position.set(x, y, z);
    if (o.rx) mesh.rotation.x = o.rx;
    if (o.ry) mesh.rotation.y = o.ry;
    if (o.recv) mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  const blobTex = TX.shadowBlobTexture();
  const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
  function blob(parent, x, z, s, y = 0.06) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(s, s), blobMat);
    b.rotation.x = -Math.PI / 2;
    b.position.set(x, y, z);
    b.renderOrder = 1;
    parent.add(b);
  }

  const glowTex = TX.canvasTexture(128, 128, (ctx2d, w, h) => {
    const g = ctx2d.createRadialGradient(64, 64, 2, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.32)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx2d.fillStyle = g;
    ctx2d.fillRect(0, 0, w, h);
  });
  function glow(x, y, z, sx, sy, color, order = 4) {
    const m = new THREE.MeshBasicMaterial({
      map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const g = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy), m);
    g.rotation.x = -Math.PI / 2;
    g.position.set(x, y, z);
    g.renderOrder = order;
    root.add(g);
    return m;
  }

  function glassMaterial() {
    return new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false,
      uniforms: { uTime: timeU },
      vertexShader: `
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){ vUv = uv; vN = normalize(normalMatrix * normal);
          vec4 mv = modelViewMatrix * vec4(position,1.0); vV = -mv.xyz;
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: GLSL_HASH + `
        uniform float uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
          vec3 col = mix(vec3(0.33,0.48,0.64), vec3(0.66,0.78,0.95), fres);
          float a = 0.0;
          for(int i=0;i<6;i++){
            float fi = float(i);
            float x = 0.06 + hash11(fi*7.1+0.7)*0.88;
            float sp = 0.16 + hash11(fi*3.3)*0.30;
            float y = 1.0 - fract(uTime*sp + hash11(fi*5.9)*4.0);
            float wob = sin(y*22.0 + fi*2.0)*0.006;
            float d = abs(vUv.x - x - wob);
            float trail = smoothstep(0.007,0.0,d) * smoothstep(0.0,0.12,y) * smoothstep(1.0,0.78,y);
            float head = smoothstep(0.013,0.0, length(vec2((vUv.x-x-wob)*2.0,(vUv.y-y)*0.5)));
            a += trail*0.30 + head*0.65;
          }
          col += vec3(0.55,0.68,0.88)*a;
          float alpha = 0.16 + fres*0.5 + clamp(a,0.0,1.0)*0.35;
          gl_FragColor = vec4(col, alpha);
        }`,
    });
  }

  const puddleMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: timeU },
    vertexShader: `
      varying vec2 vUv; varying vec3 vW;
      void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position,1.0); vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: GLSL_HASH + `
      uniform float uTime; varying vec2 vUv; varying vec3 vW;
      void main(){
        float rim = smoothstep(1.0, 0.72, length(vUv*2.0-1.0));
        vec2 P = vW.xz;
        vec3 col = vec3(0.045,0.065,0.11);
        col += rim * vec3(0.04,0.055,0.09);
        float ring = 0.0;
        vec2 cell = floor(P*3.0);
        float h = hash21(cell);
        if(h < 0.4){
          vec2 c = (cell + vec2(0.25+0.5*hash21(cell+1.3), 0.25+0.5*hash21(cell+2.7)))/3.0;
          float ph = fract(uTime*1.7 + h*9.0);
          float d = distance(P, c);
          float r = 0.015 + ph*0.14;
          ring += smoothstep(0.022,0.0,abs(d-r)) * (1.0-ph);
        }
        vec2 cell2 = floor(P*1.2);
        float h2 = hash21(cell2+9.0);
        vec2 c2 = (cell2 + vec2(0.3+0.4*hash21(cell2+3.1), 0.3+0.4*hash21(cell2+5.7)))/1.2;
        float ph2 = fract(uTime*0.5 + h2*7.0);
        float d2 = distance(P, c2);
        ring += smoothstep(0.03,0.0,abs(d2-(0.05+ph2*0.5)))*(1.0-ph2)*0.35;
        col += vec3(0.45,0.6,0.85)*ring*0.6;
        gl_FragColor = vec4(col, 0.5 + 0.45*rim);
      }`,
  });
  const rnd = TX.rng(1234);
  function puddle(x, y, z, r, squash = 1) {
    const mk = (px, py, pz, rr) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(rr, 24), puddleMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(px, py, pz);
      m.renderOrder = 2;
      root.add(m);
    };
    mk(x, y, z, r);
    const pn = 1 + Math.floor(r * 3.5);
    for (let i = 0; i < pn; i++) {
      const rr = r * (0.14 + 0.24 * rnd());
      const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * r * 0.8;
      mk(x + Math.cos(a) * d, y + 0.002, z + Math.sin(a) * d, rr);
    }
  }

  function reflection(x, y, z, w, h, color, k = 1) {
    const geo = new THREE.PlaneGeometry(w, h);
    geo.translate(0, -h / 2, 0);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: timeU, uColor: { value: new THREE.Color(color) }, uK: { value: k } },
      vertexShader: `
        varying vec2 vUv; uniform float uTime;
        void main(){
          vUv = uv;
          vec4 c = modelMatrix * vec4(0.0,0.0,0.0,1.0);
          vec3 toCam = cameraPosition - c.xyz;
          float ang = atan(toCam.x, toCam.z);
          float ca = cos(ang), sa = sin(ang);
          vec3 lp = position;
          vec3 wp = c.xyz + vec3(ca*lp.x, lp.y, sa*lp.x);
          wp.x += sin(lp.y*-24.0 - uTime*3.5)*0.02;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp,1.0);
        }`,
      fragmentShader: GLSL_HASH + `
        uniform vec3 uColor; uniform float uK; uniform float uTime;
        varying vec2 vUv;
        void main(){
          float n = hash21(floor(vUv*vec2(24.0, 110.0)) + floor(uTime*6.0));
          float body = pow(1.0 - vUv.y, 1.5);
          float flick = 0.78 + 0.22*sin(uTime*8.0 + vUv.y*36.0);
          float a = body * mix(1.0, 0.25, step(n, 0.28)) * flick * 0.5 * uK;
          gl_FragColor = vec4(uColor * body * (0.9+0.2*flick), a);
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.renderOrder = 4;
    root.add(m);
    return m;
  }

  const M = {
    base: toon(0x141b2e),
    pad: toon(0x454f66, { map: TX.padTexture() }),
    road: toon(0x39435a, { map: TX.asphaltTexture() }),
    walk: toon(0x4a5570, { map: TX.sidewalkTexture() }),
    curb: toon(0x59647e),
    wallWhite: toon(0xe8e6df),
    wallShade: toon(0xd4d2ca),
    roof: toon(0x8d93a3),
    frame: toon(0x9aa3b5),
    frameDark: toon(0x525c70),
    steel: toon(0xb9c3d4, { emissive: 0x1d2738, emissiveIntensity: 0.5 }),
    dark: toon(0x232a3d),
    darker: toon(0x161c2c),
    paint: toon(0xdde6ef, { emissive: 0x8fa4c0, emissiveIntensity: 0.3 }),
    paintY: toon(0xd9b23a, { emissive: 0x6b5a1e, emissiveIntensity: 0.25 }),
    neighbor: toon(0x30374e),
    neighborRoof: toon(0x454c63),
    pole: toon(0x5a6478),
    matDark: toon(0x3a5a8c),
    matNavy: toon(0x27466f),
    crate: toon(0x8a6f52),
    umbrella: [toon(0xd94b4b), toon(0x2f66d0), toon(0xe8eef7)],
    tire: toon(0x1c2130),
    bikeBlue: toon(0x4a90e2),
    bikeGray: toon(0x8d93a3),
    floorTile: toon(0xf0ead9, { map: TX.tileTexture() }),
    counterWood: toon(0xcaa06a),
    counterTop: toon(0xe8e6df),
    shelf: toon(0xd8dce4),
    coolerBody: toon(0x30374a),
    chest: toon(0xdfe6f2),
    chestBlue: toon(0x3f7fd6),
    lockers: toon(0x6f7d95),
    grill: toon(0x0d1420),
    wire: toon(0x131828),
  };

  return {
    root, grad, refs, updaters, toon, edges, box, tube, plane, blob, glow,
    puddle, reflection, glassMaterial, puddleMat, M, rnd,
  };
}
