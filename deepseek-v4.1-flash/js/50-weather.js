/* ------------------------------------------------------------------
   50-weather.js  --  the rain: falling streaks (GPU), impact ripples
                      on the wet ground, and drips off the canopy and
                      the sign band.
------------------------------------------------------------------ */
(function (RN) {
  'use strict';

  var L = RN.L;
  var S = L.STORE;

  /* ===============================================================
     RAIN STREAKS
     =============================================================== */
  RN.buildRain = function (scene) {
    var COUNT = 2600;
    var H = 18;
    var AREA = 13;

    var pos = new Float32Array(COUNT * 2 * 3);
    var end = new Float32Array(COUNT * 2);
    var rnd = new Float32Array(COUNT * 2);

    for (var i = 0; i < COUNT; i++) {
      var x = RN.rand(-AREA, AREA);
      var z = RN.rand(-AREA, AREA);
      var y = RN.rand(0, H);
      var r = RN.rnd();
      for (var v = 0; v < 2; v++) {
        var k = i * 2 + v;
        pos[k * 3 + 0] = x;
        pos[k * 3 + 1] = y;
        pos[k * 3 + 2] = z;
        end[k] = v;
        rnd[k] = r;
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);

    var mat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTime: { value: 0 },
        uHeight: { value: H },
        uLen: { value: 0.46 },
        uWind: { value: 0.16 },
        uSpeed: { value: 20.0 },
        uColor: { value: new THREE.Color(0x9dc4ff) },
        uBoxMin: { value: new THREE.Vector3(S.x0 - 0.2, -1, S.z0 - 0.2) },
        uBoxMax: { value: new THREE.Vector3(S.x1 + 0.2, 99, S.z1 + 0.2) },
        uRoofY: { value: L.SIGN_TOP + 0.1 }
      },
      vertexShader: [
        'attribute float aEnd;',
        'attribute float aRnd;',
        'uniform float uTime, uHeight, uLen, uWind, uSpeed, uRoofY;',
        'uniform vec3 uBoxMin, uBoxMax;',
        'varying float vAlpha;',
        'void main() {',
        '  float speed = uSpeed * (0.75 + aRnd * 0.6);',
        '  float y = mod(position.y - uTime * speed, uHeight);',
        '  vec3 p = vec3(position.x, y, position.z);',
        '  p.y -= aEnd * uLen * (0.55 + aRnd * 0.9);',
        '  p.x += aEnd * uWind * (0.5 + aRnd);',
        '  float inside = step(uBoxMin.x, position.x) * step(position.x, uBoxMax.x)',
        '               * step(uBoxMin.z, position.z) * step(position.z, uBoxMax.z)',
        '               * step(y, uRoofY);',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  float d = length(mv.xyz);',
        '  float fade = smoothstep(2.5, 8.5, d) * (1.0 - smoothstep(22.0, 46.0, d));',
        '  vAlpha = (1.0 - inside) * (0.11 + aRnd * 0.30) * fade;',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'varying float vAlpha;',
        'void main() { gl_FragColor = vec4(uColor, vAlpha); }'
      ].join('\n')
    });

    var rain = new THREE.LineSegments(geo, mat);
    rain.frustumCulled = false;
    rain.name = 'rain';
    rain.renderOrder = 5;
    scene.add(rain);

    return { object: rain, material: mat };
  };

  /* ===============================================================
     IMPACT RIPPLES
     =============================================================== */
  function ringTexture() {
    var s = 128;
    var c = document.createElement('canvas');
    c.width = c.height = s;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0.00, 'rgba(255,255,255,0)');
    g.addColorStop(0.52, 'rgba(255,255,255,0)');
    g.addColorStop(0.70, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.80, 'rgba(255,255,255,1)');
    g.addColorStop(0.90, 'rgba(255,255,255,0.30)');
    g.addColorStop(1.00, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, s, s);
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
    return t;
  }

  function randomGround() {
    var x, z;
    for (var i = 0; i < 24; i++) {
      x = RN.rand(-L.HALF + 0.4, L.HALF - 0.4);
      z = RN.rand(-L.HALF + 0.4, L.HALF - 0.4);
      if (x > S.x0 - 0.1 && x < S.x1 + 0.1 && z > S.z0 - 0.1 && z < S.z1 + 0.1) continue;
      var onWalk =
        (x >= L.walkX0 && x <= L.walkX1 && z >= L.walkZ0) ||
        (z >= L.walkZ0 && z <= L.walkZ1 && x <= L.walkX0) ||
        (x >= L.farX0 && x <= L.farX1) ||
        (z >= L.farZ0 && z <= L.farZ1);
      var y = onWalk ? L.WALK_Y + 0.012 : 0.03;
      return new THREE.Vector3(x, y, z);
    }
    return new THREE.Vector3(3, 0.03, 3);
  }

  RN.buildRipples = function (scene) {
    var tex = ringTexture();
    var MAX = 70;
    var pool = [];
    var root = RN.group(scene, 'ripples');
    var geo = new THREE.PlaneGeometry(1, 1);

    for (var i = 0; i < MAX; i++) {
      var mat = new THREE.MeshBasicMaterial({
        map: tex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
        color: 0xa8c8ff, fog: true
      });
      var m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      m.renderOrder = 4;
      root.add(m);
      pool.push({ mesh: m, mat: mat, life: 0, dur: 0.8, size: 0.6, active: false });
    }

    var next = 0;
    var acc = 0;

    function spawn(x, y, z, size, dur, color) {
      var r = pool[next];
      next = (next + 1) % MAX;
      r.active = true;
      r.life = 0;
      r.dur = dur;
      r.size = size;
      r.mesh.visible = true;
      r.mesh.position.set(x, y, z);
      r.mat.color.setHex(color === undefined ? 0xa8c8ff : color);
      r.mat.opacity = 0.55;
      r.mesh.scale.set(size * 0.25, size * 0.25, 1);
    }

    function update(dt) {
      acc += dt;
      var rate = 0.011;
      while (acc > rate) {
        acc -= rate;
        var p = randomGround();
        spawn(p.x, p.y, p.z, RN.rand(0.35, 0.85), RN.rand(0.55, 0.95));
      }
      for (var i = 0; i < MAX; i++) {
        var r = pool[i];
        if (!r.active) continue;
        r.life += dt;
        var t = r.life / r.dur;
        if (t >= 1) {
          r.active = false;
          r.mesh.visible = false;
          continue;
        }
        var e = 1 - Math.pow(1 - t, 2.2);
        var s = r.size * (0.18 + e * 0.82);
        r.mesh.scale.set(s, s, 1);
        r.mat.opacity = (1 - t) * (1 - t) * 0.6;
      }
    }

    return { root: root, spawn: spawn, update: update };
  };

  /* ===============================================================
     DRIPS (canopy + sign band)
  --------------------------------------------------------------- */
  RN.buildDrips = function (scene, ripples) {
    var root = RN.group(scene, 'drips');
    var geo = new THREE.SphereGeometry(0.028, 7, 6);
    var mat = new THREE.MeshBasicMaterial({ color: 0xcfe4ff, transparent: true, opacity: 0.85, fog: true });

    /* emitter points: x, y, z, groundY */
    var emitters = [];
    var i;
    for (i = 0; i < 5; i++) {
      emitters.push({ p: new THREE.Vector3(0.95, 2.60, -4.75 + i * 0.58), gy: L.WALK_Y + 0.012 });
    }
    for (i = 0; i < 5; i++) {
      emitters.push({ p: new THREE.Vector3(-0.56, 3.32, -1.2 - i * 1.7), gy: L.WALK_Y + 0.012 });
    }
    for (i = 0; i < 4; i++) {
      emitters.push({ p: new THREE.Vector3(-1.4 - i * 1.8, 3.32, -0.56), gy: L.WALK_Y + 0.012 });
    }

    var MAX = 26;
    var pool = [];
    for (i = 0; i < MAX; i++) {
      var m = new THREE.Mesh(geo, mat);
      m.visible = false;
      m.renderOrder = 5;
      root.add(m);
      pool.push({ mesh: m, active: false, t: 0, dur: 1, from: 0, to: 0, x: 0, z: 0, gy: 0 });
    }

    var next = 0;
    var acc = 0;

    function spawnOne() {
      var e = emitters[Math.floor(RN.rnd() * emitters.length)];
      var r = pool[next];
      next = (next + 1) % MAX;
      r.active = true;
      r.t = 0;
      r.from = e.p.y;
      r.to = e.gy;
      r.dur = 0.30 + (e.p.y - e.gy) * 0.045;
      r.x = e.p.x + RN.rand(-0.03, 0.03);
      r.z = e.p.z + RN.rand(-0.03, 0.03);
      r.gy = e.gy;
      r.mesh.visible = true;
      r.mesh.position.set(r.x, r.from, r.z);
      r.mesh.scale.set(1, 2.2, 1);
    }

    function update(dt) {
      acc += dt;
      while (acc > 0.085) {
        acc -= 0.085;
        spawnOne();
      }
      for (var k = 0; k < MAX; k++) {
        var r = pool[k];
        if (!r.active) continue;
        r.t += dt;
        var t = r.t / r.dur;
        if (t >= 1) {
          r.active = false;
          r.mesh.visible = false;
          if (ripples) ripples.spawn(r.x, r.gy + 0.002, r.z, 0.42, 0.6, 0xcfe4ff);
          continue;
        }
        r.mesh.position.y = r.from + (r.to - r.from) * (t * t);
        r.mesh.scale.y = 2.2 - t * 1.1;
      }
    }

    return { root: root, update: update };
  };

  /* ===============================================================
     BUNDLE
  =============================================================== */
  RN.buildWeather = function (scene) {
    var rain = RN.buildRain(scene);
    var ripples = RN.buildRipples(scene);
    var drips = RN.buildDrips(scene, ripples);

    return {
      rain: rain,
      ripples: ripples,
      drips: drips,
      update: function (dt, t, camera) {
        rain.material.uniforms.uTime.value = t;
        ripples.update(dt);
        drips.update(dt);
      }
    };
  };

})(window.RN);
