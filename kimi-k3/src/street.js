// Base platform, roads, sidewalks, street furniture, alley, far houses.
import * as THREE from 'three';
import {
  toon, addOutline, canvasTex, box, cyl, tubeBetween,
  aoBlob, glowSprite, flatStreak, lightPool,
} from './materials.js';

const ROAD_Y = 0.02;      // top of asphalt
const WALK_Y = 0.12;      // top of sidewalk
const OUT_Y  = 0.10;      // top of outer strips

// ---------- small canvas art ----------
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function vendingTex(bg, band, name) {
  return canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = band; g.fillRect(0, 0, w, 62);
    g.fillStyle = '#ffffff';
    g.font = 'bold 32px "MS Gothic", sans-serif';
    g.textAlign = 'center';
    g.fillText(name, w / 2, 43);
    // display window
    g.fillStyle = '#131b28'; rr(g, 14, 82, w - 28, 306, 8); g.fill();
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
      const x = 28 + c * 42, y = 100 + r * 98;
      g.fillStyle = `hsl(${Math.floor(rnd() * 360)},72%,62%)`;
      rr(g, x, y, 27, 50, 5); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(x, y + 15, 27, 10);
      g.fillStyle = '#ffd75e'; g.font = 'bold 13px sans-serif';
      g.fillText('¥140', x + 14, y + 70);
    }
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(14, 406, w - 28, 58);
    g.fillStyle = '#0b0f16'; g.fillRect(30, 422, w - 60, 24);
    g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(14, 82, w - 28, 10);
  });
}

function noticeTex() {
  return canvasTex(512, 360, (g, w, h) => {
    g.fillStyle = '#6b543f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7d654c'; g.fillRect(10, 10, w - 20, h - 20);
    let seed = 3;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const cols = ['#f5efe2', '#eef3f7', '#f9e3e3', '#fff6c8', '#e6f3e6'];
    for (let i = 0; i < 9; i++) {
      const pw = 90 + rnd() * 50, ph = 70 + rnd() * 40;
      const x = 24 + rnd() * (w - pw - 48), y = 24 + rnd() * (h - ph - 48);
      g.save();
      g.translate(x + pw / 2, y + ph / 2);
      g.rotate((rnd() - 0.5) * 0.16);
      g.fillStyle = cols[i % cols.length];
      g.fillRect(-pw / 2, -ph / 2, pw, ph);
      g.fillStyle = 'rgba(60,60,70,0.55)';
      for (let l = 0; l < 4; l++) g.fillRect(-pw / 2 + 10, -ph / 2 + 14 + l * 14, pw - 20 - rnd() * 30, 3);
      g.fillStyle = '#d84a4a';
      g.beginPath(); g.arc(0, -ph / 2 + 6, 4, 0, 7); g.fill();
      g.restore();
    }
  });
}

function arrowTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#2f6fd8';
    g.beginPath(); g.arc(128, 128, 120, 0, 7); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(60, 108); g.lineTo(150, 108); g.lineTo(150, 78);
    g.lineTo(210, 128); g.lineTo(150, 178); g.lineTo(150, 148); g.lineTo(60, 148);
    g.closePath(); g.fill();
  });
}

function pTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#2f6fd8'; rr(g, 8, 8, 240, 240, 24); g.fill();
    g.fillStyle = '#ffffff';
    g.font = 'bold 170px sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('P', 128, 138);
  });
}

function mirrorTex() {
  return canvasTex(256, 256, (g) => {
    const r = g.createRadialGradient(100, 96, 10, 128, 128, 128);
    r.addColorStop(0, '#dfeaf8');
    r.addColorStop(0.55, '#a9bdd8');
    r.addColorStop(1, '#5d6f8d');
    g.fillStyle = r;
    g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 6;
    g.beginPath(); g.arc(128, 128, 96, -2.4, -1.2); g.stroke();
  });
}

function manholeTex() {
  return canvasTex(256, 256, (g) => {
    g.fillStyle = '#232a3b';
    g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
    g.strokeStyle = '#39435c'; g.lineWidth = 8;
    g.beginPath(); g.arc(128, 128, 100, 0, 7); g.stroke();
    g.lineWidth = 4;
    g.beginPath(); g.arc(128, 128, 62, 0, 7); g.stroke();
    g.fillStyle = '#39435c';
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      g.beginPath(); g.arc(128 + Math.cos(a) * 81, 128 + Math.sin(a) * 81, 6, 0, 7); g.fill();
    }
  });
}

function puddleTex() {
  return canvasTex(256, 256, (g) => {
    const r = g.createRadialGradient(128, 128, 10, 128, 128, 126);
    r.addColorStop(0, 'rgba(74,92,134,0.95)');
    r.addColorStop(0.65, 'rgba(52,66,98,0.85)');
    r.addColorStop(1, 'rgba(52,66,98,0)');
    g.fillStyle = r;
    g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  });
}

// ---------- builders ----------
function buildBike() {
  const g = new THREE.Group();
  const tire = toon(0x14161f), rim = toon(0xb9c2cf),
        frame = toon(0x3f6ba8), dark = toon(0x2a2f3a);
  const wheelG = new THREE.TorusGeometry(0.34, 0.05, 8, 22);
  const w1 = new THREE.Mesh(wheelG, tire); w1.position.set(-0.55, 0.34, 0); addOutline(w1, 0.02);
  const w2 = new THREE.Mesh(wheelG, tire); w2.position.set(0.55, 0.34, 0); addOutline(w2, 0.02);
  const rimG = new THREE.TorusGeometry(0.29, 0.012, 6, 20);
  const r1 = new THREE.Mesh(rimG, rim); r1.position.copy(w1.position);
  const r2 = new THREE.Mesh(rimG, rim); r2.position.copy(w2.position);
  g.add(w1, w2, r1, r2);
  const t = (a, b, r, m) => g.add(tubeBetween(a, b, r, m));
  t([-0.55, 0.34, 0], [0, 0.32, 0], 0.03, frame);      // chain stay
  t([0, 0.32, 0], [0.5, 0.55, 0], 0.035, frame);       // down tube-ish
  t([0.5, 0.55, 0], [0.42, 0.92, 0], 0.03, frame);     // head tube
  t([0.42, 0.92, 0], [-0.12, 0.92, 0], 0.03, frame);   // top tube
  t([-0.12, 0.92, 0], [0, 0.32, 0], 0.03, frame);      // seat tube
  t([-0.55, 0.34, 0], [-0.12, 0.9, 0], 0.02, frame);   // seat stay
  t([0.5, 0.55, 0], [0.55, 0.34, 0], 0.025, dark);     // fork
  t([0.42, 0.92, 0], [0.46, 1.06, 0], 0.025, dark);    // stem
  const bar = cyl(0.02, 0.42, dark); bar.rotation.x = Math.PI / 2; bar.position.set(0.46, 1.07, 0); g.add(bar);
  const seat = box(0.24, 0.07, 0.12, dark); seat.position.set(-0.12, 0.98, 0); addOutline(seat, 0.015); g.add(seat);
  const basket = box(0.3, 0.22, 0.26, toon(0x333a47)); basket.position.set(0.62, 0.86, 0); addOutline(basket, 0.02); g.add(basket);
  t([0, 0.32, 0], [-0.16, 0.02, 0.1], 0.015, dark);    // kickstand
  return g;
}

function gableHouse(w, h, d, roofH, color, roofColor) {
  const g = new THREE.Group();
  const body = box(w, h, d, toon(color));
  body.position.y = h / 2;
  addOutline(body, 0.05);
  g.add(body);
  const s = new THREE.Shape();
  s.moveTo(-w / 2 - 0.2, 0); s.lineTo(w / 2 + 0.2, 0); s.lineTo(0, roofH); s.closePath();
  const rg = new THREE.ExtrudeGeometry(s, { depth: d + 0.4, bevelEnabled: false });
  rg.translate(0, 0, -(d + 0.4) / 2);
  const roof = new THREE.Mesh(rg, toon(roofColor));
  roof.position.y = h;
  addOutline(roof, 0.05);
  g.add(roof);
  return g;
}

function arcTube(cx, cz, r, a0, a1, y, tubeR, mat) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const a = a0 + (a1 - a0) * i / 16;
    pts.push(new THREE.Vector3(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r));
  }
  return new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, tubeR, 6, false), mat);
}

function wire(a, b, sag, mat) {
  const av = new THREE.Vector3(...a), bv = new THREE.Vector3(...b);
  const mid = av.clone().add(bv).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(av, mid, bv);
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(28)), mat);
}

// ---------- main ----------
export function buildStreet(scene) {
  const S = new THREE.Group();
  scene.add(S);
  const add = (m, x = 0, y = 0, z = 0, ry = 0) => {
    m.position.set(x, y, z); m.rotation.y = ry; S.add(m); return m;
  };

  // ===== base platform =====
  const base = box(36, 1.4, 36, toon(0x1b2236));
  add(base, 0, -0.7, 0);
  addOutline(base, 0.05);
  const baseTop = box(35.6, 0.06, 35.6, toon(0x28304a));
  add(baseTop, 0, -0.03, 0);

  // ===== roads =====
  const roadMat = toon(0x272d3e);
  const roadS = box(33, 0.04, 7, roadMat); add(roadS, -1.5, 0, 11.5);
  const roadE = box(7, 0.04, 26, roadMat); add(roadE, 11.5, 0, -5);

  // outer strips (far side of the streets)
  const stripMat = toon(0x333b54);
  add(box(36, 0.1, 3, stripMat), 0, 0.05 - 0.05, 16.5);
  add(box(3, 0.1, 33, stripMat), 16.5, 0.05 - 0.05, -1.5);

  // ===== sidewalk (rounded street corner) =====
  const sh = new THREE.Shape();
  sh.moveTo(-18, 18);
  sh.lineTo(8, 18);
  sh.lineTo(8, -5.5);
  sh.quadraticCurveTo(8, -8, 5.5, -8);
  sh.lineTo(-18, -8);
  sh.closePath();
  const walkGeo = new THREE.ExtrudeGeometry(sh, { depth: WALK_Y, bevelEnabled: false });
  walkGeo.rotateX(-Math.PI / 2);
  const walk = new THREE.Mesh(walkGeo, toon(0x3c445f));
  S.add(walk);

  // ===== road markings =====
  const paintW = toon(0xd9deeb), paintY = toon(0xe4c26c);
  const paint = (w, d, x, z, mat = paintW) => add(box(w, 0.014, d, mat), x, ROAD_Y + 0.008, z);
  // centre dashed lines
  for (let x = -16.5; x < 6.5; x += 3) paint(1.6, 0.15, x, 11.5, paintY);
  for (let z = -16.5; z < 6.5; z += 3) paint(0.15, 1.6, 11.5, z, paintY);
  // edge lines
  paint(24, 0.12, -6, 8.3); paint(24, 0.12, -6, 14.7);
  paint(0.12, 24, 8.3, -6); paint(0.12, 24, 14.7, -6);
  // crosswalk (zebra) — south road, in front of the store entrance
  for (let i = 0; i < 5; i++) paint(0.5, 6.3, -6 + i, 11.5);
  // crosswalk — east road
  for (let i = 0; i < 5; i++) paint(6.3, 0.5, 11.5, 2 + i);
  // stop lines
  paint(0.45, 3.2, -1.1, 9.75);
  paint(3.2, 0.45, 9.75, 6.6);

  // manholes
  const mhTex = manholeTex();
  const mhMat = new THREE.MeshToonMaterial({ map: mhTex, gradientMap: null });
  const mh1 = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), mhMat);
  mh1.rotation.x = -Math.PI / 2; add(mh1, 0.5, ROAD_Y + 0.006, 11.4);
  const mh2 = mh1.clone(); add(mh2, 11.4, ROAD_Y + 0.006, 0.5);

  // ===== drainage gutter (L along both roads) =====
  const gutMat = toon(0x141a28);
  add(box(22.5, 0.02, 0.45, gutMat), -5.75, ROAD_Y + 0.002, 8.55);
  add(box(0.45, 0.02, 22.5, gutMat), 8.55, ROAD_Y + 0.002, -5.75);
  const barGeo = new THREE.BoxGeometry(0.06, 0.03, 0.42);
  const barMat = toon(0x3a4358);
  const nBars = 90 + 90;
  const bars = new THREE.InstancedMesh(barGeo, barMat, nBars);
  const bm = new THREE.Matrix4(), bq = new THREE.Quaternion(), bs = new THREE.Vector3(1, 1, 1);
  let bi = 0;
  for (let x = -17; x < 5.5; x += 0.25) {
    bm.compose(new THREE.Vector3(x, ROAD_Y + 0.02, 8.55), bq, bs);
    bars.setMatrixAt(bi++, bm);
  }
  bq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  for (let z = -17; z < 5.5; z += 0.25) {
    bm.compose(new THREE.Vector3(8.55, ROAD_Y + 0.02, z), bq, bs);
    bars.setMatrixAt(bi++, bm);
  }
  bars.count = bi;
  S.add(bars);

  // ===== parking bays =====
  const bay = (x0) => {
    paint2(x0 + 0.06, 1.4, 0.12, 5);       // left line
    paint2(x0 + 2.44, 1.4, 0.12, 5);       // right line
    paint2(x0 + 1.25, 1.46, 2.5, 0.12);    // back line
  };
  const paint2 = (x, z, w, d) => add(box(w, 0.014, d, paintW), x, WALK_Y + 0.008, z + 2.5);
  bay(-17.3); bay(-14.85);
  const stop1 = box(1.2, 0.13, 0.18, toon(0x9aa2b2)); add(stop1, -16.05, WALK_Y + 0.065, 1.85); addOutline(stop1, 0.015);
  const stop2 = stop1.clone(); add(stop2, -13.6, WALK_Y + 0.065, 1.85);

  // P sign
  const pPole = cyl(0.05, 2.4, toon(0x8f96a5)); add(pPole, -16.6, WALK_Y + 1.2, 6.7);
  const pBoard = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62),
    new THREE.MeshBasicMaterial({ map: pTex() }));
  add(pBoard, -16.6, WALK_Y + 2.25, 6.64, Math.PI);

  // ===== corner guardrail =====
  const railMat = toon(0xe8ecf4);
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI + i / 6 * Math.PI / 2;
    const p = cyl(0.05, 0.72, railMat);
    add(p, 8 + Math.cos(a) * 2.5, WALK_Y + 0.36, 8 + Math.sin(a) * 2.5);
    addOutline(p, 0.015);
  }
  S.add(arcTube(8, 8, 2.5, Math.PI, Math.PI * 1.5, WALK_Y + 0.68, 0.04, railMat));
  S.add(arcTube(8, 8, 2.5, Math.PI, Math.PI * 1.5, WALK_Y + 0.4, 0.035, railMat));

  // ===== utility poles + wires =====
  const poleMat = toon(0x8f96a5);
  const wireMat = new THREE.LineBasicMaterial({ color: 0x0a0d16 });
  const pole = (x, z) => {
    const g = new THREE.Group();
    const p = cyl(0.17, 9, poleMat, 10); p.position.y = 4.5; addOutline(p, 0.03); g.add(p);
    const collar = cyl(0.23, 0.5, poleMat, 10); collar.position.y = 0.25; g.add(collar);
    const arm1 = box(1.9, 0.1, 0.14, poleMat); arm1.position.y = 8.15; g.add(arm1);
    const arm2 = box(1.5, 0.1, 0.14, poleMat); arm2.position.y = 7.35; g.add(arm2);
    [-0.8, 0.8].forEach((dx) => {
      const ins = cyl(0.045, 0.14, toon(0xd8dde8), 6);
      ins.position.set(dx, 8.28, 0); g.add(ins);
    });
    const tr = cyl(0.34, 0.9, toon(0x6b7386), 10); tr.position.set(0.42, 6.5, 0); addOutline(tr, 0.02); g.add(tr);
    g.position.set(x, WALK_Y, z);
    S.add(g);
    return g;
  };
  pole(6.4, 4.6); pole(-14.5, 6.6);
  // far pole stands on the outer strip
  const p3 = new THREE.Group();
  {
    const p = cyl(0.17, 9, poleMat, 10); p.position.y = 4.5; addOutline(p, 0.03); p3.add(p);
    const arm1 = box(1.9, 0.1, 0.14, poleMat); arm1.position.y = 8.15; p3.add(arm1);
    p3.position.set(14.2, OUT_Y, 14.2);
    S.add(p3);
  }
  S.add(wire([6.4 - 0.85, WALK_Y + 8.32, 4.6], [-14.5 - 0.85, WALK_Y + 8.32, 6.6], 0.9, wireMat));
  S.add(wire([6.4 + 0.85, WALK_Y + 8.32, 4.6], [-14.5 + 0.85, WALK_Y + 8.32, 6.6], 0.9, wireMat));
  S.add(wire([6.4 - 0.7, WALK_Y + 7.5, 4.6], [14.2 - 0.7, OUT_Y + 8.32, 14.2], 1.3, wireMat));
  S.add(wire([6.4 + 0.7, WALK_Y + 7.5, 4.6], [14.2 + 0.7, OUT_Y + 8.32, 14.2], 1.3, wireMat));
  S.add(wire([6.4, WALK_Y + 7.0, 4.6], [0.6, 4.1, 0.9], 0.5, wireMat)); // service drop to store

  // ===== street lamp (near, by the parking) =====
  const lampMat = toon(0x3c4a4a);
  {
    const p = cyl(0.09, 4.6, lampMat); add(p, -16.6, WALK_Y + 2.3, 7.0); addOutline(p, 0.02);
    S.add(tubeBetween([-16.6, WALK_Y + 4.55, 7.0], [-15.7, WALK_Y + 4.85, 8.4], 0.05, lampMat));
    const head = box(0.55, 0.12, 0.26, lampMat); add(head, -15.6, WALK_Y + 4.82, 8.55); addOutline(head, 0.015);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.18),
      new THREE.MeshBasicMaterial({ color: 0xd8ecff }));
    panel.rotation.x = Math.PI / 2; add(panel, -15.6, WALK_Y + 4.75, 8.55);
    const gl = glowSprite(0xbfe0ff, 3.2, 3.2, 0.55); add(gl, -15.6, WALK_Y + 4.7, 8.55);
    const spot = new THREE.SpotLight(0xcfe4ff, 70, 18, 0.62, 0.7, 1.6);
    spot.position.set(-15.6, WALK_Y + 4.8, 8.55);
    spot.target.position.set(-15.6, 0, 9.2);
    S.add(spot, spot.target);
    add(lightPool(0x9fc8ff, 5.5, 4.5, 0.26), -15.6, ROAD_Y + 0.03, 9.2);
    add(flatStreak(0x9fc8ff, 1.1, 4.2, 0.2), -15.6, ROAD_Y + 0.035, 10.8);
  }
  // far lamp hanging from pole P3
  {
    S.add(tubeBetween([14.2, OUT_Y + 4.7, 14.2], [12.4, OUT_Y + 4.9, 12.4], 0.05, lampMat));
    const head = box(0.5, 0.11, 0.24, lampMat); add(head, 12.25, OUT_Y + 4.86, 12.25);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xd8ecff }));
    panel.rotation.x = Math.PI / 2; add(panel, 12.25, OUT_Y + 4.79, 12.25);
    const gl = glowSprite(0xbfe0ff, 2.6, 2.6, 0.45); add(gl, 12.25, OUT_Y + 4.75, 12.25);
    const spot = new THREE.SpotLight(0xcfe4ff, 46, 15, 0.66, 0.8, 1.6);
    spot.position.set(12.25, OUT_Y + 4.85, 12.25);
    spot.target.position.set(12.25, 0, 12.25);
    S.add(spot, spot.target);
    add(lightPool(0x9fc8ff, 4.5, 4.5, 0.2), 12.25, ROAD_Y + 0.03, 12.25);
  }

  // ===== traffic light (far corner, horizontal Japanese head) =====
  const tlGroup = new THREE.Group();
  {
    const p = cyl(0.09, 5.0, toon(0x5a6272)); p.position.set(0, 2.5, 0); addOutline(p, 0.02); tlGroup.add(p);
    tlGroup.add(tubeBetween([0, 4.9, 0], [-2.7, 4.9, 0], 0.06, toon(0x5a6272)));
    const head = box(0.32, 0.42, 1.15, toon(0x1c2230));
    head.position.set(-2.95, 4.72, 0); addOutline(head, 0.02); tlGroup.add(head);
    const lensG = new THREE.CircleGeometry(0.105, 16);
    const mkLens = (z) => {
      const m = new THREE.Mesh(lensG, new THREE.MeshBasicMaterial({ color: 0x20262f }));
      m.position.set(-3.12, 4.72, z);
      m.rotation.y = -Math.PI / 2;
      tlGroup.add(m);
      return m;
    };
    var tlG = mkLens(-0.32), tlY = mkLens(0), tlR = mkLens(0.32);
    tlGroup.position.set(15.8, OUT_Y, 7.7);
    S.add(tlGroup);
  }
  const tlStreak = flatStreak(0x7fe0a0, 0.9, 4.5, 0.25);
  add(tlStreak, 11.2, ROAD_Y + 0.035, 10.4);

  // ===== convex (corner) mirror =====
  {
    const p = cyl(0.05, 2.6, toon(0xd86a2a)); add(p, 7.15, WALK_Y + 1.3, 6.2);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 24), toon(0xe07830));
    add(rim, 7.15, WALK_Y + 2.75, 6.2, Math.PI / 4 + Math.PI);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.29, 24),
      new THREE.MeshBasicMaterial({ map: mirrorTex() }));
    add(face, 7.15, WALK_Y + 2.75, 6.2, Math.PI / 4 + Math.PI);
    face.position.add(new THREE.Vector3(-0.02, 0, -0.02));
  }

  // ===== one-way sign =====
  {
    const p = cyl(0.045, 2.6, toon(0x8f96a5)); add(p, 6.8, WALK_Y + 1.3, 3.0);
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24),
      new THREE.MeshBasicMaterial({ map: arrowTex() }));
    add(s, 6.8, WALK_Y + 2.5, 3.0);
    addOutline(s, 0.015);
  }

  // ===== bicycle =====
  const bike = buildBike();
  add(bike, -13.2, WALK_Y, 1.85, 0.1);
  bike.rotation.z = 0.06;

  // ===== vending machines =====
  const vendA = vendingTex('#d84040', '#a82c2c', 'DRINK');
  const vendB = vendingTex('#2b7de0', '#1c5aa8', 'みず');
  const vend = (x, tex, bodyColor) => {
    const g = new THREE.Group();
    const body = box(1.05, 1.9, 0.75, toon(bodyColor));
    body.position.y = 0.95; addOutline(body, 0.025); g.add(body);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.8),
      new THREE.MeshBasicMaterial({ map: tex }));
    front.position.set(0, 0.95, 0.38); g.add(front);
    g.position.set(x, WALK_Y, 1.42);
    S.add(g);
    return g;
  };
  vend(-9.9, vendA, 0xd84040);
  vend(-8.6, vendB, 0x2b7de0);
  const vendLight = new THREE.PointLight(0x9fd4ff, 7, 5.5, 1.8);
  vendLight.position.set(-9.25, 1.7, 2.4);
  S.add(vendLight);
  add(lightPool(0x9fd4ff, 3.4, 2.2, 0.3), -9.25, WALK_Y + 0.015, 2.6);
  add(flatStreak(0x9fd4ff, 1.6, 3.4, 0.16), -9.25, WALK_Y + 0.02, 3.6);

  // ===== umbrella stand + trash bins =====
  {
    const stand = cyl(0.22, 0.5, toon(0x39415a), 14); add(stand, -2.35, WALK_Y + 0.25, 1.35); addOutline(stand, 0.02);
    const umb = (dx, dz, color, lean) => {
      const g = new THREE.Group();
      const stick = cyl(0.018, 0.85, toon(0x22283a)); stick.position.y = 0.72; g.add(stick);
      const top = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 8), toon(color));
      top.position.y = 0.95; addOutline(top, 0.012); g.add(top);
      g.position.set(-2.35 + dx, WALK_Y, 1.35 + dz);
      g.rotation.z = lean;
      S.add(g);
    };
    umb(-0.08, 0.02, 0x2e4a7a, 0.12);
    umb(0.07, -0.05, 0xf0c33c, -0.1);
    umb(0.02, 0.09, 0xdfe8f2, 0.05);
    const bin = (x, labelColor) => {
      const b = box(0.45, 0.65, 0.45, toon(0x6b7386));
      add(b, x, WALK_Y + 0.325, 1.35); addOutline(b, 0.02);
      const lbl = box(0.3, 0.14, 0.02, toon(labelColor));
      add(lbl, x, WALK_Y + 0.48, 1.585);
    };
    bin(-1.35, 0xd84a4a); bin(-0.75, 0x2b7de0);
  }

  // ===== notice board =====
  {
    const g = new THREE.Group();
    [-0.62, 0.62].forEach((dx) => {
      const leg = box(0.08, 1.6, 0.08, toon(0x4a3b2c)); leg.position.set(dx, 0.8, 0); g.add(leg);
    });
    const panel = box(1.5, 1.05, 0.07, toon(0x54432f)); panel.position.y = 1.35; addOutline(panel, 0.02); g.add(panel);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.94),
      new THREE.MeshBasicMaterial({ map: noticeTex() }));
    face.position.set(0, 1.35, 0.045); g.add(face);
    const roof = box(1.7, 0.07, 0.34, toon(0x3a2f22)); roof.position.y = 1.95; addOutline(roof, 0.015); g.add(roof);
    g.position.set(-16.7, WALK_Y, 3.6);
    g.rotation.y = 0.55;
    S.add(g);
  }

  // ===== alley: neighbour building, AC units, trash =====
  {
    const nb = box(5.4, 7, 6, toon(0x272e44));
    add(nb, 5.3, WALK_Y + 3.5, -3);
    addOutline(nb, 0.05);
    // windows on the street-facing side
    const winLit = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1),
      new THREE.MeshBasicMaterial({ color: 0xffc987 }));
    add(winLit, 4.2, WALK_Y + 3.4, 0.02);
    const winDark = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1),
      new THREE.MeshBasicMaterial({ color: 0x141a28 }));
    add(winDark, 6.2, WALK_Y + 3.4, 0.02);
    const winDark2 = winDark.clone(); add(winDark2, 4.2, WALK_Y + 5.2, 0.02);
    // alley floor shadow
    const alleyFloor = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6),
      new THREE.MeshBasicMaterial({ color: 0x10141f, transparent: true, opacity: 0.65, depthWrite: false }));
    alleyFloor.rotation.x = -Math.PI / 2;
    add(alleyFloor, 1.8, WALK_Y + 0.01, -3);
    // AC outdoor units on the store's side wall
    const ac = (z) => {
      const g = new THREE.Group();
      const u = box(0.32, 0.6, 0.9, toon(0x9aa3b2)); addOutline(u, 0.02); g.add(u);
      const fan = cyl(0.18, 0.05, toon(0x39415a), 16);
      fan.rotation.z = Math.PI / 2; fan.position.x = 0.17; g.add(fan);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.02, 6, 20), toon(0x6b7386));
      ring.rotation.y = Math.PI / 2; ring.position.x = 0.19; g.add(ring);
      g.position.set(1.18, WALK_Y + 0.45, z);
      S.add(g);
      S.add(tubeBetween([1.1, WALK_Y + 0.8, z - 0.3], [1.1, WALK_Y + 2.6, z - 0.3], 0.03, toon(0x7a8296)));
    };
    ac(-2.0); ac(-3.3);
    // trash bags + cardboard
    const bagMat = toon(0x1d2333);
    [[1.6, -4.9, 0.3], [1.95, -4.65, 0.24], [1.55, -4.45, 0.22]].forEach(([x, z, r]) => {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), bagMat);
      b.scale.y = 0.82; add(b, x, WALK_Y + r * 0.8, z); addOutline(b, 0.02);
    });
    const cb1 = box(0.5, 0.4, 0.5, toon(0x8a6f4d)); add(cb1, 1.55, WALK_Y + 0.2, -3.7); addOutline(cb1, 0.015);
    const cb2 = box(0.4, 0.32, 0.4, toon(0x9a7d58)); add(cb2, 1.55, WALK_Y + 0.56, -3.7); addOutline(cb2, 0.015);
    // dim lamp deep in the alley
    const lampBox = box(0.16, 0.22, 0.1, toon(0x4a4238));
    add(lampBox, 2.55, WALK_Y + 2.5, -5.3);
    const lampGlow = glowSprite(0xffb46a, 1.6, 1.6, 0.55);
    add(lampGlow, 2.45, WALK_Y + 2.45, -5.3);
    const alleyLight = new THREE.PointLight(0xffb46a, 4, 5, 1.8);
    alleyLight.position.set(2.4, WALK_Y + 2.4, -5.3);
    S.add(alleyLight);
  }

  // ===== far-side houses (silhouettes) =====
  const houseDefs = [
    { w: 6, h: 4.5, d: 3, r: 1.6, x: -11, z: 16.7, ry: 0, lit: [0xffbe78, 0xffbe78] },
    { w: 5, h: 3.8, d: 3, r: 1.4, x: -3.5, z: 16.6, ry: 0, lit: [0x9fc8ff] },
    { w: 6, h: 5.0, d: 3, r: 1.8, x: 4, z: 16.8, ry: 0, lit: [0xffbe78] },
    { w: 6, h: 4.2, d: 3, r: 1.5, x: 16.7, z: -8, ry: Math.PI / 2, lit: [0xffbe78] },
    { w: 5, h: 3.6, d: 3, r: 1.3, x: 16.6, z: 2, ry: Math.PI / 2, lit: [] },
  ];
  houseDefs.forEach((hd) => {
    const h = gableHouse(hd.w, hd.h, hd.d, hd.r, 0x252d44, 0x171d2e);
    add(h, hd.x, OUT_Y, hd.z, hd.ry);
    // windows
    const faceZ = hd.ry === 0 ? hd.z - hd.d / 2 - 0.01 : null;
    hd.lit.forEach((c, i) => {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9),
        new THREE.MeshBasicMaterial({ color: c }));
      if (hd.ry === 0) {
        add(win, hd.x - hd.w / 4 + i * hd.w / 2.2, OUT_Y + 1.8 + i * 0.4, faceZ, Math.PI);
      } else {
        win.position.set(hd.x - hd.d / 2 - 0.01, OUT_Y + 1.8 + i * 0.4, hd.z - hd.w / 4 + i * hd.w / 2.2);
        win.rotation.y = -Math.PI / 2;
        S.add(win);
      }
    });
    const dark = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.9),
      new THREE.MeshBasicMaterial({ color: 0x141a28 }));
    if (hd.ry === 0) add(dark, hd.x + hd.w / 4, OUT_Y + 2.6, faceZ, Math.PI);
  });

  // ===== puddles =====
  const pTex2 = puddleTex();
  const puddles = [
    { x: -4, z: 10.5, r: 1.7, y: ROAD_Y },
    { x: 2, z: 12.6, r: 1.2, y: ROAD_Y },
    { x: 11, z: 10.2, r: 1.5, y: ROAD_Y },
    { x: 12.6, z: 4, r: 1.1, y: ROAD_Y },
    { x: -13, z: 9.6, r: 1.0, y: ROAD_Y },
    { x: -6.5, z: 4.6, r: 0.9, y: WALK_Y },
    { x: 0.5, z: 6.6, r: 0.8, y: WALK_Y },
    { x: 1.8, z: -3, r: 0.55, y: WALK_Y },
  ];
  puddles.forEach((p, i) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28),
      new THREE.MeshBasicMaterial({ map: pTex2, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = i * 1.7;
    m.scale.set(p.r, p.r * 0.72, 1);
    m.position.set(p.x, p.y + 0.012, p.z);
    m.renderOrder = 2;
    S.add(m);
  });
  // extra fake reflections on the big puddles
  add(flatStreak(0xffe0b0, 2.2, 5.5, 0.14), -4, ROAD_Y + 0.03, 10.6);   // store glow
  add(flatStreak(0x9fd4ff, 0.9, 3.0, 0.18), -13, ROAD_Y + 0.03, 9.7);   // lamp
  // wide warm wash from the storefront onto the road
  add(lightPool(0xffe8c0, 11, 6, 0.10), -4, ROAD_Y + 0.025, 9.6);

  // ===== contact shadows =====
  const ao = (w, d, x, z, y, op = 0.45) => {
    const b = aoBlob(w, d, op); b.position.set(x, y + 0.004, z); S.add(b);
  };
  ao(1.7, 0.9, -13.2, 1.85, WALK_Y);
  ao(2.8, 1.3, -9.25, 1.5, WALK_Y);
  ao(1.9, 0.9, -1.5, 1.4, WALK_Y);
  ao(1.9, 1.1, -16.7, 3.6, WALK_Y);
  ao(0.9, 0.9, 6.4, 4.6, WALK_Y, 0.5);
  ao(0.9, 0.9, -14.5, 6.6, WALK_Y, 0.5);
  ao(0.9, 0.9, 14.2, 14.2, OUT_Y, 0.5);
  ao(0.7, 0.7, -16.6, 7.0, WALK_Y, 0.5);
  ao(1.3, 1.1, 1.7, -4.7, WALK_Y, 0.55);
  ao(0.8, 0.8, 1.55, -3.7, WALK_Y, 0.5);
  houseDefs.forEach((hd) => ao(hd.w + 1, hd.d + 1.4, hd.x, hd.z, OUT_Y, 0.5));
  ao(6.2, 6.8, 5.3, -3, WALK_Y, 0.5);

  // ===== data for the effects module =====
  return {
    puddles,
    traffic: {
      g: tlG.material, y: tlY.material, r: tlR.material,
      streak: tlStreak.material,
    },
    rippleZones: [
      { x0: -17, x1: 7.5, z0: 8.6, z1: 14.4, y: ROAD_Y, w: 1.0 },   // south road
      { x0: 8.6, x1: 14.4, z0: -17, z1: 7.5, y: ROAD_Y, w: 0.9 },    // east road
      { x0: -17, x1: 7, z0: -17, z1: 7.5, y: WALK_Y, w: 0.7 },       // sidewalk
    ],
  };
}
