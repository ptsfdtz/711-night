// Entry point: renderer, camera, global light, scene assembly, main loop.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildSky } from './sky.js';
import { buildStreet } from './street.js';
import { buildStore } from './store.js';
import { createEffects } from './effects.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x11182a, 0.017);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 220);
camera.position.set(16.5, 12.5, 20.5);

const controls = new OrbitControls(camera, canvas);
controls.target.set(-1.5, 1.6, 0.5);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 7;
controls.maxDistance = 48;
controls.maxPolarAngle = 1.45;
controls.update();

// --- global lighting: cold rainy night ---
const hemi = new THREE.HemisphereLight(0x3a4a6e, 0x141821, 0.55);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x8fa8d8, 0.5);
moon.position.set(18, 26, -14);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.left = -24;
moon.shadow.camera.right = 24;
moon.shadow.camera.top = 24;
moon.shadow.camera.bottom = -24;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 70;
moon.shadow.bias = -0.002;
scene.add(moon);

// --- build the diorama ---
buildSky(scene);
const street = buildStreet(scene);
const store = buildStore(scene);
const fx = createEffects(scene, { street, store });

// toon-shaded meshes participate in the soft moonlight shadow pass
scene.traverse((o) => {
  if (o.isMesh && o.material && o.material.isMeshToonMaterial) {
    o.castShadow = true;
    o.receiveShadow = true;
  }
});

// --- main loop ---
const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  fx.update(dt, clock.elapsedTime);
  controls.update();
  renderer.render(scene, camera);
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
