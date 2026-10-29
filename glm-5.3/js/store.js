/* =========================================================================
 * store.js — 便利店「ミニマート24」建筑 + 室内全套陈设 + 自动门 / 招牌闪烁
 * 本地坐标：组位于世界 (4.8, 0.18, -0.8)
 *   +x 东（0..5.1），z=0 南立面（临 Road A），-z 进深（0..-4.8）
 *   西立面 x=0 临 Road B；西南角 45° 切角面 = 出入口（朝路口）
 * ========================================================================= */
(function () {
  'use strict';
  const DIO = window.DIO;
  const C = DIO.C;

  const CH = 1.4;          // 切角边长
  const H = 3.1;           // 檐口高
  const CEIL = 2.72;       // 吊顶高

  /* ============ 玻璃材质（自定义菲涅尔） ============ */
  function glassMat(tint, sheen, opacity) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTint: { value: new THREE.Color(tint == null ? 0x8fb0d4 : tint) },
        uSheen: { value: new THREE.Color(sheen == null ? 0xc4d8f0 : sheen) },
        uOpacity: { value: opacity == null ? 0.16 : opacity },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: [
        'varying vec3 vN;',
        'varying vec3 vV;',
        'void main(){',
        '  vN = normalize(normalMatrix * normal);',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vV = normalize(-mv.xyz);',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uTint;',
        'uniform vec3 uSheen;',
        'uniform float uOpacity;',
        'varying vec3 vN;',
        'varying vec3 vV;',
        'void main(){',
        '  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);',
        '  vec3 col = mix(uTint, uSheen, f * 0.85);',
        '  float a = uOpacity + f * 0.38;',
        '  gl_FragColor = vec4(col, a);',
        '}',
      ].join('\n'),
    });
  }

  /* ============ 玻璃雨痕（双层滚动着色器） ============ */
  function rainStreakTexture(kind) {
    return DIO.texture(256, 512, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const n = kind === 'sparse' ? 14 : 46;
      for (let i = 0; i < n; i++) {
        const x = DIO.rand() * W;
        const y = DIO.rand() * H;
        const len = kind === 'sparse' ? DIO.range(30, 90) : DIO.range(18, 70);
        const w = kind === 'sparse' ? DIO.range(4, 9) : DIO.range(1.5, 4.5);
        const g = ctx.createLinearGradient(0, y, 0, y + len);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.45, 'rgba(200,220,255,0.5)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, len);
        // 末端水珠
        if (kind === 'sparse' || DIO.rand() < 0.4) {
          ctx.fillStyle = 'rgba(190,215,255,0.55)';
          ctx.beginPath();
          ctx.arc(x + w / 2, y + len, w * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  function glassStreakMat() {
    const uni = {
      uTime: { value: 0 },
      uTexA: { value: rainStreakTexture('dense') },
      uTexB: { value: rainStreakTexture('sparse') },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      transparent: true,
      depthWrite: false,
      vertexShader: [
        'varying vec2 vUv;',
        'void main(){',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform sampler2D uTexA;',
        'uniform sampler2D uTexB;',
        'varying vec2 vUv;',
        'void main(){',
        '  vec2 uvA = vec2(vUv.x, fract(vUv.y + uTime * 0.010));',
        '  vec2 uvB = vec2(vUv.x, fract(vUv.y - uTime * 0.075));',
        '  float a = texture2D(uTexA, uvA).a * 0.55;',
        '  float b = texture2D(uTexB, uvB).a * 0.65;',
        '  gl_FragColor = vec4(vec3(0.62, 0.72, 0.9), min(a + b, 0.75));',
        '}',
      ].join('\n'),
    });
    DIO.animate(function (t) { uni.uTime.value = t; });
    return mat;
  }
  const streakMatShared = null; // 每块玻璃独立实例（贴图不同 seed 也行，共享省内存）

  /* ============ 通用小贴图 ============ */
  function texCoolerFront() {
    return DIO.texture(512, 512, function (ctx, W, H) {
      ctx.fillStyle = '#e9eef6';
      ctx.fillRect(0, 0, W, H);
      const rows = 5, cols = 7;
      for (let r = 0; r < rows; r++) {
        const y = 30 + r * 96;
        ctx.fillStyle = 'rgba(180,190,205,0.5)';
        ctx.fillRect(10, y + 72, W - 20, 8); // 层板
        for (let cch = 0; cch < cols; cch++) {
          const x = 18 + cch * 68 + DIO.range(-3, 3);
          const pick = DIO.rand();
          let col;
          if (pick < 0.3) col = '#c8e8f8';       // 瓶（浅蓝）
          else if (pick < 0.5) col = '#ffd9a8';  // 橙汁
          else if (pick < 0.7) col = '#b2d8b2';  // 茶（绿）
          else if (pick < 0.85) col = '#f2b8c0'; // 桃粉
          else col = '#d8d2f0';
          ctx.fillStyle = col;
          ctx.fillRect(x, y + 8, 30, 64);
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillRect(x + 4, y + 12, 6, 50);
          ctx.fillStyle = 'rgba(40,50,70,0.35)';
          ctx.fillRect(x + 4, y + 18, 22, 10);
        }
      }
      ctx.fillStyle = 'rgba(60,80,120,0.12)';
      ctx.fillRect(0, 0, W, 26);
    });
  }

  function texShelfGoods() {
    return DIO.texture(512, 256, function (ctx, W, H) {
      ctx.fillStyle = '#dfe3ec';
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 42; i++) {
        const x = 8 + (i % 14) * 36 + DIO.range(-2, 2);
        const y = 16 + Math.floor(i / 14) * 84;
        const cols = ['#f0a868', '#e87878', '#78b8e8', '#a8d888', '#d8b0e0', '#f0e090', '#e8a0b8'];
        ctx.fillStyle = DIO.pick(cols);
        ctx.fillRect(x, y, 30, 66);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(x + 3, y + 4, 24, 12);
        ctx.fillStyle = 'rgba(30,40,60,0.3)';
        ctx.fillRect(x + 3, y + 40, 24, 18);
      }
    });
  }

  function texBentoCase() {
    return DIO.texture(512, 256, function (ctx, W, H) {
      ctx.fillStyle = '#eef1f6';
      ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < 2; r++) {
        for (let cch = 0; cch < 5; cch++) {
          const x = 22 + cch * 98, y = 22 + r * 120;
          ctx.fillStyle = '#4a4f5c';
          ctx.fillRect(x - 2, y - 2, 88, 100);
          ctx.fillStyle = DIO.pick(['#f4e8d0', '#e8f0d8', '#f0e4e8']);
          ctx.fillRect(x, y, 84, 96);
          // 便当内容
          ctx.fillStyle = '#e8b068';
          ctx.fillRect(x + 8, y + 8, 30, 22);
          ctx.fillStyle = '#a84c48';
          ctx.fillRect(x + 42, y + 8, 34, 22);
          ctx.fillStyle = '#78a858';
          ctx.fillRect(x + 8, y + 38, 30, 20);
          ctx.fillStyle = '#f0d060';
          ctx.fillRect(x + 42, y + 38, 34, 20);
          ctx.fillStyle = '#c8c0b0';
          ctx.fillRect(x + 8, y + 64, 68, 24);
        }
      }
    });
  }

  function texMagazines() {
    return DIO.texture(256, 256, function (ctx, W, H) {
      ctx.fillStyle = '#d8dce4';
      ctx.fillRect(0, 0, W, H);
      const cols = ['#e86c6c', '#6c8ce8', '#6cb87c', '#e8b06c', '#b06ce8', '#e8e06c'];
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = DIO.pick(cols);
        ctx.fillRect(12 + (i % 4) * 60, 12 + Math.floor(i / 4) * 62, 52, 54);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(16 + (i % 4) * 60, 16 + Math.floor(i / 4) * 62, 44, 16);
      }
    });
  }

  /* ============ 主构建 ============ */
  function buildStore(scene) {
    const g = new THREE.Group();
    g.position.set(4.8, 0.18, -0.8);
    scene.add(g);
    DIO.storeGroup = g;

    const cream = DIO.toon(C.storeWall);
    const inner = DIO.toon(C.storeInner);
    const frameMat = DIO.toon(0x3a4256);
    const floorMat = DIO.toon(0xd9cbb0, {
      map: DIO.texture(512, 512, function (ctx, W, H) {
        ctx.fillStyle = '#dccfb4';
        ctx.fillRect(0, 0, W, H);
        for (let y = 0; y < 8; y++) {
          for (let x = 0; x < 8; x++) {
            ctx.fillStyle = (x + y) % 2 ? '#d6c8ac' : '#e0d4ba';
            ctx.fillRect(x * 64, y * 64, 64, 64);
          }
        }
        ctx.strokeStyle = 'rgba(120,105,80,0.35)';
        ctx.lineWidth = 2;
        for (let i = 0; i <= 8; i++) {
          ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, H); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(W, i * 64); ctx.stroke();
        }
        DIO.speckle(ctx, W, H, 200, '110,95,70', 0.05, 0.15, 2);
      }),
    });

    /* ---------- 地板 ---------- */
    const floorA = DIO.box(3.7, 0.06, CH, floorMat, 0);
    floorA.position.set(3.25, 0.03, -CH / 2);
    g.add(floorA);
    const floorB = DIO.box(5.1, 0.06, 4.8 - CH, floorMat, 0);
    floorB.position.set(2.55, 0.03, -(CH + 4.8 - CH) / 2 - CH);
    floorB.position.z = -(CH + (4.8 - CH) / 2);
    g.add(floorB);

    // 地面导视线（贴地 decal）
    const guideLines = [
      { pts: [[1.0, -0.9], [4.0, -0.9]], color: '#ff8c3a' },   // 便当区
      { pts: [[1.0, -1.25], [1.0, -3.9]], color: '#5f9bff' },  // 饮料区
      { pts: [[1.5, -0.55], [1.0, -0.9]], color: '#ff5a54' },  // 关东煮
    ];
    for (const L of guideLines) {
      const dx = L.pts[1][0] - L.pts[0][0], dz = L.pts[1][1] - L.pts[0][1];
      const len = Math.hypot(dx, dz);
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(len, 0.1),
        DIO.basic(L.color, { transparent: true, opacity: 0.75 })
      );
      plane.rotation.x = -Math.PI / 2;
      plane.rotation.z = Math.atan2(dz, dx) * -1;
      plane.position.set((L.pts[0][0] + L.pts[1][0]) / 2, 0.068, (L.pts[0][1] + L.pts[1][1]) / 2);
      plane.renderOrder = 5;
      g.add(plane);
    }

    /* ---------- 后墙 / 东墙 ---------- */
    const backWall = DIO.box(5.1, H - 0.06, 0.14, cream, 0.018);
    backWall.position.set(2.55, (H + 0.06) / 2, -4.73);
    g.add(backWall);
    const eastWall = DIO.box(0.14, H - 0.06, 4.8 - 0.14, cream, 0.018);
    eastWall.position.set(5.03, (H + 0.06) / 2, -2.4 - 0.06);
    g.add(eastWall);
    // 西侧后角墙（无玻璃段外的角柱结构已在玻璃柱覆盖）
    const cornerBack = DIO.box(0.14, H, 0.14, cream, 0.016);
    cornerBack.position.set(0.07, H / 2, -4.73);
    g.add(cornerBack);

    /* ---------- 吊顶 + 灯 ---------- */
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(5.1, 4.8), DIO.toon(0xf4f0e6));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(2.55, CEIL, -2.4);
    g.add(ceil);
    const lightStripMat = DIO.basic(0xfff4dc);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const strip = DIO.box(1.9, 0.03, 0.16, lightStripMat, 0);
        strip.position.set(1.35 + i * 1.25, CEIL - 0.03, -1.2 - j * 2.2);
        g.add(strip);
      }
    }
    // 吊挂促销旗
    const bannerTex = DIO.texture(256, 128, function (ctx, W, H) {
      ctx.fillStyle = '#e84c4c';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 52px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('半額セール', W / 2, H / 2);
      ctx.fillStyle = '#ffd84c';
      ctx.fillRect(0, 0, W, 12);
      ctx.fillRect(0, H - 12, W, 12);
    });
    for (let i = 0; i < 2; i++) {
      const ban = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.42),
        DIO.basic(0xffffff, { map: bannerTex, side: THREE.DoubleSide })
      );
      ban.position.set(1.6 + i * 1.9, 2.1, -1.5 - i * 0.7);
      ban.rotation.y = (i % 2 ? 0.12 : -0.1);
      ban.userData.sway = DIO.rand() * 6.28;
      g.add(ban);
      DIO.animate(function (t) {
        ban.rotation.y = (i % 2 ? 0.12 : -0.1) + Math.sin(t * 0.8 + ban.userData.sway) * 0.035;
      });
    }

    /* ---------- 南立面（大玻璃橱窗 + 门带） ---------- */
    // 窗台 / 竖梃 / 玻璃
    const southMullions = [1.4, 2.6, 3.8, 5.03];
    const glass = glassMat();
    const streakMat = glassStreakMat();
    for (let i = 0; i < southMullions.length - 1; i++) {
      const x0 = southMullions[i], x1 = southMullions[i + 1];
      const w = x1 - x0 - 0.08;
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.2), glass);
      pane.position.set((x0 + x1) / 2, 0.22 + 1.1 + 0.08, 0.0);
      pane.renderOrder = 3;
      g.add(pane);
      // 雨痕
      const st = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.2), streakMat);
      st.position.set((x0 + x1) / 2, 0.22 + 1.1 + 0.08, 0.018);
      st.renderOrder = 6;
      g.add(st);
    }
    // 窗台墙
    const sill = DIO.box(3.72, 0.24, 0.12, cream, 0.014);
    sill.position.set(3.25, 0.12, 0.0);
    g.add(sill);
    // 竖梃
    for (const mx of southMullions) {
      const m = DIO.box(0.09, 2.32, 0.12, frameMat, 0.012);
      m.position.set(mx, 0.34 + 1.1, 0.0);
      g.add(m);
    }

    /* ---------- 门带灯箱（fascia band，环绕三面） ---------- */
    const bandTex = DIO.texture(2048, 256, function (ctx, W, H) {
      ctx.fillStyle = '#fdf8ec';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#223a6e';
      ctx.fillRect(0, 0, W, 30);
      ctx.fillRect(0, H - 44, W, 44);
      ctx.fillStyle = '#ff8c3a';
      ctx.fillRect(0, H - 78, W, 34);
      ctx.font = 'bold 130px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#223a6e';
      ctx.fillText('ミニマート', W * 0.42, H * 0.46);
      ctx.fillStyle = '#ff8c3a';
      ctx.font = 'bold 74px Consolas, monospace';
      ctx.fillText('MINIMART 24h', W * 0.78, H * 0.5);
      ctx.beginPath();
      ctx.fillStyle = '#35c46e';
      ctx.arc(W * 0.08, H * 0.5, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 56px Consolas, monospace';
      ctx.fillText('24', W * 0.08, H * 0.52);
    });
    const bandMat = DIO.toon(0xffffff, {
      map: bandTex, emissive: 0xfff2d8, emissiveMap: bandTex, emissiveIntensity: 0.85,
    });
    const bandH = H - 2.5; // 0.6
    const bandF = DIO.box(3.86, bandH, 0.16, bandMat, 0.014);
    bandF.position.set(3.2, 2.5 + bandH / 2, 0.02);
    g.add(bandF);
    const bandW = DIO.box(0.16, bandH, 3.5, bandMat, 0.014);
    bandW.position.set(0.02, 2.5 + bandH / 2, -3.05);
    g.add(bandW);
    const bandC = DIO.box(0.16, bandH, 2.1, bandMat, 0.014);
    bandC.rotation.y = -Math.PI / 4;
    bandC.position.set(0.7, 2.5 + bandH / 2, -0.7);
    g.add(bandC);
    // 转角盖
    for (const [cx, cz] of [[1.44, 0.02], [0.02, -1.44], [0.02, -4.68], [5.06, 0.02]]) {
      const cap = DIO.box(0.18, bandH + 0.04, 0.18, frameMat, 0.012);
      cap.position.set(cx, 2.5 + bandH / 2, cz);
      g.add(cap);
    }
    const bandFlick = DIO.flicker({
      mats: [bandMat], base: 0.85, wobble: 0.05, freq: 24, prob: 0.25, len: 0.3, depth: 0.55,
    });

    /* ---------- 西立面玻璃 ---------- */
    const westMullions = [-1.4, -2.6, -3.8, -4.73];
    for (let i = 0; i < westMullions.length - 1; i++) {
      const z0 = westMullions[i], z1 = westMullions[i + 1];
      const w = Math.abs(z0 - z1) - 0.08;
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.2), glass);
      pane.rotation.y = -Math.PI / 2;
      pane.position.set(0.0, 0.22 + 1.1 + 0.08, (z0 + z1) / 2);
      pane.renderOrder = 3;
      g.add(pane);
      const st = new THREE.Mesh(new THREE.PlaneGeometry(w, 2.2), streakMat);
      st.rotation.y = -Math.PI / 2;
      st.position.set(-0.018, 0.22 + 1.1 + 0.08, (z0 + z1) / 2);
      st.renderOrder = 6;
      g.add(st);
    }
    const sillW = DIO.box(0.12, 0.24, 3.34, cream, 0.014);
    sillW.position.set(0.0, 0.12, -3.06);
    g.add(sillW);
    for (const wz of westMullions) {
      const m = DIO.box(0.12, 2.32, 0.09, frameMat, 0.012);
      m.position.set(0.0, 0.34 + 1.1, wz);
      g.add(m);
    }

    /* ---------- 切角面：自动门 ---------- */
    const doorDir = new THREE.Vector3(0.707, 0, 0.707); // 沿切角（西北→东南端点方向）
    const doorCenter = new THREE.Vector3(0.7, 0, -0.7);
    const outDir = new THREE.Vector3(-0.707, 0, 0.707); // 朝向路口（西南外）
    const rotY = -Math.PI / 4;

    // 固定玻璃侧板
    for (const s of [-1, 1]) {
      const fixed = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 2.2), glass);
      fixed.rotation.y = rotY;
      fixed.position.copy(doorCenter).addScaledVector(doorDir, s * 0.81);
      fixed.position.y = 1.4;
      fixed.renderOrder = 3;
      g.add(fixed);
    }
    // 门框柱
    for (const s of [-1, 1]) {
      const post = DIO.box(0.09, 2.36, 0.12, frameMat, 0.012);
      post.rotation.y = rotY;
      post.position.copy(doorCenter).addScaledVector(doorDir, s * 0.63);
      post.position.y = 1.32;
      g.add(post);
    }
    // 门楣 + 传感器
    const header = DIO.box(2.0, 0.22, 0.14, DIO.toon(0x45506a), 0.012);
    header.rotation.y = rotY;
    header.position.set(0.7, 2.42, -0.7);
    g.add(header);
    const sensor = DIO.box(0.3, 0.08, 0.06, DIO.toon(0x303a4e), 0);
    sensor.rotation.y = rotY;
    sensor.position.copy(doorCenter).addScaledVector(outDir, 0.1);
    sensor.position.y = 2.34;
    g.add(sensor);
    const ledMat = DIO.basic(0xff4444);
    const led = DIO.box(0.05, 0.03, 0.02, ledMat, 0);
    led.rotation.y = rotY;
    led.position.copy(sensor.position).addScaledVector(outDir, 0.03);
    led.position.y = 2.34;
    g.add(led);
    DIO.animate(function (t) {
      ledMat.color.setHex(Math.sin(t * 3.0) > 0.6 ? 0xff6655 : 0x552020);
    });

    // 滑动门扇（组：玻璃 + 边框 + 雨痕）
    function makeDoorPanel() {
      const pg = new THREE.Group();
      const pglass = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 2.2), glass);
      pglass.renderOrder = 3;
      pg.add(pglass);
      const pst = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 2.2), glassStreakMat());
      pst.position.set(0, 0, 0.02);
      pst.renderOrder = 6;
      pg.add(pst);
      for (const e of [-0.34, 0.34]) {
        const edge = DIO.box(0.06, 2.28, 0.05, frameMat, 0);
        edge.position.set(e, 0, 0);
        pg.add(edge);
      }
      const topE = DIO.box(0.7, 0.05, 0.05, frameMat, 0);
      topE.position.y = 1.12;
      pg.add(topE);
      const botE = DIO.box(0.7, 0.08, 0.05, DIO.toon(0x8a93a5), 0);
      botE.position.y = -1.14;
      pg.add(botE);
      // 门贴
      const sticker = new THREE.Mesh(
        new THREE.PlaneGeometry(0.28, 0.28),
        DIO.basic(0xffffff, {
          map: DIO.texture(128, 128, function (ctx, W, H) {
            ctx.fillStyle = '#ff8c3a';
            ctx.beginPath();
            ctx.arc(64, 64, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 40px ' + DIO.jpFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('営', 64, 50);
            ctx.fillText('業', 64, 86);
          }),
          transparent: true,
        })
      );
      sticker.position.set(-0.16, 0.55, 0.012);
      pg.add(sticker);
      return pg;
    }
    const panelA = makeDoorPanel();
    const panelB = makeDoorPanel();
    panelA.rotation.y = rotY;
    panelB.rotation.y = rotY;
    g.add(panelA);
    g.add(panelB);

    const doorState = { phase: 'closed', t: 0, next: 6 + DIO.rand() * 6 };
    const OPEN_SLIDE = 0.62;
    function doorUpdate(dt) {
      doorState.t += dt;
      const setPanels = function (k) {
        // k: 0 关闭 → 1 全开
        const off = OPEN_SLIDE * k;
        panelA.position.copy(doorCenter).addScaledVector(doorDir, -0.33 - off);
        panelB.position.copy(doorCenter).addScaledVector(doorDir, 0.33 + off);
        panelA.position.y = 1.4;
        panelB.position.y = 1.4;
      };
      if (doorState.phase === 'closed') {
        setPanels(0);
        if (doorState.t > doorState.next) {
          doorState.phase = 'opening'; doorState.t = 0;
        }
      } else if (doorState.phase === 'opening') {
        const k = Math.min(1, doorState.t / 1.1);
        setPanels(k * k * (3 - 2 * k));
        if (k >= 1) { doorState.phase = 'open'; doorState.t = 0; }
      } else if (doorState.phase === 'open') {
        setPanels(1);
        if (doorState.t > 3.0) { doorState.phase = 'closing'; doorState.t = 0; }
      } else {
        const k = Math.max(0, 1 - doorState.t / 1.4);
        setPanels(k);
        if (k <= 0) {
          doorState.phase = 'closed';
          doorState.t = 0;
          doorState.next = 7 + DIO.rand() * 9;
        }
      }
      doorOpenK = doorState.phase === 'open' ? 1 :
        doorState.phase === 'opening' ? Math.min(1, doorState.t / 1.1) :
        doorState.phase === 'closing' ? Math.max(0, 1 - doorState.t / 1.4) : 0;
    }
    let doorOpenK = 0;
    DIO.animate(function (t, dt) { doorUpdate(dt || 0.016); });
    DIO.doorOpenFactor = function () { return doorOpenK; };

    /* ---------- 门口地垫（外侧） ---------- */
    const matTex = DIO.texture(256, 192, function (ctx, W, H) {
      ctx.fillStyle = '#3a3630';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#6a5f4c';
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 8, W - 16, H - 16);
      ctx.fillStyle = '#cfc0a0';
      ctx.font = 'bold 40px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.fillText('ミニマート', W / 2, H / 2 - 8);
      ctx.font = '22px Consolas';
      ctx.fillText('WELCOME', W / 2, H / 2 + 28);
      DIO.speckle(ctx, W, H, 300, '0,0,0', 0.1, 0.4, 2);
    });
    const doormat = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.6),
      new THREE.MeshBasicMaterial({ map: matTex })
    );
    doormat.rotation.x = -Math.PI / 2;
    doormat.rotation.z = Math.PI / 4;
    doormat.position.copy(doorCenter).addScaledVector(outDir, 0.42);
    doormat.position.y = 0.005;
    g.add(doormat);

    /* ---------- 屋檐雨棚 ---------- */
    const canopyMat = DIO.toon(0x8e99ad);
    function canopy(len, cx, cz, ry) {
      const cg = new THREE.Group();
      const slope = DIO.box(len, 0.07, 1.05, canopyMat, 0.014);
      slope.rotation.x = -0.09;
      slope.position.set(0, 2.62, 0.5);
      cg.add(slope);
      // 棚檐招牌带
      const fasciaTex = DIO.texture(1024, 128, function (ctx, W, H) {
        ctx.fillStyle = '#ff8c3a';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fdf8ec';
        ctx.fillRect(0, 0, W, 16);
        ctx.font = 'bold 62px ' + DIO.jpFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fdf8ec';
        ctx.fillText('24時間営業 · MINIMART', W / 2, H / 2 + 6);
        ctx.fillStyle = '#35c46e';
        ctx.fillRect(0, H - 18, W, 18);
      });
      const fascia = DIO.box(len, 0.34, 0.06, DIO.toon(0xffffff, {
        map: fasciaTex, emissive: 0xffd9a8, emissiveMap: fasciaTex, emissiveIntensity: 0.5,
      }), 0.012);
      fascia.position.set(0, 2.52, 1.0);
      cg.add(fascia);
      // 棚底暖光灯条
      for (const lx of [-len * 0.3, len * 0.3]) {
        const lamp = DIO.box(0.5, 0.04, 0.1, DIO.basic(0xffe8c0), 0);
        lamp.position.set(lx, 2.56, 0.35);
        cg.add(lamp);
      }
      // 吊杆
      for (const rx of [-len / 2 + 0.25, len / 2 - 0.25]) {
        const rod = DIO.cyl(0.02, 0.02, 0.34, DIO.toon(0x545d70), 6, 0);
        rod.position.set(rx, 2.68, 0.1);
        cg.add(rod);
      }
      cg.position.set(cx, 0, cz);
      cg.rotation.y = ry;
      return cg;
    }
    g.add(canopy(3.9, 3.25, 0.05, 0));
    g.add(canopy(2.05, 0.7, -0.7, -Math.PI / 4));
    // 西面小雨棚
    g.add(canopy(2.2, -0.55, -3.0, -Math.PI / 2));

    /* ---------- 屋顶 ---------- */
    const roof = DIO.box(5.2, 0.14, 4.9, DIO.toon(0xd8d2c4), 0.016);
    roof.position.set(2.55, H + 0.07, -2.4);
    g.add(roof);
    const parapetMat = DIO.toon(0xcfc8b8);
    const parL = DIO.box(5.2, 0.1, 0.1, parapetMat, 0.012);
    parL.position.set(2.55, H + 0.19, 0.02);
    g.add(parL);
    const parR = DIO.box(5.2, 0.1, 0.1, parapetMat, 0.012);
    parR.position.set(2.55, H + 0.19, -4.82);
    g.add(parR);
    const parB = DIO.box(0.1, 0.1, 4.9, parapetMat, 0.012);
    parB.position.set(-0.02, H + 0.19, -2.4);
    g.add(parB);
    const parF = DIO.box(0.1, 0.1, 4.9, parapetMat, 0.012);
    parF.position.set(5.12, H + 0.19, -2.4);
    g.add(parF);

    // 屋顶空调外机 ×2
    for (const [ax, az] of [[1.6, -3.9], [3.9, -4.2]]) {
      const ac = DIO.box(0.72, 0.5, 0.55, DIO.toon(0x9aa5b8), 0.012);
      ac.position.set(ax, H + 0.39, az);
      g.add(ac);
      const fan = DIO.cyl(0.2, 0.2, 0.04, DIO.toon(0x6a7488), 12, 0);
      fan.position.set(ax, H + 0.66, az);
      g.add(fan);
      const blades = DIO.box(0.3, 0.02, 0.06, DIO.toon(0x45506a), 0);
      blades.position.set(ax, H + 0.685, az);
      g.add(blades);
      (function (b) {
        b.userData.spin = DIO.rand() * 10;
        DIO.animate(function (t) { b.rotation.y = t * 9 + b.userData.spin; });
      })(blades);
    }

    /* ---------- 屋顶大招牌（闪烁） ---------- */
    const signTex = DIO.texture(1024, 384, function (ctx, W, H) {
      ctx.fillStyle = '#223a6e';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#ff8c3a';
      ctx.lineWidth = 22;
      ctx.strokeRect(11, 11, W - 22, H - 22);
      ctx.fillStyle = '#fdf8ec';
      ctx.font = 'bold 150px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ミニマート', W / 2, H * 0.42);
      ctx.fillStyle = '#ff8c3a';
      ctx.font = 'bold 64px Consolas, monospace';
      ctx.fillText('OPEN 24 HOURS', W / 2, H * 0.78);
    });
    const signFace = DIO.toon(0xffffff, {
      map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.0,
    });
    const signSide = DIO.toon(0x223a6e);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(2.7, 1.0, 0.16),
      [signSide, signSide, signSide, signSide, signFace, signFace]
    );
    sign.position.set(2.7, H + 1.1, -1.6);
    DIO.outline(sign, 0.016);
    g.add(sign);
    const signPostMat = DIO.toon(0x545d70);
    for (const px of [1.7, 3.7]) {
      const post = DIO.cyl(0.05, 0.05, 1.4, signPostMat, 8, 0);
      post.position.set(px, H + 0.5, -1.6);
      g.add(post);
    }
    DIO.signFlicker = DIO.flicker({
      mats: [signFace], base: 1.0, wobble: 0.05, freq: 7, prob: 0.65, len: 0.5, depth: 0.2,
    });

    // 西面小立牌
    const sign2Tex = DIO.texture(512, 384, function (ctx, W, H) {
      ctx.fillStyle = '#ff8c3a';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fdf8ec';
      ctx.font = 'bold 88px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.fillText('ミニ', W / 2, H * 0.34);
      ctx.fillText('マート', W / 2, H * 0.66);
    });
    const sign2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 1.15, 0.9),
      [DIO.toon(0xff8c3a), DIO.toon(0xff8c3a), DIO.toon(0xff8c3a), DIO.toon(0xff8c3a),
       DIO.toon(0xffffff, { map: sign2Tex, emissive: 0xffffff, emissiveMap: sign2Tex, emissiveIntensity: 0.8 }), DIO.toon(0xff8c3a)]
    );
    // 面朝西：+z 面朝西需旋转
    sign2.rotation.y = -Math.PI / 2;
    sign2.position.set(0.0, H + 0.75, -3.2);
    g.add(sign2);

    /* =============== 室 内 陈 设 =============== */
    const IY = 0.06; // 地板面高

    /* --- 饮料冷柜 ×3（后墙） --- */
    const coolerFrontMat = DIO.toon(0xffffff, {
      map: texCoolerFront(), emissive: 0xf4f8ff, emissiveMap: texCoolerFront(), emissiveIntensity: 0.55,
    });
    const coolerBodyMat = DIO.toon(0x4a566e);
    for (let i = 0; i < 3; i++) {
      const cx = 0.9 + i * 1.4;
      const body = DIO.box(1.18, 2.05, 0.72, coolerBodyMat, 0.014);
      body.position.set(cx, IY + 1.02, -4.28);
      g.add(body);
      const front = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.85), coolerFrontMat);
      front.position.set(cx, IY + 1.02, -3.91);
      g.add(front);
      // 冷柜顶分类招牌
      const catTex = DIO.texture(256, 96, function (ctx, W, H) {
        const cols = ['#5f9bff', '#35c46e', '#e8b06c'];
        ctx.fillStyle = cols[i];
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 44px ' + DIO.jpFont;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(['お飲み物', 'お茶 · 水', 'ビール'][i], W / 2, H / 2);
      });
      const cat = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 0.3),
        DIO.basic(0xffffff, { map: catTex })
      );
      cat.position.set(cx, IY + 2.2, -3.92);
      g.add(cat);
    }

    /* --- 中岛货架 ×2 --- */
    const shelfBoardMat = DIO.toon(0xd8dce6);
    const shelfEdgeMat = DIO.toon(0xff8c3a);
    const goodsMat = DIO.toon(0xffffff, {
      map: texShelfGoods(), emissive: 0xfff4e0, emissiveMap: texShelfGoods(), emissiveIntensity: 0.28,
    });
    for (const sx of [1.35, 2.75]) {
      const base = DIO.box(0.62, 0.3, 2.4, DIO.toon(0x8a93a5), 0.012);
      base.position.set(sx, IY + 0.15, -2.5);
      g.add(base);
      for (let lv = 0; lv < 4; lv++) {
        const y = IY + 0.36 + lv * 0.42;
        const board = DIO.box(0.62, 0.035, 2.4, shelfBoardMat, 0);
        board.position.set(sx, y, -2.5);
        g.add(board);
        for (const side of [-1, 1]) {
          const goods = new THREE.Mesh(new THREE.PlaneGeometry(2.28, 0.36), goodsMat);
          goods.position.set(sx + side * 0.315, y + 0.19, -2.5);
          goods.rotation.y = side * Math.PI / 2;
          g.add(goods);
        }
      }
      // 端板 + 顶
      for (const ez of [-1.28, 1.28]) {
        const end = DIO.box(0.62, 2.0, 0.05, DIO.toon(0xb8becc), 0);
        end.position.set(sx, IY + 1.0, -2.5 + ez);
        g.add(end);
      }
      const topSign = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3, 0.26),
        DIO.basic(sx < 2 ? 0xff8c3a : 0x5f9bff)
      );
      topSign.position.set(sx, IY + 1.98, -2.5);
      topSign.rotation.x = -0.12;
      g.add(topSign);
    }

    /* --- 便当·饭团冷柜（东墙） --- */
    const bentoBody = DIO.box(0.72, 0.92, 1.6, DIO.toon(0x4a566e), 0.014);
    bentoBody.position.set(4.35, IY + 0.46, -2.85);
    g.add(bentoBody);
    const bentoFront = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.6),
      DIO.toon(0xffffff, {
        map: texBentoCase(), emissive: 0xfff4dc, emissiveMap: texBentoCase(), emissiveIntensity: 0.5,
      })
    );
    bentoFront.rotation.y = -Math.PI / 2;
    bentoFront.position.set(3.99, IY + 0.52, -2.85);
    g.add(bentoFront);
    const bentoSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.3),
      DIO.basic(0xffffff, {
        map: DIO.texture(384, 96, function (ctx, W, H) {
          ctx.fillStyle = '#ff8c3a';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 46px ' + DIO.jpFont;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('お弁当 · おにぎり', W / 2, H / 2);
        }),
      })
    );
    bentoSign.rotation.y = -Math.PI / 2;
    bentoSign.position.set(3.98, IY + 1.06, -2.85);
    g.add(bentoSign);

    /* --- 收银台 --- */
    const counterTex = DIO.texture(512, 160, function (ctx, W, H) {
      ctx.fillStyle = '#d8d4c8';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#223a6e';
      ctx.fillRect(0, 0, W, 26);
      ctx.fillStyle = '#e84c4c';
      ctx.font = 'bold 56px ' + DIO.jpFont;
      ctx.textAlign = 'center';
      ctx.fillText('たばこ · アイス · 切手', W / 2, H * 0.66);
    });
    const counter = DIO.box(1.9, 0.92, 0.68, DIO.toon(0xd8d4c8), 0.014);
    counter.position.set(3.95, IY + 0.46, 0.85);
    g.add(counter);
    const counterFront = new THREE.Mesh(
      new THREE.PlaneGeometry(1.86, 0.62),
      DIO.toon(0xffffff, { map: counterTex, emissive: 0xffffff, emissiveMap: counterTex, emissiveIntensity: 0.22 })
    );
    counterFront.rotation.y = Math.PI;
    counterFront.position.set(3.95, IY + 0.42, 0.51);
    g.add(counterFront);
    const counterTop = DIO.box(1.98, 0.05, 0.74, DIO.toon(0xeeeadd), 0);
    counterTop.position.set(3.95, IY + 0.94, 0.85);
    g.add(counterTop);
    // 收银机
    const register = DIO.box(0.42, 0.3, 0.35, DIO.toon(0x39435a), 0);
    register.position.set(3.7, IY + 1.12, 0.85);
    g.add(register);
    const regScreen = DIO.box(0.3, 0.2, 0.03, DIO.basic(0x9fe8b8), 0);
    regScreen.position.set(3.7, IY + 1.3, 0.72);
    regScreen.rotation.x = -0.3;
    g.add(regScreen);
    // 咖啡机（收银台西端）
    const coffee = DIO.box(0.4, 0.56, 0.38, DIO.toon(0x8c3a34), 0.012);
    coffee.position.set(2.9, IY + 1.22, 0.85);
    g.add(coffee);
    const coffeeWin = DIO.box(0.22, 0.18, 0.02, DIO.basic(0xffd9a0), 0);
    coffeeWin.position.set(2.9, IY + 1.3, 0.66);
    g.add(coffeeWin);
    const coffeeCup = DIO.cyl(0.045, 0.035, 0.1, DIO.toon(0xeeeadd), 8, 0);
    coffeeCup.position.set(2.9, IY + 1.0, 0.78);
    g.add(coffeeCup);
    const coffeeSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.18),
      DIO.basic(0xffffff, {
        map: DIO.texture(256, 80, function (ctx, W, H) {
          ctx.fillStyle = '#5c3a28';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#ffe8c0';
          ctx.font = 'bold 34px ' + DIO.jpFont;
          ctx.textAlign = 'center';
          ctx.fillText('コーヒー100円', W / 2, 50);
        }),
      })
    );
    coffeeSign.position.set(2.9, IY + 1.56, 0.8);
    coffeeSign.rotation.x = -0.1;
    g.add(coffeeSign);

    /* --- 关东煮台（门内侧） --- */
    const oden = DIO.box(0.8, 0.62, 0.55, DIO.toon(0x8a5c3a), 0.012);
    oden.position.set(0.85, IY + 0.31, -0.95);
    g.add(oden);
    const pot = DIO.cyl(0.24, 0.2, 0.26, DIO.toon(0x2e2620), 14, 0);
    pot.position.set(0.85, IY + 0.72, -0.95);
    g.add(pot);
    const potLid = DIO.cyl(0.25, 0.25, 0.02, DIO.toon(0x6a7488), 14, 0);
    potLid.position.set(0.85, IY + 0.86, -0.95);
    g.add(potLid);
    const odenSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.22),
      DIO.basic(0xffffff, {
        map: DIO.texture(256, 80, function (ctx, W, H) {
          ctx.fillStyle = '#e84c4c';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 44px ' + DIO.jpFont;
          ctx.textAlign = 'center';
          ctx.fillText('おでん', W / 2, 52);
        }),
      })
    );
    odenSign.position.set(0.85, IY + 1.15, -0.95);
    odenSign.rotation.x = -0.1;
    g.add(odenSign);
    DIO.steamSpots = DIO.steamSpots || [];
    DIO.steamSpots.push({ obj: pot, x: 0.85, y: IY + 0.9, z: -0.95, scale: 0.7 });

    /* --- ATM（西窗边） --- */
    const atm = DIO.box(0.55, 1.5, 0.45, DIO.toon(0x4a6e8e), 0.014);
    atm.position.set(0.42, IY + 0.75, -2.1);
    g.add(atm);
    const atmScreen = DIO.box(0.3, 0.24, 0.02, DIO.basic(0x9fd8ff), 0);
    atmScreen.position.set(0.42, IY + 1.1, -1.86);
    atmScreen.rotation.x = -0.18;
    g.add(atmScreen);
    const atmSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.2),
      DIO.basic(0xffffff, {
        map: DIO.texture(200, 80, function (ctx, W, H) {
          ctx.fillStyle = '#223a6e';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#8fe0b8';
          ctx.font = 'bold 44px Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText('ATM', W / 2, 52);
        }),
      })
    );
    atmSign.position.set(0.42, IY + 1.62, -1.86);
    g.add(atmSign);

    /* --- 杂志架（东墙） --- */
    const magRack = DIO.box(0.28, 1.1, 1.3, DIO.toon(0x8a93a5), 0.012);
    magRack.position.set(4.88, IY + 0.55, -0.85);
    g.add(magRack);
    const magGoods = new THREE.Mesh(
      new THREE.PlaneGeometry(1.24, 0.5),
      DIO.toon(0xffffff, { map: texMagazines(), emissive: 0xffffff, emissiveMap: texMagazines(), emissiveIntensity: 0.3 })
    );
    magGoods.rotation.y = -Math.PI / 2;
    magGoods.position.set(4.73, IY + 0.62, -0.85);
    g.add(magGoods);

    /* --- 储物柜（东墙） --- */
    const lockers = DIO.box(0.32, 1.7, 0.8, DIO.toon(0x77839c), 0.012);
    lockers.position.set(4.89, IY + 0.85, -1.75);
    g.add(lockers);

    /* --- 后场门 + 纸箱（后墙东端） --- */
    const backDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.72, 1.95),
      DIO.toon(0x9aa5b8)
    );
    backDoor.position.set(4.45, IY + 0.98, -4.65);
    g.add(backDoor);
    const bdSign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.18),
      DIO.basic(0xffffff, {
        map: DIO.texture(256, 64, function (ctx, W, H) {
          ctx.fillStyle = '#545d70';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 30px ' + DIO.jpFont;
          ctx.textAlign = 'center';
          ctx.fillText('従業員専用', W / 2, 40);
        }),
      })
    );
    bdSign.position.set(4.45, IY + 1.9, -4.64);
    g.add(bdSign);
    // 纸箱堆
    const cardboardMat = DIO.toon(0xb89a6e);
    const cb1 = DIO.box(0.4, 0.32, 0.34, cardboardMat, 0.01);
    cb1.position.set(3.6, IY + 0.16, -4.4);
    cb1.rotation.y = 0.2;
    g.add(cb1);
    const cb2 = DIO.box(0.34, 0.26, 0.3, cardboardMat, 0.01);
    cb2.position.set(3.58, IY + 0.44, -4.42);
    cb2.rotation.y = -0.1;
    g.add(cb2);

    /* --- 墙面海报（冷柜上方 + 东墙） --- */
    const posterSpots = [
      [1.55, -4.6, 0, 0], [3.05, -4.6, 1, 0], [4.95, -4.2, 2, -Math.PI / 2],
    ];
    const posterTexes = [
      DIO.texture(220, 300, function (ctx, W, H) {
        ctx.fillStyle = '#f4ede0';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#e84c4c';
        ctx.fillRect(0, 0, W, 70);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 40px ' + DIO.jpFont;
        ctx.textAlign = 'center';
        ctx.fillText('新発売', W / 2, 48);
        ctx.fillStyle = '#ff8c3a';
        ctx.beginPath();
        ctx.arc(W / 2, 160, 62, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f4ede0';
        ctx.beginPath();
        ctx.arc(W / 2, 150, 48, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5c3a28';
        ctx.fillRect(W / 2 - 34, 128, 68, 40);
        ctx.fillStyle = '#8c6e4a';
        ctx.fillRect(W / 2 - 34, 168, 68, 16);
        ctx.fillStyle = '#223a6e';
        ctx.font = 'bold 28px ' + DIO.jpFont;
        ctx.fillText('新作弁当', W / 2, 260);
      }),
      DIO.texture(220, 300, function (ctx, W, H) {
        ctx.fillStyle = '#fdf3e0';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#35c46e';
        ctx.fillRect(0, 0, W, 64);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 38px ' + DIO.jpFont;
        ctx.textAlign = 'center';
        ctx.fillText('半額セール', W / 2, 44);
        ctx.fillStyle = '#e84c4c';
        ctx.font = 'bold 84px ' + DIO.jpFont;
        ctx.fillText('50', W / 2, 170);
        ctx.font = 'bold 60px ' + DIO.jpFont;
        ctx.fillText('％', W / 2, 245);
        ctx.fillStyle = '#545d70';
        ctx.font = 'bold 24px ' + DIO.jpFont;
        ctx.fillText('お惣菜コーナー', W / 2, 280);
      }),
      DIO.texture(220, 300, function (ctx, W, H) {
        ctx.fillStyle = '#eef2fa';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#5f9bff';
        ctx.fillRect(0, 0, W, 64);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 36px ' + DIO.jpFont;
        ctx.textAlign = 'center';
        ctx.fillText('お得情報', W / 2, 44);
        ctx.fillStyle = '#223a6e';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(24, 100 + i * 44, W - 48, 10);
          ctx.fillStyle = '#8a93a5';
          ctx.fillRect(24, 118 + i * 44, (W - 48) * 0.6, 8);
          ctx.fillStyle = '#223a6e';
        }
      }),
    ];
    for (const [px, pz, ti, ry] of posterSpots) {
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(0.44, 0.6),
        DIO.toon(0xffffff, { map: posterTexes[ti], emissive: 0xffffff, emissiveMap: posterTexes[ti], emissiveIntensity: 0.35 })
      );
      poster.rotation.y = ry || 0;
      poster.position.set(px, 2.55, pz);
      g.add(poster);
    }

    /* --- 室内灯箱（后墙高处横幅） --- */
    const wallBanner = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 0.34),
      DIO.basic(0xffffff, {
        map: DIO.texture(1024, 128, function (ctx, W, H) {
          const grd = ctx.createLinearGradient(0, 0, W, 0);
          grd.addColorStop(0, '#223a6e');
          grd.addColorStop(1, '#5f9bff');
          ctx.fillStyle = grd;
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 52px ' + DIO.jpFont;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('お客様感謝デー · ポイント5倍', W / 2, H / 2);
        }),
      })
    );
    wallBanner.position.set(2.2, 2.6, -4.63);
    g.add(wallBanner);

    /* --- 店内主灯 --- */
    const interiorLight = new THREE.PointLight(0xffdca8, 46, 9.5, 2);
    interiorLight.position.set(2.4, 2.15, -2.3);
    g.add(interiorLight);
    const counterLight = new THREE.PointLight(0xffe8c8, 16, 5, 2);
    counterLight.position.set(3.8, 1.9, 0.4);
    g.add(counterLight);
    // 门口溢出光（随门开合增强）
    const spillLight = new THREE.PointLight(0xffd9a0, 6, 6, 2);
    spillLight.position.copy(doorCenter).addScaledVector(outDir, 0.9);
    spillLight.position.y = 1.8;
    spillLight.userData.baseIntensity = 6;
    g.add(spillLight);
    DIO.animate(function () {
      spillLight.intensity = 6 + DIO.doorOpenFactor() * 9;
    });

    /* --- 雨伞架（门外右侧） --- */
    const umbStand = DIO.cyl(0.16, 0.16, 0.7, DIO.toon(0x545d70), 12, 0.01);
    umbStand.position.set(1.62, 0.35, 0.42);
    g.add(umbStand);
    const umbColors = [0x2e4a7e, 0xb03030];
    for (let i = 0; i < 2; i++) {
      const um = new THREE.Group();
      const shaft = DIO.cyl(0.022, 0.022, 0.78, DIO.toon(umbColors[i]), 8, 0);
      um.add(shaft);
      const tip = DIO.cyl(0.008, 0.022, 0.1, DIO.toon(umbColors[i]), 8, 0);
      tip.position.y = 0.42;
      um.add(tip);
      um.position.set(1.56 + i * 0.13, 0.42, 0.4 + i * 0.05);
      um.rotation.z = 0.1 - i * 0.16;
      um.rotation.x = 0.06;
      g.add(um);
    }

    /* --- 店前垃圾桶 ×2 --- */
    for (let i = 0; i < 2; i++) {
      const bin = DIO.cyl(0.2, 0.17, 0.58, DIO.toon(i ? 0x4a7e5a : 0x4a6e9e), 12, 0.012);
      bin.position.set(4.62 - i * 0.48, 0.29, 0.52);
      g.add(bin);
      const lid = DIO.cyl(0.21, 0.2, 0.07, DIO.toon(0x39435a), 12, 0.01);
      lid.position.set(4.62 - i * 0.48, 0.61, 0.52);
      g.add(lid);
    }

    /* --- 注册门/招牌/玻璃的雨滴挂点 --- */
    DIO.dripSpots = [
      { x: 4.8 + 1.5, y: 2.52, z: -0.8 + 1.06 },   // 雨棚前沿
      { x: 4.8 + 3.3, y: 2.52, z: -0.8 + 1.06 },
      { x: 4.8 + 4.7, y: 2.52, z: -0.8 + 1.06 },
      { x: 4.7, y: H + 0.28 + 0.18, z: -2.4 },      // 屋顶檐
      { x: 4.8, y: 2.6, z: -4.6 },
      { x: 9.6, y: 2.6, z: -4.6 },
    ];
    DIO.doorInfo = { center: doorCenter.clone().add(g.position), dir: doorDir, out: outDir };
  }

  DIO.builders.push(buildStore);
})();
