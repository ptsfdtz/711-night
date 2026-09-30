import * as THREE from 'three';
import * as T from './textures.js';
import {
  C, box, cyl, plane, mesh, group, rot, toon, flat, outline, glow,
  rnd, pick, range,
} from './util.js';
import { SX, SZ_F, SZ_B } from './store.js';

/* ------------------------------------------------------------------ *
 *  helpers
 * ------------------------------------------------------------------ */

function tube(a, b, r, mat, seg = 6) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(B, A);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.position.copy(A).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return m;
}

function wire(a, b, sag = 0.55, r = 0.022, mat) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const mid = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
  const geo = new THREE.TubeGeometry(curve, 14, r, 5, false);
  return new THREE.Mesh(geo, mat);
}

/* ------------------------------------------------------------------ *
 *  materials
 * ------------------------------------------------------------------ */

const S = {};
function mats() {
  if (S.ready) return S;
  S.concrete = toon(C.concrete, { rim: 0x7d9cc4, rimStrength: 0.3, map: T.concreteTint() });
  S.darkWall = toon(0x3a4150, { rim: 0x7d9cc4, rimStrength: 0.35, map: T.concreteTint() });
  S.building = toon(0xffffff, { map: T.facade(0), rim: 0x6f92c4, rimStrength: 0.3 });
  S.building2 = toon(0xffffff, { map: T.facade(1), rim: 0x6f92c4, rimStrength: 0.3 });
  S.building3 = toon(0xffffff, { map: T.facade(2), rim: 0x6f92c4, rimStrength: 0.3 });
  S.metal = toon(C.metal, { rim: 0xa8c4e8, rimStrength: 0.4 });
  S.metalDark = toon(C.metalDark, { rim: 0x8fa8cc, rimStrength: 0.35 });
  S.dark = toon(0x232a36, { rim: 0x6f92c4, rimStrength: 0.35 });
  S.rubber = toon(C.rubber, { rim: 0x7d9cc4, rimStrength: 0.3 });
  S.red = toon(C.red, { rim: 0xff9a8a, rimStrength: 0.35 });
  S.green = toon(C.green, { rim: 0x8fd8b0, rimStrength: 0.35 });
  S.white = toon(C.white, { rim: 0xa8c4e8, rimStrength: 0.35 });
  S.wood = toon(C.wood, { rim: 0xa8886a, rimStrength: 0.3 });
  S.leaf = toon(0x2f6046, { rim: 0x7fd8a8, rimStrength: 0.3 });
  S.ready = true;
  return S;
}

/* ------------------------------------------------------------------ *
 *  buildings around the block
 * ------------------------------------------------------------------ */

function buildingBlock(parent, m, { x, y, z, w, h, d, mat, parapet = true }) {
  const b = mesh(box(w, h, d), mat, x, y + h / 2, z);
  outline(b, 0.035);
  parent.add(b);
  if (parapet) {
    const p = mesh(box(w + 0.16, 0.34, d + 0.16), S.metalDark || toon(0x4a5160), x, y + h + 0.17, z);
    outline(p, 0.025);
    parent.add(p);
  }
  return b;
}

function rooftopClutter(parent, m, x, z, w, d, h) {
  const tank = mesh(box(1.1, 0.9, 0.9), m.metalDark, x + w * 0.2, h + 0.45, z - d * 0.2);
  outline(tank, 0.02);
  parent.add(tank);
  const tank2 = mesh(cyl(0.4, 0.4, 0.8, 10), m.metalDark, x - w * 0.25, h + 0.4, z + d * 0.1);
  parent.add(tank2);
  const stair = mesh(box(0.9, 0.5, 1.2), m.dark, x - w * 0.05, h + 0.25, z + d * 0.25);
  parent.add(stair);
  // antenna
  parent.add(mesh(cyl(0.03, 0.03, 1.6, 6), m.metalDark, x + w * 0.35, h + 0.8, z + d * 0.3));
}

function neonShop(parent, m, { x, y, z, ry, w = 2.6, h = 2.4, texIdx = 0, neon = 0xff5f6d, text = 'ラーメン' }) {
  const g = group(x, y, z);
  g.rotation.y = ry;
  parent.add(g);

  // lit shop window
  const win = mesh(plane(w, 1.5), flat(0xffdca8), 0, 0.9, 0.02);
  g.add(win);
  const frame = mesh(box(w + 0.16, 1.66, 0.08), m.metalDark, 0, 0.9, 0.0);
  g.add(frame);
  // warm interior hint
  const inner = mesh(plane(w - 0.2, 1.3), flat(0xffc98a), 0, 0.9, -0.02);
  g.add(inner);
  // awning
  const aw = mesh(box(w + 0.3, 0.1, 0.6), m.red, 0, 1.85, 0.32);
  aw.rotation.x = -0.18;
  g.add(aw);
  // vertical neon sign
  const signW = 0.52, signH = 2.0;
  const board = mesh(box(signW, signH, 0.1), m.dark, w * 0.5 + 0.35, 2.7, 0.1);
  g.add(board);
  const faceTex = T.verticalSign();
  const face = mesh(plane(signW - 0.06, signH - 0.1), flat(neon), w * 0.5 + 0.35, 2.7, 0.17);
  g.add(face);
  const gg = glow(neon, 2.6, 0.32, 0.8);
  gg.position.set(w * 0.5 + 0.35, 2.7, 0.35);
  g.add(gg);
  return { face, glow: gg, win };
}

/* ------------------------------------------------------------------ *
 *  street props
 * ------------------------------------------------------------------ */

function vendingMachine(parent, m, x, z, ry, kind = 0) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);

  const body = mesh(box(1.02, 1.95, 0.86), kind ? m.dark : toon(0x2b3444, { rim: 0x9fc0e8, rimStrength: 0.35 }), 0, 0.98, 0);
  outline(body, 0.024);
  g.add(body);

  const face = mesh(plane(0.84, 1.72), flat(0xffffff, { map: T.vendingFront() }), 0, 1.06, 0.44);
  g.add(face);
  // illuminated frame
  const fr = mesh(box(0.92, 1.82, 0.06), m.metalDark, 0, 1.06, 0.4);
  g.add(fr);
  // top light box
  const top = mesh(plane(0.86, 0.2), flat(kind ? 0x7fd8ff : 0xffd08a), 0, 1.85, 0.45);
  g.add(top);
  // glow
  const g1 = glow(kind ? 0x8fd8ff : 0xffd0a0, 2.6, 0.30, 0.8);
  g1.position.set(0, 1.1, 0.75);
  g.add(g1);
  // drip from the top edge
  return { group: g, glow: g1, face, top };
}

function bicycle(parent, m, x, z, ry) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const wheelMat = m.rubber;
  const spokeMat = m.metal;
  const R = 0.33;

  const wheel = (zz) => {
    const w = new THREE.Group();
    const tyre = mesh(new THREE.TorusGeometry(R, 0.045, 6, 20), wheelMat, 0, R, zz);
    w.add(tyre);
    const hub = mesh(cyl(0.05, 0.05, 0.09, 8), spokeMat, 0, R, zz);
    hub.rotation.z = Math.PI / 2;
    w.add(hub);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const sp = mesh(box(0.02, R * 2 - 0.04, 0.01), spokeMat, 0, R, zz);
      sp.rotation.x = a;
      w.add(sp);
    }
    return w;
  };
  g.add(wheel(-0.52), wheel(0.52));

  const frameMat = toon(0x2f6f5f, { rim: 0x9fd8c0, rimStrength: 0.4 });
  const t = (a, b, r = 0.035) => g.add(tube(a, b, r, frameMat, 6));
  t([0, R, -0.52], [0, 0.26, -0.06]);
  t([0, 0.26, -0.06], [0, R, 0.52]);
  t([0, R, 0.52], [0, 0.98, 0.44]);
  t([0, 0.26, -0.06], [0, 0.92, -0.3]);
  t([0, 0.92, -0.3], [0, R, -0.52]);
  t([0, 0.26, -0.06], [0, 0.98, 0.44]);
  // handle bar
  const bar = mesh(cyl(0.025, 0.025, 0.62, 6), m.metal, 0, 1.0, 0.46);
  bar.rotation.z = Math.PI / 2;
  g.add(bar);
  // seat
  const seat = mesh(box(0.2, 0.06, 0.34), m.dark, 0, 1.0, -0.32);
  g.add(seat);
  // basket
  const basket = mesh(box(0.34, 0.24, 0.26), toon(0x8a6a44, { rim: 0xd8b088, rimStrength: 0.35 }), 0, 0.86, 0.6);
  outline(basket, 0.014);
  g.add(basket);
  // kickstand
  g.add(tube([0.05, 0.24, -0.1], [0.16, 0.0, -0.2], 0.022, m.metalDark));
  g.rotation.z = 0.06;
  return g;
}

function streetLamp(parent, m, x, z, { h = 5.6, armLen = 1.5, ry = 0, warm = 0xffd9a8 }) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const pole = mesh(cyl(0.09, 0.13, h, 10), m.metalDark, 0, h / 2, 0);
  outline(pole, 0.02);
  g.add(pole);
  const base = mesh(cyl(0.2, 0.24, 0.16, 10), m.metalDark, 0, 0.08, 0);
  g.add(base);
  // arm
  const arm = tube([0, h - 0.1, 0], [0, h + 0.25, armLen], 0.055, m.metalDark, 6);
  g.add(arm);
  const headPos = [0, h + 0.18, armLen];
  const head = mesh(box(0.62, 0.16, 0.34), m.metalDark, headPos[0], headPos[1], headPos[2]);
  outline(head, 0.014);
  g.add(head);
  const lens = mesh(plane(0.54, 0.26), flat(0xfff2d4), headPos[0], headPos[1] - 0.09, headPos[2]);
  lens.rotation.x = Math.PI / 2;
  g.add(lens);
  const gl = glow(warm, 3.4, 0.42, 0.7);
  gl.position.set(headPos[0], headPos[1] - 0.35, headPos[2]);
  gl.rotation.x = Math.PI / 2;
  g.add(gl);
  // light cone
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(1.9, h + 0.2, 18, 1, true),
    new THREE.MeshBasicMaterial({
      color: warm, transparent: true, opacity: 0.055,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    })
  );
  cone.position.set(headPos[0], (h + 0.2) / 2, headPos[2]);
  g.add(cone);
  const light = new THREE.PointLight(warm, 16, 11, 2.0);
  light.position.set(headPos[0], headPos[1] - 0.3, headPos[2]);
  g.add(light);
  return { light, glow: gl, lens, headPos };
}

function utilityPole(parent, m, x, z, h = 7.2, ry = 0) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const pole = mesh(cyl(0.13, 0.17, h, 10), toon(0x6b7280, { rim: 0x9fc0e8, rimStrength: 0.35 }), 0, h / 2, 0);
  outline(pole, 0.022);
  g.add(pole);
  // cross arms
  const arms = [h - 0.55, h - 1.35];
  arms.forEach((ay, i) => {
    const arm = mesh(box(1.9 - i * 0.3, 0.1, 0.12), m.metalDark, 0, ay, 0);
    outline(arm, 0.014);
    g.add(arm);
    for (let k = -1; k <= 1; k++) {
      const ins = mesh(cyl(0.05, 0.06, 0.16, 8), toon(0x9aa3ae), k * (0.75 - i * 0.12), ay + 0.12, 0);
      g.add(ins);
    }
  });
  // transformer
  const tr = mesh(cyl(0.24, 0.24, 0.62, 12), m.metalDark, 0, h - 2.3, 0.2);
  outline(tr, 0.016);
  g.add(tr);
  return g;
}

function guardrail(parent, m, x, z, len, ry) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const n = Math.max(2, Math.round(len / 1.1));
  for (let i = 0; i <= n; i++) {
    const px = -len / 2 + (i * len) / n;
    const post = mesh(box(0.09, 0.78, 0.09), m.metal, px, 0.39, 0);
    outline(post, 0.012);
    g.add(post);
  }
  [0.62, 0.3].forEach((y) => {
    const rail = mesh(box(len, 0.07, 0.06), m.white, 0, y, 0);
    g.add(rail);
  });
  return g;
}

function trafficSignal(parent, m, x, z, ry) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const pole = mesh(cyl(0.1, 0.13, 4.3, 10), m.metalDark, 0, 2.15, 0);
  outline(pole, 0.02);
  g.add(pole);
  const arm = tube([0, 4.15, 0], [0, 4.35, 1.5], 0.06, m.metalDark, 6);
  g.add(arm);
  const boxG = mesh(box(0.42, 1.24, 0.32), m.dark, 0, 3.6, 1.5);
  outline(boxG, 0.016);
  g.add(boxG);
  const lamps = [];
  const colors = [0xff4a4a, 0xffc94a, 0x5ce08a];
  const visors = [];
  colors.forEach((c, i) => {
    const y = 4.05 - i * 0.4;
    const lens = mesh(new THREE.CircleGeometry(0.13, 16), flat(c), 0, y, 1.68);
    g.add(lens);
    const gl = glow(c, 1.0, 0.5, 0.6);
    gl.position.set(0, y, 1.78);
    g.add(gl);
    // little visor
    const v = mesh(box(0.3, 0.06, 0.14), m.dark, 0, y + 0.16, 1.72);
    v.rotation.x = 0.5;
    g.add(v);
    lamps.push({ lens, glow: gl, color: c });
  });
  return { lamps, group: g };
}

function roadSignBoard(parent, m, x, z, ry, h = 2.3) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const pole = mesh(cyl(0.06, 0.07, h, 8), m.metalDark, 0, h / 2, 0);
  outline(pole, 0.014);
  g.add(pole);
  const tex = T.roadSign();
  const front = mesh(plane(1.24, 0.78), flat(0xffffff, { map: tex, side: THREE.DoubleSide }), 0, h + 0.35, 0);
  g.add(front);
  const back = front.clone();
  back.position.z = -0.02;
  g.add(back);
  return g;
}

function parkingSignBoard(parent, m, x, z, ry) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const pole = mesh(cyl(0.06, 0.07, 2.2, 8), m.metalDark, 0, 1.1, 0);
  outline(pole, 0.014);
  g.add(pole);
  const face = mesh(plane(0.86, 1.28), flat(0xffffff, { map: T.parkingSign(), side: THREE.DoubleSide }), 0, 2.4, 0);
  g.add(face);
  const gl = glow(0xfff0c8, 1.8, 0.16, 0.8);
  gl.position.set(0, 2.4, 0.2);
  g.add(gl);
  return { glow: gl, face };
}

function umbrellaStand(parent, m, x, z, ry) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const body = mesh(box(0.56, 0.5, 0.36), m.metalDark, 0, 0.25, 0);
  outline(body, 0.014);
  g.add(body);
  const lip = mesh(box(0.6, 0.06, 0.4), m.metal, 0, 0.51, 0);
  g.add(lip);
  const cols = [0x3f5f8f, 0x8f3f4f, 0x4f7f5f];
  cols.forEach((c, i) => {
    const u = group(-0.16 + i * 0.16, 0.5, 0);
    u.rotation.z = -0.12 + i * 0.12;
    u.rotation.x = i * 0.05;
    const shaft = mesh(cyl(0.025, 0.025, 0.86, 6), toon(c), 0, 0.43, 0);
    u.add(shaft);
    const tip = mesh(cyl(0.005, 0.035, 0.12, 6), toon(c), 0, 0.9, 0);
    u.add(tip);
    const handle = mesh(new THREE.TorusGeometry(0.06, 0.014, 5, 10, Math.PI), m.dark, 0.06, 0.02, 0);
    handle.rotation.y = Math.PI / 2;
    u.add(handle);
    g.add(u);
  });
  return g;
}

function trashBin(parent, m, x, z, ry) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const body = mesh(cyl(0.3, 0.26, 0.9, 14), toon(0x3f4a5c, { rim: 0x9fc0e8, rimStrength: 0.35 }), 0, 0.45, 0);
  outline(body, 0.018);
  g.add(body);
  const lid = mesh(cyl(0.32, 0.32, 0.08, 14), m.metalDark, 0, 0.94, 0);
  g.add(lid);
  const hole = mesh(box(0.3, 0.04, 0.16), m.dark, 0, 0.99, 0);
  g.add(hole);
  const label = mesh(plane(0.26, 0.26), flat(0xffffff, { map: T.binLabel() }), 0, 0.6, 0.265);
  g.add(label);
  return g;
}

function aFrameSign(parent, m, x, z, ry) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const tex = T.poster(1);
  const p1 = mesh(plane(0.62, 0.92), flat(0xffffff, { map: tex, side: THREE.DoubleSide }), 0, 0.46, 0.22);
  p1.rotation.x = -0.22;
  g.add(p1);
  const p2 = mesh(plane(0.62, 0.92), flat(0xffffff, { map: T.poster(0), side: THREE.DoubleSide }), 0, 0.46, -0.22);
  p2.rotation.x = 0.22;
  p2.rotation.y = Math.PI;
  g.add(p2);
  const bar = mesh(box(0.66, 0.05, 0.05), m.metalDark, 0, 0.9, 0);
  g.add(bar);
  return g;
}

function streetTree(parent, m, x, z) {
  const g = group(x, 0, z);
  parent.add(g);
  const guard = mesh(box(0.9, 0.12, 0.9), m.metalDark, 0, 0.06, 0);
  g.add(guard);
  const soil = mesh(box(0.7, 0.1, 0.7), toon(0x4a3a2a), 0, 0.11, 0);
  g.add(soil);
  const trunk = mesh(cyl(0.09, 0.14, 1.9, 8), toon(0x4b3a2c, { rim: 0x8a7a5a, rimStrength: 0.3 }), 0, 1.0, 0);
  outline(trunk, 0.018);
  g.add(trunk);
  const foliage = new THREE.Group();
  const fm = m.leaf;
  [[0, 2.3, 0, 0.62], [0.35, 2.05, 0.2, 0.42], [-0.32, 2.1, -0.15, 0.4], [0.1, 2.62, -0.25, 0.38]].forEach((p) => {
    const s = mesh(new THREE.IcosahedronGeometry(p[3], 0), fm, p[0], p[1], p[2]);
    s.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    outline(s, 0.02, 0x0e1a14);
    foliage.add(s);
  });
  g.add(foliage);
  return g;
}

function crateStack(parent, m, x, z, ry) {
  const g = group(x, 0, z);
  g.rotation.y = ry;
  parent.add(g);
  const cm = toon(0x7a6248, { rim: 0xb8a080, rimStrength: 0.3 });
  const bm = toon(0x3f4a5c, { rim: 0x9fc0e8, rimStrength: 0.3 });
  for (let i = 0; i < 3; i++) {
    const c = mesh(box(0.62, 0.36, 0.44), i % 2 ? bm : cm, 0, 0.18 + i * 0.37, 0);
    c.rotation.y = range(-0.12, 0.12);
    outline(c, 0.014);
    g.add(c);
  }
  const barrel = mesh(cyl(0.26, 0.26, 0.72, 12), toon(0x4a5566, { rim: 0x9fc0e8, rimStrength: 0.3 }), 0.62, 0.36, 0.1);
  outline(barrel, 0.016);
  g.add(barrel);
  const barrelTop = mesh(cyl(0.27, 0.27, 0.05, 12), m.metalDark, 0.62, 0.74, 0.1);
  g.add(barrelTop);
  return g;
}

/* ------------------------------------------------------------------ *
 *  main build
 * ------------------------------------------------------------------ */

export function buildStreet(ctx) {
  const m = mats();
  const root = ctx.root;

  /* ================= surrounding buildings ================= */
  const blockA = buildingBlock(root, m, { x: -6.7, y: 0, z: -2.55, w: 2.6, h: 5.4, d: 10.9, mat: m.building });
  rooftopClutter(root, m, -6.7, -2.55, 2.6, 10.9, 5.4);
  // ground floor shutter shop facing the alley
  const shutter = mesh(plane(3.0, 2.4), flat(0x6a7280, { map: T.facade(2) }), -5.38, 1.2, -1.2);
  shutter.rotation.y = Math.PI / 2;
  root.add(shutter);
  for (let i = 0; i < 12; i++) {
    const slat = mesh(box(0.04, 0.06, 2.9), m.dark, -5.42, 0.2 + i * 0.2, -1.2);
    root.add(slat);
  }
  const shopA = neonShop(root, m, { x: -6.7, y: 0, z: 2.92, ry: 0, w: 2.0, h: 2.4, neon: 0xff6a7a });
  ctx.neon.push(shopA);

  const blockB = buildingBlock(root, m, { x: 0, y: 0, z: 7.5, w: 16.0, h: 6.2, d: 1.0, mat: m.building2 });
  rooftopClutter(root, m, -4, 7.5, 5, 1.0, 6.2);
  rooftopClutter(root, m, 4.5, 7.5, 4, 1.0, 6.2);
  const shopB = neonShop(root, m, { x: -3.6, y: 0, z: 6.98, ry: Math.PI, w: 3.0, h: 2.4, neon: 0x6ad0ff });
  ctx.neon.push(shopB);
  const shopB2 = neonShop(root, m, { x: 1.6, y: 0, z: 6.98, ry: Math.PI, w: 2.2, h: 2.4, neon: 0xffd06a });
  ctx.neon.push(shopB2);

  const blockC = buildingBlock(root, m, { x: 7.5, y: 0, z: 2.0, w: 1.0, h: 5.6, d: 10.0, mat: m.building3 });
  rooftopClutter(root, m, 7.5, 2.0, 1.0, 8.0, 5.6);
  const shopC = neonShop(root, m, { x: 6.98, y: 0, z: 5.2, ry: -Math.PI / 2, w: 2.4, h: 2.4, neon: 0xb08aff });
  ctx.neon.push(shopC);

  /* ================= alley ================= */
  // pipes on the store wall
  [[-3.72, 0.055], [-3.72 + 0.14, 0.04]].forEach(([px, r]) => {
    const pipe = mesh(cyl(r, r, 3.4, 8), m.metalDark, px, 1.7, 1.4);
    root.add(pipe);
    const pipe2 = mesh(cyl(r, r, 1.2, 8), m.metalDark, px, 2.6, 2.4);
    pipe2.rotation.x = Math.PI / 2;
    root.add(pipe2);
  });
  // alley wall lamp
  const alleyLamp = mesh(box(0.26, 0.16, 0.2), m.metalDark, -3.72, 2.35, 0.6);
  root.add(alleyLamp);
  const alleyLampLens = mesh(plane(0.22, 0.12), flat(0xffe0b0), -3.6, 2.27, 0.6);
  alleyLampLens.rotation.y = Math.PI / 2;
  root.add(alleyLampLens);
  const alleyGlow = glow(0xffcf94, 2.0, 0.4, 0.75);
  alleyGlow.position.set(-3.35, 2.3, 0.6);
  alleyGlow.rotation.y = Math.PI / 2;
  root.add(alleyGlow);
  ctx.lampLights.push({ glow: alleyGlow, base: 0.4 });
  ctx.spills.push({ x: -4.5, z: 0.6, r: 2.6, color: 0xffa860, i: 0.28 });
  ctx.ripples.push([-4.4, 0.4, 0.9]);

  // AC unit on the alley wall
  const alleyAC = mesh(box(0.72, 0.6, 0.5), m.metal, -3.95, 1.5, -1.3);
  outline(alleyAC, 0.016);
  root.add(alleyAC);
  const alleyACFan = mesh(cyl(0.2, 0.2, 0.05, 14), m.dark, -3.95, 1.5, -1.02);
  alleyACFan.rotation.x = Math.PI / 2;
  root.add(alleyACFan);
  ctx.fans.push({ mesh: alleyACFan, axis: 'z', speed: 3.0 });
  root.add(mesh(box(0.5, 0.06, 0.4), m.metalDark, -3.95, 1.18, -1.3));

  crateStack(root, m, -4.7, -3.2, 0.2);
  crateStack(root, m, -4.5, -4.6, -0.4);

  /* ================= backyard ================= */
  const fencePosts = [];
  for (let x = -5.3; x <= 6.95; x += 0.9) fencePosts.push(x);
  fencePosts.forEach((px) => {
    const post = mesh(box(0.08, 1.7, 0.08), m.metalDark, px, 0.85, -7.85);
    root.add(post);
  });
  [1.4, 0.8, 0.25].forEach((y) => {
    const rail = mesh(box(12.4, 0.06, 0.05), m.metal, 0.8, y, -7.85);
    root.add(rail);
  });
  for (let x = -5.3; x <= 6.9; x += 0.22) {
    const bar = mesh(box(0.022, 1.5, 0.022), m.metal, x, 0.75, -7.85);
    root.add(bar);
  }
  crateStack(root, m, 1.2, -6.4, 0.6);
  crateStack(root, m, -3.0, -5.6, -0.3);
  const pallet = mesh(box(1.2, 0.14, 0.9), toon(C.wood, { rim: 0xb8a080, rimStrength: 0.3 }), 5.2, 0.07, -5.6);
  root.add(pallet);
  const yardLamp = mesh(cyl(0.07, 0.09, 3.0, 8), m.metalDark, 4.6, 1.5, -6.9);
  root.add(yardLamp);
  const yardHead = mesh(box(0.4, 0.14, 0.28), m.metalDark, 4.6, 3.0, -6.9);
  root.add(yardHead);
  const yardGlow = glow(0xcfe4ff, 2.2, 0.28, 0.8);
  yardGlow.position.set(4.6, 2.85, -6.9);
  root.add(yardGlow);
  ctx.spills.push({ x: 4.6, z: -6.9, r: 2.4, color: 0x9fc4ff, i: 0.16 });
  ctx.ripples.push([-1.0, -5.4, 1.3], [4.2, -6.2, 1.1]);

  /* ================= front pavement props ================= */
  const vm1 = vendingMachine(root, m, -4.55, 3.55, 0.02, 0);
  const vm2 = vendingMachine(root, m, -3.5, 3.55, -0.03, 1);
  ctx.vending = [vm1, vm2];
  ctx.spills.push({ x: -4.0, z: 4.1, r: 3.0, color: 0x9fd8ff, i: 0.26 });
  ctx.ripples.push([-4.2, 4.0, 0.7]);
  ctx.dripAnchors.push(new THREE.Vector3(-4.55, 1.94, 4.0), new THREE.Vector3(-3.5, 1.94, 3.98));

  umbrellaStand(root, m, -1.9, 3.42, 0.06);
  trashBin(root, m, 2.35, 3.55, -0.2);
  aFrameSign(root, m, 1.55, 3.6, -0.25);
  bicycle(root, m, 4.15, 0.5, 0.06);
  streetTree(root, m, -6.9, 3.5);

  /* ================= corner: lamp, signal, rails, signs ================= */
  const lamp = streetLamp(root, m, 6.7, 4.9, { h: 5.7, armLen: 1.6, ry: -2.3 });
  ctx.lampLights.push({ light: lamp.light, base: 16, glow: lamp.glow, flicker: 0.04 });
  ctx.spills.push({ x: 5.4, z: 5.4, r: 4.2, color: 0xffd9a8, i: 0.30 });
  ctx.ripples.push([5.5, 5.6, 1.3]);

  const pole1 = utilityPole(root, m, -5.9, 4.2, 7.0, 0);
  const pole2 = utilityPole(root, m, 6.7, 6.7, 7.6, 0.1);
  const wireMat = toon(0x1b2029, { rim: 0x5f7fa8, rimStrength: 0.3 });
  root.add(wire([-5.9, 6.45, 4.2], [6.7, 7.05, 6.7], 1.0, 0.022, wireMat));
  root.add(wire([-5.9, 6.85, 4.2], [6.7, 7.45, 6.7], 1.3, 0.018, wireMat));
  root.add(wire([-5.9, 5.65, 4.2], [-8.0, 6.2, 3.0], 0.6, 0.02, wireMat));
  root.add(wire([6.7, 6.05, 6.7], [8.0, 6.6, 5.6], 0.5, 0.02, wireMat));
  root.add(wire([-5.9, 5.65, 4.2], [6.7, 6.05, 6.7], 1.6, 0.016, wireMat));
  root.add(wire([-3.6, 4.0, 2.9], [-5.4, 4.3, 2.0], 0.35, 0.016, wireMat));
  root.add(wire([-3.6, 4.2, 1.6], [-5.4, 4.5, 0.6], 0.35, 0.014, wireMat));
  root.add(wire([6.7, 6.05, 6.7], [7.0, 6.4, 2.0], 0.7, 0.018, wireMat));

  const signal = trafficSignal(root, m, 6.85, 6.3, Math.PI);
  ctx.traffic = signal;

  guardrail(root, m, 6.35, 5.4, 2.0, Math.PI / 2);
  guardrail(root, m, 5.5, 6.35, 1.9, 0);

  roadSignBoard(root, m, 6.6, 6.9, 0.2);
  const pk = parkingSignBoard(root, m, -5.6, 4.75, 0.15);

  // coin parking ticket machine + wheel stops
  const ticket = mesh(box(0.56, 1.24, 0.44), m.dark, -4.3, 0.62, 4.35);
  outline(ticket, 0.016);
  root.add(ticket);
  const ticketFace = mesh(plane(0.4, 0.3), flat(0x8fd8ff), -4.3, 1.0, 4.58);
  root.add(ticketFace);
  ctx.blinkers.push({ mesh: ticketFace, speed: 0.8, base: 0.85 });
  const ticketGlow = glow(0x8fd8ff, 1.4, 0.22, 0.8);
  ticketGlow.position.set(-4.3, 1.0, 4.7);
  root.add(ticketGlow);
  for (let i = 0; i < 3; i++) {
    const stop = mesh(box(0.9, 0.14, 0.16), m.white, -7.3 + i * 1.15, 0.07, 6.35);
    outline(stop, 0.012);
    root.add(stop);
  }

  /* ================= drains / small details ================= */
  for (let i = 0; i < 4; i++) {
    const grate = mesh(box(0.5, 0.04, 0.22), m.metalDark, -6.0 + i * 3.0, 0.02, 4.55);
    root.add(grate);
  }
  const hatch = mesh(cyl(0.36, 0.36, 0.04, 16), m.metalDark, 1.4, 0.02, 5.5);
  root.add(hatch);

  /* ================= puddle ripples over the street ================= */
  ctx.ripples.push([0.4, 5.9, 1.5], [-1.9, 4.9, 1.1], [5.9, 3.6, 0.8], [2.6, 3.9, 0.8], [-6.6, 3.4, 0.6]);

  /* ================= distant glows ================= */
  ctx.spills.push({ x: 5.6, z: 6.2, r: 2.2, color: 0x7fb4ff, i: 0.12 });

  return root;
}
