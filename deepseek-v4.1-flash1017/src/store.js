/* store.js — the little convenience store, inside and out */
(function () {
  "use strict";

  const T = THREE;
  const C = NM.C;

  window.buildStore = function (parent, opts) {
    opts = opts || {};
    const S = {
      left: -8.7,
      right: 1.85,
      back: -7.6,
      front: 1.05,
      floor: 0.265,
      ceiling: 3.28,
      signBottom: 3.28,
      signTop: 4.2,
      upperTop: 6.24,
      sidewalk: 0.14,
    };
    const W = S.right - S.left;
    const D = S.front - S.back;
    const CX = (S.left + S.right) * 0.5;
    const CZ = (S.back + S.front) * 0.5;
    const EAVE_Y = 3.05;
    const EAVE_Z = 1.72;
    const EAVE_X = 2.42;

    const group = new T.Group();
    group.name = "convenience-store";
    parent.add(group);

    const warm = 0xffd79a;
    const warmPale = 0xffe8c3;
    const frameColor = 0x314d4f;
    const wallColor = 0x94a7a7;
    const upperColor = 0x768c95;

    const edge = (m, color, opacity) => NM.addOutline(m, 32, color, opacity);
    const box = (o) => NM.box(group, o);
    const glassRainMats = [];
    const addGlassRain = (w, h, x, y, z, rotY, repeatX, speed, parentObj) => {
      const tex = TEX.rainGlass().clone();
      tex.needsUpdate = true;
      tex.wrapS = tex.wrapT = T.RepeatWrapping;
      tex.repeat.set(repeatX, 1.0);
      tex.offset.set(Math.random() * 0.8, Math.random() * 1.2);
      const mat = new T.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.18,
        color: 0xb9d9df,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: T.DoubleSide,
        fog: false,
      });
      const plane = new T.Mesh(new T.PlaneGeometry(w, h), mat);
      plane.position.set(x, y, z);
      plane.rotation.y = rotY || 0;
      plane.renderOrder = 8;
      (parentObj || group).add(plane);
      glassRainMats.push({ map: tex, speed: speed || 0.035, sway: Math.random() * 10 });
      return plane;
    };

    /* ================================================================== */
    /* Foundation + shell                                                */
    /* ================================================================== */

    box({ w: W + 0.16, h: 0.22, d: D + 0.16, x: CX, y: S.sidewalk + 0.02, z: CZ, color: 0x536361, outline: true });
    box({ w: W, h: 0.34, d: D, x: CX, y: S.sidewalk + 0.1, z: CZ, color: 0x42504f, outline: false });

    // lower wall / window bases
    box({ w: W, h: 0.42, d: 0.24, x: CX, y: 0.41, z: S.back + 0.12, color: 0xaeb7b0, outline: true });
    box({ w: 0.26, h: 3.0, d: D, x: S.left + 0.12, y: 1.64, z: CZ, color: 0xb4beb6, outline: true, edgeThreshold: 25 });
    box({ w: W, h: 2.98, d: 0.25, x: CX, y: 1.62, z: S.back + 0.13, color: 0xb6bfb5, outline: true });

    // The interior is a painted, warm set: flat colours keep the palette stable
    // against the intense lamps and let the packaging carry the contrast.
    const wallFlatMat = new T.MeshBasicMaterial({ color: 0xc59c68, toneMapped: true });
    const ceilingFlatMat = new T.MeshBasicMaterial({ color: 0xb89a70, toneMapped: true });
    const shelfFlatMat = new T.MeshBasicMaterial({ color: 0xe7d6b8, toneMapped: true });
    const darkTrimMat = new T.MeshBasicMaterial({ color: 0x3b514c, toneMapped: true });

    // shop interior shell (slightly lighter than the outside)
    box({ w: W - 0.3, h: 3.0, d: 0.08, x: CX, y: 1.65, z: S.back + 0.3, color: 0xc59c68, outline: false, mat: wallFlatMat });
    box({ w: 0.08, h: 3.0, d: D - 0.3, x: S.left + 0.27, y: 1.65, z: CZ, color: 0xc59c68, outline: false, mat: wallFlatMat });

    // interior floor
    const floorMat = new T.MeshBasicMaterial({
      color: 0xb78b58,
      map: TEX.interiorFloor(),
      toneMapped: true,
    });
    const floor = new T.Mesh(new T.PlaneGeometry(W - 0.36, D - 0.33), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(CX, S.floor + 0.002, CZ);
    floor.receiveShadow = true;
    group.add(floor);

    // ceiling
    box({ w: W - 0.24, h: 0.08, d: D - 0.23, x: CX, y: S.ceiling + 0.01, z: CZ, color: 0xb89a70, outline: false, mat: ceilingFlatMat });
    // little ceiling border
    box({ w: W - 0.24, h: 0.1, d: 0.12, x: CX, y: S.ceiling - 0.08, z: S.back + 0.42, color: 0xbeb6a6, outline: true });
    box({ w: W - 0.24, h: 0.1, d: 0.12, x: CX, y: S.ceiling - 0.08, z: S.front - 0.35, color: 0xbeb6a6, outline: true });

    // ceiling light troughs
    const lightStripMat = new T.MeshBasicMaterial({ color: 0xfff2cf, toneMapped: true });
    const diffuserMat = new T.MeshBasicMaterial({ color: 0xffe8bb, toneMapped: true });
    [-6.55, -3.55, -0.55].forEach((x) => {
      box({ w: 0.44, h: 0.05, d: 5.6, x: x, y: S.ceiling - 0.06, z: -2.7, color: 0xf4ead2, outline: false, mat: lightStripMat });
      const diff = new T.Mesh(new T.PlaneGeometry(0.31, 5.38), diffuserMat);
      diff.rotation.x = Math.PI / 2;
      diff.position.set(x, S.ceiling - 0.095, -2.7);
      group.add(diff);
      NM.glowSprite(group, { x: x, y: S.ceiling - 0.17, z: -2.7, sx: 1.7, sy: 4.4, color: 0xffe0a6, opacity: 0.085, depthTest: true });
    });

    /* ================================================================== */
    /* Front glazing + entrance                                          */
    /* ================================================================== */

    const frontKick = box({
      w: 8.48,
      h: 0.42,
      d: 0.18,
      x: -4.22,
      y: 0.41,
      z: S.front - 0.08,
      color: 0x315151,
      outline: true,
    });
    // wet sheen along the kick plate
    NM.panel(group, { map: TEX.reflectionStreak(), w: 7.8, h: 1.1, x: -4.3, y: 0.33, z: S.front + 0.018, rotX: -Math.PI / 2, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, color: 0xa6c3be, depthWrite: false });

    const glassFront = new T.Mesh(new T.PlaneGeometry(8.5, 2.4), NM.glassMat(0.075));
    glassFront.position.set(-4.22, 1.76, S.front + 0.015);
    glassFront.renderOrder = 7;
    group.add(glassFront);
    addGlassRain(8.35, 2.38, -4.22, 1.76, S.front + 0.045, 0, 2.8, 0.035);

    // side glazing
    box({ w: 0.2, h: 0.42, d: 7.18, x: S.right - 0.09, y: 0.41, z: -2.66, color: 0x315151, outline: true });
    const glassSide = new T.Mesh(new T.PlaneGeometry(7.15, 2.4), NM.glassMat(0.075));
    glassSide.rotation.y = Math.PI / 2;
    glassSide.position.set(S.right + 0.015, 1.76, -2.66);
    glassSide.renderOrder = 7;
    group.add(glassSide);
    addGlassRain(7.1, 2.38, S.right + 0.045, 1.76, -2.66, Math.PI / 2, 2.2, 0.03);

    // structural frames / mullions
    const frameMat = NM.toon(frameColor);
    const t = 0.1;
    const beamFront = box({ w: W, h: 0.34, d: 0.25, x: CX, y: 3.13, z: S.front - 0.03, color: frameColor, outline: true });
    const sillFront = box({ w: 8.5, h: 0.08, d: 0.2, x: -4.22, y: 0.59, z: S.front + 0.03, color: 0x82918d, outline: true });
    [-8.62, -5.7, -2.8, 0.12].forEach((x, i) => {
      box({ w: i === 0 ? 0.16 : 0.065, h: 2.48, d: 0.16, x: x, y: 1.76, z: S.front + 0.045, color: frameColor, outline: true, edgeThreshold: 25 });
    });
    box({ w: 0.28, h: 2.64, d: 0.24, x: 1.64, y: 1.73, z: S.front + 0.04, color: frameColor, outline: true });
    box({ w: 0.25, h: 2.64, d: 0.24, x: 0.03, y: 1.73, z: S.front + 0.04, color: frameColor, outline: true });

    // side glazing frames
    box({ w: 0.25, h: 0.34, d: D, x: S.right - 0.02, y: 3.13, z: CZ, color: frameColor, outline: true });
    box({ w: 0.16, h: 0.08, d: 7.2, x: S.right + 0.03, y: 0.59, z: -2.66, color: 0x82918d, outline: true });
    [-6.18, -3.35, -0.55, 0.88].forEach((z, i) => {
      box({ w: 0.16, h: 2.48, d: i === 0 ? 0.16 : 0.065, x: S.right + 0.045, y: 1.76, z: z, color: frameColor, outline: true, edgeThreshold: 25 });
    });
    box({ w: 0.25, h: 2.64, d: 0.28, x: S.right + 0.02, y: 1.73, z: 0.93, color: frameColor, outline: true });

    // solid corner & side rear pier
    box({ w: 0.5, h: 3.02, d: 0.9, x: S.right - 0.25, y: 1.64, z: 0.64, color: 0xaeb9b2, outline: true });
    box({ w: 0.27, h: 3.02, d: 1.36, x: S.right - 0.06, y: 1.64, z: -6.93, color: 0xaeb9b2, outline: true });
    box({ w: 0.63, h: 0.1, d: 0.92, x: S.right - 0.26, y: 3.2, z: 0.62, color: frameColor, outline: true });

    // entrance frame
    box({ w: 1.58, h: 0.18, d: 0.24, x: 0.79, y: 2.99, z: S.front + 0.06, color: frameColor, outline: true });
    box({ w: 1.5, h: 0.06, d: 0.34, x: 0.79, y: 0.315, z: S.front + 0.1, color: 0x768581, outline: true });
    // automatic door sensor
    box({ w: 0.42, h: 0.12, d: 0.18, x: 0.8, y: 3.04, z: S.front + 0.3, color: 0x273133, outline: true });
    const sensorLed = new T.Mesh(new T.CircleGeometry(0.022, 8), new T.MeshBasicMaterial({ color: 0xff6d4c, toneMapped: false }));
    sensorLed.position.set(0.74, 3.04, S.front + 0.392);
    group.add(sensorLed);
    NM.glowSprite(group, { x: 0.74, y: 3.04, z: S.front + 0.4, sx: 0.25, sy: 0.25, color: 0xff704d, opacity: 0.5, depthTest: true });

    // sliding door panels
    const doorPanelMeshes = [];
    const doorGroup = new T.Group();
    doorGroup.position.set(0.8, 0, S.front + 0.1);
    group.add(doorGroup);
    const makeDoorPanel = (side) => {
      const g = new T.Group();
      const glass = new T.Mesh(new T.PlaneGeometry(0.6, 2.34), NM.glassMat(0.13));
      glass.position.set(0, 1.62, 0);
      glass.renderOrder = 7;
      g.add(glass);
      // create frame directly in the panel group
      NM.box(g, { w: 0.64, h: 0.1, d: 0.09, x: 0, y: 2.8, z: 0, color: frameColor, outline: true });
      NM.box(g, { w: 0.64, h: 0.12, d: 0.09, x: 0, y: 0.42, z: 0, color: frameColor, outline: true });
      NM.box(g, { w: 0.055, h: 2.45, d: 0.09, x: -0.295, y: 1.61, z: 0, color: frameColor, outline: true });
      NM.box(g, { w: 0.055, h: 2.45, d: 0.09, x: 0.295, y: 1.61, z: 0, color: frameColor, outline: true });
      NM.box(g, { w: 0.032, h: 0.52, d: 0.05, x: side * -0.22, y: 1.45, z: 0.07, color: 0xbbc5bd, outline: false });
      // frosted safety strip
      const strip = new T.Mesh(new T.PlaneGeometry(0.48, 0.055), new T.MeshBasicMaterial({ color: 0xc8ded7, transparent: true, opacity: 0.5, depthWrite: false }));
      strip.position.set(0, 0.82, 0.012);
      g.add(strip);
      addGlassRain(0.52, 2.27, 0, 1.62, 0.055, 0, 0.6, 0.05, g);
      doorGroup.add(g);
      doorPanelMeshes.push(g);
      return g;
    };
    const leftDoor = makeDoorPanel(-1);
    const rightDoor = makeDoorPanel(1);
    leftDoor.position.x = -0.325;
    rightDoor.position.x = 0.325;

    // small automatic-door sticker, split on the glass
    NM.panel(doorGroup, { map: TEX.doorDecal(), w: 0.66, h: 0.33, x: 0, y: 2.26, z: 0.075, transparent: true, opacity: 0.68 });

    // entrance step, mat and tactile paving
    box({ w: 2.25, h: 0.12, d: 0.72, x: 0.8, y: 0.15, z: 1.46, color: 0x71807d, outline: true });
    const mat = new T.Mesh(new T.PlaneGeometry(1.75, 1.12), new T.MeshBasicMaterial({ map: TEX.mat(), color: 0xe9dfcb, toneMapped: true }));
    mat.rotation.x = -Math.PI / 2;
    mat.rotation.z = 0.015;
    mat.position.set(0.79, 0.161, 2.23);
    mat.receiveShadow = true;
    group.add(mat);

    // window decals
    NM.panel(group, { map: TEX.windowDecal(), w: 1.36, h: 0.68, x: -4.15, y: 2.6, z: S.front + 0.075, transparent: true, opacity: 0.85, depthWrite: false });
    NM.panel(group, { map: TEX.windowDecal(), w: 1.15, h: 0.58, x: S.right + 0.075, y: 2.55, z: -2.9, rotY: Math.PI / 2, transparent: true, opacity: 0.65, depthWrite: false });
    // a pair of sale stickers
    const saleTex = NM.labelTexture("おにぎり 100円", { width: 512, height: 160, bg: "#f2dfb8", fg: "#a8463d", size: 56 });
    NM.panel(group, { map: saleTex, w: 1.1, h: 0.34, x: -6.9, y: 2.15, z: S.front + 0.08, transparent: true, opacity: 0.9, depthWrite: false });

    // taped paper posters on the glass — a warm little graphic layer
    const windowPoster = (tex, x, y, w, h, rotY) => {
      const pg = new T.Group();
      pg.position.set(x, y, S.front + 0.092);
      pg.rotation.y = rotY || 0;
      group.add(pg);
      const paper = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex, toneMapped: true }));
      pg.add(paper);
      // masking tape corners
      [-1, 1].forEach((sx) => {
        [-1, 1].forEach((sy) => {
          const tape = new T.Mesh(new T.PlaneGeometry(0.075, 0.022), new T.MeshBasicMaterial({ color: 0xd8cfb9, transparent: true, opacity: 0.6, depthWrite: false }));
          tape.position.set(sx * (w / 2 - 0.03), sy * (h / 2 - 0.02), 0.005);
          tape.rotation.z = sx * sy * 0.5;
          pg.add(tape);
        });
      });
      return pg;
    };
    // (the glass is kept mostly clear so the interior shelves read as the display)

    // warm interior light line behind the glass
    NM.box(group, { w: 7.9, h: 0.055, d: 0.16, x: -3.95, y: 2.87, z: 0.52, color: 0xffe0ab, outline: false, mat: new T.MeshBasicMaterial({ color: 0xffdfaa, toneMapped: true }) });
    NM.glowSprite(group, { x: -2.55, y: 2.83, z: 0.62, sx: 8.8, sy: 0.8, color: 0xffcf90, opacity: 0.045, depthTest: true });
    NM.panel(group, { map: TEX.reflectionStreak(), w: 8.0, h: 2.4, x: -3.9, y: 1.65, z: 0.84, transparent: true, opacity: 0.035, blending: T.AdditiveBlending, color: 0xffb56e, depthWrite: false, toneMapped: false });

    /* ================================================================== */
    /* Awning / eave                                                     */
    /* ================================================================== */

    const canopyMat = NM.toon(0x294847);
    box({ w: 10.28, h: 0.13, d: 0.7, x: CX, y: EAVE_Y, z: 1.44, color: 0x294847, outline: true, mat: canopyMat });
    box({ w: 10.34, h: 0.17, d: 0.12, x: CX, y: EAVE_Y - 0.05, z: 1.78, color: 0x1e3738, outline: true });
    box({ w: 0.7, h: 0.13, d: 7.36, x: EAVE_X - 0.34, y: EAVE_Y, z: -2.72, color: 0x294847, outline: true, mat: canopyMat });
    box({ w: 0.12, h: 0.17, d: 7.42, x: EAVE_X, y: EAVE_Y - 0.05, z: -2.72, color: 0x1e3738, outline: true });

    // downlights beneath canopy
    const downlightPositions = [-6.7, -4.2, -1.7, 0.55];
    downlightPositions.forEach((x) => {
      const disc = new T.Mesh(new T.CircleGeometry(0.07, 12), new T.MeshBasicMaterial({ color: 0xffdfa6, toneMapped: false }));
      disc.rotation.x = Math.PI / 2;
      disc.position.set(x, EAVE_Y - 0.08, 1.38);
      group.add(disc);
      NM.glowSprite(group, { x: x, y: EAVE_Y - 0.18, z: 1.48, sx: 1.5, sy: 1.5, color: 0xffc579, opacity: 0.34, depthTest: true });
    });

    // gutter pipes and rain chain housing
    NM.cyl(group, { r: 0.042, h: 10.1, x: CX, y: EAVE_Y - 0.13, z: 1.79, color: 0x405655, rotZ: Math.PI / 2, outline: false, cast: false });
    NM.cyl(group, { r: 0.042, h: 7.35, x: EAVE_X + 0.075, y: EAVE_Y - 0.13, z: -2.72, color: 0x405655, rotX: Math.PI / 2, outline: false, cast: false });
    NM.cyl(group, { r: 0.065, h: 3.0, x: S.right + 0.12, y: 1.54, z: -7.22, color: 0x3b4d4c, outline: true });
    NM.cyl(group, { r: 0.065, h: 3.0, x: S.left - 0.08, y: 1.54, z: 0.8, color: 0x3b4d4c, outline: true });

    // canopy edge little hanging chains
    [-7.9, -5.3, -2.7, -0.1, 1.25].forEach((x, i) => {
      const chain = new T.Group();
      chain.position.set(x, EAVE_Y - 0.12, 1.79);
      for (let j = 0; j < 3; j++) {
        NM.cyl(chain, { r: 0.012, h: 0.1, x: 0, y: -j * 0.11, z: 0, color: 0x697c76, open: true, cast: false });
      }
      group.add(chain);
    });

    /* ================================================================== */
    /* Signage                                                           */
    /* ================================================================== */

    // fascia body, wrapping the corner
    box({ w: 10.5, h: 0.94, d: 0.27, x: CX, y: 3.72, z: 1.1, color: 0x315b57, outline: true });
    box({ w: 0.27, h: 0.94, d: 8.48, x: 1.74, y: 3.72, z: CZ, color: 0x315b57, outline: true });
    box({ w: 10.62, h: 0.08, d: 0.36, x: CX, y: 4.23, z: 1.1, color: 0x253f3d, outline: true });
    box({ w: 10.62, h: 0.08, d: 0.36, x: CX, y: 3.22, z: 1.1, color: 0x253f3d, outline: true });

    const mainSignMat = new T.MeshBasicMaterial({ map: TEX.storeSign(), toneMapped: false });
    const mainSign = new T.Mesh(new T.PlaneGeometry(9.92, 0.817), mainSignMat);
    mainSign.position.set(CX - 0.05, 3.72, 1.246);
    group.add(mainSign);
    const sideSignMat = new T.MeshBasicMaterial({ map: TEX.sideSign(), toneMapped: false });
    const sideSign = new T.Mesh(new T.PlaneGeometry(7.75, 0.817), sideSignMat);
    sideSign.rotation.y = Math.PI / 2;
    sideSign.position.set(1.882, 3.72, CZ);
    group.add(sideSign);

    // soft light boxes bleed
    NM.glowSprite(group, { x: CX, y: 3.75, z: 1.42, sx: 12.2, sy: 2.8, color: 0xffd69a, opacity: 0.24, depthTest: true, renderOrder: 4 });
    NM.glowSprite(group, { x: 2.08, y: 3.75, z: CZ, sx: 8.9, sy: 2.5, color: 0xffd194, opacity: 0.18, depthTest: true, renderOrder: 4, rotY: Math.PI / 2 });
    NM.glowSprite(group, { x: -3.9, y: 2.0, z: 1.34, sx: 10.2, sy: 4.6, color: 0xffb974, opacity: 0.055, depthTest: true, renderOrder: 4 });
    [-7.0, -4.35, -1.8].forEach((x) => {
      NM.glowSprite(group, { x: x, y: 1.72, z: 1.43, sx: 2.9, sy: 3.4, color: 0xffc98c, opacity: 0.055, depthTest: true, renderOrder: 4 });
    });
    NM.glowSprite(group, { x: 0.82, y: 1.55, z: 1.9, sx: 4.0, sy: 3.0, color: 0xffb365, opacity: 0.1, depthTest: true, renderOrder: 4 });
    NM.glowSprite(group, { x: 2.28, y: 1.8, z: -2.4, sx: 2.4, sy: 6.4, color: 0xffb46e, opacity: 0.12, depthTest: true, renderOrder: 4 });

    // tiny downlights washing the sign face
    const signLight = new T.PointLight(0xffc37c, 64, 7.5, 2);
    signLight.position.set(CX, 3.3, 2.25);
    group.add(signLight);

    // vertical blade sign — the quiet flickering one
    const blade = new T.Group();
    blade.position.set(1.43, 4.46, 1.58);
    group.add(blade);
    NM.box(blade, { w: 0.68, h: 1.75, d: 0.18, x: 0, y: 0, z: 0, color: 0x315b57, outline: true });
    NM.box(blade, { w: 0.74, h: 0.08, d: 0.24, x: 0, y: 0.89, z: 0, color: 0x223b39, outline: true });
    NM.box(blade, { w: 0.74, h: 0.08, d: 0.24, x: 0, y: -0.89, z: 0, color: 0x223b39, outline: true });
    const bladeMat = new T.MeshBasicMaterial({ map: TEX.sign24h(), toneMapped: false });
    const bladeFront = new T.Mesh(new T.PlaneGeometry(0.56, 1.58), bladeMat);
    bladeFront.position.set(0, 0, 0.095);
    blade.add(bladeFront);
    const bladeBackMat = new T.MeshBasicMaterial({ map: TEX.sign24h(), toneMapped: false });
    const bladeBack = new T.Mesh(new T.PlaneGeometry(0.56, 1.58), bladeBackMat);
    bladeBack.position.set(0, 0, -0.095);
    bladeBack.rotation.y = Math.PI;
    blade.add(bladeBack);
    // bracket to the facade
    NM.box(blade, { w: 0.08, h: 0.07, d: 0.5, x: 0, y: 0.67, z: -0.3, color: 0x263a38, outline: true });
    NM.box(blade, { w: 0.08, h: 0.07, d: 0.5, x: 0, y: -0.67, z: -0.3, color: 0x263a38, outline: true });
    const bladeGlow = NM.glowSprite(group, { x: 1.43, y: 4.46, z: 1.85, sx: 2.4, sy: 3.8, color: 0xffd19b, opacity: 0.16, depthTest: true });

    // door-side plate
    NM.panel(group, { map: TEX.labelTexture("OPEN", { width: 512, height: 180, bg: "#283f3d", fg: "#f0d8aa", size: 96 }), w: 0.55, h: 0.2, x: 1.64, y: 2.79, z: 1.3, transparent: true, toneMapped: false });

    /* ================================================================== */
    /* Upper storey & roof                                               */
    /* ================================================================== */

    box({ w: W + 0.12, h: 2.05, d: D - 0.06, x: CX, y: 5.23, z: CZ + 0.02, color: upperColor, outline: true, edgeThreshold: 25 });
    // facade seams
    box({ w: W + 0.14, h: 0.05, d: 0.1, x: CX, y: 4.65, z: S.front - 0.015, color: 0x76898a, outline: false });
    box({ w: W + 0.14, h: 0.05, d: 0.1, x: CX, y: 5.8, z: S.front - 0.015, color: 0x76898a, outline: false });
    box({ w: 0.05, h: 2.0, d: 0.1, x: -2.5, y: 5.23, z: S.front - 0.015, color: 0x76898a, outline: false });

    // dim upstairs windows, one warm
    const upperWindow = (x, lit) => {
      NM.box(group, { w: 1.16, h: 1.0, d: 0.13, x: x, y: 5.3, z: S.front - 0.01, color: 0x4a5c5d, outline: true });
      NM.box(group, { w: 0.98, h: 0.82, d: 0.08, x: x, y: 5.3, z: S.front + 0.07, color: lit ? 0xffce8f : 0x1b2b32, outline: false, mat: lit ? new T.MeshBasicMaterial({ color: 0x6b4d33, toneMapped: true }) : NM.toon(0x22353f) });
      NM.box(group, { w: 1.24, h: 0.08, d: 0.22, x: x, y: 4.77, z: S.front + 0.03, color: 0x8b9a98, outline: true });
      // a curtain silhouette
      if (lit) {
        NM.box(group, { w: 0.3, h: 0.76, d: 0.03, x: x - 0.31, y: 5.3, z: S.front + 0.12, color: 0xd9b382, outline: false });
        NM.glowSprite(group, { x: x, y: 5.3, z: S.front + 0.22, sx: 2.1, sy: 1.8, color: 0xffb96c, opacity: 0.12, depthTest: true });
      }
    };
    upperWindow(-5.9, true);
    upperWindow(-1.45, false);

    // tiny upper-floor balcony at the lit window
    NM.box(group, { w: 1.36, h: 0.08, d: 0.4, x: -5.9, y: 4.73, z: S.front + 0.16, color: 0x8d9a93, outline: true });
    for (let i = 0; i < 6; i++) {
      NM.cyl(group, { r: 0.015, h: 0.48, x: -6.46 + i * 0.22, y: 4.99, z: S.front + 0.34, color: 0x5c6b67, outline: false });
    }
    NM.cyl(group, { r: 0.018, h: 1.18, x: -5.9, y: 5.02, z: S.front + 0.34, color: 0x5c6b67, rotZ: Math.PI / 2, outline: false });
    NM.box(group, { w: 0.7, h: 0.18, d: 0.22, x: -6.25, y: 4.82, z: S.front + 0.25, color: 0x596a5d, outline: true });
    for (let i = 0; i < 4; i++) {
      NM.sphere(group, { r: 0.08, x: -6.5 + i * 0.15, y: 4.92 + (i % 2) * 0.04, z: S.front + 0.26, color: i % 2 ? 0x4d7257 : 0x66845f, sx: 1.1, sy: 0.8, sz: 0.9, seg: 6, segY: 4 });
    }

    // window AC unit + drip pipe on the upper frontage
    NM.box(group, { w: 1.02, h: 0.58, d: 0.42, x: -3.72, y: 4.97, z: S.front + 0.2, color: 0xaab3a8, outline: true });
    NM.box(group, { w: 0.08, h: 0.34, d: 0.34, x: -4.16, y: 4.78, z: S.front + 0.15, color: 0x737f79, outline: true });
    NM.box(group, { w: 0.96, h: 0.04, d: 0.45, x: -3.72, y: 4.66, z: S.front + 0.22, color: 0x5d6a64, outline: true });
    const upperFan = new T.Mesh(new T.CircleGeometry(0.19, 16), NM.toon(0x58625d));
    upperFan.position.set(-3.56, 4.95, S.front + 0.415);
    group.add(upperFan);
    for (let i = 0; i < 3; i++) {
      NM.box(group, { w: 0.03, h: 0.17, d: 0.02, x: -3.56, y: 4.95, z: S.front + 0.42, color: 0x7e8981, outline: false, rotZ: (i / 3) * Math.PI });
    }
    NM.cyl(group, { r: 0.017, h: 1.0, x: -3.25, y: 4.1, z: S.front + 0.19, color: 0x5f6c66, outline: false });
    // small conduit and boxes, tucked along the stone facade
    NM.cyl(group, { r: 0.028, h: 1.8, x: -8.52, y: 5.1, z: S.front + 0.06, color: 0x6d7770, outline: false });
    NM.box(group, { w: 0.22, h: 0.38, d: 0.12, x: -0.15, y: 5.03, z: S.front + 0.06, color: 0x79847b, outline: true });
    NM.box(group, { w: 0.48, h: 0.19, d: 0.04, x: 0.62, y: 4.53, z: S.front + 0.09, color: 0xc5b997, outline: true });

    // rooftop
    box({ w: W + 0.2, h: 0.16, d: D + 0.05, x: CX, y: 6.31, z: CZ, color: 0x566568, outline: true });
    const roofMat = NM.toon(0x7b8687, { map: TEX.roof() });
    const roofTop = new T.Mesh(new T.PlaneGeometry(W, D - 0.25), roofMat);
    roofTop.rotation.x = -Math.PI / 2;
    roofTop.position.set(CX, 6.4, CZ);
    roofTop.receiveShadow = true;
    group.add(roofTop);
    // parapet
    [
      { w: W + 0.2, h: 0.32, d: 0.18, x: CX, y: 6.53, z: S.back + 0.04 },
      { w: W + 0.2, h: 0.32, d: 0.18, x: CX, y: 6.53, z: S.front - 0.06 },
      { w: 0.18, h: 0.32, d: D, x: S.left + 0.02, y: 6.53, z: CZ },
      { w: 0.18, h: 0.32, d: D, x: S.right - 0.02, y: 6.53, z: CZ },
    ].forEach((o) => NM.box(group, Object.assign({ color: 0x7e8b86, outline: true }, o)));

    const makeRoofUnit = (x, z, scale, rot) => {
      const g = new T.Group();
      g.position.set(x, 6.42, z);
      g.rotation.y = rot || 0;
      group.add(g);
      const s = scale || 1;
      NM.box(g, { w: 0.92 * s, h: 0.52 * s, d: 0.72 * s, x: 0, y: 0.26 * s, z: 0, color: 0x78878a, outline: true });
      const fan = new T.Mesh(new T.CircleGeometry(0.27 * s, 16), NM.toon(0x3c484a));
      fan.rotation.y = -Math.PI / 2;
      fan.position.set(0.47 * s, 0.28 * s, 0);
      g.add(fan);
      for (let i = 0; i < 4; i++) {
        NM.box(g, { w: 0.5 * s, h: 0.02, d: 0.02, x: 0.48 * s, y: 0.28 * s, z: -0.15 * s + i * 0.1 * s, color: 0x2d3737, outline: false, rotY: 0 });
      }
      NM.box(g, { w: 0.58 * s, h: 0.02, d: 0.8 * s, x: 0.01 * s, y: 0.55 * s, z: 0, color: 0x9aa7a1, outline: false });
      NM.cyl(g, { r: 0.03 * s, h: 0.42 * s, x: -0.32 * s, y: 0.1 * s, z: -0.34 * s, color: 0x465253, outline: false });
      return g;
    };
    makeRoofUnit(-6.2, -6.0, 1.12, 0);
    makeRoofUnit(-4.95, -6.3, 0.8, 0.15);
    makeRoofUnit(0.45, -6.65, 0.9, -0.2);

    // Rooftop stairhead / storage hut, with a small warm door lamp.
    const roofHut = new T.Group();
    roofHut.position.set(-1.45, 6.42, -5.75);
    group.add(roofHut);
    NM.box(roofHut, { w: 2.0, h: 1.35, d: 1.3, x: 0, y: 0.675, z: 0, color: 0x8d9990, outline: true });
    NM.box(roofHut, { w: 2.12, h: 0.1, d: 1.42, x: 0, y: 1.39, z: 0, color: 0x5f6c66, outline: true });
    NM.box(roofHut, { w: 0.66, h: 1.08, d: 0.06, x: -0.15, y: 0.56, z: 0.68, color: 0x49605b, outline: true });
    NM.box(roofHut, { w: 0.42, h: 0.08, d: 0.03, x: -0.15, y: 0.3, z: 0.72, color: 0x9ea69a, outline: false });
    NM.box(roofHut, { w: 0.24, h: 0.1, d: 0.12, x: 0, y: 1.02, z: 0.73, color: 0x3d4b48, outline: true });
    NM.glowSprite(roofHut, { x: 0, y: 0.97, z: 0.82, sx: 0.8, sy: 0.9, color: 0xffc27a, opacity: 0.22, depthTest: true });
    NM.box(roofHut, { w: 0.09, h: 1.02, d: 0.12, x: 0, y: 0.98, z: 0.73, color: 0xffdba3, outline: false, mat: new T.MeshBasicMaterial({ color: 0xffd89c, toneMapped: true }) });
    const roofHutLight = new T.PointLight(0xffbf7b, 8, 2.8, 2);
    roofHutLight.position.set(-1.45, 7.25, -4.95);
    group.add(roofHutLight);

    // laundry line on the roof — a little sign of life above the shop
    const laundry = new T.Group();
    laundry.position.set(-6.6, 6.42, -3.1);
    group.add(laundry);
    NM.cyl(laundry, { r: 0.03, h: 1.32, x: 0, y: 0.66, z: 0, color: 0x65716b, outline: false });
    NM.cyl(laundry, { r: 0.03, h: 1.32, x: 2.2, y: 0.66, z: 0, color: 0x65716b, outline: false });
    NM.cyl(laundry, { r: 0.018, h: 2.25, x: 1.1, y: 1.32, z: 0, color: 0x68756e, rotZ: Math.PI / 2, outline: false });
    const roofLaundry = [];
    [
      { x: 0.62, w: 0.48, h: 0.58, color: 0xc7c9bd, accent: 0x8199a1 },
      { x: 1.38, w: 0.62, h: 0.44, color: 0xd8d0bc, accent: 0xb2765b },
    ].forEach((c, i) => {
      const cloth = new T.Mesh(
        new T.PlaneGeometry(c.w, c.h, 3, 4),
        new T.MeshBasicMaterial({ color: c.color, side: T.DoubleSide, toneMapped: true })
      );
      cloth.position.set(c.x, 1.29 - c.h / 2, 0);
      cloth.rotation.x = 0.02;
      laundry.add(cloth);
      const stripe = new T.Mesh(new T.PlaneGeometry(c.w * 0.72, 0.05, 1, 1), new T.MeshBasicMaterial({ color: c.accent, side: T.DoubleSide, toneMapped: true }));
      stripe.position.set(c.x, 1.29 - c.h * 0.55, 0.006);
      laundry.add(stripe);
      roofLaundry.push({ mesh: cloth, stripe, phase: i * 1.7 });
    });
    [0.42, 0.82, 1.18, 1.58].forEach((px) => {
      NM.box(laundry, { w: 0.025, h: 0.08, d: 0.035, x: px, y: 1.32, z: 0, color: 0xa78a62, outline: false });
    });
    // potted plants by the parapet
    [0, 1, 2].forEach((i) => {
      NM.cyl(group, { r: 0.18, rb: 0.14, h: 0.3, x: -7.7 + i * 0.55, y: 6.58, z: -7.05, color: 0x796b56, outline: true });
      for (let j = 0; j < 4; j++) {
        NM.sphere(group, { r: 0.16 + j * 0.025, x: -7.7 + i * 0.55 + (j - 1.5) * 0.08, y: 6.84 + j * 0.045, z: -7.05 + (j % 2) * 0.06, color: j % 2 ? 0x486a51 : 0x5c7a5d, sx: 1.2, sy: 0.7, sz: 1, seg: 6, segY: 4 });
      }
    });

    // roof vents / antenna / puddles
    NM.cyl(group, { r: 0.14, h: 1.5, x: 0.95, y: 7.18, z: -6.9, color: 0x697777, outline: true });
    NM.cyl(group, { r: 0.33, h: 0.08, x: 0.95, y: 7.92, z: -6.9, color: 0x8d9994, outline: true });
    NM.cyl(group, { r: 0.04, h: 2.2, x: 1.02, y: 7.7, z: -6.85, color: 0x6f7b78, outline: false });
    for (let i = 0; i < 4; i++) {
      NM.cyl(group, { r: 0.22 - i * 0.03, h: 0.03, x: 1.02, y: 7.99 + i * 0.18, z: -6.85, color: 0x778482, outline: true });
    }
    for (let i = 0; i < 2; i++) {
      const puddleMat = new T.MeshBasicMaterial({
        color: 0x24343a,
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
      });
      const p = new T.Mesh(NM.irregularPuddle(0.8, 0.35, 33 + i, 18), puddleMat);
      p.position.set(-2.8 + i * 3.5, 6.416, -5.0 + i * 1.2);
      group.add(p);
    }

    // vertical rain pipe on the front corner
    NM.cyl(group, { r: 0.085, h: 6.1, x: S.left + 0.04, y: 3.2, z: S.front + 0.16, color: 0x4a5b58, outline: true });
    NM.cyl(group, { r: 0.09, h: 0.12, x: S.left + 0.04, y: 6.25, z: S.front + 0.16, color: 0x384844, outline: true });
    NM.cyl(group, { r: 0.085, h: 0.38, x: S.left + 0.04, y: 0.32, z: S.front + 0.25, color: 0x334440, outline: true, rotX: 0.5 });

    // exposed power pipes on the side
    NM.cyl(group, { r: 0.035, h: 2.4, x: S.right + 0.08, y: 5.2, z: -6.9, color: 0x50605e, outline: false });
    NM.box(group, { w: 0.12, h: 0.75, d: 0.5, x: S.right + 0.12, y: 4.6, z: -6.2, color: 0x6c7975, outline: true });

    /* ================================================================== */
    /* Interior — back fixtures                                          */
    /* ================================================================== */

    const interior = new T.Group();
    interior.name = "store-interior";
    group.add(interior);

    const shelvingMat = NM.toon(0xd7d0bf);
    const shelfGreen = NM.toon(0x345b58);
    // Packaging is flat cel colour with crisp little labels. This keeps the
    // shelves legible through glass and keeps the warm set from washing out.
    const productMat = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: true });
    const labelMat = new T.MeshBasicMaterial({ color: 0xf6ecd9, toneMapped: true });
    const rand = NM.seedRandom(1907);
    const allProducts = [];
    const allCans = [];
    const allBento = [];
    const allProductLabels = [];

    // --- back wall wainscot and a few little notices
    NM.box(interior, { w: W - 0.5, h: 0.07, d: 0.03, x: CX, y: 0.65, z: S.back + 0.39, color: 0xbcb4a3, outline: false });

    // tall glass-door drinks fridges
    const fridgeBank = new T.Group();
    fridgeBank.position.set(0, 0, 0);
    interior.add(fridgeBank);
    const fridgeX = [-6.95, -5.75, -4.55];
    const fridgeW = 1.12;
    fridgeX.forEach((fx, fi) => {
      // Open display case: no solid body, so the lit shelves and bottles actually read.
      NM.box(fridgeBank, { w: fridgeW + 0.03, h: 0.2, d: 0.7, x: fx, y: 0.39, z: -6.87, color: 0x3b5550, outline: true });
      NM.box(fridgeBank, { w: fridgeW + 0.03, h: 0.16, d: 0.7, x: fx, y: 2.34, z: -6.87, color: 0x58716c, outline: true });
      // luminous back panel
      const backGlow = new T.Mesh(new T.PlaneGeometry(fridgeW - 0.1, 1.82), new T.MeshBasicMaterial({ color: 0xe5fbf3, toneMapped: true }));
      backGlow.position.set(fx, 1.43, -7.17);
      fridgeBank.add(backGlow);
      // side walls + shelves
      NM.box(fridgeBank, { w: 0.05, h: 1.9, d: 0.63, x: fx - fridgeW / 2 + 0.055, y: 1.46, z: -6.86, color: 0xd4e2dc, outline: false });
      NM.box(fridgeBank, { w: 0.05, h: 1.9, d: 0.63, x: fx + fridgeW / 2 - 0.055, y: 1.46, z: -6.86, color: 0xd4e2dc, outline: false });
      [0.7, 1.08, 1.46, 1.84, 2.2].forEach((y, si) => {
        NM.box(fridgeBank, { w: fridgeW - 0.06, h: 0.04, d: 0.55, x: fx, y: y, z: -6.9, color: 0xc0d4ce, outline: false });
        NM.box(fridgeBank, { w: fridgeW - 0.06, h: 0.02, d: 0.02, x: fx, y: y + 0.026, z: -6.63, color: 0xf6fff9, outline: false, mat: new T.MeshBasicMaterial({ color: 0xd8f3ec, toneMapped: true }) });
      });
      // bottles and cans sit in front of the glowing back panel
      const levels = [0.74, 1.12, 1.5, 1.88];
      levels.forEach((y, li) => {
        for (let c = 0; c < 8; c++) {
          const bx = fx - 0.44 + c * 0.126;
          const isCan = rand() > 0.45;
          allCans.push({
            x: bx,
            y: y + (isCan ? 0.075 : 0.11),
            z: -6.85 - rand() * 0.08,
            w: 0.075,
            h: isCan ? 0.15 : 0.22,
            d: 0.085,
            color: [0xd45e4f, 0x5c8ea3, 0xe0b054, 0x6c9a67, 0xd58b52, 0xefe5d1, 0x776185, 0x8bbfae][Math.floor(rand() * 8)],
            ry: rand() * 0.2,
          });
        }
        // a few milk cartons near the edge
        if (li === 1) {
          allCans.push({
            x: fx + 0.36,
            y: y + 0.14,
            z: -6.78,
            w: 0.12,
            h: 0.27,
            d: 0.1,
            color: 0xf0e8d2,
            ry: 0.02,
          });
        }
      });
      // glass door + frame
      const glass = new T.Mesh(new T.PlaneGeometry(fridgeW - 0.08, 1.92), new T.MeshBasicMaterial({ color: 0xa9d8dd, transparent: true, opacity: 0.1, depthWrite: false, blending: T.AdditiveBlending }));
      glass.position.set(fx, 1.48, -6.53);
      fridgeBank.add(glass);
      NM.box(fridgeBank, { w: 0.035, h: 1.98, d: 0.05, x: fx - fridgeW / 2 + 0.045, y: 1.46, z: -6.52, color: 0x405c58, outline: true });
      NM.box(fridgeBank, { w: 0.035, h: 1.98, d: 0.05, x: fx + fridgeW / 2 - 0.045, y: 1.46, z: -6.52, color: 0x405c58, outline: true });
      NM.box(fridgeBank, { w: fridgeW - 0.06, h: 0.055, d: 0.05, x: fx, y: 2.44, z: -6.52, color: 0x405c58, outline: true });
      NM.box(fridgeBank, { w: fridgeW - 0.06, h: 0.055, d: 0.05, x: fx, y: 0.5, z: -6.52, color: 0x405c58, outline: true });
      NM.box(fridgeBank, { w: 0.028, h: 0.62, d: 0.035, x: fx + 0.36, y: 1.32, z: -6.46, color: 0xb9c8c1, outline: false });
      // little header
      NM.panel(fridgeBank, { map: TEX.labelTexture("COLD DRINK", { width: 512, height: 112, bg: "#2f6865", fg: "#f5e8cf", size: 49 }), w: 1.0, h: 0.2, x: fx, y: 2.3, z: -6.49, transparent: true });
      // a tiny cool glow leaking out of the case
      NM.glowSprite(fridgeBank, { x: fx, y: 1.48, z: -6.39, sx: 0.9, sy: 1.7, color: 0xa8f0e4, opacity: 0.08, depthTest: true });
    });
    // category light box above the fridges
    NM.box(interior, { w: 3.5, h: 0.6, d: 0.13, x: -5.8, y: 2.66, z: -7.1, color: 0xd8cfb9, outline: true });
    NM.panel(interior, { map: TEX.categorySign("drink"), w: 3.24, h: 0.51, x: -5.8, y: 2.66, z: -7.025, transparent: true });

    // --- open bento / onigiri case along the back wall
    const bentoX = -2.35;
    NM.box(interior, { w: 2.65, h: 0.5, d: 0.68, x: bentoX, y: 0.51, z: -6.91, color: 0x405b55, outline: true });
    NM.box(interior, { w: 2.68, h: 1.3, d: 0.12, x: bentoX, y: 1.4, z: -7.15, color: 0xf1e8d5, outline: true });
    const bentoBack = new T.Mesh(new T.PlaneGeometry(2.46, 1.2), new T.MeshBasicMaterial({ color: 0xfff2d6, toneMapped: true }));
    bentoBack.position.set(bentoX, 1.42, -7.085);
    interior.add(bentoBack);
    [0.83, 1.19, 1.55, 1.9].forEach((y, i) => {
      NM.box(interior, { w: 2.52, h: 0.035, d: 0.55, x: bentoX, y: y, z: -6.87, color: 0xd0c4ad, outline: false });
      NM.box(interior, { w: 2.54, h: 0.018, d: 0.02, x: bentoX, y: y + 0.022, z: -6.59, color: 0xfff5da, outline: false, mat: new T.MeshBasicMaterial({ color: 0xf1d59b, toneMapped: true }) });
      for (let c = 0; c < 6; c++) {
        const bx = bentoX - 1.05 + c * 0.42;
        if (i > 1) {
          allBento.push({ x: bx, y: y + 0.075, z: -6.75, w: 0.3, h: 0.12, d: 0.33, color: [0xca6c4f, 0x8a5a3d, 0xe6d9ba, 0x6b8b65, 0xdac994][Math.floor(rand() * 5)], ry: (rand() - 0.5) * 0.08 });
        }
        if (i === 0) {
          // onigiri packages on the lowest shelf
          const oni = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.06, 3), NM.toon(0xf3ead6));
          oni.rotation.x = Math.PI / 2;
          oni.rotation.z = rand() * 0.2;
          oni.position.set(bx, y + 0.085, -6.7);
          interior.add(oni);
          const nori = NM.box(interior, { w: 0.11, h: 0.08, d: 0.012, x: bx, y: y + 0.06, z: -6.66, color: 0x263a30, outline: false });
          nori.rotation.z = oni.rotation.z;
        }
      }
    });
    NM.box(interior, { w: 2.7, h: 0.6, d: 0.13, x: bentoX, y: 2.55, z: -7.08, color: 0xd8cfb9, outline: true });
    NM.panel(interior, { map: TEX.categorySign("bento"), w: 2.44, h: 0.5, x: bentoX, y: 2.55, z: -7.005, transparent: true });

    // small poster beside bento
    NM.panel(interior, { map: TEX.poster("onigiri"), w: 0.7, h: 1.05, x: -0.93, y: 2.05, z: -7.08, transparent: true });

    // --- staff door and backroom
    NM.box(interior, { w: 1.03, h: 2.2, d: 0.13, x: 0.35, y: 1.38, z: -7.19, color: 0x324847, outline: true });
    NM.box(interior, { w: 0.9, h: 2.05, d: 0.08, x: 0.35, y: 1.31, z: -7.12, color: 0x658881, outline: true });
    NM.box(interior, { w: 0.28, h: 1.0, d: 0.025, x: 0.46, y: 1.55, z: -7.07, color: 0x203338, outline: false });
    NM.glowSprite(interior, { x: 0.68, y: 1.52, z: -7.06, sx: 0.65, sy: 1.0, color: 0xffca85, opacity: 0.18, depthTest: true });
    NM.panel(interior, { map: TEX.doorPlate(), w: 0.52, h: 0.13, x: 0.3, y: 2.37, z: -7.045, transparent: true });
    // staff-only glowing strip around the door
    NM.box(interior, { w: 0.035, h: 2.04, d: 0.035, x: -0.16, y: 1.31, z: -7.06, color: 0xffe2ad, outline: false, mat: new T.MeshBasicMaterial({ color: 0xffd99a, toneMapped: true }) });
    // locker
    NM.box(interior, { w: 0.72, h: 1.85, d: 0.48, x: 1.25, y: 1.11, z: -7.0, color: 0x7d8d83, outline: true });
    [0, 1].forEach((i) => {
      NM.box(interior, { w: 0.32, h: 0.12, d: 0.03, x: 1.13, y: 1.38 + i * 0.4, z: -6.75, color: 0x4e605b, outline: false });
      NM.box(interior, { w: 0.05, h: 0.05, d: 0.02, x: 1.32, y: 1.28 + i * 0.4, z: -6.75, color: 0xc9bb98, outline: false });
    });
    NM.box(interior, { w: 0.46, h: 0.85, d: 0.37, x: 0.9, y: 0.75, z: -6.85, color: 0x9c7a4e, outline: true });
    NM.panel(interior, { map: TEX.noticePoster(0), w: 0.34, h: 0.46, x: 0.9, y: 0.91, z: -6.66, transparent: true });
    // round wall clock above the staff door
    const clockGroup = new T.Group();
    clockGroup.position.set(-0.06, 2.94, -7.22);
    interior.add(clockGroup);
    NM.cyl(clockGroup, { r: 0.18, h: 0.05, x: 0, y: 0, z: 0, color: 0x354542, rotX: Math.PI / 2, outline: true });
    const clockFace = new T.Mesh(new T.CircleGeometry(0.15, 24), new T.MeshBasicMaterial({ color: 0xf0e8d3, toneMapped: true }));
    clockFace.position.z = 0.032;
    clockGroup.add(clockFace);
    const handMat = new T.MeshBasicMaterial({ color: 0x304542 });
    const hourHand = new T.Mesh(new T.PlaneGeometry(0.014, 0.08), handMat);
    hourHand.position.z = 0.04;
    hourHand.position.y = 0.028;
    hourHand.rotation.z = 0.2;
    clockGroup.add(hourHand);
    const minuteHand = new T.Mesh(new T.PlaneGeometry(0.01, 0.115), handMat);
    minuteHand.position.z = 0.041;
    minuteHand.position.y = 0.045;
    minuteHand.rotation.z = -2.8;
    clockGroup.add(minuteHand);

    // --- low gondola shelving, facing the front windows
    const shelfStripMat = new T.MeshBasicMaterial({ map: TEX.shelfStrip(), toneMapped: false });
    const buildGondola = (cx, cz, len, width) => {
      const g = new T.Group();
      g.position.set(cx, 0, cz);
      interior.add(g);
      // Hollow island gondola: plinth, end panels and a spine, with products open to view.
      NM.box(g, { w: len, h: 0.2, d: width, x: 0, y: 0.36, z: 0, color: 0x3b514c, outline: true, edgeThreshold: 28, mat: darkTrimMat });
      NM.box(g, { w: len - 0.12, h: 1.22, d: 0.08, x: 0, y: 0.98, z: 0, color: 0x3b514c, outline: true, mat: darkTrimMat });
      NM.box(g, { w: 0.08, h: 1.24, d: width, x: -len / 2 + 0.04, y: 0.98, z: 0, color: 0x3b514c, outline: true, mat: darkTrimMat });
      NM.box(g, { w: 0.08, h: 1.24, d: width, x: len / 2 - 0.04, y: 0.98, z: 0, color: 0x3b514c, outline: true, mat: darkTrimMat });
      NM.box(g, { w: len, h: 0.075, d: width, x: 0, y: 1.64, z: 0, color: 0x3b514c, outline: true, mat: darkTrimMat });
      const levels = [0.46, 0.83, 1.2];
      [-1, 1].forEach((side) => {
        levels.forEach((y) => {
          const zz = side * (width / 2 + 0.08);
          NM.box(g, { w: len - 0.1, h: 0.045, d: 0.4, x: 0, y: y, z: zz, color: 0xe9d9bd, outline: false, mat: shelfFlatMat });
          NM.box(g, { w: len - 0.08, h: 0.02, d: 0.41, x: 0, y: y + 0.027, z: zz, color: 0xffe7bb, outline: false, mat: new T.MeshBasicMaterial({ color: 0xf8dfb3, toneMapped: true }) });
          // a quiet dark line under each shelf gives the rows their anime line weight
          NM.box(g, { w: len - 0.1, h: 0.026, d: 0.018, x: 0, y: y - 0.032, z: zz + side * 0.196, color: 0x3b514c, outline: false, mat: darkTrimMat });
          for (let i = 0; i < 9; i++) {
            const x = -len / 2 + 0.18 + i * ((len - 0.36) / 8);
            const ph = 0.14 + rand() * 0.19;
            const ryp = (rand() - 0.5) * 0.18;
            const prodW = 0.12 + rand() * 0.1;
            const prodD = 0.18 + rand() * 0.07;
            const prodZ = zz + side * (0.03 + rand() * 0.025);
            allProducts.push({
              x: cx + x + (rand() - 0.5) * 0.035,
              y: y + ph / 2 + 0.035,
              z: cz + prodZ,
              w: prodW,
              h: ph,
              d: prodD,
              color: [0xe5533f, 0xf0b43b, 0x2f8f83, 0xeee6d2, 0xc34d6d, 0x6f9e4c, 0xe47d33, 0x3b79a8, 0xf1d9a5, 0x8a5a3d, 0x69b6b3, 0xd8aa4d][Math.floor(rand() * 12)],
              ry: ryp,
            });
            allProductLabels.push({
              x: cx + x + (rand() - 0.5) * 0.015,
              y: y + ph * 0.63,
              z: cz + prodZ + side * (prodD * 0.5 + 0.004),
              w: prodW * (0.56 + rand() * 0.18),
              h: 0.026 + rand() * 0.02,
              d: 0.004,
              color: 0xf5ecd8,
              ry: ryp,
            });
          }
          // price strip facing the customer
          const strip = new T.Mesh(new T.PlaneGeometry(len - 0.25, 0.11), shelfStripMat);
          strip.position.set(0, y - 0.09, zz + side * 0.205);
          if (side < 0) strip.rotation.y = Math.PI;
          g.add(strip);
        });
      });
      // small promo cards stuck to the shelf ends
      NM.panel(g, { map: TEX.labelTexture("NEW", { width: 512, height: 512, bg: "#c15c46", fg: "#f6e8ce", size: 190, font: TEX._helpers.EN_FONT }), w: 0.36, h: 0.36, x: -len / 2 - 0.005, y: 1.45, z: 0.1, rotY: -Math.PI / 2, transparent: true, toneMapped: true });
      NM.panel(g, { map: TEX.labelTexture("¥108", { width: 512, height: 512, bg: "#e1c184", fg: "#46564b", size: 150, font: TEX._helpers.EN_FONT }), w: 0.34, h: 0.34, x: len / 2 + 0.005, y: 1.45, z: 0.1, rotY: Math.PI / 2, transparent: true, toneMapped: true });
      // bright little category cards on the shelf top
      NM.panel(g, { map: TEX.labelTexture("NEW SNACKS", { width: 1024, height: 200, bg: "#f4e6c9", fg: "#345b53", size: 78, font: TEX._helpers.EN_FONT }), w: 1.6, h: 0.32, x: -len * 0.18, y: 1.83, z: width / 2 + 0.1, transparent: true, toneMapped: true });
      NM.panel(g, { map: TEX.labelTexture("¥108〜", { width: 512, height: 200, bg: "#bd6047", fg: "#f5e6c9", size: 95, font: TEX._helpers.EN_FONT }), w: 0.85, h: 0.32, x: len * 0.3, y: 1.83, z: width / 2 + 0.1, transparent: true, toneMapped: true });
      return g;
    };
    buildGondola(-5.45, -2.9, 3.1, 1.02);
    buildGondola(-5.45, -4.5, 3.1, 1.02);

    // --- magazine rack, right behind the left-hand window
    const magGroup = new T.Group();
    magGroup.position.set(-7.12, 0, -0.5);
    interior.add(magGroup);
    NM.box(magGroup, { w: 2.42, h: 1.08, d: 0.42, x: 0, y: 0.73, z: 0, color: 0x6a5543, outline: true });
    NM.box(magGroup, { w: 2.48, h: 0.06, d: 0.48, x: 0, y: 1.28, z: 0, color: 0x3e554e, outline: true });
    NM.panel(magGroup, { map: TEX.categorySign("magazine"), w: 1.9, h: 0.34, x: -0.18, y: 1.45, z: 0.05, transparent: true, toneMapped: true });
    [0.52, 0.9].forEach((y, row) => {
      NM.box(magGroup, { w: 2.28, h: 0.035, d: 0.32, x: 0, y: y - 0.08, z: 0.17, color: 0xd9c9af, outline: false, rotX: -0.13 });
      for (let i = 0; i < 7; i++) {
        const cover = TEX.magazineCover((row * 4 + i) % 8);
        const m = new T.Mesh(new T.PlaneGeometry(0.26, 0.36), new T.MeshBasicMaterial({ map: cover, toneMapped: true }));
        m.position.set(-0.96 + i * 0.32, y + 0.12, 0.23);
        m.rotation.x = -0.13 + (rand() - 0.5) * 0.04;
        m.rotation.z = (rand() - 0.5) * 0.025;
        magGroup.add(m);
      }
    });
    // bright ad panel above the rack
    NM.panel(magGroup, { map: TEX.poster("seasonal"), w: 0.6, h: 0.9, x: 0.75, y: 1.86, z: -0.07, transparent: true, toneMapped: true });
    NM.box(magGroup, { w: 0.68, h: 0.98, d: 0.04, x: 0.75, y: 1.86, z: -0.1, color: 0x3f554d, outline: true });

    // hanging books-and-magazines light box above the rack
    NM.box(interior, { w: 2.25, h: 0.48, d: 0.07, x: -6.28, y: 2.38, z: -0.1, color: 0x3b514c, outline: true, mat: darkTrimMat });
    NM.panel(interior, { map: TEX.categorySign("magazine"), w: 2.08, h: 0.39, x: -6.28, y: 2.38, z: -0.058, transparent: true, toneMapped: true });
    NM.cyl(interior, { r: 0.007, h: 0.38, x: -7.2, y: 2.81, z: -0.1, color: 0x66766e, outline: false });
    NM.cyl(interior, { r: 0.007, h: 0.38, x: -5.36, y: 2.81, z: -0.1, color: 0x66766e, outline: false });
    NM.glowSprite(interior, { x: -6.28, y: 2.38, z: 0.02, sx: 2.8, sy: 1.1, color: 0xffdba5, opacity: 0.075, depthTest: true });

    // --- low display shelves near the entrance, under the window
    const promo = new T.Group();
    promo.position.set(-7.55, 0, 0.16);
    interior.add(promo);
    NM.box(promo, { w: 1.86, h: 0.62, d: 0.46, x: 0, y: 0.41, z: 0, color: 0xe0cfaf, outline: true });
    for (let i = 0; i < 5; i++) {
      NM.box(promo, { w: 0.27, h: 0.22, d: 0.23, x: -0.7 + i * 0.35, y: 0.74, z: 0.04, color: [0xcf6049, 0xd9ac52, 0x4f8378, 0xc0c8a8, 0xb46f5b][i], outline: false });
    }
    NM.panel(promo, { map: TEX.labelTexture("NEW", { width: 512, height: 200, bg: "#b55843", fg: "#f6e7c9", size: 120, font: TEX._helpers.EN_FONT }), w: 0.55, h: 0.22, x: 0, y: 0.95, z: 0.24, transparent: true, toneMapped: true });

    // --- low shelves along the right-hand glass, so the side window reads too
    const sideDisplay = new T.Group();
    sideDisplay.position.set(1.4, 0, -3.55);
    interior.add(sideDisplay);
    NM.box(sideDisplay, { w: 0.38, h: 0.16, d: 1.9, x: 0, y: 0.34, z: 0, color: 0x3b514c, outline: true, mat: darkTrimMat });
    NM.box(sideDisplay, { w: 0.06, h: 1.1, d: 1.86, x: 0, y: 0.9, z: 0, color: 0x4c635b, outline: true });
    [0.48, 0.82, 1.16].forEach((level) => {
      NM.box(sideDisplay, { w: 0.35, h: 0.04, d: 1.8, x: 0.03, y: level, z: 0, color: 0xe7d6b8, outline: false, mat: shelfFlatMat });
      NM.box(sideDisplay, { w: 0.02, h: 0.024, d: 1.8, x: 0.24, y: level + 0.02, z: 0, color: 0xf8dfb3, outline: false, mat: new T.MeshBasicMaterial({ color: 0xf8dfb3, toneMapped: true }) });
      for (let i = 0; i < 7; i++) {
        const z = -0.76 + i * 0.255;
        const ph = 0.16 + (i % 3) * 0.035;
        allProducts.push({
          x: 1.65,
          y: level + ph / 2 + 0.032,
          z: -3.55 + z,
          w: 0.20,
          h: ph,
          d: 0.16,
          color: [0xe5533f, 0xf0b43b, 0x2f8f83, 0xf1e4cc, 0xc34d6d, 0x69b6b3][(i + Math.floor(level * 10)) % 6],
          ry: 0,
        });
      }
    });
    NM.panel(interior, { map: TEX.categorySign("snack"), w: 1.34, h: 0.33, x: 1.63, y: 1.5, z: -3.55, rotY: Math.PI / 2, transparent: true, toneMapped: true });
    NM.box(interior, { w: 0.045, h: 0.4, d: 1.44, x: 1.62, y: 1.5, z: -3.55, color: 0x3b514c, outline: true, mat: darkTrimMat });

    // --- ice cream chest freezer near the window
    const iceGroup = new T.Group();
    iceGroup.position.set(-2.05, 0, -0.55);
    interior.add(iceGroup);
    NM.box(iceGroup, { w: 1.45, h: 0.62, d: 1.02, x: 0, y: 0.59, z: 0, color: 0xd7d9cd, outline: true });
    NM.box(iceGroup, { w: 1.47, h: 0.12, d: 1.04, x: 0, y: 0.94, z: 0, color: 0x4d6667, outline: true });
    const iceGlow = new T.Mesh(new T.PlaneGeometry(1.25, 0.84), new T.MeshBasicMaterial({ color: 0xcdeae2, toneMapped: true }));
    iceGlow.rotation.x = -Math.PI / 2;
    iceGlow.position.set(0, 1.01, 0);
    iceGroup.add(iceGlow);
    NM.glowSprite(iceGroup, { x: 0, y: 1.09, z: 0, sx: 2.0, sy: 1.7, color: 0xc4f2ea, opacity: 0.15, depthTest: true });
    for (let i = 0; i < 10; i++) {
      NM.box(iceGroup, { w: 0.14, h: 0.04, d: 0.1, x: -0.5 + (i % 5) * 0.24, y: 1.03, z: -0.25 + Math.floor(i / 5) * 0.3, color: [0xd9875f, 0xe6d2a8, 0xb46c83, 0x8b7857][i % 4], outline: false, rotY: (rand() - 0.5) * 0.3 });
    }
    NM.panel(iceGroup, { map: TEX.labelTexture("ICE CREAM", { width: 512, height: 128, bg: "#3e676a", fg: "#f2e4c8", size: 53 }), w: 1.15, h: 0.28, x: 0, y: 0.72, z: 0.515, transparent: true });

    // --- checkout counter
    const counter = new T.Group();
    counter.position.set(-0.96, 0, -2.18);
    interior.add(counter);
    NM.box(counter, { w: 3.65, h: 0.95, d: 0.58, x: 0, y: 0.72, z: 0, color: 0xe0cda7, outline: true });
    NM.box(counter, { w: 3.78, h: 0.08, d: 0.67, x: 0, y: 1.23, z: -0.01, color: 0xf1e4cb, outline: true });
    // teal stripe + kick panel
    NM.box(counter, { w: 3.6, h: 0.15, d: 0.03, x: 0, y: 0.83, z: 0.305, color: 0x3b6c64, outline: false });
    NM.box(counter, { w: 3.55, h: 0.12, d: 0.03, x: 0, y: 0.35, z: 0.305, color: 0xbe9f72, outline: false });
    NM.box(counter, { w: 3.15, h: 0.32, d: 0.012, x: 0, y: 0.61, z: 0.312, color: 0xd8c29c, outline: false });
    // bag rack and small shelf on front
    NM.box(counter, { w: 0.8, h: 0.44, d: 0.24, x: -1.25, y: 0.99, z: 0.35, color: 0x79918c, outline: true, rotX: 0.15 });
    NM.box(counter, { w: 0.56, h: 0.1, d: 0.24, x: -1.25, y: 1.12, z: 0.34, color: 0x5f7771, outline: false });

    // register monitor
    NM.box(counter, { w: 0.43, h: 0.32, d: 0.08, x: 0.74, y: 1.46, z: 0.12, color: 0x262f30, outline: true, rotX: -0.1 });
    const posCanvas = TEX._helpers.makeCanvas(384, 256);
    const pctx = posCanvas.getContext("2d");
    pctx.fillStyle = "#153438";
    pctx.fillRect(0, 0, 384, 256);
    pctx.fillStyle = "#6ba79d";
    pctx.fillRect(0, 0, 384, 38);
    pctx.fillStyle = "#f1e2c7";
    pctx.font = "700 24px " + TEX._helpers.EN_FONT;
    pctx.textAlign = "left";
    pctx.fillText("HOSHI POS", 20, 28);
    pctx.fillStyle = "#dcebdc";
    pctx.font = "600 17px " + TEX._helpers.JP_FONT;
    pctx.fillText("お会計", 20, 76);
    pctx.fillStyle = "#7ad2bb";
    pctx.fillRect(20, 90, 216, 5);
    pctx.fillStyle = "#f4e4bd";
    pctx.font = "700 20px " + TEX._helpers.EN_FONT;
    pctx.fillText("ONIGIRI      ¥128", 20, 132);
    pctx.fillText("COFFEE       ¥150", 20, 163);
    pctx.fillText("BENTO        ¥498", 20, 194);
    pctx.fillStyle = "#cc7b57";
    pctx.fillRect(20, 218, 200, 2);
    pctx.fillStyle = "#f7e9c8";
    pctx.font = "900 28px " + TEX._helpers.EN_FONT;
    pctx.fillText("TOTAL  ¥776", 20, 246);
    pctx.fillStyle = "#7ad2bb";
    pctx.fillRect(260, 84, 100, 100);
    pctx.fillStyle = "#153438";
    pctx.font = "700 15px " + TEX._helpers.JP_FONT;
    pctx.fillText("2:47", 286, 140);
    const posTex = TEX._helpers.toTexture(posCanvas);
    const posPanel = new T.Mesh(new T.PlaneGeometry(0.36, 0.24), new T.MeshBasicMaterial({ map: posTex, toneMapped: true }));
    posPanel.position.set(0.74, 1.465, 0.165);
    posPanel.rotation.x = -0.1;
    counter.add(posPanel);
    NM.box(counter, { w: 0.38, h: 0.06, d: 0.3, x: 0.74, y: 1.28, z: 0.06, color: 0x2d3434, outline: true });
    // scanner and card terminal
    NM.box(counter, { w: 0.17, h: 0.06, d: 0.22, x: 0.25, y: 1.3, z: 0.12, color: 0x353a3b, outline: true });
    NM.box(counter, { w: 0.1, h: 0.16, d: 0.16, x: 1.18, y: 1.38, z: 0.1, color: 0x2f3838, outline: true });
    NM.glowSprite(counter, { x: 0.74, y: 1.4, z: 0.28, sx: 0.9, sy: 0.7, color: 0x7cd9c4, opacity: 0.11, depthTest: true });
    // pens, bell and a tiny potted plant
    NM.cyl(counter, { r: 0.06, h: 0.14, x: 0.25, y: 1.35, z: 0.18, color: 0x4d605c, outline: true });
    for (let i = 0; i < 4; i++) NM.cyl(counter, { r: 0.008, h: 0.18, x: 0.22 + i * 0.025, y: 1.5, z: 0.18, color: [0xc65d4d, 0x456b7e, 0xd3b26a, 0x4c4b48][i], outline: false });
    NM.box(counter, { w: 0.11, h: 0.11, d: 0.09, x: 1.55, y: 1.32, z: 0.12, color: 0xb7a681, outline: true });
    NM.sphere(counter, { r: 0.07, x: 1.49, y: 1.42, z: 0.12, color: 0x47745d, sx: 1.2, sy: 0.6, sz: 1 });
    NM.sphere(counter, { r: 0.07, x: 1.6, y: 1.43, z: 0.18, color: 0x5e8c68, sx: 1, sy: 0.9, sz: 1 });
    // oden pot at the left end
    const oden = new T.Group();
    oden.position.set(-2.7, 1.28, -2.14);
    counter.add(oden);
    NM.cyl(oden, { r: 0.34, h: 0.18, x: 0, y: 0.02, z: 0, color: 0x9ea7a2, outline: true, seg: 20 });
    NM.cyl(oden, { r: 0.29, h: 0.02, x: 0, y: 0.12, z: 0, color: 0xc6854e, outline: false, seg: 20 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      NM.cyl(oden, { r: 0.15, h: 0.1, x: Math.cos(a) * 0.17, y: 0.11, z: Math.sin(a) * 0.1, color: 0xc6854e, outline: false, seg: 12 });
    }
    for (let i = 0; i < 5; i++) {
      NM.cyl(oden, { r: 0.012, h: 0.26, x: -0.2 + i * 0.1, y: 0.21, z: -0.02 + (i % 2) * 0.05, color: 0xd9c7a7, outline: false });
      NM.cyl(oden, { r: 0.04, h: 0.06, x: -0.2 + i * 0.1, y: 0.36, z: -0.02 + (i % 2) * 0.05, color: i % 2 ? 0xd9c783 : 0xb56f51, outline: false });
    }
    NM.cyl(counter, { r: 0.018, h: 0.25, x: -2.15, y: 1.38, z: -2.05, color: 0x778d85, outline: false, rotZ: 0.2 });
    NM.panel(counter, { map: TEX.categorySign("oden"), w: 0.75, h: 0.2, x: -2.7, y: 1.6, z: -2.05, rotY: 0, transparent: true });

    // back counter with coffee and hot case
    const backCounter = new T.Group();
    backCounter.position.set(-0.98, 0, -3.01);
    interior.add(backCounter);
    NM.box(backCounter, { w: 3.48, h: 0.91, d: 0.5, x: 0, y: 0.7, z: 0, color: 0xcbb997, outline: true });
    NM.box(backCounter, { w: 3.58, h: 0.08, d: 0.59, x: 0, y: 1.18, z: -0.02, color: 0xf0e1c4, outline: true });
    NM.box(backCounter, { w: 3.4, h: 0.08, d: 0.03, x: 0, y: 0.78, z: 0.265, color: 0x3c655f, outline: false });

    // coffee machine
    const coffee = new T.Group();
    coffee.position.set(-1.35, 1.25, -3.03);
    backCounter.add(coffee);
    NM.box(coffee, { w: 0.48, h: 0.7, d: 0.42, x: 0, y: 0.35, z: 0, color: 0x253334, outline: true });
    NM.box(coffee, { w: 0.38, h: 0.29, d: 0.035, x: 0, y: 0.52, z: 0.225, color: 0x3c514f, outline: true });
    const coffeeScreen = new T.Mesh(new T.PlaneGeometry(0.3, 0.21), new T.MeshBasicMaterial({ color: 0xd6ebda, toneMapped: true }));
    coffeeScreen.position.set(0, 0.52, 0.245);
    coffee.add(coffeeScreen);
    NM.box(coffee, { w: 0.36, h: 0.05, d: 0.22, x: 0, y: 0.16, z: 0.18, color: 0x3d4b49, outline: false });
    NM.box(coffee, { w: 0.15, h: 0.24, d: 0.14, x: -0.08, y: 0.35, z: 0.26, color: 0xd8cfb7, outline: false });
    NM.cyl(coffee, { r: 0.045, h: 0.08, x: 0.1, y: 0.31, z: 0.31, color: 0xe6dbbe, outline: false });
    NM.glowSprite(coffee, { x: 0, y: 0.54, z: 0.32, sx: 0.8, sy: 0.52, color: 0xd4ffe4, opacity: 0.11, depthTest: true });
    NM.panel(backCounter, { map: TEX.menuBoard(), w: 1.5, h: 1.0, x: -1.3, y: 2.28, z: -3.25, rotY: 0, transparent: true });
    NM.box(backCounter, { w: 1.62, h: 1.1, d: 0.08, x: -1.3, y: 2.28, z: -3.3, color: 0x2c3d3a, outline: true });
    NM.glowSprite(backCounter, { x: -1.3, y: 2.3, z: -3.2, sx: 1.9, sy: 1.4, color: 0xffd494, opacity: 0.1, depthTest: true });

    // hot snack case
    const hot = new T.Group();
    hot.position.set(0.28, 1.25, -3.04);
    backCounter.add(hot);
    NM.box(hot, { w: 0.75, h: 0.38, d: 0.4, x: 0, y: 0.22, z: 0, color: 0x4b5c56, outline: true });
    const hotGlass = new T.Mesh(new T.PlaneGeometry(0.63, 0.28), new T.MeshBasicMaterial({ color: 0xc9e0d5, transparent: true, opacity: 0.22, depthWrite: false, side: T.DoubleSide }));
    hotGlass.position.set(0, 0.23, 0.21);
    hot.add(hotGlass);
    for (let i = 0; i < 5; i++) {
      NM.sphere(hot, { r: 0.06, x: -0.27 + i * 0.13, y: 0.17, z: 0.02, color: 0xc98748, sx: 1.15, sy: 0.72, sz: 0.9 });
    }
    NM.glowSprite(hot, { x: 0, y: 0.25, z: 0.2, sx: 1.3, sy: 0.9, color: 0xffbf75, opacity: 0.2, depthTest: true });
    NM.panel(hot, { map: TEX.categorySign("hot"), w: 0.75, h: 0.21, x: 0, y: 0.48, z: 0.02, transparent: true });

    // cups and sundries behind the coffee machine
    for (let i = 0; i < 3; i++) {
      NM.cyl(backCounter, { r: 0.055, h: 0.18, x: -2.05, y: 1.33 + i * 0.055, z: -2.96, color: 0xe6dcc7, outline: true, open: true });
    }
    NM.box(backCounter, { w: 0.35, h: 0.25, d: 0.28, x: 0.95, y: 1.32, z: -3.02, color: 0xa6b2a9, outline: true });
    NM.panel(backCounter, { map: TEX.labelTexture("HOT", { width: 512, height: 128, bg: "#b4553f", fg: "#f6e5c6", size: 68 }), w: 1.55, h: 0.3, x: 0.3, y: 2.1, z: -3.28, transparent: true });

    // floor decals
    const arrow = new T.Mesh(new T.PlaneGeometry(0.55, 2.8), new T.MeshBasicMaterial({ map: TEX.arrowDecal(), transparent: true, opacity: 0.72, depthWrite: false, toneMapped: true }));
    arrow.rotation.x = -Math.PI / 2;
    arrow.position.set(0.56, S.floor + 0.006, -0.2);
    interior.add(arrow);
    const cashierDecal = new T.Mesh(new T.CircleGeometry(0.55, 24), new T.MeshBasicMaterial({ map: TEX.floorDecal("レジ", "CASHIER"), transparent: true, opacity: 0.65, depthWrite: false, toneMapped: true }));
    cashierDecal.rotation.x = -Math.PI / 2;
    cashierDecal.position.set(-0.95, S.floor + 0.007, -1.14);
    interior.add(cashierDecal);
    // a tiny logo decal on the floor near the door
    NM.panel(interior, { map: TEX.labelTexture("ほしマート", { width: 512, height: 160, bg: "rgba(0,0,0,0)", fg: "rgba(80,71,51,0.55)", size: 70 }), w: 1.8, h: 0.55, x: 0.78, y: S.floor + 0.008, z: 0.42, rotX: -Math.PI / 2, transparent: true, depthWrite: false });

    // shopping basket stack near the door
    const basketGroup = new T.Group();
    basketGroup.position.set(-0.72, 0.26, 0.25);
    interior.add(basketGroup);
    for (let i = 0; i < 5; i++) {
      NM.box(basketGroup, { w: 0.62, h: 0.14, d: 0.45, x: 0, y: i * 0.115, z: 0, color: 0x3d7475, outline: true });
    }
    // umbrella stand just outside (a small interior one too)
    NM.cyl(interior, { r: 0.16, h: 0.58, x: 1.37, y: 0.55, z: 0.55, color: 0x64746e, outline: true, open: true });
    NM.cyl(interior, { r: 0.02, h: 1.2, x: 1.32, y: 1.0, z: 0.52, color: 0x395b66, outline: false, rotZ: 0.12 });
    NM.cyl(interior, { r: 0.02, h: 1.05, x: 1.43, y: 0.95, z: 0.58, color: 0x9b4f4a, outline: false, rotZ: -0.08 });

    // loose floor items / basket by the gondola
    NM.box(interior, { w: 0.36, h: 0.27, d: 0.5, x: -3.15, y: 0.39, z: -2.05, color: 0xc7b58e, outline: true, rotY: 0.3 });
    NM.box(interior, { w: 0.2, h: 0.3, d: 0.2, x: -7.9, y: 0.41, z: -5.0, color: 0x536f68, outline: true });

    // painted contact shadows ground the furniture without needing real ray-traced light
    const shadowTex = TEX.softBlob();
    const addInteriorShadow = (x, z, sw, sd, op) => {
      const sm = new T.Mesh(
        new T.PlaneGeometry(sw, sd),
        new T.MeshBasicMaterial({
          map: shadowTex,
          color: 0x21150c,
          transparent: true,
          opacity: op == null ? 0.38 : op,
          depthWrite: false,
          toneMapped: true,
        })
      );
      sm.rotation.x = -Math.PI / 2;
      sm.position.set(x, S.floor + 0.006, z);
      sm.renderOrder = 2;
      interior.add(sm);
    };
    addInteriorShadow(-5.45, -2.9, 3.6, 1.7, 0.43);
    addInteriorShadow(-5.45, -4.5, 3.6, 1.7, 0.43);
    addInteriorShadow(-7.12, -0.5, 2.9, 1.0, 0.32);
    addInteriorShadow(-7.55, 0.16, 2.2, 0.9, 0.28);
    addInteriorShadow(-2.05, -0.55, 1.9, 1.5, 0.38);
    addInteriorShadow(-0.96, -2.18, 4.0, 1.1, 0.36);
    addInteriorShadow(-0.98, -3.01, 3.8, 0.9, 0.3);
    addInteriorShadow(-5.8, -6.7, 4.0, 1.1, 0.3);
    addInteriorShadow(-2.35, -6.7, 2.8, 1.0, 0.26);
    addInteriorShadow(0.7, -7.0, 1.4, 0.7, 0.22);

    // dark hairlines where the painted set meets floor and ceiling
    NM.box(interior, { w: W - 0.62, h: 0.055, d: 0.03, x: CX - 0.06, y: 2.96, z: S.back + 0.4, color: 0x3b514c, outline: false, mat: darkTrimMat });
    NM.box(interior, { w: 0.03, h: 0.055, d: D - 0.72, x: S.left + 0.34, y: 2.96, z: CZ, color: 0x3b514c, outline: false, mat: darkTrimMat });
    NM.box(interior, { w: W - 0.62, h: 0.055, d: 0.03, x: CX - 0.06, y: 0.31, z: S.back + 0.4, color: 0x3b514c, outline: false, mat: darkTrimMat });

    // instanced products
    NM.makeInstanceBoxes(interior, allProducts, productMat);
    NM.makeInstanceBoxes(interior, allCans, productMat);
    NM.makeInstanceBoxes(interior, allBento, productMat);
    if (allProductLabels.length) NM.makeInstanceBoxes(interior, allProductLabels, labelMat);

    // A few friendly bento trays on top of the case
    const bentoTop = new T.Group();
    bentoTop.position.set(bentoX + 0.2, 2.13, -6.91);
    interior.add(bentoTop);
    for (let i = 0; i < 3; i++) {
      NM.box(bentoTop, { w: 0.32, h: 0.08, d: 0.22, x: i * 0.38, y: 0, z: 0, color: 0x2d3332, outline: true });
      NM.box(bentoTop, { w: 0.28, h: 0.025, d: 0.18, x: i * 0.38, y: 0.052, z: 0, color: i % 2 ? 0xd29a5d : 0xc16a54, outline: false });
    }

    // Small warm pendant lamps close to the glass — a row of glowing punctuation marks.
    [-6.8, -4.45, -2.1].forEach((x, i) => {
      NM.cyl(interior, { r: 0.008, h: 0.42, x: x, y: 2.92, z: -0.2, color: 0x5f6d65, outline: false });
      NM.cyl(interior, { r: 0.09, rb: 0.14, h: 0.14, x: x, y: 2.65, z: -0.2, color: 0xffd89c, outline: true, seg: 10, mat: new T.MeshBasicMaterial({ color: 0xffd99f, toneMapped: true }) });
      NM.glowSprite(interior, { x, y: 2.62, z: -0.1, sx: 1.0, sy: 0.9, color: 0xffc27a, opacity: 0.12, depthTest: true });
    });

    // hanging category signs, visible through the upper glass
    NM.box(interior, { w: 1.28, h: 0.34, d: 0.055, x: -2.05, y: 2.32, z: -0.86, color: 0x3c5e59, outline: true });
    NM.panel(interior, { map: TEX.categorySign("hot"), w: 1.18, h: 0.28, x: -2.05, y: 2.32, z: -0.827, transparent: true, toneMapped: true });
    NM.cyl(interior, { r: 0.008, h: 0.57, x: -2.53, y: 2.74, z: -0.86, color: 0x66766e, outline: false });
    NM.cyl(interior, { r: 0.008, h: 0.57, x: -1.57, y: 2.74, z: -0.86, color: 0x66766e, outline: false });
    NM.box(interior, { w: 0.85, h: 0.29, d: 0.05, x: 0.28, y: 2.18, z: -0.7, color: 0xb95542, outline: true });
    NM.panel(interior, { map: TEX.labelTexture("COFFEE ¥150", { width: 768, height: 256, bg: "#b95542", fg: "#f5e5c7", size: 90, font: TEX._helpers.EN_FONT }), w: 0.77, h: 0.23, x: 0.28, y: 2.18, z: -0.669, transparent: true, toneMapped: true });
    NM.cyl(interior, { r: 0.007, h: 0.45, x: -0.02, y: 2.54, z: -0.7, color: 0x66766e, outline: false });
    NM.cyl(interior, { r: 0.007, h: 0.45, x: 0.58, y: 2.54, z: -0.7, color: 0x66766e, outline: false });

    // Hoshi Mart logo stencil on the back wall above the staff area
    NM.panel(interior, {
      map: TEX.labelTexture("HOSHI MART", { width: 1024, height: 256, bg: "rgba(0,0,0,0)", fg: "rgba(64,84,77,0.45)", size: 116, font: TEX._helpers.EN_FONT }),
      w: 2.1,
      h: 0.53,
      x: 0.2,
      y: 2.9,
      z: -7.09,
      transparent: true,
      depthWrite: false,
    });

    // interior pendant/ceiling signage
    NM.box(interior, { w: 1.15, h: 0.36, d: 0.06, x: -3.8, y: 2.51, z: -4.35, color: 0x3c5f5b, outline: true });
    NM.panel(interior, { map: TEX.labelTexture("おにぎり・お弁当", { width: 1024, height: 256, bg: "#f0e2c6", fg: "#714431", size: 100 }), w: 1.05, h: 0.3, x: -3.8, y: 2.51, z: -4.31, transparent: true });
    NM.cyl(interior, { r: 0.012, h: 0.55, x: -4.24, y: 2.9, z: -4.35, color: 0x65746d, outline: false });
    NM.cyl(interior, { r: 0.012, h: 0.55, x: -3.36, y: 2.9, z: -4.35, color: 0x65746d, outline: false });
    NM.box(interior, { w: 1.02, h: 0.33, d: 0.06, x: 1.0, y: 2.55, z: -4.45, color: 0xbb5544, outline: true });
    NM.panel(interior, { map: TEX.labelTexture("HOT & COFFEE", { width: 1024, height: 256, bg: "#b55543", fg: "#f7e8c9", size: 104, font: TEX._helpers.EN_FONT }), w: 0.94, h: 0.27, x: 1.0, y: 2.55, z: -4.41, transparent: true });

    /* ================================================================== */
    /* Interior lights, steam & update                                   */
    /* ================================================================== */

    const interiorLightA = new T.PointLight(0xffae58, 118, 12, 2);
    interiorLightA.position.set(-4.2, 2.86, -2.9);
    group.add(interiorLightA);
    const interiorLightB = new T.PointLight(0xffc177, 86, 11, 2);
    interiorLightB.position.set(-6.0, 2.8, -5.7);
    group.add(interiorLightB);
    const interiorLightC = new T.PointLight(0xffc98c, 82, 10, 2);
    interiorLightC.position.set(-0.3, 2.75, -1.2);
    group.add(interiorLightC);
    const interiorLightD = new T.PointLight(0xffb260, 70, 9, 2);
    interiorLightD.position.set(-6.62, 2.72, -0.9);
    group.add(interiorLightD);
    const interiorLightE = new T.PointLight(0xffc98c, 64, 8.5, 2);
    interiorLightE.position.set(-2.4, 2.72, -5.4);
    group.add(interiorLightE);
    const fridgeLight = new T.PointLight(0xc6f0e5, 28, 5.2, 2);
    fridgeLight.position.set(-5.7, 1.6, -6.1);
    group.add(fridgeLight);
    const spillLight = new T.PointLight(0xffb05f, 120, 11, 2);
    spillLight.position.set(0.7, 2.0, 2.6);
    group.add(spillLight);
    const sideSpill = new T.PointLight(0xffb972, 58, 8.5, 2);
    sideSpill.position.set(3.15, 1.75, -2.4);
    group.add(sideSpill);
    const frontWash = new T.PointLight(0xffab55, 85, 11, 2);
    frontWash.position.set(-3.2, 1.95, 3.55);
    group.add(frontWash);
    const entranceGlow = new T.PointLight(0xffb566, 70, 6.5, 2);
    entranceGlow.position.set(0.8, 1.55, 1.9);
    group.add(entranceGlow);

    // Steam wisps (oden and coffee)
    const steamSprites = [];
    const steamSeeds = [];
    const steamMat = new T.SpriteMaterial({
      map: TEX.glow(),
      color: 0xffe6c2,
      transparent: true,
      opacity: 0.1,
      blending: T.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    });
    const steamPositions = [
      [-3.72, 1.56, -1.94],
      [-3.6, 1.55, -2.05],
      [-2.4, 1.55, -1.96],
      [0.99, 1.74, -2.63],
      [0.92, 1.72, -2.55],
    ];
    for (let i = 0; i < 10; i++) {
      const s = new T.Sprite(steamMat.clone());
      const base = steamPositions[i % steamPositions.length];
      s.position.set(base[0], base[1], base[2]);
      s.scale.setScalar(0.28);
      s.renderOrder = 6;
      group.add(s);
      steamSprites.push(s);
      steamSeeds.push({ base, phase: i * 0.37, speed: 0.18 + (i % 3) * 0.035, sway: (i % 5) - 2 });
    }

    /* ------------------------- store update ------------------------- */

    let nextDoorOpen = 8.5;
    let doorPhase = 0;
    let doorTarget = 0;
    let doorAmount = 0;
    let doorHold = 0;
    const doorState = { open: false };

    let nextFlicker = 4.2;
    let flickerUntil = -1;
    let bladeLit = 1;

    const update = (time, dt) => {
      // rain on glass: slow, uneven sliding
      glassRainMats.forEach((m, i) => {
        m.map.offset.y += dt * m.speed;
        m.map.offset.x += Math.sin(time * 0.15 + m.sway) * dt * 0.004;
        if (m.map.offset.y > 2) m.map.offset.y -= 2;
      });

      // occasional automatic door cycle
      if (doorPhase === 0 && time > nextDoorOpen) {
        doorPhase = 1;
        doorHold = 0;
      }
      if (doorPhase === 1) {
        doorAmount = Math.min(1, doorAmount + dt / 1.25);
        if (doorAmount >= 1) {
          doorPhase = 2;
          doorHold = 1.8 + Math.random() * 1.6;
        }
      } else if (doorPhase === 2) {
        doorHold -= dt;
        if (doorHold <= 0) doorPhase = 3;
      } else if (doorPhase === 3) {
        doorAmount = Math.max(0, doorAmount - dt / 1.45);
        if (doorAmount <= 0) {
          doorPhase = 0;
          nextDoorOpen = time + 9.5 + Math.random() * 9;
        }
      }
      const eased = doorAmount * doorAmount * (3 - 2 * doorAmount);
      leftDoor.position.x = -0.325 - eased * 0.615;
      rightDoor.position.x = 0.325 + eased * 0.615;
      doorState.open = eased > 0.5;
      spillLight.intensity = 120 + eased * 36;
      entranceGlow.intensity = 70 + eased * 26;

      // a small sign that occasionally holds its breath
      if (time > nextFlicker) {
        flickerUntil = time + 0.12 + Math.random() * 0.35;
        nextFlicker = time + 5.5 + Math.random() * 8.5;
      }
      let flick = 1;
      if (time < flickerUntil) {
        flick = Math.sin(time * 95) > 0.15 ? 1 : 0.22 + Math.random() * 0.26;
      }
      bladeLit = NM.damp(bladeLit, flick, 28, dt);
      bladeMat.color.setRGB(0.72 + bladeLit * 0.28, 0.68 + bladeLit * 0.3, 0.57 + bladeLit * 0.36);
      bladeBackMat.color.copy(bladeMat.color);
      bladeGlow.material.opacity = 0.055 + bladeLit * 0.12;
      bladeGlow.scale.set(2.25 + bladeLit * 0.25, 3.6 + bladeLit * 0.25, 1);

      // tiny live breathing in the light
      interiorLightA.intensity = 118 + Math.sin(time * 0.85) * 1.4 + Math.sin(time * 2.3) * 0.4;
      signLight.intensity = 64 + Math.sin(time * 1.2) * 0.9;

      // laundry sways slowly in the rain wind
      roofLaundry.forEach((l, i) => {
        l.mesh.rotation.z = Math.sin(time * 0.5 + l.phase) * 0.035;
        l.mesh.rotation.x = 0.02 + Math.sin(time * 0.8 + i) * 0.018;
        l.stripe.rotation.z = l.mesh.rotation.z;
        l.stripe.position.z = 0.006 + Math.sin(time * 0.8 + i) * 0.006;
      });

      // steam
      for (let i = 0; i < steamSprites.length; i++) {
        const p = steamSeeds[i];
        const cycle = ((time * p.speed + p.phase) % 1);
        const s = steamSprites[i];
        s.position.x = p.base[0] + Math.sin(time * 0.8 + i) * 0.07 * cycle + p.sway * cycle * 0.03;
        s.position.y = p.base[1] + cycle * 0.9;
        s.position.z = p.base[2] + Math.cos(time * 0.6 + i) * 0.035;
        const size = 0.16 + cycle * 0.55;
        s.scale.set(size, size * 1.3, 1);
        s.material.opacity = Math.sin(Math.PI * cycle) * 0.085;
      }
    };

    // The sun shadow can never reach the sheltered interior, so skip those
    // casters in the shadow pass. This keeps the draw-call count comfortable.
    interior.traverse((o) => {
      if (o.isMesh) o.castShadow = false;
    });

    return {
      group,
      update,
      state: doorState,
      eaves: {
        front: [
          [-7.4, EAVE_Y - 0.1, 1.8],
          [-5.45, EAVE_Y - 0.1, 1.82],
          [-2.9, EAVE_Y - 0.1, 1.8],
          [-0.25, EAVE_Y - 0.1, 1.82],
          [1.3, EAVE_Y - 0.1, 1.8],
        ],
        side: [
          [EAVE_X + 0.02, EAVE_Y - 0.1, -5.9],
          [EAVE_X + 0.02, EAVE_Y - 0.1, -3.6],
          [EAVE_X + 0.02, EAVE_Y - 0.1, -1.1],
          [EAVE_X + 0.02, EAVE_Y - 0.1, 0.55],
        ],
      },
      materials: { bladeMat, bladeBackMat, bladeGlow, mainSignMat, sideSignMat },
      lights: { interiorLightA, interiorLightB, interiorLightC, interiorLightD, interiorLightE, fridgeLight, spillLight, sideSpill },
    };
  };
})();
