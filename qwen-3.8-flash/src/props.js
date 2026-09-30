import * as THREE from 'three';
import * as TX from './textures.js';

export function buildProps(c) {
  const { root, box, tube, plane, toon, blob, glow, reflection, M, refs, rnd } = c;

  /* vending machines */
  const vTex = TX.vendingTexture();
  function vending(x, z, ry) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    root.add(g);
    box(g, 1.3, 1.98, 0.84, M.coolerBody, 0, 1.04, 0, { edge: 36 });
    const vm = toon(0xffffff, { map: vTex, emissive: 0xffffff, emissiveMap: vTex, emissiveIntensity: 0.8 });
    refs.vendingMats.push(vm);
    const vp = plane(g, 1.14, 1.86, vm, 0, 1.08, 0.426);
    vp.renderOrder = 6;
    box(g, 1.36, 0.1, 0.9, M.darker, 0, 0.06, 0, { edge: false });
    const lm = toon(0xffffff, { emissive: 0xbfe8ff, emissiveIntensity: 1.2 });
    refs.vendingMats.push(lm);
    box(g, 1.22, 0.07, 0.12, lm, 0, 2.06, 0.32, { edge: false });
    blob(g, 0, 0, 2.3, 0.07);
    glow(0, 0.075, 1.1, 1.8, 1.4, 0x3f7fd6);
  }
  vending(5.05, -1.35, Math.PI / 2);
  vending(5.05, 0.15, Math.PI / 2);
  reflection(6.05, 0.055, -0.6, 1.0, 1.6, 0x4a8fe8, 0.6);

  /* trash bins */
  function bin(x, z, ry, bandColor) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    root.add(g);
    box(g, 0.62, 0.86, 0.5, M.dark, 0, 0.47, 0, { edge: 38 });
    box(g, 0.68, 0.1, 0.56, M.frameDark, 0, 0.95, 0, { edge: 38 });
    box(g, 0.4, 0.05, 0.16, M.darker, -0.1, 1.01, 0, { edge: false });
    box(g, 0.64, 0.18, 0.52, toon(bandColor), 0, 0.62, 0, { edge: false });
    blob(g, 0, 0, 1.4, 0.06);
  }
  bin(4.15, 5.15, 0.4, 0x2f66d0);
  bin(4.85, 5.0, 0.1, 0xd94b4b);

  /* umbrella stand by the door */
  {
    const g = new THREE.Group();
    g.position.set(0.15, 0, 5.5);
    root.add(g);
    box(g, 0.5, 0.5, 0.5, toon(0x8d93a3), 0, 0.28, 0, { edge: 38 });
    box(g, 0.54, 0.06, 0.54, M.frameDark, 0, 0.55, 0, { edge: false });
    for (let i = 0; i < 5; i++) {
      const u = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.045, 0.95, 6), M.umbrella[i % 3]);
      const a = i / 5 * Math.PI * 2 + 0.4;
      u.position.set(Math.cos(a) * 0.13, 0.98, Math.sin(a) * 0.13);
      u.rotation.set(Math.sin(a) * 0.09, 0, Math.cos(a) * 0.09);
      u.castShadow = true;
      g.add(u);
    }
    blob(g, 0, 0, 1.1, 0.06);
  }
  /* stray wet umbrella left on the mat edge */
  {
    const u = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.85, 6), toon(0xf2e34a));
    u.position.set(3.35, 0.44, 5.4);
    u.rotation.set(0, 0, 0.14);
    u.castShadow = true;
    root.add(u);
    blob(root, 3.35, 5.4, 0.7, 0.062);
  }

  /* bicycles parked by the rail */
  function bicycle(x, z, ry, frameMat) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    root.add(g);
    const wheel = (wx) => {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.038, 6, 18), M.tire);
      t.position.set(wx, 0.33, 0);
      t.castShadow = true;
      g.add(t);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.016, 5, 16), M.steel);
      rim.position.set(wx, 0.33, 0);
      g.add(rim);
    };
    wheel(-0.55); wheel(0.55);
    const V = (a, b, r = 0.028) => tube(g, new THREE.Vector3(...a), new THREE.Vector3(...b), r, frameMat, 6);
    const BB = [0, 0.38, 0], SEAT = [-0.36, 0.88, 0], HD = [0.4, 0.84, 0], HDB = [0.3, 0.44, 0];
    V(BB, SEAT); V(SEAT, [-0.55, 0.33, 0]); V(BB, [-0.55, 0.33, 0]);
    V(BB, HDB); V(SEAT, HD); V(HDB, HD);
    V(HD, [0.44, 0.96, 0]); V([0.44, 0.96, 0], [0.55, 0.33, 0], 0.022);
    for (const s of [-1, 1]) V([0.44, 0.96, 0], [0.4, 1.02, s * 0.24], 0.02);
    box(g, 0.3, 0.05, 0.15, M.darker, -0.38, 0.9, 0, { edge: false });
    box(g, 0.05, 0.14, 0.03, M.darker, 0, 0.31, 0.08, { edge: false });
    box(g, 0.34, 0.2, 0.26, M.steel, 0.62, 0.78, 0, { edge: false });
    const kick = tube(g, new THREE.Vector3(-0.05, 0.36, 0.02), new THREE.Vector3(-0.22, 0.02, 0.12), 0.015, M.darker, 5);
    blob(g, 0, 0, 2.0, 0.06);
    return g;
  }
  bicycle(6.5, 3.6, -1.35, M.bikeBlue);
  bicycle(6.45, 2.3, -1.6, M.bikeGray);
  bicycle(-9.4, 5.2, -1.75, toon(0x4a90e2));

  /* traffic cones */
  for (const [cx, cz, ry] of [[-7.6, 6.0, 0.3], [-8.6, 6.15, -0.4]]) {
    const g = new THREE.Group();
    g.position.set(cx, 0, cz);
    root.add(g);
    const cm = toon(0xe8703a, { emissive: 0x5a2408, emissiveIntensity: 0.4 });
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.19, 0.44, 10), cm);
    cone.position.y = 0.26;
    cone.castShadow = true;
    g.add(cone);
    box(g, 0.3, 0.04, 0.3, toon(0x1c2130), 0, 0.05, 0, { edge: false });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.128, 0.148, 0.07, 10), toon(0xf2f4f8));
    band.position.y = 0.3;
    g.add(band);
    blob(g, 0, 0, 0.6, 0.06);
  }

  /* poles, wires, streetlights */
  const poleMat = M.pole;
  function utilityPole(x, z, h = 7.4) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    root.add(g);
    tube(g, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, h, 0), 0.1, poleMat);
    tube(g, new THREE.Vector3(-0.75, h - 0.5, 0), new THREE.Vector3(0.75, h - 0.5, 0), 0.04, M.frameDark, 6);
    tube(g, new THREE.Vector3(-0.62, h - 1.1, 0), new THREE.Vector3(0.62, h - 1.1, 0), 0.038, M.frameDark, 6);
    for (const ix of [-0.62, 0, 0.62]) box(g, 0.05, 0.13, 0.05, M.frame, ix, h - 0.36, 0, { edge: false });
    box(g, 0.22, 0.55, 0.2, M.frameDark, 0.26, h - 2.1, 0, { edge: 38 });
    blob(g, 0, 0, 0.6, 0.062);
    return { x, z, h, g };
  }
  const pA = utilityPole(6.55, -1.4);
  const pB = utilityPole(-4.05, 8.7, 7.0);
  const pC = utilityPole(9.6, -11.4, 6.8);
  const WIRE = c.toon(0x10151f);
  function wire(a, b, sag = 0.55) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y -= Math.sin(t * Math.PI) * sag * (0.6 + 0.4 * Math.abs(a.x - b.x) / 12);
      pts.push(p);
    }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 28, 0.016, 5), WIRE);
    root.add(m);
  }
  for (const dy of [0, -0.6]) {
    wire(new THREE.Vector3(pA.x - 0.6, pA.h - 0.5 + dy, pA.z), new THREE.Vector3(pB.x + 0.6, pB.h - 0.5 + dy, pB.z), 0.7);
    wire(new THREE.Vector3(pA.x + 0.6, pA.h - 0.5 + dy, pA.z), new THREE.Vector3(pC.x, pC.h - 0.5 + dy, pC.z), 0.6);
  }
  wire(new THREE.Vector3(pB.x - 0.6, pB.h - 0.5, pB.z), new THREE.Vector3(13, pB.h - 0.55, pB.z - 1.5), 0.9);
  wire(new THREE.Vector3(pC.x, pC.h - 0.5, pC.z - 0.6), new THREE.Vector3(pC.x, pC.h - 0.5, 13), 0.8);
  wire(new THREE.Vector3(pA.x, pA.h - 2.1, pA.z + 0.1), new THREE.Vector3(4.45, 5.1, 0.4), 0.35);

  function streetlight(x, z, armX, armZ) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    root.add(g);
    tube(g, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 4.6, 0), 0.07, poleMat);
    const tip = new THREE.Vector3(armX, 4.68, armZ);
    tube(g, new THREE.Vector3(0, 4.55, 0), tip.clone(), 0.045, poleMat, 6);
    const head = box(g, 0.34, 0.09, 0.55, toon(0x525c70), armX, 4.62, armZ, { edge: false, rx: 0 });
    const lampMat = toon(0xfff6dd, { emissive: 0xffe9b8, emissiveIntensity: 1.0 });
    refs.signMats.push(lampMat);
    const lamp = plane(g, 0.3, 0.5, lampMat, armX, 4.565, armZ, { rx: -Math.PI / 2 });
    lamp.renderOrder = 6;
    blob(g, 0, 0, 0.7, 0.062);
    glow(x + armX * 1.4, 0.07, z + armZ * 1.4, 3.6, 3.6, 0xffd9a0);
    reflection(x + armX * 1.6, 0.056, z + armZ * 1.9, 0.6, 3.2, 0xffe0a8, 0.8);
    return g;
  }
  streetlight(3.3, 6.55, 1.1, -1.6);
  streetlight(8.7, -6.8, -1.9, -0.6);

  /* road signs at the corner */
  {
    const g = new THREE.Group();
    g.position.set(5.05, 0, 6.9);
    root.add(g);
    tube(g, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2.4, 0), 0.055, poleMat, 6);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), toon(0x2f8fdd, { emissive: 0x0e2f52, emissiveIntensity: 0.35 }));
    face.position.set(0, 2.75, 0.03);
    g.add(face);
    box(g, 0.4, 0.1, 0.03, toon(0xf2f4f8), 0, 2.75, 0.06, { edge: false });
    box(g, 0.1, 0.4, 0.03, toon(0xf2f4f8), 0, 2.75, 0.06, { edge: false });
    const pl = plane(g, 0.5, 0.26, new THREE.MeshBasicMaterial({ map: TX.stickerTexture('注意', '#e8703a'), transparent: true }), 0, 2.05, 0.05, { ry: 0 });
    pl.renderOrder = 5;
    blob(g, 0, 0, 0.6, 0.062);
  }
  /* distant traffic signal across the street */
  {
    const g = new THREE.Group();
    g.position.set(9.4, 0, 7.3);
    root.add(g);
    tube(g, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 3.1, 0), 0.08, toon(0x66708a), 6);
    box(g, 0.26, 0.8, 0.22, M.dark, 0, 3.42, 0, { edge: 38, ry: -0.9 });
    const lamp = (col, y) => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.075, 12), new THREE.MeshBasicMaterial({ color: col }));
      m.position.set(0, y, 0.12);
      const h = box(g, 0.24, 0.04, 0.09, M.dark, 0, y + 0.09, 0.11, { edge: false });
      h.material = M.dark;
      return m;
    };
    const red = new THREE.MeshBasicMaterial({ color: 0x1a0708 });
    const yel = new THREE.MeshBasicMaterial({ color: 0x1a1408 });
    const grn = new THREE.MeshBasicMaterial({ color: 0x08140b });
    const r1 = lamp(red, 3.66), r2 = lamp(yel, 3.42), r3 = lamp(grn, 3.18);
    [r1, r2, r3].forEach((m) => { m.rotation.y = -0.9; m.position.copy(m.position.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.9).add(new THREE.Vector3(0, 0, -0.05))); g.attach(m); });
    refs.traffic = { red, yel, grn, order: [0, 0, 0] };
    blob(g, 0, 0, 0.7, 0.062);
  }

  /* guardrails along the road edge */
  function railRun(x0, z0, x1, z1, n) {
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const px = x0 + (x1 - x0) * t, pz = z0 + (z1 - z0) * t;
      const g = new THREE.Group();
      g.position.set(px, 0, pz);
      root.add(g);
      box(g, 0.1, 0.78, 0.1, M.steel, 0, 0.42, 0, { edge: false });
      box(g, 0.16, 0.05, 0.16, M.frameDark, 0, 0.8, 0, { edge: false });
      blob(g, 0, 0, 0.45, 0.06);
    }
  }
  railRun(-3.6, 6.75, 3.2, 6.75, 5);
  railRun(8.15, -5.4, 8.15, 0.6, 4);

  /* notice board / poster kiosk */
  {
    const g = new THREE.Group();
    g.position.set(-5.6, 0, 6.5);
    g.rotation.y = 0.12;
    root.add(g);
    tube(g, new THREE.Vector3(-0.55, 0, 0), new THREE.Vector3(-0.55, 1.9, 0), 0.05, poleMat, 6);
    tube(g, new THREE.Vector3(0.55, 0, 0), new THREE.Vector3(0.55, 1.9, 0), 0.05, poleMat, 6);
    box(g, 1.75, 1.1, 0.09, M.frameDark, 0, 2.15, 0, { edge: 38 });
    for (let i = 0; i < 2; i++) {
      const pm = new THREE.MeshBasicMaterial({ map: TX.posterTexture(i + 6), side: THREE.DoubleSide });
      const w = plane(g, 0.6, 0.84, pm, -0.38 + i * 0.78, 2.12, 0.06);
      w.renderOrder = 5;
    }
    box(g, 1.85, 0.12, 0.26, M.frameDark, 0, 2.78, 0.06, { edge: false });
    blob(g, 0, 0, 2.0, 0.06);
  }

  /* AC outdoor units + pipes on west wall */
  for (const az of [-2.6, -0.9]) {
    const g = new THREE.Group();
    g.position.set(-4.95, 0, az);
    root.add(g);
    box(g, 0.62, 0.85, 1.0, M.frame, 0, 0.48, 0, { edge: 38 });
    const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.028, 6, 20), M.darker);
    fanRing.rotation.y = Math.PI / 2;
    fanRing.position.set(-0.32, 0.52, 0);
    g.add(fanRing);
    const fan = new THREE.Group();
    fan.position.set(-0.33, 0.52, 0);
    for (let i = 0; i < 3; i++) {
      const bl = box(fan, 0.014, 0.26, 0.075, M.darker, 0, 0.14, 0, { edge: false });
      bl.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), (i * Math.PI * 2) / 3);
      bl.rotation.x = 0.4;
    }
    g.add(fan);
    refs.fans.push({ o: fan, axis: 'x', speed: 2.2 });
    box(g, 0.66, 0.07, 1.04, M.frameDark, 0, 0.93, 0, { edge: false });
    tube(g, new THREE.Vector3(0.2, 0.9, 0.4), new THREE.Vector3(0.5, 1.35, 0.55), 0.035, M.steel, 6);
    tube(g, new THREE.Vector3(0.2, 0.9, 0.45), new THREE.Vector3(0.6, 1.7, 0.6), 0.028, M.steel, 6);
    blob(g, 0, 0, 1.4, 0.06);
  }
  /* rooftop-ish wall pipes + back alley gate */
  tube(root, new THREE.Vector3(-4.3, 1.9, -3.8), new THREE.Vector3(-4.3, 5.0, -3.8), 0.05, M.frameDark, 6);
  tube(root, new THREE.Vector3(-4.3, 1.9, -3.5), new THREE.Vector3(-4.3, 5.0, -3.5), 0.04, M.frameDark, 6);
  {
    const g = new THREE.Group();
    g.position.set(-3.9, 0, -6.1);
    root.add(g);
    for (const dz of [0, 1.7]) {
      tube(g, new THREE.Vector3(0, 0, dz), new THREE.Vector3(0, 1.5, dz), 0.05, M.frameDark, 6);
    }
    box(g, 0.06, 1.36, 1.7, M.steel, 0, 0.78, 0.85, { edge: false });
    for (let i = 0; i < 9; i++) box(g, 0.07, 1.3, 0.045, M.frameDark, 0, 0.78, 0.12 + i * 0.18, { edge: false });
    box(g, 0.09, 0.08, 1.78, M.steel, 0, 1.5, 0.85, { edge: false });
  }

  /* crates + boxes in the alley */
  for (const [cx, cz, s, ry] of [[-2.9, -6.3, 0.55, 0.3], [-2.2, -6.6, 0.45, -0.2], [-2.6, -6.05, 0.4, 0.8]]) {
    box(root, s, s * 0.8, s, toon(0x8a6f52), cx, s * 0.4, cz, { edge: 38, ry });
    blob(root, cx, cz, s * 1.8, 0.06);
  }
  box(root, 0.6, 0.62, 0.6, toon(0x4a5570), -1.1, 0.31, -6.6, { edge: 38, ry: 0.2 });

  /* low corner fence / sidewalk edge detail near neighbor */
  {
    const g = new THREE.Group();
    g.position.set(-7.0, 0, 6.9);
    root.add(g);
    for (const px of [-0.9, 0, 0.9]) {
      box(g, 0.14, 1.05, 0.14, toon(0x525c70), px, 0.52, 0, { edge: 38 });
    }
    for (const px of [-0.9, 0, 0.9]) {
      box(g, 0.3, 0.18, 0.3, toon(0x394054), px, 0.09, 0, { edge: false });
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.1, 8), toon(0x525c70));
      top.position.set(px, 1.1, 0);
      g.add(top);
    }
  }

  /* drain outflow + gutter line across the pad front */
  box(root, 19.2, 0.04, 0.3, M.grill, -3.4, 0.05, -7.5, { edge: false, cast: false });
  for (let i = 0; i < 3; i++) box(root, 19.2, 0.055, 0.05, M.darker, -3.4, 0.055, -7.44 + i * 0.08, { edge: false, cast: false });

  /* puddles + reflections */
  const P = 0.058;
  c.puddle(1.6, P, 4.8, 1.15, 0.72);
  c.puddle(-2.6, P, 5.6, 0.8, 0.85);
  c.puddle(7.1, P, 5.2, 0.9, 0.7);
  c.puddle(9.2, 0.05, -2.4, 1.25, 0.72);
  c.puddle(10.3, 0.05, 3.2, 0.95, 0.8);
  c.puddle(10.9, 0.05, -8.2, 1.1, 0.75);
  c.puddle(1.0, 0.05, 11.2, 1.25, 0.6);
  c.puddle(-6.4, 0.05, 10.0, 1.05, 0.68);
  c.puddle(12.0, 0.05, 10.6, 0.9, 0.8);
  c.puddle(-2.8, P, -5.6, 0.7, 0.8);
  reflection(2.3, P + 0.004, 6.3, 1.3, 2.6, 0xffc07a, 0.9);
  reflection(-1.2, P + 0.004, 6.4, 0.9, 2.2, 0xdfe9ff, 0.7);
  reflection(5.05, P + 0.004, 5.6, 0.7, 1.9, 0xffd9a0, 0.8);
  glow(1.8, P + 0.01, 5.6, 4.8, 3.2, 0x2f66d0);

  /* bicycle parking sign */
  {
    const g = new THREE.Group();
    g.position.set(-0.2, 0, 6.6);
    root.add(g);
    tube(g, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1.2, 0), 0.04, poleMat, 6);
    const pl = plane(g, 0.55, 0.55, new THREE.MeshBasicMaterial({ map: TX.stickerTexture('駐', '#2f8fdd'), transparent: true }), 0, 1.45, 0.02);
    pl.renderOrder = 5;
    blob(g, 0, 0, 0.5, 0.062);
  }
}
