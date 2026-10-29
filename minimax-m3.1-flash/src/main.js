import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

import { PAL } from './core/palette.js';
import { Rig, BASE } from './core/layout.js';
import * as TX from './core/textures.js';
import { createMaterials } from './core/materials.js';
import { buildBase, buildSidewalks, buildRoadMarkings, buildRoad, buildPuddles, buildTactilePaving } from './world/diorama.js';
import { buildStore, buildStoreExtras } from './world/store.js';
import { buildInterior } from './world/interior.js';
import { buildProps } from './world/props.js';
import { buildRain } from './fx/rain.js';
import { buildEffects } from './fx/effects.js';

const canvas = document.getElementById('stage');

/* ------------------------------------------------------------------ *
 *  渲染器
 * ------------------------------------------------------------------ */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  stencil: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const effect = new OutlineEffect(renderer, {
  defaultThickness: 0.0042,
  defaultColor: [0.016, 0.024, 0.055],
  defaultAlpha: 0.92,
});

/* ------------------------------------------------------------------ *
 *  场景 / 相机
 * ------------------------------------------------------------------ */
const scene = new THREE.Scene();
scene.background = TX.skyTexture();
scene.fog = new THREE.FogExp2(PAL.fog, 0.0175);

const camera = new THREE.PerspectiveCamera(37, window.innerWidth / window.innerHeight, 0.1, 140);
camera.position.set(10.2, 6.3, 11.6);

const controls = new OrbitControls(camera, canvas);
controls.target.set(-0.5, 1.3, -0.2);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.75;
controls.panSpeed = 0.5;
controls.screenSpacePanning = false;
controls.minDistance = 6.5;
controls.maxDistance = 32;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI * 0.495;
controls.autoRotateSpeed = 0.28;

/* ------------------------------------------------------------------ *
 *  环境反射（湿路面的高光来源）
 * ------------------------------------------------------------------ */
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const envTex = TX.envTexture();
const envRT = pmrem.fromEquirectangular(envTex);
scene.environment = envRT.texture;
envTex.dispose();
pmrem.dispose();

/* ------------------------------------------------------------------ *
 *  灯光
 * ------------------------------------------------------------------ */
const hemi = new THREE.HemisphereLight(PAL.ambientSky, PAL.ambientGround, 0.95);
scene.add(hemi);

const moon = new THREE.DirectionalLight(PAL.moon, 0.82);
moon.position.set(8.5, 13, 6.5);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -10;
moon.shadow.camera.right = 10;
moon.shadow.camera.top = 10;
moon.shadow.camera.bottom = -10;
moon.shadow.camera.near = 2;
moon.shadow.camera.far = 42;
moon.shadow.bias = -0.0006;
moon.shadow.normalBias = 0.035;
scene.add(moon);
scene.add(moon.target);

const fill = new THREE.DirectionalLight(0x6f86c8, 0.26);
fill.position.set(-9, 6, -7);
scene.add(fill);

// 便利店门口洒出的人造光
const doorSpill = new THREE.SpotLight(PAL.warmLight, 13, 10.5, 0.95, 0.8, 1.5);
doorSpill.position.set(0.0, 2.42, 1.55);
doorSpill.target.position.set(0.1, 0, 3.1);
doorSpill.castShadow = true;
doorSpill.shadow.mapSize.set(1024, 1024);
doorSpill.shadow.bias = -0.001;
doorSpill.shadow.normalBias = 0.03;
doorSpill.shadow.camera.near = 0.4;
doorSpill.shadow.camera.far = 12;
scene.add(doorSpill, doorSpill.target);

/* ------------------------------------------------------------------ *
 *  构建场景
 * ------------------------------------------------------------------ */
const rig = new Rig();
const mats = createMaterials();

buildBase(scene, mats);
buildSidewalks(scene, mats);
buildRoad(scene, mats);
buildRoadMarkings(scene, mats);
buildPuddles(scene, mats, rig);
buildTactilePaving(scene, mats);

buildStore(scene, mats, rig);
buildStoreExtras(scene, mats);
buildInterior(scene, mats, rig);
buildProps(scene, mats, rig);

buildEffects(scene, rig);
const rain = buildRain(scene, { count: 3400, area: 34, height: 15, width: 0.017 });

/* —— 模型底座下方的暗面 —— */
const groundPlane = new THREE.Mesh(
  new THREE.CircleGeometry(46, 48),
  new THREE.MeshBasicMaterial({ color: 0x070a12 })
);
groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = -BASE.thickness - 0.012;
scene.add(groundPlane);

/* ------------------------------------------------------------------ *
 *  交互 / 循环
 * ------------------------------------------------------------------ */
let lastInteraction = performance.now();
const markInteraction = () => { lastInteraction = performance.now(); };
controls.addEventListener('start', markInteraction);
canvas.addEventListener('pointerdown', markInteraction);
canvas.addEventListener('wheel', markInteraction, { passive: true });

const clock = new THREE.Clock();
const targetBox = new THREE.Vector3();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  // 闲置一段时间后缓慢自转
  const idle = (performance.now() - lastInteraction) / 1000;
  controls.autoRotate = idle > 12;

  rig.update(t, dt);
  rain.update(t, camera, controls.target);

  // 限制平移范围，保持模型居中
  targetBox.copy(controls.target);
  targetBox.x = THREE.MathUtils.clamp(targetBox.x, -3.2, 3.2);
  targetBox.y = THREE.MathUtils.clamp(targetBox.y, 0.2, 2.6);
  targetBox.z = THREE.MathUtils.clamp(targetBox.z, -3.2, 3.2);
  controls.target.copy(targetBox);

  controls.update();
  effect.render(scene, camera);
  requestAnimationFrame(animate);
}

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

/* 便于截图/调试：?cam=x,y,z,tx,ty,tz 指定初始机位 */
const camParam = new URLSearchParams(location.search).get('cam');
if (camParam) {
  const v = camParam.split(',').map(Number);
  if (v.length >= 6 && v.every((n) => Number.isFinite(n))) {
    camera.position.set(v[0], v[1], v[2]);
    controls.target.set(v[3], v[4], v[5]);
  }
}

animate();
