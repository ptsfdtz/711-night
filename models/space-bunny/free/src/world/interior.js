import * as THREE from 'three';
import { L } from './layout.js';
import { PAL, toon, toonLit, flat, glow } from '../core/materials.js';
import { box, cyl, plane, group, roundedBox, rand, rng, pick, latheGeo } from '../core/utils.js';
import {
  bentoTexture, posterTexture, magazineTexture, lightboxTexture,
} from '../core/textures.js';
import { markReflect } from '../core/reflection.js';
import { makeSteam } from '../fx/steam.js';

/* ------------------------------------------------------------------ *
 *  Everything behind the glass: gondola aisles, drink coolers, the
 *  bento / onigiri / oden run, checkout, coffee machine, magazines,
 *  light boxes and the back-of-house. Deliberately over-dressed — the
 *  warm interior is the emotional payload of the whole diorama.
 * ------------------------------------------------------------------ */

const SKU = [
  0xe8453c, 0xf59a3c, 0xf5d24a, 0x67c96e, 0x3fc0d8, 0x4a72c8,
  0xdd78b4, 0xf3efe2, 0xc98a5b, 0x9b7ede, 0xe8704f, 0x8fd8b4, 0xf0f4f6,
];

const dummy = new THREE.Object3D();

/**
 * Instanced products along one shelf level.
 * `a0..a1` is the run along the shelf; `c` is the offset on the facing
 * axis; `depth` is how far the goods stick out.
 */
function shelfGoods(parent, opts) {
  const {
    a0, a1, y, c = 0, depth = 0.3, height = 0.3,
    count = 10, kind = 'box', tilt = 0, along = 'x',
  } = opts;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  // plain toon (NOT self-lit): an emissive floor here would wash the
  // per-instance product colours out to pastel
  const mat = toon(0xffffff, {});
  const im = new THREE.InstancedMesh(geo, mat, count);
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const a = a0 + (a1 - a0) * t + rand(-0.015, 0.015);
    let w = rand(0.1, 0.19);
    let h = height * rand(0.72, 1.0);
    let d = depth * rand(0.68, 1.0);
    if (kind === 'bag') { w *= 0.92; h *= 1.18; d *= 0.5; }
    if (kind === 'can') { w *= 0.52; h *= 1.05; d *= 0.52; }
    if (kind === 'cup') { w *= 0.5; h *= 0.9; d *= 0.5; }
    const cross = c + rand(-depth * 0.05, depth * 0.05);
    if (along === 'z') {
      dummy.position.set(cross, y + h / 2, a);
      dummy.scale.set(d, h, w);
    } else {
      dummy.position.set(a, y + h / 2, cross);
      dummy.scale.set(w, h, d);
    }
    dummy.rotation.set(tilt * rand(0.7, 1), rand(-0.06, 0.06), rand(-0.02, 0.02));
    dummy.updateMatrix();
    im.setMatrixAt(i, dummy.matrix);
    im.setColorAt(i, new THREE.Color(pick(SKU)).multiplyScalar(rand(0.85, 1.12)));
  }
  im.instanceMatrix.needsUpdate = true;
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  parent.add(im);
  return im;
}

/** Triangular prism used for onigiri. */
function onigiriGeo() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.1);
  shape.lineTo(0.088, -0.052);
  shape.lineTo(-0.088, -0.052);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.072, bevelEnabled: false });
  geo.translate(0, 0, -0.036);
  geo.computeVertexNormals();
  return geo;
}

export function buildInterior(ctx) {
  const root = new THREE.Group();
  root.name = 'interior';

  const S = L.store;
  const T = 0.22;
  const X0 = S.x0 + T, X1 = S.x1 - T, Z0 = S.z0 + T, Z1 = S.z1 - T;
  const FY = S.floorY;

  // fixtures live in this frame so the raised shop floor is handled once
  const F = new THREE.Group();
  F.position.y = FY;
  root.add(F);

  /* ---------------------------------------------------------------- *
   * Floor finish + guidance graphics (地面導視) + shared fixture
   * materials. Everything inside is self-lit so the shop stays the
   * brightest thing in frame from every viewing angle.
   * ---------------------------------------------------------------- */
  const shelfTrim = toonLit(PAL.shelfTrim, { lit: 0.2 });
  const caseWhite = toonLit(PAL.plasticWhite, { lit: 0.13 });
  const caseDark = toonLit(0x40485a, { lit: 0.28 });

  root.add(plane(X1 - X0, Z1 - Z0, toonLit(0xecebe4, { lit: 0.14 }), {
    x: (X0 + X1) / 2, y: FY + 0.004, z: (Z0 + Z1) / 2, rx: -Math.PI / 2, noOutline: true,
  }));

  const guideYellow = flat(0xf0b429);
  root.add(plane(0.09, 5.4, guideYellow, {
    x: -0.15, y: FY + 0.008, z: -0.1, rx: -Math.PI / 2, noOutline: true,
  }));
  root.add(plane(2.2, 0.09, guideYellow, {
    x: -1.25, y: FY + 0.008, z: 2.1, rx: -Math.PI / 2, noOutline: true,
  }));
  root.add(plane(2.3, 0.14, flat(0xd6402f), {
    x: -0.35, y: FY + 0.009, z: 2.42, rx: -Math.PI / 2, noOutline: true,
  }));

  root.add(box(X1 - X0, 2.5, 0.04, toonLit(PAL.tileWall, { lit: 0.18 }), {
    x: (X0 + X1) / 2, y: FY + 1.25, z: Z0 + 0.02, noOutline: true,
  }));

  const coolGlass = new THREE.MeshBasicMaterial({
    color: 0x9fd8e8, transparent: true, opacity: 0.13, depthWrite: false,
  });

  /* ---------------------------------------------------------------- *
   * 1. Drink coolers (飲料庫) — back wall + east return
   * ---------------------------------------------------------------- */
  function coolerRun(x, z0, z1, face, doors) {
    const g = group({ x, z: (z0 + z1) / 2 });
    const len = Math.abs(z1 - z0);
    const h = 2.25;
    g.add(box(0.78, h, len, caseWhite, {}));
    g.add(box(0.62, h - 0.24, len - 0.14, flat(0xe8dcc0), {
      x: -face * 0.02, y: h / 2, noOutline: true,
    }));
    for (let i = 0; i < 4; i++) {
      const y = 0.44 + i * 0.5;
      shelfGoods(g, {
        a0: -(len - 0.5) / 2, a1: (len - 0.5) / 2, along: 'z',
        y, c: -face * 0.16, depth: 0.46, height: 0.4,
        count: Math.max(6, Math.round(len * 8)), kind: rng() < 0.5 ? 'can' : 'box',
      });
      g.add(box(0.56, 0.03, len - 0.18, shelfTrim, {
        x: -face * 0.16, y: y - 0.02, noOutline: true,
      }));
    }
    for (let d = 0; d < doors; d++) {
      const dw = len / doors;
      const dz = -len / 2 + dw * (d + 0.5);
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.06, h - 0.26), coolGlass);
      pane.position.set(face * 0.4, h / 2, dz);
      pane.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2;
      pane.userData.noOutline = true;
      pane.renderOrder = 3;
      g.add(pane);
      g.add(box(0.05, h - 0.22, 0.06, caseDark, { x: face * 0.4, y: h / 2, z: dz - dw / 2 + 0.03 }));
      g.add(box(0.05, h - 0.22, 0.06, caseDark, { x: face * 0.4, y: h / 2, z: dz + dw / 2 - 0.03 }));
      g.add(box(0.05, 0.07, 0.05, caseDark, { x: face * 0.42, y: h / 2, z: dz + dw / 2 - 0.16 }));
    }
    g.add(box(0.88, 0.14, len + 0.04, caseDark, { y: h + 0.07 }));
    g.add(box(0.72, 0.22, len, glow(0xfff2da, 1.15), { x: -face * 0.06, y: h - 0.03, noOutline: true }));
    g.add(box(0.82, 0.16, len, caseDark, { y: 0.08 }));
    return g;
  }

  F.add(coolerRun(X0 + 0.42, Z0 + 0.5, Z0 + 4.4, 1, 4));
  F.add(coolerRun(X1 - 0.42, Z0 + 0.9, Z0 + 3.3, -1, 3));

  /* ---------------------------------------------------------------- *
   * 2. Gondola aisles (棚) running from the front toward the back
   * ---------------------------------------------------------------- */
  function gondola(x, z0, z1, opts = {}) {
    const g = group({ x, z: (z0 + z1) / 2 });
    const len = Math.abs(z1 - z0);
    const h = 1.75;
    const w = opts.w ?? 0.92;
    g.add(box(w, h, len, toonLit(0xe6e7e3, {}), {}));
    g.add(box(w + 0.05, 0.08, len, shelfTrim, { y: h, noOutline: true }));
    g.add(box(w + 0.07, 0.1, len, shelfTrim, { y: 0.05, noOutline: true }));
    for (let i = 0; i < 4; i++) {
      const y = 0.3 + i * 0.42;
      g.add(box(w + 0.06, 0.03, len, shelfTrim, { y, noOutline: true }));
      for (const s of [-1, 1]) {
        shelfGoods(g, {
          a0: -(len - 0.4) / 2, a1: (len - 0.4) / 2, along: 'z',
          y: y + 0.02, c: (s * w) / 2 + s * 0.19, depth: 0.3, height: 0.32,
          count: Math.max(8, Math.round(len * 7)),
          kind: rng() < 0.45 ? 'bag' : 'box',
        });
      }
    }
    for (const s of [-1, 1]) {
      g.add(box(0.05, 0.3, len - 0.2, flat(0xf7f1e2), { x: (s * w) / 2 + s * 0.025, y: h + 0.17 }));
      for (let i = 0; i < 5; i++) {
        const dz = -len / 2 + 0.6 + i * ((len - 1.2) / 4);
        const p = new THREE.Mesh(
          new THREE.PlaneGeometry(0.34, 0.2),
          new THREE.MeshBasicMaterial({
            map: posterTexture(i + (s > 0 ? 2 : 0) + Math.round(x * 3), 128, 96),
          })
        );
        p.position.set((s * (w + 0.05)) / 2, h + 0.17, dz);
        p.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
        p.userData.noOutline = true;
        g.add(p);
      }
    }
    g.add(box(w + 0.06, h, 0.06, toonLit(0xdcdeda, {}), { z: len / 2 }));
    for (let i = 0; i < 4; i++) {
      shelfGoods(g, {
        a0: -w / 2 + 0.06, a1: w / 2 - 0.06, along: 'x',
        y: 0.3 + i * 0.42, c: len / 2 - 0.24, depth: 0.34, height: 0.3, count: 5, kind: 'bag',
      });
    }
    return g;
  }

  F.add(gondola(-4.55, Z0 + 1.0, 0.2));
  F.add(gondola(-2.25, Z0 + 1.0, 0.2));
  F.add(gondola(0.45, Z0 + 2.6, -0.7, { w: 0.8 }));

  /* ---------------------------------------------------------------- *
   * 3. Front-window deli case (弁当 / 惣菜) — the eye-catcher
   * ---------------------------------------------------------------- */
  const deli = group({ x: -3.75, z: Z1 - 0.6, name: 'deli-case' });
  const dW = 3.5, dH = 1.62;
  deli.add(box(dW, dH, 0.72, caseWhite, {}));
  deli.add(box(dW - 0.1, dH - 0.26, 0.6, flat(0xe6d8ba), { z: -0.02, noOutline: true }));
  const lidGeo = new THREE.BoxGeometry(0.34, 0.1, 0.26);
  const lidMat = new THREE.MeshBasicMaterial({ map: bentoTexture(0, 256, 192) });
  for (let i = 0; i < 3; i++) {
    const y = 0.32 + i * 0.44;
    deli.add(box(dW - 0.16, 0.03, 0.6, shelfTrim, { y, z: 0.02, noOutline: true }));
    deli.add(box(dW - 0.2, 0.03, 0.1, glow(0xfff2dc, 1.25), { y: y + 0.32, z: 0.28, noOutline: true }));
    const im = new THREE.InstancedMesh(lidGeo, lidMat, 9);
    for (let k = 0; k < 9; k++) {
      dummy.position.set(-dW / 2 + 0.3 + k * ((dW - 0.6) / 8), y + 0.075, 0.06);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix);
      im.setColorAt(k, new THREE.Color(pick(SKU)).lerp(new THREE.Color(0xffffff), 0.5));
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    deli.add(im);
  }
  const dpane = new THREE.Mesh(new THREE.PlaneGeometry(dW - 0.12, dH - 0.3), coolGlass);
  dpane.position.set(0, dH / 2, 0.37);
  dpane.userData.noOutline = true;
  dpane.renderOrder = 3;
  deli.add(dpane);
  deli.add(box(dW, 0.1, 0.78, caseDark, { y: dH + 0.05 }));
  deli.add(box(dW + 0.05, 0.12, 0.84, caseDark, { y: 0.06 }));
  for (let i = 0; i < 9; i++) {
    deli.add(box(0.12, 0.07, 0.012, flat(0xffd83d), {
      x: -dW / 2 + 0.3 + i * ((dW - 0.6) / 8), y: 0.28, z: 0.385, noOutline: true,
    }));
  }
  const deliSign = new THREE.Mesh(
    new THREE.PlaneGeometry(dW - 0.3, 0.2),
    new THREE.MeshBasicMaterial({ map: posterTexture(4, 512, 96) })
  );
  deliSign.position.set(0, dH + 0.06, 0.4);
  deliSign.userData.noOutline = true;
  deli.add(deliSign);
  F.add(deli);

  /* ---------------------------------------------------------------- *
   * 4. Chest freezers (冷凍ケース) beside the window
   * ---------------------------------------------------------------- */
  function chestFreezer(x, z, len = 1.7) {
    const g = group({ x, z });
    g.add(box(len, 0.82, 0.78, caseWhite, {}));
    g.add(box(len - 0.08, 0.06, 0.84, caseDark, { y: 0.84 }));
    for (let i = 0; i < 2; i++) {
      const lp = new THREE.Mesh(new THREE.PlaneGeometry(len / 2 - 0.1, 0.66), coolGlass);
      lp.position.set(-len / 4 + i * (len / 2), 0.44, 0.02);
      lp.rotation.x = -Math.PI / 2;
      lp.userData.noOutline = true;
      lp.renderOrder = 3;
      g.add(lp);
    }
    g.add(box(len - 0.16, 0.5, 0.62, flat(0xbfe4ff, { fog: false }), { y: 0.5, noOutline: true }));
    g.add(box(len - 0.22, 0.18, 0.54, glow(0x9fd8ff, 0.85), { y: 0.72, noOutline: true }));
    g.add(box(len + 0.03, 0.1, 0.82, caseDark, { y: 0.06 }));
    return g;
  }
  F.add(chestFreezer(-5.4, 1.15));
  F.add(chestFreezer(-5.4, 2.05));

  /* ---------------------------------------------------------------- *
   * 5. Onigiri / rice-ball island (おにぎり)
   * ---------------------------------------------------------------- */
  const oni = group({ x: -1.5, z: 1.45, name: 'onigiri' });
  oni.add(box(1.5, 0.06, 0.6, caseWhite, { y: 0.98 }));
  oni.add(box(1.5, 0.95, 0.06, caseWhite, { z: -0.29, y: 0.52 }));
  oni.add(box(1.5, 0.12, 0.66, caseDark, { y: 0.06 }));
  [-0.72, 0.72].forEach((bx) => {
    oni.add(box(0.06, 0.92, 0.06, caseDark, { x: bx, y: 0.5, z: 0.28 }));
  });
  const oIm = new THREE.InstancedMesh(onigiriGeo(), toonLit(0xfdfaf2, {}), 18);
  const nIm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.15, 0.022, 0.078), toonLit(0x2c3138, {}), 18);
  for (let i = 0; i < 18; i++) {
    const x = -0.6 + (i % 6) * 0.24;
    dummy.rotation.set(0, rand(-0.3, 0.3), 0);
    dummy.scale.setScalar(1);
    dummy.position.set(x, 1.02, rand(-0.08, 0.06));
    dummy.updateMatrix();
    oIm.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 1.05, dummy.position.z);
    dummy.updateMatrix();
    nIm.setMatrixAt(i, dummy.matrix);
  }
  oIm.instanceMatrix.needsUpdate = true;
  nIm.instanceMatrix.needsUpdate = true;
  oni.add(oIm);
  oni.add(nIm);
  oni.add(box(1.4, 0.04, 0.12, glow(0xffedc6, 1.3), { y: 1.62, z: -0.16, noOutline: true }));
  F.add(oni);

  /* ---------------------------------------------------------------- *
   * 6. Oden / hot counter (関東煮) with steam
   * ---------------------------------------------------------------- */
  const oden = group({ x: X1 - 0.55, z: -1.55, ry: -Math.PI / 2, name: 'oden' });
  oden.add(box(1.9, 0.92, 0.62, caseWhite, {}));
  oden.add(box(1.86, 0.08, 0.58, toonLit(0xdfe3e6, {}), { y: 0.92, noOutline: true }));
  oden.add(box(1.78, 0.18, 0.5, flat(0x6f5a3c), { y: 0.98, noOutline: true }));
  for (let i = 0; i < 5; i++) {
    oden.add(box(0.03, 0.2, 0.46, toonLit(0x8f959d, {}), {
      x: -0.72 + i * 0.36, y: 1.0, noOutline: true,
    }));
  }
  for (let i = 0; i < 26; i++) {
    const px = -0.78 + (i % 5) * 0.36 + rand(-0.04, 0.04);
    const pz = rand(-0.1, 0.12);
    const h = rand(0.16, 0.26);
    oden.add(cyl(0.012, 0.012, h, 4, toonLit(0xd8cfae, {}), {
      x: px, y: 1.02 + h / 2, z: pz, rz: rand(-0.1, 0.1), noOutline: true,
    }));
    oden.add(roundedBox(0.09, 0.11, 0.08, toonLit(pick(SKU), {}), {
      x: px, y: 1.02 + h - 0.05, z: pz, r: 0.02,
    }));
  }
  const oPane = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 0.72), coolGlass);
  oPane.position.set(0, 1.34, 0.3);
  oPane.userData.noOutline = true;
  oPane.renderOrder = 3;
  oden.add(oPane);
  oden.add(box(1.9, 0.06, 0.07, caseDark, { y: 1.72, z: 0.3 }));
  const odenSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.7, 0.3),
    new THREE.MeshBasicMaterial({ map: posterTexture(1, 512, 128) })
  );
  odenSign.position.set(0, 1.9, 0.14);
  odenSign.userData.noOutline = true;
  oden.add(odenSign);
  for (let i = 0; i < 6; i++) {
    oden.add(box(0.24, 0.32, 0.02, flat(0xfff4dd), {
      x: -0.75 + i * 0.3, y: 2.2, z: 0.05, noOutline: true,
    }));
  }
  F.add(oden);

  ctx.steam = makeSteam(oden, { count: 16, spread: [1.6, 0.5], y: 1.12, rise: 0.95 });

  /* ---------------------------------------------------------------- *
   * 7. Checkout counter (レジ)
   * ---------------------------------------------------------------- */
  const till = group({ x: 1.55, z: 1.85, name: 'checkout' });
  const counterMat = toonLit(0xf0efe8, {});
  till.add(box(2.4, 0.95, 0.72, counterMat, { y: 0.475 }));
  till.add(box(2.5, 0.07, 0.82, toonLit(0x6f5f4e, {}), { y: 0.98 }));
  till.add(box(0.95, 0.1, 0.66, toonLit(0xd9d5c8, {}), { x: -1.22, y: 0.72 }));
  till.add(box(0.07, 0.72, 0.64, toonLit(0xdcd8cc, {}), { x: -1.68, y: 0.36 }));

  const reg = group({ x: 0.6, y: 1.02, z: 0.02 });
  reg.add(box(0.5, 0.3, 0.42, toonLit(0x2f3644, {}), { y: 0.15 }));
  reg.add(box(0.54, 0.06, 0.46, toonLit(0x424a5a, {}), { y: 0.33 }));
  reg.add(box(0.5, 0.3, 0.05, toonLit(0x2f3644, {}), { y: 0.58, z: -0.16, rx: -0.25 }));
  const posScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.28), new THREE.MeshBasicMaterial({ color: 0x74d9ff })
  );
  posScreen.position.set(0, 0.58, -0.135);
  posScreen.rotation.x = -0.25;
  posScreen.userData.noOutline = true;
  reg.add(posScreen);
  reg.add(box(0.06, 0.44, 0.06, toonLit(0x3a4150, {}), { x: 0.36, y: 0.52, z: 0.12 }));
  reg.add(box(0.3, 0.19, 0.035, toonLit(0x2f3644, {}), { x: 0.36, y: 0.76, z: 0.12, rx: 0.2 }));
  reg.add(box(0.24, 0.12, 0.012, glow(0xffd27a, 1.3), { x: 0.36, y: 0.76, z: 0.135, rx: 0.2, noOutline: true }));
  reg.add(roundedBox(0.16, 0.06, 0.22, toonLit(0x2b323e, {}), { x: -0.26, y: 0.04, z: 0.3, r: 0.02 }));
  reg.add(roundedBox(0.16, 0.05, 0.2, toonLit(0x39424f, {}), { x: -0.26, y: 0.1, z: 0.3, r: 0.02 }));
  till.add(reg);
  for (let i = 0; i < 4; i++) {
    till.add(roundedBox(0.52, 0.11, 0.36, toonLit(0x4a6fa8, {}), {
      x: -1.1, y: 0.79 + i * 0.1, z: 0.05, ry: rand(-0.05, 0.05), r: 0.04,
    }));
  }
  const cup = new THREE.Mesh(latheGeo([[0.055, 0], [0.07, 0.02], [0.086, 0.2], [0.09, 0.22]], 12),
    toonLit(0xf3efe6, {}));
  cup.position.set(-0.34, 1.02, 0.16);
  till.add(cup);
  till.add(cyl(0.089, 0.086, 0.02, 12, toonLit(0xb5713a, {}), {
    x: -0.34, y: 1.22, z: 0.16, noOutline: true,
  }));
  till.add(box(0.5, 0.52, 0.3, toonLit(0xe8e4da, {}), { x: -0.95, y: 1.29, z: -0.22 }));
  shelfGoods(till, {
    a0: -1.18, a1: -0.72, y: 1.05, c: -0.22, depth: 0.24, height: 0.2, count: 4, kind: 'box',
  });
  F.add(till);

  /* ---------------------------------------------------------------- *
   * 8. Coffee machine station (コーヒー)
   * ---------------------------------------------------------------- */
  const coffee = group({ x: X1 - 0.42, z: 0.95, ry: -Math.PI / 2, name: 'coffee' });
  coffee.add(box(0.7, 1.0, 1.25, toonLit(0x40485a, {}), { y: 0.5 }));
  coffee.add(box(0.76, 0.06, 1.31, toonLit(0x2b3240, {}), { y: 1.03 }));
  coffee.add(roundedBox(0.5, 0.62, 0.62, toonLit(0x8d939c, {}), { x: -0.06, y: 1.37, z: -0.2, r: 0.05 }));
  coffee.add(box(0.34, 0.2, 0.04, glow(0xffcf7a, 1.4), { x: -0.06, y: 1.52, z: 0.12, noOutline: true }));
  coffee.add(box(0.16, 0.05, 0.06, glow(0xff6b5a, 1.2), { x: -0.06, y: 1.24, z: 0.12, noOutline: true }));
  coffee.add(box(0.12, 0.1, 0.24, toonLit(0x2b3240, {}), { x: -0.06, y: 1.14, z: 0.04, noOutline: true }));
  coffee.add(box(0.62, 0.04, 1.2, toonLit(0xdcd9d2, {}), { x: -0.06, y: 1.06, z: 0.1, noOutline: true }));
  const cupStack = new THREE.Mesh(
    latheGeo([[0.05, 0], [0.075, 0.22], [0.082, 0.24]], 12), toonLit(0xf5f2ea, {})
  );
  cupStack.position.set(-0.06, 1.08, 0.5);
  coffee.add(cupStack);
  shelfGoods(coffee, {
    a0: -0.3, a1: 0.3, y: 1.09, c: -0.42, depth: 0.16, height: 0.16, count: 5, kind: 'box',
  });
  F.add(coffee);

  /* ---------------------------------------------------------------- *
   * 9. Magazine rack (雑誌棚) beside the register
   * ---------------------------------------------------------------- */
  const mag = group({ x: -1.0, z: Z1 - 0.48, name: 'magazines' });
  mag.add(box(1.14, 0.34, 0.06, flat(0xf3ede0), { y: 1.16, z: -0.12 }));
  for (let r = 0; r < 2; r++) {
    const y = 0.56 + r * 0.3;
    mag.add(box(1.06, 0.02, 0.4, shelfTrim, { y, noOutline: true }));
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.17, 0.24),
        new THREE.MeshBasicMaterial({ map: magazineTexture(i + r * 6) })
      );
      m.position.set(-0.45 + i * 0.18, y + 0.14, 0.07);
      m.rotation.x = -0.22;
      m.userData.noOutline = true;
      mag.add(m);
    }
  }
  mag.add(box(1.1, 0.06, 0.42, caseWhite, { y: 0.5 }));
  mag.add(box(0.06, 0.5, 0.42, caseWhite, { x: -0.52, y: 0.25 }));
  mag.add(box(0.06, 0.5, 0.42, caseWhite, { x: 0.52, y: 0.25 }));
  mag.add(box(1.1, 0.5, 0.05, toonLit(0xdcd8d0, {}), { z: -0.2, y: 0.25 }));
  F.add(mag);

  /* ---------------------------------------------------------------- *
   * 10. Back-of-house: lockers, stock crates, staff door
   * ---------------------------------------------------------------- */
  const back = group({ x: X0 + 0.36, z: -2.6, ry: Math.PI / 2, name: 'back-of-house' });
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      back.add(box(0.9, 0.42, 0.7, toonLit(0x9aa2ad, {}), {
        x: (i - 1) * 0.72, y: 0.21 + j * 0.44, z: 0,
      }));
      back.add(box(0.16, 0.03, 0.03, toonLit(0x5f6672, {}), {
        x: (i - 1) * 0.72, y: 0.21 + j * 0.44, z: 0.36, noOutline: true,
      }));
    }
  }
  for (let i = 0; i < 3; i++) {
    back.add(roundedBox(0.6, 0.4, 0.44, toonLit(0x7d8f6e, {}), {
      x: 1.5, y: 0.2 + (i % 2) * 0.4, z: -0.5 + i * 0.12, ry: rand(-0.2, 0.2), r: 0.04,
    }));
  }
  F.add(back);

  F.add(box(1.0, 2.1, 0.08, toonLit(0x8f959d, {}), { x: X0 + 0.03, y: 1.05, z: Z0 + 1.4 }));
  F.add(box(0.07, 0.16, 0.06, toonLit(0xd8dde2, {}), { x: X0 + 0.1, y: 1.0, z: Z0 + 1.78 }));
  F.add(box(0.07, 0.16, 0.06, toonLit(0xd8dde2, {}), { x: X0 + 0.1, y: 1.0, z: Z0 + 1.02 }));

  /* ---------------------------------------------------------------- *
   * 11. Ceiling light boxes (灯箱)
   * ---------------------------------------------------------------- */
  const lbTex = lightboxTexture(256, 128);
  const lampPanels = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const px = X0 + 1.6 + i * ((X1 - X0 - 3.2) / 2);
      const pz = Z0 + 2.2 + j * 4.7;
      const p = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.62),
        new THREE.MeshBasicMaterial({ map: lbTex, color: new THREE.Color(0xffffff).multiplyScalar(1.3) })
      );
      p.rotation.x = Math.PI / 2;
      p.position.set(px, S.wallH - 0.03, pz);
      p.userData.noOutline = true;
      p.userData.flicker = { kind: 'tube', phase: i * 1.3 + j };
      root.add(p);
      lampPanels.push(p);
      root.add(box(1.62, 0.1, 0.74, toonLit(0xdcdad2, {}), {
        x: px, y: S.wallH + 0.02, z: pz, noOutline: true,
      }));
    }
  }

  /* ---------------------------------------------------------------- *
   * 12. Wall posters (宣伝ポスター)
   * ---------------------------------------------------------------- */
  const posterSpots = [
    [X0 + 0.07, FY + 2.0, Z0 + 5.5, Math.PI / 2],
    [X0 + 0.07, FY + 2.0, Z0 + 6.7, Math.PI / 2],
    [-0.45, FY + 2.35, Z0 + 0.07, 0],
    [1.9, FY + 2.35, Z0 + 0.07, 0],
  ];
  posterSpots.forEach(([px, py, pz, ry], i) => {
    root.add(box(1.1, 1.45, 0.05, toonLit(0xdcd8d0, {}), {
      x: px - Math.sin(ry) * 0.025, y: py, z: pz - Math.cos(ry) * 0.025, ry, noOutline: true,
    }));
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 1.35),
      new THREE.MeshBasicMaterial({ map: posterTexture(i + 1) })
    );
    p.position.set(px, py, pz);
    p.rotation.y = ry;
    p.userData.noOutline = true;
    root.add(p);
  });

  /* ---------------------------------------------------------------- *
   * Interior lighting: warm, generous, but range-limited so the street
   * outside stays cold and wet.
   * ---------------------------------------------------------------- */
  const lights = [];
  const addLight = (x, y, z, color, intensity, dist, decay = 1.35) => {
    const l = new THREE.PointLight(color, intensity, dist, decay);
    l.position.set(x, y, z);
    root.add(l);
    lights.push(l);
    return l;
  };
  addLight((X0 + X1) / 2, FY + 3.3, Z0 + 2.4, 0xffeecb, 17, 12);
  addLight((X0 + X1) / 2, FY + 3.3, Z0 + 6.4, 0xffeecb, 13, 11);
  addLight(X1 - 1.1, FY + 2.9, Z1 - 1.6, 0xffe0b4, 9, 10);
  addLight(X0 + 1.4, FY + 2.4, Z1 - 1.3, 0xffdcaa, 7, 9);
  addLight(1.2, FY + 2.0, 1.6, 0xffeed2, 5.5, 8);
  // doorway pool: makes the entrance glow from just inside
  addLight(-0.35, FY + 1.7, Z1 - 0.5, 0xffe8bc, 3, 5, 1.6);

  ctx.interior = { root, lights, lampPanels };
  markReflect(root);
  return root;
}