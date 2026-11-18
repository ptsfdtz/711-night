import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TX from './textures.js';
import { makeCtx, timeU } from './common.js';
import { buildGround } from './ground.js';
import { buildStore } from './store.js';
import { buildProps } from './props.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = TX.backgroundTexture();
scene.fog = new THREE.FogExp2(0x0a1226, 0.016);

const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(19, 13, 21);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 8;
controls.maxDistance = 46;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.target.set(0, 1.6, 1.2);
controls.update();

const hemi = new THREE.HemisphereLight(0x4a5f8a, 0x0d1420, 0.6);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0x9fb6e0, 0.7);
moon.position.set(16, 24, -12);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
moon.shadow.camera.left = -22;
moon.shadow.camera.right = 22;
moon.shadow.camera.top = 22;
moon.shadow.camera.bottom = -22;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 70;
moon.shadow.bias = -0.002;
scene.add(moon);

const c = makeCtx();
scene.add(c.root);
buildGround(c);
buildStore(c);
buildProps(c);

const TRAFFIC_ON = [0xff3b3b, 0xffd23b, 0x46d97a];
const TRAFFIC_OFF = [0x2a0c10, 0x2a2410, 0x0b2614];

const clock = new THREE.Clock();
function tick() {
  requestAnimationFrame(tick);
  const dt = Math.min(clock.getDelta(), 0.05);
  timeU.value += dt;
  const t = timeU.value;
  const { refs } = c;

  for (const d of refs.doors) {
    const k = 0.5 - 0.5 * Math.cos(t * 0.7 + d.base);
    d.g.position.x = d.base + d.dir * d.span * k;
  }
  for (const f of refs.fans) f.o.rotation[f.axis] += f.speed * dt;

  const flicker = 0.82 + 0.18 * Math.sin(t * 11.0) * Math.sin(t * 3.3);
  if (refs.chime) refs.chime.emissiveIntensity = 0.4 + 0.3 * Math.max(0, Math.sin(t * 2.2));
  for (const m of refs.interiorFlicker) m.emissiveIntensity = 0.85 * flicker;
  for (const m of refs.eaves) m.emissiveIntensity = 0.9 * flicker;
  for (const m of refs.signMats) m.emissiveIntensity = 0.85 + 0.15 * flicker;
  for (const m of refs.vendingMats) m.emissiveIntensity = 0.7 + 0.3 * flicker;

  if (refs.traffic) {
    const phase = Math.floor(t / 2.5) % 3;
    [refs.traffic.red, refs.traffic.yel, refs.traffic.grn].forEach((mat, i) => {
      mat.color.setHex(i === phase ? TRAFFIC_ON[i] : TRAFFIC_OFF[i]);
    });
  }

  controls.update();
  renderer.render(scene, camera);
}
tick();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
