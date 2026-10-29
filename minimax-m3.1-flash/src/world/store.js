import * as THREE from 'three';
import { PAL } from '../core/palette.js';
import * as TX from '../core/textures.js';
import { STORE, INNER, DOOR } from '../core/layout.js';
import { makeGlow } from '../core/materials.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

function mesh(geo, mat, x, y, z, { cast = false, receive = false } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

/** 立面板（带贴图），默认朝 +Z */
function panel(w, h, map, x, y, z, ry = 0, opts = {}) {
  const mat = new THREE.MeshBasicMaterial({ map, transparent: !!opts.transparent, opacity: opts.opacity ?? 1, toneMapped: !opts.emissive });
  mat.userData.outlineParameters = { visible: false };
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  return m;
}

/* ------------------------------------------------------------------ *
 *  建筑主体
 * ------------------------------------------------------------------ */
export function buildStore(scene, mats, rig) {
  const g = new THREE.Group();
  g.name = 'store';

  const { x0, x1, z0, z1, floorY, wallTop, roofTop, fasciaY0, fasciaY1, glassTop, wall } = STORE;
  const W = x1 - x0;
  const D = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;

  /* —— 地坪 —— */
  const floorTex = TX.interiorFloorTexture();
  const floorMat = new THREE.MeshToonMaterial({
    color: 0xffffff,
    map: floorTex,
    gradientMap: mats.ramp,
  });
  floorMat.userData.outlineParameters = { visible: false };
  const floor = mesh(new THREE.PlaneGeometry(W - 0.02, D - 0.02), floorMat, cx, floorY + 0.002, cz);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  g.add(floor);

  /* —— 实体墙：西侧 + 北侧 —— */
  const wallH = wallTop - floorY;
  const wallMat = mats.storeWall;

  // 西墙
  const west = mesh(box(wall, wallH, D), wallMat, x0 + wall / 2, floorY + wallH / 2, cz, { cast: true, receive: true });
  g.add(west);
  // 北墙
  const north = mesh(box(W - wall * 2, wallH, wall), wallMat, cx, floorY + wallH / 2, z0 + wall / 2, { cast: true, receive: true });
  g.add(north);

  // 墙裙（深色防水踢脚）
  g.add(mesh(box(wall + 0.03, 0.34, D), mats.storeWallShade, x0 + wall / 2, floorY + 0.17, cz, { cast: true }));
  g.add(mesh(box(W - wall * 2, 0.34, wall + 0.03), mats.storeWallShade, cx, floorY + 0.17, z0 + wall / 2, { cast: true }));

  // 墙面的绿色腰线
  g.add(mesh(box(wall + 0.02, 0.09, D), mats.brandGreen, x0 + wall / 2, floorY + 0.62, cz));
  g.add(mesh(box(W - wall * 2, 0.09, wall + 0.02), mats.brandGreen, cx, floorY + 0.62, z0 + wall / 2));

  /* —— 屋顶 —— */
  const roof = mesh(box(W + 0.26, 0.2, D + 0.26), mats.roof, cx, roofTop - 0.1, cz, { cast: true, receive: true });
  g.add(roof);
  // 女儿墙
  const par = 0.16;
  g.add(mesh(box(W + 0.26, 0.22, par), mats.roofTrim, cx, roofTop + 0.11, z1 + 0.13 - par / 2, { cast: true }));
  g.add(mesh(box(W + 0.26, 0.22, par), mats.roofTrim, cx, roofTop + 0.11, z0 - 0.13 + par / 2, { cast: true }));
  g.add(mesh(box(par, 0.22, D + 0.26), mats.roofTrim, x1 + 0.13 - par / 2, roofTop + 0.11, cz, { cast: true }));
  g.add(mesh(box(par, 0.22, D + 0.26), mats.roofTrim, x0 - 0.13 + par / 2, roofTop + 0.11, cz, { cast: true }));

  // 屋顶设备
  g.add(mesh(box(0.9, 0.5, 0.7), mats.steel, x0 + 0.9, roofTop + 0.25, z0 + 0.9, { cast: true }));
  g.add(mesh(box(0.5, 0.36, 0.5), mats.steelDark, x1 - 1.0, roofTop + 0.18, z0 + 1.2, { cast: true }));
  const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.7, 10), mats.steelDark);
  vent.position.set(cx + 1.3, roofTop + 0.35, z0 + 0.5);
  vent.castShadow = true;
  g.add(vent);
  // 天线
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.5, 6), mats.steelDark);
  ant.position.set(x0 + 0.4, roofTop + 0.75, cz + 1.4);
  g.add(ant);

  /* ------------------------------------------------------------------ *
   *  南立面（正面）
   * ------------------------------------------------------------------ */
  const fz = z1;                     // 外表面
  const sillY = floorY + 0.1;

  // 门柱 / 窗框
  const mullion = (mx, mw) => {
    const m = mesh(box(mw, glassTop - floorY + 0.06, 0.14), mats.frame, mx, (floorY + glassTop) / 2 + 0.03, fz - 0.07, { cast: true });
    g.add(m);
  };
  mullion(x0 + 0.09, 0.18);          // 西端立柱
  mullion(-0.93, 0.1);              // 门左框
  mullion(0.93, 0.1);               // 门右框
  mullion(x1 - 0.09, 0.18);          // 东端立柱

  // 上下横框
  g.add(mesh(box(W, 0.14, 0.16), mats.frame, cx, glassTop + 0.02, fz - 0.07, { cast: true }));
  g.add(mesh(box(W, 0.1, 0.16), mats.frame, cx, sillY, fz - 0.07));

  // 玻璃上方的实体墙带
  g.add(mesh(box(W, 0.3, wall), wallMat, cx, fasciaY0 - 0.13, fz - wall / 2, { cast: true }));

  // 玻璃
  const glassH = glassTop - sillY;
  const glassY = (glassTop + sillY) / 2;
  const addGlass = (gx0, gx1) => {
    const m = mesh(new THREE.PlaneGeometry(gx1 - gx0, glassH), mats.glass, (gx0 + gx1) / 2, glassY, fz - 0.05);
    g.add(m);
  };
  addGlass(x0 + 0.18, -0.98);
  addGlass(0.98, x1 - 0.18);

  // 玻璃上的磨砂腰线（带品牌字样）
  const bandTex = TX.glassBandTexture();
  const bandMat = new THREE.MeshBasicMaterial({ map: bandTex, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: true });
  bandMat.userData.outlineParameters = { visible: false };
  for (const [gx0, gx1] of [[x0 + 0.18, -0.98], [0.98, x1 - 0.18]]) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(gx1 - gx0, 0.26), bandMat);
    b.position.set((gx0 + gx1) / 2, floorY + 0.78, fz - 0.045);
    g.add(b);
  }

  /* ------------------------------------------------------------------ *
   *  东立面（侧街一面）
   * ------------------------------------------------------------------ */
  const ex = x1;
  const eastZ0 = -2.7;
  // 立柱
  const mullionE = (mz, mw) => {
    g.add(mesh(box(0.14, glassTop - floorY + 0.06, mw), mats.frame, ex - 0.07, (floorY + glassTop) / 2 + 0.03, mz, { cast: true }));
  };
  mullionE(z0 + 0.09, 0.18);
  mullionE(-2.7, 0.12);
  mullionE(-1.6, 0.1);
  mullionE(-0.5, 0.1);
  mullionE(0.6, 0.1);
  mullionE(z1 - 0.09, 0.18);
  g.add(mesh(box(0.16, 0.14, D), mats.frame, ex - 0.07, glassTop + 0.02, cz, { cast: true }));
  g.add(mesh(box(0.16, 0.1, D), mats.frame, ex - 0.07, sillY, cz));

  const glassE = (gz0, gz1) => {
    const m = mesh(new THREE.PlaneGeometry(gz1 - gz0, glassH), mats.glass, ex - 0.05, glassY, (gz0 + gz1) / 2);
    m.rotation.y = Math.PI / 2;
    g.add(m);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(gz1 - gz0, 0.26), bandMat);
    b.position.set(ex - 0.045, floorY + 0.78, (gz0 + gz1) / 2);
    b.rotation.y = Math.PI / 2;
    g.add(b);
  };
  glassE(-2.64, -1.66);
  glassE(-1.54, -0.56);
  glassE(-0.44, 0.54);
  glassE(0.66, 1.42);

  // 东北角实墙
  g.add(mesh(box(0.18, glassTop - floorY + 0.06, 0.66), mats.storeWall, ex - 0.09, (floorY + glassTop) / 2 + 0.03, -3.09, { cast: true }));
  // 东侧玻璃上方的实体墙带
  g.add(mesh(box(wall, 0.3, D), wallMat, ex - wall / 2, fasciaY0 - 0.13, cz, { cast: true }));

  /* ------------------------------------------------------------------ *
   *  招牌灯箱
   * ------------------------------------------------------------------ */
  const signTex = TX.storeSignTexture();
  const signH = fasciaY1 - fasciaY0;
  // 灯箱外壳
  g.add(mesh(box(W + 0.2, signH, 0.22), mats.brandCream, cx, (fasciaY0 + fasciaY1) / 2, fz - 0.02, { cast: true }));
  // 正面贴图
  const signFace = panel(W + 0.18, signH * 0.94, signTex, cx, (fasciaY0 + fasciaY1) / 2, fz + 0.1);
  g.add(signFace);
  // 上下品牌色装饰条
  g.add(mesh(box(W + 0.22, 0.1, 0.26), mats.brandGreen, cx, fasciaY1 - 0.03, fz - 0.02));
  g.add(mesh(box(W + 0.22, 0.07, 0.26), mats.brandOrange, cx, fasciaY0 + 0.02, fz - 0.02));

  // 侧面招牌（东立面朝 +X）
  const eastSign = panel(D - 0.3, signH * 0.94, TX.storeSignTexture(), ex + 0.145, (fasciaY0 + fasciaY1) / 2, cz, Math.PI / 2);
  g.add(eastSign);
  g.add(mesh(box(0.24, signH, D - 0.1), mats.brandCream, ex + 0.02, (fasciaY0 + fasciaY1) / 2, cz, { cast: true }));

  // 招牌光晕
  const signGlow = makeGlow(PAL.signGlow, 3.1, 0.3);
  signGlow.position.set(cx, (fasciaY0 + fasciaY1) / 2 + 0.12, fz + 0.44);
  g.add(signGlow);
  const signGlowE = makeGlow(PAL.signGlow, 2.4, 0.24);
  signGlowE.position.set(ex + 0.42, (fasciaY0 + fasciaY1) / 2, cz);
  g.add(signGlowE);

  // 招牌灯（暖白）
  const signLight = new THREE.PointLight(PAL.signGlow, 16, 9, 1.6);
  signLight.position.set(cx, fasciaY0 - 0.15, fz + 0.55);
  g.add(signLight);

  /* ------------------------------------------------------------------ *
   *  转角竖招牌
   * ------------------------------------------------------------------ */
  const csTex = TX.cornerSignTexture();
  const csW = 0.66;
  const csH = 1.55;
  const csY = fasciaY0 - 0.05;
  const csZ = 0.98;
  g.add(mesh(box(csW + 0.06, csH + 0.06, 0.12), mats.frameDark, ex + 0.24, csY, csZ, { cast: true }));
  const csFace = panel(csW, csH, csTex, ex + 0.31, csY, csZ, Math.PI / 2);
  g.add(csFace);
  const csBack = panel(csW, csH, csTex, ex + 0.17, csY, csZ, -Math.PI / 2);
  g.add(csBack);
  const csGlow = makeGlow(PAL.warmLightHot, 2.0, 0.5);
  csGlow.position.set(ex + 0.35, csY, csZ);
  g.add(csGlow);
  const csLight = new THREE.PointLight(PAL.warmLightHot, 5, 4.5, 1.6);
  csLight.position.set(ex + 0.5, csY, csZ);
  g.add(csLight);

  /* ------------------------------------------------------------------ *
   *  雨棚（屋檐）
   * ------------------------------------------------------------------ */
  const awY = STORE.awningY;
  const awZ = STORE.awningZ;
  const depth = awZ - fz;
  // 斜面
  const awnGeo = new THREE.BoxGeometry(W + 0.3, 0.07, depth + 0.18);
  const awn = mesh(awnGeo, mats.awning, cx, awY + 0.05, (fz + awZ) / 2, { cast: true });
  awn.rotation.x = -0.075;
  g.add(awn);
  // 前檐绿色条
  const lip = mesh(box(W + 0.3, 0.11, 0.1), mats.awningEdge, cx, awY - 0.01, awZ + 0.09, { cast: true });
  lip.rotation.x = -0.075;
  g.add(lip);
  // 顶面的品牌色条纹
  const stripe = mesh(box(W + 0.3, 0.02, 0.16), mats.brandGreen, cx, awY + 0.1, awZ - 0.26);
  stripe.rotation.x = -0.075;
  g.add(stripe);
  // 排水槽
  g.add(mesh(box(W + 0.3, 0.09, 0.14), mats.steel, cx, awY - 0.06, awZ + 0.02, { cast: true }));
  // 支撑斜杆
  for (let i = 0; i < 4; i++) {
    const bx = x0 + 0.7 + i * ((W - 1.4) / 3);
    const rod = mesh(box(0.05, 0.05, depth + 0.1), mats.steel, bx, awY + 0.11, (fz + awZ) / 2);
    rod.rotation.x = -0.075;
    g.add(rod);
    const stay = mesh(box(0.04, 0.04, 0.5), mats.steel, bx, awY + 0.26, fz + 0.2);
    stay.rotation.x = 0.7;
    g.add(stay);
  }
  // 落水管
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, awY - floorY + 0.1, 8), mats.steelDark);
  pipe.position.set(x0 + 0.22, (awY + floorY) / 2, awZ - 0.05);
  pipe.castShadow = true;
  g.add(pipe);

  // 门口照明灯箱
  g.add(mesh(box(1.5, 0.1, 0.3), mats.frameDark, 0, awY + 0.18, fz + 0.12));
  const doorLightBox = mesh(box(1.36, 0.04, 0.22), mats.lampGlass, 0, awY + 0.12, fz + 0.12);
  g.add(doorLightBox);
  const dlGlow = makeGlow(PAL.warmLight, 1.5, 0.24);
  dlGlow.position.set(0, awY + 0.02, fz + 0.3);
  g.add(dlGlow);

  /* ------------------------------------------------------------------ *
   *  自动门
   * ------------------------------------------------------------------ */
  const doorGroup = new THREE.Group();
  g.add(doorGroup);

  const panelW = 0.8;
  const doorH = DOOR.h;
  const makeDoorPanel = (side) => {
    const p = new THREE.Group();
    const frameMat = mats.frame;
    // 上下框
    p.add(mesh(box(panelW, 0.09, 0.06), frameMat, 0, doorH - 0.045, 0));
    p.add(mesh(box(panelW, 0.09, 0.06), frameMat, 0, 0.045, 0));
    // 竖框
    p.add(mesh(box(0.07, doorH, 0.06), frameMat, -panelW / 2 + 0.035, doorH / 2, 0));
    p.add(mesh(box(0.07, doorH, 0.06), frameMat, panelW / 2 - 0.035, doorH / 2, 0));
    // 玻璃
    const gl = mesh(new THREE.PlaneGeometry(panelW - 0.12, doorH - 0.16), mats.glass, 0, doorH / 2, 0.005);
    p.add(gl);
    // 中间竖把手
    const handleX = side < 0 ? panelW / 2 - 0.1 : -panelW / 2 + 0.1;
    p.add(mesh(box(0.045, 0.5, 0.05), mats.steel, handleX, 1.05, -0.045));
    // 腰线贴纸
    const band = new THREE.Mesh(new THREE.PlaneGeometry(panelW - 0.12, 0.2), bandMat);
    band.position.set(0, 0.85, -0.012);
    p.add(band);
    return p;
  };

  const leftDoor = makeDoorPanel(-1);
  const rightDoor = makeDoorPanel(1);
  leftDoor.position.set(DOOR.x0 + panelW / 2, floorY, fz - 0.13);
  rightDoor.position.set(DOOR.x1 - panelW / 2, floorY, fz - 0.13);
  doorGroup.add(leftDoor, rightDoor);

  // 门框上方的自动门感应器
  g.add(mesh(box(1.0, 0.1, 0.14), mats.frameDark, 0, floorY + doorH + 0.16, fz - 0.1));
  const sensor = mesh(box(0.22, 0.06, 0.1), mats.black, 0, floorY + doorH + 0.16, fz - 0.19);
  g.add(sensor);

  // 门口的营业中贴纸
  const openTex = TX.openSignTexture();
  const openSign = panel(0.62, 0.28, openTex, -1.5, floorY + 1.72, fz - 0.04);
  g.add(openSign);

  // 地垫
  const matTex = TX.doorMatTexture();
  const matMat = new THREE.MeshToonMaterial({ map: matTex, color: 0xffffff, gradientMap: mats.ramp });
  matMat.userData.outlineParameters = { visible: false };
  const doormat = mesh(new THREE.PlaneGeometry(1.9, 0.62), matMat, 0, floorY + 0.012, fz + 0.42);
  doormat.rotation.x = -Math.PI / 2;
  g.add(doormat);
  g.add(mesh(box(1.98, 0.035, 0.7), mats.rubber, 0, floorY + 0.017, fz + 0.42, { receive: true }));

  /* ------------------------------------------------------------------ *
   *  动画：自动门 + 招牌闪烁
   * ------------------------------------------------------------------ */
  let doorPhase = 2.5;
  let doorOpen = 0;
  let doorTarget = 0;
  rig.add((t, dt) => {
    // —— 自动门：偶尔开合 ——
    doorPhase -= dt;
    if (doorPhase <= 0) {
      doorPhase = 6 + Math.random() * 7;
      doorTarget = doorOpen > 0.5 ? 0 : 1;
    }
    doorOpen += (doorTarget - doorOpen) * Math.min(1, dt * 3.2);
    const slide = doorOpen * (panelW + 0.02);
    leftDoor.position.x = DOOR.x0 + panelW / 2 - slide;
    rightDoor.position.x = DOOR.x1 - panelW / 2 + slide;

    // —— 招牌轻微闪烁 ——
    const n = Math.sin(t * 13.3) * Math.sin(t * 4.1) * Math.sin(t * 0.9);
    const flick = 1 + n * 0.045;
    signGlow.material.opacity = 0.3 * flick;
    signGlowE.material.opacity = 0.24 * flick;
    signLight.intensity = 16 * flick;
    dlGlow.material.opacity = 0.24 * (1 + Math.sin(t * 7.7) * 0.03);
  });

  scene.add(g);
  return { group: g, signLight, signGlow, doorLightBox };
}

/* ------------------------------------------------------------------ *
 *  外墙附件（空调外机 / 管线 / 后门）
 * ------------------------------------------------------------------ */
export function buildStoreExtras(scene, mats) {
  const g = new THREE.Group();
  g.name = 'store-extras';
  const { x0, x1, z0, z1, floorY } = STORE;

  // 空调外机（西墙）
  const acUnit = (px, py, pz, ry, s = 1) => {
    const u = new THREE.Group();
    u.add(mesh(box(0.8 * s, 0.6 * s, 0.34 * s), mats.steel, 0, 0, 0, { cast: true }));
    u.add(mesh(box(0.72 * s, 0.5 * s, 0.02), mats.steelDark, 0, 0, 0.18 * s));
    // 风扇
    const fan = new THREE.Mesh(new THREE.TorusGeometry(0.19 * s, 0.035 * s, 6, 16), mats.steelDark);
    fan.position.set(0, 0, 0.2 * s);
    u.add(fan);
    for (let i = 0; i < 4; i++) {
      const blade = mesh(box(0.34 * s, 0.06 * s, 0.02), mats.steelDark, 0, 0, 0.2 * s);
      blade.rotation.z = (i * Math.PI) / 4;
      u.add(blade);
    }
    // 支架
    u.add(mesh(box(0.9 * s, 0.05, 0.4), mats.steelDark, 0, -0.34 * s, -0.1));
    u.position.set(px, py, pz);
    u.rotation.y = ry;
    return u;
  };

  g.add(acUnit(x0 - 0.28, floorY + 1.9, z0 + 1.3, -Math.PI / 2));
  g.add(acUnit(x0 - 0.28, floorY + 1.1, z0 + 1.3, -Math.PI / 2));
  g.add(acUnit((x0 + x1) / 2, floorY + 1.55, z0 - 0.28, 0));

  // 后门（员工出入口）
  g.add(mesh(box(0.86, 1.95, 0.08), mats.frameDark, x0 + 1.1, floorY + 0.975, z0 - 0.02, { cast: true }));
  g.add(mesh(box(0.8, 1.85, 0.03), mats.steel, x0 + 1.1, floorY + 0.975, z0 - 0.065));
  g.add(mesh(box(0.06, 0.06, 0.1), mats.steel, x0 + 1.44, floorY + 1.0, z0 - 0.08));

  // 落水管 / 电表箱
  g.add(mesh(box(0.42, 0.56, 0.16), mats.steel, x0 + 2.5, floorY + 1.3, z0 - 0.09, { cast: true }));
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.6, 8), mats.steelDark);
  pipe.position.set(x0 + 0.18, floorY + 1.3, z0 - 0.12);
  g.add(pipe);

  // 排水立管
  const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.5, 8), mats.steelDark);
  drain.position.set(x1 - 0.28, floorY + 1.25, z0 - 0.14);
  g.add(drain);

  scene.add(g);
  return g;
}
