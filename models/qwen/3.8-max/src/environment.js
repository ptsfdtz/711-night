// environment.js — plinth base, ground, roads, sidewalk, crossing, gutters,
// puddles, lighting, fog and fake wet-ground reflections.
import * as THREE from 'three';
import { box, plane, cyl, at, canvasTexture, rand } from './util.js';
import { toon, glow, PALETTE, reflectionTexture, puddleTexture } from './materials.js';

/* Shared layout constants (used by store.js and props.js too) */
export const LAYOUT = {
  H: 10,                          // plinth half-extent (base spans -10..10)
  baseThickness: 2.2,
  store: { minX: -7.5, maxX: 1.0, minZ: -8.0, maxZ: -2.0, frontZ: -2.0, height: 3.6 },
  sidewalkFrontZ: [-2.0, 0.0],    // sidewalk in front of the store
  roadHZ: [0.0, 4.0],             // horizontal roadway (front street)
  roadVX: [3.0, 7.0],             // vertical roadway (side street)
  roadVZ: [-10, 6.0],
  corner: { x: 3.0, z: 0.0 },     // inner street corner
};

/* ------------------------------------------------------------------ *
 * Ground / plinth
 * ------------------------------------------------------------------ */
function buildPlinth(group) {
  const H = LAYOUT.H;
  const t = LAYOUT.baseThickness;

  // Main plinth block (the collectible "base")
  const plinthMat = toon(0x2c3442, { grad: undefined });
  const plinth = box(H * 2, t, H * 2, plinthMat, { outline: false });
  at(plinth, 0, -t / 2 + 0.001, 0);
  plinth.receiveShadow = true;
  plinth.castShadow = false;
  group.add(plinth);

  // Decorative darker skirting slightly inset (gives the base a lip)
  const skirt = box(H * 2 - 0.5, t * 0.55, H * 2 - 0.5, toon(0x141922), { outline: false });
  at(skirt, 0, -t * 0.5, 0);
  group.add(skirt);

  // Thin bright top rim to catch the eye (model-frame feel)
  const rimMat = toon(0x39424f);
  const rimN = box(H * 2, 0.14, 0.18, rimMat, { outline: false });
  at(rimN, 0, 0.02, -H); group.add(rimN);
  const rimS = rimN.clone(); at(rimS, 0, 0.02, H); group.add(rimS);
  const rimW = box(0.18, 0.14, H * 2, rimMat, { outline: false });
  at(rimW, -H, 0.02, 0); group.add(rimW);
  const rimE = rimW.clone(); at(rimE, H, 0.02, 0); group.add(rimE);
}

function buildGround(group) {
  const H = LAYOUT.H;

  // Sidewalk / base ground (light grey paving) across the whole top
  const pavingTex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#454d5e'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 3;
    const n = 8, s = w / n;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(w, i * s); ctx.stroke();
    }
    // speckle
    for (let i = 0; i < 1400; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rand(0.02, 0.06)})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, { repeat: [6, 6] });
  const sidewalk = plane(H * 2, H * 2, toon(PALETTE.sidewalk, { grad: undefined }));
  sidewalk.material.map = pavingTex;
  sidewalk.material.color = new THREE.Color(0xffffff);
  sidewalk.rotation.x = -Math.PI / 2;
  at(sidewalk, 0, 0.0, 0);
  sidewalk.receiveShadow = true;
  group.add(sidewalk);
}

function buildRoads(group) {
  const H = LAYOUT.H;
  const roadMat = toon(PALETTE.asphaltWet, { grad: undefined });
  roadMat.emissive = new THREE.Color(0x101c2c);
  roadMat.emissiveIntensity = 0.55;

  // subtle asphalt texture
  const asphaltTex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1d2331'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rand(0.01, 0.05)})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      ctx.fillStyle = `rgba(0,0,0,${rand(0.05, 0.15)})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }, { repeat: [5, 5] });
  roadMat.map = asphaltTex;
  roadMat.color = new THREE.Color(0xffffff);

  // Horizontal roadway (front street) — spans full width
  const [hz0, hz1] = LAYOUT.roadHZ;
  const hRoad = plane(H * 2, hz1 - hz0, roadMat);
  hRoad.rotation.x = -Math.PI / 2;
  at(hRoad, 0, 0.02, (hz0 + hz1) / 2);
  hRoad.receiveShadow = true;
  group.add(hRoad);

  // Vertical roadway (side street)
  const [vx0, vx1] = LAYOUT.roadVX;
  const [vz0, vz1] = LAYOUT.roadVZ;
  const vRoadMat = roadMat.clone();
  vRoadMat.map = asphaltTex;
  const vRoad = plane(vx1 - vx0, vz1 - vz0, vRoadMat);
  vRoad.rotation.x = -Math.PI / 2;
  at(vRoad, (vx0 + vx1) / 2, 0.021, (vz0 + vz1) / 2);
  vRoad.receiveShadow = true;
  group.add(vRoad);
}

function buildCrossing(group) {
  // Reflective zebra crossing across the horizontal road near the corner
  const [vx0, vx1] = LAYOUT.roadVX;
  const [hz0, hz1] = LAYOUT.roadHZ;
  const stripeMat = toon(0xe9eef2, { grad: undefined, emissive: 0x2a3340, emissiveIntensity: 0.5 });
  const n = 7, gap = 0.24;
  const totalW = vx1 - vx0 - 0.6;
  const sw = (totalW - gap * (n - 1)) / n;
  const cx0 = vx0 + 0.3;
  for (let i = 0; i < n; i++) {
    const s = plane(sw, hz1 - hz0 - 0.4, stripeMat);
    s.rotation.x = -Math.PI / 2;
    at(s, cx0 + i * (sw + gap) + sw / 2, 0.035, (hz0 + hz1) / 2);
    group.add(s);
  }
}

function buildCurbs(group) {
  const H = LAYOUT.H;
  const curbMat = toon(PALETTE.curb);
  const ch = 0.16, cw = 0.34;
  const [hz0, hz1] = LAYOUT.roadHZ;
  const [vx0, vx1] = LAYOUT.roadVX;

  const addCurb = (x, z, lenX, lenZ) => {
    const c = box(lenX, ch, lenZ, curbMat, { outline: false });
    at(c, x, ch / 2, z);
    c.receiveShadow = true;
    group.add(c);
  };

  // Near curb (store side) along z = hz0, from -H to vx0
  addCurb((-H + vx0) / 2, hz0 - cw / 2, (vx0 + H), cw);
  // Far curb along z = hz1 (two segments, gap for the side street)
  addCurb((-H + vx0) / 2, hz1 + cw / 2, (vx0 + H), cw);
  addCurb((vx1 + H) / 2, hz1 + cw / 2, (H - vx1), cw);
  // Store-block right curb along x = vx0, from -H to hz0
  addCurb(vx0 - cw / 2, (-H + hz0) / 2, cw, (hz0 + H));
  // Right sidewalk left curb along x = vx1
  addCurb(vx1 + cw / 2, (-H + hz0) / 2, cw, (hz0 + H));
  addCurb(vx1 + cw / 2, (hz1 + H) / 2, cw, (H - hz1));

  // Rounded corner curb at the street corner (pedestrian corner)
  const corner = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, ch, 16, 1, false, 0, Math.PI / 2),
    curbMat
  );
  corner.rotation.y = Math.PI; // orient the quarter into the intersection
  at(corner, vx0, ch / 2, hz0);
  corner.receiveShadow = true;
  group.add(corner);
}

function buildGutter(group) {
  // Drainage gutter with grate running along the near curb (store side)
  const H = LAYOUT.H;
  const [hz0] = LAYOUT.roadHZ;
  const [vx0] = LAYOUT.roadVX;

  const grateTex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#0c0f16'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5a6274';
    for (let i = 0; i < 6; i++) ctx.fillRect(6, 6 + i * 9, w - 12, 4);
  }, { repeat: [Math.floor((vx0 + H) / 0.6), 1] });

  const gutter = plane(vx0 + H, 0.55, toon(0x11151d, { grad: undefined }));
  gutter.material.map = grateTex;
  gutter.material.color = new THREE.Color(0xffffff);
  gutter.rotation.x = -Math.PI / 2;
  at(gutter, (-H + vx0) / 2, 0.03, hz0 + 0.32);
  group.add(gutter);
}

function buildParking(group) {
  // A couple of parking bays marked on the left roadway
  const [hz0, hz1] = LAYOUT.roadHZ;
  const lineMat = toon(0xdfe6ea, { grad: undefined, emissive: 0x20262f, emissiveIntensity: 0.3 });
  const z = (hz0 + hz1) / 2;
  const depth = hz1 - hz0 - 0.8;
  for (let i = 0; i < 3; i++) {
    const x = -8.4 + i * 1.7;
    const a = plane(0.14, depth, lineMat); a.rotation.x = -Math.PI / 2; at(a, x, 0.036, z); group.add(a);
  }
  const top = plane(1.7 * 2 + 0.14, 0.14, lineMat); top.rotation.x = -Math.PI / 2; at(top, -8.4 + 1.7, 0.036, hz0 + 0.5); group.add(top);
}

function buildAlley(group) {
  // Dark alley entrance on the far-left of the store
  const { minX } = LAYOUT.store;
  const alleyWall = box(0.4, 4.2, 6.5, toon(0x2a3140), { outline: false });
  at(alleyWall, minX - 1.4, 2.1, -5.0);
  group.add(alleyWall);

  const dark = plane(2.4, 6.0, glow(0x05070c, { intensity: 1 }));
  dark.rotation.y = Math.PI / 2;
  at(dark, minX - 0.6, 2.0, -5.0);
  group.add(dark);

  // faint warm light spilling from deep in the alley
  const spill = plane(1.6, 2.2, new THREE.MeshBasicMaterial({
    map: reflectionTexture('#4a6a8a'), transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  spill.rotation.y = Math.PI / 2;
  at(spill, minX - 0.55, 1.4, -6.2);
  group.add(spill);
}

function buildPuddles(group) {
  const tex = puddleTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const spots = [
    [-4.5, 2.0, 3.2], [-1.0, 2.6, 2.4], [1.8, 1.4, 2.0],
    [5.0, 2.2, 2.8], [-6.5, -0.6, 2.2], [0.5, -1.2, 1.8],
    [8.0, 2.5, 2.4], [5.0, 5.0, 2.0], [-2.5, 5.0, 2.2],
  ];
  const puddles = [];
  spots.forEach(([x, z, s]) => {
    const p = plane(s, s * 0.8, mat.clone());
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = rand(0, Math.PI);
    at(p, x, 0.055, z);
    group.add(p);
    puddles.push(p);
  });
  return puddles;
}

/* Fake wet-ground reflection streak (additive, animated elsewhere) */
export function addGroundReflection(parent, { x, z, w, len, color = '#ffd9a0', intensity = 0.8, rotY = 0 }) {
  const mat = new THREE.MeshBasicMaterial({
    map: reflectionTexture(color),
    transparent: true,
    opacity: intensity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const p = plane(w, len, mat);
  p.rotation.x = -Math.PI / 2;
  p.rotation.z = rotY;
  at(p, x, 0.07, z);
  parent.add(p);
  return p;
}

/* ------------------------------------------------------------------ *
 * Lighting + atmosphere
 * ------------------------------------------------------------------ */
function buildLights(scene) {
  scene.background = new THREE.Color(0x070b14);
  scene.fog = new THREE.FogExp2(0x0a1020, 0.018);

  const hemi = new THREE.HemisphereLight(0x40608f, 0x0e1424, 1.15);
  scene.add(hemi);

  const amb = new THREE.AmbientLight(0x2e3c55, 1.0);
  scene.add(amb);

  // Soft cool fill from the camera side so the plinth & silhouettes read
  const fill = new THREE.DirectionalLight(0x7d94c4, 0.5);
  fill.position.set(16, 10, 18);
  fill.castShadow = false;
  scene.add(fill);

  // Cool "moon / city sky" key light (casts the main shadows)
  const dir = new THREE.DirectionalLight(0x9dbdf0, 1.15);
  dir.position.set(-14, 22, 12);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  const d = 18;
  dir.shadow.camera.left = -d;
  dir.shadow.camera.right = d;
  dir.shadow.camera.top = d;
  dir.shadow.camera.bottom = -d;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 60;
  dir.shadow.bias = -0.0006;
  dir.shadow.normalBias = 0.02;
  scene.add(dir);

  return { hemi, amb, dir };
}

/* ------------------------------------------------------------------ *
 * Public builder
 * ------------------------------------------------------------------ */
export function buildEnvironment(scene) {
  const group = new THREE.Group();
  group.name = 'environment';

  buildPlinth(group);
  buildGround(group);
  buildRoads(group);
  buildCrossing(group);
  buildCurbs(group);
  buildGutter(group);
  buildParking(group);
  buildAlley(group);
  const puddles = buildPuddles(group);

  const lights = buildLights(scene);

  scene.add(group);

  return { group, lights, puddles };
}
