import * as THREE from 'three';
import { makeToon, attachOutline } from './utils.js';

export function createStreet(scene, gradientMap) {
  const street = new THREE.Group();

  const platformGeo = new THREE.BoxGeometry(12, 0.15, 12);
  const platformMat = makeToon(platformGeo, 0x2a2d38, gradientMap);
  platformMat.material.gradientMap = gradientMap;
  const platform = new THREE.Mesh(platformGeo, platformMat.material);
  platform.position.y = 0;
  street.add(platform);
  attachOutline(platform);

  const pavementGeo = new THREE.BoxGeometry(12, 0.02, 12);
  const pavementMat = makeToon(pavementGeo, 0x333540, gradientMap);
  pavementMat.material.gradientMap = gradientMap;
  const pavement = new THREE.Mesh(pavementGeo, pavementMat.material);
  pavement.position.y = 0.085;
  street.add(pavement);
  attachOutline(pavement);

  const zLineGeo = new THREE.BoxGeometry(12, 0.015, 0.06);
  const zLineMat = makeToon(zLineGeo, 0xffffff, gradientMap);
  zLineMat.material.gradientMap = gradientMap;
  const zLine = new THREE.Mesh(zLineGeo, zLineMat.material);
  zLine.position.set(0, 0.095, 0);
  street.add(zLine);

  const crosswalkGeo = new THREE.BoxGeometry(3, 0.015, 0.3);
  const crosswalkMat = makeToon(crosswalkGeo, 0xffffff, gradientMap);
  crosswalkMat.material.gradientMap = gradientMap;
  const crosswalk = new THREE.Mesh(crosswalkGeo, crosswalkMat.material);
  crosswalk.position.set(-1, 0.095, 3);
  crosswalk.rotation.y = 0.3;
  street.add(crosswalk);

  for (let i = 0; i < 5; i++) {
    const barGeo = new THREE.BoxGeometry(0.06, 0.015, 0.3);
    const barMat = makeToon(barGeo, 0xffffff, gradientMap);
    barMat.material.gradientMap = gradientMap;
    const bar = new THREE.Mesh(barGeo, barMat.material);
    bar.position.set(-1 + i * 0.15, 0.1, 3);
    bar.rotation.y = 0.3;
    street.add(bar);
  }

  const drainGeo = new THREE.BoxGeometry(0.4, 0.04, 0.15);
  const drainMat = makeToon(drainGeo, 0x555555, gradientMap);
  drainMat.material.gradientMap = gradientMap;
  const drain = new THREE.Mesh(drainGeo, drainMat.material);
  drain.position.set(-3, 0.095, 2);
  street.add(drain);

  const drainCoverGeo = new THREE.BoxGeometry(0.35, 0.02, 0.12);
  const drainCoverMat = makeToon(drainCoverGeo, 0x888888, gradientMap);
  drainCoverMat.material.gradientMap = gradientMap;
  const drainCover = new THREE.Mesh(drainCoverGeo, drainCoverMat.material);
  drainCover.position.set(-3, 0.11, 2);
  street.add(drainCover);

  const parkingLineGeo = new THREE.BoxGeometry(0.02, 0.01, 2.5);
  const parkingLineMat = makeToon(parkingLineGeo, 0xffffff, gradientMap);
  parkingLineMat.material.gradientMap = gradientMap;
  const parkingLine = new THREE.Mesh(parkingLineGeo, parkingLineMat.material);
  parkingLine.position.set(-5.5, 0.098, -1);
  parkingLine.rotation.y = Math.PI / 2;
  street.add(parkingLine);

  const parkingLine2Geo = new THREE.BoxGeometry(0.02, 0.01, 2.5);
  const parkingLine2 = new THREE.Mesh(parkingLine2Geo, parkingLineMat.material);
  parkingLine2.position.set(-4.5, 0.098, -1);
  parkingLine2.rotation.y = Math.PI / 2;
  street.add(parkingLine2);

  const streetLampPostGeo = new THREE.CylinderGeometry(0.05, 0.06, 4, 8);
  const lampPostMat = makeToon(streetLampPostGeo, 0x444444, gradientMap);
  lampPostMat.material.gradientMap = gradientMap;
  const lampPost1 = new THREE.Mesh(streetLampPostGeo, lampPostMat.material);
  lampPost1.position.set(-4, 2, -3);
  street.add(lampPost1);
  attachOutline(lampPost1);

  const lampHeadGeo = new THREE.BoxGeometry(0.3, 0.15, 0.3);
  const lampHeadMat = makeToon(lampHeadGeo, 0x555555, gradientMap);
  lampHeadMat.material.gradientMap = gradientMap;
  const lampHead1 = new THREE.Mesh(lampHeadGeo, lampHeadMat.material);
  lampHead1.position.set(-4, 4.1, -3);
  street.add(lampHead1);
  attachOutline(lampHead1);

  const lampBulbGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const lampBulbMat = makeToon(lampBulbGeo, 0xffcc66, gradientMap);
  lampBulbMat.material.gradientMap = gradientMap;
  const lampBulb1 = new THREE.Mesh(lampBulbGeo, lampBulbMat.material);
  lampBulb1.position.set(-4, 4.15, -3);
  street.add(lampBulb1);

  const lampPost2 = new THREE.Mesh(streetLampPostGeo, lampPostMat.material);
  lampPost2.position.set(5, 2, 2);
  street.add(lampPost2);
  attachOutline(lampPost2);

  const lampHead2 = new THREE.Mesh(lampHeadGeo, lampHeadMat.material);
  lampHead2.position.set(5, 4.1, 2);
  street.add(lampHead2);
  attachOutline(lampHead2);

  const lampBulb2 = new THREE.Mesh(lampBulbGeo, lampBulbMat.material);
  lampBulb2.position.set(5, 4.15, 2);
  street.add(lampBulb2);

  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 5, 6);
  const poleMat = makeToon(poleGeo, 0x555555, gradientMap);
  poleMat.material.gradientMap = gradientMap;
  const pole = new THREE.Mesh(poleGeo, poleMat.material);
  pole.position.set(-5.5, 2.5, 0);
  street.add(pole);
  attachOutline(pole);

  const wireGeo = new THREE.BufferGeometry();
  const wirePoints = new Float32Array([
    -5.5, 2.6, 0, -4, 3.5, 0,
    -4, 3.5, 0, -3, 4.2, 0,
    5, 2.6, 0, 5.5, 3, 0
  ]);
  wireGeo.setAttribute('position', new THREE.BufferAttribute(wirePoints, 3));
  const wireMat = new THREE.LineBasicMaterial({ color: 0x444444 });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  street.add(wire);

  const signPostGeo = new THREE.CylinderGeometry(0.04, 0.05, 2, 6);
  const signPostMat = makeToon(signPostGeo, 0x444444, gradientMap);
  signPostMat.material.gradientMap = gradientMap;
  const signPost = new THREE.Mesh(signPostGeo, signPostMat.material);
  signPost.position.set(4.5, 1, 3.5);
  street.add(signPost);

  const signBoardGeo = new THREE.BoxGeometry(0.8, 0.5, 0.05);
  const signBoardMat = makeToon(signBoardGeo, 0xcc3333, gradientMap);
  signBoardMat.material.gradientMap = gradientMap;
  const signBoard = new THREE.Mesh(signBoardGeo, signBoardMat.material);
  signBoard.position.set(4.5, 2.1, 3.5);
  street.add(signBoard);
  attachOutline(signBoard);

  const bikeGeo = new THREE.Group();
  const frameGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6);
  const frameMat = makeToon(frameGeo, 0x3366ff, gradientMap);
  frameMat.material.gradientMap = gradientMap;
  const frame = new THREE.Mesh(frameGeo, frameMat.material);
  frame.rotation.z = Math.PI / 2;
  frame.position.y = 0.8;
  bikeGeo.add(frame);

  const wheelGeo = new THREE.TorusGeometry(0.3, 0.03, 8, 16);
  const wheelMat = makeToon(wheelGeo, 0x222222, gradientMap);
  wheelMat.material.gradientMap = gradientMap;
  const wheel1 = new THREE.Mesh(wheelGeo, wheelMat.material);
  wheel1.position.set(0, 0.3, 0);
  bikeGeo.add(wheel1);
  const wheel2 = new THREE.Mesh(wheelGeo, wheelMat.material);
  wheel2.position.set(0, 0.3, 0);
  wheel2.rotation.y = Math.PI / 2;
  bikeGeo.add(wheel2);

  const basketGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
  const basketMat = makeToon(basketGeo, 0x888888, gradientMap);
  basketMat.material.gradientMap = gradientMap;
  const basket = new THREE.Mesh(basketGeo, basketMat.material);
  basket.position.set(0, 0.9, 0);
  bikeGeo.add(basket);

  bikeGeo.position.set(-5.5, 0, 2.5);
  bikeGeo.rotation.y = 0.3;
  street.add(bikeGeo);

  const bike2Geo = bikeGeo.clone();
  bike2Geo.position.set(-5, 0, 3);
  bike2Geo.rotation.y = -0.5;
  street.add(bike2Geo);

  const umbrellaStandGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 12);
  const umbrellaStandMat = makeToon(umbrellaStandGeo, 0x888888, gradientMap);
  umbrellaStandMat.material.gradientMap = gradientMap;
  const umbrellaStand = new THREE.Mesh(umbrellaStandGeo, umbrellaStandMat.material);
  umbrellaStand.position.set(3, 0.03, 2);
  street.add(umbrellaStand);
  attachOutline(umbrellaStand);

  const umbrellaGeo = new THREE.CylinderGeometry(0.5, 0.05, 1, 8);
  const umbrellaMat = makeToon(umbrellaGeo, 0xcc3366, gradientMap);
  umbrellaMat.material.gradientMap = gradientMap;
  const umbrella = new THREE.Mesh(umbrellaGeo, umbrellaMat.material);
  umbrella.position.set(3, 0.55, 2);
  umbrella.rotation.x = Math.PI / 2;
  street.add(umbrella);
  attachOutline(umbrella);

  const trashCanGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8);
  const trashCanMat = makeToon(trashCanGeo, 0x444444, gradientMap);
  trashCanMat.material.gradientMap = gradientMap;
  const trashCan = new THREE.Mesh(trashCanGeo, trashCanMat.material);
  trashCan.position.set(-5.5, 0.3, 3.5);
  street.add(trashCan);
  attachOutline(trashCan);

  const trashCanLidGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.03, 8);
  const trashCanLidMat = makeToon(trashCanLidGeo, 0x555555, gradientMap);
  trashCanLidMat.material.gradientMap = gradientMap;
  const trashCanLid = new THREE.Mesh(trashCanLidGeo, trashCanLidMat.material);
  trashCanLid.position.set(-5.5, 0.62, 3.5);
  street.add(trashCanLid);

  const railingGeo = new THREE.BoxGeometry(0.04, 0.8, 1);
  const railingMat = makeToon(railingGeo, 0x666666, gradientMap);
  railingMat.material.gradientMap = gradientMap;
  const railing1 = new THREE.Mesh(railingGeo, railingMat.material);
  railing1.position.set(-6, 0.4, 3);
  street.add(railing1);

  const railing2 = new THREE.Mesh(railingGeo, railingMat.material);
  railing2.position.set(-6, 0.4, 1.5);
  street.add(railing2);

  const railingPostGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
  const railingPostMat = makeToon(railingPostGeo, 0x555555, gradientMap);
  railingPostMat.material.gradientMap = gradientMap;
  for (let i = 0; i < 4; i++) {
    const post = new THREE.Mesh(railingPostGeo, railingPostMat.material);
    post.position.set(-6, 0.4, 3 - i * 0.5);
    street.add(post);
  }

  const alleyGeo = new THREE.BoxGeometry(0.15, 2, 2);
  const alleyMat = makeToon(alleyGeo, 0x222233, gradientMap);
  alleyMat.material.gradientMap = gradientMap;
  const alley = new THREE.Mesh(alleyGeo, alleyMat.material);
  alley.position.set(-5.5, 1, -4.5);
  street.add(alley);
  attachOutline(alley);

  const alleySignGeo = new THREE.PlaneGeometry(0.4, 0.3);
  const alleySignMat = makeToon(alleySignGeo, 0x666666, gradientMap);
  alleySignMat.material.gradientMap = gradientMap;
  const alleySign = new THREE.Mesh(alleySignGeo, alleySignMat.material);
  alleySign.position.set(-5.57, 1.5, -4.5);
  alleySign.rotation.y = Math.PI / 2;
  street.add(alleySign);

  const acUnitGeo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
  const acUnitMat = makeToon(acUnitGeo, 0x333333, gradientMap);
  acUnitMat.material.gradientMap = gradientMap;
  const acUnit = new THREE.Mesh(acUnitGeo, acUnitMat.material);
  acUnit.position.set(-5.8, 2.5, -3);
  street.add(acUnit);
  attachOutline(acUnit);

  const bulletinBoardGeo = new THREE.BoxGeometry(0.6, 0.8, 0.04);
  const bulletinBoardMat = makeToon(bulletinBoardGeo, 0xcc9933, gradientMap);
  bulletinBoardMat.material.gradientMap = gradientMap;
  const bulletinBoard = new THREE.Mesh(bulletinBoardGeo, bulletinBoardMat.material);
  bulletinBoard.position.set(4.5, 2.5, -3.5);
  street.add(bulletinBoard);
  attachOutline(bulletinBoard);

  const noticeGeo = new THREE.BoxGeometry(0.15, 0.1, 0.01);
  const noticeMat = makeToon(noticeGeo, 0xffffff, gradientMap);
  noticeMat.material.gradientMap = gradientMap;
  const notice1 = new THREE.Mesh(noticeGeo, noticeMat.material);
  notice1.position.set(4.5, 2.6, -3.48);
  street.add(notice1);

  const notice2 = new THREE.Mesh(noticeGeo, noticeMat.material);
  notice2.position.set(4.5, 2.75, -3.48);
  street.add(notice2);

  const bucketGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.3, 8);
  const bucketMat = makeToon(bucketGeo, 0x999999, gradientMap);
  bucketMat.material.gradientMap = gradientMap;
  const bucket = new THREE.Mesh(bucketGeo, bucketMat.material);
  bucket.position.set(3.5, 0.15, 3.5);
  street.add(bucket);
  attachOutline(bucket);

  const puddleGeo = new THREE.CircleGeometry(0.5, 24);
  const puddleMat = new THREE.MeshToonMaterial({ color: 0x335577, transparent: true, opacity: 0.5 });
  const puddle = new THREE.Mesh(puddleGeo, puddleMat);
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-1, 0.01, 3.5);
  street.add(puddle);

  const puddle2Geo = new THREE.CircleGeometry(0.3, 24);
  const puddle2Mat = new THREE.MeshToonMaterial({ color: 0x335577, transparent: true, opacity: 0.4 });
  const puddle2 = new THREE.Mesh(puddle2Geo, puddle2Mat);
  puddle2.rotation.x = -Math.PI / 2;
  puddle2.position.set(2, 0.01, 2.5);
  street.add(puddle2);

  const puddle3Geo = new THREE.CircleGeometry(0.4, 24);
  const puddle3Mat = new THREE.MeshToonMaterial({ color: 0x335577, transparent: true, opacity: 0.45 });
  const puddle3 = new THREE.Mesh(puddle3Geo, puddle3Mat);
  puddle3.rotation.x = -Math.PI / 2;
  puddle3.position.set(-3, 0.01, 1);
  street.add(puddle3);

  scene.add(street);
  return street;
}
