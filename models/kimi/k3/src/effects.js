// Living details: rain, drips, ripples, glass streaks, sign flicker,
// automatic doors and the distant traffic light.
import * as THREE from 'three';

const WALK_HIT = 0.12; // ground height under the awning

export function createEffects(scene, { street, store }) {
  // ================= rain (streak line segments) =================
  const RAIN_N = 1300;
  const rainPos = new Float32Array(RAIN_N * 6);
  const drops = [];
  for (let i = 0; i < RAIN_N; i++) {
    drops.push({
      x: -20 + Math.random() * 40,
      y: Math.random() * 22,
      z: -20 + Math.random() * 40,
      v: 13 + Math.random() * 7,
      len: 0.3 + Math.random() * 0.4,
    });
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3).setUsage(THREE.DynamicDrawUsage));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({
    color: 0x9db8d9, transparent: true, opacity: 0.28,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  rain.frustumCulled = false;
  scene.add(rain);
  const WIND = -1.1;

  // ================= ripples (instanced rings) =================
  const RIP_N = 220;
  const ripGeo = new THREE.RingGeometry(0.42, 0.5, 20);
  ripGeo.rotateX(-Math.PI / 2);
  const ripMat = new THREE.MeshBasicMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const ripples = new THREE.InstancedMesh(ripGeo, ripMat, RIP_N);
  ripples.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  ripples.frustumCulled = false;
  ripples.renderOrder = 4;
  scene.add(ripples);
  const ripData = [];
  for (let i = 0; i < RIP_N; i++) {
    ripData.push({ alive: false, x: 0, y: -10, z: 0, age: 0, life: 1, max: 1 });
  }
  const ripM = new THREE.Matrix4(), ripQ = new THREE.Quaternion(),
        ripS = new THREE.Vector3(), ripC = new THREE.Color();
  const RIP_BASE = new THREE.Color(0x6f87b8);
  let ripCursor = 0;
  function spawnRipple(x, y, z, max = 0.9, life = 1.1) {
    const d = ripData[ripCursor];
    ripCursor = (ripCursor + 1) % RIP_N;
    d.alive = true; d.x = x; d.y = y + 0.015; d.z = z;
    d.age = 0; d.life = life; d.max = max;
  }
  ripS.set(0, 0, 0);
  ripM.compose(new THREE.Vector3(0, -10, 0), ripQ, ripS);
  for (let i = 0; i < RIP_N; i++) {
    ripples.setMatrixAt(i, ripM);
    ripples.setColorAt(i, ripC.setScalar(0));
  }

  const zones = street.rippleZones;
  const puddles = street.puddles;
  let spawnAcc = 0;

  // ================= awning drips =================
  const DRIP_N = 10;
  const dripPos = new Float32Array(DRIP_N * 6);
  const dripGeo = new THREE.BufferGeometry();
  dripGeo.setAttribute('position', new THREE.BufferAttribute(dripPos, 3).setUsage(THREE.DynamicDrawUsage));
  const dripLines = new THREE.LineSegments(dripGeo, new THREE.LineBasicMaterial({
    color: 0xbcd4f0, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  dripLines.frustumCulled = false;
  scene.add(dripLines);
  const pts = store.dripPoints;
  const drips = [];
  for (let i = 0; i < DRIP_N; i++) {
    const p = pts[Math.floor(Math.random() * pts.length)];
    drips.push({ x: p.x, z: p.z, y0: p.y, y: p.y, v: 0, wait: Math.random() * 3, falling: false });
  }

  // ================= automatic door =================
  const door = { state: 'closed', t: 0, next: 2.5 + Math.random() * 3, open01: 0 };
  const dp = store.doorPos;
  const ease = (k) => k * k * (3 - 2 * k);

  // ================= traffic light =================
  const tl = { t: 0 };
  const tlColors = { g: 0x7fe0a0, y: 0xffd43b, r: 0xff6b6b };
  const TL_DIM = 0x20262f;

  const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

  // ================= per-frame update =================
  function update(dt, t) {
    // --- rain ---
    for (let i = 0; i < RAIN_N; i++) {
      const d = drops[i];
      d.y -= d.v * dt;
      d.x += WIND * dt;
      if (d.y < 0) {
        d.y = 20 + Math.random() * 3;
        d.x = -20 + Math.random() * 40;
        d.z = -20 + Math.random() * 40;
      }
      const o = i * 6;
      rainPos[o] = d.x; rainPos[o + 1] = d.y; rainPos[o + 2] = d.z;
      rainPos[o + 3] = d.x - WIND * d.len / d.v; rainPos[o + 4] = d.y + d.len; rainPos[o + 5] = d.z;
    }
    rainGeo.attributes.position.needsUpdate = true;

    // --- spawn ripples ---
    spawnAcc += dt * 26;
    while (spawnAcc > 1) {
      spawnAcc -= 1;
      if (Math.random() < 0.55) {
        const p = puddles[Math.floor(Math.random() * puddles.length)];
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * p.r * 0.8;
        spawnRipple(p.x + Math.cos(a) * r, p.y, p.z + Math.sin(a) * r * 0.72,
          0.5 + Math.random() * 0.5, 0.9 + Math.random() * 0.5);
      } else {
        const z = zones[Math.floor(Math.random() * zones.length)];
        spawnRipple(z.x0 + Math.random() * (z.x1 - z.x0), z.y, z.z0 + Math.random() * (z.z1 - z.z0),
          0.35 + Math.random() * 0.4, 0.7 + Math.random() * 0.4);
      }
    }

    // --- update ripples ---
    for (let i = 0; i < RIP_N; i++) {
      const d = ripData[i];
      if (!d.alive) continue;
      d.age += dt;
      const k = d.age / d.life;
      if (k >= 1) {
        d.alive = false;
        ripS.set(0, 0, 0);
        ripM.compose(new THREE.Vector3(0, -10, 0), ripQ, ripS);
        ripples.setMatrixAt(i, ripM);
        ripples.setColorAt(i, ripC.setScalar(0));
        continue;
      }
      const e = 1 - Math.pow(1 - k, 2.2);
      const sc = Math.max(0.001, e * d.max);
      ripS.set(sc, 1, sc);
      ripM.compose(new THREE.Vector3(d.x, d.y, d.z), ripQ, ripS);
      ripples.setMatrixAt(i, ripM);
      ripples.setColorAt(i, ripC.copy(RIP_BASE).multiplyScalar((1 - k) * 0.9));
    }
    ripples.instanceMatrix.needsUpdate = true;
    if (ripples.instanceColor) ripples.instanceColor.needsUpdate = true;

    // --- drips ---
    for (let i = 0; i < DRIP_N; i++) {
      const d = drips[i];
      if (!d.falling) {
        d.wait -= dt;
        if (d.wait <= 0) { d.falling = true; d.y = d.y0; d.v = 0; }
      } else {
        d.v += 18 * dt;
        d.y -= d.v * dt;
        if (d.y <= WALK_HIT) {
          spawnRipple(d.x, 0.12, d.z, 0.35 + Math.random() * 0.25, 0.8);
          d.falling = false;
          d.wait = 0.4 + Math.random() * 2.6;
          const p = pts[Math.floor(Math.random() * pts.length)];
          d.x = p.x; d.z = p.z; d.y0 = p.y;
        }
      }
      const o = i * 6;
      const yy = d.falling ? d.y : d.y0;
      dripPos[o] = d.x; dripPos[o + 1] = yy; dripPos[o + 2] = d.z;
      dripPos[o + 3] = d.x; dripPos[o + 4] = yy + (d.falling ? 0.14 : 0.02); dripPos[o + 5] = d.z;
    }
    dripGeo.attributes.position.needsUpdate = true;

    // --- automatic door ---
    door.t += dt;
    if (door.state === 'closed' && door.t > door.next) { door.state = 'opening'; door.t = 0; }
    else if (door.state === 'opening') {
      door.open01 = ease(Math.min(1, door.t / 0.9));
      if (door.t >= 0.9) { door.state = 'open'; door.t = 0; }
    } else if (door.state === 'open' && door.t > 2.4) { door.state = 'closing'; door.t = 0; }
    else if (door.state === 'closing') {
      door.open01 = 1 - ease(Math.min(1, door.t / 1.1));
      if (door.t >= 1.1) { door.state = 'closed'; door.t = 0; door.next = 3 + Math.random() * 5; }
    }
    const dk = door.open01;
    store.doorL.position.x = dp.lClosed + (dp.lOpen - dp.lClosed) * dk;
    store.doorR.position.x = dp.rClosed + (dp.rOpen - dp.rClosed) * dk;
    store.spillMat.opacity = 0.26 + 0.3 * dk;
    store.doorLight.intensity = 8 + 8 * dk;

    // --- sign hum ---
    store.signFaceMat.color.setScalar(0.94 + 0.04 * Math.sin(t * 43) + 0.02 * Math.sin(t * 13.7));
    store.bandMat.color.setScalar(0.96 + 0.04 * Math.sin(t * 31));

    // --- neon flicker ---
    const drop = hash(Math.floor(t * 24)) < 0.08 ? 0.15 : 1;
    const ni = drop * (0.9 + 0.1 * Math.sin(t * 57));
    store.neonMats.forEach((m) => m.color.setScalar(ni));
    store.neonGlowMat.opacity = 0.5 * ni;
    store.neonStreakMat.opacity = 0.2 * ni;

    // --- rain running down the glass ---
    store.streakMatA.map.offset.y -= dt * 0.055;
    store.streakMatB.map.offset.y -= dt * 0.11;

    // --- traffic light ---
    tl.t += dt;
    const cycle = tl.t % 19.6;
    const phase = cycle < 9 ? 'g' : cycle < 10.6 ? 'y' : 'r';
    street.traffic.g.color.setHex(phase === 'g' ? tlColors.g : TL_DIM);
    street.traffic.y.color.setHex(phase === 'y' ? tlColors.y : TL_DIM);
    street.traffic.r.color.setHex(phase === 'r' ? tlColors.r : TL_DIM);
    street.traffic.streak.color.setHex(tlColors[phase]);
  }

  return { update };
}
