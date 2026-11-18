import * as THREE from 'three';

export function createLighting(scene) {
  const lights = {};

  const ambient = new THREE.AmbientLight(0x1a1e3a, 0.3);
  scene.add(ambient);
  lights.ambient = ambient;

  const moonLight = new THREE.DirectionalLight(0x4466aa, 0.4);
  moonLight.position.set(-10, 15, -5);
  scene.add(moonLight);
  lights.moon = moonLight;

  const hemi = new THREE.HemisphereLight(0x223355, 0x111122, 0.2);
  scene.add(hemi);
  lights.hemi = hemi;

  const streetLamp1 = new THREE.PointLight(0xffcc66, 2, 12, 2);
  streetLamp1.position.set(-4, 4.5, -3);
  scene.add(streetLamp1);
  lights.streetLamp1 = streetLamp1;

  const streetLamp2 = new THREE.PointLight(0xffcc66, 1.5, 10, 2);
  streetLamp2.position.set(5, 4.5, 2);
  scene.add(streetLamp2);
  lights.streetLamp2 = streetLamp2;

  const interiorLight1 = new THREE.PointLight(0xff9944, 3, 6, 2);
  interiorLight1.position.set(0, 3.5, 1.5);
  scene.add(interiorLight1);
  lights.interior1 = interiorLight1;

  const interiorLight2 = new THREE.PointLight(0xffaa55, 2, 5, 2);
  interiorLight2.position.set(0.5, 2.8, -0.5);
  scene.add(interiorLight2);
  lights.interior2 = interiorLight2;

  const neonSign = new THREE.PointLight(0xff3366, 1.5, 5, 2);
  neonSign.position.set(2.5, 4.2, 2.5);
  scene.add(neonSign);
  lights.neonSign = neonSign;

  const neonCyan = new THREE.PointLight(0x00ccdd, 1, 4, 2);
  neonCyan.position.set(-1, 4.2, -3.5);
  scene.add(neonCyan);
  lights.neonCyan = neonCyan;

  const warmGlow = new THREE.PointLight(0xff7733, 2, 3, 2);
  warmGlow.position.set(0, 2, 2);
  scene.add(warmGlow);
  lights.warmGlow = warmGlow;

  return lights;
}

export function createFlicker(lights) {
  const flickers = [];
  const configs = [
    { light: lights.neonSign, base: 1.5, amp: 0.5, freq: 3 },
    { light: lights.neonCyan, base: 1, amp: 0.3, freq: 2.5 },
    { light: lights.interior1, base: 3, amp: 0.4, freq: 4 },
    { light: lights.warmGlow, base: 2, amp: 0.3, freq: 3.5 },
  ];
  configs.forEach(c => flickers.push(c));
  return flickers;
}

export function updateFlickers(flickers, time) {
  flickers.forEach(f => {
    const val = f.base + Math.sin(time * f.freq) * f.amp + Math.sin(time * f.freq * 2.7) * f.amp * 0.3;
    f.light.intensity = Math.max(0.1, val);
  });
}
