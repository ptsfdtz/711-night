// Night sky dome, stars and a pale moon glow.
import * as THREE from 'three';
import { glowSprite } from './materials.js';

export function buildSky(scene) {
  const geo = new THREE.SphereGeometry(75, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top:  { value: new THREE.Color(0x0a0e1f) },
      mid:  { value: new THREE.Color(0x1d2745) },
      glow: { value: new THREE.Color(0x46598f) },
    },
    vertexShader: /* glsl */`
      varying vec3 vP;
      void main() {
        vP = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP;
      uniform vec3 top, mid, glow;
      void main() {
        float h = normalize(vP).y;
        vec3 c = mix(mid, top, smoothstep(0.02, 0.65, h));
        float band = pow(clamp(1.0 - abs(h - 0.02) * 3.6, 0.0, 1.0), 2.0);
        c += glow * band * 0.5;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  scene.add(new THREE.Mesh(geo, mat));

  // --- stars ---
  const n = 180;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = 0.18 + Math.random() * 1.25;
    const r = 66;
    pos[i * 3]     = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({
    color: 0xb4c6ff, size: 1.7, sizeAttenuation: false,
    transparent: true, opacity: 0.6, fog: false, depthWrite: false,
  }));
  scene.add(stars);

  // --- pale moon ---
  const moonGlow = glowSprite(0xdde8ff, 13, 13, 0.5);
  moonGlow.position.set(30, 36, -50);
  scene.add(moonGlow);
  const moonCore = glowSprite(0xffffff, 3.4, 3.4, 0.9);
  moonCore.position.copy(moonGlow.position);
  scene.add(moonCore);
}
