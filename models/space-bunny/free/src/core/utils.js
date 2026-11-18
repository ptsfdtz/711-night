import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Deterministic RNG (mulberry32) so the diorama is identical on
 *  every load — important for a "collectible model" feel.
 * ------------------------------------------------------------------ */
export function makeRng(seed = 20240501) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rng = makeRng(884211);

export const rand = (a = 0, b = 1) => a + rng() * (b - a);
export const pick = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];

/* ---------------------------- easing ----------------------------- */
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const damp = (cur, target, lambda, dt) => lerp(cur, target, 1 - Math.exp(-lambda * dt));

/* --------------------------- geometry ---------------------------- */

/** Box helper. `opts` = {x,y,z,rx,ry,rz,parent,name,noOutline} */
export function box(w, h, d, material, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  place(m, opts);
  return m;
}

export function cyl(rt, rb, h, seg, material, opts = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  place(m, opts);
  return m;
}

export function plane(w, h, material, opts = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  place(m, opts);
  return m;
}

export function torus(r, tube, rad, tub, material, opts = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, rad, tub), material);
  place(m, opts);
  return m;
}

export function place(m, opts = {}) {
  const p = opts.parent;
  if (p) p.add(m);
  if (opts.x !== undefined) m.position.x = opts.x;
  if (opts.y !== undefined) m.position.y = opts.y;
  if (opts.z !== undefined) m.position.z = opts.z;
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  if (opts.name) m.name = opts.name;
  if (opts.cast === false) m.castShadow = false;
  if (opts.receive === false) m.receiveShadow = false;
  m.userData.noOutline = opts.noOutline === true;
  m.userData.noReflect = opts.noReflect === true;
  return m;
}

/** Rounded box built from an extruded rounded rect (nicer silhouette than a cube). */
export function roundedBoxGeo(w, h, d, r = 0.06, curve = 3) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const shape = new THREE.Shape();
  const x = -w / 2 + r;
  const y = -h / 2 + r;
  const iw = w - r * 2;
  const ih = h - r * 2;
  shape.moveTo(x, -h / 2);
  shape.lineTo(x + iw, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, y);
  shape.lineTo(w / 2, y + ih);
  shape.quadraticCurveTo(w / 2, h / 2, x + iw, h / 2);
  shape.lineTo(x, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, y + ih);
  shape.lineTo(-w / 2, y);
  shape.quadraticCurveTo(-w / 2, -h / 2, x, -h / 2);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d - r * 2,
    bevelEnabled: true,
    bevelSize: r,
    bevelThickness: r,
    bevelSegments: curve,
    curveSegments: curve + 1,
  });
  geo.translate(0, 0, -(d - r * 2) / 2);
  geo.computeVertexNormals();
  return geo;
}

export function roundedBox(w, h, d, material, opts = {}) {
  return place(new THREE.Mesh(roundedBoxGeo(w, h, d, opts.r ?? 0.06), material), opts);
}

/* ------------------------- transform group ----------------------- */

/** Create an empty Group positioned / rotated in one call. */
export function group(opts = {}) {
  const g = new THREE.Group();
  place(g, opts);
  return g;
}

/* --------------------------- geometry ops ----------------------- */

/** Mirror a built sub-tree across X (used for paired props). */
export function mirrorX(parent, newParent) {
  const clone = parent.clone(true);
  clone.scale.x *= -1;
  newParent.add(clone);
  return clone;
}

/* ------------------------------ misc ----------------------------- */

export function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  return { c, ctx };
}

export function texFromCanvas(c, { repeat = [1, 1], srgb = true, aniso = 4, flipY = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.flipY = flipY;
  t.needsUpdate = true;
  return t;
}

/** Lathe a silhouette — used for bottles, cups, bollards, kettle pots. */
export function latheGeo(points, seg = 14) {
  return new THREE.LatheGeometry(
    points.map((p) => new THREE.Vector2(p[0], p[1])),
    seg
  );
}