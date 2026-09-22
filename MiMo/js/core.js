import * as THREE from 'three';

export function makeGradientMap(steps = [70, 130, 190, 255]) {
  const data = new Uint8Array(steps.length);
  for (let i = 0; i < steps.length; i++) data[i] = steps[i];
  const tex = new THREE.DataTexture(data, steps.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}

export const gradientMap = makeGradientMap();

export function toon(color, opts = {}) {
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap,
    map: opts.map || null,
    transparent: opts.transparent || false,
    opacity: opts.opacity !== undefined ? opts.opacity : 1,
    emissive: opts.emissive !== undefined ? opts.emissive : 0x000000,
    emissiveIntensity: opts.emissiveIntensity !== undefined ? opts.emissiveIntensity : 1,
    side: opts.side || THREE.FrontSide,
    depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
    alphaTest: opts.alphaTest || 0,
  });
  if (opts.outline === false) {
    m.userData.outlineParameters = { visible: false };
  }
  if (opts.thickness !== undefined) {
    m.userData.outlineParameters = Object.assign({}, m.userData.outlineParameters, {
      thickness: opts.thickness,
      color: opts.outlineColor || [0.045, 0.055, 0.1],
    });
  }
  return m;
}

export function canvasTex(draw, w = 512, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

let defaultParent = null;
export function setDefaultParent(p) {
  defaultParent = p;
}

export function box(w, h, d, mat, x = 0, y = 0, z = 0, parent = null) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  (parent || defaultParent).add(mesh);
  return mesh;
}

export function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, parent = null, seg = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  (parent || defaultParent).add(mesh);
  return mesh;
}

export function plane(w, h, mat, x = 0, y = 0, z = 0, parent = null) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  (parent || defaultParent).add(mesh);
  return mesh;
}

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const BASE_HALF = 12;
export const ROAD_SZ0 = 4.0;
export const ROAD_SZ1 = 10.2;
export const ROAD_EX0 = 5.0;
export const ROAD_EX1 = 11.2;
export const SW_Y = 0.28;
export const ROAD_Y = 0.07;

export const ST = {
  x0: -8,
  x1: 2,
  z0: -7,
  z1: 2,
  floor: 0.34,
  wallTop: 4.15,
  roofTop: 4.8,
  over: 0.28,
};

export function groundH(x, z) {
  const onRoad =
    (z >= ROAD_SZ0 && z <= ROAD_SZ1) ||
    (x >= ROAD_EX0 && x <= ROAD_EX1 && z <= ROAD_SZ1);
  return onRoad ? ROAD_Y : SW_Y;
}

export const M = {
  baseSide: toon(0x1c2436),
  baseTrim: toon(0x3a4560),
  asphalt: toon(0x2b3448),
  asphaltDark: toon(0x232c40),
  sidewalk: toon(0x7a8296),
  curb: toon(0x9aa3b5),
  curbYellow: toon(0xd4a84b),
  stripe: toon(0xe8ecf4),
  wall: toon(0xf0e8d8),
  wallShade: toon(0xd9d0c0),
  trimGreen: toon(0x1f8a78),
  trimGreenDark: toon(0x146556),
  trimOrange: toon(0xff7a3c),
  trimRed: toon(0xe04b4b),
  roof: toon(0x3d465c),
  roofDark: toon(0x2c3448),
  metal: toon(0x8a93a6),
  metalDark: toon(0x4a5368),
  dark: toon(0x1a2030),
  black: toon(0x12161f),
  wood: toon(0x8b6a4a),
  woodDark: toon(0x5f4632),
  glassFrame: toon(0x3a4256),
  white: toon(0xf4f6fa),
  warmGlow: toon(0xfff2d0, { emissive: 0xffd9a0, emissiveIntensity: 0.9 }),
  coolGlow: toon(0xd8f4ff, { emissive: 0x9ad8ff, emissiveIntensity: 0.7 }),
  puddle: toon(0x1a2a44, { transparent: true, opacity: 0.75, outline: false }),
  drain: toon(0x3a4254),
};

export const JP_FONT = `'Yu Gothic','YuGothic','Meiryo','Microsoft YaHei',sans-serif`;

export const productPalette = [
  0xff6b6b, 0xff9f43, 0xffd93d, 0x6bcb77, 0x4d96ff,
  0x48dbfb, 0xff9ff3, 0xf368e0, 0x54a0ff, 0x00d2d3,
  0xffeaa7, 0xdfe6e9, 0xfd79a8, 0xe17055, 0x81ecec,
  0xa29bfe, 0x55efc4, 0xfab1a0,
];

export const glassUniforms = { uTime: { value: 0 } };

export function makeGlassMat(tint = 0xbde0ff, baseAlpha = 0.14) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: glassUniforms.uTime,
      uTint: { value: new THREE.Color(tint) },
      uBaseAlpha: { value: baseAlpha },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uTint;
      uniform float uBaseAlpha;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
      void main(){
        vec2 uv = vUv;
        float col = floor(uv.x * 36.0);
        float n = hash(vec2(col, 7.0));
        float speed = 0.12 + n * 0.35;
        float phase = fract(uv.y * (0.8 + n * 1.6) + uTime * speed + n * 9.0);
        float trail = smoothstep(0.0, 0.08, phase) * smoothstep(0.35, 0.12, phase);
        float wob = 0.6 + 0.4 * hash(vec2(col, 3.0));
        vec2 cell = floor(uv * vec2(42.0, 64.0));
        float bead = step(0.975, hash(cell)) * 0.35;
        vec2 cell2 = floor(uv * vec2(14.0, 20.0));
        float big = step(0.99, hash(cell2 + 11.0)) * 0.4;
        float streak = trail * wob * 0.55;
        float edge = smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
        float a = uBaseAlpha + (streak + bead + big) * 0.42 * (0.6 + 0.4 * edge);
        a += (1.0 - uv.y) * 0.04;
        gl_FragColor = vec4(uTint + vec3(streak * 0.25), a);
      }
    `,
  });
  mat.userData.outlineParameters = { visible: false };
  return mat;
}
