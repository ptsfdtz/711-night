/* ------------------------------------------------------------------
   20-world.js  --  diorama layout, sky, lighting, ground, roads,
                    markings, puddles and the buildings that frame
                    the little square base.
------------------------------------------------------------------ */
(function (RN) {
  'use strict';

  /* ===============================================================
     LAYOUT  (metres, y = 0 is the top of the base slab)
     =============================================================== */
  var L = RN.L = {
    HALF: 10,          // everything is laid out inside -10 .. +10
    BASE: 10.9,        // the display plinth is a little wider, so a rim shows
    BASE_H: 0.9,

    STORE: { x0: -8.8, x1: -0.6, z0: -8.8, z1: -0.6 },
    WALL_TOP: 3.35,
    SIGN_TOP: 4.25,
    FLOOR_Y: 0.16,
    CEIL_Y: 2.90,

    WALK_Y: 0.14,
    WALK: 1.8,         // pavement width in front of the store
    ROAD: 5.8,
    FARWALK: 1.6,

    ALLEY_X: -9.65,    // inner face of the neighbour building (west)
    ALLEY_Z: -9.65     // inner face of the neighbour building (north)
  };

  L.roadX0 = L.STORE.x1 + L.WALK;      //  1.2
  L.roadX1 = L.roadX0 + L.ROAD;        //  7.0
  L.roadZ0 = L.STORE.z1 + L.WALK;      //  1.2
  L.roadZ1 = L.roadZ0 + L.ROAD;        //  7.0
  L.farX0 = L.roadX1;                  //  7.0
  L.farX1 = L.roadX1 + L.FARWALK;      //  8.6
  L.farZ0 = L.roadZ1;                  //  7.0
  L.farZ1 = L.roadZ1 + L.FARWALK;      //  8.6

  L.walkX0 = L.STORE.x1;               // -0.6
  L.walkX1 = L.roadX0;                 //  1.2
  L.walkZ0 = L.STORE.z1;               // -0.6
  L.walkZ1 = L.roadZ0;                 //  1.2

  /* ===============================================================
     shared materials
     =============================================================== */
  var M = RN.M = {};

  M.baseTop = RN.toon(0x3c4254);
  M.baseSide = RN.toon(0x272c3a);
  M.asphalt = RN.toon(0x32374a);
  M.walk = RN.toon(0x767c8e);
  M.curb = RN.toon(0x8b90a0);
  M.concrete = RN.toon(0x6a6f7e);
  M.concreteDark = RN.toon(0x454a58);
  M.metal = RN.toon(0x8f96a8);
  M.metalDark = RN.toon(0x3b4050);
  M.steel = RN.toon(0xa8b0c0);
  M.rubber = RN.toon(0x1e2029);
  M.wood = RN.toon(0x6b5636);
  M.wall = RN.toon(0xb9bec6);
  M.dark = RN.toon(0x2f3440);

  M.glass = new THREE.MeshPhongMaterial({
    color: 0xbcd8ee, specular: 0xffffff, shininess: 120,
    transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide
  });
  M.glassDoor = new THREE.MeshPhongMaterial({
    color: 0xcfe6f5, specular: 0xffffff, shininess: 140,
    transparent: true, opacity: 0.20, depthWrite: false, side: THREE.DoubleSide
  });

  /* ===============================================================
     SKY
     =============================================================== */
  RN.buildSky = function (scene) {
    var geo = new THREE.SphereGeometry(140, 32, 20);
    var mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color(0x05070f) },
        uHorizon: { value: new THREE.Color(0x1d2942) },
        uGlow: { value: new THREE.Color(0x4a3358) },
        uGlowDir: { value: new THREE.Vector3(0.75, 0, 0.66).normalize() }
      },
      vertexShader: [
        'varying vec3 vDir;',
        'void main() {',
        '  vDir = normalize(position);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uGlow; uniform vec3 uGlowDir;',
        'varying vec3 vDir;',
        'void main() {',
        '  float h = vDir.y;',
        '  vec3 col = mix(uHorizon, uTop, smoothstep(-0.05, 0.62, h));',
        '  vec2 a = normalize(vec2(vDir.x, vDir.z) + vec2(0.0001));',
        '  vec2 b = normalize(vec2(uGlowDir.x, uGlowDir.z) + vec2(0.0001));',
        '  float g = pow(max(dot(a, b), 0.0), 3.0);',
        '  g *= smoothstep(0.42, -0.10, h);',
        '  col += uGlow * g * 0.9;',
        '  float band = smoothstep(0.10, 0.0, abs(h - 0.02));',
        '  col += vec3(0.045, 0.055, 0.085) * band;',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    });
    var sky = new THREE.Mesh(geo, mat);
    sky.name = 'sky';
    sky.frustumCulled = false;
    scene.add(sky);

    scene.fog = new THREE.FogExp2(0x131c2e, 0.0225);
    return sky;
  };

  /* ===============================================================
     LIGHTS
     =============================================================== */
  RN.buildLights = function (scene) {
    var hemi = new THREE.HemisphereLight(0x3a4869, 0x0f0c16, 1.02);
    scene.add(hemi);

    var moon = new THREE.DirectionalLight(0x94aaff, 0.70);
    moon.position.set(-7, 14, 10);
    scene.add(moon);

    var lamp = new THREE.PointLight(0xbfd8ff, 1.5, 14, 1.6);
    lamp.position.set(2.25, 4.75, 2.80);
    scene.add(lamp);

    var storeSpill = new THREE.PointLight(0xffe3b0, 1.1, 9, 1.8);
    storeSpill.position.set(1.0, 2.6, -3.4);
    scene.add(storeSpill);

    var storeSpill2 = new THREE.PointLight(0xffe3b0, 0.9, 8, 1.8);
    storeSpill2.position.set(-3.4, 2.6, 1.0);
    scene.add(storeSpill2);

    return { lamp: lamp, storeSpill: storeSpill, storeSpill2: storeSpill2, hemi: hemi, moon: moon };
  };

  /* ===============================================================
     GROUND
     =============================================================== */
  function worldMat(baseMat, tex, sx, sz, scale) {
    var t = tex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, Math.round(sx / scale)), Math.max(1, Math.round(sz / scale)));
    t.anisotropy = RN.maxAniso || 1;
    t.needsUpdate = true;
    var m = baseMat.clone();
    m.map = t;
    return m;
  }
  RN.worldMat = worldMat;

  function flat(parent, x0, x1, z0, z1, y, mat, name) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.name = name || 'flat';
    parent.add(m);
    return m;
  }
  RN.flat = flat;

  function slab(parent, x0, x1, z0, z1, yTop, h, matTop, matSide) {
    var g = new THREE.Group();
    var top = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), matTop);
    top.rotation.x = -Math.PI / 2;
    top.position.set((x0 + x1) / 2, yTop, (z0 + z1) / 2);
    g.add(top);

    var sideMat = matSide || matTop;
    var s;
    s = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, h), sideMat);
    s.position.set((x0 + x1) / 2, yTop - h / 2, z1);
    g.add(s);
    s = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, h), sideMat);
    s.rotation.y = Math.PI;
    s.position.set((x0 + x1) / 2, yTop - h / 2, z0);
    g.add(s);
    s = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, h), sideMat);
    s.rotation.y = -Math.PI / 2;
    s.position.set(x0, yTop - h / 2, (z0 + z1) / 2);
    g.add(s);
    s = new THREE.Mesh(new THREE.PlaneGeometry(z1 - z0, h), sideMat);
    s.rotation.y = Math.PI / 2;
    s.position.set(x1, yTop - h / 2, (z0 + z1) / 2);
    g.add(s);

    parent.add(g);
    return g;
  }

  RN.buildGround = function (scene) {
    var H = L.HALF;
    var B = L.BASE;
    var g = RN.group(scene, 'ground');

    /* ---- base slab ---- */
    var baseMats = [
      M.baseSide, M.baseSide, M.baseTop, M.baseSide, M.baseSide, M.baseSide
    ];
    var base = new THREE.Mesh(new THREE.BoxGeometry(B * 2, L.BASE_H, B * 2), baseMats);
    base.position.y = -L.BASE_H / 2;
    base.name = 'baseSlab';
    g.add(base);

    var rim = new THREE.Mesh(
      new THREE.BoxGeometry(B * 2 + 0.06, 0.16, B * 2 + 0.06),
      RN.toon(0x4a5064)
    );
    rim.position.y = -L.BASE_H + 0.07;
    g.add(rim);

    /* ---- road surface ---- */
    var roadMatA = worldMat(M.asphalt, RN.tex.road, L.roadX1 - L.roadX0, B * 2, 4);
    var roadMatB = worldMat(M.asphalt, RN.tex.road, B * 2, L.roadZ1 - L.roadZ0, 4);
    flat(g, L.roadX0, L.roadX1, -B, L.roadZ0, 0.002, roadMatA, 'road1');
    flat(g, L.roadX0, L.roadX1, L.roadZ1, B, 0.002, roadMatA, 'road1b');
    flat(g, -B, B, L.roadZ0, L.roadZ1, 0.002, roadMatB, 'road2');

    /* ---- pavements (raised) ---- */
    var walkA = worldMat(M.walk, RN.tex.sidewalk, L.walkX1 - L.walkX0, H * 2, 1.2);
    var walkB = worldMat(M.walk, RN.tex.sidewalk, H - 0.6, L.walkZ1 - L.walkZ0, 1.2);
    var walkC = worldMat(M.walk, RN.tex.sidewalk, L.farX1 - L.farX0, 17, 1.2);
    var walkD = worldMat(M.walk, RN.tex.sidewalk, H * 2, L.farZ1 - L.farZ0, 1.2);

    slab(g, L.walkX0, L.walkX1, -H, H, L.WALK_Y, L.WALK_Y, walkA, M.curb);
    slab(g, -H, L.walkX0, L.walkZ0, L.walkZ1, L.WALK_Y, L.WALK_Y, walkB, M.curb);
    slab(g, L.farX0, L.farX1, -H, L.farZ0, L.WALK_Y, L.WALK_Y, walkC, M.curb);
    slab(g, -H, H, L.farZ0, L.farZ1, L.WALK_Y, L.WALK_Y, walkD, M.curb);

    /* ---- alley ground ---- */
    var alleyMat = RN.toon(0x3c3f4d);
    flat(g, L.ALLEY_X, L.STORE.x0, -H, L.STORE.z1, 0.03, alleyMat, 'alleyA');
    flat(g, L.STORE.x0, L.STORE.x1, L.ALLEY_Z, L.STORE.z0, 0.03, alleyMat, 'alleyB');

    /* ---- drain grates along the kerb ---- */
    var grateMat = new THREE.MeshBasicMaterial({ map: RN.tex.grate, fog: true });
    flat(g, L.roadX0 - 0.42, L.roadX0, -H + 0.6, L.roadZ0 - 0.3, 0.012, grateMat, 'grate1');
    flat(g, L.roadX0 + 0.3, L.roadX1 - 0.3, L.roadZ0 - 0.42, L.roadZ0, 0.012, grateMat, 'grate2');
    flat(g, L.roadX1, L.roadX1 + 0.42, L.roadZ1 + 0.3, H - 0.6, 0.012, grateMat, 'grate3');

    /* ===========================================================
       ROAD MARKINGS
       =========================================================== */
    var paint = new THREE.MeshPhongMaterial({
      color: 0xdfe6e2, specular: 0xffffff, shininess: 90,
      transparent: true, opacity: 0.72, depthWrite: false, fog: true
    });
    var paintWarm = new THREE.MeshPhongMaterial({
      color: 0xe8d98a, specular: 0xffffff, shininess: 90,
      transparent: true, opacity: 0.6, depthWrite: false, fog: true
    });

    var i, zz, xx;
    for (zz = -B + 0.8; zz < L.roadZ0 - 0.6; zz += 2.2) {
      flat(g, 4.0, 4.2, zz, zz + 1.3, 0.014, paintWarm, 'dash');
    }
    for (zz = L.roadZ1 + 0.6; zz < B - 0.8; zz += 2.2) {
      flat(g, 4.0, 4.2, zz, zz + 1.3, 0.014, paintWarm, 'dash');
    }
    for (xx = -B + 0.8; xx < L.roadX0 - 0.6; xx += 2.2) {
      flat(g, xx, xx + 1.3, 4.0, 4.2, 0.014, paintWarm, 'dash');
    }
    for (xx = L.roadX1 + 0.6; xx < B - 0.8; xx += 2.2) {
      flat(g, xx, xx + 1.3, 4.0, 4.2, 0.014, paintWarm, 'dash');
    }

    for (i = 0; i < 8; i++) {
      var sx = L.roadX0 + 0.35 + i * 0.72;
      flat(g, sx, sx + 0.42, 0.30, 1.05, 0.016, paint, 'zebra');
    }
    for (i = 0; i < 8; i++) {
      var sz = L.roadZ0 + 0.35 + i * 0.72;
      flat(g, 0.30, 1.05, sz, sz + 0.42, 0.016, paint, 'zebra');
    }
    flat(g, L.roadX0 + 0.2, L.roadX1 - 0.2, -0.35, -0.05, 0.015, paint, 'stop');
    flat(g, -0.35, -0.05, L.roadZ0 + 0.2, L.roadZ1 - 0.2, 0.015, paint, 'stop');

    /* parking bays on the road in front of the store */
    var bay = new THREE.MeshBasicMaterial({ map: RN.tex.parking, transparent: true, opacity: 0.6, depthWrite: false, fog: true });
    for (i = 0; i < 3; i++) {
      var bz = -1.6 - i * 2.5;
      flat(g, L.roadX0 + 0.05, L.roadX0 + 2.35, bz, bz + 2.4, 0.013, bay, 'bay');
    }

    /* kerb-side edge line */
    var edge = new THREE.MeshBasicMaterial({ color: 0xc9d2cf, transparent: true, opacity: 0.26, depthWrite: false, fog: true });
    flat(g, L.roadX0, L.roadX0 + 0.14, -B + 0.5, L.roadZ0 - 0.5, 0.013, edge, 'edge');
    flat(g, L.roadX0 + 0.5, L.roadX1 - 0.5, L.roadZ0, L.roadZ0 + 0.14, 0.013, edge, 'edge');
    flat(g, L.roadX1 - 0.14, L.roadX1, L.roadZ1 + 0.5, B - 0.5, 0.013, edge, 'edge');
    flat(g, L.roadX0 + 0.5, L.roadX1 - 0.5, L.roadZ1 - 0.14, L.roadZ1, 0.013, edge, 'edge');

    /* ===========================================================
       PUDDLES
       =========================================================== */
    var puddleMat = new THREE.MeshBasicMaterial({
      map: RN.tex.shadow, color: 0x0a1020, transparent: true,
      opacity: 0.62, depthWrite: false, fog: true
    });
    var puddles = [
      [2.4, 0.6, 3.2, 1.5], [5.6, 3.4, 2.6, 1.3], [4.2, 6.1, 3.4, 1.4],
      [0.7, 4.6, 1.5, 2.8], [1.9, -3.4, 1.9, 3.4], [3.1, -6.6, 2.6, 1.6],
      [6.2, -1.6, 1.6, 2.2], [0.9, -7.6, 1.4, 1.8], [-0.1, 2.2, 1.2, 1.6],
      [6.4, 8.2, 2.2, 1.4], [2.0, 8.6, 2.4, 1.2]
    ];
    RN.puddles = [];
    for (i = 0; i < puddles.length; i++) {
      var p = puddles[i];
      var pm = puddleMat.clone();
      pm.opacity = 0.45 + RN.rnd() * 0.3;
      var m = new THREE.Mesh(new THREE.PlaneGeometry(p[2], p[3]), pm);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = RN.rand(0, Math.PI);
      m.position.set(p[0], 0.02, p[1]);
      m.renderOrder = 1;
      g.add(m);
      RN.puddles.push(m);
    }

    return g;
  };

  /* ===============================================================
     BUILDINGS FRAMING THE DIORAMA
     =============================================================== */
  function windowGrid(parent, w, h, x, y, z, ry, tint) {
    var cols = Math.max(2, Math.round(w / 1.1));
    var rows = Math.max(2, Math.round(h / 1.25));
    var mat = new THREE.MeshBasicMaterial({
      color: tint, transparent: true, opacity: 0.85, fog: true
    });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.72), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    parent.add(m);

    var dot = new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: true });
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (RN.rnd() > 0.42) continue;
        var dw = w * 0.86 / cols * 0.62;
        var dh = h * 0.72 / rows * 0.55;
        var px = -w * 0.43 + (c + 0.5) * (w * 0.86 / cols);
        var py = -h * 0.36 + (r + 0.5) * (h * 0.72 / rows);
        var q = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), dot);
        q.position.set(px, py, 0.03);
        m.add(q);
      }
    }
    return m;
  }

  function building(g, x0, x1, z0, z1, h, tint, faces) {
    var w = x1 - x0, d = z1 - z0;
    var b = RN.box(w, h, d, RN.toon(tint), { outline: 0.03 });
    b.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    g.add(b);

    for (var i = 0; i < faces.length; i++) {
      var axis = faces[i][0], sign = faces[i][1];
      if (axis === 'x') {
        windowGrid(g, d, h, sign > 0 ? x1 + 0.02 : x0 - 0.02, h * 0.56, (z0 + z1) / 2,
          sign > 0 ? Math.PI / 2 : -Math.PI / 2, 0x2b3550);
      } else {
        windowGrid(g, w, h, (x0 + x1) / 2, h * 0.56, sign > 0 ? z1 + 0.02 : z0 - 0.02,
          sign > 0 ? 0 : Math.PI, 0x2b3550);
      }
    }
    return b;
  }

  /* a small neon sign bolted to a facade */
  function neonSign(g, x, y, z, ry, color, w, h, smearY) {
    var plate = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, 0.10),
      [RN.toon(0x1b1e26), RN.toon(0x1b1e26), RN.toon(0x1b1e26), RN.toon(0x1b1e26), RN.toon(0x1b1e26), RN.toon(0x1b1e26)]
    );
    plate.position.set(x, y, z);
    plate.rotation.y = ry;
    g.add(plate);

    var face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.78),
      new THREE.MeshBasicMaterial({ color: color, fog: true }));
    face.position.set(x + Math.sin(ry) * 0.055, y, z + Math.cos(ry) * 0.055);
    face.rotation.y = ry;
    g.add(face);

    var gl = RN.glow(color, Math.max(w, h) * 2.4, 0.4);
    gl.position.set(x + Math.sin(ry) * 0.35, y, z + Math.cos(ry) * 0.35);
    g.add(gl);

    if (smearY !== null) {
      RN.smear(g, x + Math.sin(ry) * 1.1, z + Math.cos(ry) * 1.1, color, 3.4, 4.2, 0.26, smearY);
    }
    return face;
  }
  RN.neonSign = neonSign;

  RN.buildEdges = function (scene) {
    var H = L.HALF;
    var g = RN.group(scene, 'edges');
    var tints = [0x2a2f3d, 0x333341, 0x262b38, 0x2e2c3a, 0x30343f];

    /* ---- west: neighbour building along the alley (x -10 .. -9.65) ---- */
    building(g, -H, L.ALLEY_X, -H, L.roadZ0, 5.4, 0x2a2f3d, [['x', -1]]);
    building(g, -H, L.ALLEY_X, L.roadZ1, H, 4.6, 0x2e2c3a, [['x', -1]]);

    /* ---- north: neighbour building along the alley (z -10 .. -9.65) ---- */
    building(g, -H, L.roadX0, -H, L.ALLEY_Z, 5.0, 0x30343f, [['z', -1]]);
    building(g, L.roadX1, H, -H, L.ALLEY_Z, 4.8, 0x333341, [['z', -1]]);

    /* ---- east: row of shops facing the far pavement ---- */
    var zc = -H;
    while (zc < L.roadZ0 - 0.1) {
      var hh = RN.rand(3.6, 5.6);
      var len = RN.rand(2.6, 4.4);
      var z1 = Math.min(zc + len, L.roadZ0);
      building(g, L.farX1, H, zc, z1, hh, RN.pick(tints), [['x', -1], ['x', 1]]);
      zc = z1;
    }
    zc = L.roadZ1;
    while (zc < H - 0.1) {
      var hh2 = RN.rand(3.6, 5.4);
      var len2 = RN.rand(2.6, 4.4);
      var z2 = Math.min(zc + len2, H);
      building(g, L.farX1, H, zc, z2, hh2, RN.pick(tints), [['x', -1], ['x', 1]]);
      zc = z2;
    }

    /* ---- south: row of shops facing the far pavement ---- */
    var xc = -H;
    while (xc < L.roadX0 - 0.1) {
      var hh3 = RN.rand(3.4, 5.2);
      var len3 = RN.rand(2.6, 4.4);
      var x1 = Math.min(xc + len3, L.roadX0);
      building(g, xc, x1, L.farZ1, H, hh3, RN.pick(tints), [['z', -1], ['z', 1]]);
      xc = x1;
    }
    xc = L.roadX1;
    while (xc < H - 0.1) {
      var hh4 = RN.rand(3.4, 5.4);
      var len4 = RN.rand(2.6, 4.4);
      var x2 = Math.min(xc + len4, H);
      building(g, xc, x2, L.farZ1, H, hh4, RN.pick(tints), [['z', -1], ['z', 1]]);
      xc = x2;
    }

    /* ---- neon accents on the neighbours ---- */
    RN.neons = [
      neonSign(g, 0.35, 3.10, L.ALLEY_Z + 0.05, 0, 0xff5a7a, 0.46, 1.85, L.WALK_Y + 0.02),
      neonSign(g, L.ALLEY_X + 0.05, 3.00, 0.30, Math.PI / 2, 0xffb347, 1.40, 0.46, L.WALK_Y + 0.02),
      neonSign(g, 7.60, 3.20, H + 0.05, 0, 0x5ac8ff, 0.46, 1.70, null)
    ];

    /* ---- low wall + hedge along the far pavement ---- */
    var wallMat = RN.toon(0x3a3f4d);
    var hedgeMat = RN.toon(0x24402f);
    var segs = [
      [L.farX0 + 0.05, L.farX0 + 0.30, -H + 1.6, L.roadZ0 - 0.6],
      [L.farX0 + 0.05, L.farX0 + 0.30, L.roadZ1 + 0.6, H - 1.6]
    ];
    var s, q;
    for (s = 0; s < segs.length; s++) {
      q = segs[s];
      var wl = RN.box(q[1] - q[0], 0.8, q[3] - q[2], wallMat, { outline: 0.02 });
      wl.position.set((q[0] + q[1]) / 2, L.WALK_Y + 0.4, (q[2] + q[3]) / 2);
      g.add(wl);
      var hg = RN.box(q[1] - q[0] + 0.1, 0.45, q[3] - q[2], hedgeMat, { outline: 0.02 });
      hg.position.set((q[0] + q[1]) / 2, L.WALK_Y + 0.8 + 0.225, (q[2] + q[3]) / 2);
      g.add(hg);
    }
    var segs2 = [
      [-H + 1.6, L.roadX0 - 0.6, L.farZ0 + 0.05, L.farZ0 + 0.30],
      [L.roadX1 + 0.6, H - 1.6, L.farZ0 + 0.05, L.farZ0 + 0.30]
    ];
    for (s = 0; s < segs2.length; s++) {
      q = segs2[s];
      var wl2 = RN.box(q[1] - q[0], 0.8, q[3] - q[2], wallMat, { outline: 0.02 });
      wl2.position.set((q[0] + q[1]) / 2, L.WALK_Y + 0.4, (q[2] + q[3]) / 2);
      g.add(wl2);
      var hg2 = RN.box(q[1] - q[0], 0.45, q[3] - q[2] + 0.1, hedgeMat, { outline: 0.02 });
      hg2.position.set((q[0] + q[1]) / 2, L.WALK_Y + 0.8 + 0.225, (q[2] + q[3]) / 2);
      g.add(hg2);
    }

    return g;
  };

  /* ===============================================================
     ALLEY DRESSING
     =============================================================== */
  RN.buildAlley = function (scene) {
    var g = RN.group(scene, 'alley');
    var H = L.HALF;
    var AX = -9.22;          // centre line of the west alley
    var AZ = -9.22;          // centre line of the north alley

    var brickMat = RN.toon(0x4a4150);
    brickMat.map = RN.tex.brick;
    var brickMat2 = RN.toon(0x453d4b);
    brickMat2.map = RN.tex.brick;

    /* brick skins on the neighbour walls */
    var wall = RN.box(0.05, 3.2, 9.0, brickMat, { outline: 0.02 });
    wall.position.set(L.ALLEY_X + 0.03, 1.63, -5.2);
    g.add(wall);
    var wall2 = RN.box(8.2, 3.2, 0.05, brickMat2, { outline: 0.02 });
    wall2.position.set(-4.9, 1.63, L.ALLEY_Z + 0.03);
    g.add(wall2);

    /* pipes running up the wall */
    var pipeMat = RN.toon(0x6d7280);
    var p1 = RN.cyl(0.065, 0.065, 3.0, 8, pipeMat, { outline: 0.014 });
    p1.position.set(L.ALLEY_X + 0.13, 1.5, -3.2);
    g.add(p1);
    var p2 = RN.cyl(0.045, 0.045, 3.0, 8, pipeMat, { outline: 0.012 });
    p2.position.set(L.ALLEY_X + 0.13, 1.5, -3.44);
    g.add(p2);

    /* stacked crates */
    var crateMat = RN.toon(0x3f6b8c);
    for (var i = 0; i < 3; i++) {
      var c = RN.box(0.44, 0.32, 0.44, crateMat, { outline: 0.016 });
      c.position.set(AX, 0.03 + 0.16 + i * 0.34, -1.60 + (i % 2) * 0.05);
      c.rotation.y = RN.rand(-0.2, 0.2);
      g.add(c);
    }

    /* dumpster tucked in the alley */
    var dumpMat = RN.toon(0x35564a);
    var dump = RN.box(0.78, 0.95, 1.10, dumpMat, { outline: 0.022 });
    dump.position.set(AX, 0.03 + 0.475, -7.40);
    g.add(dump);
    var lid = RN.box(0.82, 0.09, 1.14, RN.toon(0x2a453c), { outline: 0.02 });
    lid.position.set(AX, 0.03 + 0.98, -7.40);
    lid.rotation.x = -0.10;
    g.add(lid);

    /* a lonely alley light */
    var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe0a8, fog: true }));
    bulb.position.set(L.ALLEY_X + 0.16, 2.55, -4.60);
    g.add(bulb);
    var gl = RN.glow(0xffd79a, 1.6, 0.5);
    gl.position.copy(bulb.position);
    g.add(gl);
    var al = new THREE.PointLight(0xffd79a, 0.8, 5, 1.8);
    al.position.set(L.ALLEY_X + 0.4, 2.4, -4.60);
    g.add(al);

    /* pipes crossing overhead */
    var oh = RN.cyl(0.055, 0.055, 1.0, 8, pipeMat, { outline: 0.012 });
    oh.rotation.z = Math.PI / 2;
    oh.position.set(AX + 0.1, 2.85, -6.40);
    g.add(oh);

    /* a couple of crates in the north alley too */
    for (var k = 0; k < 2; k++) {
      var c2 = RN.box(0.40, 0.30, 0.40, RN.toon(0x8c5a3f), { outline: 0.015 });
      c2.position.set(-2.2 - k * 0.9, 0.03 + 0.15, AZ);
      c2.rotation.y = RN.rand(-0.3, 0.3);
      g.add(c2);
    }

    /* a cat?  no - keep the street empty of characters */

    return g;
  };

  /* ===============================================================
     MASTER
     =============================================================== */
  RN.buildWorld = function (scene) {
    var sky = RN.buildSky(scene);
    var lights = RN.buildLights(scene);
    var ground = RN.buildGround(scene);
    var edges = RN.buildEdges(scene);
    var alley = RN.buildAlley(scene);
    return { sky: sky, lights: lights, ground: ground, edges: edges, alley: alley };
  };

})(window.RN);
