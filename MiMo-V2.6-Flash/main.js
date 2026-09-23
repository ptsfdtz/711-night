import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
import { setDefaultParent, glassUniforms, ST } from './js/core.js';
import { buildLights, buildBase, buildStreets, buildAlley, buildPuddles, buildReflections } from './js/street.js';
import { buildStore, anim } from './js/store.js';
import { buildProps, propsAnim } from './js/props.js';
import {
  buildAllEffects, updateRain, updateDrips, updateRipples,
  updateDoor, updateSignFlicker, updateTraffic, fx,
} from './js/effects.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const effect = new OutlineEffect(renderer, {
  defaultThickness: 0.0048,
  defaultColor: [0.045, 0.055, 0.1],
  defaultAlpha: 1.0,
  defaultKeepAlive: true,
});

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x0a1220, 32, 78);
setDefaultParent(scene);

{
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 512;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, '#060a14');
  g.addColorStop(0.45, '#0c1528');
  g.addColorStop(0.75, '#121c33');
  g.addColorStop(1.0, '#18243f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 2, 512);
  const bgTex = new THREE.CanvasTexture(c);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = bgTex;
}

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 220);
camera.position.set(12.5, 9.5, 15.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-1.2, 1.8, -0.2);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 6.5;
controls.maxDistance = 52;
controls.maxPolarAngle = Math.PI * 0.492;
controls.update();

buildLights(scene);
buildBase(scene);
buildStreets(scene);
buildAlley(scene, ST);
buildPuddles(scene);
const reflections = buildReflections(scene);
buildStore(scene);
buildProps(scene);
buildAllEffects(scene, reflections);

window.__cam = { camera, controls, anim };

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  controls.update();

  glassUniforms.uTime.value = t;

  updateRain(dt);
  updateDrips(dt);
  updateRipples(dt, scene);
  updateDoor(dt);
  updateSignFlicker(dt);
  updateTraffic(dt);

  // reflection shimmer
  for (let i = 0; i < fx.reflectionMats.length; i++) {
    const m = fx.reflectionMats[i];
    m.opacity = 0.35 + Math.sin(t * 1.7 + i * 1.3) * 0.1 + Math.sin(t * 4.1 + i) * 0.04;
  }

  // subtle street lamp warm pulse
  if (propsAnim.streetLight) {
    propsAnim.streetLight.intensity = 2.5 + Math.sin(t * 2.3) * 0.08;
  }

  effect.render(scene, camera);
}

animate();
