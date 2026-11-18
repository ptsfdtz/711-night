import * as THREE from 'three';
import {
  toon, canvasTex, box, cyl, plane, rand, pick,
  ST, SW_Y, M, JP_FONT, productPalette,
  makeGlassMat, glassUniforms,
} from './core.js';
import {
  storeSignTex, sideSignTex, openSignTex, posterTex1, posterTex2,
  coffeeTex, matTex, floorArrowTex,
} from './textures.js';

export const anim = {
  signs: [],
  doorPanels: [],
  doorState: { timer: 2.2, open: 0 },
  ceilingPanels: [],
  flickerSigns: [],
};

export function buildStore(scene) {
  const storeGroup = new THREE.Group();
  scene.add(storeGroup);

  const glassMat = makeGlassMat(0xb8d8ff, 0.07);
  const doorGlassMat = makeGlassMat(0xc8e4ff, 0.09);

  const W = ST.x1 - ST.x0;
  const D = ST.z1 - ST.z0;
  const cx = (ST.x0 + ST.x1) / 2;
  const cz = (ST.z0 + ST.z1) / 2;

  box(W, 0.08, D, toon(0xe8e4dc), cx, ST.floor - 0.04, cz, storeGroup);
  const floorTex = canvasTex((ctx, w, h) => {
    const n = 10;
    const s = w / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? '#f0ece4' : '#e2ded6';
        ctx.fillRect(i * s, j * s, s, s);
      }
    }
  }, 256, 256);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(2, 2);
  const fp = plane(W - 0.3, D - 0.3, toon(0xffffff, { map: floorTex }), cx, ST.floor + 0.005, cz, storeGroup);
  fp.rotation.x = -Math.PI / 2;
  fp.receiveShadow = true;

  box(W, 0.1, D, toon(0xf4f2ec), cx, ST.wallTop - 0.05, cz, storeGroup);
  box(W + ST.over * 2, 0.18, D + ST.over * 2, M.roof, cx, ST.wallTop + 0.1, cz, storeGroup);
  box(W + 0.2, 0.55, 0.18, M.roofDark, cx, ST.roofTop - 0.1, ST.z1 + 0.1, storeGroup);
  box(W + 0.2, 0.55, 0.18, M.roofDark, cx, ST.roofTop - 0.1, ST.z0 - 0.1, storeGroup);
  box(0.18, 0.55, D + 0.2, M.roofDark, ST.x0 - 0.1, ST.roofTop - 0.1, cz, storeGroup);
  box(0.18, 0.55, D + 0.2, M.roofDark, ST.x1 + 0.1, ST.roofTop - 0.1, cz, storeGroup);

  const wallT = 0.16;
  const winBottom = 0.85;
  const winTop = 3.55;

  box(W, ST.wallTop - ST.floor, wallT, M.wall, cx, (ST.floor + ST.wallTop) / 2, ST.z0, storeGroup);
  box(wallT, ST.wallTop - ST.floor, D, M.wallShade, ST.x0, (ST.floor + ST.wallTop) / 2, cz, storeGroup);

  const eastWinZ0 = -2.2;
  box(wallT, ST.wallTop - ST.floor, eastWinZ0 - ST.z0, M.wall, ST.x1, (ST.floor + ST.wallTop) / 2, (ST.z0 + eastWinZ0) / 2, storeGroup);
  box(wallT, winBottom - ST.floor, ST.z1 - eastWinZ0, M.wall, ST.x1, (ST.floor + winBottom) / 2, (eastWinZ0 + ST.z1) / 2, storeGroup);
  box(wallT, ST.wallTop - winTop, ST.z1 - eastWinZ0, M.wall, ST.x1, (winTop + ST.wallTop) / 2, (eastWinZ0 + ST.z1) / 2, storeGroup);

  const eg = new THREE.Mesh(new THREE.PlaneGeometry(ST.z1 - eastWinZ0 - 0.1, winTop - winBottom), glassMat);
  eg.rotation.y = Math.PI / 2;
  eg.position.set(ST.x1 + 0.02, (winBottom + winTop) / 2, (eastWinZ0 + ST.z1) / 2);
  storeGroup.add(eg);

  for (let i = 1; i < 3; i++) {
    const z = eastWinZ0 + ((ST.z1 - eastWinZ0) / 3) * i;
    box(wallT + 0.06, winTop - winBottom, 0.08, M.glassFrame, ST.x1, (winBottom + winTop) / 2, z, storeGroup);
  }
  box(wallT + 0.06, 0.08, ST.z1 - eastWinZ0, M.glassFrame, ST.x1, winBottom, (eastWinZ0 + ST.z1) / 2, storeGroup);
  box(wallT + 0.06, 0.08, ST.z1 - eastWinZ0, M.glassFrame, ST.x1, winTop, (eastWinZ0 + ST.z1) / 2, storeGroup);

  const fz = ST.z1;
  const doorX0 = -4.5;
  const doorX1 = -2.1;
  const doorTop = 2.55;
  const solidL = 0.95;
  const solidR = 0.95;

  box(W, ST.wallTop - doorTop, wallT, M.wall, cx, (doorTop + ST.wallTop) / 2, fz, storeGroup);
  box(doorX0 - (ST.x0 + solidL), winBottom - ST.floor, wallT, M.wall, ((ST.x0 + solidL) + doorX0) / 2, (ST.floor + winBottom) / 2, fz, storeGroup);
  box((ST.x1 - solidR) - doorX1, winBottom - ST.floor, wallT, M.wall, (doorX1 + (ST.x1 - solidR)) / 2, (ST.floor + winBottom) / 2, fz, storeGroup);
  box(solidL, ST.wallTop - ST.floor, wallT, M.wallShade, ST.x0 + solidL / 2, (ST.floor + ST.wallTop) / 2, fz, storeGroup);
  box(solidR, ST.wallTop - ST.floor, wallT, M.wallShade, ST.x1 - solidR / 2, (ST.floor + ST.wallTop) / 2, fz, storeGroup);

  const frontGlassY = (winBottom + winTop) / 2;
  const g1w = doorX0 - (ST.x0 + solidL);
  const g1 = new THREE.Mesh(new THREE.PlaneGeometry(g1w - 0.1, winTop - winBottom), glassMat);
  g1.position.set(((ST.x0 + solidL) + doorX0) / 2, frontGlassY, fz + 0.02);
  storeGroup.add(g1);
  const g2w = (ST.x1 - solidR) - doorX1;
  const g2 = new THREE.Mesh(new THREE.PlaneGeometry(g2w - 0.1, winTop - winBottom), glassMat);
  g2.position.set((doorX1 + (ST.x1 - solidR)) / 2, frontGlassY, fz + 0.02);
  storeGroup.add(g2);

  box(g1w, 0.09, wallT + 0.08, M.glassFrame, ((ST.x0 + solidL) + doorX0) / 2, winBottom, fz + 0.02, storeGroup);
  box(g1w, 0.09, wallT + 0.08, M.glassFrame, ((ST.x0 + solidL) + doorX0) / 2, winTop, fz + 0.02, storeGroup);
  box(0.09, winTop - winBottom, wallT + 0.08, M.glassFrame, (ST.x0 + solidL + doorX0) / 2, frontGlassY, fz + 0.02, storeGroup);
  box(g2w, 0.09, wallT + 0.08, M.glassFrame, (doorX1 + (ST.x1 - solidR)) / 2, winBottom, fz + 0.02, storeGroup);
  box(g2w, 0.09, wallT + 0.08, M.glassFrame, (doorX1 + (ST.x1 - solidR)) / 2, winTop, fz + 0.02, storeGroup);
  box(0.09, winTop - winBottom, wallT + 0.08, M.glassFrame, (doorX1 + ST.x1 - solidR) / 2, frontGlassY, fz + 0.02, storeGroup);
  box(0.09, winTop - winBottom, wallT + 0.08, M.glassFrame, doorX0, frontGlassY, fz + 0.02, storeGroup);
  box(0.09, winTop - winBottom, wallT + 0.08, M.glassFrame, doorX1, frontGlassY, fz + 0.02, storeGroup);

  box(0.12, doorTop - ST.floor, wallT + 0.1, M.trimGreenDark, doorX0, (ST.floor + doorTop) / 2, fz + 0.03, storeGroup);
  box(0.12, doorTop - ST.floor, wallT + 0.1, M.trimGreenDark, doorX1, (ST.floor + doorTop) / 2, fz + 0.03, storeGroup);
  box(doorX1 - doorX0 + 0.2, 0.14, wallT + 0.1, M.trimGreenDark, (doorX0 + doorX1) / 2, doorTop, fz + 0.03, storeGroup);

  const awnY = 3.62;
  box(W + 0.3, 0.14, 1.1, M.trimGreen, cx, awnY, fz + 0.55, storeGroup);
  box(W + 0.3, 0.32, 0.1, M.trimOrange, cx, awnY - 0.2, fz + 1.05, storeGroup);
  for (const sx of [ST.x0 + 0.6, ST.x1 - 0.6, cx]) {
    box(0.08, 0.7, 0.08, M.metalDark, sx, awnY + 0.4, fz + 1.0, storeGroup);
  }
  box(1.0, 0.14, D * 0.55, M.trimGreen, ST.x1 + 0.5, awnY, (eastWinZ0 + ST.z1) / 2 - 0.2, storeGroup);
  box(0.1, 0.32, D * 0.55, M.trimOrange, ST.x1 + 0.97, awnY - 0.2, (eastWinZ0 + ST.z1) / 2 - 0.2, storeGroup);

  const signH = 0.72;
  const signY = 3.98;
  const signMat = toon(0xffffff, { map: storeSignTex, emissive: 0xffffff, emissiveIntensity: 0.55 });
  signMat.emissiveMap = storeSignTex;
  const sign = box(W - 0.3, signH, 0.18, signMat, cx, signY, fz + 0.22, storeGroup);
  anim.signs.push(signMat);
  anim.flickerSigns.push({ mat: signMat, base: 0.55 });
  box(W - 0.3, 0.05, 0.16, toon(0xd8ffe8, { emissive: 0x7dffb8, emissiveIntensity: 0.5 }), cx, signY + signH / 2 + 0.03, fz + 0.22, storeGroup);
  box(W - 0.3, 0.05, 0.16, toon(0xd8ffe8, { emissive: 0x7dffb8, emissiveIntensity: 0.5 }), cx, signY - signH / 2 - 0.03, fz + 0.22, storeGroup);

  const sMat = toon(0xffffff, { map: sideSignTex, emissive: 0xffffff, emissiveIntensity: 0.7 });
  sMat.emissiveMap = sideSignTex;
  box(0.14, 0.7, 3.2, sMat, ST.x1 + 0.1, signY, (eastWinZ0 + ST.z1) / 2 + 0.5, storeGroup);
  anim.flickerSigns.push({ mat: sMat, base: 0.7 });

  const vMat = toon(0xffffff, { map: openSignTex, emissive: 0x7dffc0, emissiveIntensity: 0.9 });
  vMat.emissiveMap = openSignTex;
  box(0.9, 0.5, 0.08, vMat, ST.x1 - 1.6, 3.0, fz + 1.15, storeGroup);
  anim.flickerSigns.push({ mat: vMat, base: 0.9 });

  const openMat = toon(0xffffff, { map: openSignTex, emissive: 0x5dffa0, emissiveIntensity: 1.2 });
  openMat.emissiveMap = openSignTex;
  const openP = plane(0.7, 0.35, openMat, doorX1 + 0.7, 2.9, fz - 0.15, storeGroup);
  anim.flickerSigns.push({ mat: openMat, base: 1.2 });

  const dm = plane(1.6, 0.7, toon(0xffffff, { map: matTex }), (doorX0 + doorX1) / 2, SW_Y + 0.02, fz + 0.55, storeGroup);
  dm.rotation.x = -Math.PI / 2;
  box(doorX1 - doorX0, 0.08, 0.3, M.metal, (doorX0 + doorX1) / 2, ST.floor, fz + 0.05, storeGroup);

  buildDoor(scene, doorGlassMat);
  buildInterior(scene);
  buildInteriorLights(scene);

  return storeGroup;
}

function buildDoor(scene, doorGlassMat) {
  const doorX0 = -4.5;
  const doorX1 = -2.1;
  const mid = (doorX0 + doorX1) / 2;
  const w = (doorX1 - doorX0) / 2 - 0.02;
  const h = 2.55 - ST.floor - 0.1;
  const rail = 0.08;
  for (let i = 0; i < 2; i++) {
    const g = new THREE.Group();
    const fm = M.trimGreenDark;
    box(rail, h, 0.07, fm, -w / 2 + rail / 2, 0, 0, g).castShadow = false;
    box(rail, h, 0.07, fm, w / 2 - rail / 2, 0, 0, g).castShadow = false;
    box(w, rail, 0.07, fm, 0, h / 2 - rail / 2, 0, g).castShadow = false;
    box(w, rail, 0.07, fm, 0, -h / 2 + rail / 2, 0, g).castShadow = false;
    box(w - rail, 0.07, 0.06, M.trimOrange, 0, -0.15, 0, g).castShadow = false;
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(w - rail * 0.5, h - rail * 0.5), doorGlassMat);
    gl.position.z = 0.01;
    g.add(gl);
    const baseX = mid + (i === 0 ? -w / 2 - 0.03 : w / 2 + 0.03);
    g.position.set(baseX, ST.floor + h / 2, ST.z1 + 0.04);
    scene.add(g);
    anim.doorPanels.push({ g, dir: i === 0 ? -1 : 1, baseX, w });
  }
}

function createShelf(w, h, d, x, z, rotY, levels, interior) {
  const g = new THREE.Group();
  box(w, 0.06, d, toon(0xe8e4da), 0, h - 0.03, 0, g);
  box(w, 0.5, 0.06, toon(0xd0ccc2), 0, 0.25, -d / 2 + 0.03, g);
  for (const sx of [-w / 2 + 0.04, w / 2 - 0.04]) {
    box(0.07, h, d, toon(0xc8c4ba), sx, h / 2, 0, g);
  }
  box(w, 0.1, d, toon(0xd8d4ca), 0, 0.05, 0, g);

  for (let lv = 0; lv < levels; lv++) {
    const y = 0.35 + lv * ((h - 0.55) / Math.max(levels - 1, 1));
    box(w - 0.05, 0.04, d - 0.05, toon(0xf0ece2), 0, y, 0, g);
    const cols = Math.floor(w / 0.28);
    for (let i = 0; i < cols; i++) {
      const px = -w / 2 + 0.18 + i * ((w - 0.3) / Math.max(cols - 1, 1));
      if (Math.random() < 0.12) continue;
      const pw = rand(0.14, 0.22);
      const ph = rand(0.18, 0.3);
      const pd = rand(0.1, 0.16);
      const col = pick(productPalette);
      const bz = rand(-0.05, 0.05);
      box(pw, ph, pd, toon(col), px, y + 0.02 + ph / 2, bz, g);
      if (Math.random() < 0.5) {
        box(pw * 0.7, ph * 0.25, pd + 0.01, toon(0xffffff), px, y + 0.02 + ph * 0.55, bz, g);
      }
    }
    box(w - 0.1, 0.05, 0.02, toon(0xffe66d), 0, y + 0.05, d / 2 - 0.02, g);
  }
  g.position.set(x, ST.floor, z);
  g.rotation.y = rotY;
  interior.add(g);
  return g;
}

function createFridge(w, h, d, x, z, rotY, glowColor, interior) {
  const g = new THREE.Group();
  box(w, h, d, toon(0xe4e8f0), 0, h / 2, 0, g);
  const inner = box(w - 0.12, h - 0.25, d - 0.1, toon(glowColor, {
    emissive: glowColor, emissiveIntensity: 0.55, outline: false,
  }), 0, h / 2, d * 0.1, g);
  inner.castShadow = false;
  for (let row = 0; row < 3; row++) {
    const y = 0.35 + row * ((h - 0.6) / 2);
    box(w - 0.14, 0.03, d - 0.15, toon(0xf8f8f8), 0, y, 0.05, g);
    const n = Math.floor(w / 0.16);
    for (let i = 0; i < n; i++) {
      const bx = -w / 2 + 0.12 + i * ((w - 0.22) / Math.max(n - 1, 1));
      const bh = rand(0.2, 0.32);
      cyl(0.045, 0.05, bh, toon(pick(productPalette)), bx, y + bh / 2, rand(-0.08, 0.08), g, 8);
    }
  }
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, h - 0.15), makeGlassMat(0xd0f0ff, 0.1));
  glass.position.set(0, h / 2, d / 2 + 0.02);
  g.add(glass);
  box(w - 0.08, 0.06, 0.05, M.metal, 0, h / 2, d / 2 + 0.03, g);
  box(0.06, h - 0.15, 0.05, M.metal, -w / 2 + 0.04, h / 2, d / 2 + 0.03, g);
  box(0.06, h - 0.15, 0.05, M.metal, w / 2 - 0.04, h / 2, d / 2 + 0.03, g);
  box(0.04, 0.5, 0.06, M.metalDark, w / 2 - 0.12, h / 2, d / 2 + 0.06, g);
  g.position.set(x, ST.floor, z);
  g.rotation.y = rotY;
  interior.add(g);
  return g;
}

function buildInterior(scene) {
  const interior = new THREE.Group();
  scene.add(interior);

  for (let ix = 0; ix < 3; ix++) {
    for (let iz = 0; iz < 3; iz++) {
      const x = ST.x0 + 1.8 + ix * 3.0;
      const z = ST.z0 + 1.8 + iz * 2.6;
      if (x > ST.x1 - 1 || z > ST.z1 - 1) continue;
      box(1.7, 0.05, 1.0, toon(0xd8d4cc), x, ST.wallTop - 0.1, z, interior);
      const p = box(1.6, 0.06, 0.9, toon(0xfffff0, {
        emissive: 0xfff2d0, emissiveIntensity: 1.4, outline: false,
      }), x, ST.wallTop - 0.14, z, interior);
      p.castShadow = false;
      anim.ceilingPanels.push(p);
    }
  }

  createShelf(5.8, 1.55, 0.7, -3.5, -1.3, 0, 3, interior);
  createShelf(5.8, 1.55, 0.7, -3.5, -3.1, 0, 3, interior);
  createShelf(4.5, 1.4, 0.65, -4.2, -4.9, 0, 2, interior);
  createShelf(1.4, 1.1, 0.6, -5.8, 0.4, 0, 2, interior);

  createFridge(2.4, 1.95, 0.7, -6.5, ST.z0 + 0.5, 0, 0xa8e0ff, interior);
  createFridge(2.4, 1.95, 0.7, -3.9, ST.z0 + 0.5, 0, 0xa8e0ff, interior);
  createFridge(2.4, 1.95, 0.7, -1.3, ST.z0 + 0.5, 0, 0xffe0a8, interior);
  createFridge(2.2, 1.95, 0.7, 0.9, ST.z0 + 0.5, 0, 0xa8e0ff, interior);

  {
    const g = new THREE.Group();
    box(1.8, 0.9, 0.8, toon(0xe0e8f0), 0, 0.45, 0, g);
    box(1.7, 0.08, 0.7, toon(0xc8e8ff, { transparent: true, opacity: 0.45, outline: false }), 0, 0.92, 0, g);
    box(0.5, 0.15, 0.1, M.metalDark, 0, 0.8, 0.4, g);
    g.position.set(ST.x0 + 0.7, ST.floor, -2.0);
    g.rotation.y = Math.PI / 2;
    interior.add(g);
  }

  {
    const g = new THREE.Group();
    const cx = -1.0;
    const cz = 0.55;
    box(3.2, 0.95, 0.75, toon(0x2a9d8f), cx, ST.floor + 0.475, cz, g);
    box(3.3, 0.08, 0.85, toon(0xf0ece4), cx, ST.floor + 0.99, cz, g);
    box(3.2, 0.2, 0.02, toon(0xff7a3c), cx, ST.floor + 0.7, cz + 0.39, g);
    box(0.55, 0.35, 0.45, toon(0xe8e8f0), cx - 0.7, ST.floor + 1.2, cz, g);
    box(0.4, 0.25, 0.05, toon(0x1a3a5a, { emissive: 0x2a6aaa, emissiveIntensity: 0.5 }), cx - 0.7, ST.floor + 1.28, cz + 0.24, g);
    box(0.5, 0.06, 0.35, toon(0xcccce0), cx - 0.7, ST.floor + 1.05, cz + 0.05, g);
    box(0.3, 0.2, 0.3, toon(0xf5f5fa), cx - 1.25, ST.floor + 1.1, cz, g);

    const coffee = new THREE.Group();
    box(0.5, 0.7, 0.4, toon(0x3a2a1a), 0, 0.35, 0, coffee);
    box(0.4, 0.3, 0.05, toon(0xff9a4a, { emissive: 0xff7a2a, emissiveIntensity: 0.6 }), 0, 0.45, 0.21, coffee);
    box(0.35, 0.1, 0.3, toon(0x1a1a1a), 0, 0.15, 0.1, coffee);
    cyl(0.06, 0.06, 0.15, toon(0xffd27a), 0.1, 0.75, 0, coffee, 8);
    plane(0.45, 0.2, toon(0xffffff, { map: coffeeTex, emissive: 0xffcc88, emissiveIntensity: 0.4 }), 0, 0.95, 0.1, coffee);
    coffee.position.set(cx + 1.1, ST.floor + 1.03, cz - 0.05);
    g.add(coffee);

    const disp = new THREE.Group();
    box(1.1, 0.35, 0.55, toon(0xfff8ee), 0, 0.175, 0, disp);
    box(1.15, 0.05, 0.6, toon(0xff7a3c), 0, 0.38, 0, disp);
    for (let i = 0; i < 4; i++) {
      const ox = -0.38 + i * 0.25;
      box(0.18, 0.16, 0.14, toon(0xf8f8f8), ox, 0.48, -0.08, disp);
      box(0.1, 0.1, 0.15, toon(0x1a1a1a), ox, 0.44, -0.08, disp);
    }
    for (let i = 0; i < 3; i++) {
      box(0.28, 0.1, 0.2, toon(pick([0xff6b6b, 0x4d96ff, 0xffd93d])), -0.3 + i * 0.32, 0.46, 0.12, disp);
      box(0.26, 0.03, 0.18, toon(0xffffff), -0.3 + i * 0.32, 0.52, 0.12, disp);
    }
    disp.position.set(cx - 1.7, ST.floor + 1.03, cz + 0.1);
    g.add(disp);

    const oden = new THREE.Group();
    box(1.3, 0.85, 0.7, toon(0xc0392b), 0, 0.425, 0, oden);
    box(1.35, 0.06, 0.75, toon(0x2c3e50), 0, 0.88, 0, oden);
    const oc = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), makeGlassMat(0xffe8c0, 0.12));
    oc.position.set(0, 1.15, 0.35);
    oden.add(oc);
    box(1.25, 0.05, 0.7, toon(0x34495e), 0, 1.4, 0, oden);
    box(0.05, 0.5, 0.7, toon(0x34495e), -0.6, 1.15, 0, oden);
    box(0.05, 0.5, 0.7, toon(0x34495e), 0.6, 1.15, 0, oden);
    for (let i = 0; i < 5; i++) {
      const ox = -0.4 + i * 0.2;
      cyl(0.03, 0.03, 0.5, toon(0xd4a05a), ox, 1.1, 0.05, oden, 6);
      box(0.12, 0.1, 0.12, toon(pick([0xffd27a, 0xf5f0e0, 0xffab7a])), ox, 1.0, 0.1, oden);
    }
    const odenL = new THREE.PointLight(0xffaa55, 0.6, 3, 2);
    odenL.position.set(0, 1.2, 0.2);
    oden.add(odenL);
    oden.position.set(0.9, ST.floor, 1.15);
    oden.rotation.y = 0;
    g.add(oden);

    interior.add(g);
  }

  {
    const g = new THREE.Group();
    box(1.2, 1.3, 0.35, toon(0x8b6a4a), 0, 0.65, 0, g);
    for (let r = 0; r < 4; r++) {
      const y = 0.25 + r * 0.3;
      box(1.1, 0.04, 0.3, toon(0xa8845e), 0, y, 0.05, g);
      for (let i = 0; i < 3; i++) {
        const m = box(0.3, 0.24, 0.03, toon(pick(productPalette)), -0.35 + i * 0.35, y + 0.14, 0.12, g);
        m.rotation.x = -0.35;
        const m2 = box(0.26, 0.06, 0.035, toon(0xffffff), -0.35 + i * 0.35, y + 0.2, 0.13, g);
        m2.rotation.x = -0.35;
      }
    }
    g.position.set(-6.8, ST.floor, 1.1);
    g.rotation.y = 0.25;
    interior.add(g);
  }

  const p1 = plane(0.7, 0.9, toon(0xffffff, { map: posterTex1 }), -7.85, 2.2, -1.0, interior);
  p1.rotation.y = Math.PI / 2;
  const p2 = plane(0.7, 0.9, toon(0xffffff, { map: posterTex2 }), -7.85, 2.2, -3.5, interior);
  p2.rotation.y = Math.PI / 2;
  plane(0.8, 1.0, toon(0xffffff, { map: posterTex2 }), -6.5, 2.5, ST.z0 + 0.1, interior);
  plane(0.8, 1.0, toon(0xffffff, { map: posterTex1 }), 0.5, 2.5, ST.z0 + 0.1, interior);
  const p3 = plane(0.75, 0.95, toon(0xffffff, { map: posterTex1 }), ST.x1 - 0.12, 2.3, -2.6, interior);
  p3.rotation.y = -Math.PI / 2;

  const arrows = [
    { x: -3.3, z: 1.2, ry: 0 },
    { x: -3.3, z: -0.6, ry: 0 },
    { x: -1.0, z: -1.2, ry: -Math.PI / 2 },
    { x: -5.5, z: -1.5, ry: Math.PI / 2 },
  ];
  for (const a of arrows) {
    const m = toon(0xffffff, { map: floorArrowTex, transparent: true, opacity: 0.85, outline: false });
    const p = plane(0.4, 0.7, m, a.x, ST.floor + 0.015, a.z, interior);
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = a.ry;
  }

  box(1.1, 2.1, 0.1, toon(0xc8c4bc), -1.5, ST.floor + 1.05, ST.z0 + 0.1, interior);
  box(0.9, 0.5, 0.05, toon(0x8ab4ff, { emissive: 0x4488cc, emissiveIntensity: 0.3 }), -1.5, ST.floor + 1.7, ST.z0 + 0.16, interior);
  const knob = cyl(0.05, 0.05, 0.1, M.metalDark, -1.1, ST.floor + 1.0, ST.z0 + 0.18, interior, 8);
  knob.rotation.x = Math.PI / 2;
  plane(0.5, 0.2, toon(0xffffff, {
    map: canvasTex((ctx, w, h) => {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 40px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('業務用', w / 2, h / 2);
    }, 256, 96),
  }), -1.5, ST.floor + 2.3, ST.z0 + 0.12, interior);

  const lock = new THREE.Group();
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      box(0.4, 0.45, 0.3, toon(0x7aa8d0), c * 0.42, 0.3 + r * 0.48, 0, lock);
      box(0.35, 0.4, 0.05, toon(0x5a8ab0), c * 0.42, 0.3 + r * 0.48, 0.16, lock);
      box(0.08, 0.04, 0.05, M.metalDark, c * 0.42 + 0.1, 0.3 + r * 0.48, 0.2, lock);
    }
  }
  lock.position.set(ST.x0 + 0.25, ST.floor, -4.5);
  lock.rotation.y = Math.PI / 2;
  interior.add(lock);
}

function buildInteriorLights(scene) {
  const warm1 = new THREE.PointLight(0xffd9a0, 3.2, 14, 2);
  warm1.position.set(-3.5, 3.4, -1.5);
  scene.add(warm1);

  const warm2 = new THREE.PointLight(0xffe0b0, 2.4, 12, 2);
  warm2.position.set(-2.0, 3.4, 1.0);
  scene.add(warm2);

  const warm3 = new THREE.PointLight(0xffd0a0, 1.8, 10, 2);
  warm3.position.set(-6.0, 3.2, -4.0);
  scene.add(warm3);

  const warm4 = new THREE.PointLight(0xffe8c0, 1.5, 9, 2);
  warm4.position.set(0.5, 3.2, -2.0);
  scene.add(warm4);

  const spill = new THREE.SpotLight(0xffe0b0, 12, 12, 0.75, 0.5, 1.5);
  spill.position.set(-3.3, 3.2, 1.5);
  spill.target.position.set(-3.3, 0, 5.5);
  spill.castShadow = true;
  spill.shadow.mapSize.set(512, 512);
  scene.add(spill);
  scene.add(spill.target);

  const spillE = new THREE.SpotLight(0xfff0d0, 8, 10, 0.75, 0.5, 1.5);
  spillE.position.set(2.5, 3.2, 0);
  spillE.target.position.set(5.5, 0, 0);
  scene.add(spillE);
  scene.add(spillE.target);

  const signGlow = new THREE.PointLight(0xc8ffe0, 1.2, 8, 2);
  signGlow.position.set(-3.2, 4.3, 3.2);
  scene.add(signGlow);
}
