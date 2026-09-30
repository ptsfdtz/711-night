// weather.js — continuous rain, ground ripples in the puddles, and water
// dripping off the store canopy.
import * as THREE from 'three';
import { rand, at } from './util.js';
import { glow } from './materials.js';
import { LAYOUT } from './environment.js';

const S = LAYOUT.store;
const AREA = 11;      // rain field half-extent
const TOP = 19;       // rain spawn height

/* ------------------------------------------------------------------ *
 * Rain (line-segment streaks)
 * ------------------------------------------------------------------ */
function buildRain(group) {
  const COUNT = 2000;
  const positions = new Float32Array(COUNT * 2 * 3);
  const drops = [];
  const wind = 0.35; // slight slant

  for (let i = 0; i < COUNT; i++) {
    const d = {
      x: rand(-AREA, AREA),
      y: rand(0, TOP),
      z: rand(-AREA, AREA),
      len: rand(0.5, 1.1),
      speed: rand(16, 26),
    };
    drops.push(d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xbcd4f0, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  group.add(lines);

  function write() {
    const pos = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const d = drops[i];
      const o = i * 6;
      pos[o + 0] = d.x; pos[o + 1] = d.y; pos[o + 2] = d.z;
      pos[o + 3] = d.x - wind * d.len; pos[o + 4] = d.y - d.len; pos[o + 5] = d.z;
    }
    geo.attributes.position.needsUpdate = true;
  }
  write();

  function update(dt) {
    for (let i = 0; i < COUNT; i++) {
      const d = drops[i];
      d.y -= d.speed * dt;
      d.x += wind * d.speed * dt * 0.15;
      if (d.y - d.len < 0.0) {
        d.y = TOP + rand(0, 3);
        d.x = rand(-AREA, AREA);
        d.z = rand(-AREA, AREA);
        d.len = rand(0.5, 1.1);
        d.speed = rand(16, 26);
      }
      if (d.x > AREA) d.x = -AREA;
    }
    write();
  }
  return { update };
}

/* ------------------------------------------------------------------ *
 * Ripples expanding across the wet ground / puddles
 * ------------------------------------------------------------------ */
function buildRipples(group) {
  const COUNT = 54;
  const ringGeo = new THREE.RingGeometry(0.06, 0.11, 14);
  const ripples = [];
  for (let i = 0; i < COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xcfe6ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(ringGeo, mat);
    m.rotation.x = -Math.PI / 2;
    at(m, rand(-9, 9), 0.06, rand(-1, 9));
    group.add(m);
    ripples.push({ mesh: m, life: rand(0, 1), max: rand(0.9, 1.6), scale0: rand(0.3, 0.7) });
  }
  function respawn(r) {
    r.life = 0;
    r.max = rand(0.9, 1.6);
    r.scale0 = rand(0.3, 0.7);
    // bias towards roadway and puddle area
    r.mesh.position.set(rand(-9, 9), 0.06, rand(-1.5, 9));
  }
  function update(dt) {
    for (const r of ripples) {
      r.life += dt;
      const t = r.life / r.max;
      if (t >= 1) { respawn(r); continue; }
      const s = r.scale0 + t * 2.2;
      r.mesh.scale.setScalar(s);
      r.mesh.material.opacity = Math.sin((1 - t) * Math.PI) * 0.55 * (1 - t);
    }
  }
  return { update };
}

/* ------------------------------------------------------------------ *
 * Water dripping off the canopy edge
 * ------------------------------------------------------------------ */
function buildDrips(group) {
  const COUNT = 26;
  const dripZ = S.frontZ + 1.5;
  const dripY = 2.55;
  const xMin = S.minX - 0.2, xMax = S.maxX + 0.2;
  const drips = [];
  const geo = new THREE.SphereGeometry(0.045, 6, 5);
  for (let i = 0; i < COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xdff0ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const m = new THREE.Mesh(geo, mat);
    const d = { mesh: m, x: rand(xMin, xMax), y: rand(0, dripY), vy: 0, active: Math.random() > 0.5, wait: rand(0, 2) };
    at(m, d.x, d.y, dripZ);
    m.visible = d.active;
    group.add(m);
    drips.push(d);
  }
  function update(dt) {
    for (const d of drips) {
      if (!d.active) {
        d.wait -= dt;
        if (d.wait <= 0) {
          d.active = true; d.mesh.visible = true;
          d.x = rand(xMin, xMax); d.y = dripY; d.vy = 0;
          at(d.mesh, d.x, d.y, dripZ);
        }
        continue;
      }
      d.vy += 12 * dt;
      d.y -= d.vy * dt;
      d.mesh.position.set(d.x, d.y, dripZ);
      d.mesh.scale.set(1, 1 + Math.min(1.6, d.vy * 0.12), 1);
      if (d.y <= 0.05) {
        d.active = false; d.mesh.visible = false; d.wait = rand(0.3, 2.4);
      }
    }
  }
  return { update };
}

/* ------------------------------------------------------------------ *
 * Low mist near the ground for depth
 * ------------------------------------------------------------------ */
function buildMist(group) {
  const mistMat = new THREE.MeshBasicMaterial({
    color: 0x2a3d5a, transparent: true, opacity: 0.06,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const layers = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), mistMat.clone());
    m.rotation.x = -Math.PI / 2;
    at(m, 0, 0.1 + i * 0.5, 0);
    m.material.opacity = 0.05 - i * 0.012;
    group.add(m);
    layers.push(m);
  }
  function update(dt, t) {
    layers.forEach((m, i) => { m.material.opacity = (0.045 - i * 0.01) + Math.sin(t * 0.4 + i) * 0.008; });
  }
  return { update };
}

/* ------------------------------------------------------------------ *
 * Public builder
 * ------------------------------------------------------------------ */
export function buildWeather(scene) {
  const group = new THREE.Group();
  group.name = 'weather';
  scene.add(group);

  const rain = buildRain(group);
  const ripples = buildRipples(group);
  const drips = buildDrips(group);
  const mist = buildMist(group);

  function update(dt, t) {
    rain.update(dt, t);
    ripples.update(dt, t);
    drips.update(dt, t);
    mist.update(dt, t);
  }
  return { group, update };
}
