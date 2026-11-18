import * as THREE from 'three';
import { canvas2d, texFromCanvas, rng, rand, pick } from './utils.js';

/* ------------------------------------------------------------------ *
 *  Every texture in the diorama is painted at runtime on a 2D canvas —
 *  no external assets, so the whole scene stays self-contained.
 * ------------------------------------------------------------------ */

const jp = [
  'おでん', 'お茶', 'おにぎり', 'たばこ', 'あたらしい', 'なつやすみ',
  'ホット', 'カフェ', 'パン', 'ごはん', 'cold', 'ICE', '生', 'new',
  '朝ご飯', '夕飯', 'セール', 'ポイント', '环保', ' recycle',
];

/**
 * One repeating cell of the main store sign. Laid out so that tiling it
 * along the fascia produces the classic konbini red / green / cream / orange
 * banding with the wordmark reading correctly on every repeat.
 */
export function storeSignTexture(w = 768, h = 192) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#f7f1e2';
  ctx.fillRect(0, 0, w, h);

  // right-hand banding that runs into the next tile seamlessly
  ctx.fillStyle = '#0f8f4d';
  ctx.fillRect(w * 0.62, 0, w * 0.09, h);
  ctx.fillStyle = '#f0a02a';
  ctx.fillRect(w * 0.71, 0, w * 0.08, h);
  ctx.fillStyle = '#f7f1e2';
  ctx.fillRect(w * 0.79, 0, w * 0.09, h);

  // wordmark panel
  ctx.fillStyle = '#e8342a';
  ctx.fillRect(0, 0, w * 0.40, h);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${h * 0.46}px "Hiragino Sans","Yu Gothic",sans-serif`;
  ctx.fillText('コンビニ', w * 0.20, h * 0.38);
  ctx.font = `bold ${h * 0.105}px "Hiragino Sans","Yu Gothic",sans-serif`;
  ctx.fillText('MIDNIGHT MART', w * 0.20, h * 0.76);

  // services strip
  ctx.fillStyle = '#20304a';
  ctx.font = `bold ${h * 0.26}px "Hiragino Sans","Yu Gothic",sans-serif`;
  ctx.fillText('24h', w * 0.51, h * 0.34);
  ctx.font = `${h * 0.1}px "Hiragino Sans","Yu Gothic",sans-serif`;
  ctx.fillText('OPEN', w * 0.51, h * 0.58);
  ctx.font = `${h * 0.085}px "Hiragino Sans","Yu Gothic",sans-serif`;
  ctx.fillText('酒・たばこ・ATM', w * 0.51, h * 0.82);

  // tile seam: the cream band closes the loop
  ctx.fillStyle = '#f7f1e2';
  ctx.fillRect(w * 0.88, 0, w * 0.12, h);
  return texFromCanvas(c);
}

/** Small hanging blade sign / lamp box face. */
export function lampBoxTexture(w = 256, h = 512) {
  const { c, ctx } = canvas2d(w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#fffaf0');
  g.addColorStop(0.5, '#fdf3dd');
  g.addColorStop(1, '#f3e7cc');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#e8342a';
  ctx.fillRect(0, 0, w, h * 0.5);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${w * 0.34}px "Hiragino Sans",sans-serif`;
  ctx.fillText('お', w * 0.5, h * 0.17);
  ctx.fillText('に', w * 0.5, h * 0.36);
  ctx.fillStyle = '#0f8f4d';
  ctx.font = `bold ${w * 0.62}px "Hiragino Sans",sans-serif`;
  ctx.fillText('％', w * 0.34, h * 0.66);
  ctx.fillStyle = '#20304a';
  ctx.font = `bold ${w * 0.3}px "Hiragino Sans",sans-serif`;
  ctx.fillText('REGD', w * 0.68, h * 0.62);
  ctx.font = `${w * 0.13}px "Hiragino Sans",sans-serif`;
  ctx.fillText('組合員様', w * 0.68, h * 0.74);
  ctx.fillStyle = '#d94f2b';
  ctx.fillRect(w * 0.08, h * 0.9, w * 0.84, h * 0.05);
  return texFromCanvas(c);
}

/** Warm promo poster for the shop window / wall. */
const _posterCache = new Map();
export function posterTexture(seed = 1, w = 384, h = 512) {
  const key = `p${seed}|${w}|${h}`;
  if (_posterCache.has(key)) return _posterCache.get(key);
  const { c, ctx } = canvas2d(w, h);
  const schemes = [
    ['#ff5f8d', '#ffd36b', '#20304a'],
    ['#5fe4ff', '#ffffff', '#0b2a4a'],
    ['#ff8a3d', '#fff3d6', '#3a1e12'],
    ['#a6ff8f', '#f6ffe8', '#1c3b1a'],
    ['#c79bff', '#ffe9ff', '#2a1440'],
    ['#ffe066', '#fffbe8', '#4a3a10'],
  ];
  const s = schemes[(((seed | 0) % schemes.length) + schemes.length) % schemes.length];
  ctx.fillStyle = s[1];
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = s[0];
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.34, w * 0.32, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = s[2];
  ctx.textAlign = 'center';
  ctx.font = `bold ${w * 0.26}px "Hiragino Sans",sans-serif`;
  ctx.fillText(pick(jp), w * 0.5, h * 0.32);
  ctx.font = `bold ${w * 0.13}px "Hiragino Sans",sans-serif`;
  ctx.fillText(pick(jp), w * 0.5, h * 0.48);
  ctx.fillStyle = s[0];
  ctx.fillRect(w * 0.1, h * 0.58, w * 0.8, h * 0.2);
  ctx.fillStyle = s[1];
  ctx.font = `bold ${w * 0.12}px "Hiragino Sans",sans-serif`;
  ctx.fillText('24時間営業', w * 0.5, h * 0.68);
  ctx.fillStyle = s[2];
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(w * 0.12, h * 0.82 + i * h * 0.03, w * rand(0.3, 0.76), h * 0.016);
  }
  const tex = texFromCanvas(c);
  _posterCache.set(key, tex);
  return tex;
}

/** Magazine / comic cover. */
const _magCache = new Map();
export function magazineTexture(seed = 0, w = 192, h = 256) {
  const key = `m${seed}|${w}|${h}`;
  if (_magCache.has(key)) return _magCache.get(key);
  const { c, ctx } = canvas2d(w, h);
  const hues = [8, 32, 48, 120, 190, 210, 280, 330];
  const hue = hues[(((seed | 0) * 3) % hues.length + hues.length) % hues.length];
  ctx.fillStyle = `hsl(${hue},72%,72%)`;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = `hsl(${(hue + 40) % 360},80%,58%)`;
  ctx.beginPath();
  ctx.arc(w * rand(0.3, 0.7), h * rand(0.25, 0.5), w * rand(0.22, 0.36), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `hsl(${(hue + 180) % 360},60%,30%)`;
  ctx.fillRect(0, h * 0.56, w, h * 0.16);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${w * 0.16}px "Hiragino Sans",sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(jp[seed % jp.length], w * 0.5, h * 0.68);
  ctx.fillStyle = `hsl(${hue},70%,95%)`;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(w * 0.1, h * 0.78 + i * h * 0.055, w * rand(0.4, 0.8), h * 0.02);
  }
  const tex = texFromCanvas(c);
  _magCache.set(key, tex);
  return tex;
}

/** Bento tray lid art. */
export function bentoTexture(seed = 0, w = 256, h = 192) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#fdfaf3';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e9dcc4';
  ctx.fillRect(0, 0, w, h * 0.16);
  ctx.fillStyle = '#d94f2b';
  ctx.fillRect(w * 0.04, h * 0.2, w * 0.42, h * 0.72);
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${h * 0.13}px "Hiragino Sans",sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('弁当', w * 0.25, h * 0.62);
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath();
  ctx.arc(w * 0.72, h * 0.44, w * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5b8c3a';
  ctx.fillRect(w * 0.58, h * 0.64, w * 0.3, h * 0.28);
  ctx.fillStyle = '#20304a';
  ctx.font = `${h * 0.08}px "Hiragino Sans",sans-serif`;
  ctx.fillText('¥' + Math.floor(rand(380, 780)), w * 0.72, h * 0.82);
  return texFromCanvas(c);
}

/** Asphalt with painted markings, wet sheen variation. */
export function asphaltTexture(size = 1024) {
  const { c, ctx } = canvas2d(size, size);
  ctx.fillStyle = '#2b3040';
  ctx.fillRect(0, 0, size, size);
  // grain
  for (let i = 0; i < 26000; i++) {
    const v = rand(0.05, 0.22);
    ctx.fillStyle = `rgba(${v * 255},${v * 262},${v * 290},${rand(0.05, 0.35)})`;
    ctx.fillRect(rand(0, size), rand(0, size), rand(1, 2.6), rand(1, 2.6));
  }
  // patchy repairs
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = `rgba(20,24,36,${rand(0.1, 0.3)})`;
    ctx.beginPath();
    ctx.ellipse(rand(0, size), rand(0, size), rand(30, 130), rand(20, 90), rand(0, 3.14), 0, 6.3);
    ctx.fill();
  }
  return texFromCanvas(c, { repeat: [3, 3] });
}

/** Sidewalk tiles. */
export function pavementTexture(size = 512) {
  const { c, ctx } = canvas2d(size, size);
  ctx.fillStyle = '#5c606c';
  ctx.fillRect(0, 0, size, size);
  const step = size / 8;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const v = rand(-0.06, 0.06);
      ctx.fillStyle = `rgba(255,255,255,${0.05 + v})`;
      ctx.fillRect(x * step + 1.5, y * step + 1.5, step - 3, step - 3);
    }
  }
  ctx.strokeStyle = 'rgba(20,24,34,0.45)';
  ctx.lineWidth = 2.4;
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(30,36,50,${rand(0.04, 0.2)})`;
    ctx.fillRect(rand(0, size), rand(0, size), rand(1, 3), rand(1, 3));
  }
  return texFromCanvas(c, { repeat: [4, 4] });
}

/** Distant window grid for the background buildings. */
export function windowGridTexture(cols = 6, rows = 8, w = 384, h = 512) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#1d2233';
  ctx.fillRect(0, 0, w, h);
  const pad = w * 0.07;
  const cw = (w - pad * (cols + 1)) / cols;
  const ch = (h - pad * (rows + 1)) / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lit = rng() < 0.42;
      const warm = rng() < 0.75;
      ctx.fillStyle = lit
        ? warm
          ? `hsl(${rand(30, 46)},${rand(60, 85)}%,${rand(62, 82)}%)`
          : `hsl(${rand(185, 210)},${rand(50, 75)}%,${rand(60, 78)}%)`
        : `rgba(10,14,26,0.85)`;
      ctx.fillRect(pad + x * (cw + pad), pad + y * (ch + pad), cw, ch);
      if (!lit) {
        ctx.fillStyle = 'rgba(90,120,170,0.10)';
        ctx.fillRect(pad + x * (cw + pad), pad + y * (ch + pad), cw, ch * 0.3);
      }
    }
  }
  return texFromCanvas(c);
}

/** Rain-streaked glass overlay (alpha only). */
export function streakTexture(w = 512, h = 512) {
  const { c, ctx } = canvas2d(w, h);
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) {
    const x = rand(0, w);
    const len = rand(20, 190);
    const y = rand(-40, h);
    const g = ctx.createLinearGradient(x, y, x, y + len);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${rand(0.10, 0.34)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = rand(0.8, 2.6);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + rand(-4, 4), y + len * 0.4, x + rand(-4, 4), y + len * 0.6, x + rand(-3, 3), y + len);
    ctx.stroke();
    // droplet head
    ctx.fillStyle = `rgba(255,255,255,${rand(0.18, 0.4)})`;
    ctx.beginPath();
    ctx.ellipse(x, y + len, rand(1.2, 3), rand(2, 5), 0, 0, 6.3);
    ctx.fill();
  }
  return texFromCanvas(c);
}

/** Soft radial blob used for lamp glows and puddle sheen. */
export function glowSprite(color = '#ffd9a0', size = 128, power = 2.2) {
  const { c, ctx } = canvas2d(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color);
  g.addColorStop(0.35, hexA(color, 0.45));
  g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  void power;
  return texFromCanvas(c, { srgb: true });
}

function hexA(hex, a) {
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  return hex;
}

/** Rain streak sprite for the falling drops. */
export function rainSprite(w = 16, h = 64) {
  const { c, ctx } = canvas2d(w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(200,225,255,0)');
  g.addColorStop(0.45, 'rgba(215,235,255,0.85)');
  g.addColorStop(1, 'rgba(235,245,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(w * 0.32, 0, w * 0.36, h);
  return texFromCanvas(c);
}

/** Circle for splash / ripple sprites. */
export function ringSprite(size = 128) {
  const { c, ctx } = canvas2d(size, size);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = size * 0.05;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = size * 0.03;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.24, 0, Math.PI * 2);
  ctx.stroke();
  return texFromCanvas(c);
}

/** Store bulletin board with layered paper notices. */
export function bulletinTexture(w = 512, h = 384) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#2a3550';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#39476a';
  ctx.fillRect(w * 0.04, h * 0.05, w * 0.92, h * 0.9);
  for (let i = 0; i < 7; i++) {
    const pw = rand(w * 0.16, w * 0.3);
    const ph = pw * rand(0.9, 1.4);
    const x = rand(w * 0.06, w * 0.94 - pw);
    const y = rand(h * 0.08, h * 0.86 - ph);
    ctx.save();
    ctx.translate(x + pw / 2, y + ph / 2);
    ctx.rotate(rand(-0.09, 0.09));
    ctx.fillStyle = `hsl(${rand(0, 60)},${rand(10, 40)}%,${rand(82, 96)}%)`;
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.fillStyle = 'rgba(40,50,70,0.55)';
    for (let l = 0; l < 5; l++) {
      ctx.fillRect(-pw * 0.4, -ph * 0.3 + l * ph * 0.13, pw * rand(0.3, 0.8), ph * 0.05);
    }
    if (i % 3 === 0) {
      ctx.fillStyle = '#e8342a';
      ctx.beginPath();
      ctx.arc(0, -ph * 0.34, pw * 0.08, 0, 6.3);
      ctx.fill();
    }
    ctx.restore();
  }
  return texFromCanvas(c);
}

/** Green Japanese ward road-name sign. */
export function roadSignTexture(w = 512, h = 160) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#0f6b4a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#f2f7f2';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = '#f2f7f2';
  ctx.textAlign = 'left';
  ctx.font = `bold ${h * 0.36}px "Hiragino Sans",sans-serif`;
  ctx.fillText('青葉坂', w * 0.08, h * 0.44);
  ctx.font = `${h * 0.2}px "Hiragino Sans",sans-serif`;
  ctx.fillText('Aoba-zaka', w * 0.08, h * 0.78);
  ctx.fillStyle = '#f2f7f2';
  ctx.font = `${h * 0.16}px "Hiragino Sans",sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('北  N', w * 0.92, h * 0.44);
  ctx.fillText('← 1-12', w * 0.92, h * 0.78);
  return texFromCanvas(c);
}

/** Vending machine front: rows of lit product windows. */
export function vendingFrontTexture(w = 384, h = 768) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#f0f2ee';
  ctx.fillRect(0, 0, w, h);
  // header
  ctx.fillStyle = '#d6322c';
  ctx.fillRect(0, 0, w, h * 0.16);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = `bold ${h * 0.085}px "Hiragino Sans",sans-serif`;
  ctx.fillText('COLD DRINKS', w * 0.5, h * 0.1);
  // product shelves
  const rows = 4;
  const rowH = h * 0.6 / rows;
  for (let r = 0; r < rows; r++) {
    const y = h * 0.2 + r * rowH;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(w * 0.06, y, w * 0.62, rowH * 0.82);
    for (let i = 0; i < 5; i++) {
      const hue = (r * 60 + i * 37 + 10) % 360;
      ctx.fillStyle = `hsl(${hue},70%,60%)`;
      ctx.fillRect(w * 0.08 + i * w * 0.118, y + rowH * 0.12, w * 0.085, rowH * 0.52);
      ctx.fillStyle = `hsl(${hue},40%,92%)`;
      ctx.fillRect(w * 0.08 + i * w * 0.118, y + rowH * 0.28, w * 0.085, rowH * 0.2);
    }
    ctx.fillStyle = '#c9ced6';
    ctx.fillRect(w * 0.06, y + rowH * 0.78, w * 0.62, rowH * 0.06);
    // price tags
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#ffd83d';
      ctx.fillRect(w * 0.08 + i * w * 0.118, y + rowH * 0.66, w * 0.085, rowH * 0.1);
    }
  }
  // right column: buttons + price display
  ctx.fillStyle = '#e3e6ea';
  ctx.fillRect(w * 0.72, h * 0.2, w * 0.24, h * 0.62);
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = '#2b3242';
      ctx.fillRect(w * 0.75 + i * w * 0.042, h * 0.21 + r * rowH, w * 0.03, rowH * 0.1);
    }
  }
  // coin slot / return
  ctx.fillStyle = '#2b3242';
  ctx.fillRect(w * 0.72, h * 0.85, w * 0.24, h * 0.1);
  ctx.fillStyle = '#ffd83d';
  ctx.fillRect(w * 0.76, h * 0.875, w * 0.16, h * 0.045);
  return texFromCanvas(c);
}

/** Interior light-box ceiling panel. */
export function lightboxTexture(w = 256, h = 128) {
  const { c, ctx } = canvas2d(w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#fffdf6');
  g.addColorStop(1, '#ffeecb');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(180,150,100,0.5)';
  ctx.lineWidth = 3;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo((i * w) / 4, 0);
    ctx.lineTo((i * w) / 4, h);
    ctx.stroke();
  }
  return texFromCanvas(c);
}

/** Steam / vapour puff. */
export function steamSprite(size = 128) {
  const { c, ctx } = canvas2d(size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, 'rgba(240,248,255,0.22)');
  g.addColorStop(1, 'rgba(240,248,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return texFromCanvas(c);
}

/** Circle for splash / ripple sprites. */
export function zebraTexture(w = 512, h = 256) {
  const { c, ctx } = canvas2d(w, h);
  ctx.clearRect(0, 0, w, h);
  const n = 9;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect((i * w) / n + w * 0.02, 0, w / n - w * 0.04, h);
  }
  // wear
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rand(0.1, 0.4)})`;
    ctx.fillRect(rand(0, w), rand(0, h), rand(3, 16), rand(2, 10));
  }
  ctx.globalCompositeOperation = 'source-over';
  return texFromCanvas(c);
}

/** Base plinth side: subtle brushed dark metal, reads as a model stand. */
export function plinthTexture(size = 512) {
  const { c, ctx } = canvas2d(size, size);
  ctx.fillStyle = '#232a38';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rand(0.015, 0.07)})`;
    ctx.fillRect(0, rand(0, size), size, rand(0.6, 1.6));
  }
  ctx.fillStyle = 'rgba(120,155,210,0.10)';
  ctx.fillRect(0, 0, size, size * 0.12);
  return texFromCanvas(c, { repeat: [4, 1] });
}

/** Awning canvas: green with thin cream pinstripes. */
export function awningTexture(w = 256, h = 64) {
  const { c, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#1f8a5f';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = '#f2efe2';
    ctx.fillRect(i * (w / 8) + w / 16, 0, w / 40, h);
  }
  ctx.fillStyle = 'rgba(10,40,28,0.14)';
  ctx.fillRect(0, h * 0.74, w, h * 0.26);
  return texFromCanvas(c, { repeat: [4, 1] });
}

/** Curb stone: pale concrete with rain-darkened joints. */
export function curbTexture(size = 256) {
  const { c, ctx } = canvas2d(size, size / 4);
  const h = size / 4;
  ctx.fillStyle = '#9aa0aa';
  ctx.fillRect(0, 0, size, h);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(90,100,120,${rand(0.02, 0.16)})`;
    ctx.fillRect(rand(0, size), rand(0, h), rand(1, 4), rand(1, 2));
  }
  ctx.fillStyle = 'rgba(40,48,64,0.5)';
  ctx.fillRect(0, h * 0.82, size, h * 0.18);
  return texFromCanvas(c, { repeat: [8, 1] });
}

/** 1px-tall gradient used as the fake sky gradient behind the diorama. */
export function skyTexture(h = 512) {
  const { c, ctx } = canvas2d(4, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#070b18');
  g.addColorStop(0.42, '#141d38');
  g.addColorStop(0.68, '#2b3352');
  g.addColorStop(0.85, '#4a4a63');
  g.addColorStop(1.0, '#6b5f63');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}