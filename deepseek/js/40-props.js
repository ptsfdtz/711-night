/* ------------------------------------------------------------------
   40-props.js  --  street furniture: vending machines, bicycle,
                    umbrella stand, bins, street lamp, utility pole
                    and wires, road signs, guardrail, traffic signal,
                    notice board, AC unit, bollards.
------------------------------------------------------------------ */
(function (RN) {
  'use strict';

  var L = RN.L;

  var WY = L.WALK_Y;                 // 0.14 pavement height

  var PM = {
    poleDark: RN.toon(0x2c303c),
    pole: RN.toon(0x6d7484),
    poleLight: RN.toon(0x9aa2b2),
    steel: RN.toon(0xb2b9c6),
    white: RN.toon(0xe4e8ee),
    dark: RN.toon(0x2a2e3a),
    bin: RN.toon(0x4c5566),
    binLid: RN.toon(0x323a48),
    frame: RN.toon(0x4a5262),
    rubber: RN.toon(0x1c1f28),
    basket: RN.toon(0x9aa8b8),
    glass: new THREE.MeshPhongMaterial({
      color: 0xcfe6f5, specular: 0xffffff, shininess: 120,
      transparent: true, opacity: 0.20, depthWrite: false, side: THREE.DoubleSide
    })
  };

  function tube(a, b, r, mat, seg) {
    var dir = new THREE.Vector3().subVectors(b, a);
    var len = dir.length();
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 6), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    RN.addOutline(m, r * 0.55);
    return m;
  }
  RN.tube = tube;

  function wire(a, b, sag, segs) {
    var pts = [];
    segs = segs || 14;
    for (var i = 0; i <= segs; i++) {
      var t = i / segs;
      var p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y -= Math.sin(t * Math.PI) * sag;
      pts.push(p);
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x171b26, fog: true }));
    return line;
  }
  RN.wire = wire;

  /* ===============================================================
     BICYCLE
     =============================================================== */
  function makeBicycle(frameColor) {
    var g = new THREE.Group();
    var frameMat = RN.toon(frameColor || 0x4f6f8f);
    var rubber = PM.rubber;
    var metal = PM.poleLight;

    var hubR = [-0.54, 0.54];
    for (var i = 0; i < 2; i++) {
      var w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.026, 7, 22), rubber);
      w.position.set(hubR[i], 0.33, 0);
      RN.addOutline(w, 0.012);
      g.add(w);
      var rim = new THREE.Mesh(new THREE.TorusGeometry(0.295, 0.012, 6, 22), metal);
      rim.position.copy(w.position);
      g.add(rim);
      var hub = RN.cyl(0.045, 0.045, 0.07, 8, metal, { outline: 0.01 });
      hub.rotation.x = Math.PI / 2;
      hub.position.copy(w.position);
      g.add(hub);
      for (var sp = 0; sp < 8; sp++) {
        var ang = sp / 8 * Math.PI * 2;
        var s1 = new THREE.Vector3(hubR[i], 0.33, 0);
        var s2 = new THREE.Vector3(hubR[i] + Math.cos(ang) * 0.29, 0.33 + Math.sin(ang) * 0.29, 0);
        var spoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.004, 0.004, 0.58, 3),
          metal
        );
        spoke.position.copy(s1).addScaledVector(new THREE.Vector3().subVectors(s2, s1), 0.5);
        spoke.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(s2, s1).normalize());
        g.add(spoke);
      }
    }

    var bb = new THREE.Vector3(-0.02, 0.34, 0);
    var rear = new THREE.Vector3(-0.54, 0.33, 0);
    var front = new THREE.Vector3(0.54, 0.33, 0);
    var seatT = new THREE.Vector3(-0.24, 0.88, 0);
    var headT = new THREE.Vector3(0.36, 0.94, 0);

    g.add(tube(rear, bb, 0.022, frameMat));
    g.add(tube(rear, seatT, 0.020, frameMat));
    g.add(tube(bb, seatT, 0.022, frameMat));
    g.add(tube(bb, headT, 0.024, frameMat));
    g.add(tube(seatT, headT, 0.021, frameMat));
    g.add(tube(headT, front, 0.018, frameMat));
    g.add(tube(headT, new THREE.Vector3(0.42, 1.02, 0), 0.019, frameMat));

    /* handlebar */
    var hb = RN.cyl(0.016, 0.016, 0.52, 8, metal, { outline: 0.008 });
    hb.rotation.x = Math.PI / 2;
    hb.position.set(0.42, 1.03, 0);
    g.add(hb);
    var grip1 = RN.cyl(0.024, 0.024, 0.12, 8, PM.rubber, { outline: 0.008 });
    grip1.rotation.x = Math.PI / 2;
    grip1.position.set(0.42, 1.03, 0.21);
    g.add(grip1);
    var grip2 = grip1.clone();
    grip2.position.z = -0.21;
    g.add(grip2);

    /* seat */
    var seat = RN.box(0.26, 0.06, 0.13, PM.rubber, { outline: 0.012 });
    seat.position.set(-0.26, 0.93, 0);
    g.add(seat);

    /* basket */
    var basket = RN.box(0.34, 0.24, 0.28, PM.dark, { outline: 0.012 });
    basket.position.set(0.56, 0.82, 0);
    g.add(basket);
    for (var br = 0; br < 3; br++) {
      var rib = RN.box(0.36, 0.016, 0.30, PM.basket, { outline: false });
      rib.position.set(0.56, 0.73 + br * 0.09, 0);
      g.add(rib);
    }

    /* crank + pedals */
    var crank = RN.cyl(0.05, 0.05, 0.05, 8, metal, { outline: 0.01 });
    crank.rotation.x = Math.PI / 2;
    crank.position.copy(bb);
    g.add(crank);
    var pedal = RN.box(0.13, 0.02, 0.06, PM.dark, { outline: 0.008 });
    pedal.position.set(bb.x, bb.y - 0.14, 0.11);
    g.add(pedal);

    /* mudguards */
    var guard = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.016, 5, 12, Math.PI * 0.7), PM.dark);
    guard.position.set(-0.54, 0.33, 0);
    guard.rotation.z = Math.PI * 0.15;
    g.add(guard);

    /* kickstand */
    var kick = tube(new THREE.Vector3(-0.06, 0.30, 0.02), new THREE.Vector3(-0.16, 0.0, 0.16), 0.014, PM.dark);
    g.add(kick);

    return g;
  }
  RN.makeBicycle = makeBicycle;

  /* ===============================================================
     VENDING MACHINE
     =============================================================== */
  function makeVending(parent, x, y, z, ry, warm) {
    var g = RN.group(parent, 'vending');
    g.position.set(x, y, z);
    g.rotation.y = ry;

    var body = RN.box(0.98, 1.88, 0.74, PM.frame, { outline: 0.024 });
    body.position.y = 0.94 + 0.06;
    g.add(body);

    var face = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.76),
      new THREE.MeshBasicMaterial({ map: RN.tex.vending, fog: true }));
    face.position.set(0, 0.94 + 0.06, 0.375);
    g.add(face);

    var glass = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.76), PM.glass);
    glass.position.set(0, 0.94 + 0.06, 0.395);
    g.add(glass);

    var foot = RN.box(1.02, 0.12, 0.78, PM.dark, { outline: 0.016 });
    foot.position.y = 0.06;
    g.add(foot);

    var top = RN.box(1.02, 0.06, 0.78, PM.steel, { outline: 0.014 });
    top.position.y = 1.91;
    g.add(top);

    var tint = warm ? 0xffd9a0 : 0xbfe8ff;
    var gl = RN.glow(tint, 2.6, 0.42);
    gl.position.set(0, 1.1, 0.55);
    g.add(gl);

    return g;
  }

  /* ===============================================================
     STREET LAMP
     =============================================================== */
  function makeStreetLamp(parent, x, z) {
    var g = RN.group(parent, 'streetLamp');
    g.position.set(x, WY, z);

    var base = RN.cyl(0.17, 0.22, 0.30, 10, PM.poleDark, { outline: 0.018 });
    base.position.y = 0.15;
    g.add(base);
    var pole = RN.cyl(0.085, 0.11, 4.55, 10, PM.pole, { outline: 0.018 });
    pole.position.y = 0.30 + 2.275;
    g.add(pole);

    /* curved arm out over the road */
    var pts = [];
    for (var i = 0; i <= 8; i++) {
      var t = i / 8;
      pts.push(new THREE.Vector3(1.15 * t, 4.85 + Math.sin(t * Math.PI * 0.5) * 0.0 + (1 - Math.cos(t * 1.4)) * 0.28, 0));
    }
    for (var k = 0; k < pts.length - 1; k++) {
      g.add(tube(pts[k], pts[k + 1], 0.055, PM.pole, 6));
    }

    var head = RN.box(0.62, 0.13, 0.30, PM.poleDark, { outline: 0.016 });
    head.position.set(1.15, 5.06, 0);
    g.add(head);
    var lens = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.24),
      new THREE.MeshBasicMaterial({ color: 0xeaf4ff, fog: true }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(1.15, 4.99, 0);
    g.add(lens);

    var gl = RN.glow(0xd8ecff, 4.2, 0.5);
    gl.position.set(1.15, 4.9, 0);
    g.add(gl);

    RN.smear(parent, x + 1.15, z, 0xcfe4ff, 5.2, 7.5, 0.34, WY + 0.015);

    return g;
  }

  /* ===============================================================
     UTILITY POLE + WIRES
     =============================================================== */
  function makePole(parent, x, z, h) {
    var g = RN.group(parent, 'utilityPole');
    g.position.set(x, WY, z);

    var pole = RN.cyl(0.14, 0.19, h, 10, RN.toon(0x4a4f5c), { outline: 0.022 });
    pole.position.y = h / 2;
    g.add(pole);

    var arms = [h - 0.55, h - 1.35];
    for (var i = 0; i < arms.length; i++) {
      var arm = RN.box(0.10, 0.10, 1.9, RN.toon(0x3f4450), { outline: 0.016 });
      arm.position.set(0, arms[i], 0);
      g.add(arm);
      for (var j = -1; j <= 1; j++) {
        if (j === 0) continue;
        var ins = RN.cyl(0.045, 0.05, 0.14, 8, PM.white, { outline: 0.01 });
        ins.position.set(0, arms[i] + 0.12, j * 0.8);
        g.add(ins);
      }
    }

    /* transformer drum */
    var drum = RN.cyl(0.24, 0.24, 0.62, 12, RN.toon(0x5b6170), { outline: 0.018 });
    drum.position.set(0, h - 2.4, 0.32);
    g.add(drum);

    /* service cable box */
    var box = RN.box(0.36, 0.5, 0.26, RN.toon(0x3f4450), { outline: 0.016 });
    box.position.set(0, 2.2, 0.26);
    g.add(box);

    return g;
  }

  /* ===============================================================
     TRAFFIC SIGNAL
     =============================================================== */
  function makeTrafficLight(parent, x, z) {
    var g = RN.group(parent, 'traffic');
    g.position.set(x, WY, z);

    var pole = RN.cyl(0.09, 0.12, 5.3, 10, RN.toon(0x3a3f4c), { outline: 0.02 });
    pole.position.y = 2.65;
    g.add(pole);

    /* arm reaching over the road (-x) */
    var a = new THREE.Vector3(0, 5.15, 0);
    var b = new THREE.Vector3(-1.95, 5.15, 0);
    g.add(tube(a, b, 0.06, RN.toon(0x3a3f4c), 8));

    /* vehicle head, facing +z so the camera can see it */
    var head = RN.box(1.02, 0.38, 0.30, RN.toon(0x23262f), { outline: 0.02 });
    head.position.set(-1.72, 4.92, 0);
    g.add(head);

    var lampGeo = new THREE.CircleGeometry(0.115, 16);
    var lamps = {};
    var names = ['red', 'yellow', 'green'];
    var colors = [0xff3b30, 0xffcc33, 0x35e06a];
    for (var i = 0; i < 3; i++) {
      var mat = new THREE.MeshBasicMaterial({ color: colors[i], fog: true });
      var lm = new THREE.Mesh(lampGeo, mat);
      lm.position.set(-2.06 + i * 0.34, 4.92, 0.155);
      g.add(lm);
      var halo = RN.glow(colors[i], 1.5, 0.0);
      halo.position.set(-2.06 + i * 0.34, 4.92, 0.2);
      g.add(halo);
      lamps[names[i]] = { mesh: lm, mat: mat, halo: halo, base: colors[i] };
    }

    /* pedestrian head on the pole */
    var ped = RN.box(0.34, 0.62, 0.24, RN.toon(0x23262f), { outline: 0.016 });
    ped.position.set(0, 3.05, 0.16);
    g.add(ped);
    var pedGeo = new THREE.PlaneGeometry(0.24, 0.22);
    var pr = new THREE.Mesh(pedGeo, new THREE.MeshBasicMaterial({ color: 0xff3b30, fog: true }));
    pr.position.set(0, 3.19, 0.29);
    g.add(pr);
    var pg = new THREE.Mesh(pedGeo, new THREE.MeshBasicMaterial({ color: 0x35e06a, fog: true }));
    pg.position.set(0, 2.92, 0.29);
    g.add(pg);
    var pedGlow = RN.glow(0x35e06a, 0.9, 0.35);
    pedGlow.position.set(0, 3.05, 0.35);
    g.add(pedGlow);

    RN.smear(parent, x - 1.72, z, 0xff5a4a, 3.0, 5.0, 0.24, WY + 0.015);

    return { group: g, lamps: lamps, ped: { r: pr, g: pg, glow: pedGlow } };
  }

  /* ===============================================================
     NOTICE BOARD
     =============================================================== */
  function makeNoticeBoard(parent, x, z, ry) {
    var g = RN.group(parent, 'notice');
    g.position.set(x, WY, z);
    g.rotation.y = ry;

    var legMat = RN.toon(0x3a3f4c);
    for (var i = -1; i <= 1; i += 2) {
      var leg = RN.cyl(0.045, 0.045, 1.35, 8, legMat, { outline: 0.012 });
      leg.position.set(i * 0.60, 0.675, 0);
      g.add(leg);
    }
    var board = RN.box(1.50, 1.42, 0.09, RN.toon(0x6b5636), { outline: 0.02 });
    board.position.y = 1.62;
    g.add(board);
    var face = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 1.28),
      new THREE.MeshBasicMaterial({ map: RN.tex.noticeBoard, fog: true }));
    face.position.set(0, 1.62, 0.052);
    g.add(face);
    var roof = RN.box(1.64, 0.07, 0.30, legMat, { outline: 0.014 });
    roof.position.set(0, 2.37, 0.06);
    roof.rotation.x = -0.12;
    g.add(roof);
    var lampBar = RN.box(0.7, 0.06, 0.10, new THREE.MeshBasicMaterial({ color: 0xfff0d0, fog: true }), { outline: false });
    lampBar.position.set(0, 2.28, 0.10);
    g.add(lampBar);
    var gl = RN.glow(0xffe6b8, 1.6, 0.3);
    gl.position.set(0, 2.2, 0.15);
    g.add(gl);

    return g;
  }

  /* ===============================================================
     STREET NAME SIGN
     =============================================================== */
  function makeStreetSign(parent, x, z, ry) {
    var g = RN.group(parent, 'streetSign');
    g.position.set(x, WY, z);
    g.rotation.y = ry;
    var pole = RN.cyl(0.045, 0.05, 2.6, 8, PM.pole, { outline: 0.012 });
    pole.position.y = 1.3;
    g.add(pole);
    var plate = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.42),
      new THREE.MeshBasicMaterial({ map: RN.tex.streetSign, fog: true, side: THREE.DoubleSide }));
    plate.position.set(0, 2.32, 0.03);
    g.add(plate);
    var back = RN.box(1.4, 0.46, 0.04, PM.poleLight, { outline: 0.012 });
    back.position.set(0, 2.32, -0.01);
    g.add(back);
    return g;
  }

  /* ===============================================================
     GUARDRAIL
     =============================================================== */
  function makeGuardrail(parent, x0, z0, x1, z1) {
    var g = RN.group(parent, 'guardrail');
    var a = new THREE.Vector3(x0, WY, z0);
    var b = new THREE.Vector3(x1, WY, z1);
    var dir = new THREE.Vector3().subVectors(b, a);
    var len = dir.length();
    var n = Math.max(2, Math.round(len / 1.6));
    for (var i = 0; i <= n; i++) {
      var p = new THREE.Vector3().lerpVectors(a, b, i / n);
      var post = RN.cyl(0.045, 0.045, 0.86, 8, PM.pole, { outline: 0.012 });
      post.position.set(p.x, WY + 0.43, p.z);
      g.add(post);
      var cap = RN.cyl(0.055, 0.055, 0.06, 8, PM.poleLight, { outline: 0.01 });
      cap.position.set(p.x, WY + 0.87, p.z);
      g.add(cap);
    }
    for (var r = 0; r < 2; r++) {
      var y = WY + 0.72 - r * 0.26;
      g.add(tube(new THREE.Vector3(a.x, y, a.z), new THREE.Vector3(b.x, y, b.z), 0.036, PM.poleLight, 6));
    }
    return g;
  }

  /* ===============================================================
     BIN / UMBRELLA STAND / BOLLARD
     =============================================================== */
  function makeBin(parent, x, z, color, label) {
    var g = RN.group(parent, 'bin');
    g.position.set(x, WY, z);
    var body = RN.cyl(0.23, 0.20, 0.78, 12, RN.toon(color), { outline: 0.018 });
    body.position.y = 0.39;
    g.add(body);
    var lid = RN.cyl(0.25, 0.24, 0.09, 12, PM.binLid, { outline: 0.014 });
    lid.position.y = 0.82;
    g.add(lid);
    var hole = RN.cyl(0.10, 0.10, 0.10, 10, PM.dark, { outline: 0.01 });
    hole.position.y = 0.83;
    g.add(hole);
    var tag = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.20),
      new THREE.MeshBasicMaterial({ map: RN.tex.label(label, '#e8ecef', '#3a4a56', 256), fog: true }));
    tag.position.set(0, 0.52, 0.235);
    g.add(tag);
    return g;
  }

  function makeUmbrellaStand(parent, x, z) {
    var g = RN.group(parent, 'umbrellaStand');
    g.position.set(x, WY, z);
    var tub = RN.cyl(0.20, 0.18, 0.62, 14, PM.bin, { outline: 0.016 });
    tub.position.y = 0.31;
    g.add(tub);
    var rim = RN.cyl(0.215, 0.215, 0.05, 14, PM.poleLight, { outline: 0.012 });
    rim.position.y = 0.61;
    g.add(rim);
    var cols = [0x3a5f8f, 0x8f3a4a, 0x3f7a5a, 0x6a5a8f, 0x8f7a3a];
    for (var i = 0; i < 5; i++) {
      var ang = i / 5 * Math.PI * 2 + 0.4;
      var shaft = RN.cyl(0.012, 0.012, 0.80, 5, PM.poleLight, { outline: 0.004 });
      shaft.position.set(Math.cos(ang) * 0.08, 0.72, Math.sin(ang) * 0.08);
      shaft.rotation.z = Math.cos(ang) * 0.16;
      shaft.rotation.x = -Math.sin(ang) * 0.16;
      g.add(shaft);
      var canopy = RN.cyl(0.0, 0.115, 0.20, 8, RN.toon(cols[i]), { outline: 0.008 });
      canopy.position.set(Math.cos(ang) * 0.16, 0.99, Math.sin(ang) * 0.16);
      canopy.rotation.z = Math.cos(ang) * 0.16;
      canopy.rotation.x = -Math.sin(ang) * 0.16;
      g.add(canopy);
    }
    return g;
  }

  function makeBollard(parent, x, z) {
    var g = RN.group(parent, 'bollard');
    g.position.set(x, WY, z);
    var b = RN.cyl(0.09, 0.11, 0.78, 10, PM.pole, { outline: 0.016 });
    b.position.y = 0.39;
    g.add(b);
    var band = RN.cyl(0.095, 0.095, 0.08, 10,
      new THREE.MeshBasicMaterial({ color: 0xe8d98a, fog: true }), { outline: false });
    band.position.y = 0.62;
    g.add(band);
    var cap = RN.cyl(0.10, 0.09, 0.06, 10, PM.poleLight, { outline: 0.01 });
    cap.position.y = 0.81;
    g.add(cap);
    return g;
  }

  /* ===============================================================
     BUILD
     =============================================================== */
  RN.buildProps = function (scene) {
    var root = RN.group(scene, 'props');

    /* ---- vending machines along the store's +Z wall ---- */
    makeVending(root, -1.95, WY, -0.205, 0, true);
    makeVending(root, -3.05, WY, -0.205, 0, false);
    /* one on the +X wall, down the street */
    makeVending(root, -0.205, WY, -6.60, Math.PI / 2, false);
    RN.smear(root, -3.05, -0.10, 0xffd9a0, 3.0, 3.6, 0.30, WY + 0.015);
    RN.smear(root, -0.10, -6.60, 0xbfe8ff, 2.6, 3.2, 0.26, WY + 0.015);

    /* ---- bins beside the machines ---- */
    makeBin(root, -1.15, -0.30, 0x4a6f8f, '可燃');
    makeBin(root, -0.75, -0.30, 0x8f6a4a, 'ペット');
    makeBin(root, -0.35, -0.30, 0x5a7a5a, '缶');

    /* ---- cigarette machine + ashtray ---- */
    var cig = RN.box(0.62, 1.35, 0.42, PM.frame, { outline: 0.02 });
    cig.position.set(-4.15, WY + 0.675, -0.28);
    root.add(cig);
    var cigFace = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.22),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0, fog: true }));
    cigFace.position.set(-4.15, WY + 0.675, -0.065);
    root.add(cigFace);
    var cigGlow = RN.glow(0xffc070, 1.4, 0.28);
    cigGlow.position.set(-4.15, WY + 0.7, 0.05);
    root.add(cigGlow);

    /* ---- entrance mat ---- */
    var mat = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.9),
      new THREE.MeshBasicMaterial({ map: RN.tex.mat, fog: true }));
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(-0.06, WY + 0.012, -3.60);
    root.add(mat);

    /* ---- umbrella stand at the door ---- */
    makeUmbrellaStand(root, -0.30, -2.62);

    /* ---- nobori banner by the kerb ---- */
    var nobori = RN.group(root, 'nobori');
    var npole = RN.cyl(0.026, 0.032, 2.55, 8, PM.pole, { outline: 0.01 });
    npole.position.set(0.92, WY + 1.275, -5.30);
    nobori.add(npole);
    var narm = RN.box(0.40, 0.026, 0.026, PM.poleLight, { outline: 0.008 });
    narm.position.set(0.92, WY + 2.42, -5.30);
    nobori.add(narm);
    var nflag = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 1.30),
      new THREE.MeshBasicMaterial({ map: RN.tex.banner, side: THREE.DoubleSide, fog: true }));
    nflag.position.set(0.92, WY + 1.72, -5.30 + 0.0);
    nflag.rotation.y = Math.PI / 2;
    nflag.position.x = 0.92 - 0.19;
    nobori.add(nflag);
    var nglow = RN.glow(0xffffff, 1.3, 0.16);
    nglow.position.set(0.92 - 0.19, WY + 1.72, -5.30);
    nobori.add(nglow);
    root.add(nobori);

    /* ---- bicycles ---- */
    var b1 = makeBicycle(0x46688f);
    b1.position.set(0.55, WY, -1.55);
    b1.rotation.y = -Math.PI / 2 + 0.16;
    root.add(b1);
    RN.contactShadow(root, 0.55, -1.55, 1.4, 0.7, 0.5, WY + 0.006);

    var b2 = makeBicycle(0x8f4a4a);
    b2.position.set(0.72, WY, -2.85);
    b2.rotation.y = -Math.PI / 2 - 0.08;
    root.add(b2);
    RN.contactShadow(root, 0.72, -2.85, 1.4, 0.7, 0.5, WY + 0.006);

    var b3 = makeBicycle(0x4a8f6a);
    b3.position.set(-9.15, WY, 0.55);
    b3.rotation.y = Math.PI / 2 + 0.1;
    root.add(b3);

    /* bicycle rack bars */
    for (var rk = 0; rk < 3; rk++) {
      var u = RN.group(root, 'rack');
      var zz = -1.35 - rk * 1.3;
      var a = new THREE.Vector3(0.95, WY + 0.42, zz);
      var b = new THREE.Vector3(0.95, WY + 0.42, zz + 0.7);
      u.add(tube(new THREE.Vector3(a.x, WY, a.z), new THREE.Vector3(a.x, WY + 0.42, a.z), 0.03, PM.poleLight, 6));
      u.add(tube(new THREE.Vector3(b.x, WY, b.z), new THREE.Vector3(b.x, WY + 0.42, b.z), 0.03, PM.poleLight, 6));
      u.add(tube(a, b, 0.03, PM.poleLight, 6));
      root.add(u);
    }

    /* ---- street lamp ---- */
    makeStreetLamp(root, 1.05, 2.80);

    /* ---- utility poles + overhead wires ---- */
    var p1 = makePole(root, 1.05, 9.00, 7.4);
    var p2 = makePole(root, 1.05, 0.55, 7.4);
    var p3 = makePole(root, 8.15, 4.10, 7.0);

    function topOf(poleGroup, y, zoff) {
      return new THREE.Vector3(poleGroup.position.x, WY + y, poleGroup.position.z + zoff);
    }
    var wires = RN.group(root, 'wires');
    var sag = [0.55, 0.5, 0.45];
    var zoffs = [-0.8, 0, 0.8];
    for (var wi = 0; wi < 3; wi++) {
      wires.add(wire(topOf(p1, 7.4 - 0.55, zoffs[wi]), topOf(p2, 7.4 - 0.55, zoffs[wi]), sag[wi]));
      wires.add(wire(topOf(p1, 7.4 - 1.35, zoffs[wi]), topOf(p2, 7.4 - 1.35, zoffs[wi]), sag[wi] * 0.8));
    }
    /* wires heading off the base and across the road */
    wires.add(wire(topOf(p2, 6.85, -0.8), new THREE.Vector3(1.05, WY + 6.6, -10.4), 0.5));
    wires.add(wire(topOf(p2, 6.85, 0.0), new THREE.Vector3(1.05, WY + 6.5, -10.4), 0.55));
    wires.add(wire(topOf(p2, 6.05, 0.8), new THREE.Vector3(1.05, WY + 5.9, -10.4), 0.5));
    wires.add(wire(topOf(p2, 6.85, 0.8), topOf(p3, 6.45, 0.0), 0.6));
    wires.add(wire(topOf(p1, 6.85, 0.8), new THREE.Vector3(1.05, WY + 6.7, 10.4), 0.5));

    /* a drooping service cable to the store */
    wires.add(wire(topOf(p2, 5.4, -0.3), new THREE.Vector3(-0.4, WY + 4.6, -1.2), 0.35));

    /* ---- street name sign ---- */
    makeStreetSign(root, 1.00, 1.05, -0.5);

    /* ---- notice board near the alley mouth ---- */
    makeNoticeBoard(root, -8.95, 0.80, 0.10);

    /* ---- traffic signal on the far corner ---- */
    var traffic = makeTrafficLight(root, 8.15, 7.90);

    /* ---- guardrails ---- */
    makeGuardrail(root, 1.15, -5.4, 1.15, -9.2);
    makeGuardrail(root, -5.2, 1.15, -9.2, 1.15);

    /* ---- bollards along the corner ---- */
    var bollardSpots = [
      [1.14, -4.9], [1.14, -5.2],
      [-0.75, 1.14], [-1.05, 1.14]
    ];
    for (var bs = 0; bs < bollardSpots.length; bs++) {
      makeBollard(root, bollardSpots[bs][0], bollardSpots[bs][1]);
    }

    /* ---- AC outdoor unit in the alley ---- */
    var ac = RN.box(0.80, 0.62, 0.34, PM.steel, { outline: 0.02 });
    ac.position.set(-9.18, 0.34, -3.05);
    ac.rotation.y = Math.PI / 2;
    root.add(ac);
    var acFan = RN.cyl(0.20, 0.20, 0.05, 14, PM.dark, { outline: 0.012 });
    acFan.rotation.z = Math.PI / 2;
    acFan.position.set(-8.99, 0.34, -3.05);
    root.add(acFan);

    /* ---- parking sign ---- */
    var psign = RN.group(root, 'parkSign');
    var pp = RN.cyl(0.045, 0.05, 2.1, 8, PM.pole, { outline: 0.012 });
    pp.position.set(1.06, WY + 1.05, -7.40);
    psign.add(pp);
    var plate = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.48),
      new THREE.MeshBasicMaterial({ map: RN.tex.label('P', '#1d4f9f', '#ffffff', 256), fog: true, side: THREE.DoubleSide }));
    plate.position.set(1.06, WY + 1.92, -7.40);
    plate.rotation.y = 0.3;
    psign.add(plate);
    root.add(psign);

    /* ---- small potted plants by the door ---- */
    for (var pi = 0; pi < 2; pi++) {
      var px = -0.32 + pi * 0.62;
      var pot = RN.cyl(0.13, 0.10, 0.26, 10, RN.toon(0x8a6a52), { outline: 0.014 });
      pot.position.set(px, WY + 0.13, -4.75);
      root.add(pot);
      var leaf = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), RN.toon(0x35604a));
      leaf.position.set(px, WY + 0.40, -4.75);
      leaf.scale.set(1, 0.9, 1);
      RN.addOutline(leaf, 0.016);
      root.add(leaf);
    }

    return { root: root, traffic: traffic, poles: [p1, p2, p3], wires: wires };
  };

})(window.RN);
