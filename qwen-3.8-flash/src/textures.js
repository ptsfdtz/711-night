import * as THREE from 'three';

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gradientMap() {
  const steps = new Uint8Array([70, 118, 168, 218, 255]);
  const t = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

export function canvasTexture(w, h, draw, { repeat = null, srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

function lines(ctx, x, y, w, n, color, rnd) {
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const lw = w * (0.4 + rnd() * 0.6);
    ctx.fillRect(x, y, lw, 6);
    y += 13;
  }
}

export function signTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f4f7fb';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1f6fd6';
    ctx.fillRect(0, h - 46, w, 46);
    ctx.fillStyle = '#e8434f';
    ctx.fillRect(0, h - 54, w, 8);
    // logo
    ctx.beginPath();
    ctx.arc(130, 110, 74, 0, Math.PI * 2);
    ctx.fillStyle = '#e8434f';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 92px "Yu Gothic UI","MS PGothic",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('夜', 130, 116);
    ctx.font = '900 128px "Yu Gothic UI","MS PGothic",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#173a75';
    ctx.fillText('光', 250, 108);
    ctx.fillStyle = '#e8434f';
    ctx.fillText('マート', 402, 108);
    ctx.fillStyle = '#1f6fd6';
    ctx.font = '900 40px "Arial Black",sans-serif';
    ctx.fillText('YAKOU MART', 250, 192);
    ctx.fillStyle = '#ffd94a';
    ctx.font = '900 40px "Arial Black",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('24H', w - 40, 196);
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 30px "Yu Gothic UI",sans-serif';
    ctx.fillText('コンビニ', w - 190, 196);
  });
}

export function signSideTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#173a75';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8434f';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.fillStyle = '#f4f7fb';
    ctx.font = '900 130px "Yu Gothic UI","MS PGothic",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ['マ', 'ー', 'ト'].forEach((ch, i) => ctx.fillText(ch, w / 2, 95 + i * 120));
    ctx.fillStyle = '#ffd94a';
    ctx.font = '900 44px "Arial Black",sans-serif';
    ctx.fillText('24h', w / 2, 452);
  });
}

export function awningTexture() {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#e8eef7';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2f66d0';
    for (let x = 0; x < w; x += 128) ctx.fillRect(x, 0, 64, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(10,20,45,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, { repeat: [4, 1] });
}

export function vendingTexture() {
  return canvasTexture(512, 900, (ctx, w, h) => {
    ctx.fillStyle = '#122036';
    ctx.fillRect(0, 0, w, h);
    // header
    ctx.fillStyle = '#d92b2b';
    ctx.fillRect(18, 18, w - 36, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 56px "Yu Gothic UI","MS PGothic",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('つめたい', 130, 78);
    ctx.font = '900 44px "Arial Black",sans-serif';
    ctx.fillStyle = '#ffe14a';
    ctx.fillText('COLD DRINKS', 340, 80);
    const cols = 3, rows = 6;
    const x0 = 30, y0 = 168, cw = (w - 60) / cols, chh = 100;
    const pal = ['#e8434f', '#2f66d0', '#43b45a', '#f2a516', '#8e57c9', '#17b3b3', '#ef6ea0', '#dfe6ef'];
    const r = rng(7);
    for (let j = 0; j < rows; j++) {
      ctx.fillStyle = '#0a1526';
      ctx.fillRect(x0, y0 + j * (chh + 28) - 8, w - 60, chh + 22);
      ctx.fillStyle = '#6d7f9c';
      ctx.fillRect(x0, y0 + j * (chh + 28) + chh + 8, w - 60, 8);
      for (let i = 0; i < cols; i++) {
        const cx = x0 + i * cw + 18, cy = y0 + j * (chh + 28) + 8;
        const c = pal[Math.floor(r() * pal.length)];
        ctx.fillStyle = c;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(cx, cy, cw - 46, chh - 14, 10); else ctx.rect(cx, cy, cw - 46, chh - 14);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(cx + 6, cy + 6, 8, chh - 26);
        ctx.fillStyle = '#ffe9b8';
        ctx.font = '900 20px "Yu Gothic UI",sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('¥' + (110 + Math.floor(r() * 5) * 10), x0 + (i + 1) * cw - 22, cy + chh - 2);
      }
    }
    // bottom panel
    ctx.fillStyle = '#1a2c47';
    ctx.fillRect(18, 800, w - 36, 82);
    ctx.fillStyle = '#dfe6ef';
    ctx.fillRect(300, 812, 180, 58);
    ctx.fillStyle = '#122036';
    ctx.font = '900 26px "Arial Black",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PUSH', 390, 842);
    ctx.textAlign = 'left';
  });
}

export function posterTexture(seed) {
  const r = rng(seed * 131 + 17);
  const hue = Math.floor(r() * 360);
  return canvasTexture(256, 360, (ctx, w, h) => {
    ctx.fillStyle = `hsl(${hue},52%,72%)`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = `hsl(${(hue + 40) % 360},60%,86%)`;
    ctx.fillRect(0, 0, w, 96);
    ctx.fillStyle = `hsl(${(hue + 180) % 360},65%,48%)`;
    ctx.beginPath();
    ctx.arc(128, 180, 56, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(106, 158, 44, 14);
    lines(ctx, 24, 268, 208, 4, 'rgba(30,32,48,0.75)', r);
    ctx.fillStyle = 'rgba(20,22,36,0.85)';
    ctx.font = '900 40px "Yu Gothic UI","MS PGothic",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(['新発売', '期間限定', 'ホット', 'おすすめ', 'セール'][seed % 5], w / 2, 66);
    ctx.fillStyle = `hsl(${(hue + 90) % 360},70%,55%)`;
    ctx.fillRect(0, h - 26, w, 26);
  });
}

export function stickerTexture(text, color) {
  return canvasTexture(256, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(240,246,255,0.92)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, w - 16, h - 16, 20); else ctx.rect(8, 8, w - 16, h - 16);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(8, 8, w - 16, h - 16, 20); else ctx.rect(8, 8, w - 16, h - 16);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '900 52px "Yu Gothic UI","MS PGothic",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
}

export function shadowBlobTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(5,9,20,0.55)');
    g.addColorStop(0.55, 'rgba(5,9,20,0.3)');
    g.addColorStop(1, 'rgba(5,9,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function tileTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#eee7d8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#cfc6b0';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, 126, 126);
    ctx.strokeRect(129, 1, 126, 126);
    ctx.strokeRect(1, 129, 126, 126);
    ctx.strokeRect(129, 129, 126, 126);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(8, 8, 40, 8);
  }, { repeat: [4, 4] });
}

export function asphaltTexture() {
  const r = rng(42);
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#242c3f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(${160 + r() * 60},${175 + r() * 60},${200},${r() * 0.05})`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
    ctx.fillStyle = 'rgba(12,16,28,0.35)';
    ctx.fillRect(30, 200, 90, 4);
    ctx.fillRect(160, 60, 60, 3);
  }, { repeat: [7, 7] });
}

export function sidewalkTexture() {
  const r = rng(9);
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a4358';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(18,24,40,0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(w, i * 64); ctx.stroke();
    }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(200,215,235,${r() * 0.05})`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
  }, { repeat: [6, 6] });
}

export function padTexture() {
  const r = rng(21);
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#2e374c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(140,160,195,0.10)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 248, 248);
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = `rgba(190,205,230,${r() * 0.045})`;
      ctx.fillRect(r() * w, r() * h, 2, 2);
    }
  }, { repeat: [8, 8] });
}

export function backgroundTexture() {
  return canvasTexture(64, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#03050c');
    g.addColorStop(0.45, '#0a1226');
    g.addColorStop(0.72, '#131f3d');
    g.addColorStop(1, '#1b2b4e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, { srgb: true });
}

export function bannerTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e8434f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffe14a';
    ctx.fillRect(0, h - 34, w, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 96px "Yu Gothic UI","MS PGothic",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ['開', '催', '中'].forEach((ch, i) => ctx.fillText(ch, w / 2, 80 + i * 118));
  });
}
