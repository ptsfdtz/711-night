/* =========================================================================
 * props.js — 街具：贩卖机 / 电线杆+电线 / 路灯 / 信号灯 / 护栏 / 公告栏 /
 *             自行车 / 轻货车 / 店后设备
 * ========================================================================= */
(function () {
  'use strict';
  const DIO = window.DIO;
  const C = DIO.C;

  const WALK = 0.18; // 人行道面高

  /* ---------------- 管件辅助 ---------------- */
  function tube(a, b, r, mat, outlineT) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = DIO.cyl(r, r, len, mat, 8, outlineT);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return m;
  }

  function wire(a, b, sag) {
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return new THREE.Mesh(
      new THREE.TubeGeometry(curve, 16, 0.013, 4),
      DIO.toon(0x141a26)
    );
  }

  /* ================= 自动贩卖机 ================= */
  function vendingMachine(x, z, bodyColor, accent, label, seed) {
    const g = new THREE.Group();
    g.position.set(x, WALK, z);

    const frontTex = DIO.texture(256, 512, function (ctx, W, H) {
      // 顶部招牌带
      ctx.fillStyle = '#' + accent;
      ctx.fillRect(0, 0, W, 74);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.fillText(label, W / 2, 48);
      // 陈列窗
      const grd = ctx.createLinearGradient(0, 74, 0, 330);
      grd.addColorStop(0, '#2c3e58');
      grd.addColorStop(1, '#1c2a40');
      ctx.fillStyle = grd;
      ctx.fillRect(12, 84, W - 24, 246);
      for (let r = 0; r < 4; r++) {
        for (let cch = 0; cch < 4; cch++) {
          const bx = 24 + cch * 56, by = 96 + r * 58;
          ctx.fillStyle = '#111823';
          ctx.fillRect(bx - 3, by - 3, 46, 52);
          const cols = ['#e8785a', '#e8b04c', '#5cb87c', '#5c9ce8', '#d8d2f0'];
          const col = cols[(seed + r * 4 + cch) % cols.length];
          ctx.fillStyle = col;
          ctx.fillRect(bx, by, 40, 46);
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          ctx.fillRect(bx + 5, by + 5, 30, 12);
        }
      }
      // 价格条
      ctx.fillStyle = '#dce4f0';
      ctx.fillRect(12, 336, W - 24, 26);
      // 取物口
      ctx.fillStyle = '#1a222e';
      ctx.fillRect(18, 380, W - 36, 92);
      ctx.strokeStyle = '#45506a';
      ctx.lineWidth = 5;
      ctx.strokeRect(18, 380, W - 36, 92);
      ctx.fillStyle = '#0e141e';
      ctx.fillRect(34, 396, W - 68, 60);
      // 投币区
      ctx.fillStyle = '#45506a';
      ctx.fillRect(196, 352, 44, 22);
    });
    const bodyMat = DIO.toon(bodyColor);
    const frontMat = DIO.toon(0xffffff, {
      map: frontTex, emissive: 0xffffff, emissiveMap: frontTex, emissiveIntensity: 0.62,
    });
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 1.86, 0.64),
      [bodyMat, bodyMat, bodyMat, bodyMat, frontMat, bodyMat]
    );
    DIO.outline(body, 0.016);
    body.position.y = 0.93;
    g.add(body);
    // 顶部灯箱
    const capTex = DIO.texture(256, 64, function (ctx, W, H) {
      ctx.fillStyle = '#' + accent;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.fillText('つめたい · あたため', W / 2, 42);
    });
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.06, 0.16, 0.68),
      [bodyMat, bodyMat, bodyMat, bodyMat, DIO.toon(0xffffff, { map: capTex, emissive: 0xffffff, emissiveMap: capTex, emissiveIntensity: 0.9 }), bodyMat]
    );
    DIO.outline(cap, 0.012);
    cap.position.y = 1.94;
    g.add(cap);
    return g;
  }

  function buildVending(scene) {
    const vm1 = vendingMachine(-6.15, -0.32, 0xc03848, 'e86a5a', 'ドリンク', 1);
    scene.add(vm1);
    const vm2 = vendingMachine(-5.25, -0.32, 0x2a5a9e, '69d2ff', 'スープ', 3);
    scene.add(vm2);

    const l1 = new THREE.PointLight(0xffd9c0, 5, 3.5, 2);
    l1.position.set(-5.7, 1.4, 0.3);
    l1.userData.baseIntensity = 5;
    scene.add(l1);
    DIO.vendingLights = [l1];

    DIO.glowSource({ pos: new THREE.Vector3(-6.15, 1.3, -0.05), color: 0xffb0a0, size: 1.5, opacity: 0.5 });
    DIO.glowSource({ pos: new THREE.Vector3(-5.25, 1.3, -0.05), color: 0x8ad8ff, size: 1.5, opacity: 0.5 });
    DIO.poolSource({ x: -5.7, z: 0.55, w: 2.4, l: 1.1, color: 0xa8c8e8, opacity: 0.32 });
    DIO.streakSource({ x: -5.7, y: 0.045, z: 1.4, color: 0x9fd0e8, intensity: 0.5, width: 0.8, length: 2.6 });
  }

  /* ================= 电线杆 + 电线 ================= */
  function buildPole(scene) {
    const px = 4.5, pz = -0.5;
    const poleMat = DIO.toon(0x8d939e);
    const pole = DIO.cyl(0.1, 0.14, 8.4, poleMat, 14, 0.016);
    pole.position.set(px, WALK + 4.2, pz);
    scene.add(pole);
    // 基座
    const base = DIO.cyl(0.2, 0.24, 0.5, DIO.toon(0x6a7488), 10, 0.012);
    base.position.set(px, WALK + 0.25, pz);
    scene.add(base);

    // 横担 + 绝缘子
    const crossMat = DIO.toon(0x545d70);
    for (const cy of [7.7, 7.1]) {
      const cross = DIO.box(1.5, 0.09, 0.09, crossMat, 0.012);
      cross.position.set(px, WALK + cy, pz);
      scene.add(cross);
      for (const ix of [-0.68, 0, 0.68]) {
        const ins = DIO.cyl(0.03, 0.045, 0.12, DIO.toon(0xb8c0cc), 8, 0);
        ins.position.set(px + ix, WALK + cy + 0.1, pz);
        scene.add(ins);
      }
    }
    // 变压器 ×2
    const trMat = DIO.toon(0x5f6a58);
    for (const [ty, toff] of [[5.1, -0.26], [4.5, 0.26]]) {
      const tr = DIO.cyl(0.24, 0.24, 0.52, trMat, 12, 0.014);
      tr.position.set(px + toff, WALK + ty, pz);
      scene.add(tr);
      for (const ry of [-0.12, 0.12]) {
        const ring = DIO.cyl(0.27, 0.27, 0.06, DIO.toon(0x50584a), 12, 0);
        ring.position.set(px + toff, WALK + ty + ry, pz);
        scene.add(ring);
      }
    }
    // 街道铭牌（交叉两块）
    const signTexA = DIO.texture(512, 96, function (ctx, W, H) {
      ctx.fillStyle = '#1a4a6e';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, W - 8, H - 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 40px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('旭町 1 丁目  →', W / 2, H / 2);
    });
    const signTexB = DIO.texture(512, 96, function (ctx, W, H) {
      ctx.fillStyle = '#1a4a6e';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, W - 8, H - 8);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 40px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('← 柳どおり', W / 2, H / 2);
    });
    const sA = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.18),
      DIO.basic(0xffffff, { map: signTexA, side: THREE.DoubleSide })
    );
    sA.position.set(px, 2.95, pz + 0.02);
    scene.add(sA);
    const sB = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.18),
      DIO.basic(0xffffff, { map: signTexB, side: THREE.DoubleSide })
    );
    sB.rotation.y = Math.PI / 2;
    sB.position.set(px + 0.02, 2.95, pz);
    scene.add(sB);

    // 凸面镜（朝向路口）
    const mirrorTex = DIO.texture(128, 128, function (ctx, W, H) {
      const grd = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
      grd.addColorStop(0, '#c4d8e8');
      grd.addColorStop(0.7, '#7a92ac');
      grd.addColorStop(1, '#46586e');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(64, 64, 62, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 4;
      for (const ry of [30, 55, 80]) {
        ctx.beginPath();
        ctx.ellipse(64, ry, 40, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    const arm = DIO.box(0.05, 0.05, 0.7, DIO.toon(0x545d70), 0);
    arm.position.set(px - 0.32, 3.6, pz + 0.1);
    arm.rotation.y = Math.PI / 4 + 0.2;
    scene.add(arm);
    const mirror = new THREE.Mesh(
      new THREE.CircleGeometry(0.27, 20),
      new THREE.MeshBasicMaterial({ map: mirrorTex })
    );
    const mpos = new THREE.Vector3(px, 3.6, pz).add(new THREE.Vector3(-0.66, 0, 0.22));
    mirror.position.copy(mpos);
    mirror.lookAt(new THREE.Vector3(1.5, 2.2, 2.5));
    scene.add(mirror);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.025, 8, 20),
      DIO.toon(0xd8b84a)
    );
    rim.position.copy(mpos);
    rim.quaternion.copy(mirror.quaternion);
    scene.add(rim);

    /* --- 电线 --- */
    const py = WALK;
    // 主干 → B3 屋角（跨 Road B）
    scene.add(wire(new THREE.Vector3(px - 0.68, py + 7.8, pz), new THREE.Vector3(-1.9, 5.55, -1.0), 0.55));
    scene.add(wire(new THREE.Vector3(px - 0.68, py + 7.8, pz - 0.14), new THREE.Vector3(-1.9, 5.4, -1.14), 0.6));
    scene.add(wire(new THREE.Vector3(px, py + 7.2, pz), new THREE.Vector3(-1.92, 5.3, -2.6), 0.5));
    // 主干 → 北侧二杆
    scene.add(wire(new THREE.Vector3(px - 0.2, py + 7.7, pz), new THREE.Vector3(4.45, 7.55, -8.6), 0.6));
    scene.add(wire(new THREE.Vector3(px + 0.2, py + 7.7, pz), new THREE.Vector3(4.45, 7.4, -8.75), 0.65));
    // 主干 → 便利店屋顶（引入线）
    scene.add(wire(new THREE.Vector3(px + 0.5, py + 7.2, pz), new THREE.Vector3(7.4, 3.5, -2.4), 0.8));
    // 主干 → 路灯A
    scene.add(wire(new THREE.Vector3(px - 0.6, py + 7.15, pz), new THREE.Vector3(-1.45, 4.7, 0.5), 0.5));

    // 北侧二杆
    const pole2 = DIO.cyl(0.08, 0.11, 7.6, poleMat, 12, 0.014);
    pole2.position.set(4.45, WALK + 3.8, -8.6);
    scene.add(pole2);
    const cross2 = DIO.box(1.2, 0.08, 0.08, crossMat, 0.01);
    cross2.position.set(4.45, WALK + 7.35, -8.6);
    scene.add(cross2);
    scene.add(wire(new THREE.Vector3(4.45 + 0.5, WALK + 7.35, -8.6), new THREE.Vector3(-6.4, 6.9, -9.3), 0.7));
    scene.add(wire(new THREE.Vector3(4.45 - 0.5, WALK + 7.35, -8.6), new THREE.Vector3(-6.4, 7.0, -9.4), 0.75));
  }

  /* ================= 路灯 ================= */
  function streetLamp(x, z, armDirX, armDirZ, withSpot, flicker) {
    const g = new THREE.Group();
    g.position.set(x, WALK, z);
    const poleMat = DIO.toon(0x5a6478);
    const pole = DIO.cyl(0.055, 0.075, 4.9, poleMat, 10, 0.014);
    pole.position.y = 2.45;
    g.add(pole);
    const base = DIO.cyl(0.13, 0.16, 0.28, DIO.toon(0x45506a), 10, 0.01);
    base.position.y = 0.14;
    g.add(base);
    // 弯臂
    const a = new THREE.Vector3(0, 4.9, 0);
    const b = new THREE.Vector3(armDirX * 1.15, 4.72, armDirZ * 1.15);
    const mid = new THREE.Vector3(armDirX * 0.55, 5.05, armDirZ * 0.55);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const arm = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.045, 8), poleMat);
    g.add(arm);
    // 灯头
    const head = new THREE.Group();
    head.position.copy(b);
    const headBox = DIO.box(0.42, 0.1, 0.24, DIO.toon(0x45506a), 0.012);
    head.add(headBox);
    const lampPanel = DIO.box(0.36, 0.03, 0.18, DIO.basic(0xd8ecff), 0);
    lampPanel.position.y = -0.06;
    head.add(lampPanel);
    g.add(head);

    const headWorld = new THREE.Vector3(x + armDirX * 1.15, WALK + 4.72, z + armDirZ * 1.15);
    if (withSpot) {
      const spot = new THREE.SpotLight(0xcfe0ff, 95, 15, 1.05, 0.65, 1.6);
      spot.position.copy(headWorld);
      spot.target.position.set(x + armDirX * 1.6, 0, z + armDirZ * 1.6);
      spot.castShadow = true;
      spot.shadow.mapSize.set(1024, 1024);
      spot.shadow.bias = -0.0015;
      DIO.scene.add(spot);
      DIO.scene.add(spot.target);
      spot.userData.baseIntensity = 95;
      DIO.lampSpots = DIO.lampSpots || [];
      DIO.lampSpots.push(spot);
      if (flicker) {
        DIO.flicker({ lights: [spot], base: 1, wobble: 0.04, freq: 13, prob: 0.3, len: 0.3, depth: 0.5 });
      }
    }
    DIO.glowSource({ pos: headWorld.clone().add(new THREE.Vector3(0, -0.05, 0)), color: 0xbfd8ff, size: 1.1, opacity: 0.4 });
    return g;
  }

  function buildLamps(scene) {
    DIO.scene = scene;
    // 路口西北角（照向路口）
    scene.add(streetLamp(-1.5, 0.5, 0.9, 0.45, true, true));
    // Road A 西段南侧
    scene.add(streetLamp(-4.6, 5.55, 0.1, -0.85, true, false));
    // Road B 东侧中段（只发光不投影）
    scene.add(streetLamp(4.45, -4.2, -0.75, 0.3, false, false));

    // 路灯下光池
    DIO.poolSource({ x: -0.4, z: 1.5, w: 3.2, l: 2.6, color: 0x9fc0e8, opacity: 0.3 });
    DIO.poolSource({ x: -4.5, z: 3.9, w: 3.0, l: 2.6, color: 0x9fc0e8, opacity: 0.28 });
    DIO.poolSource({ x: 3.5, z: -4.4, w: 2.6, l: 2.4, color: 0x9fc0e8, opacity: 0.22 });
    // 湿路面反射光带
    DIO.streakSource({ x: -0.4, y: 0.045, z: 1.5, color: 0xbcd4ff, intensity: 0.85, width: 1.0, length: 4.2 });
    DIO.streakSource({ x: -4.5, y: 0.045, z: 3.9, color: 0xbcd4ff, intensity: 0.8, width: 0.9, length: 3.8 });
    DIO.streakSource({ x: 3.5, y: 0.045, z: -4.4, color: 0xbcd4ff, intensity: 0.55, width: 0.8, length: 3.2 });
  }

  /* ================= 交通信号灯（远处微弱变化） ================= */
  function trafficSignal(x, z, armDirX, armDirZ, faceYaw, offset) {
    const g = new THREE.Group();
    g.position.set(x, WALK, z);
    const poleMat = DIO.toon(0x454f62);
    const pole = DIO.cyl(0.05, 0.065, 4.7, poleMat, 10, 0.012);
    pole.position.y = 2.35;
    g.add(pole);
    const arm = tube(
      new THREE.Vector3(0, 4.45, 0),
      new THREE.Vector3(armDirX * 2.0, 4.35, armDirZ * 2.0),
      0.04, poleMat, 0
    );
    g.add(arm);

    // 灯箱
    const head = new THREE.Group();
    head.position.set(armDirX * 2.0, 4.05, armDirZ * 2.0);
    const box = DIO.box(0.26, 0.78, 0.22, DIO.toon(0x2c3345), 0.01);
    head.add(box);
    const lamps = [];
    const cols = [0xff4c44, 0xffc44c, 0x4ce88c];
    for (let i = 0; i < 3; i++) {
      const lm = DIO.basic(cols[i]);
      lamps.push(lm);
      const lamp = DIO.cyl(0.075, 0.075, 0.04, lm, 10, 0);
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(0, 0.25 - i * 0.25, 0.13);
      head.add(lamp);
      const hood = DIO.cyl(0.1, 0.085, 0.08, DIO.toon(0x1c2230), 10, 0);
      hood.rotation.x = Math.PI / 2.6;
      hood.position.set(0, 0.28 - i * 0.25, 0.16);
      head.add(hood);
    }
    head.rotation.y = faceYaw;
    g.add(head);

    // 信号循环
    const state = { t: -offset };
    DIO.animate(function (t, dt) {
      state.t += dt || 0.016;
      const cyc = state.t % 15;
      let active = cyc < 6.5 ? 2 : cyc < 8.2 ? 1 : 0; // 绿→黄→红
      const blink = active === 1 && (state.t % 0.5) < 0.25;
      for (let i = 0; i < 3; i++) {
        lamps[i].color.setHex(cols[i]);
        if (i === active) {
          lamps[i].color.multiplyScalar(1);
          lamps[i].opacity = 1;
        } else {
          lamps[i].color.multiplyScalar(0.12);
        }
      }
      if (blink) lamps[1].color.multiplyScalar(0.3);
    });
    return g;
  }

  function buildSignals(scene) {
    // Road A 西端出口（面朝东/路口）
    scene.add(trafficSignal(-9.45, 5.6, 0.15, -1, -Math.PI / 2, 0));
    // Road B 北端出口（面朝南/路口）
    scene.add(trafficSignal(-1.5, -9.3, 1, 0.1, Math.PI, 7.5));
  }

  /* ================= 街角护栏（黄黑警示） ================= */
  function buildGuardrail(scene) {
    const stripeTex = DIO.texture(256, 64, function (ctx, W, H) {
      ctx.fillStyle = '#e8b83a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#1c1c22';
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        ctx.clip();
        ctx.translate(i * 40, 0);
        ctx.rotate(-0.5);
        ctx.fillRect(-10, -20, 20, H + 60);
        ctx.restore();
      }
    });
    stripeTex.wrapS = THREE.RepeatWrapping;
    const railMat = DIO.toon(0xffffff, { map: stripeTex });
    const postMat = DIO.toon(0x39435a);

    const g = new THREE.Group();
    g.position.set(4.32, WALK, -0.32);
    // 沿西缘（面向 Road B）
    const rail1 = DIO.box(0.07, 0.09, 1.7, railMat, 0.01);
    rail1.position.set(0, 0.68, -0.85);
    g.add(rail1);
    const rail2 = DIO.box(0.07, 0.09, 1.7, railMat, 0.01);
    rail2.position.set(0, 0.4, -0.85);
    g.add(rail2);
    for (let i = 0; i < 4; i++) {
      const post = DIO.cyl(0.03, 0.03, 0.78, postMat, 8, 0);
      post.position.set(0, 0.39, -1.68 + i * 0.56);
      g.add(post);
    }
    // 转角圆弧
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.045, 8, 12, Math.PI / 2),
      railMat
    );
    arc.rotation.y = -Math.PI / 2;
    arc.position.set(0.35, 0.68, -0.02);
    g.add(arc);
    const post2 = DIO.cyl(0.03, 0.03, 0.78, postMat, 8, 0);
    post2.position.set(0.35, 0.39, -0.02);
    g.add(post2);
    scene.add(g);
  }

  /* ================= 公告栏 ================= */
  function buildNoticeBoard(scene) {
    const g = new THREE.Group();
    g.position.set(-1.55, WALK, -2.1);
    g.rotation.y = Math.PI / 2;

    const frameMat = DIO.toon(0x5a4638);
    const frame = DIO.box(1.3, 0.95, 0.1, frameMat, 0.014);
    frame.position.y = 1.35;
    g.add(frame);
    const boardTex = DIO.texture(512, 384, function (ctx, W, H) {
      ctx.fillStyle = '#8a7a5c';
      ctx.fillRect(0, 0, W, H);
      DIO.speckle(ctx, W, H, 400, '60,50,36', 0.1, 0.3, 2);
      const papers = [
        ['#f2eee4', 20, 24, 150, 190, 0.06], ['#d8e8f0', 190, 20, 130, 160, -0.08],
        ['#f0e0d0', 340, 30, 140, 200, 0.1], ['#e8f0dc', 40, 230, 170, 130, -0.05],
        ['#f2eee4', 230, 200, 120, 150, 0.12], ['#fce8c8', 365, 250, 110, 110, 0.04],
      ];
      for (const [col, px, py, pw, ph, rot] of papers) {
        ctx.save();
        ctx.translate(px + pw / 2, py + ph / 2);
        ctx.rotate(rot);
        ctx.fillStyle = 'rgba(30,30,40,0.25)';
        ctx.fillRect(-pw / 2 + 3, -ph / 2 + 4, pw, ph);
        ctx.fillStyle = col;
        ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
        ctx.strokeStyle = 'rgba(80,80,90,0.3)';
        ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
        // 内容线条
        ctx.fillStyle = 'rgba(60,70,110,0.5)';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(-pw / 2 + 8, -ph / 2 + 14 + i * 16, pw - 16, 4);
        }
        ctx.fillStyle = '#c84c4c';
        ctx.fillRect(-pw / 2 + 8, -ph / 2 + 6, pw * 0.4, 7);
        ctx.restore();
      }
    });
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.82),
      DIO.basic(0xffffff, { map: boardTex })
    );
    board.position.set(0, 1.35, 0.055);
    g.add(board);
    // 玻璃反光
    const shine = new THREE.Mesh(
      new THREE.PlaneGeometry(1.16, 0.82),
      new THREE.MeshBasicMaterial({
        color: 0xa8c4e8, transparent: true, opacity: 0.08,
      })
    );
    shine.position.set(0, 1.35, 0.062);
    g.add(shine);
    // 顶棚
    const roof = DIO.box(1.42, 0.07, 0.3, DIO.toon(0x39435a), 0.012);
    roof.position.set(0, 1.88, 0.06);
    roof.rotation.x = -0.12;
    g.add(roof);
    // 立柱
    for (const lx of [-0.52, 0.52]) {
      const leg = DIO.cyl(0.035, 0.035, 0.95, DIO.toon(0x39435a), 8, 0);
      leg.position.set(lx, 0.47, 0);
      g.add(leg);
    }
    scene.add(g);
  }

  /* ================= 自行车 ================= */
  function makeBike(frameColor) {
    const g = new THREE.Group();
    const tireMat = DIO.toon(0x2b3138);
    const frameMat = DIO.toon(frameColor);
    const metalMat = DIO.toon(0x8a93a5);

    for (const wz of [0.55, -0.55]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 8, 22), tireMat);
      DIO.outline(wheel, 0.012);
      wheel.position.set(0, 0.27, wz);
      g.add(wheel);
      for (let i = 0; i < 3; i++) {
        const sp = DIO.cyl(0.008, 0.008, 0.5, metalMat, 6, 0);
        sp.rotation.z = (i * Math.PI) / 3;
        sp.position.set(0, 0.27, wz);
        g.add(sp);
      }
      const hub = DIO.cyl(0.028, 0.028, 0.05, metalMat, 8, 0);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(0, 0.27, wz);
      g.add(hub);
    }
    // 车架管
    const pts = [
      [[0, 0.27, 0.55], [0, 0.72, 0.42]],
      [[0, 0.27, -0.55], [0, 0.68, -0.3]],
      [[0, 0.72, 0.42], [0, 0.68, -0.3]],
      [[0, 0.27, -0.55], [0, 0.45, -0.12]],
      [[0, 0.45, -0.12], [0, 0.68, -0.3]],
      [[0, 0.45, -0.12], [0, 0.72, 0.42]],
    ];
    for (const [a, b] of pts) {
      g.add(tube(new THREE.Vector3(a[0], a[1], a[2]), new THREE.Vector3(b[0], b[1], b[2]), 0.022, frameMat, 0.008));
    }
    // 座杆 + 车座
    g.add(tube(new THREE.Vector3(0, 0.68, -0.3), new THREE.Vector3(0, 0.92, -0.42), 0.02, metalMat, 0));
    const saddle = DIO.box(0.06, 0.045, 0.26, DIO.toon(0x23282f), 0.008);
    saddle.position.set(0, 0.95, -0.44);
    g.add(saddle);
    // 车把
    g.add(tube(new THREE.Vector3(0, 0.72, 0.42), new THREE.Vector3(0, 0.98, 0.5), 0.02, metalMat, 0));
    const bar = DIO.cyl(0.016, 0.016, 0.44, metalMat, 8, 0.006);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.98, 0.5);
    g.add(bar);
    for (const gx of [-0.22, 0.22]) {
      const grip = DIO.cyl(0.024, 0.024, 0.1, DIO.toon(0x23282f), 6, 0);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(gx, 0.98, 0.5);
      g.add(grip);
    }
    // 前筐
    const basketMat = DIO.toon(0x9aa5b8);
    const basket = new THREE.Group();
    const bb = DIO.box(0.34, 0.02, 0.24, basketMat, 0);
    basket.add(bb);
    for (const [bx, bz, bw, bd] of [[-0.17, 0, 0.02, 0.24], [0.17, 0, 0.02, 0.24], [0, -0.12, 0.34, 0.02], [0, 0.12, 0.34, 0.02]]) {
      const wall = DIO.box(bw, 0.16, bd, basketMat, 0);
      wall.position.set(bx, 0.09, bz);
      basket.add(wall);
    }
    basket.position.set(0, 0.86, 0.72);
    g.add(basket);
    // 挡泥板
    for (const fz of [0.55, -0.55]) {
      const fend = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.015, 6, 10, Math.PI * 0.7),
        frameMat
      );
      fend.position.set(0, 0.27, fz);
      fend.rotation.y = Math.PI / 2;
      fend.rotation.x = fz > 0 ? -0.5 : 0.5;
      g.add(fend);
    }
    // 撑脚
    const kick = tube(new THREE.Vector3(0, 0.3, -0.1), new THREE.Vector3(0.16, 0, -0.28), 0.012, metalMat, 0);
    g.add(kick);
    return g;
  }

  function buildBikes(scene) {
    const rackMat = DIO.toon(0x8a93a5);
    for (const [rz, rot] of [[-2.0, 0.08], [-2.9, -0.06]]) {
      // 驻轮架（倒 U）
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(0.2, 0.025, 8, 12, Math.PI),
        rackMat
      );
      arch.rotation.y = Math.PI / 2;
      arch.position.set(4.42, WALK, rz);
      scene.add(arch);
      const bike = makeBike(rz < -2.4 ? 0x3868b8 : 0xc04048);
      bike.position.set(4.35, WALK, rz - 0.55);
      bike.rotation.y = rot + Math.PI; // 车头朝北
      scene.add(bike);
    }
  }

  /* ================= 轻型货车（配送中） ================= */
  function buildVan(scene) {
    const g = new THREE.Group();
    const bodyMat = DIO.toon(0xe8ecef);
    const glassMat = DIO.toon(0x9db8d6, { transparent: true, opacity: 0.45 });

    // 车头朝西
    const cargo = DIO.box(1.38, 1.5, 2.15, bodyMat, 0.016);
    cargo.position.set(0.55, 0.98, 0);
    g.add(cargo);
    const cab = DIO.box(1.38, 0.85, 0.95, bodyMat, 0.016);
    cab.position.set(-1.0, 0.72, 0);
    g.add(cab);
    // 挡风玻璃
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.55), glassMat);
    ws.rotation.y = -Math.PI / 2;
    ws.rotation.x = -0.12;
    ws.position.set(-1.48, 0.82, 0);
    g.add(ws);
    for (const sz of [-0.62, 0.62]) {
      const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), glassMat);
      sw.rotation.y = sz > 0 ? 0 : Math.PI;
      sw.position.set(-1.0, 0.86, sz);
      g.add(sw);
    }
    // 车轮
    const wheelMat = DIO.toon(0x23282f);
    for (const [wx, wz] of [[-1.05, -0.66], [-1.05, 0.66], [0.75, -0.66], [0.75, 0.66], [1.35, -0.66], [1.35, 0.66]]) {
      const w = DIO.cyl(0.26, 0.26, 0.18, wheelMat, 14, 0.01);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.26, wz);
      g.add(w);
      const hub = DIO.cyl(0.1, 0.1, 0.2, DIO.toon(0x8a93a5), 10, 0);
      hub.rotation.x = Math.PI / 2;
      hub.position.set(wx, 0.26, wz);
      g.add(hub);
    }
    // 车灯
    const hl = DIO.box(0.06, 0.12, 0.2, DIO.basic(0xffe8c0), 0);
    for (const hz of [-0.45, 0.45]) {
      const l = hl.clone();
      l.position.set(-1.5, 0.5, hz);
      g.add(l);
    }
    const tl = DIO.box(0.05, 0.12, 0.18, DIO.basic(0xd8342c), 0);
    for (const hz of [-0.5, 0.5]) {
      const l = tl.clone();
      l.position.set(1.63, 0.55, hz);
      g.add(l);
    }
    // 侧面配送标志
    const sideTex = DIO.texture(256, 160, function (ctx, W, H) {
      ctx.fillStyle = '#e8ecef';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff8c3a';
      ctx.beginPath();
      ctx.arc(70, 70, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.fillText('配', 70, 62);
      ctx.fillText('送', 70, 92);
      ctx.fillStyle = '#223a6e';
      ctx.font = 'bold 34px ' + DIO.jpFont;
      ctx.textAlign = 'left';
      ctx.fillText('ミニマート', 130, 60);
      ctx.fillStyle = '#5f9bff';
      ctx.font = 'bold 20px Consolas';
      ctx.fillText('MINIMART LOGI', 130, 96);
      ctx.fillStyle = '#8a93a5';
      ctx.fillRect(130, 112, 100, 6);
    });
    for (const s of [-1, 1]) {
      const side = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 1.1),
        DIO.basic(0xffffff, { map: sideTex })
      );
      side.rotation.y = s > 0 ? 0 : Math.PI;
      side.position.set(0.55, 0.95, s * 0.7);
      g.add(side);
    }
    // 顶灯
    const beacon = DIO.box(0.2, 0.08, 0.12, DIO.basic(0xffb040), 0);
    beacon.position.set(-1.0, 1.2, 0);
    g.add(beacon);

    g.position.set(6.9, WALK, -7.2);
    g.rotation.y = -Math.PI / 2 + 0.04;
    scene.add(g);
  }

  /* ================= 店后设备 + 杂物 ================= */
  function buildBacklot(scene) {
    // 空调外机（落地）
    const ac = DIO.box(0.95, 0.72, 0.55, DIO.toon(0x9aa5b8), 0.014);
    ac.position.set(5.35, WALK + 0.36, -6.1);
    scene.add(ac);
    const fan = DIO.cyl(0.26, 0.26, 0.04, DIO.toon(0x6a7488), 12, 0);
    fan.position.set(5.35, WALK + 0.75, -6.1);
    scene.add(fan);
    const blades = DIO.box(0.4, 0.02, 0.08, DIO.toon(0x45506a), 0);
    blades.position.set(5.35, WALK + 0.78, -6.1);
    scene.add(blades);
    DIO.animate(function (t) { blades.rotation.y = t * 9; });
    // 连接管
    scene.add(tube(new THREE.Vector3(5.35, WALK + 0.6, -5.83), new THREE.Vector3(5.35, WALK + 0.2, -5.62), 0.03, DIO.toon(0x8a93a5), 0));

    // 托盘 + 纸箱堆
    const pallet = DIO.box(0.9, 0.12, 0.7, DIO.toon(0x8a6e4e), 0.012);
    pallet.position.set(8.6, WALK + 0.06, -6.0);
    scene.add(pallet);
    const cbMat = DIO.toon(0xb89a6e);
    for (const [cx, cz, s, ry] of [[8.4, -6.2, 1, 0.1], [8.8, -5.9, 0.8, -0.2], [8.55, -6.05, 0.6, 0.4]]) {
      const cb = DIO.box(0.42 * s, 0.34 * s, 0.38 * s, cbMat, 0.01);
      cb.position.set(cx, WALK + 0.3 + (s - 0.6) * 0.4, cz);
      cb.rotation.y = ry;
      scene.add(cb);
    }

    // 交通锥
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.45, 10),
      DIO.toon(0xe86a34)
    );
    DIO.outline(cone, 0.012);
    cone.position.set(4.55, WALK + 0.22, -7.1);
    scene.add(cone);
    const coneBase = DIO.box(0.3, 0.03, 0.3, DIO.toon(0xe86a34), 0);
    coneBase.position.set(4.55, WALK + 0.015, -7.1);
    scene.add(coneBase);
    const band = DIO.cyl(0.1, 0.115, 0.07, DIO.toon(0xf2eee4), 10, 0);
    band.position.set(4.55, WALK + 0.25, -7.1);
    scene.add(band);
  }

  DIO.builders.push(function (scene) {
    buildVending(scene);
    buildPole(scene);
    buildLamps(scene);
    buildSignals(scene);
    buildGuardrail(scene);
    buildNoticeBoard(scene);
    buildBikes(scene);
    buildVan(scene);
    buildBacklot(scene);
  });
})();
