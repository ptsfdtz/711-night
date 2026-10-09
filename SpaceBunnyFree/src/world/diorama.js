import * as THREE from 'three';
import { L } from './layout.js';
import { PAL, toon, flat, glow } from '../core/materials.js';
import { box, cyl, plane, group, roundedBox, rand, rng } from '../core/utils.js';
import {
  pavementTexture, zebraTexture, windowGridTexture, plinthTexture, curbTexture,
  asphaltTexture, posterTexture,
} from '../core/textures.js';
import { markReflect, wetGroundMaterial, puddleMaskTexture } from '../core/reflection.js';

/* ------------------------------------------------------------------ *
 *  Base plinth, street surface, sidewalk, road paint, alley and the
 *  dark backdrop blocks that close the composition.
 * ------------------------------------------------------------------ */

export function buildDiorama(ctx) {
  const root = new THREE.Group();
  root.name = 'diorama';

  const pavement = pavementTexture(512);
  // separate copy for the wet-sheen overlay: one tile ≈ half a unit
  const pavementWet = pavement.clone();
  pavementWet.needsUpdate = true;
  pavementWet.repeat.set(6, 6);
  const puddleTex = puddleMaskTexture(1024, L.base);
  const grainTex = asphaltTexture(512);
  const zebra = zebraTexture(512, 256);
  zebra.center.set(0.5, 0.5);
  zebra.rotation = Math.PI / 2;
  const plinth = plinthTexture(512);
  const curbTex = curbTexture(256);

  /* ---------------------------------------------------------------- *
   * 1. Plinth — the "collectible model" stand
   * ---------------------------------------------------------------- */
  const plinthMat = new THREE.MeshBasicMaterial({ map: plinth, color: 0xc8d2e4 });
  const body = box(L.base, L.plinthDepth * 0.82, L.base, plinthMat, {
    y: -L.plinthDepth * 0.82 / 2 - 0.02,
    noOutline: true,
  });
  root.add(body);

  const foot = box(L.base + 0.34, 0.14, L.base + 0.34, plinthMat, {
    y: -L.plinthDepth * 0.82 - 0.05,
    noOutline: true,
  });
  root.add(foot);

  // thin bright lip that catches the eye along the top edge
  const lip = box(L.base + 0.1, 0.045, L.base + 0.1, flat(0x5f7396, { fog: false }), {
    y: -0.03,
    noOutline: true,
  });
  root.add(lip);

  /* ---------------------------------------------------------------- *
   * 2. Wet asphalt — one shader plane for the whole street
   * ---------------------------------------------------------------- */
  const groundGeo = new THREE.PlaneGeometry(L.base, L.base, 1, 1);
  const ground = new THREE.Mesh(groundGeo, ctx.groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.001;
  ground.name = 'wet-ground';
  ground.userData.noOutline = true;
  ground.receiveShadow = false;
  root.add(ground);

  /* ---------------------------------------------------------------- *
   * 3. Sidewalk (L-band) + curbs + gutter
   * ---------------------------------------------------------------- */
  const walkMat = toon(PAL.sidewalk, {});
  walkMat.map = pavement;

  const walkFrontW = L.walkSideX - (-L.base / 2);
  const frontWalk = box(walkFrontW, L.walkTop - 0.006, L.walkFrontZ - L.store.z1, walkMat, {
    x: (L.walkSideX + -L.base / 2) / 2,
    y: (L.walkTop - 0.006) / 2,
    z: (L.walkFrontZ + L.store.z1) / 2,
    receive: true,
  });
  root.add(frontWalk);

  const sideWalk = box(L.walkSideX - L.store.x1, L.walkTop - 0.006, L.store.z1 - (-L.base / 2), walkMat, {
    x: (L.walkSideX + L.store.x1) / 2,
    y: (L.walkTop - 0.006) / 2,
    z: (L.store.z1 + -L.base / 2) / 2,
    receive: true,
  });
  root.add(sideWalk);

  // Wet sheen on the pavement: same mirror shader as the road, but with the
  // paving slabs as albedo and a weaker mirror. This is what carries the
  // neon smears right up to the shop door.
  const wetWalkMat = wetGroundMaterial({
    reflectionTexture: ctx.reflectionTexture,
    puddleTexture: puddleTex,
    grainTexture: grainTex,
    surfaceTexture: pavementWet,
    surfaceMix: 0.86,
    base: 0x4c515d,
    baseDark: 0x3b4049,
    sheen: 0xbfe0ff,
    worldSize: L.base,
    strength: 0.82,
    lightA: 0xffbe80,
    lightB: 0x6ea8e8,
    toonSteps: 3,
  });
  ctx.wetWalkMaterial = wetWalkMat;

  const wetFront = new THREE.Mesh(
    new THREE.PlaneGeometry(walkFrontW, L.walkFrontZ - L.store.z1), wetWalkMat);
  wetFront.rotation.x = -Math.PI / 2;
  wetFront.position.set((L.walkSideX + -L.base / 2) / 2, L.walkTop + 0.004,
    (L.walkFrontZ + L.store.z1) / 2);
  wetFront.userData.noOutline = true;
  wetFront.userData.noReflect = true;
  root.add(wetFront);

  const wetSide = new THREE.Mesh(
    new THREE.PlaneGeometry(L.walkSideX - L.store.x1, L.store.z1 - (-L.base / 2)), wetWalkMat);
  wetSide.rotation.x = -Math.PI / 2;
  wetSide.position.set((L.walkSideX + L.store.x1) / 2, L.walkTop + 0.004,
    (L.store.z1 + -L.base / 2) / 2);
  wetSide.userData.noOutline = true;
  wetSide.userData.noReflect = true;
  root.add(wetSide);

  // Curb faces — lighter concrete lip along every road edge.
  const curbMat = toon(PAL.curb, {});
  curbMat.map = curbTex;
  const curbH = L.walkTop + 0.03;
  const addCurb = (w, d, x, z, ry = 0) => {
    const c = box(w, curbH, d, curbMat, { x, y: curbH / 2 - 0.03, z, ry, receive: true });
    root.add(c);
    return c;
  };
  addCurb(walkFrontW, 0.16, (L.walkSideX + -L.base / 2) / 2, L.walkFrontZ + 0.02);
  addCurb(0.16, L.store.z1 - (-L.base / 2), L.walkSideX + 0.02, (L.store.z1 + -L.base / 2) / 2);

  // gutter channel + grates (排水沟)
  const gutterMat = toon(0x1b1f2b, {});
  const gutterFront = box(walkFrontW - 0.4, 0.05, 0.3, gutterMat, {
    x: (L.walkSideX + -L.base / 2) / 2,
    y: 0.008,
    z: L.walkFrontZ + 0.24,
    noOutline: true,
  });
  root.add(gutterFront);
  const gutterSide = box(0.3, 0.05, L.store.z1 - (-L.base / 2) - 0.4, gutterMat, {
    x: L.walkSideX + 0.24,
    y: 0.008,
    z: (L.store.z1 + -L.base / 2) / 2,
    noOutline: true,
  });
  root.add(gutterSide);

  const grateMat = flat(0x4c5364);
  const grateBar = new THREE.BoxGeometry(0.03, 0.015, 0.26);
  const grateCount = 15;
  const grates = new THREE.InstancedMesh(grateBar, grateMat, grateCount * 2);
  grates.userData.noOutline = true;
  const dummy = new THREE.Object3D();
  let gi = 0;
  for (let i = 0; i < grateCount; i++) {
    const x = -L.base / 2 + 0.5 + (i * (walkFrontW - 1.0)) / (grateCount - 1);
    dummy.position.set(x, 0.028, L.walkFrontZ + 0.24);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    grates.setMatrixAt(gi++, dummy.matrix);
    const z = -L.base / 2 + 1.0 + (i * (L.store.z1 + L.base / 2 - 2.0)) / (grateCount - 1);
    dummy.position.set(L.walkSideX + 0.24, 0.028, z);
    dummy.rotation.set(0, Math.PI / 2, 0);
    dummy.updateMatrix();
    grates.setMatrixAt(gi++, dummy.matrix);
  }
  grates.instanceMatrix.needsUpdate = true;
  root.add(grates);

  // tactile paving (点字ブロック) — yellow, unmistakably Japanese
  const tactileMat = toon(0xa8842a, {});
  const tactileFront = box(walkFrontW - 3.2, 0.03, 0.3, tactileMat, {
    x: (L.walkSideX + -L.base / 2) / 2 - 0.6,
    y: L.walkTop + 0.02,
    z: L.walkFrontZ - 0.3,
    noOutline: true,
  });
  root.add(tactileFront);
  const tactileSide = box(0.3, 0.03, L.store.z1 + L.base / 2 - 4.0, tactileMat, {
    x: L.walkSideX - 0.3,
    y: L.walkTop + 0.02,
    z: (L.store.z1 - 2 + -L.base / 2) / 2,
    noOutline: true,
  });
  root.add(tactileSide);

  /* ---------------------------------------------------------------- *
   * 4. Road paint
   * ---------------------------------------------------------------- */
  const paintMat = flat(0xc4ccd8, { transparent: true, opacity: 0.3, depthWrite: false });
  paintMat.userData.noOutline = true;

  // centre dashes along the front road
  const dashGeo = new THREE.PlaneGeometry(1.5, 0.14);
  const dashCount = 11;
  const dashes = new THREE.InstancedMesh(dashGeo, paintMat, dashCount * 2);
  dashes.userData.noOutline = true;
  let di = 0;
  for (let i = 0; i < dashCount; i++) {
    const x = -L.base / 2 + 1.4 + i * 2.1;
    if (x > 5.0) continue;
    dummy.position.set(x, 0.012, 8.4);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    dashes.setMatrixAt(di++, dummy.matrix);
    const z = -L.base / 2 + 1.2 + i * 1.9;
    dummy.position.set(8.4, 0.012, z);
    dummy.updateMatrix();
    dashes.setMatrixAt(di++, dummy.matrix);
  }
  dashes.count = di;
  dashes.instanceMatrix.needsUpdate = true;
  root.add(dashes);

  // zebra crossing across the front road (stripes run along the traffic axis)
  const zebraMat = new THREE.MeshBasicMaterial({
    map: zebra,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    color: 0xb9c0ca,
  });
  const zebraMesh = plane(1.5, 5.6, zebraMat, {
    x: 7.1,
    y: 0.014,
    z: (L.walkFrontZ + 11.0) / 2,
    rx: -Math.PI / 2,
    noOutline: true,
  });
  root.add(zebraMesh);
  // retroreflective sheen: the stripes glow faintly under headlights
  const zebraGlow = plane(1.5, 5.6, flat(0x9fd8ff, {
    transparent: true,
    opacity: 0.07,
    depthWrite: false,
    additive: true,
    fog: false,
  }), {
    x: 7.1,
    y: 0.016,
    z: (L.walkFrontZ + 11.0) / 2,
    rx: -Math.PI / 2,
    noOutline: true,
  });
  root.add(zebraGlow);

  // stop line
  root.add(plane(0.28, 5.6, paintMat, {
    x: 5.9,
    y: 0.013,
    z: (L.walkFrontZ + 11.0) / 2,
    rx: -Math.PI / 2,
    ry: Math.PI / 2,
    noOutline: true,
  }));

  // parking bay (駐車枠) with one occupied slot
  const bayMat = flat(0xe6e9ee, { transparent: true, opacity: 0.6, depthWrite: false });
  const bay = new THREE.Group();
  for (let i = 0; i < 2; i++) {
    const x = -6.4 + i * 2.9;
    bay.add(plane(2.7, 0.1, bayMat, { x, y: 0.013, z: 6.4, rx: -Math.PI / 2, noOutline: true }));
    bay.add(plane(0.1, 2.2, bayMat, { x: x - 1.35, y: 0.013, z: 7.5, rx: -Math.PI / 2, noOutline: true }));
  }
  bay.add(plane(5.7, 0.1, bayMat, { x: -4.95, y: 0.013, z: 8.55, rx: -Math.PI / 2, noOutline: true }));
  root.add(bay);

  // manhole + a couple of utility covers
  const coverMat = toon(0x4a5060, {});
  const manhole = cyl(0.42, 0.42, 0.05, 20, coverMat, { x: -1.2, y: 0.02, z: 9.6 });
  root.add(manhole);
  root.add(cyl(0.3, 0.3, 0.05, 16, coverMat, { x: 9.6, y: 0.02, z: 0.4 }));
  root.add(cyl(0.3, 0.3, 0.05, 16, coverMat, { x: -8.4, y: 0.02, z: 7.4 }));

  /* ---------------------------------------------------------------- *
   * 5. Alley (小巷入口) between store and neighbouring block
   * ---------------------------------------------------------------- */
  const alley = group({ name: 'alley' });
  const alleyFloor = box(
    L.alley.x1 - L.alley.x0,
    0.2,
    L.alley.mouthZ - L.alley.zBack,
    toon(0x3a3f4d, {}),
    {
      x: (L.alley.x0 + L.alley.x1) / 2,
      y: 0.1,
      z: (L.alley.mouthZ + L.alley.zBack) / 2,
      receive: true,
    }
  );
  alley.add(alleyFloor);
  // dead-end wall
  alley.add(box(
    L.alley.x1 - L.alley.x0,
    5.0,
    0.3,
    toon(0x4b505e, {}),
    { x: (L.alley.x0 + L.alley.x1) / 2, y: 2.5, z: L.alley.zBack - 0.15 }
  ));
  // drain channel down the middle
  alley.add(box(0.3, 0.05, L.alley.mouthZ - L.alley.zBack - 0.4, toon(0x272b36, {}), {
    x: (L.alley.x0 + L.alley.x1) / 2,
    y: 0.2,
    z: (L.alley.mouthZ + L.alley.zBack) / 2,
    noOutline: true,
  }));
  // clutter: crates, pipes, a bin
  const crateMat = toon(0x7a6a52, {});
  const crate = roundedBox(0.7, 0.55, 0.6, crateMat, {
    x: L.alley.x0 + 0.5,
    y: 0.2,
    z: 1.2,
    ry: 0.2,
    r: 0.05,
  });
  alley.add(crate);
  alley.add(roundedBox(0.6, 0.45, 0.55, crateMat, {
    x: L.alley.x0 + 0.55,
    y: 0.75,
    z: 1.25,
    ry: -0.35,
    r: 0.05,
  }));
  const pipeMat = toon(0x6d7280, {});
  alley.add(cyl(0.09, 0.09, 5.0, 8, pipeMat, { x: L.alley.x1 - 0.25, y: 0.2, z: 0.6, rz: 0.03 }));
  // alley back-wall lamp: the only cool light source back there
  const alleyLamp = glow(0xbcd8ff, 1.5, { flicker: { kind: 'tube', phase: 1.4 } });
  alley.add(box(0.34, 0.12, 0.1, alleyLamp, { x: (L.alley.x0 + L.alley.x1) / 2, y: 3.1, z: L.alley.zBack + 0.02 }));
  const alleyLight = new THREE.PointLight(0xa9cdf5, 5.0, 7.5, 2);
  alleyLight.position.set((L.alley.x0 + L.alley.x1) / 2, 3.0, L.alley.zBack + 0.5);
  alley.add(alleyLight);
  root.add(alley);

  /* ---------------------------------------------------------------- *
   * 6. Neighbouring block (west) + dark backdrop blocks
   * ---------------------------------------------------------------- */
  const nb = L.neighbour;
  const nbW = nb.x1 - nb.x0;
  const nbD = nb.z1 - nb.z0;
  const nbGridTex = windowGridTexture(5, 7);
  const nbMat = new THREE.MeshBasicMaterial({ map: nbGridTex, color: 0x67708a });
  const neighbour = box(nbW, nb.h, nbD, nbMat, {
    x: (nb.x0 + nb.x1) / 2,
    y: nb.h / 2,
    z: (nb.z0 + nb.z1) / 2,
  });
  neighbour.userData.backdrop = true;
  markReflect(neighbour);
  root.add(neighbour);
  // concrete bands so it isn't a flat card
  const bandMat = toon(0x3f4552, {});
  for (let i = 1; i < 4; i++) {
    root.add(box(nbW + 0.1, 0.16, nbD + 0.1, bandMat, {
      x: (nb.x0 + nb.x1) / 2,
      y: i * 2.1,
      z: (nb.z0 + nb.z1) / 2,
      noOutline: true,
    }));
  }
  // a dim shop window on the neighbouring block's street face
  const nbShop = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.4),
    new THREE.MeshBasicMaterial({ map: posterTexture(10, 256, 256), color: 0x7c8088 })
  );
  nbShop.position.set((nb.x0 + nb.x1) / 2 - 0.6, 1.9, nb.z1 + 0.03);
  nbShop.userData.noOutline = true;
  root.add(nbShop);
  markReflect(nbShop);

  for (const b of L.backdrop) {
    const w = b.x1 - b.x0;
    const d = b.z1 - b.z0;
    const tex = windowGridTexture(6, Math.max(4, Math.round(b.h / 1.15)), 384, 512);
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x5b6480 });
    const m = box(w, b.h, d, mat, {
      x: (b.x0 + b.x1) / 2,
      y: b.h / 2,
      z: (b.z0 + b.z1) / 2,
    });
    m.userData.backdrop = true;
    markReflect(m);
    root.add(m);
    // rooftop clutter
    root.add(box(w * 0.5, 0.5, d * 0.4, toon(0x333a4a, {}), {
      x: (b.x0 + b.x1) / 2,
      y: b.h + 0.25,
      z: (b.z0 + b.z1) / 2,
    }));
    root.add(cyl(0.05, 0.05, 1.6, 6, toon(0x2a303e, {}), {
      x: b.x1 - 0.6,
      y: b.h + 0.8,
      z: b.z0 + 0.8,
    }));
  }

  /* ---------------------------------------------------------------- *
   * 7. Scattered wet-sidewalk details
   * ---------------------------------------------------------------- */
  // a couple of cigarette butts + a crushed can by the entrance
  const tinyMat = flat(0x9aa2b0);
  for (let i = 0; i < 7; i++) {
    const m = box(rand(0.03, 0.06), 0.02, rand(0.03, 0.06), tinyMat, {
      x: rand(-2.5, 2.0),
      y: L.walkTop + 0.01,
      z: rand(3.3, 5.1),
      ry: rand(0, 3),
      noOutline: true,
    });
    root.add(m);
  }
  // fallen leaves (autumn, adds a touch of colour)
  const leafMat = toon(0xb5713a, {});
  for (let i = 0; i < 14; i++) {
    const onFront = rng() < 0.6;
    root.add(box(rand(0.09, 0.16), 0.012, rand(0.07, 0.13), leafMat, {
      x: onFront ? rand(-9, 5) : rand(3.4, 5.5),
      y: (onFront ? L.walkTop : L.walkTop) + 0.008,
      z: onFront ? rand(3.1, 5.3) : rand(-9, 2.8),
      ry: rand(0, 3.14),
      rx: rand(-0.1, 0.1),
      noOutline: true,
    }));
  }

  ctx.diorama = { root, ground, zebraGlow, wetFront, wetSide };
  return root;
}