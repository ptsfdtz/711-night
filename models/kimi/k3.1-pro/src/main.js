import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------- Renderer, camera, and the miniature's viewing controls ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#091523', 28, 52);
const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
camera.position.set(16, 13, 18);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.rotateSpeed = 0.62;
controls.zoomSpeed = 0.8;
controls.panSpeed = 0.65;
controls.screenSpacePanning = true;
controls.minZoom = 0.65;
controls.maxZoom = 3.2;
controls.minPolarAngle = 0.22;
controls.maxPolarAngle = Math.PI * 0.475;
controls.update();

const world = new THREE.Group();
world.rotation.y = -0.045;
scene.add(world);

let seed = 7112026;
function rand() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
const pick = (items) => items[Math.floor(rand() * items.length)];

// ---------- Clean cel-shaded materials and reusable modeling helpers ----------
const gradientMap = new THREE.DataTexture(new Uint8Array([45, 105, 178, 255]), 4, 1, THREE.RedFormat);
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
gradientMap.generateMipmaps = false;
gradientMap.needsUpdate = true;

const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap, ...extra });
const M = {
  base: toon('#162433'),
  baseTrim: toon('#0a121e'),
  sidewalk: toon('#637780'),
  curb: toon('#a4b1ad'),
  wall: toon('#b7c4bc'),
  wallDark: toon('#40545a'),
  trim: toon('#263e48'),
  roof: toon('#273d49'),
  metal: toon('#607780'),
  paleMetal: toon('#b7cac7'),
  dark: toon('#142630'),
  white: toon('#dbe5dc'),
  cream: toon('#f2e7c9'),
  teal: toon('#3a9c98'),
  orange: toon('#e88b56'),
  red: toon('#c95e5c'),
  blue: toon('#517f9c'),
  yellow: toon('#e5c66d'),
  wood: toon('#9d7960'),
  warmLight: toon('#fff0c5', { emissive: '#ffe0a0', emissiveIntensity: 1.3 }),
  coolLight: toon('#c7ffff', { emissive: '#9defff', emissiveIntensity: 1.2 }),
  black: toon('#0c1820'),
};
const ink = new THREE.LineBasicMaterial({ color: '#101c29', transparent: true, opacity: 0.82 });
const glass = new THREE.MeshPhysicalMaterial({
  color: '#b5e4e7', transparent: true, opacity: 0.13, roughness: 0.08,
  metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.08,
  depthWrite: false, side: THREE.DoubleSide,
});
const wetRoad = new THREE.MeshPhysicalMaterial({
  color: '#172c3b', roughness: 0.24, metalness: 0.38,
  clearcoat: 1, clearcoatRoughness: 0.16,
});

function box(w, h, d, x, y, z, material, parent = world, outline = false) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (outline) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), ink);
    edges.renderOrder = 3;
    mesh.add(edges);
  }
  return mesh;
}

function cylinder(rt, rb, h, segments, x, y, z, material, parent = world, outline = false) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (outline) {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), ink);
    mesh.add(edges);
  }
  return mesh;
}

function plane(w, h, x, y, z, material, parent = world) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function tubeBetween(a, b, radius, material, parent = world, segments = 8) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const delta = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, delta.length(), segments), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function wire(points, radius = 0.018, material = M.dark, parent = world) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, radius, 5, false), material);
  parent.add(mesh);
  return mesh;
}

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return texture;
}

function signMaterial(texture, glow = 0) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    emissiveMap: texture,
    emissive: '#ffffff',
    emissiveIntensity: glow,
    roughness: 0.58,
    metalness: 0,
    side: THREE.DoubleSide,
  });
}

function textTexture(text, subtitle = '', bg = '#e9f1df', fg = '#214a50', accent = '#df8357') {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, 18);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 72px "Yu Gothic", "Hiragino Sans", sans-serif';
    ctx.fillText(text, w / 2, subtitle ? 105 : 135);
    if (subtitle) {
      ctx.font = '600 25px sans-serif';
      ctx.letterSpacing = '4px';
      ctx.fillText(subtitle, w / 2, 190);
    }
  });
}

// ---------- Square collectible base, wet L-shaped street, and curb ----------
const base = new THREE.Mesh(new RoundedBoxGeometry(18, 0.72, 18, 3, 0.12), M.base);
base.position.y = -0.4;
base.castShadow = true;
base.receiveShadow = true;
world.add(base);
const baseEdges = new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry, 28), ink);
base.add(baseEdges);
box(17.9, 0.15, 17.9, 0, -0.79, 0, M.baseTrim, world, true);
box(17.76, 0.08, 17.76, 0, 0, 0, wetRoad);

// Pavement block leaves an unmistakable street corner on its front and right.
box(13.25, 0.2, 10.85, -1.65, 0.13, -2.83, M.sidewalk, world, true);
box(13.35, 0.25, 0.18, -1.65, 0.15, 2.62, M.curb, world, true);
box(0.18, 0.25, 10.75, 5.0, 0.15, -2.85, M.curb, world, true);

// Sidewalk expansion joints and small tactile paving by the entrance.
const seamMat = toon('#485e68');
for (let x = -8; x < 5; x += 0.82) box(0.014, 0.008, 2.05, x, 0.236, 1.56, seamMat);
for (const z of [0.75, 1.55, 2.35]) box(13.05, 0.008, 0.014, -1.65, 0.236, z, seamMat);
for (let i = 0; i < 9; i++) {
  for (let j = 0; j < 3; j++) {
    cylinder(0.035, 0.035, 0.016, 8, 0.25 + i * 0.25, 0.255, 1.94 + j * 0.19, M.yellow);
  }
}

// Reflective zebra crossing across the front street.
const crossingMat = new THREE.MeshPhysicalMaterial({
  color: '#b7cccf', roughness: 0.25, metalness: 0.18, clearcoat: 1,
});
for (let i = 0; i < 7; i++) {
  const stripe = box(0.55, 0.018, 3.35, -3.15 + i * 0.91, 0.057, 4.65, crossingMat);
  stripe.rotation.y = -0.025;
}
// Side-street parking bay and corner markings.
const roadLine = toon('#91a9aa');
for (const z of [-5.8, -2.7, 0.4]) {
  box(2.35, 0.012, 0.07, 6.8, 0.055, z, roadLine);
  box(0.07, 0.012, 2.95, 5.64, 0.055, z + 1.46, roadLine);
}
box(0.09, 0.012, 8.6, 8.15, 0.055, -2.8, M.yellow);

// Storm drains along both legs of the corner.
function drain(x, z, rotate = false) {
  const g = new THREE.Group();
  g.position.set(x, 0.075, z);
  if (rotate) g.rotation.y = Math.PI / 2;
  world.add(g);
  box(0.82, 0.04, 0.34, 0, 0, 0, M.dark, g);
  for (let i = -3; i <= 3; i++) box(0.055, 0.045, 0.3, i * 0.105, 0.018, 0, M.metal, g);
}
for (const x of [-6.7, -2.6, 3.5]) drain(x, 2.88);
for (const z of [-5.7, -1.8, 1.2]) drain(5.26, z, true);

const manhole = cylinder(0.58, 0.58, 0.035, 32, -5.3, 0.065, 5.75, M.metal, world, true);
for (let i = -3; i <= 3; i++) box(0.72, 0.012, 0.025, -5.3, 0.088, 5.75 + i * 0.1, M.dark);

// Organic puddles sit over the rough asphalt; soft colored streaks imply neon reflections.
const puddleMat = new THREE.MeshPhysicalMaterial({
  color: '#29495b', roughness: 0.07, metalness: 0.58, clearcoat: 1,
  transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide,
});
function puddle(x, z, sx, sz) {
  const shape = new THREE.Shape();
  const count = 22;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const r = 0.76 + rand() * 0.25;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
  }
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), puddleMat.clone());
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(sx, sz, 1);
  mesh.position.set(x, 0.071 + rand() * 0.006, z);
  mesh.receiveShadow = true;
  world.add(mesh);
  return mesh;
}
puddle(-1.2, 6.7, 2.7, 0.8);
puddle(3.7, 4.0, 1.25, 0.55);
puddle(6.45, -1.2, 0.8, 2.2);
puddle(-6.4, 3.65, 0.95, 0.45);
puddle(0.6, 2.95, 1.7, 0.32);

const reflectionMaterials = [];
function reflectionTexture(colors) {
  return canvasTexture(128, 512, (ctx, w, h) => {
    const fade = ctx.createLinearGradient(0, 0, 0, h);
    fade.addColorStop(0, 'rgba(255,255,255,0.7)');
    fade.addColorStop(0.45, 'rgba(255,255,255,0.26)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-in';
    colors.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect((i * w) / colors.length, 0, w / colors.length + 1, h);
    });
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 34; i++) {
      ctx.globalAlpha = 0.15 + rand() * 0.45;
      ctx.fillRect(0, rand() * h, w, 1 + rand() * 6);
    }
  });
}
function reflection(x, z, w, h, colors, opacity = 0.28, rotation = 0) {
  const material = new THREE.MeshBasicMaterial({
    map: reflectionTexture(colors), transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = plane(w, h, x, 0.085, z, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rotation;
  reflectionMaterials.push(material);
}
reflection(-1.8, 3.55, 8.3, 3.1, ['#9ee9d5', '#f4e7af', '#ec9d72'], 0.23);
reflection(4.15, 1.95, 1.4, 2.9, ['#79e6e4', '#e493a5'], 0.34);
reflection(6.05, 3.85, 1.65, 3.8, ['#f3c078', '#8db6b1'], 0.21, -0.18);

// ---------- Convenience store shell and large transparent storefront ----------
const store = new THREE.Group();
world.add(store);
box(9.55, 0.14, 6.45, -1.65, 0.31, -2.6, M.cream, store, true);
box(9.55, 5.15, 0.18, -1.65, 2.88, -5.8, M.wall, store, true);
box(0.18, 5.15, 6.4, -6.4, 2.88, -2.6, M.wall, store, true);
box(0.18, 5.15, 3.05, 3.1, 2.88, -4.28, M.wall, store, true);
// The right-front side is glazed too, preserving the interior view from the initial camera.
box(0.18, 0.75, 3.35, 3.1, 0.69, -1.1, M.wallDark, store, true);
box(0.18, 1.15, 3.35, 3.1, 4.45, -1.1, M.wall, store, true);
for (const z of [-2.78, -1.08, 0.57]) box(0.16, 3.25, 0.09, 3.1, 2.46, z, M.trim, store);
for (const z of [-1.94, -0.23]) {
  const sideGlass = plane(1.57, 3.05, 3.115, 2.48, z, glass, store);
  sideGlass.rotation.y = Math.PI / 2;
}
box(9.95, 0.3, 6.85, -1.65, 5.62, -2.55, M.roof, store, true);
box(9.9, 0.18, 0.18, -1.65, 5.76, 0.83, M.paleMetal, store);
// Rooftop details make the model rewarding to orbit and inspect from above.
box(1.55, 0.62, 1.05, -3.8, 6.02, -3.8, M.metal, store, true);
for (let i = 0; i < 7; i++) box(0.08, 0.38, 1.07, -4.32 + i * 0.17, 6.03, -3.8, M.dark, store);
cylinder(0.38, 0.38, 0.48, 16, -0.4, 5.99, -4.25, M.paleMetal, store, true);
cylinder(0.29, 0.38, 0.24, 16, -0.4, 6.35, -4.25, M.metal, store);
box(1.25, 0.12, 0.75, 1.45, 5.86, -2.8, M.dark, store);

const mainSignTexture = canvasTexture(1200, 180, (ctx, w, h) => {
  ctx.fillStyle = '#edf3d9';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#388e8b';
  ctx.fillRect(0, 0, w, 22);
  ctx.fillStyle = '#e68d58';
  ctx.fillRect(0, h - 21, w, 21);
  ctx.fillStyle = '#255b5c';
  ctx.textBaseline = 'middle';
  ctx.font = '700 94px "Yu Gothic", "Hiragino Sans", sans-serif';
  ctx.fillText('夜あかり', 55, 94);
  ctx.font = '600 28px sans-serif';
  ctx.fillText('K O N B I N I', 495, 71);
  ctx.font = '500 22px sans-serif';
  ctx.fillText('夜の街に、あたたかい灯りを', 495, 116);
  ctx.fillStyle = '#df7e50';
  ctx.fillRect(1000, 35, 145, 108);
  ctx.fillStyle = '#fff7df';
  ctx.textAlign = 'center';
  ctx.font = '800 58px sans-serif';
  ctx.fillText('24h', 1072, 91);
});
const mainSignMat = signMaterial(mainSignTexture, 0.82);
box(9.45, 1.14, 0.24, -1.65, 4.95, 0.66, M.cream, store, true);
plane(9.12, 0.94, -1.65, 4.96, 0.79, mainSignMat, store);
box(9.55, 0.08, 0.31, -1.65, 4.36, 0.68, M.teal, store);

const sideSignMat = signMaterial(textTexture('夜あかり', '24 HOURS', '#e8efda', '#285c5e'), 0.55);
const sideSign = plane(2.85, 0.8, 3.205, 4.62, -1.12, sideSignMat, store);
sideSign.rotation.y = Math.PI / 2;

const awning = box(9.9, 0.15, 1.27, -1.65, 4.15, 1.19, M.teal, store, true);
awning.rotation.x = 0.065;
box(9.92, 0.2, 0.09, -1.65, 4.04, 1.82, M.trim, store);
for (let x = -5.9; x <= 2.8; x += 1.45) {
  const strip = box(0.52, 0.025, 1.2, x, 4.235, 1.19, M.cream, store);
  strip.rotation.x = 0.065;
}
const gutter = cylinder(0.075, 0.075, 9.9, 10, -1.65, 4.02, 1.83, M.metal, store);
gutter.rotation.z = Math.PI / 2;
cylinder(0.065, 0.065, 3.75, 10, -6.47, 2.15, 0.77, M.metal, store);
for (const x of [-5.3, -2.4, 0.5, 2.5]) {
  box(0.65, 0.045, 0.19, x, 4.02, 1.05, M.warmLight, store);
}

// Window mullions and three broad, unobstructed panes.
for (const x of [-6.28, -4.23, -2.18, -0.13]) {
  box(0.075, 3.66, 0.11, x, 2.22, 0.67, M.trim, store);
}
box(6.22, 0.08, 0.11, -3.2, 0.41, 0.67, M.trim, store);
box(6.22, 0.08, 0.11, -3.2, 4.02, 0.67, M.trim, store);
for (const x of [-5.255, -3.205, -1.155]) {
  plane(1.96, 3.5, x, 2.22, 0.685, glass, store);
}
// A few crisp diagonal highlights reinforce the anime glass treatment.
const glassHighlight = new THREE.MeshBasicMaterial({ color: '#d9ffff', transparent: true, opacity: 0.13, depthWrite: false });
for (const x of [-5.75, -3.1, -1.65]) {
  const streak = plane(0.055, 2.35, x, 2.5, 0.7, glassHighlight, store);
  streak.rotation.z = -0.28;
}

// Automatic entrance doors are separate meshes so they can slide occasionally.
function makeDoor(x) {
  const group = new THREE.Group();
  group.position.set(x, 0, 0);
  store.add(group);
  box(1.29, 3.48, 0.055, 0, 2.19, 0.7, glass, group);
  box(1.34, 0.07, 0.09, 0, 0.46, 0.7, M.trim, group);
  box(1.34, 0.07, 0.09, 0, 3.93, 0.7, M.trim, group);
  box(0.055, 3.5, 0.09, -0.645, 2.19, 0.7, M.trim, group);
  box(0.055, 3.5, 0.09, 0.645, 2.19, 0.7, M.trim, group);
  box(0.055, 0.65, 0.075, x < 1.5 ? 0.46 : -0.46, 2.03, 0.76, M.paleMetal, group);
  const decal = plane(0.72, 0.24, 0, 2.82, 0.735, signMaterial(textTexture('夜あかり', '', '#dcebe1', '#35716e'), 0.15), group);
  decal.scale.y = 0.65;
  return group;
}
const leftDoor = makeDoor(0.535);
const rightDoor = makeDoor(1.885);
box(0.11, 3.65, 0.13, -0.17, 2.2, 0.69, M.trim, store);
box(0.11, 3.65, 0.13, 2.58, 2.2, 0.69, M.trim, store);
box(2.85, 0.18, 0.18, 1.2, 4.02, 0.69, M.trim, store);
box(0.34, 0.13, 0.16, 1.2, 3.94, 0.82, M.dark, store);
const matTexture = textTexture('いらっしゃいませ', 'WELCOME', '#294b50', '#c9ddd1', '#294b50');
const doorMat = plane(2.4, 0.78, 1.22, 0.263, 1.22, signMaterial(matTexture), store);
doorMat.rotation.x = -Math.PI / 2;

// ---------- Warm, densely stocked interior ----------
const floorTile = toon('#aab5a7');
for (let x = -5.9; x < 2.9; x += 0.62) box(0.012, 0.008, 5.85, x, 0.387, -2.55, floorTile, store);
for (let z = -5.45; z < 0.45; z += 0.62) box(8.95, 0.008, 0.012, -1.65, 0.387, z, floorTile, store);

const productColors = ['#d97767', '#e7bd62', '#6fa595', '#7293b5', '#e7dbc0', '#b4829c', '#88aa68'];
const productMats = productColors.map((c) => toon(c));
const bottleCapMats = [M.white, M.teal, M.orange, M.blue];

function createFridge(x, index) {
  const g = new THREE.Group();
  g.position.set(x, 0, -5.43);
  store.add(g);
  box(1.3, 2.72, 0.48, 0, 1.75, 0, M.paleMetal, g, true);
  box(1.13, 2.25, 0.035, 0, 1.69, 0.258, M.coolLight, g);
  const header = signMaterial(textTexture(index % 2 ? 'お茶・水' : 'DRINKS', '', '#d8f0e8', '#347271', '#67a9a0'), 0.65);
  plane(1.12, 0.29, 0, 2.94, 0.263, header, g);
  for (let row = 0; row < 4; row++) {
    const y = 0.72 + row * 0.5;
    box(1.08, 0.035, 0.2, 0, y - 0.18, 0.31, M.metal, g);
    for (let col = 0; col < 7; col++) {
      const bx = -0.45 + col * 0.15;
      const pm = productMats[(col + row + index) % productMats.length];
      box(0.105, 0.27, 0.11, bx, y, 0.335, pm, g);
      box(0.055, 0.035, 0.07, bx, y + 0.15, 0.335, bottleCapMats[(col + row) % 4], g);
      box(0.108, 0.06, 0.115, bx, y - 0.02, 0.34, M.cream, g);
    }
  }
  box(1.15, 2.26, 0.025, 0, 1.7, 0.405, glass, g);
  box(0.035, 0.74, 0.055, 0.46, 1.67, 0.43, M.dark, g);
}
[-5.47, -4.08, -2.69, -1.3, 0.09].forEach(createFridge);

function createShelf(x, z, width, label) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  store.add(g);
  box(width + 0.12, 0.16, 0.92, 0, 0.46, 0, M.dark, g, true);
  for (const sx of [-width / 2, width / 2]) box(0.07, 1.25, 0.84, sx, 1.01, 0, M.metal, g);
  for (let level = 0; level < 3; level++) {
    const y = 0.59 + level * 0.42;
    box(width, 0.055, 0.88, 0, y, 0, M.paleMetal, g);
    for (let col = 0; col < Math.floor(width / 0.26); col++) {
      const px = -width / 2 + 0.17 + col * 0.26;
      const h = 0.23 + rand() * 0.09;
      const pm = productMats[(col + level * 2) % productMats.length];
      box(0.2, h, 0.29, px, y + h / 2 + 0.04, 0.22, pm, g);
      box(0.15, 0.055, 0.012, px, y + h / 2 + 0.04, 0.371, M.cream, g);
      if (level > 0) box(0.18, h * 0.85, 0.25, px, y + h / 2, -0.23, productMats[(col + level + 3) % productMats.length], g);
    }
  }
  const tag = signMaterial(textTexture(label, 'FRESH DAILY', '#f1e8c9', '#5b6355', '#e69361'));
  plane(0.95, 0.34, 0, 1.78, 0.43, tag, g);
  return g;
}
createShelf(-3.65, -2.12, 3.15, 'おにぎり');
createShelf(-0.25, -3.28, 2.55, 'お弁当');

// Chest freezer with sliding glass lids and visible frozen-food packages.
box(1.55, 0.88, 0.9, -5.25, 0.85, -3.85, M.white, store, true);
for (let i = 0; i < 5; i++) box(0.22, 0.18, 0.48, -5.78 + i * 0.26, 1.19, -3.85, productMats[i], store);
const freezerTop = plane(1.4, 0.76, -5.25, 1.34, -3.85, glass, store);
freezerTop.rotation.x = -Math.PI / 2;
box(0.04, 0.05, 0.82, -5.25, 1.35, -3.85, M.metal, store);

// Checkout counter, register, coffee station, and a tiny oden warmer.
box(2.18, 1.02, 0.82, 1.55, 0.91, -0.72, M.teal, store, true);
box(2.32, 0.12, 0.94, 1.55, 1.47, -0.72, M.cream, store, true);
box(0.52, 0.16, 0.43, 1.07, 1.6, -0.63, M.dark, store);
const registerScreen = box(0.47, 0.39, 0.07, 1.07, 1.86, -0.73, M.dark, store);
registerScreen.rotation.x = -0.16;
const regGlow = signMaterial(textTexture('¥ 680', 'THANK YOU', '#b6ded0', '#285b58', '#b6ded0'), 0.45);
const regPlane = plane(0.4, 0.27, 1.07, 1.87, -0.688, regGlow, store);
regPlane.rotation.x = -0.16;
box(0.55, 0.8, 0.5, 2.02, 1.91, -0.84, M.metal, store, true);
box(0.42, 0.28, 0.06, 2.02, 2.02, -0.56, M.black, store);
for (const x of [1.9, 2.12]) {
  cylinder(0.055, 0.045, 0.16, 10, x, 1.66, -0.51, M.cream, store);
  cylinder(0.025, 0.025, 0.13, 8, x, 1.78, -0.5, M.dark, store);
}
const coffeeLabel = signMaterial(textTexture('珈琲', 'FRESH COFFEE', '#efe3c6', '#68513d', '#b97b53'));
plane(0.48, 0.24, 2.02, 2.22, -0.565, coffeeLabel, store);
// Oden at the front of the counter.
box(0.83, 0.38, 0.58, 0.77, 1.66, -0.76, M.paleMetal, store);
box(0.72, 0.06, 0.47, 0.77, 1.66, -0.75, toon('#8f6846'), store);
for (let i = 0; i < 8; i++) {
  const food = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), i % 2 ? M.cream : M.yellow);
  food.position.set(0.49 + (i % 4) * 0.18, 1.72, -0.9 + Math.floor(i / 4) * 0.24);
  store.add(food);
}
box(0.79, 0.35, 0.025, 0.77, 1.92, -0.45, glass, store);

// Magazine rack by the window.
box(1.02, 1.28, 0.25, -5.66, 1.04, -0.15, M.metal, store, true);
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 4; col++) {
    const magazine = box(0.2, 0.34, 0.035, -6.01 + col * 0.235, 0.67 + row * 0.38, 0.005, productMats[(row * 3 + col) % productMats.length], store);
    magazine.rotation.x = -0.12;
    box(0.14, 0.035, 0.012, magazine.position.x, magazine.position.y + 0.06, 0.03, M.cream, store);
  }
}

// Back-room door, lockers, posters, and ceiling lightboxes.
box(1.05, 2.45, 0.12, 2.12, 1.64, -5.64, M.wallDark, store, true);
const staffMat = signMaterial(textTexture('STAFF', 'ONLY', '#d6ddcf', '#455b58', '#879b8f'));
plane(0.64, 0.38, 2.12, 2.15, -5.565, staffMat, store);
box(0.08, 0.08, 0.12, 1.75, 1.54, -5.49, M.paleMetal, store);
for (let i = 0; i < 2; i++) {
  box(0.58, 1.72, 0.42, 1.18 + i * 0.61, 1.25, -4.95, M.metal, store, true);
  for (let j = 0; j < 4; j++) box(0.25, 0.018, 0.025, 1.18 + i * 0.61, 1.72 + j * 0.055, -4.728, M.dark, store);
}
const posterA = signMaterial(textTexture('新発売', 'HOT SNACKS ¥220', '#f2d6b1', '#a55242', '#dc7a55'));
plane(0.92, 1.15, -5.52, 3.8, -5.68, posterA, store);
const posterB = signMaterial(textTexture('雨の日', 'あたたかい一杯を', '#c5dfe0', '#38666b', '#e59b6b'), 0.15);
const sidePoster = plane(0.86, 1.08, 3.205, 2.35, -4.25, posterB, store);
sidePoster.rotation.y = Math.PI / 2;

for (const z of [-1.25, -3.75]) {
  for (const x of [-3.9, -0.7]) box(2.2, 0.07, 0.36, x, 5.12, z, M.warmLight, store);
}
const hangingMat = signMaterial(textTexture('お弁当・おにぎり', 'できたて毎日お届け', '#f0ead1', '#4a6861', '#df8e5c'), 0.3);
plane(2.65, 0.58, -2.45, 4.32, -3.75, hangingMat, store);
for (const x of [-3.45, -1.45]) tubeBetween([x, 4.6, -3.75], [x, 5.08, -3.75], 0.012, M.dark, store);

// Painted floor guidance near the till.
const floorSign = signMaterial(textTexture('レジ →', 'CHECKOUT', '#d5c96f', '#4d554c', '#d5c96f'));
const floorLabel = plane(1.18, 0.47, 1.24, 0.397, 0.02, floorSign, store);
floorLabel.rotation.x = -Math.PI / 2;

// Interior warmth, with no people, contrasting the blue rainy exterior.
scene.add(new THREE.HemisphereLight('#8cb5d3', '#182331', 1.12));
scene.add(new THREE.AmbientLight('#647b94', 0.38));
const moon = new THREE.DirectionalLight('#a7c6ef', 1.68);
moon.position.set(-7, 13, 8);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -13;
moon.shadow.camera.right = 13;
moon.shadow.camera.top = 13;
moon.shadow.camera.bottom = -13;
moon.shadow.camera.near = 0.5;
moon.shadow.camera.far = 35;
moon.shadow.bias = -0.0006;
scene.add(moon);
for (const [x, z, intensity] of [[-3.5, -1.8, 38], [0.6, -2.6, 36], [-2.5, -4.5, 31]]) {
  const light = new THREE.PointLight('#ffcb8b', intensity, 8.5, 2);
  light.position.set(x, 4.4, z);
  store.add(light);
}
const signLight = new THREE.PointLight('#c9ffe1', 8, 6, 2);
signLight.position.set(-1.6, 4.4, 2.0);
world.add(signLight);

// ---------- Outside: vending machine, bicycle, umbrella stand, and bins ----------
const vending = new THREE.Group();
vending.position.set(4.02, 0.24, 0.05);
world.add(vending);
box(1.12, 2.3, 0.78, 0, 1.15, 0, M.red, vending, true);
box(0.96, 1.38, 0.05, 0, 1.52, 0.414, M.coolLight, vending);
box(0.86, 1.15, 0.035, -0.03, 1.57, 0.45, M.dark, vending);
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 5; col++) {
    const x = -0.35 + col * 0.17;
    const y = 1.22 + row * 0.34;
    box(0.1, 0.23, 0.08, x, y, 0.49, productMats[(row + col) % productMats.length], vending);
    box(0.105, 0.04, 0.085, x, y - 0.025, 0.495, M.cream, vending);
    box(0.11, 0.025, 0.04, x, y - 0.15, 0.52, M.warmLight, vending);
  }
}
box(0.91, 1.16, 0.025, -0.02, 1.57, 0.535, glass, vending);
box(0.58, 0.27, 0.08, -0.15, 0.37, 0.44, M.dark, vending);
box(0.19, 0.38, 0.08, 0.35, 0.75, 0.44, M.paleMetal, vending);
box(0.08, 0.08, 0.04, 0.35, 0.82, 0.5, M.orange, vending);
const coldTexture = textTexture('つめた〜い', 'DRINK  ¥130', '#dfeee4', '#397579', '#df7d68');
plane(0.93, 0.34, 0, 2.1, 0.42, signMaterial(coldTexture, 0.75), vending);
const vendLight = new THREE.PointLight('#82e8e5', 8, 4, 2);
vendLight.position.set(4.05, 1.55, 1.0);
world.add(vendLight);

// Umbrella stand with four furled umbrellas.
box(0.58, 0.55, 0.4, 2.9, 0.52, 1.35, M.metal, world, true);
for (let i = 0; i < 4; i++) {
  const x = 2.72 + (i % 2) * 0.26;
  const z = 1.25 + Math.floor(i / 2) * 0.2;
  tubeBetween([x, 0.6, z], [x + 0.05, 1.53 + i * 0.04, z], 0.018, M.paleMetal);
  const canopy = cylinder(0.035, 0.1, 0.67, 8, x + 0.035, 1.08, z, i % 2 ? M.blue : M.yellow);
  canopy.rotation.z = -0.035;
  wire([[x + 0.05, 1.52, z], [x + 0.05, 1.65, z], [x + 0.14, 1.67, z]], 0.016, M.dark);
}
const umbrellaTag = signMaterial(textTexture('傘', '', '#d8e2d6', '#425f5f', '#d8e2d6'));
plane(0.28, 0.25, 2.9, 0.56, 1.56, umbrellaTag);

// Sorted refuse bins.
for (let i = 0; i < 2; i++) {
  const x = -0.05 + i * 0.61;
  box(0.52, 0.78, 0.48, x, 0.64, 1.35, i ? M.teal : M.metal, world, true);
  box(0.56, 0.09, 0.51, x, 1.07, 1.35, M.dark, world);
  box(0.3, 0.12, 0.025, x, 0.91, 1.602, M.black, world);
  const binLabel = signMaterial(textTexture(i ? '缶・ビン' : '燃えるごみ', '', '#d9e1d5', '#4d625e', '#d9e1d5'));
  plane(0.37, 0.19, x, 0.58, 1.6, binLabel);
}

// Bicycle: thin cel-shaded tubes, torus tires, spokes, basket, and rear rack.
const bike = new THREE.Group();
bike.position.set(-5.05, 0.23, 1.52);
bike.rotation.y = -0.12;
world.add(bike);
const tireMat = toon('#101c24');
for (const x of [-0.72, 0.72]) {
  const tire = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.045, 8, 28), tireMat);
  tire.position.set(x, 0.5, 0);
  tire.castShadow = true;
  bike.add(tire);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.013, 6, 24), M.paleMetal);
  rim.position.copy(tire.position);
  bike.add(rim);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    tubeBetween([x, 0.5, 0], [x + Math.cos(a) * 0.39, 0.5 + Math.sin(a) * 0.39, 0], 0.006, M.metal, bike, 5);
  }
}
const frame = toon('#b16b5d');
const rear = [-0.72, 0.5, 0];
const crank = [-0.05, 0.47, 0];
const seat = [-0.28, 1.12, 0];
const head = [0.43, 1.08, 0];
const front = [0.72, 0.5, 0];
for (const [a, b] of [[rear, crank], [rear, seat], [seat, crank], [seat, head], [head, crank], [head, front]]) {
  tubeBetween(a, b, 0.027, frame, bike);
}
tubeBetween(seat, [-0.3, 1.32, 0], 0.022, M.paleMetal, bike);
box(0.35, 0.065, 0.17, -0.36, 1.34, 0, M.dark, bike);
tubeBetween(head, [0.38, 1.42, 0], 0.022, M.paleMetal, bike);
tubeBetween([0.21, 1.43, 0], [0.58, 1.43, 0], 0.022, M.paleMetal, bike);
box(0.42, 0.32, 0.34, 0.67, 1.25, 0, M.metal, bike, true);
for (let i = 0; i < 4; i++) box(0.025, 0.3, 0.35, 0.51 + i * 0.1, 1.25, 0, M.dark, bike);
tubeBetween([-0.94, 0.96, 0], [-0.45, 0.96, 0], 0.018, M.metal, bike);
cylinder(0.11, 0.11, 0.05, 16, -0.05, 0.47, 0.06, M.paleMetal, bike).rotation.x = Math.PI / 2;
tubeBetween([-0.05, 0.47, 0.08], [0.1, 0.31, 0.08], 0.018, M.dark, bike);
box(0.19, 0.045, 0.1, 0.13, 0.28, 0.08, M.dark, bike);

// ---------- Alley entrance, AC unit, noticeboard, and small urban traces ----------
// A narrow back wall gives the side alley a readable entrance without filling it.
box(1.65, 3.0, 0.18, 4.08, 1.74, -7.55, M.wallDark, world, true);
box(0.75, 2.25, 0.08, 4.0, 1.38, -7.43, M.dark, world, true);
box(0.07, 0.07, 0.1, 3.74, 1.36, -7.34, M.paleMetal);
box(1.65, 0.15, 1.1, 4.08, 3.28, -7.12, M.roof, world, true);
const alleyLamp = box(0.38, 0.16, 0.22, 4.08, 2.95, -7.31, M.warmLight, world);
const alleyPoint = new THREE.PointLight('#ffcf8c', 8, 4, 2);
alleyPoint.position.set(4.08, 2.75, -6.95);
world.add(alleyPoint);

// Outdoor AC mounted on the store's right wall.
box(0.62, 0.88, 1.25, 3.5, 1.35, -4.25, M.paleMetal, world, true);
const fan = cylinder(0.34, 0.34, 0.035, 24, 3.825, 1.4, -4.25, M.dark);
fan.rotation.z = Math.PI / 2;
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * Math.PI * 2;
  tubeBetween([3.85, 1.4, -4.25], [3.85, 1.4 + Math.sin(a) * 0.3, -4.25 + Math.cos(a) * 0.3], 0.009, M.metal);
}
wire([[3.36, 1.72, -4.72], [3.36, 2.05, -4.9], [3.18, 2.15, -5.0]], 0.027, M.paleMetal);
box(0.85, 0.12, 1.45, 3.52, 0.82, -4.25, M.metal);
// Exposed conduit, electric meter, vent, and a tiny address plate break up the side wall.
tubeBetween([3.23, 0.42, -5.25], [3.23, 4.62, -5.25], 0.028, M.paleMetal);
tubeBetween([3.23, 3.18, -5.25], [3.23, 3.18, -4.95], 0.028, M.paleMetal);
box(0.17, 0.48, 0.36, 3.27, 3.18, -4.86, M.metal, world, true);
box(0.08, 0.58, 0.82, 3.22, 3.7, -3.58, M.dark, world, true);
for (let i = 0; i < 6; i++) box(0.045, 0.035, 0.69, 3.27, 3.48 + i * 0.085, -3.58, M.paleMetal);
const addressMat = signMaterial(textTexture('夜桜 4-7', 'YORUZAKURA', '#d9dfd2', '#4f6663', '#879b8f'));
const address = plane(0.7, 0.32, 3.205, 3.02, -3.62, addressMat);
address.rotation.y = Math.PI / 2;

// Small community bulletin board facing the side street.
box(0.13, 1.48, 1.5, 4.68, 1.7, -2.35, M.wood, world, true);
const noticeTexture = canvasTexture(512, 512, (ctx, w, h) => {
  ctx.fillStyle = '#b7ab89'; ctx.fillRect(0, 0, w, h);
  const notes = [
    [35, 40, 190, 180, '#e7ddbd', '町内会', '夜間防犯'],
    [250, 30, 220, 145, '#c5ded4', '夜桜通り', 'お知らせ'],
    [55, 255, 170, 205, '#e4c3ad', '珈琲', '新発売'],
    [260, 215, 190, 235, '#ddd8c4', '雨に', 'ご注意を'],
  ];
  notes.forEach(([x, y, nw, nh, color, a, b]) => {
    ctx.fillStyle = color; ctx.fillRect(x, y, nw, nh);
    ctx.fillStyle = '#53615a'; ctx.textAlign = 'center';
    ctx.font = '700 35px "Yu Gothic", sans-serif'; ctx.fillText(a, x + nw / 2, y + 72);
    ctx.font = '24px "Yu Gothic", sans-serif'; ctx.fillText(b, x + nw / 2, y + 122);
  });
});
const notice = plane(1.32, 1.28, 4.755, 1.72, -2.35, signMaterial(noticeTexture));
notice.rotation.y = Math.PI / 2;
box(0.18, 0.12, 1.72, 4.66, 2.5, -2.35, M.roof);

// ---------- Power pole, sagging wires, street nameplate, and guardrails ----------
const pole = new THREE.Group();
pole.position.set(-7.25, 0.22, 0.15);
world.add(pole);
cylinder(0.14, 0.2, 7.15, 12, 0, 3.58, 0, toon('#53636a'), pole, true);
for (const y of [1.0, 2.6, 4.4, 6.0]) cylinder(0.205, 0.205, 0.09, 12, 0, y, 0, M.dark, pole);
box(2.3, 0.13, 0.15, 0, 6.45, 0, M.dark, pole, true);
box(1.55, 0.11, 0.13, 0, 5.87, 0, M.metal, pole);
for (const x of [-0.9, -0.35, 0.35, 0.9]) {
  cylinder(0.07, 0.09, 0.28, 8, x, 6.67, 0, M.paleMetal, pole);
  for (const y of [6.59, 6.67, 6.75]) cylinder(0.1, 0.1, 0.035, 8, x, y, 0, M.dark, pole);
}
box(0.52, 0.78, 0.4, 0.25, 4.65, 0, M.metal, pole, true);
wire([[-0.15, 5.2, 0], [-0.45, 4.4, 0.1], [-0.18, 3.6, 0.1]], 0.025, M.dark, pole);
// Second, shorter pole in the side alley anchors the overhead silhouettes.
cylinder(0.12, 0.17, 6.55, 12, 4.58, 3.48, -6.45, toon('#4d6169'), world, true);
box(1.45, 0.12, 0.14, 4.58, 6.34, -6.45, M.dark);
for (let i = 0; i < 3; i++) {
  const dz = (i - 1) * 0.18;
  wire([
    [-8.15 + i * 0.55, 6.99, 0.15 + dz],
    [-3.3 + i * 0.35, 5.55 - i * 0.09, -2.25 + dz],
    [4.05 + i * 0.52, 6.58, -6.45 + dz],
  ], 0.018, M.dark);
}
wire([[-7.25, 6.2, 0.15], [-3.5, 5.6, 0.5], [0.6, 5.9, 0.65]], 0.016, M.dark);

const streetName = signMaterial(textTexture('夜桜通り', 'YORUZAKURA ST.', '#315f67', '#e0e8d8', '#315f67'));
const streetPlate = plane(1.65, 0.58, -7.23, 3.8, 0.38, streetName);
streetPlate.rotation.y = 0.08;
box(1.78, 0.69, 0.07, -7.23, 3.8, 0.32, M.metal, world, true);
// Re-add face just ahead of its backing to avoid z-fighting.
streetPlate.position.z = 0.37;

function guardrail(x, z, length, rotation = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0.22, z);
  g.rotation.y = rotation;
  world.add(g);
  for (const px of [-length / 2, 0, length / 2]) {
    cylinder(0.045, 0.055, 0.86, 8, px, 0.43, 0, M.paleMetal, g);
    cylinder(0.075, 0.075, 0.05, 8, px, 0.88, 0, M.white, g);
  }
  tubeBetween([-length / 2, 0.72, 0], [length / 2, 0.72, 0], 0.045, M.paleMetal, g);
  tubeBetween([-length / 2, 0.4, 0], [length / 2, 0.4, 0], 0.032, M.paleMetal, g);
}
guardrail(5.32, -3.7, 3.1, Math.PI / 2);
guardrail(5.32, 0.15, 2.5, Math.PI / 2);
guardrail(6.82, 2.83, 2.65);

// Corner direction sign and convex traffic mirror.
cylinder(0.055, 0.07, 2.65, 10, 5.15, 1.55, 1.98, M.metal);
const directionMat = signMaterial(textTexture('← 駅前', 'STATION  200m', '#487780', '#e3eadc', '#487780'));
plane(1.18, 0.43, 5.15, 2.52, 2.04, directionMat);
const mirrorPole = cylinder(0.045, 0.055, 2.25, 10, -7.85, 1.35, 2.5, M.metal);
const mirror = cylinder(0.34, 0.34, 0.07, 24, -7.85, 2.55, 2.5, M.orange, world, true);
mirror.rotation.x = Math.PI / 2;
const mirrorFace = new THREE.Mesh(new THREE.CircleGeometry(0.27, 24), new THREE.MeshStandardMaterial({ color: '#a8c6cb', metalness: 0.75, roughness: 0.12 }));
mirrorFace.position.set(-7.85, 2.55, 2.545);
world.add(mirrorFace);

// ---------- Streetlamp and a distant, subtly cycling Japanese traffic signal ----------
const lamp = new THREE.Group();
lamp.position.set(6.0, 0.08, 2.42);
world.add(lamp);
cylinder(0.09, 0.15, 5.6, 12, 0, 2.8, 0, M.metal, lamp, true);
wire([[0, 5.5, 0], [-0.12, 5.88, 0], [-0.75, 5.96, 0], [-1.02, 5.7, 0]], 0.075, M.metal, lamp);
box(0.72, 0.18, 0.42, -1.02, 5.64, 0, M.dark, lamp, true);
box(0.57, 0.055, 0.33, -1.02, 5.52, 0, M.warmLight, lamp);
const streetSpot = new THREE.SpotLight('#ffd49a', 58, 12, 0.72, 0.7, 2);
streetSpot.position.set(4.98, 5.55, 2.42);
streetSpot.target.position.set(4.5, 0, 3.3);
world.add(streetSpot, streetSpot.target);

function haloTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,239,190,0.8)');
    g.addColorStop(0.18, 'rgba(255,210,140,0.3)');
    g.addColorStop(1, 'rgba(255,190,100,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}
const haloMat = new THREE.SpriteMaterial({ map: haloTexture(), transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false });
const halo = new THREE.Sprite(haloMat);
halo.position.set(4.98, 5.52, 2.42);
halo.scale.set(2.4, 2.4, 1);
world.add(halo);
const lampPoolMat = new THREE.MeshBasicMaterial({
  map: haloTexture(), transparent: true, opacity: 0.13,
  blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
});
const lampPool = plane(4.4, 4.4, 4.85, 0.09, 3.25, lampPoolMat);
lampPool.rotation.x = -Math.PI / 2;

const signal = new THREE.Group();
signal.position.set(7.25, 0.05, 5.65);
world.add(signal);
cylinder(0.075, 0.11, 3.6, 10, 0, 1.8, 0, M.metal, signal, true);
tubeBetween([0, 3.45, 0], [-1.25, 3.45, 0], 0.065, M.metal, signal);
box(1.25, 0.48, 0.34, -1.25, 3.25, 0, M.dark, signal, true);
const trafficMats = ['#d94e54', '#d6a74d', '#64bf91'].map((c) => new THREE.MeshStandardMaterial({
  color: '#24322f', emissive: c, emissiveIntensity: 0.05, roughness: 0.35,
}));
const trafficLights = [];
[-1.62, -1.25, -0.88].forEach((x, i) => {
  const hood = cylinder(0.18, 0.18, 0.19, 16, x, 3.27, 0.2, M.black, signal);
  hood.rotation.x = Math.PI / 2;
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), trafficMats[i]);
  bulb.position.set(x, 3.25, 0.307);
  signal.add(bulb);
  trafficLights.push(bulb);
});
box(0.52, 0.72, 0.3, 0, 2.3, 0, M.dark, signal, true);
const walkMat = new THREE.MeshStandardMaterial({ color: '#20342d', emissive: '#68c49a', emissiveIntensity: 0.7 });
const walkLight = plane(0.23, 0.23, 0, 2.4, 0.16, walkMat, signal);

// A small enamel plaque on the base reinforces the handcrafted collectible quality.
box(2.65, 0.34, 0.055, -4.8, -0.39, 9.005, M.metal, world, true);
const editionMat = signMaterial(textTexture('雨夜 · 01:47', 'MINIATURE  No. 711', '#243b49', '#b9c9c4', '#b47d5b'));
plane(2.43, 0.27, -4.8, -0.39, 9.038, editionMat);

// ---------- Rain on the storefront glass ----------
const glassStreaks = [];
const streakMat = new THREE.MeshBasicMaterial({ color: '#c5e6e8', transparent: true, opacity: 0.24, depthWrite: false });
for (let i = 0; i < 38; i++) {
  const h = 0.1 + rand() * 0.34;
  const streak = plane(0.009 + rand() * 0.009, h, -6.12 + rand() * 5.82, 0.55 + rand() * 3.35, 0.715, streakMat.clone(), store);
  streak.userData.speed = 0.08 + rand() * 0.24;
  streak.userData.top = 3.8 + rand() * 0.2;
  glassStreaks.push(streak);
}

// ---------- Animated rainfall and awning runoff ----------
const rainCount = 850;
const rainDrops = [];
const rainPositions = new Float32Array(rainCount * 6);
for (let i = 0; i < rainCount; i++) {
  rainDrops.push({
    x: -10 + rand() * 20, y: 0.15 + rand() * 12, z: -10 + rand() * 20,
    speed: 7 + rand() * 6, len: 0.18 + rand() * 0.34,
  });
}
const rainGeometry = new THREE.BufferGeometry();
rainGeometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
const rain = new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({
  color: '#a6c9db', transparent: true, opacity: 0.27, depthWrite: false,
}));
rain.frustumCulled = false;
scene.add(rain);

const dripCount = 52;
const dripData = [];
const dripPositions = new Float32Array(dripCount * 6);
for (let i = 0; i < dripCount; i++) {
  dripData.push({
    x: -6.45 + rand() * 9.65, y: 0.25 + rand() * 3.8, z: 1.84 + rand() * 0.035,
    speed: 3.8 + rand() * 3.2, delay: rand() * 4,
  });
}
const dripGeometry = new THREE.BufferGeometry();
dripGeometry.setAttribute('position', new THREE.BufferAttribute(dripPositions, 3));
const drips = new THREE.LineSegments(dripGeometry, new THREE.LineBasicMaterial({ color: '#c3e1e4', transparent: true, opacity: 0.43, depthWrite: false }));
world.add(drips);

// Expanding surface rings are deliberately sparse and slow.
const rippleCenters = [
  [-1.5, 6.6], [0.4, 6.8], [-2.4, 6.45], [3.7, 4.0],
  [6.45, -0.2], [6.35, -2.0], [-6.35, 3.65], [0.5, 2.95],
];
const ripples = [];
for (let i = 0; i < 28; i++) {
  const material = new THREE.MeshBasicMaterial({ color: '#a9d3da', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.87, 1, 28), material);
  const center = pick(rippleCenters);
  ring.position.set(center[0] + (rand() - 0.5) * 0.55, 0.096, center[1] + (rand() - 0.5) * 0.35);
  ring.rotation.x = -Math.PI / 2;
  ring.userData.offset = rand();
  ring.userData.speed = 0.32 + rand() * 0.32;
  world.add(ring);
  ripples.push(ring);
}

// ---------- Animation loop ----------
const clock = new THREE.Clock();
const smooth = (v) => v * v * (3 - 2 * v);

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const t = clock.elapsedTime;

  for (let i = 0; i < rainCount; i++) {
    const d = rainDrops[i];
    d.y -= d.speed * delta;
    d.x -= delta * 0.55;
    if (d.y < 0.08) {
      d.y = 9 + rand() * 4;
      d.x = -9.5 + rand() * 19;
      d.z = -9.5 + rand() * 19;
    }
    const j = i * 6;
    rainPositions[j] = d.x;
    rainPositions[j + 1] = d.y;
    rainPositions[j + 2] = d.z;
    rainPositions[j + 3] = d.x + 0.025;
    rainPositions[j + 4] = d.y + d.len;
    rainPositions[j + 5] = d.z;
  }
  rainGeometry.attributes.position.needsUpdate = true;

  for (let i = 0; i < dripCount; i++) {
    const d = dripData[i];
    d.y -= d.speed * delta;
    if (d.y < 0.22) d.y = 4.02 + rand() * 0.35;
    const j = i * 6;
    dripPositions[j] = d.x;
    dripPositions[j + 1] = d.y;
    dripPositions[j + 2] = d.z;
    dripPositions[j + 3] = d.x + 0.008;
    dripPositions[j + 4] = d.y + 0.12;
    dripPositions[j + 5] = d.z;
  }
  dripGeometry.attributes.position.needsUpdate = true;

  ripples.forEach((ring) => {
    const phase = (t * ring.userData.speed + ring.userData.offset) % 1;
    const scale = 0.025 + phase * 0.25;
    ring.scale.set(scale, scale, scale);
    ring.material.opacity = Math.sin(phase * Math.PI) * 0.19;
  });

  glassStreaks.forEach((streak) => {
    streak.position.y -= streak.userData.speed * delta;
    if (streak.position.y < 0.52) {
      streak.position.y = streak.userData.top;
      streak.position.x = -6.12 + rand() * 5.82;
    }
    streak.material.opacity = 0.12 + Math.sin(t * 0.7 + streak.position.x * 3) * 0.055;
  });

  // One unhurried open / dwell / close cycle every twelve seconds.
  const doorPhase = t % 12;
  let doorOpen = 0;
  if (doorPhase > 6 && doorPhase < 7) doorOpen = smooth(doorPhase - 6);
  else if (doorPhase >= 7 && doorPhase < 9) doorOpen = 1;
  else if (doorPhase >= 9 && doorPhase < 10) doorOpen = 1 - smooth(doorPhase - 9);
  leftDoor.position.x = 0.535 - doorOpen * 0.58;
  rightDoor.position.x = 1.885 + doorOpen * 0.58;

  // Barely perceptible fluorescent flutter rather than a distracting neon strobe.
  const flutter = Math.sin(t * 19.0) * 0.018 + Math.sin(t * 3.1) * 0.025;
  const dip = Math.sin(t * 0.63) > 0.996 ? 0.18 : 0;
  mainSignMat.emissiveIntensity = 0.82 + flutter - dip;
  signLight.intensity = 8 + flutter * 8 - dip * 6;
  haloMat.opacity = 0.4 + Math.sin(t * 1.3) * 0.025;
  reflectionMaterials.forEach((material, i) => {
    material.opacity = (i === 0 ? 0.23 : i === 1 ? 0.34 : 0.21) * (0.92 + Math.sin(t * 1.6 + i * 2) * 0.08);
  });

  const signalPhase = t % 14;
  const green = signalPhase < 8;
  trafficMats[0].emissiveIntensity = green ? 0.03 : 1.25;
  trafficMats[2].emissiveIntensity = green ? 0.95 : 0.03;
  trafficMats[0].color.set(green ? '#24322f' : '#7f3c42');
  trafficMats[2].color.set(green ? '#39705b' : '#24322f');
  walkMat.emissiveIntensity = green ? 0.75 : 0.04;

  controls.update();
  renderer.render(scene, camera);
}

function resize() {
  const aspect = window.innerWidth / window.innerHeight;
  const verticalSize = aspect < 1 ? 20.5 / aspect : 20.5;
  camera.left = (-verticalSize * aspect) / 2;
  camera.right = (verticalSize * aspect) / 2;
  camera.top = verticalSize / 2;
  camera.bottom = -verticalSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', resize);
resize();
animate();
