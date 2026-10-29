/* world.js — the square diorama: a rainy little corner, assembled piece by piece */
(function () {
  "use strict";

  const T = THREE;
  const C = NM.C;
  const P = NMProps;

  const ROAD = { z0: 3.3, z1: 8.6, x0: 3.9, x1: 9.5 };
  const BASE_HALF = 11.5;

  function makeCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  function wetGlintTexture() {
    return (function () {
      const c = makeCanvas(1024, 1024);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 1024, 1024);
      const rand = NM.seedRandom(4481);
      for (let i = 0; i < 1250; i++) {
        const x = rand() * 1024;
        const y = rand() * 1024;
        const w = 4 + rand() * 42;
        const h = 0.5 + rand() * 2.4;
        const a = 0.025 + rand() * 0.1;
        const g = ctx.createLinearGradient(x, y, x + w, y);
        g.addColorStop(0, "rgba(210,236,244,0)");
        g.addColorStop(0.5, "rgba(223,245,250," + a + ")");
        g.addColorStop(1, "rgba(210,236,244,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, w, h);
      }
      // a few long neon-ish smears
      for (let i = 0; i < 24; i++) {
        const x = rand() * 1024;
        const y = rand() * 1024;
        const g = ctx.createLinearGradient(x, y, x, y + 30);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, "rgba(255,255,255," + (0.02 + rand() * 0.05) + ")");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x, y, 1 + rand() * 3, 20 + rand() * 40);
      }
      const tex = TEX._helpers.toTexture(c, { repeat: [3.5, 3.5] });
      return tex;
    })();
  }

  function makePuddleGeometry(rx, rz, seed, segments) {
    const n = segments || 34;
    const rand = NM.seedRandom(seed || 1);
    const pos = [0, 0, 0];
    const uv = [0.5, 0.5];
    const idx = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wob = 0.86 + rand() * 0.18 + Math.sin(a * 3.0 + seed * 0.7) * 0.055 + Math.cos(a * 5.0 - seed * 1.1) * 0.03;
      const x = Math.cos(a) * rx * wob;
      const z = Math.sin(a) * rz * wob;
      pos.push(x, 0, z);
      uv.push(0.5 + Math.cos(a) * 0.5 * wob, 0.5 + Math.sin(a) * 0.5 * wob);
    }
    for (let i = 1; i <= n; i++) {
      const a = i;
      const b = i === n ? 1 : i + 1;
      idx.push(0, a, b);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  function puddleMaterial(warm, cool, opacity) {
    return new T.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uWarm: { value: new T.Color(warm) },
        uCool: { value: new T.Color(cool) },
        uOpacity: { value: opacity == null ? 0.55 : opacity },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = uv;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "precision highp float;",
        "uniform float uTime;",
        "uniform vec3 uWarm;",
        "uniform vec3 uCool;",
        "uniform float uOpacity;",
        "varying vec2 vUv;",
        "float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
        "float ripple(vec2 p, vec2 c, float phase, float speed) {",
        "  float d = length(p - c);",
        "  float t = fract(uTime * speed + phase);",
        "  float r = 0.05 + t * 0.64;",
        "  float ring = smoothstep(0.032, 0.0, abs(d - r));",
        "  return ring * (1.0 - t) * (1.0 - t);",
        "}",
        "void main() {",
        "  vec2 q = vUv * 2.0 - 1.0;",
        "  float radial = length(q * vec2(1.0, 1.04));",
        "  float edge = smoothstep(1.0, 0.83, radial);",
        "  float horizon = smoothstep(-0.95, 0.9, q.y);",
        "  vec3 col = mix(vec3(0.022, 0.040, 0.052), vec3(0.066, 0.098, 0.108), horizon);",
        "  col = mix(col, uCool * 0.21, 0.26 + 0.28 * horizon);",
        "  float bands = sin(q.x * 17.0 + sin(q.y * 6.0 + uTime * 0.16) * 1.8) * 0.5 + 0.5;",
        "  bands *= smoothstep(-0.8, 0.9, q.y) * smoothstep(0.96, 0.3, radial);",
        "  col += uWarm * bands * 0.12;",
        "  float warmPool = smoothstep(0.3, 1.0, q.y) * smoothstep(1.05, 0.4, radial);",
        "  col += uWarm * warmPool * 0.075;",
        "  float r1 = ripple(q, vec2(-0.33, 0.12), 0.12, 0.68);",
        "  float r2 = ripple(q, vec2(0.31, -0.27), 0.51, 0.54);",
        "  float r3 = ripple(q, vec2(0.08, 0.46), 0.81, 0.79);",
        "  float r4 = ripple(q, vec2(-0.48, -0.51), 0.34, 0.47);",
        "  float rings = (r1 + r2 * 0.7 + r3 * 0.8 + r4 * 0.65);",
        "  col += vec3(0.24, 0.44, 0.48) * rings * 0.8;",
        "  col += uWarm * rings * 0.2;",
        "  float speck = pow(hash21(floor(vUv * 84.0)), 16.0);",
        "  col += vec3(0.3, 0.48, 0.55) * speck * 0.16;",
        "  float rim = smoothstep(0.78, 1.0, radial) * smoothstep(1.04, 0.93, radial);",
        "  col += vec3(0.16, 0.24, 0.25) * rim * 0.5;",
        "  gl_FragColor = vec4(col, edge * uOpacity);",
        "}",
      ].join("\n"),
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      toneMapped: false,
      fog: false,
    });
  }

  window.buildWorld = function (scene) {
    const root = new T.Group();
    root.name = "rainy-night-diorama";
    scene.add(root);

    const updaters = [];
    const puddleMats = [];
    const reflectionFades = [];
    const glowFades = [];
    const signalReflections = [];
    const dripWindows = [];

    function addUpdater(fn) {
      updaters.push(fn);
    }

    /* ================================================================== */
    /* Base                                                              */
    /* ================================================================== */

    const baseGroup = new T.Group();
    baseGroup.name = "display-base";
    root.add(baseGroup);

    const baseStone = NM.toon(0x18272e);
    const baseStoneDark = NM.toon(0x0d171d);
    const brass = NM.toon(0x8f7243, { emissive: 0x211609, emissiveIntensity: 0.3 });

    NM.box(baseGroup, { w: 23.8, h: 0.34, d: 23.8, x: 0, y: -1.29, z: 0, color: 0x0c161c, outline: true });
    NM.box(baseGroup, { w: 23.3, h: 0.76, d: 23.3, x: 0, y: -0.74, z: 0, color: 0x1a2931, outline: true, mat: baseStone });
    NM.box(baseGroup, { w: 23.34, h: 0.038, d: 23.34, x: 0, y: -0.37, z: 0, color: 0x8f7243, outline: false, mat: brass });
    NM.box(baseGroup, { w: 23.08, h: 0.18, d: 23.08, x: 0, y: -0.205, z: 0, color: 0x26363d, outline: true });
    NM.box(baseGroup, { w: 22.98, h: 0.12, d: 22.98, x: 0, y: -0.06, z: 0, color: 0x131e23, outline: false, mat: baseStoneDark });

    // outer rim, like the lip of a display tray
    const rimMat = NM.toon(0x31464c);
    [
      [22.98, 0.08, 0.18, 0, 0.005, -11.4],
      [22.98, 0.08, 0.18, 0, 0.005, 11.4],
      [0.18, 0.08, 22.78, -11.4, 0.005, 0],
      [0.18, 0.08, 22.78, 11.4, 0.005, 0],
    ].forEach((a) => {
      NM.box(baseGroup, { w: a[0], h: a[1], d: a[2], x: a[3], y: a[4], z: a[5], color: 0x31464c, mat: rimMat, outline: true, edgeThreshold: 22 });
    });

    // front plaque
    NM.box(baseGroup, { w: 3.55, h: 0.92, d: 0.045, x: 0, y: -0.7, z: 11.655, color: 0x65563b, outline: true });
    NM.panel(baseGroup, { map: TEX.plaque(), w: 3.36, h: 0.8, x: 0, y: -0.7, z: 11.683, transparent: false, toneMapped: true });
    [-1.55, 1.55].forEach((x) => {
      NM.cyl(baseGroup, { r: 0.04, h: 0.025, x: x, y: -0.7, z: 11.688, color: 0xc3a76b, rotX: Math.PI / 2, outline: false, seg: 12 });
    });

    // a soft pool of shadow grounds the model without adding scenery outside the base
    const contact = new T.Mesh(
      new T.PlaneGeometry(35, 29),
      new T.MeshBasicMaterial({
        map: TEX.softBlob(),
        color: 0x02070b,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        toneMapped: false,
      })
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = -1.49;
    contact.renderOrder = -2;
    scene.add(contact);

    /* ================================================================== */
    /* Street surfaces                                                   */
    /* ================================================================== */

    const streetGroup = new T.Group();
    root.add(streetGroup);

    // A gently glossy asphalt catches the shop lights and streetlamp, giving the
    // rain a real surface to sit on while the buildings stay cel-shaded.
    const asphaltMat = new T.MeshStandardMaterial({
      color: 0xa7b5bb,
      map: TEX.asphalt(),
      roughness: 0.24,
      metalness: 0.0,
      envMapIntensity: 0.45,
    });
    const asphalt = new T.Mesh(new T.PlaneGeometry(23, 23), asphaltMat);
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.y = 0.003;
    asphalt.receiveShadow = true;
    streetGroup.add(asphalt);

    // wet road shimmer
    const glintTex = wetGlintTexture();
    const glintMat = new T.MeshBasicMaterial({
      map: glintTex,
      transparent: true,
      opacity: 0.18,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const glints = new T.Mesh(new T.PlaneGeometry(23, 23), glintMat);
    glints.rotation.x = -Math.PI / 2;
    glints.position.y = 0.025;
    glints.renderOrder = 1;
    streetGroup.add(glints);

    const paverMat = NM.toon(0xc6d2cf, { map: TEX.pavers() });
    const sidewalkBodyMat = NM.toon(0x5f6e6f);
    const sidewalkRegions = [
      { x: -3.8, z: -4.1, w: 15.4, d: 14.8 },
      { x: -3.8, z: 10.05, w: 15.4, d: 2.9 },
      { x: 10.5, z: -4.1, w: 2.0, d: 14.8 },
      { x: 10.5, z: 10.05, w: 2.0, d: 2.9 },
    ];
    sidewalkRegions.forEach((r, i) => {
      NM.box(streetGroup, {
        w: r.w,
        h: 0.14,
        d: r.d,
        x: r.x,
        y: 0.07,
        z: r.z,
        color: 0x5f6e6f,
        outline: true,
        mat: sidewalkBodyMat,
        edgeThreshold: 22,
        receive: true,
      });
      const top = new T.Mesh(new T.PlaneGeometry(r.w - 0.012, r.d - 0.012), paverMat);
      top.rotation.x = -Math.PI / 2;
      top.position.set(r.x, 0.1415, r.z);
      top.receiveShadow = true;
      streetGroup.add(top);
    });

    // small stone border around the outside where the pavement meets the display tray
    const edgeTrim = NM.toon(0x38494d);
    NM.box(streetGroup, { w: 0.18, h: 0.05, d: 22.9, x: -11.36, y: 0.025, z: 0, color: 0x38494d, mat: edgeTrim, outline: false });
    NM.box(streetGroup, { w: 0.18, h: 0.05, d: 22.9, x: 11.36, y: 0.025, z: 0, color: 0x38494d, mat: edgeTrim, outline: false });
    NM.box(streetGroup, { w: 22.9, h: 0.05, d: 0.18, x: 0, y: 0.025, z: -11.36, color: 0x38494d, mat: edgeTrim, outline: false });
    NM.box(streetGroup, { w: 22.9, h: 0.05, d: 0.18, x: 0, y: 0.025, z: 11.36, color: 0x38494d, mat: edgeTrim, outline: false });

    // curbs, with dropped sections at the crossings
    const curbMat = NM.toon(0xa5b0aa);
    const addCurbX = (x1, x2, z) => {
      const w = x2 - x1;
      if (w <= 0.02) return;
      NM.box(streetGroup, { w: w, h: 0.2, d: 0.21, x: (x1 + x2) / 2, y: 0.085, z: z, color: 0xa5b0aa, mat: curbMat, outline: true, edgeThreshold: 24 });
      NM.box(streetGroup, { w: w, h: 0.025, d: 0.23, x: (x1 + x2) / 2, y: 0.187, z: z - 0.01, color: 0xc7d0c9, outline: false });
    };
    const addCurbZ = (z1, z2, x) => {
      const d = z2 - z1;
      if (d <= 0.02) return;
      NM.box(streetGroup, { w: 0.21, h: 0.2, d: d, x: x, y: 0.085, z: (z1 + z2) / 2, color: 0xa5b0aa, mat: curbMat, outline: true, edgeThreshold: 24 });
      NM.box(streetGroup, { w: 0.23, h: 0.025, d: d, x: x - 0.01, y: 0.187, z: (z1 + z2) / 2, color: 0xc7d0c9, outline: false });
    };
    addCurbX(-11.4, 1.65, ROAD.z0 - 0.02);
    addCurbX(3.62, 3.9, ROAD.z0 - 0.02);
    addCurbX(-11.4, 1.65, ROAD.z1 + 0.02);
    addCurbX(3.62, 3.9, ROAD.z1 + 0.02);
    addCurbZ(-11.4, 3.22, ROAD.x0 - 0.02);
    addCurbZ(8.56, 9.15, ROAD.x0 - 0.02);
    addCurbZ(10.65, 11.4, ROAD.x0 - 0.02);
    addCurbZ(-11.4, 3.22, ROAD.x1 + 0.02);
    addCurbZ(8.56, 9.15, ROAD.x1 + 0.02);
    addCurbZ(10.65, 11.4, ROAD.x1 + 0.02);

    // curb ramps at crosswalks
    const rampMat = NM.toon(0x899792);
    NM.box(streetGroup, { w: 2.0, h: 0.05, d: 0.42, x: 2.66, y: 0.055, z: 3.19, color: 0x899792, mat: rampMat, outline: false });
    NM.box(streetGroup, { w: 2.0, h: 0.05, d: 0.42, x: 2.66, y: 0.055, z: 8.72, color: 0x899792, mat: rampMat, outline: false });
    NM.box(streetGroup, { w: 0.42, h: 0.05, d: 1.7, x: 3.8, y: 0.055, z: 9.85, color: 0x899792, mat: rampMat, outline: false });
    NM.box(streetGroup, { w: 0.42, h: 0.05, d: 1.7, x: 9.6, y: 0.055, z: 9.85, color: 0x899792, mat: rampMat, outline: false });

    // road paint
    const paintMat = new T.MeshBasicMaterial({ color: 0xe2e9de, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: true });
    const paintYellowMat = new T.MeshBasicMaterial({ color: 0xd2bd72, transparent: true, opacity: 0.45, depthWrite: false, toneMapped: true });
    const addPaint = (w, d, x, z, rotY, mat) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, d), mat || paintMat);
      m.rotation.x = -Math.PI / 2;
      if (rotY) m.rotation.z = rotY;
      m.position.set(x, 0.034, z);
      m.renderOrder = 2;
      streetGroup.add(m);
      return m;
    };

    // crosswalk across the front road (ladder stripes)
    for (let i = 0; i < 8; i++) {
      addPaint(1.82, 0.28, 2.66, 3.58 + i * 0.665, 0, paintMat);
    }
    // crosswalk across the side road
    for (let i = 0; i < 8; i++) {
      addPaint(0.3, 1.55, 4.08 + i * 0.73, 9.87, 0, paintMat);
    }
    // stop lines
    addPaint(0.18, 4.5, 1.74, 5.95, 0, paintMat);
    addPaint(4.9, 0.18, 6.7, 3.42, 0, paintMat);
    // faded yellow no-parking line along the shop-side curb
    addPaint(10.1, 0.09, -4.45, 3.43, 0, paintYellowMat);
    addPaint(10.3, 0.09, -6.05, 8.5, 0, paintYellowMat);
    // centre dashes on the main road
    for (let i = 0; i < 6; i++) {
      addPaint(0.11, 1.25, -10.5 + i * 1.85, 5.95, 0, paintMat);
    }
    for (let i = 0; i < 4; i++) {
      addPaint(0.11, 1.05, 10.3 + i * 0.1, 5.95, 0, paintMat);
    }
    // centre dashes on the side road
    for (let i = 0; i < 3; i++) {
      addPaint(0.11, 1.2, 6.7, -9.9 + i * 2.2, 0, paintMat);
    }
    addPaint(0.11, 1.0, 6.7, 1.7, 0, paintMat);
    // little arrows
    const arrowShape = new T.Shape();
    arrowShape.moveTo(-0.13, -0.5);
    arrowShape.lineTo(0.13, -0.5);
    arrowShape.lineTo(0.13, 0.08);
    arrowShape.lineTo(0.34, 0.08);
    arrowShape.lineTo(0, 0.52);
    arrowShape.lineTo(-0.34, 0.08);
    arrowShape.lineTo(-0.13, 0.08);
    arrowShape.closePath();
    const arrowGeo = new T.ShapeGeometry(arrowShape);
    const arrow = new T.Mesh(arrowGeo, paintMat);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = Math.PI;
    arrow.position.set(6.65, 0.035, 2.1);
    arrow.renderOrder = 2;
    streetGroup.add(arrow);

    // parking bay in front of the store
    addPaint(3.1, 0.1, -5.65, 3.52, 0, paintMat);
    addPaint(3.1, 0.1, -5.65, 6.0, 0, paintMat);
    addPaint(0.1, 2.48, -7.2, 4.76, 0, paintMat);
    addPaint(0.1, 2.48, -4.1, 4.76, 0, paintMat);
    // parking P
    const pTex = TEX._helpers.toTexture((() => {
      const c = makeCanvas(256, 256);
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 256, 256);
      ctx.fillStyle = "rgba(224,232,224,0.56)";
      ctx.font = "900 180px " + TEX._helpers.EN_FONT;
      ctx.textAlign = "center";
      ctx.fillText("P", 128, 188);
      return c;
    })());
    const pMark = new T.Mesh(new T.PlaneGeometry(0.9, 0.9), new T.MeshBasicMaterial({ map: pTex, transparent: true, depthWrite: false, toneMapped: true }));
    pMark.rotation.x = -Math.PI / 2;
    pMark.position.set(-4.8, 0.036, 5.0);
    pMark.renderOrder = 2;
    streetGroup.add(pMark);
    // a little wheel stop & drain by the bay
    NM.box(streetGroup, { w: 0.85, h: 0.1, d: 0.16, x: -5.7, y: 0.06, z: 5.58, color: 0x7d8580, outline: true, rotY: 0.02 });
    NM.box(streetGroup, { w: 0.8, h: 0.08, d: 0.14, x: -5.7, y: 0.06, z: 5.45, color: 0x626b66, outline: false });

    // tactile strips at the crossings
    const tactileMat = NM.toon(0xd4bf75, { map: TEX.tactile() });
    const tactilePositions = [
      [2.66, 3.1, 1.95, 0.34],
      [2.66, 8.81, 1.95, 0.34],
      [3.95, 9.86, 0.34, 1.62],
      [0.82, 2.92, 1.92, 0.3],
    ];
    tactilePositions.forEach((tr) => {
      const m = new T.Mesh(new T.PlaneGeometry(tr[2], tr[3]), tactileMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(tr[0], 0.149, tr[1]);
      m.receiveShadow = true;
      streetGroup.add(m);
    });
    // tactile line continuing down the sidewalk
    const line = new T.Mesh(new T.PlaneGeometry(0.28, 1.3), tactileMat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(2.66, 0.149, 2.48);
    streetGroup.add(line);

    // drains
    P.drain(streetGroup, { x: 0.55, z: 3.22, y: 0.021, w: 0.92, d: 0.31 });
    P.drain(streetGroup, { x: -7.15, z: 3.22, y: 0.021, w: 0.8, d: 0.29 });
    P.drain(streetGroup, { x: 8.1, z: 8.72, y: 0.021, w: 1.0, d: 0.3, rotY: 0 });
    P.drain(streetGroup, { x: 3.78, z: -3.8, y: 0.151, w: 0.32, d: 0.86, rotY: 0 });
    P.drain(streetGroup, { x: -9.9, z: 2.2, y: 0.151, w: 0.32, d: 0.8 });

    // manholes
    const manholeMat = NM.toon(0x3f4b4b);
    const makeManhole = (x, z, r) => {
      const m = new T.Mesh(new T.CircleGeometry(r, 28), manholeMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.031, z);
      m.receiveShadow = true;
      streetGroup.add(m);
      const ring = new T.Mesh(new T.TorusGeometry(r, 0.025, 4, 30), NM.toon(0x596664));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.034, z);
      streetGroup.add(ring);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI;
        const bar = NM.box(streetGroup, { w: r * 1.55, h: 0.005, d: 0.018, x: x, y: 0.035, z: z, color: 0x283333, outline: false, rotY: a });
        bar.castShadow = false;
      }
    };
    makeManhole(6.2, 6.7, 0.49);
    makeManhole(-1.5, 7.65, 0.34);

    // road stop marking near the far crossing
    const stopTex = TEX.roadStop();
    const stop = new T.Mesh(new T.PlaneGeometry(1.0, 2.0), new T.MeshBasicMaterial({ map: stopTex, transparent: true, opacity: 0.62, depthWrite: false, toneMapped: true }));
    stop.rotation.x = -Math.PI / 2;
    stop.rotation.z = Math.PI;
    stop.position.set(6.72, 0.036, 10.35);
    streetGroup.add(stop);

    /* ================================================================== */
    /* Scene lights                                                      */
    /* ================================================================== */

    const hemi = new T.HemisphereLight(0x4b7094, 0x0b1114, 0.38);
    scene.add(hemi);
    const ambient = new T.AmbientLight(0x27384a, 0.22);
    scene.add(ambient);

    const moon = new T.DirectionalLight(0xaac9e2, 1.72);
    moon.position.set(-15, 24, 13);
    moon.target.position.set(-1, 0, -2);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1536, 1536);
    moon.shadow.camera.near = 1;
    moon.shadow.camera.far = 55;
    moon.shadow.camera.left = -17;
    moon.shadow.camera.right = 17;
    moon.shadow.camera.top = 17;
    moon.shadow.camera.bottom = -17;
    moon.shadow.bias = -0.0005;
    moon.shadow.normalBias = 0.035;
    scene.add(moon);
    scene.add(moon.target);

    const fill = new T.DirectionalLight(0x456b86, 0.36);
    fill.position.set(13, 8, -10);
    fill.target.position.set(0, 1, 0);
    scene.add(fill);
    scene.add(fill.target);
    const rim = new T.DirectionalLight(0x3f7896, 0.34);
    rim.position.set(9, 11, 14);
    rim.target.position.set(-2, 2, -3);
    scene.add(rim);
    scene.add(rim.target);

    const shop = null; // the store supplies its own warm lights

    /* ================================================================== */
    /* The store                                                         */
    /* ================================================================== */

    const store = buildStore(root, {});
    addUpdater(store.update);

    // eave rain points are used by atmosphere.js
    const eavePoints = [], sideEavePoints = [];
    store.eaves.front.forEach((p) => eavePoints.push(new T.Vector3(p[0], p[1], p[2])));
    store.eaves.side.forEach((p) => sideEavePoints.push(new T.Vector3(p[0], p[1], p[2])));

    /* ================================================================== */
    /* Puddles & wet reflections                                          */
    /* ================================================================== */

    const warmPuddle = puddleMaterial(0xffc47e, 0x54a5a0, 0.68);
    const coolPuddle = puddleMaterial(0x9ec5cf, 0x4a818c, 0.58);
    const alleyPuddle = puddleMaterial(0xffb36f, 0x4e7772, 0.68);
    puddleMats.push(warmPuddle, coolPuddle, alleyPuddle);

    const puddleGroup = new T.Group();
    root.add(puddleGroup);
    const addPuddle = (x, z, rx, rz, y, mat, seed) => {
      const mesh = new T.Mesh(makePuddleGeometry(rx, rz, seed), mat);
      mesh.position.set(x, y, z);
      mesh.renderOrder = 3;
      puddleGroup.add(mesh);
      // A soft colored sheen sits on the water, like a bloom caught by the surface.
      const warm = mat === warmPuddle || mat === alleyPuddle;
      const glow = new T.Mesh(
        new T.PlaneGeometry(rx * 2.3, rz * 2.3),
        new T.MeshBasicMaterial({
          map: TEX.groundGlow(),
          color: warm ? 0xffc27e : 0x7fb9bc,
          transparent: true,
          opacity: warm ? 0.16 : 0.1,
          blending: T.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(x, y + 0.012, z);
      glow.renderOrder = 4;
      puddleGroup.add(glow);
      return mesh;
    };
    addPuddle(4.7, 4.42, 1.65, 0.67, 0.043, warmPuddle, 5);
    addPuddle(-5.1, 5.15, 1.8, 0.62, 0.043, coolPuddle, 12);
    addPuddle(6.35, 6.2, 2.15, 0.9, 0.043, coolPuddle, 19);
    addPuddle(8.75, 4.34, 1.1, 0.48, 0.043, coolPuddle, 25);
    addPuddle(2.62, 2.07, 1.25, 0.46, 0.156, warmPuddle, 31);
    addPuddle(2.95, -1.65, 0.95, 0.6, 0.156, warmPuddle, 38);
    addPuddle(-1.55, 9.47, 1.45, 0.48, 0.156, coolPuddle, 44);
    addPuddle(5.9, 8.97, 1.65, 0.44, 0.156, coolPuddle, 51);
    addPuddle(-9.8, -1.65, 0.86, 1.8, 0.157, alleyPuddle, 56);
    addPuddle(-5.4, -0.85, 0.8, 0.33, 0.156, warmPuddle, 61);

    const reflGroup = new T.Group();
    root.add(reflGroup);
    const addReflection = (opts) => {
      const mat = new T.MeshBasicMaterial({
        map: TEX.reflectionStreak(),
        color: opts.color || 0xffc27c,
        transparent: true,
        opacity: opts.opacity == null ? 0.16 : opts.opacity,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: T.DoubleSide,
      });
      const m = new T.Mesh(new T.PlaneGeometry(opts.w || 3, opts.h || 5), mat);
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = opts.rot || 0;
      m.position.set(opts.x, opts.y == null ? 0.047 : opts.y, opts.z);
      m.renderOrder = 4;
      reflGroup.add(m);
      reflectionFades.push({ mat: mat, base: mat.opacity, speed: 0.2 + Math.random() * 0.5, phase: Math.random() * 8, signal: opts.signal });
      if (opts.signal) signalReflections.push(mat);
      return m;
    };
    addReflection({ x: -1.4, z: 2.46, w: 9.4, h: 3.4, color: 0xffbd76, opacity: 0.42, y: 0.159, rot: 0.02 });
    addReflection({ x: -1.0, z: 4.6, w: 7.4, h: 4.2, color: 0xffc080, opacity: 0.3, rot: -0.03 });
    addReflection({ x: 3.02, z: -2.4, w: 1.8, h: 6.0, color: 0xffc37e, opacity: 0.34, y: 0.159, rot: 0 });
    addReflection({ x: 3.4, z: -4.85, w: 1.35, h: 3.4, color: 0xffb78b, opacity: 0.38, y: 0.159, rot: 0.03 });
    addReflection({ x: -9.05, z: 5.3, w: 2.5, h: 5.2, color: 0xffc075, opacity: 0.36, rot: -0.06 });
    addReflection({ x: 3.62, z: 8.1, w: 0.85, h: 2.1, color: 0x66e2bd, opacity: 0.22, y: 0.159, rot: 0.02, signal: true });
    addReflection({ x: 9.9, z: 8.6, w: 0.9, h: 2.6, color: 0x75b49c, opacity: 0.1, y: 0.159 });
    // long, broken light columns falling from the shop into the wet road
    addReflection({ x: -5.1, z: 5.35, w: 1.2, h: 6.8, color: 0xffd7a0, opacity: 0.3, rot: 0.03 });
    addReflection({ x: -2.15, z: 5.0, w: 1.65, h: 7.2, color: 0xffb974, opacity: 0.28, rot: -0.02 });
    addReflection({ x: 1.0, z: 4.7, w: 1.1, h: 6.0, color: 0xffcf94, opacity: 0.22, rot: 0.05 });
    addReflection({ x: 2.65, z: 5.35, w: 1.65, h: 5.0, color: 0xd9ecdf, opacity: 0.2, rot: 0.02 });
    // long pale sign column
    addReflection({ x: -3.35, z: 4.85, w: 3.0, h: 4.5, color: 0xfff0ca, opacity: 0.15, rot: 0.015 });
    addReflection({ x: 0.2, z: 4.15, w: 1.25, h: 4.8, color: 0xffdcb0, opacity: 0.24, rot: -0.015 });

    // Explicit, hand-painted light columns make the asphalt read as a wet mirror.
    const wetColumns = [];
    const addWetColumn = (o) => {
      const mat = new T.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new T.Color(o.color == null ? 0xffd7a0 : o.color) },
          uOpacity: { value: o.opacity == null ? 0.22 : o.opacity },
        },
        vertexShader: [
          "varying vec2 vUv;",
          "void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        ].join("\n"),
        fragmentShader: [
          "uniform float uTime;",
          "uniform vec3 uColor;",
          "uniform float uOpacity;",
          "varying vec2 vUv;",
          "void main(){",
          "  float x = abs(vUv.x - 0.5);",
          "  float column = smoothstep(0.5, 0.04, x);",
          "  column *= 0.58 + 0.42 * sin(vUv.x * 38.0 + sin(vUv.y * 12.0 + uTime * 0.3) * 2.0);",
          "  float ends = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.72, vUv.y);",
          "  float bands = 0.58 + 0.42 * sin(vUv.y * 52.0 - uTime * 0.7 + sin(vUv.x * 20.0) * 1.7);",
          "  float a = column * ends * bands * uOpacity;",
          "  gl_FragColor = vec4(uColor, a);",
          "}",
        ].join("\n"),
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: T.AdditiveBlending,
        side: T.DoubleSide,
        toneMapped: false,
        fog: false,
      });
      const m = new T.Mesh(new T.PlaneGeometry(o.w, o.h), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(o.x, o.y == null ? 0.055 : o.y, o.z);
      m.renderOrder = 5;
      root.add(m);
      wetColumns.push({ mat, base: mat.uniforms.uOpacity.value, phase: Math.random() * 8, speed: 0.35 + Math.random() * 0.35 });
      return m;
    };

    addWetColumn({ x: -4.3, z: 4.55, w: 2.1, h: 5.8, color: 0xffe0ae, opacity: 0.5 });
    addWetColumn({ x: -1.65, z: 4.45, w: 1.55, h: 5.5, color: 0xffc382, opacity: 0.46 });
    addWetColumn({ x: 1.15, z: 4.15, w: 1.1, h: 4.7, color: 0xffd9a7, opacity: 0.38 });
    addWetColumn({ x: 2.7, z: 5.25, w: 1.7, h: 4.8, color: 0xffca88, opacity: 0.32 });
    addWetColumn({ x: -9.0, z: 5.2, w: 2.1, h: 5.9, color: 0xffd39a, opacity: 0.4 });
    addWetColumn({ x: 3.55, z: 7.3, w: 0.82, h: 2.4, color: 0x69e4c2, opacity: 0.34, y: 0.158 });
    addWetColumn({ x: -3.1, z: 2.35, w: 1.2, h: 2.4, color: 0xffc987, opacity: 0.34, y: 0.162 });
    addWetColumn({ x: -6.5, z: 2.25, w: 0.9, h: 2.0, color: 0xffe1b5, opacity: 0.3, y: 0.162 });
    addWetColumn({ x: 3.28, z: -3.9, w: 1.05, h: 3.2, color: 0x63d2c5, opacity: 0.2, y: 0.162 });
    addWetColumn({ x: 2.22, z: 3.5, w: 0.95, h: 3.6, color: 0x6fc9c2, opacity: 0.14 });
    addWetColumn({ x: 1.28, z: 6.2, w: 0.72, h: 2.4, color: 0xd8836b, opacity: 0.14 });

    // soft light pools
    const addGroundGlow = (x, z, sx, sz, color, opacity, y) => {
      const mat = new T.MeshBasicMaterial({
        map: TEX.groundGlow(),
        color: color,
        transparent: true,
        opacity: opacity,
        blending: T.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const m = new T.Mesh(new T.PlaneGeometry(sx, sz), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y == null ? 0.046 : y, z);
      m.renderOrder = 4;
      root.add(m);
      glowFades.push({ mat, base: opacity, speed: 0.15 + Math.random() * 0.3, phase: Math.random() * 10 });
      return m;
    };
    addGroundGlow(-1.3, 2.8, 10.2, 4.4, 0xffbb78, 0.18, 0.158);
    addGroundGlow(2.95, -2.8, 4.6, 8.4, 0xffb977, 0.14, 0.158);
    addGroundGlow(-9.05, 5.4, 8.4, 7.4, 0xffbd7e, 0.15);
    addGroundGlow(-7.4, 2.7, 3.6, 2.4, 0xffc688, 0.09, 0.158);
    addGroundGlow(3.25, -4.8, 3.4, 3.7, 0xffa980, 0.2, 0.158);
    addGroundGlow(0.8, 2.25, 5.2, 3.2, 0xffc793, 0.19, 0.158);

    /* ================================================================== */
    /* Street furniture                                                  */
    /* ================================================================== */

    // utility pole at the left shoulder of the shop, and its far partner
    const poleA = P.utilityPole(root, { x: -9.62, z: 2.52, height: 8.8, lamp: true, dir: 1, signs: true });
    const poleB = P.utilityPole(root, { x: 10.55, z: -9.15, height: 7.7, lamp: false, dir: -1, signs: false });
    poleB.rotation.y = Math.PI + 0.6;
    poleB.scale.setScalar(0.95);

    const wireMat = new T.LineBasicMaterial({ color: 0x0b1115, transparent: true, opacity: 0.88, toneMapped: false, fog: true });
    const wireGroup = new T.Group();
    root.add(wireGroup);
    const aTop = new T.Vector3(-9.62, 9.32, 2.52);
    const bTop = new T.Vector3(10.55, 7.8, -9.15);
    for (let i = 0; i < 5; i++) {
      const a = aTop.clone().add(new T.Vector3(-0.8 + i * 0.42, -0.15 - i * 0.08, 0));
      const b = bTop.clone().add(new T.Vector3(-0.45 + i * 0.25, -0.16, 0));
      const pts = NM.catenary(a, b, 1.3 + i * 0.14, 38);
      const line = NM.line(wireGroup, pts, 0x151f24, 0.95);
      line.material = wireMat;
      if (i < 3) {
        NM.pipePath(wireGroup, pts.map((p) => p.clone()), 0.017, 0x11191d, {
          segments: 40,
          radial: 4,
          cast: false,
          mat: new T.MeshBasicMaterial({ color: 0x121b20, toneMapped: false, fog: true }),
        });
      }
    }
    // service drops to the shop
    const roofAnchor = new T.Vector3(-7.9, 6.15, 1.05);
    [0, 1].forEach((i) => {
      const pts = NM.catenary(aTop.clone().add(new T.Vector3(0.05 + i * 0.12, -0.4 - i * 0.2, 0)), roofAnchor.clone().add(new T.Vector3(0, 0.18 - i * 0.12, 0)), 0.55, 22);
      NM.line(wireGroup, pts, 0x151f24, 0.85);
    });

    // street lamp light + warm spill
    const lampWorld = poleA.userData.lampWorld || new T.Vector3(3.28, 7.6, 3.5);
    const spot = new T.SpotLight(0xffbd78, 210, 25, Math.PI * 0.27, 0.68, 1.5);
    spot.position.copy(lampWorld);
    spot.target.position.set(-9.0, 0, 5.4);
    spot.castShadow = false;
    root.add(spot);
    root.add(spot.target);
    const streetLampFill = new T.PointLight(0xffb875, 12, 6.5, 2);
    streetLampFill.position.copy(lampWorld).add(new T.Vector3(0, -0.3, 0));
    root.add(streetLampFill);

    // warm cone of light, drawn very quietly
    const coneMat = new T.ShaderMaterial({
      uniforms: { uColor: { value: new T.Color(0xffb06b) }, uOpacity: { value: 0.023 } },
      vertexShader: [
        "varying float vY;",
        "void main(){ vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor; uniform float uOpacity; varying float vY;",
        "void main(){ float a = pow(vY, 2.1) * uOpacity; gl_FragColor = vec4(uColor, a); }",
      ].join("\n"),
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      side: T.DoubleSide,
      toneMapped: false,
    });
    const cone = new T.Mesh(new T.CylinderGeometry(0.11, 3.1, 7.2, 28, 1, true), coneMat);
    cone.position.set(lampWorld.x, lampWorld.y - 3.7, lampWorld.z);
    cone.renderOrder = 2;
    root.add(cone);

    // traffic signal at the far corner
    const signal = P.trafficLight(root, { x: 3.55, z: 8.85, baseY: 0.14, rotY: 0.08 });
    addUpdater((time) => signal.userData.update(time));

    // guardrail along the far sidewalk
    P.guardrail(root, -4.15, 8.69, 1.14, 8.69, 0.14);
    // guardrail at the right corner, out of the main view
    P.guardrail(root, 9.62, 9.0, 9.62, 10.2, 0.14);

    // vending machine & bicycle on the store side
    P.vending(root, { x: 2.68, z: -5.0, baseY: 0.14, rotY: Math.PI / 2 });
    P.bicycle(root, { x: 2.75, z: -2.2, baseY: 0.14, rotY: Math.PI / 2, lean: 0.075 });
    const bike2 = P.bicycle(root, { x: 0.12, z: 9.35, baseY: 0.14, rotY: 0.16, lean: 0.06, color: 0x5f5b4d });
    bike2.scale.setScalar(0.94);

    // far-side pocket: tree, bench, post box. The empty bench keeps the rain company.
    const tree = P.streetTree(root, { x: -9.1, z: 9.7, scale: 1.02 });
    P.bench(root, { x: -6.0, z: 10.35, rotY: Math.PI });
    P.postbox(root, { x: -3.55, z: 10.35, rotY: 0 });
    // A small cat keeps the empty bench company, watching the rain.
    const cat = P.cat(root, { x: -5.48, z: 10.35, y: 0.635, rotY: 2.25, scale: 0.72 });
    addUpdater((time) => cat.userData.update(time));

    // outside bins and umbrellas
    P.trashBins(root, { x: -1.65, z: 2.14 });
    P.umbrellaStand(root, { x: -0.26, z: 1.62 });

    // noticeboard + wall AC on the solid side wall
    P.noticeboard(root, { x: 2.02, z: -6.87, baseY: 1.34, rotY: Math.PI / 2 });
    P.outdoorAC(root, { x: 1.98, z: -6.14, y: 2.25, rotY: Math.PI / 2 });
    // AC drip pipe
    NM.cyl(root, { r: 0.017, h: 1.9, x: 2.18, y: 1.3, z: -6.08, color: 0x5d6d69, outline: false });

    // parking sign
    P.parkingSign(root, { x: -7.55, z: 2.68 });
    P.hydrangea(root, { x: -8.2, z: 2.45, scale: 0.9 });
    P.hydrangea(root, { x: 3.46, z: 8.22, scale: 0.65 });

    // little utility cabinet and hedge on the far side
    const farUtil = new T.Group();
    farUtil.position.set(1.45, 0.14, 10.92);
    root.add(farUtil);
    NM.box(farUtil, { w: 0.82, h: 1.1, d: 0.48, x: 0, y: 0.55, z: 0, color: 0x596863, outline: true });
    NM.box(farUtil, { w: 0.86, h: 0.07, d: 0.52, x: 0, y: 1.12, z: 0, color: 0x3a4844, outline: true });
    NM.panel(farUtil, { map: TEX.labelTexture("電気", { width: 256, height: 256, bg: "#a9a074", fg: "#343c35", size: 90 }), w: 0.27, h: 0.27, x: 0, y: 0.72, z: 0.247, transparent: true, toneMapped: true });

    const hedge = new T.Group();
    hedge.position.set(-10.15, 0.14, 10.85);
    hedge.rotation.y = 0.22;
    root.add(hedge);
    NM.box(hedge, { w: 1.45, h: 0.38, d: 0.72, x: 0, y: 0.19, z: 0, color: 0x6a6f62, outline: true });
    const hedgeRnd = NM.seedRandom(607);
    for (let i = 0; i < 9; i++) {
      NM.sphere(hedge, { r: 0.3 + hedgeRnd() * 0.1, x: -0.55 + i * 0.135, y: 0.45 + hedgeRnd() * 0.14, z: -0.06 + (hedgeRnd() - 0.5) * 0.35, color: i % 3 ? 0x2f4d3e : 0x3c5e49, sx: 1.2, sy: 0.8, sz: 1.0, seg: 7, segY: 5 });
    }

    /* ================================================================== */
    /* Alleys, back lanes & small secrets                                */
    /* ================================================================== */

    const alley = new T.Group();
    alley.name = "alley";
    root.add(alley);

    // brick wall along the far left, framing a narrow passage
    NM.box(alley, {
      w: 0.24,
      h: 3.7,
      d: 8.9,
      x: -11.15,
      y: 1.99,
      z: -3.28,
      color: 0x42504c,
      mat: NM.toon(0x42504c, { map: TEX.brick() }),
      outline: true,
      edgeThreshold: 24,
    });
    NM.box(alley, { w: 0.36, h: 0.12, d: 9.0, x: -11.15, y: 3.88, z: -3.28, color: 0x6c746a, outline: true });
    // a taller back wall piece
    NM.box(alley, { w: 2.55, h: 3.5, d: 0.22, x: -9.75, y: 1.9, z: -7.72, color: 0x3b4846, outline: true });

    // gutter & puddle, pots
    NM.box(alley, { w: 0.28, h: 0.04, d: 8.5, x: -10.82, y: 0.157, z: -3.2, color: 0x303d3e, outline: false });
    const alleyDrain = P.drain(alley, { x: -10.82, z: -1.3, y: 0.16, w: 0.25, d: 0.9, rotY: Math.PI / 2 });
    alleyDrain.scale.setScalar(1.02);

    // noren frame at the mouth of the alley
    NM.cyl(alley, { r: 0.045, h: 2.7, x: -11.0, y: 1.45, z: 0.95, color: 0x4e4a3c, outline: true });
    NM.cyl(alley, { r: 0.045, h: 2.7, x: -8.82, y: 1.45, z: 0.95, color: 0x4e4a3c, outline: true });
    NM.cyl(alley, { r: 0.045, h: 2.3, x: -9.91, y: 2.77, z: 0.95, color: 0x4e4a3c, rotZ: Math.PI / 2, outline: true });

    // noren fabric
    const norenCanvas = makeCanvas(768, 512);
    const nctx = norenCanvas.getContext("2d");
    nctx.fillStyle = "#263b44";
    nctx.fillRect(0, 0, 768, 512);
    nctx.fillStyle = "#e7dcc4";
    nctx.textAlign = "center";
    nctx.font = "700 70px " + TEX._helpers.JP_FONT;
    nctx.fillText("星町", 256, 225);
    nctx.fillText("横丁", 512, 225);
    nctx.fillStyle = "rgba(229,217,189,0.5)";
    nctx.fillRect(0, 14, 768, 4);
    nctx.fillRect(0, 494, 768, 4);
    nctx.strokeStyle = "rgba(230,220,201,0.38)";
    nctx.lineWidth = 4;
    nctx.beginPath();
    nctx.moveTo(384, 30);
    nctx.lineTo(384, 480);
    nctx.stroke();
    nctx.fillStyle = "#d7c9a9";
    nctx.beginPath();
    TEX._helpers.starPath(nctx, 384, 98, 25, 10, 5);
    nctx.fill();
    const norenTex = TEX._helpers.toTexture(norenCanvas);
    const norenGroup = new T.Group();
    norenGroup.position.set(-9.91, 2.72, 1.0);
    alley.add(norenGroup);
    for (let i = 0; i < 3; i++) {
      const cloth = new T.Mesh(new T.PlaneGeometry(0.66, 0.72, 1, 3), new T.MeshBasicMaterial({ map: norenTex, side: T.DoubleSide, toneMapped: true }));
      cloth.position.set(-0.72 + i * 0.72, -0.36, 0);
      cloth.rotation.x = 0.04 + i * 0.025;
      norenGroup.add(cloth);
    }
    const norenPins = [];
    for (let i = 0; i < 3; i++) {
      const pivot = norenGroup.children[i];
      norenPins.push(pivot);
    }
    addUpdater((time) => {
      norenGroup.children.forEach((c, i) => {
        c.rotation.y = Math.sin(time * 0.55 + i * 0.8) * 0.035;
        c.rotation.x = 0.04 + Math.sin(time * 0.8 + i) * 0.018;
      });
    });

    // hanging round lantern
    const lanternGroup = new T.Group();
    lanternGroup.position.set(-9.15, 2.32, 0.98);
    alley.add(lanternGroup);
    NM.cyl(lanternGroup, { r: 0.19, rb: 0.15, h: 0.52, x: 0, y: 0, z: 0, color: 0xc75e45, outline: true, seg: 16 });
    NM.cyl(lanternGroup, { r: 0.15, h: 0.05, x: 0, y: 0.28, z: 0, color: 0x3b2922, outline: true, seg: 12 });
    NM.cyl(lanternGroup, { r: 0.15, h: 0.05, x: 0, y: -0.28, z: 0, color: 0x3b2922, outline: true, seg: 12 });
    NM.cyl(lanternGroup, { r: 0.012, h: 0.3, x: 0, y: 0.45, z: 0, color: 0x3c3025, outline: false });
    const lanternGlow = NM.glowSprite(lanternGroup, { x: 0, y: 0, z: 0, sx: 2.3, sy: 2.5, color: 0xff9f63, opacity: 0.28, depthTest: true });
    const lanternLight = new T.PointLight(0xffa468, 18, 4.2, 2);
    lanternLight.position.set(0, 0, 0.4);
    lanternGroup.add(lanternLight);
    NM.panel(lanternGroup, { map: TEX.labelTexture("星", { width: 256, height: 256, bg: "rgba(0,0,0,0)", fg: "#2b251e", size: 130 }), w: 0.24, h: 0.24, x: 0, y: 0.01, z: 0.168, transparent: true, depthWrite: false });
    addUpdater((time) => {
      lanternGroup.rotation.z = Math.sin(time * 0.45) * 0.035;
      lanternGroup.rotation.x = Math.cos(time * 0.38) * 0.025;
      lanternLight.intensity = 17 + Math.sin(time * 3.1) * 0.5;
      lanternGlow.material.opacity = 0.25 + Math.sin(time * 1.2) * 0.02;
    });

    // crates, bottles and pipes in the alley
    NM.box(alley, { w: 0.46, h: 0.38, d: 0.36, x: -10.55, y: 0.34, z: -2.2, color: 0x8d5a3f, outline: true, rotY: 0.1 });
    NM.box(alley, { w: 0.44, h: 0.34, d: 0.34, x: -10.36, y: 0.65, z: -2.27, color: 0x4e6961, outline: true, rotY: -0.14 });
    NM.box(alley, { w: 0.42, h: 0.3, d: 0.32, x: -10.0, y: 0.31, z: -2.75, color: 0x6d5b41, outline: true, rotY: 0.3 });
    NM.cyl(alley, { r: 0.16, h: 0.38, x: -9.5, y: 0.34, z: -0.95, color: 0x5c6860, outline: true });
    for (let i = 0; i < 5; i++) {
      NM.cyl(alley, { r: 0.026, h: 0.28, x: -9.65 + i * 0.07, y: 0.62, z: -0.98 + (i % 2) * 0.05, color: [0x5e7667, 0x6d5b3f, 0x4d625b][i % 3], outline: false });
    }
    // pipes on the store wall (visible from the alley)
    NM.cyl(alley, { r: 0.045, h: 4.1, x: -8.58, y: 2.2, z: -4.9, color: 0x4c5c58, outline: false });
    NM.cyl(alley, { r: 0.045, h: 3.0, x: -8.58, y: 1.65, z: -2.1, color: 0x5f6b65, outline: false });
    NM.box(alley, { w: 0.18, h: 0.6, d: 0.48, x: -8.45, y: 1.6, z: -3.7, color: 0x55635f, outline: true });
    // a small warm lamp over the passage
    NM.box(alley, { w: 0.24, h: 0.18, d: 0.12, x: -8.5, y: 2.55, z: -3.4, color: 0x3d4c49, outline: true });
    const alleyLampGlow = NM.glowSprite(alley, { x: -8.37, y: 2.5, z: -3.4, sx: 1.2, sy: 1.4, color: 0xffc17f, opacity: 0.22, depthTest: true });
    const alleyLamp = new T.PointLight(0xffc07c, 15, 4.5, 2);
    alleyLamp.position.set(-8.1, 2.35, -3.4);
    alley.add(alleyLamp);

    // small sign at the alley mouth
    const alleySign = TEX.labelTexture("路地 / ALLEY", { width: 512, height: 160, bg: "#314b44", fg: "#e5d7b7", size: 52 });
    NM.box(alley, { w: 0.58, h: 0.22, d: 0.04, x: -9.25, y: 2.13, z: 1.04, color: 0x314b44, outline: true });
    NM.panel(alley, { map: alleySign, w: 0.54, h: 0.18, x: -9.25, y: 2.13, z: 1.065, transparent: true, toneMapped: true });

    // a small pink neon vertical sign tucked at the alley corner
    const neonCanvas = makeCanvas(256, 768);
    const nnctx = neonCanvas.getContext("2d");
    nnctx.fillStyle = "#202a31";
    nnctx.fillRect(0, 0, 256, 768);
    nnctx.strokeStyle = "#de7f94";
    nnctx.lineWidth = 10;
    nnctx.strokeRect(9, 9, 238, 750);
    nnctx.strokeStyle = "rgba(222,127,148,0.25)";
    nnctx.lineWidth = 3;
    nnctx.strokeRect(22, 22, 212, 724);
    nnctx.textAlign = "center";
    nnctx.textBaseline = "middle";
    nnctx.fillStyle = "#f0bfc2";
    nnctx.font = "700 74px " + TEX._helpers.JP_FONT;
    nnctx.fillText("ス", 128, 170);
    nnctx.fillText("ナ", 128, 274);
    nnctx.fillText("ッ", 128, 378);
    nnctx.fillText("ク", 128, 482);
    nnctx.fillStyle = "#9fced0";
    nnctx.font = "600 37px " + TEX._helpers.EN_FONT;
    nnctx.fillText("HOSHI", 128, 578);
    nnctx.fillText("2-14", 128, 626);
    nnctx.fillStyle = "#de7f94";
    nnctx.beginPath();
    TEX._helpers.starPath(nnctx, 128, 684, 27, 11, 5);
    nnctx.fill();
    const neonTex = TEX._helpers.toTexture(neonCanvas);
    NM.box(alley, { w: 0.31, h: 1.04, d: 0.12, x: -8.9, y: 2.7, z: 0.62, color: 0x2c353b, outline: true });
    const neonFace = NM.panel(alley, { map: neonTex, w: 0.27, h: 0.95, x: -8.9, y: 2.7, z: 0.685, transparent: true, toneMapped: false });
    const neonGlow = NM.glowSprite(alley, { x: -8.9, y: 2.7, z: 0.82, sx: 2.0, sy: 2.8, color: 0xff8ca1, opacity: 0.2, depthTest: true });
    const neonLight = new T.PointLight(0xff7d98, 22, 4.4, 2);
    neonLight.position.set(-8.8, 2.4, 0.9);
    alley.add(neonLight);
    NM.cyl(alley, { r: 0.018, h: 0.03, x: -8.9, y: 2.7, z: 0.55, color: 0x59635c, outline: false });
    addUpdater((time) => {
      const pulse = 0.82 + Math.sin(time * 5.1) * 0.03 + (Math.sin(time * 31.0) > 0.93 ? 0.12 : 0);
      neonFace.material.opacity = pulse;
      neonGlow.material.opacity = 0.15 + pulse * 0.08;
      neonLight.intensity = 20 + Math.sin(time * 3.2) * 0.8;
    });

    // service lane behind the shop
    const backLane = new T.Group();
    backLane.position.set(-4.7, 0.14, -8.1);
    root.add(backLane);
    NM.box(backLane, { w: 4.5, h: 0.03, d: 2.1, x: 0, y: 0.005, z: 0, color: 0x283435, outline: false });
    NM.box(backLane, { w: 0.85, h: 1.95, d: 0.12, x: -2.9, y: 0.98, z: 0.06, color: 0x3d5250, outline: true });
    NM.box(backLane, { w: 0.7, h: 0.05, d: 0.08, x: -2.9, y: 0.7, z: 0.14, color: 0x89948b, outline: false });
    NM.glowSprite(backLane, { x: -2.55, y: 2.0, z: 0.22, sx: 1.0, sy: 1.4, color: 0xffc07a, opacity: 0.15, depthTest: true });
    const backLamp = new T.PointLight(0xffbf83, 9, 3.3, 2);
    backLamp.position.set(-2.55, 2.1, 0.5);
    backLane.add(backLamp);
    NM.box(backLane, { w: 0.55, h: 0.35, d: 0.4, x: 0.6, y: 0.33, z: 0.3, color: 0x6e543b, outline: true, rotY: 0.2 });
    NM.box(backLane, { w: 0.48, h: 0.32, d: 0.36, x: 0.84, y: 0.62, z: 0.35, color: 0x4b625c, outline: true, rotY: -0.15 });
    NM.box(backLane, { w: 0.6, h: 0.3, d: 0.4, x: 1.65, y: 0.31, z: 0.6, color: 0x5d5c4c, outline: true });
    P.outdoorAC(backLane, { x: -0.8, z: -0.5, y: 1.9, rotY: 0 });
    P.drain(backLane, { x: 1.9, z: 1.2, y: 0.03, w: 0.7, d: 0.26 });

    // back vent & pipes on the store wall
    NM.box(root, { w: 0.3, h: 0.7, d: 0.22, x: -2.3, y: 3.4, z: -7.63, color: 0x67746d, outline: true });
    NM.cyl(root, { r: 0.07, h: 2.6, x: -3.7, y: 1.4, z: -7.7, color: 0x4b5a56, outline: false });

    // more back-alley bits visible from a high orbit
    const crateRnd = NM.seedRandom(300);
    for (let i = 0; i < 5; i++) {
      NM.box(root, { w: 0.4 + crateRnd() * 0.2, h: 0.28 + crateRnd() * 0.2, d: 0.35, x: 1.4 + crateRnd() * 1.6, y: 0.14 + 0.18, z: -8.35 - crateRnd() * 0.7, color: i % 2 ? 0x6f5e43 : 0x4a605a, outline: true, rotY: crateRnd() * 0.5 });
    }

    // skyline blank: every object stays on the square base
    /* ================================================================== */
    /* Updates                                                           */
    /* ================================================================== */

    let signalTimer = 0;
    const update = (time, dt) => {
      // shared timers
      for (let i = 0; i < puddleMats.length; i++) puddleMats[i].uniforms.uTime.value = time;
      glintTex.offset.x += dt * 0.006;
      glintTex.offset.y -= dt * 0.0025;
      glintMat.opacity = 0.22 + Math.sin(time * 0.8) * 0.022;

      wetColumns.forEach((w) => {
        w.mat.uniforms.uTime.value = time;
        w.mat.uniforms.uOpacity.value = w.base * (0.86 + 0.14 * Math.sin(time * w.speed + w.phase));
      });

      reflectionFades.forEach((r) => {
        r.mat.opacity = r.base * (0.82 + 0.18 * Math.sin(time * r.speed * 2.4 + r.phase));
      });
      glowFades.forEach((r) => {
        r.mat.opacity = r.base * (0.85 + 0.15 * Math.sin(time * r.speed * 1.6 + r.phase));
      });

      // traffic signal reflection
      signalTimer += dt;
      const active = signal.userData.active;
      if (active) {
        const c = active === "red" ? 0xe4584a : active === "amber" ? 0xe7a34c : 0x65d6b1;
        signalReflections.forEach((m) => {
          m.color.offsetHSL(0, 0, 0);
          m.color.setHex(c);
          m.opacity = 0.1 + Math.sin(time * 1.4) * 0.015;
        });
      }

      // low mist / little light tremors
      store.lights.sideSpill.intensity = 58 + Math.sin(time * 0.7 + 1.3) * 0.8;

      for (let i = 0; i < updaters.length; i++) updaters[i](time, dt);
    };

    const focus = new T.Vector3(-1.05, 1.7, -0.95);

    return {
      root,
      focus,
      store,
      updaters,
      update,
      eavePoints,
      sideEavePoints,
      puddleMats,
      keyLights: { moon, hemi, ambient, fill, spot },
    };
  };
})();
