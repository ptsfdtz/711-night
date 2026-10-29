import * as THREE from 'three';
import {
  toon, canvasTex, box, cyl, plane, rand, pick,
  ST, SW_Y, M, JP_FONT, ROAD_Y,
} from './core.js';
import {
  vendingFaceTex, streetSignTex, posterTex1, posterTex2,
} from './textures.js';

export const propsAnim = {
  vendingMats: [],
  streetLight: null,
  streetLampMat: null,
  traffic: null,
};

export function buildProps(scene) {
  buildVending(scene);
  buildBikes(scene);
  buildUmbrellas(scene);
  buildTrash(scene);
  buildStreetLight(scene);
  buildPolesAndWires(scene);
  buildSigns(scene);
  buildGuardrail(scene);
  buildAC(scene);
  buildBulletin(scene);
  buildTrafficLight(scene);
}

function buildVending(scene) {
  const defs = [
    { z: -0.6, tex: vendingFaceTex('お茶', '#1a5fb4', '#3a8fd4') },
    { z: -2.1, tex: vendingFaceTex('コーヒー', '#5a2a1a', '#8a4a2a') },
  ];
  for (const d of defs) {
    const g = new THREE.Group();
    box(0.9, 1.95, 0.7, toon(0xe8e8f0), 0, 0.975, 0, g);
    const faceMat = toon(0xffffff, { map: d.tex, emissive: 0xffffff, emissiveIntensity: 0.55 });
    faceMat.emissiveMap = d.tex;
    plane(0.8, 1.6, faceMat, 0, 1.1, 0.36, g);
    propsAnim.vendingMats.push({ mat: faceMat, base: 0.55 });
    box(0.92, 0.1, 0.72, M.coolGlow, 0, 1.92, 0, g);
    box(0.2, 0.4, 0.05, M.metalDark, 0.3, 0.45, 0.38, g);
    box(0.15, 0.1, 0.04, toon(0xff6b6b, { emissive: 0xff4444, emissiveIntensity: 0.6 }), 0.3, 0.55, 0.4, g);
    box(0.5, 0.2, 0.06, M.dark, -0.1, 0.2, 0.38, g);
    const vl = new THREE.PointLight(0x8ad4ff, 0.7, 4, 2);
    vl.position.set(0, 1.2, 0.8);
    g.add(vl);
    g.position.set(ST.x1 + 0.55, SW_Y, d.z);
    scene.add(g);
  }
}

function buildBikes(scene) {
  const g = new THREE.Group();
  const tire = toon(0x1a1a22);
  const frameM = toon(0x3a7ab8);
  const metalM = toon(0xc0c8d4);

  function wheel(x) {
    const w = new THREE.Group();
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.05, 8, 24), tire);
    t.castShadow = true;
    w.add(t);
    for (let i = 0; i < 8; i++) {
      const s = box(0.02, 0.7, 0.02, metalM, 0, 0, 0, w);
      s.rotation.z = (i / 8) * Math.PI;
    }
    const hub = cyl(0.06, 0.06, 0.08, metalM, 0, 0, 0, w, 8);
    hub.rotation.x = Math.PI / 2;
    w.position.set(x, 0.4, 0);
    w.rotation.y = Math.PI / 2;
    return w;
  }
  g.add(wheel(-0.75));
  g.add(wheel(0.75));

  const tube = (x1, y1, x2, y2, r = 0.035) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const m = cyl(r, r, len, frameM, (x1 + x2) / 2, (y1 + y2) / 2, 0, g, 8);
    m.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;
    return m;
  };
  tube(-0.75, 0.4, -0.15, 1.05);
  tube(-0.15, 1.05, 0.35, 0.55);
  tube(0.35, 0.55, -0.35, 0.55);
  tube(-0.35, 0.55, -0.75, 0.4);
  tube(0.35, 0.55, 0.75, 0.4);
  tube(-0.15, 1.05, 0.4, 1.15, 0.03);

  const hb = cyl(0.03, 0.03, 0.5, metalM, 0.42, 1.2, 0, g, 8);
  hb.rotation.x = Math.PI / 2;
  box(0.08, 0.08, 0.5, metalM, 0.42, 1.2, 0, g);
  box(0.35, 0.08, 0.18, toon(0x2a2a35), -0.18, 1.12, 0, g);

  const basket = new THREE.Group();
  box(0.45, 0.28, 0.4, toon(0xd4c8a0), 0, 0, 0, basket);
  box(0.47, 0.05, 0.42, toon(0xc4b890), 0, 0.14, 0, basket);
  basket.position.set(0.55, 1.0, 0);
  g.add(basket);

  box(0.35, 0.05, 0.3, metalM, -0.75, 0.85, 0, g);
  const ks = cyl(0.02, 0.02, 0.5, metalM, -0.3, 0.3, 0.15, g, 6);
  ks.rotation.z = 0.4;
  ks.rotation.x = -0.3;
  box(0.15, 0.1, 0.1, toon(0xff6b6b), -0.4, 0.7, 0.05, g);

  g.position.set(-5.5, SW_Y, 3.0);
  g.rotation.y = 0.55;
  scene.add(g);

  const g2 = g.clone();
  g2.position.set(-9.8, SW_Y, 0.5);
  g2.rotation.y = 1.2;
  g2.scale.setScalar(0.95);
  scene.add(g2);
}

function buildUmbrellas(scene) {
  const g = new THREE.Group();
  cyl(0.28, 0.25, 0.55, toon(0x4a5568), 0, 0.275, 0, g, 12);
  cyl(0.3, 0.3, 0.06, toon(0x3a4458), 0, 0.55, 0, g, 12);
  const umbCols = [0x2a6fd0, 0xe04b4b, 0xf0f0f5, 0x2a9d8f, 0xffd93d];
  for (let i = 0; i < 5; i++) {
    const u = new THREE.Group();
    cyl(0.015, 0.015, 1.0, toon(0x8a8a9a), 0, 0.5, 0, u, 6);
    cyl(0.03, 0.1, 0.7, toon(umbCols[i]), 0, 0.65, 0, u, 8);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 10, Math.PI), toon(0x3a3a4a));
    hook.position.set(0.06, 1.0, 0);
    hook.rotation.z = Math.PI;
    u.add(hook);
    u.position.set(rand(-0.12, 0.12), 0.2, rand(-0.12, 0.12));
    u.rotation.set(rand(-0.15, 0.15), rand(0, 6.28), rand(-0.15, 0.15));
    g.add(u);
  }
  g.position.set(-1.5, SW_Y, 2.9);
  scene.add(g);

  const tu = new THREE.Group();
  cyl(0.015, 0.015, 1.1, toon(0x6a6a7a), 0, 0.55, 0, tu, 6);
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.45, 0.35, 10, 1, true),
    toon(0xaad4ff, { transparent: true, opacity: 0.35, side: THREE.DoubleSide })
  );
  canopy.position.y = 1.0;
  tu.add(canopy);
  tu.position.set(-0.6, SW_Y, 3.1);
  tu.rotation.z = 0.5;
  tu.rotation.x = 0.2;
  scene.add(tu);
}

function buildTrash(scene) {
  const g = new THREE.Group();
  cyl(0.3, 0.28, 0.7, toon(0x3a7a4a), 0, 0.35, 0, g, 12);
  cyl(0.32, 0.32, 0.08, toon(0x2a5a3a), 0, 0.72, 0, g, 12);
  box(0.2, 0.12, 0.05, toon(0x1a1a1a), 0, 0.55, 0.3, g);
  plane(0.3, 0.15, toon(0xffffff, {
    map: canvasTex((ctx, w, h) => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c0392b';
      ctx.font = `bold 40px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('燃える', w / 2, h / 2);
    }, 128, 64),
  }), 0, 0.4, 0.31, g);
  g.position.set(-0.5, SW_Y, 3.05);
  scene.add(g);

  const g2 = new THREE.Group();
  cyl(0.28, 0.26, 0.65, toon(0x2a5a8a), 0, 0.325, 0, g2, 12);
  cyl(0.3, 0.3, 0.07, toon(0x1a4a7a), 0, 0.66, 0, g2, 12);
  g2.position.set(0.3, SW_Y, 3.15);
  scene.add(g2);
}

function buildStreetLight(scene) {
  const lampMat = toon(0xfff4d0, { emissive: 0xffe0a0, emissiveIntensity: 1.3 });
  propsAnim.streetLampMat = lampMat;

  const g = new THREE.Group();
  cyl(0.09, 0.12, 4.8, toon(0x4a5368), 0, 2.4, 0, g, 10);
  const arm = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.06, 8, 12, Math.PI / 2), toon(0x4a5368));
  arm.position.set(0.7, 4.8, 0);
  arm.rotation.z = Math.PI;
  arm.rotation.y = -Math.PI / 2;
  g.add(arm);
  const head = new THREE.Group();
  box(0.7, 0.15, 0.35, toon(0x3a4458), 0, 0, 0, head);
  const bulb = box(0.55, 0.1, 0.28, lampMat, 0, -0.1, 0, head);
  bulb.castShadow = false;
  head.position.set(1.4, 4.85, 0);
  g.add(head);
  cyl(0.2, 0.25, 0.2, toon(0x3a4458), 0, 0.1, 0, g, 10);

  const streetLight = new THREE.PointLight(0xffe0a0, 2.5, 14, 2);
  streetLight.position.set(1.4, 4.7, 0);
  streetLight.castShadow = true;
  streetLight.shadow.mapSize.set(512, 512);
  g.add(streetLight);
  propsAnim.streetLight = streetLight;

  g.position.set(4.3, SW_Y, 3.3);
  scene.add(g);
}

function makePole(scene, x, z, h = 7.2) {
  const g = new THREE.Group();
  cyl(0.12, 0.16, h, toon(0x6a5a4a), 0, h / 2, 0, g, 10);
  for (let i = 0; i < 2; i++) {
    const y = h - 0.5 - i * 0.55;
    box(1.6, 0.1, 0.1, toon(0x5a4a3a), 0, y, 0, g);
    for (const ox of [-0.6, -0.2, 0.2, 0.6]) {
      cyl(0.04, 0.05, 0.12, toon(0xc8d0e0), ox, y + 0.1, 0, g, 6);
    }
  }
  cyl(0.25, 0.25, 0.5, toon(0x4a5568), 0.3, h - 1.8, 0, g, 10);
  box(0.15, 0.8, 0.15, toon(0x4a5568), 0.3, h - 2.5, 0, g);
  for (let i = 0; i < 5; i++) {
    box(0.3, 0.04, 0.04, toon(0x8a8a9a), 0, 2.0 + i * 0.4, 0.14, g);
  }
  g.position.set(x, SW_Y, z);
  scene.add(g);
  return { g, top: new THREE.Vector3(x, SW_Y + h - 0.5, z), x, z, h };
}

function addWire(scene, a, b, sag = 0.6) {
  const pts = [];
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    p.y -= Math.sin(t * Math.PI) * sag;
    pts.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const geo = new THREE.TubeGeometry(curve, 20, 0.02, 5, false);
  const mesh = new THREE.Mesh(geo, toon(0x1a1a22, { outline: false }));
  mesh.castShadow = false;
  scene.add(mesh);
}

function buildPolesAndWires(scene) {
  const poleA = makePole(scene, -10.5, 3.4, 7.0);
  const poleB = makePole(scene, 4.3, -9.5, 7.4);
  const poleC = makePole(scene, 4.85, 3.55, 6.6);

  const offs = [-0.55, -0.18, 0.18, 0.55];
  for (const o of offs) {
    addWire(
      scene,
      new THREE.Vector3(poleA.x + o * 0.15, poleA.top.y, poleA.z + o),
      new THREE.Vector3(poleC.x + o * 0.1, poleC.top.y - 0.4, poleC.z + o * 0.8),
      0.55
    );
    addWire(
      scene,
      new THREE.Vector3(poleC.x + o, poleC.top.y - 0.5, poleC.z + o * 0.1),
      new THREE.Vector3(poleB.x + o * 0.8, poleB.top.y, poleB.z + o),
      0.7
    );
  }
  addWire(
    scene,
    new THREE.Vector3(poleA.x + 0.3, poleA.top.y - 1.2, poleA.z),
    new THREE.Vector3(ST.x0 + 0.5, ST.roofTop + 0.2, 1.0),
    0.4
  );
  addWire(
    scene,
    new THREE.Vector3(poleC.x, poleC.top.y - 1.5, poleC.z - 0.3),
    new THREE.Vector3(ST.x1 - 0.5, ST.roofTop + 0.15, -1.0),
    0.3
  );

  const g = new THREE.Group();
  plane(1.4, 0.35, toon(0xffffff, { map: streetSignTex }), 0, 0, 0, g);
  box(1.45, 0.08, 0.05, M.metal, 0, 0.2, 0, g);
  box(1.45, 0.08, 0.05, M.metal, 0, -0.2, 0, g);
  g.position.set(poleA.x + 0.7, SW_Y + 3.2, poleA.z + 0.2);
  g.rotation.y = 0.3;
  scene.add(g);
}

function buildSigns(scene) {
  const g = new THREE.Group();
  cyl(0.04, 0.04, 2.2, M.metal, 0, 1.1, 0, g, 8);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.35, 24), toon(0xd03030));
  disc.position.set(0, 2.1, 0.03);
  g.add(disc);
  const disc2 = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.26, 24), toon(0xffffff));
  disc2.position.set(0, 2.1, 0.05);
  g.add(disc2);
  g.position.set(4.6, SW_Y, -3.5);
  g.rotation.y = Math.PI / 2 + 0.2;
  scene.add(g);

  const g2 = new THREE.Group();
  cyl(0.04, 0.04, 2.0, M.metal, -0.4, 1.0, 0, g2, 8);
  cyl(0.04, 0.04, 2.0, M.metal, 0.4, 1.0, 0, g2, 8);
  box(1.3, 0.7, 0.06, toon(0x2a6fd0), 0, 1.9, 0, g2);
  plane(1.1, 0.5, toon(0xffffff, {
    map: canvasTex((ctx, w, h) => {
      ctx.fillStyle = '#2a6fd0';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = `bold 32px ${JP_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('駐車場', w / 2, h * 0.35);
      ctx.font = `bold 44px ${JP_FONT}`;
      ctx.fillText('P', w / 2, h * 0.7);
    }, 256, 140),
  }), 0, 1.9, 0.04, g2);
  g2.position.set(-7.5, SW_Y, 3.4);
  g2.rotation.y = 0.1;
  scene.add(g2);
}

function buildGuardrail(scene) {
  const segments = [
    { x0: -11, z0: 3.6, x1: -8.6, z1: 3.6 },
    { x0: 5.4, z0: -11, x1: 5.4, z1: -6 },
    { x0: 5.4, z0: -5, x1: 5.4, z1: -1.5 },
  ];
  for (const s of segments) {
    const g = new THREE.Group();
    const len = Math.hypot(s.x1 - s.x0, s.z1 - s.z0);
    const angle = Math.atan2(s.z1 - s.z0, s.x1 - s.x0);
    for (const y of [0.55, 0.85]) {
      box(len, 0.08, 0.1, toon(0xd8dce4), 0, y, 0, g);
    }
    box(len, 0.18, 0.06, toon(0xc8ccd4), 0, 0.7, 0, g);
    const posts = Math.max(2, Math.floor(len / 1.2));
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      box(0.1, 0.9, 0.1, toon(0x9aa3b0), -len / 2 + t * len, 0.45, 0, g);
    }
    g.position.set((s.x0 + s.x1) / 2, SW_Y, (s.z0 + s.z1) / 2);
    g.rotation.y = -angle;
    scene.add(g);
  }
}

function buildAC(scene) {
  const g = new THREE.Group();
  box(1.1, 0.75, 0.5, toon(0xd8dce4), 0, 0.375, 0, g);
  const fan = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), toon(0x3a4254));
  fan.position.set(0, 0.4, 0.26);
  g.add(fan);
  for (let i = 0; i < 4; i++) {
    const bl = box(0.06, 0.5, 0.02, toon(0x6a7386), 0, 0.4, 0.27, g);
    bl.rotation.z = (i / 4) * Math.PI;
  }
  box(1.15, 0.06, 0.55, M.metalDark, 0, 0.78, 0, g);
  box(0.08, 0.3, 0.08, M.metalDark, -0.4, -0.05, 0, g);
  box(0.08, 0.3, 0.08, M.metalDark, 0.4, -0.05, 0, g);
  g.position.set(ST.x1 + 0.35, SW_Y + 1.1, -4.5);
  g.rotation.y = Math.PI / 2;
  scene.add(g);

  const g2 = new THREE.Group();
  box(0.9, 0.6, 0.45, toon(0xd0d4dc), 0, 0.3, 0, g2);
  const fan2 = new THREE.Mesh(new THREE.CircleGeometry(0.22, 20), toon(0x3a4254));
  fan2.position.set(0, 0.3, 0.23);
  g2.add(fan2);
  g2.position.set(-4.0, ST.roofTop + 0.1, -3.5);
  scene.add(g2);
}

function buildBulletin(scene) {
  const g = new THREE.Group();
  box(1.3, 1.0, 0.1, M.wood, 0, 1.4, 0, g);
  box(1.15, 0.85, 0.06, toon(0xf5f0e0), 0, 1.4, 0.06, g);
  const posters = [posterTex1, posterTex1, posterTex2];
  for (let i = 0; i < 3; i++) {
    const p = plane(0.32, 0.4, toon(0xffffff, { map: posters[i] }), -0.36 + i * 0.36, 1.4, 0.1, g);
    p.rotation.z = rand(-0.05, 0.05);
  }
  cyl(0.06, 0.07, 1.0, toon(0x6a5a4a), -0.5, 0.5, 0, g, 8);
  cyl(0.06, 0.07, 1.0, toon(0x6a5a4a), 0.5, 0.5, 0, g, 8);
  box(1.4, 0.12, 0.3, M.roofDark, 0, 1.95, 0.1, g);
  g.position.set(-8.5, SW_Y, 3.2);
  g.rotation.y = 0.15;
  scene.add(g);
}

function buildTrafficLight(scene) {
  const g = new THREE.Group();
  cyl(0.08, 0.1, 3.2, toon(0x4a5368), 0, 1.6, 0, g, 10);
  box(0.35, 1.0, 0.3, toon(0x2a3040), 0, 3.5, 0, g);

  const cols = [0xff4444, 0xffcc33, 0x44ff88];
  const mats = cols.map((c) => toon(c, { emissive: c, emissiveIntensity: 0.15 }));
  const orbs = mats.map((m, i) => {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), m);
    o.position.set(0, 3.85 - i * 0.3, 0.16);
    g.add(o);
    return o;
  });

  const tl = new THREE.PointLight(0xff4444, 0.4, 5, 2);
  tl.position.set(0, 3.85, 0.4);
  g.add(tl);

  g.position.set(10.4, ROAD_Y, 8.8);
  g.rotation.y = -Math.PI * 0.75;
  scene.add(g);

  propsAnim.traffic = { mats, orbs, light: tl, phase: 0, timer: 0 };
}
