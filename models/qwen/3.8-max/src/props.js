// props.js — Japanese street-corner furniture: vending machines, bicycle,
// umbrella stand, trash bins, street lamp, utility poles + wires, road signs,
// guardrail, traffic light, A/C units and a notice board.
import * as THREE from 'three';
import { box, cyl, sphere, plane, at, canvasTexture, roundRect, rand } from './util.js';
import { toon, glow, PALETTE, vendingTexture, noticeTexture, reflectionTexture, bannerTexture } from './materials.js';
import { LAYOUT, addGroundReflection } from './environment.js';

const S = LAYOUT.store;

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */
function wire(p1, p2, sag = 0.6, radius = 0.035) {
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  const geo = new THREE.TubeGeometry(curve, 20, radius, 5, false);
  const m = new THREE.Mesh(geo, toon(0x1b2130, { grad: undefined }));
  m.castShadow = false;
  return m;
}

function makeBicycle(frameColor = 0x4d96ff) {
  const g = new THREE.Group();
  const tire = toon(0x22283a);
  const frame = toon(frameColor);
  const metal = toon(PALETTE.metal);
  const wheelR = 0.34;
  [-0.55, 0.55].forEach((wx) => {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(wheelR, 0.045, 8, 20), tire);
    wheel.rotation.y = Math.PI / 2;
    at(wheel, wx, wheelR, 0);
    g.add(wheel);
    const hub = cyl(0.05, 0.05, 0.06, 8, metal, { outline: false });
    hub.rotation.x = Math.PI / 2; at(hub, wx, wheelR, 0); g.add(hub);
    // spokes
    for (let i = 0; i < 6; i++) {
      const sp = box(0.02, wheelR * 1.8, 0.02, metal, { outline: false });
      sp.rotation.x = (i / 6) * Math.PI;
      at(sp, wx, wheelR, 0); g.add(sp);
    }
  });
  // frame tubes
  const tube = (x1, y1, x2, y2, r = 0.04) => {
    const a = new THREE.Vector3(x1, y1, 0), b = new THREE.Vector3(x2, y2, 0);
    const len = a.distanceTo(b);
    const m = cyl(r, r, len, 8, frame, { outline: false });
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.rotation.z = Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;
    m.rotation.order = 'ZYX';
    return m;
  };
  g.add(tube(-0.55, wheelR, 0.0, 0.62));       // rear stay
  g.add(tube(0.0, 0.62, 0.35, 0.28));          // down tube
  g.add(tube(0.35, 0.28, 0.55, wheelR));       // fork
  g.add(tube(-0.55, wheelR, 0.0, 0.28));       // chain stay
  g.add(tube(0.0, 0.28, 0.0, 0.62));           // seat tube
  g.add(tube(0.0, 0.62, 0.35, 0.72));          // top tube
  g.add(tube(0.35, 0.72, 0.35, 0.28));         // head tube
  // seat
  const seat = box(0.24, 0.06, 0.12, toon(0x22283a), { outline: false }); at(seat, 0.0, 0.68, 0); g.add(seat);
  // handlebar
  const bar = cyl(0.03, 0.03, 0.5, 8, metal, { outline: false }); bar.rotation.x = Math.PI / 2; at(bar, 0.36, 0.76, 0); g.add(bar);
  const stem = box(0.05, 0.12, 0.05, metal, { outline: false }); at(stem, 0.35, 0.72, 0); g.add(stem);
  // front basket
  const basket = box(0.3, 0.2, 0.34, toon(0x8d97a6), { outline: false }); at(basket, 0.42, 0.62, 0); g.add(basket);
  return g;
}

function makeUmbrellaStand() {
  const g = new THREE.Group();
  const stand = cyl(0.28, 0.32, 0.5, 12, toon(0x6a7280));
  at(stand, 0, 0.25, 0); g.add(stand);
  const rim = cyl(0.3, 0.3, 0.06, 12, toon(0x8d97a6), { outline: false }); at(rim, 0, 0.5, 0); g.add(rim);
  const cols = [0xe8524f, 0x2f6fd0, 0x2fbf7a, 0xffd15e, 0xff5ea8];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const ux = Math.cos(a) * 0.12, uz = Math.sin(a) * 0.12;
    const shaft = cyl(0.02, 0.02, 0.95, 6, toon(0x2b2b2b), { outline: false });
    shaft.rotation.z = rand(-0.12, 0.12); shaft.rotation.x = rand(-0.12, 0.12);
    at(shaft, ux, 0.9, uz); g.add(shaft);
    const canopyU = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.24, 8), toon(cols[i]));
    at(canopyU, ux, 1.36, uz); canopyU.rotation.z = rand(-0.1, 0.1); g.add(canopyU);
  }
  return g;
}

function makeTrashBins() {
  const g = new THREE.Group();
  const cols = [0x2fbf7a, 0xe8524f, 0x2f6fd0];
  cols.forEach((c, i) => {
    const bin = cyl(0.2, 0.22, 0.6, 10, toon(c));
    at(bin, i * 0.5 - 0.5, 0.3, 0); g.add(bin);
    const lid = cyl(0.23, 0.23, 0.08, 10, toon(0x2b2b2b), { outline: false });
    at(lid, i * 0.5 - 0.5, 0.62, 0); g.add(lid);
    const slot = box(0.16, 0.03, 0.1, toon(0x111), { outline: false });
    at(slot, i * 0.5 - 0.5, 0.66, 0); g.add(slot);
  });
  const sign = plane(1.4, 0.3, new THREE.MeshBasicMaterial({ map: bannerTexture('ゴミ分別', '#2b2b2b', '#fff') }));
  return g;
}

function makeVendingMachine(baseColor, kind) {
  const g = new THREE.Group();
  const bodyMat = toon(baseColor);
  const body = box(1.0, 1.9, 0.7, bodyMat);
  at(body, 0, 0.95, 0); g.add(body);
  // front panel texture (products)
  const face = plane(0.86, 1.7, new THREE.MeshBasicMaterial({ map: vendingTexture('#' + baseColor.toString(16).padStart(6, '0')) }));
  face.material.toneMapped = false;
  at(face, 0, 1.0, 0.36); g.add(face);
  // glowing top banner
  const banner = box(0.96, 0.24, 0.1, glow(0xffffff, { intensity: 1.4 }));
  at(banner, 0, 1.98, 0.32); g.add(banner);
  // side glow so it lights the sidewalk
  const glowMat = glow(baseColor, { intensity: 0.6, transparent: true, opacity: 0.5 });
  const halo = plane(1.4, 2.2, glowMat);
  halo.material.blending = THREE.AdditiveBlending; halo.material.depthWrite = false;
  at(halo, 0, 1.0, 0.4); g.add(halo);
  g.userData.face = face;
  g.userData.banner = banner;
  return g;
}

function makeStreetLamp() {
  const g = new THREE.Group();
  const poleMat = toon(0x39424f);
  const base = cyl(0.18, 0.24, 0.3, 10, poleMat); at(base, 0, 0.15, 0); g.add(base);
  const pole = cyl(0.09, 0.12, 4.4, 10, poleMat); at(pole, 0, 2.2, 0); g.add(pole);
  const arm = cyl(0.07, 0.07, 1.0, 8, poleMat, { outline: false });
  arm.rotation.z = Math.PI / 2.4; at(arm, 0.35, 4.35, 0); g.add(arm);
  // lamp head
  const head = box(0.5, 0.18, 0.32, toon(0x2b3140)); at(head, 0.72, 4.5, 0); g.add(head);
  const bulb = plane(0.42, 0.24, glow(0xfff0c0, { intensity: 2.0 }));
  bulb.rotation.x = Math.PI / 2; at(bulb, 0.72, 4.4, 0); g.add(bulb);
  const light = new THREE.PointLight(0xffe6b0, 1.8, 11, 2);
  at(light, 0.72, 4.3, 0); light.castShadow = false; g.add(light);
  g.userData.bulb = bulb; g.userData.light = light;
  return g;
}

function makeUtilityPole() {
  const g = new THREE.Group();
  const mat = toon(0x4a4437);
  const pole = cyl(0.13, 0.17, 7.2, 10, mat); at(pole, 0, 3.6, 0); g.add(pole);
  // cross arms
  const arm1 = box(1.8, 0.1, 0.1, mat, { outline: false }); at(arm1, 0, 6.4, 0); g.add(arm1);
  const arm2 = box(1.4, 0.1, 0.1, mat, { outline: false }); at(arm2, 0, 5.7, 0); g.add(arm2);
  // insulators
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const ins = cyl(0.05, 0.05, 0.16, 6, toon(0x9aa3ad), { outline: false });
    at(ins, i * 0.4, 6.5, 0); g.add(ins);
  }
  // transformer
  const tr = cyl(0.18, 0.18, 0.5, 10, toon(0x6a7280)); at(tr, 0.35, 5.0, 0.05); g.add(tr);
  g.userData.armY1 = 6.4; g.userData.armY2 = 5.7;
  return g;
}

function makeTrafficLight(withPed = true) {
  const g = new THREE.Group();
  const poleMat = toon(0x39424f);
  const pole = cyl(0.09, 0.12, 3.4, 10, poleMat); at(pole, 0, 1.7, 0); g.add(pole);
  const arm = cyl(0.07, 0.07, 1.1, 8, poleMat, { outline: false }); arm.rotation.z = Math.PI / 2; at(arm, 0.5, 3.3, 0); g.add(arm);
  // vehicle head (horizontal, 3 lamps)
  const head = box(0.9, 0.3, 0.22, toon(0x22283a)); at(head, 1.0, 3.3, 0); g.add(head);
  const lamps = [];
  const defs = [{ c: 0xff3b30, x: 0.72 }, { c: 0xffcc00, x: 1.0 }, { c: 0x34c759, x: 1.28 }];
  defs.forEach((d) => {
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ color: d.c }));
    lens.material.toneMapped = false;
    at(lens, d.x, 3.3, 0.12);
    g.add(lens);
    const visor = box(0.16, 0.06, 0.06, toon(0x111), { outline: false }); at(visor, d.x, 3.42, 0.14); g.add(visor);
    lamps.push({ mesh: lens, color: new THREE.Color(d.c), dark: new THREE.Color(d.c).multiplyScalar(0.12) });
  });
  g.userData.lamps = lamps;

  if (withPed) {
    // pedestrian signal on the pole
    const phead = box(0.28, 0.42, 0.16, toon(0x22283a)); at(phead, 0.0, 2.6, 0.12); g.add(phead);
    const pred = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
    pred.material.toneMapped = false; at(pred, 0.0, 2.72, 0.21); g.add(pred);
    const pgreen = new THREE.Mesh(new THREE.CircleGeometry(0.07, 12), new THREE.MeshBasicMaterial({ color: 0x34c759 }));
    pgreen.material.toneMapped = false; at(pgreen, 0.0, 2.5, 0.21); g.add(pgreen);
    g.userData.ped = { red: pred, green: pgreen, redC: new THREE.Color(0xff3b30), greenC: new THREE.Color(0x34c759) };
  }
  return g;
}

function makeRoadSign() {
  const g = new THREE.Group();
  const poleMat = toon(0x8d97a6);
  const pole = cyl(0.06, 0.06, 2.6, 8, poleMat); at(pole, 0, 1.3, 0); g.add(pole);
  // round "no parking"-ish sign
  const round = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), toon(0x2f6fd0));
  round.material.side = THREE.DoubleSide; at(round, 0, 2.3, 0); g.add(round);
  const roundInner = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), toon(0xffffff, { grad: undefined }));
  roundInner.material.side = THREE.DoubleSide; at(roundInner, 0, 2.3, 0.01); g.add(roundInner);
  // rectangular direction sign
  const rectTex = canvasTexture(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#2fbf7a'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 44px "Yu Gothic",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('駅前 →', w / 2, h / 2);
  });
  const rect = plane(0.7, 0.28, new THREE.MeshBasicMaterial({ map: rectTex }));
  rect.material.toneMapped = false; at(rect, 0.05, 1.75, 0.02); g.add(rect);
  return g;
}

function makeGuardrail(len, segs) {
  const g = new THREE.Group();
  const mat = toon(0xb9c0c8);
  const postN = segs + 1;
  const step = len / segs;
  for (let i = 0; i < postN; i++) {
    const post = cyl(0.05, 0.05, 0.8, 6, mat, { outline: false });
    at(post, i * step, 0.4, 0); g.add(post);
  }
  // two horizontal bars
  [0.72, 0.42].forEach((y) => {
    const bar = box(len, 0.07, 0.07, mat, { outline: false });
    at(bar, len / 2, y, 0); g.add(bar);
  });
  // mesh-ish vertical thin bars
  for (let i = 0; i <= segs * 3; i++) {
    const v = box(0.025, 0.4, 0.025, toon(0x9aa3ad), { outline: false });
    at(v, i * (len / (segs * 3)), 0.55, 0); g.add(v);
  }
  return g;
}

function makeACUnit() {
  const g = new THREE.Group();
  const body = box(0.9, 0.7, 0.4, toon(0xcfd6dd)); at(body, 0, 0.35, 0); g.add(body);
  const fanRing = cyl(0.28, 0.28, 0.06, 16, toon(0x8d97a6), { outline: false });
  fanRing.rotation.x = Math.PI / 2; at(fanRing, 0, 0.4, 0.21); g.add(fanRing);
  const fan = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const blade = box(0.24, 0.03, 0.06, toon(0x4c5462), { outline: false });
    blade.rotation.z = (i / 3) * Math.PI * 2; at(blade, 0, 0.4, 0.24);
    const pivot = new THREE.Group(); pivot.add(blade); blade.position.set(0.12, 0, 0);
    pivot.position.set(0, 0.4, 0.24);
    fan.add(pivot);
  }
  g.add(fan);
  const vent = box(0.5, 0.3, 0.02, toon(0x9aa3ad), { outline: false }); at(vent, -0.15, 0.3, -0.21); g.add(vent);
  g.userData.fan = fan;
  return g;
}

function makeNoticeBoard() {
  const g = new THREE.Group();
  const leg1 = box(0.08, 1.6, 0.08, toon(0x4a4437)); at(leg1, -0.5, 0.8, 0); g.add(leg1);
  const leg2 = leg1.clone(); at(leg2, 0.5, 0.8, 0); g.add(leg2);
  const frame = box(1.3, 1.0, 0.1, toon(0x6a5237)); at(frame, 0, 1.5, 0); g.add(frame);
  const board = plane(1.15, 0.85, new THREE.MeshBasicMaterial({ map: noticeTexture() }));
  at(board, 0, 1.5, 0.06); g.add(board);
  const roofB = box(1.5, 0.08, 0.3, toon(0x4a4437), { outline: false }); at(roofB, 0, 2.04, 0.05); g.add(roofB);
  return g;
}

/* ------------------------------------------------------------------ *
 * Assemble all props
 * ------------------------------------------------------------------ */
export function buildProps(scene) {
  const group = new THREE.Group();
  group.name = 'props';
  const updaters = [];

  // ---- Vending machines beside the entrance (corner sidewalk) ----
  const vm1 = makeVendingMachine(0x2f6fd0, 0);
  at(vm1, 1.7, 0, -1.55); group.add(vm1);
  const vm2 = makeVendingMachine(0xe8524f, 1);
  at(vm2, 2.75, 0, -1.55); group.add(vm2);
  // their glow on the wet ground
  addGroundReflection(group, { x: 1.7, z: -0.4, w: 1.0, len: 2.6, color: '#6fa8ff', intensity: 0.45 });
  addGroundReflection(group, { x: 2.75, z: -0.4, w: 1.0, len: 2.6, color: '#ff8a7a', intensity: 0.4 });
  updaters.push((dt, t) => {
    vm1.userData.face.material.color.setScalar(0.92 + 0.08 * Math.sin(t * 3.1));
    vm2.userData.face.material.color.setScalar(0.9 + 0.1 * Math.sin(t * 2.3 + 1));
  });

  // ---- Trash bins next to the vending machines ----
  const bins = makeTrashBins();
  at(bins, 1.25, 0, -1.5); bins.rotation.y = Math.PI / 2; group.add(bins);

  // ---- Umbrella stand by the door ----
  const umb = makeUmbrellaStand();
  at(umb, 0.55, 0, -1.15); group.add(umb);

  // ---- Bicycles parked at the corner guardrail ----
  const bike1 = makeBicycle(0x4d96ff);
  at(bike1, 2.5, 0, -3.4); bike1.rotation.y = Math.PI / 2 + 0.05; group.add(bike1);
  const bike2 = makeBicycle(0xff6b6b);
  at(bike2, 2.5, 0, -4.5); bike2.rotation.y = Math.PI / 2 - 0.06; group.add(bike2);

  // ---- Street lamp on the corner ----
  const lamp = makeStreetLamp();
  at(lamp, 2.7, 0, -0.4); lamp.rotation.y = -Math.PI / 2; group.add(lamp);
  addGroundReflection(group, { x: 2.7, z: 0.6, w: 1.4, len: 3.2, color: '#ffe6b0', intensity: 0.5 });
  updaters.push((dt, t) => {
    const f = 0.85 + 0.15 * Math.sin(t * 7.0) + (Math.random() > 0.995 ? -0.3 : 0);
    lamp.userData.light.intensity = 1.8 * Math.max(0.3, f);
    lamp.userData.bulb.material.color.setScalar(Math.max(0.4, f));
  });

  // ---- Utility poles + wires ----
  const pole1 = makeUtilityPole(); at(pole1, 2.95, 0, -6.4); group.add(pole1);
  const pole2 = makeUtilityPole(); at(pole2, 8.2, 0, 3.0); pole2.rotation.y = Math.PI / 2; group.add(pole2);
  const pole3 = makeUtilityPole(); at(pole3, -8.5, 0, 4.5); group.add(pole3);
  // wires between poles (world-space catenaries)
  const wirePairs = [
    [new THREE.Vector3(2.95, 6.4, -6.4), new THREE.Vector3(8.2, 6.4, 3.0), 0.8],
    [new THREE.Vector3(2.95, 5.7, -6.4), new THREE.Vector3(8.2, 5.7, 3.0), 0.9],
    [new THREE.Vector3(2.95, 6.4, -6.4), new THREE.Vector3(-8.5, 6.4, 4.5), 1.2],
    [new THREE.Vector3(2.95, 5.7, -6.4), new THREE.Vector3(-8.5, 5.7, 4.5), 1.3],
  ];
  wirePairs.forEach(([a, b, sag]) => group.add(wire(a, b, sag)));

  // ---- Traffic light at the corner (lamps face the viewer / down the road) ----
  const tl = makeTrafficLight(true);
  at(tl, 2.5, 0, 0.5); tl.rotation.y = 0;
  group.add(tl);
  // distant faint traffic light across the street
  const tl2 = makeTrafficLight(false);
  at(tl2, 5.0, 0, 5.6); tl2.rotation.y = 0; tl2.scale.setScalar(0.85);
  group.add(tl2);

  let tlPhase = 0;
  updaters.push((dt, t) => {
    const cycle = (t % 10);
    let state; // 0 green,1 yellow,2 red
    if (cycle < 5) state = 0; else if (cycle < 6.5) state = 1; else state = 2;
    const order = { 0: 2, 1: 1, 2: 0 }; // index into lamps for green/yellow/red
    tl.userData.lamps.forEach((L, i) => {
      const on = (i === order[state]);
      L.mesh.material.color.copy(on ? L.color : L.dark);
    });
    // pedestrian signal: red while cars green, green while cars red
    const ped = tl.userData.ped;
    const pedGo = (state === 2);
    ped.red.material.color.copy(pedGo ? new THREE.Color(0x33100c) : ped.redC);
    ped.green.material.color.copy(pedGo ? ped.greenC : new THREE.Color(0x0d2a15));
    // distant light faint, offset cycle
    const st2 = ((t + 3) % 10) < 5 ? 0 : (((t + 3) % 10) < 6.5 ? 1 : 2);
    const ord2 = { 0: 2, 1: 1, 2: 0 };
    tl2.userData.lamps.forEach((L, i) => {
      const on = (i === ord2[st2]);
      L.mesh.material.color.copy(on ? L.color.clone().multiplyScalar(0.6) : L.dark);
    });
  });

  // ---- Road sign at the corner ----
  const rs = makeRoadSign(); at(rs, 3.15, 0, -0.9); rs.rotation.y = -Math.PI / 4; group.add(rs);

  // ---- Guardrails framing the corner sidewalk (gap left at the entrance) ----
  const grFront = makeGuardrail(5.6, 9);
  at(grFront, -7.0, 0, -0.35); group.add(grFront);
  const grSide = makeGuardrail(6.0, 9);
  grSide.rotation.y = -Math.PI / 2;
  at(grSide, 2.78, 0, -6.6); group.add(grSide);

  // ---- A/C outdoor units on the store side wall ----
  const ac1 = makeACUnit(); at(ac1, 1.45, 0, -4.2); ac1.rotation.y = Math.PI / 2; group.add(ac1);
  const ac2 = makeACUnit(); at(ac2, 1.45, 0, -5.6); ac2.rotation.y = Math.PI / 2; group.add(ac2);
  updaters.push((dt, t) => { ac1.userData.fan.rotation.z += dt * 6; ac2.userData.fan.rotation.z += dt * 5; });

  // ---- Notice / poster board on the sidewalk ----
  const nb = makeNoticeBoard(); at(nb, -6.2, 0, -1.4); nb.rotation.y = 0.1; group.add(nb);

  // ---- Extra: a small wall-mounted poster on the store right wall ----
  const wallPoster = plane(1.0, 1.4, new THREE.MeshBasicMaterial({ map: bannerTexture('24時間', '#2f6fd0', '#fff') }));
  wallPoster.material.toneMapped = false;
  wallPoster.rotation.y = Math.PI / 2;
  at(wallPoster, S.maxX + 0.12, 2.0, -3.2); group.add(wallPoster);

  // ---- Distant building hint at the back-right corner (depth) ----
  const bg = box(3.5, 5.0, 3.0, toon(0x1a2130, { grad: undefined }));
  at(bg, 8.6, 2.5, -7.5); group.add(bg);
  // a few lit windows
  const winMat = glow(0xffd9a0, { intensity: 0.9 });
  for (let i = 0; i < 8; i++) {
    const wx = 8.6 + rand(-1.2, 1.2), wy = rand(1, 4.2), wz = -6.02;
    const w = plane(0.35, 0.4, winMat.clone());
    at(w, wx, wy, wz); group.add(w);
    const m = w.material;
    updaters.push((dt, t) => { m.color.setScalar(0.5 + 0.5 * (Math.sin(t * 0.7 + i) > -0.7 ? 1 : 0.2)); });
  }

  scene.add(group);

  function update(dt, t) { for (const u of updaters) u(dt, t); }
  return { group, update };
}
