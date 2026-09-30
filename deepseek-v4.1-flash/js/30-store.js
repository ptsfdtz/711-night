/* ------------------------------------------------------------------
   30-store.js  --  the convenience store: shell, glass facades,
                    automatic doors, illuminated sign band, and a
                    fully dressed interior visible through the glass.
------------------------------------------------------------------ */
(function (RN) {
  'use strict';

  var L = RN.L;
  var S = L.STORE;

  var X0 = S.x0, X1 = S.x1, Z0 = S.z0, Z1 = S.z1;
  var T = 0.22;                       // wall thickness
  var WT = L.WALL_TOP;                // 3.35
  var ST = L.SIGN_TOP;                // 4.25
  var FY = L.FLOOR_Y;                 // 0.16
  var CY = L.CEIL_Y;                  // 2.90

  var IX0 = X0 + T, IX1 = X1 - T;
  var IZ0 = Z0 + T, IZ1 = Z1 - T;

  var FX = X1 - T / 2;                // +X facade plane   (-0.71)
  var FZ = Z1 - T / 2;                // +Z facade plane   (-0.71)

  /* bright, self-lit interior materials ------------------------- */
  function lit(color, amt) {
    return RN.toon(color, {
      emissive: new THREE.Color(color),
      emissiveIntensity: amt === undefined ? 0.34 : amt
    });
  }
  function basic(color) {
    return new THREE.MeshBasicMaterial({ color: color, fog: true });
  }

  var MAT = {
    wallOut: RN.toon(0xb9bec6, { map: RN.tex.wall }),
    wallIn: lit(0xd6d3c6, 0.30),
    ceil: basic(0xe4e1d4),
    kick: RN.toon(0x4c5160),
    header: RN.toon(0xc8ccd4),
    mullion: RN.toon(0x6e7484),
    frame: RN.toon(0x565c6c),
    roof: RN.toon(0x474d59),
    metal: RN.toon(0x9aa2b2),
    metalDark: RN.toon(0x4a5162),
    plastic: lit(0xe6e8ec, 0.30),
    shelfBody: lit(0xc6c9d0, 0.24),
    steel: lit(0xb9c0cc, 0.28),
    white: lit(0xf0f2f4, 0.30),
    dark: RN.toon(0x2f3440),
    counterTop: lit(0xdcd9cf, 0.30),
    wood: lit(0xb08a56, 0.22),
    accent: lit(0x2f8f74, 0.35)
  };

  /* ===============================================================
     facade helpers
     =============================================================== */
  function place(axis, obj, p, y, off) {
    if (axis === 0) obj.position.set(FX + (off || 0), y, Z1 - p);
    else obj.position.set(X1 - p, y, FZ + (off || 0));
    return obj;
  }

  function panel(axis, w, h, mat, p, y, off) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.rotation.y = axis === 0 ? Math.PI / 2 : 0;
    place(axis, m, p + w / 2, y, off);
    return m;
  }

  function facadeBar(axis, w, h, d, mat, p, y, off) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(axis === 0 ? d : w, h, axis === 0 ? w : d), mat);
    place(axis, m, p + w / 2, y, off);
    return m;
  }

  /* ===============================================================
     MAIN
     =============================================================== */
  RN.buildStore = function (scene) {
    var root = RN.group(scene, 'store');
    var exterior = RN.group(root, 'storeExterior');
    var interior = RN.group(root, 'storeInterior');

    /* ---------- shell ---------- */
    var roofTop = RN.toon(0x3f4551);
    roofTop.map = RN.tex.roofPanel;
    var roof = new THREE.Mesh(
      new THREE.BoxGeometry(X1 - X0 + 0.12, 0.2, Z1 - Z0 + 0.12),
      [MAT.roof, MAT.roof, roofTop, MAT.roof, MAT.roof, MAT.roof]
    );
    roof.position.set((X0 + X1) / 2, WT + 0.1, (Z0 + Z1) / 2);
    RN.addOutline(roof, 0.03);
    exterior.add(roof);

    var wW = RN.box(T, WT, Z1 - Z0, MAT.wallOut, { outline: 0.03 });
    wW.position.set(X0 + T / 2, WT / 2, (Z0 + Z1) / 2);
    exterior.add(wW);
    var wN = RN.box(X1 - X0, WT, T, MAT.wallOut, { outline: 0.03 });
    wN.position.set((X0 + X1) / 2, WT / 2, Z0 + T / 2);
    exterior.add(wN);

    var inW = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - Z0, CY), MAT.wallIn);
    inW.rotation.y = Math.PI / 2;
    inW.position.set(X0 + T + 0.005, FY + CY / 2, (Z0 + Z1) / 2);
    interior.add(inW);
    var inN = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, CY), MAT.wallIn);
    inN.position.set((X0 + X1) / 2, FY + CY / 2, Z0 + T + 0.005);
    interior.add(inN);

    /* brand colour band running around the interior walls */
    var bandMat = basic(0x2f9e7c);
    var bandMat2 = basic(0xe8a33d);
    var bandW = RN.box(0.06, 0.26, Z1 - Z0 - 0.1, bandMat, { outline: false });
    bandW.position.set(X0 + T + 0.04, FY + 2.42, (Z0 + Z1) / 2);
    interior.add(bandW);
    var bandW2 = RN.box(0.06, 0.07, Z1 - Z0 - 0.1, bandMat2, { outline: false });
    bandW2.position.set(X0 + T + 0.045, FY + 2.24, (Z0 + Z1) / 2);
    interior.add(bandW2);
    var bandN = RN.box(X1 - X0 - 0.1, 0.26, 0.06, bandMat, { outline: false });
    bandN.position.set((X0 + X1) / 2, FY + 2.42, Z0 + T + 0.04);
    interior.add(bandN);
    var bandN2 = RN.box(X1 - X0 - 0.1, 0.07, 0.06, bandMat2, { outline: false });
    bandN2.position.set((X0 + X1) / 2, FY + 2.24, Z0 + T + 0.045);
    interior.add(bandN2);

    /* ---------- illuminated sign band ---------- */
    var signMats = [
      new THREE.MeshBasicMaterial({ map: RN.tex.storeSign, fog: true }),
      MAT.dark,
      MAT.dark,
      MAT.dark,
      new THREE.MeshBasicMaterial({ map: RN.tex.storeSignSide, fog: true }),
      MAT.dark
    ];
    var band = new THREE.Mesh(
      new THREE.BoxGeometry(X1 - X0 + 0.14, ST - WT, Z1 - Z0 + 0.14),
      signMats
    );
    band.position.set((X0 + X1) / 2, (WT + ST) / 2, (Z0 + Z1) / 2);
    exterior.add(band);

    var bandEdge = RN.box(X1 - X0 + 0.2, 0.09, Z1 - Z0 + 0.2, MAT.frame, { outline: 0.02 });
    bandEdge.position.set((X0 + X1) / 2, ST + 0.04, (Z0 + Z1) / 2);
    exterior.add(bandEdge);

    var glowColor = 0x5affd0;
    var sg1 = RN.glow(glowColor, 3.9, 0.32);
    sg1.position.set(X1 + 0.2, (WT + ST) / 2, Z1 - 4.1);
    exterior.add(sg1);
    var sg2 = RN.glow(glowColor, 3.9, 0.32);
    sg2.position.set(X1 - 4.1, (WT + ST) / 2, Z1 + 0.2);
    exterior.add(sg2);
    RN.smear(exterior, X1 + 0.4, Z1 - 4.1, glowColor, 7.0, 6.0, 0.38, 0.155);
    RN.smear(exterior, X1 - 4.1, Z1 + 0.4, glowColor, 7.0, 6.0, 0.38, 0.155);

    var signLight = new THREE.PointLight(0x66ffd0, 0.6, 9, 1.8);
    signLight.position.set(X1 + 0.6, 3.8, Z1 - 3.0);
    exterior.add(signLight);

    /* ---------- rooftop kit ---------- */
    var acu = RN.box(1.5, 0.75, 0.95, MAT.metal, { outline: 0.025 });
    acu.position.set(X0 + 2.6, WT + 0.2 + 0.375, Z0 + 2.2);
    exterior.add(acu);
    var fan = RN.cyl(0.28, 0.28, 0.06, 16, MAT.metalDark, { outline: 0.014 });
    fan.rotation.x = Math.PI / 2;
    fan.position.set(X0 + 2.6, WT + 0.95, Z0 + 1.72);
    exterior.add(fan);
    var acu2 = RN.box(1.0, 0.62, 0.8, MAT.metal, { outline: 0.022 });
    acu2.position.set(X0 + 5.4, WT + 0.2 + 0.31, Z0 + 1.4);
    exterior.add(acu2);

    var vent = RN.cyl(0.18, 0.22, 0.55, 12, MAT.metalDark, { outline: 0.014 });
    vent.position.set(X1 - 2.2, WT + 0.2 + 0.275, Z0 + 3.0);
    exterior.add(vent);

    /* water tank */
    var tankLegs = RN.group(exterior, 'tank');
    var tank = RN.cyl(0.62, 0.62, 1.0, 14, MAT.steel, { outline: 0.022 });
    tank.position.set(X1 - 2.0, WT + 0.2 + 0.72, Z1 - 2.6);
    tankLegs.add(tank);
    var tankTop = RN.cyl(0.66, 0.62, 0.10, 14, MAT.metal, { outline: 0.016 });
    tankTop.position.set(X1 - 2.0, WT + 0.2 + 1.26, Z1 - 2.6);
    tankLegs.add(tankTop);
    for (var tl = 0; tl < 4; tl++) {
      var lx = (tl % 2 ? 1 : -1) * 0.42;
      var lz = (tl < 2 ? 1 : -1) * 0.42;
      var leg = RN.cyl(0.05, 0.05, 0.22, 6, MAT.metalDark, { outline: 0.01 });
      leg.position.set(X1 - 2.0 + lx, WT + 0.2 + 0.11, Z1 - 2.6 + lz);
      tankLegs.add(leg);
    }

    /* rooftop hatch */
    var hatch = RN.box(0.9, 0.34, 0.9, MAT.metal, { outline: 0.02 });
    hatch.position.set(X0 + 5.6, WT + 0.2 + 0.17, Z1 - 2.4);
    exterior.add(hatch);
    var hatchLid = RN.box(0.98, 0.07, 0.98, MAT.metalDark, { outline: 0.016 });
    hatchLid.position.set(X0 + 5.6, WT + 0.2 + 0.37, Z1 - 2.4);
    exterior.add(hatchLid);

    /* vents + a small antenna mast */
    for (var vv = 0; vv < 3; vv++) {
      var vp = RN.cyl(0.10, 0.12, 0.34, 10, MAT.metalDark, { outline: 0.012 });
      vp.position.set(X0 + 1.6 + vv * 0.55, WT + 0.2 + 0.17, Z1 - 1.3);
      exterior.add(vp);
    }
    var mast = RN.cyl(0.035, 0.045, 2.1, 8, MAT.metalDark, { outline: 0.01 });
    mast.position.set(X0 + 7.2, WT + 0.2 + 1.05, Z0 + 1.1);
    exterior.add(mast);
    var mastBar = RN.box(0.9, 0.03, 0.03, MAT.metalDark, { outline: 0.008 });
    mastBar.position.set(X0 + 7.2, WT + 0.2 + 1.7, Z0 + 1.1);
    exterior.add(mastBar);

    /* roof railing posts on two sides */
    var ri, post;
    for (ri = 0; ri < 5; ri++) {
      post = RN.cyl(0.035, 0.035, 0.5, 6, MAT.metalDark, { outline: 0.01 });
      post.position.set(X0 + 0.4 + ri * 1.9, WT + 0.2 + 0.25, Z0 + 0.5);
      exterior.add(post);
    }
    for (ri = 0; ri < 5; ri++) {
      post = RN.cyl(0.035, 0.035, 0.5, 6, MAT.metalDark, { outline: 0.01 });
      post.position.set(X0 + 0.5, WT + 0.2 + 0.25, Z0 + 0.5 + ri * 1.9);
      exterior.add(post);
    }

    /* ---------- glass facades ---------- */
    var DOOR_A = 2.10, DOOR_B = 3.90;
    var DZ = -(DOOR_A + DOOR_B) / 2 - 0.6;          // -3.60

    var MAT_WALL_GLASS = new THREE.MeshBasicMaterial({
      color: 0x9fc4dc, transparent: true, opacity: 0.07,
      side: THREE.DoubleSide, depthWrite: false, fog: true
    });

    function buildFacade(axis, hasDoor) {
      var LEN = Z1 - Z0;
      var col = RN.box(0.34, WT, 0.34, MAT.frame, { outline: 0.028 });
      col.position.set(X1 - 0.17, WT / 2, Z1 - 0.17);
      exterior.add(col);

      var runs = hasDoor ? [[0.34, DOOR_A], [DOOR_B, LEN]] : [[0.34, LEN]];
      for (var r = 0; r < runs.length; r++) {
        var a = runs[r][0], b = runs[r][1];
        exterior.add(facadeBar(axis, b - a, 0.30, 0.20, MAT.kick, a, 0.15, 0));
        exterior.add(facadeBar(axis, b - a, 0.42, 0.20, MAT.header, a, WT - 0.21, 0));
        exterior.add(facadeBar(axis, b - a, 0.04, 0.24, MAT.frame, a, 0.30, 0));
        exterior.add(facadeBar(axis, b - a, 0.05, 0.24, MAT.frame, a, WT - 0.42, 0));
      }
      if (hasDoor) {
        exterior.add(facadeBar(axis, DOOR_B - DOOR_A, 0.42, 0.20, MAT.header, DOOR_A, WT - 0.21, 0));
        exterior.add(facadeBar(axis, DOOR_B - DOOR_A, 0.05, 0.24, MAT.frame, DOOR_A, WT - 0.42, 0));
      }

      var p = 0.34;
      var plan = hasDoor
        ? [[1.60, 'g'], [0.20, 'm'], [DOOR_B - DOOR_A, 'd'], [0.20, 'm'], [1.60, 'g'], [0.20, 'm'], [1.60, 'g'], [0.20, 'm']]
        : [[1.60, 'g'], [0.20, 'm'], [1.80, 'g'], [0.20, 'm'], [1.60, 'g'], [0.20, 'm'], [1.60, 'g'], [0.20, 'm']];

      for (var i = 0; i < plan.length; i++) {
        var w = plan[i][0], kind = plan[i][1];
        if (kind === 'm') {
          exterior.add(facadeBar(axis, w, WT - 0.30, 0.16, MAT.mullion, p, 0.30 + (WT - 0.30) / 2, 0));
        } else if (kind === 'g') {
          exterior.add(panel(axis, w, WT - 0.72, MAT_WALL_GLASS, p, 0.30 + (WT - 0.72) / 2, 0));
          exterior.add(panel(axis, w, WT - 0.72, RN.M.glass, p, 0.30 + (WT - 0.72) / 2, 0.055));
        }
        p += w;
      }
      if (p < LEN - 0.02) {
        exterior.add(facadeBar(axis, LEN - p, WT, 0.20, MAT.wallOut, p, WT / 2, 0));
      }
    }

    buildFacade(0, true);
    buildFacade(1, false);

    /* ---------- rain running down the glass ---------- */
    var streakMat1 = new THREE.MeshBasicMaterial({
      map: RN.tex.glassStreak, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: true
    });
    var rainGlass1 = new THREE.Mesh(new THREE.PlaneGeometry(Z1 - Z0 - 0.4, WT - 0.8), streakMat1);
    rainGlass1.rotation.y = Math.PI / 2;
    rainGlass1.position.set(X1 + 0.035, 0.30 + (WT - 0.8) / 2, (Z0 + Z1) / 2);
    rainGlass1.renderOrder = 3;
    exterior.add(rainGlass1);

    var streakMat2 = streakMat1.clone();
    var rainGlass2 = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0 - 0.4, WT - 0.8), streakMat2);
    rainGlass2.position.set((X0 + X1) / 2, 0.30 + (WT - 0.8) / 2, Z1 + 0.035);
    rainGlass2.renderOrder = 3;
    exterior.add(rainGlass2);

    /* ---------- entrance canopy ---------- */
    var canopy = RN.box(1.55, 0.10, 2.6, MAT.roof, { outline: 0.028 });
    canopy.position.set(X1 + 0.78, 2.72, DZ);
    exterior.add(canopy);
    var canopyTrim = RN.box(1.62, 0.10, 2.7, MAT.frame, { outline: 0.024 });
    canopyTrim.position.set(X1 + 0.78, 2.63, DZ);
    exterior.add(canopyTrim);

    var lightStrip = RN.box(0.16, 0.05, 2.3, basic(0xfff0d0), { outline: false });
    lightStrip.position.set(X1 + 1.42, 2.64, DZ);
    exterior.add(lightStrip);
    var stripGlow = RN.glow(0xffe6b8, 2.4, 0.34);
    stripGlow.position.set(X1 + 1.35, 2.5, DZ);
    exterior.add(stripGlow);

    for (var ci = 0; ci < 2; ci++) {
      var strut = RN.cyl(0.035, 0.035, 1.5, 6, MAT.metalDark, { outline: 0.012 });
      strut.rotation.z = Math.PI / 2 - 0.35;
      strut.position.set(X1 + 0.72, 2.95, DZ - 1.15 + ci * 2.3);
      exterior.add(strut);
    }

    /* ---------- automatic sliding doors ---------- */
    var doorRoot = RN.group(exterior, 'doors');
    var DHW = (DOOR_B - DOOR_A) / 2;
    var postL = RN.box(0.16, 2.60, 0.11, MAT.frame, { outline: 0.024 });
    postL.position.set(FX, 0.30 + 1.30, DZ - DHW - 0.055);
    doorRoot.add(postL);
    var postR = RN.box(0.16, 2.60, 0.11, MAT.frame, { outline: 0.024 });
    postR.position.set(FX, 0.30 + 1.30, DZ + DHW + 0.055);
    doorRoot.add(postR);
    var doorSill = RN.box(0.26, 0.05, DOOR_B - DOOR_A + 0.22, MAT.metal, { outline: 0.012 });
    doorSill.position.set(FX, 0.305, DZ);
    doorRoot.add(doorSill);

    var head = RN.box(0.20, 0.16, DOOR_B - DOOR_A + 0.34, MAT.metalDark, { outline: 0.02 });
    head.position.set(FX + 0.02, 2.98, DZ);
    doorRoot.add(head);
    var sensor = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), basic(0xff6a5a));
    sensor.position.set(FX + 0.14, 2.96, DZ);
    doorRoot.add(sensor);
    var sensorGlow = RN.glow(0xff5a4a, 0.7, 0.5);
    sensorGlow.position.copy(sensor.position);
    doorRoot.add(sensorGlow);

    function makeLeaf(sign) {
      var g = new THREE.Group();
      g.add(RN.box(0.09, 2.60, 0.92, MAT.frame, { outline: 0.022 }));
      var gl = new THREE.Mesh(new THREE.PlaneGeometry(0.80, 2.34), RN.M.glassDoor);
      gl.rotation.y = Math.PI / 2;
      gl.position.set(0.055 * sign, 0, 0);
      g.add(gl);
      var gl2 = gl.clone();
      gl2.position.x = -0.055 * sign;
      gl2.rotation.y = -Math.PI / 2;
      g.add(gl2);
      var handle = RN.box(0.05, 1.0, 0.06, MAT.metal, { outline: 0.01 });
      handle.position.set(0.07 * sign, -0.1, 0.34 * sign);
      g.add(handle);
      var stripe = RN.box(0.10, 2.60, 0.12, basic(0x7de3c0), { outline: false });
      stripe.position.set(0, 0, -0.40 * sign);
      g.add(stripe);
      return g;
    }

    var leafL = makeLeaf(1);
    leafL.position.set(FX, 0.30 + 1.30, DZ - 0.455);
    doorRoot.add(leafL);
    var leafR = makeLeaf(-1);
    leafR.position.set(FX, 0.30 + 1.30, DZ + 0.455);
    doorRoot.add(leafR);

    RN.smear(exterior, X1 + 0.55, DZ, 0xffe0b0, 3.4, 3.4, 0.45, 0.155);

    /* ---------- pylon sign ---------- */
    var pylon = RN.group(exterior, 'pylon');
    var pole = RN.cyl(0.10, 0.12, 5.4, 10, MAT.metalDark, { outline: 0.02 });
    pole.position.set(0.95, 2.84, 5.40);
    pylon.add(pole);
    var pBox = RN.box(1.05, 1.05, 0.22, MAT.metalDark, { outline: 0.026 });
    pBox.position.set(0.95, 5.35, 5.40);
    pylon.add(pBox);
    var pFace = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96),
      new THREE.MeshBasicMaterial({ map: RN.tex.pylon, fog: true }));
    pFace.position.set(0.95, 5.35, 5.53);
    pylon.add(pFace);
    var pFace2 = pFace.clone();
    pFace2.position.z = 5.27;
    pFace2.rotation.y = Math.PI;
    pylon.add(pFace2);
    var pGlow = RN.glow(0x4fffc0, 3.4, 0.36);
    pGlow.position.set(0.95, 5.35, 5.40);
    pylon.add(pGlow);
    var pLight = new THREE.PointLight(0x5affd0, 0.55, 8, 1.8);
    pLight.position.set(0.95, 5.2, 5.40);
    pylon.add(pLight);
    RN.smear(exterior, 0.95, 5.40, 0x5affd0, 4.4, 6.5, 0.30, 0.155);

    /* ===============================================================
       INTERIOR
       =============================================================== */
    var floorMat = new THREE.MeshBasicMaterial({ map: RN.tex.shopFloor, color: 0xd6d2c6, fog: true });
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(IX1 - IX0, IZ1 - IZ0), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((IX0 + IX1) / 2, FY, (IZ0 + IZ1) / 2);
    interior.add(floor);

    var ceil = new THREE.Mesh(new THREE.PlaneGeometry(IX1 - IX0, IZ1 - IZ0), MAT.ceil);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set((IX0 + IX1) / 2, CY, (IZ0 + IZ1) / 2);
    interior.add(ceil);

    /* ceiling light panels */
    var panelMat = new THREE.MeshBasicMaterial({ map: RN.tex.ceilingPanel, fog: true });
    for (var cx = 0; cx < 4; cx++) {
      for (var cz = 0; cz < 3; cz++) {
        var px = IX0 + 1.05 + cx * 1.95;
        var pz = IZ0 + 1.35 + cz * 2.6;
        var lp = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.62), panelMat);
        lp.rotation.x = Math.PI / 2;
        lp.position.set(px, CY - 0.02, pz);
        interior.add(lp);
        var lframe = RN.box(1.6, 0.05, 0.72, MAT.metalDark, { outline: 0.012 });
        lframe.position.set(px, CY - 0.005, pz);
        interior.add(lframe);
      }
    }

    var iLightPos = [[-2.30, -2.60], [-2.30, -6.20], [-6.20, -4.30]];
    for (var li = 0; li < iLightPos.length; li++) {
      var pl = new THREE.PointLight(0xffe6bd, 1.0, 7.0, 1.5);
      pl.position.set(iLightPos[li][0], 2.55, iLightPos[li][1]);
      interior.add(pl);
    }

    /* ---------- gondola shelving ---------- */
    var shelfFace = new THREE.MeshBasicMaterial({ map: RN.tex.shelf, fog: true });
    var gondolaZ = [-7.00, -5.50, -4.00];
    var GX0 = -7.70, GX1 = -3.60, GW = GX1 - GX0;
    for (var gi = 0; gi < gondolaZ.length; gi++) {
      var gz = gondolaZ[gi];
      var gg = RN.group(interior, 'gondola');

      var plinth = RN.box(GW, 0.16, 0.86, MAT.metalDark, { outline: 0.018 });
      plinth.position.set((GX0 + GX1) / 2, FY + 0.08, gz);
      gg.add(plinth);

      var body = new THREE.Mesh(new THREE.BoxGeometry(GW, 1.12, 0.80), [
        MAT.shelfBody, MAT.shelfBody, MAT.shelfBody, MAT.shelfBody, shelfFace, shelfFace
      ]);
      body.position.set((GX0 + GX1) / 2, FY + 0.16 + 0.56, gz);
      gg.add(body);

      for (var si = 0; si < 3; si++) {
        var lip = RN.box(GW, 0.035, 0.94, MAT.metal, { outline: 0.01 });
        lip.position.set((GX0 + GX1) / 2, FY + 0.16 + 0.30 + si * 0.35, gz);
        gg.add(lip);
      }
      var gtop = RN.box(GW, 0.07, 0.86, MAT.metal, { outline: 0.014 });
      gtop.position.set((GX0 + GX1) / 2, FY + 1.40, gz);
      gg.add(gtop);

      for (var pc = 0; pc < 5; pc++) {
        var card = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.18),
          basic(pc % 2 ? 0xf6f2e2 : 0xe8f3ff));
        card.position.set(GX0 + 0.5 + pc * 0.78, FY + 1.30, gz + 0.44);
        gg.add(card);
        var card2 = card.clone();
        card2.position.z = gz - 0.44;
        card2.rotation.y = Math.PI;
        gg.add(card2);
      }
    }

    /* ---------- drink fridges on the north wall ---------- */
    var fridgeFace = new THREE.MeshBasicMaterial({ map: RN.tex.fridge, fog: true });
    var fridgeX = [-7.85, -6.35, -4.85];
    for (var fi = 0; fi < fridgeX.length; fi++) {
      var fx = fridgeX[fi];
      var fg = RN.group(interior, 'fridge');
      var body2 = new THREE.Mesh(new THREE.BoxGeometry(1.42, 2.05, 0.72), [
        MAT.steel, MAT.steel, MAT.steel, MAT.steel, MAT.steel, MAT.steel
      ]);
      body2.position.set(fx, FY + 1.025, IZ0 + 0.37);
      fg.add(body2);
      var face = new THREE.Mesh(new THREE.PlaneGeometry(1.30, 1.86), fridgeFace);
      face.position.set(fx, FY + 1.02, IZ0 + 0.735);
      fg.add(face);
      var gd = new THREE.Mesh(new THREE.PlaneGeometry(1.30, 1.86), RN.M.glass);
      gd.position.set(fx, FY + 1.02, IZ0 + 0.775);
      fg.add(gd);
      var fframe = RN.box(1.44, 0.10, 0.10, MAT.metal, { outline: 0.014 });
      fframe.position.set(fx, FY + 1.99, IZ0 + 0.76);
      fg.add(fframe);
      var fglow = RN.glow(0xbfe8ff, 2.6, 0.22);
      fglow.position.set(fx, FY + 1.1, IZ0 + 0.9);
      fg.add(fglow);
    }

    /* ---------- bento / onigiri chiller on the west wall ---------- */
    var bentoFace = new THREE.MeshBasicMaterial({ map: RN.tex.bento, fog: true });
    var bentoZ = [-2.20, -3.90];
    for (var bi = 0; bi < bentoZ.length; bi++) {
      var bz = bentoZ[bi];
      var bg = RN.group(interior, 'chiller');
      var bb = new THREE.Mesh(new THREE.BoxGeometry(0.70, 1.85, 1.50), [
        MAT.steel, MAT.steel, MAT.steel, MAT.steel, MAT.steel, MAT.steel
      ]);
      bb.position.set(IX0 + 0.35, FY + 0.925, bz);
      bg.add(bb);
      var bf = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 1.68), bentoFace);
      bf.rotation.y = Math.PI / 2;
      bf.position.set(IX0 + 0.71, FY + 0.94, bz);
      bg.add(bf);
      var bgd = new THREE.Mesh(new THREE.PlaneGeometry(1.40, 1.68), RN.M.glass);
      bgd.rotation.y = Math.PI / 2;
      bgd.position.set(IX0 + 0.75, FY + 0.94, bz);
      bg.add(bgd);
      var bglow = RN.glow(0xd8f0ff, 2.4, 0.20);
      bglow.position.set(IX0 + 0.9, FY + 1.0, bz);
      bg.add(bglow);
    }

    /* ---------- L-shaped register counter ---------- */
    var counter = RN.group(interior, 'counter');
    var CT_X = -1.75;

    var cBase = RN.box(0.88, 0.92, 3.40, MAT.plastic, { outline: 0.022 });
    cBase.position.set(CT_X, FY + 0.46, -6.30);
    counter.add(cBase);
    var cTop = RN.box(1.02, 0.06, 3.54, MAT.counterTop, { outline: 0.018 });
    cTop.position.set(CT_X, FY + 0.95, -6.30);
    counter.add(cTop);

    var wBase = RN.box(1.30, 0.92, 0.88, MAT.plastic, { outline: 0.022 });
    wBase.position.set(-2.70, FY + 0.46, -8.00);
    counter.add(wBase);
    var wTop = RN.box(1.44, 0.06, 1.02, MAT.counterTop, { outline: 0.018 });
    wTop.position.set(-2.70, FY + 0.95, -8.00);
    counter.add(wTop);

    /* register */
    var reg = RN.box(0.34, 0.22, 0.34, MAT.dark, { outline: 0.016 });
    reg.position.set(CT_X + 0.05, FY + 1.09, -5.05);
    counter.add(reg);
    var regScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.22),
      new THREE.MeshBasicMaterial({ color: 0x9fe8ff, fog: true }));
    regScreen.rotation.set(-0.35, Math.PI / 2, 0);
    regScreen.position.set(CT_X + 0.24, FY + 1.26, -5.05);
    counter.add(regScreen);
    var regGlow = RN.glow(0x7fd8ff, 0.9, 0.45);
    regGlow.position.set(CT_X + 0.3, FY + 1.26, -5.05);
    counter.add(regGlow);

    var reader = RN.box(0.20, 0.14, 0.16, MAT.metalDark, { outline: 0.012 });
    reader.position.set(CT_X + 0.1, FY + 1.05, -5.75);
    counter.add(reader);

    /* coffee machine */
    var coffee = RN.group(counter, 'coffee');
    var cb = RN.box(0.42, 0.62, 0.44, MAT.metalDark, { outline: 0.02 });
    cb.position.set(CT_X - 0.06, FY + 1.29, -6.90);
    coffee.add(cb);
    var cpanel = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.20),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: true }));
    cpanel.rotation.set(-0.4, Math.PI / 2, 0);
    cpanel.position.set(CT_X + 0.16, FY + 1.42, -6.90);
    coffee.add(cpanel);
    var cglow = RN.glow(0xffc070, 0.9, 0.4);
    cglow.position.set(CT_X + 0.2, FY + 1.4, -6.90);
    coffee.add(cglow);
    var nozzle = RN.cyl(0.05, 0.05, 0.14, 8, MAT.metal, { outline: 0.01 });
    nozzle.position.set(CT_X + 0.06, FY + 1.02, -6.90);
    coffee.add(nozzle);
    for (var cu = 0; cu < 3; cu++) {
      var cup = RN.cyl(0.05, 0.045, 0.10, 8, MAT.white, { outline: 0.008 });
      cup.position.set(CT_X - 0.15, FY + 1.03 + cu * 0.1, -6.62);
      coffee.add(cup);
    }

    /* oden warmer on the wing */
    var oden = RN.group(counter, 'oden');
    var ob = RN.box(1.10, 0.34, 0.70, MAT.steel, { outline: 0.02 });
    ob.position.set(-2.70, FY + 1.14, -8.00);
    oden.add(ob);
    var odenWater = RN.box(1.00, 0.06, 0.60, basic(0xd9a95c), { outline: false });
    odenWater.position.set(-2.70, FY + 1.29, -8.00);
    oden.add(odenWater);
    for (var ok = 0; ok < 7; ok++) {
      var skew = RN.cyl(0.014, 0.014, 0.30, 5, MAT.wood, { outline: 0.005 });
      skew.position.set(-3.12 + ok * 0.14, FY + 1.42, -7.94 + (ok % 2) * 0.12);
      skew.rotation.z = RN.rand(-0.1, 0.1);
      oden.add(skew);
    }
    var odenSign = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.22),
      new THREE.MeshBasicMaterial({ map: RN.tex.hanging('おでん', '#b4552f'), fog: true }));
    odenSign.position.set(-2.70, FY + 1.62, -7.60);
    oden.add(odenSign);

    /* ---------- ice-cream chest freezer ---------- */
    var chest = RN.group(interior, 'chest');
    var chb = RN.box(1.30, 0.92, 0.86, MAT.white, { outline: 0.024 });
    chb.position.set(-2.60, FY + 0.46, -1.55);
    chest.add(chb);
    var chLid = RN.box(1.34, 0.06, 0.90, basic(0xbfe8f5), { outline: false });
    chLid.position.set(-2.60, FY + 0.95, -1.55);
    chest.add(chLid);
    var chLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.30),
      new THREE.MeshBasicMaterial({ map: RN.tex.label('アイス', '#2f6f9f', '#ffffff', 384), fog: true }));
    chLabel.position.set(-2.60, FY + 0.55, -1.12);
    chest.add(chLabel);

    /* ---------- magazine rack ---------- */
    var mag = RN.group(interior, 'magazines');
    var magBase = RN.box(1.70, 0.10, 0.55, MAT.metalDark, { outline: 0.018 });
    magBase.position.set(-4.55, FY + 0.05, -1.42);
    mag.add(magBase);
    for (var mr = 0; mr < 4; mr++) {
      var shelfY = FY + 0.34 + mr * 0.34;
      var sh = RN.box(1.70, 0.04, 0.50, MAT.metal, { outline: 0.012 });
      sh.position.set(-4.55, shelfY, -1.42 + mr * 0.06);
      sh.rotation.x = -0.16;
      mag.add(sh);
      for (var mc = 0; mc < 6; mc++) {
        var cover = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.32),
          new THREE.MeshBasicMaterial({ map: RN.tex.magazine(mc + mr), fog: true }));
        cover.position.set(-5.25 + mc * 0.28, shelfY + 0.18, -1.40 + mr * 0.06);
        cover.rotation.x = -0.16;
        mag.add(cover);
      }
    }
    var magSign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.22),
      new THREE.MeshBasicMaterial({ map: RN.tex.hanging('雑誌', '#2f5f9f'), fog: true, side: THREE.DoubleSide }));
    magSign.position.set(-4.55, FY + 1.85, -1.40);
    mag.add(magSign);

    /* ---------- back door + lockers ---------- */
    var backDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 2.20),
      new THREE.MeshBasicMaterial({ map: RN.tex.backDoor, fog: true }));
    backDoor.rotation.y = Math.PI / 2;
    backDoor.position.set(IX0 + 0.02, FY + 1.10, -7.90);
    interior.add(backDoor);
    var bdFrame = RN.box(0.08, 2.34, 1.20, MAT.frame, { outline: 0.018 });
    bdFrame.position.set(IX0 + 0.03, FY + 1.17, -7.90);
    interior.add(bdFrame);
    var exit = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x63e08a, fog: true }));
    exit.rotation.y = Math.PI / 2;
    exit.position.set(IX0 + 0.09, FY + 2.68, -7.90);
    interior.add(exit);

    var lockers = RN.box(0.55, 1.90, 1.30, MAT.steel, { outline: 0.022 });
    lockers.position.set(IX0 + 0.28, FY + 0.95, -6.60);
    interior.add(lockers);
    for (var lk = 0; lk < 4; lk++) {
      var lkDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.42), MAT.metal);
      lkDoor.rotation.y = Math.PI / 2;
      lkDoor.position.set(IX0 + 0.565, FY + 0.42 + (lk % 2) * 0.5, -7.07 + Math.floor(lk / 2) * 0.64);
      interior.add(lkDoor);
    }

    /* ---------- in-store light boxes ---------- */
    var boxPositions = [
      [IX0 + 0.03, FY + 1.78, -5.30, Math.PI / 2],
      [IX0 + 0.03, FY + 1.78, -0.95, Math.PI / 2],
      [-3.00, FY + 1.78, IZ0 + 0.03, 0]
    ];
    for (var bi2 = 0; bi2 < boxPositions.length; bi2++) {
      var bp = boxPositions[bi2];
      var lb = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62),
        new THREE.MeshBasicMaterial({ map: RN.tex.poster(bi2), fog: true }));
      lb.rotation.y = bp[3];
      lb.position.set(bp[0], bp[1], bp[2]);
      interior.add(lb);
      var lbframe = RN.box(1.06, 0.68, 0.06, MAT.metalDark, { outline: 0.014 });
      lbframe.position.set(bp[0], bp[1], bp[2]);
      lbframe.rotation.y = bp[3];
      interior.add(lbframe);
      var lbGlow = RN.glow(0xfff0d8, 1.6, 0.22);
      lbGlow.position.set(bp[0] + (bp[3] === 0 ? 0 : 0.18), bp[1], bp[2] + (bp[3] === 0 ? 0.18 : 0));
      interior.add(lbGlow);
    }

    /* framed posters on the north wall (clear of the fridges) */
    for (var pp = 0; pp < 2; pp++) {
      var pm = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.92),
        new THREE.MeshBasicMaterial({ map: RN.tex.poster(pp + 3), fog: true }));
      pm.position.set(-3.05 + pp * 0.95, FY + 1.80, IZ0 + 0.03);
      interior.add(pm);
      var pframe = RN.box(0.72, 0.98, 0.05, MAT.metalDark, { outline: 0.012 });
      pframe.position.set(-3.05 + pp * 0.95, FY + 1.80, IZ0 + 0.005);
      interior.add(pframe);
    }

    /* ---------- hanging category signs ---------- */
    var hsigns = [
      ['おにぎり', '#2f8f6a', -5.6, -6.25],
      ['お弁当', '#c25a3a', -7.0, -4.75],
      ['飲み物', '#2f6f9f', -4.2, -6.25],
      ['お菓子', '#b5486f', -4.2, -2.90],
      ['日用品', '#5a5f8f', -6.6, -2.90]
    ];
    for (var hs = 0; hs < hsigns.length; hs++) {
      var hd = hsigns[hs];
      var board = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.24),
        new THREE.MeshBasicMaterial({ map: RN.tex.hanging(hd[0], hd[1]), fog: true, side: THREE.DoubleSide }));
      board.position.set(hd[2], 2.30, hd[3]);
      interior.add(board);
      var rod = RN.cyl(0.012, 0.012, 0.42, 5, MAT.metalDark, { outline: 0.004 });
      rod.position.set(hd[2], 2.53, hd[3]);
      interior.add(rod);
      var board2 = board.clone();
      board2.rotation.y = Math.PI / 2;
      board2.position.set(hd[2] + 0.001, 2.30, hd[3]);
      interior.add(board2);
    }

    /* ---------- floor guidance arrows ---------- */
    var arrowMat = new THREE.MeshBasicMaterial({
      map: RN.tex.arrow, transparent: true, opacity: 0.55, depthWrite: false, fog: true
    });
    var arrowSpots = [
      [-1.30, -5.60, Math.PI / 2],
      [-3.20, -3.10, Math.PI],
      [-3.20, -5.90, Math.PI]
    ];
    for (var ai = 0; ai < arrowSpots.length; ai++) {
      var ap = arrowSpots[ai];
      var ar = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.9), arrowMat);
      ar.rotation.x = -Math.PI / 2;
      ar.rotation.z = ap[2];
      ar.position.set(ap[0], FY + 0.006, ap[1]);
      interior.add(ar);
    }

    /* ---------- baskets + bin ---------- */
    for (var bk = 0; bk < 5; bk++) {
      var basket = RN.box(0.52, 0.11, 0.36, MAT.accent, { outline: 0.012 });
      basket.position.set(-1.15, FY + 0.06 + bk * 0.12, -2.40);
      interior.add(basket);
    }
    var ibin = RN.cyl(0.22, 0.20, 0.72, 12, MAT.metal, { outline: 0.018 });
    ibin.position.set(-1.10, FY + 0.36, -1.30);
    interior.add(ibin);

    /* ---------- copy machine ---------- */
    var copier = RN.box(0.62, 1.45, 0.62, MAT.steel, { outline: 0.022 });
    copier.position.set(-6.90, FY + 0.725, -1.35);
    interior.add(copier);
    var copPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.26),
      new THREE.MeshBasicMaterial({ color: 0x8fe0ff, fog: true }));
    copPanel.rotation.x = -0.5;
    copPanel.position.set(-6.90, FY + 1.30, -1.04);
    interior.add(copPanel);

    return {
      root: root,
      exterior: exterior,
      interior: interior,
      leaves: [leafL, leafR],
      sensor: sensor,
      sensorGlow: sensorGlow,
      rainGlass: [rainGlass1, rainGlass2],
      signGlows: [sg1, sg2],
      band: band,
      signLight: signLight,
      stripGlow: stripGlow,
      pylonGlow: pGlow,
      pylonLight: pLight,
      glow: glowColor,
      counter: counter
    };
  };

})(window.RN);
