import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createStore } from './store.js';
import { createStreet } from './street.js';
import { createEffects } from './effects.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x14232b);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(15, 10, 19);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.35, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 9;
controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI / 2.03;
controls.screenSpacePanning = true;
controls.update();

scene.add(new THREE.HemisphereLight(0x9dc1d5, 0x243036, 2.0));
const moon = new THREE.DirectionalLight(0x9fbcd7, 2.2);
moon.position.set(-6, 12, 5);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -10;
moon.shadow.camera.right = 10;
moon.shadow.camera.top = 10;
moon.shadow.camera.bottom = -10;
moon.shadow.normalBias = 0.035;
scene.add(moon);
const fill = new THREE.DirectionalLight(0x91b4c8, 0.8);
fill.position.set(8, 5, -8);
scene.add(fill);

const street = createStreet(THREE);
const store = createStore(THREE);
scene.add(street);
scene.add(store);
const updateEffects = createEffects(THREE, scene);

const clock = new THREE.Clock();
function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  updateEffects(clock.elapsedTime, delta);
  store.userData.update?.(clock.elapsedTime);
  const phase = clock.elapsedTime % 24;
  const activeSignal = phase < 10 ? 2 : phase < 12 ? 1 : 0;
  street.userData.trafficSignals.forEach((signal, index) => {
    signal.material.emissiveIntensity = index === activeSignal ? 1.5 : 0.15;
  });
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = camera.aspect < 1 ? 74 : 35;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.dispatchEvent(new Event('resize'));
