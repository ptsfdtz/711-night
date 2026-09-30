import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  small build helpers
 * ------------------------------------------------------------------ */

export function box(w, h, d, sx = 1, sy = 1, sz = 1) {
  return new THREE.BoxGeometry(w, h, d, sx, sy, sz);
}

export function cyl(rt, rb, h, seg = 12, open = false) {
  return new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
}

export function plane(w, h, sw = 1, sh = 1) {
  return new THREE.PlaneGeometry(w, h, sw, sh);
}

export function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
}

export function group(x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  return g;
}

export function rot(m, rx = 0, ry = 0, rz = 0) {
  m.rotation.set(rx, ry, rz);
  return m;
}

/* ------------------------------------------------------------------ *
 *  palette
 * ------------------------------------------------------------------ */

export const C = {
  ink: 0x11141c,

  asphalt: 0x1c2434,
  asphaltDark: 0x141a26,
  sidewalk: 0x3b4250,
  sidewalkLite: 0x474f5e,
  curb: 0x555c6b,
  concrete: 0x6a7181,

  wallCream: 0xe9e5da,
  wallWarm: 0xf4efe3,
  wallGray: 0xa8adb6,
  wallDark: 0x5d6470,

  metal: 0x9aa1ac,
  metalDark: 0x59606b,
  metalDarkest: 0x363c45,

  glass: 0xcfe6f2,
  glassTint: 0x9fd0e8,

  white: 0xf3f5f7,
  paper: 0xf0efe8,

  warm: 0xffd9a0,
  warmDeep: 0xffb267,
  neonWarm: 0xffbe72,
  neonGreen: 0x63e39b,
  neonRed: 0xff5f6d,
  neonBlue: 0x86ccff,
  neonPink: 0xff86c8,

  red: 0xd44a52,
  green: 0x3f9e6a,
  orange: 0xf08a3c,
  blue: 0x4b7fc4,
  yellow: 0xf2c14e,
  wood: 0x8b6a4c,
  rubber: 0x252a33,
  plant: 0x3f7a52,
};

/* ------------------------------------------------------------------ *
 *  toon material
 * ------------------------------------------------------------------ */

const gradientCache = new Map();

export function gradientMap(steps = 4) {
  if (gradientCache.has(steps)) return gradientCache.get(steps);
  // 4 bytes per texel keeps the row alignment safe for every step count
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    // banded ramp: dark band, two mid bands, bright band
    const t = i / (steps - 1);
    const v = Math.round(255 * (0.30 + 0.70 * Math.pow(t, 0.8)));
    data[i * 4 + 0] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  gradientCache.set(steps, tex);
  return tex;
}

/**
 * cel shaded material with a controllable fresnel rim (三渲二 look)
 */
export function toon(color, opts = {}) {
  const {
    steps = 3,
    rim = 0x5f7fb8,
    rimStrength = 0.35,
    rimPower = 2.6,
    emissive = 0x000000,
    emissiveIntensity = 1,
    map = null,
    transparent = false,
    opacity = 1,
    side = THREE.FrontSide,
    depthWrite = true,
    alphaTest = 0,
  } = opts;

  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: gradientMap(steps),
    emissive,
    emissiveIntensity,
    map,
    transparent,
    opacity,
    side,
    depthWrite,
    alphaTest,
  });

  const uniforms = {
    uRimColor: { value: new THREE.Color(rim) },
    uRimStrength: { value: rimStrength },
    uRimPower: { value: rimPower },
  };
  mat.userData.uniforms = uniforms;

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform vec3 uRimColor;
        uniform float uRimStrength;
        uniform float uRimPower;`
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        {
          vec3 vdir = normalize( vViewPosition );
          float fres = pow( 1.0 - saturate( dot( normal, vdir ) ), uRimPower );
          gl_FragColor.rgb = mix( gl_FragColor.rgb, uRimColor, fres * uRimStrength );
        }`
      );
  };
  mat.customProgramCacheKey = () => 'toonrim';
  return mat;
}

/* flat unlit material used for screens / light boxes / neon faces */
export function flat(color, opts = {}) {
  const {
    map = null,
    transparent = false,
    opacity = 1,
    side = THREE.FrontSide,
    depthWrite = true,
    blending = THREE.NormalBlending,
    alphaTest = 0,
  } = opts;
  return new THREE.MeshBasicMaterial({
    color,
    map,
    transparent,
    opacity,
    side,
    depthWrite,
    blending,
    alphaTest,
    toneMapped: false,
  });
}

/* ------------------------------------------------------------------ *
 *  outlines (inverted hull)
 * ------------------------------------------------------------------ */

const outlineCache = new Map();

export function outlineMaterial(thickness = 0.02, color = 0x11131b) {
  const key = thickness.toFixed(4) + '|' + color;
  if (outlineCache.has(key)) return outlineCache.get(key);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(color) },
    },
    vertexShader: /* glsl */ `
      uniform float uThickness;
      void main() {
        vec3 p = position + normalize( normal ) * uThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      void main() { gl_FragColor = vec4( uColor, 1.0 ); }
    `,
    side: THREE.BackSide,
    depthWrite: true,
  });
  outlineCache.set(key, mat);
  return mat;
}

/** adds an inverted-hull outline as a child of the given mesh */
export function outline(mesh, thickness = 0.022, color = 0x11131b) {
  const o = new THREE.Mesh(mesh.geometry, outlineMaterial(thickness, color));
  o.raycast = () => {};
  o.userData.isOutline = true;
  o.renderOrder = -1;
  mesh.add(o);
  return mesh;
}

/* ------------------------------------------------------------------ *
 *  additive glow billboard (fake bloom for neon / lamps)
 * ------------------------------------------------------------------ */

const glowTexCache = new Map();

export function radialTexture(softness = 0.55) {
  const key = softness.toFixed(2);
  if (glowTexCache.has(key)) return glowTexCache.get(key);
  const s = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(softness * 0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(softness, 'rgba(255,255,255,0.18)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  glowTexCache.set(key, tex);
  return tex;
}

/** soft additive halo that always faces the camera */
export function glow(color = 0xffcf9c, size = 1.6, opacity = 0.55, softness = 0.55) {
  const mat = new THREE.MeshBasicMaterial({
    map: radialTexture(softness),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.userData.isGlow = true;
  m.renderOrder = 6;
  return m;
}

/* ------------------------------------------------------------------ *
 *  misc
 * ------------------------------------------------------------------ */

export const rnd = (() => {
  let s = 20240923;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
})();

export function pick(arr) {
  return arr[Math.floor(rnd() * arr.length) % arr.length];
}

export function range(a, b) {
  return a + (b - a) * rnd();
}
