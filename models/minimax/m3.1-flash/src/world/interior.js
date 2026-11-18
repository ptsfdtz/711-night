import * as THREE from 'three';
import { PAL, CANDY } from '../core/palette.js';
import * as TX from '../core/textures.js';
import { STORE, INNER } from '../core/layout.js';

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
 *  商品批处理（实例化）
 * ------------------------------------------------------------------ */
class Batch {
  constructor(geo, mat) {
    this.geo = geo;
    this.mat = mat;
    this.items = [];
  }
  add(x, y, z, ry, sx, sy, sz, color) {
    this.items.push({ x, y, z, ry, sx, sy, sz, color });
  }
  build(parent) {
    if (!this.items.length) return null;
    const im = new THREE.InstancedMesh(this.geo, this.mat, this.items.length);
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    for (let i = 0; i < this.items.length; i++) {
      const it = this.items[i];
      d.position.set(it.x, it.y, it.z);
      d.rotation.set(0, it.ry, 0);
      d.scale.set(it.sx, it.sy, it.sz);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
      col.setHex(it.color);
      im.setColorAt(i, col);
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    parent.add(im);
    return im;
  }
}

function bottleGeo() {
  const prof = [
    [0.0, 0], [0.036, 0], [0.038, 0.02], [0.038, 0.11],
    [0.03, 0.135], [0.016, 0.15], [0.015, 0.185], [0.0, 0.19],
  ];
  return new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 10);
}

/* ------------------------------------------------------------------ *
 *  货架（在局部坐标构建：长度沿 X，背板在 -Z）
 * ------------------------------------------------------------------ */
function buildGondola(mats, batches, rnd, {
  width, depth = 0.62, height = 1.62, levels = 4, floorY, kind = 'snack', seedOffset = 0,
}) {
  const g = new THREE.Group();
  const w = width;

  g.add(mesh(box(w, 0.14, depth), mats.shelf, 0, floorY + 0.07, 0, { receive: true }));
  g.add(mesh(box(w, height, 0.05), mats.shelf, 0, floorY + height / 2 + 0.1, -depth / 2 + 0.025));
  g.add(mesh(box(0.05, height, depth), mats.shelf, -w / 2 + 0.025, floorY + height / 2 + 0.1, 0));
  g.add(mesh(box(0.05, height, depth), mats.shelf, w / 2 - 0.025, floorY + height / 2 + 0.1, 0));
  g.add(mesh(box(w, 0.09, depth + 0.04), mats.shelfTrim, 0, floorY + height + 0.16, 0));

  const tagTex = TX.priceTagTexture();
  const spacing = (height - 0.2) / levels;

  for (let i = 0; i < levels; i++) {
    const sy = floorY + 0.2 + i * spacing;
    g.add(mesh(box(w - 0.1, 0.035, depth - 0.1), mats.shelf, 0, sy, 0));
    const tag = mesh(new THREE.PlaneGeometry(w - 0.1, 0.055), new THREE.MeshBasicMaterial({ map: tagTex }), 0, sy - 0.035, depth / 2 - 0.035);
    tag.material.userData.outlineParameters = { visible: false };
    g.add(tag);

    const n = Math.floor((w - 0.24) / 0.1);
    for (let k = 0; k < n; k++) {
      const px = -w / 2 + 0.14 + k * 0.1 + rnd() * 0.02;
      const pz = (rnd() - 0.5) * (depth - 0.28);
      const col = CANDY[Math.floor(rnd() * CANDY.length)];
      const s = 0.85 + rnd() * 0.35;
      if (kind === 'snack') batches.snack.add(px, sy + 0.018 + 0.095 * s, pz, rnd() * 0.3, s, s, s, col);
      else if (kind === 'can') batches.can.add(px, sy + 0.018 + 0.058 * s, pz, rnd() * 0.5, s, s, s, col);
      else if (kind === 'cup') batches.cup.add(px, sy + 0.018 + 0.055 * s, pz, rnd() * 0.4, s, s, s, col);
      else batches.bottle.add(px, sy + 0.018 + 0.095 * s, pz, rnd() * 0.4, s, s, s, col);
    }
  }
  return g;
}

/* ------------------------------------------------------------------ *
 *  主构建
 * ------------------------------------------------------------------ */
export function buildInterior(scene, mats, rig) {
  const g = new THREE.Group();
  g.name = 'interior';
  const floorY = STORE.floorY;
  const rnd = TX.rng(20261029);

  const prodMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: mats.ramp });
  prodMat.userData.outlineParameters = { thickness: 0.0022, color: [0.07, 0.06, 0.08] };

  const batches = {
    snack: new Batch(box(0.075, 0.19, 0.055), prodMat),
    can: new Batch(new THREE.CylinderGeometry(0.034, 0.034, 0.115, 10), prodMat),
    cup: new Batch(new THREE.CylinderGeometry(0.046, 0.038, 0.11, 12), prodMat),
    bottle: new Batch(bottleGeo(), prodMat),
  };

  /* —— 天花板 —— */
  const ceilMat = new THREE.MeshToonMaterial({ color: 0xf6f4ec, gradientMap: mats.ramp });
  ceilMat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(INNER.x1 - INNER.x0, INNER.z1 - INNER.z0), ceilMat,
    (INNER.x0 + INNER.x1) / 2, STORE.ceilY, (INNER.z0 + INNER.z1) / 2, { rot: [Math.PI / 2, 0, 0] }));

  const lightPanelMat = new THREE.MeshBasicMaterial({ color: 0xfff4dd, toneMapped: false });
  lightPanelMat.userData.outlineParameters = { visible: false };
  for (const [px, pz] of [[-2.5, -2.5], [-2.5, -0.7], [-2.5, 0.95], [0.35, -2.5], [0.35, -0.7], [0.35, 0.95]]) {
    g.add(mesh(box(1.45, 0.06, 0.48), mats.frame, px, STORE.ceilY - 0.03, pz));
    g.add(mesh(new THREE.PlaneGeometry(1.32, 0.38), lightPanelMat, px, STORE.ceilY - 0.07, pz, { rot: [Math.PI / 2, 0, 0] }));
  }

  /* —— 内墙贴面 —— */
  const innerWallMat = new THREE.MeshToonMaterial({ color: PAL.wallInner, gradientMap: mats.ramp });
  innerWallMat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(INNER.z1 - INNER.z0, STORE.ceilY - floorY), innerWallMat,
    INNER.x0 + 0.006, (floorY + STORE.ceilY) / 2, (INNER.z0 + INNER.z1) / 2, { rot: [0, Math.PI / 2, 0] }));
  g.add(mesh(new THREE.PlaneGeometry(INNER.x1 - INNER.x0, STORE.ceilY - floorY), innerWallMat,
    (INNER.x0 + INNER.x1) / 2, (floorY + STORE.ceilY) / 2, INNER.z0 + 0.006));

  /* —— 主货架 —— */
  const gA = buildGondola(mats, batches, rnd, { width: 3.0, floorY, kind: 'snack' });
  gA.position.set(-1.8, 0, -2.5);
  g.add(gA);

  const gB = buildGondola(mats, batches, rnd, { width: 3.0, floorY, kind: 'can', levels: 4 });
  gB.position.set(-1.8, 0, -1.35);
  g.add(gB);

  // 西墙窄货架（沿 Z 方向）
  const gC = buildGondola(mats, batches, rnd, { width: 1.7, depth: 0.44, height: 1.5, levels: 4, floorY, kind: 'cup' });
  gC.rotation.y = Math.PI / 2;
  gC.position.set(INNER.x0 + 0.24, 0, -2.35);
  g.add(gC);

  // 中央纵向货架（沿 Z 方向，位于店中央偏右）
  const gD = buildGondola(mats, batches, rnd, { width: 1.5, depth: 0.6, height: 1.45, levels: 4, floorY, kind: 'snack' });
  gD.rotation.y = Math.PI / 2;
  gD.position.set(-0.35, 0, -2.35);
  g.add(gD);

  /* —— 后场：门 / 储物柜 / 纸箱 —— */
  const backZ = INNER.z0 + 0.04;
  g.add(mesh(box(0.9, 1.95, 0.08), mats.coolerFrame, -3.0, floorY + 0.975, backZ + 0.04, { cast: true }));
  g.add(mesh(box(0.78, 1.8, 0.03), mats.steel, -3.0, floorY + 0.95, backZ + 0.005));
  g.add(mesh(box(0.5, 0.16, 0.03), mats.brandGreen, -3.0, floorY + 1.7, backZ - 0.012));

  const lockerMat = new THREE.MeshToonMaterial({ map: TX.lockerTexture(), color: 0xffffff, gradientMap: mats.ramp });
  g.add(mesh(box(1.0, 1.85, 0.42), lockerMat, -2.05, floorY + 0.925, backZ + 0.21, { cast: true }));
  g.add(mesh(box(1.06, 0.07, 0.48), mats.shelfTrim, -2.05, floorY + 1.88, backZ + 0.21));

  for (let i = 0; i < 5; i++) {
    g.add(mesh(box(0.56, 0.28, 0.4), mats.cardboard, -1.15 + (i % 2) * 0.08, floorY + 0.16 + i * 0.3, backZ + 0.22, { cast: true }));
  }
  for (let i = 0; i < 3; i++) {
    g.add(mesh(box(0.5, 0.26, 0.34), i % 2 ? mats.plasticBlue : mats.plasticGreen, -0.62, floorY + 0.14 + i * 0.27, backZ + 0.2, { cast: true }));
  }

  /* —— 卧式冰柜 —— */
  const freezerX = 0.5;
  g.add(mesh(box(1.85, 0.9, 0.72), mats.freezerBody, freezerX, floorY + 0.45, backZ + 0.38, { cast: true }));
  g.add(mesh(box(1.9, 0.1, 0.78), mats.coolerFrame, freezerX, floorY + 0.94, backZ + 0.38));
  for (let i = 0; i < 2; i++) {
    g.add(mesh(new THREE.PlaneGeometry(0.85, 0.62), mats.caseGlass, freezerX - 0.45 + i * 0.9, floorY + 0.99, backZ + 0.38, { rot: [-Math.PI / 2, 0, 0] }));
  }
  for (let i = 0; i < 18; i++) {
    batches.snack.add(
      freezerX - 0.78 + (i % 6) * 0.3, floorY + 0.76, backZ + 0.16 + Math.floor(i / 6) * 0.2,
      rnd() * 0.2, 1, 0.7, 1, [0xf6d6a0, 0xdba8c8, 0xa8d8c0, 0xe8e2cf][i % 4]
    );
  }

  /* —— 饮料柜（东墙） —— */
  const coolerZ0 = -3.28, coolerZ1 = -1.5;
  const coolerLen = coolerZ1 - coolerZ0;
  const coolerCz = (coolerZ0 + coolerZ1) / 2;
  const coolerX = 1.24;
  g.add(mesh(box(0.62, 2.05, coolerLen), mats.coolerFrame, coolerX, floorY + 1.025, coolerCz, { cast: true }));
  const backMat = new THREE.MeshBasicMaterial({ map: TX.coolerBackTexture(), toneMapped: false });
  backMat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(coolerLen - 0.1, 1.85), backMat, coolerX - 0.28, floorY + 1.02, coolerCz, { rot: [0, -Math.PI / 2, 0] }));
  for (let lvl = 0; lvl < 5; lvl++) {
    const sy = floorY + 0.22 + lvl * 0.37;
    g.add(mesh(box(0.5, 0.03, coolerLen - 0.12), mats.shelf, coolerX, sy, coolerCz));
    const n = Math.floor((coolerLen - 0.2) / 0.11);
    for (let k = 0; k < n; k++) {
      const pz = coolerZ0 + 0.12 + k * 0.11;
      const px = coolerX - 0.1 + (rnd() - 0.5) * 0.1;
      const col = CANDY[Math.floor(rnd() * CANDY.length)];
      if (rnd() > 0.45) batches.bottle.add(px, sy + 0.115, pz, rnd() * 0.3, 1, 1, 1, col);
      else batches.can.add(px, sy + 0.075, pz, rnd() * 0.3, 1, 1, 1, col);
    }
  }
  for (let i = 0; i < 3; i++) {
    const seg = (coolerLen - 0.2) / 3;
    const z = coolerZ0 + 0.1 + i * seg + seg / 2;
    g.add(mesh(new THREE.PlaneGeometry(seg - 0.05, 1.82), mats.coolerGlass, coolerX + 0.3, floorY + 1.02, z, { rot: [0, Math.PI / 2, 0] }));
    g.add(mesh(box(0.06, 1.9, 0.05), mats.steel, coolerX + 0.31, floorY + 1.02, z + seg / 2 - 0.02));
  }
  g.add(mesh(box(0.68, 0.26, coolerLen), mats.brandCream, coolerX, floorY + 2.16, coolerCz, { cast: true }));
  g.add(mesh(box(0.03, 0.16, coolerLen - 0.1), mats.coolerGlow, coolerX + 0.345, floorY + 2.16, coolerCz));

  /* —— 便当 / 饭团冷藏柜（临窗） —— */
  const bentoX0 = -2.66, bentoX1 = -1.16;
  const bentoCz = 1.08;
  const bentoW = bentoX1 - bentoX0;
  const bentoCx = (bentoX0 + bentoX1) / 2;
  g.add(mesh(box(bentoW, 0.9, 0.62), mats.shelf, bentoCx, floorY + 0.45, bentoCz, { cast: true }));
  g.add(mesh(box(bentoW + 0.04, 0.72, 0.06), mats.frame, bentoCx, floorY + 0.95, bentoCz - 0.3));
  g.add(mesh(new THREE.PlaneGeometry(bentoW, 0.62), mats.caseGlass, bentoCx, floorY + 0.95, bentoCz + 0.28));
  g.add(mesh(box(bentoW + 0.06, 0.06, 0.68), mats.shelfTrim, bentoCx, floorY + 1.28, bentoCz));
  for (let lvl = 0; lvl < 3; lvl++) {
    const sy = floorY + 0.28 + lvl * 0.3;
    g.add(mesh(box(bentoW - 0.08, 0.03, 0.5), mats.shelf, bentoCx, sy, bentoCz));
    const n = Math.floor((bentoW - 0.15) / 0.15);
    for (let k = 0; k < n; k++) {
      batches.snack.add(bentoX0 + 0.1 + k * 0.15, sy + 0.05, bentoCz - 0.02, 0, 1.7, 0.24, 1.3,
        [0xf3e2c0, 0xe8c9a8, 0xd9e3c0, 0xf0d0c8][(k + lvl) % 4]);
    }
  }
  // 饭团
  const oniGeo = new THREE.CylinderGeometry(0.001, 0.075, 0.13, 3);
  const oniMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: mats.ramp });
  oniMat.userData.outlineParameters = { thickness: 0.0022 };
  const oni = new THREE.InstancedMesh(oniGeo, oniMat, 24);
  const dummy = new THREE.Object3D();
  const oniCol = new THREE.Color();
  let oi = 0;
  for (let row = 0; row < 2; row++) {
    for (let k = 0; k < 12; k++) {
      dummy.position.set(bentoX0 + 0.12 + k * 0.115, floorY + 0.99, bentoCz + 0.16 - row * 0.16);
      dummy.rotation.set(0, Math.PI, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      oni.setMatrixAt(oi, dummy.matrix);
      oniCol.setHex(row === 0 ? 0xf7f3e6 : 0xf3e0b8);
      oni.setColorAt(oi, oniCol);
      oi++;
    }
  }
  oni.instanceMatrix.needsUpdate = true;
  g.add(oni);

  /* —— 杂志架 —— */
  const magX = -3.07;
  g.add(mesh(box(0.74, 0.08, 0.5), mats.shelf, magX, floorY + 0.04, 1.16));
  g.add(mesh(box(0.06, 1.3, 0.5), mats.shelf, magX - 0.34, floorY + 0.65, 1.16));
  const magMat = new THREE.MeshBasicMaterial({ map: TX.magazineTexture() });
  magMat.userData.outlineParameters = { visible: false };
  for (let lvl = 0; lvl < 3; lvl++) {
    const sy = floorY + 0.35 + lvl * 0.36;
    g.add(mesh(box(0.68, 0.03, 0.46), mats.shelf, magX, sy, 1.16, { rot: [0.2, 0, 0] }));
    g.add(mesh(new THREE.PlaneGeometry(0.64, 0.4), magMat, magX, sy + 0.12, 1.32, { rot: [0.2, 0, 0] }));
  }
  g.add(mesh(box(0.8, 0.06, 0.56), mats.brandGreen, magX, floorY + 1.33, 1.16));

  /* —— 收银台（东侧 L 形） —— */
  const counterX0 = 0.92, counterX1 = 1.54;
  const counterZ0 = 0.18, counterZ1 = 1.32;
  const ccx = (counterX0 + counterX1) / 2;
  const ccz = (counterZ0 + counterZ1) / 2;
  g.add(mesh(box(counterX1 - counterX0, 1.0, counterZ1 - counterZ0), mats.counter, ccx, floorY + 0.5, ccz, { cast: true }));
  g.add(mesh(box(counterX1 - counterX0 + 0.07, 0.07, counterZ1 - counterZ0 + 0.07), mats.counterTop, ccx, floorY + 1.03, ccz, { cast: true }));
  // 收银设备
  g.add(mesh(box(0.36, 0.1, 0.32), mats.counter, ccx - 0.14, floorY + 1.11, ccz + 0.24));
  g.add(mesh(box(0.32, 0.26, 0.05), mats.coolerFrame, ccx - 0.14, floorY + 1.28, ccz + 0.3, { rot: [-0.22, 0, 0] }));
  const posScreen = mesh(new THREE.PlaneGeometry(0.28, 0.2), new THREE.MeshBasicMaterial({ color: 0x9fe0c8, toneMapped: false }), ccx - 0.14, floorY + 1.28, ccz + 0.325, { rot: [-0.22, 0, 0] });
  posScreen.material.userData.outlineParameters = { visible: false };
  g.add(posScreen);
  g.add(mesh(box(0.2, 0.14, 0.16), mats.white, ccx - 0.2, floorY + 1.12, ccz - 0.42));
  g.add(mesh(box(0.14, 0.04, 0.2), mats.coolerFrame, ccx - 0.26, floorY + 1.08, ccz - 0.12));
  g.add(mesh(box(0.26, 0.2, 0.02), mats.brandOrange, ccx - 0.31, floorY + 1.16, ccz - 0.02, { rot: [0, 0.2, 0] }));

  /* —— 咖啡机（摆在收银台上，朝 -X） —— */
  const coffee = new THREE.Group();
  coffee.add(mesh(box(0.62, 0.5, 0.4), mats.shelf, 0, 0.25, 0));
  coffee.add(mesh(box(0.6, 0.82, 0.38), mats.coolerFrame, 0, 0.72, 0));
  coffee.add(mesh(box(0.4, 0.3, 0.02), mats.vendingGlow, 0, 0.8, -0.2));
  coffee.add(mesh(box(0.66, 0.1, 0.42), mats.brandRed, 0, 1.18, 0));
  coffee.add(mesh(box(0.12, 0.08, 0.1), mats.steel, -0.14, 0.52, -0.2));
  coffee.add(mesh(box(0.12, 0.08, 0.1), mats.steel, 0.14, 0.52, -0.2));
  for (let i = 0; i < 3; i++) {
    coffee.add(mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.1, 10), mats.white, -0.18 + i * 0.18, 0.55, -0.18));
  }
  const coffeeSign = mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: TX.menuLightboxTexture(), toneMapped: false }), 0, 1.42, -0.06, { rot: [0, 0, 0] });
  coffeeSign.material.userData.outlineParameters = { visible: false };
  coffee.add(coffeeSign);
  coffee.position.set(ccx + 0.02, floorY + 1.06, ccz - 0.5);
  coffee.rotation.y = Math.PI / 2;
  g.add(coffee);

  /* —— 关东煮柜台 —— */
  const odenX = 1.22;
  g.add(mesh(box(0.62, 0.92, 1.4), mats.shelf, odenX, floorY + 0.46, -0.6, { cast: true }));
  g.add(mesh(box(0.68, 0.06, 1.46), mats.steel, odenX, floorY + 0.95, -0.6));
  for (let i = 0; i < 3; i++) {
    const pz = -1.1 + i * 0.5;
    g.add(mesh(new THREE.CylinderGeometry(0.19, 0.17, 0.22, 14), mats.steel, odenX, floorY + 1.02, pz));
    g.add(mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.02, 14), mats.brandOrange, odenX, floorY + 1.11, pz));
  }
  g.add(mesh(new THREE.PlaneGeometry(0.62, 1.3), mats.caseGlass, odenX - 0.31, floorY + 0.62, -0.6, { rot: [0, Math.PI / 2, 0] }));
  g.add(mesh(box(0.66, 0.05, 1.44), mats.shelfTrim, odenX, floorY + 1.3, -0.6));
  g.add(mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ map: TX.menuLightboxTexture(), toneMapped: false }), odenX - 0.33, floorY + 1.5, -0.6, { rot: [0, Math.PI / 2, 0] }));
  for (let i = 0; i < 3; i++) {
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 10), mats.wood, odenX - 0.18 + i * 0.18, floorY + 1.06, -0.02));
  }

  /* —— 店内菜单灯箱 —— */
  const menuMat = new THREE.MeshBasicMaterial({ map: TX.menuLightboxTexture(), toneMapped: false });
  menuMat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(1.5, 0.94), menuMat, 0.9, floorY + 1.9, INNER.z0 + 0.02));
  g.add(mesh(box(1.6, 1.04, 0.08), mats.frameDark, 0.9, floorY + 1.9, INNER.z0 + 0.05));

  /* —— 宣传海报墙 —— */
  const posterMat = new THREE.MeshBasicMaterial({ map: TX.interiorPosterWallTexture(), toneMapped: false });
  posterMat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(1.5, 0.9), posterMat, INNER.x0 + 0.02, floorY + 1.55, 0.3, { rot: [0, Math.PI / 2, 0] }));

  /* —— 吊挂 POP 旗 —— */
  const flagCols = [0xe0562c, 0x2e9e52, 0x3f7fbf, 0xf3c33f, 0xc05bb0];
  for (let i = 0; i < 5; i++) {
    const px = -3.0 + i * 0.8;
    g.add(mesh(box(0.04, 0.02, 0.04), mats.steel, px, STORE.ceilY - 0.06, -0.62));
    const flag = mesh(new THREE.PlaneGeometry(0.22, 0.5), new THREE.MeshBasicMaterial({
      color: flagCols[i], side: THREE.DoubleSide, toneMapped: false,
    }), px, STORE.ceilY - 0.32, -0.62);
    flag.material.userData.outlineParameters = { visible: false };
    g.add(flag);
  }

  /* —— 地面导视 —— */
  const guideMat = new THREE.MeshBasicMaterial({ map: TX.floorGuideTexture(), transparent: true, toneMapped: false });
  guideMat.userData.outlineParameters = { visible: false };
  g.add(mesh(new THREE.PlaneGeometry(1.1, 1.1), guideMat, -0.1, floorY + 0.006, 0.55, { rot: [-Math.PI / 2, 0, 0] }));

  /* —— 后场小细节 —— */
  g.add(mesh(box(0.4, 0.06, 0.3), mats.shelf, 1.3, floorY + 1.85, INNER.z0 + 0.3));
  g.add(mesh(box(0.34, 0.3, 0.24), mats.cardboard, 1.3, floorY + 2.02, INNER.z0 + 0.3));

  /* —— 批量生成商品 —— */
  batches.snack.build(g);
  batches.can.build(g);
  batches.cup.build(g);
  batches.bottle.build(g);

  /* —— 室内灯光 —— */
  const lights = [];
  const l1 = new THREE.PointLight(PAL.warmLight, 38, 9.5, 1.6);
  l1.position.set(-2.3, 2.25, -1.6);
  g.add(l1);
  const l2 = new THREE.PointLight(PAL.warmLight, 30, 8.5, 1.6);
  l2.position.set(-1.9, 2.25, 0.9);
  g.add(l2);
  const l3 = new THREE.PointLight(PAL.warmLightHot, 24, 7.0, 1.6);
  l3.position.set(0.9, 2.2, -1.4);
  g.add(l3);
  const l4 = new THREE.PointLight(0xd8f0ff, 9, 3.4, 1.6);
  l4.position.set(1.15, 1.3, -2.4);
  g.add(l4);
  // 入口上方补光，让门口更亮
  const l5 = new THREE.PointLight(PAL.warmLightHot, 14, 5.0, 1.7);
  l5.position.set(0.0, 2.2, 0.55);
  g.add(l5);
  lights.push(l1, l2, l3, l4, l5);

  scene.add(g);
  return { group: g, lights };
}
