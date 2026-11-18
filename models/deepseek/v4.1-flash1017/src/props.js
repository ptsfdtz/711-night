/* props.js — street furniture with a little bit of story in every silhouette */
(function () {
  "use strict";

  const T = THREE;
  const C = NM.C;
  const P = (window.NMProps = {});

  /* --------------------------------------------------------------------- */
  /* Utility pole & overhead lines                                         */
  /* --------------------------------------------------------------------- */

  P.utilityPole = function (parent, opts) {
    const o = Object.assign({ x: 0, z: 0, baseY: 0.14, height: 8.8, lamp: false, dir: 1, signs: true }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    parent.add(g);

    const concrete = NM.toon(0x5b6665);
    const dark = NM.toon(0x394747);
    // concrete foot and base collar
    NM.cyl(g, { r: 0.31, rb: 0.35, h: 0.16, x: 0, y: 0.08, z: 0, color: 0x6d7773, outline: true });
    NM.cyl(g, { r: 0.21, rb: 0.24, h: 0.42, x: 0, y: 0.19, z: 0, color: 0x68736f, outline: true });
    // yellow/black warning wraps
    for (let i = 0; i < 4; i++) {
      NM.cyl(g, { r: 0.225 - i * 0.003, h: 0.055, x: 0, y: 0.23 + i * 0.08, z: 0, color: i % 2 ? 0x222a29 : 0xb69143, outline: false, seg: 12 });
    }
    // tall shaft
    NM.cyl(g, { r: 0.115, rb: 0.165, h: o.height, x: 0, y: o.height / 2 + 0.3, z: 0, color: 0x596462, seg: 12, outline: true });
    NM.cyl(g, { r: 0.13, h: 0.16, x: 0, y: o.height + 0.35, z: 0, color: 0x475553, outline: true, seg: 12 });
    // band details
    [2.1, 3.9, 6.1].forEach((y) => {
      NM.cyl(g, { r: 0.143 - y * 0.006, h: 0.075, x: 0, y: y, z: 0, color: 0x87918b, outline: false, seg: 12 });
    });
    // step bolts
    for (let i = 0; i < 7; i++) {
      NM.cyl(g, { r: 0.012, h: 0.2, x: 0.1, y: 2.4 + i * 0.52, z: 0, color: 0x343f3e, rotZ: Math.PI / 2, outline: false });
    }

    // crossarms & insulators
    const armY = o.height + 0.18;
    NM.box(g, { w: 1.7, h: 0.09, d: 0.12, x: 0, y: armY, z: 0, color: 0x3d4b49, outline: true });
    NM.box(g, { w: 1.25, h: 0.075, d: 0.1, x: 0, y: armY - 0.42, z: 0, color: 0x465452, outline: true });
    [-0.75, -0.36, 0.36, 0.75].forEach((x) => {
      NM.cyl(g, { r: 0.055, h: 0.16, x: x, y: armY + 0.12, z: 0, color: 0xc3c5b8, outline: true, seg: 8 });
      NM.cyl(g, { r: 0.03, h: 0.06, x: x, y: armY + 0.23, z: 0, color: 0x55645f, outline: false, seg: 8 });
    });
    [-0.52, 0.02, 0.52].forEach((x) => {
      NM.cyl(g, { r: 0.045, h: 0.12, x: x, y: armY - 0.35, z: 0, color: 0xb9bbae, outline: true, seg: 8 });
    });

    // transformers
    const tx = new T.Group();
    tx.position.set(-0.3, 6.3, 0.03);
    g.add(tx);
    NM.cyl(tx, { r: 0.24, h: 0.7, x: 0, y: 0, z: 0, color: 0x6e7772, rotZ: Math.PI / 2, outline: true, seg: 12 });
    NM.cyl(tx, { r: 0.255, h: 0.06, x: 0.35, y: 0, z: 0, color: 0x515c58, rotZ: Math.PI / 2, outline: false, seg: 12 });
    NM.cyl(tx, { r: 0.255, h: 0.06, x: -0.35, y: 0, z: 0, color: 0x515c58, rotZ: Math.PI / 2, outline: false, seg: 12 });
    NM.box(tx, { w: 0.08, h: 0.62, d: 0.22, x: 0.08, y: 0.14, z: 0, color: 0x4a5652, outline: true });
    NM.cyl(tx, { r: 0.23, h: 0.62, x: -0.4, y: 0.63, z: 0.06, color: 0x6e7772, rotZ: Math.PI / 2, outline: true, seg: 12 });

    // junction boxes and small router
    NM.box(g, { w: 0.28, h: 0.56, d: 0.22, x: 0.2, y: 4.3, z: 0.01, color: 0x7c8580, outline: true });
    NM.box(g, { w: 0.2, h: 0.32, d: 0.18, x: -0.2, y: 3.5, z: 0.01, color: 0x626d68, outline: true });
    NM.cyl(g, { r: 0.12, h: 0.1, x: 0.18, y: 5.1, z: 0.1, color: 0x3e4b49, rotZ: Math.PI / 2, outline: true });
    // small service loop
    const loopPts = [];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      loopPts.push(new T.Vector3(Math.cos(a) * 0.45, 5.65 - Math.sin(a) * 0.38, 0.16 + Math.sin(a) * 0.08));
    }
    NM.line(g, loopPts, 0x1a2224, 0.88);

    // Japanese pole number / notice stickers
    const plate = TEX.labelTexture("星町 2-14", { width: 512, height: 130, bg: "#e7dfc6", fg: "#33413d", size: 49 });
    NM.panel(g, { map: plate, w: 0.31, h: 0.08, x: 0, y: 2.75, z: 0.152, transparent: true, depthWrite: false, toneMapped: true });
    const noClimb = TEX.labelTexture("感電注意", { width: 512, height: 256, bg: "#c1aa4b", fg: "#252b27", size: 80 });
    NM.panel(g, { map: noClimb, w: 0.26, h: 0.13, x: 0, y: 3.2, z: 0.15, transparent: true, depthWrite: false, toneMapped: true });

    // lamp arm
    if (o.lamp) {
      const armPts = [
        new T.Vector3(0, 7.45, 0.06),
        new T.Vector3(0, 7.72, 0.58),
        new T.Vector3(0, 7.78, 1.45),
        new T.Vector3(0, 7.62, 2.32 * o.dir),
      ];
      if (o.dir < 0) {
        armPts[1].z *= -1;
        armPts[2].z *= -1;
        armPts[3].z *= -1;
      }
      NM.pipePath(g, armPts, 0.045, 0x313e3e, { segments: 20, radial: 6 });
      const end = armPts[3];
      const lampPos = new T.Vector3(end.x, end.y - 0.1, end.z);
      NM.box(g, { w: 0.34, h: 0.15, d: 0.54, x: lampPos.x, y: lampPos.y, z: lampPos.z, color: 0x3b4746, outline: true });
      const lens = new T.Mesh(new T.PlaneGeometry(0.3, 0.43), new T.MeshBasicMaterial({ color: 0xffdca3, toneMapped: false }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(lampPos.x, lampPos.y - 0.08, lampPos.z);
      g.add(lens);
      NM.glowSprite(g, { x: lampPos.x, y: lampPos.y - 0.12, z: lampPos.z, sx: 2.5, sy: 2.5, color: 0xffc47c, opacity: 0.55, depthTest: true });
      NM.glowSprite(g, { x: lampPos.x, y: lampPos.y - 0.18, z: lampPos.z, sx: 5.0, sy: 2.4, color: 0xffa95e, opacity: 0.18, depthTest: true });
      g.userData.lampWorld = new T.Vector3(o.x + lampPos.x, o.baseY + lampPos.y, o.z + lampPos.z);
    }

    // signs
    if (o.signs) {
      const signMat = new T.MeshBasicMaterial({ map: TEX.trafficSign("street"), toneMapped: false });
      const street = new T.Mesh(new T.PlaneGeometry(1.28, 0.43), signMat);
      street.position.set(0.36, 4.42, 0.15);
      street.rotation.y = 0.04;
      g.add(street);
      NM.box(g, { w: 0.03, h: 0.03, d: 0.34, x: 0.36, y: 4.65, z: 0.01, color: 0x3c4743, outline: false });
      const one = new T.Mesh(new T.PlaneGeometry(0.46, 0.46), new T.MeshBasicMaterial({ map: TEX.trafficSign("oneway"), toneMapped: false }));
      one.position.set(-0.24, 3.79, 0.16);
      one.rotation.z = -0.03;
      g.add(one);
      NM.box(g, { w: 0.03, h: 0.03, d: 0.3, x: -0.24, y: 3.79, z: 0.01, color: 0x3c4743, outline: false });
    }

    g.userData.anchorTop = new T.Vector3(o.x, o.baseY + o.height + 0.36, o.z);
    g.userData.anchorSide = new T.Vector3(o.x + 0.75, o.baseY + armY + 0.2, o.z);
    return g;
  };

  P.wire = function (parent, points, color, opacity) {
    return NM.line(parent, points, color == null ? 0x11181b : color, opacity == null ? 0.9 : opacity);
  };

  /* --------------------------------------------------------------------- */
  /* Traffic signal                                                         */
  /* --------------------------------------------------------------------- */

  P.trafficLight = function (parent, opts) {
    const o = Object.assign({ x: 3.55, z: 8.85, baseY: 0.14, rotY: 0 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);
    const poleMat = NM.toon(0x465554);
    NM.cyl(g, { r: 0.26, rb: 0.29, h: 0.15, x: 0, y: 0.075, z: 0, color: 0x737b75, outline: true });
    NM.cyl(g, { r: 0.075, rb: 0.1, h: 4.2, x: 0, y: 2.1, z: 0, color: 0x4c5957, outline: true, seg: 10 });
    NM.cyl(g, { r: 0.09, h: 0.14, x: 0, y: 4.28, z: 0, color: 0x374442, outline: true, seg: 10 });

    const lensMats = { red: null, amber: null, green: null };
    const glows = {};
    const head = new T.Group();
    head.position.set(0, 3.63, 0.2);
    g.add(head);
    NM.box(head, { w: 1.14, h: 0.36, d: 0.26, x: 0, y: 0, z: 0, color: 0x1f292b, outline: true });
    NM.box(head, { w: 1.22, h: 0.08, d: 0.32, x: 0, y: 0.2, z: 0, color: 0x2c3838, outline: true });
    NM.box(head, { w: 1.22, h: 0.08, d: 0.32, x: 0, y: -0.2, z: 0, color: 0x2c3838, outline: true });
    const colors = { red: 0xed5c4d, amber: 0xe3a64c, green: 0x64d6b7 };
    const lensPositions = [
      { key: "red", x: -0.36 },
      { key: "amber", x: 0 },
      { key: "green", x: 0.36 },
    ];
    lensPositions.forEach((lp) => {
      const mat = new T.MeshBasicMaterial({ color: 0x2c3534, toneMapped: false });
      lensMats[lp.key] = mat;
      const lens = new T.Mesh(new T.CircleGeometry(0.115, 22), mat);
      lens.position.set(lp.x, 0, 0.135);
      head.add(lens);
      const rim = new T.Mesh(new T.RingGeometry(0.117, 0.14, 22), NM.toon(0x0e1516));
      rim.position.set(lp.x, 0, 0.132);
      head.add(rim);
      // small visor
      NM.box(head, { w: 0.27, h: 0.04, d: 0.34, x: lp.x, y: 0.16, z: 0.11, color: 0x1a2425, outline: false, rotX: 0.18 });
      glows[lp.key] = NM.glowSprite(head, {
        x: lp.x,
        y: 0,
        z: 0.2,
        sx: 1.05,
        sy: 1.05,
        color: colors[lp.key],
        opacity: 0.0,
        depthTest: true,
      });
    });

    // little pedestrian signal
    const ped = new T.Group();
    ped.position.set(0.56, 2.55, 0.18);
    g.add(ped);
    NM.box(ped, { w: 0.31, h: 0.6, d: 0.22, x: 0, y: 0, z: 0, color: 0x202a2b, outline: true });
    const pedRed = new T.Mesh(new T.PlaneGeometry(0.18, 0.18), new T.MeshBasicMaterial({ color: 0x331f1c, toneMapped: false }));
    pedRed.position.set(0, 0.13, 0.115);
    ped.add(pedRed);
    const pedGreen = new T.Mesh(new T.PlaneGeometry(0.18, 0.18), new T.MeshBasicMaterial({ color: 0x1d3129, toneMapped: false }));
    pedGreen.position.set(0, -0.13, 0.115);
    ped.add(pedGreen);
    const pedGlowR = NM.glowSprite(ped, { x: 0, y: 0.13, z: 0.18, sx: 0.5, sy: 0.5, color: 0xf56c58, opacity: 0.0, depthTest: true });
    const pedGlowG = NM.glowSprite(ped, { x: 0, y: -0.13, z: 0.18, sx: 0.5, sy: 0.5, color: 0x67e2be, opacity: 0.0, depthTest: true });
    NM.box(g, { w: 0.03, h: 0.03, d: 0.26, x: 0.56, y: 2.9, z: 0, color: 0x303d3b, outline: false });

    const on = { red: false, amber: false, green: true, pedRed: true };
    const offColors = { red: 0x33211f, amber: 0x332b1e, green: 0x1c322c };
    const apply = (activeIndex) => {
      const keys = ["red", "amber", "green"];
      lensPositions.forEach((lp, i) => {
        const isActive = i === activeIndex;
        lensMats[lp.key].color.setHex(isActive ? colors[lp.key] : offColors[lp.key]);
        glows[lp.key].material.opacity = isActive ? 0.35 : 0;
        on[lp.key] = isActive;
      });
      const pedGo = activeIndex === 0;
      pedRed.material.color.setHex(pedGo ? 0x331f1c : 0xea6451);
      pedGreen.material.color.setHex(pedGo ? 0x65dcb8 : 0x1d3129);
      pedGlowR.material.opacity = pedGo ? 0 : 0.3;
      pedGlowG.material.opacity = pedGo ? 0.28 : 0;
      g.userData.active = keys[activeIndex];
    };
    apply(2);

    const update = (time) => {
      const cycle = time % 13.5;
      let active = 2;
      if (cycle > 6.6 && cycle <= 8.1) active = 1;
      else if (cycle > 8.1) active = 0;
      if (active !== g.userData._active) {
        apply(active);
        g.userData._active = active;
      }
    };
    g.userData.update = update;
    g.userData.activeColors = colors;
    return g;
  };

  /* --------------------------------------------------------------------- */
  /* Guard rail                                                            */
  /* --------------------------------------------------------------------- */

  P.guardrail = function (parent, x1, z1, x2, z2, y) {
    const baseY = y == null ? 0.14 : y;
    const g = new T.Group();
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.sqrt(dx * dx + dz * dz);
    g.position.set((x1 + x2) / 2, baseY, (z1 + z2) / 2);
    g.rotation.y = Math.atan2(-dz, dx);
    parent.add(g);
    const white = NM.toon(0xd0d5c6);
    const count = Math.max(2, Math.round(len / 1.25) + 1);
    for (let i = 0; i < count; i++) {
      const x = -len / 2 + (i / (count - 1)) * len;
      NM.cyl(g, { r: 0.045, h: 0.83, x: x, y: 0.415, z: 0, color: 0xc8cec1, outline: true, seg: 8 });
      NM.cyl(g, { r: 0.11, h: 0.06, x: x, y: 0.03, z: 0, color: 0x4a5b58, outline: true, seg: 10 });
      NM.box(g, { w: 0.09, h: 0.085, d: 0.1, x: x, y: 0.79, z: 0, color: 0x8c9186, outline: false });
    }
    NM.cyl(g, { r: 0.042, h: len, x: 0, y: 0.77, z: 0, color: 0xd2d7c8, rotZ: Math.PI / 2, outline: false, seg: 8, mat: white });
    NM.cyl(g, { r: 0.034, h: len, x: 0, y: 0.48, z: 0, color: 0xc5cabc, rotZ: Math.PI / 2, outline: false, seg: 8 });
    // reflective amber bands
    const bandCount = Math.max(1, Math.floor(len / 1.8));
    for (let i = 0; i < bandCount; i++) {
      const x = -len / 2 + 0.9 + i * 1.8;
      NM.box(g, { w: 0.16, h: 0.05, d: 0.017, x: x, y: 0.77, z: 0.045, color: 0xe0a65e, outline: false, mat: new T.MeshBasicMaterial({ color: 0xbc8f57, toneMapped: true }) });
    }
    // curved end piece
    NM.pipePath(g, [
      new T.Vector3(-len / 2, 0.77, 0),
      new T.Vector3(-len / 2 - 0.15, 0.68, 0),
      new T.Vector3(-len / 2 - 0.2, 0.44, 0),
      new T.Vector3(-len / 2 - 0.18, 0.2, 0),
    ], 0.036, 0xc8cec1, { segments: 10, radial: 5 });
    NM.pipePath(g, [
      new T.Vector3(len / 2, 0.77, 0),
      new T.Vector3(len / 2 + 0.15, 0.68, 0),
      new T.Vector3(len / 2 + 0.2, 0.44, 0),
      new T.Vector3(len / 2 + 0.18, 0.2, 0),
    ], 0.036, 0xc8cec1, { segments: 10, radial: 5 });
    return g;
  };

  /* --------------------------------------------------------------------- */
  /* Vending machine                                                       */
  /* --------------------------------------------------------------------- */

  P.vending = function (parent, opts) {
    const o = Object.assign({ x: 2.64, z: -5.0, baseY: 0.14, rotY: Math.PI / 2 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);

    const bodyMat = NM.toon(0xd7cbb2);
    NM.box(g, { w: 1.12, h: 1.95, d: 0.78, x: 0, y: 0.99, z: 0, color: 0xd7cbb2, outline: true, mat: bodyMat, edgeThreshold: 25 });
    NM.box(g, { w: 1.16, h: 0.1, d: 0.82, x: 0, y: 2.0, z: 0, color: 0x9c4c43, outline: true });
    NM.box(g, { w: 1.12, h: 0.1, d: 0.8, x: 0, y: 0.055, z: 0, color: 0x3c4440, outline: true });
    NM.box(g, { w: 1.16, h: 1.3, d: 0.06, x: 0, y: 1.34, z: -0.4, color: 0x334642, outline: false });
    NM.box(g, { w: 0.12, h: 1.6, d: 0.8, x: -0.6, y: 1.05, z: 0, color: 0x9f4b42, outline: true });
    NM.box(g, { w: 0.12, h: 1.6, d: 0.8, x: 0.6, y: 1.05, z: 0, color: 0xb9aa90, outline: true });

    const frontMat = new T.MeshBasicMaterial({ map: TEX.vendingFront(), toneMapped: true });
    const front = new T.Mesh(new T.PlaneGeometry(1.03, 1.78), frontMat);
    front.position.set(0, 1.03, 0.402);
    g.add(front);
    // additive glaze makes the lightbox feel alive
    const glowMat = new T.MeshBasicMaterial({
      color: 0xffe3c4,
      transparent: true,
      opacity: 0.09,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const glaze = new T.Mesh(new T.PlaneGeometry(1.0, 1.72), glowMat);
    glaze.position.set(0, 1.05, 0.414);
    g.add(glaze);
    NM.glowSprite(g, { x: 0, y: 1.2, z: 0.58, sx: 2.25, sy: 3.1, color: 0xffceb0, opacity: 0.22, depthTest: true });
    NM.box(g, { w: 0.54, h: 0.16, d: 0.05, x: 0, y: 0.25, z: 0.44, color: 0x242b28, outline: true });
    NM.box(g, { w: 0.5, h: 0.025, d: 0.03, x: 0, y: 0.2, z: 0.47, color: 0x827a65, outline: false });
    // little top lamp
    NM.box(g, { w: 0.8, h: 0.04, d: 0.06, x: 0, y: 2.05, z: 0.36, color: 0xf4e6ca, outline: false, mat: new T.MeshBasicMaterial({ color: 0xffdca4, toneMapped: true }) });
    NM.glowSprite(g, { x: 0, y: 1.5, z: 0.68, sx: 1.45, sy: 2.2, color: 0xff9c72, opacity: 0.1, depthTest: true });
    const light = new T.PointLight(0xffb27f, 11, 4.5, 2);
    light.position.set(0, 1.25, 0.8);
    g.add(light);

    // small side waste bin for cans
    const bin = new T.Group();
    bin.position.set(-0.88, 0, 0.1);
    g.add(bin);
    NM.box(bin, { w: 0.42, h: 0.68, d: 0.38, x: 0, y: 0.34, z: 0, color: 0x394f4d, outline: true });
    NM.box(bin, { w: 0.44, h: 0.07, d: 0.4, x: 0, y: 0.7, z: 0, color: 0x2e3c3b, outline: true });
    NM.panel(bin, { map: TEX.labelTexture("かん", { width: 256, height: 256, bg: "#2f4947", fg: "#eadfc8", size: 90 }), w: 0.35, h: 0.35, x: 0, y: 0.4, z: 0.196, transparent: true });
    return g;
  };

  /* --------------------------------------------------------------------- */
  /* Bicycle                                                               */
  /* --------------------------------------------------------------------- */

  P.bicycle = function (parent, opts) {
    const o = Object.assign({ x: 2.9, z: -2.35, baseY: 0.14, rotY: Math.PI / 2, lean: 0.075 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);
    const lean = new T.Group();
    lean.rotation.z = o.lean;
    g.add(lean);

    const frameCol = o.color == null ? 0x4f7774 : o.color;
    const metal = NM.toon(0x697a76);
    const dark = NM.toon(0x293434);
    const rubber = NM.toon(0x1a2223);
    const wheelPositions = [-0.58, 0.58];
    wheelPositions.forEach((wx) => {
      const wheel = new T.Mesh(new T.TorusGeometry(0.33, 0.018, 5, 22), rubber);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(wx, 0.36, 0);
      wheel.castShadow = true;
      lean.add(wheel);
      const rim = new T.Mesh(new T.TorusGeometry(0.305, 0.008, 4, 22), metal);
      rim.rotation.y = Math.PI / 2;
      rim.position.set(wx, 0.36, 0);
      lean.add(rim);
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        pts.push(new T.Vector3(wx, 0.36, 0));
        pts.push(new T.Vector3(wx, 0.36 + Math.sin(a) * 0.29, Math.cos(a) * 0.29));
      }
      const spokes = new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x768680, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
      lean.add(spokes);
      NM.box(lean, { w: 0.055, h: 0.055, d: 0.07, x: wx, y: 0.36, z: 0, color: 0x353e3b, outline: false });
      // fender
      const fender = new T.Mesh(new T.TorusGeometry(0.35, 0.013, 4, 18, Math.PI * 0.78), metal);
      fender.rotation.y = Math.PI / 2;
      fender.rotation.z = -0.77;
      fender.position.set(wx, 0.36, 0);
      lean.add(fender);
    });

    const nodes = {
      rear: new T.Vector3(-0.58, 0.36, 0.02),
      crank: new T.Vector3(-0.02, 0.36, 0.03),
      seatTop: new T.Vector3(-0.24, 0.88, 0.01),
      head: new T.Vector3(0.44, 0.88, 0.0),
      front: new T.Vector3(0.58, 0.36, 0.01),
      handle: new T.Vector3(0.51, 1.02, 0.0),
    };
    const tube = (a, b, r) => {
      const m = NM.tubeBetween(lean, a, b, r, frameCol, { seg: 6 });
      m.castShadow = true;
      return m;
    };
    tube(nodes.rear, nodes.seatTop, 0.022);
    tube(nodes.seatTop, nodes.crank, 0.024);
    tube(nodes.crank, nodes.head, 0.028);
    tube(nodes.head, nodes.seatTop, 0.025);
    tube(nodes.head, nodes.front, 0.022);
    tube(nodes.rear, nodes.crank, 0.018);
    tube(nodes.seatTop, nodes.crank, 0.018);
    // seat
    NM.box(lean, { w: 0.27, h: 0.055, d: 0.13, x: -0.24, y: 0.92, z: 0.0, color: 0x323b39, outline: true, rotZ: 0.06 });
    NM.cyl(lean, { r: 0.017, h: 0.2, x: -0.24, y: 0.8, z: 0, color: 0x566662, outline: false });
    // handlebar and stem
    NM.cyl(lean, { r: 0.017, h: 0.22, x: 0.48, y: 0.98, z: 0, color: 0x5b6a65, outline: false });
    NM.cyl(lean, { r: 0.016, h: 0.46, x: 0.48, y: 1.07, z: 0, color: 0x384644, rotX: Math.PI / 2, outline: false });
    NM.cyl(lean, { r: 0.022, h: 0.17, x: 0.48, y: 1.06, z: 0.23, color: 0x2e3837, outline: false, rotZ: Math.PI / 2 });
    NM.cyl(lean, { r: 0.022, h: 0.17, x: 0.48, y: 1.06, z: -0.23, color: 0x2e3837, outline: false, rotZ: Math.PI / 2 });
    // front basket
    const basket = new T.Group();
    basket.position.set(0.59, 0.9, 0.02);
    lean.add(basket);
    NM.box(basket, { w: 0.36, h: 0.25, d: 0.3, x: 0, y: 0.04, z: 0, color: 0x7a6950, outline: true, mat: NM.toon(0x7a6950) });
    for (let i = 0; i < 4; i++) {
      NM.cyl(basket, { r: 0.005, h: 0.22, x: -0.15 + i * 0.1, y: 0.06, z: 0.152, color: 0x9a886b, outline: false });
      NM.cyl(basket, { r: 0.005, h: 0.22, x: -0.15 + i * 0.1, y: 0.06, z: -0.152, color: 0x9a886b, outline: false });
    }
    NM.box(basket, { w: 0.34, h: 0.008, d: 0.27, x: 0, y: 0.17, z: 0, color: 0xa08b6b, outline: false });
    // headlamp
    NM.cyl(lean, { r: 0.035, h: 0.08, x: 0.58, y: 0.74, z: 0.02, color: 0x6d7a73, rotX: Math.PI / 2, outline: true });
    NM.glowSprite(lean, { x: 0.59, y: 0.74, z: 0.12, sx: 0.3, sy: 0.3, color: 0xffdda5, opacity: 0.22, depthTest: true });
    // kickstand
    NM.cyl(lean, { r: 0.012, h: 0.38, x: -0.1, y: 0.19, z: 0.08, color: 0x4b5955, rotZ: 0.38, outline: false });
    // rear rack
    NM.box(lean, { w: 0.4, h: 0.02, d: 0.17, x: -0.5, y: 0.72, z: 0, color: 0x4f5f5b, outline: false, rotZ: -0.03 });
    NM.cyl(lean, { r: 0.01, h: 0.3, x: -0.35, y: 0.58, z: 0.07, color: 0x4b5b56, rotZ: 0.12, outline: false });
    return g;
  };

  /* --------------------------------------------------------------------- */
  /* Bins, umbrellas, noticeboard, AC                                      */
  /* --------------------------------------------------------------------- */

  P.trashBins = function (parent, opts) {
    const o = Object.assign({ x: -1.55, z: 2.14, baseY: 0.14, rotY: 0 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);
    const designs = [
      { color: 0x3e5e59, label: "もえる", ink: "#e7dcc5", side: 0 },
      { color: 0x767f73, label: "びん・かん", ink: "#e9e4d1", side: 0.42 },
    ];
    designs.forEach((d, i) => {
      const b = new T.Group();
      b.position.set(-0.48 + i * 0.48, 0, 0);
      g.add(b);
      NM.box(b, { w: 0.4, h: 0.78, d: 0.36, x: 0, y: 0.39, z: 0, color: d.color, outline: true, edgeThreshold: 25 });
      NM.box(b, { w: 0.43, h: 0.06, d: 0.39, x: 0, y: 0.8, z: 0, color: 0x394845, outline: true });
      NM.box(b, { w: 0.24, h: 0.055, d: 0.12, x: 0, y: 0.84, z: -0.03, color: 0x1e2927, outline: false });
      NM.box(b, { w: 0.35, h: 0.06, d: 0.03, x: 0, y: 0.29, z: 0.185, color: 0x2b3734, outline: false });
      NM.panel(b, { map: TEX.labelTexture(d.label, { width: 384, height: 180, bg: "#ffffff", fg: d.ink, size: 43 }), w: 0.34, h: 0.16, x: 0, y: 0.57, z: 0.186, transparent: true, color: 0xf4ead4 });
      NM.panel(b, { map: TEX.labelTexture(i === 0 ? "BURN" : "RECYCLE", { width: 256, height: 96, bg: "rgba(0,0,0,0)", fg: "#ded8c5", size: 32 }), w: 0.26, h: 0.07, x: 0, y: 0.45, z: 0.187, transparent: true });
      NM.cyl(b, { r: 0.045, h: 0.06, x: -0.11, y: 0.06, z: 0.12, color: 0x2b3532, outline: false });
      NM.cyl(b, { r: 0.045, h: 0.06, x: 0.11, y: 0.06, z: 0.12, color: 0x2b3532, outline: false });
    });
    return g;
  };

  P.umbrellaStand = function (parent, opts) {
    const o = Object.assign({ x: -0.18, z: 1.66, baseY: 0.16 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    parent.add(g);
    // A wider, ribbed metal stand with a clearly readable little label.
    NM.cyl(g, { r: 0.29, rb: 0.24, h: 0.42, x: 0, y: 0.21, z: 0, color: 0x67756f, outline: true, open: true, seg: 18 });
    NM.cyl(g, { r: 0.24, h: 0.045, x: 0, y: 0.03, z: 0, color: 0x8f9b93, outline: true, seg: 18 });
    NM.cyl(g, { r: 0.29, h: 0.035, x: 0, y: 0.43, z: 0, color: 0x9aa69d, outline: true, seg: 18 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      NM.cyl(g, { r: 0.007, h: 0.38, x: Math.cos(a) * 0.265, y: 0.22, z: Math.sin(a) * 0.265, color: 0xa8b1a7, outline: false });
    }
    NM.panel(g, { map: TEX.labelTexture("UMBRELLA", { width: 512, height: 128, bg: "rgba(0,0,0,0)", fg: "#ded8c7", size: 45 }), w: 0.4, h: 0.1, x: 0, y: 0.32, z: 0.28, transparent: true, depthWrite: false });

    // A pair of closed umbrellas and one folded clear umbrella, fanning open a little.
    const umbrellas = [
      { color: 0x344f61, lean: 0.26, tilt: -0.12, z: 0.02, h: 0.92, x: -0.09, canopy: 0.68, clear: false },
      { color: 0x7d4c43, lean: -0.16, tilt: 0.1, z: -0.06, h: 0.82, x: 0.12, canopy: 0.62, clear: false },
      { color: 0xb8d3d0, lean: 0.02, tilt: 0.22, z: 0.08, h: 0.74, x: 0.02, canopy: 0.62, clear: true },
    ];
    umbrellas.forEach((u, i) => {
      const ug = new T.Group();
      ug.position.set(u.x, 0.06, u.z);
      ug.rotation.z = u.lean;
      ug.rotation.x = u.tilt;
      g.add(ug);
      // shaft; since the umbrella is closed, the handle sits above the canopy tip
      NM.cyl(ug, { r: 0.011, h: u.h, x: 0, y: u.h * 0.5 + 0.04, z: 0, color: 0xa4a596, outline: false });
      const canopy = NM.cyl(ug, {
        rt: 0.025,
        rb: 0.155,
        h: u.canopy * 0.62,
        x: 0,
        y: u.h * 0.42,
        z: 0,
        color: u.color,
        outline: true,
        seg: 8,
        transparent: u.clear,
        opacity: u.clear ? 0.38 : 1,
      });
      // little fabric ribs
      if (!u.clear) {
        for (let r = 0; r < 4; r++) {
          const a = (r / 4) * Math.PI * 2;
          NM.cyl(ug, { r: 0.006, h: u.canopy * 0.54, x: Math.cos(a) * 0.07, y: u.h * 0.33, z: Math.sin(a) * 0.07, color: 0xcfc2aa, outline: false, rotZ: 0.08 * Math.cos(a), rotX: 0.08 * Math.sin(a) });
        }
      }
      // broad fabric tip
      NM.cyl(ug, { rt: 0.018, rb: 0.055, h: 0.08, x: 0, y: u.h * 0.42 + u.canopy * 0.33, z: 0, color: u.clear ? 0xdbe4df : u.color, outline: true, seg: 8, transparent: u.clear, opacity: u.clear ? 0.3 : 1 });
      // J-shaped handle
      const handle = new T.Mesh(new T.TorusGeometry(0.075, 0.011, 4, 12, Math.PI), NM.toon(0x3b423d));
      handle.rotation.z = -Math.PI / 2;
      handle.position.set(0.075, u.h + 0.03, 0);
      ug.add(handle);
    });
    return g;
  };

  P.noticeboard = function (parent, opts) {
    const o = Object.assign({ x: 2.01, z: -6.82, baseY: 1.32, rotY: Math.PI / 2 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);
    NM.box(g, { w: 0.92, h: 1.25, d: 0.09, x: 0, y: 0.6, z: 0, color: 0x5b4b3c, outline: true });
    NM.box(g, { w: 0.99, h: 0.055, d: 0.12, x: 0, y: 1.24, z: 0, color: 0x3a3b34, outline: true });
    NM.box(g, { w: 1.02, h: 0.06, d: 0.43, x: 0, y: 1.31, z: 0.11, color: 0x3e4c49, outline: true, rotX: 0.08 });
    const posters = [0, 1, 2, 3];
    posters.forEach((n, i) => {
      const p = new T.Mesh(new T.PlaneGeometry(0.38, 0.5), new T.MeshBasicMaterial({ map: TEX.noticePoster(n), toneMapped: true }));
      p.position.set(-0.22 + (i % 2) * 0.44, 0.95 - Math.floor(i / 2) * 0.54, 0.066);
      p.rotation.z = (i % 2 ? -1 : 1) * (0.015 + i * 0.006);
      g.add(p);
    });
    NM.glowSprite(g, { x: 0, y: 1.2, z: 0.2, sx: 1.5, sy: 1.5, color: 0xffd095, opacity: 0.1, depthTest: true });
    return g;
  };

  P.outdoorAC = function (parent, opts) {
    const o = Object.assign({ x: 1.96, z: -6.18, y: 2.1, rotY: Math.PI / 2 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.y, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);
    NM.box(g, { w: 0.82, h: 0.58, d: 0.34, x: 0, y: 0, z: 0, color: 0xa7afa6, outline: true });
    NM.box(g, { w: 0.87, h: 0.06, d: 0.4, x: 0, y: 0.31, z: 0, color: 0x808d86, outline: true });
    const fan = new T.Mesh(new T.CircleGeometry(0.2, 18), NM.toon(0x66736e));
    fan.rotation.y = 0;
    fan.position.set(0.16, -0.02, 0.176);
    g.add(fan);
    const fanRing = new T.Mesh(new T.TorusGeometry(0.205, 0.015, 5, 22), NM.toon(0x525e59));
    fanRing.position.set(0.16, -0.02, 0.178);
    g.add(fanRing);
    for (let i = 0; i < 4; i++) {
      const blade = NM.box(g, { w: 0.025, h: 0.18, d: 0.012, x: 0.16, y: -0.02, z: 0.185, color: 0x5a6761, outline: false, rotZ: (i / 4) * Math.PI * 2 });
      blade.geometry.translate(0, 0.07, 0);
      blade.rotation.z = (i / 4) * Math.PI * 2;
    }
    NM.box(g, { w: 0.03, h: 0.4, d: 0.03, x: -0.32, y: -0.28, z: 0.18, color: 0x5c6661, outline: false });
    NM.box(g, { w: 0.4, h: 0.03, d: 0.38, x: 0, y: -0.33, z: 0, color: 0x5d6862, outline: true });
    return g;
  };

  P.drain = function (parent, opts) {
    const o = Object.assign({ x: 0, z: 0, y: 0.018, rotY: 0, w: 0.85, d: 0.32 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.y, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);
    NM.box(g, { w: o.w, h: 0.025, d: o.d, x: 0, y: 0, z: 0, color: 0x263436, outline: true, cast: false });
    const water = new T.Mesh(new T.PlaneGeometry(o.w - 0.06, o.d - 0.07), new T.MeshBasicMaterial({ color: 0x83b4b2, transparent: true, opacity: 0.22, blending: T.AdditiveBlending, depthWrite: false }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.015;
    g.add(water);
    const n = Math.floor(o.w / 0.09);
    for (let i = 0; i < n; i++) {
      NM.box(g, { w: 0.035, h: 0.025, d: o.d - 0.05, x: -o.w / 2 + 0.05 + i * 0.09, y: 0.02, z: 0, color: 0x77827c, outline: false, cast: false });
    }
    return g;
  };

  P.hydrangea = function (parent, opts) {
    const o = Object.assign({ x: -7.9, z: 2.38, baseY: 0.15, scale: 1 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.scale.setScalar(o.scale || 1);
    parent.add(g);
    NM.cyl(g, { r: 0.25, rb: 0.18, h: 0.32, x: 0, y: 0.16, z: 0, color: 0x5c5550, outline: true, seg: 12 });
    NM.cyl(g, { r: 0.22, h: 0.05, x: 0, y: 0.3, z: 0, color: 0x3b3a32, outline: false, seg: 12 });
    const rnd = NM.seedRandom(85);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 0.15 + rnd() * 0.34;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = 0.5 + rnd() * 0.34;
      NM.sphere(g, { r: 0.14 + rnd() * 0.12, x: x, y: y, z: z, color: i % 3 ? 0x3e6455 : 0x507565, sx: 1.1, sy: 0.65, sz: 1.0 });
      if (i < 9) {
        const fx = x + (rnd() - 0.5) * 0.18;
        const fz = z + (rnd() - 0.5) * 0.18;
        NM.sphere(g, { r: 0.06 + rnd() * 0.035, x: fx, y: y + 0.03, z: fz, color: [0x6f88a7, 0x7487a5, 0x8a7c9e, 0x627a9c][i % 4], sx: 1.2, sy: 0.9, sz: 1.2, seg: 7, segY: 5 });
      }
    }
    return g;
  };

  P.streetTree = function (parent, opts) {
    const o = Object.assign({ x: -8.95, z: 9.55, baseY: 0.15, scale: 1 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.scale.setScalar(o.scale || 1);
    parent.add(g);
    const rnd = NM.seedRandom(2027);
    // square iron tree guard in the wet pavement
    NM.box(g, { w: 1.22, h: 0.045, d: 1.22, x: 0, y: 0.02, z: 0, color: 0x3e4846, outline: true });
    NM.box(g, { w: 0.74, h: 0.03, d: 0.74, x: 0, y: 0.045, z: 0, color: 0x1e2928, outline: false });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      NM.box(g, { w: 0.035, h: 0.02, d: 0.5, x: Math.cos(a) * 0.36, y: 0.052, z: Math.sin(a) * 0.36, color: 0x7c7d6b, outline: false, rotY: a });
    }
    // trunk and branches
    const trunkMat = NM.toon(0x55453a);
    NM.cyl(g, { r: 0.095, rb: 0.15, h: 2.55, x: 0, y: 1.31, z: 0, color: 0x4a3c33, outline: true, seg: 8, mat: trunkMat });
    const branchBases = [
      [0.05, 2.1, 0.03, 0.5, 2.9, 0.2],
      [-0.03, 2.2, -0.02, -0.55, 3.0, -0.25],
      [0.02, 2.4, 0.01, 0.15, 3.4, -0.5],
      [0.02, 2.0, 0.02, -0.3, 2.8, 0.55],
    ];
    branchBases.forEach((b, i) => {
      NM.tubeBetween(g, [b[0], b[1], b[2]], [b[3], b[4], b[5]], 0.045 - i * 0.004, 0x524238, { seg: 5 });
    });
    // dense, rain-dark foliage
    for (let i = 0; i < 15; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 0.2 + rnd() * 1.15;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const y = 2.8 + rnd() * 1.25;
      const col = [0x294b3e, 0x335846, 0x3c5e4a, 0x244438][i % 4];
      NM.sphere(g, { r: 0.38 + rnd() * 0.28, x: x, y: y, z: z, color: col, sx: 1.1, sy: 0.75, sz: 1.0, seg: 7, segY: 5, outline: false });
    }
    // a few pale leaves catching the streetlight
    for (let i = 0; i < 5; i++) {
      const a = -0.8 + rnd() * 2.2;
      const r = 0.8 + rnd() * 0.8;
      NM.sphere(g, { r: 0.12 + rnd() * 0.1, x: Math.cos(a) * r, y: 3.2 + rnd() * 0.7, z: Math.sin(a) * r, color: 0x65806a, sx: 1.2, sy: 0.55, sz: 1, seg: 6, segY: 4 });
    }
    return g;
  };

  P.postbox = function (parent, opts) {
    const o = Object.assign({ x: -2.4, z: 10.44, baseY: 0.15, rotY: 0 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);
    const red = NM.toon(0xb54439);
    NM.cyl(g, { r: 0.24, rb: 0.27, h: 0.09, x: 0, y: 0.045, z: 0, color: 0x5e5b4d, outline: true, seg: 12 });
    NM.cyl(g, { r: 0.25, h: 1.25, x: 0, y: 0.72, z: 0, color: 0xb54439, outline: true, seg: 16, mat: red });
    NM.cyl(g, { r: 0.26, h: 0.075, x: 0, y: 1.36, z: 0, color: 0xe0d7c1, outline: true, seg: 16 });
    NM.cyl(g, { r: 0.25, h: 0.04, x: 0, y: 0.1, z: 0, color: 0x6d4a3e, outline: false, seg: 16 });
    NM.box(g, { w: 0.42, h: 0.08, d: 0.09, x: 0, y: 1.04, z: 0.23, color: 0x2d2925, outline: true });
    NM.box(g, { w: 0.46, h: 0.04, d: 0.13, x: 0, y: 1.12, z: 0.24, color: 0x8b3b32, outline: true });
    NM.panel(g, { map: TEX.labelTexture("〒", { width: 256, height: 256, bg: "rgba(0,0,0,0)", fg: "#f0e3c7", size: 128 }), w: 0.28, h: 0.28, x: 0, y: 0.8, z: 0.252, transparent: true, toneMapped: true });
    NM.panel(g, { map: TEX.labelTexture("POST", { width: 256, height: 96, bg: "rgba(0,0,0,0)", fg: "rgba(246,235,213,0.75)", size: 38, font: TEX._helpers.EN_FONT }), w: 0.21, h: 0.08, x: 0, y: 0.64, z: 0.252, transparent: true, toneMapped: true });
    NM.glowSprite(g, { x: 0, y: 0.7, z: 0.42, sx: 0.7, sy: 1.2, color: 0xffb192, opacity: 0.04, depthTest: true });
    return g;
  };

  P.bench = function (parent, opts) {
    const o = Object.assign({ x: -5.8, z: 10.55, baseY: 0.15, rotY: 0 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    g.rotation.y = o.rotY;
    parent.add(g);
    const wood = NM.toon(0x5e4a37);
    const iron = NM.toon(0x374542);
    // seat slats
    for (let i = 0; i < 4; i++) {
      NM.box(g, { w: 1.65, h: 0.045, d: 0.09, x: 0, y: 0.46, z: -0.17 + i * 0.11, color: 0x5e4a37, outline: true, mat: wood });
    }
    // backrest
    for (let i = 0; i < 3; i++) {
      NM.box(g, { w: 1.65, h: 0.09, d: 0.035, x: 0, y: 0.65 + i * 0.13, z: -0.28, color: 0x5e4a37, outline: true, mat: wood, rotX: -0.12 });
    }
    [-0.7, 0.7].forEach((x) => {
      NM.box(g, { w: 0.06, h: 0.43, d: 0.4, x: x, y: 0.24, z: 0, color: 0x374542, outline: true, mat: iron });
      NM.box(g, { w: 0.06, h: 0.4, d: 0.045, x: x, y: 0.62, z: -0.28, color: 0x374542, outline: true, mat: iron });
      NM.box(g, { w: 0.3, h: 0.045, d: 0.045, x: x, y: 0.64, z: 0.02, color: 0x374542, outline: true, mat: iron });
    });
    NM.box(g, { w: 1.48, h: 0.04, d: 0.07, x: 0, y: 0.37, z: 0.03, color: 0x3d4a46, outline: false });
    return g;
  };

  P.cat = function (parent, opts) {
    const o = Object.assign({ x: -5.45, z: 10.35, y: 0.59, rotY: Math.PI, scale: 0.78 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.y, o.z);
    g.rotation.y = o.rotY;
    g.scale.setScalar(o.scale || 0.78);
    parent.add(g);
    const fur = NM.toon(0x1d2021);
    const furLight = NM.toon(0x393d3b);
    NM.sphere(g, { r: 0.18, x: 0, y: 0.24, z: 0.02, color: 0x1d2021, sx: 1.0, sy: 1.4, sz: 0.9, seg: 10, segY: 7, mat: fur });
    NM.sphere(g, { r: 0.14, x: 0, y: 0.12, z: 0.02, color: 0x1d2021, sx: 1.25, sy: 0.85, sz: 1.1, seg: 9, segY: 6, mat: fur });
    const head = new T.Group();
    head.position.set(0, 0.46, 0.04);
    g.add(head);
    NM.sphere(head, { r: 0.115, x: 0, y: 0, z: 0, color: 0x202324, sx: 1.15, sy: 1.0, sz: 0.95, seg: 10, segY: 7, mat: fur });
    NM.sphere(head, { r: 0.065, x: 0, y: -0.025, z: 0.098, color: 0x343735, sx: 1.1, sy: 0.7, sz: 0.8, seg: 8, segY: 5 });
    [-1, 1].forEach((s) => {
      const ear = new T.Mesh(new T.ConeGeometry(0.055, 0.115, 5), fur);
      ear.position.set(s * 0.075, 0.1, 0.015);
      ear.rotation.z = s * 0.28;
      ear.castShadow = true;
      head.add(ear);
      const inner = new T.Mesh(new T.ConeGeometry(0.028, 0.07, 4), NM.toon(0x6b4d4b));
      inner.position.set(s * 0.075, 0.105, 0.036);
      inner.rotation.z = s * 0.28;
      head.add(inner);
    });
    [-1, 1].forEach((s) => {
      const eye = new T.Mesh(new T.SphereGeometry(0.018, 7, 5), new T.MeshBasicMaterial({ color: 0xf2ba68, toneMapped: false }));
      eye.position.set(s * 0.046, 0.008, 0.103);
      head.add(eye);
    });
    [-0.1, 0.1].forEach((x) => {
      NM.sphere(g, { r: 0.052, x: x, y: 0.035, z: 0.14, color: 0x222526, sx: 1.1, sy: 0.6, sz: 1.3, seg: 8, segY: 5, mat: furLight });
    });
    NM.sphere(g, { r: 0.065, x: 0, y: 0.25, z: 0.155, color: 0x5a5b52, sx: 0.8, sy: 1.2, sz: 0.25, seg: 8, segY: 5 });
    const tailGroup = new T.Group();
    tailGroup.position.set(0.13, 0.1, -0.08);
    g.add(tailGroup);
    const tailPts = [
      new T.Vector3(0, 0, 0),
      new T.Vector3(0.14, 0.08, -0.08),
      new T.Vector3(0.23, 0.22, -0.04),
      new T.Vector3(0.24, 0.34, 0.07),
      new T.Vector3(0.2, 0.4, 0.16),
    ];
    NM.pipePath(tailGroup, tailPts, 0.026, 0x202324, { segments: 16, radial: 5, mat: fur });
    NM.glowSprite(g, { x: 0.06, y: 0.47, z: 0.15, sx: 0.3, sy: 0.2, color: 0xffc479, opacity: 0.12, depthTest: true });
    g.userData.update = (time) => {
      tailGroup.rotation.y = Math.sin(time * 1.1) * 0.18;
      tailGroup.rotation.x = Math.sin(time * 0.7 + 1.0) * 0.06;
      head.rotation.y = Math.sin(time * 0.3) * 0.12;
    };
    return g;
  };

  P.parkingSign = function (parent, opts) {
    const o = Object.assign({ x: -7.5, z: 2.62, baseY: 0.15 }, opts || {});
    const g = new T.Group();
    g.position.set(o.x, o.baseY, o.z);
    parent.add(g);
    NM.cyl(g, { r: 0.035, h: 1.75, x: 0, y: 0.875, z: 0, color: 0x6c7871, outline: true, seg: 8 });
    NM.box(g, { w: 0.34, h: 0.42, d: 0.06, x: 0, y: 1.65, z: 0, color: 0x315c83, outline: true });
    NM.panel(g, { map: TEX.trafficSign("parking"), w: 0.3, h: 0.38, x: 0, y: 1.65, z: 0.035, transparent: true, toneMapped: true });
    NM.box(g, { w: 0.62, h: 0.24, d: 0.05, x: 0, y: 1.28, z: 0, color: 0xe6dfca, outline: true });
    NM.panel(g, { map: TEX.labelTexture("P  24H", { width: 512, height: 160, bg: "#e6dfca", fg: "#3d5a69", size: 66 }), w: 0.58, h: 0.2, x: 0, y: 1.28, z: 0.03, transparent: true, toneMapped: true });
    NM.box(g, { w: 0.2, h: 0.06, d: 0.2, x: 0, y: 0.04, z: 0, color: 0x5e6862, outline: true });
    return g;
  };
})();
