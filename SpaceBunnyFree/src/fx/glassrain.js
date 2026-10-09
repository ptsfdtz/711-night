import * as THREE from 'three';
import { streakTexture } from '../core/textures.js';

/* ------------------------------------------------------------------ *
 *  Rain running down the shop windows: two scrolling layers of painted
 *  streaks plus a slow-crawling field of fat droplets, with a faint
 *  surface sheen so the glass reads as glass even when it's clear.
 * ------------------------------------------------------------------ */

const VS = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FS = /* glsl */ `
precision highp float;
uniform sampler2D tStreak;
uniform float uTime;
uniform float uOpacity;
uniform vec3  uTint;
uniform float uSheen;
varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 uv = vUv;

  // two streak layers drifting at different speeds / scales
  vec2 a = vec2(uv.x, uv.y * 0.8 + uTime * 0.075);
  vec2 b = vec2(uv.x * 1.7 + 0.31, uv.y * 1.35 - uTime * 0.145);
  float s = texture2D(tStreak, a).a;
  s += texture2D(tStreak, b).a * 0.75;

  // fat drops crawling down, re-seeded by time so they never loop visibly
  float t = floor(uTime * 1.6);
  vec2 cell = floor(uv * vec2(9.0, 14.0));
  float r1 = hash21(cell + t * 0.37);
  float r2 = hash21(cell + 17.0 + t * 0.71);
  vec2 pos = cell + vec2(r1, fract(r2 + uTime * (0.12 + r1 * 0.25)));
  float d = length((uv - pos) * vec2(2.4, 1.0));
  float drop = smoothstep(0.055, 0.0, d) * step(0.55, r1);
  // trail behind the drop
  float trail = smoothstep(0.03, 0.0, abs(uv.x - pos.x)) *
                smoothstep(pos.y, pos.y + 0.16, uv.y) *
                smoothstep(pos.y + 0.3, pos.y, uv.y) * step(0.55, r1);

  float amount = s * 0.6 + drop * 0.9 + trail * 0.35;

  // static surface sheen — a soft diagonal so the pane catches the sign
  float sheen = smoothstep(0.85, 0.0, abs(uv.x * 1.6 - uv.y * 0.9 - 0.35)) * uSheen;

  vec3 col = uTint * (amount + sheen * 0.6);
  float alpha = clamp(amount * uOpacity + sheen * uOpacity * 0.5, 0.0, 1.0);
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(col, alpha);
}`;

export function makeGlassRain(panes) {
  const tex = streakTexture(512, 512);
  const mat = new THREE.ShaderMaterial({
    vertexShader: VS,
    fragmentShader: FS,
    uniforms: {
      tStreak: { value: tex },
      uTime: { value: 0 },
      uOpacity: { value: 0.72 },
      uTint: { value: new THREE.Color(0xdcefff) },
      uSheen: { value: 0.4 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const meshes = [];
  for (const p of panes) {
    const m = new THREE.Mesh(p.geometry.clone(), mat);
    m.position.copy(p.position);
    m.rotation.copy(p.rotation);
    m.translateZ(0.014);
    m.renderOrder = 6;
    m.userData.noOutline = true;
    m.userData.noReflect = true;
    p.parent.add(m);
    meshes.push(m);
  }

  return {
    material: mat,
    meshes,
    update(t) {
      mat.uniforms.uTime.value = t;
    },
  };
}