import * as THREE from 'three';
import { L } from './layout.js';
import { PAL, toon, flat, glow } from '../core/materials.js';
import { box, cyl, torus, group, roundedBox, rand, pick } from '../core/utils.js';
import {
  vendingFrontTexture, bulletinTexture, roadSignTexture, glowSprite, posterTexture,
} from '../core/textures.js';
import { markReflect } from '../core/reflection.js';

/* ------------------------------------------------------------------ *
 *  Everything on the pavement: vending machine, bicycles, umbrella
 *  stand, bins, street lamp, utility pole + catenary wires, road signs,
 *  guardrail, notice board, kerb clutter and the far traffic signal.
 * ------------------------------------------------------------------ */

/* --------------------------- wire helper ------------------------- */
function wire(from, to, sag, radius, material, seg = 18) {
  const pts = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const p = new THREE.Vector3().lerpVectors(from, to, t);
    p.y -= Math.sin(t * Math.PI) * sag;
    pts.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, 4, false), material);
  m.userData.noOutline = true;
  m.userData.noReflect = true;
  m.castShadow = false;
  return m;
}

/* ======================== vending machine ======================== */
function vendingMachine() {
  const g = group({ name: 'vending-machine' });
  const shell = toon(PAL.vendingBody, {});
  const red = toon(PAL.vendingRed, {});
  const glass = new THREE.MeshBasicMaterial({
    color: 0xd8f0ff, transparent: true, opacity: 0.16, depthWrite: false,
  });

  const W = 1.18, H = 1.98, D = 0.76;
  g.add(roundedBox(W, H, D, shell, { y: H / 2, r: 0.06 }));

  // illuminated front panel
  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.1, H - 0.34),
    new THREE.MeshBasicMaterial({ map: vendingFrontTexture(384, 768), color: 0xa8aca4 })
  );
  front.position.set(0, H / 2 + 0.04, D / 2 + 0.005);
  front.userData.noOutline = true;
  g.add(front);
  // interior spill so the products read as lit
  g.add(box(W - 0.14, H - 0.4, 0.02, glow(0xfff4dc, 0.72), {
    y: H / 2 + 0.04, z: D / 2 - 0.01, noOutline: true,
  }));

  // header sign box
  g.add(box(W + 0.04, 0.3, D + 0.04, red, { y: H + 0.14, r: 0.04 }));
  const headTex = posterTexture(9, 384, 128);
  const head = new THREE.Mesh(
    new THREE.PlaneGeometry(W - 0.06, 0.24),
    new THREE.MeshBasicMaterial({ map: headTex })
  );
  head.position.set(0, H + 0.14, D / 2 + 0.03);
  head.userData.noOutline = true;
  g.add(head);
  const headB = head.clone();
  headB.position.z = -D / 2 - 0.03;
  headB.rotation.y = Math.PI;
  g.add(headB);

  // delivery flap + tray
  g.add(box(W - 0.24, 0.26, 0.1, toon(0x2f3644, {}), { y: 0.34, z: D / 2 + 0.01 }));
  g.add(box(W - 0.2, 0.05, 0.22, toon(0x8d939c, {}), { y: 0.2, z: D / 2 + 0.1 }));

  // glow that spills onto the wet pavement
  const spill = new THREE.PointLight(0xffeecb, 17, 6.0, 2.0);
  spill.position.set(0, 1.5, D / 2 + 0.5);
  g.add(spill);

  // soft halo billboard
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowSprite('#ffeecb', 128), color: 0xffeecb, transparent: true,
    opacity: 0.17, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  halo.scale.set(2.6, 3.0, 1);
  halo.position.set(0, 1.25, D / 2 + 0.25);
  halo.userData.noReflect = true;
  g.add(halo);

  // feet
  [-1, 1].forEach((s) => {
    g.add(box(0.1, 0.09, 0.1, toon(0x4b525f, {}), {
      x: s * (W / 2 - 0.12), y: 0.045, z: D / 2 - 0.12,
    }));
  });
  return g;
}

/* ============================= bicycle =========================== */
function bicycle(color = 0x2f4a6d, seed = 0) {
  const g = group({ name: 'bicycle' });
  const frameMat = toon(color, {});
  const metal = toon(0x9aa2ae, {});
  const tyre = toon(0x24272e, {});
  const R = 0.31;

  const wheel = (x) => {
    const w = group({ x, y: R });
    w.add(torus(R, 0.028, 6, 20, tyre, {}));
    w.add(torus(R - 0.045, 0.012, 5, 18, metal, { noOutline: true }));
    for (let i = 0; i < 8; i++) {
      w.add(box(0.008, R * 1.7, 0.008, metal, {
        rz: (i / 8) * Math.PI, noOutline: true,
      }));
    }
    w.add(cyl(0.035, 0.035, 0.07, 8, metal, { rz: Math.PI / 2 }));
    return w;
  };
  g.add(wheel(-0.52));
  g.add(wheel(0.52));

  // frame
  const bar = (x1, y1, x2, y2, t, m) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const m2 = new THREE.Mesh(new THREE.BoxGeometry(t, len, t), m);
    m2.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
    m2.rotation.z = Math.atan2(-(x2 - x1), y2 - y1);
    g.add(m2);
  };
  bar(-0.52, R, -0.08, R + 0.34, 0.035, frameMat);
  bar(-0.08, R + 0.34, 0.32, R + 0.5, 0.032, frameMat);
  bar(-0.08, R + 0.34, -0.14, R + 0.06, 0.032, frameMat);
  bar(-0.14, R + 0.06, -0.52, R, 0.03, frameMat);
  bar(0.32, R + 0.5, 0.52, R, 0.03, frameMat);
  bar(-0.14, R + 0.06, 0.28, R + 0.46, 0.026, frameMat);

  // handlebar + saddle + basket + rack
  g.add(cyl(0.02, 0.02, 0.44, 6, metal, { x: 0.32, y: R + 0.56, rz: Math.PI / 2 }));
  g.add(roundedBox(0.24, 0.06, 0.11, toon(0x2b2f36, {}), {
    x: -0.14, y: R + 0.5, z: 0, r: 0.03,
  }));
  g.add(box(0.22, 0.2, 0.2, metal, { x: 0.44, y: R + 0.52, z: 0.2, noOutline: true }));
  g.add(box(0.2, 0.02, 0.18, toon(0xdfe3e8, {}), { x: 0.44, y: R + 0.44, z: 0.2, noOutline: true }));
  g.add(box(0.5, 0.03, 0.16, metal, { x: -0.5, y: R + 0.42, z: 0, noOutline: true }));
  // pedal crank
  g.add(cyl(0.018, 0.018, 0.16, 5, metal, { x: -0.08, y: R + 0.1, rz: Math.PI / 2 }));

  g.rotation.y = rand(-0.25, 0.25);
  g.rotation.z = seed % 2 === 0 ? 0.11 : -0.1;
  g.position.y = 0.0;
  return g;
}

/* ========================== umbrella stand ======================== */
function umbrellaStand() {
  const g = group({ name: 'umbrella-stand' });
  const metal = toon(0x7c8494, {});
  g.add(box(0.56, 0.5, 0.34, metal, { y: 0.25 }));
  g.add(box(0.6, 0.05, 0.38, toon(0x9aa2ae, {}), { y: 0.51 }));
  g.add(box(0.2, 0.06, 0.02, flat(0xfff4dd), { y: 0.42, z: 0.18, noOutline: true }));
  const colors = [0x2b4f8a, 0x8a2b3f, 0x2f6b52, 0x6b4f8a, 0xc8a03a, 0x333a48];
  for (let i = 0; i < 5; i++) {
    const x = rand(-0.18, 0.18);
    const z = rand(-0.09, 0.09);
    const lean = rand(-0.16, 0.16);
    const h = rand(0.72, 0.92);
    const col = pick(colors);
    const u = group({ x, z, ry: rand(0, 3.14), rz: lean });
    u.add(cyl(0.028, 0.028, h, 6, toon(0x2a2e38, {}), { y: 0.5 + h / 2 }));
    // folded canopy
    u.add(cyl(0.062, 0.042, h * 0.6, 8, toon(col, {}), { y: 0.5 + h * 0.4 }));
    u.add(cyl(0.048, 0.03, h * 0.18, 8, toon(col, {}), { y: 0.5 + h * 0.78 }));
    // handle hook
    const hook = torus(0.055, 0.016, 5, 10, toon(0x7a5a3a, {}), {
      y: 0.5 + h + 0.04, rx: Math.PI / 2, noOutline: true,
    });
    u.add(hook);
    u.add(cyl(0.02, 0.02, 0.07, 6, toon(0x7a5a3a, {}), { y: 0.5 + h - 0.02 }));
    g.add(u);
  }
  return g;
}

/* ============================ trash bins ========================= */
function trashBin(kind = 0) {
  const g = group({ name: 'trash-bin' });
  const body = toon([0x3f7a5c, 0x3f5f8a, 0x8a6a3f][kind % 3], {});
  const lid = toon([0x2c5a44, 0x2c4463, 0x63492c][kind % 3], {});
  g.add(roundedBox(0.62, 0.86, 0.6, body, { y: 0.43, r: 0.05 }));
  const top = roundedBox(0.66, 0.1, 0.64, lid, { y: 0.9, r: 0.04 });
  g.add(top);
  g.add(box(0.34, 0.16, 0.02, flat(0xf3efe2), { y: 0.62, z: 0.31, noOutline: true }));
  g.add(box(0.2, 0.08, 0.06, toon(0x2b3038, {}), { y: 0.9, z: 0.33 }));
  [-1, 1].forEach((s) => {
    g.add(cyl(0.04, 0.04, 0.06, 6, toon(0x2b3038, {}), {
      x: s * 0.24, y: 0.03, z: 0.24, rz: Math.PI / 2,
    }));
  });
  return g;
}

/* ============================ street lamp ======================== */
function streetLamp() {
  const g = group({ name: 'street-lamp' });
  const H = 5.4;
  const metal = toon(0x5d6470, {});
  g.add(cyl(0.09, 0.13, H, 10, metal, { y: H / 2 }));
  g.add(cyl(0.2, 0.24, 0.26, 10, toon(0x5c6373, {}), { y: 0.13 }));
  // curved arm
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, H - 0.1, 0),
    new THREE.Vector3(0, H + 0.16, 0.28),
    new THREE.Vector3(0, H - 0.05, 0.72),
    new THREE.Vector3(0, H - 0.34, 1.02),
  ]);
  const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.055, 6, false), metal);
  g.add(arm);
  // lamp head
  const head = group({ x: 0, y: H - 0.42, z: 1.02 });
  head.add(roundedBox(0.36, 0.16, 0.62, toon(0x6b7280, {}), { y: 0.08, r: 0.06 }));
  head.add(box(0.3, 0.06, 0.54, glow(0xffdca6, 1.5), { y: -0.01, noOutline: true }));
  head.add(box(0.34, 0.03, 0.58, toon(0x4d5462, {}), { y: 0.17, noOutline: true }));
  g.add(head);

  const light = new THREE.PointLight(0xffd6a0, 60, 14, 2.0);
  light.position.set(0, H - 0.6, 1.02);
  g.add(light);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowSprite('#ffd9a4', 128), color: 0xffd9a4, transparent: true,
    opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  halo.scale.set(2.6, 2.6, 1);
  halo.position.set(0, H - 0.5, 1.02);
  halo.userData.noReflect = true;
  g.add(halo);

  // banner sign hanging from the pole (常见の条例広告)
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 1.1),
    new THREE.MeshBasicMaterial({ map: posterTexture(5, 256, 768) })
  );
  banner.position.set(0.11, H - 1.5, 0);
  banner.rotation.y = 0.2;
  banner.userData.noOutline = true;
  g.add(banner);
  g.add(box(0.05, 1.2, 0.04, toon(0x5c6373, {}), { x: 0.11, y: H - 1.5 }));

  return { group: g, light, head };
}

/* ========================== utility pole ======================== */
function utilityPole() {
  const g = group({ name: 'utility-pole' });
  const H = 8.6;
  const concrete = toon(0x596069, {});
  const metal = toon(0x6d7482, {});
  g.add(cyl(0.13, 0.19, H, 10, concrete, { y: H / 2 }));
  g.add(cyl(0.28, 0.3, 0.35, 10, toon(0x7f8590, {}), { y: 0.17 }));
  // cross arms
  const arms = [
    { y: H - 0.5, w: 1.7 },
    { y: H - 1.25, w: 1.35 },
    { y: H - 2.0, w: 1.0 },
  ];
  arms.forEach((a) => {
    g.add(box(a.w, 0.09, 0.11, toon(0x6f7681, {}), { y: a.y, noOutline: true }));
    const n = Math.round(a.w / 0.34);
    for (let i = 0; i <= n; i++) {
      const x = -a.w / 2 + (a.w * i) / n;
      g.add(cyl(0.045, 0.055, 0.13, 6, toon(0xd8dce2, {}), { x, y: a.y + 0.11, noOutline: true }));
      g.add(cyl(0.028, 0.028, 0.06, 5, metal, { x, y: a.y + 0.2, noOutline: true }));
    }
  });
  // transformer can
  g.add(cyl(0.24, 0.24, 0.72, 10, toon(0x8f959e, {}), { x: 0.26, y: H - 3.1 }));
  g.add(cyl(0.26, 0.26, 0.06, 10, toon(0x757c88, {}), { x: 0.26, y: H - 3.46, noOutline: true }));
  g.add(box(0.1, 0.1, 0.1, toon(0xd94f2b, {}), { x: 0.26, y: H - 2.68, noOutline: true }));
  // stay wires + a small step bolt ladder
  g.add(box(0.04, 0.04, 0.7, metal, { x: 0.2, y: 3.0, z: 0.2, rx: 0.6, noOutline: true }));
  for (let i = 0; i < 9; i++) {
    g.add(box(0.16, 0.02, 0.02, metal, { y: 3.0 + i * 0.34, noOutline: true }));
  }
  return { group: g, arms, H };
}

/* ============================ guardrail ========================= */
function guardrail(len = 3.2, posts = 3) {
  const g = group({ name: 'guardrail' });
  const white = toon(0xc2c7ce, {});
  const steel = toon(0x9aa2ae, {});
  g.add(box(len, 0.1, 0.06, white, { y: 0.78, noOutline: true }));
  g.add(box(len, 0.1, 0.06, white, { y: 0.52, noOutline: true }));
  for (let i = 0; i < posts; i++) {
    const x = -len / 2 + 0.1 + (i * (len - 0.2)) / (posts - 1);
    g.add(box(0.08, 0.92, 0.08, steel, { x, y: 0.46 }));
    g.add(box(0.16, 0.05, 0.16, steel, { x, y: 0.025 }));
  }
  // reflective bands
  for (let i = 0; i < posts; i++) {
    const x = -len / 2 + 0.1 + (i * (len - 0.2)) / (posts - 1);
    g.add(box(0.085, 0.09, 0.065, glow(0xffb03a, 1.3), { x, y: 0.66, noOutline: true }));
  }
  return g;
}

/* ========================= notice board ========================= */
function noticeBoard() {
  const g = group({ name: 'notice-board' });
  const metal = toon(0x6f7787, {});
  g.add(box(0.08, 1.5, 0.08, metal, { x: -0.6, y: 0.75 }));
  g.add(box(0.08, 1.5, 0.08, metal, { x: 0.6, y: 0.75 }));
  g.add(box(0.08, 1.1, 0.08, metal, { x: -0.6, y: 0.55, noOutline: true }));
  g.add(box(0.08, 1.1, 0.08, metal, { x: 0.6, y: 0.55, noOutline: true }));
  g.add(roundedBox(1.34, 1.0, 0.09, toon(0x39435a, {}), { y: 1.0, r: 0.04 }));
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.16, 0.84),
    new THREE.MeshBasicMaterial({ map: bulletinTexture(512, 384) })
  );
  face.position.set(0, 1.0, 0.05);
  face.userData.noOutline = true;
  g.add(face);
  // little canopy so rain doesn't destroy the notices
  g.add(box(1.42, 0.06, 0.3, toon(0x4a5262, {}), { y: 1.54, z: 0.08, rx: -0.16 }));
  // sticker on the frame
  const st = new THREE.Mesh(
    new THREE.PlaneGeometry(0.3, 0.3),
    new THREE.MeshBasicMaterial({ map: posterTexture(2, 128, 128) })
  );
  st.position.set(0.55, 0.62, 0.05);
  st.userData.noOutline = true;
  g.add(st);
  return g;
}

/* =========================== kei car ============================ */
function keiCar() {
  const g = group({ name: 'kei-car' });
  const body = toon(0xd2d7de, {});
  const bodyDark = toon(0x9aa0aa, {});
  const win = new THREE.MeshBasicMaterial({
    color: 0x33445a, transparent: true, opacity: 0.72,
  });

  const Lw = 3.1, Wd = 1.42;
  g.add(roundedBox(Wd, 0.62, Lw, body, { y: 0.66, r: 0.14 }));
  g.add(roundedBox(Wd - 0.14, 0.56, Lw - 1.25, body, { y: 1.22, r: 0.16 }));
  // greenhouse glass
  g.add(box(Wd - 0.1, 0.42, Lw - 1.45, win, { y: 1.24, noOutline: true }));
  g.add(box(Wd - 0.16, 0.06, Lw - 1.3, bodyDark, { y: 1.44, noOutline: true }));
  // wheels
  [[-1.02, 0.28], [1.02, 0.28]].forEach(([x, z]) => {
    [-1, 1].forEach((s) => {
      g.add(cyl(0.28, 0.28, 0.2, 12, toon(0x22252b, {}), {
        x: s * (Wd / 2 - 0.03), y: 0.28, z, rz: Math.PI / 2,
      }));
      g.add(cyl(0.15, 0.15, 0.21, 10, toon(0xb8bcc4, {}), {
        x: s * (Wd / 2 - 0.03), y: 0.28, z, rz: Math.PI / 2, noOutline: true,
      }));
    });
  });
  // lamps + mirrors + trim
  [-1, 1].forEach((s) => {
    g.add(box(0.1, 0.12, 0.3, toon(0xf7f2e0, {}), { x: s * (Wd / 2 - 0.14), y: 0.72, z: Lw / 2 - 0.05 }));
    g.add(box(0.09, 0.12, 0.26, toon(0xd9604f, {}), { x: s * (Wd / 2 - 0.14), y: 0.74, z: -Lw / 2 + 0.05 }));
    g.add(roundedBox(0.06, 0.1, 0.14, bodyDark, { x: s * (Wd / 2 + 0.02), y: 1.24, z: Lw / 2 - 0.72, r: 0.03 }));
  });
  g.add(box(Wd - 0.06, 0.07, 0.1, bodyDark, { y: 0.42, z: Lw / 2 - 0.02, noOutline: true }));
  g.add(box(Wd - 0.06, 0.07, 0.1, bodyDark, { y: 0.42, z: -Lw / 2 + 0.02, noOutline: true }));
  // licence plate
  g.add(box(0.34, 0.14, 0.02, flat(0xf3f0e4), { y: 0.52, z: Lw / 2 + 0.01, noOutline: true }));
  return g;
}

/* ========================= traffic signal ======================== */
function trafficSignal() {
  const g = group({ name: 'traffic-signal' });
  const H = 4.2;
  const metal = toon(0x545c6c, {});
  g.add(cyl(0.08, 0.11, H, 8, metal, { y: H / 2 }));
  g.add(cyl(0.2, 0.22, 0.2, 8, toon(0x3f4655, {}), { y: 0.1 }));
  const head = group({ y: H - 0.5 });
  head.add(roundedBox(0.3, 0.82, 0.26, toon(0x2c3340, {}), { y: -0.2, r: 0.06 }));
  const lamps = [];
  const colors = [0xff4b3a, 0xffc23a, 0x4ce07a];
  const lampMats = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.MeshBasicMaterial({ color: colors[i] });
    lampMats.push(m);
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.095, 14), m);
    lamp.position.set(0, 0.06 - i * 0.26, 0.14);
    lamp.userData.noOutline = true;
    head.add(lamp);
    lamps.push(lamp);
    head.add(cyl(0.105, 0.115, 0.05, 10, toon(0x1e232c, {}), {
      y: 0.06 - i * 0.26, z: 0.115, rx: Math.PI / 2, noOutline: true,
    }));
    // tiny bloom sprite so the aspect reads at a distance
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowSprite('#ffffff', 64), color: colors[i], transparent: true,
      opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
    }));
    sp.scale.set(0.5, 0.5, 1);
    sp.position.set(0, 0.06 - i * 0.26, 0.18);
    sp.userData.noReflect = true;
    head.add(sp);
  }
  // hood visor
  head.add(box(0.3, 0.06, 0.12, toon(0x2c3340, {}), { y: 0.4, z: 0.06 }));
  g.add(head);

  // pedestrian box lower down
  const ped = group({ x: 0.16, y: 2.1, z: 0.02 });
  ped.add(roundedBox(0.24, 0.34, 0.18, toon(0x2c3340, {}), { r: 0.04 }));
  const pedMat = new THREE.MeshBasicMaterial({ color: 0x7fe3ff });
  const pedFace = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.24), pedMat);
  pedFace.position.z = 0.095;
  pedFace.userData.noOutline = true;
  ped.add(pedFace);
  g.add(ped);

  const light = new THREE.PointLight(0xff8a6a, 6.0, 6, 2.0);
  light.position.set(0, H - 0.8, 0.4);
  g.add(light);

  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowSprite('#ffb090', 64), color: 0xffffff, transparent: true,
    opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  halo.scale.set(1.4, 1.4, 1);
  halo.position.set(0, H - 0.8, 0.3);
  halo.userData.noReflect = true;
  g.add(halo);

  // gentle cycle: mostly red, brief green, amber in between
  const phase = { t: 0, i: 0 };
  function update(dt) {
    phase.t += dt;
    const cycle = [0, 1, 1, 2]; // red, green, green, amber
    const step = Math.floor(phase.t / 7) % cycle.length;
    const want = cycle[step];
    if (want !== phase.i) {
      phase.i = want;
      lampMats.forEach((m, i) => {
        m.color.setHex(i === want ? colors[i] : 0x0d1016);
        m.color.multiplyScalar(i === want ? 1.35 : 1);
      });
      pedMat.color.setHex(want === 0 ? 0x7fe3ff : 0x1b2a33);
      light.color.setHex(colors[want]);
      light.intensity = want === 0 ? 6.0 : 4.2;
    }
  }
  update(0.001);

  return { group: g, update, lamps, lampMats };
}

/* ================================================================= *
 *  Assemble everything on the pavement
 * ================================================================= */
export function buildProps(ctx) {
  const root = new THREE.Group();
  root.name = 'props';
  const F = new THREE.Group();
  F.position.y = L.walkTop;
  root.add(F);

  /* --- vending machine against the shop's east wall ------------- */
  const vend = vendingMachine();
  vend.position.set(3.72, 0, -3.3);
  vend.rotation.y = Math.PI / 2;
  F.add(vend);
  ctx.vending = vend;

  const vend2 = vendingMachine();
  vend2.position.set(3.72, 0, -4.5);
  vend2.rotation.y = Math.PI / 2;
  vend2.scale.set(0.94, 0.94, 0.94);
  F.add(vend2);

  // recycling crate next to the machines
  const crate = roundedBox(0.7, 0.9, 0.62, toon(0x4d5b6c, {}), {
    x: 3.68, y: 0.45, z: -2.05, r: 0.05,
  });
  F.add(crate);
  F.add(box(0.7, 0.08, 0.62, toon(0x39445a, {}), { x: 3.68, y: 0.93, z: -2.05 }));
  for (let i = 0; i < 4; i++) {
    F.add(cyl(0.055, 0.055, 0.5, 8, toon(pick([0x8a3b3b, 0x3b6a8a, 0x3b8a5a, 0xd8d2c0]), {}), {
      x: 3.68 + rand(-0.18, 0.18), y: 1.18, z: -2.05 + rand(-0.14, 0.14),
      rz: rand(-0.14, 0.14), noOutline: true,
    }));
  }

  /* --- bicycles leaning by the shopfront ------------------------ */
  const bikeColors = [0x2f4a6d, 0x7a2f3f, 0x2f6b52, 0x3b3f4a];
  for (let i = 0; i < 3; i++) {
    const b = bicycle(bikeColors[i], i);
    b.position.set(-2.85 + i * 0.42, 0.34, 3.42);
    b.rotation.y = Math.PI / 2 + rand(-0.1, 0.1);
    F.add(b);
  }
  // bike rack rail
  const rack = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    rack.add(torus(0.22, 0.028, 6, 14, toon(0x8f97a3, {}), {
      x: -2.85 + i * 0.42, y: 0.28, z: 3.42, rx: Math.PI / 2,
    }));
  }
  rack.add(box(1.5, 0.05, 0.05, toon(0x8f97a3, {}), { x: -1.85, y: 0.28, z: 3.42, noOutline: true }));
  F.add(rack);

  /* --- umbrella stand + trash bins by the door ------------------- */
  const stand = umbrellaStand();
  stand.position.set(1.28, 0, 3.62);
  stand.rotation.y = -0.25;
  F.add(stand);

  for (let i = 0; i < 2; i++) {
    const b = trashBin(i);
    b.position.set(2.62, 0, 3.9 + i * 0.72);
    b.rotation.y = -0.35 + i * 0.2;
    F.add(b);
  }
  // cigarette-butt bin — the yellow konbini icon
  const buttBin = group({ x: -2.3, z: 3.4 });
  buttBin.add(cyl(0.11, 0.13, 0.62, 10, toon(0xf0b429, {}), { y: 0.31 }));
  buttBin.add(cyl(0.115, 0.115, 0.06, 10, toon(0x2b3038, {}), { y: 0.64 }));
  buttBin.add(box(0.1, 0.3, 0.02, flat(0x2b3038), { y: 0.36, z: 0.11, noOutline: true }));
  buttBin.add(cyl(0.03, 0.03, 1.5, 6, toon(0x8f97a3, {}), { y: 0.75, x: 0.12, rz: 0.06, noOutline: true }));
  F.add(buttBin);

  /* --- street lamp at the corner ------------------------------- */
  const lamp = streetLamp();
  lamp.group.position.set(L.lamp.x, 0, L.lamp.z);
  lamp.group.rotation.y = Math.PI / 2;
  F.add(lamp.group);
  ctx.streetLamp = lamp;

  /* --- utility pole + catenary wires ---------------------------- */
  const pole = utilityPole();
  pole.group.position.set(L.pole.x, 0, L.pole.z);
  pole.group.rotation.y = 0.4;
  F.add(pole.group);
  ctx.pole = pole;

  const wireMat = toon(0x39404e, {});
  const anchor = new THREE.Vector3(L.pole.x, 0, L.pole.z);
  const rot = pole.group.rotation.y;
  const farPole = { x: 11.2, z: 10.3, h: 6.2 };
  pole.arms.forEach((a, k) => {
    const s = k % 2 ? -1 : 1;
    const dx = Math.cos(rot) * 0.62 * s;
    const dz = -Math.sin(rot) * 0.62 * s;
    const from = new THREE.Vector3(anchor.x + dx, a.y + 0.06, anchor.z + dz);
    // back toward the backdrop blocks
    F.add(wire(from, new THREE.Vector3(-4.5 + k * 2.4, pole.H - 1.5 + k * 0.35, -7.25),
      0.8 + k * 0.12, 0.012, wireMat, 16));
    // forward to the pole at the far corner
    F.add(wire(from, new THREE.Vector3(farPole.x - 0.4, farPole.h - 0.9 - k * 0.3, farPole.z),
      1.05 + k * 0.18, 0.012, wireMat, 16));
  });

  /* --- second, plainer pole out at the far corner --------------- */
  const far = utilityPole();
  far.H = 6.9;
  far.group.scale.setScalar(0.7);
  far.group.position.set(11.2, 0, 10.3);
  far.group.rotation.y = 1.1;
  F.add(far.group);

  /* --- road signs on the pole ----------------------------------- */
  const signGroup = group({ x: L.pole.x, y: 0, z: L.pole.z });
  const wardSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.29),
    new THREE.MeshBasicMaterial({ map: roadSignTexture(512, 160) })
  );
  wardSign.position.set(-0.42, 3.9, 0.16);
  wardSign.rotation.y = 0.4 + Math.PI / 2;
  wardSign.userData.noOutline = true;
  signGroup.add(wardSign);
  signGroup.add(box(0.96, 0.33, 0.05, toon(0x2c3340, {}), {
    x: -0.43, y: 3.9, z: 0.13, ry: 0.4 + Math.PI / 2,
  }));
  const wardSignB = wardSign.clone();
  wardSignB.position.set(0.43, 3.9, -0.16);
  wardSignB.rotation.y = 0.4 - Math.PI / 2;
  signGroup.add(wardSignB);
  signGroup.add(box(0.96, 0.33, 0.05, toon(0x2c3340, {}), {
    x: 0.43, y: 3.9, z: -0.13, ry: 0.4 - Math.PI / 2,
  }));
  // small one-way plate
  const owSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.5, 0.24),
    new THREE.MeshBasicMaterial({ map: posterTexture(6, 256, 128) })
  );
  owSign.position.set(-0.3, 3.4, 0.2);
  owSign.rotation.y = 0.4 + Math.PI / 2;
  owSign.userData.noOutline = true;
  signGroup.add(owSign);
  // address plate
  F.add(box(0.02, 0.16, 0.42, glow(0xbfe8ff, 0.8), { x: 3.24, y: 2.5, z: 1.4, ry: Math.PI / 2, noOutline: true }));
  F.add(signGroup);

  /* --- guardrail framing the corner kerb ----------------------- */
  const gr = guardrail(3.4, 3);
  gr.position.set(5.42, 0, 7.8);
  gr.rotation.y = Math.PI / 2;
  F.add(gr);
  const gr2 = guardrail(1.7, 2);
  gr2.position.set(4.75, 0, 5.3);
  gr2.rotation.y = 0;
  F.add(gr2);

  /* --- notice board near the corner ----------------------------- */
  const nb = noticeBoard();
  nb.position.set(4.6, 0, 2.3);
  nb.rotation.y = -Math.PI / 2 + 0.15;
  F.add(nb);

  /* --- parked kei car in the marked bay ------------------------- */
  const car = keiCar();
  car.position.set(-6.3, 0, 7.4);
  car.rotation.y = 0.02;
  root.add(car);
  ctx.car = car;
  // a second, empty bay gets a shopping trolley
  const trolley = group({ x: -3.4, z: 7.3, ry: 0.3 });
  trolley.add(box(0.5, 0.5, 0.34, toon(0x5f6a7a, {}), { y: 0.3, r: 0 }));
  trolley.add(box(0.52, 0.04, 0.36, toon(0x76818f, {}), { y: 0.56 }));
  trolley.add(box(0.04, 0.9, 0.04, toon(0x8f97a3, {}), { x: -0.22, y: 0.6, z: -0.2, rx: 0.2, noOutline: true }));
  trolley.add(box(0.04, 0.9, 0.04, toon(0x8f97a3, {}), { x: 0.22, y: 0.6, z: -0.2, rx: 0.2, noOutline: true }));
  [-0.2, 0.2].forEach((dx) => {
    [-0.14, 0.14].forEach((dz) => {
      trolley.add(cyl(0.05, 0.05, 0.03, 8, toon(0x22252b, {}), {
        x: dx, y: 0.05, z: dz, rz: Math.PI / 2, noOutline: true,
      }));
    });
  });
  root.add(trolley);

  /* --- traffic signal at the far corner ------------------------- */
  const signal = trafficSignal();
  signal.group.position.set(L.signal.x, 0, L.signal.z);
  signal.group.rotation.y = Math.PI * 0.22;
  root.add(signal.group);
  ctx.signal = signal;

  // a second signal head on the other side of the road
  const signal2 = trafficSignal();
  signal2.group.position.set(6.0, 0, 10.4);
  signal2.group.rotation.y = Math.PI * 0.78;
  signal2.group.scale.setScalar(0.9);
  root.add(signal2.group);
  ctx.signal2 = signal2;

  /* --- kerb clutter: cones, a stack of crates ------------------- */
  for (let i = 0; i < 3; i++) {
    const cone = group({ x: rand(4.5, 5.3), z: rand(-6.5, -3.0), ry: rand(0, 3) });
    cone.add(cyl(0.03, 0.16, 0.46, 8, toon(0xb25c2e, {}), { y: 0.23 }));
    cone.add(box(0.34, 0.03, 0.34, toon(0xa8a294, {}), { y: 0.015 }));
    cone.add(cyl(0.075, 0.085, 0.08, 8, flat(0xcfcabc), { y: 0.3, noOutline: true }));
    F.add(cone);
  }
  // a couple of stacked beer cases near the vending machines
  for (let i = 0; i < 3; i++) {
    F.add(roundedBox(0.56, 0.24, 0.4, toon(0x9a5a3a, {}), {
      x: 4.55, y: 0.12 + i * 0.25, z: -5.5 - i * 0.06, ry: rand(-0.1, 0.1), r: 0.03,
    }));
  }

  ctx.props = { root, vend, lamp, pole, car };
  markReflect(root);
  return root;
}