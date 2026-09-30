import * as THREE from 'three';
import { buildGround, addSpill, addRipple } from './ground.js';
import { buildStore } from './store.js';
import { buildStreet } from './street.js';
import { buildWeather } from './weather.js';

/* ------------------------------------------------------------------ *
 *  renderer / scene
 * ------------------------------------------------------------------ */

const app = document.getElementById('app');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearAlpha(0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.5, 220);

/* ------------------------------------------------------------------ *
 *  lights
 * ------------------------------------------------------------------ */

const hemi = new THREE.HemisphereLight(0x3d5480, 0x151a24, 0.85);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xa8c0e8, 0.85);
moon.position.set(-11, 17, -13);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -13;
moon.shadow.camera.right = 13;
moon.shadow.camera.top = 13;
moon.shadow.camera.bottom = -13;
moon.shadow.camera.near = 1;
moon.shadow.camera.far = 60;
moon.shadow.bias = -0.0006;
moon.shadow.normalBias = 0.025;
scene.add(moon);

const fill = new THREE.DirectionalLight(0x5f7fb8, 0.35);
fill.position.set(9, 8, 12);
scene.add(fill);

/* ------------------------------------------------------------------ *
 *  scene content
 * ------------------------------------------------------------------ */

const ctx = {
  root: new THREE.Group(),
  fans: [],
  signGlows: [],
  blinkers: [],
  lampLights: [],
  lightboxes: [],
  hangTags: [],
  dripAnchors: [],
  steamAnchors: [],
  spills: [],
  ripples: [],
  neon: [],
  vending: [],
  interiorLights: [],
  traffic: null,
  doors: null,
  weather: { glassMats: [] },
  wetSpots: [
    [0.4, 5.9, 1.3, 0.6],
    [-1.9, 4.9, 0.9, 0.4],
    [5.5, 5.6, 1.1, 0.7],
    [5.9, 3.6, 0.6, 0.4],
    [-4.6, 5.4, 0.8, 0.5],
    [2.6, 3.9, 0.7, 0.35],
    [-4.4, 0.4, 0.5, 1.1],
    [-1.0, -5.4, 1.1, 0.6],
    [-6.6, 3.4, 0.5, 0.4],
    [4.2, -6.2, 0.9, 0.5],
  ],
};
scene.add(ctx.root);

buildStreet(ctx);
buildStore(ctx);

/* register the wet floor light spills before the ground shader is built */
ctx.spills.forEach((s) => addSpill(s.x, s.z, s.r, s.color, s.i));
ctx.ripples.forEach((r) => addRipple(r[0], r[1], r[2] ?? 1));

const ground = buildGround(scene);

/* shadows */
scene.traverse((o) => {
  if (!o.isMesh) return;
  if (o.userData.isOutline || o.userData.isGlow || o.userData.noShadow || o.material?.transparent) {
    o.castShadow = false;
    o.receiveShadow = false;
    return;
  }
  o.castShadow = true;
  o.receiveShadow = true;
});
ground.ground.receiveShadow = false;
renderer.shadowMap.needsUpdate = true;

/* weather */
const weather = buildWeather(scene, ctx);

/* ------------------------------------------------------------------ *
 *  camera controls (orbit / pan / zoom, no UI)
 * ------------------------------------------------------------------ */

class Controls {
  constructor(cam, dom) {
    this.cam = cam;
    this.dom = dom;
    this.target = new THREE.Vector3(0, 1.2, 0);
    this.goalTarget = this.target.clone();
    this.theta = 0.62;
    this.phi = 1.02;
    this.radius = 24;
    this.goalTheta = this.theta;
    this.goalPhi = this.phi;
    this.goalRadius = this.radius;
    this.minPhi = 0.14;
    this.maxPhi = 1.46;
    this.minR = 9;
    this.maxR = 44;
    this.idle = 0;
    this.dragging = false;
    this.mode = 'rotate';
    this.pointers = new Map();
    this.last = { x: 0, y: 0 };
    this.pinch = 0;
    this._bind();
    this.apply(1);
  }

  _bind() {
    const d = this.dom;
    d.style.touchAction = 'none';
    d.addEventListener('pointerdown', (e) => {
      d.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.idle = 0;
      if (this.pointers.size === 1) {
        this.dragging = true;
        this.mode = e.button === 2 || e.shiftKey ? 'pan' : 'rotate';
        this.last = { x: e.clientX, y: e.clientY };
      } else if (this.pointers.size === 2) {
        this.mode = 'pinch';
        this.pinch = this._dist();
      }
    });
    d.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.idle = 0;
      if (this.mode === 'pinch' && this.pointers.size >= 2) {
        const dist = this._dist();
        this.goalRadius *= this.pinch / Math.max(dist, 1);
        this.goalRadius = THREE.MathUtils.clamp(this.goalRadius, this.minR, this.maxR);
        this.pinch = dist;
        return;
      }
      const dx = e.clientX - this.last.x;
      const dy = e.clientY - this.last.y;
      this.last = { x: e.clientX, y: e.clientY };
      if (this.mode === 'pan') this._pan(dx, dy);
      else {
        this.goalTheta -= dx * 0.0055;
        this.goalPhi -= dy * 0.0045;
        this.goalPhi = THREE.MathUtils.clamp(this.goalPhi, this.minPhi, this.maxPhi);
      }
    });
    const up = (e) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size === 0) this.dragging = false;
      else if (this.pointers.size === 1) {
        const p = [...this.pointers.values()][0];
        this.last = { x: p.x, y: p.y };
        this.mode = 'rotate';
      }
    };
    d.addEventListener('pointerup', up);
    d.addEventListener('pointercancel', up);
    d.addEventListener('contextmenu', (e) => e.preventDefault());
    d.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.idle = 0;
      const k = Math.exp(e.deltaY * 0.0012);
      this.goalRadius = THREE.MathUtils.clamp(this.goalRadius * k, this.minR, this.maxR);
    }, { passive: false });
  }

  _dist() {
    const p = [...this.pointers.values()];
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  }

  _pan(dx, dy) {
    const scale = this.radius * 0.0016;
    const right = new THREE.Vector3().setFromMatrixColumn(this.cam.matrix, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(this.cam.matrix, 1);
    this.goalTarget.addScaledVector(right, -dx * scale);
    this.goalTarget.addScaledVector(up, dy * scale);
    this.goalTarget.x = THREE.MathUtils.clamp(this.goalTarget.x, -6, 6);
    this.goalTarget.z = THREE.MathUtils.clamp(this.goalTarget.z, -6, 6);
    this.goalTarget.y = THREE.MathUtils.clamp(this.goalTarget.y, -1, 4);
  }

  apply(k) {
    this.theta += (this.goalTheta - this.theta) * k;
    this.phi += (this.goalPhi - this.phi) * k;
    this.radius += (this.goalRadius - this.radius) * k;
    this.target.lerp(this.goalTarget, k);
    const sp = Math.sin(this.phi), cp = Math.cos(this.phi);
    this.cam.position.set(
      this.target.x + this.radius * sp * Math.sin(this.theta),
      this.target.y + this.radius * cp,
      this.target.z + this.radius * sp * Math.cos(this.theta)
    );
    this.cam.lookAt(this.target);
  }

  update(dt) {
    this.idle += dt;
    if (!this.dragging && this.idle > 6) this.goalTheta += dt * 0.012;
    this.apply(Math.min(1, dt * 9));
  }
}

const controls = new Controls(camera, renderer.domElement);

/* ------------------------------------------------------------------ *
 *  wet floor reflection
 * ------------------------------------------------------------------ */

let rt = null;
const reflectCam = new THREE.PerspectiveCamera();
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.02);

function makeRT() {
  const dpr = renderer.getPixelRatio();
  const w = Math.max(2, Math.round(window.innerWidth * dpr * 0.55));
  const h = Math.max(2, Math.round(window.innerHeight * dpr * 0.55));
  if (rt) rt.dispose();
  rt = new THREE.WebGLRenderTarget(w, h, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
    type: THREE.UnsignedByteType,
  });
}

const _up = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _tgt = new THREE.Vector3();

function renderReflection() {
  reflectCam.fov = camera.fov;
  reflectCam.aspect = camera.aspect;
  reflectCam.near = camera.near;
  reflectCam.far = camera.far;
  reflectCam.updateProjectionMatrix();

  // mirrored eye
  reflectCam.position.set(camera.position.x, -camera.position.y, camera.position.z);
  camera.getWorldDirection(_fwd);
  _tgt.set(
    reflectCam.position.x + _fwd.x,
    reflectCam.position.y - _fwd.y,
    reflectCam.position.z + _fwd.z
  );
  _up.set(0, 1, 0).applyQuaternion(camera.quaternion);
  reflectCam.up.set(_up.x, -_up.y, _up.z);
  reflectCam.lookAt(_tgt);
  reflectCam.updateMatrixWorld();

  ground.ground.visible = false;
  ground.group.visible = false;
  const rainVisible = weather.rain.visible;
  renderer.setRenderTarget(rt);
  renderer.clear();
  renderer.render(scene, reflectCam);
  renderer.setRenderTarget(null);
  ground.group.visible = true;
  ground.ground.visible = true;
  weather.rain.visible = rainVisible;
}

/* ------------------------------------------------------------------ *
 *  resize
 * ------------------------------------------------------------------ */

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  ground.uniforms.uRes.value.set(size.x, size.y);
  makeRT();
}
window.addEventListener('resize', resize);
resize();

/* ------------------------------------------------------------------ *
 *  animation helpers
 * ------------------------------------------------------------------ */

const smoothstep = (x) => {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

function updateDoors(t) {
  const d = ctx.doors;
  if (!d) return;
  const cycle = 17;
  const k = (t + 3) % cycle;
  let open = 0;
  if (k < 1.4) open = smoothstep(k / 1.4);
  else if (k < 5.6) open = 1;
  else if (k < 7.0) open = 1 - smoothstep((k - 5.6) / 1.4);
  const l = THREE.MathUtils.lerp(d.closedL, d.openL, open);
  const r = THREE.MathUtils.lerp(d.closedR, d.openR, open);
  d.doorL.position.x = l;
  d.frameL.position.x = l;
  d.hL.position.x = l + 0.44;
  d.doorR.position.x = r;
  d.frameR.position.x = r;
  d.hR.position.x = r + 0.44;
}

const TRAFFIC = [
  { c: 0x39e07a, dur: 8.5 },
  { c: 0xffc44a, dur: 1.6 },
  { c: 0xff4444, dur: 7.0 },
];
function updateTraffic(t) {
  if (!ctx.traffic) return;
  const total = TRAFFIC.reduce((a, b) => a + b.dur, 0);
  let k = t % total;
  let idx = 0;
  for (let i = 0; i < TRAFFIC.length; i++) {
    if (k < TRAFFIC[i].dur) { idx = i; break; }
    k -= TRAFFIC[i].dur;
  }
  ctx.traffic.lamps.forEach((lamp, i) => {
    const on = i === idx;
    const pulse = 0.86 + 0.14 * Math.sin(t * 2.1 + i);
    lamp.lens.material.color.setHex(on ? TRAFFIC[i].c : 0x1b2029);
    lamp.lens.material.color.multiplyScalar(on ? pulse : 1);
    lamp.glow.material.opacity = on ? 0.55 * pulse : 0.04;
  });
}

function flicker(t) {
  ctx.signGlows.forEach((g, i) => {
    const n = Math.sin(t * (7.3 + i * 2.1) + i * 3.3) * 0.5 + 0.5;
    const slow = Math.sin(t * 0.7 + i) * 0.5 + 0.5;
    const dip = Math.sin(t * 0.23 + i * 5.1) > 0.93 ? 0.45 : 1;
    const base = g.userData.base ?? g.material.opacity;
    if (g.userData.base === undefined) g.userData.base = base;
    g.material.opacity = g.userData.base * (0.82 + 0.18 * n) * (0.9 + 0.1 * slow) * dip;
  });
  ctx.lightboxes.forEach((lb, i) => {
    const n = Math.sin(t * (3.1 + i) + i * 2.2) * 0.5 + 0.5;
    const dip = Math.sin(t * 0.31 + i * 2.7) > 0.95 ? 0.55 : 1;
    lb.material.color.setScalar((0.94 + 0.06 * n) * dip);
  });
  ctx.blinkers.forEach((b) => {
    const v = Math.sin(t * b.speed * 3.0) * 0.5 + 0.5;
    b.mesh.material.opacity = b.base * (0.35 + 0.65 * v);
  });
  ctx.lampLights.forEach((l, i) => {
    if (l.light) {
      const n = Math.sin(t * 9.1 + i * 2.2) * 0.5 + 0.5;
      l.light.intensity = l.base * (0.94 + 0.06 * n) * (l.flicker ? 1 - l.flicker * n : 1);
    }
    if (l.glow) {
      const n = Math.sin(t * 7.7 + i) * 0.5 + 0.5;
      l.glow.material.opacity = l.base * (0.9 + 0.1 * n);
    }
  });
  ctx.vending.forEach((v, i) => {
    const n = Math.sin(t * (2.3 + i) + i) * 0.5 + 0.5;
    v.glow.material.opacity = 0.30 * (0.9 + 0.1 * n);
    v.face.material.color.setScalar(0.95 + 0.05 * n);
  });
  ctx.neon.forEach((n, i) => {
    const k = Math.sin(t * (5.1 + i * 1.7) + i * 4.1) * 0.5 + 0.5;
    const dip = Math.sin(t * 0.17 + i * 3.3) > 0.97 ? 0.4 : 1;
    n.glow.material.opacity = 0.32 * (0.8 + 0.2 * k) * dip;
  });
}

function spin(dt, t) {
  ctx.fans.forEach((f) => {
    const mesh = f.mesh ?? f;
    const axis = f.axis ?? 'z';
    const spd = f.speed ?? 3.4;
    mesh.rotation[axis] += dt * spd;
  });
  ctx.hangTags.forEach((tag, i) => {
    tag.rotation.z = Math.sin(t * 0.7 + i) * 0.035;
  });
}

/* ------------------------------------------------------------------ *
 *  loop
 * ------------------------------------------------------------------ */

const clock = new THREE.Clock();
let t = 0;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt;

  controls.update(dt);

  updateDoors(t);
  updateTraffic(t);
  flicker(t);
  spin(dt, t);

  ground.uniforms.uTime.value = t;
  ctx.weather.glassMats.forEach((m) => {
    if (m.uniforms) m.uniforms.uTime.value = t;
  });
  weather.update(dt, t);

  if (rt) {
    ground.uniforms.uReflect.value = rt.texture;
    renderReflection();
  }

  renderer.render(scene, camera);
requestAnimationFrame(tick);

window.__scene = { scene, camera, renderer, ctx, ground, controls, THREE };

window.__probe = (pts) => {
  const v = new THREE.Vector3();
  return pts.map((p) => {
    v.set(p[0], p[1], p[2]).project(camera);
    return [
      Math.round((v.x * 0.5 + 0.5) * window.innerWidth),
      Math.round((-v.y * 0.5 + 0.5) * window.innerHeight),
    ];
  });
};

window.__diag = () => ({
  calls: renderer.info.render.calls,
  tris: renderer.info.render.triangles,
  programs: renderer.info.programs?.length,
  objects: scene.children.length,
  camera: camera.position.toArray().map((v) => +v.toFixed(2)),
});
}

requestAnimationFrame(tick);
