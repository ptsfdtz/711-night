import * as THREE from 'three';
import {
  toon, canvasTex, box, plane, rand,
  BASE_HALF, ROAD_SZ0, ROAD_SZ1, ROAD_EX0, ROAD_EX1, ROAD_Y, SW_Y,
  groundH, M, JP_FONT,
} from './core.js';

export function buildBase(scene) {
  box(BASE_HALF * 2, 1.4, BASE_HALF * 2, M.baseSide, 0, -0.7, 0, scene);
  box(BASE_HALF * 2 + 0.35, 0.18, BASE_HALF * 2 + 0.35, M.baseTrim, 0, -1.42, 0, scene);
  box(BASE_HALF * 2 - 0.4, 0.06, BASE_HALF * 2 - 0.4, toon(0x141a28), 0, -1.54, 0, scene);
}

export function buildStreets(scene) {
  box(BASE_HALF * 2, 0.07, ROAD_SZ1 - ROAD_SZ0, M.asphalt, 0, ROAD_Y - 0.035, (ROAD_SZ0 + ROAD_SZ1) / 2, scene);
  box(ROAD_EX1 - ROAD_EX0, 0.07, ROAD_SZ1 - -BASE_HALF, M.asphalt, (ROAD_EX0 + ROAD_EX1) / 2, ROAD_Y - 0.035, (ROAD_SZ1 - BASE_HALF) / 2, scene);

  box(ROAD_EX0 - -BASE_HALF, 0.28, ROAD_SZ0 - -BASE_HALF, M.sidewalk, (-BASE_HALF + ROAD_EX0) / 2, 0.14, (-BASE_HALF + ROAD_SZ0) / 2, scene);
  box(BASE_HALF * 2, 0.28, BASE_HALF - ROAD_SZ1, M.sidewalk, 0, 0.14, (ROAD_SZ1 + BASE_HALF) / 2, scene);
  box(BASE_HALF - ROAD_EX1, 0.28, ROAD_SZ1 - -BASE_HALF, M.sidewalk, (ROAD_EX1 + BASE_HALF) / 2, 0.14, (-BASE_HALF + ROAD_SZ1) / 2, scene);

  box(BASE_HALF * 2, 0.1, 0.18, M.curb, 0, 0.3, ROAD_SZ0 - 0.09, scene);
  box(0.18, 0.1, ROAD_SZ1 + BASE_HALF - 0.1, M.curb, ROAD_EX0 - 0.09, 0.3, (ROAD_SZ1 - BASE_HALF) / 2 + 0.05, scene);
  for (let i = -10; i < 10; i += 2.4) {
    box(1.6, 0.02, 0.19, M.curbYellow, i, 0.355, ROAD_SZ0 - 0.09, scene);
  }

  for (let x = -11; x < 11; x += 2.0) {
    if (x > ROAD_EX0 - 1 && x < ROAD_EX1) continue;
    box(1.1, 0.015, 0.14, M.curbYellow, x, ROAD_Y + 0.01, (ROAD_SZ0 + ROAD_SZ1) / 2, scene);
  }
  for (let z = -11; z < 10; z += 2.0) {
    box(0.14, 0.015, 1.1, M.curbYellow, (ROAD_EX0 + ROAD_EX1) / 2, ROAD_Y + 0.01, z, scene);
  }

  const cwX = 3.2;
  for (let i = 0; i < 7; i++) {
    const z = ROAD_SZ0 + 0.45 + i * 0.78;
    if (z > ROAD_SZ1 - 0.3) break;
    box(1.8, 0.016, 0.42, M.stripe, cwX, ROAD_Y + 0.012, z, scene);
    const refl = plane(1.8, 0.9, toon(0xc8d8ff, {
      transparent: true, opacity: 0.12, emissive: 0x6a90d0, emissiveIntensity: 0.4, outline: false,
    }), cwX, ROAD_Y + 0.02, z + 0.55, scene);
    refl.rotation.x = -Math.PI / 2;
  }
  for (let i = 0; i < 7; i++) {
    const x = ROAD_EX0 + 0.45 + i * 0.78;
    if (x > ROAD_EX1 - 0.3) break;
    box(0.42, 0.016, 1.8, M.stripe, x, ROAD_Y + 0.012, 2.6, scene);
  }

  box(0.18, 0.016, 5.5, M.stripe, ROAD_EX0 - 0.7, ROAD_Y + 0.012, (ROAD_SZ0 + ROAD_SZ1) / 2 + 0.4, scene);
  box(5.2, 0.016, 0.18, M.stripe, (ROAD_EX0 + ROAD_EX1) / 2, ROAD_Y + 0.012, ROAD_SZ0 - 0.65, scene);

  const parkY = ROAD_Y + 0.014;
  for (let p = 0; p < 3; p++) {
    const cx = -6.5 + p * 2.6;
    box(0.1, 0.016, 2.6, M.stripe, cx - 1.15, parkY, ROAD_SZ0 + 1.5, scene);
    box(0.1, 0.016, 2.6, M.stripe, cx + 1.15, parkY, ROAD_SZ0 + 1.5, scene);
    box(2.4, 0.016, 0.1, M.stripe, cx, parkY, ROAD_SZ0 + 0.2, scene);
    box(2.4, 0.016, 0.1, M.stripe, cx, parkY, ROAD_SZ0 + 2.8, scene);
  }

  box(BASE_HALF * 2 - 1, 0.05, 0.42, M.drain, 0, ROAD_Y + 0.01, ROAD_SZ0 - 0.05, scene);
  for (let x = -11; x < 11; x += 0.55) {
    box(0.08, 0.02, 0.4, M.metalDark, x, ROAD_Y + 0.04, ROAD_SZ0 - 0.05, scene);
  }
  box(0.42, 0.05, ROAD_SZ1 + BASE_HALF - 1, M.drain, ROAD_EX0 - 0.05, ROAD_Y + 0.01, (ROAD_SZ1 - BASE_HALF) / 2, scene);
  for (let z = -11; z < 10; z += 0.55) {
    box(0.4, 0.02, 0.08, M.metalDark, ROAD_EX0 - 0.05, ROAD_Y + 0.04, z, scene);
  }
}

export function buildAlley(scene, ST) {
  const alleyX = -10.1;
  const alleyW = 1.6;
  box(alleyW, 0.06, ST.z1 - ST.z0 + 1.5, M.asphaltDark, alleyX, 0.1, (ST.z0 + ST.z1) / 2 - 0.3, scene);
  box(0.2, 3.2, ST.z1 - ST.z0 + 1.5, M.wallShade, alleyX - alleyW / 2, 1.7, (ST.z0 + ST.z1) / 2 - 0.3, scene);
  box(0.2, 3.2, ST.z1 - ST.z0 + 1.5, M.wallShade, alleyX + alleyW / 2, 1.7, (ST.z0 + ST.z1) / 2 - 0.3, scene);
  box(alleyW - 0.15, 2.2, 0.12, M.metalDark, alleyX, 1.2, ST.z0 - 0.95, scene);
  const alleyLight = new THREE.PointLight(0x6a9ad0, 0.55, 6, 2);
  alleyLight.position.set(alleyX, 2.4, ST.z0 + 0.5);
  scene.add(alleyLight);
  box(0.55, 0.4, 0.4, M.wood, alleyX - 0.35, 0.35, ST.z0 + 1.2, scene);
  box(0.5, 0.35, 0.4, M.woodDark, alleyX + 0.3, 0.32, ST.z0 + 1.7, scene);
  box(0.45, 0.3, 0.35, M.trimGreenDark, alleyX, 0.68, ST.z0 + 1.35, scene);
}

const puddleDefs = [
  { x: 0.5, z: 7.0, sx: 2.6, sz: 1.3 },
  { x: -4.5, z: 5.8, sx: 2.0, sz: 1.0 },
  { x: -8.5, z: 7.5, sx: 1.6, sz: 1.1 },
  { x: 7.8, z: 1.5, sx: 1.3, sz: 2.4 },
  { x: 6.5, z: -3.5, sx: 1.1, sz: 1.8 },
  { x: 9.0, z: -7.5, sx: 1.4, sz: 1.6 },
  { x: 3.0, z: 3.4, sx: 1.2, sz: 0.7 },
  { x: -2.0, z: 8.8, sx: 1.8, sz: 0.9 },
  { x: 10.2, z: 5.5, sx: 1.0, sz: 1.5 },
];

export const puddleData = puddleDefs.map((p) => ({
  x: p.x,
  z: p.z,
  r: Math.min(p.sx, p.sz) * 0.8,
}));

export function buildPuddles(scene) {
  for (const p of puddleDefs) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 40), M.puddle.clone());
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, groundH(p.x, p.z) + 0.012, p.z);
    m.scale.set(p.sx, p.sz, 1);
    scene.add(m);

    const sheen = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      toon(0x6ab0ff, {
        transparent: true, opacity: 0.1, emissive: 0x4488ff,
        emissiveIntensity: 0.5, outline: false,
      })
    );
    sheen.rotation.x = -Math.PI / 2;
    sheen.position.set(p.x + rand(-0.2, 0.2), m.position.y + 0.005, p.z + rand(-0.1, 0.1));
    sheen.scale.set(p.sx * 0.7, p.sz * 0.55, 1);
    scene.add(sheen);
  }
}

function makeReflection(x, z, w, l, color, scene) {
  const tex = canvasTex((ctx, W, H) => {
    const g = ctx.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W / 2);
    const c = new THREE.Color(color);
    const hex = `#${c.getHexString()}`;
    g.addColorStop(0, hex + 'ff');
    g.addColorStop(0.4, hex + '88');
    g.addColorStop(1, hex + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }, 128, 128);
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  mat.userData.outlineParameters = { visible: false };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, l), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, groundH(x, z) + 0.02, z);
  scene.add(mesh);
  return mesh;
}

export function buildReflections(scene) {
  return [
    makeReflection(-3.2, 5.2, 3.5, 5.5, 0x7dffb8, scene),
    makeReflection(-3.2, 6.5, 2.2, 4.0, 0xffc857, scene),
    makeReflection(4.4, 1.2, 2.0, 4.5, 0xff9ad0, scene),
    makeReflection(4.6, 3.6, 2.5, 5.0, 0xffe0a0, scene),
    makeReflection(7.5, 8.5, 1.8, 3.5, 0xff6b6b, scene),
    makeReflection(-9.5, 5.5, 1.5, 3.0, 0x8ab4ff, scene),
  ];
}

export function buildLights(scene) {
  scene.add(new THREE.AmbientLight(0x4a5f8a, 0.55));
  scene.add(new THREE.HemisphereLight(0x6a82b8, 0x1a2030, 0.55));

  const moon = new THREE.DirectionalLight(0x9ab4e0, 0.55);
  moon.position.set(-8, 18, 10);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -16;
  moon.shadow.camera.right = 16;
  moon.shadow.camera.top = 16;
  moon.shadow.camera.bottom = -16;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 50;
  moon.shadow.bias = -0.0006;
  scene.add(moon);
}
