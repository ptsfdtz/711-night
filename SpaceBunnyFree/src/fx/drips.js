import * as THREE from 'three';
import { rand } from '../core/utils.js';
import { L } from '../world/layout.js';

/* ------------------------------------------------------------------ *
 *  Eave drips. Drops bead along awning edges, gutters and sign unders,
 *  fall, then pop into a small expanding ring where they land.
 * ------------------------------------------------------------------ */

export function makeDrips(lines, opts = {}) {
  const { maxDrops = 90 } = opts;

  const dropGeo = new THREE.SphereGeometry(0.026, 6, 5);
  dropGeo.scale(1, 2.1, 1);
  const dropMat = new THREE.MeshBasicMaterial({
    color: 0xcfe4ff, transparent: true, opacity: 0.85, fog: true,
  });
  const drops = new THREE.InstancedMesh(dropGeo, dropMat, maxDrops);
  drops.frustumCulled = false;
  drops.userData.noOutline = true;
  drops.userData.noReflect = true;

  const ringGeo = new THREE.PlaneGeometry(1, 1);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xbcd9ff, transparent: true, opacity: 0.5, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
  });
  const rings = new THREE.InstancedMesh(ringGeo, ringMat, maxDrops);
  rings.frustumCulled = false;
  rings.userData.noOutline = true;
  rings.userData.noReflect = true;

  const dummy = new THREE.Object3D();
  const particles = [];
  for (let i = 0; i < maxDrops; i++) {
    particles.push({ alive: false, x: 0, y: 0, z: 0, vy: 0, life: 0, ring: 0, line: null });
  }
  const weights = lines.map((l) => l.weight ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);

  function spawn() {
    let r = rand() * total;
    let line = lines[0];
    for (let i = 0; i < lines.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        line = lines[i];
        break;
      }
    }
    const t = rand();
    const p = particles.find((q) => !q.alive);
    if (!p) return;
    p.alive = true;
    p.x = line.x0 + (line.x1 - line.x0) * t + rand(-0.02, 0.02);
    p.y = line.y0 + (line.y1 - line.y0) * t;
    p.z = line.z0 + (line.z1 - line.z0) * t + rand(-0.02, 0.02);
    p.vy = line.vy ?? -rand(2.4, 4.2);
    p.life = 0;
    p.ring = 0;
  }

  const group = new THREE.Group();
  group.name = 'drips';
  group.add(drops);
  group.add(rings);

  let acc = 0;
  const rate = opts.rate ?? 16;

  function update(dt) {
    acc += dt * rate;
    while (acc >= 1) {
      acc -= 1;
      spawn();
    }

    let live = 0;
    for (let i = 0; i < maxDrops; i++) {
      const p = particles[i];
      if (!p.alive) {
        dummy.position.set(0, -50, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        drops.setMatrixAt(i, dummy.matrix);
        rings.setMatrixAt(i, dummy.matrix);
        continue;
      }
      const gy = groundHeightAt(p.x, p.z);
      if (p.ring === 0) {
        p.vy += -11 * dt;
        p.y += p.vy * dt;
        p.life += dt;
        if (p.y <= gy + 0.01) {
          p.ring = 0.001;
          p.y = gy + 0.012;
        } else {
          dummy.position.set(p.x, p.y, p.z);
          const stretch = 1 + Math.min(2.2, Math.abs(p.vy) * 0.28);
          dummy.scale.set(1, stretch, 1);
          dummy.updateMatrix();
          drops.setMatrixAt(i, dummy.matrix);
          dummy.position.set(0, -50, 0);
          dummy.scale.setScalar(0.0001);
          dummy.updateMatrix();
          rings.setMatrixAt(i, dummy.matrix);
          live++;
          continue;
        }
      }
      // splash ring
      p.ring += dt / 0.34;
      if (p.ring >= 1) {
        p.alive = false;
        p.ring = 0;
        dummy.position.set(0, -50, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        drops.setMatrixAt(i, dummy.matrix);
        rings.setMatrixAt(i, dummy.matrix);
        continue;
      }
      const s = 0.1 + p.ring * 0.34;
      dummy.position.set(p.x, p.y + 0.002, p.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      rings.setMatrixAt(i, dummy.matrix);
      dummy.position.set(0, -50, 0);
      dummy.scale.setScalar(0.0001);
      dummy.updateMatrix();
      drops.setMatrixAt(i, dummy.matrix);
      live++;
    }
    drops.instanceMatrix.needsUpdate = true;
    rings.instanceMatrix.needsUpdate = true;
    return live;
  }

  return { group, update, rate };
}

/** Ground height lookup so drips land on kerb, pavement or road. */
export function groundHeightAt(x, z) {
  const { walkFrontZ, walkSideX, walkTop, store, base } = L;
  const half = base / 2;
  const onFrontWalk = z >= store.z1 && z <= walkFrontZ && x >= -half && x <= walkSideX;
  const onSideWalk = x >= store.x1 && x <= walkSideX && z >= -half && z <= store.z1;
  if (onFrontWalk || onSideWalk) return walkTop;
  if (x > store.x0 && x < store.x1 && z > store.z0 && z < store.z1) return store.floorY;
  return 0;
}