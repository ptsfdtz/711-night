/* =========================================================================
 * effects.js — 三渲二氛围：光晕 / 地面光池 / 湿路反射光带 / 蒸汽 / 灯锥
 * （DIO.glowSource / poolSource / streakSource 由其它模块在构建期调用）
 * ========================================================================= */
(function () {
  'use strict';
  const DIO = window.DIO;

  /* ---------------- 贴图 ---------------- */
  function glowTexture() {
    return DIO.texture(128, 128, function (ctx, W, H) {
      const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.18)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  }
  function poolTexture() {
    return DIO.texture(128, 128, function (ctx, W, H) {
      const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      g.addColorStop(0, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.3)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  }
  function streakTexture() {
    return DIO.texture(64, 256, function (ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.42, 'rgba(255,255,255,0.55)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.58, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(W * 0.28, 0, W * 0.44, H);
      // 边缘柔化
      const g2 = ctx.createLinearGradient(0, 0, W, 0);
      g2.addColorStop(0, 'rgba(0,0,0,1)');
      g2.addColorStop(0.5, 'rgba(0,0,0,0)');
      g2.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    });
  }
  function steamTexture() {
    return DIO.texture(64, 64, function (ctx, W, H) {
      const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,0.7)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.25)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    });
  }

  const GLOW_TEX = glowTexture();
  const POOL_TEX = poolTexture();
  const STREAK_TEX = streakTexture();
  const STEAM_TEX = steamTexture();

  /* ---------------- 光晕（广告牌式辉光） ---------------- */
  DIO.glowSource = function (cfg) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: GLOW_TEX,
      color: cfg.color,
      transparent: true,
      opacity: cfg.opacity == null ? 0.4 : cfg.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    sprite.position.copy(cfg.pos);
    sprite.scale.setScalar(cfg.size || 1.5);
    sprite.userData.baseOpacity = cfg.opacity == null ? 0.4 : cfg.opacity;
    sprite.renderOrder = 8;
    DIO.scene.add(sprite);
    DIO.glows.push(sprite);
    return sprite;
  };

  /* ---------------- 地面光池 ---------------- */
  DIO.poolSource = function (cfg) {
    const mat = new THREE.MeshBasicMaterial({
      map: POOL_TEX,
      color: cfg.color,
      transparent: true,
      opacity: cfg.opacity == null ? 0.3 : cfg.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.w, cfg.l), mat);
    mesh.rotation.x = -Math.PI / 2;
    if (cfg.rot) mesh.rotation.z = cfg.rot;
    mesh.position.set(cfg.x, cfg.y == null ? 0.055 : cfg.y, cfg.z);
    mesh.renderOrder = 4;
    mesh.userData.baseOpacity = cfg.opacity == null ? 0.3 : cfg.opacity;
    DIO.scene.add(mesh);
    DIO.pools.push({ mesh: mesh, baseOpacity: cfg.opacity == null ? 0.3 : cfg.opacity, phase: DIO.rand() * 6.28 });
    return mesh;
  };

  /* ---------------- 湿路反射光带（朝向相机） ---------------- */
  DIO.streakSource = function (cfg) {
    const mat = new THREE.MeshBasicMaterial({
      map: STREAK_TEX,
      color: cfg.color,
      transparent: true,
      opacity: cfg.intensity == null ? 0.6 : cfg.intensity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.length, cfg.width), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(cfg.x, cfg.y == null ? 0.045 : cfg.y, cfg.z);
    mesh.renderOrder = 5;
    mesh.userData.center = new THREE.Vector3(cfg.x, 0, cfg.z);
    DIO.scene.add(mesh);
    DIO.streaks.push({ mesh: mesh, baseOpacity: cfg.intensity == null ? 0.6 : cfg.intensity });
    return mesh;
  };

  DIO.animate(function () {
    const cam = DIO.camera;
    if (!cam) return;
    for (const s of DIO.streaks) {
      const dx = cam.position.x - s.mesh.position.x;
      const dz = cam.position.z - s.mesh.position.z;
      s.mesh.rotation.y = Math.atan2(-dz, dx);
    }
    // 光池轻微呼吸
    for (const p of DIO.pools) {
      // 静态即可，避免过强闪烁
    }
  });

  /* ---------------- 灯光锥（体积感） ---------------- */
  function lightCone(x, y, z, h, r, color, opacity) {
    const geo = new THREE.ConeGeometry(r, h, 18, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const cone = new THREE.Mesh(geo, mat);
    cone.position.set(x, y - h / 2, z);
    cone.renderOrder = 6;
    DIO.scene.add(cone);
    return cone;
  }

  /* ---------------- 蒸汽 ---------------- */
  function buildSteam() {
    const spots = DIO.steamSpots || [];
    // 屋顶排风蒸汽
    spots.push({ x: 6.4, y: 3.62, z: -4.6, scale: 0.9 });
    const sprites = [];
    for (const s of spots) {
      for (let i = 0; i < 4; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: STEAM_TEX,
          color: 0xe8ecf4,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }));
        sp.userData = { spot: s, phase: i / 4 + DIO.rand() * 0.2, seed: DIO.rand() * 6.28 };
        sp.renderOrder = 9;
        DIO.scene.add(sp);
        sprites.push(sp);
      }
    }
    DIO.animate(function (t) {
      for (const sp of sprites) {
        const u = sp.userData;
        const ph = (t * 0.24 + u.phase) % 1;
        const s = u.spot;
        const sc = (s.scale || 1);
        sp.position.set(
          s.x + Math.sin(t * 0.9 + u.seed) * 0.06 * (0.3 + ph) * sc,
          s.y + ph * 1.05 * sc,
          s.z + Math.cos(t * 0.7 + u.seed) * 0.05 * (0.3 + ph) * sc
        );
        const sc2 = (0.14 + ph * 0.5) * sc * 2;
        sp.scale.set(sc2, sc2, 1);
        sp.material.opacity = Math.sin(Math.PI * Math.min(1, ph * 1.4)) * 0.32;
      }
    });
  }

  /* ---------------- 构建期氛围补光 ---------------- */
  function buildAtmosphere() {
    // 便利店橱窗暖光
    DIO.glowSource({ pos: new THREE.Vector3(8.0, 1.5, -0.55), color: 0xffdca0, size: 3.4, opacity: 0.4 });
    DIO.glowSource({ pos: new THREE.Vector3(4.55, 1.5, -2.9), color: 0xffdca0, size: 2.4, opacity: 0.3 });
    // 店前光池（暖）
    DIO.poolSource({ x: 7.6, z: 0.15, y: 0.2, w: 4.6, l: 1.5, color: 0xffd9a0, opacity: 0.3, rot: 0 });
    DIO.poolSource({ x: 4.35, z: -2.9, y: 0.2, w: 1.6, l: 3.4, color: 0xffd9a0, opacity: 0.22 });
    DIO.streakSource({ x: 7.3, y: 0.055, z: 2.3, color: 0xffca8a, intensity: 0.55, width: 1.3, length: 4.5 });
    DIO.streakSource({ x: 3.6, y: 0.05, z: -2.9, color: 0xffca8a, intensity: 0.4, width: 0.8, length: 3.0 });

    // 招牌光晕（连到闪烁源）
    if (DIO.signFlicker) {
      const s1 = DIO.glowSource({ pos: new THREE.Vector3(7.5, 4.4, -2.4), color: 0xffc88a, size: 2.6, opacity: 0.5 });
      DIO.signFlicker.sprites = DIO.signFlicker.sprites || [];
      DIO.signFlicker.sprites.push(s1);
    }
    if (DIO.bandFlicker) { /* band 已有 emissive 呼吸 */ }
    if (DIO.neonRed) {
      const s2 = DIO.glowSource({ pos: new THREE.Vector3(-7.0, 4.2, -0.78), color: 0xff6a7a, size: 1.6, opacity: 0.45 });
      DIO.neonRed.sprites = DIO.neonRed.sprites || [];
      DIO.neonRed.sprites.push(s2);
    }
    if (DIO.neonBlue) {
      const s3 = DIO.glowSource({ pos: new THREE.Vector3(-3.55, 6.6, -2.2), color: 0x69d2ff, size: 2.4, opacity: 0.4 });
      DIO.neonBlue.sprites = DIO.neonBlue.sprites || [];
      DIO.neonBlue.sprites.push(s3);
    }
    if (DIO.neonGreen) {
      DIO.glowSource({ pos: new THREE.Vector3(-1.8, 3.3, -2.8), color: 0x4de08a, size: 1.2, opacity: 0.4 });
    }
    if (DIO.neonCyan) {
      DIO.glowSource({ pos: new THREE.Vector3(3.3, 2.7, 5.8), color: 0x69d2ff, size: 1.2, opacity: 0.4 });
    }
    if (DIO.lanternGlow) {
      DIO.glowSource({ pos: new THREE.Vector3(-8.3, 2.8, 5.9), color: 0xff9a50, size: 2.0, opacity: 0.5 });
      DIO.glowSource({ pos: new THREE.Vector3(-8.3, 2.8, 5.9), color: 0xff9a50, size: 3.4, opacity: 0.22 });
    }

    // 路灯锥
    lightCone(-0.4, 4.9, 1.5, 4.4, 1.35, 0xa8c8f0, 0.05);
    lightCone(-4.5, 4.9, 3.9, 4.3, 1.25, 0xa8c8f0, 0.045);
    lightCone(3.5, 4.9, -4.4, 4.3, 1.1, 0xa8c8f0, 0.035);
    // 拉面店灯笼小暖锥
    lightCone(-8.25, 2.8, 5.85, 2.2, 0.7, 0xff9a50, 0.05);
    // 贩卖机微锥
    lightCone(-6.15, 1.9, -0.1, 1.6, 0.45, 0xffb0a0, 0.05);
    lightCone(-5.25, 1.9, -0.1, 1.6, 0.45, 0x8ad8ff, 0.05);
  }

  DIO.builders.push(function (scene) {
    DIO.scene = scene;
    buildAtmosphere();
    buildSteam();
  });
})();
