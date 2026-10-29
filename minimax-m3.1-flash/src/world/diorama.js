import * as THREE from 'three';
import { PAL } from '../core/palette.js';
import * as TX from '../core/textures.js';
import { BASE, STREET, CROSSWALK, PARKING } from '../core/layout.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/** 便捷：带阴影的方块 */
function slab(w, h, d, mat, x, y, z, { cast = false, receive = true, rotY = 0 } = {}) {
  const m = new THREE.Mesh(box(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

/* ------------------------------------------------------------------ *
 *  底座
 * ------------------------------------------------------------------ */
export function buildBase(scene, mats) {
  const g = new THREE.Group();
  g.name = 'base';

  const S = BASE.size;
  const T = BASE.thickness;

  // 主体石台
  const body = new THREE.Mesh(box(S, T, S), mats.base);
  body.position.y = -T / 2;
  body.receiveShadow = true;
  g.add(body);

  // 顶面嵌板（略高，形成一圈台阶）
  const cap = new THREE.Mesh(box(S - 0.26, 0.06, S - 0.26), mats.baseRim);
  cap.position.y = 0.03;
  cap.receiveShadow = true;
  g.add(cap);

  // 侧边装饰凹槽
  for (let i = 0; i < 4; i++) {
    const groove = new THREE.Mesh(box(S - 0.5, 0.05, 0.03), mats.roofTrim);
    groove.position.set(0, -0.13, 0);
    const holder = new THREE.Group();
    holder.add(groove);
    holder.rotation.y = (i * Math.PI) / 2;
    g.add(holder);
  }

  // 底座下方的柔光池
  const glowGeo = new THREE.PlaneGeometry(S * 4.2, S * 4.2);
  const glowMat = new THREE.MeshBasicMaterial({
    map: TX.groundGlowTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = -T - 0.005;
  g.add(glow);

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  人行道 / 路缘 / 排水沟
 * ------------------------------------------------------------------ */
export function buildSidewalks(scene, mats) {
  const g = new THREE.Group();
  g.name = 'sidewalk';
  const H = STREET.curbH;

  const regions = [
    // [x0, x1, z0, z1]
    [-6, 2.7, 1.6, 2.6],      // 店前人行道
    [-6, 6, 4.95, 6.0],       // 南侧人行道
    [1.7, 2.7, -3.6, 1.6],    // 店东人行道
    [4.95, 6, -6, 4.95],      // 远端东人行道
    [-6, -3.6, -6, 1.6],      // 西侧空地
    [-3.6, 2.7, -6, -3.6],    // 北侧空地
  ];

  for (const [x0, x1, z0, z1] of regions) {
    const m = slab(x1 - x0, H, z1 - z0, mats.sidewalk, (x0 + x1) / 2, H / 2, (z0 + z1) / 2);
    g.add(m);
  }

  // 便利店地台（比人行道略高一点）
  const store = slab(5.3, 0.17, 5.2, mats.sidewalk, (-3.6 + 1.7) / 2, 0.085, (-3.6 + 1.6) / 2);
  g.add(store);

  // —— 路缘石 ——
  const curbs = [
    [8.7, 0.16, -6 + 8.7 / 2, 2.6 + 0.08],   // 店前路缘 (x -6..2.7)
    [0.16, 8.6, 2.7 - 0.08, -6 + 8.6 / 2],   // 街角转角路缘 (z -6..2.6)
    [8.7, 0.16, -6 + 8.7 / 2, 4.95 - 0.08],  // 南侧路缘
    [0.16, 8.6, 4.95 - 0.08, -6 + 8.6 / 2],  // 远端东路缘
    [1.05, 0.16, 4.95 + 0.525, 4.95 - 0.08],
    [0.16, 1.05, 4.95 - 0.08, 4.95 + 0.525],
  ];
  for (const [w, d, x, z] of curbs) {
    const c = slab(w, 0.19, d, mats.curb, x, 0.085, z);
    c.receiveShadow = true;
    g.add(c);
    // 路缘顶面亮条
    const t = slab(w * 0.98, 0.02, d * 0.98, mats.curbTop, x, 0.18, z);
    t.receiveShadow = false;
    g.add(t);
  }

  // —— 排水沟 ——
  const gut = mats.gutter;
  const gutters = [
    [8.7, 0.24, -1.65, 2.78],
    [0.24, 8.6, 2.78, -1.7],
    [8.7, 0.24, -1.65, 4.79],
    [0.24, 8.6, 4.79, -1.7],
  ];
  for (const [w, d, x, z] of gutters) {
    g.add(slab(w, 0.03, d, gut, x, STREET.roadY + 0.006, z));
  }

  // 雨水箅子
  for (const [x, z] of [[-4.4, 2.78], [0.4, 2.78], [2.78, -2.6], [2.78, 1.2], [-2.2, 4.79]]) {
    const grate = slab(0.62, 0.05, 0.34, mats.steelDark, x, STREET.roadY + 0.02, z);
    g.add(grate);
    for (let i = 0; i < 5; i++) {
      g.add(slab(0.5, 0.055, 0.03, mats.black, x, STREET.roadY + 0.028, z - 0.12 + i * 0.06));
    }
  }

  // 井盖
  for (const [x, z, r] of [[-1.2, 3.7, 0.33], [3.8, -3.2, 0.33], [-3.9, 3.6, 0.3]]) {
    const mh = new THREE.Mesh(new THREE.CircleGeometry(r, 24), mats.manhole);
    mh.rotation.x = -Math.PI / 2;
    mh.position.set(x, STREET.roadY + 0.012, z);
    mh.receiveShadow = true;
    g.add(mh);
  }

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  路面标线
 * ------------------------------------------------------------------ */
export function buildRoadMarkings(scene, mats) {
  const g = new THREE.Group();
  g.name = 'markings';
  const y = STREET.roadY + 0.014;

  // 主街中心虚线
  for (let x = -5.9; x < 6; x += 1.35) {
    g.add(slab(0.72, 0.012, 0.11, mats.lineWhite, x + 0.36, y, 3.78));
  }
  // 支路中心虚线
  for (let z = -5.9; z < 2.4; z += 1.35) {
    g.add(slab(0.11, 0.012, 0.72, mats.lineWhite, 3.83, y, z + 0.36));
  }

  // 斑马线（横穿主街）
  const total = CROSSWALK.bars * CROSSWALK.barW + (CROSSWALK.bars - 1) * CROSSWALK.gap;
  const startX = CROSSWALK.x0 + (CROSSWALK.x1 - CROSSWALK.x0 - total) / 2;
  for (let i = 0; i < CROSSWALK.bars; i++) {
    const x = startX + i * (CROSSWALK.barW + CROSSWALK.gap) + CROSSWALK.barW / 2;
    const bar = slab(CROSSWALK.barW, 0.014, STREET.roadA1 - STREET.roadA0 - 0.16, mats.crosswalk, x, y, (STREET.roadA0 + STREET.roadA1) / 2);
    g.add(bar);
  }

  // 停车位划线
  const pw = PARKING.x1 - PARKING.x0;
  g.add(slab(pw, 0.012, 0.1, mats.lineWhite, (PARKING.x0 + PARKING.x1) / 2, y, PARKING.z0));
  g.add(slab(pw, 0.012, 0.1, mats.lineWhite, (PARKING.x0 + PARKING.x1) / 2, y, PARKING.z1));
  g.add(slab(0.1, 0.012, PARKING.z1 - PARKING.z0, mats.lineWhite, PARKING.x0, y, (PARKING.z0 + PARKING.z1) / 2));
  g.add(slab(0.1, 0.012, PARKING.z1 - PARKING.z0, mats.lineWhite, PARKING.x1, y, (PARKING.z0 + PARKING.z1) / 2));
  // 中间的分隔虚线
  g.add(slab(0.09, 0.012, PARKING.z1 - PARKING.z0 - 0.2, mats.lineWhite, (PARKING.x0 + PARKING.x1) / 2, y, (PARKING.z0 + PARKING.z1) / 2));

  // 导流线（路口处弯曲线感）
  g.add(slab(0.1, 0.012, 1.1, mats.lineWhite, 2.95, y, 3.3));

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  沥青路面
 * ------------------------------------------------------------------ */
export function buildRoad(scene, mats) {
  const g = new THREE.Group();
  g.name = 'road';
  const y = STREET.roadY;

  const a = new THREE.Mesh(
    new THREE.PlaneGeometry(BASE.size, STREET.roadA1 - STREET.roadA0),
    mats.road
  );
  a.rotation.x = -Math.PI / 2;
  a.position.set(0, y, (STREET.roadA0 + STREET.roadA1) / 2);
  a.receiveShadow = true;
  g.add(a);

  const b = new THREE.Mesh(
    new THREE.PlaneGeometry(STREET.roadB1 - STREET.roadB0, STREET.roadA0 + 6),
    mats.road
  );
  b.rotation.x = -Math.PI / 2;
  b.position.set((STREET.roadB0 + STREET.roadB1) / 2, y, (STREET.roadA0 - 6) / 2);
  b.receiveShadow = true;
  g.add(b);

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  积水
 * ------------------------------------------------------------------ */
function blobShape(rnd, radius, wobble = 0.42, points = 16) {
  const shape = new THREE.Shape();
  const pts = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = radius * (1 - wobble / 2 + rnd() * wobble);
    pts.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }
  shape.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const prev = pts[i - 1];
    const next = pts[(i + 1) % pts.length];
    shape.quadraticCurveTo(
      prev.x + (p.x - prev.x) * 0.5 + (p.y - prev.y) * 0.12,
      prev.y + (p.y - prev.y) * 0.5 - (p.x - prev.x) * 0.12,
      p.x, p.y
    );
  }
  shape.closePath();
  return shape;
}

export function buildPuddles(scene, mats, rig) {
  const g = new THREE.Group();
  g.name = 'puddles';
  const rnd = TX.rng(4242);

  const spots = [
    [-1.9, 3.1, 0.95, 0.42],
    [1.4, 4.1, 0.72, 0.5],
    [-4.6, 3.9, 1.05, 0.38],
    [3.6, 0.4, 0.85, 0.45],
    [3.5, -4.4, 0.95, 0.4],
    [-3.4, 2.0, 0.55, 0.5],
    [0.9, 2.05, 0.5, 0.5],
  ];

  const normalMap = TX.rippleNormalTexture();
  normalMap.repeat.set(2.5, 2.5);

  spots.forEach(([x, z, r, w], i) => {
    const mat = mats.puddle.clone();
    mat.normalMap = normalMap.clone();
    mat.normalMap.needsUpdate = true;
    mat.normalMap.wrapS = mat.normalMap.wrapT = THREE.RepeatWrapping;
    mat.normalMap.repeat.set(2.2, 2.2);
    mat.normalScale = new THREE.Vector2(0.35, 0.35);
    const geo = new THREE.ShapeGeometry(blobShape(rnd, r, w, 18), 8);
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, STREET.roadY + 0.022, z);
    m.renderOrder = 1;
    g.add(m);

    // 缓慢流动的水面
    const speed = 0.012 + rnd() * 0.02;
    rig.add((t) => {
      const off = mat.normalMap.offset;
      off.x = (t * speed) % 1;
      off.y = (t * speed * 0.6) % 1;
    });
  });

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  人行道的点字块 / 盲道
 * ------------------------------------------------------------------ */
export function buildTactilePaving(scene, mats) {
  const g = new THREE.Group();
  g.name = 'tactile';
  const tex = TX.tactileTexture();
  const mat = new THREE.MeshToonMaterial({ color: PAL.tactile, map: tex, gradientMap: mats.ramp });
  tex.repeat.set(1, 14);
  mat.userData.outlineParameters = { visible: false };

  // 店前人行道上的盲道
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.98), mat);
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(-2.6, 0.178, 2.1);
  g.add(strip);

  // 街角处转弯的盲道
  const turn = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.42), mat);
  turn.rotation.x = -Math.PI / 2;
  turn.position.set(2.2, 0.178, 2.1);
  g.add(turn);

  const turn2 = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.9), mat);
  turn2.rotation.x = -Math.PI / 2;
  turn2.position.set(2.2, 0.178, 1.3);
  g.add(turn2);

  scene.add(g);
  return g;
}
