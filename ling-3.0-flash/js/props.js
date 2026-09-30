import * as THREE from 'three';
import { makeToon, attachOutline } from './utils.js';

export function createProps(scene, gradientMap) {
  const props = new THREE.Group();

  const bikeGeo = new THREE.Group();
  const frameGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6);
  const bikeFrame = makeToon(frameGeo, 0x3366ff, gradientMap);
  bikeFrame.rotation.z = Math.PI / 2; bikeFrame.position.y = 0.8;
  bikeGeo.add(bikeFrame);

  const wGeo = new THREE.TorusGeometry(0.3, 0.03, 8, 16);
  const wMat = makeToon(wGeo, 0x222222, gradientMap);
  const wb1 = new THREE.Mesh(wGeo, wMat); wb1.position.set(0, 0.3, 0); bikeGeo.add(wb1);
  const wb2 = new THREE.Mesh(wGeo, wMat); wb2.position.set(0, 0.3, 0); wb2.rotation.y = Math.PI / 2; bikeGeo.add(wb2);

  const basketGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
  const basket = makeToon(basketGeo, 0x888888, gradientMap);
  basket.position.set(0, 0.9, 0); bikeGeo.add(basket);

  bikeGeo.position.set(-5.5, 0, 2.5); bikeGeo.rotation.y = 0.3;
  props.add(bikeGeo);

  const bike2 = bikeGeo.clone();
  bike2.position.set(-5, 0, 3); bike2.rotation.y = -0.5;
  props.add(bike2);

  const umStandGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12);
  const umStand = makeToon(umStandGeo, 0x888888, gradientMap);
  umStand.position.set(3, 0.03, 2);
  props.add(umStand); attachOutline(umStand);

  const umGeo = new THREE.CylinderGeometry(0.5, 0.05, 1, 8);
  const um = makeToon(umGeo, 0xcc3366, gradientMap);
  um.position.set(3, 0.55, 2); um.rotation.x = Math.PI / 2;
  props.add(um); attachOutline(um);

  const umHandleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4);
  const umHandle = makeToon(umHandleGeo, 0x888888, gradientMap);
  umHandle.position.set(3, 1.05, 2);
  props.add(umHandle);

  const trashGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8);
  const trash = makeToon(trashGeo, 0x444444, gradientMap);
  trash.position.set(-5.5, 0.3, 3.5);
  props.add(trash); attachOutline(trash);

  const trashLidGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.03, 8);
  const trashLid = makeToon(trashLidGeo, 0x555555, gradientMap);
  trashLid.position.set(-5.5, 0.62, 3.5);
  props.add(trashLid);

  const bucketGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.3, 8);
  const bucket = makeToon(bucketGeo, 0x999999, gradientMap);
  bucket.position.set(3.5, 0.15, 3.5);
  props.add(bucket); attachOutline(bucket);

  const bucket2Geo = new THREE.CylinderGeometry(0.12, 0.15, 0.25, 8);
  const bucket2 = makeToon(bucket2Geo, 0x777777, gradientMap);
  bucket2.position.set(3.8, 0.125, 3.5);
  props.add(bucket2);

  const noticeGeo = new THREE.BoxGeometry(0.4, 0.5, 0.04);
  const noticeMat = makeToon(noticeGeo, 0xcc9933, gradientMap);
  const notice = new THREE.Mesh(noticeGeo, noticeMat.material);
  notice.position.set(4.5, 2.5, -3.5);
  props.add(notice); attachOutline(notice);

  const acUnitGeo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
  const acUnit = makeToon(acUnitGeo, 0x333333, gradientMap);
  acUnit.position.set(-5.8, 2.5, -3);
  props.add(acUnit); attachOutline(acUnit);

  const acVentGeo = new THREE.BoxGeometry(0.02, 0.05, 0.05);
  for (let i = 0; i < 3; i++) {
    const vent = makeToon(acVentGeo, 0x666666, gradientMap);
    vent.position.set(-5.8, 2.5 - i * 0.15, -3);
    props.add(vent);
  }

  const umbrellaStandGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12);
  const umbrellaStand2 = makeToon(umbrellaStandGeo, 0x888888, gradientMap);
  umbrellaStand2.position.set(3, 0.03, 3);
  props.add(umbrellaStand2); attachOutline(umbrellaStand2);

  const umbrella2Geo = new THREE.ConeGeometry(0.5, 1, 8);
  const umbrella2 = makeToon(umbrella2Geo, 0x6699cc, gradientMap);
  umbrella2.position.set(3, 0.55, 3); umbrella2.rotation.x = Math.PI / 2;
  props.add(umbrella2); attachOutline(umbrella2);

  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 5, 6);
  const poleMat = makeToon(poleGeo, 0x555555, gradientMap);
  const pole = new THREE.Mesh(poleGeo, poleMat.material);
  pole.position.set(-5.5, 2.5, 0);
  props.add(pole); attachOutline(pole);

  const signBoardGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
  const signBoardMat = makeToon(signBoardGeo, 0xcc3333, gradientMap);
  const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat.material);
  signBoard.position.set(4.5, 2.1, 3.5);
  props.add(signBoard); attachOutline(signBoard);

  const bikeRepairGeo = new THREE.BoxGeometry(0.3, 0.05, 0.2);
  const bikeRepair = makeToon(bikeRepairGeo, 0x888888, gradientMap);
  bikeRepair.position.set(-5.3, 0.3, 2.8);
  props.add(bikeRepair);

  const newspaperGeo = new THREE.BoxGeometry(0.1, 0.15, 0.01);
  const newspaperMat = makeToon(newspaperGeo, 0xffffff, gradientMap);
  const newspaper = new THREE.Mesh(newspaperGeo, newspaperMat.material);
  newspaper.position.set(4.6, 2.4, -3.5);
  props.add(newspaper);

  props.position.set(0, 0, 0);
  scene.add(props);
  return props;
}
