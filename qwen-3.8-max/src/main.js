// main.js — renderer, camera, orbit controls, toon/bloom post-processing and
// the animation loop that ties every subsystem together.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { buildEnvironment } from './environment.js';
import { buildStore } from './store.js';
import { buildProps } from './props.js';
import { buildWeather } from './weather.js';

/* ------------------------------------------------------------------ *
 * Renderer / scene / camera
 * ------------------------------------------------------------------ */
const canvas = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.45;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(13.5, 9.5, 15.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-0.8, 1.4, -1.2);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 7;
controls.maxDistance = 38;
controls.maxPolarAngle = Math.PI * 0.495;   // never dip under the plinth
controls.minPolarAngle = Math.PI * 0.08;
controls.enablePan = false;
controls.rotateSpeed = 0.75;
controls.zoomSpeed = 0.8;
controls.autoRotate = true;                 // gentle showcase spin…
controls.autoRotateSpeed = 0.35;
// …which yields to full manual control the moment the user interacts.
controls.addEventListener('start', () => { controls.autoRotate = false; });

/* ------------------------------------------------------------------ *
 * Build the diorama
 * ------------------------------------------------------------------ */
const environment = buildEnvironment(scene);
const store = buildStore(scene);
const props = buildProps(scene);
const weather = buildWeather(scene);

/* ------------------------------------------------------------------ *
 * Post-processing: toon render + neon bloom
 * ------------------------------------------------------------------ */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
composer.setSize(window.innerWidth, window.innerHeight);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.85,   // strength
  0.6,    // radius
  0.45    // threshold — only the neon/glow materials bloom
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

/* ------------------------------------------------------------------ *
 * Resize
 * ------------------------------------------------------------------ */
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  bloomPass.resolution.set(w, h);
}
window.addEventListener('resize', onResize);

/* ------------------------------------------------------------------ *
 * Animation loop
 * ------------------------------------------------------------------ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  store.update(dt, t);
  props.update(dt, t);
  weather.update(dt, t);

  controls.update();
  composer.render();
}
animate();

// Expose for console tinkering (no visible UI).
window.__diorama = { scene, camera, renderer, controls, environment, store, props, weather };
