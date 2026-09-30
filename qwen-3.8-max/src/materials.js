// materials.js — toon gradient ramp, palette, material + texture factories.
import * as THREE from 'three';
import { canvasTexture, roundRect } from './util.js';

/* ------------------------------------------------------------------ *
 * Toon gradient ramp (discrete lighting steps => cel shading)
 * ------------------------------------------------------------------ */
function makeGradientMap(steps) {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    // emphasise a bright top step and a deep shadow step
    const t = i / (steps - 1);
    data[i] = Math.round(Math.pow(t, 0.85) * 255);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

export const GRAD3 = makeGradientMap(3);
export const GRAD4 = makeGradientMap(4);
export const GRAD5 = makeGradientMap(5);

/* ------------------------------------------------------------------ *
 * Palette (soft anime night colours)
 * ------------------------------------------------------------------ */
export const PALETTE = {
  asphalt:      0x2b3140,
  asphaltWet:   0x1d2331,
  sidewalk:     0x454d5e,
  curb:         0x5a6274,
  white:        0xf2f5f8,
  wall:         0xe7ecf0,
  wallShade:    0xc3ccd6,
  trim:         0x2f6fd0,   // konbini blue
  trimGreen:    0x2fbf7a,   // konbini green
  trimOrange:   0xff8a3d,
  red:          0xe8524f,
  roof:         0x39424f,
  metal:        0x8d97a6,
  metalDark:    0x4c5462,
  wood:         0x9a6b45,
  warm:         0xffd9a0,
  warmWhite:    0xfff2d6,
  neonPink:     0xff5ea8,
  neonCyan:     0x4fe3ff,
  glass:        0x9fd3ff,
  black:        0x1a1f2b,
};

/* ------------------------------------------------------------------ *
 * Material factories
 * ------------------------------------------------------------------ */
export function toon(color, {
  emissive = 0x000000,
  emissiveIntensity = 1.0,
  grad = GRAD4,
  transparent = false,
  opacity = 1.0,
  side = THREE.FrontSide,
} = {}) {
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: grad,
    emissive,
    emissiveIntensity,
    transparent,
    opacity,
    side,
  });
  return m;
}

// Unlit glow material (bloom will pick these up) — for neon / lights / screens.
export function glow(color, { intensity = 1.0, transparent = false, opacity = 1.0, side = THREE.FrontSide } = {}) {
  const c = new THREE.Color(color).multiplyScalar(intensity);
  const m = new THREE.MeshBasicMaterial({ color: c, transparent, opacity, side });
  m.toneMapped = false;
  return m;
}

// Convenience-store glass: transparent, slightly tinted, no depth write so the
// warm interior stays visible through it.
export function glassMat({ opacity = 0.12, color = PALETTE.glass } = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: GRAD3,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/* ------------------------------------------------------------------ *
 * Procedural signage / poster textures (Japanese konbini flavour)
 * ------------------------------------------------------------------ */

// Horizontal store sign band: green/blue stripes with the store name.
export function storeSignTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    // base
    ctx.fillStyle = '#0e2b52';
    ctx.fillRect(0, 0, w, h);
    // tri-colour stripe (green / blue / orange) like a classic konbini fascia
    const stripeH = h * 0.16;
    ctx.fillStyle = '#2fbf7a'; ctx.fillRect(0, h - stripeH * 3, w, stripeH);
    ctx.fillStyle = '#2f6fd0'; ctx.fillRect(0, h - stripeH * 2, w, stripeH);
    ctx.fillStyle = '#ff8a3d'; ctx.fillRect(0, h - stripeH * 1, w, stripeH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // glow-ish text
    ctx.font = 'bold 120px "Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(120,220,255,0.9)';
    ctx.shadowBlur = 24;
    ctx.fillText('コンビニ', w * 0.5, h * 0.40);
    ctx.shadowBlur = 0;
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#bfe9ff';
    ctx.fillText('KONBINI  MART', w * 0.5, h * 0.68);
  });
}

// Small vertical banner (nobori-ish) / side sign.
export function bannerTexture(text, bg = '#e8524f', fg = '#ffffff') {
  return canvasTexture(128, 512, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg; ctx.lineWidth = 6; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = fg;
    ctx.font = 'bold 74px "Yu Gothic","Meiryo",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const chars = [...text];
    chars.forEach((ch, i) => ctx.fillText(ch, w / 2, 70 + i * 96));
  });
}

// Poster / advertisement panel.
export function posterTexture(kind = 0) {
  const bg = ['#2f6fd0', '#e8524f', '#2fbf7a', '#ff8a3d'][kind % 4];
  return canvasTexture(256, 356, (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.34, w * 0.30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px "Yu Gothic",sans-serif';
    ctx.textAlign = 'center';
    const words = [['新発売'], ['セール'], ['弁当'], ['コーヒー']][kind % 4];
    words.forEach((t, i) => ctx.fillText(t, w / 2, h * 0.66 + i * 52));
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('SALE', w / 2, h * 0.9);
  });
}

// Drink-bottle label strip for the cooler shelves.
export function drinksTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0c1a2b'; ctx.fillRect(0, 0, w, h);
    const cols = ['#ff5e5e', '#5ea8ff', '#5eff8f', '#ffd15e', '#c58bff', '#ff8ad1'];
    const bw = w / 12;
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = cols[i % cols.length];
      roundRect(ctx, i * bw + bw * 0.2, h * 0.18, bw * 0.6, h * 0.64, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(i * bw + bw * 0.28, h * 0.42, bw * 0.44, h * 0.12);
    }
  });
}

// Magazine / book rack covers.
export function magazineTexture() {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#101820'; ctx.fillRect(0, 0, w, h);
    const cols = ['#ff8a3d', '#4fe3ff', '#ff5ea8', '#a6ff5e', '#ffe15e', '#8a7bff', '#ff5e5e', '#5effb0'];
    const bw = w / 8;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(i * bw + 3, h * 0.08, bw - 6, h * 0.84);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(i * bw + 3, h * 0.55, bw - 6, h * 0.1);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px sans-serif';
      ctx.save();
      ctx.translate(i * bw + bw * 0.5, h * 0.3);
      ctx.fillText('誌', -10, 0);
      ctx.restore();
    }
  });
}

// Oden / bento counter front label.
export function odenTexture() {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 74px "Yu Gothic",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('おでん', w * 0.5, h * 0.54);
  });
}

// Vending machine front panel.
export function vendingTexture(base = '#1f6fd0') {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    // top glowing banner
    ctx.fillStyle = '#ffffff'; ctx.fillRect(8, 10, w - 16, 46);
    ctx.fillStyle = base; ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('つめた〜い', w / 2, 34);
    // product rows
    const rows = 4, cols = 4;
    const px = 18, py = 74, pw = (w - 36) / cols, ph = (h * 0.56) / rows;
    const canCols = ['#ff5e5e', '#ffd15e', '#5eff8f', '#5ea8ff'];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(px + c * pw, py + r * ph, pw - 4, ph - 6);
        ctx.fillStyle = canCols[(r + c) % canCols.length];
        roundRect(ctx, px + c * pw + pw * 0.28, py + r * ph + 6, pw * 0.4, ph - 20, 4);
        ctx.fill();
      }
    }
    // dispenser + coin slot
    ctx.fillStyle = '#111'; ctx.fillRect(w * 0.2, h * 0.78, w * 0.6, h * 0.12);
    ctx.fillStyle = '#222'; ctx.fillRect(w * 0.72, h * 0.66, w * 0.16, h * 0.1);
    ctx.fillStyle = '#ff5e5e'; ctx.beginPath(); ctx.arc(w * 0.8, h * 0.71, 6, 0, Math.PI * 2); ctx.fill();
  });
}

// Vertical streaks of water running down glass (animated via texture offset).
export function glassRainTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // faint vertical trails
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w;
      const len = 40 + Math.random() * 160;
      const y = Math.random() * h;
      const g = ctx.createLinearGradient(x, y, x, y + len);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(200,230,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    }
    // droplets
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 1 + Math.random() * 3;
      ctx.fillStyle = 'rgba(220,240,255,0.5)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }, { repeat: [2, 1] });
}

// Road-sign / notice board poster.
export function noticeTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f3efe4'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c9c2b0'; ctx.lineWidth = 6; ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 30px "Yu Gothic",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('お知らせ', w / 2, 52);
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'left';
    const lines = ['・本日 24時間営業', '・レジ袋 ご利用ください', '・店内 ATM あり', '・雨の日 感謝セール', '・おでん 始めました'];
    lines.forEach((l, i) => ctx.fillText(l, 26, 96 + i * 30));
  });
}

// Ground puddle / wet decal with soft reflective rim.
export function puddleTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(120,170,220,0.55)');
    g.addColorStop(0.6, 'rgba(60,90,130,0.35)');
    g.addColorStop(1, 'rgba(20,30,50,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    // blobby outline
    const cx = w / 2, cy = h / 2, R = w * 0.46;
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.2) {
      const rr = R * (0.72 + 0.28 * Math.sin(a * 3.1) * Math.cos(a * 1.7));
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.82;
      a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });
}

// Generic packed shelf of colourful products (gondola facing).
export function shelfProductsTexture(seedKind = 0) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f2f4f7'; ctx.fillRect(0, 0, w, h);
    const rows = 4;
    const palettes = [
      ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f45'],
      ['#f473b9', '#37d0ee', '#ffe066', '#7bdff2', '#b28dff'],
      ['#ff8a5c', '#ffa69e', '#fef9ef', '#a8dadc', '#f4a261'],
    ];
    const cols = palettes[seedKind % palettes.length];
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = '#d7dce3';
      ctx.fillRect(0, r * rh + rh - 8, w, 8);
      const items = 6 + (r % 2);
      const iw = w / items;
      for (let c = 0; c < items; c++) {
        ctx.fillStyle = cols[(r + c) % cols.length];
        const bh = rh * (0.5 + 0.1 * ((r * 3 + c) % 3));
        roundRect(ctx, c * iw + iw * 0.18, r * rh + (rh - 8) - bh, iw * 0.64, bh, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(c * iw + iw * 0.26, r * rh + (rh - 8) - bh + 6, iw * 0.48, 5);
      }
    }
  });
}

// Bento boxes (refrigerated case facing).
export function bentoTexture() {
  return canvasTexture(256, 192, (ctx, w, h) => {
    ctx.fillStyle = '#1b2430'; ctx.fillRect(0, 0, w, h);
    const cols = 4, rows = 3;
    const cw = w / cols, chh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = '#0f1620';
        ctx.fillRect(c * cw + 4, r * chh + 4, cw - 8, chh - 8);
        ctx.fillStyle = '#f5f0e6';
        roundRect(ctx, c * cw + 8, r * chh + 8, cw - 16, chh - 16, 5); ctx.fill();
        const foods = ['#e0653a', '#7bb661', '#e8c15a', '#b5651d'];
        for (let f = 0; f < 4; f++) {
          ctx.fillStyle = foods[f];
          ctx.beginPath();
          ctx.arc(c * cw + cw * (0.3 + (f % 2) * 0.4), r * chh + chh * (0.35 + Math.floor(f / 2) * 0.3), cw * 0.11, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });
}

// Onigiri / snack triangles.
export function onigiriTexture() {
  return canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#f6f1e7'; ctx.fillRect(0, 0, w, h);
    const cols = 5;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c + 0.5) * (w / cols), y = r * (h / 2) + h * 0.28;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x, y - 22); ctx.lineTo(x + 20, y + 16); ctx.lineTo(x - 20, y + 16); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2b2b2b';
        ctx.fillRect(x - 12, y + 2, 24, 14);
        ctx.strokeStyle = '#d9d2c4'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 22); ctx.lineTo(x + 20, y + 16); ctx.lineTo(x - 20, y + 16); ctx.closePath(); ctx.stroke();
      }
    }
  });
}

// Soft radial light-pool (for warm spill on wet pavement).
export function poolTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

// Vertical light-streak used to fake wet-ground reflections of neon.
export function reflectionTexture(color = '#ffd9a0') {
  return canvasTexture(128, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.15, color);
    g.addColorStop(0.5, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // broken-up shimmer bands
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 40; i++) {
      const y = Math.random() * h;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, y, w, 1 + Math.random() * 4);
    }
  });
}
