import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  canvas helpers
 * ------------------------------------------------------------------ */

export const JP = '"Yu Gothic", "Yu Gothic UI", "Meiryo", "MS Gothic", "Hiragino Sans", "Noto Sans JP", sans-serif';
export const LAT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';

export function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, x: c.getContext('2d') };
}

export function tex(canvas, { srgb = true, repeat = null, aniso = 4, filter = THREE.LinearFilter } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.magFilter = filter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = aniso;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

function noise(x, w, h, amount, alpha) {
  for (let i = 0; i < amount; i++) {
    const r = 1 + Math.random() * 2.2;
    x.globalAlpha = alpha * (0.35 + Math.random() * 0.65);
    x.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
    x.beginPath();
    x.arc(Math.random() * w, Math.random() * h, r, 0, 6.2832);
    x.fill();
  }
  x.globalAlpha = 1;
}

/* ------------------------------------------------------------------ *
 *  ground  (16 x 16 plan, 1px = 1/64 unit)
 * ------------------------------------------------------------------ */

export const HALF = 8; // base half size
const G = 1024;
const U = G / (HALF * 2); // px per unit

const px = (v) => (v + HALF) * U;        // world x / z -> canvas px
const pw = (v) => v * U;                 // world length -> canvas px

/* world -> canvas is a plain top down plan: +x right, +z down */
export function worldToPlan(x, z) {
  return [px(x), px(z)];
}

export function groundAlbedo() {
  const { c, x } = cv(G, G);

  // base : sidewalk concrete
  x.fillStyle = '#4a5160';
  x.fillRect(0, 0, G, G);

  // concrete tile grid over the whole plate (subtle)
  x.strokeStyle = 'rgba(255,255,255,0.045)';
  x.lineWidth = 2;
  for (let i = -HALF; i <= HALF; i += 0.5) {
    x.beginPath(); x.moveTo(px(i), 0); x.lineTo(px(i), G); x.stroke();
    x.beginPath(); x.moveTo(0, px(i)); x.lineTo(G, px(i)); x.stroke();
  }

  const road = (x0, z0, x1, z1) => {
    x.fillStyle = '#232b3b';
    x.fillRect(px(x0), px(z0), pw(x1 - x0), pw(z1 - z0));
  };

  // main street (runs along X)
  road(-3.4, 4.4, 6.4, 6.4);
  // side street (runs along Z)
  road(4.6, 2.9, 6.4, 6.4);
  // small coin parking apron
  road(-8, 4.4, -3.4, 6.6);
  // backyard service strip
  road(-8, -8, 7.0, -3.6);
  // alley
  road(-5.4, -8, -3.6, 2.9);

  // asphalt grain
  x.save();
  x.globalCompositeOperation = 'overlay';
  noise(x, G, G, 5200, 0.05);
  x.restore();

  // ---- sidewalk tint patches (slightly lighter, cleaner) ----
  x.fillStyle = 'rgba(255,255,255,0.05)';
  x.fillRect(px(-8), px(2.9), pw(12.6), pw(1.5));   // front sidewalk
  x.fillRect(px(3.6), px(-3.6), pw(1.0), pw(6.5));  // right sidewalk
  x.fillRect(px(6.4), px(4.4), pw(1.6), pw(2.0));   // corner sidewalk

  // ---- curb shadow lines ----
  x.strokeStyle = 'rgba(0,0,0,0.45)';
  x.lineWidth = 4;
  x.beginPath(); x.moveTo(px(-8), px(4.4)); x.lineTo(px(6.4), px(4.4)); x.stroke();
  x.beginPath(); x.moveTo(px(4.6), px(2.9)); x.lineTo(px(4.6), px(6.4)); x.stroke();
  x.lineWidth = 3;
  x.strokeStyle = 'rgba(255,255,255,0.13)';
  x.beginPath(); x.moveTo(px(-8), px(4.32)); x.lineTo(px(6.4), px(4.32)); x.stroke();

  // ---- drainage gutter along the curbs ----
  x.fillStyle = '#141a24';
  x.fillRect(px(-8), px(4.5), pw(14.6), pw(0.13));
  x.fillRect(px(4.72), px(2.9), pw(0.13), pw(3.5));
  // grate slots
  x.fillStyle = 'rgba(160,175,195,0.35)';
  for (let i = -7.6; i < 6.2; i += 0.32) x.fillRect(px(i), px(4.5), pw(0.2), pw(0.11));
  for (let i = 3.0; i < 6.3; i += 0.32) x.fillRect(px(4.72), px(i), pw(0.11), pw(0.2));

  // ---- crosswalk (main street, in front of the store) ----
  const bars = (x0, y0, w, h, step, count, horizontal) => {
    x.fillStyle = 'rgba(238,242,248,0.82)';
    for (let i = 0; i < count; i++) {
      if (horizontal) x.fillRect(px(x0 + i * step), px(y0), pw(w), pw(h));
      else x.fillRect(px(x0), px(y0 + i * step), pw(w), pw(h));
    }
  };
  bars(-2.4, 4.62, 0.46, 1.7, 0.86, 9, true);
  x.fillStyle = 'rgba(238,242,248,0.55)';
  x.fillRect(px(-8), px(4.28), pw(4.2), pw(0.14)); // stop line

  // ---- crosswalk (side street) ----
  bars(4.78, 4.6, 1.5, 0.44, 0.84, 3, false);
  x.fillStyle = 'rgba(238,242,248,0.5)';
  x.fillRect(px(4.42), px(4.6), pw(0.14), pw(1.9));

  // ---- coin parking stalls ----
  x.strokeStyle = 'rgba(240,244,250,0.72)';
  x.lineWidth = 5;
  for (let i = 0; i < 4; i++) {
    const xx = -7.9 + i * 1.15;
    x.beginPath();
    x.moveTo(px(xx), px(4.55));
    x.lineTo(px(xx), px(6.5));
    x.stroke();
  }
  x.beginPath(); x.moveTo(px(-7.9), px(4.55)); x.lineTo(px(-3.45), px(4.55)); x.stroke();
  // stall numbers
  x.fillStyle = 'rgba(255,255,255,0.6)';
  x.font = `bold ${Math.round(pw(0.4))}px ${LAT}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    x.fillText(`${i + 1}`, px(-7.32 + i * 1.15), px(6.15));
  }
  // big P marking
  x.font = `bold ${Math.round(pw(0.85))}px ${LAT}`;
  x.fillStyle = 'rgba(255,214,120,0.75)';
  x.fillText('P', px(-6.3), px(5.4));

  // ---- manhole + utility hatches ----
  const manhole = (cx, cz, r, fill) => {
    x.beginPath(); x.arc(px(cx), px(cz), pw(r), 0, 6.2832);
    x.fillStyle = fill; x.fill();
    x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,0.4)'; x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.10)'; x.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.2832;
      x.beginPath();
      x.moveTo(px(cx) + Math.cos(a) * pw(r * 0.35), px(cz) + Math.sin(a) * pw(r * 0.35));
      x.lineTo(px(cx) + Math.cos(a) * pw(r * 0.92), px(cz) + Math.sin(a) * pw(r * 0.92));
      x.stroke();
    }
  };
  manhole(1.4, 5.5, 0.36, '#2b3444');
  manhole(-2.0, 3.6, 0.24, '#3b4351');
  manhole(5.9, 3.6, 0.2, '#39414f');

  // ---- puddles (darker + glossier) ----
  const puddle = (cx, cz, rx, ry) => {
    x.save();
    x.translate(px(cx), px(cz));
    x.scale(1, ry / rx);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, pw(rx));
    g.addColorStop(0, 'rgba(9,14,22,0.85)');
    g.addColorStop(0.72, 'rgba(12,18,28,0.7)');
    g.addColorStop(1, 'rgba(14,20,30,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, pw(rx), 0, 6.2832); x.fill();
    x.restore();
  };
  puddle(0.4, 5.9, 1.5, 0.7);
  puddle(-1.9, 4.9, 1.1, 0.5);
  puddle(5.5, 5.6, 1.3, 0.9);
  puddle(5.9, 3.6, 0.75, 0.5);
  puddle(-4.6, 5.4, 1.0, 0.6);
  puddle(2.6, 3.9, 0.8, 0.4);
  puddle(-4.4, 0.4, 0.7, 1.4);   // alley
  puddle(-4.5, -2.2, 0.6, 1.1);  // alley
  puddle(-1.0, -5.4, 1.3, 0.7);  // backyard
  puddle(4.2, -6.2, 1.1, 0.6);
  puddle(-6.6, 3.4, 0.6, 0.5);

  // ---- "止まれ" road marking ----
  x.save();
  x.translate(px(-5.6), px(4.9));
  x.fillStyle = 'rgba(250,250,252,0.7)';
  x.font = `bold ${Math.round(pw(0.55))}px ${JP}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('止まれ', 0, 0);
  x.restore();

  // ---- faint tyre-polished track on the road ----
  x.save();
  x.globalAlpha = 0.12;
  x.fillStyle = '#8ea3c0';
  x.fillRect(px(-3.4), px(5.0), pw(9.8), pw(0.5));
  x.fillRect(px(-3.4), px(5.9), pw(9.8), pw(0.4));
  x.restore();

  // ---- dropped leaves / grit ----
  x.save();
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * 6.28;
    x.globalAlpha = 0.10 + Math.random() * 0.2;
    x.fillStyle = Math.random() > 0.7 ? '#6b5a3a' : '#20262f';
    const cx = Math.random() * G, cy = Math.random() * G;
    x.beginPath();
    x.ellipse(cx, cy, 2 + Math.random() * 4, 1 + Math.random() * 2.5, a, 0, 6.28);
    x.fill();
  }
  x.restore();

  return tex(c);
}

/** wetness / reflectivity mask (R channel used) */
export function groundWet() {
  const W = 512;
  const { c, x } = cv(W, W);
  const S = W / (HALF * 2);
  const q = (v) => (v + HALF) * S;
  const l = (v) => v * S;

  x.fillStyle = '#4a4a4a'; // sidewalks : half wet
  x.fillRect(0, 0, W, W);

  // roads
  x.fillStyle = '#c8c8c8';
  x.fillRect(q(-3.4), q(4.4), l(9.8), l(2.0));
  x.fillRect(q(4.6), q(2.9), l(1.8), l(3.5));
  x.fillRect(q(-8), q(4.4), l(4.6), l(2.2));
  x.fillRect(q(-8), q(-8), l(15.0), l(4.4));
  x.fillRect(q(-5.4), q(-8), l(1.8), l(10.9));

  // buildings footprint : dry
  x.fillStyle = '#202020';
  x.fillRect(q(-8), q(-8), l(2.6), l(10.9));   // left neighbour
  x.fillRect(q(-8), q(7.0), l(16.0), l(1.0));  // far row
  x.fillRect(q(7.0), q(-3.0), l(1.0), l(10.0));// right row
  x.fillRect(q(-3.6), q(-3.6), l(7.2), l(6.5));// store footprint

  // puddles : mirror like
  const blob = (cx, cz, rx, ry, v = 1) => {
    x.save();
    x.translate(q(cx), q(cz));
    x.scale(1, ry / rx);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, l(rx));
    const col = Math.round(255 * v);
    g.addColorStop(0, `rgba(${col},${col},${col},1)`);
    g.addColorStop(0.75, `rgba(${col},${col},${col},0.85)`);
    g.addColorStop(1, `rgba(${col},${col},${col},0)`);
    x.fillStyle = g;
    x.beginPath(); x.arc(0, 0, l(rx), 0, 6.2832); x.fill();
    x.restore();
  };
  blob(0.4, 5.9, 1.5, 0.7);
  blob(-1.9, 4.9, 1.1, 0.5);
  blob(5.5, 5.6, 1.3, 0.9);
  blob(5.9, 3.6, 0.75, 0.5);
  blob(-4.6, 5.4, 1.0, 0.6);
  blob(2.6, 3.9, 0.8, 0.4);
  blob(-4.4, 0.4, 0.7, 1.4);
  blob(-4.5, -2.2, 0.6, 1.1);
  blob(-1.0, -5.4, 1.3, 0.7);
  blob(4.2, -6.2, 1.1, 0.6);
  blob(-6.6, 3.4, 0.6, 0.5);
  blob(3.0, 3.3, 0.5, 0.35, 0.9);
  blob(-2.4, 3.2, 0.55, 0.4, 0.9);

  // damp patches near the shop front (water tracked around)
  x.save();
  x.globalAlpha = 0.35;
  x.fillStyle = '#ffffff';
  x.fillRect(q(-3.6), q(2.9), l(7.2), l(1.5));
  x.restore();

  const t = tex(c, { srgb: false });
  return t;
}

/* ------------------------------------------------------------------ *
 *  signage
 * ------------------------------------------------------------------ */

export function storeSign() {
  const w = 1024, h = 192;
  const { c, x } = cv(w, h);

  x.fillStyle = '#fbfaf6';
  x.fillRect(0, 0, w, h);

  // conbini stripes
  const band = (y, col) => { x.fillStyle = col; x.fillRect(0, y, w, 22); };
  band(0, '#e8342f');
  band(22, '#f5a623');
  band(44, '#2f9e5e');
  x.fillStyle = '#e8342f'; x.fillRect(0, h - 22, w, 22);
  x.fillStyle = '#f5a623'; x.fillRect(0, h - 44, w, 22);
  x.fillStyle = '#2f9e5e'; x.fillRect(0, h - 66, w, 22);

  // word mark
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillStyle = '#123a63';
  x.font = `bold 92px ${LAT}`;
  x.fillText('HOSHI', w * 0.30, h * 0.5 + 4);
  x.fillStyle = '#e8342f';
  x.fillText('MART', w * 0.60, h * 0.5 + 4);

  // kana
  x.fillStyle = '#2b3442';
  x.font = `bold 40px ${JP}`;
  x.fillText('ほしマート', w * 0.5, h * 0.16 + 6);

  // 24h badge
  x.save();
  x.translate(w * 0.885, h * 0.5);
  x.fillStyle = '#123a63';
  x.beginPath(); x.arc(0, 0, 58, 0, 6.2832); x.fill();
  x.fillStyle = '#ffd45e';
  x.font = `bold 46px ${LAT}`;
  x.fillText('24h', 0, 2);
  x.restore();

  // thin frame
  x.strokeStyle = 'rgba(0,0,0,0.35)';
  x.lineWidth = 6;
  x.strokeRect(3, 3, w - 6, h - 6);
  return tex(c);
}

export function verticalSign() {
  const w = 192, h = 768;
  const { c, x } = cv(w, h);
  x.fillStyle = '#fbfaf6';
  x.fillRect(0, 0, w, h);
  x.fillStyle = '#e8342f'; x.fillRect(0, 0, w, 60);
  x.fillStyle = '#2f9e5e'; x.fillRect(0, h - 60, w, 60);

  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#123a63';
  x.font = `bold 66px ${LAT}`;
  const word = 'HOSHI';
  for (let i = 0; i < word.length; i++) {
    x.fillText(word[i], w / 2, 110 + i * 78);
  }
  x.fillStyle = '#e8342f';
  x.font = `bold 58px ${JP}`;
  const kana = 'コンビニ';
  for (let i = 0; i < kana.length; i++) {
    x.fillText(kana[i], w / 2, 500 + i * 70);
  }
  x.fillStyle = '#ffd45e';
  x.fillRect(10, h - 130, w - 20, 54);
  x.fillStyle = '#123a63';
  x.font = `bold 40px ${LAT}`;
  x.fillText('24H', w / 2, h - 103);
  return tex(c);
}

export function awningStripe() {
  const w = 256, h = 128;
  const { c, x } = cv(w, h);
  x.fillStyle = '#f4efe4';
  x.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? '#e26a5a' : '#f6f2e8';
    x.fillRect((i * w) / 8, 0, w / 8, h);
  }
  x.fillStyle = 'rgba(0,0,0,0.18)';
  x.fillRect(0, h - 26, w, 26);
  return tex(c, { repeat: [1, 1] });
}

/* interior ceiling light box / menu board */
export function menuBoard(kind = 0) {
  const w = 512, h = 256;
  const { c, x } = cv(w, h);
  const sets = [
    { bg: '#fff6e2', items: [['COFFEE', '¥120'], ['LATTE', '¥180'], ['HOT', '¥150']], accent: '#c8703a', title: 'HOT DRINK' },
    { bg: '#eef7ff', items: [['ODEN', '¥130'], ['BENTO', '¥520'], ['ONIGIRI', '¥140']], accent: '#3a6ea8', title: 'おでん / 弁当' },
    { bg: '#fff1f4', items: [['ICE', '¥160'], ['SWEETS', '¥220'], ['BREAD', '¥180']], accent: '#c04a72', title: 'SWEETS' },
  ];
  const s = sets[kind % sets.length];
  x.fillStyle = s.bg; x.fillRect(0, 0, w, h);
  x.fillStyle = s.accent; x.fillRect(0, 0, w, 54);
  x.fillStyle = '#ffffff';
  x.font = `bold 34px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(s.title, w / 2, 28);

  x.textAlign = 'left';
  s.items.forEach((it, i) => {
    const y = 74 + i * 58;
    x.fillStyle = 'rgba(0,0,0,0.06)';
    x.fillRect(24, y, w - 48, 46);
    x.fillStyle = '#33383f';
    x.font = `bold 30px ${JP}`;
    x.fillText(it[0], 38, y + 24);
    x.fillStyle = s.accent;
    x.font = `bold 30px ${LAT}`;
    x.textAlign = 'right';
    x.fillText(it[1], w - 38, y + 24);
    x.textAlign = 'left';
  });
  x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 5; x.strokeRect(3, 3, w - 6, h - 6);
  return tex(c);
}

export function lightPanel() {
  const w = 128, h = 128;
  const { c, x } = cv(w, h);
  x.fillStyle = '#fffaf0'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#f2e6cf';
  x.fillRect(10, 10, w - 20, h - 20);
  x.strokeStyle = 'rgba(0,0,0,0.10)'; x.lineWidth = 4;
  x.strokeRect(10, 10, w - 20, h - 20);
  return tex(c);
}

/* drink cooler content: rows of cans */
export function drinkShelf(seed = 0) {
  const w = 256, h = 512;
  const { c, x } = cv(w, h);
  x.fillStyle = '#dfe9f2'; x.fillRect(0, 0, w, h);

  const cols = ['#e8534f', '#4f86e8', '#3fa86a', '#f0b13c', '#8b5fd6', '#43b8c4', '#e0729b', '#6a8f52'];
  const rows = 6, perRow = 4;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    // shelf board
    x.fillStyle = '#c3d0dc';
    x.fillRect(0, r * ch + ch - 10, w, 10);
    for (let i = 0; i < perRow; i++) {
      const cw = w / perRow;
      const cx0 = i * cw + 8;
      const cwid = cw - 16;
      const cy0 = r * ch + 12;
      const chei = ch - 30;
      const col = cols[(r * perRow + i + seed * 3) % cols.length];
      // can body
      x.fillStyle = col;
      x.fillRect(cx0, cy0, cwid, chei);
      // label
      x.fillStyle = 'rgba(255,255,255,0.9)';
      x.fillRect(cx0, cy0 + chei * 0.34, cwid, chei * 0.3);
      x.fillStyle = 'rgba(0,0,0,0.55)';
      x.fillRect(cx0 + 3, cy0 + chei * 0.44, cwid - 6, 3);
      // top
      x.fillStyle = 'rgba(255,255,255,0.65)';
      x.fillRect(cx0, cy0, cwid, 5);
      x.fillStyle = 'rgba(0,0,0,0.18)';
      x.fillRect(cx0 + cwid - 5, cy0, 5, chei);
    }
  }
  // glass reflection streaks
  x.globalAlpha = 0.16;
  x.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) x.fillRect(i * 60, 0, 14, h);
  x.globalAlpha = 1;
  return tex(c);
}

/* open refrigerated case : bento / onigiri */
export function bentoCase() {
  const w = 512, h = 128;
  const { c, x } = cv(w, h);
  x.fillStyle = '#e9f1f6'; x.fillRect(0, 0, w, h);
  const items = [
    ['#e8b04a', '#c98c2c'], ['#d76a5a', '#b34f42'], ['#7fae5a', '#5d8b40'],
    ['#e8b04a', '#c98c2c'], ['#cf8f5a', '#a86d3f'], ['#8fbf6a', '#6b9a4c'],
    ['#d76a5a', '#b34f42'], ['#e8b04a', '#c98c2c'],
  ];
  items.forEach((it, i) => {
    const cw = w / items.length;
    const bx = i * cw + 6, bw = cw - 12;
    x.fillStyle = it[0];
    x.fillRect(bx, 26, bw, 78);
    x.fillStyle = it[1];
    x.fillRect(bx, 26, bw, 12);
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.fillRect(bx + 6, 46, bw - 12, 16);
    x.fillStyle = 'rgba(0,0,0,0.35)';
    x.fillRect(bx + 8, 52, bw - 20, 3);
    x.fillStyle = 'rgba(0,0,0,0.15)';
    x.fillRect(bx, 96, bw, 8);
  });
  x.fillStyle = '#cfdae4';
  x.fillRect(0, 108, w, 20);
  return tex(c);
}

export function magazineRack() {
  const w = 512, h = 160;
  const { c, x } = cv(w, h);
  x.fillStyle = '#2b3240'; x.fillRect(0, 0, w, h);
  const cols = ['#e8534f', '#4f86e8', '#f0b13c', '#3fa86a', '#e0729b', '#8b5fd6', '#43b8c4', '#dfe4ea', '#e8534f', '#4f86e8', '#f0b13c', '#dfe4ea'];
  const n = cols.length;
  for (let i = 0; i < n; i++) {
    const bw = w / n;
    x.fillStyle = cols[i];
    x.fillRect(i * bw + 2, 10, bw - 4, h - 24);
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.fillRect(i * bw + 5, 20, bw - 10, 26);
    x.fillStyle = 'rgba(0,0,0,0.35)';
    x.fillRect(i * bw + 7, 30, bw - 14, 3);
    x.fillRect(i * bw + 7, 38, bw - 18, 3);
    x.fillStyle = 'rgba(0,0,0,0.25)';
    x.fillRect(i * bw + 5, h - 40, bw - 10, 22);
  }
  return tex(c);
}

export function interiorFloor() {
  const w = 512, h = 512;
  const { c, x } = cv(w, h);
  x.fillStyle = '#efe9dd'; x.fillRect(0, 0, w, h);
  // tile
  x.strokeStyle = 'rgba(0,0,0,0.07)'; x.lineWidth = 2;
  for (let i = 0; i <= 8; i++) {
    x.beginPath(); x.moveTo((i * w) / 8, 0); x.lineTo((i * w) / 8, h); x.stroke();
    x.beginPath(); x.moveTo(0, (i * h) / 8); x.lineTo(w, (i * h) / 8); x.stroke();
  }
  // guide line to the register
  x.strokeStyle = 'rgba(240,150,60,0.55)';
  x.lineWidth = 12;
  x.setLineDash([26, 18]);
  x.beginPath();
  x.moveTo(w * 0.22, h * 0.06);
  x.lineTo(w * 0.22, h * 0.62);
  x.lineTo(w * 0.62, h * 0.62);
  x.stroke();
  x.setLineDash([]);
  // arrows
  x.fillStyle = 'rgba(240,150,60,0.6)';
  const arrow = (cx, cy, a) => {
    x.save(); x.translate(cx, cy); x.rotate(a);
    x.beginPath(); x.moveTo(0, -14); x.lineTo(16, 10); x.lineTo(-16, 10); x.closePath(); x.fill();
    x.restore();
  };
  arrow(w * 0.22, h * 0.34, 0);
  arrow(w * 0.42, h * 0.62, Math.PI / 2);
  // text
  x.fillStyle = 'rgba(70,80,95,0.5)';
  x.font = `bold 46px ${JP}`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('レジ', w * 0.72, h * 0.72);
  x.font = `bold 30px ${JP}`;
  x.fillText('お買い上げありがとうございます', w * 0.5, h * 0.9);
  return tex(c, { repeat: [1, 1] });
}

/* vending machine front */
export function vendingFront() {
  const w = 256, h = 512;
  const { c, x } = cv(w, h);
  x.fillStyle = '#22262f'; x.fillRect(0, 0, w, h);

  // illuminated product window
  x.fillStyle = '#fdf6e6'; x.fillRect(16, 40, w - 32, 300);
  const cols = ['#e8534f', '#4f86e8', '#3fa86a', '#f0b13c', '#8b5fd6', '#43b8c4'];
  const rows = 4, perRow = 3;
  const ch = 300 / rows;
  for (let r = 0; r < rows; r++) {
    x.fillStyle = '#c9d5df';
    x.fillRect(16, 40 + r * ch + ch - 8, w - 32, 8);
    for (let i = 0; i < perRow; i++) {
      const cw = (w - 32) / perRow;
      const cx0 = 16 + i * cw + 10;
      const cwid = cw - 20;
      const cy0 = 40 + r * ch + 10;
      const chei = ch - 28;
      x.fillStyle = cols[(r * perRow + i) % cols.length];
      x.fillRect(cx0, cy0, cwid, chei);
      x.fillStyle = 'rgba(255,255,255,0.9)';
      x.fillRect(cx0, cy0 + chei * 0.35, cwid, chei * 0.26);
      x.fillStyle = 'rgba(0,0,0,0.5)';
      x.fillRect(cx0 + 3, cy0 + chei * 0.46, cwid - 6, 3);
      x.fillStyle = 'rgba(255,255,255,0.6)';
      x.fillRect(cx0, cy0, cwid, 4);
    }
    // price tag
    x.fillStyle = '#ffd45e';
    x.fillRect(16, 40 + r * ch + ch - 22, 46, 16);
  }
  // brand band
  x.fillStyle = '#e8342f'; x.fillRect(0, 8, w, 26);
  x.fillStyle = '#ffffff';
  x.font = `bold 20px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('COLD  DRINK', w / 2, 22);

  // buttons + slot
  x.fillStyle = '#39404c'; x.fillRect(16, 352, w - 32, 60);
  for (let i = 0; i < 6; i++) {
    x.fillStyle = i % 2 ? '#ff7a5e' : '#7fc4ff';
    x.fillRect(24 + i * 38, 362, 28, 18);
    x.fillStyle = 'rgba(0,0,0,0.35)';
    x.fillRect(24 + i * 38, 388, 28, 10);
  }
  x.fillStyle = '#151a22'; x.fillRect(30, 422, 90, 46);
  x.fillStyle = '#5d6878'; x.fillRect(150, 422, 76, 46);
  x.fillStyle = '#ffd45e'; x.font = `bold 22px ${LAT}`;
  x.fillText('¥130', w / 2, 486);
  return tex(c);
}

/* outdoor notice / poster board */
export function noticeBoard() {
  const w = 256, h = 320;
  const { c, x } = cv(w, h);
  x.fillStyle = '#3a4250'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#dfe3e8'; x.fillRect(8, 8, w - 16, h - 16);
  const papers = [
    ['#fff8e2', '#c8703a', 'アルバイト募集'],
    ['#eef4ff', '#3a6ea8', '地域情報'],
    ['#fff1f4', '#c04a72', 'チラシ'],
    ['#f2f7f0', '#4e7a52', 'お知らせ'],
  ];
  papers.forEach((p, i) => {
    const y = 16 + i * ((h - 32) / papers.length);
    const hh = (h - 32) / papers.length - 6;
    x.fillStyle = p[0]; x.fillRect(14, y, w - 28, hh);
    x.fillStyle = p[1]; x.fillRect(14, y, w - 28, 26);
    x.fillStyle = '#ffffff';
    x.font = `bold 20px ${JP}`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(p[2], w / 2, y + 13);
    x.fillStyle = 'rgba(0,0,0,0.25)';
    for (let k = 0; k < 3; k++) x.fillRect(24, y + 38 + k * 12, w - 48 - k * 20, 5);
  });
  return tex(c);
}

/* japanese street name sign (blue board) */
export function roadSign() {
  const w = 512, h = 320;
  const { c, x } = cv(w, h);
  x.fillStyle = '#1d5fae'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 10;
  x.strokeRect(10, 10, w - 20, h - 20);
  x.fillStyle = '#ffffff';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `bold 62px ${JP}`;
  x.fillText('さくら', w / 2, 62);
  x.fillText('二丁目', w / 2, 130);
  x.font = `bold 34px ${LAT}`;
  x.fillText('SAKURA 2-CHOME', w / 2, 196);
  x.fillStyle = 'rgba(255,255,255,0.6)';
  x.font = `bold 26px ${JP}`;
  x.fillText('← 駅  3分', w / 2, 250);
  return tex(c);
}

export function parkingSign() {
  const w = 256, h = 384;
  const { c, x } = cv(w, h);
  x.fillStyle = '#f6f4ee'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1f6fb2'; x.fillRect(0, 0, w, 70);
  x.fillStyle = '#ffffff';
  x.font = `bold 52px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('P', w / 2, 36);
  x.fillStyle = '#26304a';
  x.font = `bold 44px ${JP}`;
  x.fillText('コイン', w / 2, 120);
  x.fillText('パーキング', w / 2, 172);
  x.fillStyle = '#c2452f';
  x.font = `bold 40px ${LAT}`;
  x.fillText('¥200 / 30min', w / 2, 250);
  x.fillStyle = 'rgba(40,50,70,0.5)';
  x.font = `bold 26px ${JP}`;
  x.fillText('24時間営業', w / 2, 320);
  x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6);
  return tex(c);
}

/* door mat */
export function doorMat() {
  const w = 256, h = 128;
  const { c, x } = cv(w, h);
  x.fillStyle = '#3b3a3f'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#4c4a51';
  for (let i = 0; i < 14; i++) x.fillRect(0, i * 9 + 2, w, 5);
  x.fillStyle = 'rgba(240,240,235,0.75)';
  x.font = `bold 44px ${LAT}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('WELCOME', w / 2, h / 2);
  return tex(c);
}

/* bin label */
export function binLabel() {
  const w = 128, h = 128;
  const { c, x } = cv(w, h);
  x.fillStyle = '#e9e6dc'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#3f9e6a'; x.fillRect(0, 0, w, 34);
  x.fillStyle = '#ffffff';
  x.font = `bold 26px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('ゴミ', w / 2, 17);
  x.fillStyle = '#3a4150';
  x.font = `bold 22px ${JP}`;
  x.fillText('燃える', w / 2, 68);
  x.fillText('ゴミ', w / 2, 96);
  return tex(c);
}

/* price tag hanging from the ceiling */
export function priceTag(text = 'おにぎり', price = '¥140') {
  const w = 256, h = 128;
  const { c, x } = cv(w, h);
  x.fillStyle = '#fffdf2'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#e8342f'; x.fillRect(0, 0, w, 40);
  x.fillStyle = '#ffffff';
  x.font = `bold 30px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, 20);
  x.fillStyle = '#26304a';
  x.font = `bold 46px ${LAT}`;
  x.fillText(price, w / 2, 84);
  x.strokeStyle = 'rgba(0,0,0,0.28)'; x.lineWidth = 5; x.strokeRect(2, 2, w - 4, h - 4);
  return tex(c);
}

/* poster pasted on the glass */
export function poster(kind = 0) {
  const w = 256, h = 384;
  const { c, x } = cv(w, h);
  const conf = [
    { bg: '#ffe9c7', a: '#e2703a', b: '#3a4a6a', t1: '新発売', t2: '期間限定', t3: 'SALE' },
    { bg: '#e7f2ff', a: '#3a7fc4', b: '#25405e', t1: 'お得', t2: 'まとめ買い', t3: 'POINT 5倍' },
    { bg: '#ffeef2', a: '#d1527e', b: '#5c3145', t1: '新作', t2: 'スイーツ', t3: 'NEW' },
  ][kind % 3];
  x.fillStyle = conf.bg; x.fillRect(0, 0, w, h);
  x.fillStyle = conf.a; x.fillRect(0, 0, w, 70);
  x.fillStyle = '#ffffff';
  x.font = `bold 44px ${JP}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(conf.t1, w / 2, 36);
  x.fillStyle = conf.b;
  x.font = `bold 40px ${JP}`;
  x.fillText(conf.t2, w / 2, 130);
  // simple illustration block
  x.fillStyle = conf.a;
  x.beginPath(); x.arc(w / 2, 230, 62, 0, 6.2832); x.fill();
  x.fillStyle = '#fff';
  x.beginPath(); x.arc(w / 2, 230, 30, 0, 6.2832); x.fill();
  x.fillStyle = conf.b;
  x.font = `bold 38px ${LAT}`;
  x.fillText(conf.t3, w / 2, 336);
  return tex(c);
}

/* building facade with lit windows */
export function facade(kind = 0) {
  const w = 512, h = 512;
  const { c, x } = cv(w, h);
  const base = ['#3d4354', '#464c5c', '#363c4b'][kind % 3];
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  // floor bands
  x.fillStyle = 'rgba(0,0,0,0.18)';
  for (let i = 0; i < 7; i++) x.fillRect(0, i * 74 + 58, w, 12);
  // windows
  const cols = 5, rows = 6;
  const ww = w / cols, wh = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      const lit = Math.random() > 0.42;
      const wx = i * ww + ww * 0.18;
      const wy = r * wh + wh * 0.16;
      const wwid = ww * 0.64;
      const whei = wh * 0.5;
      x.fillStyle = lit ? (Math.random() > 0.65 ? '#ffe0a8' : '#ffd28a') : '#1c222e';
      x.fillRect(wx, wy, wwid, whei);
      if (lit) {
        x.fillStyle = 'rgba(0,0,0,0.12)';
        x.fillRect(wx, wy + whei * 0.5, wwid, whei * 0.5);
      }
      x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 3;
      x.strokeRect(wx, wy, wwid, whei);
    }
  }
  // balcony rails
  x.strokeStyle = 'rgba(200,210,220,0.18)'; x.lineWidth = 4;
  for (let r = 0; r < rows; r++) {
    x.beginPath(); x.moveTo(0, r * wh + wh * 0.8); x.lineTo(w, r * wh + wh * 0.8); x.stroke();
  }
  return tex(c, { repeat: [1, 1] });
}

/* small concrete / tile detail for sidewalks and walls */
export function concreteTint() {
  const w = 128, h = 128;
  const { c, x } = cv(w, h);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h);
  noise(x, w, h, 900, 0.06);
  x.strokeStyle = 'rgba(0,0,0,0.06)'; x.lineWidth = 2;
  x.strokeRect(0, 0, w, h);
  return tex(c, { repeat: [4, 4] });
}
