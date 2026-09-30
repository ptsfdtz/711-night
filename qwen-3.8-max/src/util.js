// util.js — geometry builders, outline helper, canvas textures, math helpers.
import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 * Math / random helpers
 * ------------------------------------------------------------------ */
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------------ *
 * Outline (inverted-hull) helper — gives the cel/anime silhouette.
 * The outline mesh is a slightly enlarged BackSide copy of the source.
 * ------------------------------------------------------------------ */
const OUTLINE_COLOR = new THREE.Color(0x141a2a);

export function addOutline(mesh, thickness = 0.035, color = OUTLINE_COLOR) {
  if (!mesh || !mesh.geometry) return mesh;
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
    // keep outlines crisp, avoid z-fighting with the fill mesh
  });
  mat.toneMapped = false;
  const outline = new THREE.Mesh(mesh.geometry, mat);
  const s = 1 + thickness;
  outline.scale.set(s, s, s);
  outline.renderOrder = -1;
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.name = '__outline__';
  mesh.add(outline);
  return mesh;
}

/* ------------------------------------------------------------------ *
 * Primitive factories (all centred on their local origin)
 * ------------------------------------------------------------------ */
export function box(w, h, d, mat, { outline = true, t = 0.03 } = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (outline) addOutline(m, t);
  return m;
}

export function cyl(rt, rb, h, seg, mat, { outline = true, t = 0.035 } = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (outline) addOutline(m, t);
  return m;
}

export function sphere(r, mat, { outline = true, t = 0.04, wSeg = 16, hSeg = 12 } = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, wSeg, hSeg), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (outline) addOutline(m, t);
  return m;
}

export function plane(w, h, mat) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.receiveShadow = true;
  return m;
}

// Position helper (chainable-ish)
export function at(obj, x, y, z) {
  obj.position.set(x, y, z);
  return obj;
}

/* ------------------------------------------------------------------ *
 * Procedural canvas textures (signage, posters, glass rain, etc.)
 * ------------------------------------------------------------------ */
export function canvasTexture(w, h, draw, { repeat = null, aniso = 4 } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = aniso;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  tex.needsUpdate = true;
  return tex;
}

// Rounded-rect path helper for canvas drawing
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
