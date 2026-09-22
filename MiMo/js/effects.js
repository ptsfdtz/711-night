import * as THREE from 'three';
import { ST, groundH, rand } from './core.js';
import { puddleData } from './street.js';
import { anim } from './store.js';
import { propsAnim } from './props.js';

export const fx = {
  rain: null,
  rainPos: null,
  rainVel: null,
  rainCount: 1800,
  drip: null,
  dripPos: null,
  dripVel: null,
  dripCount: 160,
  ripples: [],
  rippleTimer: 0,
  reflectionMats: [],
  flickerTimer: 0,
  flickerLeft: 0,
};

function inStore(x, z) {
  return x > ST.x0 && x < ST.x1 && z > ST.z0 && z < ST.z1;
}

export function buildRain(scene) {
  const n = fx.rainCount;
  const pos = new Float32Array(n * 6);
  const vel = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    resetDrop(pos, vel, i, true);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0x9ab8d8,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  mat.userData.outlineParameters = { visible: false };
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  scene.add(lines);
  fx.rain = lines;
  fx.rainPos = pos;
  fx.rainVel = vel;
}

function resetDrop(pos, vel, i, randomY = false) {
  const x = rand(-12.5, 12.5);
  const z = rand(-12.5, 12.5);
  const y = randomY ? rand(0.5, 18) : rand(14, 18);
  const len = rand(0.35, 0.85);
  const speed = rand(12, 20);
  const wind = rand(-1.2, -0.4);
  const j = i * 6;
  pos[j] = x;
  pos[j + 1] = y;
  pos[j + 2] = z;
  pos[j + 3] = x - wind * 0.03;
  pos[j + 4] = y - len;
  pos[j + 5] = z;
  vel[i] = speed;
}

export function updateRain(dt) {
  const pos = fx.rainPos;
  const vel = fx.rainVel;
  const n = fx.rainCount;
  const wind = -1.0;
  for (let i = 0; i < n; i++) {
    const j = i * 6;
    const dy = vel[i] * dt;
    pos[j + 1] -= dy;
    pos[j + 4] -= dy;
    pos[j] += wind * dt * 0.3;
    pos[j + 3] += wind * dt * 0.3;

    const x = pos[j];
    const z = pos[j + 2];
    let floorY;
    if (inStore(x, z)) {
      floorY = ST.roofTop + 0.2;
    } else {
      floorY = groundH(x, z) + 0.02;
    }
    if (pos[j + 1] < floorY || pos[j] < -13) {
      resetDrop(pos, vel, i, false);
    }
  }
  fx.rain.geometry.attributes.position.needsUpdate = true;
}

export function buildEaveDrips(scene) {
  const n = fx.dripCount;
  const pos = new Float32Array(n * 6);
  const vel = new Float32Array(n);
  const edges = [];

  // front eave
  for (let i = 0; i < 70; i++) {
    edges.push({ x: rand(ST.x0 - 0.2, ST.x1 + 0.2), y: ST.wallTop + 0.15, z: ST.z1 + 1.05 });
  }
  // east eave
  for (let i = 0; i < 50; i++) {
    edges.push({ x: ST.x1 + 0.97, y: ST.wallTop + 0.15, z: rand(ST.z0, ST.z1) });
  }
  // roof front edge
  for (let i = 0; i < 40; i++) {
    edges.push({ x: rand(ST.x0, ST.x1), y: ST.roofTop, z: ST.z1 + ST.over });
  }

  for (let i = 0; i < n; i++) {
    const e = edges[i % edges.length];
    const active = Math.random() < 0.7;
    const y = active ? e.y - rand(0, 2) : e.y + 10;
    const j = i * 6;
    pos[j] = e.x;
    pos[j + 1] = y;
    pos[j + 2] = e.z;
    pos[j + 3] = e.x;
    pos[j + 4] = y - 0.25;
    pos[j + 5] = e.z;
    vel[i] = rand(3, 7);
    // store edge index in vel sign? use separate array
  }

  fx.dripEdges = edges;
  fx.dripEdgeMap = new Int32Array(n);
  for (let i = 0; i < n; i++) fx.dripEdgeMap[i] = i % edges.length;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xc8e0ff,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });
  mat.userData.outlineParameters = { visible: false };
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  scene.add(lines);
  fx.drip = lines;
  fx.dripPos = pos;
  fx.dripVel = vel;
}

export function updateDrips(dt) {
  const pos = fx.dripPos;
  const vel = fx.dripVel;
  const n = fx.dripCount;
  for (let i = 0; i < n; i++) {
    const j = i * 6;
    const ei = fx.dripEdgeMap[i];
    const e = fx.dripEdges[ei];
    pos[j + 1] -= vel[i] * dt;
    pos[j + 4] -= vel[i] * dt;
    if (pos[j + 4] < groundH(pos[j], pos[j + 2]) + 0.05) {
      // respawn drop from eave
      const y0 = e.y - rand(0, 0.15);
      pos[j] = e.x + rand(-0.05, 0.05);
      pos[j + 1] = y0;
      pos[j + 2] = e.z + rand(-0.05, 0.05);
      pos[j + 3] = pos[j];
      pos[j + 4] = y0 - 0.25;
      pos[j + 5] = pos[j + 2];
      vel[i] = rand(3, 7);
    }
  }
  fx.drip.geometry.attributes.position.needsUpdate = true;
}

export function buildRipples(scene) {
  const geo = new THREE.RingGeometry(0.85, 1.0, 28);
  for (let i = 0; i < 28; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xa8d0ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    mat.userData.outlineParameters = { visible: false };
    const m = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.visible = false;
    scene.add(m);
    fx.ripples.push({ m, life: 0, max: 0, x: 0, z: 0, r: 1 });
  }
}

function spawnRipple(scene) {
  const slot = fx.ripples.find((r) => !r.m.visible);
  if (!slot) return;
  const p = puddleData[Math.floor(Math.random() * puddleData.length)];
  if (!p) return;
  const ang = Math.random() * Math.PI * 2;
  const dist = Math.random() * p.r * 0.7;
  const x = p.x + Math.cos(ang) * dist;
  const z = p.z + Math.sin(ang) * dist;
  slot.x = x;
  slot.z = z;
  slot.r = rand(0.25, 0.55);
  slot.life = 0;
  slot.max = rand(0.7, 1.2);
  slot.m.visible = true;
  slot.m.position.set(x, groundH(x, z) + 0.03, z);
}

export function updateRipples(dt, scene) {
  fx.rippleTimer -= dt;
  if (fx.rippleTimer <= 0) {
    fx.rippleTimer = rand(0.08, 0.22);
    spawnRipple(scene);
    if (Math.random() < 0.4) spawnRipple(scene);
  }
  for (const r of fx.ripples) {
    if (!r.m.visible) continue;
    r.life += dt;
    const t = r.life / r.max;
    if (t >= 1) {
      r.m.visible = false;
      continue;
    }
    const s = r.r * (0.15 + t * 1.0);
    r.m.scale.set(s, s, 1);
    r.m.material.opacity = 0.55 * (1 - t) * (1 - t);
  }
}

export function updateDoor(dt) {
  const st = anim.doorState;
  st.timer -= dt;
  if (st.timer <= 0) {
    if (st.open < 0.5) {
      st.open = 1;
      st.timer = 3.2;
    } else {
      st.open = 0;
      st.timer = rand(4, 9);
    }
  }
  // smooth
  const target = st.open;
  for (const p of anim.doorPanels) {
    const closed = p.baseX;
    const opened = p.baseX + p.dir * (p.w * 1.05);
    const want = THREE.MathUtils.lerp(closed, opened, easeInOut(target));
    p.g.position.x += (want - p.g.position.x) * Math.min(1, dt * 6);
  }
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function updateSignFlicker(dt) {
  fx.flickerTimer -= dt;
  if (fx.flickerTimer <= 0) {
    if (fx.flickerLeft > 0) {
      fx.flickerLeft -= dt;
    } else if (Math.random() < dt * 0.35) {
      fx.flickerLeft = rand(0.08, 0.35);
      fx.flickerTimer = rand(1.5, 5);
    } else {
      fx.flickerTimer = 0.1;
    }
  }

  const dim = fx.flickerLeft > 0 ? 0.35 + Math.random() * 0.45 : 1.0;
  for (const s of anim.flickerSigns) {
    s.mat.emissiveIntensity = s.base * dim;
  }
  for (const v of propsAnim.vendingMats) {
    v.mat.emissiveIntensity = v.base * (fx.flickerLeft > 0 && Math.random() < 0.3 ? 0.7 : 1.0);
  }
}

export function updateTraffic(dt) {
  const t = propsAnim.traffic;
  if (!t) return;
  t.timer += dt;
  const durations = [4.5, 4.0, 1.4];
  if (t.timer > durations[t.phase]) {
    t.timer = 0;
    t.phase = (t.phase + 1) % 3;
  }
  for (let i = 0; i < 3; i++) {
    const on = i === t.phase;
    t.mats[i].emissiveIntensity = on ? 1.4 : 0.08;
    t.mats[i].color.setHex(on ? [0xff4444, 0xffcc33, 0x44ff88][i] : [0x551111, 0x554411, 0x115533][i]);
  }
  const c = [0xff4444, 0xffcc33, 0x44ff88][t.phase];
  t.light.color.setHex(c);
  t.light.intensity = 0.5 + Math.sin(performance.now() * 0.003) * 0.08;
}

export function updateReflections(time) {
  // handled via material opacity in main using stored list
}

export function buildAllEffects(scene, reflections) {
  buildRain(scene);
  buildEaveDrips(scene);
  buildRipples(scene);
  fx.reflectionMats = reflections.map((r) => r.material);
}
