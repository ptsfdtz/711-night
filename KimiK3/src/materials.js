// Shared stylistic helpers: toon materials, outlines, canvas textures,
// fake glow/AO sprites used across the whole diorama.
import * as THREE from 'three';

// ---------------- toon gradient map ----------------
let _grad = null;
export function gradientMap() {
  if (_grad) return _grad;
  const steps = [96, 150, 205, 255];
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => {
    data[i * 4] = v; data[i * 4 + 1] = v; data[i * 4 + 2] = v; data[i * 4 + 3] = 255;
  });
  const tex = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  _grad = tex;
  return tex;
}

export function toon(color, opts = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...opts });
}

// ---------------- inverted-hull outline ----------------
const _outlineCache = new Map();
export function outlineMaterial(thickness = 0.03, color = 0x101322) {
  const key = thickness + '_' + color;
  if (_outlineCache.has(key)) return _outlineCache.get(key);
  const m = new THREE.ShaderMaterial({
    uniforms: { uT: { value: thickness }, uC: { value: new THREE.Color(color) } },
    vertexShader: /* glsl */`
      uniform float uT;
      void main() {
        vec3 p = position + normalize(normal) * uT;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uC;
      void main() { gl_FragColor = vec4(uC, 1.0); }`,
    side: THREE.BackSide,
  });
  _outlineCache.set(key, m);
  return m;
}

/** Add an inverted-hull outline as a child of the given mesh. */
export function addOutline(mesh, thickness = 0.03, color = 0x101322) {
  const o = new THREE.Mesh(mesh.geometry, outlineMaterial(thickness, color));
  o.raycast = () => {};
  mesh.add(o);
  return o;
}

// ---------------- canvas texture helper ----------------
export function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  return t;
}

// ---------------- glow / AO / fake reflection ----------------
let _glowTex = null;
export function glowTex() {
  if (_glowTex) return _glowTex;
  _glowTex = canvasTex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0.0, 'rgba(255,255,255,1)');
    r.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    r.addColorStop(1.0, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  });
  return _glowTex;
}

let _aoTex = null;
export function aoTex() {
  if (_aoTex) return _aoTex;
  _aoTex = canvasTex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 8, 64, 64, 64);
    r.addColorStop(0, 'rgba(0,0,0,0.6)');
    r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
  });
  return _aoTex;
}

/** Soft dark contact-shadow blob laid flat on the ground. */
export function aoBlob(w, d, opacity = 0.45) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: aoTex(), transparent: true, opacity, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

/** Camera-facing radial glow sprite (cheap bloom). */
export function glowSprite(color, sx, sy, opacity = 0.6) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex(), color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  s.scale.set(sx, sy, 1);
  return s;
}

let _streakTex = null;
export function streakTex() {
  if (_streakTex) return _streakTex;
  _streakTex = canvasTex(128, 256, (g) => {
    const v = g.createLinearGradient(0, 0, 0, 256);
    v.addColorStop(0, 'rgba(255,255,255,0.95)');
    v.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = v;
    g.fillRect(0, 0, 128, 256);
    g.globalCompositeOperation = 'destination-in';
    const hgrad = g.createLinearGradient(0, 0, 128, 0);
    hgrad.addColorStop(0, 'rgba(0,0,0,0)');
    hgrad.addColorStop(0.5, 'rgba(0,0,0,1)');
    hgrad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hgrad;
    g.fillRect(0, 0, 128, 256);
  });
  return _streakTex;
}

/** Bright-at-top vertical gradient laid flat (wet-road light reflection). */
export function flatStreak(color, w, d, opacity = 0.3) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({
      map: streakTex(), color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 3;
  return m;
}

/** Soft elliptical pool of light on the ground. */
export function lightPool(color, w, d, opacity = 0.35) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({
      map: glowTex(), color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 3;
  return m;
}

// ---------------- misc construction helpers ----------------
export function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

export function cyl(r, h, mat, seg = 12) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
}

/** Cylinder between two points (for frames, poles, wires-as-tubes). */
export function tubeBetween(a, b, r, mat, seg = 6) {
  const av = new THREE.Vector3(...a);
  const bv = new THREE.Vector3(...b);
  const delta = bv.clone().sub(av);
  const len = delta.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.position.copy(av).addScaledVector(delta, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  return m;
}
