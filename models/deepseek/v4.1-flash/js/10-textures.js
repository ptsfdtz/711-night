/* ------------------------------------------------------------------
   10-textures.js  --  every texture in the diorama is painted on a
                       <canvas> at load time.  No external assets.
------------------------------------------------------------------ */
(function (RN) {
  'use strict';

  var JP = '"Yu Gothic UI","Yu Gothic","Meiryo","MS PGothic","Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif';
  var LAT = '"Arial Black","Arial","Helvetica",sans-serif';

  function mk(w, h) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return { c: c, x: c.getContext('2d') };
  }

  function tex(canvas, opts) {
    opts = opts || {};
    var t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = RN.maxAniso || 1;
    if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
    if (opts.clamp) { t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; }
    t.needsUpdate = true;
    return t;
  }

  function roundRect(x, a, b, w, h, r) {
    x.beginPath();
    x.moveTo(a + r, b);
    x.lineTo(a + w - r, b);
    x.quadraticCurveTo(a + w, b, a + w, b + r);
    x.lineTo(a + w, b + h - r);
    x.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
    x.lineTo(a + r, b + h);
    x.quadraticCurveTo(a, b + h, a, b + h - r);
    x.lineTo(a, b + r);
    x.quadraticCurveTo(a, b, a + r, b);
    x.closePath();
  }

  function speckle(x, w, h, count, base, spread, alpha) {
    for (var i = 0; i < count; i++) {
      var v = base + Math.random() * spread;
      x.fillStyle = 'rgba(' + (v | 0) + ',' + (v | 0) + ',' + ((v + 10) | 0) + ',' + (alpha * (0.35 + Math.random() * 0.65)).toFixed(3) + ')';
      x.beginPath();
      x.arc(Math.random() * w, Math.random() * h, 0.4 + Math.random() * 2.1, 0, 6.2832);
      x.fill();
    }
  }

  RN.tex = {};

  /* ---------------- glow / smear / shadow ---------------- */

  RN.tex.glow = (function () {
    var s = 128, o = mk(s, s);
    var g = o.x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0.00, 'rgba(255,255,255,1)');
    g.addColorStop(0.16, 'rgba(255,255,255,0.66)');
    g.addColorStop(0.38, 'rgba(255,255,255,0.24)');
    g.addColorStop(0.66, 'rgba(255,255,255,0.06)');
    g.addColorStop(1.00, 'rgba(255,255,255,0)');
    o.x.fillStyle = g;
    o.x.fillRect(0, 0, s, s);
    return tex(o.c, { clamp: true });
  })();

  RN.tex.smear = (function () {
    var w = 64, h = 128, o = mk(w, h);
    var g = o.x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.00, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.22, 'rgba(255,255,255,0.52)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.17)');
    g.addColorStop(1.00, 'rgba(255,255,255,0)');
    o.x.fillStyle = g;
    o.x.fillRect(0, 0, w, h);
    o.x.globalCompositeOperation = 'destination-in';
    var g2 = o.x.createLinearGradient(0, 0, w, 0);
    g2.addColorStop(0.00, 'rgba(255,255,255,0)');
    g2.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    g2.addColorStop(0.65, 'rgba(255,255,255,0.85)');
    g2.addColorStop(1.00, 'rgba(255,255,255,0)');
    o.x.fillStyle = g2;
    o.x.fillRect(0, 0, w, h);
    return tex(o.c, { clamp: true });
  })();

  RN.tex.shadow = (function () {
    var s = 128, o = mk(s, s);
    var g = o.x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0.00, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.62)');
    g.addColorStop(0.78, 'rgba(255,255,255,0.18)');
    g.addColorStop(1.00, 'rgba(255,255,255,0)');
    o.x.fillStyle = g;
    o.x.fillRect(0, 0, s, s);
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- asphalt road ---------------- */

  RN.tex.road = (function () {
    var s = 512, o = mk(s, s), x = o.x;
    x.fillStyle = '#23262f';
    x.fillRect(0, 0, s, s);
    for (var i = 0; i < 26; i++) {
      x.fillStyle = 'rgba(255,255,255,' + (0.006 + Math.random() * 0.014).toFixed(4) + ')';
      x.beginPath();
      x.ellipse(Math.random() * s, Math.random() * s, 40 + Math.random() * 130, 26 + Math.random() * 90, Math.random() * 3.14, 0, 6.2832);
      x.fill();
    }
    speckle(x, s, s, 12000, 40, 55, 0.30);
    x.strokeStyle = 'rgba(255,255,255,0.035)';
    x.lineWidth = 2;
    for (var k = 0; k < 5; k++) {
      x.beginPath();
      var y0 = Math.random() * s;
      x.moveTo(0, y0);
      x.bezierCurveTo(s * 0.3, y0 + (Math.random() - 0.5) * 60, s * 0.7, y0 + (Math.random() - 0.5) * 60, s, y0);
      x.stroke();
    }
    return tex(o.c, { repeat: [3, 3] });
  })();

  /* ---------------- sidewalk paving ---------------- */

  RN.tex.sidewalk = (function () {
    var s = 512, o = mk(s, s), x = o.x;
    x.fillStyle = '#565b6b';
    x.fillRect(0, 0, s, s);
    var n = 4, cw = s / n;
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var v = 78 + Math.random() * 16;
        x.fillStyle = 'rgb(' + (v | 0) + ',' + ((v + 3) | 0) + ',' + ((v + 14) | 0) + ')';
        x.fillRect(i * cw + 2, j * cw + 2, cw - 4, cw - 4);
        x.fillStyle = 'rgba(0,0,0,0.10)';
        x.fillRect(i * cw + 2, j * cw + cw - 7, cw - 4, 5);
      }
    }
    speckle(x, s, s, 5000, 60, 50, 0.20);
    return tex(o.c, { repeat: [2, 2] });
  })();

  /* ---------------- interior floor ---------------- */

  RN.tex.shopFloor = (function () {
    var s = 512, o = mk(s, s), x = o.x;
    x.fillStyle = '#cfd3cf';
    x.fillRect(0, 0, s, s);
    var n = 8, cw = s / n;
    for (var i = 0; i < n; i++) {
      for (var j = 0; j < n; j++) {
        var t = 0.86 + Math.random() * 0.14;
        x.fillStyle = 'rgba(' + (232 * t | 0) + ',' + (233 * t | 0) + ',' + (226 * t | 0) + ',1)';
        x.fillRect(i * cw, j * cw, cw - 1.5, cw - 1.5);
      }
    }
    x.fillStyle = 'rgba(120,126,120,0.35)';
    for (var k = 0; k <= n; k++) {
      x.fillRect(k * cw - 0.75, 0, 1.5, s);
      x.fillRect(0, k * cw - 0.75, s, 1.5);
    }
    return tex(o.c, { repeat: [4, 4] });
  })();

  /* ---------------- roof panels ---------------- */

  RN.tex.roofPanel = (function () {
    var s = 256, o = mk(s, s), x = o.x;
    x.fillStyle = '#5b6170';
    x.fillRect(0, 0, s, s);
    for (var k = 0; k < 18; k++) {
      x.fillStyle = 'rgba(0,0,0,' + (0.03 + Math.random() * 0.055).toFixed(3) + ')';
      x.beginPath();
      x.ellipse(Math.random() * s, Math.random() * s, 12 + Math.random() * 46, 9 + Math.random() * 34, Math.random() * 3.14, 0, 6.2832);
      x.fill();
    }
    speckle(x, s, s, 3000, 68, 42, 0.20);
    x.strokeStyle = 'rgba(0,0,0,0.30)';
    x.lineWidth = 3;
    for (var i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo(i * s / 4, 0); x.lineTo(i * s / 4, s); x.stroke();
      x.beginPath(); x.moveTo(0, i * s / 4); x.lineTo(s, i * s / 4); x.stroke();
    }
    x.strokeStyle = 'rgba(255,255,255,0.06)';
    x.lineWidth = 1.5;
    for (i = 0; i <= 4; i++) {
      x.beginPath(); x.moveTo(i * s / 4 + 2, 0); x.lineTo(i * s / 4 + 2, s); x.stroke();
      x.beginPath(); x.moveTo(0, i * s / 4 + 2); x.lineTo(s, i * s / 4 + 2); x.stroke();
    }
    return tex(o.c, { repeat: [2, 2] });
  })();

  /* ---------------- store wall panel ---------------- */

  RN.tex.wall = (function () {
    var s = 256, o = mk(s, s), x = o.x;
    x.fillStyle = '#d9dbd4';
    x.fillRect(0, 0, s, s);
    x.fillStyle = 'rgba(0,0,0,0.045)';
    x.fillRect(0, s - 26, s, 26);
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.fillRect(0, 0, s, 3);
    speckle(x, s, s, 1200, 170, 40, 0.10);
    return tex(o.c, { repeat: [4, 2] });
  })();

  /* ---------------- the big store sign band ---------------- */

  function signCanvas() {
    var w = 2048, h = 256, o = mk(w, h), x = o.x;

    var g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0.00, '#0f8a6d');
    g.addColorStop(0.45, '#0c6f5c');
    g.addColorStop(1.00, '#0a4d46');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);

    var sheen = x.createLinearGradient(0, 0, 0, h);
    sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
    sheen.addColorStop(0.35, 'rgba(255,255,255,0.03)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.18)');
    x.fillStyle = sheen;
    x.fillRect(0, 0, w, h);

    x.fillStyle = '#ffd24a';
    x.fillRect(0, h - 34, w, 16);
    x.fillStyle = '#ff7a3d';
    x.fillRect(0, h - 18, w, 18);

    x.textBaseline = 'middle';

    x.shadowColor = 'rgba(255,255,255,0.55)';
    x.shadowBlur = 26;
    x.fillStyle = '#ffffff';
    x.font = '900 132px ' + LAT;
    x.fillText('AMAMIYA', 78, h * 0.44);
    x.shadowBlur = 0;

    x.font = '700 74px ' + JP;
    x.fillStyle = '#eafff6';
    x.fillText('マート', 78 + x.measureText('AMAMIYA').width + 250, h * 0.46);

    x.font = '700 62px ' + JP;
    x.fillStyle = 'rgba(255,255,255,0.9)';
    x.fillText('24時間営業', 84, h * 0.44 + 82);

    x.fillStyle = '#ffd24a';
    roundRect(x, w - 330, 34, 250, 108, 18);
    x.fill();
    x.fillStyle = '#0a3d36';
    x.font = '900 76px ' + LAT;
    x.textAlign = 'center';
    x.fillText('24H', w - 205, 92);
    x.textAlign = 'left';

    return o.c;
  }
  RN.tex.storeSign = tex(signCanvas(), { clamp: true });
  RN.tex.storeSignSide = tex(signCanvas(), { clamp: true });

  /* ---------------- pylon / pole sign ---------------- */

  RN.tex.pylon = (function () {
    var w = 512, h = 512, o = mk(w, h), x = o.x;
    x.fillStyle = '#0d6b58';
    x.fillRect(0, 0, w, h);
    var g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.20)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.22)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);

    x.fillStyle = '#ffffff';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = '900 108px ' + LAT;
    x.fillText('AMAMIYA', w / 2, 150);
    x.font = '700 76px ' + JP;
    x.fillText('マート', w / 2, 250);

    x.fillStyle = '#ffd24a';
    roundRect(x, 108, 316, 296, 108, 20);
    x.fill();
    x.fillStyle = '#0a3d36';
    x.font = '900 78px ' + LAT;
    x.fillText('24H', w / 2, 374);

    x.fillStyle = '#ff7a3d';
    x.fillRect(0, h - 22, w, 22);
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- vending machine face ---------------- */

  RN.tex.vending = (function () {
    var w = 256, h = 512, o = mk(w, h), x = o.x;
    x.fillStyle = '#e8ecef';
    x.fillRect(0, 0, w, h);

    x.fillStyle = '#20304a';
    x.fillRect(0, 0, w, 84);
    x.fillStyle = '#ff6a3d';
    x.fillRect(0, 78, w, 8);

    x.fillStyle = '#ffffff';
    x.font = '700 34px ' + JP;
    x.textBaseline = 'middle';
    x.fillText('つめたい', 14, 44);
    x.fillStyle = '#8fd8ff';
    x.font = '900 34px ' + LAT;
    x.textAlign = 'right';
    x.fillText('COLD', w - 14, 44);
    x.textAlign = 'left';

    var cols = 4, rows = 3, pad = 10;
    var gw = (w - pad * 2) / cols;
    var gh = 108;
    var top = 108;
    var palette = ['#e94f4f', '#4fa8e9', '#f2c14e', '#63c78a', '#b06fe0', '#f08a4b', '#4fd6d6', '#e86fa8', '#8fd35a', '#6a7de8', '#f2f2f2', '#c8523f'];
    for (var r = 0; r < rows; r++) {
      x.fillStyle = 'rgba(0,0,0,0.10)';
      x.fillRect(pad, top + r * gh + gh - 12, w - pad * 2, 10);
      for (var c = 0; c < cols; c++) {
        var px = pad + c * gw, py = top + r * gh;
        var col = palette[(r * cols + c) % palette.length];
        x.fillStyle = '#f7f9fb';
        roundRect(x, px + 3, py + 3, gw - 12, gh - 20, 8);
        x.fill();
        x.fillStyle = col;
        roundRect(x, px + 10, py + 12, gw - 26, gh - 46, 6);
        x.fill();
        x.fillStyle = 'rgba(255,255,255,0.55)';
        x.fillRect(px + 10, py + 12, 5, gh - 46);
        x.fillStyle = 'rgba(0,0,0,0.18)';
        x.fillRect(px + 10, py + 12, gw - 26, 12);
      }
    }

    x.fillStyle = '#2a3346';
    x.fillRect(0, 430, w, 82);
    x.fillStyle = '#3d4a63';
    x.fillRect(14, 444, 120, 54);
    x.fillStyle = '#7de3c0';
    x.font = '700 26px ' + LAT;
    x.fillText('¥130', 24, 471);
    x.fillStyle = '#0f1622';
    x.fillRect(158, 444, 84, 22);
    x.fillStyle = '#ffd24a';
    x.fillRect(158, 474, 84, 24);
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- posters ---------------- */

  var POSTER_BG = ['#1f2b52', '#5a1f3d', '#123f38', '#3a2a5c', '#4a2418', '#14304d'];
  var POSTER_ACC = ['#ff7ab8', '#ffd24a', '#7de3c0', '#8fb6ff', '#ff9a5c', '#c9a2ff'];

  RN.tex.poster = function (i) {
    var w = 256, h = 362, o = mk(w, h), x = o.x;
    var bg = POSTER_BG[i % POSTER_BG.length];
    var ac = POSTER_ACC[i % POSTER_ACC.length];
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    var g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,255,255,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0.30)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);

    x.globalAlpha = 0.85;
    x.fillStyle = ac;
    x.beginPath();
    x.arc(w * 0.72, h * 0.30, 62, 0, 6.2832);
    x.fill();
    x.globalAlpha = 0.35;
    x.beginPath();
    x.arc(w * 0.30, h * 0.62, 92, 0, 6.2832);
    x.fill();
    x.globalAlpha = 1;

    x.fillStyle = '#ffffff';
    x.font = '900 40px ' + JP;
    x.textBaseline = 'middle';
    x.fillText('新発売', 20, h - 108);
    x.fillStyle = ac;
    x.font = '900 30px ' + LAT;
    x.fillText('NEW ITEM', 20, h - 66);
    x.fillStyle = 'rgba(255,255,255,0.7)';
    x.fillRect(20, h - 40, w - 40, 6);
    x.fillStyle = 'rgba(255,255,255,0.35)';
    x.fillRect(20, h - 26, w - 90, 6);
    return tex(o.c, { clamp: true });
  };

  /* ---------------- magazine covers ---------------- */

  RN.tex.magazine = function (i) {
    var w = 128, h = 168, o = mk(w, h), x = o.x;
    var bg = POSTER_BG[(i + 2) % POSTER_BG.length];
    var ac = POSTER_ACC[(i + 3) % POSTER_ACC.length];
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    x.fillStyle = ac;
    x.globalAlpha = 0.75;
    x.beginPath();
    x.arc(w * 0.5, h * 0.45, 40, 0, 6.2832);
    x.fill();
    x.globalAlpha = 1;
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, w, 22);
    x.fillStyle = bg;
    x.font = '900 15px ' + LAT;
    x.textBaseline = 'middle';
    x.fillText('WEEKLY', 6, 12);
    x.fillStyle = '#ffffff';
    x.font = '900 13px ' + JP;
    x.fillText('特集', 6, h - 16);
    return tex(o.c, { clamp: true });
  };

  /* ---------------- notice / poster board ---------------- */

  RN.tex.noticeBoard = (function () {
    var w = 512, h = 384, o = mk(w, h), x = o.x;
    x.fillStyle = '#6b5636';
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#8a7048';
    x.fillRect(6, 6, w - 12, h - 12);
    x.fillStyle = '#4a3a24';
    x.fillRect(0, 0, w, 14);
    x.fillRect(0, h - 14, w, 14);
    var cols = ['#f3f0e4', '#e9e4d2', '#f7f2e2'];
    for (var i = 0; i < 6; i++) {
      var pw = 118, ph = 108;
      var px = 26 + (i % 3) * 158;
      var py = 34 + Math.floor(i / 3) * 160;
      x.save();
      x.translate(px + pw / 2, py + ph / 2);
      x.rotate((Math.random() - 0.5) * 0.09);
      x.fillStyle = 'rgba(0,0,0,0.25)';
      x.fillRect(-pw / 2 + 3, -ph / 2 + 4, pw, ph);
      x.fillStyle = cols[i % cols.length];
      x.fillRect(-pw / 2, -ph / 2, pw, ph);
      x.fillStyle = 'rgba(40,40,60,0.75)';
      for (var l = 0; l < 5; l++) x.fillRect(-pw / 2 + 12, -ph / 2 + 16 + l * 16, pw - 24 - (l === 4 ? 40 : 0), 6);
      x.fillStyle = '#d94f4f';
      x.fillRect(-pw / 2 + 12, -ph / 2 + 6, 34, 7);
      x.restore();
    }
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- glass rain streaks (scrolls downward) ---------- */

  RN.tex.glassStreak = (function () {
    var w = 256, h = 512, o = mk(w, h), x = o.x;
    x.clearRect(0, 0, w, h);
    for (var i = 0; i < 90; i++) {
      var px = Math.random() * w;
      var len = 30 + Math.random() * 150;
      var py = Math.random() * h;
      var th = 0.6 + Math.random() * 2.0;
      var a = 0.06 + Math.random() * 0.22;
      var g = x.createLinearGradient(0, py, 0, py + len);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.3, 'rgba(255,255,255,' + a.toFixed(3) + ')');
      g.addColorStop(0.85, 'rgba(220,240,255,' + (a * 0.6).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(px, py, th, len);
    }
    for (var k = 0; k < 220; k++) {
      x.fillStyle = 'rgba(230,244,255,' + (0.05 + Math.random() * 0.18).toFixed(3) + ')';
      x.beginPath();
      x.arc(Math.random() * w, Math.random() * h, 0.7 + Math.random() * 1.9, 0, 6.2832);
      x.fill();
    }
    return tex(o.c, { repeat: [3, 2] });
  })();

  /* ---------------- ceiling light panel ---------------- */

  RN.tex.ceilingPanel = (function () {
    var w = 128, h = 256, o = mk(w, h), x = o.x;
    var g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#fff6e0');
    g.addColorStop(1, '#ffeec9');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,236,190,0.55)';
    for (var i = 0; i < 6; i++) x.fillRect(0, i * (h / 6) + 2, w, 2);
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- fridge interior (drink rows) ---------------- */

  RN.tex.fridge = (function () {
    var w = 512, h = 512, o = mk(w, h), x = o.x;
    x.fillStyle = '#f4f7f9';
    x.fillRect(0, 0, w, h);
    var rows = 5, rh = h / rows;
    var pal = ['#e64b4b', '#4b9de6', '#f0c53f', '#5cc487', '#a76fe0', '#f0894b', '#49c9c9', '#e673a8', '#8ccf57', '#6b7ee0'];
    for (var r = 0; r < rows; r++) {
      x.fillStyle = 'rgba(0,0,0,0.12)';
      x.fillRect(0, r * rh + rh - 12, w, 12);
      x.fillStyle = '#e3e8ec';
      x.fillRect(0, r * rh + rh - 26, w, 14);
      var cols = 9;
      for (var c = 0; c < cols; c++) {
        var bw = w / cols;
        var col = pal[(r * 3 + c) % pal.length];
        var bx = c * bw + 4;
        var by = r * rh + 14;
        var bwid = bw - 8;
        var bhei = rh - 34;
        x.fillStyle = 'rgba(0,0,0,0.16)';
        x.fillRect(bx + 2, by + 3, bwid, bhei);
        x.fillStyle = col;
        x.fillRect(bx, by, bwid, bhei);
        x.fillStyle = 'rgba(255,255,255,0.45)';
        x.fillRect(bx + 2, by, 4, bhei);
        x.fillStyle = 'rgba(255,255,255,0.9)';
        x.fillRect(bx + 4, by + bhei * 0.42, bwid - 8, bhei * 0.14);
      }
    }
    var gl = x.createLinearGradient(0, 0, 0, h);
    gl.addColorStop(0, 'rgba(255,255,255,0.30)');
    gl.addColorStop(0.4, 'rgba(255,255,255,0.02)');
    gl.addColorStop(1, 'rgba(0,0,0,0.16)');
    x.fillStyle = gl;
    x.fillRect(0, 0, w, h);
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- gondola shelf face (products) ---------------- */

  RN.tex.shelf = (function () {
    var w = 512, h = 256, o = mk(w, h), x = o.x;
    x.fillStyle = '#d7dadd';
    x.fillRect(0, 0, w, h);
    var rows = 3, rh = h / rows;
    var pal = ['#e65a5a', '#5a9fe6', '#f0c850', '#5fc98d', '#b078e0', '#f0955a', '#5fd0d0', '#e078b0', '#96d45f'];
    for (var r = 0; r < rows; r++) {
      x.fillStyle = '#b9bec4';
      x.fillRect(0, r * rh + rh - 12, w, 12);
      var cols = 16;
      for (var c = 0; c < cols; c++) {
        var bw = w / cols;
        var col = pal[(r * 5 + c * 3) % pal.length];
        var hh = rh - 26 - Math.random() * 12;
        x.fillStyle = col;
        x.fillRect(c * bw + 2, r * rh + rh - 14 - hh, bw - 5, hh);
        x.fillStyle = 'rgba(255,255,255,0.35)';
        x.fillRect(c * bw + 2, r * rh + rh - 14 - hh, bw - 5, 6);
      }
    }
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- bento / onigiri wall chiller ---------------- */

  RN.tex.bento = (function () {
    var w = 512, h = 384, o = mk(w, h), x = o.x;
    x.fillStyle = '#eef3f5';
    x.fillRect(0, 0, w, h);
    var rows = 3, rh = h / rows;
    for (var r = 0; r < rows; r++) {
      x.fillStyle = 'rgba(0,0,0,0.10)';
      x.fillRect(0, r * rh + rh - 10, w, 10);
      x.fillStyle = '#cfd6da';
      x.fillRect(0, r * rh + rh - 22, w, 12);
      for (var c = 0; c < 6; c++) {
        var bw = w / 6;
        var t = ['#f6e3b8', '#e8c98d', '#f2d7a0', '#dcc088'][(r + c) % 4];
        x.fillStyle = 'rgba(0,0,0,0.14)';
        x.fillRect(c * bw + 8, r * rh + 14, bw - 20, rh - 46);
        x.fillStyle = t;
        x.fillRect(c * bw + 6, r * rh + 12, bw - 20, rh - 46);
        x.fillStyle = 'rgba(255,255,255,0.85)';
        x.fillRect(c * bw + 6, r * rh + 12, bw - 20, 8);
        x.fillStyle = '#7a9b52';
        x.fillRect(c * bw + 12, r * rh + 30, bw - 32, 8);
      }
    }
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- hanging category signs ---------------- */

  var hangCache = {};
  RN.tex.hanging = function (text, color) {
    var key = text + color;
    if (hangCache[key]) return hangCache[key];
    var w = 512, h = 160, o = mk(w, h), x = o.x;
    x.fillStyle = color || '#1c6f5e';
    roundRect(x, 4, 4, w - 8, h - 8, 14);
    x.fill();
    x.fillStyle = 'rgba(255,255,255,0.92)';
    x.font = '900 84px ' + JP;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(text, w / 2, h / 2 + 4);
    x.textAlign = 'left';
    var t = tex(o.c, { clamp: true });
    hangCache[key] = t;
    return t;
  };

  /* ---------------- traffic sign plate ---------------- */

  RN.tex.streetSign = (function () {
    var w = 512, h = 160, o = mk(w, h), x = o.x;
    x.fillStyle = '#0d3f6b';
    roundRect(x, 6, 6, w - 12, h - 12, 16);
    x.fill();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 6;
    roundRect(x, 18, 18, w - 36, h - 36, 10);
    x.stroke();
    x.fillStyle = '#ffffff';
    x.font = '900 70px ' + JP;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('あまみや 3丁目', w / 2, h / 2);
    x.textAlign = 'left';
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- entrance mat ---------------- */

  RN.tex.mat = (function () {
    var w = 256, h = 128, o = mk(w, h), x = o.x;
    x.fillStyle = '#2f3b3a';
    x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,0.14)';
    x.lineWidth = 3;
    for (var i = 0; i < 26; i++) {
      x.beginPath();
      x.moveTo(0, i * (h / 26));
      x.lineTo(w, i * (h / 26));
      x.stroke();
    }
    x.fillStyle = '#7de3c0';
    x.fillRect(0, 0, w, 8);
    x.fillRect(0, h - 8, w, 8);
    x.fillStyle = 'rgba(255,255,255,0.8)';
    x.font = '900 34px ' + LAT;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('WELCOME', w / 2, h / 2);
    x.textAlign = 'left';
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- nobori banner ---------------- */

  RN.tex.banner = (function () {
    var w = 128, h = 384, o = mk(w, h), x = o.x;
    x.fillStyle = '#f5f7f2';
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#0f8a6d';
    x.fillRect(0, 0, w, 52);
    x.fillStyle = '#ff7a3d';
    x.fillRect(0, h - 40, w, 40);
    x.fillStyle = '#0f8a6d';
    x.font = '900 46px ' + JP;
    x.textAlign = 'center';
    for (var i = 0; i < 5; i++) {
      x.fillText('新', w / 2, 116 + i * 50);
    }
    x.textAlign = 'left';
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- concrete curb / drain grate ---------------- */

  RN.tex.grate = (function () {
    var w = 128, h = 64, o = mk(w, h), x = o.x;
    x.fillStyle = '#3a3f4c';
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#171b24';
    for (var i = 0; i < 8; i++) x.fillRect(6 + i * 15, 6, 9, h - 12);
    x.fillStyle = '#565d6e';
    x.fillRect(0, 0, w, 5);
    x.fillRect(0, h - 5, w, 5);
    return tex(o.c, { repeat: [6, 1] });
  })();

  /* ---------------- alley wall brick ---------------- */

  RN.tex.brick = (function () {
    var w = 256, h = 256, o = mk(w, h), x = o.x;
    x.fillStyle = '#3c3440';
    x.fillRect(0, 0, w, h);
    var bh = 24, bw = 56;
    for (var r = 0; r < h / bh; r++) {
      var off = (r % 2) * (bw / 2);
      for (var c = -1; c < w / bw + 1; c++) {
        var v = 78 + Math.random() * 26;
        x.fillStyle = 'rgb(' + (v | 0) + ',' + ((v - 8) | 0) + ',' + ((v + 4) | 0) + ')';
        x.fillRect(c * bw + off + 1.5, r * bh + 1.5, bw - 3, bh - 3);
      }
    }
    return tex(o.c, { repeat: [3, 3] });
  })();

  /* ---------------- back alley door ---------------- */

  RN.tex.backDoor = (function () {
    var w = 256, h = 512, o = mk(w, h), x = o.x;
    x.fillStyle = '#4b5563';
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#3a434f';
    x.fillRect(0, 0, w, h * 0.42);
    x.fillStyle = 'rgba(180,205,225,0.35)';
    x.fillRect(28, 26, w - 56, h * 0.30);
    x.fillStyle = '#2f3742';
    x.fillRect(0, h * 0.42, w, 10);
    x.fillStyle = '#8b95a3';
    x.fillRect(w - 46, h * 0.55, 16, 90);
    return tex(o.c, { clamp: true });
  })();

  /* ---------------- small text decal helper ---------------- */

  RN.tex.label = function (text, bg, fg, wpx) {
    var w = wpx || 256, h = 96, o = mk(w, h), x = o.x;
    x.fillStyle = bg || '#eef2f0';
    roundRect(x, 2, 2, w - 4, h - 4, 10);
    x.fill();
    x.fillStyle = fg || '#22303a';
    x.font = '900 52px ' + JP;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(text, w / 2, h / 2 + 2);
    x.textAlign = 'left';
    return tex(o.c, { clamp: true });
  };

  /* ---------------- parking paint ---------------- */

  RN.tex.parking = (function () {
    var w = 128, h = 256, o = mk(w, h), x = o.x;
    x.clearRect(0, 0, w, h);
    x.fillStyle = 'rgba(238,242,235,0.82)';
    x.fillRect(0, 0, 14, h);
    x.fillRect(w - 14, 0, 14, h);
    x.fillRect(0, h - 16, w, 16);
    return tex(o.c, { clamp: true });
  })();

  RN.tex.arrow = (function () {
    var w = 128, h = 256, o = mk(w, h), x = o.x;
    x.clearRect(0, 0, w, h);
    x.fillStyle = 'rgba(125,227,192,0.85)';
    x.beginPath();
    x.moveTo(w / 2, 8);
    x.lineTo(w - 14, h * 0.52);
    x.lineTo(w * 0.72, h * 0.52);
    x.lineTo(w * 0.72, h - 10);
    x.lineTo(w * 0.28, h - 10);
    x.lineTo(w * 0.28, h * 0.52);
    x.lineTo(14, h * 0.52);
    x.closePath();
    x.fill();
    return tex(o.c, { clamp: true });
  })();

})(window.RN);
