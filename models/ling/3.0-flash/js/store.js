import * as THREE from 'three';
import { makeToon, attachOutline } from './utils.js';

const W = 4, H = 3.5, D = 3.5;

export function createStore(scene, gradientMap) {
  const store = new THREE.Group();

  const wallGeo = new THREE.BoxGeometry(W, H, 0.15);
  const wall = makeToon(wallGeo, 0x334455, gradientMap);
  store.add(wall);
  attachOutline(wall);

  const buildingGeo = new THREE.BoxGeometry(W + 0.2, H + 0.1, D + 0.2);
  const building = makeToon(buildingGeo, 0x2a3040, gradientMap);
  building.position.y = H / 2;
  store.add(building);
  attachOutline(building);

  const frontFaceGeo = new THREE.BoxGeometry(W, H, 0.05);
  const frontFace = makeToon(frontFaceGeo, 0x2a3040, gradientMap);
  frontFace.position.z = D / 2 - 0.1;
  store.add(frontFace);
  attachOutline(frontFace);

  const glassGeo = new THREE.PlaneGeometry(W * 0.85, H * 0.8);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x88bbff, transparent: true, opacity: 0.15, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, H * 0.35, D / 2 + 0.04);
  store.add(glass);

  const innerLightGeo = new THREE.PlaneGeometry(W * 0.7, H * 0.7);
  const innerLightMat = new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 0.5 });
  const innerLight = new THREE.Mesh(innerLightGeo, innerLightMat);
  innerLight.position.set(0, H * 0.35, D / 2 + 0.06);
  store.add(innerLight);

  const awningGeo = new THREE.BoxGeometry(W + 0.6, 0.25, 1.2);
  const awning = makeToon(awningGeo, 0xcc3333, gradientMap);
  awning.position.set(0, H + 0.05, D / 2 + 0.6);
  store.add(awning);
  attachOutline(awning);

  const supportGeo = new THREE.BoxGeometry(0.08, H * 0.4, 0.08);
  const s1 = makeToon(supportGeo, 0x555555, gradientMap); s1.position.set(-W / 2 + 0.3, H * 0.2 + 0.15, D / 2 + 0.7); store.add(s1);
  const s2 = makeToon(supportGeo, 0x555555, gradientMap); s2.position.set(W / 2 - 0.3, H * 0.2 + 0.15, D / 2 + 0.7); store.add(s2);

  const doorW = 1.2, doorH = 2.6;
  const doorMat = makeToon(new THREE.PlaneGeometry(doorW, doorH), 0x2244aa, gradientMap);
  const leftDoor = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), doorMat.material);
  leftDoor.position.set(-0.6, 1.3, D / 2 + 0.08);
  store.add(leftDoor); attachOutline(leftDoor, 1.02);
  const rightDoor = new THREE.Mesh(new THREE.PlaneGeometry(doorW, doorH), doorMat.material.clone());
  rightDoor.position.set(0.6, 1.3, D / 2 + 0.08);
  store.add(rightDoor); attachOutline(rightDoor, 1.02);

  const handleGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const handle = makeToon(handleGeo, 0xccccaa, gradientMap);
  handle.position.set(1.15, 1.3, D / 2 + 0.1);
  store.add(handle);

  const entryMat = new THREE.MeshToonMaterial({ color: 0x2244aa, gradientMap });
  const entry = makeToon(new THREE.BoxGeometry(2.4, doorH, 0.06), 0x2244aa, gradientMap);
  entry.position.set(0, 1.3, D / 2 + 0.08);
  store.add(entry);

  const matGeo = new THREE.BoxGeometry(1, 0.03, 0.5);
  const doormat = makeToon(matGeo, 0x886633, gradientMap);
  doormat.position.set(0, 0.02, D / 2 + 0.25);
  store.add(doormat); attachOutline(doormat);

  const shelfGeo = new THREE.BoxGeometry(0.8, 0.1, 1);
  const shelfMat = makeToon(shelfGeo, 0x556644, gradientMap);
  for (let i = 0; i < 3; i++) {
    const sh = makeToon(shelfGeo, 0x556644, gradientMap);
    sh.position.set(-1.2, 0.8 + i * 0.8, -0.5);
    store.add(sh); attachOutline(sh);
  }

  const prodGeo = new THREE.BoxGeometry(0.15, 0.1, 0.15);
  const pColors = [0xff3333, 0x3366ff, 0xffcc00, 0x33cc33, 0xff6600, 0x9933ff, 0x00ccaa];
  for (let s = 0; s < 3; s++) for (let r = 0; r < 3; r++) {
    const p = makeToon(prodGeo, pColors[(s * 3 + r) % pColors.length], gradientMap);
    p.position.set(-1.3, 0.15 + s * 0.8, -0.5 + r * 0.25);
    store.add(p);
  }

  const coolerGeo = new THREE.BoxGeometry(1.2, 1.2, 0.8);
  const cooler = makeToon(coolerGeo, 0x334455, gradientMap);
  cooler.position.set(1.2, 0.6, -0.5);
  store.add(cooler); attachOutline(cooler);

  const cGlassGeo = new THREE.PlaneGeometry(1.1, 1.0);
  const cGlassMat = new THREE.MeshPhysicalMaterial({ color: 0xaaddff, transparent: true, opacity: 0.2, roughness: 0.05, side: THREE.DoubleSide });
  const cGlass = new THREE.Mesh(cGlassGeo, cGlassMat);
  cGlass.position.set(1.2, 0.6, -0.1);
  store.add(cGlass);

  const lboxGeo = new THREE.BoxGeometry(0.6, 0.15, 0.05);
  const lbox = makeToon(lboxGeo, 0xffaa33, gradientMap);
  lbox.position.set(-0.5, H - 0.2, D / 2 + 0.1);
  store.add(lbox);

  const neonGeo = new THREE.BoxGeometry(0.05, 0.5, 0.1);
  const neon = makeToon(neonGeo, 0xff3366, gradientMap);
  neon.position.set(2.1, H - 0.15, D / 2 + 0.1);
  store.add(neon);

  const signGeo = new THREE.BoxGeometry(1.2, 0.4, 0.08);
  const sign = makeToon(signGeo, 0xddcc00, gradientMap);
  sign.position.set(0, H + 0.25, D / 2 + 0.1);
  store.add(sign); attachOutline(sign);

  const stextGeo = new THREE.PlaneGeometry(1.0, 0.25);
  const stextMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.9 });
  const stext = new THREE.Mesh(stextGeo, stextMat);
  stext.position.set(0, H + 0.25, D / 2 + 0.14);
  store.add(stext);

  const roofGeo = new THREE.BoxGeometry(W + 0.4, 0.15, D + 0.4);
  const roof = makeToon(roofGeo, 0x222233, gradientMap);
  roof.position.y = H + 0.075;
  store.add(roof); attachOutline(roof);

  const sideGeo = new THREE.BoxGeometry(0.15, H, D);
  const sideMat = makeToon(sideGeo, 0x2a3040, gradientMap);
  const sR = new THREE.Mesh(sideGeo, sideMat.material); sR.position.set(W / 2 + 0.075, H / 2, 0); store.add(sR);
  const sL = new THREE.Mesh(sideGeo, sideMat.material); sL.position.set(-W / 2 - 0.075, H / 2, 0); store.add(sL);

  const backGeo = new THREE.BoxGeometry(W, H, 0.15);
  const back = makeToon(backGeo, 0x222835, gradientMap);
  back.position.z = -D / 2 - 0.075;
  store.add(back);

  const counterGeo = new THREE.BoxGeometry(1.5, 0.9, 0.6);
  const counter = makeToon(counterGeo, 0x556644, gradientMap);
  counter.position.set(0, 0.45, -1.2);
  store.add(counter); attachOutline(counter);

  const regGeo = new THREE.BoxGeometry(0.3, 0.4, 0.25);
  const reg = makeToon(regGeo, 0x445566, gradientMap);
  reg.position.set(0, 0.9, -1.2);
  store.add(reg);

  const rScreenGeo = new THREE.PlaneGeometry(0.2, 0.15);
  const rScreenMat = new THREE.MeshBasicMaterial({ color: 0x00cc44, transparent: true, opacity: 0.8 });
  const rScreen = new THREE.Mesh(rScreenGeo, rScreenMat);
  rScreen.position.set(0, 0.95, -1.18);
  store.add(rScreen);

  const magGeo = new THREE.BoxGeometry(0.4, 0.3, 0.1);
  const mag = makeToon(magGeo, 0xcccccc, gradientMap);
  mag.position.set(-0.8, 0.95, -1.3); mag.rotation.y = 0.3;
  store.add(mag); attachOutline(mag);

  const coffeeGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.25, 12);
  const coffee = makeToon(coffeeGeo, 0x442200, gradientMap);
  coffee.position.set(0.6, 0.75, -1.1);
  store.add(coffee);

  const cupGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.1, 12);
  const cup = makeToon(cupGeo, 0xffffff, gradientMap);
  cup.position.set(0.6, 0.63, -1.1);
  store.add(cup);

  const rbGeo = new THREE.BoxGeometry(0.12, 0.08, 0.12);
  const rColors = [0xffcc00, 0xff9900, 0xff3333];
  for (let i = 0; i < 6; i++) {
    const rb = makeToon(rbGeo, rColors[i % 3], gradientMap);
    rb.position.set(-0.5 + i * 0.1, 0.12, -0.8);
    store.add(rb);
  }

  const shelf2Geo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
  const shelf2 = makeToon(shelf2Geo, 0x556644, gradientMap);
  shelf2.position.set(0.5, 1.6, -0.3);
  store.add(shelf2);

  const snackGeo = new THREE.BoxGeometry(0.1, 0.15, 0.1);
  const sColors = [0x0066ff, 0xff0066, 0x00cc66, 0xffaa00];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) {
    const snack = makeToon(snackGeo, sColors[(row + col) % sColors.length], gradientMap);
    snack.position.set(0.5 - col * 0.08, 1.7 + row * 0.12, -0.3 + col * 0.06);
    store.add(snack);
  }

  const bentoGeo = new THREE.BoxGeometry(0.15, 0.12, 0.1);
  const bColors = [0xff9900, 0xff3333, 0x33cc33];
  for (let i = 0; i < 4; i++) {
    const b = makeToon(bentoGeo, bColors[i % 3], gradientMap);
    b.position.set(0.5, 0.9 + i * 0.15, -0.8);
    store.add(b);
  }

  const fridgeGeo = new THREE.BoxGeometry(1, 1.2, 0.6);
  const fridge = makeToon(fridgeGeo, 0x445566, gradientMap);
  fridge.position.set(-1.5, 0.6, -0.3);
  store.add(fridge); attachOutline(fridge);

  const fhGeo = new THREE.BoxGeometry(0.02, 0.5, 0.02);
  const fh = makeToon(fhGeo, 0x999999, gradientMap);
  fh.position.set(1.02, 0.6, -0.3);
  store.add(fh);

  const odenGeo = new THREE.BoxGeometry(0.8, 0.6, 0.6);
  const oden = makeToon(odenGeo, 0x223344, gradientMap);
  oden.position.set(1.5, 0.3, 0.5);
  store.add(oden); attachOutline(oden);

  const oLGeo = new THREE.BoxGeometry(0.7, 0.1, 0.5);
  const oL = makeToon(oLGeo, 0xdd4422, gradientMap);
  oL.position.set(1.5, 0.05, 0.5);
  store.add(oL);

  const storageGeo = new THREE.BoxGeometry(0.6, 1, 0.6);
  const storage = makeToon(storageGeo, 0x444444, gradientMap);
  storage.position.set(-2, 0.5, 0.3);
  store.add(storage);

  const guideGeo = new THREE.BoxGeometry(W * 0.7, 0.01, 0.01);
  const guide = makeToon(guideGeo, 0xffff00, gradientMap);
  guide.position.set(0, 0.02, -0.8);
  store.add(guide);

  const fridgeLightGeo = new THREE.BoxGeometry(0.8, 0.1, 0.4);
  const fLightMat = new THREE.MeshBasicMaterial({ color: 0xddeeff, transparent: true, opacity: 0.3 });
  const fLight = new THREE.Mesh(fridgeLightGeo, fLightMat);
  fLight.position.set(-1.5, 0.6, -0.3);
  store.add(fLight);

  store.position.set(0, 0, 0);
  scene.add(store);
  return store;
}

export function createAutomaticDoor(scene, gradientMap) {
  const doorGroup = new THREE.Group();
  const dw = 1.2, dh = 2.6;
  const doorMat = makeToon(new THREE.PlaneGeometry(dw, dh), 0x2244aa, gradientMap);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), doorMat.material);
  left.position.set(-0.6, 1.3, 0.08);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(dw, dh), doorMat.material.clone());
  right.position.set(0.6, 1.3, 0.08);
  doorGroup.add(left, right);
  doorGroup.position.set(0, 0, 0.08);
  scene.add(doorGroup);
  return { group: doorGroup, left, right };
}
