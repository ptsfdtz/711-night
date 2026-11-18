import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Cel-shading toolkit: a 4-band gradient ramp drives every MeshToon
 *  material, which is what gives the scene its 三渲二 / anime look.
 * ------------------------------------------------------------------ */

let _ramp = null;
export function toonRamp(steps = [0.13, 0.36, 0.68, 1.0]) {
  if (_ramp) return _ramp;
  const n = steps.length;
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const v = Math.round(steps[i] * 255);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  _ramp = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  _ramp.minFilter = THREE.NearestFilter;
  _ramp.magFilter = THREE.NearestFilter;
  _ramp.generateMipmaps = false;
  _ramp.needsUpdate = true;
  return _ramp;
}

/* ----------------------------- palette --------------------------- *
 *  Cool, desaturated night exterior vs. warm interior. Kept soft and
 *  low-contrast so the neon accents can do the talking.
 * ------------------------------------------------------------------ */
export const PAL = {
  night: 0x1a2340,
  nightDeep: 0x111830,
  asphalt: 0x2b3040,
  asphaltWet: 0x212636,
  sidewalk: 0x5e626e,
  sidewalkEdge: 0x8b8f9d,
  curb: 0x9aa0aa,
  wallStore: 0x7f7a6e,
  wallStoreTrim: 0x245046,
  wallSide: 0xd9d5cc,
  awning: 0x1f8a5f,
  awningDark: 0x14714b,
  signRed: 0xe8342a,
  signGreen: 0x0f8f4d,
  signCream: 0xf7f1e2,
  metal: 0x8d94a4,
  metalDark: 0x4b5262,
  rubber: 0x2a2d36,
  glassFrame: 0x2a3044,
  plasticWhite: 0xf2f3f0,
  neonPink: 0xff5fa8,
  neonCyan: 0x5fe4ff,
  neonGreen: 0x62ff9d,
  lampWarm: 0xffd7a0,
  interiorWarm: 0xffd9a8,
  vendingRed: 0xb02c26,
  vendingBody: 0xb9bdb6,
  tileWall: 0xdfe6e2,
  shelfMetal: 0xb9bec4,
  shelfTrim: 0x7c8590,
  concrete: 0x585d68,
  concreteDark: 0x3d414c,
  woodDark: 0x4a3628,
  woodMid: 0x7a5b41,
  blueFabric: 0x3f5a8a,
};

/* --------------------------- material api ------------------------ */

const _cache = new Map();
const _emissiveRegistry = [];

/** Cel-shaded surface. `color` hex, optional `emissive` for self-lit panels. */
export function toon(color, opts = {}) {
  const key = 'toon:' + color + ':' + JSON.stringify(opts);
  if (_cache.has(key)) return _cache.get(key);
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: toonRamp(opts.steps),
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
    fog: opts.fog !== false,
  });
  if (opts.name) m.name = opts.name;
  if (opts.flicker) _emissiveRegistry.push({ mat: m, base: opts.emissiveIntensity ?? 1, cfg: opts.flicker });
  _cache.set(key, m);
  return m;
}

/**
 * Self-lit toon material. Used inside the shop: a small emissive floor on
 * top of the cel shading makes every fixture read as "under bright
 * fluorescent light" no matter how far it sits from a point light.
 */
export function toonLit(color, opts = {}) {
  const key = 'lit:' + color + ':' + JSON.stringify(opts);
  if (_cache.has(key)) return _cache.get(key);
  const lit = opts.lit ?? 0.22;
  const m = new THREE.MeshToonMaterial({
    color,
    emissive: new THREE.Color(color).multiplyScalar(1),
    emissiveIntensity: lit,
    gradientMap: toonRamp(opts.steps),
  });
  _cache.set(key, m);
  return m;
}

/** Unshaded flat colour — signage, painted stripes, neon tubes. */
export function flat(color, opts = {}) {
  const m = new THREE.MeshBasicMaterial({
    color,
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
    blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    fog: opts.fog !== false,
    toneMapped: opts.toneMapped !== false,
  });
  return m;
}

/** Glowing panel (signage, vending machine, interior light boxes). */
export function glow(color, intensity = 1.5, opts = {}) {
  const m = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    transparent: !!opts.transparent,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
    depthWrite: opts.depthWrite ?? true,
    fog: opts.fog !== false,
  });
  if (opts.flicker) _emissiveRegistry.push({ mat: m, hex: color, intensity, cfg: opts.flicker });
  return m;
}

/**
 * Shopfront glazing. Deliberately almost-clear so the warm interior stays
 * the brightest thing in frame; the "glassiness" comes from the animated
 * rain-streak overlay plus the fresnel sheen added in the composite.
 */
export function glassMaterial(opts = {}) {
  return new THREE.MeshBasicMaterial({
    color: opts.color ?? 0x8fcfe6,
    transparent: true,
    opacity: opts.opacity ?? 0.07,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: true,
  });
}

/** Registry of materials that flicker (sign buzz, dying tube…). */
export function emissiveRegistry() {
  return _emissiveRegistry;
}

export function updateFlicker(t) {
  for (const e of _emissiveRegistry) {
    const c = e.cfg;
    let k = 1;
    if (c.kind === 'buzz') {
      // Mostly steady with a rare stutter, like an old sign transformer.
      const n = Math.sin(t * 43.0) * Math.sin(t * 7.3) * Math.sin(t * 111.0);
      k = 1 - Math.max(0, n) * 0.28;
      if (Math.sin(t * 0.83) > 0.985) k *= 0.55 + 0.45 * Math.abs(Math.sin(t * 60));
    } else if (c.kind === 'tube') {
      k = 1 - 0.14 * Math.max(0, Math.sin(t * 5.1 + (c.phase || 0)) * Math.sin(t * 1.7));
    } else if (c.kind === 'pulse') {
      k = 1 + Math.sin(t * (c.speed || 1.2) + (c.phase || 0)) * (c.amount || 0.12);
    }
    if (e.hex !== undefined) e.mat.color.setHex(e.hex).multiplyScalar(e.intensity * k);
    else e.mat.emissiveIntensity = e.intensity * k;
  }
}