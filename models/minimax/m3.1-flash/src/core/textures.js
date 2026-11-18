import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  画布工具
 * ------------------------------------------------------------------ */

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function paint(w, h, fn) {
  const c = makeCanvas(w, h);
  fn(c.getContext('2d'), w, h);
  return c;
}

export function toTexture(canvas, opts = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (opts.srgb !== false) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = opts.aniso ?? 4;
  tex.wrapS = tex.wrapT = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  if (opts.offset) tex.offset.set(opts.offset[0], opts.offset[1]);
  tex.needsUpdate = true;
  return tex;
}

/** 稳定的伪随机，保证每次刷新画面一致 */
export function rng(seed = 1) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const JP_FONT = '"Hiragino Kaku Gothic ProN","Yu Gothic","YuGothic","Meiryo","Noto Sans JP","MS Gothic",sans-serif';

function setFont(ctx, weight, size, mono = false) {
  ctx.font = `${weight} ${size}px ${mono ? '"Consolas","Courier New",monospace' : JP_FONT}`;
}

/** 圆角矩形路径 */
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** 颗粒噪点 */
function speckle(ctx, w, h, count, seed, alpha = 0.06, size = 2) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = r() * w;
    const y = r() * h;
    const a = alpha * (0.35 + r() * 0.9);
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.4})`;
    ctx.fillRect(x, y, size * (0.5 + r()), size * (0.5 + r()));
  }
}

/* ------------------------------------------------------------------ *
 *  三渲二色阶
 * ------------------------------------------------------------------ */

export function toonRamp(stops = [0.30, 0.58, 1.0]) {
  const c = makeCanvas(stops.length, 1);
  const ctx = c.getContext('2d');
  stops.forEach((s, i) => {
    const v = Math.max(0, Math.min(255, Math.round(s * 255)));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(i, 0, 1, 1);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

/* ------------------------------------------------------------------ *
 *  地面 / 街面
 * ------------------------------------------------------------------ */

export function asphaltTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#161920';
    ctx.fillRect(0, 0, w, h);
    const r = rng(7);
    // 湿斑
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      const rad = 24 + r() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, `rgba(58,74,102,${0.16 + r() * 0.16})`);
      g.addColorStop(1, 'rgba(58,74,102,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // 骨料颗粒
    for (let i = 0; i < 2600; i++) {
      const x = r() * w;
      const y = r() * h;
      const s = 1 + r() * 2.2;
      const v = 26 + r() * 46;
      ctx.fillStyle = `rgba(${v},${v + 2},${v + 8},${0.25 + r() * 0.5})`;
      ctx.fillRect(x, y, s, s);
    }
    // 细微裂缝
    ctx.strokeStyle = 'rgba(8,9,13,0.55)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      let x = r() * w;
      let y = r() * h;
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (r() - 0.5) * 90;
        y += (r() - 0.5) * 90;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    speckle(ctx, w, h, 1400, 21, 0.05, 2);
  });
  return toTexture(c, { repeat: [4, 4] });
}

export function sidewalkTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3d4149';
    ctx.fillRect(0, 0, w, h);
    const step = 128;
    ctx.strokeStyle = 'rgba(24,27,33,0.85)';
    ctx.lineWidth = 3;
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      const off = ((y / step) % 2) * (step / 2);
      for (let x = off; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + step);
        ctx.stroke();
      }
    }
    const r = rng(33);
    for (let i = 0; i < 1300; i++) {
      const x = r() * w;
      const y = r() * h;
      const v = 52 + r() * 42;
      ctx.fillStyle = `rgba(${v},${v + 2},${v + 6},${0.18 + r() * 0.3})`;
      ctx.fillRect(x, y, 1 + r() * 2, 1 + r() * 2);
    }
    speckle(ctx, w, h, 900, 5, 0.045, 2);
  });
  return toTexture(c, { repeat: [10, 10] });
}

export function tactileTexture() {
  const c = paint(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d8b03e';
    ctx.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = `rgba(120,92,20,${0.05 + r() * 0.08})`;
      ctx.fillRect(r() * w, r() * h, 3, 3);
    }
    // 凸起点字块
    for (let gy = 0; gy < 4; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        const x = 16 + gx * 32;
        const y = 16 + gy * 32;
        ctx.fillStyle = '#e8c65a';
        ctx.beginPath();
        ctx.arc(x, y, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#b99327';
        ctx.beginPath();
        ctx.arc(x + 1.5, y + 2, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  return toTexture(c, { repeat: [1, 1] });
}

export function concreteTexture(tint = '#4a4e56') {
  const c = paint(256, 256, (ctx, w, h) => {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);
    const r = rng(51);
    for (let i = 0; i < 900; i++) {
      const v = 40 + r() * 60;
      ctx.fillStyle = `rgba(${v},${v},${v + 4},${0.1 + r() * 0.25})`;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
    }
    speckle(ctx, w, h, 600, 77, 0.05, 2);
  });
  return toTexture(c, { repeat: [2, 2] });
}

/* ------------------------------------------------------------------ *
 *  招牌 / 海报
 * ------------------------------------------------------------------ */

/** 主招牌灯箱：品牌图形 + 名称 */
export function storeSignTexture() {
  const c = paint(2048, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fffdf4');
    g.addColorStop(0.55, '#fbf6e6');
    g.addColorStop(1, '#f0e9d5');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 上下品牌色条
    ctx.fillStyle = '#2e9e52';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = '#e0562c';
    ctx.fillRect(0, h - 26, w, 26);

    // 左侧标志
    const lx = 150;
    const ly = h / 2;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.fillStyle = '#2e9e52';
    roundRect(ctx, -108, -128, 216, 256, 52);
    ctx.fill();
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.moveTo(-54, -70);
    ctx.lineTo(6, 6);
    ctx.lineTo(-6, 74);
    ctx.lineTo(-62, -8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0562c';
    ctx.beginPath();
    ctx.moveTo(14, -70);
    ctx.lineTo(66, 22);
    ctx.lineTo(24, 22);
    ctx.lineTo(-6, -34);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 品牌文字
    ctx.fillStyle = '#1d2530';
    setFont(ctx, '900', 168);
    ctx.textBaseline = 'middle';
    ctx.fillText('ゆいマート', 300, h / 2 - 16);
    setFont(ctx, '700', 74);
    ctx.fillStyle = '#2e9e52';
    ctx.fillText('YUI  MART', 306, h / 2 + 92);

    // 24H 徽章
    ctx.fillStyle = '#d13b30';
    roundRect(ctx, w - 300, h / 2 - 108, 236, 216, 40);
    ctx.fill();
    ctx.fillStyle = '#fffdf4';
    setFont(ctx, '900', 108);
    ctx.textAlign = 'center';
    ctx.fillText('24', w - 182, h / 2 - 16);
    setFont(ctx, '900', 62);
    ctx.fillText('H', w - 182, h / 2 + 58);
    ctx.textAlign = 'left';

    // 分隔线
    ctx.strokeStyle = 'rgba(29,37,48,0.16)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w - 360, 60);
    ctx.lineTo(w - 360, h - 60);
    ctx.stroke();
  });
  return toTexture(c);
}

/** 转角竖招牌（袖看板） */
export function cornerSignTexture() {
  const c = paint(320, 900, (ctx, w, h) => {
    ctx.fillStyle = '#fffdf4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2e9e52';
    ctx.fillRect(0, 0, w, 26);
    ctx.fillStyle = '#e0562c';
    ctx.fillRect(0, h - 26, w, 26);

    ctx.save();
    ctx.translate(w / 2, 190);
    ctx.fillStyle = '#2e9e52';
    roundRect(ctx, -92, -92, 184, 184, 44);
    ctx.fill();
    ctx.fillStyle = '#fffdf4';
    ctx.beginPath();
    ctx.moveTo(-42, -52);
    ctx.lineTo(8, 10);
    ctx.lineTo(-4, 62);
    ctx.lineTo(-50, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e0562c';
    ctx.beginPath();
    ctx.moveTo(12, -52);
    ctx.lineTo(54, 24);
    ctx.lineTo(20, 24);
    ctx.lineTo(-2, -20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#1d2530';
    setFont(ctx, '900', 96);
    ctx.textAlign = 'center';
    const chars = ['便', '利', '店'];
    chars.forEach((ch, i) => ctx.fillText(ch, w / 2, 400 + i * 128));

    ctx.fillStyle = '#2e9e52';
    setFont(ctx, '700', 46);
    ctx.fillText('YUI MART', w / 2, 800);
    ctx.textAlign = 'left';
  });
  return toTexture(c);
}

/** 海报组：返回 {map, count} 供任意平面使用 */
export function posterTexture(seed = 3, cols = 2, rows = 2) {
  const cell = 512;
  const c = paint(cell * cols, cell * rows, (ctx, w, h) => {
    const r = rng(seed);
    const themes = [
      { bg: '#e8452f', fg: '#fff6e0', ac: '#ffd23f', t: '新発売', s: 'あたらしい おにぎり' },
      { bg: '#2f7fc4', fg: '#f2fbff', ac: '#ff7b3d', t: '面包', s: 'しょくパン' },
      { bg: '#f0c531', fg: '#3a2c14', ac: '#d13b30', t: 'POINT', s: '2倍ポイント キャンペーン' },
      { bg: '#f6f1e0', fg: '#1d2530', ac: '#2e9e52', t: '深夜营业', s: '24時間 営業しています' },
      { bg: '#8e44ad', fg: '#fff2ff', ac: '#ffd23f', t: '咖啡', s: 'あたたかい ホットコーヒー' },
      { bg: '#2e9e52', fg: '#f6fff2', ac: '#ffffff', t: 'お弁当', s: 'できたて お弁当' },
    ];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const th = themes[Math.floor(r() * themes.length)];
        const ox = x * cell;
        const oy = y * cell;
        ctx.save();
        ctx.translate(ox, oy);
        ctx.fillStyle = th.bg;
        ctx.fillRect(0, 0, cell, cell);

        // 大色块构成
        ctx.fillStyle = th.ac;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(cell * (0.25 + r() * 0.5), cell * (0.3 + r() * 0.3), cell * 0.24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = th.fg;
        setFont(ctx, '900', 82);
        ctx.textAlign = 'center';
        ctx.fillText(th.t, cell / 2, cell * 0.36);

        setFont(ctx, '700', 40);
        ctx.fillText(th.s, cell / 2, cell * 0.52);

        // 价格条
        ctx.fillStyle = th.fg;
        roundRect(ctx, cell * 0.28, cell * 0.62, cell * 0.44, 74, 14);
        ctx.fill();
        ctx.fillStyle = th.bg;
        setFont(ctx, '900', 52);
        ctx.fillText('¥ 128', cell / 2, cell * 0.62 + 54);
        ctx.textAlign = 'left';

        ctx.strokeStyle = 'rgba(0,0,0,0.10)';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, cell - 6, cell - 6);
        ctx.restore();
      }
    }
  });
  return toTexture(c);
}

/** 橱窗海报（单张） */
export function windowPosterTexture() {
  return posterTexture(88, 1, 1);
}

/** 杂志封面阵列 */
export function magazineTexture() {
  const c = paint(1024, 768, (ctx, w, h) => {
    ctx.fillStyle = '#2a2e35';
    ctx.fillRect(0, 0, w, h);
    const r = rng(404);
    const cols = 6;
    const rows = 4;
    const cw = w / cols;
    const ch = h / rows;
    const inks = ['#e8452f', '#2f7fc4', '#f0c531', '#2e9e52', '#8e44ad', '#f26f21', '#2b3350', '#ef5f8f'];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = x * cw + 4;
        const py = y * ch + 4;
        const pw = cw - 8;
        const ph = ch - 8;
        ctx.fillStyle = inks[Math.floor(r() * inks.length)];
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(px + 10, py + ph * 0.16, pw * 0.62, ph * 0.1);
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(px + 10, py + ph * 0.3, pw * 0.44, ph * 0.07);
        ctx.fillRect(px + 10, py + ph * 0.42, pw * 0.3, ph * 0.06);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(px + pw * 0.74, py + ph * 0.62, pw * 0.17, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
  return toTexture(c);
}

/** 自动贩卖机正面 */
export function vendingFrontTexture() {
  const c = paint(768, 1400, (ctx, w, h) => {
    ctx.fillStyle = '#b8341f';
    ctx.fillRect(0, 0, w, h);
    // 顶部灯箱
    ctx.fillStyle = '#f6f1e0';
    ctx.fillRect(0, 0, w, 150);
    ctx.fillStyle = '#d13b30';
    ctx.fillRect(0, 140, w, 14);
    setFont(ctx, '900', 74);
    ctx.fillStyle = '#1d2530';
    ctx.textAlign = 'center';
    ctx.fillText('自动販売機', w / 2, 92);

    // 饮料灯箱区
    const gx = 40;
    const gy = 200;
    const gw = w - 80;
    const gh = 880;
    ctx.fillStyle = '#fdf8e8';
    ctx.fillRect(gx, gy, gw, gh);
    const cols = 5;
    const rows = 4;
    const r = rng(1212);
    const inks = ['#e8452f', '#2f7fc4', '#f0c531', '#2e9e52', '#8e44ad', '#f26f21', '#5fbfa8', '#c05bb0'];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const bw = gw / cols;
        const bh = gh / rows;
        const px = gx + x * bw;
        const py = gy + y * bh;
        ctx.fillStyle = inks[Math.floor(r() * inks.length)];
        roundRect(ctx, px + 10, py + 12, bw - 20, bh - 34, 12);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(px + 16, py + 20, bw - 44, bh * 0.12);
        ctx.fillStyle = '#2a2e35';
        ctx.fillRect(px + 10, py + bh - 22, bw - 20, 12);
      }
    }

    // 选货按钮
    ctx.fillStyle = '#2a2e35';
    ctx.fillRect(gx, gy + gh + 20, gw, 190);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = '#f6f1e0';
        roundRect(ctx, gx + 14 + x * (gw / cols), gy + gh + 36 + y * 44, (gw / cols) - 26, 32, 6);
        ctx.fill();
      }
    }

    // 取货口 + 投币
    ctx.fillStyle = '#1a1d22';
    roundRect(ctx, 60, h - 260, w - 120, 150, 16);
    ctx.fill();
    ctx.fillStyle = '#2f3a44';
    ctx.fillRect(80, h - 240, w - 160, 26);
    ctx.fillStyle = '#f6f1e0';
    setFont(ctx, '700', 34);
    ctx.textAlign = 'center';
    ctx.fillText('取出口', w / 2, h - 150);

    ctx.fillStyle = '#4a5058';
    roundRect(ctx, 60, h - 92, w - 120, 54, 10);
    ctx.fill();
    ctx.fillStyle = '#f6f1e0';
    setFont(ctx, '700', 28);
    ctx.fillText('つり銭  お札', w / 2, h - 56);
    ctx.textAlign = 'left';
  });
  return toTexture(c);
}

/** 自动贩卖机侧面广告板 */
export function vendingSideTexture() {
  const c = paint(384, 1024, (ctx, w, h) => {
    // 机身底色
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c73a22');
    g.addColorStop(0.6, '#ad2f1b');
    g.addColorStop(1, '#8d2415');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 上部灯箱
    ctx.fillStyle = '#f6f1e0';
    ctx.fillRect(0, 0, w, 116);
    ctx.fillStyle = '#2e9e52';
    ctx.fillRect(0, 116, w, 10);
    setFont(ctx, '900', 62);
    ctx.fillStyle = '#1d2530';
    ctx.textAlign = 'center';
    ctx.fillText('つめたい', w / 2, 52);
    setFont(ctx, '700', 26);
    ctx.fillStyle = '#2e9e52';
    ctx.fillText('DRINKS  COLD', w / 2, 92);

    // 中部饮料罐图形
    const cx = w / 2;
    const cy = 400;
    const cw = 118;
    const ch = 300;
    ctx.fillStyle = '#2f7fc4';
    roundRect(ctx, cx - cw / 2, cy - ch / 2, cw, ch, 26);
    ctx.fill();
    ctx.fillStyle = '#f6f1e0';
    ctx.fillRect(cx - cw / 2, cy - 40, cw, 80);
    ctx.fillStyle = '#e0562c';
    ctx.fillRect(cx - cw / 2, cy - 34, cw, 68);
    setFont(ctx, '900', 44);
    ctx.fillStyle = '#fffdf4';
    ctx.fillText('茶', cx, cy + 14);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    roundRect(ctx, cx - cw / 2 + 16, cy - ch / 2 + 16, 22, ch - 60, 10);
    ctx.fill();

    // 下部波浪与文字
    ctx.fillStyle = '#1d2530';
    ctx.fillRect(0, 640, w, 8);
    setFont(ctx, '900', 76);
    ctx.fillStyle = '#fffdf4';
    ctx.fillText('おいしい', w / 2, 740);
    setFont(ctx, '700', 34);
    ctx.fillStyle = '#ffd79a';
    ctx.fillText('いつでも あたたかい', w / 2, 800);

    // 底部小图标
    ctx.fillStyle = '#f0c531';
    roundRect(ctx, w / 2 - 92, 860, 184, 90, 18);
    ctx.fill();
    setFont(ctx, '900', 40);
    ctx.fillStyle = '#1d2530';
    ctx.fillText('¥130', w / 2, 918);
    ctx.textAlign = 'left';
  });
  return toTexture(c);
}

/** 公告栏 */
export function bulletinTexture() {
  const c = paint(1024, 768, (ctx, w, h) => {
    ctx.fillStyle = '#6b6357';
    ctx.fillRect(0, 0, w, h);
    const r = rng(313);
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = `rgba(${90 + r() * 60},${80 + r() * 50},${60 + r() * 40},${r() * 0.35})`;
      ctx.fillRect(r() * w, r() * h, 2 + r() * 6, 2 + r() * 6);
    }
    // 玻璃反光
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.6);
    ctx.lineTo(w * 0.5, 0);
    ctx.lineTo(w * 0.85, 0);
    ctx.lineTo(w * 0.35, h);
    ctx.closePath();
    ctx.fill();

    const notices = [
      { x: 40, y: 40, w: 300, h: 380, c: '#fbf7ec', head: '町内会から', body: '#2c3b52' },
      { x: 370, y: 70, w: 280, h: 300, c: '#eef6fb', head: '資源ごみ', body: '#3a5a7a' },
      { x: 690, y: 40, w: 290, h: 250, c: '#fff4de', head: '夜间練習', body: '#8a5a2c' },
      { x: 120, y: 450, w: 380, h: 270, c: '#f3f8ee', head: '节电活动', body: '#3d6b45' },
      { x: 560, y: 320, w: 400, h: 400, c: '#fdeeee', head: '募集', body: '#8a3a3a' },
    ];
    for (const n of notices) {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate((r() - 0.5) * 0.05);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(3, 5, n.w, n.h);
      ctx.fillStyle = n.c;
      ctx.fillRect(0, 0, n.w, n.h);
      ctx.fillStyle = n.head;
      setFont(ctx, '900', 44);
      ctx.textAlign = 'center';
      ctx.fillText(n.head, n.w / 2, 66);
      ctx.fillStyle = n.body;
      for (let i = 0; i < 9; i++) {
        const lw = n.w * (0.35 + r() * 0.5);
        ctx.fillRect(20, 100 + i * 26, lw, 9);
      }
      ctx.textAlign = 'left';
      ctx.restore();
    }
  });
  return toTexture(c);
}

/** 蓝色路名牌 */
export function roadSignTexture() {
  const c = paint(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1f4f8f';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#eef3f8';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#f3f7fb';
    setFont(ctx, '900', 96);
    ctx.textAlign = 'center';
    ctx.fillText('桜坂 2丁目', w / 2, 118);
    setFont(ctx, '600', 46);
    ctx.fillText('SAKURAZAKA 2-CHOME', w / 2, 194);
    ctx.textAlign = 'left';
  });
  return toTexture(c);
}

/** 圆形禁停标志 */
export function noParkingTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#f2f0e8';
    ctx.beginPath();
    ctx.arc(256, 256, 240, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d13b30';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.arc(256, 256, 218, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2b3350';
    setFont(ctx, '900', 92);
    ctx.textAlign = 'center';
    ctx.fillText('駐車', 256, 236);
    ctx.fillText('禁止', 256, 340);
    ctx.textAlign = 'left';
  });
  return toTexture(c);
}

/** 停车场 P 标志 */
export function parkingSignTexture() {
  const c = paint(384, 384, (ctx, w, h) => {
    ctx.fillStyle = '#1f4f8f';
    roundRect(ctx, 8, 8, w - 16, h - 16, 40);
    ctx.fill();
    ctx.fillStyle = '#f3f7fb';
    setFont(ctx, '900', 210);
    ctx.textAlign = 'center';
    ctx.fillText('P', w / 2, 262);
    ctx.textAlign = 'left';
  });
  return toTexture(c);
}

/** 灯杆上贴的广告 */
export function poleAdTexture() {
  return posterTexture(606, 1, 2);
}

/* ------------------------------------------------------------------ *
 *  店内
 * ------------------------------------------------------------------ */

export function interiorFloorTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e9e5d9';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,146,134,0.75)';
    ctx.lineWidth = 3;
    const step = 128;
    for (let i = 0; i <= w; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(w, i);
      ctx.stroke();
    }
    const r = rng(17);
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = `rgba(${180 + r() * 50},${178 + r() * 50},${168 + r() * 50},${r() * 0.18})`;
      ctx.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 4);
    }
  });
  return toTexture(c, { repeat: [3, 3] });
}

/** 店内暖色灯箱菜单 */
export function menuLightboxTexture() {
  const c = paint(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = '#fdf6e4';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d13b30';
    ctx.fillRect(0, 0, w, 96);
    ctx.fillStyle = '#fffdf4';
    setFont(ctx, '900', 58);
    ctx.textAlign = 'center';
    ctx.fillText('おでん・ホットスナック', w / 2, 66);
    ctx.textAlign = 'left';

    const items = [
      ['关东煮 萝卜', '120'], ['关东煮 竹轮', '100'], ['关东煮 蛋', '110'],
      ['炸鸡块', '180'], ['炸薯条', '160'], ['热狗', '170'],
      ['肉包', '150'], ['咖喱包', '190'], ['关东煮 魔芋', '120'],
    ];
    const r = rng(404);
    for (let i = 0; i < items.length; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 40 + col * 330;
      const y = 130 + row * 118;
      ctx.fillStyle = `rgba(${210 + r() * 30},${150 + r() * 40},${70 + r() * 30},0.35)`;
      roundRect(ctx, x, y, 300, 96, 16);
      ctx.fill();
      ctx.fillStyle = '#3a2c14';
      setFont(ctx, '700', 34);
      ctx.fillText(items[i][0], x + 20, y + 42);
      ctx.fillStyle = '#d13b30';
      setFont(ctx, '900', 38);
      ctx.fillText('¥' + items[i][1], x + 20, y + 82);
    }
    ctx.fillStyle = '#2e9e52';
    ctx.fillRect(0, h - 34, w, 34);
  });
  return toTexture(c);
}

/** 货架价签条 */
export function priceTagTexture() {
  const c = paint(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#fdfaf0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e0562c';
    ctx.fillRect(0, 0, 6, h);
    const r = rng(66);
    ctx.fillStyle = '#2b3038';
    setFont(ctx, '700', 30);
    for (let i = 0; i < 8; i++) {
      ctx.fillText(`¥${100 + Math.floor(r() * 200)}`, 20 + i * 62, 42);
    }
  });
  return toTexture(c, { repeat: [1, 1] });
}

/** 纸箱 */
export function cardboardTexture() {
  const c = paint(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b08a5c';
    ctx.fillRect(0, 0, w, h);
    const r = rng(88);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(${120 + r() * 70},${90 + r() * 50},${50 + r() * 40},${r() * 0.3})`;
      ctx.fillRect(r() * w, r() * h, 2 + r() * 5, 2 + r() * 5);
    }
    ctx.fillStyle = 'rgba(230,220,200,0.85)';
    ctx.fillRect(w * 0.3, 0, w * 0.12, h);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(w * 0.55, h * 0.3, w * 0.32, h * 0.28);
    ctx.fillStyle = '#4a4a4a';
    setFont(ctx, '700', 16);
    ctx.fillText('取扱注意', w * 0.575, h * 0.47);
  });
  return toTexture(c);
}

/** 储物柜 */
export function lockerTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c9cdd2';
    ctx.fillRect(0, 0, w, h);
    const cols = 4;
    const rows = 4;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const px = 6 + x * (w / cols);
        const py = 6 + y * (h / rows);
        const pw = w / cols - 12;
        const ph = h / rows - 12;
        ctx.fillStyle = (x + y) % 2 ? '#c2c7cc' : '#d2d6da';
        ctx.fillRect(px, py, pw, ph);
        ctx.fillStyle = 'rgba(60,66,74,0.75)';
        ctx.fillRect(px + pw - 22, py + ph / 2 - 4, 14, 8);
        ctx.fillStyle = '#5b6169';
        setFont(ctx, '700', 18);
        ctx.fillText(`${y * cols + x + 1}`, px + 10, py + 24);
      }
    }
  });
  return toTexture(c);
}

/** 饮料柜内部发光背板 */
export function coolerBackTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f4fbff');
    g.addColorStop(1, '#cfe6f2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(120,170,200,0.22)';
    for (let i = 0; i < 4; i++) ctx.fillRect(0, i * 128, w, 5);
  });
  return toTexture(c);
}

/** 收银台后墙 / 促销海报墙 */
export function interiorPosterWallTexture() {
  const c = paint(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f2efe6';
    ctx.fillRect(0, 0, w, h);
    const p = posterTexture(707, 2, 1);
    const src = p.image;
    ctx.drawImage(src, 0, 0, w, h / 2);
    ctx.drawImage(src, 0, h / 2, w, h / 2);
    ctx.fillStyle = 'rgba(46,158,82,0.9)';
    ctx.fillRect(0, h / 2 - 6, w, 12);
  });
  return toTexture(c);
}

/* ------------------------------------------------------------------ *
 *  贴花 / 小物件
 * ------------------------------------------------------------------ */

/** 玻璃上的磨砂腰线（带品牌字样，横向重复） */
export function glassBandTexture() {
  const c = paint(1024, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(250,250,246,0.86)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2e9e52';
    ctx.fillRect(0, 0, w, 8);
    ctx.fillRect(0, h - 8, w, 8);
    ctx.fillStyle = '#1d2530';
    setFont(ctx, '900', 54);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < 4; i++) {
      ctx.fillText('ゆいマート  YUI MART', (i + 0.5) * (w / 4), h / 2 + 4);
    }
    ctx.textAlign = 'left';
  });
  return toTexture(c, { clamp: true });
}

/** 营业中 贴纸 */
export function openSignTexture() {
  const c = paint(512, 232, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(20,24,32,0.9)';
    roundRect(ctx, 6, 6, w - 12, h - 12, 22);
    ctx.fill();
    ctx.strokeStyle = '#ff5b6e';
    ctx.lineWidth = 6;
    roundRect(ctx, 14, 14, w - 28, h - 28, 16);
    ctx.stroke();
    ctx.fillStyle = '#ff7a86';
    setFont(ctx, '900', 92);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('営業中', w / 2, h / 2 - 8);
    ctx.fillStyle = '#ffd0d5';
    setFont(ctx, '700', 34);
    ctx.fillText('OPEN', w / 2, h / 2 + 52);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  });
  return toTexture(c);
}

/** 门口地垫 */
export function doorMatTexture() {
  const c = paint(512, 168, (ctx, w, h) => {
    ctx.fillStyle = '#23262b';
    ctx.fillRect(0, 0, w, h);
    const r = rng(121);
    for (let i = 0; i < 2200; i++) {
      ctx.fillStyle = `rgba(${40 + r() * 30},${44 + r() * 30},${50 + r() * 30},${r() * 0.5})`;
      ctx.fillRect(r() * w, r() * h, 2 + r() * 3, 2 + r() * 3);
    }
    ctx.strokeStyle = 'rgba(46,158,82,0.75)';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = 'rgba(46,158,82,0.9)';
    setFont(ctx, '900', 62);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WELCOME  ゆいマート', w / 2, h / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  });
  return toTexture(c, { clamp: true });
}

/** 地面导视（箭头 + 文字） */
export function floorGuideTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // 彩色地贴条
    ctx.fillStyle = 'rgba(46,158,82,0.55)';
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.12);
    ctx.lineTo(w * 0.82, h * 0.48);
    ctx.lineTo(w * 0.63, h * 0.48);
    ctx.lineTo(w * 0.63, h * 0.86);
    ctx.lineTo(w * 0.37, h * 0.86);
    ctx.lineTo(w * 0.37, h * 0.48);
    ctx.lineTo(w * 0.18, h * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    setFont(ctx, '900', 60);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('お会計', w / 2, h * 0.66);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  });
  return toTexture(c, { clamp: true });
}

/** 铁丝网 */
export function chainLinkTexture() {
  const c = paint(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,160,170,0.85)';
    ctx.lineWidth = 3;
    for (let i = -h; i < w + h; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i + h, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
  });
  return toTexture(c, { repeat: [1, 1] });
}

/** 环境贴图（等距柱状）：夜空 + 远处城市灯光斑 */
export function envTexture() {
  const c = paint(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#05070f');
    g.addColorStop(0.42, '#0c1324');
    g.addColorStop(0.52, '#1b2745');
    g.addColorStop(0.62, '#101827');
    g.addColorStop(1, '#06080e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const r = rng(9090);
    // 地平线附近的城市灯光
    for (let i = 0; i < 90; i++) {
      const x = r() * w;
      const y = h * 0.5 + (r() - 0.5) * h * 0.09;
      const rad = 3 + r() * 14;
      const warm = r() > 0.35;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, rad);
      const col = warm ? '255,205,140' : '150,205,255';
      grad.addColorStop(0, `rgba(${col},${0.5 + r() * 0.5})`);
      grad.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // 一条暖色的地平线辉光（远处街道）
    const glow = ctx.createLinearGradient(0, h * 0.47, 0, h * 0.58);
    glow.addColorStop(0, 'rgba(255,190,120,0)');
    glow.addColorStop(0.5, 'rgba(255,178,104,0.16)');
    glow.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, h * 0.47, w, h * 0.11);
  });
  const tex = toTexture(c, { clamp: true });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

/* ------------------------------------------------------------------ *
 *  粒子 / 光晕
 * ------------------------------------------------------------------ */

/** 径向光晕 */
export function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = paint(256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, inner);
    g.addColorStop(0.28, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.62, 'rgba(255,255,255,0.14)');
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return toTexture(c);
}

/** 湿地面的竖向反光拖尾 */
export function reflectionStreakTexture() {
  const c = paint(128, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.25, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.65, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // 横向羽化
    const g2 = ctx.createLinearGradient(0, 0, w, 0);
    g2.addColorStop(0, 'rgba(0,0,0,1)');
    g2.addColorStop(0.5, 'rgba(0,0,0,0)');
    g2.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    // 水面横向条纹
    const r = rng(31);
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.3})`;
      ctx.fillRect(0, r() * h, w, 2 + r() * 5);
    }
    ctx.globalCompositeOperation = 'source-over';
  });
  return toTexture(c);
}

/** 玻璃上的雨痕（会滚动） */
export function glassRainTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    ctx.fillStyle = 'rgba(255,255,255,0)';
    ctx.fillRect(0, 0, w, h);
    const r = rng(2024);
    for (let i = 0; i < 130; i++) {
      const x = r() * w;
      const y = r() * h;
      const len = 30 + r() * 170;
      const wid = 1.5 + r() * 4.5;
      const g = ctx.createLinearGradient(0, y, 0, y + len);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.4, `rgba(230,242,255,${0.14 + r() * 0.26})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, wid, len);
      // 顶部水珠
      ctx.fillStyle = `rgba(240,248,255,${0.2 + r() * 0.35})`;
      ctx.beginPath();
      ctx.arc(x + wid / 2, y, wid * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  return toTexture(c);
}

/** 雨滴精灵 */
export function rainDropTexture() {
  const c = paint(64, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(200,225,255,0)');
    g.addColorStop(0.35, 'rgba(210,232,255,0.75)');
    g.addColorStop(0.75, 'rgba(235,245,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(w * 0.3, 0, w * 0.4, h);
    const g2 = ctx.createLinearGradient(0, 0, w, 0);
    g2.addColorStop(0, 'rgba(0,0,0,1)');
    g2.addColorStop(0.5, 'rgba(0,0,0,0)');
    g2.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  });
  return toTexture(c);
}

/** 水面涟漪法线贴图 */
export function rippleNormalTexture() {
  const size = 256;
  const c = makeCanvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const d = img.data;
  const r = rng(909);
  const centers = [];
  for (let i = 0; i < 26; i++) centers.push([r() * size, r() * size, 18 + r() * 40, r() * 6.28]);
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v = 0;
      for (const [cx, cy, rad, ph] of centers) {
        let dx = x - cx;
        let dy = y - cy;
        if (dx > size / 2) dx -= size;
        if (dx < -size / 2) dx += size;
        if (dy > size / 2) dy -= size;
        if (dy < -size / 2) dy += size;
        const dist = Math.sqrt(dx * dx + dy * dy);
        v += Math.cos((dist / rad) * 6.283 + ph) * Math.exp(-dist / (rad * 1.4));
      }
      h[y * size + x] = v;
    }
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = h[y * size + ((x - 1 + size) % size)];
      const rr = h[y * size + ((x + 1) % size)];
      const u = h[((y - 1 + size) % size) * size + x];
      const dn = h[((y + 1) % size) * size + x];
      const nx = (l - rr) * 0.55;
      const ny = (u - dn) * 0.55;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const i = (y * size + x) * 4;
      d[i] = ((nx / len) * 0.5 + 0.5) * 255;
      d[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      d[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

/** 背景渐变（模型背后的夜色） */
export function skyTexture() {
  const c = paint(16, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#05070f');
    g.addColorStop(0.35, '#0a1020');
    g.addColorStop(0.62, '#16203a');
    g.addColorStop(0.78, '#243356');
    g.addColorStop(0.9, '#101725');
    g.addColorStop(1, '#05070d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return toTexture(c, { clamp: true });
}

/** 底座下方的柔和光池 */
export function groundGlowTexture() {
  const c = paint(512, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(58,78,120,0.42)');
    g.addColorStop(0.45, 'rgba(34,48,80,0.16)');
    g.addColorStop(1, 'rgba(6,8,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return toTexture(c, { clamp: true });
}
