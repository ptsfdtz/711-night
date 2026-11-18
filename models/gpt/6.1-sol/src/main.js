import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from './WetReflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Every prop, sign, label and rain effect is built locally, without remote assets.
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x152036, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
renderer.info.autoReset = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .95;
const scene = new THREE.Scene();
const world = new THREE.Group();
scene.add(world);
const aspect = innerWidth / innerHeight;
const view = 10.8;
const camera = new THREE.OrthographicCamera(-view * aspect, view * aspect, view, -view, 0.1, 100);
camera.position.set(15, 12, 18);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.8, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.rotateSpeed = 0.65;
controls.zoomSpeed = 0.8;
controls.minZoom = 0.65;
controls.maxZoom = 3.5;
controls.minPolarAngle = 0.16;
controls.maxPolarAngle = Math.PI * 0.485;
controls.screenSpacePanning = true;
controls.update();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.19, 0.32, 1.20);
composer.addPass(bloom);
composer.addPass(new OutputPass());

let seed = 711;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const gradient = new THREE.DataTexture(new Uint8Array([75, 135, 205, 255]), 4, 1, THREE.RedFormat);
gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
gradient.needsUpdate = true;
const palette = {
  ink: 0x162335, base: 0x263248, road: 0x263749, concrete: 0x748292,
  plaster: 0xc2c7ba, cream: 0xf4ecd1, metal: 0x46576b, silver: 0x8796a0,
  teal: 0x48afa1, green: 0x268e75, warm: 0xffe4a2, orange: 0xdd8655,
  red: 0xb95254, blue: 0x658ab8, dark: 0x24384a, white: 0xe4e6da,
};
const matCache = new Map();
function toon(color, opts = {}) {
  if (typeof color === 'string' && palette[color]) color = palette[color];
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshToonMaterial({ color, gradientMap: gradient, ...opts }));
  return matCache.get(key);
}
function basic(color, opacity = 1) { return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity === 1 }); }
const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x111e2e, transparent: true, opacity: 0.6 });
const outlineParts = [];
const staticMeshes = [];
function mesh(geo, material, x = 0, y = 0, z = 0, parent = world, outline = false) {
  const o = new THREE.Mesh(geo, typeof material === 'string' || typeof material === 'number' ? toon(material) : material);
  o.position.set(x, y, z);
  o.castShadow = !o.material.transparent;
  o.receiveShadow = true;
  parent.add(o);
  if (!o.material.transparent) staticMeshes.push(o);
  if (outline) {
    const edges = new THREE.EdgesGeometry(geo, 30);
    const line = new THREE.LineSegments(edges, outlineMaterial);
    o.add(line);
    outlineParts.push({ mesh: o, geometry: edges, line });
  }
  return o;
}
const boxGeoCache = new Map();
function box(w, h, d, x, y, z, material, outline = true, parent = world) {
  const key = `${w},${h},${d}`;
  if (!boxGeoCache.has(key)) boxGeoCache.set(key, new THREE.BoxGeometry(w, h, d));
  return mesh(boxGeoCache.get(key), material, x, y, z, parent, outline);
}
function rounded(w, h, d, r, x, y, z, material, parent = world) { return mesh(new RoundedBoxGeometry(w, h, d, 2, r), material, x, y, z, parent); }
function cylinder(r1, r2, h, x, y, z, material, sides = 12, parent = world) { return mesh(new THREE.CylinderGeometry(r1, r2, h, sides), material, x, y, z, parent); }
function sphere(r, x, y, z, material, parent = world) { return mesh(new THREE.SphereGeometry(r, 12, 8), material, x, y, z, parent); }
function rod(a, b, radius, material, parent = world) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
  const result = cylinder(radius, radius, start.distanceTo(end), 0, 0, 0, material, 8, parent);
  result.position.copy(start).add(end).multiplyScalar(0.5);
  result.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return result;
}
function tube(points, r, material, parent = world, divisions = 36) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), divisions, r, 6, false), material, 0, 0, 0, parent);
}
function torus(r, thickness, x, y, z, material, parent = world) { return mesh(new THREE.TorusGeometry(r, thickness, 8, 32), material, x, y, z, parent); }
function glowMaterial(color, intensity = 1.4) { return toon(color, { emissive: color, emissiveIntensity: intensity }); }
const glowWarm = glowMaterial(0xffdf94, 1.4);
const glowCool = glowMaterial(0x97d6e7, 1.2);
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xc4e6df, transparent: true, opacity: 0.13, roughness: 0.13, metalness: 0.15, side: THREE.DoubleSide, depthWrite: false });
const spillMaterials = [];
function lightSpill(w, d, x, z, color, strength = .18, striped = true) {
  const material = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, tint: { value: new THREE.Color(color) }, strength: { value: strength }, striped: { value: striped ? 1 : 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `
      uniform float time; uniform vec3 tint; uniform float strength; uniform float striped; varying vec2 vUv;
      void main(){
        vec2 uv=vUv;
        float spread=pow(max(0.0,1.0-abs(uv.x*2.0-1.0)),0.7);
        float fade=pow(uv.y,1.3)*smoothstep(0.0,0.13,uv.y)*smoothstep(1.0,0.88,uv.y);
        float rain=0.48+0.52*pow(0.5+0.5*sin(uv.y*157.0+sin(uv.x*23.0+time)*2.0-time*1.6),2.0);
        float panes=0.25+0.75*pow(0.5+0.5*cos(uv.x*29.0+sin(uv.y*31.0)*0.4),1.3);
        float alpha=mix(pow(max(0.0,1.0-length((uv-.5)*2.0)),2.0),fade*spread*rain*panes,striped)*strength;
        gl_FragColor=vec4(tint,alpha);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const p=mesh(new THREE.PlaneGeometry(w,d),material,x,.109,z);
  p.rotation.x=-Math.PI/2; spillMaterials.push(material); return p;
}

function texture(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d'); paint(ctx, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}
scene.background = texture(512, 512, (c, w, h) => {
  const g = c.createRadialGradient(w*.48, h*.44, 0, w*.48, h*.44, w*.65);
  g.addColorStop(0, '#293d54'); g.addColorStop(.60, '#1d2c41'); g.addColorStop(1, '#121c2d');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
});
function label(text, sub = '', bg = '#f6edce', fg = '#245955', w = 1024, h = 256) {
  return texture(w, h, (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `700 ${sub ? h * .47 : h * .60}px "Yu Gothic", "Meiryo", sans-serif`;
    c.fillStyle = fg; c.fillText(text, w / 2, h * (sub ? .40 : .51), w * .94);
    if (sub) { c.font = `500 ${h * .16}px "Yu Gothic", sans-serif`; c.fillText(sub, w / 2, h * .82, w * .92); }
  });
}
function panel(map, w, h, x, y, z, { parent = world, rotateY = 0, emissive = 0, opacity = 1 } = {}) {
  const m = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, transparent: opacity < 1, opacity, toneMapped: emissive === 0 });
  const p = mesh(new THREE.PlaneGeometry(w, h), m, x, y, z, parent);
  p.rotation.y = rotateY; return p;
}
function light(color, strength, distance, x, y, z) {
  const l = new THREE.PointLight(color, strength, distance, 1.7); l.position.set(x, y, z); scene.add(l); return l;
}

// Cool, soft moonlight keeps the miniature readable without flattening its night palette.
scene.add(new THREE.HemisphereLight(0xa2bedf, 0x253648, 1.05));
const moon = new THREE.DirectionalLight(0xb6d0ff, 1.25);
moon.position.set(-7, 14, 5); moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
Object.assign(moon.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
moon.shadow.normalBias = 0.04; moon.shadow.bias = -0.0002;
moon.shadow.radius = 3; scene.add(moon);
const rim = new THREE.DirectionalLight(0x739af0, 0.65); rim.position.set(9, 7, -10); scene.add(rim);

// A single, solid square plinth, its cut edge visible on all four sides.
rounded(13.8, .52, 13.8, .10, 0, -.23, 0, 'base');
box(13.65, .035, 13.65, 0, .049, 0, 'road');
box(13.70, .035, 13.70, 0, -.39, 0, 0x152132, false);
for (let x = -6.3; x < 6.7; x += .75) box(.43, .022, .015, x, -.225, 6.905, 0x4a5970, false);
for (let z = -6.3; z < 6.7; z += .75) box(.015, .022, .43, 6.905, -.225, z, 0x4a5970, false);

// Real planar reflection: warm windows and street lights shimmer across wet asphalt.
const reflector = new Reflector(new THREE.PlaneGeometry(13.62, 13.62), { color: 0x9cabb7, textureWidth: 768, textureHeight: 768, multisample: 0, clipBias: .003 });
reflector.rotation.x = -Math.PI / 2; reflector.position.y = .076; world.add(reflector);
let reflectionDirty = true;
let lastReflectionTime = -1;
const updateReflection = reflector.onBeforeRender;
reflector.onBeforeRender = function(...args) {
  const now=performance.now();
  if(reflectionDirty || now-lastReflectionTime>120){
    updateReflection.apply(this,args); reflectionDirty=false; lastReflectionTime=now;
  }
};
controls.addEventListener('change',()=>{reflectionDirty=true;});
reflector.material.uniforms.time = { value: 0 };
reflector.material.fragmentShader = reflector.material.fragmentShader
  .replace('uniform vec3 color;', 'uniform vec3 color;\nuniform float time;')
  .replace('vec4 base = texture2DProj( tDiffuse, vUv );', `
    vec4 uv = vUv;
    uv.x += sin(uv.y * 160.0 + time * 2.2) * 0.00045 * uv.w;
    uv.y += sin(uv.x * 180.0 - time * 1.7) * 0.00035 * uv.w;
    vec4 base = texture2DProj(tDiffuse, uv);
  `)
  .replace('vec4( blendOverlay( base.rgb, color ), 1.0 )', 'vec4(mix(vec3(0.026, 0.043, 0.070), blendOverlay(base.rgb, color), 0.52), 1.0)');

// The pavement follows an L-shaped corner. Its individual tiles are geometry.
box(9.7, .22, 8.9, -1.43, .18, -1.97, 'concrete');
box(9.8, .07, .15, -1.43, .24, 2.56, 0xb5beb7);
box(.15, .07, 8.9, 3.5, .24, -1.97, 0xb5beb7);
for (let x = -6.2; x < 3.4; x += .52) {
  for (let z = 1.96; z < 2.54; z += .29) box(.5, .009, .27, x, .296, z, (Math.floor(x * 3) % 3 ? 0x7e8d96 : 0x909b9f), false);
}
for (let z = -6.1; z < 2.2; z += .5) box(.52, .012, .46, 3.17, .297, z, 0x8c989c, false);
// The tactile strip turns into the shop, with molded raised dots.
box(7.0, .018, .30, -1.05, .31, 2.22, 0xc6ae64);
box(.30, .018, .45, .42, .31, 1.90, 0xc6ae64);
for (let x = -4.45; x < 2.4; x += .14) for (let z = 2.13; z < 2.36; z += .10) cylinder(.018, .018, .014, x, .33, z, 0xddc57b, 6);
// Reflective zebra stripes, parking bay and understated road markings.
const roadPaint = new THREE.MeshStandardMaterial({ color: 0xd3dacd, roughness: .25, metalness: .18 });
for (let x = -5.35; x < -.7; x += .77) box(.43, .012, 2.02, x, .088, 5.34, roadPaint, false);
box(.065, .012, 2.63, 2.28, .088, 4.69, roadPaint, false);
box(.065, .012, 2.63, -.13, .088, 4.69, roadPaint, false);
box(2.42, .012, .065, 1.08, .089, 5.97, roadPaint, false);
const park = panel(label('P', '', '#c9d3cb', '#53637a', 128, 128), .44, .44, 1.07, .095, 4.68);
park.rotation.x = -Math.PI / 2;
for (let z = -5.75; z < 4.0; z += 1.55) box(.07, .013, .70, 5.46, .09, z, 0xe1d7b0, false);
box(2.9, .012, .09, 5.1, .09, 4.08, roadPaint, false);

function drain(x, z, rotation = 0) {
  const g = new THREE.Group(); g.position.set(x, .095, z); g.rotation.y = rotation; world.add(g);
  box(.76, .045, .27, 0, 0, 0, 0x182735, true, g);
  for (let i = 0; i < 10; i++) box(.035, .02, .24, -.34 + i * .075, .03, 0, 'silver', false, g);
}
drain(-5.7, 2.83); drain(1.7, 2.83); drain(3.78, -1.9, Math.PI / 2);
const manhole = cylinder(.48, .48, .012, 5.06, .094, 1.53, 0x3c4b5c, 32);
torus(.43, .014, 5.06, .104, 1.53, 0x687884).rotation.x = -Math.PI / 2;
for (let i = -3; i <= 3; i++) box(.72 - Math.abs(i) * .08, .006, .022, 5.06, .106, 1.53 + i * .10, 0x6c7d85, false);

// Tiny organic puddles and scattered specular glints, inset into the square base.
const puddleMat = new THREE.MeshPhysicalMaterial({ color: 0x7294af, roughness: .05, metalness: .6, transparent: true, opacity: .14, depthWrite: false });
const puddles = [];
for (let i = 0; i < 34; i++) {
  let x = random() * 12.6 - 6.3, z = random() * 12.6 - 6.3;
  if (x < 3.64 && z < 2.70) { if (i % 2) z = 3 + random() * 3.4; else x = 4 + random() * 2.35; }
  const p = mesh(new THREE.CircleGeometry(.25 + random() * .56, 28), puddleMat, x, .095, z);
  p.rotation.x = -Math.PI / 2; p.scale.y = .4 + random() * .55;
  puddles.push([x, z]);
}

// Convenience store shell; two full-height glass elevations make the interior legible.
const floorY = .36;
box(7.68, .13, 4.95, -.84, .37, -.67, 0xdad1ba);
box(7.63, 2.95, .16, -.84, 1.9, -3.13, 'plaster');
box(.16, 2.95, 4.95, -4.67, 1.9, -.67, 'plaster');
box(7.69, .29, 4.98, -.84, 3.51, -.67, 0x737f85);
box(7.90, .09, 5.14, -.84, 3.70, -.67, 0x939e9e);
box(7.67, .08, 4.94, -.84, 3.73, -.67, 0x707f85);
// Parapet coping and roof seam grid.
box(7.95, .15, .10, -.84, 3.79, -3.23, 0xb1b9b0);
box(.10, .15, 5.14, -4.79, 3.79, -.67, 0xb1b9b0);
box(.10, .15, 5.14, 3.11, 3.79, -.67, 0xb1b9b0);
for (let x = -4.4; x < 3; x += 1.12) box(.015, .008, 4.85, x, 3.778, -.67, 0x5c6b77, false);
for (let z = -2.9; z < 1.65; z += 1.12) box(7.5, .008, .015, -.84, 3.779, z, 0x5c6b77, false);
box(1.46, .25, 1.07, -2.5, 3.92, -1.92, 0x869294);
for (let i = 0; i < 2; i++) {
  cylinder(.34, .34, .08, -2.86 + i * .73, 4.09, -1.92, 'dark', 32);
  torus(.29, .02, -2.86 + i * .73, 4.145, -1.92, 'silver').rotation.x = -Math.PI / 2;
  for (let k = 0; k < 6; k++) { const fan = box(.50, .012, .026, -2.86 + i * .73, 4.145, -1.92, 'silver', false); fan.rotation.y = k * Math.PI / 6; }
}
box(.70, .45, .72, 1.60, 3.99, -1.86, 0x626e7a);
cylinder(.18, .18, .30, 1.60, 4.36, -1.86, 'silver');
// Sloped awning, striped lightbox band and wrap-around fascia.
box(7.9, .21, .66, -.84, 3.25, 1.94, 0x315d66);
box(7.91, .10, .05, -.84, 3.25, 2.285, 'teal');
const signMat = glowMaterial(0xffeecb, 1.05);
box(7.91, .64, .17, -.84, 3.03, 2.34, signMat);
box(7.94, .09, .19, -.84, 3.33, 2.34, 0x248f79);
box(7.94, .10, .19, -.84, 2.72, 2.34, 0x4ba897);
box(7.94, .035, .195, -.84, 2.815, 2.34, 0xd99955);
const signTexture = texture(1536, 192, (c, w, h) => {
  c.fillStyle = '#ffeed1'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#267d6b'; c.beginPath(); c.arc(145, 96, 64, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffe6a5'; c.beginPath(); c.arc(153, 90, 32, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#267d6b'; c.beginPath(); c.arc(171, 78, 32, 0, Math.PI * 2); c.fill();
  c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#267967';
  c.font = 'bold 99px "Yu Gothic", "Meiryo", sans-serif'; c.fillText('こもれび', 262, 82);
  c.font = '500 24px sans-serif'; c.fillText('K O M O R E B I   M A R T', 277, 159);
  c.textAlign = 'center'; c.font = 'bold 68px sans-serif'; c.fillText('24', 1320, 82);
  c.font = 'bold 24px "Yu Gothic", sans-serif'; c.fillText('時間営業', 1320, 153);
});
panel(signTexture, 7.55, .52, -.84, 3.03, 2.436, { emissive: 1 });
box(.16, .64, 4.77, 3.035, 3.03, -.32, signMat);
box(.18, .08, 4.81, 3.04, 3.33, -.32, 'green');
box(.18, .10, 4.81, 3.04, 2.72, -.32, 'teal');
box(.185, .032, 4.82, 3.044, 2.81, -.32, 0xd99955);
panel(signTexture, 4.23, .51, 3.128, 3.03, -.30, { rotateY: Math.PI / 2, emissive: 1 });
// Aluminum mullions, windows, lower sill and a separately animated pair of doors.
box(7.60, .31, .13, -.84, .60, 1.84, 0x5b777c);
box(7.61, .07, .19, -.84, .80, 1.85, 'silver');
const frontFrames = [-4.55, -3.16, -1.68, -.50, 1.27, 2.92];
for (const x of frontFrames) box(.07, 1.90, .12, x, 1.74, 1.84, 'silver');
for (const [a,b] of [[-4.55,-3.16],[-3.16,-1.68],[-1.68,-.50],[1.27,2.92]]) {
  box(b-a-.07, 1.89, .015, (a+b)/2, 1.74, 1.835, glassMat, false);
  box(b-a-.05, .018, .025, (a+b)/2, 1.15, 1.88, 0xa4b4b3, false);
}
box(.13, .38, 4.98, 3.00, .59, -.67, 0x627a80);
for (let z = -3.10; z < 1.9; z += 1.24) box(.11, 1.91, .07, 3.00, 1.75, z, 'silver');
for (let z = -2.48; z < 1.9; z += 1.24) box(.016, 1.87, 1.17, 3.002, 1.74, z, glassMat, false);
box(.13, .07, 4.98, 3.00, .81, -.67, 'silver');
box(.10, .025, 4.90, 3.055, 1.15, -.67, 0x8fa4a4, false);
box(1.83, .11, .22, .39, 2.58, 1.88, 'metal');
box(1.8, .045, .30, .39, .43, 1.87, 'silver');
const doors = [];
for (let i = 0; i < 2; i++) {
  const g = new THREE.Group(); g.position.set(-.055 + i*.87, 0, 1.875); world.add(g);
  box(.83, 2.08, .025, 0, 1.50, 0, glassMat, false, g);
  for (const x of [-.43,.43]) box(.04, 2.09, .06, x, 1.50, .015, 'silver', false, g);
  for (const y of [.47, 1.37, 2.52]) box(.85, .045, .07, 0, y, .015, 'silver', false, g);
  box(.85, .065, .012, 0, 1.40, .054, 0x4bad91, false, g);
  panel(label('自動', '', '#eff1dd', '#2d7f72', 128, 64), .22, .105, 0, 1.69, .057, { parent:g });
  doors.push({ group:g, home:g.position.x, direction: i === 0 ? -1 : 1 });
}
box(.18, .075, .06, .39, 2.64, 2.014, 'ink'); sphere(.028, .39, 2.637, 2.053, glowCool);
box(1.79, .026, .57, .39, .32, 2.28, 0x344950);
for (let i=0;i<16;i++) box(.025,.008,.50,-.40+i*.104,.339,2.28,0x526762,false);
panel(label('いらっしゃいませ', '', '#294f50', '#d7ddbb', 768, 120), 1.45,.14,.39,.344,2.28).rotation.x = -Math.PI/2;

// Bright, complete interior: tile floor, fully stocked gondolas and back-wall chillers.
for (let x=-4.48;x<2.9;x+=.46) for (let z=-2.93;z<1.72;z+=.46) {
  box(.447,.008,.447,x,.446,z,(Math.round((x+z)/.46)%2 ? 0xe3d9bb : 0xd7ccb0),false);
}
for (let x=-3.8;x<2.5;x+=2.05) {
  box(1.28,.045,.22,x,3.337,-.25,glowWarm);
  box(1.28,.045,.22,x,3.337,-2.05,glowWarm);
}
light(0xffd487, 8, 7, -.8, 2.3, .1);
light(0xffe1a1, 6, 6, -2.3, 2.4, -2.0);
light(0xffcf83, 5, 5, 2.1, 2.3, -.8);
light(0x5ed8bc, 3, 5, -.8, 2.98, 2.8);
lightSpill(7.9, 3.48, -.82, 4.37, 0xf1b765, .29);
lightSpill(7.7, 1.22, -.82, 3.27, 0x69c9b3, .17);
const sideSpill=lightSpill(4.9, 2.6, 4.54, -.6, 0xe9c287, .20);
sideSpill.rotation.z=-Math.PI/2;
// Back-room door, lockers and a clock establish an actual shop plan.
box(.89, 2.10, .055, -4.07, 1.51, -3.02, 0x8fa69e);
box(.78, .11, .07, -4.07, 2.50, -2.98, 'metal');
panel(label('STAFF ONLY', '', '#81988d', '#f4ebd0', 256, 64), .60,.13,-4.07,2.24,-2.98);
sphere(.025,-3.80,1.49,-2.97,'silver');
box(.48,1.2,.39,-4.30,1.06,-2.62,0xaab9a8);
for(let i=0;i<3;i++) { box(.43,.025,.02,-4.30,.65+i*.39,-2.414,'silver',false); box(.045,.02,.018,-4.13,.81+i*.39,-2.406,'metal',false); }
const clockFace = texture(256,256,(c,w,h)=>{
  c.fillStyle='#f6e8c8';c.beginPath();c.arc(128,128,120,0,Math.PI*2);c.fill();
  c.strokeStyle='#547066';c.lineWidth=8;c.stroke();
  for(let i=0;i<12;i++){let a=i*Math.PI/6;c.beginPath();c.moveTo(128+97*Math.sin(a),128-97*Math.cos(a));c.lineTo(128+106*Math.sin(a),128-106*Math.cos(a));c.lineWidth=5;c.stroke();}
  c.lineWidth=7;c.beginPath();c.moveTo(128,128);c.lineTo(93,90);c.moveTo(128,128);c.lineTo(128,43);c.stroke();
});
panel(clockFace,.39,.39,-3.29,2.91,-3.023);
const productColors=[0xe8b567,0xa8c595,0xc6dbcb,0xc77067,0x8eabc5,0xe1d5a8,0xc198b4];
function bottle(x,y,z,col,parent=world,small=false) {
  const s=small?.72:1;
  cylinder(.045*s,.047*s,.16*s,x,y+.08*s,z,col,8,parent);
  cylinder(.023*s,.037*s,.038*s,x,y+.177*s,z,col,8,parent);
  cylinder(.025*s,.025*s,.025*s,x,y+.208*s,z,0xebe2c8,8,parent);
  box(.073*s,.06*s,.012*s,x,y+.09*s,z+.045*s,0xf0e8d1,false,parent);
}
for(let i=0;i<4;i++){
  const x=-2.91+i*1.12;
  box(1.08,2.11,.46,x,1.53,-2.77,0x7f9e9a);
  box(.96,1.75,.05,x,1.62,-2.496,glowMaterial(0xc4e1c7,.47));
  for(let j=0;j<4;j++){
    const y=.76+j*.40;
    box(.96,.045,.38,x,y,-2.67,'cream');
    for(let k=0;k<8;k++) bottle(x-.41+k*.117,y+.026,-2.55,productColors[(k+j+i)%7]);
  }
  box(.98,1.79,.012,x,1.62,-2.44,glassMat,false);
  for(const xx of [x-.49,x+.49]) box(.027,1.85,.034,xx,1.62,-2.42,0xc0d0bd,false);
  box(.025,.41,.024,x+.34,1.62,-2.397,'silver',false);
  panel(label(i<2?'冷たい飲みもの':'お弁当・お惣菜','', '#eff2d7','#487764',384,64),.96,.16,x,2.51,-2.413);
}
function shelf(cx,cz,w=1.74,d=.59){
  box(w,.13,d,cx,.54,cz,0x81928c);
  box(w,.91,.04,cx,1.05,cz,0xb6b8a3);
  for(const x of [cx-w/2,cx+w/2]) box(.035,1.16,d,x,1.10,cz,'silver',false);
  for(let row=0;row<3;row++){
    const y=.66+row*.34;
    box(w,.035,d,cx,y,cz,'cream');
    for(const side of [-1,1]){
      box(w,.045,.016,cx,y+.025,cz+side*d/2,0xd9b369,false);
      for(let k=0;k<11;k++){
        const x=cx-w*.45+k*w*.09, z=cz+side*.20;
        if(row===0){
          box(.116,.035,.13,x,y+.045,z,0x454b43,false);
          box(.099,.028,.11,x,y+.075,z,0xd5c196,false);
          if(k%3===0) box(.034,.008,.075,x,y+.094,z,0x729175,false);
        }else{
          const pack=box(.108,.17+random()*.055,.057,x,y+.12,z,productColors[(k+row)%7],false);
          pack.rotation.z=(random()-.5)*.12;
          box(.055,.042,.007,x,y+.132,z+side*.033,0xf0e5c9,false);
        }
      }
      for(let k=0;k<7;k++) box(.06,.025,.004,cx-w*.43+k*w*.14,y+.025,cz+side*(d/2+.011),0xf4eed7,false);
    }
  }
  box(w,.13,.12,cx,1.72,cz,'green');
  panel(label('おにぎり  ·  お菓子','', '#318575','#f8edc5',512,64),w-.12,.10,cx,1.72,cz+.067);
}
shelf(-2.86,-.91,1.74,.61); shelf(-.60,-.91,1.74,.61);
shelf(-2.90,.36,1.74,.57); shelf(-.60,.31,1.74,.57);
// Onigiri display beside the right-hand glazing.
box(.55,.64,1.59,2.41,.83,-.35,0x92aea1);
for(let row=0;row<2;row++){
  box(.60,.035,1.62,2.41,.75+row*.31,-.35,'cream');
  for(let i=0;i<7;i++){
    const rice=cylinder(.075,.075,.10,2.41,.85+row*.31,-1.0+i*.22,0xeee9d7,3);
    rice.rotation.z=Math.PI/2;
    box(.055,.07,.071,2.446,.84+row*.31,-1.0+i*.22,0x405749,false);
  }
}
panel(label('おにぎり','', '#e9d9af','#527060',256,64),1.39,.15,2.713,1.24,-.35,{rotateY:Math.PI/2});
// Front register, coffee machine, warm oden and a magazine rack.
box(1.83,.81,.66,-3.37,.88,1.24,0xb3ac8c);
box(1.95,.09,.77,-3.37,1.33,1.24,0xe8dfbe);
box(1.70,.09,.025,-3.37,.67,1.58,'teal',false);
panel(label('レジ  /  お会計','', '#e8ddbb','#4a766a',512,80),1.18,.14,-3.37,1.08,1.586);
box(.36,.15,.29,-3.16,1.45,1.20,'metal');
const register=box(.34,.24,.05,-3.16,1.66,1.30,0x263b3d);register.rotation.x=-.16;
panel(label('¥ 0','', '#456b5e','#cfe9ba',256,128),.27,.17,-3.16,1.665,1.332);
box(.13,.17,.14,-2.79,1.47,1.19,'silver');
box(.43,.68,.39,-4.03,1.69,1.23,'metal');
box(.33,.21,.04,-4.03,1.82,1.444,'ink');
panel(label('COFFEE','', '#263e41','#e3d2a6',256,64),.29,.09,-4.03,1.89,1.47);
box(.34,.12,.08,-4.03,1.44,1.456,'ink');
for(const x of [-4.13,-3.92]) cylinder(.042,.028,.08,x,1.46,1.47,'cream');
box(.49,.10,.40,-3.57,1.45,1.26,'silver');
box(.43,.065,.34,-3.57,1.53,1.26,0x9c774a);
for(let i=0;i<9;i++) sphere(.036,-3.71+(i%3)*.13,1.58,1.14+Math.floor(i/3)*.10,0xe5c38b);
box(.54,.24,.40,-3.57,1.64,1.26,glassMat,false);
panel(label('おでん','', '#eecb82','#976f3f',256,80),.42,.12,-3.57,1.69,1.47);
box(.74,.83,.40,1.83,.87,1.21,'silver');
for(let row=0;row<3;row++){
  box(.78,.055,.29,1.83,.67+row*.27,1.38,'cream');
  for(let k=0;k<4;k++){
    const p=box(.145,.23,.014,1.53+k*.20,.82+row*.27,1.40,productColors[(k+row+2)%7],false);p.rotation.x=-.2;
    panel(label(['暮らし','旅','夜','珈琲'][k],'', '#eddec8','#496b77',128,160),.11,.13,1.53+k*.20,.84+row*.27,1.422);
  }
}
// Ice cream freezer and point-of-sale ceiling signs.
box(.79,.60,.64,1.55,.78,-1.82,0xb9cebf);
box(.82,.05,.67,1.55,1.10,-1.82,'cream');
box(.72,.02,.57,1.55,1.134,-1.82,glassMat,false);
panel(label('ICE CREAM','', '#4f8f89','#efedc9',256,80),.67,.17,1.55,.90,-1.49);
for(const [x,text] of [[-2.75,'お弁当'],[-.5,'お菓子'],[1.70,'ドリンク']]){
  rod([x,3.35,-1.48],[x,2.94,-1.48],.009,'silver');
  box(.81,.27,.034,x,2.80,-1.48,glowWarm);
  panel(label(text,'', '#f9e4b2','#548775',384,100),.75,.22,x,2.80,-1.456);
}
for(const x of [.4, .75]) {
  const arrow=panel(label('↑','', '#d3c9ab','#779688',128,128),.18,.24,x,.455,1.22);arrow.rotation.x=-Math.PI/2;
}

// Illustrated paper posters are part of the shop, never interface overlays.
function poster(title, bg, theme) {
  return texture(384,512,(c,w,h)=>{
    c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle='#f7ecd5';c.fillRect(17,17,w-34,h-34);
    c.fillStyle=bg;c.fillRect(29,29,w-58,80);c.fillStyle='#fff2d4';c.textAlign='center';
    c.font='bold 40px "Yu Gothic", sans-serif';c.fillText(title,w/2,86);
    if(theme==='coffee'){
      c.fillStyle='#85674b';c.beginPath();c.ellipse(188,358,94,17,0,0,Math.PI*2);c.fill();
      c.fillStyle=bg;c.fillRect(122,205,130,142);c.fillStyle='#493e39';c.beginPath();c.ellipse(187,207,65,17,0,0,Math.PI*2);c.fill();
      c.strokeStyle=bg;c.lineWidth=15;c.beginPath();c.arc(259,270,39,-Math.PI/2,Math.PI/2);c.stroke();
      c.strokeStyle='#c8b493';c.lineWidth=7;for(let i=0;i<3;i++){c.beginPath();c.moveTo(145+i*42,175);c.bezierCurveTo(175+i*42,135,132+i*42,132,158+i*42,116);c.stroke();}
    }else{
      c.fillStyle='#bacbb0';c.beginPath();c.arc(192,267,118,0,Math.PI*2);c.fill();
      c.fillStyle='#eee7c9';c.beginPath();c.moveTo(190,161);c.lineTo(85,338);c.quadraticCurveTo(193,359,292,338);c.closePath();c.fill();
      c.fillStyle='#335d4c';c.fillRect(161,270, sixty(),86);
    }
    c.fillStyle='#536957';c.font='bold 29px "Yu Gothic", sans-serif';c.fillText(theme==='coffee'?'挽きたて、あたたかい。':'今日も、おいしい。',w/2,421);
    c.font='bold 34px sans-serif';c.fillText(theme==='coffee'?'¥ 120':'¥ 138',w/2,468);
  });
}
function sixty(){return 62;}
panel(poster('夜のひとやすみ','#7f9f8c','coffee'),.61,.83,-1.15,1.99,1.886);
panel(poster('新しいおにぎり','#c9875f','rice'),.57,.76,2.12,1.91,1.888);
panel(poster('あたたかい珈琲','#748f86','coffee'),.57,.77,3.067,1.95,-1.77,{rotateY:Math.PI/2});

// Vending machine: an illuminated display with three rows of miniature drinks.
const vm = new THREE.Group();vm.position.set(-5.40,.30,1.62);world.add(vm);
rounded(.98,1.99,.65,.065,0,.995,0,0x619d9d,vm);
box(.87,1.01,.045,0,1.30,.345,0xc7dacc,true,vm);
box(.77,.83,.028,-.01,1.31,.378,glowMaterial(0xd7f1d5,.6),false,vm);
for(let row=0;row<3;row++){
  const y=1.01+row*.28;
  box(.75,.027,.07,-.01,y-.04,.418,0x7faaa0,false,vm);
  for(let k=0;k<6;k++){
    bottle(-.325+k*.124,y,.424,productColors[(row*2+k)%7],vm,true);
    sphere(.012,-.325+k*.124,y-.054,.46,glowWarm,vm);
  }
}
box(.72,.20,.04,-.05,.40,.352,'ink',true,vm);
box(.61,.045,.045,-.05,.31,.398,'silver',false,vm);
box(.19,.24,.036,.32,.73,.349,'dark',true,vm);
box(.10,.04,.008,.32,.78,.372,glowCool,false,vm);
cylinder(.024,.024,.017,.32,.68,.380,'silver',12,vm).rotation.x=Math.PI/2;
panel(label('DRINKS','', '#c9decc','#2e7776',384,80),.82,.17,0,1.86,.345,{parent:vm});
panel(label('つめた〜い','', '#5b9999','#f2e9c7',384,64),.78,.09,0,.15,.345,{parent:vm});
light(0x8de6d8,2.8,4,-5.40,1.55,2.35);
lightSpill(.94,1.87,-5.38,3.18,0x8bdccd,.19);

// A carefully constructed bicycle, basket, chainring, spokes and kickstand.
const bike=new THREE.Group();bike.position.set(-3.25,.30,2.63);bike.rotation.y=-.11;bike.rotation.z=-.085;world.add(bike);
for(const x of [-.58,.58]){
  torus(.365,.028,x,.39,0,'ink',bike);torus(.331,.015,x,.39,0,'silver',bike);
  for(let k=0;k<12;k++){let a=k*Math.PI/6;rod([x,.39,0],[x+.323*Math.cos(a),.39+.323*Math.sin(a),0],.005,0xb1beb8,bike);}
  cylinder(.055,.055,.08,x,.39,0,'metal',12,bike).rotation.x=Math.PI/2;
}
const frameColor=0xb97669;
for(const [a,b] of [
  [[-.58,.39,0],[-.16,.88,0]],[[-.16,.88,0],[.08,.39,0]],[[.08,.39,0],[-.58,.39,0]],
  [[-.16,.88,0],[.41,.91,0]],[[.41,.91,0],[.08,.39,0]],[[.41,.91,0],[.58,.39,0]],
])rod(a,b,.022,frameColor,bike);
rod([-.16,.88,0],[-.20,1.04,0],.025,'silver',bike);
rounded(.27,.055,.16,.025,-.24,1.052,0,'ink',bike);
rod([.41,.91,0],[.43,1.16,0],.021,'silver',bike);
tube([[.40,1.14,-.18],[.45,1.2,-.17],[.44,1.22,.17],[.39,1.16,.18]],.017,'silver',bike,12);
rod([.39,1.16,.13],[.39,1.16,.23],.025,'ink',bike);
torus(.10,.012,.08,.39,.045,'silver',bike);
rod([.08,.39,.06],[.18,.29,.07],.014,'silver',bike);box(.13,.025,.085,.20,.29,.07,'ink',false,bike);
rod([-.05,.4,0],[-.12,.01,.17],.014,'silver',bike);
// Open wire basket.
for(let i=0;i<5;i++){
  const xx=.45+i*.075;
  rod([xx,.83,-.18],[xx,1.1,-.23],.006,'silver',bike);rod([xx,.83,.18],[xx,1.1,.23],.006,'silver',bike);
}
for(let i=0;i<4;i++){
  const y=.86+i*.075;
  tube([[.44,y,-.22],[.78,y,-.22],[.78,y,.22],[.44,y,.22]],.006,'silver',bike,12);
}
box(.34,.025,.32,.62,.84,0,'metal',false,bike);
sphere(.035,.47,.96,-.035,glowWarm,bike);

// Umbrella stand and transparent folded umbrellas, bins, crates and safety cones.
box(.50,.11,.39,2.61,.36,2.16,'metal');
for(const x of [2.39,2.83]) for(const z of [1.99,2.32]) rod([x,.38,z],[x,.94,z],.016,'silver');
for(const y of [.48,.91]) { box(.50,.025,.025,2.61,y,1.99,'silver',false);box(.50,.025,.025,2.61,y,2.32,'silver',false); }
for(let i=0;i<5;i++){
  let x=2.43+i*.087,z=2.12+(i%2)*.08;
  rod([x,.40,z],[x,1.25+i*.015,z],.013,'silver');
  cylinder(.031,.059,.47,x,.70,z,toon(i%2?0xb5cddd:0x93b9ad,{transparent:true,opacity:.65}),8);
  tube([[x,1.25,z],[x,1.32,z],[x+.08,1.32,z],[x+.09,1.26,z]],.017,i%2?'cream':'teal',world,10);
}
for(let i=0;i<2;i++){
  const z=.93-i*.67;
  rounded(.49,.76,.50,.035,3.29,.68,z,0x889994);
  box(.40,.16,.045,3.29,.89,z+.267,'dark');
  panel(label(i?'びん・缶':'もえるごみ','', '#c4cec0','#4a6963',256,64),.33,.10,3.29,.72,z+.275);
}
function cone(x,z){
  box(.33,.042,.33,x,.13,z,0x985b4c);
  cylinder(.034,.135,.40,x,.35,z,0xd78966,12);
  cylinder(.062,.081,.07,x,.33,z,0xe8dcca,12);
}
cone(3.84,2.58);cone(-5.83,3.20);
box(.50,.37,.42,-4.85,.48,-2.83,0xb39b71);
box(.52,.045,.44,-4.85,.69,-2.83,'cream');
for(let i=0;i<3;i++)box(.035,.31,.44,-5.03+i*.18,.48,-2.83,0x927e5e,false);

// Exterior air conditioner with radial fan grille and pipes.
box(.57,.83,1.23,3.39,.72,-2.08,0xc2c9bc);
box(.023,.66,1.08,3.69,.74,-2.08,0x788a88);
const fan=torus(.25,.017,3.713,.76,-2.16,'silver');fan.rotation.y=Math.PI/2;
for(let i=0;i<9;i++){
  const a=i*Math.PI/9;
  rod([3.73,.76+.23*Math.sin(a),-2.16+.23*Math.cos(a)],[3.73,.76-.23*Math.sin(a),-2.16-.23*Math.cos(a)],.008,'silver');
}
sphere(.039,3.734,.76,-2.16,'metal');
tube([[3.3,.84,-2.69],[3.27,1.13,-2.84],[3.14,1.13,-2.89],[3.14,2.06,-2.89]],.035,0xc5c2ad);

// An alley entrance at the back-left, retaining walls and a small noticeboard.
box(.18,1.69,3.08,-6.24,1.10,-4.88,0x5b737b);
box(1.56,1.65,.18,-5.51,1.09,-6.34,0x637c80);
for(let row=0;row<5;row++)for(let col=0;col<3;col++)box(.42,.21,.02,-6.08+col*.49+(row%2)*.1,.45+row*.27,-6.238,0x799094,false);
box(.70,.13,2.02,-5.27,.34,-4.40,0x788b8b);
for(let i=0;i<4;i++)box(.11,.017,.75,-5.75,.309,-3.2-i*.7,0xc1bdb0,false);
box(.93,.85,.13,-4.81,1.80,-1.52,'metal');
const notice=texture(512,384,(c,w,h)=>{
  c.fillStyle='#b49e7a';c.fillRect(0,0,w,h);
  for(let i=0;i<6;i++){
    const x=27+(i%3)*163,y=29+Math.floor(i/3)*179;
    c.fillStyle=['#e9e1bd','#acbbb0','#c5a08a'][i%3];c.fillRect(x,y,140,145);
    c.fillStyle='#5a746b';c.font='bold 20px "Yu Gothic", sans-serif';c.textAlign='left';c.fillText(['町内だより','夏の記憶','落としもの'][i%3],x+6,y+27);
    for(let j=0;j<5;j++)c.fillRect(x+9,y+44+j*16,93-(j%2)*19,3);
    c.fillStyle='#90755b';c.beginPath();c.arc(x+69,y+7,4,0,Math.PI*2);c.fill();
  }
});
panel(notice,.80,.69,-4.735,1.80,-1.52,{rotateY:Math.PI/2});
box(.87,.04,.21,-4.79,2.25,-1.52,'silver');
panel(label('路地裏','', '#356975','#e6e6cd',256,80),.66,.21,-5.58,2.23,-6.222);
// A tiny potted plant emphasizes the quiet neighborhood setting.
for(const [x,z] of [[-4.98,.76],[-6.00,-2.54]]){
  cylinder(.17,.115,.29,x,.455,z,0xb48165);
  cylinder(.145,.145,.025,x,.607,z,0x4b5f4a);
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7;rod([x,.60,z],[x+Math.cos(a)*.13,.86+(i%3)*.06,z+Math.sin(a)*.13],.01,0x6f967f);
    const leaf=sphere(.085,x+Math.cos(a)*.15,.83+(i%3)*.07,z+Math.sin(a)*.15,0x648779);leaf.scale.set(.56,1.8,.65);leaf.rotation.z=Math.sin(a)*.4;
  }
}

// Corner rails, bollards and a lit municipal street-name plate.
for(const x of [-5.1,-.77,2.28]){
  cylinder(.045,.060,.60,x,.60,2.71,0xc0c8b7);
  cylinder(.053,.053,.08,x,.74,2.71,0xd4a671);
  sphere(.055,x,.90,2.71,0xb9c4b6);
}
for(const [a,b] of [[-5.1,-4.40],[-1.62,-.77],[1.53,2.28]]){
  tube([[a,.37,2.72],[a,.95,2.72],[b,.95,2.72],[b,.37,2.72]],.027,0xc3ccb7,world,20);
}
for(let z=-4.84;z<-.1;z+=1.54){
  rod([3.79,.11,z],[3.79,.78,z],.029,'silver');
  rod([3.79,.70,z],[3.79,.70,z+1.06],.025,'silver');
  rod([3.79,.42,z],[3.79,.42,z+1.06],.019,'silver');
}

function streetlamp(x,z){
  cylinder(.17,.24,.20,x,.20,z,'metal');
  cylinder(.072,.095,4.56,x,2.56,z,0x557081);
  tube([[x,4.80,z],[x,5.05,z],[x-.40,5.16,z],[x-.83,5.16,z]],.057,0x6c8590,world,20);
  rounded(.57,.10,.29,.035,x-.84,5.12,z,'metal');
  box(.48,.024,.24,x-.84,5.055,z,glowWarm);
  light(0xffd69a,8,7,x-.84,4.89,z);
  lightSpill(2.48,3.38,x-.58,z+.34,0xf2cc84,.15,false);
}
streetlamp(-5.93,3.86);
// The utility pole carries crossarms, insulators, transformers and sagging cables.
const px=4.34,pz=-3.70;
cylinder(.14,.18,6.90,px,3.54,pz,0x697b86,16);
cylinder(.21,.21,.22,px,.22,pz,0x465b6c,16);
for(const y of [1.1,2.3,4.8,5.8])cylinder(.155,.155,.045,px,y,pz,'silver',16);
box(1.76,.13,.15,px,6.35,pz,'metal');
box(1.45,.12,.15,px,5.77,pz,'metal');
for(const x of [px-.72,px-.32,px+.32,px+.72]){
  rod([x,6.35,pz],[x,6.63,pz],.025,'silver');
  for(let i=0;i<3;i++)cylinder(.072,.072,.045,x,6.45+i*.06,pz,0xc5c9b7,10);
}
cylinder(.29,.29,.71,px-.31,5.05,pz+.20,0xa1b0ae,16);
cylinder(.32,.32,.06,px-.31,5.43,pz+.20,'silver',16);
box(.11,.36,.16,px+.11,4.75,pz+.18,'metal');
for(const dx of [-.65,-.18,.34]){
  tube([[px+dx,6.61,pz],[1.0+dx,5.82,-4.82],[-3.15+dx,5.64,-5.36],[-5.83,6.10,-5.94]],.013,0x223443,world,48);
}
// All wire anchors stay inside the square model footprint.
cylinder(.055,.075,5.89,-5.83,3.09,-5.94,'metal');
box(.76,.09,.09,-5.83,6.03,-5.94,'silver');
tube([[4.34,5.79,-3.7],[2.02,5.1,-1.87],[.83,4.94,.40],[-5.93,4.91,3.86]],.015,'ink',world,52);
tube([[4.38,5.73,-3.7],[2.58,5.30,-5.04],[-1.89,5.09,-5.73],[-5.83,5.72,-5.94]],.025,'ink',world,48);
// Electrical service conduits on the rear facade.
box(.49,.57,.14,1.65,1.68,-3.256,0x79908e);
tube([[1.64,1.68,-3.35],[1.64,2.59,-3.35],[2.8,2.59,-3.35],[2.8,3.80,-3.35]],.025,'silver');

// Traffic light and Japanese street signs, modest and wholly inside the miniature.
const tx=5.68,tz=-5.40;
cylinder(.063,.09,4.75,tx,2.47,tz,'metal');
rod([tx,4.66,tz],[tx-.63,4.66,tz],.055,'metal');
rounded(.42,1.00,.31,.07,tx-.66,4.25,tz,'ink');
const signals=[];
const signalColors=[0xd06a66,0xe6bf66,0x63c0a3].map(c=>new THREE.Color(c));
for(let i=0;i<3;i++){
  const y=4.56-i*.30;
  const hood=cylinder(.125,.125,.16,tx-.66,y,tz+.18,'dark',20);hood.rotation.x=Math.PI/2;
  const m=glowMaterial([0xd06a66,0xe6bf66,0x63c0a3][i],i===2?1.7:.03);
  const lens=cylinder(.085,.085,.018,tx-.66,y,tz+.272,m,24);lens.rotation.x=Math.PI/2;
  signals.push(m);
}
const signalLight=light(0x62d6ac,2.1,4,tx-.66,4.0,tz+.35);
box(.044,.34,1.30,4.38,3.46,-3.62,'metal');
panel(label('こもれび通り','KOMOREBI St.', '#426e8a','#e2e9d6',768,192),1.26,.32,4.410,3.46,-3.62,{rotateY:Math.PI/2});
// Stop sign rotated toward the front of the main street.
rod([3.91,.15,3.11],[3.91,2.70,3.11],.031,'silver');
const stop=cylinder(.31,.31,.045,3.91,2.75,3.11,0xb66f67,3);stop.rotation.x=Math.PI/2;stop.rotation.z=Math.PI;
panel(label('止まれ','', '#b66f67','#f3e5c9',256,128),.39,.16,3.91,2.74,3.139);
const smallPlate=box(.64,.17,.027,-5.90,1.84,3.86,0x406674);
panel(label('緑町 3丁目','', '#406674','#e2e4cf',512,96),.59,.13,-5.90,1.84,3.88);

// Roof gutter and downpipe, with discrete rain drops falling off the eave.
box(7.92,.08,.09,-.84,3.38,2.44,'metal');
tube([[2.92,3.38,2.44],[3.13,3.25,2.14],[3.13,.50,2.14],[3.23,.34,2.31]],.041,'silver');
for(const y of [.75,1.85,2.91])box(.11,.045,.12,3.13,y,2.15,'metal',false);

// Merge stationary geometry by material. Thousands of products stay inexpensive to render.
world.updateMatrixWorld(true);
const batches=new Map();
const movingDoorGroups=new Set(doors.map(d=>d.group));
function isStationary(o){
  let current=o.parent;
  while(current && current!==world){if(movingDoorGroups.has(current))return false;current=current.parent;}
  return current===world;
}
const stationaryMeshes=new Set(staticMeshes.filter(isStationary));
for(const o of staticMeshes){
  if(!stationaryMeshes.has(o))continue;
  const key=o.material.uuid;
  if(!batches.has(key))batches.set(key,{material:o.material,geometries:[],castShadow:false});
  const dimensions=o.geometry.parameters;
  if(dimensions && Math.max(dimensions.width||0,dimensions.height||0,dimensions.depth||0)>0.8)batches.get(key).castShadow=true;
  const geometry = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
  batches.get(key).geometries.push(geometry.applyMatrix4(o.matrixWorld));
}
for(const item of outlineParts){
  if(stationaryMeshes.has(item.mesh)){
    item.geometry.applyMatrix4(item.mesh.matrixWorld);
  }
}
const staticEdges=outlineParts.filter(o=>stationaryMeshes.has(o.mesh)).map(o=>o.geometry);
if(staticEdges.length)world.add(new THREE.LineSegments(mergeGeometries(staticEdges),outlineMaterial));
for(const o of stationaryMeshes)o.parent.remove(o);
for(const batch of batches.values()){
  const merged=mergeGeometries(batch.geometries);
  if(!merged)throw new Error('Unable to merge static model geometry.');
  const o=new THREE.Mesh(merged,batch.material);o.castShadow=batch.castShadow;o.receiveShadow=true;world.add(o);
  for(const g of batch.geometries)g.dispose();
}

// Continuous rainfall is clipped by the roof and always lands on the square base.
const rainCount=1100;
const rainPosition=new Float32Array(rainCount*6);
const rainData=[];
for(let i=0;i<rainCount;i++)rainData.push({x:random()*13.4-6.7,z:random()*13.4-6.7,y:random()*8.6,speed:4.5+random()*3.0,length:.17+random()*.15});
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPosition,3).setUsage(THREE.DynamicDrawUsage));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xb0cce2,transparent:true,opacity:.14,depthWrite:false}));
rain.frustumCulled=false;scene.add(rain);
function surfaceHeight(x,z){if(x>-4.80&&x<3.14&&z>-3.24&&z<2.28)return 3.83;if(x<3.55&&z<2.67)return .32;return .11;}
const rippleCount=56;
const ripple=new THREE.InstancedMesh(new THREE.RingGeometry(.92,1,40),basic(0xb1d4e3,.30),rippleCount);
ripple.material.blending=THREE.AdditiveBlending;
ripple.instanceMatrix.setUsage(THREE.DynamicDrawUsage);ripple.frustumCulled=false;scene.add(ripple);
const rippleInfo=[];
for(let i=0;i<rippleCount;i++){
  const p=puddles[i%puddles.length];rippleInfo.push({x:p[0]+(random()-.5)*.26,z:p[1]+(random()-.5)*.26,offset:random()*2,period:1.3+random()*1.2});
}
const dummy=new THREE.Object3D();
// Eave droplets hit the sidewalk separately from the general rainfall.
const dripsCount=27;
const drips=new THREE.InstancedMesh(new THREE.SphereGeometry(.012,6,4),basic(0xd5e2df,.55),dripsCount);
drips.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(drips);
const dripInfo=Array.from({length:dripsCount},()=>({x:-4.5+random()*7.4,phase:random()*2.1}));
// Rain slides down the actual glazing. A thin transparent ribbon keeps it subtle.
const glassRain=new THREE.Group();world.add(glassRain);
const trails=[];
for(let i=0;i<48;i++){
  const side=i>=28;
  const x=side?3.072:-4.45+random()*7.18,z=side?-3.00+random()*4.70:1.902;
  const len=.09+random()*.16;
  const o=box(side?.007:.008,len,side?.008:.006,x,1.75,z,basic(0xc5dde0,.26),false,glassRain);
  trails.push({mesh:o,phase:random()*5,speed:.15+random()*.17});
}
// Lit window reflections break into fine horizontal streaks on the puddles.
const reflectionStreaks=[];
for(let i=0;i<40;i++){
  const x=-4.3+random()*7.2,z=2.94+random()*2.3;
  const o=box(.12+random()*.35,.001,.009+random()*.018,x,.098,z,basic(i%3?0xffdca0:0x79d8c2,.08+random()*.10),false);
  reflectionStreaks.push({mesh:o,phase:random()*6});
}

const timer=new THREE.Clock();
const startTime=performance.now();
let elapsed=0;
let frame=0;
// Test hooks expose scene facts, with no visible UI or extra controls.
window.__diorama={ready:true,camera,controls,scene,renderer,doors,rain,ripple,signals,stats:()=>({drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,rainDrops:rainCount,modelWidth:13.8,modelDepth:13.8,elapsed})};
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(timer.getDelta(),.08);elapsed=(performance.now()-startTime)/1000;frame++;
  renderer.info.reset();
  controls.update();
  for(let i=0;i<rainCount;i++){
    const r=rainData[i];r.y-=r.speed*dt;r.x-=.12*dt;
    if(r.y<surfaceHeight(r.x,r.z)){r.y=7.8+random()*.8;r.x=random()*13.4-6.7;r.z=random()*13.4-6.7;}
    const k=i*6;rainPosition[k]=r.x;rainPosition[k+1]=r.y;rainPosition[k+2]=r.z;
    rainPosition[k+3]=r.x+.014;rainPosition[k+4]=r.y+r.length;rainPosition[k+5]=r.z-.006;
  }
  rainGeo.attributes.position.needsUpdate=true;
  for(let i=0;i<rippleCount;i++){
    const r=rippleInfo[i],age=((elapsed+r.offset)%r.period)/r.period;
    dummy.position.set(r.x,.105,r.z);dummy.rotation.set(-Math.PI/2,0,0);
    const s=.012+age*.25;dummy.scale.set(s,s,Math.max(.01,1-age));dummy.updateMatrix();ripple.setMatrixAt(i,dummy.matrix);
    ripple.setColorAt(i,new THREE.Color(0x6d95a6).multiplyScalar(Math.max(.01,1-age)));
  }
  ripple.instanceMatrix.needsUpdate=true;if(ripple.instanceColor)ripple.instanceColor.needsUpdate=true;
  for(let i=0;i<dripsCount;i++){
    const d=dripInfo[i],p=(elapsed+d.phase)%1.7;
    dummy.position.set(d.x,Math.max(.33,3.33-2.3*p*p),2.49);dummy.rotation.set(0,0,0);dummy.scale.set(p<1.145?1:0,p<1.145?2.4:0,p<1.145?1:0);dummy.updateMatrix();drips.setMatrixAt(i,dummy.matrix);
  }
  drips.instanceMatrix.needsUpdate=true;
  for(const r of trails)r.mesh.position.y=.91+((r.phase-elapsed*r.speed)%1.66+1.66)%1.66;
  // An empty automatic door briefly cycles, as if the sensors caught the rain.
  const cycle=elapsed%25;
  let doorAmount=0;
  if(cycle>11&&cycle<18){doorAmount=cycle<12.4?(cycle-11)/1.4:cycle>16.6?(18-cycle)/1.4:1;}
  doorAmount=THREE.MathUtils.smoothstep(doorAmount,0,1);
  for(const d of doors)d.group.position.x=d.home+d.direction*.75*doorAmount;
  signMat.emissiveIntensity=1.05+(Math.sin(elapsed*1.8)*.018)+(elapsed%17>16.84?-.11:0);
  const signalPhase=elapsed%34;
  const active=signalPhase<19?2:signalPhase<22?1:0;
  signals.forEach((m,i)=>{m.emissiveIntensity=i===active?1.5:.025;m.color.copy(signalColors[i]).multiplyScalar(i===active?1:.12);});
  signalLight.color.set([0xd9746f,0xe7bd70,0x67d6b4][active]);
  reflector.material.uniforms.time.value=elapsed;
  for(const m of spillMaterials)m.uniforms.time.value=elapsed;
  for(const r of reflectionStreaks)r.mesh.material.opacity=.08+(Math.sin(elapsed*2+r.phase)+1)*.033;
  composer.render();
  if(frame===1 || frame%5===0){
    canvas.dataset.ready='true';
    canvas.dataset.runtime=JSON.stringify({elapsed:Math.round(elapsed*10)/10,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,doorOpen:Math.round(doorAmount*100),signal:active,rain:rainCount,zoom:camera.zoom,azimuth:controls.getAzimuthalAngle()});
    if(doorAmount>.8)canvas.dataset.doorVerified='true';
  }
}
animate();
addEventListener('resize',()=>{
  const a=innerWidth/innerHeight;
  const span=a<1?11.5/a:9.2;
  camera.left=-span*a;camera.right=span*a;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);
});
// The portrait starting view also fits the entire square.
dispatchEvent(new Event('resize'));
