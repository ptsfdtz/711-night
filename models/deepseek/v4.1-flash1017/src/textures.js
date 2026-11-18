/* textures.js — every illustration and sign is painted procedurally at runtime */
(function () {
  "use strict";

  const T = THREE;
  const TEX = (window.TEX = {});
  const cache = new Map();

  const JP_FONT = "'Yu Gothic', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', Meiryo, sans-serif";
  const EN_FONT = "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif";
  const DISPLAY_FONT = "'Arial Black', 'Yu Gothic', Meiryo, sans-serif";

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function toTexture(canvas, opts) {
    opts = opts || {};
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = opts.anisotropy || 8;
    if (opts.repeat) {
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      tex.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    if (opts.wrap) {
      tex.wrapS = tex.wrapT = opts.wrap;
    }
    if (opts.nearest) {
      tex.magFilter = T.NearestFilter;
    }
    tex.needsUpdate = true;
    return tex;
  }

  function cached(key, factory) {
    if (!cache.has(key)) cache.set(key, factory());
    return cache.get(key);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function starPath(ctx, cx, cy, outer, inner, points) {
    const n = points || 5;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + (i / (n * 2)) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function grain(ctx, w, h, amount, seed) {
    let s = seed || 1;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
    ctx.save();
    for (let i = 0; i < amount; i++) {
      const a = rand() * 0.055;
      ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255," + a + ")" : "rgba(0,0,0," + a + ")";
      const x = rand() * w;
      const y = rand() * h;
      const size = 1 + rand() * 2.2;
      ctx.fillRect(x, y, size, size);
    }
    ctx.restore();
  }

  function vignette(ctx, w, h, strength) {
    const g = ctx.createRadialGradient(w * 0.5, h * 0.46, w * 0.1, w * 0.5, h * 0.5, Math.max(w, h) * 0.76);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(0,0,0," + (strength == null ? 0.2 : strength) + ")");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function verticalText(ctx, text, x, y, step, font, color) {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < text.length; i++) {
      ctx.fillText(text[i], x, y + i * step);
    }
    ctx.restore();
  }

  TEX._helpers = { makeCanvas, toTexture, roundRect, starPath, grain, JP_FONT, EN_FONT, DISPLAY_FONT };
  TEX.labelTexture = NM.labelTexture;

  /* --------------------------------------------------------------------- */
  /* Soft effects                                                          */
  /* --------------------------------------------------------------------- */

  TEX.glow = function () {
    return cached("glow", () => {
      const c = makeCanvas(256, 256);
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.12, "rgba(255,255,255,0.8)");
      g.addColorStop(0.34, "rgba(255,255,255,0.28)");
      g.addColorStop(0.64, "rgba(255,255,255,0.07)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      return toTexture(c);
    });
  };

  TEX.softBlob = function () {
    return cached("blob", () => {
      const c = makeCanvas(256, 256);
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 124);
      g.addColorStop(0, "rgba(0,0,0,0.65)");
      g.addColorStop(0.55, "rgba(0,0,0,0.27)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      return toTexture(c);
    });
  };

  TEX.reflectionStreak = function () {
    return cached("reflection", () => {
      const c = makeCanvas(256, 512);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 256, 512);
      const g = ctx.createRadialGradient(128, 120, 3, 128, 260, 270);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.16, "rgba(255,255,255,0.55)");
      g.addColorStop(0.48, "rgba(255,255,255,0.17)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(128, 235, 58, 238, 0, 0, Math.PI * 2);
      ctx.fill();
      // torn horizontal glints, like light broken by rain
      const rand = NM.seedRandom(28);
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 64; i++) {
        const y = 25 + rand() * 470;
        const x = 32 + rand() * 192;
        const w = 8 + rand() * 88;
        ctx.fillStyle = "rgba(0,0,0," + (0.15 + rand() * 0.6) + ")";
        ctx.fillRect(x - w / 2, y, w, 1 + rand() * 3);
      }
      ctx.globalCompositeOperation = "source-over";
      return toTexture(c);
    });
  };

  TEX.groundGlow = function () {
    return cached("groundGlow", () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(256, 256, 10, 256, 256, 252);
      g.addColorStop(0, "rgba(255,255,255,0.65)");
      g.addColorStop(0.3, "rgba(255,255,255,0.26)");
      g.addColorStop(0.7, "rgba(255,255,255,0.06)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
      return toTexture(c);
    });
  };

  TEX.rainGlass = function () {
    return cached("rainGlass", () => {
      const c = makeCanvas(512, 1024);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 512, 1024);
      const rand = NM.seedRandom(811);
      ctx.lineCap = "round";
      for (let i = 0; i < 110; i++) {
        const x = rand() * 512;
        const y = rand() * 1024;
        const len = 6 + rand() * 155;
        const w = 0.6 + rand() * 2.3;
        const g = ctx.createLinearGradient(x, y, x + 2, y + len);
        g.addColorStop(0, "rgba(214,241,248,0)");
        g.addColorStop(0.2, "rgba(214,241,248," + (0.1 + rand() * 0.26) + ")");
        g.addColorStop(0.82, "rgba(255,255,255," + (0.08 + rand() * 0.25) + ")");
        g.addColorStop(1, "rgba(214,241,248,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 1.5, y + len * 0.55, x + 3 + rand() * 3, y + len);
        ctx.stroke();
      }
      for (let i = 0; i < 180; i++) {
        const x = rand() * 512;
        const y = rand() * 1024;
        const r = 0.7 + rand() * 3.4;
        const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        g.addColorStop(0, "rgba(255,255,255," + (0.24 + rand() * 0.45) + ")");
        g.addColorStop(0.7, "rgba(188,224,234," + (0.06 + rand() * 0.15) + ")");
        g.addColorStop(1, "rgba(180,220,230,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      return toTexture(c, { wrap: T.RepeatWrapping });
    });
  };

  TEX.drip = function () {
    return cached("drip", () => {
      const c = makeCanvas(32, 128);
      const ctx = c.getContext("2d");
      const g = ctx.createLinearGradient(16, 0, 16, 128);
      g.addColorStop(0, "rgba(220,244,250,0)");
      g.addColorStop(0.3, "rgba(226,247,252,0.8)");
      g.addColorStop(0.68, "rgba(255,255,255,0.7)");
      g.addColorStop(1, "rgba(218,242,249,0.12)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(16, 64, 5.3, 56, 0, 0, Math.PI * 2);
      ctx.fill();
      return toTexture(c);
    });
  };

  /* --------------------------------------------------------------------- */
  /* Surfaces                                                              */
  /* --------------------------------------------------------------------- */

  TEX.asphalt = function () {
    return cached("asphalt", () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#222c33";
      ctx.fillRect(0, 0, 512, 512);
      const rand = NM.seedRandom(411);
      for (let i = 0; i < 7700; i++) {
        const v = 24 + Math.floor(rand() * 44);
        ctx.fillStyle = "rgba(" + v + "," + (v + 5) + "," + (v + 8) + "," + (0.1 + rand() * 0.35) + ")";
        const s = rand() < 0.86 ? 1 : 1 + rand() * 2.7;
        ctx.fillRect(rand() * 512, rand() * 512, s, s);
      }
      for (let i = 0; i < 32; i++) {
        const x = rand() * 512;
        const y = rand() * 512;
        const g = ctx.createRadialGradient(x, y, 1, x, y, 25 + rand() * 90);
        g.addColorStop(0, "rgba(10,18,24," + (0.06 + rand() * 0.12) + ")");
        g.addColorStop(1, "rgba(10,18,24,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 140, y - 140, 280, 280);
      }
      ctx.strokeStyle = "rgba(8,13,17,0.25)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 11; i++) {
        ctx.beginPath();
        let x = rand() * 512;
        let y = rand() * 512;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
          x += (rand() - 0.5) * 30;
          y += rand() * 26;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      grain(ctx, 512, 512, 1400, 7);
      return toTexture(c, { repeat: [9, 9], anisotropy: 8 });
    });
  };

  TEX.pavers = function () {
    return cached("pavers", () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#657477";
      ctx.fillRect(0, 0, 512, 512);
      const cols = 4;
      const rows = 4;
      const w = 512 / cols;
      const h = 512 / rows;
      const rand = NM.seedRandom(901);
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const offset = (r % 2) * 32;
          ctx.fillStyle = "rgba(255,255,255," + (0.008 + rand() * 0.032) + ")";
          ctx.fillRect(col * w + offset + 3, r * h + 3, w - 6, h - 6);
        }
      }
      ctx.strokeStyle = "rgba(30,42,46,0.62)";
      ctx.lineWidth = 3;
      for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * w, 0);
        ctx.lineTo(i * w, 512);
        ctx.stroke();
      }
      for (let j = 0; j <= rows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * h);
        ctx.lineTo(512, j * h);
        ctx.stroke();
      }
      for (let i = 0; i < 24; i++) {
        const x = rand() * 512;
        const y = rand() * 512;
        const g = ctx.createRadialGradient(x, y, 2, x, y, 40 + rand() * 80);
        g.addColorStop(0, "rgba(37,55,61," + (0.06 + rand() * 0.14) + ")");
        g.addColorStop(1, "rgba(37,55,61,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 140, y - 140, 280, 280);
      }
      grain(ctx, 512, 512, 2600, 3);
      return toTexture(c, { repeat: [9, 9] });
    });
  };

  TEX.interiorFloor = function () {
    return cached("interiorFloor", () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#d8d2c3";
      ctx.fillRect(0, 0, 512, 512);
      const rand = NM.seedRandom(331);
      const size = 128;
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
          ctx.fillStyle = "rgba(255,255,255," + (0.02 + rand() * 0.08) + ")";
          ctx.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
          const g = ctx.createLinearGradient(x * size, y * size, x * size + size, y * size + size);
          g.addColorStop(0, "rgba(255,250,234,0.05)");
          g.addColorStop(0.55, "rgba(255,255,255,0)");
          g.addColorStop(1, "rgba(122,111,93,0.06)");
          ctx.fillStyle = g;
          ctx.fillRect(x * size + 4, y * size + 4, size - 8, size - 8);
        }
      }
      ctx.strokeStyle = "rgba(117,112,101,0.4)";
      ctx.lineWidth = 3;
      for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size, 0);
        ctx.lineTo(i * size, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * size);
        ctx.lineTo(512, i * size);
        ctx.stroke();
      }
      grain(ctx, 512, 512, 900, 18);
      return toTexture(c, { repeat: [3.6, 3.2] });
    });
  };

  TEX.brick = function () {
    return cached("brick", () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#29383a";
      ctx.fillRect(0, 0, 512, 512);
      const rand = NM.seedRandom(66);
      const bh = 54;
      const bw = 120;
      for (let row = 0; row < 10; row++) {
        const off = row % 2 ? -bw / 2 : 0;
        for (let col = -1; col < 6; col++) {
          const x = col * bw + off;
          const y = row * bh;
          const shade = 37 + Math.floor(rand() * 20);
          ctx.fillStyle = "rgb(" + shade + "," + (shade + 10) + "," + (shade + 9) + ")";
          ctx.fillRect(x + 3, y + 3, bw - 6, bh - 6);
          ctx.fillStyle = "rgba(255,235,204," + (0.015 + rand() * 0.03) + ")";
          ctx.fillRect(x + 1, y + 1, bw - 2, 2);
        }
      }
      const g = ctx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, "rgba(7,12,14,0.35)");
      g.addColorStop(0.45, "rgba(7,12,14,0)");
      g.addColorStop(1, "rgba(7,12,14,0.22)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
      grain(ctx, 512, 512, 1600, 14);
      return toTexture(c, { repeat: [4, 4] });
    });
  };

  TEX.roof = function () {
    return cached("roof", () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#30393d";
      ctx.fillRect(0, 0, 512, 512);
      const rand = NM.seedRandom(72);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = "rgba(12,20,24," + (0.04 + rand() * 0.12) + ")";
        ctx.beginPath();
        ctx.ellipse(rand() * 512, rand() * 512, 15 + rand() * 90, 8 + rand() * 38, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = "rgba(14,20,23,0.45)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 14; i++) {
        const y = rand() * 512;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y + (rand() - 0.5) * 30);
        ctx.stroke();
      }
      grain(ctx, 512, 512, 2000, 39);
      return toTexture(c, { repeat: [3, 3] });
    });
  };

  TEX.tactile = function () {
    return cached("tactile", () => {
      const c = makeCanvas(256, 256);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#9f8840";
      ctx.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const cx = x * 32 + 16;
          const cy = y * 32 + 16;
          ctx.fillStyle = "#705f2f";
          ctx.beginPath();
          ctx.arc(cx + 2, cy + 3, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#bfa95d";
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,249,214,0.32)";
          ctx.beginPath();
          ctx.arc(cx - 2, cy - 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      grain(ctx, 256, 256, 450, 4);
      return toTexture(c, { repeat: [2, 5] });
    });
  };

  /* --------------------------------------------------------------------- */
  /* Convenience store branding                                            */
  /* --------------------------------------------------------------------- */

  function drawSignBase(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#f6ead1");
    g.addColorStop(0.55, "#f2e0bf");
    g.addColorStop(1, "#e7d2ad");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // soft light box diffusion
    const rg = ctx.createRadialGradient(w * 0.45, h * 0.36, 20, w * 0.45, h * 0.38, w * 0.5);
    rg.addColorStop(0, "rgba(255,255,255,0.55)");
    rg.addColorStop(0.65, "rgba(255,255,255,0.08)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 650, 5);
  }

  function drawFasciaContents(ctx, w, h, compact) {
    // A very long light box. Big brand mark, a central ticket of copy,
    // then the red 24h seal — all floating over the pale diffuser panel.
    ctx.save();
    ctx.strokeStyle = "rgba(80,92,82,0.08)";
    ctx.lineWidth = 4;
    for (let x = w * 0.09; x < w; x += w * 0.085) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, h - 10);
      ctx.stroke();
    }
    ctx.restore();

    const starR = h * 0.28;
    const starX = h * 0.47;
    const starY = h * 0.39;
    ctx.fillStyle = "#1f5855";
    ctx.beginPath();
    ctx.arc(starX, starY, starR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(248,233,202,0.42)";
    ctx.lineWidth = h * 0.012;
    ctx.beginPath();
    ctx.arc(starX, starY, starR * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f8e9ca";
    starPath(ctx, starX, starY, starR * 0.61, starR * 0.25, 5);
    ctx.fill();

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.letterSpacing = "1px";
    ctx.fillStyle = "#204643";
    ctx.font = "900 " + Math.round(h * 0.49) + "px " + DISPLAY_FONT;
    ctx.fillText("HOSHI MART", h * 1.05, h * 0.38);

    ctx.font = "700 " + Math.round(h * 0.16) + "px " + JP_FONT;
    ctx.fillStyle = "#675b49";
    ctx.letterSpacing = "4px";
    ctx.fillText(compact ? "ほしマート" : "ほしマート ・ 星町二丁目", h * 1.08, h * 0.7);

    ctx.font = "600 " + Math.round(h * 0.083) + "px " + EN_FONT;
    ctx.fillStyle = "#a08b68";
    ctx.letterSpacing = "3px";
    ctx.fillText("A LITTLE LIGHT ON THE CORNER", h * 1.09, h * 0.17);

    // center ticket: a dark band of type with tiny orange stars
    const boxX = w * 0.515;
    const boxY = h * 0.245;
    const boxW = w * 0.285;
    const boxH = h * 0.5;
    ctx.fillStyle = "#2a5752";
    roundRect(ctx, boxX, boxY, boxW, boxH, h * 0.055);
    ctx.fill();
    ctx.strokeStyle = "rgba(249,232,198,0.35)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#f4e3c3";
    ctx.font = "800 " + Math.round(h * 0.17) + "px " + EN_FONT;
    ctx.letterSpacing = "4px";
    ctx.textAlign = "center";
    ctx.fillText("OPEN 24 HOURS", boxX + boxW / 2, boxY + boxH * 0.4);
    ctx.fillStyle = "#e2b174";
    ctx.font = "600 " + Math.round(h * 0.075) + "px " + EN_FONT;
    ctx.letterSpacing = "3px";
    ctx.fillText("COFFEE  ·  ONIGIRI  ·  HOT SNACK", boxX + boxW / 2, boxY + boxH * 0.72);
    ctx.fillStyle = "#e5a968";
    [boxX + h * 0.17, boxX + boxW - h * 0.17].forEach((x) => {
      starPath(ctx, x, boxY + boxH * 0.5, h * 0.065, h * 0.028, 5);
      ctx.fill();
    });

    // right-side 24h seal
    const bx = compact ? w - h * 1.0 : w - h * 1.03;
    const by = h * 0.44;
    ctx.fillStyle = "rgba(170,88,61,0.94)";
    ctx.beginPath();
    ctx.arc(bx, by, h * 0.295, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(247,232,203,0.42)";
    ctx.lineWidth = h * 0.012;
    ctx.beginPath();
    ctx.arc(bx, by, h * 0.255, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f8e8c8";
    ctx.font = "900 " + Math.round(h * 0.255) + "px " + EN_FONT;
    ctx.textAlign = "center";
    ctx.letterSpacing = "-2px";
    ctx.fillText("24", bx, by - h * 0.01);
    ctx.font = "700 " + Math.round(h * 0.073) + "px " + EN_FONT;
    ctx.letterSpacing = "3px";
    ctx.fillText("HOURS", bx, by + h * 0.17);

    // the iconic three warm stripes
    const stripeY = h * 0.82;
    const stripeH = h * 0.07;
    ctx.fillStyle = "#27655f";
    ctx.fillRect(0, stripeY, w, stripeH);
    ctx.fillStyle = "#d87b40";
    ctx.fillRect(0, stripeY + stripeH + 2, w, stripeH * 0.52);
    ctx.fillStyle = "#b3524b";
    ctx.fillRect(0, stripeY + stripeH * 1.55 + 4, w, stripeH * 0.34);

    // micro type along the lower edge
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(72,86,77,0.48)";
    ctx.font = "500 " + Math.round(h * 0.055) + "px " + JP_FONT;
    ctx.letterSpacing = "3px";
    ctx.fillText("HOSHIMACHI 2-14-7  /  SINCE 1998  /  OPEN EVERY DAY", h * 1.02, h * 0.77);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(72,86,77,0.42)";
    ctx.font = "500 " + Math.round(h * 0.052) + "px " + EN_FONT;
    ctx.letterSpacing = "2px";
    ctx.fillText("A LITTLE LIGHT ON THE CORNER", w - 26, h * 0.77);

    // delicate printed border
    ctx.strokeStyle = "rgba(50,69,63,0.35)";
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, w - 16, h - 16);
  }

  TEX.storeSign = function () {
    return cached("storeSign", () => {
      const c = makeCanvas(3072, 256);
      const ctx = c.getContext("2d");
      drawSignBase(ctx, 3072, 256);
      drawFasciaContents(ctx, 3072, 256, false);
      return toTexture(c, { anisotropy: 16 });
    });
  };

  TEX.sideSign = function () {
    return cached("sideSign", () => {
      const c = makeCanvas(2048, 256);
      const ctx = c.getContext("2d");
      drawSignBase(ctx, 2048, 256);
      drawFasciaContents(ctx, 2048, 256, true);
      return toTexture(c, { anisotropy: 16 });
    });
  };

  TEX.sign24h = function () {
    return cached("sign24h", () => {
      const c = makeCanvas(384, 1024);
      const ctx = c.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0, "#f5e9d2");
      g.addColorStop(0.62, "#f2ddba");
      g.addColorStop(1, "#e5cca2");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 384, 1024);
      ctx.strokeStyle = "#255854";
      ctx.lineWidth = 12;
      ctx.strokeRect(12, 12, 360, 1000);
      ctx.strokeStyle = "#cc7440";
      ctx.lineWidth = 5;
      ctx.strokeRect(30, 30, 324, 964);
      ctx.fillStyle = "#255854";
      ctx.beginPath();
      ctx.arc(192, 170, 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f7e9ce";
      starPath(ctx, 192, 170, 47, 20, 5);
      ctx.fill();
      ctx.textAlign = "center";
      ctx.fillStyle = "#214b49";
      ctx.font = "900 150px " + EN_FONT;
      ctx.fillText("24", 192, 390);
      ctx.fillStyle = "#bf6840";
      ctx.font = "800 57px " + EN_FONT;
      ctx.letterSpacing = "8px";
      ctx.fillText("OPEN", 192, 470);
      ctx.fillStyle = "#d8c3a2";
      ctx.fillRect(62, 520, 260, 3);
      verticalText(ctx, "ほしマート", 192, 600, 74, "700 52px " + JP_FONT, "#3c554f");
      ctx.strokeStyle = "rgba(46,76,70,0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(192, 870, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#3c554f";
      ctx.font = "700 31px " + EN_FONT;
      ctx.letterSpacing = "2px";
      ctx.fillText("RAIN", 192, 870);
      ctx.font = "500 22px " + JP_FONT;
      ctx.fillStyle = "#6e7469";
      ctx.fillText("雨の夜も、あかりを。", 192, 947);
      grain(ctx, 384, 1024, 380, 8);
      return toTexture(c, { anisotropy: 8 });
    });
  };

  TEX.windowDecal = function () {
    return cached("windowDecal", () => {
      const c = makeCanvas(512, 256);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 512, 256);
      ctx.fillStyle = "rgba(241,232,211,0.96)";
      roundRect(ctx, 18, 18, 210, 118, 10);
      ctx.fill();
      ctx.fillStyle = "#245b56";
      ctx.font = "900 58px " + EN_FONT;
      ctx.textAlign = "center";
      ctx.fillText("24H", 123, 86);
      ctx.font = "700 23px " + JP_FONT;
      ctx.fillStyle = "#bd6841";
      ctx.fillText("OPEN", 123, 116);
      // small security-camera decal
      ctx.strokeStyle = "rgba(232,240,232,0.88)";
      ctx.lineWidth = 5;
      roundRect(ctx, 287, 44, 176, 76, 8);
      ctx.stroke();
      ctx.fillStyle = "rgba(232,240,232,0.9)";
      ctx.font = "700 25px " + JP_FONT;
      ctx.textAlign = "center";
      ctx.fillText("防犯カメラ", 375, 78);
      ctx.font = "600 17px " + EN_FONT;
      ctx.fillText("IN OPERATION", 375, 103);
      return toTexture(c, { anisotropy: 8 });
    });
  };

  TEX.doorDecal = function () {
    return cached("doorDecal", () => {
      const c = makeCanvas(512, 256);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 512, 256);
      ctx.fillStyle = "rgba(246,238,220,0.9)";
      ctx.font = "700 50px " + JP_FONT;
      ctx.textAlign = "center";
      ctx.fillText("自動ドア", 256, 100);
      ctx.fillStyle = "rgba(246,238,220,0.7)";
      ctx.font = "600 23px " + EN_FONT;
      ctx.letterSpacing = "5px";
      ctx.fillText("AUTOMATIC DOOR", 256, 140);
      ctx.strokeStyle = "rgba(246,238,220,0.58)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(105, 187);
      ctx.lineTo(407, 187);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(118, 175);
      ctx.lineTo(100, 187);
      ctx.lineTo(118, 199);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(394, 175);
      ctx.lineTo(412, 187);
      ctx.lineTo(394, 199);
      ctx.stroke();
      return toTexture(c);
    });
  };

  TEX.mat = function () {
    return cached("mat", () => {
      const c = makeCanvas(512, 320);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#223b3b";
      ctx.fillRect(0, 0, 512, 320);
      ctx.strokeStyle = "#d7c7a7";
      ctx.lineWidth = 9;
      ctx.strokeRect(16, 16, 480, 288);
      ctx.fillStyle = "#eee3cc";
      ctx.font = "900 62px " + EN_FONT;
      ctx.textAlign = "center";
      ctx.letterSpacing = "5px";
      ctx.fillText("HOSHI MART", 256, 148);
      ctx.fillStyle = "#d3bb8e";
      ctx.font = "700 24px " + JP_FONT;
      ctx.letterSpacing = "6px";
      ctx.fillText("ほしマート", 256, 194);
      // rain speckle
      const rand = NM.seedRandom(22);
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle = "rgba(220,236,230," + (0.03 + rand() * 0.08) + ")";
        ctx.fillRect(rand() * 512, rand() * 320, 2 + rand() * 5, 1 + rand() * 3);
      }
      return toTexture(c, { anisotropy: 8 });
    });
  };

  TEX.plaque = function () {
    return cached("plaque", () => {
      const c = makeCanvas(1024, 256);
      const ctx = c.getContext("2d");
      const g = ctx.createLinearGradient(0, 0, 1024, 256);
      g.addColorStop(0, "#8b7349");
      g.addColorStop(0.3, "#d2b77c");
      g.addColorStop(0.55, "#a98e5d");
      g.addColorStop(0.8, "#c9ae76");
      g.addColorStop(1, "#78623e");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 256);
      const rand = NM.seedRandom(19);
      for (let i = 0; i < 480; i++) {
        ctx.fillStyle = "rgba(255,244,212," + (0.015 + rand() * 0.03) + ")";
        ctx.fillRect(rand() * 1024, rand() * 256, 20 + rand() * 100, 1);
      }
      ctx.strokeStyle = "rgba(51,40,25,0.7)";
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, 992, 224);
      ctx.strokeStyle = "rgba(255,240,198,0.4)";
      ctx.lineWidth = 2;
      ctx.strokeRect(27, 27, 970, 202);
      ctx.fillStyle = "rgba(40,32,20,0.86)";
      ctx.textAlign = "center";
      ctx.font = "700 58px " + EN_FONT;
      ctx.letterSpacing = "6px";
      ctx.fillText("HOSHI MART", 512, 107);
      ctx.font = "500 28px " + JP_FONT;
      ctx.letterSpacing = "7px";
      ctx.fillText("雨の街角 ・ 午前 2:47", 512, 159);
      ctx.font = "500 19px " + EN_FONT;
      ctx.letterSpacing = "4px";
      ctx.fillText("RAINY CORNER  /  EDITION 01", 512, 203);
      return toTexture(c, { anisotropy: 8 });
    });
  };

  TEX.doorPlate = function () {
    return cached("doorPlate", () => {
      const c = makeCanvas(512, 128);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#d8d4c6";
      ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = "#5c625d";
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, 496, 112);
      ctx.fillStyle = "#4c5755";
      ctx.font = "700 38px " + JP_FONT;
      ctx.textAlign = "center";
      ctx.fillText("関係者以外立入禁止", 256, 58);
      ctx.font = "600 22px " + EN_FONT;
      ctx.letterSpacing = "3px";
      ctx.fillText("STAFF ONLY", 256, 94);
      return toTexture(c);
    });
  };

  /* --------------------------------------------------------------------- */
  /* Posters, magazines & notices                                          */
  /* --------------------------------------------------------------------- */

  function posterOnigiri() {
    const c = makeCanvas(512, 768);
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 768);
    g.addColorStop(0, "#f6ebd2");
    g.addColorStop(0.72, "#efdfc2");
    g.addColorStop(1, "#dac9aa");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 768);
    ctx.fillStyle = "#c55345";
    ctx.beginPath();
    ctx.arc(390, 130, 92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e7dbc2";
    ctx.font = "700 28px " + EN_FONT;
    ctx.letterSpacing = "5px";
    ctx.textAlign = "left";
    ctx.fillText("NEW SEASON", 52, 80);
    ctx.fillStyle = "#2e4a43";
    ctx.font = "900 77px " + JP_FONT;
    ctx.letterSpacing = "0px";
    ctx.fillText("新米おにぎり", 50, 172);
    ctx.fillStyle = "#a3613c";
    ctx.font = "600 29px " + JP_FONT;
    ctx.fillText("粒立つ、秋の味。", 54, 220);
    // onigiri illustration
    ctx.save();
    ctx.translate(255, 470);
    ctx.rotate(-0.055);
    ctx.shadowColor = "rgba(44,39,28,0.28)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 16;
    ctx.fillStyle = "#f7f1df";
    ctx.beginPath();
    ctx.moveTo(0, -172);
    ctx.quadraticCurveTo(128, -72, 162, 126);
    ctx.quadraticCurveTo(170, 172, 110, 172);
    ctx.lineTo(-110, 172);
    ctx.quadraticCurveTo(-170, 172, -162, 126);
    ctx.quadraticCurveTo(-128, -72, 0, -172);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#233a35";
    roundRect(ctx, -82, 48, 164, 134, 12);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(-53, -65, 28, 46, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#344d43";
    ctx.font = "700 34px " + JP_FONT;
    ctx.textAlign = "center";
    ctx.fillText("店内で握りたて", 256, 692);
    ctx.fillStyle = "#b85e43";
    ctx.font = "900 42px " + EN_FONT;
    ctx.letterSpacing = "4px";
    ctx.fillText("ONIGIRI  ¥128", 256, 738);
    ctx.strokeStyle = "rgba(61,78,68,0.5)";
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, 476, 732);
    grain(ctx, 512, 768, 600, 31);
    return toTexture(c);
  }

  function posterCoffee() {
    const c = makeCanvas(512, 768);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#152d34";
    ctx.fillRect(0, 0, 512, 768);
    const g = ctx.createRadialGradient(256, 340, 40, 256, 340, 360);
    g.addColorStop(0, "#39525b");
    g.addColorStop(1, "#13242a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 768);
    ctx.fillStyle = "#de8a4f";
    ctx.fillRect(0, 0, 512, 28);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8dcc3";
    ctx.font = "700 27px " + EN_FONT;
    ctx.letterSpacing = "7px";
    ctx.fillText("FRESHLY BREWED", 256, 92);
    ctx.fillStyle = "#f2e5ca";
    ctx.font = "900 87px " + EN_FONT;
    ctx.letterSpacing = "2px";
    ctx.fillText("HOT", 256, 172);
    ctx.fillStyle = "#d88b54";
    ctx.fillText("COFFEE", 256, 254);
    // cup
    ctx.save();
    ctx.translate(256, 472);
    ctx.fillStyle = "#eadfc8";
    ctx.beginPath();
    ctx.moveTo(-112, -110);
    ctx.lineTo(112, -110);
    ctx.lineTo(82, 136);
    ctx.quadraticCurveTo(0, 170, -82, 136);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#503a2a";
    ctx.beginPath();
    ctx.ellipse(0, -102, 104, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(227,213,187,0.45)";
    ctx.beginPath();
    ctx.ellipse(-31, -20, 21, 66, 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#b6643e";
    ctx.font = "700 27px " + JP_FONT;
    ctx.letterSpacing = "3px";
    ctx.textAlign = "center";
    ctx.fillText("ほしマート ブレンド", 0, 24);
    ctx.restore();
    // steam
    ctx.strokeStyle = "rgba(230,223,205,0.4)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(256 + i * 54, 292);
      ctx.bezierCurveTo(232 + i * 54, 244, 285 + i * 54, 220, 252 + i * 54, 166);
      ctx.stroke();
    }
    ctx.fillStyle = "#decfb1";
    ctx.font = "700 32px " + JP_FONT;
    ctx.letterSpacing = "2px";
    ctx.fillText("あたたかい一杯を、雨の夜に。", 256, 678);
    ctx.fillStyle = "#d98d52";
    ctx.font = "900 41px " + EN_FONT;
    ctx.letterSpacing = "6px";
    ctx.fillText("¥150", 256, 735);
    grain(ctx, 512, 768, 500, 21);
    return toTexture(c);
  }

  function posterChicken() {
    const c = makeCanvas(512, 768);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#f3e5c8";
    ctx.fillRect(0, 0, 512, 768);
    ctx.fillStyle = "#b44f3e";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(512, 0);
    ctx.lineTo(512, 250);
    ctx.quadraticCurveTo(256, 210, 0, 286);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(104,66,43,0.45)";
    ctx.lineWidth = 12;
    ctx.strokeRect(16, 16, 480, 736);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8edda";
    ctx.font = "900 85px " + JP_FONT;
    ctx.fillText("からあげ", 256, 135);
    ctx.font = "700 31px " + EN_FONT;
    ctx.letterSpacing = "6px";
    ctx.fillText("HOT SNACK", 256, 190);
    // chicken pieces
    const rand = NM.seedRandom(61);
    for (let i = 0; i < 6; i++) {
      const x = 140 + (i % 3) * 116 + rand() * 12;
      const y = 365 + Math.floor(i / 3) * 102 + rand() * 12;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rand() - 0.5) * 0.8);
      ctx.fillStyle = i % 2 ? "#cc8b48" : "#d9a052";
      ctx.beginPath();
      for (let p = 0; p < 9; p++) {
        const a = (p / 9) * Math.PI * 2;
        const r = 31 + rand() * 13;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r * 0.82;
        if (p === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,238,190,0.32)";
      ctx.beginPath();
      ctx.arc(-10, -9, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = "#5d4d39";
    ctx.font = "700 33px " + JP_FONT;
    ctx.fillText("揚げたて、サクサク。", 256, 622);
    ctx.fillStyle = "#b44f3e";
    ctx.font = "900 48px " + EN_FONT;
    ctx.letterSpacing = "5px";
    ctx.fillText("¥220", 256, 695);
    grain(ctx, 512, 768, 450, 9);
    return toTexture(c);
  }

  function posterIce() {
    const c = makeCanvas(512, 768);
    const ctx = c.getContext("2d");
    const g = ctx.createLinearGradient(0, 0, 0, 768);
    g.addColorStop(0, "#cfe4e1");
    g.addColorStop(0.55, "#a8c9ce");
    g.addColorStop(1, "#7fa9b7");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 768);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(420, 125, 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#315b66";
    ctx.font = "700 28px " + EN_FONT;
    ctx.letterSpacing = "7px";
    ctx.textAlign = "left";
    ctx.fillText("COLD & SWEET", 48, 80);
    ctx.fillStyle = "#1e4651";
    ctx.font = "900 82px " + JP_FONT;
    ctx.fillText("アイス", 48, 176);
    ctx.font = "600 31px " + JP_FONT;
    ctx.fillStyle = "#3e6a71";
    ctx.fillText("雨の音を聴きながら。", 50, 225);
    // ice cream bars
    ctx.save();
    ctx.translate(258, 484);
    ctx.rotate(-0.1);
    ctx.fillStyle = "#f2e7cd";
    roundRect(ctx, -82, -154, 164, 316, 24);
    ctx.fill();
    ctx.fillStyle = "#cf7650";
    roundRect(ctx, -82, -62, 164, 224, 24);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    roundRect(ctx, -56, -102, 28, 250, 14);
    ctx.fill();
    ctx.fillStyle = "#5f4931";
    ctx.fillRect(-15, 162, 30, 96);
    ctx.restore();
    ctx.fillStyle = "#f7f0e0";
    ctx.font = "700 30px " + JP_FONT;
    ctx.textAlign = "center";
    ctx.fillText("夏を、もう一度。", 256, 683);
    ctx.font = "900 38px " + EN_FONT;
    ctx.letterSpacing = "5px";
    ctx.fillText("ICE BAR  ¥160", 256, 734);
    grain(ctx, 512, 768, 380, 51);
    return toTexture(c);
  }

  function posterSeasonal() {
    const c = makeCanvas(512, 768);
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#e8dabe";
    ctx.fillRect(0, 0, 512, 768);
    ctx.fillStyle = "#2d4d46";
    ctx.fillRect(0, 0, 512, 100);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ded0af";
    ctx.font = "700 27px " + EN_FONT;
    ctx.letterSpacing = "9px";
    ctx.fillText("HOSHI MART NEWS", 256, 61);
    ctx.fillStyle = "#6a563d";
    ctx.font = "600 26px " + JP_FONT;
    ctx.fillText("ちょっと、いい夜を。", 256, 166);
    ctx.fillStyle = "#b15b45";
    ctx.font = "900 73px " + JP_FONT;
    ctx.fillText("あたらしい", 256, 273);
    ctx.fillStyle = "#2e4a44";
    ctx.fillText("季節の棚", 256, 356);
    // boxes and leaves
    ctx.save();
    ctx.translate(256, 525);
    ctx.rotate(-0.06);
    ctx.fillStyle = "#c57650";
    roundRect(ctx, -170, -70, 340, 200, 10);
    ctx.fill();
    ctx.fillStyle = "#ecd9b3";
    roundRect(ctx, -145, -100, 290, 170, 8);
    ctx.fill();
    ctx.fillStyle = "#2e4a44";
    ctx.font = "700 29px " + JP_FONT;
    ctx.fillText("毎日が、小さなお祭り。", 0, -130 + 200);
    ctx.fillStyle = "#b15b45";
    ctx.font = "900 77px " + EN_FONT;
    ctx.letterSpacing = "3px";
    ctx.fillText("NEW", 0, 12);
    // leaf
    ctx.fillStyle = "#476a56";
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate(-0.25 + i * 0.13);
      ctx.beginPath();
      ctx.ellipse(-205 + i * 6, -125 + i * 8, 26, 9, -0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.fillStyle = "#5b6657";
    ctx.font = "600 25px " + JP_FONT;
    ctx.textAlign = "center";
    ctx.fillText("期間限定・なくなり次第終了", 256, 703);
    grain(ctx, 512, 768, 400, 72);
    return toTexture(c);
  }

  TEX.poster = function (kind) {
    return cached("poster-" + kind, () => {
      switch (kind) {
        case "coffee":
          return posterCoffee();
        case "chicken":
          return posterChicken();
        case "ice":
          return posterIce();
        case "seasonal":
          return posterSeasonal();
        case "onigiri":
        default:
          return posterOnigiri();
      }
    });
  };

  TEX.categorySign = function (kind) {
    return cached("category-" + kind, () => {
      const conf = {
        drink: { bg: "#d6e9e6", ink: "#1f4a4e", accent: "#b45c43", en: "DRINKS", jp: "つめた〜い飲料" },
        bento: { bg: "#f2ddbb", ink: "#70432f", accent: "#b35341", en: "BENTO", jp: "お弁当・おにぎり" },
        snack: { bg: "#e9cfb0", ink: "#644531", accent: "#36736b", en: "SWEETS", jp: "お菓子・スナック" },
        hot: { bg: "#c35542", ink: "#f8ead0", accent: "#f0c37b", en: "HOT", jp: "ホットフード" },
        magazine: { bg: "#d7d2bf", ink: "#3e4744", accent: "#9a5544", en: "MAGAZINES", jp: "雑誌・コミック" },
        oden: { bg: "#e3c98f", ink: "#4d4231", accent: "#b75c3c", en: "ODEN", jp: "おでん" },
      }[kind] || { bg: "#e2d4b9", ink: "#3f4b45", accent: "#b45c43", en: "HOSHI MART", jp: "ほしマート" };
      const c = makeCanvas(1024, 256);
      const ctx = c.getContext("2d");
      ctx.fillStyle = conf.bg;
      ctx.fillRect(0, 0, 1024, 256);
      ctx.fillStyle = conf.ink;
      ctx.fillRect(0, 0, 18, 256);
      ctx.fillRect(0, 238, 1024, 18);
      ctx.textAlign = "left";
      ctx.fillStyle = conf.ink;
      ctx.font = "900 96px " + EN_FONT;
      ctx.letterSpacing = "6px";
      ctx.fillText(conf.en, 62, 118);
      ctx.font = "700 44px " + JP_FONT;
      ctx.fillStyle = conf.accent;
      ctx.letterSpacing = "4px";
      ctx.fillText(conf.jp, 64, 191);
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath();
      ctx.arc(914, 84, 92, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(844 + i * 24, 28);
        ctx.lineTo(886 + i * 24, 206);
        ctx.stroke();
      }
      ctx.fillStyle = conf.ink;
      ctx.font = "700 22px " + EN_FONT;
      ctx.letterSpacing = "3px";
      ctx.textAlign = "right";
      ctx.fillText("HOSHI MART", 982, 222);
      grain(ctx, 1024, 256, 280, 6);
      return toTexture(c, { anisotropy: 8 });
    });
  };

  TEX.menuBoard = function () {
    return cached("menu", () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#22302f";
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "#d7c7a7";
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, 488, 488);
      ctx.textAlign = "center";
      ctx.fillStyle = "#e9dcc1";
      ctx.font = "900 44px " + EN_FONT;
      ctx.letterSpacing = "5px";
      ctx.fillText("COFFEE", 256, 72);
      ctx.fillStyle = "#c8834e";
      ctx.font = "700 24px " + JP_FONT;
      ctx.fillText("ほしマート オリジナル", 256, 108);
      ctx.strokeStyle = "rgba(220,207,180,0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(54, 132);
      ctx.lineTo(458, 132);
      ctx.stroke();
      const items = [
        ["R", "レギュラー", "¥120"],
        ["L", "ラージ", "¥180"],
        ["M", "カフェラテ", "¥190"],
        ["C", "キャラメル", "¥210"],
      ];
      items.forEach((row, i) => {
        const y = 202 + i * 70;
        ctx.fillStyle = "#d8b27c";
        ctx.font = "700 27px " + EN_FONT;
        ctx.textAlign = "left";
        ctx.fillText(row[0], 48, y);
        ctx.fillStyle = "#eee1c7";
        ctx.font = "600 28px " + JP_FONT;
        ctx.fillText(row[1], 108, y);
        ctx.fillStyle = "#d69a61";
        ctx.font = "700 29px " + EN_FONT;
        ctx.textAlign = "right";
        ctx.fillText(row[2], 464, y);
      });
      ctx.fillStyle = "rgba(220,207,180,0.35)";
      ctx.font = "500 21px " + JP_FONT;
      ctx.textAlign = "center";
      ctx.fillText("セルフカウンターで、あたたかく。", 256, 478);
      grain(ctx, 512, 512, 300, 7);
      return toTexture(c);
    });
  };

  TEX.magazineCover = function (index) {
    return cached("mag-" + index, () => {
      const c = makeCanvas(320, 440);
      const ctx = c.getContext("2d");
      const palettes = [
        ["#d8b574", "#f6ebd8", "#273f3c", "#b65b43"],
        ["#8bb4bc", "#edf1ec", "#1d3944", "#d5884c"],
        ["#d77b55", "#f7ead4", "#493027", "#365b53"],
        ["#385b6d", "#dde9e7", "#152c36", "#e0a35a"],
        ["#c8b29b", "#f4eadc", "#3d4640", "#a5493f"],
        ["#7e9c8d", "#e8ddc8", "#2e443d", "#bb7245"],
        ["#d2cfc3", "#f3f0e8", "#363f3e", "#ce6b4d"],
        ["#a56a6a", "#f1e5d3", "#452f32", "#d8b470"],
      ];
      const p = palettes[index % palettes.length];
      ctx.fillStyle = "#f2ecdd";
      ctx.fillRect(0, 0, 320, 440);
      ctx.fillStyle = p[1];
      ctx.fillRect(8, 8, 304, 424);
      // abstract cover photograph of a night street / room
      const g = ctx.createLinearGradient(0, 70, 0, 344);
      g.addColorStop(0, p[0]);
      g.addColorStop(1, p[3]);
      ctx.fillStyle = g;
      ctx.fillRect(12, 78, 296, 266);
      ctx.fillStyle = p[2];
      ctx.globalAlpha = 0.92;
      for (let i = 0; i < 5; i++) {
        const w = 26 + ((i * 37 + index * 13) % 58);
        const h = 44 + ((i * 51 + index * 17) % 150);
        ctx.fillRect(22 + i * 56, 306 - h, w, h);
      }
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(240 - (index % 3) * 60, 148, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.fillRect(12, 78, 296, 22);
      // masthead
      ctx.fillStyle = p[2];
      ctx.font = "900 38px " + EN_FONT;
      ctx.textAlign = "left";
      ctx.letterSpacing = "2px";
      ctx.fillText(["TOKYO", "CITY", "NIGHT", "WALK", "RAIN", "HOME", "STYLE", "CAFE"][index % 8], 18, 52);
      ctx.fillStyle = p[3];
      ctx.font = "700 15px " + EN_FONT;
      ctx.textAlign = "right";
      ctx.letterSpacing = "2px";
      ctx.fillText("2026 / 10", 302, 48);
      // cover lines
      ctx.fillStyle = "#f8f0df";
      ctx.textAlign = "left";
      ctx.font = "900 30px " + JP_FONT;
      ctx.letterSpacing = "1px";
      ctx.fillText(["雨の日の過ごし方", "静かな夜の音楽", "小さな部屋の灯り", "夏の終わりの記録", "街角の風景", "あたらしい暮らし", "夜更かしの本", "珈琲と本"][index % 8], 22, 322);
      ctx.fillStyle = p[3];
      ctx.font = "900 24px " + JP_FONT;
      ctx.fillText(["特集", "夜光", "雨音", "路地", "灯", "余白", "街", "休日"][index % 8], 22, 358);
      ctx.fillStyle = "rgba(50,52,45,0.72)";
      ctx.font = "600 13px " + JP_FONT;
      ctx.fillText("星町から、こんばんは。", 22, 386);
      ctx.fillStyle = p[2];
      ctx.font = "600 11px " + EN_FONT;
      ctx.letterSpacing = "1px";
      ctx.fillText("HOSHIMACHI EDITION  /  No." + String(12 + index), 22, 408);
      // barcode
      ctx.fillStyle = "#f5eee0";
      ctx.fillRect(246, 380, 50, 32);
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? "#504f47" : "#f5eee0";
        ctx.fillRect(250 + i * 3.5, 384, i % 3 ? 1 : 2.4, 21);
      }
      ctx.strokeStyle = "rgba(58,62,54,0.35)";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 300, 420);
      grain(ctx, 320, 440, 140, 10 + index);
      return toTexture(c);
    });
  };

  TEX.noticePoster = function (index) {
    return cached("notice-" + index, () => {
      const c = makeCanvas(320, 420);
      const ctx = c.getContext("2d");
      const designs = [
        { bg: "#e6d6b8", ink: "#3f4e45", accent: "#b85f45", title: "星町 秋まつり", sub: "10.28 SAT  18:00", big: "祭" },
        { bg: "#d6dfd5", ink: "#33514d", accent: "#c97b4d", title: "迷い猫", sub: "さがしています", big: "猫" },
        { bg: "#dfd4c3", ink: "#4c4334", accent: "#8c5b43", title: "夜の喫茶", sub: "OPEN 20:00", big: "珈琲" },
        { bg: "#cf5d4a", ink: "#f6e9d2", accent: "#ecc899", title: "防犯だより", sub: "星町二丁目", big: "安全" },
      ];
      const d = designs[index % designs.length];
      ctx.fillStyle = d.bg;
      ctx.fillRect(0, 0, 320, 420);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, 304, 404);
      ctx.fillStyle = d.accent;
      ctx.fillRect(0, 0, 320, 18);
      ctx.fillStyle = d.ink;
      ctx.textAlign = "center";
      ctx.font = "700 21px " + JP_FONT;
      ctx.fillText(d.title, 160, 70);
      ctx.font = "500 16px " + JP_FONT;
      ctx.fillStyle = "rgba(40,50,43,0.6)";
      ctx.fillText(d.sub, 160, 96);
      ctx.fillStyle = d.accent;
      ctx.beginPath();
      ctx.arc(160, 224, 106, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = d.bg;
      ctx.font = "900 90px " + JP_FONT;
      ctx.fillText(d.big, 160, 256);
      ctx.fillStyle = d.ink;
      ctx.font = "500 14px " + JP_FONT;
      ctx.fillText(index % 2 ? "星町商店会  /  星町二丁目自治会" : "星町二丁目  /  商店街のお知らせ", 160, 368);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      ctx.fillRect(74, 384, 172, 3);
      grain(ctx, 320, 420, 160, 22 + index);
      return toTexture(c);
    });
  };

  TEX.shelfStrip = function () {
    return cached("shelfStrip", () => {
      const c = makeCanvas(1024, 64);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#eee5d2";
      ctx.fillRect(0, 0, 1024, 64);
      ctx.fillStyle = "#d8ccb5";
      ctx.fillRect(0, 0, 1024, 5);
      ctx.fillStyle = "#6d6d60";
      ctx.font = "700 21px " + EN_FONT;
      ctx.textAlign = "left";
      for (let i = 0; i < 9; i++) {
        const x = 24 + i * 112;
        const price = ["¥128", "¥158", "¥198", "¥108", "¥248", "¥138", "¥298", "¥168", "¥98"][i];
        ctx.fillText(price, x, 33);
        ctx.fillStyle = "#b35b45";
        ctx.font = "700 13px " + JP_FONT;
        ctx.fillText("税込", x + 54, 32);
        ctx.fillStyle = "#6d6d60";
        ctx.font = "700 21px " + EN_FONT;
        ctx.fillStyle = "#c4b99f";
        ctx.fillRect(x + 84, 16, 2, 28);
        ctx.fillStyle = "#6d6d60";
      }
      return toTexture(c);
    });
  };

  /* --------------------------------------------------------------------- */
  /* Street signage & props                                                */
  /* --------------------------------------------------------------------- */

  TEX.vendingFront = function () {
    return cached("vending", () => {
      const c = makeCanvas(768, 1280);
      const ctx = c.getContext("2d");
      // cream body
      ctx.fillStyle = "#e9dfc7";
      ctx.fillRect(0, 0, 768, 1280);
      // header
      const hg = ctx.createLinearGradient(0, 0, 0, 230);
      hg.addColorStop(0, "#b64e43");
      hg.addColorStop(1, "#973d38");
      ctx.fillStyle = hg;
      ctx.fillRect(0, 0, 768, 230);
      ctx.fillStyle = "#f7e9d2";
      ctx.textAlign = "left";
      ctx.font = "700 26px " + EN_FONT;
      ctx.letterSpacing = "7px";
      ctx.fillText("HOSHI DRINKS", 46, 67);
      ctx.font = "900 86px " + JP_FONT;
      ctx.letterSpacing = "2px";
      ctx.fillText("つめた〜い", 44, 157);
      ctx.font = "600 27px " + JP_FONT;
      ctx.letterSpacing = "3px";
      ctx.fillStyle = "rgba(247,233,210,0.72)";
      ctx.fillText("COLD BEVERAGES", 48, 197);
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.arc(660, 94, 122, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f0d3a0";
      ctx.font = "900 90px " + EN_FONT;
      ctx.textAlign = "center";
      ctx.fillText("ICE", 660, 118);
      // glass product window
      ctx.fillStyle = "rgba(233,246,240,0.75)";
      roundRect(ctx, 34, 260, 500, 790, 18);
      ctx.fill();
      ctx.strokeStyle = "rgba(60,68,63,0.35)";
      ctx.lineWidth = 6;
      ctx.stroke();
      const rand = NM.seedRandom(77);
      const colors = ["#cc5945", "#49788c", "#d0a254", "#688f63", "#c77945", "#577c9a", "#b44e4b", "#e0d8c2", "#7b5b7f", "#3e6d68"];
      for (let row = 0; row < 5; row++) {
        const y = 320 + row * 138;
        ctx.fillStyle = "rgba(73,84,79,0.16)";
        ctx.fillRect(48, y + 90, 470, 4);
        for (let col = 0; col < 6; col++) {
          const x = 72 + col * 76;
          const colr = colors[(row * 4 + col * 3) % colors.length];
          ctx.fillStyle = "rgba(34,40,38,0.13)";
          roundRect(ctx, x + 3, y + 6, 44, 82, 8);
          ctx.fill();
          ctx.fillStyle = colr;
          roundRect(ctx, x, y, 44, 82, 8);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.74)";
          roundRect(ctx, x + 5, y + 27, 34, 23, 3);
          ctx.fill();
          ctx.fillStyle = "rgba(30,35,33,0.62)";
          ctx.fillRect(x + 14, y - 4, 16, 8);
        }
      }
      // glow overlay
      const gl = ctx.createLinearGradient(0, 260, 0, 1050);
      gl.addColorStop(0, "rgba(255,255,255,0.34)");
      gl.addColorStop(0.45, "rgba(255,255,255,0.05)");
      gl.addColorStop(1, "rgba(255,255,255,0.23)");
      ctx.fillStyle = gl;
      roundRect(ctx, 34, 260, 500, 790, 18);
      ctx.fill();
      // button strip and slot
      ctx.fillStyle = "#393f3b";
      roundRect(ctx, 564, 260, 166, 790, 14);
      ctx.fill();
      for (let i = 0; i < 8; i++) {
        const y = 300 + i * 64;
        ctx.fillStyle = i % 3 === 0 ? "#dcae63" : "#e4dbc5";
        roundRect(ctx, 594, y, 108, 34, 6);
        ctx.fill();
        ctx.fillStyle = "#323a38";
        ctx.fillRect(606, y + 13, 40, 4);
        ctx.fillRect(650, y + 13, 28, 4);
        ctx.fillStyle = i % 3 === 0 ? "#a3443e" : "#5d756d";
        ctx.fillRect(714, y + 8, 10, 18);
      }
      ctx.fillStyle = "#1e2523";
      roundRect(ctx, 606, 880, 74, 14, 5);
      ctx.fill();
      ctx.fillStyle = "#b7aa91";
      ctx.font = "700 15px " + EN_FONT;
      ctx.textAlign = "center";
      ctx.fillText("COIN  /  IC", 646, 925);
      ctx.fillStyle = "#252b28";
      roundRect(ctx, 76, 1082, 646, 122, 14);
      ctx.fill();
      ctx.fillStyle = "#161a18";
      roundRect(ctx, 100, 1102, 596, 56, 8);
      ctx.fill();
      ctx.fillStyle = "#c3b9a4";
      ctx.font = "600 18px " + EN_FONT;
      ctx.letterSpacing = "3px";
      ctx.textAlign = "center";
      ctx.fillText("PUSH  •  TAKE  •  ENJOY", 384, 1190);
      const bottom = ctx.createLinearGradient(0, 1220, 0, 1280);
      bottom.addColorStop(0, "#d8cdb7");
      bottom.addColorStop(1, "#a9987d");
      ctx.fillStyle = bottom;
      ctx.fillRect(0, 1220, 768, 60);
      grain(ctx, 768, 1280, 500, 44);
      return toTexture(c, { anisotropy: 8 });
    });
  };

  TEX.trafficSign = function (type) {
    return cached("sign-" + type, () => {
      if (type === "stop") {
        const c = makeCanvas(512, 512);
        const ctx = c.getContext("2d");
        ctx.translate(256, 256);
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = "#b94f46";
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = -Math.PI / 2 + (i / 3) * Math.PI * 2;
          const x = Math.cos(a) * 210;
          const y = Math.sin(a) * 210;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#f2e6d2";
        ctx.lineWidth = 16;
        ctx.stroke();
        ctx.fillStyle = "#f5e8d1";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "900 132px " + JP_FONT;
        ctx.fillText("止まれ", 0, 5);
        return toTexture(c);
      }
      if (type === "parking") {
        const c = makeCanvas(512, 512);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#315c83";
        ctx.fillRect(16, 16, 480, 480);
        ctx.strokeStyle = "#e4e5da";
        ctx.lineWidth = 16;
        ctx.strokeRect(34, 34, 444, 444);
        ctx.fillStyle = "#f1eee0";
        ctx.textAlign = "center";
        ctx.font = "900 330px " + EN_FONT;
        ctx.fillText("P", 256, 378);
        return toTexture(c);
      }
      if (type === "oneway") {
        const c = makeCanvas(512, 512);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#315c83";
        ctx.beginPath();
        ctx.arc(256, 256, 228, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#e9e9dc";
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.fillStyle = "#f2f0e0";
        ctx.beginPath();
        ctx.moveTo(120, 256);
        ctx.lineTo(318, 256);
        ctx.lineTo(318, 202);
        ctx.lineTo(422, 281);
        ctx.lineTo(318, 360);
        ctx.lineTo(318, 306);
        ctx.lineTo(120, 306);
        ctx.closePath();
        ctx.fill();
        return toTexture(c);
      }
      // street name
      const c = makeCanvas(768, 256);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#295949";
      ctx.fillRect(0, 0, 768, 256);
      ctx.strokeStyle = "#e7e9d8";
      ctx.lineWidth = 8;
      ctx.strokeRect(12, 12, 744, 232);
      ctx.fillStyle = "#edf0df";
      ctx.textAlign = "center";
      ctx.font = "700 74px " + JP_FONT;
      ctx.letterSpacing = "3px";
      ctx.fillText("星町 二丁目", 384, 112);
      ctx.font = "600 31px " + EN_FONT;
      ctx.letterSpacing = "7px";
      ctx.fillText("HOSHIMACHI 2-CHOME", 384, 174);
      ctx.font = "500 22px " + JP_FONT;
      ctx.letterSpacing = "4px";
      ctx.fillText("商店街  /  SHOPPING STREET", 384, 218);
      return toTexture(c);
    });
  };

  TEX.roadStop = function () {
    return cached("roadStop", () => {
      const c = makeCanvas(512, 1024);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 512, 1024);
      ctx.fillStyle = "rgba(225,233,226,0.86)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 292px " + JP_FONT;
      ctx.save();
      ctx.translate(256, 512);
      ctx.scale(0.82, 1.75);
      ctx.fillText("止まれ", 0, 0);
      ctx.restore();
      return toTexture(c, { anisotropy: 8 });
    });
  };

  TEX.arrowDecal = function () {
    return cached("arrow", () => {
      const c = makeCanvas(256, 1024);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 256, 1024);
      ctx.fillStyle = "rgba(118,201,190,0.8)";
      roundRect(ctx, 92, 72, 72, 880, 36);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(128, 900);
      ctx.lineTo(36, 790);
      ctx.lineTo(220, 790);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(242,235,210,0.8)";
      ctx.font = "700 42px " + JP_FONT;
      ctx.textAlign = "center";
      ctx.fillText("レジ", 128, 280);
      ctx.fillText("こちら", 128, 334);
      return toTexture(c);
    });
  };

  TEX.floorDecal = function (text, sub) {
    return cached("floor-" + text + sub, () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 512, 512);
      ctx.strokeStyle = "rgba(212,105,73,0.8)";
      ctx.lineWidth = 22;
      ctx.beginPath();
      ctx.arc(256, 256, 192, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(45,83,76,0.84)";
      ctx.textAlign = "center";
      ctx.font = "900 108px " + JP_FONT;
      ctx.fillText(text, 256, 258);
      ctx.font = "700 29px " + EN_FONT;
      ctx.letterSpacing = "5px";
      ctx.fillText(sub || "", 256, 322);
      return toTexture(c);
    });
  };

  TEX.priceTag = function (text, opts) {
    opts = opts || {};
    return cached("price-" + text + (opts.color || ""), () => {
      const c = makeCanvas(256, 128);
      const ctx = c.getContext("2d");
      ctx.fillStyle = opts.bg || "#f3e9d2";
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = "rgba(68,64,51,0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(3, 3, 250, 122);
      ctx.fillStyle = opts.color || "#a54f3f";
      ctx.textAlign = "center";
      ctx.font = "900 60px " + EN_FONT;
      ctx.fillText(text, 128, 78);
      ctx.fillStyle = "#66604f";
      ctx.font = "600 17px " + JP_FONT;
      ctx.fillText(opts.sub || "税込", 128, 108);
      return toTexture(c);
    });
  };

  TEX.parkingMark = function () {
    return cached("paintP", () => {
      const c = makeCanvas(512, 512);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 512, 512);
      ctx.fillStyle = "rgba(222,230,224,0.8)";
      ctx.textAlign = "center";
      ctx.font = "900 410px " + EN_FONT;
      ctx.fillText("P", 256, 416);
      return toTexture(c);
    });
  };
})();
