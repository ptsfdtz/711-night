import * as THREE from 'three';
import { PAL } from '../core/palette.js';
import * as TX from '../core/textures.js';
import { STREET } from '../core/layout.js';
import { makeGlow } from '../core/materials.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function mesh(geo, mat, x, y, z, { cast = false, receive = false, rot = null } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

/* ------------------------------------------------------------------ *
 *  电线杆 + 电线
 * ------------------------------------------------------------------ */
function catenary(a, b, sag, seg = 18) {
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    p.y -= Math.sin(t * Math.PI) * sag;
    pts.push(p);
  }
  return new THREE.CatmullRomCurve3(pts);
}

function buildUtilityPole(scene, mats) {
  const g = new THREE.Group();
  g.name = 'utility-pole';
  const px = -4.5, pz = 2.15;

  const pole = mesh(new THREE.CylinderGeometry(0.075, 0.105, 7.0, 10), mats.concrete, px, STREET.sidewalkY + 3.5, pz, { cast: true });
  g.add(pole);
  // 杆根
  g.add(mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.3, 10), mats.concreteDark, px, STREET.sidewalkY + 0.15, pz, { cast: true }));

  // 横担
  const armY = [5.55, 6.25];
  for (const ay of armY) {
    g.add(mesh(box(1.5, 0.08, 0.09), mats.steelDark, px, STREET.sidewalkY + ay, pz, { cast: true }));
    for (const ox of [-0.62, 0, 0.62]) {
      g.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.13, 8), mats.white, px + ox, STREET.sidewalkY + ay + 0.1, pz));
    }
  }
  // 变压器
  g.add(mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.6, 12), mats.steel, px + 0.34, STREET.sidewalkY + 4.5, pz, { cast: true }));
  g.add(mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.06, 12), mats.steelDark, px + 0.34, STREET.sidewalkY + 4.82, pz));
  // 路灯（杆上灯）
  g.add(mesh(box(0.16, 0.3, 0.5), mats.frameDark, px - 0.5, STREET.sidewalkY + 4.05, pz, { cast: true }));
  g.add(mesh(box(0.14, 0.06, 0.4), mats.lampGlass, px - 0.5, STREET.sidewalkY + 3.88, pz));

  // 杆上贴的广告
  const adTex = TX.poleAdTexture();
  const adMat = new THREE.MeshBasicMaterial({ map: adTex, transparent: true, toneMapped: false });
  adMat.userData.outlineParameters = { visible: false };
  const ad = mesh(new THREE.CylinderGeometry(0.108, 0.108, 1.5, 14, 1, true, 0.7, 2.2), adMat, px, STREET.sidewalkY + 2.1, pz);
  g.add(ad);

  // —— 电线 ——
  const wireMat = new THREE.MeshToonMaterial({ color: 0x14181f, gradientMap: mats.ramp });
  wireMat.userData.outlineParameters = { thickness: 0.0012 };
  const anchors = [
    { y: 5.65, off: [-0.62, 0, 0.62], end: [[11, 5.9, 6.0], [11, 5.6, 3.0], [11, 5.2, 0.0]] },
    { y: 6.35, off: [-0.62, 0, 0.62], end: [[11, 6.1, -1.5], [11, 5.9, -3.0], [11, 5.6, -4.5]] },
  ];
  for (const a of anchors) {
    a.off.forEach((ox, i) => {
      const from = new THREE.Vector3(px + ox, STREET.sidewalkY + a.y, pz);
      const to = new THREE.Vector3(a.end[i][0], a.end[i][1], a.end[i][2]);
      const curve = catenary(from, to, 0.75 + i * 0.12);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.011, 4, false), wireMat);
      g.add(tube);
    });
  }
  // 沿小巷方向的电线
  {
    const from = new THREE.Vector3(px - 0.62, STREET.sidewalkY + 5.65, pz);
    const to = new THREE.Vector3(px - 2.6, STREET.sidewalkY + 5.2, -8.5);
    const curve = catenary(from, to, 0.6);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 18, 0.011, 4, false), wireMat));
  }

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  路灯
 * ------------------------------------------------------------------ */
function buildStreetLamp(scene, mats, rig, { x, z, height = 4.2, armDir = -1, warm = false, lightOn = true }) {
  const g = new THREE.Group();
  g.name = 'street-lamp';
  const y0 = STREET.sidewalkY;

  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.24, 10), mats.concreteDark, x, y0 + 0.12, z, { cast: true }));
  g.add(mesh(new THREE.CylinderGeometry(0.055, 0.085, height, 10), mats.steelDark, x, y0 + height / 2, z, { cast: true }));

  // 弯臂
  const armPts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    armPts.push(new THREE.Vector3(x + armDir * t * 0.95, y0 + height + Math.sin(t * Math.PI * 0.5) * 0.42, z));
  }
  const arm = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(armPts), 14, 0.048, 6, false),
    mats.steelDark
  );
  arm.castShadow = true;
  g.add(arm);

  // 灯头
  const hx = x + armDir * 0.95;
  const hy = y0 + height + 0.42;
  g.add(mesh(box(0.56, 0.14, 0.3), mats.frameDark, hx, hy, z, { cast: true }));
  const lens = mesh(box(0.46, 0.05, 0.24), warm ? mats.lampGlass : mats.lampGlass, hx, hy - 0.09, z);
  g.add(lens);
  const glow = makeGlow(warm ? PAL.warmLightHot : PAL.lampCool, 2.4, 0.55);
  glow.position.set(hx, hy - 0.12, z);
  g.add(glow);

  const color = warm ? 0xffe0b0 : PAL.lampCool;
  const light = new THREE.PointLight(color, warm ? 12 : 20, warm ? 7 : 10, 1.7);
  light.position.set(hx, hy - 0.2, z);
  g.add(light);

  // 地面光池
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 28),
    new THREE.MeshBasicMaterial({
      map: TX.glowTexture(),
      color,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(hx, STREET.roadY + 0.03, z);
  pool.renderOrder = 2;
  g.add(pool);

  // 地面反光拖尾
  const streak = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 3.4),
    new THREE.MeshBasicMaterial({
      map: TX.reflectionStreakTexture(),
      color,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    })
  );
  streak.rotation.x = -Math.PI / 2;
  streak.rotation.z = Math.PI;
  streak.position.set(hx, STREET.roadY + 0.035, z + 1.0);
  streak.renderOrder = 2;
  g.add(streak);

  if (lightOn) {
    rig.add((t) => {
      const f = 1 + Math.sin(t * 2.3 + x) * 0.03 + Math.sin(t * 11.0) * 0.012;
      light.intensity = (warm ? 12 : 20) * f;
      glow.material.opacity = 0.55 * f;
    });
  }

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  交通信号灯
 * ------------------------------------------------------------------ */
function buildTrafficLight(scene, mats, rig) {
  const g = new THREE.Group();
  g.name = 'traffic-light';
  const px = 5.45, pz = -1.9;
  const y0 = STREET.sidewalkY;

  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.11, 5.4, 10), mats.steelDark, px, y0 + 2.7, pz, { cast: true }));
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.2, 10), mats.concreteDark, px, y0 + 0.1, pz, { cast: true }));
  // 横臂
  g.add(mesh(box(1.9, 0.09, 0.09), mats.steelDark, px - 0.95, y0 + 5.3, pz, { cast: true }));
  g.add(mesh(box(0.9, 0.05, 0.05), mats.steelDark, px - 0.45, y0 + 4.95, pz));

  // 灯箱
  const hx = px - 1.75;
  const hy = y0 + 4.75;
  g.add(mesh(box(0.34, 0.92, 0.3), mats.coolerFrame, hx, hy, pz, { cast: true }));
  g.add(mesh(box(0.4, 0.06, 0.34), mats.coolerFrame, hx, hy + 0.49, pz));

  const lensGeo = new THREE.CircleGeometry(0.1, 14);
  const lenses = {};
  const colors = { red: PAL.trafficRed, amber: PAL.trafficAmber, green: PAL.trafficGreen };
  const names = ['red', 'amber', 'green'];
  names.forEach((n, i) => {
    const yy = hy + 0.28 - i * 0.28;
    const lens = mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x15181e }), hx - 0.16, yy, pz, { rot: [0, -Math.PI / 2, 0] });
    lens.material.userData.outlineParameters = { visible: false };
    g.add(lens);
    const glow = makeGlow(colors[n], 0.85, 0);
    glow.position.set(hx - 0.24, yy, pz);
    g.add(glow);
    lenses[n] = { lens, glow, color: colors[n] };
  });

  const light = new THREE.PointLight(PAL.trafficRed, 3, 4.5, 1.6);
  light.position.set(hx - 0.3, hy, pz);
  g.add(light);

  // 红 → 绿 循环
  let phase = 0;
  let current = 'red';
  rig.add((t, dt) => {
    phase -= dt;
    if (phase <= 0) {
      phase = 7 + Math.random() * 5;
      current = current === 'red' ? 'green' : 'red';
    }
    for (const n of names) {
      const on = n === current;
      const l = lenses[n];
      l.glow.material.opacity = on ? 0.85 : 0;
      l.lens.material.color.setHex(on ? l.color : 0x15181e);
    }
    light.color.setHex(lenses[current].color);
    light.intensity = 2.6 + Math.sin(t * 3.1) * 0.25;
  });

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  自动贩卖机
 * ------------------------------------------------------------------ */
function buildVendingMachine(scene, mats, rig) {
  const g = new THREE.Group();
  g.name = 'vending';
  // 摆在店东侧人行道，正面朝东（支路方向）
  // 机身：宽 1.12 沿 Z（南北），深 0.76 沿 X（东西）
  const x = 2.12, z = -2.35, y0 = STREET.sidewalkY;
  const W = 1.12, H = 1.98, D = 0.76;

  g.add(mesh(box(D, H, W), mats.vendingBody, x, y0 + H / 2, z, { cast: true }));
  // 正面（朝 +X）
  const frontMat = new THREE.MeshBasicMaterial({ map: TX.vendingFrontTexture(), toneMapped: false });
  frontMat.userData.outlineParameters = { visible: false };
  const front = mesh(new THREE.PlaneGeometry(W - 0.06, H - 0.06), frontMat, x + D / 2 + 0.002, y0 + H / 2, z);
  front.rotation.y = Math.PI / 2;
  g.add(front);
  // 两侧广告板（避免大面积裸机身）
  const sideMat = new THREE.MeshBasicMaterial({ map: TX.vendingSideTexture(), toneMapped: false });
  sideMat.userData.outlineParameters = { visible: false };
  for (const s of [1, -1]) {
    const side = mesh(new THREE.PlaneGeometry(D - 0.05, H - 0.08), sideMat, x, y0 + H / 2, z + s * (W / 2 + 0.002));
    if (s < 0) side.rotation.y = Math.PI;
    g.add(side);
  }
  // 背面
  const backMat = new THREE.MeshBasicMaterial({ color: 0x8f2a19, toneMapped: false });
  backMat.userData.outlineParameters = { visible: false };
  const back = mesh(new THREE.PlaneGeometry(W - 0.06, H - 0.06), backMat, x - D / 2 - 0.002, y0 + H / 2, z);
  back.rotation.y = -Math.PI / 2;
  g.add(back);
  // 顶盖 / 底座
  g.add(mesh(box(D + 0.04, 0.07, W + 0.04), mats.steelDark, x, y0 + H + 0.03, z, { cast: true }));
  g.add(mesh(box(D + 0.02, 0.1, W + 0.02), mats.steelDark, x, y0 + 0.05, z));

  // 灯箱顶灯
  const glow = makeGlow(PAL.vendingGlow, 2.4, 0.5);
  glow.position.set(x + 0.2, y0 + H + 0.1, z);
  g.add(glow);

  const light = new THREE.PointLight(0xffdcae, 9, 4.5, 1.7);
  light.position.set(x + D / 2 + 0.35, y0 + 1.4, z);
  g.add(light);

  // 地面光斑
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(1.25, 24),
    new THREE.MeshBasicMaterial({
      map: TX.glowTexture(), color: 0xffd9a0, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x + 0.85, STREET.roadY + 0.035, z);
  pool.renderOrder = 2;
  g.add(pool);

  const streak = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 2.6),
    new THREE.MeshBasicMaterial({
      map: TX.reflectionStreakTexture(), color: 0xffcf90, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    })
  );
  streak.rotation.x = -Math.PI / 2;
  streak.position.set(x + 1.5, STREET.roadY + 0.04, z);
  streak.renderOrder = 2;
  g.add(streak);

  rig.add((t) => {
    const f = 1 + Math.sin(t * 5.3) * 0.02;
    light.intensity = 9 * f;
    glow.material.opacity = 0.5 * f;
  });

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  自行车
 * ------------------------------------------------------------------ */
function makeBicycle(mats, frameColor) {
  const b = new THREE.Group();
  const wheelMat = mats.rubber;
  const rimMat = mats.steel;

  const wheel = (wx, wz) => {
    const w = new THREE.Group();
    w.add(mesh(new THREE.TorusGeometry(0.32, 0.035, 6, 20), wheelMat, 0, 0, 0, { rot: [0, Math.PI / 2, 0] }));
    w.add(mesh(new THREE.TorusGeometry(0.28, 0.012, 4, 18), rimMat, 0, 0, 0, { rot: [0, Math.PI / 2, 0] }));
    for (let i = 0; i < 6; i++) {
      const spoke = mesh(box(0.008, 0.55, 0.008), rimMat, 0, 0, 0, { rot: [0, Math.PI / 2, i * 0.52] });
      w.add(spoke);
    }
    w.position.set(wx, 0.33, wz);
    return w;
  };
  b.add(wheel(-0.52, 0));
  b.add(wheel(0.52, 0));

  const frameMat = new THREE.MeshToonMaterial({ color: frameColor, gradientMap: mats.ramp });
  const tube = (x1, y1, z1, x2, y2, z2, r = 0.028) => {
    const from = new THREE.Vector3(x1, y1, z1);
    const to = new THREE.Vector3(x2, y2, z2);
    const len = from.distanceTo(to);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), frameMat);
    m.position.copy(from).lerp(to, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    m.castShadow = true;
    return m;
  };
  b.add(tube(-0.52, 0.33, 0, -0.08, 0.72, 0));
  b.add(tube(-0.08, 0.72, 0, 0.3, 0.36, 0));
  b.add(tube(-0.08, 0.72, 0, 0.52, 0.33, 0));
  b.add(tube(-0.52, 0.33, 0, 0.3, 0.36, 0));
  b.add(tube(-0.08, 0.72, 0, -0.2, 0.36, 0));
  // 车把
  b.add(tube(0.46, 0.9, 0, 0.54, 0.95, 0, 0.022));
  b.add(mesh(box(0.05, 0.04, 0.44), mats.steel, 0.54, 0.95, 0));
  // 坐垫
  b.add(mesh(box(0.26, 0.07, 0.13), mats.black, -0.2, 0.92, 0));
  // 挡泥板
  b.add(mesh(new THREE.TorusGeometry(0.36, 0.05, 4, 12, Math.PI), mats.bicycleAccent, 0.52, 0.33, 0, { rot: [0, Math.PI / 2, 0] }));
  // 车篮
  b.add(mesh(box(0.3, 0.2, 0.28), mats.plasticBlue, 0.58, 0.78, 0, { cast: true }));
  return b;
}

function buildBicycles(scene, mats) {
  const g = new THREE.Group();
  g.name = 'bicycles';

  const b1 = makeBicycle(mats, PAL.bicycle);
  b1.position.set(-3.05, STREET.sidewalkY, 1.92);
  b1.rotation.set(0, 0.18, 0.12);
  g.add(b1);

  const b2 = makeBicycle(mats, PAL.bicycleAccent);
  b2.position.set(-4.7, 0, -0.9);
  b2.rotation.set(0, -1.5, 0.05);
  g.add(b2);

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  雨伞架 + 垃圾桶
 * ------------------------------------------------------------------ */
function buildUmbrellaStand(scene, mats) {
  const g = new THREE.Group();
  g.name = 'umbrella-stand';
  const x = -1.28, z = 2.0, y0 = STREET.sidewalkY;

  g.add(mesh(box(0.44, 0.04, 0.32), mats.steelDark, x, y0 + 0.02, z));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12, 1, true), mats.steel, x, y0 + 0.26, z, { cast: true }));
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 12), mats.steel, x, y0 + 0.52, z));
  // 伞
  const umbCols = [0x2e9e52, 0xd13b30, 0x3f7fbf, 0xf3c33f];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const px = x + Math.cos(a) * 0.08;
    const pz = z + Math.sin(a) * 0.08;
    const um = new THREE.Group();
    um.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.85, 8), new THREE.MeshToonMaterial({ color: umbCols[i], gradientMap: mats.ramp }), 0, 0.42, 0));
    um.add(mesh(new THREE.ConeGeometry(0.05, 0.2, 8), mats.steelDark, 0, 0.92, 0));
    um.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 5), mats.steel, 0, 0.06, 0));
    um.position.set(px, y0, pz);
    um.rotation.set(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12);
    g.add(um);
  }
  scene.add(g);
  return g;
}

function buildTrashBins(scene, mats) {
  const g = new THREE.Group();
  g.name = 'trash-bins';
  const y0 = STREET.sidewalkY;

  // 塑料分类垃圾桶（常见于日本街角）
  const binColors = [0x3f7fbf, 0x4f9e63, 0xe0a02c];
  binColors.forEach((c, i) => {
    const x = -1.86 - i * 0.42;
    const z = 2.05;
    const mat = new THREE.MeshToonMaterial({ color: c, gradientMap: mats.ramp });
    g.add(mesh(box(0.36, 0.74, 0.36), mat, x, y0 + 0.37, z, { cast: true }));
    g.add(mesh(box(0.4, 0.06, 0.4), mats.steelDark, x, y0 + 0.76, z, { cast: true }));
    g.add(mesh(box(0.22, 0.1, 0.02), mats.black, x, y0 + 0.6, z + 0.185));
  });

  // 金属网状垃圾桶
  const x = -3.35, z = 2.06;
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.72, 12, 1, true), mats.steelDark, x, y0 + 0.36, z, { cast: true }));
  g.add(mesh(new THREE.TorusGeometry(0.22, 0.02, 4, 14), mats.steel, x, y0 + 0.72, z, { rot: [Math.PI / 2, 0, 0] }));
  g.add(mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.03, 12), mats.black, x, y0 + 0.05, z));

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  公告栏
 * ------------------------------------------------------------------ */
function buildBulletinBoard(scene, mats) {
  const g = new THREE.Group();
  g.name = 'bulletin';
  const x = -5.35, z = 1.92, y0 = STREET.sidewalkY;

  g.add(mesh(box(0.06, 1.5, 0.06), mats.steelDark, x - 0.72, y0 + 0.75, z, { cast: true }));
  g.add(mesh(box(0.06, 1.5, 0.06), mats.steelDark, x + 0.72, y0 + 0.75, z, { cast: true }));
  g.add(mesh(box(1.62, 1.12, 0.1), mats.frameDark, x, y0 + 1.02, z, { cast: true }));
  const tex = TX.bulletinTexture();
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  mat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(1.5, 1.0), mat, x, y0 + 1.02, z + 0.052));
  // 顶棚
  g.add(mesh(box(1.74, 0.05, 0.36), mats.brandGreen, x, y0 + 1.63, z + 0.1, { cast: true }));

  // 灯
  const lamp = mesh(box(0.5, 0.06, 0.16), mats.lampGlass, x, y0 + 1.56, z + 0.12);
  g.add(lamp);
  const l = new THREE.PointLight(0xfff0cc, 4, 3.4, 1.7);
  l.position.set(x, y0 + 1.5, z + 0.22);
  g.add(l);

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  路牌 / 标识
 * ------------------------------------------------------------------ */
function buildRoadSigns(scene, mats) {
  const g = new THREE.Group();
  g.name = 'road-signs';
  const y0 = STREET.sidewalkY;

  // 街角路名牌
  const sx = 2.48, sz = 1.45;
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.3, 8), mats.steel, sx, y0 + 1.15, sz, { cast: true }));
  const signMat = new THREE.MeshBasicMaterial({ map: TX.roadSignTexture(), toneMapped: false });
  signMat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(1.1, 0.28), signMat, sx, y0 + 2.1, sz + 0.03));
  g.add(mesh(box(1.18, 0.34, 0.05), mats.frameDark, sx, y0 + 2.1, sz - 0.01));

  // 禁停标志
  const nx = -4.9, nz = 2.2;
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.0, 8), mats.steel, nx, y0 + 1.0, nz));
  const npMat = new THREE.MeshBasicMaterial({ map: TX.noParkingTexture(), transparent: true, toneMapped: false });
  npMat.userData.outlineParameters = { visible: false };
  const np = mesh(new THREE.PlaneGeometry(0.5, 0.5), npMat, nx, y0 + 1.9, nz + 0.03);
  g.add(np);
  const npBack = mesh(new THREE.PlaneGeometry(0.5, 0.5), npMat, nx, y0 + 1.9, nz - 0.03);
  npBack.rotation.y = Math.PI;
  g.add(npBack);

  // 停车场 P 标志
  const px = -5.7, pz = 0.85;
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.045, 2.0, 8), mats.steel, px, y0 + 1.0, pz));
  const pMat = new THREE.MeshBasicMaterial({ map: TX.parkingSignTexture(), toneMapped: false });
  pMat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(0.46, 0.46), pMat, px, y0 + 2.05, pz + 0.03));

  // 停车位入口的小牌
  g.add(mesh(box(0.5, 0.16, 0.03), mats.brandGreen, -5.3, y0 + 1.0, 0.55));

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  街角护栏
 * ------------------------------------------------------------------ */
function buildGuardrail(scene, mats) {
  const g = new THREE.Group();
  g.name = 'guardrail';
  const y0 = STREET.sidewalkY;
  const railMat = new THREE.MeshToonMaterial({ color: 0xc4cad2, gradientMap: mats.ramp });

  const post = (x, z) => {
    g.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.72, 8), railMat, x, y0 + 0.36, z, { cast: true }));
  };
  const railRun = (x1, z1, x2, z2, n) => {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      post(x1 + (x2 - x1) * t, z1 + (z2 - z1) * t);
    }
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ang = Math.atan2(z2 - z1, x2 - x1);
    for (const yy of [0.62, 0.34]) {
      const rail = mesh(box(len, 0.07, 0.07), railMat, (x1 + x2) / 2, y0 + yy, (z1 + z2) / 2, { cast: true });
      rail.rotation.y = -ang;
      g.add(rail);
    }
  };

  // 东侧人行道外沿（沿支路路缘）
  railRun(2.62, -0.62, 2.62, 2.45, 6);
  // 街角转折：沿主街路缘折向西北，止于斑马线缺口
  railRun(2.62, 2.45, 2.52, 2.52, 1);
  railRun(2.52, 2.52, 1.62, 2.52, 2);

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  铁丝网 / 围墙
 * ------------------------------------------------------------------ */
function buildFences(scene, mats) {
  const g = new THREE.Group();
  g.name = 'fences';

  const tex = TX.chainLinkTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    color: 0x39424e,
    transparent: true,
    opacity: 0.72,
    alphaTest: 0.2,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  mat.userData.outlineParameters = { visible: false };

  const run = (x1, z1, x2, z2, h = 1.6) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ang = Math.atan2(z2 - z1, x2 - x1);
    const cx = (x1 + x2) / 2;
    const cz = (z1 + z2) / 2;
    // 每个网段单独复制贴图，保证铁丝菱形大小一致
    const t = tex.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(Math.max(1, Math.round(len / 1.1)), Math.max(1, Math.round(h / 1.1)));
    const m2 = mat.clone();
    m2.map = t;
    const p = mesh(new THREE.PlaneGeometry(len, h), m2, cx, h / 2 + 0.17, cz);
    p.rotation.y = -ang;
    g.add(p);
    // 支柱
    const n = Math.max(2, Math.round(len / 1.8));
    for (let i = 0; i <= n; i++) {
      const t2 = i / n;
      g.add(mesh(new THREE.CylinderGeometry(0.04, 0.045, h + 0.18, 6), mats.steelDark,
        x1 + (x2 - x1) * t2, (h + 0.18) / 2 + 0.08, z1 + (z2 - z1) * t2, { cast: true }));
    }
    // 上下横杆
    for (const yy of [0.2, h + 0.16]) {
      const r = mesh(box(len, 0.05, 0.05), mats.steelDark, cx, yy, cz);
      r.rotation.y = -ang;
      g.add(r);
    }
  };

  // 西侧空地外围（留出小巷入口）
  run(-5.9, -5.9, -5.9, 2.55, 1.6);
  run(-5.9, -5.9, 2.6, -5.9, 1.6);
  run(-5.9, -3.4, -3.75, -3.4, 1.5);

  // 沿小巷的混凝土矮墙（形成小巷感）
  const wall = mesh(box(0.14, 0.95, 8.45), mats.concrete, -5.93, 0.475, -1.675, { cast: true, receive: true });
  g.add(wall);
  g.add(mesh(box(0.22, 0.08, 8.45), mats.concreteDark, -5.93, 0.99, -1.675));

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  凸面镜 / 消火栓 / 杂物
 * ------------------------------------------------------------------ */
function buildMisc(scene, mats, rig) {
  const g = new THREE.Group();
  g.name = 'misc';
  const y0 = STREET.sidewalkY;

  // 路口凸面镜
  const mx = -5.45, mz = 1.2;
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.6, 8), mats.steel, mx, y0 + 1.3, mz, { cast: true }));
  const mirrorMat = new THREE.MeshPhongMaterial({ color: 0xb8c8d8, shininess: 220, specular: 0xffffff });
  const mir = mesh(new THREE.SphereGeometry(0.34, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.45), mirrorMat, mx, y0 + 2.5, mz, { rot: [-0.9, 0.6, 0] });
  g.add(mir);
  g.add(mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.06, 16), mats.brandOrange, mx, y0 + 2.5, mz, { rot: [-0.9, 0.6, 0] }));

  // 消火栓
  const hx = 2.32, hz = -2.6;
  const redMat = new THREE.MeshToonMaterial({ color: PAL.brandRed, gradientMap: mats.ramp });
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.62, 10), redMat, hx, y0 + 0.31, hz, { cast: true }));
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.12, 10), redMat, hx, y0 + 0.68, hz));
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 6), mats.steel, hx + 0.1, y0 + 0.42, hz, { rot: [0, 0, Math.PI / 2] }));
  g.add(mesh(box(0.16, 0.16, 0.02), mats.white, hx, y0 + 0.44, hz + 0.1));

  // 木箱堆（后场）
  for (let i = 0; i < 4; i++) {
    g.add(mesh(box(0.62, 0.42, 0.5), mats.wood, -2.3 + (i % 2) * 0.1, y0 + 0.21 + Math.floor(i / 2) * 0.44, -4.4 + (i % 2) * 0.66, { cast: true }));
  }
  // 油桶
  g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.75, 12), mats.rust, -3.1, y0 + 0.375, -5.2, { cast: true }));
  g.add(mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.05, 12), mats.steelDark, -3.1, y0 + 0.75, -5.2));

  // 自行车棚 / 停放的车
  const shed = new THREE.Group();
  shed.add(mesh(box(1.5, 0.06, 2.2), mats.roofTrim, 0, 1.15, 0, { cast: true }));
  for (const [sx, sz] of [[-0.7, -1.0], [0.7, -1.0], [-0.7, 1.0], [0.7, 1.0]]) {
    shed.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 6), mats.steelDark, sx, 0.57, sz, { cast: true }));
  }
  shed.position.set(-4.8, y0, -4.3);
  shed.rotation.y = 0.2;
  g.add(shed);

  // 散落的落叶
  const rnd = TX.rng(777);
  const leafMat = new THREE.MeshToonMaterial({ color: 0x8a6a3a, gradientMap: mats.ramp, side: THREE.DoubleSide });
  leafMat.userData.outlineParameters = { visible: false };
  const leafGeo = new THREE.PlaneGeometry(0.09, 0.13);
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, 60);
  const d = new THREE.Object3D();
  for (let i = 0; i < 60; i++) {
    const side = rnd();
    let px, pz;
    if (side < 0.5) { px = -5.6 + rnd() * 1.8; pz = -5.6 + rnd() * 7; }
    else { px = -3.7 + rnd() * 5.2; pz = -5.7 + rnd() * 1.8; }
    d.position.set(px, 0.19, pz);
    d.rotation.set(-Math.PI / 2, 0, rnd() * Math.PI * 2);
    d.scale.setScalar(0.7 + rnd() * 0.6);
    d.updateMatrix();
    leaves.setMatrixAt(i, d.matrix);
  }
  leaves.instanceMatrix.needsUpdate = true;
  g.add(leaves);

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  暖色灯光洒在人行道上的光池
 * ------------------------------------------------------------------ */
function buildWarmPools(scene) {
  const g = new THREE.Group();
  g.name = 'warm-pools';

  const pool = (x, z, r, color, op) => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(r, 32),
      new THREE.MeshBasicMaterial({
        map: TX.glowTexture(), color, transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, STREET.roadY + 0.032, z);
    m.renderOrder = 2;
    g.add(m);
    return m;
  };

  pool(0, 2.15, 2.3, 0xffca82, 0.34);
  pool(1.0, 2.3, 1.6, 0xffbe72, 0.24);
  pool(-0.2, 1.9, 1.7, 0xffd39a, 0.22);
  pool(-1.9, 2.0, 1.5, 0xffc98a, 0.18);
  pool(2.05, -0.7, 1.5, 0xffcf90, 0.2);

  // 街道上的竖向反光（便利店暖光洒到湿路面）
  const streak = (x, z, w, l, color, op, rot = 0) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, l),
      new THREE.MeshBasicMaterial({
        map: TX.reflectionStreakTexture(), color, transparent: true, opacity: op,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = rot;
    m.position.set(x, STREET.roadY + 0.038, z);
    m.renderOrder = 2;
    g.add(m);
  };
  streak(0.0, 3.5, 2.6, 2.8, 0xffbe72, 0.4, 0.1);
  streak(0.4, 3.2, 1.3, 2.2, 0xffd8a0, 0.3, -0.15);
  streak(1.9, 2.9, 0.9, 2.4, 0xffcf90, 0.34, 0.05);
  streak(-1.6, 3.3, 1.2, 2.0, 0xffcf90, 0.24, -0.08);

  scene.add(g);
  return g;
}

/* ------------------------------------------------------------------ *
 *  组装
 * ------------------------------------------------------------------ */
export function buildProps(scene, mats, rig) {
  const g = new THREE.Group();
  g.name = 'props';

  buildUtilityPole(scene, mats);
  buildStreetLamp(scene, mats, rig, { x: 2.22, z: 0.35, height: 4.3, armDir: -1 });
  buildStreetLamp(scene, mats, rig, { x: 5.45, z: 2.3, height: 4.0, armDir: 1 });
  buildTrafficLight(scene, mats, rig);
  buildVendingMachine(scene, mats, rig);
  buildUmbrellaStand(scene, mats);
  buildTrashBins(scene, mats);
  buildBicycles(scene, mats);
  buildBulletinBoard(scene, mats);
  buildRoadSigns(scene, mats);
  buildGuardrail(scene, mats);
  buildFences(scene, mats);
  buildMisc(scene, mats, rig);
  buildWarmPools(scene);

  scene.add(g);
  return g;
}
