/* =========================================================================
 * rain.js — 雨幕 / 檐口滴水 / 地面溅落涟漪
 * ========================================================================= */
(function () {
  'use strict';
  const DIO = window.DIO;

  const RAIN_TOP = 12.5;
  const RAIN_EXT = 10.8;

  /* ---------------- 贴图 ---------------- */
  function streakTexture() {
    return DIO.texture(32, 128, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(190,208,238,0)');
      g.addColorStop(0.5, 'rgba(190,208,238,0.9)');
      g.addColorStop(1, 'rgba(190,208,238,0)');
      ctx.fillStyle = g;
      ctx.fillRect(W * 0.42, 0, W * 0.16, H);
    });
  }
  function ringTexture() {
    return DIO.texture(64, 64, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(190,214,245,0.9)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(32, 32, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(190,214,245,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(32, 32, 18, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  function dropTexture() {
    return DIO.texture(16, 48, function (ctx, W, H) {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(200,218,245,0)');
      g.addColorStop(0.65, 'rgba(200,218,245,0.85)');
      g.addColorStop(1, 'rgba(220,232,255,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(W * 0.36, 0, W * 0.28, H * 0.92);
      ctx.fillStyle = 'rgba(220,232,255,0.95)';
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.93, W * 0.22, H * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* ---------------- 雨幕 ---------------- */
  function buildRain(scene) {
    const N = 1000;
    const pos = new Float32Array(N * 3);
    const spd = new Float32Array(N);
    const size = new Float32Array(N);
    const sb = DIO.storeBounds;
    let i = 0;
    let guard = 0;
    while (i < N && guard++ < N * 20) {
      const x = DIO.range(-RAIN_EXT, RAIN_EXT);
      const z = DIO.range(-RAIN_EXT, RAIN_EXT);
      // 便利店内部不落雨
      if (x > sb.x0 - 0.2 && x < sb.x1 + 0.2 && z > sb.z0 - 0.2 && z < sb.z1 + 0.2) continue;
      pos[i * 3] = x;
      pos[i * 3 + 1] = DIO.range(0, RAIN_TOP);
      pos[i * 3 + 2] = z;
      spd[i] = DIO.range(0.85, 1.35);
      size[i] = DIO.range(0.7, 1.7);
      i++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

    const uni = { uTime: { value: 0 }, uTex: { value: streakTexture() } };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        'attribute float aSpeed;',
        'attribute float aSize;',
        'uniform float uTime;',
        'varying float vFade;',
        'void main(){',
        '  vec3 p = position;',
        '  p.y = mod(p.y - uTime * aSpeed * 9.0, ' + RAIN_TOP.toFixed(1) + ');',
        '  p.x = mod(p.x + uTime * 0.55 + ' + RAIN_EXT.toFixed(1) + ', ' + (RAIN_EXT * 2).toFixed(1) + ') - ' + RAIN_EXT.toFixed(1) + ';',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  vFade = smoothstep(2.0, 6.0, -mv.z) * (0.55 + 0.45 * aSpeed);',
        '  gl_PointSize = aSize * (430.0 / -mv.z);',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex;',
        'varying float vFade;',
        'void main(){',
        '  vec4 t = texture2D(uTex, gl_PointCoord);',
        '  gl_FragColor = vec4(vec3(0.62, 0.71, 0.9), t.a * 0.42 * vFade);',
        '}',
      ].join('\n'),
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = 7;
    scene.add(points);
    DIO.animate(function (t) { uni.uTime.value = t; });
  }

  /* ---------------- 檐口滴水（水滴下落 + 落地涟漪环） ---------------- */
  function buildDrips(scene) {
    const spots = (DIO.dripSpots || []).slice();
    // 追加：建筑檐口 / 贩卖机顶 / 路口招牌
    spots.push(
      { x: -8.15, y: 7.05, z: -0.85 }, { x: -7.0, y: 7.05, z: -0.85 },
      { x: -1.95, y: 8.45, z: -1.0 }, { x: -1.95, y: 8.45, z: -4.0 },
      { x: -3.0, y: 5.65, z: -0.85 }, { x: -4.2, y: 5.65, z: -0.85 },
      { x: -6.15, y: 2.14, z: -0.05 }, { x: -5.25, y: 2.14, z: -0.05 },
      { x: 2.7, y: 4.65, z: -1.6 },
      { x: -9.2, y: 2.82, z: 5.68 }, { x: -7.4, y: 2.82, z: 5.68 }
    );
    for (const s of spots) {
      s.groundY = 0.05;
      // 人行道区域抬高落点
      if (s.z > 4.9) s.groundY = 0.19;                       // 南侧街区
      if (s.z < -0.9 && s.x < -1.8 && s.x > -10) s.groundY = 0.19; // NW 街区
      if (s.z > -0.9 && s.z < 0 && s.x > 3.9) s.groundY = 0.19;    // NE 店前
      if (s.z < -0.85 && s.z > -5.7 && s.x > 4.7 && s.x < 10) s.groundY = 0.185; // 店后
      s.next = DIO.range(0, 4);
    }

    const MAX_DROPS = 48;
    const dropPos = new Float32Array(MAX_DROPS * 3);
    const dropAlpha = new Float32Array(MAX_DROPS);
    const drops = [];
    const dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute('position', new THREE.BufferAttribute(dropPos, 3));
    dropGeo.setAttribute('aAlpha', new THREE.BufferAttribute(dropAlpha, 1));
    const dropMat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: dropTexture() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        'attribute float aAlpha;',
        'varying float vA;',
        'void main(){',
        '  vA = aAlpha;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = (14.0 + 26.0 * vA) * (300.0 / -mv.z) * 0.08;',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex;',
        'varying float vA;',
        'void main(){',
        '  vec4 t = texture2D(uTex, gl_PointCoord);',
        '  gl_FragColor = vec4(vec3(0.7, 0.8, 0.95), t.a * 0.8 * vA);',
        '}',
      ].join('\n'),
    });
    const dropPoints = new THREE.Points(dropGeo, dropMat);
    dropPoints.frustumCulled = false;
    dropPoints.renderOrder = 7;
    scene.add(dropPoints);

    const MAX_RINGS = 48;
    const ringPos = new Float32Array(MAX_RINGS * 3);
    const ringLife = new Float32Array(MAX_RINGS);
    const rings = [];
    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3));
    ringGeo.setAttribute('aLife', new THREE.BufferAttribute(ringLife, 1));
    const ringMat = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: ringTexture() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        'attribute float aLife;',
        'varying float vL;',
        'void main(){',
        '  vL = aLife;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = (8.0 + 30.0 * vL) * (300.0 / -mv.z) * 0.08;',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex;',
        'varying float vL;',
        'void main(){',
        '  vec4 t = texture2D(uTex, gl_PointCoord);',
        '  gl_FragColor = vec4(vec3(0.65, 0.78, 0.95), t.a * 0.55 * (1.0 - vL) * (1.0 - vL));',
        '}',
      ].join('\n'),
    });
    const ringPoints = new THREE.Points(ringGeo, ringMat);
    ringPoints.frustumCulled = false;
    ringPoints.renderOrder = 7;
    scene.add(ringPoints);

    DIO.animate(function (t, dt) {
      dt = Math.min(dt || 0.016, 0.05);
      // 生成
      for (const s of spots) {
        s.next -= dt;
        if (s.next <= 0 && drops.length < MAX_DROPS - 2) {
          drops.push({
            x: s.x + DIO.range(-0.08, 0.08),
            y: s.y,
            z: s.z + DIO.range(-0.08, 0.08),
            vy: DIO.range(0, 0.4),
            gy: s.groundY,
          });
          s.next = DIO.range(0.6, 4.5);
        }
      }
      // 更新下落
      for (let d = drops.length - 1; d >= 0; d--) {
        const dr = drops[d];
        dr.vy += 16 * dt;
        dr.y -= dr.vy * dt;
        if (dr.y <= dr.gy) {
          if (rings.length < MAX_RINGS) {
            rings.push({ x: dr.x, y: dr.gy + 0.03, z: dr.z, life: 0 });
          }
          drops.splice(d, 1);
        }
      }
      // 更新涟漪
      for (let r = rings.length - 1; r >= 0; r--) {
        rings[r].life += dt * 1.4;
        if (rings[r].life >= 1) rings.splice(r, 1);
      }
      // 写入缓冲
      for (let d = 0; d < MAX_DROPS; d++) {
        if (d < drops.length) {
          dropPos[d * 3] = drops[d].x;
          dropPos[d * 3 + 1] = drops[d].y;
          dropPos[d * 3 + 2] = drops[d].z;
          dropAlpha[d] = 0.35 + 0.65 * Math.min(1, drops[d].vy / 3);
        } else {
          dropAlpha[d] = 0;
          dropPos[d * 3 + 1] = -50;
        }
      }
      for (let r = 0; r < MAX_RINGS; r++) {
        if (r < rings.length) {
          ringPos[r * 3] = rings[r].x;
          ringPos[r * 3 + 1] = rings[r].y;
          ringPos[r * 3 + 2] = rings[r].z;
          ringLife[r] = rings[r].life;
        } else {
          ringLife[r] = 1;
          ringPos[r * 3 + 1] = -50;
        }
      }
      dropGeo.attributes.position.needsUpdate = true;
      dropGeo.attributes.aAlpha.needsUpdate = true;
      ringGeo.attributes.position.needsUpdate = true;
      ringGeo.attributes.aLife.needsUpdate = true;
    });
  }

  /* ---------------- 全场地面雨溅微光 ---------------- */
  function buildGroundSplash(scene) {
    const N = 150;
    const pos = new Float32Array(N * 3);
    const phase = new Float32Array(N);
    const rate = new Float32Array(N);
    const sb = DIO.storeBounds;
    let i = 0;
    let guard = 0;
    while (i < N && guard++ < N * 20) {
      const x = DIO.range(-10, 10);
      const z = DIO.range(-10, 10);
      if (x > sb.x0 && x < sb.x1 && z > sb.z0 && z < sb.z1) continue;
      if (x > 4.8 && x < 10 && z > -5.6 && z < -0.8) continue;
      pos[i * 3] = x;
      pos[i * 3 + 1] = (z > 4.9 || z < -0.9 || (x < -1.8 && x > -10) || (x > 3.9 && z > -0.9 && z < 0)) ? 0.195 : 0.06;
      pos[i * 3 + 2] = z;
      phase[i] = DIO.rand();
      rate[i] = DIO.range(0.5, 1.1);
      i++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geo.setAttribute('aRate', new THREE.BufferAttribute(rate, 1));
    const uni = { uTime: { value: 0 }, uTex: { value: ringTexture() } };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        'attribute float aPhase;',
        'attribute float aRate;',
        'uniform float uTime;',
        'varying float vL;',
        'void main(){',
        '  float ph = fract(uTime * aRate * 0.45 + aPhase);',
        '  vL = ph;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = (5.0 + 22.0 * ph) * (300.0 / -mv.z) * 0.08;',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D uTex;',
        'varying float vL;',
        'void main(){',
        '  vec4 t = texture2D(uTex, gl_PointCoord);',
        '  gl_FragColor = vec4(vec3(0.62, 0.75, 0.92), t.a * 0.3 * (1.0 - vL) * (1.0 - vL));',
        '}',
      ].join('\n'),
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 7;
    scene.add(pts);
    DIO.animate(function (t) { uni.uTime.value = t; });
  }

  DIO.builders.push(function (scene) {
    buildRain(scene);
    buildDrips(scene);
    buildGroundSplash(scene);
  });
})();
