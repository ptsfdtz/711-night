import * as THREE from 'three';
import * as TX from './textures.js';
import { timeU } from './common.js';

const PROD_PAL = [0xe8564f, 0xf2a516, 0x43b45a, 0x2f8fdd, 0x9a5fc9, 0xef7fa8, 0xf7d038, 0x8bc78b, 0xdfe6ef, 0x6b4fbd];

function gridCeilTex() {
  return TX.canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#e6eaf1';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c3c9d6';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
  }, { repeat: [4, 4] });
}

function productField(c, parent, defs, seed) {
  if (!defs.length) return null;
  const r = TX.rng(seed >>> 0);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), c.toon(0xffffff), defs.length);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  defs.forEach((d, i) => {
    dummy.position.set(d.x, d.y, d.z);
    dummy.scale.set(d.w, d.h, d.d);
    dummy.rotation.set(0, d.ry || 0, 0);
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
    col.setHex(PROD_PAL[Math.floor(r() * PROD_PAL.length)]);
    im.setColorAt(i, col);
  });
  parent.add(im);
  return im;
}

function makeSteam(c, parent, pots) {
  const N = 46;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), seedA = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const p = pots[i % pots.length];
    pos[i * 3] = p[0] + (c.rnd() - 0.5) * 0.16;
    pos[i * 3 + 1] = p[1];
    pos[i * 3 + 2] = p[2] + (c.rnd() - 0.5) * 0.16;
    seedA[i] = c.rnd();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seedA, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: timeU },
    vertexShader: `
      attribute float aSeed; uniform float uTime; varying float vA;
      void main(){
        float k = fract(uTime*0.11 + aSeed);
        vec3 p = position + vec3(sin(uTime*1.2 + aSeed*40.0)*0.06*k, k*1.15, cos(uTime*0.9 + aSeed*30.0)*0.05*k);
        vA = smoothstep(0.0,0.15,k) * (1.0-smoothstep(0.4,1.0,k));
        vec4 mv = modelViewMatrix * vec4(p,1.0);
        gl_PointSize = (5.0 + k*14.0) * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = max(0.0, 1.0 - d*2.0);
        gl_FragColor = vec4(vec3(0.9,0.92,0.95), a*a*0.16*vA);
      }`,
  });
  const pts = new THREE.Points(geo, m);
  pts.frustumCulled = false;
  parent.add(pts);
}

export function buildStore(c) {
  const { root, box, tube, plane, toon, glow, blob, glassMaterial, M, refs } = c;
  const store = new THREE.Group();
  root.add(store);
  const glassMat = glassMaterial();

  box(store, 8.9, 0.12, 8.9, M.wallShade, 0, 0.09, 0, { edge: 40 });
  const floor = plane(store, 8.5, 8.5, toon(0xffffff, { map: M.floorTile.map }), 0, 0.156, 0, { rx: -Math.PI / 2 });
  floor.receiveShadow = true;

  box(store, 8.9, 5.2, 0.25, M.wallWhite, 0, 2.68, -4.45);
  box(store, 0.25, 5.2, 8.9, M.wallWhite, -4.45, 2.68, 0);
  for (const [cx, cz] of [[4.3, 4.3], [-4.3, 4.3], [4.3, -4.3]]) box(store, 0.3, 5.2, 0.3, M.wallWhite, cx, 2.68, cz);
  box(store, 8.9, 0.7, 0.2, M.wallWhite, 0, 4.85, 4.35);
  box(store, 0.2, 0.7, 8.9, M.wallWhite, 4.35, 4.85, 0);
  box(store, 8.9, 0.6, 0.22, M.wallShade, 0, 4.22, 4.36);
  box(store, 0.22, 0.6, 8.9, M.wallShade, 4.36, 4.22, 0);

  const gp1 = plane(store, 5.0, 3.7, glassMat, -1.7, 2.1, 4.33);
  const gp2 = plane(store, 0.66, 3.7, glassMat, 3.87, 2.1, 4.33);
  const gp3 = plane(store, 8.4, 3.7, glassMat, 4.33, 2.1, -0.1, { ry: Math.PI / 2 });
  gp1.renderOrder = 10; gp2.renderOrder = 10; gp3.renderOrder = 10;
  for (const mx of [-4.15, -2.75, 0.75]) box(store, 0.09, 3.78, 0.1, M.frame, mx, 2.12, 4.36, { edge: false });
  for (const mz of [-4.2, -2.5, -0.8, 0.9, 2.6, 4.2]) box(store, 0.1, 3.78, 0.09, M.frame, 4.36, 2.12, mz, { edge: false });

  box(store, 9.2, 0.32, 9.2, M.roof, 0, 5.44, 0);
  box(store, 8.9, 0.1, 8.9, M.wallShade, 0, 5.65, 0, { edge: 40 });
  box(store, 1.5, 0.5, 1.0, M.frameDark, -2.2, 5.9, -2.2);
  box(store, 0.6, 0.35, 0.6, M.frame, 2.5, 5.82, -1.5);
  tube(store, new THREE.Vector3(3.4, 5.6, 2.6), new THREE.Vector3(3.4, 6.6, 2.6), 0.05, M.frameDark);
  plane(store, 8.5, 8.5, toon(0xdfe3ea, { map: gridCeilTex() }), 0, 4.6, 0, { rx: Math.PI / 2 });
  const panelMat = toon(0xffffff, { emissive: 0xfff3da, emissiveIntensity: 1.15 });
  for (const [px, pz] of [[-2.4, -2.6], [0.4, -2.6], [2.8, -2.6], [-2.4, 0.8], [0.4, 0.8], [2.8, 0.8]]) {
    const pm = (px === 0.4 && pz === 0.8) ? panelMat.clone() : panelMat;
    if (pm !== panelMat) refs.interiorFlicker.push(pm);
    box(store, 1.7, 0.07, 0.34, pm, px, 4.55, pz, { edge: false, cast: false });
  }

  const sTex = TX.signTexture();
  const signMat = toon(0xffffff, { map: sTex, emissive: 0xffffff, emissiveMap: sTex, emissiveIntensity: 0.95 });
  refs.signMats.push(signMat);
  box(store, 8.4, 1.5, 0.3, M.frameDark, 0, 6.5, 4.5, { edge: 40 });
  const sp1 = plane(store, 8.4, 1.5, signMat, 0, 6.5, 4.67);
  sp1.renderOrder = 6;
  const ssTex = TX.signSideTexture();
  const signMat2 = toon(0xffffff, { map: ssTex, emissive: 0xffffff, emissiveMap: ssTex, emissiveIntensity: 0.9 });
  refs.signMats.push(signMat2);
  box(store, 0.28, 2.6, 1.5, M.frameDark, 4.55, 6.85, 2.2, { edge: 40 });
  const sp2 = plane(store, 1.5, 2.6, signMat2, 4.71, 6.85, 2.2, { ry: Math.PI / 2 });
  sp2.renderOrder = 6;
  const openMat = toon(0xd92b2b, { emissive: 0xd92b2b, emissiveIntensity: 0.8 });
  refs.signMats.push(openMat);
  box(store, 0.9, 0.42, 0.08, openMat, -0.15, 3.35, 4.44, { edge: false });

  const awnTex = TX.awningTexture();
  const awnMat = toon(0xffffff, { map: awnTex });
  box(store, 8.8, 0.1, 1.9, awnMat, 0, 3.85, 5.25, { rx: 0.2 });
  box(store, 8.8, 0.42, 0.07, awnMat, 0, 3.5, 6.06, { edge: false });
  box(store, 0.09, 0.5, 0.09, M.frame, -4.32, 3.62, 5.95);
  box(store, 0.09, 0.5, 0.09, M.frame, 4.32, 3.62, 5.95);
  box(store, 1.9, 0.1, 8.4, awnMat, 5.25, 3.85, 0.2, { rz: -0.2 });
  box(store, 0.07, 0.42, 8.4, awnMat, 6.06, 3.5, 0.2, { edge: false });
  const eaveMat = toon(0xffffff, { emissive: 0xffe9c4, emissiveIntensity: 0.9 });
  refs.eaves.push(eaveMat);
  box(store, 5.0, 0.06, 0.12, eaveMat, -1.7, 4.02, 4.44, { edge: false, cast: false });
  box(store, 0.12, 0.06, 7.0, eaveMat, 4.44, 4.02, 0.3, { edge: false, cast: false });

  box(store, 2.8, 0.3, 0.26, M.frameDark, 2.2, 3.92, 4.28, { edge: 40 });
  box(store, 0.16, 3.5, 0.22, M.frameDark, 0.88, 1.92, 4.28);
  box(store, 0.16, 3.5, 0.22, M.frameDark, 3.52, 1.92, 4.28);
  const chimeMat = toon(0xffffff, { emissive: 0x7fe0a0, emissiveIntensity: 0.4 });
  refs.chime = chimeMat;
  box(store, 0.26, 0.1, 0.14, chimeMat, 2.2, 3.7, 4.16, { edge: false });
  const dGlass = glassMaterial();
  function doorPanel(cx) {
    const g = new THREE.Group();
    g.position.set(cx, 0.17, 4.3);
    store.add(g);
    box(g, 1.24, 3.2, 0.07, M.frameDark, 0, 1.6, 0, { edge: 40 });
    box(g, 1.14, 0.34, 0.09, M.frameDark, 0, 0.35, 0, { edge: false });
    const gl = plane(g, 1.08, 2.7, dGlass, 0, 1.78, 0.045);
    gl.renderOrder = 10;
    return g;
  }
  refs.doors.push({ g: doorPanel(1.55), base: 1.55, dir: -1, span: 1.12 });
  refs.doors.push({ g: doorPanel(2.85), base: 2.85, dir: 1, span: 1.12 });
  box(store, 1.5, 0.05, 2.1, M.matDark, 2.2, 0.19, 5.35, { edge: 40, cast: false });
  box(store, 1.32, 0.06, 1.92, M.matNavy, 2.2, 0.2, 5.35, { edge: false, cast: false });

  const st1 = new THREE.MeshBasicMaterial({ map: TX.stickerTexture('ATM', '#1f6fd6'), transparent: true, side: THREE.DoubleSide });
  const st2 = new THREE.MeshBasicMaterial({ map: TX.stickerTexture('24時間', '#d92b2b'), transparent: true, side: THREE.DoubleSide });
  const tk1 = plane(store, 0.9, 0.45, st1, -3.4, 2.8, 4.37);
  const tk2 = plane(store, 0.9, 0.45, st2, -3.4, 2.2, 4.37);
  tk1.renderOrder = 11; tk2.renderOrder = 11;

  const us = new THREE.Group();
  us.position.set(0.28, 0.06, 4.95);
  store.add(us);
  box(us, 0.44, 0.55, 0.44, M.frameDark, 0, 0.32, 0, { edge: 40 });
  [[0.13, 0.05], [-0.1, 0.08], [0.02, -0.12]].forEach((u, i) => {
    const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.05, 7), M.umbrella[i]);
    cb.position.set(u[0], 0.95, u[1]);
    cb.rotation.z = (i - 1) * 0.14;
    cb.castShadow = true;
    us.add(cb);
  });
  blob(us, 0, 0, 1.0, 0.02);

  const IN = new THREE.Group();
  store.add(IN);
  function gondola(cx, cz, len) {
    box(IN, 0.95, 0.28, len, M.shelf, cx, 0.29, cz, { edge: 40 });
    for (const ty of [0.75, 1.2, 1.62]) box(IN, 0.98, 0.05, len, M.shelf, cx, ty, cz, { edge: false });
    box(IN, 1.02, 1.85, 0.06, M.shelf, cx, 0.95, cz - len / 2, { edge: false });
    box(IN, 1.02, 0.26, 0.07, toon(0x2f66d0, { emissive: 0x1a3a75, emissiveIntensity: 0.7 }), cx, 1.98, cz - len / 2, { edge: false });
    const defs = [];
    for (const side of [-1, 1]) {
      for (const ty of [0.55, 1.0, 1.42, 1.78]) {
        for (let d = -len / 2 + 0.2; d < len / 2 - 0.16; d += 0.25) {
          defs.push({ x: cx, y: ty + 0.16, z: cz + d + side * 0.23, w: 0.32, h: 0.3, d: 0.13 + c.rnd() * 0.06 });
        }
      }
    }
    productField(c, IN, defs, (11 + Math.round(cx * 7 + cz)) >>> 0);
  }
  gondola(-1.5, -0.7, 3.6);
  gondola(0.05, -0.7, 3.6);

  {
    const cx0 = -3.85, cx1 = 0.4, len = cx1 - cx0, cx = (cx0 + cx1) / 2;
    box(IN, len, 0.25, 0.9, M.shelf, cx, 0.28, 3.6, { edge: 40 });
    box(IN, len, 0.05, 0.95, M.shelf, cx, 0.78, 3.6, { edge: false });
    box(IN, len, 0.05, 0.95, M.shelf, cx, 1.12, 3.6, { edge: false });
    box(IN, len, 0.5, 0.06, M.shelf, cx, 1.38, 4.02, { edge: false });
    const defs = [];
    for (const ty of [0.42, 0.86]) {
      for (let d = cx0 + 0.15; d < cx1 - 0.1; d += 0.24) {
        defs.push({ x: d, y: ty + 0.12, z: 3.55, w: 0.15, h: 0.26, d: 0.42 });
      }
    }
    productField(c, IN, defs, 33);
  }

  {
    box(IN, 6.0, 2.35, 0.75, M.coolerBody, -1.2, 1.35, -4.0);
    box(IN, 5.7, 1.85, 0.06, toon(0xeef6ff, { emissive: 0xdcecff, emissiveIntensity: 0.55 }), -1.2, 1.3, -3.72, { edge: false, cast: false });
    const defs = [];
    for (let ty = 0; ty < 4; ty++) {
      for (let d = -3.95; d < 1.5; d += 0.2) {
        defs.push({ x: d, y: 0.6 + ty * 0.46, z: -3.66, w: 0.12, h: 0.36, d: 0.12 });
      }
    }
    productField(c, IN, defs, 55);
    const doorM = toon(0x9fc0dd, { transparent: true, opacity: 0.3 });
    for (let i = 0; i < 4; i++) {
      box(IN, 1.4, 1.9, 0.05, doorM, -3.75 + i * 1.5 + 0.7, 1.3, -3.64, { edge: false, cast: false });
      box(IN, 0.05, 0.3, 0.06, M.frameDark, -3.75 + i * 1.5 + 1.32, 1.3, -3.6, { edge: false });
    }
    const band = toon(0xffffff, { emissive: 0xffe1c0, emissiveIntensity: 0.8 });
    refs.interiorFlicker.push(band);
    box(IN, 6.0, 0.28, 0.12, band, -1.2, 2.45, -3.68, { edge: false });
  }
  for (let i = 0; i < 2; i++) {
    box(IN, 0.72, 0.82, 1.7, M.chest, -3.95, 0.56, -2.3 - i * 1.85, { edge: 40 });
    box(IN, 0.76, 0.1, 1.74, M.chestBlue, -3.95, 1.0, -2.3 - i * 1.85, { edge: 40 });
  }

  {
    box(IN, 2.3, 0.85, 0.7, toon(0xd8dce4), 2.5, 0.58, 0.55, { edge: 40 });
    box(IN, 2.3, 0.85, 0.7, M.counterWood, 2.5, 0.58, -0.15, { edge: 40 });
    box(IN, 0.6, 0.85, 1.1, M.counterWood, 3.6, 0.58, -0.6, { edge: 40 });
    box(IN, 2.9, 0.07, 1.55, M.counterTop, 2.65, 1.04, -0.2, { edge: 40 });
    box(IN, 0.5, 0.05, 0.42, M.darker, 1.95, 1.1, 0.3, { edge: false });
    box(IN, 0.46, 0.34, 0.05, toon(0x16324e, { emissive: 0x4fae8f, emissiveIntensity: 0.7 }), 1.95, 1.35, 0.1, { edge: false, rx: -0.25 });
    box(IN, 0.36, 0.3, 0.34, M.darker, 3.2, 1.2, -0.3, { edge: 40 });
    box(IN, 0.3, 0.24, 0.04, toon(0x232a3d, { emissive: 0x6fa8ff, emissiveIntensity: 0.5 }), 3.2, 1.45, -0.14, { edge: false });
    box(IN, 0.9, 0.75, 0.4, M.shelf, 1.15, 0.53, 1.35, { edge: 40 });
    const defs = [];
    for (const ty of [0.42, 0.7]) for (let d = 0.78; d < 1.55; d += 0.18) defs.push({ x: d, y: ty, z: 1.35, w: 0.13, h: 0.18, d: 0.3 });
    productField(c, IN, defs, 77);
    box(IN, 1.0, 1.1, 0.5, M.frameDark, 2.4, 1.62, -3.9, { edge: 40 });
    box(IN, 0.8, 0.3, 0.06, toon(0x1a2233, { emissive: 0xff9a5a, emissiveIntensity: 0.5 }), 2.4, 2.0, -3.62, { edge: false });
    const cupM = toon(0xf2e9d8);
    for (const cx of [2.2, 2.6]) {
      box(IN, 0.08, 0.16, 0.08, M.darker, cx, 1.62, -3.66, { edge: false });
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.12, 8), cupM);
      cup.position.set(cx, 1.44, -3.66);
      IN.add(cup);
    }
    box(IN, 0.6, 0.3, 0.5, toon(0xd8b46a, { emissive: 0x3a2c12, emissiveIntensity: 0.4 }), 3.3, 1.22, -3.9, { edge: 40 });
  }

  {
    box(IN, 1.7, 0.85, 0.8, M.frameDark, -3.0, 0.58, 2.0, { edge: 40 });
    box(IN, 1.75, 0.07, 0.85, M.counterTop, -3.0, 1.03, 2.0, { edge: 40 });
    box(IN, 1.5, 0.3, 0.6, toon(0x2a3348), -3.0, 1.16, 2.0, { edge: false });
    const pots = [];
    for (let i = 0; i < 4; i++) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.18, 10), toon(0x8a5a2e, { emissive: 0x3a1f08, emissiveIntensity: 0.5 }));
      pot.position.set(-3.52 + i * 0.35, 1.26, 2.0);
      IN.add(pot);
      pots.push([pot.position.x, pot.position.y, pot.position.z]);
    }
    box(IN, 1.5, 0.5, 0.04, toon(0xbcd4ea, { transparent: true, opacity: 0.25 }), -3.0, 1.52, 2.32, { edge: false });
    const hotM = toon(0xffffff, { emissive: 0xffb060, emissiveIntensity: 0.9 });
    refs.interiorFlicker.push(hotM);
    box(IN, 1.5, 0.05, 0.05, hotM, -3.0, 1.76, 2.28, { edge: false });
    box(IN, 0.34, 0.18, 0.34, toon(0xe8e6df), -2.32, 1.14, 2.0, { edge: false });
    const sticks = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.4, 7), toon(0xc9a877));
    sticks.position.set(-2.32, 1.42, 2.0);
    sticks.rotation.z = 0.1;
    IN.add(sticks);
    makeSteam(c, IN, pots);
    blob(IN, -3.0, 2.0, 2.2, 0.163);
  }

  box(IN, 1.15, 2.3, 0.1, M.lockers, 2.2, 1.3, -4.17, { edge: 40 });
  box(IN, 0.08, 0.24, 0.06, M.steel, 2.66, 1.2, -4.12, { edge: false });
  for (let i = 0; i < 3; i++) box(IN, 0.42, 1.7, 0.42, M.lockers, 3.1 + i * 0.45, 1.0, -3.95, { edge: 40 });

  {
    box(IN, 0.8, 1.0, 0.35, M.shelf, 0.25, 0.66, 2.55, { edge: 40 });
    box(IN, 0.72, 0.05, 0.5, M.shelf, 0.25, 0.98, 2.44, { edge: false, rx: -0.5 });
    for (let i = 0; i < 4; i++) {
      const pm = new THREE.MeshBasicMaterial({ color: PROD_PAL[i * 2], side: THREE.DoubleSide });
      const mg = plane(IN, 0.16, 0.22, pm, 0.0 + i * 0.16, 1.07, 2.26, { rx: -0.5 });
      mg.renderOrder = 5;
    }
  }
  for (let i = 0; i < 3; i++) {
    const pm = new THREE.MeshBasicMaterial({ map: TX.posterTexture(i + 1) });
    const w = plane(IN, 0.7, 1.0, pm, -2.6 + i * 1.55, 3.5, -4.31);
    w.renderOrder = 5;
  }
  for (let i = 0; i < 2; i++) {
    const pm = new THREE.MeshBasicMaterial({ map: TX.posterTexture(i + 4) });
    const w = plane(IN, 0.7, 1.0, pm, -4.31, 2.7, -0.8 + i * 1.6, { ry: Math.PI / 2 });
    w.renderOrder = 5;
  }
  const banMat = new THREE.MeshBasicMaterial({ map: TX.bannerTexture(), transparent: true, side: THREE.DoubleSide });
  const bn = plane(IN, 0.6, 1.2, banMat, 0.55, 2.65, 3.0, { ry: 0.16 });
  bn.renderOrder = 5;
  box(IN, 0.06, 0.008, 3.4, toon(0x2f66d0, { emissive: 0x1a3a75, emissiveIntensity: 0.5 }), -0.62, 0.163, -0.4, { edge: false, cast: false });
  box(IN, 0.06, 0.008, 3.4, toon(0xd94b4b, { emissive: 0x6e1f1f, emissiveIntensity: 0.5 }), -0.44, 0.163, -0.4, { edge: false, cast: false });

  glow(2.2, 0.072, 5.7, 4.4, 3.2, 0xffc890);
  glow(0, 0.072, 6.3, 4.6, 2.2, 0xbfd4ff);
  return store;
}
