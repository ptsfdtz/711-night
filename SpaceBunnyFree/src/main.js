import * as THREE from 'three';

import { clamp, damp } from './core/utils.js';
import { emissiveRegistry, updateFlicker, PAL, toon } from './core/materials.js';
import { asphaltTexture, skyTexture } from './core/textures.js';
import { MiniatureControls } from './core/camera.js';
import { PostFX } from './core/postfx.js';
import {
  PlanarReflector, wetGroundMaterial, puddleMaskTexture, markReflect,
} from './core/reflection.js';

import { L } from './world/layout.js';
import { buildDiorama } from './world/diorama.js';
import { buildStore } from './world/store.js';
import { buildInterior } from './world/interior.js';
import { buildProps } from './world/props.js';

import { makeRain, makeSplashes } from './fx/rain.js';
import { makeDrips } from './fx/drips.js';

/* ================================================================== *
 *  雨夜コンビニ — a rain-night convenience store street corner,
 *  built as a hand-sized diorama you can orbit freely.
 * ================================================================== */

const canvas = document.getElementById('stage');

/* ----------------------------- renderer ---------------------------- */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  alpha: false,
  stencil: false,
  powerPreference: 'high-performance',
});
const MAX_DPR = Math.min(window.devicePixelRatio || 1, 1.75);
let dpr = MAX_DPR;
renderer.setPixelRatio(dpr);
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.toneMapping = THREE.NoToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
/* ------------------------------------------------------------------ *
 * The scene is lit almost entirely by local sources, so a single moon
 * shadow map bought very little and cost a whole extra scene pass.
 * ------------------------------------------------------------------ */
renderer.shadowMap.enabled = false;
renderer.setClearColor(0x0a0e1a, 1);

/* ------------------------------- scene ----------------------------- */
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0d1426, 0.0135);

const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 300);
camera.position.set(24, 15, 25);
camera.layers.enable(0);

const controls = new MiniatureControls(camera, canvas, {
  target: new THREE.Vector3(-1.3, 2.0, -0.4),
  minDistance: 9,
  maxDistance: 46,
  minPolar: 0.2,
  maxPolar: 1.4,
  idleSpin: 0.026,
});
controls.focus(new THREE.Vector3(-1.3, 2.0, -0.4), 23, 0.76, 1.14);

/* ------------------------------- sky ------------------------------- */
function buildSky() {
  const geo = new THREE.SphereGeometry(150, 24, 18);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      tGrad: { value: skyTexture(512) },
      uGlowColor: { value: new THREE.Color(0xffb98a) },
      uMoon: { value: new THREE.Vector3(-0.55, 0.42, -0.72).normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uGlowColor;
      uniform vec3 uMoon;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        // deep overcast night — almost no light up top, a faint sodium
        // haze where the city sits just below the cloud deck
        vec3 top = vec3(0.006, 0.011, 0.030);
        vec3 mid = vec3(0.016, 0.026, 0.058);
        vec3 low = vec3(0.052, 0.056, 0.086);
        vec3 c = mix(low, mid, smoothstep(-0.02, 0.24, h));
        c = mix(c, top, smoothstep(0.16, 0.9, h));
        float horizon = pow(max(0.0, 1.0 - abs(h - 0.015) * 4.2), 3.0);
        c += uGlowColor * horizon * 0.055;
        float m = pow(max(dot(vDir, uMoon), 0.0), 30.0);
        c += vec3(0.16, 0.20, 0.30) * m * 0.42;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.userData.noOutline = true;
  sky.userData.noReflect = false;
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  markReflect(sky);
  scene.add(sky);
  return sky;
}
buildSky();

/* ----------------------------- lighting ---------------------------- */
const hemi = new THREE.HemisphereLight(0x3c5480, 0x0b0f18, 0.30);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0x8aa4d8, 0.34);
moon.position.set(20, 26, -16);
moon.target.position.set(-1, 0, 0);
scene.add(moon);
scene.add(moon.target);

// cool fill from the street so the shop front never goes fully black
const fill = new THREE.DirectionalLight(0x5f7fc0, 0.11);
fill.position.set(-14, 8, 18);
scene.add(fill);

/* --------------------- wet ground + reflection --------------------- */
// The mirror plane sits at pavement level so the neon smears land
// correctly on the sidewalk right outside the shop.
const reflector = new PlanarReflector(renderer, {
  resolution: 0.42,
  planeY: L.walkTop,
});

const groundMat = wetGroundMaterial({
  reflectionTexture: reflector.rt.texture,
  puddleTexture: puddleMaskTexture(1024, L.base),
  grainTexture: asphaltTexture(512),
  base: 0x1d2230,
  baseDark: 0x12161f,
  sheen: 0x9ecbff,
  worldSize: L.base,
  strength: 1.2,
  lightA: 0xffb066,
  lightB: 0x5f9ce0,
  toonSteps: 3,
});

/* ------------------------------- world ----------------------------- */
const ctx = { groundMaterial: groundMat, reflectionTexture: reflector.rt.texture };
scene.add(buildDiorama(ctx));
scene.add(buildStore(ctx));
scene.add(buildInterior(ctx));
scene.add(buildProps(ctx));

/* -------------------------------- fx ------------------------------- */
const rain = makeRain({ count: 4200, opacity: 0.5 });
scene.add(rain.mesh);

const splashes = makeSplashes({ count: 320 });
scene.add(splashes.mesh);

// drip lines: awning lip, roof gutters, sign unders, vending tops
const S = L.store;
const dripLines = [
  // awning front edge
  { x0: -2.5, y0: 2.6, z0: S.z1 + 1.3, x1: 1.85, y1: 2.6, z1: S.z1 + 1.3, weight: 3 },
  // front parapet gutter
  { x0: S.x0 + 0.2, y0: 5.02, z0: S.z1 + 0.12, x1: S.x1 - 0.2, y1: 5.02, z1: S.z1 + 0.12, weight: 2 },
  // east parapet gutter
  { x0: S.x1 + 0.12, y0: 5.02, z0: S.z0 + 0.3, x1: S.x1 + 0.12, y1: 5.02, z1: S.z1 - 0.4, weight: 2 },
  // roof sign edge
  { x0: -5.9, y0: 5.15, z0: S.z1 + 0.3, x1: 2.6, y1: 5.15, z1: S.z1 + 0.3, weight: 1 },
  // vending machine tops
  { x0: 3.75, y0: 2.18, z0: -3.65, x1: 3.75, y1: 2.18, z1: -3.0, weight: 1.6 },
  { x0: 3.75, y0: 2.12, z0: -4.8, x1: 3.75, y1: 2.12, z1: -4.2, weight: 1.2 },
  // neighbour block ledge
  { x0: L.neighbour.x1 - 0.1, y0: 6.2, z0: 1.0, x1: L.neighbour.x1 - 0.1, y1: 6.2, z1: 2.6, weight: 1.4 },
];
const drips = makeDrips(dripLines, { maxDrops: 96, rate: 15 });
scene.add(drips.group);

/* --------------------------- post-processing ------------------------ */
const postfx = new PostFX(renderer, {
  outline: 1.0,
  bloom: 0.72,
  exposure: 0.97,
  grain: 0.022,
});

/* ------------------- ink-outline pass bookkeeping ----------------- */
/* Small props are skipped: the line pass runs at half resolution, so a
   3-pixel speck would only turn into a blob of ink anyway.               */
function collectDrawLists() {
  const include = [];
  const exclude = [];
  scene.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    const m = o.material;
    let skip =
      o.userData.noOutline === true ||
      !m ||
      m.transparent === true ||
      m.blending === THREE.AdditiveBlending ||
      m.isShaderMaterial === true;
    if (!skip && o.geometry) {
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      const s = o.geometry.boundingSphere;
      const r = s.radius * Math.max(
        Math.abs(o.scale.x), Math.abs(o.scale.y), Math.abs(o.scale.z));
      if (r < 0.055) skip = true;
    }
    (skip ? exclude : include).push(o);
  });
  return { include, exclude };
}
const drawLists = collectDrawLists();

/* ------------------------- flicker registration -------------------- */
emissiveRegistry().length = 0;
scene.traverse((o) => {
  const f = o.userData.flicker;
  if (f && o.material && o.material.isMeshBasicMaterial) {
    emissiveRegistry().push({ mat: o.material, hex: 0xffffff, intensity: 1, cfg: f });
  }
});

/* ------------------------------ resize ----------------------------- */
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(dpr);
  renderer.setSize(w, h, false);
  const size = new THREE.Vector2();
  renderer.getDrawingBufferSize(size);
  postfx.setSize(size.x, size.y, 1);
  reflector.setSize(size.x, size.y);
}
window.addEventListener('resize', resize);
resize();

/* ------------------------------ loop ------------------------------- */
const clock = new THREE.Clock();
let acc = 0;
let frames = 0;
let slowFrames = 0;

const zebraGlow = ctx.diorama.zebraGlow;
const lampLight = ctx.streetLamp.light;

/** One simulation step + one full render. Split out so it can be
 *  driven manually (tests, capture, debugging) as well as by rAF. */
function renderOnce(dt, t) {
  controls.update(dt);
  camera.updateMatrixWorld();

  /* ---- living details ------------------------------------------ */
  updateFlicker(t);
  ctx.door?.update(dt);
  ctx.signal?.update(dt);
  ctx.signal2?.update(dt);
  ctx.steam?.update(dt, t);
  ctx.glassRain?.update(t);
  rain.update(t);
  splashes.update(t);
  drips.update(dt);

  // wet zebra stripes glimmer as if a car just passed
  if (zebraGlow) {
    zebraGlow.material.opacity = 0.06 + 0.06 * (0.5 + 0.5 * Math.sin(t * 0.7));
  }
  // the street lamp buzzes very faintly
  if (lampLight) {
    lampLight.intensity = 60 * (1 - 0.035 * Math.max(0, Math.sin(t * 31.0) * Math.sin(t * 3.1)));
  }

  /* ---- wet ground uniforms ------------------------------------- */
  const u = groundMat.uniforms;
  u.uTime.value = t;
  u.uCamPos.value.copy(camera.position);
  u.uTextureMatrix.value.copy(reflector.textureMatrix);
  u.uHasReflection.value = 1;

  const uw = ctx.wetWalkMaterial?.uniforms;
  if (uw) {
    uw.uTime.value = t;
    uw.uCamPos.value.copy(camera.position);
    uw.uTextureMatrix.value.copy(reflector.textureMatrix);
    uw.uHasReflection.value = 1;
  }

  /* ---- passes --------------------------------------------------- */
  reflector.render(scene, camera);
  postfx.render(scene, camera, drawLists, t);

  /* ---- adaptive resolution ------------------------------------- */
  acc += dt;
  frames++;
  if (acc > 1.2) {
    const avg = acc / frames;
    if (avg > 1 / 40 && dpr > 0.7) {
      slowFrames++;
      if (slowFrames > 1) {
        dpr = Math.max(0.7, dpr - 0.25);
        resize();
        slowFrames = 0;
      }
    } else if (avg < 1 / 75 && dpr < MAX_DPR) {
      dpr = Math.min(MAX_DPR, dpr + 0.25);
      resize();
      slowFrames = 0;
    } else {
      slowFrames = 0;
    }
    acc = 0;
    frames = 0;
  }
}

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  renderOnce(dt, clock.elapsedTime);
  requestAnimationFrame(frame);
}

/* ------------------------------ start ------------------------------ */
function start() {
  // one warm-up frame so shaders compile before the fade-in
  renderer.compile(scene, camera);
  frame();
  requestAnimationFrame(() => canvas.classList.add('ready'));
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(start, 0);
} else {
  window.addEventListener('DOMContentLoaded', start);
}

/* expose a little for debugging / capture in the console */
window.__diorama = {
  scene, camera, renderer, controls, ctx, postfx, groundMat, reflector,
  renderOnce, rain, splashes, drips, THREE, damp, clamp, toon, PAL,
  /** Advance the simulation deterministically and grab a PNG. */
  async capture(name = 'shot', steps = 90, dt = 1 / 60, t0 = 6.4) {
    for (let i = 0; i < steps; i++) renderOnce(dt, t0 + i * dt);
    const url = canvas.toDataURL('image/png');
    await fetch('/__shot?name=' + name, { method: 'POST', body: url });
    return name + '.png';
  },
  /** capture() from an explicit camera pose, no easing */
  async view(name, { target, radius, theta, phi, steps = 20, t0 = 6.4 }) {
    controls.snapTo(new THREE.Vector3(...target), radius, theta, phi);
    for (let i = 0; i < steps; i++) renderOnce(1 / 60, t0 + i / 60);
    await fetch('/__shot?name=' + name, {
      method: 'POST', body: canvas.toDataURL('image/png'),
    });
    return name + '.png';
  },
};