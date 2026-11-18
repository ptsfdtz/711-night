import * as THREE from 'three';
import { rainSprite, ringSprite } from '../core/textures.js';
import { rand } from '../core/utils.js';
import { L } from '../world/layout.js';

/* ------------------------------------------------------------------ *
 *  Falling rain. One instanced draw call; every drop's fall, slant and
 *  recycle happens in the vertex shader, so 3000 streaks cost nothing.
 * ------------------------------------------------------------------ */

const VS = /* glsl */ `
attribute vec3 iOffset;
attribute vec3 iParams;   // x: fall speed, y: streak length, z: thickness

uniform float uTime;
uniform float uTop;
uniform float uBottom;
uniform vec3  uWind;
uniform float uSizeScale;

varying vec2 vUv;
varying float vFade;

void main() {
  float speed = iParams.x;
  float len   = iParams.y;
  float wid   = iParams.z;

  float span = uTop - uBottom;
  float y = uTop - mod(iOffset.y + uTime * speed, span);

  vec3 wp = vec3(iOffset.x, y, iOffset.z);

  vec3 dir = normalize(vec3(uWind.x, -1.0, uWind.z));
  vec3 toCam = normalize(cameraPosition - wp);
  vec3 right = normalize(cross(dir, toCam));

  vec3 pos = wp + right * (position.x * wid * uSizeScale)
                 + dir * (position.y * len * uSizeScale);

  vFade = smoothstep(uTop, uTop - 3.0, y) * smoothstep(uBottom, uBottom + 1.8, y);
  vFade *= smoothstep(52.0, 10.0, distance(cameraPosition, wp));

  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
}`;

const FS = /* glsl */ `
precision highp float;
uniform sampler2D tRain;
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;
varying float vFade;

void main() {
  float a = texture2D(tRain, vUv).a * vFade * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}`;

function instancedQuad(count) {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setIndex(base.index);
  geo.setAttribute('position', base.attributes.position);
  geo.setAttribute('uv', base.attributes.uv);
  geo.instanceCount = count;
  return geo;
}

export function makeRain(opts = {}) {
  const {
    count = 3200,
    extent = 17,
    top = 15,
    bottom = -0.6,
    wind = new THREE.Vector3(0.3, 0, 0.14),
    color = 0xd6e8ff,
    opacity = 0.5,
  } = opts;

  const geo = instancedQuad(count);
  const offs = new Float32Array(count * 3);
  const pars = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const bias = 0.35 + 0.65 * Math.pow(rand(), 0.55); // denser near the middle
    offs[i * 3] = rand(-extent, extent) * bias;
    offs[i * 3 + 1] = rand(0, top - bottom);
    offs[i * 3 + 2] = rand(-extent, extent) * bias;
    const near = rand();
    pars[i * 3] = rand(11, 19) * (0.85 + near * 0.5);
    pars[i * 3 + 1] = rand(0.3, 0.95) * (0.65 + near * 0.8);
    pars[i * 3 + 2] = rand(0.010, 0.026) * (0.7 + near * 0.9);
  }
  geo.setAttribute('iOffset', new THREE.InstancedBufferAttribute(offs, 3));
  geo.setAttribute('iParams', new THREE.InstancedBufferAttribute(pars, 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, top / 2, 0), extent * 2.2);

  const mat = new THREE.ShaderMaterial({
    vertexShader: VS,
    fragmentShader: FS,
    uniforms: {
      tRain: { value: rainSprite(16, 64) },
      uTime: { value: 0 },
      uTop: { value: top },
      uBottom: { value: bottom },
      uWind: { value: wind },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uSizeScale: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 9;
  mesh.userData.noOutline = true;
  mesh.userData.noReflect = true;
  mesh.name = 'rain';

  return {
    mesh,
    material: mat,
    update(t) {
      mat.uniforms.uTime.value = t;
    },
    setDensity(f) {
      geo.instanceCount = Math.max(1, Math.floor(count * f));
    },
  };
}

/* ------------------------------------------------------------------ *
 *  Impact sprites: the tiny bright pops where drops meet the ground.
 * ------------------------------------------------------------------ */

const SPLASH_VS = /* glsl */ `
attribute vec3 iPos;
attribute vec2 iData;   // phase, scale
uniform float uTime;
varying vec2 vUv;
varying float vA;
void main() {
  float dur = 0.44;
  float p = fract(iData.x + uTime / dur);
  vUv = uv;
  vA = (1.0 - p) * (1.0 - p);
  float s = iData.y * (0.3 + p * 1.6);
  vec3 toCam = normalize(cameraPosition - iPos);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
  vec3 up = cross(toCam, right);
  vec3 pos = iPos + right * (position.x * s) + up * (position.y * s);
  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
}`;

const SPLASH_FS = /* glsl */ `
precision highp float;
uniform sampler2D tRing;
uniform vec3 uColor;
varying vec2 vUv;
varying float vA;
void main() {
  float a = texture2D(tRing, vUv).a * vA * 0.55;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}`;

/** Reject points that sit inside the shop footprint or the alley. */
function onGround(x, z) {
  const inStore = x > L.store.x0 - 0.3 && x < L.store.x1 + 0.3 &&
    z > L.store.z0 - 0.3 && z < L.store.z1 + 0.35;
  if (inStore) return false;
  const inAlley = x > L.alley.x0 - 0.2 && x < L.alley.x1 + 0.2 &&
    z > L.alley.zBack - 0.2 && z < L.alley.mouthZ + 0.2;
  if (inAlley) return false;
  const inNb = x > L.neighbour.x0 && x < L.neighbour.x1 &&
    z > L.neighbour.z0 && z < L.neighbour.z1;
  if (inNb) return false;
  return true;
}

export function makeSplashes(opts = {}) {
  const { count = 300, half = 11.4 } = opts;
  const geo = instancedQuad(count);
  const pos = new Float32Array(count * 3);
  const dat = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    let x = 0;
    let z = 0;
    let y = 0.02;
    for (let tries = 0; tries < 24; tries++) {
      const r = rand();
      if (r < 0.62) {
        // carriageway
        x = rand(-half, half);
        z = rand(L.walkFrontZ + 0.2, half);
        y = 0.015;
      } else if (r < 0.84) {
        // side road
        x = rand(L.walkSideX + 0.2, half);
        z = rand(-half, half);
        y = 0.015;
      } else {
        // pavement
        x = rand(-half, half);
        z = rand(L.store.z1 + 0.1, L.walkFrontZ - 0.1);
        y = L.walkTop + 0.012;
      }
      if (onGround(x, z)) break;
      x = 0;
      z = 0;
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    dat[i * 2] = rand();
    dat[i * 2 + 1] = rand(0.1, 0.28);
  }
  geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(pos, 3));
  geo.setAttribute('iData', new THREE.InstancedBufferAttribute(dat, 2));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), half * 2.2);

  const mat = new THREE.ShaderMaterial({
    vertexShader: SPLASH_VS,
    fragmentShader: SPLASH_FS,
    uniforms: {
      tRing: { value: ringSprite(128) },
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xcfe6ff) },
    },
    transparent: true,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 8;
  mesh.userData.noOutline = true;
  mesh.userData.noReflect = true;

  return {
    mesh,
    material: mat,
    update(t) {
      mat.uniforms.uTime.value = t;
    },
  };
}