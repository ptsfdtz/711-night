import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Planar reflection used for the wet asphalt / puddle look.
 *  Only a hand-picked "reflective layer" is drawn into the buffer
 *  (buildings, signs, lamps, neon), which keeps it cheap and gives the
 *  smeared vertical light-streaks you only see on wet tarmac.
 * ------------------------------------------------------------------ */

export const REFLECT_LAYER = 1;

/**
 * Put an object (and its children) into the planar-reflection layer.
 * Tiny props are skipped — their reflection is invisible but they would
 * still cost a draw call in the mirror pass.
 */
export function markReflect(obj, minRadius = 0.16) {
  obj.traverse((o) => {
    if (o.userData.noReflect) return;
    if (o.geometry) {
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      const s = o.geometry.boundingSphere;
      const r = s.radius * Math.max(
        Math.abs(o.scale.x), Math.abs(o.scale.y), Math.abs(o.scale.z));
      if (r < minRadius) return;
    }
    o.layers.enable(REFLECT_LAYER);
    o.userData.reflect = true;
  });
  return obj;
}

export class PlanarReflector {
  constructor(renderer, { resolution = 0.5, planeY = 0.0, clipBias = 0.006 } = {}) {
    this.renderer = renderer;
    this.planeY = planeY;
    this.resolution = resolution;
    this.clipBias = clipBias;

    const rt = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });
    rt.texture.colorSpace = THREE.NoColorSpace;
    this.rt = rt;

    this.camera = new THREE.PerspectiveCamera();
    this.camera.layers.disableAll();
    this.camera.layers.enable(REFLECT_LAYER);

    this.textureMatrix = new THREE.Matrix4();
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY + clipBias);
    this._normal = new THREE.Vector3(0, 1, 0);
    this._view = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._lookAt = new THREE.Vector3();
    this._camPos = new THREE.Vector3();
    this._rot = new THREE.Matrix4();
    this._origin = new THREE.Vector3(0, planeY, 0);
    this._q = new THREE.Vector4();
  }

  setSize(w, h) {
    this.rt.setSize(
      Math.max(2, Math.floor(w * this.resolution)),
      Math.max(2, Math.floor(h * this.resolution))
    );
  }

  render(scene, camera) {
    const n = this._normal;
    const origin = this._origin;

    // mirror the eye point through the ground plane
    this._view.copy(camera.position).sub(origin);
    this._view.reflect(n).negate().add(origin);

    this._camPos.setFromMatrixPosition(camera.matrixWorld);
    this._rot.extractRotation(camera.matrixWorld);

    this._lookAt.set(0, 0, -1).applyMatrix4(this._rot).add(this._camPos);
    this._target.copy(this._lookAt).sub(origin).reflect(n).negate().add(origin);

    const vc = this.camera;
    vc.position.copy(this._view);
    vc.up.set(0, 1, 0).applyMatrix4(this._rot).reflect(n);
    vc.lookAt(this._target);
    vc.near = camera.near;
    vc.far = camera.far;
    vc.projectionMatrix.copy(camera.projectionMatrix);
    vc.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    vc.matrixWorldInverse.copy(vc.matrixWorld).invert();
    vc.updateMatrixWorld(true);

    this.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.textureMatrix.multiply(vc.projectionMatrix);
    this.textureMatrix.multiply(vc.matrixWorldInverse);

    const r = this.renderer;
    const prevTarget = r.getRenderTarget();
    const prevClip = r.clippingPlanes;
    const prevShadow = r.shadowMap.enabled;

    r.shadowMap.enabled = false;
    r.clippingPlanes = [this.clipPlane];
    r.setRenderTarget(this.rt);
    r.clear();
    r.render(scene, vc);
    r.setRenderTarget(prevTarget);
    r.clippingPlanes = prevClip;
    r.shadowMap.enabled = prevShadow;
  }

  dispose() {
    this.rt.dispose();
  }
}

/* ------------------------------------------------------------------ *
 *  Wet-ground shader: toon asphalt + planar mirror + puddle mask +
 *  animated rain dimples. One draw call for the whole street surface.
 * ------------------------------------------------------------------ */

const WET_VS = /* glsl */ `
uniform mat4 uTextureMatrix;
varying vec4 vRefl;
varying vec3 vWorld;
varying vec2 vUvW;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vUvW = world.xz;
  vRefl = uTextureMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

const WET_FS = /* glsl */ `
precision highp float;

uniform sampler2D tReflect;
uniform sampler2D tPuddle;
uniform sampler2D tGrain;
uniform sampler2D tSurface;
uniform float uSurfaceMix;
uniform vec3  uBase;
uniform vec3  uBaseDark;
uniform vec3  uSheen;
uniform vec3  uCamPos;
uniform float uHasReflection;
uniform float uReflectStrength;
uniform float uWorldSize;
uniform float uTime;
uniform float uPuddleScale;
uniform vec3  uLightA;      // warm key (street lamp / shop)
uniform vec3  uLightB;      // cool fill (sky / vending machine)
uniform float uToonSteps;

varying vec4 vRefl;
varying vec3 vWorld;
varying vec2 vUvW;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 guv = vUvW / uWorldSize;
  vec3 grain = texture2D(tGrain, guv * 26.0).rgb;

  // toon-ish asphalt with two tone bands
  float n = vnoise(vUvW * 1.7) * 0.55 + vnoise(vUvW * 6.0) * 0.45;
  float band = step(0.52, n);
  vec3 albedo = mix(uBaseDark, uBase, band);
  albedo *= 0.82 + 0.34 * grain.g;
  if (uSurfaceMix > 0.001) {
    albedo = mix(albedo, texture2D(tSurface, guv).rgb, uSurfaceMix);
  }

  // ---- puddle mask: damp film everywhere, deep pools in the blobs ---
  float pud = texture2D(tPuddle, guv).r;
  float film = smoothstep(0.32, 0.52, pud);
  float puddle = smoothstep(0.52, 0.88, pud);

  // ---- rain dimples: expanding rings + micro chop on the water ----
  float t = uTime;
  vec2 cell = floor(vUvW * 3.2);
  float rip = 0.0;
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    vec2 c = cell + vec2(fk * 0.5, fk * 0.5);
    float seed = hash21(c + fk * 7.7);
    vec2 center = (c + vec2(fract(seed * 3.17), fract(seed * 13.11))) / 3.2;
    float phase = fract(t * 0.75 + seed * 7.31 + fk * 0.37);
    float d = distance(vUvW, center);
    float r = phase * 0.42;
    float ring = smoothstep(0.05, 0.0, abs(d - r)) * (1.0 - phase);
    rip += ring * 0.8;
  }
  float chop = vnoise(vUvW * 22.0 + vec2(0.0, t * 0.6)) - 0.5;
  float chop2 = vnoise(vUvW * 9.0 - vec2(t * 0.35, t * 0.2)) - 0.5;

  float wetness = clamp(0.34 + 0.66 * max(film, puddle) + rip * 0.35, 0.0, 1.25);

  // ---- light pooling (cheap analytic lights, no shadow maps) ----
  float dA = distance(vWorld.xz, vec2(4.4, 4.6));
  float dB = distance(vWorld.xz, vec2(9.4, 7.2));
  float dC = distance(vWorld.xz, vec2(3.8, -3.3));
  float dD = distance(vWorld.xz, vec2(-0.4, 3.6));
  float poolA = 1.0 / (1.0 + dA * dA * 0.55);
  float poolB = 1.0 / (1.0 + dB * dB * 0.5);
  float poolC = 1.0 / (1.0 + dC * dC * 0.7);
  float poolD = 1.0 / (1.0 + dD * dD * 0.6);
  vec3 lightSum = (uLightA * (poolA + poolD * 0.85) +
                   uLightB * (poolB * 0.6 + poolC * 0.75)) * 0.85;

  // toon-quantised diffuse so the road keeps flat cel bands
  float lum = dot(albedo, vec3(0.33));
  float cel = floor(lum * uToonSteps) / uToonSteps;
  vec3 col = albedo * (0.26 + cel * 0.6);
  col += lightSum * (0.11 + 0.36 * puddle) * (0.5 + 0.5 * wetness);

  // ---- planar reflection ----
  vec2 ruv = vRefl.xy / max(vRefl.w, 0.0001);
  vec2 distort = vec2(chop, chop2) * (0.016 + 0.055 * puddle) + vec2(rip) * 0.005;
  vec3 refl = texture2D(tReflect, clamp(ruv + distort, vec2(0.001), vec2(0.999))).rgb;
  // vertical smear: wet asphalt stretches reflections along the view axis
  float smear = 0.008 + 0.034 * puddle;
  vec3 refl2 = texture2D(tReflect, clamp(ruv + distort + vec2(0.0, smear), vec2(0.001), vec2(0.999))).rgb;
  vec3 refl3 = texture2D(tReflect, clamp(ruv + distort - vec2(0.0, smear), vec2(0.001), vec2(0.999))).rgb;
  vec3 refl4 = texture2D(tReflect, clamp(ruv + distort + vec2(0.0, smear * 2.2), vec2(0.001), vec2(0.999))).rgb;
  vec3 refl5 = texture2D(tReflect, clamp(ruv + distort - vec2(0.0, smear * 2.2), vec2(0.001), vec2(0.999))).rgb;
  refl = (refl * 0.34 + refl2 * 0.16 + refl3 * 0.16 + refl4 * 0.17 + refl5 * 0.17)
       * uHasReflection;

  vec3 viewDir = normalize(uCamPos - vWorld);
  float fres = pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 1.8);
  float amount = uReflectStrength * mix(0.55, 1.0, puddle) * mix(0.42, 1.0, fres);
  vec3 mirrorCol = col * mix(0.34, 0.08, puddle) + refl * mix(1.5, 2.3, puddle);
  col = mix(col, mirrorCol, clamp(amount, 0.0, 0.96));

  // crisp meniscus line at the puddle border — the anime giveaway
  float rim = smoothstep(0.46, 0.56, pud) * (1.0 - smoothstep(0.56, 0.70, pud));
  col += uSheen * rim * 0.35;

  // sparkle on the chop, only where wet
  float spark = smoothstep(0.90, 1.0, hash21(floor(vUvW * 46.0) + floor(t * 14.0)));
  col += uSheen * spark * wetness * 0.13;

  gl_FragColor = vec4(col, 1.0);
}`;

export function wetGroundMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: WET_VS,
    fragmentShader: WET_FS,
    uniforms: {
      tReflect: { value: opts.reflectionTexture ?? null },
      tPuddle: { value: opts.puddleTexture ?? null },
      tGrain: { value: opts.grainTexture ?? null },
      tSurface: { value: opts.surfaceTexture ?? null },
      uSurfaceMix: { value: opts.surfaceMix ?? 0 },
      uTextureMatrix: { value: new THREE.Matrix4() },
      uBase: { value: new THREE.Color(opts.base ?? 0x2b3040) },
      uBaseDark: { value: new THREE.Color(opts.baseDark ?? 0x1d2231) },
      uSheen: { value: new THREE.Color(opts.sheen ?? 0x9fd0ff) },
      uCamPos: { value: new THREE.Vector3() },
      uHasReflection: { value: 0 },
      uReflectStrength: { value: opts.strength ?? 0.9 },
      uWorldSize: { value: opts.worldSize ?? 24 },
      uTime: { value: 0 },
      uPuddleScale: { value: 1 },
      uLightA: { value: new THREE.Color(opts.lightA ?? 0xffc07a) },
      uLightB: { value: new THREE.Color(opts.lightB ?? 0x6fb6ff) },
      uToonSteps: { value: opts.toonSteps ?? 3 },
    },
  });
}

/** Blob-shaped puddle mask painted in world-XZ space. */
export function puddleMaskTexture(size = 1024, worldSize = 24) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  const toPx = (x, z) => [((x + worldSize / 2) / worldSize) * size, ((z + worldSize / 2) / worldSize) * size];

  // Deterministic-ish blob field concentrated on the road bands.
  const blobs = [
    // [x, z, radiusX, radiusZ, strength]
    [2.5, 7.6, 2.4, 1.3, 1.0],
    [-2.0, 6.4, 1.5, 0.8, 0.9],
    [8.2, 4.6, 1.7, 2.2, 1.0],
    [7.0, -1.5, 1.1, 1.9, 0.85],
    [5.6, 9.4, 1.9, 1.0, 0.95],
    [-6.0, 7.2, 1.3, 0.7, 0.7],
    [-4.6, 4.3, 0.8, 0.5, 0.62], // shallow puddle in front of the door
    [3.9, 4.6, 0.9, 0.6, 0.66],
    [-1.2, -0.6, 0.7, 0.7, 0.45],
    [9.8, 8.6, 1.4, 1.4, 0.9],
    [-9.0, 9.6, 1.6, 0.9, 0.8],
    [4.4, 1.2, 0.7, 1.1, 0.55],
  ];

  for (const [x, z, rx, rz, s] of blobs) {
    const [px, py] = toPx(x, z);
    const prx = (rx / worldSize) * size;
    const prz = (rz / worldSize) * size;
    const g = ctx.createRadialGradient(px, py, 0, px, py, Math.max(prx, prz));
    g.addColorStop(0, `rgba(255,255,255,${s})`);
    g.addColorStop(0.55, `rgba(255,255,255,${s * 0.92})`);
    g.addColorStop(0.85, `rgba(255,255,255,${s * 0.45})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(prz, prx));
    ctx.scale(1, prz / prx);
    ctx.translate(-px, -py);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px, py, prx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // damp film everywhere else (thin sheen, not a mirror)
  ctx.globalCompositeOperation = 'lighter';
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i] < 110) img.data[i] = 128;
  }
  ctx.putImageData(img, 0, 0);
  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}