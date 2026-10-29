// Small, independent weather details for the miniature scene.
export function createEffects(THREE, scene) {
  const weather = new THREE.Group();
  scene.add(weather);

  let seed = 14731;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const count = 620;
  const positions = new Float32Array(count * 6);
  const drops = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      x: (random() - 0.5) * 11.7,
      z: (random() - 0.5) * 11.7,
      phase: random() * 8,
      speed: 4.1 + random() * 2.3,
      length: 0.16 + random() * 0.18,
    });
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({
    color: 0xa7c4dc, transparent: true, opacity: 0.36, depthWrite: false,
  }));
  rain.frustumCulled = false;
  weather.add(rain);

  const dripPositions = new Float32Array(42 * 6);
  const dripGeometry = new THREE.BufferGeometry();
  dripGeometry.setAttribute('position', new THREE.BufferAttribute(dripPositions, 3));
  const drips = new THREE.LineSegments(dripGeometry, new THREE.LineBasicMaterial({
    color: 0xc5e8f2, transparent: true, opacity: 0.7, depthWrite: false,
  }));
  drips.frustumCulled = false;
  weather.add(drips);

  const streakCount = 25;
  const streakPositions = new Float32Array(streakCount * 6);
  const streakGeometry = new THREE.BufferGeometry();
  streakGeometry.setAttribute('position', new THREE.BufferAttribute(streakPositions, 3));
  const streaks = new THREE.LineSegments(streakGeometry, new THREE.LineBasicMaterial({
    color: 0xd9f4f2, transparent: true, opacity: 0.42, depthWrite: false,
  }));
  streaks.frustumCulled = false;
  weather.add(streaks);
  const streakData = Array.from({ length: streakCount }, (_, i) => ({
    x: i < 18 ? -2.75 + random() * 2.55 : 1.85 + random() * 0.85,
    phase: random(),
    speed: 0.035 + random() * 0.035,
    length: 0.09 + random() * 0.18,
  }));

  const ringGeometry = new THREE.RingGeometry(0.88, 1, 32);
  const ripples = [];
  for (let i = 0; i < 19; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: i % 3 === 0 ? 0xf9d9a8 : 0xa9d3e5,
      transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeometry, material);
    ring.rotation.x = -Math.PI / 2;
    const angle = random() * Math.PI * 2;
    const radius = 1.3 + random() * 3.5;
    // Keep the ripples on the foreground and side streets.
    ring.position.set(Math.cos(angle) * radius, 0.035 + i * 0.0001, 2.2 + Math.sin(angle) * 2.5);
    weather.add(ring);
    ripples.push({ ring, phase: random(), size: 0.12 + random() * 0.22 });
  }

  const glow = new THREE.PointLight(0xffd79d, 0.55, 7, 2);
  glow.position.set(0, 3.4, 1.3);
  weather.add(glow);

  return function update(time) {
    for (let i = 0; i < count; i++) {
      const drop = drops[i];
      let y = 8 - ((time * drop.speed + drop.phase) % 8);
      // Rain meets the roof instead of passing visibly through the shop.
      if (drop.x > -3 && drop.x < 3 && drop.z > -3.6 && drop.z < 0.8 && y < 3.8) y += 3.8;
      const p = i * 6;
      positions[p] = drop.x;
      positions[p + 1] = y;
      positions[p + 2] = drop.z;
      positions[p + 3] = drop.x - 0.035;
      positions[p + 4] = y + drop.length;
      positions[p + 5] = drop.z;
    }
    rainGeometry.attributes.position.needsUpdate = true;

    for (let i = 0; i < 42; i++) {
      const p = i * 6;
      const cycle = (time * (1.1 + (i % 4) * 0.14) + i * 0.347) % 1;
      const y = 3.35 - cycle * 3.2;
      const x = -2.9 + (i / 41) * 5.8;
      dripPositions[p] = x;
      dripPositions[p + 1] = y;
      dripPositions[p + 2] = 0.76;
      dripPositions[p + 3] = x;
      dripPositions[p + 4] = y + 0.07;
      dripPositions[p + 5] = 0.76;
    }
    dripGeometry.attributes.position.needsUpdate = true;

    for (let i = 0; i < streakCount; i++) {
      const streak = streakData[i];
      const y = 2.67 - ((time * streak.speed + streak.phase) % 1) * 2.05;
      const p = i * 6;
      streakPositions[p] = streak.x;
      streakPositions[p + 1] = y;
      streakPositions[p + 2] = 0.83;
      streakPositions[p + 3] = streak.x + 0.008;
      streakPositions[p + 4] = y + streak.length;
      streakPositions[p + 5] = 0.83;
    }
    streakGeometry.attributes.position.needsUpdate = true;

    for (const ripple of ripples) {
      const cycle = (time * 0.45 + ripple.phase) % 1;
      const size = 0.025 + cycle * ripple.size;
      ripple.ring.scale.setScalar(size);
      ripple.ring.material.opacity = Math.sin(cycle * Math.PI) * 0.34;
    }
    glow.intensity = 0.53 + Math.sin(time * 2.7) * 0.025 + Math.sin(time * 7.1) * 0.012;
  };
}
