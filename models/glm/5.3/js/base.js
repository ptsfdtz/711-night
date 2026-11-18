/* =========================================================================
 * base.js — 收藏底座 / L 形街角道路 / 人行道 / 缘石 / 盲道 / 排水沟 / 水洼
 * 坐标系：底座 20×20（-10..10），+x 东，+z 南，道路顶面 y=0.03，人行道 y=0.18
 *   Road A(东西路): z∈[0,5], x∈[-10,4]     Road B(南北路): x∈[-1,4], z∈[-10,0]
 *   NW block: x[-10,-1] z[-10,0]  NE block: x[4,10] z[-10,0]
 *   S  block: x[-10,4] z[5,10]    SE block: x[4,10] z[5,10]
 * ========================================================================= */
(function () {
  'use strict';
  const DIO = window.DIO;
  const C = DIO.C;

  const CURB = 0.18;   // 人行道面高
  const ROAD_Y = 0.03; // 路面高
  DIO.storeBounds = { x0: 4.8, x1: 9.9, z0: -5.6, z1: -0.8 };

  /* ---------------- 底座（收藏模型台） ---------------- */
  function buildPlinth(scene) {
    const matA = DIO.toon(0x232a3d);
    const matB = DIO.toon(0x1a2031);

    const plateA = DIO.box(20.0, 0.72, 20.0, matA, 0.02);
    plateA.position.y = -0.36;
    scene.add(plateA);

    const plateB = DIO.box(20.6, 0.3, 20.6, matB, 0.02);
    plateB.position.y = -0.87;
    scene.add(plateB);

    // 铭牌（底座南侧）
    const plaqueTex = DIO.texture(1024, 192, function (ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#8f8464');
      g.addColorStop(0.5, '#6e6450');
      g.addColorStop(1, '#8f8464');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      DIO.speckle(ctx, w, h, 500, '40,36,26', 0.02, 0.09, 2);
      ctx.strokeStyle = 'rgba(40,34,22,0.8)';
      ctx.lineWidth = 5;
      ctx.strokeRect(9, 9, w - 18, h - 18);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2e2a1e';
      ctx.font = 'bold 74px ' + DIO.jpFont;
      ctx.fillText('雨 夜 の 街 角', w / 2, h * 0.4);
      ctx.font = '30px ' + 'Consolas, monospace';
      ctx.fillText('RAINY NIGHT CORNER  ·  MINIMART 24  ·  1:64', w / 2, h * 0.75);
    });
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 0.58),
      new THREE.MeshBasicMaterial({ map: plaqueTex })
    );
    plaque.position.set(0, -0.34, 10.005);
    scene.add(plaque);
  }

  /* ---------------- 通用绘制小工具（以“米”为单位作图） ---------------- */
  function mkPainter(ctx, W, H, mw, mh) {
    const sx = W / mw, sy = H / mh;
    return {
      W, H,
      fill: function (style) { ctx.fillStyle = style; ctx.fillRect(0, 0, W, H); },
      rect: function (x, z, w, h, style, alpha) {
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.fillStyle = style;
        ctx.fillRect(x * sx, z * sy, w * sx, h * sy);
        ctx.globalAlpha = 1;
      },
      line: function (x0, z0, x1, z1, width, style, alpha) {
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.strokeStyle = style;
        ctx.lineWidth = width * ((sx + sy) / 2);
        ctx.beginPath();
        ctx.moveTo(x0 * sx, z0 * sy);
        ctx.lineTo(x1 * sx, z1 * sy);
        ctx.stroke();
        ctx.globalAlpha = 1;
      },
      circle: function (x, z, r, style, alpha) {
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.fillStyle = style;
        ctx.beginPath();
        ctx.arc(x * sx, z * sy, r * sx, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      },
      text: function (str, x, z, sizePx, style, rot) {
        ctx.save();
        ctx.translate(x * sx, z * sy);
        if (rot) ctx.rotate(rot);
        ctx.fillStyle = style;
        ctx.font = 'bold ' + sizePx + 'px ' + DIO.jpFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(str, 0, 0);
        ctx.restore();
      },
      speck: function (n, color, a0, a1, s) { DIO.speckle(ctx, W, H, n, color, a0, a1, s); },
      blob: function (x, z, r, color, alpha) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        const n = 10;
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2;
          const rr = r * (0.6 + 0.4 * DIO.rand());
          const px = x * sx + Math.cos(a) * rr * sx;
          const pz = z * sy + Math.sin(a) * rr * sy;
          if (i === 0) ctx.moveTo(px, pz); else ctx.lineTo(px, pz);
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      },
    };
  }

  /* 沥青基底 */
  function paintAsphalt(p, mw, mh, dark) {
    p.fill(dark ? '#232937' : '#272e3f');
    p.speck(2400, '18,22,34', 0.25, 0.55, 2);   // 深色颗粒
    p.speck(1400, '62,72,94', 0.08, 0.2, 2);    // 浅色颗粒
    // 湿痕大面
    for (let i = 0; i < 8; i++) {
      p.blob(DIO.range(0, mw), DIO.range(0, mh), DIO.range(0.4, 1.4), '#1e2433', 0.16);
    }
    for (let i = 0; i < 6; i++) {
      p.blob(DIO.range(0, mw), DIO.range(0, mh), DIO.range(0.3, 0.9), '#333c52', 0.10);
    }
  }

  /* 人行道基底 */
  function paintWalk(p, mw, mh, opts) {
    opts = opts || {};
    p.fill(opts.base || '#59647a');
    p.speck(1800, '34,40,54', 0.1, 0.3, 2);
    p.speck(900, '110,122,146', 0.05, 0.14, 2);
    // 0.5m 分格缝
    for (let x = 0.5; x < mw; x += 0.5) {
      p.line(x, 0, x, mh, 0.02, 'rgba(28,33,46,0.55)');
    }
    for (let z = 0.5; z < mh; z += 0.5) {
      p.line(0, z, mw, z, 0.02, 'rgba(28,33,46,0.55)');
    }
    // 污渍
    for (let i = 0; i < 7; i++) {
      p.blob(DIO.range(0, mw), DIO.range(0, mh), DIO.range(0.2, 0.7), '#3c465a', 0.12);
    }
  }

  /* 盲道（黄色导盲砖） */
  function paintTactileStrip(p, x, z, w, h, dir) {
    p.rect(x, z, w, h, '#c99b3f');
    const step = 0.14;
    if (dir === 'x') {
      for (let zz = z + 0.07; zz < z + h - 0.02; zz += step) {
        p.line(x + 0.05, zz, x + w - 0.05, zz, 0.035, 'rgba(140,104,40,0.9)');
      }
    } else {
      for (let xx = x + 0.07; xx < x + w - 0.02; xx += step) {
        p.line(xx, z + 0.05, xx, z + h - 0.05, 0.035, 'rgba(140,104,40,0.9)');
      }
    }
    // 磨损
    p.rect(x, z, w, h, '#2c3448', 0.06);
  }

  /* 斑马线 */
  function paintCrosswalkX(p, x0, x1, z0, z1) {
    // 条带沿路方向（x 向）铺开，横跨 z
    const barW = 0.45, gap = 0.34;
    for (let x = x0; x + barW <= x1; x += barW + gap) {
      for (let i = 0; i < 3; i++) {
        p.rect(x, z0 + (z1 - z0) * (i / 3), barW, (z1 - z0) / 3, '#dfe5ef', 0.82 - 0.2 * DIO.rand());
      }
    }
    p.rect(x0, z0, x1 - x0, z1 - z0, '#1c2233', 0.10); // 湿痕覆盖
  }

  function buildRoads(scene) {
    /* Road A（东西路 14×5，含路口） */
    const texA = DIO.texture(2100, 760, function (ctx, W, H) {
      const p = mkPainter(ctx, W, H, 14, 5.2);
      paintAsphalt(p, 14, 5.2);
      // 车辙暗带（沿 x）
      p.rect(0, 1.3, 14, 0.5, '#1f2534', 0.28);
      p.rect(0, 3.3, 14, 0.5, '#1f2534', 0.28);
      // 中心虚线（z=2.6）
      for (let x = 0.2; x < 13.5; x += 1.35) {
        if (x > 11.7) break; // 路口内不画
        p.rect(x, 2.53, 0.75, 0.13, '#c9d2e2', 0.85);
      }
      // 边线
      p.rect(0, 0.3, 14, 0.1, '#aeb9cf', 0.5);
      p.rect(0, 4.8, 14, 0.1, '#aeb9cf', 0.5);
      // 斑马线（x -4.7..-1.2）
      paintCrosswalkX(p, -4.7 + 10, -1.2 + 10, 0.55, 4.65);
      // 停止线 + 止まれ（东侧进口）
      p.rect(-1.75 + 10, 0.55, 0.3, 4.1, '#d7dfec', 0.85);
      p.text('止まれ', -0.4 + 10, 2.0, 120, 'rgba(225,232,244,0.92)');
      p.text('止まれ', -0.4 + 10, 4.1, 120, 'rgba(225,232,244,0.92)');
      // 直行+左转箭头（西侧车道）
      ctx.save();
      ctx.translate((-7.6 + 10) * (W / 14), 3.5 * (H / 5.2));
      ctx.scale(1, 0.6);
      p.text('↑⬅', 0, 0, 150, 'rgba(210,220,238,0.8)');
      ctx.restore();
      // 井盖
      p.circle(-7.9 + 10, 1.4, 0.42, '#39435a', 0.9);
      p.circle(-7.9 + 10, 1.4, 0.34, '#2c3548', 0.9);
      // 补丁
      p.rect(2 + 10, 1.1, 1.4, 1.0, '#222839', 0.5);
      p.rect(-6 + 10, 3.6, 1.0, 0.8, '#2c3446', 0.4);
    });
    const matTopA = DIO.toon(0xffffff, { map: texA, emissive: 0xbfd2ff, emissiveMap: texA, emissiveIntensity: 0.07 });
    const matSide = DIO.toon(0x232937);
    const roadA = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.03, 5),
      [matSide, matSide, matTopA, matSide, matSide, matSide]
    );
    roadA.position.set(-3, ROAD_Y / 2, 2.5);
    scene.add(roadA);
    DIO.outline(roadA, 0.014);

    /* Road B（南北路 5×10） */
    const texB = DIO.texture(760, 1520, function (ctx, W, H) {
      const p = mkPainter(ctx, W, H, 5.2, 10);
      paintAsphalt(p, 5.2, 10);
      p.rect(1.3, 0, 0.5, 10, '#1f2534', 0.28);
      p.rect(3.3, 0, 0.5, 10, '#1f2534', 0.28);
      // 中心虚线（x=2.5 局部坐标；世界 x=1.5）
      for (let z = 0.3; z < 9.4; z += 1.35) {
        if (z > 8.5) break;
        p.rect(2.44, z, 0.13, 0.75, '#c9d2e2', 0.85);
      }
      p.rect(0.3, 0, 0.1, 10, '#aeb9cf', 0.5);
      p.rect(4.8, 0, 0.1, 10, '#aeb9cf', 0.5);
      // 斑马线（世界 z -4.7..-1.2 → 局部 z 5.3..8.8），条带沿 z 向
      const barW = 0.45, gap = 0.34;
      for (let z = 5.3; z + barW <= 8.85; z += barW + gap) {
        for (let i = 0; i < 3; i++) {
          p.rect(0.55 + (4.45 - 0.55) * (i / 3), z, (4.45 - 0.55) / 3, barW, '#dfe5ef', 0.82 - 0.2 * DIO.rand());
        }
      }
      p.rect(0.55, 5.3, 3.9, 3.55, '#1c2233', 0.10);
      // 停止线（南向进口，靠近路口）
      p.rect(0.55, 8.6, 3.9, 0.3, '#d7dfec', 0.85);
      p.text('止まれ', 1.4, 9.3, 110, 'rgba(225,232,244,0.9)');
      p.text('止まれ', 3.6, 9.3, 110, 'rgba(225,232,244,0.9)');
      // 箭头
      ctx.save();
      ctx.translate(2.5 * (W / 5.2), 6.5 * (H / 10));
      p.text('↑➡', 0, 0, 130, 'rgba(210,220,238,0.8)');
      ctx.restore();
      // 井盖
      p.circle(1.5, 3.2, 0.42, '#39435a', 0.9);
      p.circle(1.5, 3.2, 0.34, '#2c3548', 0.9);
    });
    const matTopB = DIO.toon(0xffffff, { map: texB, emissive: 0xbfd2ff, emissiveMap: texB, emissiveIntensity: 0.07 });
    const roadB = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.03, 10),
      [matSide, matSide, matTopB, matSide, matSide, matSide]
    );
    roadB.position.set(1.5, ROAD_Y / 2, -5);
    scene.add(roadB);
    DIO.outline(roadB, 0.014);
  }

  /* ---------------- 人行道 block（盒体顶面为纹理，侧面即缘石） ---------------- */
  function block(scene, x0, x1, z0, z1, texW, texH, paint) {
    const w = x1 - x0, d = z1 - z0;
    const tex = DIO.texture(texW, texH, function (ctx, W, H) {
      const p = mkPainter(ctx, W, H, w, d);
      paint(p, w, d);
    });
    const matTop = DIO.toon(0xffffff, { map: tex, emissive: 0x8899cc, emissiveMap: tex, emissiveIntensity: 0.045 });
    const matSide = DIO.toon(0x707a90);
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, CURB, d),
      [matSide, matSide, matTop, matSide, matSide, matSide]
    );
    m.position.set((x0 + x1) / 2, CURB / 2, (z0 + z1) / 2);
    scene.add(m);
    DIO.outline(m, 0.016);
    return m;
  }

  function buildWalks(scene) {
    /* NW block: x[-10,-1] z[-10,0] —— 沿东/南缘有盲道 */
    block(scene, -10, -1, -10, 0, 1080, 1200, function (p, w, d) {
      paintWalk(p, w, d, { base: '#59647a' });
      // 南缘（面向 Road A）斑马线处盲道
      paintTactileStrip(p, 4.9, 9.12, 3.9, 0.7, 'x');
      // 东缘（面向 Road B）斑马线处盲道
      paintTactileStrip(p, 8.18, 4.8, 0.7, 3.9, 'z');
      // 污水口污渍
      p.blob(9.0, 9.1, 0.4, '#2c3346', 0.35);
    });

    /* NE block: x[4,10] z[-10,0] —— 店铺所在街区 */
    block(scene, 4, 10, -10, 0, 720, 1200, function (p, w, d) {
      paintWalk(p, w, d, { base: '#5d687e' });
      // 西缘盲道（沿 Road B 斑马线）
      paintTactileStrip(p, 0.18, 4.8, 0.7, 3.9, 'z');
      // 南缘 + 通往店门的 L 形盲道
      paintTactileStrip(p, 0.8, 9.12, 2.6, 0.7, 'x');
      paintTactileStrip(p, 1.9, 7.2, 0.7, 2.6, 'z');
      // 店门前污渍
      p.blob(3.0, 8.8, 0.5, '#3c465a', 0.2);
    });

    /* S block: x[-10,4] z[5,10] */
    block(scene, -10, 4, 5, 10, 1680, 620, function (p, w, d) {
      paintWalk(p, w, d, { base: '#545f75' });
      // 北缘斑马线处盲道
      paintTactileStrip(p, 4.9, 0.18, 3.9, 0.7, 'x');
      p.blob(12.5, 1.0, 0.5, '#2c3346', 0.3);
    });

    /* SE block: x[4,10] z[5,10] —— 小广场铺装 */
    block(scene, 4, 10, 5, 10, 720, 620, function (p, w, d) {
      p.fill('#4c5870');
      p.speck(1500, '30,36,50', 0.12, 0.3, 2);
      // 大方砖
      for (let x = 0; x < w; x += 0.9) p.line(x, 0, x, d, 0.025, 'rgba(24,28,40,0.5)');
      for (let z = 0; z < d; z += 0.9) p.line(0, z, w, z, 0.025, 'rgba(24,28,40,0.5)');
      p.blob(3.2, 2.1, 0.5, '#39445c', 0.25);
      // 北缘盲道
      paintTactileStrip(p, 0.18, 0.18, 5.6, 0.7, 'x');
    });
  }

  /* ---------------- 停车场（东北街区后部贴面） ---------------- */
  function buildParking(scene) {
    const tex = DIO.texture(760, 560, function (ctx, W, H) {
      const p = mkPainter(ctx, W, H, 5.35, 3.8);
      paintAsphalt(p, 5.35, 3.8, true);
      // 两个车位
      p.line(0.15, 0.3, 3.5, 0.3, 0.1, 'rgba(215,224,238,0.75)');
      p.line(0.15, 1.9, 3.5, 1.9, 0.1, 'rgba(215,224,238,0.75)');
      p.line(0.15, 3.5, 3.5, 3.5, 0.1, 'rgba(215,224,238,0.75)');
      p.line(0.15, 0.3, 0.15, 3.5, 0.1, 'rgba(215,224,238,0.75)');
      p.line(3.5, 0.3, 3.5, 3.5, 0.1, 'rgba(215,224,238,0.75)');
      p.line(1.6, 1.9, 1.6, 3.5, 0.08, 'rgba(215,224,238,0.55)');
      p.blob(2.5, 1.0, 0.5, '#1a1f2d', 0.3);
    });
    const lot = DIO.decal(5.35, 3.8, tex, { polygonOffsetFactor: -3 });
    lot.rotation.x = -Math.PI / 2;
    lot.position.set(7.2, CURB + 0.004, -7.5);
    scene.add(lot);

    // 车道坡道（从 Road B 进入）
    const rampTex = DIO.texture(300, 420, function (ctx, W, H) {
      paintAsphalt(mkPainter(ctx, W, H, 0.8, 1.6), 0.8, 1.6, true);
      ctx.fillStyle = 'rgba(215,224,238,0.5)';
      ctx.fillRect(10, 10, 12, H - 20);
      ctx.fillRect(W - 22, 10, 12, H - 20);
    });
    const ramp = DIO.box(0.8, 0.03, 1.6, DIO.toon(0xffffff, { map: rampTex }), 0.008);
    ramp.rotation.z = Math.atan2(CURB - ROAD_Y, 0.8);
    ramp.position.set(4.42, (CURB + ROAD_Y) / 2, -8.0);
    scene.add(ramp);
  }

  /* ---------------- 巷子地面（NW block 内） ---------------- */
  function buildAlleyFloor(scene) {
    const tex = DIO.texture(240, 800, function (ctx, W, H) {
      const p = mkPainter(ctx, W, H, 1.4, 10);
      p.fill('#2b2f3e');
      p.speck(900, '16,20,30', 0.3, 0.6, 2);
      // 中央排水沟
      p.rect(0.6, 0, 0.2, 10, '#171b28', 1);
      p.rect(0.66, 0, 0.08, 10, '#20242f', 0.8);
      // 湿痕
      for (let i = 0; i < 5; i++) p.blob(0.7, DIO.range(0, 10), 0.25, '#1b2030', 0.4);
    });
    const f = DIO.decal(1.4, 9.4, tex, { polygonOffsetFactor: -3 });
    f.rotation.x = -Math.PI / 2;
    f.position.set(-5.9, CURB + 0.004, -5.2);
    scene.add(f);
  }

  /* ---------------- 排水沟篦子 ---------------- */
  function buildDrains(scene) {
    const grateTex = DIO.texture(160, 160, function (ctx, W, H) {
      ctx.fillStyle = '#151a26';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#3c4456';
      for (let i = 8; i < W - 6; i += 14) {
        ctx.fillRect(i, 6, 7, H - 12);
      }
      ctx.strokeStyle = '#2c3345';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, W - 6, H - 6);
    });
    const spots = [
      [4.55, -0.35, 0.5, 0.42, 0],      // NE 街区南缘（路口角）
      [-0.85, 0.6, 0.42, 0.5, 0],       // NW 街区东缘（路口角）
      [-4.15, 0.35, 0.5, 0.4, 0],       // Road A 斑马线端
      [-0.75, -1.55, 0.42, 0.5, 0],     // Road B 斑马线端
      [4.55, -7.0, 0.5, 0.5, 0],        // 停车场坡道旁
    ];
    for (const s of spots) {
      const g = DIO.decal(s[2], s[3], grateTex, {});
      g.rotation.x = -Math.PI / 2;
      g.position.set(s[0], ROAD_Y + 0.004, s[1]);
      scene.add(g);
    }
  }

  /* ---------------- 水洼（涟漪 + 灯光倒影着色器） ---------------- */
  const puddleUniforms = [];
  function makePuddle(scene, x, z, w, h, lights) {
    // lights: [{x, y, color, str, len, sig}]  uv 坐标（0..1，相对水洼）
    const alphaTex = DIO.texture(256, 256, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const n = 22;
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = 0.42 + 0.1 * Math.sin(a * 3.7) + 0.07 * Math.sin(a * 7.3 + 2);
        const px = W / 2 + Math.cos(a) * rr * W;
        const py = H / 2 + Math.sin(a) * rr * H;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // 边缘羽化
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(W / 2, H / 2, W * 0.32, W / 2, H / 2, W * 0.5);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });

    const LP = [], LC = [], LS = [], LL = [], LG = [];
    for (const L of lights) {
      LP.push(new THREE.Vector2(L.x, L.y));
      LC.push(new THREE.Color(L.color));
      LS.push(L.str == null ? 1 : L.str);
      LL.push(L.len == null ? 0.5 : L.len);
      LG.push(L.sig == null ? 0.16 : L.sig);
    }
    while (LP.length < 4) { LP.push(new THREE.Vector2(9, 9)); LC.push(new THREE.Color(0)); LS.push(0); LL.push(0.1); LG.push(0.1); }

    const uni = {
      uTime: { value: 0 },
      uMap: { value: alphaTex },
      uBase: { value: new THREE.Color(0x141c2e) },
      uSky: { value: new THREE.Color(0x27344e) },
      uLightPos: { value: LP },
      uLightColor: { value: LC },
      uLightStr: { value: LS },
      uLightLen: { value: LL },
      uLightSig: { value: LG },
      uRipple: {
        value: [
          new THREE.Vector2(0.3, 0.4), new THREE.Vector2(0.7, 0.6),
          new THREE.Vector2(0.5, 0.25), new THREE.Vector2(0.15, 0.7),
        ],
      },
      uRippleOff: { value: [0.1, 0.45, 0.8, 0.25] },
    };
    puddleUniforms.push(uni);

    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -5,
      vertexShader: [
        'varying vec2 vUv;',
        'void main(){',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform sampler2D uMap;',
        'uniform vec3 uBase;',
        'uniform vec3 uSky;',
        'uniform vec2 uLightPos[4];',
        'uniform vec3 uLightColor[4];',
        'uniform float uLightStr[4];',
        'uniform float uLightLen[4];',
        'uniform float uLightSig[4];',
        'uniform vec2 uRipple[4];',
        'uniform float uRippleOff[4];',
        'varying vec2 vUv;',
        'void main(){',
        '  vec4 a = texture2D(uMap, vUv);',
        '  float alpha = a.r;',
        '  vec2 p = vUv;',
        '  // 基色：天空 + 深水混合（中心更深）',
        '  float d = distance(p, vec2(0.5));',
        '  vec3 col = mix(uSky, uBase, smoothstep(0.1, 0.55, d));',
        '  // 涟漪',
        '  float rip = 0.0;',
        '  for (int i = 0; i < 4; i++) {',
        '    float ph = fract(uTime * 0.5 + uRippleOff[i]);',
        '    float dr = distance(p, uRipple[i]);',
        '    float ring = smoothstep(0.05, 0.0, abs(dr - ph * 0.55)) * (1.0 - ph);',
        '    rip += ring * 0.35;',
        '  }',
        '  // 灯光倒影拉丝',
        '  for (int j = 0; j < 4; j++) {',
        '    if (uLightStr[j] < 0.01) continue;',
        '    vec2 rel = p - uLightPos[j];',
        '    vec2 dir = normalize(vec2(0.5) - uLightPos[j] + vec2(1e-5));',
        '    float aDist = dot(rel, dir);',
        '    float bDist = dot(rel, vec2(-dir.y, dir.x));',
        '    float wob = sin(aDist * 30.0 + uTime * 2.2 + bDist * 18.0) * 0.02;',
        '    float streak = exp(-pow((bDist + wob) / uLightSig[j], 2.0));',
        '    streak *= smoothstep(0.0, 0.06, aDist) * smoothstep(uLightLen[j], uLightLen[j] * 0.25, aDist);',
        '    col += uLightColor[j] * streak * uLightStr[j] * (0.85 + rip * 1.6);',
        '  }',
        '  col += vec3(0.5, 0.65, 0.9) * rip * 0.35;',
        '  gl_FragColor = vec4(col, alpha * 0.95);',
        '}',
      ].join('\n'),
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, ROAD_Y + 0.012, z);
    m.renderOrder = 4;
    scene.add(m);
    return m;
  }

  function buildPuddles(scene) {
    DIO.animate(function (t) {
      for (const u of puddleUniforms) u.uTime.value = t;
    });

    // 路口中央（大）：映出便利店暖光 + 路灯冷光 + 招牌橙
    makePuddle(scene, 1.9, 2.6, 2.3, 1.7, [
      { x: -0.5, y: 0.9, color: 0xffca8a, str: 0.85, len: 1.0, sig: 0.13 },
      { x: 0.75, y: 0.25, color: 0x9fc4ff, str: 0.7, len: 0.75, sig: 0.1 },
      { x: 0.35, y: 0.85, color: 0xff9a4d, str: 0.4, len: 0.6, sig: 0.12 },
    ]);
    // Road A 斑马线前
    makePuddle(scene, -3.1, 1.3, 1.5, 1.0, [
      { x: 0.7, y: 0.3, color: 0xbcd4ff, str: 0.6, len: 0.7, sig: 0.12 },
      { x: 0.25, y: 0.75, color: 0xffca8a, str: 0.35, len: 0.5, sig: 0.12 },
    ]);
    // 自动贩卖机前（巷口）
    makePuddle(scene, -5.8, 1.5, 1.3, 0.9, [
      { x: 0.3, y: 0.3, color: 0xff8a7a, str: 0.6, len: 0.6, sig: 0.1 },
      { x: 0.72, y: 0.6, color: 0x6fd2ff, str: 0.55, len: 0.55, sig: 0.1 },
    ]);
    // Road B 中段
    makePuddle(scene, 1.4, -6.6, 1.4, 1.1, [
      { x: 0.5, y: 0.4, color: 0x9fc4ff, str: 0.5, len: 0.6, sig: 0.11 },
    ]);
    // 停车场入口
    makePuddle(scene, 4.3, -6.4, 1.1, 0.9, [
      { x: 0.45, y: 0.5, color: 0x8fb8e8, str: 0.4, len: 0.5, sig: 0.12 },
    ]);
    // 巷口内
    makePuddle(scene, -5.9, -1.8, 0.8, 1.3, [
      { x: 0.5, y: 0.25, color: 0xff8a7a, str: 0.45, len: 0.5, sig: 0.1 },
    ]);
  }

  DIO.builders.push(function (scene) {
    buildPlinth(scene);
    buildRoads(scene);
    buildWalks(scene);
    buildParking(scene);
    buildAlleyFloor(scene);
    buildDrains(scene);
    buildPuddles(scene);
  });
})();
