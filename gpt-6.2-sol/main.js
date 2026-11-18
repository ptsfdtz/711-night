import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { batchStatic, createKit } from './kit.js';
import { buildStage } from './wet.js';
import { buildStore } from './store.js';
import { buildStreet } from './street.js';
import { buildInterior } from './interior.js';
import { buildProps } from './props.js';
import { buildWeather } from './weather.js';

function start() {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '雨夜里的日式便利店微缩模型。拖动旋转，右键拖动平移，滚轮缩放。');
  document.body.append(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor('#0c1426');
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.01;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const world = new THREE.Group();
  scene.add(world);

  const camera = new THREE.PerspectiveCamera(28, 1, .12, 130);
  camera.position.set(17.7, 16.7, 23.4);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 1.49, .08);
  controls.enableDamping = true;
  controls.dampingFactor = .088;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.maxTargetRadius = 11;
  controls.minDistance = 6.7;
  controls.maxDistance = 64;
  controls.minPolarAngle = .18;
  controls.maxPolarAngle = Math.PI * .486;
  controls.rotateSpeed = .72;
  controls.panSpeed = .72;
  controls.zoomSpeed = .85;
  controls.zoomToCursor = true;
  controls.update();

  scene.add(new THREE.HemisphereLight('#accafa', '#7d7893', 1.04));
  const key = new THREE.DirectionalLight('#bfdaff', 1.23);
  key.position.set(-4, 8.5, 3.5);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#b9b7ff', .65);
  rim.position.set(5, 4.6, -7.5);
  scene.add(rim);

  const stage = buildStage(createKit(scene));
  const kit = createKit(world);
  const store = buildStore(kit);
  const street = buildStreet(kit);
  buildInterior(kit);
  buildProps(kit);
  const signal = street?.signal ?? [];
  for (const lens of signal) lens.userData.dynamic = true;
  batchStatic(world);
  const weather = buildWeather(kit, store);

  // The render target's own samples are used for the composite as well as the scene edges.
  const composite = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, composite);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .24, .53, .86);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    const width = window.innerWidth;
    const height = Math.max(1, window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.65, Math.sqrt(2600000 / (width * height)));
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(width, height);
    renderer.getDrawingBufferSize(stage.stage.material.uniforms.viewport.value);
    camera.aspect = width / height;
    camera.zoom = Math.min(1, camera.aspect / 1.35);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const signalGlow = signal.map(lens => {
    lens.material = lens.material.clone();
    return { color: lens.material.color.clone(), power: Math.max(1.56, lens.material.emissiveIntensity) };
  });
  const epoch = performance.now();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let lastDraw = 0;
  function smoothstep(x) {
    const y = Math.min(1, Math.max(0, x));
    return y * y * (3 - 2 * y);
  }

  renderer.setAnimationLoop(now => {
    if (document.hidden || now - lastDraw < 14) return;
    const delta = Math.min(.1, (now - lastDraw) / 1000);
    lastDraw = now;
    const seconds = (now - epoch) / 1000;
    const time = (reducedMotion.matches ? .12 : 1) * seconds;
    const doorCycle = (time + 9.8) % 17.6;
    const opening = smoothstep((doorCycle - 13.2) / .9) * (1 - smoothstep((doorCycle - 15.1) / 1.05));
    for (const { leaf, sign } of store.doors) leaf.position.x = -.016 + sign * (.391 + .721 * opening);
    const shimmer = Math.pow(Math.max(0, Math.sin(time * 1.37 + 1)), 23) * (.6 + .4 * Math.sin(time * 35));
    store.signLight.material.emissiveIntensity = 2.8 - .34 * shimmer;
    store.signPanel.emissiveIntensity = 1.26 - .15 * shimmer;
    const trafficCycle = (time + 1.25) % 19;
    const active = trafficCycle < 7.7 ? 0 : trafficCycle < 16.8 ? 2 : 1;
    for (let i = 0; i < signal.length; i++) {
      const lamp = signal[i].material;
      lamp.emissiveIntensity = i === active ? signalGlow[i].power : .07;
      lamp.color.copy(signalGlow[i].color).multiplyScalar(i === active ? 1 : .19);
    }
    weather.update(time);
    stage.asphalt.material.uniforms.time.value = time;
    controls.update();
    composer.render(delta);
  });
}

try {
  start();
} catch (error) {
  console.error(error);
  const fallback = document.createElement('div');
  fallback.className = 'fallback';
  fallback.textContent = '此设备无法启动 3D 场景。请在支持 WebGL 2 的浏览器中打开。';
  document.body.replaceChildren(fallback);
}
