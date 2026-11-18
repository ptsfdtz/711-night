import * as THREE from 'three';
import { L } from './layout.js';
import { PAL, toon, glow, glassMaterial } from '../core/materials.js';
import { box, cyl, group } from '../core/utils.js';
import { storeSignTexture, lampBoxTexture, posterTexture, awningTexture } from '../core/textures.js';
import { markReflect } from '../core/reflection.js';
import { makeDoor, makeEntryMat } from '../fx/door.js';
import { makeGlassRain } from '../fx/glassrain.js';

const { store: S } = L;

export function buildStore(ctx) {
  const root = new THREE.Group();
  root.name = 'store';

  const x0 = S.x0, x1 = S.x1, z0 = S.z0, z1 = S.z1;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const W = x1 - x0, D = z1 - z0;
  const T = 0.22; // wall thickness

  const glassTop = 2.9;   // top of the shopfront glazing
  const sillY = 0.34;     // bottom of the shopfront glazing
  const fasciaTop = 4.2;  // top of the illuminated sign band
  const ceilY = 4.4;

  /* ============================== materials ======================= */
  const wallMat = toon(PAL.wallStore, {});
  const trimMat = toon(PAL.wallStoreTrim, {});
  const frameMat = toon(PAL.glassFrame, {});
  const glass = glassMaterial({ opacity: 0.06, color: 0x8ec8e4 });

  const signTex = storeSignTexture(768, 192);
  signTex.repeat.set(2.0, 1);
  const signTexSide = storeSignTexture(768, 192);
  signTexSide.repeat.set(2, 1);

  /* ============================== shell =========================== */
  // floor slab + interior ceiling
  const floor = box(W, S.floorY, D, toon(0xf0eee6, {}), {
    x: cx, y: S.floorY / 2, z: cz, receive: true,
  });
  root.add(floor);
  const ceiling = box(W, 0.3, D, toon(0xc2bfb6, {}), { x: cx, y: ceilY + 0.15, z: cz });
  root.add(ceiling);

  // back (north) wall + west wall — plain, holds the interior up
  root.add(box(W, S.wallH, T, wallMat, { x: cx, y: S.wallH / 2, z: z0 + T / 2 }));
  root.add(box(T, S.wallH, D, wallMat, { x: x0 + T / 2, y: S.wallH / 2, z: cz }));

  // east wall: solid back-of-house segment + shopfront glazing
  const eastSolidZ = -4.4;
  root.add(box(T, S.wallH, eastSolidZ - z0, wallMat, {
    x: x1 - T / 2, y: S.wallH / 2, z: (z0 + eastSolidZ) / 2,
  }));
  root.add(box(T, glassTop - sillY, 0.24, trimMat, {
    x: x1 - T / 2, y: (glassTop + sillY) / 2, z: (z0 + eastSolidZ) / 2 + 0.1,
  }));

  // back-of-house door + vent on the east solid wall
  root.add(box(0.05, 1.9, 0.9, toon(0x4d5c6e, {}), { x: x1 - T + 0.01, y: 1.25, z: z0 + 1.3 }));
  root.add(box(0.06, 0.12, 0.5, toon(0x39424f, {}), { x: x1 - T + 0.02, y: 2.4, z: z0 + 1.3 }));

  /* ------------------------- shopfront glazing ------------------- */
  const glassPanes = [];
  const addPane = (w, h, x, y, z, ry) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass);
    p.position.set(x, y, z);
    if (ry) p.rotation.y = ry;
    p.userData.noOutline = true;
    p.renderOrder = 4;
    root.add(p);
    glassPanes.push(p);
    return p;
  };

  // front: window A | door bay | window B
  const winA = { x0: x0 + 0.05, x1: -1.75 };
  const doorBay = { x0: -1.75, x1: 1.05 };
  const winB = { x0: 1.05, x1: x1 - 0.05 };
  addPane(winA.x1 - winA.x0, glassTop - sillY, (winA.x0 + winA.x1) / 2, (glassTop + sillY) / 2, z1 - T / 2 + 0.01);
  addPane(winB.x1 - winB.x0, glassTop - sillY, (winB.x0 + winB.x1) / 2, (glassTop + sillY) / 2, z1 - T / 2 + 0.01);
  // east glazing
  addPane(2.9 - eastSolidZ - 0.1, glassTop - sillY, x1 - T / 2 + 0.01, (glassTop + sillY) / 2,
    (eastSolidZ + 2.9) / 2, Math.PI / 2);

  // mullions + frames
  const mullion = (x, z, ry) => box(0.12, glassTop - sillY + 0.1, 0.16, frameMat, {
    x, y: (glassTop + sillY) / 2, z, ry,
  });
  root.add(mullion(winA.x0 + 0.03, z1 - T / 2, 0));
  root.add(mullion((winA.x0 + winA.x1) / 2, z1 - T / 2, 0));
  root.add(mullion(doorBay.x0, z1 - T / 2, 0));
  root.add(mullion(doorBay.x1, z1 - T / 2, 0));
  root.add(mullion(winB.x1 - 0.03, z1 - T / 2, 0));
  // sill rail + head rail
  root.add(box(W, 0.1, 0.24, frameMat, { x: cx, y: sillY - 0.04, z: z1 - T / 2 }));
  root.add(box(W, 0.14, 0.26, frameMat, { x: cx, y: glassTop + 0.05, z: z1 - T / 2 }));
  root.add(box(0.26, 0.1, 2.9 - eastSolidZ, frameMat, {
    x: x1 - T / 2, y: sillY - 0.04, z: (eastSolidZ + 2.9) / 2,
  }));
  root.add(box(0.26, 0.14, 2.9 - eastSolidZ, frameMat, {
    x: x1 - T / 2, y: glassTop + 0.05, z: (eastSolidZ + 2.9) / 2,
  }));
  // kick panel below the glazing
  root.add(box(W, sillY, 0.26, trimMat, { x: cx, y: sillY / 2, z: z1 - T / 2 }));
  root.add(box(0.26, sillY, 2.9 - eastSolidZ, trimMat, {
    x: x1 - T / 2, y: sillY / 2, z: (eastSolidZ + 2.9) / 2,
  }));

  // corner column
  root.add(box(0.42, S.wallH + S.parapet, 0.42, toon(0x8d877a, {}), { x: x1 - 0.21, y: (S.wallH + S.parapet) / 2, z: z1 - 0.21 }));

  /* -------------------- fascia + illuminated sign ---------------- */
  // front fascia band
  root.add(box(W, fasciaTop - glassTop, 0.3, wallMat, { x: cx, y: (glassTop + fasciaTop) / 2, z: z1 - 0.15 }));
  const signFront = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.5, fasciaTop - glassTop - 0.12),
    new THREE.MeshBasicMaterial({ map: signTex, color: 0xd2d2d2 })
  );
  signFront.position.set(cx, (glassTop + fasciaTop) / 2, z1 + 0.005);
  signFront.userData.noOutline = true;
  signFront.userData.flicker = { kind: 'buzz' };
  root.add(signFront);
  markReflect(signFront);

  // east fascia band + sign
  root.add(box(0.3, fasciaTop - glassTop, D, wallMat, { x: x1 - 0.15, y: (glassTop + fasciaTop) / 2, z: cz }));
  const signSide = new THREE.Mesh(
    new THREE.PlaneGeometry(D - 0.6, fasciaTop - glassTop - 0.12),
    new THREE.MeshBasicMaterial({ map: signTexSide, color: 0xd2d2d2 })
  );
  signSide.position.set(x1 + 0.005, (glassTop + fasciaTop) / 2, cz);
  signSide.rotation.y = Math.PI / 2;
  signSide.userData.noOutline = true;
  signSide.userData.flicker = { kind: 'buzz' };
  root.add(signSide);
  markReflect(signSide);

  /* ------------------------- parapet + roof ---------------------- */
  // upper wall + parapet
  root.add(box(W, 0.36, 0.3, toon(0xd6d0c2, {}), { x: cx, y: 4.38, z: z1 - 0.15 }));
  root.add(box(0.3, 0.36, D, toon(0xd6d0c2, {}), { x: x1 - 0.15, y: 4.38, z: cz }));
  // shadow gap so the two sign bands read as separate layers
  root.add(box(W + 0.06, 0.07, 0.34, toon(0x2f3444, {}), { x: cx, y: 4.2, z: z1 - 0.15 }));
  root.add(box(0.34, 0.07, D + 0.06, toon(0x2f3444, {}), { x: x1 - 0.15, y: 4.2, z: cz }));
  // small vents along the upper wall
  for (let i = 0; i < 6; i++) {
    root.add(box(0.5, 0.14, 0.06, toon(0x6d727c, {}), {
      x: x0 + 0.9 + i * 1.5, y: 4.38, z: z1 + 0.01, noOutline: true,
    }));
  }

  const parapetH = S.parapet;
  root.add(box(W + 0.16, parapetH, D + 0.16, toon(0xdcd8cf, {}), {
    x: cx, y: S.wallH + parapetH / 2, z: cz,
  }));
  root.add(box(W + 0.3, 0.1, D + 0.3, toon(0x3f4756, {}), {
    x: cx, y: S.wallH + parapetH + 0.05, z: cz,
  }));
  // roof deck (slightly recessed)
  root.add(box(W - 0.3, 0.08, D - 0.3, toon(0x4a515e, {}), {
    x: cx, y: S.wallH + 0.04, z: cz,
  }));

  /* ------------------------- roof-mounted sign ------------------- */
  const roofSign = group({ name: 'roof-sign' });
  const rsW = W - 1.4, rsH = 1.3, rsD = 0.4;
  roofSign.position.set(cx, S.wallH + parapetH + rsH / 2, z1 - 0.35);
  roofSign.add(box(rsW, rsH, rsD, toon(0x2b3140, {}), { r: 0 }));
  const rsTex = storeSignTexture(768, 192);
  rsTex.repeat.set(2, 1);
  const rsFace = new THREE.Mesh(
    new THREE.PlaneGeometry(rsW - 0.16, rsH - 0.14),
    new THREE.MeshBasicMaterial({ map: rsTex })
  );
  rsFace.position.set(0, 0, rsD / 2 + 0.005);
  rsFace.userData.noOutline = true;
  rsFace.userData.flicker = { kind: 'buzz', phase: 1.7 };
  roofSign.add(rsFace);
  const rsFaceBack = rsFace.clone();
  rsFaceBack.position.z = -rsD / 2 - 0.005;
  rsFaceBack.rotation.y = Math.PI;
  roofSign.add(rsFaceBack);
  // support legs
  [-1, 1].forEach((s) => {
    roofSign.add(box(0.1, 0.34, 0.1, toon(0x39404e, {}), { x: (s * rsW) / 2.6, y: -rsH / 2 - 0.16 }));
  });
  root.add(roofSign);
  markReflect(roofSign);

  /* --------------------- corner blade sign (袖看板) -------------- */
  const blade = group({ name: 'blade-sign' });
  blade.position.set(x1 + 0.42, 3.55, 1.1);
  blade.add(box(0.9, 1.7, 0.16, toon(0x2a3040, {}), {}));
  const bladeTex = lampBoxTexture(256, 512);
  const bladeFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 1.58),
    new THREE.MeshBasicMaterial({ map: bladeTex })
  );
  bladeFace.position.set(0, 0, 0.086);
  bladeFace.userData.noOutline = true;
  bladeFace.userData.flicker = { kind: 'tube', phase: 0.6 };
  blade.add(bladeFace);
  const bladeFaceB = bladeFace.clone();
  bladeFaceB.position.z = -0.086;
  bladeFaceB.rotation.y = Math.PI;
  blade.add(bladeFaceB);
  // bracket back to the wall
  blade.add(box(0.42, 0.06, 0.06, toon(0x39404e, {}), { x: -0.44, y: 0.62 }));
  blade.add(box(0.42, 0.06, 0.06, toon(0x39404e, {}), { x: -0.44, y: -0.62 }));
  root.add(blade);
  markReflect(blade);

  /* ------------------------- awning (雨棚) ----------------------- */
  const aw = group({ name: 'awning' });
  const awX0 = doorBay.x0 - 0.5;
  const awX1 = doorBay.x1 + 0.5;
  const awW = awX1 - awX0;
  const awOut = 0.86;
  const awY0 = 2.98;
  const awY1 = 2.82;
  const awningMat = toon(0xffffff, { side: THREE.DoubleSide });
  awningMat.map = awningTexture(256, 64);
  // sloped canopy
  const canopy = box(awW, 0.07, awOut + 0.08, awningMat, {
    x: (awX0 + awX1) / 2, y: (awY0 + awY1) / 2, z: z1 + awOut / 2,
    rx: -Math.atan2(awY0 - awY1, awOut),
  });
  aw.add(canopy);
  // cream leading edge
  aw.add(box(awW + 0.02, 0.09, 0.09, toon(0xf2efe2, {}), {
    x: (awX0 + awX1) / 2, y: awY1 - 0.035, z: z1 + awOut + 0.02, noOutline: true,
  }));
  // valance
  aw.add(box(awW, 0.17, 0.045, toon(PAL.awningDark, {}), {
    x: (awX0 + awX1) / 2, y: awY1 - 0.13, z: z1 + awOut,
  }));
  // ribs
  for (let i = 0; i <= 4; i++) {
    aw.add(box(0.045, 0.045, awOut + 0.08, toon(PAL.awningDark, {}), {
      x: awX0 + (awW * i) / 4, y: (awY0 + awY1) / 2 + 0.05, z: z1 + awOut / 2,
      rx: -Math.atan2(awY0 - awY1, awOut),
      noOutline: true,
    }));
  }
  // brackets
  [awX0 + 0.1, awX1 - 0.1].forEach((bx) => {
    aw.add(box(0.06, 0.06, awOut * 0.9, toon(0x4a515e, {}), {
      x: bx, y: awY1 - 0.22, z: z1 + awOut / 2, rx: Math.PI / 2 - 0.5,
    }));
    aw.add(box(0.06, 0.34, 0.06, toon(0x4a515e, {}), { x: bx, y: awY1 - 0.14, z: z1 + 0.06 }));
  });
  // under-canopy light strip
  aw.add(box(awW - 0.4, 0.05, 0.1, glow(0xffe6bc, 1.05), {
    x: (awX0 + awX1) / 2, y: awY1 - 0.02, z: z1 + awOut - 0.12,
  }));
  root.add(aw);
  markReflect(aw);

  const dripLine = {
    x0: awX0 + 0.08,
    x1: awX1 - 0.08,
    y: awY1 - 0.2,
    z: z1 + awOut - 0.02,
    step: 0.09,
  };

  /* ------------------------- automatic door ---------------------- */
  const door = makeDoor({
    width: doorBay.x1 - doorBay.x0 - 0.16,
    height: glassTop - sillY - 0.12,
    y: sillY + 0.06,
    z: z1 - T / 2 + 0.02,
    x: (doorBay.x0 + doorBay.x1) / 2,
    parent: root,
    frameMat,
    glass,
  });

  /* ------------------------- door mat ---------------------------- */
  const mat = makeEntryMat(doorBay.x1 - doorBay.x0 + 0.5, 0.95, L.walkTop);
  mat.position.set((doorBay.x0 + doorBay.x1) / 2, 0, z1 + 0.62);
  root.add(mat);

  // door threshold step
  root.add(box(doorBay.x1 - doorBay.x0 + 0.3, 0.1, 0.24, toon(0xbfc3c9, {}), {
    x: (doorBay.x0 + doorBay.x1) / 2, y: 0.25, z: z1 + 0.12,
  }));

  /* --------------------- exterior wall details ------------------- */
  // menu / price light box beside the door (typical konbini)
  const menuBox = group({ name: 'menu-board' });
  menuBox.position.set(winB.x1 - 0.75, 2.15, z1 + 0.02);
  menuBox.add(box(1.2, 1.5, 0.12, toon(0x2a3040, {}), {}));
  const menuTex = posterTexture(3, 384, 512);
  const menuFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.06, 1.36),
    new THREE.MeshBasicMaterial({ map: menuTex })
  );
  menuFace.position.set(0, 0, 0.066);
  menuFace.userData.noOutline = true;
  menuBox.add(menuFace);
  root.add(menuBox);
  markReflect(menuBox);

  // たばこ sticker + no-smoking sticker on the glass
  const sticker = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.42),
    new THREE.MeshBasicMaterial({ map: posterTexture(7, 128, 128), transparent: true })
  );
  sticker.position.set(winA.x1 - 0.5, 2.3, z1 - T / 2 + 0.02);
  sticker.userData.noOutline = true;
  root.add(sticker);

  // AC condenser units on the east + west walls (室外機)
  const acBody = toon(0x9aa0a8, {});
  const acGrille = toon(0x6e747c, {});
  const addAC = (px, py, pz, ry) => {
    const g = group({ x: px, y: py, z: pz, ry });
    g.add(box(0.86, 0.62, 0.32, acBody, { r: 0 }));
    g.add(box(0.9, 0.66, 0.06, acGrille, { z: 0.16, noOutline: true }));
    for (let i = 0; i < 5; i++) {
      g.add(box(0.78, 0.03, 0.02, acBody, { y: -0.22 + i * 0.11, z: 0.19, noOutline: true }));
    }
    g.add(box(0.06, 0.5, 0.06, toon(0x6d737d, {}), { x: -0.3, y: -0.5, z: -0.1 }));
    g.add(box(0.06, 0.5, 0.06, toon(0x6d737d, {}), { x: 0.3, y: -0.5, z: -0.1 }));
    return g;
  };
  root.add(addAC(x1 + 0.16, 2.4, -2.2, Math.PI / 2));
  root.add(addAC(x1 + 0.16, 3.15, -3.1, Math.PI / 2));
  root.add(addAC(x0 - 0.16, 2.6, -1.5, -Math.PI / 2));
  root.add(addAC(x0 - 0.16, 3.3, -2.4, -Math.PI / 2));
  // drain pipes
  root.add(cyl(0.06, 0.06, 4.3, 8, toon(0xb8bcc2, {}), { x: x1 + 0.06, y: 2.2, z: -3.9 }));

  // roof: water tank, vents, a satellite dish
  root.add(box(1.3, 0.9, 1.3, toon(0xd9dde2, {}), { x: cx - 3.2, y: S.wallH + 0.55, z: cz - 3.0, r: 0 }));
  root.add(box(1.42, 0.12, 1.42, toon(0x9aa0aa, {}), { x: cx - 3.2, y: S.wallH + 1.03, z: cz - 3.0, r: 0 }));
  root.add(cyl(0.22, 0.22, 0.7, 10, toon(0xb6bac0, {}), { x: cx + 2.4, y: S.wallH + 0.43, z: cz - 2.4 }));
  root.add(cyl(0.22, 0.22, 0.5, 10, toon(0xb6bac0, {}), { x: cx + 2.9, y: S.wallH + 0.33, z: cz - 2.0 }));
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.42),
    toon(0xe6e8ea, {}));
  dish.position.set(cx + 1.4, S.wallH + 0.5, cz + 2.6);
  dish.rotation.set(1.1, 0.6, 0);
  root.add(dish);
  root.add(cyl(0.05, 0.05, 0.4, 6, toon(0x8d939c, {}), { x: cx + 1.4, y: S.wallH + 0.25, z: cz + 2.6 }));

  // gutter along the parapet so the eave drips make sense
  const gutterMat = toon(0x9aa0aa, {});
  root.add(box(W + 0.2, 0.09, 0.14, gutterMat, { x: cx, y: S.wallH + parapetH - 0.05, z: z1 + 0.1 }));
  root.add(box(0.14, 0.09, D + 0.2, gutterMat, { x: x1 + 0.1, y: S.wallH + parapetH - 0.05, z: cz }));
  // downpipe
  root.add(cyl(0.07, 0.07, S.wallH + parapetH, 8, gutterMat, { x: x1 - 0.3, y: (S.wallH + parapetH) / 2, z: z1 - 0.1 }));

  /* ------------------------- glass rain overlay ------------------ */
  const rainFx = makeGlassRain(glassPanes);
  ctx.glassRain = rainFx;
  ctx.door = door;

  ctx.store = {
    root, door, dripLine, glassPanes,
    signFront, signSide, roofSign, blade, awning: aw,
    interiorBounds: { x0: x0 + T, x1: x1 - T, z0: z0 + T, z1: z1 - T, floorY: S.floorY, ceilY },
  };

  markReflect(root);
  return root;
}