/* =========================================================================
 * buildings.js — 背景建筑群（NW 街区 + 南侧沿街楼 + SE 街角绿地）
 * 建筑为三渲二盒体 + 立面画布纹理（含亮灯窗 / 雨渍 / 卷帘门 / 店招）
 * ========================================================================= */
(function () {
  'use strict';
  const DIO = window.DIO;
  const C = DIO.C;

  const PPM = 96; // 每米像素

  /* ---------------- 立面纹理（同步绘制 diffuse + emissive） ---------------- */
  function facadeTexture(wm, hm, cfg) {
    const W = Math.round(wm * PPM), H = Math.round(hm * PPM);
    const mapC = DIO.makeCanvas(W, H);
    const emiC = DIO.makeCanvas(W, H);
    const mc = mapC.getContext('2d');
    const ec = emiC.getContext('2d');

    // 墙体
    mc.fillStyle = cfg.wall || '#b9b3a6';
    mc.fillRect(0, 0, W, H);
    ec.fillStyle = '#000';
    ec.fillRect(0, 0, W, H);
    DIO.speckle(mc, W, H, W * H / 900, '40,44,56', 0.06, 0.16, 2);

    const floorH = cfg.floorH || 2.35;
    const groundH = cfg.groundH || 2.6;
    const floors = cfg.floors || Math.max(1, Math.round((hm - groundH) / floorH));

    // 楼层分隔线
    mc.fillStyle = 'rgba(50,54,66,0.35)';
    for (let i = 1; i <= floors; i++) {
      mc.fillRect(0, H - (groundH + i * floorH) * PPM, W, 3);
    }
    mc.fillRect(0, H - groundH * PPM, W, 4);

    const drawWindow = function (x, y, w, h, lit) {
      // 窗框
      mc.fillStyle = 'rgba(35,40,52,0.85)';
      mc.fillRect(x - 3, y - 3, w + 6, h + 6);
      if (lit) {
        const g = mc.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, lit === 'cool' ? '#b8d0f0' : '#ffe2b0');
        g.addColorStop(1, lit === 'cool' ? '#7a94c4' : '#c8985a');
        mc.fillStyle = g;
        mc.fillRect(x, y, w, h);
        ec.fillStyle = lit === 'cool' ? 'rgba(150,180,240,0.85)' : 'rgba(255,205,130,0.9)';
        ec.fillRect(x, y, w, h);
        // 窗格
        mc.fillStyle = 'rgba(35,40,52,0.5)';
        mc.fillRect(x + w / 2 - 1.5, y, 3, h);
        if (DIO.rand() < 0.5) mc.fillRect(x, y + h / 2 - 1.5, w, 3);
      } else {
        const g = mc.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, '#242c3e');
        g.addColorStop(0.55, '#1b2233');
        g.addColorStop(1, '#2a3348');
        mc.fillStyle = g;
        mc.fillRect(x, y, w, h);
        mc.fillStyle = 'rgba(160,190,235,0.14)';
        mc.fillRect(x + 2, y + 2, w - 4, h * 0.3);
      }
      // 雨渍
      if (DIO.rand() < 0.45) {
        mc.fillStyle = 'rgba(30,34,46,0.18)';
        const sx = x + DIO.rand() * w;
        mc.fillRect(sx, y + h, 3, h * (0.4 + DIO.rand() * 0.8));
      }
      // 壁挂空调
      if (DIO.rand() < 0.3) {
        mc.fillStyle = '#8a93a5';
        mc.fillRect(x + w * 0.2, y + h + 5, w * 0.6, 14);
        mc.fillStyle = 'rgba(40,44,56,0.4)';
        mc.fillRect(x + w * 0.2, y + h + 5, w * 0.6, 3);
      }
    };

    const cols = cfg.cols || Math.max(1, Math.round(wm / 1.9));
    const winW = (wm / cols) * 0.52 * PPM;
    const winH = Math.min(floorH * 0.62, 1.35) * PPM;

    for (let f = 0; f < floors; f++) {
      const fy = H - (groundH + f * floorH + floorH * 0.32) * PPM - winH;
      for (let cch = 0; cch < cols; cch++) {
        const fx = ((cch + 0.5) / cols) * W - winW / 2;
        const r = DIO.rand();
        const lit = r < (cfg.litProb || 0.3) ? (DIO.rand() < 0.25 ? 'cool' : 'warm') : null;
        drawWindow(fx, fy, winW, winH, lit);
        // 阳台栏杆（公寓风）
        if (cfg.balcony) {
          mc.fillStyle = 'rgba(60,66,80,0.75)';
          mc.fillRect(fx - 4, fy + winH + 6, winW + 8, 4);
          for (let bx = 0; bx <= 6; bx++) {
            mc.fillRect(fx - 4 + (bx / 6) * (winW + 8), fy + winH + 6, 2, 14);
          }
        }
      }
    }

    /* --- 底层 --- */
    const gY = H - groundH * PPM;
    if (cfg.ground === 'shutters') {
      const n = Math.max(1, Math.round(wm / 2.2));
      for (let i = 0; i < n; i++) {
        const sx = (i / n) * W + 8, sw = W / n - 16;
        // 卷帘门
        const open = DIO.rand() < 0.25;
        if (open) {
          mc.fillStyle = '#1c2231';
          mc.fillRect(sx, gY + 40, sw, groundH * PPM - 60);
          ec.fillStyle = 'rgba(120,140,180,0.35)';
          ec.fillRect(sx + 8, gY + 50, sw - 16, groundH * PPM - 90);
          mc.fillStyle = '#39435a';
          mc.fillRect(sx, gY + 34, sw, 10);
        } else {
          const g2 = mc.createLinearGradient(0, gY, 0, H);
          g2.addColorStop(0, '#7e8798');
          g2.addColorStop(1, '#5d6675');
          mc.fillStyle = g2;
          mc.fillRect(sx, gY + 30, sw, H - gY - 40);
          mc.fillStyle = 'rgba(30,34,46,0.3)';
          for (let ry = gY + 34; ry < H - 12; ry += 9) mc.fillRect(sx, ry, sw, 4);
          mc.fillStyle = 'rgba(120,130,150,0.35)';
          mc.fillRect(sx, gY + 30, sw, 6);
        }
      }
    } else if (cfg.ground === 'shop') {
      // 发光橱窗 + 门 + 招牌带
      const winY = gY + 26, winH2 = groundH * PPM - 70;
      const g2 = mc.createLinearGradient(0, winY, 0, winY + winH2);
      g2.addColorStop(0, '#ffe8c0');
      g2.addColorStop(1, '#d8a86a');
      mc.fillStyle = g2;
      mc.fillRect(10, winY, W - 20, winH2);
      ec.fillStyle = 'rgba(255,205,130,0.85)';
      ec.fillRect(10, winY, W - 20, winH2);
      // 橱窗内容（货架剪影）
      mc.fillStyle = 'rgba(120,80,60,0.5)';
      for (let i = 0; i < 5; i++) {
        mc.fillRect(22 + i * (W - 44) / 5, winY + winH2 * 0.35, (W - 44) / 5 - 10, winH2 * 0.55);
      }
      mc.fillStyle = 'rgba(90,60,45,0.6)';
      mc.fillRect(W * 0.4, winY, W * 0.2, winH2); // 门口暗部
      // 窗框
      mc.strokeStyle = 'rgba(35,40,52,0.9)';
      mc.lineWidth = 5;
      mc.strokeRect(10, winY, W - 20, winH2);
      // 招牌带
      const bandY = gY + 4;
      mc.fillStyle = cfg.shopBand || '#e84c4c';
      mc.fillRect(0, bandY, W, 22);
      ec.fillStyle = cfg.shopBandEmi || 'rgba(255,90,80,0.75)';
      ec.fillRect(0, bandY, W, 22);
      if (cfg.shopName) {
        mc.fillStyle = '#fff';
        mc.font = 'bold 18px ' + DIO.jpFont;
        mc.textAlign = 'center';
        mc.textBaseline = 'middle';
        mc.fillText(cfg.shopName, W / 2, bandY + 11);
      }
    } else {
      // 普通墙 + 门
      mc.fillStyle = 'rgba(50,54,66,0.3)';
      mc.fillRect(0, gY + 2, W, 4);
      const dx = W * 0.4;
      mc.fillStyle = '#39435a';
      mc.fillRect(dx, H - 2.1 * PPM, W * 0.2, 2.1 * PPM);
      drawWindow(W * 0.12, gY + 30, W * 0.2, groundH * PPM - 70, DIO.rand() < 0.5 ? 'warm' : null);
      if (wm > 2.4) drawWindow(W * 0.68, gY + 30, W * 0.2, groundH * PPM - 70, DIO.rand() < 0.4 ? 'warm' : null);
    }

    const map = new THREE.CanvasTexture(mapC);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const emi = new THREE.CanvasTexture(emiC);
    emi.colorSpace = THREE.SRGBColorSpace;
    emi.anisotropy = 4;
    return { map, emi };
  }

  function facadeMat(wm, hm, cfg) {
    const t = facadeTexture(wm, hm, cfg);
    return DIO.toon(0xffffff, {
      map: t.map,
      emissive: 0xffffff,
      emissiveMap: t.emi,
      emissiveIntensity: cfg.emissive == null ? 0.75 : cfg.emissive,
    });
  }

  /* ---------------- 建筑组装 ---------------- */
  function makeBuilding(cfg) {
    const grp = new THREE.Group();
    const w = cfg.w, h = cfg.h, d = cfg.d;
    const simple = DIO.toon(cfg.wallSimple || cfg.wall || 0xa9a49a);
    const roofM = DIO.toon(0x3a4152);
    const front = facadeMat(w, h, cfg);
    const mats = [];
    mats[0] = cfg.faceX ? facadeMat(d, h, cfg.faceX) : simple; // +x
    mats[1] = simple;                                          // -x
    mats[2] = roofM;                                           // +y
    mats[3] = simple;
    mats[4] = front;                                           // +z
    mats[5] = cfg.back ? facadeMat(w, h, cfg.back) : simple;   // -z
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    DIO.outline(body, 0.02);
    body.position.y = h / 2;
    grp.add(body);

    // 女儿墙
    const par = DIO.box(w + 0.14, 0.22, d + 0.14, DIO.toon(cfg.parapet || 0x9a958a), 0.014);
    par.position.y = h + 0.11;
    grp.add(par);

    const rp = cfg.roofProps;
    if (rp) {
      if (rp.tank) {
        const tg = new THREE.Group();
        for (const [lx, lz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) {
          const leg = DIO.cyl(0.03, 0.03, 0.34, DIO.toon(0x545d70), 6, 0);
          leg.position.set(lx, 0.17, lz);
          tg.add(leg);
        }
        const tank = DIO.cyl(0.38, 0.38, 0.72, DIO.toon(0x8fa0ae), 14, 0.014);
        tank.position.y = 0.68;
        tg.add(tank);
        const cap = DIO.cyl(0.4, 0.38, 0.08, DIO.toon(0x6a7488), 14, 0.01);
        cap.position.y = 1.06;
        tg.add(cap);
        tg.position.set(w / 2 - 0.7, h + 0.2, -d / 2 + 0.7);
        grp.add(tg);
      }
      if (rp.antenna) {
        const ant = DIO.cyl(0.02, 0.028, 1.6, DIO.toon(0x545d70), 6, 0);
        ant.position.set(-w / 2 + 0.5, h + 0.9, -d / 2 + 0.5);
        grp.add(ant);
        for (const ay of [0.5, 0.9, 1.3]) {
          const bar = DIO.box(0.5, 0.02, 0.02, DIO.toon(0x545d70), 0);
          bar.position.set(-w / 2 + 0.5, h + 0.2 + ay, -d / 2 + 0.5);
          grp.add(bar);
        }
      }
      if (rp.acs) {
        for (const [ax, az] of rp.acs) {
          const ac = DIO.box(0.55, 0.42, 0.4, DIO.toon(0x9aa5b8), 0.012);
          ac.position.set(ax, h + 0.32, az);
          grp.add(ac);
          const fan = DIO.cyl(0.17, 0.17, 0.03, DIO.toon(0x6a7488), 10, 0);
          fan.position.set(ax, h + 0.55, az);
          grp.add(fan);
        }
      }
      if (rp.vents) {
        for (const [vx, vz, vh] of rp.vents) {
          const vent = DIO.cyl(0.07, 0.07, vh || 0.5, DIO.toon(0x6a7488), 8, 0);
          vent.position.set(vx, h + (vh || 0.5) / 2, vz);
          grp.add(vent);
          const cap = DIO.cyl(0.1, 0.1, 0.04, DIO.toon(0x545d70), 8, 0);
          cap.position.set(vx, h + (vh || 0.5) + 0.02, vz);
          grp.add(cap);
        }
      }
    }
    if (cfg.pos) grp.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    if (cfg.rotY) grp.rotation.y = cfg.rotY;
    return grp;
  }

  /* ---------------- 垂直霓虹招牌 ---------------- */
  function neonVertical(chars, bgColor, fgColor, emissive) {
    const tex = DIO.texture(128, 512, function (ctx, W, H) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = fgColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, W - 12, H - 12);
      ctx.fillStyle = fgColor;
      ctx.font = 'bold 84px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const n = chars.length;
      const step = (H - 40) / n;
      for (let i = 0; i < n; i++) {
        ctx.fillText(chars[i], W / 2, 28 + step * (i + 0.5));
      }
    });
    return DIO.toon(0xffffff, {
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: emissive == null ? 0.9 : emissive,
    });
  }

  /* ---------------- 横向招牌 ---------------- */
  function neonHorizontal(text, bgColor, fgColor, w, h, size) {
    const tex = DIO.texture(512, 128, function (ctx, W, H) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = fgColor;
      ctx.font = 'bold ' + (size || 64) + 'px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, H / 2 + 4);
      ctx.strokeStyle = fgColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(5, 5, W - 10, H - 10);
    });
    return DIO.toon(0xffffff, {
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.95,
    });
  }

  /* ================= NW 街区 ================= */
  function buildNW(scene) {
    // B1：三层杂居楼（南面朝 Road A，卷帘门店铺）
    scene.add(makeBuilding({
      w: 3.1, h: 6.8, d: 8.8,
      pos: [-8.15, 0.18, -5.3],
      wall: '#b9b3a6', wallSimple: 0xa39d90,
      floors: 2, cols: 2, litProb: 0.4, ground: 'shutters', groundH: 2.7,
      roofProps: { tank: true, acs: [[-1.0, 1.6], [0.6, -2.2]], vents: [[1.0, 2.5, 0.6]] },
    }));

    // B2：三层公寓（东面朝 Road B，南面朝巷区）
    scene.add(makeBuilding({
      w: 3.3, h: 8.2, d: 6.1,
      pos: [-3.55, 0.18, -6.65],
      wall: '#9aa3ad', wallSimple: 0x8a93a0,
      faceX: { wall: '#9aa3ad', floors: 2, cols: 3, litProb: 0.42, balcony: true, ground: 'wall', groundH: 2.6 },
      floors: 2, cols: 2, litProb: 0.35, ground: 'wall', groundH: 2.6,
      roofProps: { antenna: true, acs: [[-0.8, 1.8], [0.9, -1.5]], vents: [[0, 2.4, 0.7]] },
    }));

    // B3：路口角楼（东面朝 Road B，南面朝 Road A——店正对面）
    const b3 = makeBuilding({
      w: 3.3, h: 5.4, d: 2.7,
      pos: [-3.55, 0.18, -2.25],
      wall: '#cfc6b4', wallSimple: 0xb5ae9c,
      faceX: { wall: '#cfc6b4', floors: 1, cols: 2, litProb: 0.5, ground: 'shop', groundH: 2.5, shopBand: '#8c3a4a', shopName: '居酒屋 やまだ' },
      floors: 1, cols: 2, litProb: 0.5, ground: 'shutters', groundH: 2.5,
      roofProps: { acs: [[-0.9, 0.5], [0.8, -0.6]], vents: [[0, 0.9, 0.5]] },
    });
    scene.add(b3);

    // B3 屋顶广告牌（青色霓虹）
    const bbTex = neonHorizontal('旭町商店街', '#12233a', '#69d2ff', 3.0, 0.72, 58);
    const bb = DIO.box(3.0, 0.72, 0.14, bbTex, 0.014);
    bb.position.set(-3.55, 6.6, -2.25);
    scene.add(bb);
    for (const lx of [-4.9, -2.2]) {
      const leg = DIO.cyl(0.04, 0.04, 0.9, DIO.toon(0x545d70), 6, 0);
      leg.position.set(lx, 5.75, -2.25);
      scene.add(leg);
    }
    DIO.neonBlue = DIO.flicker({ mats: [bbTex], base: 0.95, wobble: 0.08, freq: 5, prob: 0.5, len: 0.4, depth: 0.3 });

    // B1 南墙红色霓虹（スナック）
    const snTex = neonVertical('スナック華', '#3a1220', '#ff6a7a', 1.0);
    const sn = DIO.box(0.1, 1.7, 0.5, snTex, 0.012);
    sn.position.set(-7.0, 4.2, -0.82);
    scene.add(sn);
    DIO.neonRed = DIO.flicker({ mats: [snTex], base: 1.0, wobble: 0.1, freq: 4, prob: 0.55, len: 0.5, depth: 0.25 });

    // B3 东墙：药妆店绿十字霓虹
    const crossTex = DIO.texture(128, 128, function (ctx, W, H) {
      ctx.fillStyle = '#0f2a1a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#4de08a';
      const bw = 26, bh = 78;
      ctx.fillRect(W / 2 - bw / 2, 10, bw, H - 20);
      ctx.fillRect(18, H / 2 - bw / 2, W - 36, bw);
      ctx.fillStyle = '#c8f4d8';
      ctx.font = 'bold 26px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.fillText('薬', W / 2 + 46, H / 2 - 10);
      ctx.fillText('局', W / 2 + 46, H / 2 + 24);
    });
    const cross = DIO.box(0.08, 0.9, 0.9, DIO.toon(0xffffff, {
      map: crossTex, emissive: 0xffffff, emissiveMap: crossTex, emissiveIntensity: 1.0,
    }), 0.012);
    cross.position.set(-1.82, 3.3, -2.8);
    scene.add(cross);
    DIO.neonGreen = DIO.flicker({ mats: [cross.material], base: 1.0, wobble: 0.06, freq: 11, prob: 0.4, len: 0.3, depth: 0.4 });

    // B3 东面底层的暖光 + 灯笼式门灯
    const doorLamp = new THREE.PointLight(0xffc890, 5, 4.5, 2);
    doorLamp.position.set(-1.6, 2.4, -2.6);
    doorLamp.userData.baseIntensity = 5;
    scene.add(doorLamp);
  }

  /* ================= 巷子细节 ================= */
  function buildAlley(scene) {
    // 巷内壁灯
    const lampBox = DIO.box(0.14, 0.2, 0.1, DIO.toon(0x39435a), 0);
    lampBox.position.set(-6.48, 2.7, -5.0);
    scene.add(lampBox);
    const lampGlow = DIO.box(0.08, 0.1, 0.04, DIO.basic(0xffd9a0), 0);
    lampGlow.position.set(-6.4, 2.68, -5.0);
    scene.add(lampGlow);

    // 垃圾袋
    for (const [bx, bz, s] of [[-6.0, -8.6, 0.3], [-5.5, -8.9, 0.24], [-6.15, -8.2, 0.2]]) {
      const bag = DIO.sphere(s, DIO.toon(0x2c3648), 10, 8, 0);
      bag.scale.set(1, 0.75, 1);
      bag.position.set(bx, 0.18 + s * 0.6, bz);
      scene.add(bag);
    }

    // 巷子上空横越电线
    const wireMat = DIO.toon(0x141824);
    for (const wz of [-3.2, -6.5]) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-6.6, 6.4, wz),
        new THREE.Vector3(-5.9, 6.0, wz),
        new THREE.Vector3(-5.2, 6.5, wz)
      );
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.012, 4), wireMat);
      scene.add(tube);
    }

    // 巷内深处微弱窗光
    const wTex = DIO.texture(64, 64, function (ctx, W, H) {
      ctx.fillStyle = '#ffd9a0';
      ctx.fillRect(0, 0, W, H);
    });
    const win = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.6),
      DIO.basic(0xffd9a0, { transparent: true, opacity: 0.5 })
    );
    win.rotation.y = Math.PI / 2;
    win.position.set(-6.56, 3.4, -7.5);
    scene.add(win);
  }

  /* ================= 南侧沿街楼（朝北，组旋转 180°） ================= */
  function buildSouth(scene) {
    // S1 拉面店
    const s1 = makeBuilding({
      w: 2.7, h: 5.0, d: 3.7,
      pos: [-8.25, 0.18, 7.75], rotY: Math.PI,
      wall: '#8c7460', wallSimple: 0x7a6656,
      floors: 1, cols: 2, litProb: 0.45,
      ground: 'shop', groundH: 2.6, shopBand: '#c8342a', shopName: 'ラーメン 一燈',
      roofProps: { tank: true, vents: [[0.6, 0.6, 0.6]] },
    });
    scene.add(s1);
    // 红色门帘 + 灯笼 ×2
    const noren = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.5),
      DIO.basic(0x2a3a5e, { transparent: true, opacity: 0.95 })
    );
    noren.rotation.y = Math.PI;
    noren.position.set(-8.25, 2.0, 5.85);
    scene.add(noren);
    const lanternMat = DIO.basic(0xffb46a);
    for (const lx of [-9.2, -7.4]) {
      const lan = DIO.sphere(0.22, lanternMat, 12, 10, 0.012);
      lan.scale.set(1, 1.15, 1);
      lan.position.set(lx, 2.8, 5.7);
      scene.add(lan);
      const cap = DIO.cyl(0.1, 0.13, 0.1, DIO.toon(0x39435a), 8, 0);
      cap.position.set(lx, 3.1, 5.7);
      scene.add(cap);
      const str = DIO.cyl(0.008, 0.008, 0.5, DIO.toon(0x2c3345), 4, 0);
      str.position.set(lx, 3.4, 5.7);
      scene.add(str);
    }
    DIO.lanternGlow = new THREE.PointLight(0xff9a50, 6, 6, 2);
    DIO.lanternGlow.position.set(-8.3, 2.8, 6.0);
    DIO.lanternGlow.userData.baseIntensity = 6;
    scene.add(DIO.lanternGlow);

    // S2 公寓
    scene.add(makeBuilding({
      w: 2.7, h: 4.6, d: 3.7,
      pos: [-5.15, 0.18, 7.75], rotY: Math.PI,
      wall: '#b0a89a', wallSimple: 0x9a9284,
      floors: 1, cols: 3, litProb: 0.5, balcony: true,
      ground: 'wall', groundH: 2.3,
      roofProps: { acs: [[-0.8, 0.5]], vents: [[0.8, -0.8, 0.5]] },
    }));

    // S3 书店
    scene.add(makeBuilding({
      w: 2.6, h: 3.6, d: 3.7,
      pos: [-2.05, 0.18, 7.75], rotY: Math.PI,
      wall: '#a8b2c0', wallSimple: 0x929cae,
      floors: 0, cols: 2,
      ground: 'shop', groundH: 2.9, shopBand: '#2a5a8e', shopName: '古書ほんの木',
      roofProps: { acs: [[0.6, 0.4]] },
    }));

    // S4 喫茶店
    const s4 = makeBuilding({
      w: 3.7, h: 4.4, d: 3.7,
      pos: [1.6, 0.18, 7.75], rotY: Math.PI,
      wall: '#c0b8a8', wallSimple: 0xa8a094,
      floors: 0, cols: 3,
      ground: 'shop', groundH: 3.2, shopBand: '#1a4a3a', shopName: '喫茶ルポ',
      roofProps: { antenna: true, vents: [[-0.9, 0.6, 0.6]] },
    });
    scene.add(s4);
    // 喫茶店青色霓虹字
    const kissaTex = neonVertical('喫茶', '#0f2230', '#69d2ff', 1.1);
    const kissa = DIO.box(0.1, 1.3, 0.5, kissaTex, 0.012);
    kissa.position.set(3.3, 2.6, 5.82);
    scene.add(kissa);
    DIO.neonCyan = DIO.flicker({ mats: [kissaTex], base: 1.0, wobble: 0.07, freq: 8, prob: 0.45, len: 0.35, depth: 0.3 });

    // S4 壁挂暖光
    const s4Light = new THREE.PointLight(0xffd9a0, 4, 4, 2);
    s4Light.position.set(1.6, 1.6, 5.9);
    s4Light.userData.baseIntensity = 4;
    scene.add(s4Light);
  }

  /* ================= SE 街角绿地 ================= */
  function buildSE(scene) {
    const leafMat = DIO.toon(C.treeLeaf);
    const leafMat2 = DIO.toon(C.treeLeaf2);
    const trunkMat = DIO.toon(0x5a4638);

    function tree(x, z, s) {
      const tg = new THREE.Group();
      const trunk = DIO.cyl(0.09 * s, 0.13 * s, 1.7 * s, trunkMat, 8, 0.012);
      trunk.position.y = 0.85 * s;
      tg.add(trunk);
      const blobs = [
        [0, 1.9 * s, 0, 0.95 * s], [0.5 * s, 1.55 * s, 0.25 * s, 0.6 * s],
        [-0.45 * s, 1.6 * s, -0.2 * s, 0.62 * s], [0.1 * s, 2.35 * s, -0.15 * s, 0.55 * s],
      ];
      for (let i = 0; i < blobs.length; i++) {
        const b = DIO.sphere(blobs[i][3], i % 2 ? leafMat2 : leafMat, 12, 10, 0.014);
        b.position.set(blobs[i][0], blobs[i][1], blobs[i][2]);
        b.scale.y = 0.85;
        tg.add(b);
      }
      tg.position.set(x, 0.18, z);
      tg.rotation.y = DIO.rand() * Math.PI;
      scene.add(tg);
    }
    tree(7.6, 6.8, 1.0);
    tree(5.6, 8.6, 0.8);

    // 树池
    for (const [tx, tz] of [[7.6, 6.8], [5.6, 8.6]]) {
      const pit = DIO.cyl(0.5, 0.5, 0.1, DIO.toon(0x707a90), 12, 0);
      pit.position.set(tx, 0.22, tz);
      scene.add(pit);
    }

    // 树篱
    const hedgeMat = DIO.toon(0x3a5c42);
    for (let i = 0; i < 9; i++) {
      const h = DIO.sphere(0.3, hedgeMat, 8, 6, 0.01);
      h.scale.set(1, 0.8, 1);
      h.position.set(4.6 + i * 0.58, 0.42, 9.55);
      scene.add(h);
    }
    for (let i = 0; i < 5; i++) {
      const h = DIO.sphere(0.28, hedgeMat, 8, 6, 0.01);
      h.scale.set(1, 0.8, 1);
      h.position.set(9.55, 0.42, 8.9 - i * 0.55);
      scene.add(h);
    }

    // 长椅
    const bench = new THREE.Group();
    const seat = DIO.box(1.2, 0.06, 0.36, DIO.toon(C.wood), 0.012);
    seat.position.y = 0.42;
    bench.add(seat);
    const back = DIO.box(1.2, 0.3, 0.05, DIO.toon(C.wood), 0.012);
    back.position.set(0, 0.62, -0.17);
    bench.add(back);
    for (const lx of [-0.5, 0.5]) {
      const leg = DIO.box(0.06, 0.42, 0.3, DIO.toon(0x39435a), 0);
      leg.position.set(lx, 0.21, 0);
      bench.add(leg);
    }
    bench.position.set(6.6, 0.18, 5.6);
    bench.rotation.y = 0.4;
    scene.add(bench);

    // 低栅栏（沿街角）
    const fenceMat = DIO.toon(0x6a7488);
    for (let i = 0; i < 8; i++) {
      const post = DIO.cyl(0.025, 0.025, 0.55, fenceMat, 6, 0);
      post.position.set(4.5 + i * 0.72, 0.45, 5.35);
      scene.add(post);
    }
    const rail1 = DIO.box(5.2, 0.04, 0.04, fenceMat, 0);
    rail1.position.set(7.0, 0.66, 5.35);
    scene.add(rail1);
    const rail2 = DIO.box(5.2, 0.04, 0.04, fenceMat, 0);
    rail2.position.set(7.0, 0.42, 5.35);
    scene.add(rail2);
  }

  DIO.builders.push(function (scene) {
    buildNW(scene);
    buildAlley(scene);
    buildSouth(scene);
    buildSE(scene);
  });
})();
