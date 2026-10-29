
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';

const renderer = new T.WebGLRenderer({ antialias:false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new T.Scene();
scene.fog = new T.FogExp2(0x070b16, 0.0115);

const camera = new T.PerspectiveCamera(42, window.innerWidth/window.innerHeight, 0.5, 130);
camera.position.set(19.5, 12.5, 20.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 5.5;
controls.maxDistance = 38;
controls.maxPolarAngle = 1.48;
controls.target.set(0.2, 1.4, 0.4);
controls.update();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new T.Vector2(window.innerWidth, window.innerHeight), 0.55, 0.55, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const fxaa = new ShaderPass(FXAAShader);
fxaa.material.uniforms['resolution'].value.set(1/(window.innerWidth*renderer.getPixelRatio()), 1/(window.innerHeight*renderer.getPixelRatio()));
composer.addPass(fxaa);

const world = new T.Group();
scene.add(world);
const animated = [];

const gradData = new Uint8Array([64,64,64,255, 154,154,154,255, 255,255,255,255]);
const GRAD = new T.DataTexture(gradData, 3, 1, T.RGBAFormat);
GRAD.minFilter = T.NearestFilter;
GRAD.magFilter = T.NearestFilter;
GRAD.needsUpdate = true;

function toon(c, o = {}) {
  return new T.MeshToonMaterial(Object.assign({ color:c, gradientMap:GRAD }, o));
}
function glow(c, i = 1) {
  const col = new T.Color(c);
  col.multiplyScalar(i);
  return new T.MeshBasicMaterial({ color:col });
}
const JP = '"Yu Gothic","Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",sans-serif';
function ct(w, h, fn) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  fn(g, w, h);
  const t = new T.CanvasTexture(cv);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function tx(g, s, x, y, px, fill, w = 700, align = 'center') {
  g.font = w + ' ' + px + 'px ' + JP;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = fill;
  g.fillText(s, x, y);
}
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x+r, y);
  g.arcTo(x+w, y, x+w, y+h, r);
  g.arcTo(x+w, y+h, x, y+h, r);
  g.arcTo(x, y+h, x, y, r);
  g.arcTo(x, y, x+w, y, r);
  g.closePath();
}
function rnd(a, b) { return a + Math.random()*(b-a); }
function pick(a) { return a[Math.floor(Math.random()*a.length)]; }

function B(w, h, d, mat, x, y, z, ry = 0, parent = world) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function Cy(rT, rB, h, mat, x, y, z, seg = 14, parent = world) {
  const m = new T.Mesh(new T.CylinderGeometry(rT, rB, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function P(w, h, mat, x, y, z, ry = 0, rx = 0, parent = world) {
  const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.order = 'YXZ';
  m.rotation.y = ry;
  m.rotation.x = rx;
  parent.add(m);
  return m;
}
function rod(ax, ay, az, bx, by, bz, r, mat, parent = world) {
  const a = new T.Vector3(ax, ay, az), b = new T.Vector3(bx, by, bz);
  const d = b.clone().sub(a);
  const m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 8), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), d.normalize());
  m.castShadow = true;
  parent.add(m);
  return m;
}
function wire(a, b, sag, mat) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new T.QuadraticBezierCurve3(a, mid, b);
  const m = new T.Mesh(new T.TubeGeometry(curve, 16, 0.021, 5), mat);
  m.userData.noOutline = true;
  world.add(m);
  return m;
}

const M = {
  cream: toon(0xefe6d0), creamDim: toon(0xd6cab0),
  teal: toon(0x2f9e97), tealDeep: toon(0x1e6b66), tealInk: toon(0x143c3f),
  coral: toon(0xdd7854),
  ink: toon(0x20242e), ink2: toon(0x161a22),
  steel: toon(0x97a0b0), steelD: toon(0x5c6575),
  white: toon(0xe9edf3), offw: toon(0xcfd4da),
  wood: toon(0x9d7c58), woodD: toon(0x6f543a),
  yellow: toon(0xd9b13b), red: toon(0xc05050),
  navy: toon(0x2a3a55), navyD: toon(0x232c40),
  leaf: toon(0x41603c), leafD: toon(0x2c422a),
  gray: toon(0x8a92a0), grayD: toon(0x4c545f),
  conc: toon(0x3d4553), concP: toon(0x84888f),
  black: toon(0x11141b), green: toon(0x2c4a44)
};
const GLASS = new T.MeshPhongMaterial({ color:0x9fc4e8, transparent:true, opacity:0.15, shininess:90, specular:0x9ac2e8, depthWrite:false });
const GLASS2 = new T.MeshPhongMaterial({ color:0xa8ccec, transparent:true, opacity:0.22, shininess:90, specular:0xa8cce8, depthWrite:false, side:T.DoubleSide });

const skyMat = new T.ShaderMaterial({
  side: T.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'varying vec3 vW; void main(){ float h = normalize(vW).y; vec3 top = vec3(0.010,0.014,0.030); vec3 hor = vec3(0.062,0.093,0.170); vec3 bot = vec3(0.026,0.036,0.062); vec3 c = h > 0.0 ? mix(hor, top, pow(h,0.55)) : mix(hor, bot, pow(-h,0.7)); c += vec3(0.10,0.16,0.27)*exp(-abs(h)*7.0)*0.4; gl_FragColor = vec4(c,1.0); }'
});
const sky = new T.Mesh(new T.SphereGeometry(72, 24, 16), skyMat);
sky.userData.noOutline = true;
scene.add(sky);

const hemi = new T.HemisphereLight(0x2c3d66, 0x11141d, 0.85);
scene.add(hemi);
const moon = new T.DirectionalLight(0x5f7bb5, 1.35);
moon.position.set(16, 20, -8);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -14; moon.shadow.camera.right = 14;
moon.shadow.camera.top = 14; moon.shadow.camera.bottom = -14;
moon.shadow.camera.near = 2; moon.shadow.camera.far = 60;
moon.shadow.bias = -0.0003;
moon.shadow.normalBias = 0.03;
scene.add(moon);
scene.add(moon.target);

const discTex = ct(128, 128, (g) => {
  const r = g.createRadialGradient(64,64,4, 64,64,64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.4, 'rgba(255,255,255,0.42)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0,0,128,128);
});
function disc(r, color, x, y, z, opacity = 0.35, parent = world) {
  const m = new T.Mesh(new T.PlaneGeometry(r*2, r*2), new T.MeshBasicMaterial({ map:discTex, color, transparent:true, opacity, blending:T.AdditiveBlending, depthWrite:false }));
  m.rotation.x = -Math.PI/2;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function texPlane(w, h, tex, x, y, z, ry = 0, rx = 0, bright = 1, parent = world) {
  const mat = new T.MeshBasicMaterial({ map:tex, transparent:true });
  mat.color.setScalar(bright);
  const m = P(w, h, mat, x, y, z, ry, rx, parent);
  return m;
}

const PUDDLES = [
  {x:-4.2,z:7.4,rx:1.7,rz:0.85,a:70,y:0.05},
  {x:0.6,z:8.9,rx:1.2,rz:0.65,a:78,y:0.05},
  {x:-8.6,z:6.7,rx:1.5,rz:0.6,a:65,y:0.05},
  {x:3.1,z:9.3,rx:1.0,rz:0.5,a:72,y:0.05},
  {x:-1.5,z:6.9,rx:0.8,rz:0.45,a:85,y:0.05},
  {x:7.1,z:-2.6,rx:0.8,rz:1.5,a:68,y:0.05},
  {x:8.4,z:2.7,rx:1.2,rz:0.8,a:74,y:0.05},
  {x:7.6,z:-7.7,rx:1.3,rz:0.9,a:70,y:0.05},
  {x:8.8,z:-4.9,rx:0.9,rz:0.7,a:80,y:0.05},
  {x:7.9,z:7.8,rx:2.0,rz:1.9,a:62,y:0.05},
  {x:8.8,z:6.7,rx:1.1,rz:0.8,a:75,y:0.05},
  {x:6.8,z:8.9,rx:0.9,rz:0.8,a:78,y:0.05},
  {x:5.3,z:8.2,rx:0.8,rz:2.6,a:200,y:0.05},
  {x:8.2,z:5.3,rx:2.6,rz:0.8,a:200,y:0.05},
  {x:-6.2,z:1.7,rx:1.4,rz:0.7,a:66,y:0.045},
  {x:-5.1,z:2.9,rx:0.9,rz:0.55,a:74,y:0.045},
  {x:-2.6,z:-3.65,rx:1.2,rz:0.42,a:64,y:0.045},
  {x:1.1,z:-3.62,rx:0.75,rz:0.38,a:72,y:0.045},
  {x:-6.5,z:-3.68,rx:0.9,rz:0.4,a:68,y:0.045},
  {x:-6.0,z:4.8,rx:0.8,rz:0.5,a:70,y:0.045}
];

const baseGeo = new RoundedBoxGeometry(21, 1.0, 21, 3, 0.14);
const base = new T.Mesh(baseGeo, toon(0x10131b));
base.position.y = -0.5;
base.receiveShadow = true;
world.add(base);

const plateTex = ct(768, 192, (g, w, h) => {
  g.fillStyle = '#141926'; g.fillRect(0,0,w,h);
  g.strokeStyle = '#2f9e97'; g.lineWidth = 5;
  g.strokeRect(10,10,w-20,h-20);
  g.strokeStyle = 'rgba(47,158,151,0.35)'; g.lineWidth = 2;
  g.strokeRect(24,24,w-48,h-48);
  tx(g, '雨夜のコンビニ', w/2, 62, 54, '#e8dfc8');
  tx(g, '蛍坂通り · HOTARU STORE — 1/150 NIGHT DIORAMA', w/2, 128, 26, '#8fa3b8', 400);
});
const plate = texPlane(3.6, 0.9, plateTex, 4.6, -0.5, 10.51, 0, 0, 1.0);
plate.userData.noOutline = true;

const refl = new Reflector(new T.PlaneGeometry(21, 21), { clipBias:0.003, textureWidth:512, textureHeight:512, color:0x53606f });
refl.rotation.x = -Math.PI/2;
refl.position.y = 0.015;
world.add(refl);

const aspCol = ct(1024, 1024, (g, w, h) => {
  g.fillStyle = '#252c3b'; g.fillRect(0,0,w,h);
  for (let i=0;i<5200;i++) {
    g.fillStyle = 'rgba(' + (Math.random()<0.5 ? '17,21,31' : '58,66,82') + ',' + rnd(0.04,0.14).toFixed(2) + ')';
    g.fillRect(Math.random()*w, Math.random()*h, rnd(1,3), rnd(1,3));
  }
  for (let i=0;i<26;i++) {
    g.fillStyle = 'rgba(14,17,26,' + rnd(0.05,0.12).toFixed(2) + ')';
    g.beginPath();
    g.ellipse(Math.random()*w, Math.random()*h, rnd(40,130), rnd(30,90), rnd(0,3.1), 0, 6.3);
    g.fill();
  }
});
const aspAlp = ct(1024, 1024, (g, w, h) => {
  g.fillStyle = '#efefef'; g.fillRect(0,0,w,h);
  const px = v => (v+10.5)*48.76, pz = v => (10.5-v)*48.76;
  for (const p of PUDDLES) {
    g.save();
    g.translate(px(p.x), pz(p.z));
    g.scale(p.rx*48.76, p.rz*48.76);
    const gr = g.createRadialGradient(0,0,0.1, 0,0,1);
    gr.addColorStop(0, 'rgba(' + p.a + ',' + p.a + ',' + p.a + ',1)');
    gr.addColorStop(0.72, 'rgba(' + p.a + ',' + p.a + ',' + p.a + ',0.85)');
    gr.addColorStop(1, 'rgba(235,235,235,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(0,0,1,0,6.3); g.fill();
    g.restore();
  }
  g.strokeStyle = 'rgba(170,170,170,0.5)';
  g.lineWidth = 10;
  g.beginPath(); g.moveTo(0, pz(6.2)); g.lineTo(px(4.6), pz(6.2)); g.stroke();
  g.beginPath(); g.moveTo(px(6.2), 0); g.lineTo(px(6.2), pz(4.6)); g.stroke();
});
aspAlp.colorSpace = T.NoColorSpace;
const aspMat = new T.MeshToonMaterial({ color:0xbfc6d6, map:aspCol, alphaMap:aspAlp, gradientMap:GRAD, transparent:true });
const asp = new T.Mesh(new T.PlaneGeometry(21, 21), aspMat);
asp.rotation.x = -Math.PI/2;
asp.position.y = 0.035;
asp.receiveShadow = true;
asp.userData.noOutline = true;
world.add(asp);

const walkTex = ct(128, 128, (g, w, h) => {
  g.fillStyle = '#3d4553'; g.fillRect(0,0,w,h);
  g.strokeStyle = '#323947'; g.lineWidth = 3;
  g.strokeRect(0,0,w,h);
  for (let i=0;i<50;i++) {
    g.fillStyle = 'rgba(24,28,38,' + rnd(0.05,0.15).toFixed(2) + ')';
    g.fillRect(Math.random()*w, Math.random()*h, 2, 2);
  }
});
function walkSlab(x0, x1, z0, z1) {
  const w = x1-x0, d = z1-z0;
  B(w, 0.145, d, M.conc, (x0+x1)/2, 0.0725, (z0+z1)/2);
  const t = walkTex.clone();
  t.wrapS = T.RepeatWrapping; t.wrapT = T.RepeatWrapping;
  t.repeat.set(w/1.15, d/1.15);
  const m = P(w, d, new T.MeshToonMaterial({ map:t, gradientMap:GRAD }), (x0+x1)/2, 0.147, (z0+z1)/2, 0, -Math.PI/2);
  m.receiveShadow = true;
  m.userData.noOutline = true;
  return m;
}
walkSlab(-10.5, 3.5, -10.5, -4.35);
walkSlab(-10.5, 3.5, -3.0, -0.2);
walkSlab(-10.5, -7.9, -0.2, 3.5);
walkSlab(-3.9, 3.5, -0.2, 3.5);
walkSlab(-10.5, -7.3, 3.5, 6.0);
walkSlab(-4.7, 6.0, 3.5, 6.0);
walkSlab(3.5, 6.0, -10.5, 6.0);

const tacTex = ct(256, 128, (g, w, h) => {
  g.fillStyle = '#c8a433'; g.fillRect(0,0,w,h);
  g.fillStyle = '#b3922c';
  for (let y=0;y<4;y++) for (let x=0;x<8;x++) {
    g.beginPath(); g.arc(16+x*32, 16+y*32, 9, 0, 6.3); g.fill();
  }
  g.strokeStyle = '#8f7422'; g.lineWidth = 6; g.strokeRect(0,0,w,h);
});
const tac1 = P(1.15, 0.55, new T.MeshToonMaterial({ map:tacTex, gradientMap:GRAD }), 5.3, 0.1485, 5.7, 0, -Math.PI/2);
const tac2 = P(0.55, 1.15, new T.MeshToonMaterial({ map:tacTex, gradientMap:GRAD }), 5.7, 0.1485, 5.3, 0, -Math.PI/2);
tac1.userData.noOutline = true; tac2.userData.noOutline = true;

const paintMat = new T.MeshBasicMaterial({ color:new T.Color(0.70,0.76,0.85).multiplyScalar(1.02) });
const cwMat = glow(0xdde6f0, 1.18);
const ylMat = glow(0xb9a23c, 0.95);
function line(w, l, x, z, mat = paintMat) {
  const m = P(w, l, mat, x, 0.048, z, 0, -Math.PI/2);
  m.userData.noOutline = true;
  return m;
}
for (let x = -10.1; x <= 4.3; x += 1.7) line(0.75, 0.13, x, 8.25);
for (let z = -10.1; z <= 4.3; z += 1.7) line(0.13, 0.75, 8.25, z);
line(0.16, 4.3, 4.5, 8.25);
line(4.3, 0.16, 8.25, 4.5);
line(0.08, 14.6, -3.0, 6.16, ylMat);
line(14.6, 0.08, 6.16, -3.0, ylMat);
const cwBands = [6.35, 7.1, 7.85, 8.6, 9.35, 10.1];
for (const z of cwBands) line(1.1, 0.45, 5.3, z, cwMat);
for (const x of cwBands) line(0.45, 1.1, x, 5.3, cwMat);

line(0.09, 3.0, -7.85, 1.8);
line(0.09, 3.0, -6.15, 1.8);
line(0.09, 3.0, -4.45, 1.8);
line(3.4, 0.09, -6.15, 0.32);
B(0.5, 0.07, 0.12, M.grayD, -7.0, 0.075, 0.8);
B(0.5, 0.07, 0.12, M.grayD, -5.3, 0.075, 0.8);

const pSignTex = ct(256, 256, (g) => {
  g.fillStyle = '#2f7a4a'; rr(g, 18, 18, 220, 220, 28); g.fill();
  g.strokeStyle = '#e8eef0'; g.lineWidth = 8;
  rr(g, 18, 18, 220, 220, 28); g.stroke();
  tx(g, 'P', 128, 112, 130, '#f2f6f2', 800);
  tx(g, '駐車場', 128, 200, 36, '#f2f6f2', 700);
});
Cy(0.045, 0.055, 2.7, M.steelD, -4.35, 1.49, 4.3);
texPlane(0.62, 0.62, pSignTex, -4.35, 2.45, 4.32, 0, 0, 1.05);

const gutterDark = toon(0x1a2030);
const gut1 = P(14.9, 0.24, gutterDark, -2.85, 0.042, 6.2, 0, -Math.PI/2);
const gut2 = P(0.24, 14.9, gutterDark, 6.2, 0.042, -2.85, 0, -Math.PI/2);
gut1.userData.noOutline = true; gut2.userData.noOutline = true;

const flowTex = ct(64, 64, (g) => {
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2.5;
  for (let i=0;i<5;i++) {
    g.beginPath();
    g.moveTo(-8, 10+i*12);
    g.bezierCurveTo(20, 4+i*12, 44, 18+i*12, 72, 10+i*12);
    g.stroke();
  }
});
flowTex.wrapS = T.RepeatWrapping; flowTex.wrapT = T.RepeatWrapping;
function flowStrip(along, x, z, axis) {
  const t = flowTex.clone();
  t.wrapS = T.RepeatWrapping; t.wrapT = T.RepeatWrapping;
  t.repeat.set(along/1.2, 1);
  const mat = new T.MeshBasicMaterial({ map:t, color:0x7fa8cc, transparent:true, opacity:0.30, blending:T.AdditiveBlending, depthWrite:false });
  const m = P(along, 0.16, mat, x, 0.052, z, axis === 'x' ? 0 : Math.PI/2, -Math.PI/2);
  m.userData.noOutline = true;
  const dir = axis === 'x' ? 1 : -1;
  animated.push((t2) => { t.offset.x = (dir*t2*0.28) % 1; });
  return m;
}
flowStrip(14.6, -3.0, 6.2, 'x');
flowStrip(14.6, 6.2, -3.0, 'z');

const grateGeo = new T.BoxGeometry(0.55, 0.05, 0.2);
const grateMat = toon(0x39404d);
const grates = [];
for (let x = -10.0; x <= 4.4; x += 0.62) grates.push([x, 6.2, 0]);
for (let z = -10.0; z <= 4.4; z += 0.62) grates.push([6.2, z, Math.PI/2]);
const grateIM = new T.InstancedMesh(grateGeo, grateMat, grates.length);
{
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(), s1 = new T.Vector3(1,1,1), p = new T.Vector3();
  grates.forEach((gp, i) => {
    e.set(0, gp[2], 0); q.setFromEuler(e);
    p.set(gp[0], 0.045, gp[1]);
    m4.compose(p, q, s1);
    grateIM.setMatrixAt(i, m4);
  });
}
grateIM.frustumCulled = false;
grateIM.userData.noOutline = true;
world.add(grateIM);
B(0.55, 0.05, 0.2, grateMat, -0.5, 0.045, -3.32);
B(0.55, 0.05, 0.2, grateMat, -5.9, 0.045, 0.42, Math.PI/2);

Cy(0.34, 0.34, 0.02, toon(0x2a3140), 2.0, 0.045, 7.6, 20);
Cy(0.26, 0.26, 0.012, toon(0x232a38), 2.0, 0.058, 7.6, 20);
Cy(0.34, 0.34, 0.02, toon(0x2a3140), 7.5, 0.045, -3.2, 20);
Cy(0.26, 0.26, 0.012, toon(0x232a38), 7.5, 0.058, -3.2, 20);

const bushGround = P(0.42, 3.3, toon(0x2c3226), -8.1, 0.147, 1.6, 0, -Math.PI/2);
bushGround.userData.noOutline = true;
const bushGeo = new T.SphereGeometry(1, 10, 8);
function bush(r, x, z, sy) {
  const m = new T.Mesh(bushGeo, M.leafD);
  m.scale.set(r, r*sy, r);
  m.position.set(x, r*sy*0.8, z);
  m.castShadow = true;
  m.userData.outlineT = 0.02;
  world.add(m);
}
bush(0.45, -8.1, 0.85, 0.75);
bush(0.34, -8.1, 1.75, 0.8);
bush(0.5, -8.05, 2.6, 0.65);

const streakTime = { value: 0 };
function streakMat(seed) {
  return new T.ShaderMaterial({
    uniforms: { uTime: streakTime, uSeed: { value: seed } },
    transparent: true, depthWrite: false, side: T.FrontSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: [
      'varying vec2 vUv;',
      'uniform float uTime; uniform float uSeed;',
      'float h1(float n){ return fract(sin(n*127.1+uSeed)*43758.5453); }',
      'void main(){',
      '  vec3 col = vec3(0.30,0.42,0.58);',
      '  float a = 0.09;',
      '  float acc = 0.0;',
      '  for(int i=0;i<3;i++){',
      '    float fi = float(i);',
      '    float cols = 16.0 + fi*10.0;',
      '    float cx = floor(vUv.x*cols);',
      '    float r1 = h1(cx*3.1+fi*17.7);',
      '    float r2 = h1(cx*9.3+fi*5.1);',
      '    float speed = 0.045 + r1*0.075;',
      '    float yh = 1.0 - fract(uTime*speed + r2*7.0);',
      '    float d = vUv.y - yh;',
      '    float head = smoothstep(0.045, 0.0, abs(d));',
      '    float tail = smoothstep(0.0, -0.22, d);',
      '    float wide = 0.45 + 0.55*r2;',
      '    acc += (head*1.3 + tail*0.4) * wide;',
      '  }',
      '  vec2 g = vUv*vec2(80.0,54.0);',
      '  vec2 id = floor(g);',
      '  float hd = h1(id.x*13.7+id.y*7.3);',
      '  float drop = smoothstep(0.17,0.04,length(fract(g)-vec2(0.5,0.55))) * step(0.94,hd);',
      '  a += acc*0.5 + drop*0.3;',
      '  col += acc*0.4 + drop*0.25;',
      '  gl_FragColor = vec4(col, clamp(a,0.0,0.62));',
      '}'
    ].join('\n')
  });
}

B(7.12, 3.3, 0.12, M.cream, 0, 1.79, -3.0);
B(0.12, 3.3, 6.0, M.cream, -3.5, 1.79, 0);
B(0.12, 3.3, 1.16, M.cream, 3.5, 1.79, -2.42);
B(4.76, 0.54, 0.12, M.cream, -1.15, 3.17, 3.0);
B(4.76, 0.36, 0.15, M.creamDim, -1.15, 0.32, 3.0);
B(0.12, 0.54, 2.58, M.cream, 3.5, 3.17, -0.55);
B(0.12, 0.36, 2.58, M.creamDim, 3.5, 0.32, -0.55);
B(0.2, 3.3, 0.2, M.cream, -3.42, 1.79, 2.92);
B(0.18, 3.3, 0.18, M.cream, 1.25, 1.79, 2.93);
B(0.18, 3.3, 0.18, M.cream, 3.44, 1.79, 0.76);
B(0.5, 3.3, 0.13, M.cream, 1.367, 1.79, 2.833, Math.PI/4);
B(0.5, 3.3, 0.13, M.cream, 3.333, 1.79, 0.867, Math.PI/4);
B(2.42, 0.5, 0.13, M.cream, 2.35, 3.19, 1.85, Math.PI/4);

P(4.66, 2.4, streakMat(1.0), -1.11, 1.7, 2.98);
P(2.58, 2.4, streakMat(7.0), 3.48, 1.7, -0.55, -Math.PI/2);
for (const mx of [-2.15, -0.85, 0.45]) B(0.075, 2.4, 0.1, M.tealDeep, mx, 1.7, 3.0);
for (const mz of [-1.05, -0.2]) B(0.1, 2.4, 0.075, M.tealDeep, 3.5, 1.7, mz);

const doorGrp = new T.Group();
doorGrp.position.set(2.35, 0, 1.85);
doorGrp.rotation.y = Math.PI/4;
world.add(doorGrp);
B(2.42, 0.34, 0.16, M.cream, 0, 2.78, 0, 0, doorGrp);
B(2.4, 0.05, 0.3, M.ink2, 0, 0.165, 0, 0, doorGrp);
B(0.3, 0.08, 0.09, M.ink, 0, 2.53, 0.11, 0, doorGrp);
const doorLED = new T.Mesh(new T.SphereGeometry(0.024, 8, 8), glow(0xff8866, 1.6));
doorLED.position.set(0, 2.53, 0.16);
doorGrp.add(doorLED);

const doorPanels = [];
for (const s of [-1, 1]) {
  const p = new T.Group();
  p.position.x = s * 0.575;
  doorGrp.add(p);
  doorPanels.push(p);
  B(1.16, 0.44, 0.075, M.tealDeep, 0, 0.36, 0, 0, p);
  B(1.16, 0.13, 0.075, M.tealDeep, 0, 2.625, 0, 0, p);
  B(0.06, 2.14, 0.075, M.tealDeep, -0.55, 1.56, 0.005, 0, p);
  B(0.06, 2.14, 0.075, M.tealDeep, 0.55, 1.56, 0.005, 0, p);
  const gl = P(1.02, 2.0, streakMat(s < 0 ? 3.0 : 11.0), 0, 1.56, 0.02, 0, 0, p);
  gl.rotation.order = 'YXZ';
}

const nameTex = ct(1536, 192, (g) => {
  g.fillStyle = '#f3ecdc'; g.fillRect(0,0,1536,192);
  g.fillStyle = '#2f9e97'; g.beginPath(); g.arc(105, 88, 74, 0, 6.3); g.fill();
  g.fillStyle = '#dff2c8'; g.beginPath(); g.arc(105, 74, 22, 0, 6.3); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 7;
  g.beginPath(); g.arc(88, 74, 26, 2.4, 4.1); g.stroke();
  g.beginPath(); g.arc(122, 74, 26, 5.3, 7.0); g.stroke();
  tx(g, 'ほたるストア', 620, 92, 108, '#1e3a5f', 800);
  g.fillStyle = '#e07856'; rr(g, 1080, 52, 330, 76, 38); g.fill();
  tx(g, '24時間営業', 1245, 92, 46, '#fff6e8', 700);
  g.fillStyle = '#2f9e97'; g.fillRect(0, 168, 1536, 24);
  g.fillStyle = '#e07856'; g.fillRect(0, 156, 1536, 12);
});
const logoTex = ct(512, 512, (g) => {
  g.fillStyle = '#f3ecdc'; g.fillRect(0,0,512,512);
  g.strokeStyle = '#2f9e97'; g.lineWidth = 24;
  g.beginPath(); g.arc(256, 218, 170, 0, 6.3); g.stroke();
  g.fillStyle = '#2f9e97'; g.beginPath(); g.arc(256, 218, 128, 0, 6.3); g.fill();
  g.fillStyle = '#dff2c8'; g.beginPath(); g.arc(256, 200, 40, 0, 6.3); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 11;
  g.beginPath(); g.arc(226, 200, 48, 2.4, 4.1); g.stroke();
  g.beginPath(); g.arc(286, 200, 48, 5.3, 7.0); g.stroke();
  tx(g, 'ほたるストア', 256, 330, 62, '#1e3a5f', 800);
  tx(g, 'HOTARU STORE', 256, 396, 30, '#5a6a85', 700);
  tx(g, '24h', 256, 452, 26, '#e07856', 800);
});
const sideTex = ct(1024, 192, (g) => {
  g.fillStyle = '#f3ecdc'; g.fillRect(0,0,1024,192);
  g.fillStyle = '#2f9e97'; rr(g, 22, 30, 132, 132, 22); g.fill();
  tx(g, '24', 88, 100, 76, '#f3ecdc', 800);
  tx(g, '24時間営業', 560, 88, 92, '#1e3a5f', 800);
  tx(g, 'HOTARU', 560, 146, 34, '#5a6a85', 700);
  g.fillStyle = '#2f9e97'; g.fillRect(0, 168, 1024, 24);
  g.fillStyle = '#e07856'; g.fillRect(0, 156, 1024, 12);
});
const nameBasic = new T.MeshBasicMaterial({ map:nameTex });
const logoBasic = new T.MeshBasicMaterial({ map:logoTex });
const sideBasic = new T.MeshBasicMaterial({ map:sideTex });
const fasciaGlows = [nameBasic, logoBasic, sideBasic];

B(4.9, 0.52, 0.17, [M.tealDeep, M.tealDeep, M.creamDim, M.tealDeep, nameBasic, M.tealDeep], -1.06, 3.7, 3.085);
B(3.42, 0.52, 0.17, [M.tealDeep, M.tealDeep, M.creamDim, M.tealDeep, logoBasic, M.tealDeep], 2.37, 3.7, 1.83, Math.PI/4);
B(0.17, 0.52, 2.72, [sideBasic, M.tealDeep, M.creamDim, M.tealDeep, M.tealDeep, M.tealDeep], 3.585, 3.7, -0.53);
B(0.17, 0.52, 6.24, M.tealDeep, -3.585, 3.7, 0);
B(7.26, 0.52, 0.17, M.tealDeep, 0, 3.7, -3.085);
B(7.24, 0.14, 6.2, M.creamDim, 0, 3.51, 0);
B(6.9, 0.08, 5.9, toon(0x6e7268), 0, 3.63, 0);

const canPts = [[-3.56,3.0],[-3.56,4.1],[1.656,4.1],[4.6,1.156],[4.6,-1.9],[3.5,-1.9],[3.5,0.7],[1.2,3.0]];
const canShape = new T.Shape();
canShape.moveTo(canPts[0][0], -canPts[0][1]);
for (let i=1;i<canPts.length;i++) canShape.lineTo(canPts[i][0], -canPts[i][1]);
const canGeo = new T.ExtrudeGeometry(canShape, { depth:0.16, bevelEnabled:false });
canGeo.rotateX(-Math.PI/2);
const canopy = new T.Mesh(canGeo, M.cream);
canopy.position.y = 3.0;
canopy.castShadow = true;
canopy.receiveShadow = true;
world.add(canopy);
rod(-2.6, 3.16, 4.02, -2.6, 3.42, 3.06, 0.02, M.steelD);
rod(0.5, 3.16, 4.02, 0.5, 3.42, 3.06, 0.02, M.steelD);
rod(4.52, 3.16, -1.1, 3.56, 3.42, -1.1, 0.02, M.steelD);
B(5.22, 0.2, 0.06, M.teal, -0.952, 3.07, 4.09);
B(4.17, 0.2, 0.06, M.teal, 3.128, 3.07, 2.628, Math.PI/4);
B(0.06, 0.2, 3.0, M.teal, 4.58, 3.07, -0.55);
const canopyGlow = glow(0xffdfae, 1.5);
B(4.4, 0.03, 0.12, canopyGlow, -0.7, 2.985, 3.6);
B(2.3, 0.03, 0.12, canopyGlow, 2.05, 2.985, 1.55, Math.PI/4);
B(0.12, 0.03, 2.3, canopyGlow, 4.12, 2.985, -0.6);

const fanTex = ct(256, 256, (g) => {
  g.fillStyle = '#2a2f38'; g.beginPath(); g.arc(128,128,126,0,6.3); g.fill();
  g.strokeStyle = '#454d5c'; g.lineWidth = 10;
  g.beginPath(); g.arc(128,128,100,0,6.3); g.stroke();
  g.strokeStyle = '#3a414e'; g.lineWidth = 42;
  for (let i=0;i<4;i++) { g.beginPath(); g.arc(128,128,62,i*1.57+0.3,i*1.57+1.27); g.stroke(); }
  g.fillStyle = '#565f70'; g.beginPath(); g.arc(128,128,24,0,6.3); g.fill();
});
B(1.15, 0.7, 0.9, M.steelD, 1.7, 3.98, -1.5);
const roofFan = P(0.82, 0.82, new T.MeshBasicMaterial({ map:fanTex }), 1.7, 4.34, -1.5, 0, -Math.PI/2);
roofFan.userData.noOutline = true;
B(0.28, 0.28, 1.0, M.steelD, 1.7, 3.86, -0.55);
B(0.95, 0.22, 0.95, M.creamDim, -1.6, 3.72, -1.7);
rod(-2.8, 3.66, -2.4, -2.8, 5.05, -2.4, 0.016, M.ink2);
rod(-2.62, 4.85, -2.4, -2.98, 4.85, -2.4, 0.012, M.ink2);

const matTex = ct(512, 352, (g) => {
  g.fillStyle = '#262b33'; g.fillRect(0,0,512,352);
  g.strokeStyle = '#4a5260'; g.lineWidth = 6; g.setLineDash([22,14]);
  g.strokeRect(16,16,480,320); g.setLineDash([]);
  g.strokeStyle = '#2f9e97'; g.lineWidth = 13;
  g.beginPath(); g.arc(256, 128, 62, 0, 6.3); g.stroke();
  g.fillStyle = '#2f9e97'; g.beginPath(); g.arc(256, 128, 44, 0, 6.3); g.fill();
  g.fillStyle = '#dff2c8'; g.beginPath(); g.arc(256, 118, 15, 0, 6.3); g.fill();
  tx(g, 'ほたるストア', 256, 232, 48, '#e8eef2', 700);
  tx(g, 'WELCOME', 256, 296, 26, '#8fa3b8', 700);
});
const doorMat = P(1.12, 0.78, new T.MeshBasicMaterial({ map:matTex }), 3.0, 0.154, 2.5, Math.PI/4, 0);
doorMat.userData.noOutline = true;

const afTex = ct(384, 512, (g) => {
  g.fillStyle = '#e8c05a'; g.fillRect(0,0,384,512);
  g.strokeStyle = '#5a3a20'; g.lineWidth = 10; g.strokeRect(14,14,356,484);
  tx(g, 'おでん', 192, 150, 110, '#5a3a20', 800);
  tx(g, '好評実施中！', 192, 260, 52, '#5a3a20', 700);
  g.strokeStyle = 'rgba(90,58,32,0.5)'; g.lineWidth = 8;
  for (const sx of [140,192,244]) {
    g.beginPath(); g.arc(sx, 340, 16, 0, 6.3); g.stroke();
    g.beginPath(); g.arc(sx, 372, 11, 0, 6.3); g.stroke();
  }
  tx(g, '1串 130円〜', 192, 430, 38, '#5a3a20', 700);
});
const afGrp = new T.Group();
afGrp.position.set(1.55, 0, 4.5);
afGrp.rotation.y = -0.4;
world.add(afGrp);
const afMat = new T.MeshBasicMaterial({ map:afTex, transparent:true, side:T.DoubleSide });
const af1 = P(0.62, 0.92, afMat, 0, 0.55, 0.1, 0, 0.16, afGrp);
const af2 = P(0.62, 0.92, afMat, 0, 0.55, -0.1, Math.PI, -0.16, afGrp);
rod(-0.26, 0.02, 0.12, -0.26, 0.5, 0.05, 0.018, M.woodD, afGrp);
rod(0.26, 0.02, 0.12, 0.26, 0.5, 0.05, 0.018, M.woodD, afGrp);
af1.userData.noOutline = true; af2.userData.noOutline = true;

B(0.06, 0.92, 1.34, M.woodD, -3.61, 1.62, 1.2);
B(0.18, 0.09, 1.5, M.tealDeep, -3.63, 2.14, 1.2);
const nbA = ct(256, 352, (g) => {
  g.fillStyle = '#dfe8ee'; g.fillRect(0,0,256,352);
  g.fillStyle = '#2f9e97'; g.fillRect(0,0,256,64);
  tx(g, 'お知らせ', 128, 34, 36, '#f3ecdc', 700);
  tx(g, '新着雑誌', 128, 140, 40, '#1e3a5f', 800);
  tx(g, '入荷しました', 128, 200, 26, '#3a4a60', 700);
  g.fillStyle = '#e07856'; rr(g, 48, 250, 160, 60, 12); g.fill();
  tx(g, '平素より感謝', 128, 282, 22, '#fff6e8', 700);
});
const nbB = ct(256, 352, (g) => {
  g.fillStyle = '#f3ecdc'; g.fillRect(0,0,256,352);
  g.fillStyle = '#e07856'; g.fillRect(0,0,256,64);
  tx(g, 'キャンペーン', 128, 34, 32, '#fff6e8', 700);
  tx(g, '夜間セール', 128, 150, 42, '#b8543a', 800);
  tx(g, '20:00〜24:00', 128, 210, 26, '#3a4a60', 700);
  tx(g, '全品20%OFF', 128, 268, 30, '#b8543a', 800);
});
texPlane(0.52, 0.72, nbA, -3.655, 1.62, 0.86, -Math.PI/2, 0, 1.0);
texPlane(0.52, 0.72, nbB, -3.655, 1.62, 1.55, -Math.PI/2, 0, 1.0);
B(0.03, 0.05, 1.4, glow(0xffdfae, 1.2), -3.64, 2.08, 1.2);

const frostMat = new T.MeshBasicMaterial({ color:0xd8e6ee, transparent:true, opacity:0.5 });
P(0.7, 0.42, frostMat, -3.565, 2.5, 0.3, -Math.PI/2);
P(0.7, 0.42, frostMat, -3.565, 2.5, 2.5, -Math.PI/2);
Cy(0.045, 0.045, 3.3, M.steelD, -3.63, 1.8, 2.9);

const saleTex = ct(384, 384, (g) => {
  g.fillStyle = '#e07856'; g.beginPath(); g.arc(192,192,186,0,6.3); g.fill();
  g.strokeStyle = '#fff6e8'; g.lineWidth = 10;
  g.beginPath(); g.arc(192,192,168,0,6.3); g.stroke();
  tx(g, '本日限り', 192, 120, 52, '#fff6e8', 800);
  tx(g, '20%', 192, 200, 92, '#fff6e8', 800);
  tx(g, 'OFF', 192, 272, 56, '#fff6e8', 800);
});
texPlane(0.78, 0.78, saleTex, -2.7, 1.95, 2.965, 0, 0, 1.05);

const floorTex = ct(128, 128, (g, w, h) => {
  g.fillStyle = '#d9cfc0'; g.fillRect(0,0,w,h);
  g.strokeStyle = '#c4b8a2'; g.lineWidth = 4; g.strokeRect(0,0,w,h);
  for (let i=0;i<40;i++) {
    g.fillStyle = 'rgba(160,145,120,' + rnd(0.04,0.1).toFixed(2) + ')';
    g.fillRect(Math.random()*w, Math.random()*h, 2, 2);
  }
});
floorTex.wrapS = T.RepeatWrapping; floorTex.wrapT = T.RepeatWrapping;
const inShape = new T.Shape();
const inPts = [[-3.44,-2.94],[3.44,-2.94],[3.44,0.70],[1.20,2.94],[-3.44,2.94]];
inShape.moveTo(inPts[0][0], -inPts[0][1]);
for (let i=1;i<inPts.length;i++) inShape.lineTo(inPts[i][0], -inPts[i][1]);
const floorGeo = new T.ShapeGeometry(inShape);
floorGeo.rotateX(-Math.PI/2);
const floorMesh = new T.Mesh(floorGeo, new T.MeshToonMaterial({ map:floorTex, gradientMap:GRAD }));
floorMesh.position.y = 0.155;
floorMesh.receiveShadow = true;
floorMesh.userData.noOutline = true;
world.add(floorMesh);
const ceilGeo = new T.ShapeGeometry(inShape);
ceilGeo.rotateX(Math.PI/2);
const ceilMesh = new T.Mesh(ceilGeo, toon(0xf2ead6));
ceilMesh.position.y = 2.96;
world.add(ceilMesh);

const panelGlow = glow(0xfff1d8, 1.55);
for (const [px, pz] of [[-2.2,-1.9],[0,-1.9],[2.2,-1.9],[-2.2,0.9],[0,0.9],[2.2,0.9],[-2.2,2.3],[1.5,2.3]]) {
  const p = P(0.55, 1.05, panelGlow, px, 2.952, pz, 0, Math.PI/2);
  p.userData.noOutline = true;
}
B(0.9, 0.05, 0.34, M.ink2, -1.3, 2.93, 0.4);
B(0.9, 0.05, 0.34, M.ink2, 1.3, 2.93, 0.4);

const intLight1 = new T.PointLight(0xffd9a3, 15, 9, 2);
intLight1.position.set(0.5, 2.55, 0.6);
world.add(intLight1);
const intLight2 = new T.PointLight(0xffd9a3, 12, 9, 2);
intLight2.position.set(-1.2, 2.55, -1.7);
world.add(intLight2);
const doorSpill = new T.PointLight(0xffd2a0, 8, 6, 2);
doorSpill.position.set(3.15, 2.1, 3.05);
world.add(doorSpill);

B(2.7, 0.82, 0.72, M.white, -1.0, 0.55, -2.375);
B(2.86, 0.06, 0.8, M.wood, -1.0, 0.99, -2.375);
B(2.7, 0.16, 0.03, M.teal, -1.0, 0.44, -2.0);
B(2.7, 0.12, 0.7, M.ink2, -1.0, 0.2, -2.375);

B(0.44, 0.34, 0.36, M.ink, -1.75, 1.19, -2.42);
const regScr = P(0.34, 0.22, glow(0x9fd8ff, 1.25), -1.75, 1.44, -2.36, 0, -0.35);
regScr.userData.noOutline = true;
B(0.16, 0.05, 0.12, M.ink2, -1.45, 1.045, -2.24);

B(0.42, 0.5, 0.36, M.red, -2.12, 1.27, -2.42);
B(0.16, 0.07, 0.12, M.ink, -2.12, 1.13, -2.3);
Cy(0.035, 0.028, 0.045, M.offw, -2.32, 1.06, -2.26, 10);
Cy(0.035, 0.028, 0.045, M.offw, -2.32, 1.105, -2.26, 10);
Cy(0.035, 0.028, 0.045, M.offw, -2.24, 1.06, -2.2, 10);
const coffeeTex = ct(512, 320, (g) => {
  g.fillStyle = '#f3ecdc'; g.fillRect(0,0,512,320);
  g.fillStyle = '#fff6e8'; rr(g, 40, 70, 150, 180, 16); g.fill();
  g.strokeStyle = '#2f9e97'; g.lineWidth = 10; rr(g, 40, 70, 150, 180, 16); g.stroke();
  g.fillStyle = '#5a3a20'; g.fillRect(70, 200, 90, 34);
  tx(g, 'ブレンド', 256, 100, 52, '#1e3a5f', 800);
  tx(g, 'コーヒー', 256, 160, 52, '#1e3a5f', 800);
  tx(g, 'HOT / ICE', 115, 290, 30, '#3a4a60', 700);
  tx(g, '¥120', 350, 190, 88, '#e07856', 800);
  g.strokeStyle = 'rgba(90,58,32,0.5)'; g.lineWidth = 7;
  g.beginPath(); g.arc(100, 60, 14, 0, 6.3); g.stroke();
  g.beginPath(); g.arc(128, 48, 10, 0, 6.3); g.stroke();
  g.fillStyle = '#2f9e97'; g.fillRect(0, 300, 512, 20);
});
texPlane(0.85, 0.53, coffeeTex, -2.12, 2.3, -2.925, 0, 0, 1.3);

B(0.75, 0.42, 0.72, M.white, 0.72, 0.35, -2.375);
B(0.75, 0.52, 0.72, M.yellow, 0.72, 0.82, -2.375);
B(0.75, 0.05, 0.72, glow(0xffe8b0, 1.1), 0.72, 1.09, -2.375);
Cy(0.095, 0.095, 0.09, M.ink, 0.54, 1.16, -2.375, 12);
Cy(0.095, 0.095, 0.09, M.ink, 0.72, 1.16, -2.375, 12);
Cy(0.095, 0.095, 0.09, M.ink, 0.9, 1.16, -2.375, 12);
Cy(0.07, 0.07, 0.02, glow(0xffd070, 1.4), 0.72, 1.13, -2.375, 12);
const odenTex = ct(256, 128, (g) => {
  g.fillStyle = '#e8c05a'; rr(g, 8, 8, 240, 112, 18); g.fill();
  tx(g, 'おでん', 128, 64, 58, '#5a3a20', 800);
});
texPlane(0.6, 0.3, odenTex, 0.72, 1.42, -2.03, 0, 0, 1.05);

B(0.42, 0.3, 0.34, M.ink, -0.55, 1.17, -2.42);
const mwScr = P(0.3, 0.2, glow(0xbfe0d8, 1.0), -0.55, 1.2, -2.245, 0, 0);
mwScr.userData.noOutline = true;

const tobacTex = ct(512, 288, (g) => {
  g.fillStyle = '#20242e'; g.fillRect(0,0,512,288);
  g.strokeStyle = '#39414e'; g.lineWidth = 5;
  for (let r=0;r<3;r++) for (let c=0;c<6;c++) {
    rr(g, 18+c*82, 30+r*82, 66, 66, 8); g.stroke();
  }
  g.fillStyle = '#d9b13b';
  rr(g, 156, 0, 200, 26, 6); g.fill();
  tx(g, 'たばこ', 256, 15, 20, '#20242e', 700);
});
B(1.3, 0.75, 0.2, [M.ink, M.ink, M.ink, M.ink, new T.MeshBasicMaterial({ map:tobacTex }), M.ink], -1.9, 2.0, -2.9);

B(0.74, 1.94, 0.07, M.creamDim, 2.05, 1.11, -2.93);
B(0.6, 0.05, 0.05, M.steelD, 2.05, 1.02, -2.88);
const staffTex = ct(256, 64, (g) => {
  g.fillStyle = '#1e6b66'; rr(g, 6, 6, 244, 52, 10); g.fill();
  tx(g, 'スタッフルーム', 128, 33, 30, '#e8eef0', 700);
});
texPlane(0.5, 0.125, staffTex, 2.05, 1.72, -2.888, 0, 0, 1.0);

const atmTex = ct(384, 640, (g) => {
  g.fillStyle = '#1a2740'; g.fillRect(0,0,384,640);
  g.fillStyle = '#2f9e97'; g.fillRect(0,0,384,90);
  tx(g, 'ATM', 192, 48, 56, '#f3ecdc', 800);
  g.fillStyle = '#16324a'; rr(g, 40, 130, 304, 200, 14); g.fill();
  g.strokeStyle = '#4a90c0'; g.lineWidth = 5; rr(g, 40, 130, 304, 200, 14); g.stroke();
  g.fillStyle = '#7ab8d8';
  tx(g, 'ご利用いただけます', 192, 180, 28, '#7ab8d8', 700);
  g.fillRect(70, 230, 244, 10);
  g.fillRect(70, 260, 180, 10);
  g.fillStyle = '#39414e';
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) rr(g, 92+c*52, 380+r*52, 40, 40, 8), g.fill();
  g.fillStyle = '#10141c'; g.fillRect(60, 600, 264, 26);
});
B(0.58, 1.9, 0.6, M.ink, 3.02, 1.1, -2.35);
texPlane(0.5, 1.62, atmTex, 2.71, 1.12, -2.35, -Math.PI/2, 0, 1.15);

const postA = ct(384, 512, (g) => {
  g.fillStyle = '#e07856'; g.fillRect(0,0,384,512);
  tx(g, '新発売', 192, 120, 96, '#fff6e8', 800);
  tx(g, '激うま弁当', 192, 240, 60, '#fff6e8', 800);
  g.fillStyle = '#f3ecdc'; g.beginPath(); g.arc(192, 380, 84, 0, 6.3); g.fill();
  tx(g, '498円', 192, 380, 52, '#b8543a', 800);
});
const postB = ct(384, 512, (g) => {
  g.fillStyle = '#2f9e97'; g.fillRect(0,0,384,512);
  tx(g, 'ポイント', 192, 130, 78, '#f3ecdc', 800);
  tx(g, '2倍デー', 192, 250, 92, '#f3ecdc', 800);
  tx(g, '毎週金曜日', 192, 370, 40, '#d8f2ee', 700);
});
texPlane(0.62, 0.86, postA, -0.35, 2.12, -2.93, 0, 0, 1.12);
texPlane(0.62, 0.86, postB, 0.7, 2.08, -2.93, 0, 0, 1.12);

function strip(w, l, x, z, dx, dz, color, op = 1) {
  const ry = Math.atan2(-dx, -dz);
  const m = P(w, l, glow(color, op), x, 0.1585, z, ry, -Math.PI/2);
  m.userData.noOutline = true;
  return m;
}
strip(0.28, 1.7, 1.5, 1.1, -1, -1, 0x35c0b5, 0.95);
strip(0.28, 3.3, 0.1, -0.8, -1.8, -2.7, 0x35c0b5, 0.95);

B(0.42, 0.28, 0.32, M.yellow, 1.3, 0.29, -1.75);
B(0.42, 0.28, 0.32, M.yellow, 1.33, 0.57, -1.71, 0.25);
Cy(0.15, 0.12, 0.34, M.steelD, 0.6, 0.31, 2.4, 12);

function inst(geo, mat, items, parent = world) {
  const im = new T.InstancedMesh(geo, mat, items.length);
  const m4 = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler();
  const s = new T.Vector3(), p = new T.Vector3(), c = new T.Color();
  items.forEach((it, i) => {
    e.set(it.rx || 0, it.ry || 0, it.rz || 0);
    q.setFromEuler(e);
    p.set(it.x, it.y, it.z);
    const sc = it.s || 1;
    s.set(sc*(it.sx || 1), sc*(it.sy || 1), sc*(it.sz || 1));
    m4.compose(p, q, s);
    im.setMatrixAt(i, m4);
    if (it.c !== undefined) im.setColorAt(i, c.set(it.c));
  });
  if (items.length && items[0].c !== undefined) im.instanceColor.needsUpdate = true;
  im.frustumCulled = false;
  im.userData.noOutline = true;
  parent.add(im);
  return im;
}
function signTex(text, sub, bg, fg, w = 512, h = 128) {
  return ct(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0,0,w,h);
    tx(g, text, w/2, h/2 - (sub ? 12 : 0), h*0.56, fg, 800);
    if (sub) tx(g, sub, w/2, h/2 + h*0.3, h*0.22, fg, 700);
  });
}

const coolGlow = glow(0xbfe9ff, 1.32);
const drinkSign = signTex('飲み物', 'DRINKS', '#1e6b66', '#f3ecdc');
const bottleGeo = new T.CylinderGeometry(0.045, 0.045, 0.26, 10);
const bottles = [];
const drinkCols = ['#d8443c','#e88f3a','#e8d23a','#7ac04a','#4aa8c0','#4868d0','#c04a9a','#ece4d4','#8a5a3a','#3a8a5a'];
for (const zc of [-1.625, -0.475, 0.675]) {
  B(0.05, 1.8, 1.05, coolGlow, -3.4, 1.14, zc);
  B(0.74, 0.3, 1.13, M.ink2, -3.06, 0.29, zc);
  B(0.74, 0.1, 1.13, M.white, -3.06, 2.02, zc);
  B(0.74, 2.0, 0.04, M.white, -3.06, 1.14, zc - 0.545);
  B(0.74, 2.0, 0.04, M.white, -3.06, 1.14, zc + 0.545);
  for (const sy of [0.55, 0.95, 1.35, 1.75]) {
    B(0.6, 0.035, 1.05, M.steel, -3.14, sy, zc);
    for (let k=0;k<9;k++) {
      bottles.push({ x:-3.14, y:sy+0.15, z:zc-0.44+k*0.11, c:pick(drinkCols) });
    }
  }
  texPlane(1.05, 0.26, drinkSign, -2.73, 2.2, zc, Math.PI/2, 0, 1.25);
  P(0.5, 1.55, GLASS, -2.735, 1.25, zc - 0.265, Math.PI/2);
  P(0.5, 1.55, GLASS, -2.735, 1.25, zc + 0.265, Math.PI/2);
  B(0.03, 0.3, 0.03, M.steelD, -2.7, 1.25, zc - 0.03);
  B(0.03, 0.3, 0.03, M.steelD, -2.7, 1.25, zc + 0.03);
}
inst(bottleGeo, toon(0xffffff), bottles);

const iceCreamChest = new T.Group();
iceCreamChest.position.set(-2.92, 0, 1.78);
iceCreamChest.rotation.y = 0.12;
world.add(iceCreamChest);
B(1.22, 0.76, 0.75, M.white, 0, 0.52, 0, 0, iceCreamChest);
B(1.08, 0.06, 0.6, M.ink2, 0, 0.9, 0, 0, iceCreamChest);
P(0.5, 0.62, GLASS2, -0.28, 0.95, 0, 0, -0.12, iceCreamChest);
P(0.5, 0.62, GLASS2, 0.28, 0.95, 0, 0, -0.12, iceCreamChest);
const iceGeo = new T.BoxGeometry(0.16, 0.1, 0.12);
const iceCols = ['#e8a1b8','#a1d8e8','#f2e0a1','#c8e8a1','#e8d2b0'];
const ices = [];
for (let i=0;i<10;i++) ices.push({ x:rnd(-0.44,0.44), y:0.96, z:rnd(-0.2,0.2), ry:rnd(0,3), c:pick(iceCols) });
inst(iceGeo, toon(0xffffff), ices, iceCreamChest);
texPlane(0.85, 0.24, signTex('アイス', 'ICE CREAM', '#2a5f8a', '#e8f2f8'), 0, 0.72, 0.385, 0, 0, 1.2, iceCreamChest);

const snackSign = signTex('お菓子・スナック', 'SNACKS', '#e07856', '#fff6e8');
const noodleSign = signTex('カップめん・食品', 'FOODS', '#2a5f8a', '#e8f2f8');
const prodGeo = new T.BoxGeometry(0.15, 0.2, 0.1);
const prodCols = ['#e05a4a','#e8a13a','#e8d23a','#7ab84a','#4ab0b8','#4868d0','#985ac0','#d878a8','#ece4d4','#6a4a3a','#e07856','#5ac0a8'];
const prods = [];
for (const gz of [-1.35, -0.45]) {
  B(3.4, 0.16, 0.62, M.ink2, -0.2, 0.22, gz);
  B(3.4, 1.62, 0.05, M.steelD, -0.2, 1.02, gz);
  B(0.06, 1.5, 0.6, M.white, -1.88, 0.95, gz);
  B(0.06, 1.5, 0.6, M.white, 1.48, 0.95, gz);
  B(3.4, 0.2, 0.62, M.white, -0.2, 1.72, gz);
  for (const sy of [0.5, 0.83, 1.16, 1.49]) {
    B(3.36, 0.035, 0.56, M.steel, -0.2, sy, gz);
    for (const sz of [-0.24, 0.24]) {
      for (let k=0;k<16;k++) {
        if (Math.random() < 0.16) continue;
        prods.push({ x:-1.72+k*0.196, y:sy+0.115, z:gz+sz, ry:rnd(-0.12,0.12), s:rnd(0.85,1.12), c:pick(prodCols) });
      }
    }
  }
}
inst(prodGeo, toon(0xffffff), prods);
for (const [sgn, sz] of [[snackSign, -1.35], [noodleSign, -0.45]]) {
  const sm = new T.MeshBasicMaterial({ map:sgn, transparent:true, side:T.DoubleSide });
  sm.color.setScalar(1.12);
  const s = P(1.15, 0.3, sm, -0.2, 2.34, sz);
  s.userData.noOutline = true;
  Cy(0.012, 0.012, 0.52, M.steelD, -0.68, 2.72, sz, 6);
  Cy(0.012, 0.012, 0.52, M.steelD, 0.28, 2.72, sz, 6);
}

B(0.6, 1.2, 2.15, M.white, 3.05, 0.74, -0.625);
B(0.05, 0.98, 2.05, glow(0xcfe9f5, 1.1), 3.34, 0.76, -0.625);
P(2.1, 0.85, GLASS2, 2.78, 0.88, -0.625, Math.PI/2, 0.32);
const bentoGeo = new T.BoxGeometry(0.36, 0.11, 0.25);
const bentoCols = ['#e8b04a','#c05a4a','#4a90c0','#ece4d4','#7ab84a','#e88f6a'];
const bentos = [];
for (const sy of [0.45, 0.73, 1.01]) {
  B(0.52, 0.03, 2.0, M.steel, 3.06, sy, -0.625);
  for (let k=0;k<6;k++) {
    bentos.push({ x:3.04, y:sy+0.07, z:-1.5+k*0.36, ry:rnd(-0.06,0.06), c:pick(bentoCols) });
  }
}
inst(bentoGeo, toon(0xffffff), bentos);
texPlane(0.75, 0.26, signTex('お弁当', 'BENTO', '#c05a4a', '#fff6e8'), 2.68, 1.52, -0.625, -Math.PI/2, 0, 1.25);

const oniGrp = new T.Group();
oniGrp.position.set(1.5, 0, 2.12);
oniGrp.rotation.y = -0.55;
world.add(oniGrp);
B(0.85, 0.52, 0.6, M.white, 0, 0.4, 0, 0, oniGrp);
B(0.85, 0.16, 0.6, M.teal, 0, 0.72, 0, 0, oniGrp);
const oniShelfGeo = new T.BoxGeometry(0.8, 0.03, 0.52);
for (const sy of [0.68, 0.98, 1.28]) {
  const sm = new T.Mesh(oniShelfGeo, M.steel);
  sm.position.set(0, sy, 0.07);
  sm.rotation.x = 0.28;
  sm.castShadow = true;
  oniGrp.add(sm);
}
const oniGeo = new T.CylinderGeometry(0.125, 0.125, 0.085, 3);
const oniCols = ['#ece4d4','#f2ead8','#4a6a4a','#ece4d4','#d8d0c0','#e8dca8'];
const onis = [];
for (const sy of [0.68, 0.98, 1.28]) {
  for (let k=0;k<6;k++) {
    onis.push({ x:-0.3+k*0.12, y:sy+0.065, z:0.13, rz:Math.PI/2, ry:rnd(-0.15,0.15), c:pick(oniCols) });
  }
}
inst(oniGeo, toon(0xffffff), onis, oniGrp);
texPlane(0.72, 0.24, signTex('おにぎり', 'ONIGIRI', '#4a6a4a', '#f2ead8'), 0, 1.56, 0.1, 0, 0, 1.2, oniGrp);

const magGrp = new T.Group();
magGrp.position.set(-1.72, 0, 2.52);
magGrp.rotation.y = 0.18;
world.add(magGrp);
B(1.5, 0.5, 0.55, M.woodD, 0, 0.4, 0, 0, magGrp);
B(1.5, 0.1, 0.55, M.teal, 0, 0.69, 0, 0, magGrp);
const magShelfGeo = new T.BoxGeometry(1.4, 0.03, 0.48);
for (const my of [0.78, 1.08]) {
  const sm = new T.Mesh(magShelfGeo, M.steel);
  sm.position.set(0, my, -0.02);
  sm.rotation.x = -0.18;
  sm.castShadow = true;
  magGrp.add(sm);
}
const spineGeo = new T.BoxGeometry(0.04, 0.26, 0.18);
const spineCols = ['#8a4a3a','#3a5a8a','#5a7a4a','#8a8a3a','#6a3a6a','#a86a3a','#4a7a7a'];
const spines = [];
for (const my of [0.78, 1.08]) {
  for (let k=0;k<14;k++) {
    if (Math.random() < 0.14) continue;
    spines.push({ x:-0.63+k*0.096, y:my+0.14, z:0.02, c:pick(spineCols), s:rnd(0.85,1.1) });
  }
}
inst(spineGeo, toon(0xffffff), spines, magGrp);
const newsMat = toon(0xd8d4c8);
const news1 = P(0.44, 0.3, newsMat, -0.3, 1.235, 0.02, 0.1, -Math.PI/2, magGrp);
const news2 = P(0.44, 0.3, newsMat, 0.28, 1.235, 0.02, -0.15, -Math.PI/2, magGrp);
news1.userData.noOutline = true; news2.userData.noOutline = true;
texPlane(0.9, 0.24, signTex('雑誌・書籍', 'MAGAZINE', '#2a5f8a', '#e8f2f8'), 0, 1.42, 0.12, 0, 0, 1.15, magGrp);

for (const gz of [-1.35, -0.45]) {
  for (const sy of [0.5, 0.83, 1.16, 1.49]) {
    B(3.3, 0.045, 0.02, M.offw, -0.2, sy - 0.04, gz - 0.29);
    B(3.3, 0.045, 0.02, M.offw, -0.2, sy - 0.04, gz + 0.29);
  }
}

function vendTex(mode) {
  return ct(256, 512, (g) => {
    const hot = mode === 'hot';
    g.fillStyle = hot ? '#3a6ab8' : '#c8403a'; g.fillRect(0,0,256,512);
    tx(g, hot ? 'ドリンク' : 'ドリンク', 128, 34, 34, '#f3ecdc', 800);
    g.fillStyle = '#161a22'; g.fillRect(14, 60, 228, 34);
    tx(g, hot ? 'あたた〜い' : 'つめた〜い', 128, 78, 24, hot ? '#ffb46a' : '#7ad0e8', 800);
    g.fillStyle = hot ? '#fff0d8' : '#eaf6ff';
    rr(g, 16, 104, 224, 286, 12); g.fill();
    const canCols = hot ? ['#c8403a','#e8a13a','#8a5a3a','#e8d23a','#b8681a'] : ['#4868d0','#4aa8c0','#7ac04a','#d8443c','#e8d23a','#c04a9a'];
    for (let r=0;r<5;r++) for (let c=0;c<4;c++) {
      const cx = 30+c*54, cy = 118+r*54;
      g.fillStyle = pick(canCols);
      rr(g, cx, cy, 40, 46, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      rr(g, cx+5, cy+5, 10, 34, 4); g.fill();
      g.fillStyle = '#2a2f38';
      rr(g, cx, cy+40, 40, 13, 3); g.fill();
      g.fillStyle = '#e8eef2';
      tx(g, '¥' + (120 + Math.floor(Math.random()*4)*10), cx+20, cy+47, 11, '#e8eef2', 700);
    }
    g.fillStyle = '#161a22'; rr(g, 16, 402, 224, 56, 10); g.fill();
    g.fillStyle = '#0e1118'; rr(g, 40, 414, 176, 32, 8); g.fill();
    g.fillStyle = '#2a2f38'; rr(g, 16, 466, 140, 38, 8); g.fill();
    g.fillStyle = '#10141c';
    rr(g, 170, 466, 70, 38, 8); g.fill();
    g.fillStyle = '#d9b13b'; g.beginPath(); g.arc(205, 485, 11, 0, 6.3); g.fill();
  });
}
const vendA = new T.MeshBasicMaterial({ map:vendTex('cold') });
const vendB = new T.MeshBasicMaterial({ map:vendTex('hot') });
function vending(x, z, ry, bodyMat, frontMat) {
  B(1.12, 0.12, 0.76, M.ink2, x, 0.2, z, ry);
  B(1.05, 1.94, 0.68, [bodyMat, bodyMat, bodyMat, bodyMat, frontMat, bodyMat], x, 1.23, z, ry);
  B(1.05, 0.1, 0.66, glow(0xfff2d8, 1.35), x, 2.25, z, ry);
  const fx = x + Math.sin(ry)*0.62, fz = z + Math.cos(ry)*0.62;
  disc(1.05, 0xffe8c0, fx, 0.149, fz, 0.34);
}
vending(4.02, -2.18, 0.72, M.red, vendA);
vending(4.02, -3.42, 0.72, M.navy, vendB);
const vendLight = new T.PointLight(0xfff0d8, 7, 5, 2);
vendLight.position.set(4.55, 1.6, -2.8);
world.add(vendLight);

function bike(x, z, ry, lean, frameMat) {
  const g = new T.Group();
  g.position.set(x, 0.17, z);
  g.rotation.order = 'YXZ';
  g.rotation.y = ry;
  g.rotation.z = lean;
  world.add(g);
  const wheelGeo = new T.TorusGeometry(0.3, 0.032, 10, 26);
  const wMat = M.ink2;
  const w1 = new T.Mesh(wheelGeo, wMat); w1.position.set(0, 0.31, 0.53); w1.castShadow = true; g.add(w1);
  const w2 = new T.Mesh(wheelGeo, wMat); w2.position.set(0, 0.31, -0.53); w2.castShadow = true; g.add(w2);
  rod(0, 0.3, -0.12, 0, 0.82, -0.4, 0.028, frameMat, g);
  rod(0, 0.3, -0.12, 0, 0.55, 0.5, 0.028, frameMat, g);
  rod(0, 0.82, -0.4, 0, 0.62, 0.5, 0.026, frameMat, g);
  rod(0, 0.55, 0.5, 0, 0.31, 0.53, 0.024, frameMat, g);
  rod(0, 0.62, 0.5, 0, 0.8, 0.56, 0.024, frameMat, g);
  rod(-0.24, 0.8, 0.56, 0.24, 0.8, 0.56, 0.022, M.ink2, g);
  rod(0.05, 0.3, -0.12, 0.05, 0.31, -0.53, 0.018, frameMat, g);
  rod(-0.05, 0.3, -0.12, -0.05, 0.31, -0.53, 0.018, frameMat, g);
  rod(0.05, 0.82, -0.4, 0.05, 0.31, -0.53, 0.018, frameMat, g);
  rod(-0.05, 0.82, -0.4, -0.05, 0.31, -0.53, 0.018, frameMat, g);
  B(0.22, 0.05, 0.32, M.ink2, 0, 0.86, -0.44, 0, g);
  const crank = new T.Mesh(new T.CylinderGeometry(0.085, 0.085, 0.03, 14), M.steelD);
  crank.rotation.z = Math.PI/2;
  crank.position.set(0.05, 0.3, -0.12);
  crank.castShadow = true;
  g.add(crank);
  B(0.14, 0.03, 0.07, M.ink2, 0.14, 0.38, -0.12, 0, g);
  B(0.14, 0.03, 0.07, M.ink2, -0.04, 0.22, -0.12, 0, g);
  const fendGeo = new T.TorusGeometry(0.345, 0.026, 8, 16, 1.9);
  const f1 = new T.Mesh(fendGeo, frameMat);
  f1.position.set(0, 0.31, 0.53); f1.rotation.z = 0.62; f1.castShadow = true; g.add(f1);
  const f2 = new T.Mesh(new T.TorusGeometry(0.345, 0.026, 8, 16, 2.3), frameMat);
  f2.position.set(0, 0.31, -0.53); f2.rotation.z = 2.35; f2.castShadow = true; g.add(f2);
  B(0.34, 0.22, 0.42, M.grayD, 0, 0.92, 0.86, 0, g);
  B(0.37, 0.03, 0.45, M.ink2, 0, 1.04, 0.86, 0, g);
  B(0.22, 0.13, 0.28, M.coral, 0.03, 0.9, 0.86, 0.1, g);
  rod(0, 0.3, -0.2, 0.17, 0.03, -0.38, 0.016, M.ink2, g);
  B(0.07, 0.05, 0.05, glow(0xffe8b0, 1.5), 0, 0.74, 0.79, 0, g);
  B(0.05, 0.035, 0.02, glow(0xd84040, 1.5), 0, 0.86, -0.6, 0, g);
  return g;
}
bike(-1.78, 4.16, 0.18, -0.09, M.red);
bike(-6.9, -3.78, -1.3, 0.12, M.steelD);

const vendFix = vendLight;
vendFix.position.set(4.9, 1.5, -2.3);

Cy(0.27, 0.24, 0.76, M.ink2, 3.98, 0.52, 1.28);
const umRim = new T.Mesh(new T.TorusGeometry(0.27, 0.032, 8, 18), M.steelD);
umRim.rotation.x = Math.PI/2;
umRim.position.set(3.98, 0.9, 1.28);
umRim.castShadow = true;
world.add(umRim);
const umCols = [0xdfe8f0, 0x7fb0e8, 0xe88f92];
[[3.9,1.2,0.08],[4.02,1.36,-0.06],[4.09,1.21,0.12]].forEach((u, i) => {
  Cy(0.016, 0.016, 0.9, M.woodD, u[0], 0.63, u[1]);
  const cone = new T.Mesh(new T.ConeGeometry(0.38, 0.32, 12), toon(umCols[i]));
  cone.position.set(u[0], 1.06, u[1]);
  cone.rotation.z = u[2];
  cone.castShadow = true;
  world.add(cone);
  Cy(0.012, 0.012, 0.1, M.ink2, u[0] + Math.sin(u[2])*0.05, 1.24, u[1]);
});

for (const [bx, bz] of [[4.68, 0.52], [4.68, 1.1]]) {
  Cy(0.26, 0.23, 0.8, toon(0x546a76), bx, 0.54, bz);
  const rim = new T.Mesh(new T.TorusGeometry(0.26, 0.03, 8, 16), M.steelD);
  rim.rotation.x = Math.PI/2;
  rim.position.set(bx, 0.94, bz);
  world.add(rim);
  const lid = new T.Mesh(new T.CylinderGeometry(0.27, 0.27, 0.05, 16), toon(0x546a76));
  lid.position.set(bx, 0.965, bz);
  lid.castShadow = true;
  world.add(lid);
}
Cy(0.26, 0.23, 0.8, toon(0x3a6a4a), -5.3, 0.43, -3.72);

const bagGeo = new T.SphereGeometry(0.3, 9, 7);
[[-1.1,-3.78,0.32,0x1c2027],[-1.45,-3.68,0.26,0x1c2027],[-0.85,-3.66,0.24,0x1c2027],[-1.25,-3.9,0.22,0xcfd4da]].forEach((b, i) => {
  const m = new T.Mesh(bagGeo, toon(b[3]));
  m.scale.set(b[2]/0.3, b[2]/0.75, b[2]/0.32);
  m.position.set(b[0], 0.035 + b[2]*0.68, b[1]);
  m.rotation.y = i * 1.3;
  m.castShadow = true;
  world.add(m);
  Cy(0.04, 0.05, 0.07, toon(b[3]), b[0], 0.035 + b[2]*1.36, b[1], 6);
});

for (let k=0;k<7;k++) B(0.045, 0.64, 0.045, M.green, -3.1+k*0.655, 0.465, 4.02);
B(3.99, 0.05, 0.05, M.green, -1.13, 0.78, 4.02);
B(3.99, 0.04, 0.04, M.green, -1.13, 0.42, 4.02);

const rs1 = ct(512, 128, (g) => {
  g.fillStyle = '#1a4a8a'; rr(g, 6, 6, 500, 116, 18); g.fill();
  g.strokeStyle = '#e8eef2'; g.lineWidth = 6; rr(g, 6, 6, 500, 116, 18); g.stroke();
  tx(g, '蛍坂通り', 300, 64, 62, '#f3f6fa', 800);
  g.fillStyle = '#f3f6fa';
  g.beginPath(); g.moveTo(60, 64); g.lineTo(110, 38); g.lineTo(110, 90); g.closePath(); g.fill();
  g.fillRect(105, 56, 70, 16);
});
const rs2 = ct(512, 128, (g) => {
  g.fillStyle = '#1a4a8a'; rr(g, 6, 6, 500, 116, 18); g.fill();
  g.strokeStyle = '#e8eef2'; g.lineWidth = 6; rr(g, 6, 6, 500, 116, 18); g.stroke();
  tx(g, '銀杏通り', 212, 64, 62, '#f3f6fa', 800);
  g.fillStyle = '#f3f6fa';
  g.fillRect(298, 56, 70, 16);
  g.beginPath(); g.moveTo(452, 64); g.lineTo(402, 38); g.lineTo(402, 90); g.closePath(); g.fill();
});
Cy(0.042, 0.052, 3.05, M.steelD, 4.3, 1.67, 4.55);
const rsp1 = new T.MeshBasicMaterial({ map:rs1, transparent:true, side:T.DoubleSide });
rsp1.color.setScalar(0.9);
const rsp2 = new T.MeshBasicMaterial({ map:rs2, transparent:true, side:T.DoubleSide });
rsp2.color.setScalar(0.9);
P(1.28, 0.32, rsp1, 4.3, 2.86, 4.55, Math.PI/4);
P(1.28, 0.32, rsp2, 4.3, 2.42, 4.55, Math.PI/4 - 0.22);

const grGeo1 = new T.TorusGeometry(1.05, 0.045, 8, 26, Math.PI/2);
const grGeo2 = new T.TorusGeometry(1.05, 0.035, 8, 26, Math.PI/2);
function arcRail(geo, y) {
  const m = new T.Mesh(geo, M.yellow);
  m.rotation.order = 'YXZ';
  m.rotation.x = -Math.PI/2;
  m.rotation.y = Math.PI/2;
  m.position.set(6, y, 6);
  m.castShadow = true;
  world.add(m);
}
arcRail(grGeo1, 0.62);
arcRail(grGeo2, 0.34);
for (const [px, pz] of [[6,4.95],[5.26,5.26],[4.95,6]]) {
  Cy(0.05, 0.05, 0.72, M.yellow, px, 0.5, pz);
  B(0.12, 0.07, 0.12, M.ink2, px, 0.55, pz);
  B(0.12, 0.07, 0.12, M.ink2, px, 0.3, pz);
  const ref = new T.Mesh(new T.SphereGeometry(0.035, 8, 8), glow(0xd84848, 1.6));
  ref.position.set(px, 0.72, pz);
  world.add(ref);
}

for (const [bx, bz] of [[-7.25, 3.95], [-4.75, 3.95]]) {
  Cy(0.1, 0.11, 0.6, M.concP, bx, 0.44, bz);
  B(0.23, 0.09, 0.23, M.yellow, bx, 0.5, bz);
}

function lamp(x, z, ax, az, colHex, intensity) {
  Cy(0.16, 0.2, 0.34, M.ink2, x, 0.31, z);
  Cy(0.07, 0.1, 5.3, M.ink2, x, 3.13, z);
  const al = Math.hypot(ax, az);
  const nx = ax/al, nz = az/al;
  const hx = x + nx*0.95, hz = z + nz*0.95;
  rod(x, 5.55, z, hx, 5.36, hz, 0.05, M.ink2);
  const ry = Math.atan2(nx, nz);
  B(0.36, 0.13, 0.62, M.ink2, hx, 5.32, hz, ry);
  const bulb = P(0.3, 0.52, glow(colHex, 1.8), hx, 5.245, hz, ry, Math.PI/2);
  bulb.userData.noOutline = true;
  const cone = new T.Mesh(
    new T.ConeGeometry(1.15, 4.5, 18, 1, true),
    new T.MeshBasicMaterial({ color:colHex, transparent:true, opacity:0.05, blending:T.AdditiveBlending, depthWrite:false })
  );
  cone.position.set(hx, 3.0, hz);
  cone.userData.noOutline = true;
  world.add(cone);
  disc(2.3, colHex, hx, 0.052, hz, 0.38);
  const pl = new T.PointLight(colHex, intensity, 10, 2);
  pl.position.set(hx, 5.0, hz);
  world.add(pl);
  return { pl, hx, hz };
}
lamp(4.7, 5.7, 0.75, 0.75, 0xffb46a, 24);
lamp(4.75, -7.6, 1, 0, 0xd6e6ff, 20);

Cy(0.07, 0.09, 4.7, M.ink2, 5.85, 2.49, 5.85);
Cy(0.14, 0.17, 0.3, M.ink2, 5.85, 0.29, 5.85);
rod(5.85, 4.45, 5.85, 6.85, 4.28, 6.85, 0.05, M.ink2);
const sigRy = -Math.PI*0.75;
B(0.3, 0.92, 0.22, M.ink, 6.85, 3.95, 6.85, sigRy);
const sigN = [Math.sin(sigRy), Math.cos(sigRy)];
const mastBulbs = [];
[['red', 4.3, 0xff4838], ['yellow', 3.95, 0xffc838], ['green', 3.6, 0x58d868]].forEach((b) => {
  const mat = new T.MeshBasicMaterial({ color:new T.Color(b[2]).multiplyScalar(2.2) });
  const s = new T.Mesh(new T.SphereGeometry(0.075, 10, 10), mat);
  s.position.set(6.85 + sigN[0]*0.13, b[1], 6.85 + sigN[1]*0.13);
  world.add(s);
  const hm = new T.MeshBasicMaterial({ map:discTex, color:b[2], transparent:true, opacity:0.55, blending:T.AdditiveBlending, depthWrite:false });
  const h = P(0.34, 0.34, hm, 6.85 + sigN[0]*0.24, b[1], 6.85 + sigN[1]*0.24, sigRy);
  h.userData.noOutline = true;
  mastBulbs.push({ mat, halo:hm, on:new T.Color(b[2]).multiplyScalar(2.2), off:new T.Color(0x1a2028), kind:b[0] });
  B(0.26, 0.05, 0.2, M.ink, 6.85 + sigN[0]*0.06, b[1] + 0.11, 6.85 + sigN[1]*0.06, sigRy);
});

function pedTex(mode) {
  return ct(128, 128, (g) => {
    g.fillStyle = '#101820'; g.fillRect(0,0,128,128);
    const c = mode === 'walk' ? '#58d868' : '#e85848';
    g.fillStyle = c;
    g.beginPath(); g.arc(64, 34, 13, 0, 6.3); g.fill();
    g.lineWidth = 9; g.strokeStyle = c; g.lineCap = 'round';
    g.beginPath(); g.moveTo(64,47); g.lineTo(64,80); g.stroke();
    if (mode === 'walk') {
      g.beginPath(); g.moveTo(64,54); g.lineTo(42,66); g.stroke();
      g.beginPath(); g.moveTo(64,54); g.lineTo(86,66); g.stroke();
      g.beginPath(); g.moveTo(64,80); g.lineTo(48,104); g.stroke();
      g.beginPath(); g.moveTo(64,80); g.lineTo(82,102); g.stroke();
    } else {
      g.beginPath(); g.moveTo(50,56); g.lineTo(78,56); g.stroke();
      g.beginPath(); g.moveTo(64,80); g.lineTo(52,104); g.stroke();
      g.beginPath(); g.moveTo(64,80); g.lineTo(76,104); g.stroke();
    }
  });
}
const pedWalk = new T.MeshBasicMaterial({ map:pedTex('walk'), transparent:true });
const pedStand = new T.MeshBasicMaterial({ map:pedTex('stand'), transparent:true });
pedWalk.color.setScalar(1.3);
pedStand.color.setScalar(1.2);
B(0.26, 0.32, 0.15, M.ink, 5.85 + sigN[0]*0.16, 2.75, 5.85 + sigN[1]*0.16, sigRy);
const pedW = P(0.2, 0.24, pedWalk, 5.85 + sigN[0]*0.245, 2.75, 5.85 + sigN[1]*0.245, sigRy);
const pedS = P(0.2, 0.24, pedStand, 5.85 + sigN[0]*0.243, 2.75, 5.85 + sigN[1]*0.243, sigRy);
pedW.userData.noOutline = true;
pedS.userData.noOutline = true;

Cy(0.05, 0.06, 4.1, M.ink2, 5.42, 2.05, -9.8);
rod(5.42, 3.95, -9.8, 6.15, 3.8, -9.8, 0.04, M.ink2);
B(0.24, 0.72, 0.2, M.ink, 6.15, 3.62, -9.8, 0);
const distBulbs = [];
[['red', 3.86, 0xff4838], ['yellow', 3.62, 0xffc838], ['green', 3.38, 0x58d868]].forEach((b) => {
  const mat = new T.MeshBasicMaterial({ color:new T.Color(b[2]).multiplyScalar(1.9) });
  const s = new T.Mesh(new T.SphereGeometry(0.055, 8, 8), mat);
  s.position.set(6.15, b[1], -9.8 + 0.105);
  world.add(s);
  distBulbs.push({ mat, on:new T.Color(b[2]).multiplyScalar(1.9), off:new T.Color(0x1a2028), kind:b[0] });
});
const trafficGlow = disc(0.95, 0xff4838, 7.7, 0.058, 7.7, 0.26);

const wireMat = new T.MeshBasicMaterial({ color:0x16181f });
Cy(0.1, 0.14, 7.7, M.concP, 5.55, 3.99, 2.35);
Cy(0.12, 0.16, 0.25, M.concP, 5.55, 7.85, 2.35);
B(0.09, 0.09, 1.5, M.ink2, 5.55, 7.15, 2.35);
B(1.5, 0.08, 0.08, M.ink2, 5.55, 6.8, 2.35);
const insMat = toon(0xd8dce4);
for (const off of [-0.5, 0, 0.5]) {
  Cy(0.035, 0.045, 0.1, insMat, 5.55, 7.24, 2.35 + off, 8);
  Cy(0.035, 0.045, 0.1, insMat, 5.55 + off, 6.89, 2.35, 8);
}
B(0.55, 0.72, 0.42, M.steelD, 5.87, 5.2, 2.35);
for (let i=0;i<5;i++) B(0.58, 0.03, 0.45, M.steelD, 5.87, 4.92 + i*0.13, 2.35);
const polePlate = ct(192, 128, (g) => {
  g.fillStyle = '#2a3a55'; g.fillRect(0,0,192,128);
  g.strokeStyle = '#e8eef2'; g.lineWidth = 4; g.strokeRect(6,6,180,116);
  tx(g, '蛍坂', 96, 42, 40, '#e8eef2', 800);
  tx(g, '3丁目', 96, 88, 40, '#e8eef2', 800);
});
texPlane(0.42, 0.3, polePlate, 5.44, 2.1, 2.24, -2.356, 0, 0.9);

Cy(0.09, 0.12, 7.0, M.concP, 5.55, 3.64, -6.9);
B(0.09, 0.09, 1.3, M.ink2, 5.55, 6.95, -6.9);
for (const off of [-0.45, 0, 0.45]) Cy(0.035, 0.045, 0.1, insMat, 5.55, 7.04, -6.9 + off, 8);
B(0.08, 0.7, 0.08, M.ink2, -8.25, 7.05, 3.45);

for (const off of [-0.5, 0, 0.5]) {
  wire(new T.Vector3(5.55, 7.24, 2.35 + off), new T.Vector3(5.55, 7.05, -6.9 + off), 0.55, wireMat);
}
for (const off of [-0.5, 0, 0.5]) {
  wire(new T.Vector3(5.55 + off, 6.89, 2.35), new T.Vector3(-8.25 + off, 7.32, 3.45), 0.8, wireMat);
}
for (const off of [-0.28, 0.28]) {
  wire(new T.Vector3(5.55 + off, 7.04, -6.9), new T.Vector3(5.55 + off, 6.85, -10.7), 0.25, wireMat);
}

const conduitPts = [
  new T.Vector3(5.8, 4.85, 2.3),
  new T.Vector3(4.8, 3.7, 1.9),
  new T.Vector3(3.78, 2.3, 1.28),
  new T.Vector3(3.68, 1.7, 1.08)
];
const conduit = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(conduitPts), 24, 0.03, 6), M.ink2);
conduit.userData.noOutline = true;
world.add(conduit);
B(0.12, 0.32, 0.2, M.steelD, 3.6, 1.62, 1.0);

const darkWin = toon(0x151d2a);
function winBox(x, y, z, mat, w = 0.62, h = 0.86, ry = 0) {
  B(w + 0.14, h + 0.14, 0.1, M.ink2, x, y, z, ry);
  const pane = B(w, h, 0.12, mat, x, y, z, ry);
  return pane;
}
const tvMat = new T.MeshBasicMaterial({ color:new T.Color(0x5a86c8).multiplyScalar(1.1) });

B(14, 7.8, 6.15, M.navyD, -3.5, 4.04, -7.425);
B(14.3, 0.4, 6.45, M.ink2, -3.5, 8.0, -7.425);
winBox(3.56, 2.3, -9.5, tvMat);
winBox(3.56, 2.3, -7.9, darkWin);
winBox(3.56, 5.5, -9.5, darkWin);
const warmWin = glow(0xffd9a0, 1.3);
winBox(3.56, 5.5, -7.9, warmWin);
winBox(3.56, 5.5, -6.3, darkWin);
winBox(3.56, 2.3, -6.3, glow(0xffd9a0, 1.15));
B(0.1, 2.0, 0.95, M.ink2, 3.56, 1.14, -5.1);
texPlane(0.6, 0.85, ct(256, 128, (g) => {
  g.fillStyle = '#f3ecdc'; g.fillRect(0,0,256,128);
  tx(g, '若葉ハイツ', 128, 64, 52, '#2a5f8a', 800);
}), 3.62, 2.35, -5.1, Math.PI/2, 0, 0.9);
B(0.16, 0.08, 1.1, M.woodD, 3.6, 2.2, -5.1);
rod(3.6, 0.3, -4.5, 3.6, 5.4, -4.5, 0.035, M.steelD);
rod(3.6, 0.3, -8.9, 3.6, 5.4, -8.9, 0.035, M.steelD);
B(0.5, 0.4, 0.3, M.steelD, 3.75, 5.0, -4.5);
Cy(0.72, 0.72, 1.05, M.steel, -6, 8.6, -8.6, 16);
for (const [lx, lz] of [[-6.5,-9.1],[-5.5,-9.1],[-6.5,-8.1],[-5.5,-8.1]]) {
  rod(lx, 8.05, lz, lx, 8.1, lz, 0.035, M.steelD);
}
rod(-6, 8.08, -8.6, -6, 9.3, -8.6, 0.026, M.steelD);
rod(0.6, 8.05, -6.2, 0.6, 9.6, -6.2, 0.02, M.ink2);
rod(0.75, 9.3, -6.2, 0.45, 9.5, -6.2, 0.014, M.ink2);

winBox(-6.8, 2.6, -4.32, darkWin, 0.7, 0.9);
winBox(-3.4, 5.2, -4.32, darkWin, 0.7, 0.9);
B(0.1, 2.15, 1.75, M.steelD, -6.8, 1.18, -4.35);
rod(-6.0, 0.2, -4.38, -6.0, 2.3, -4.38, 0.025, M.steelD);
rod(-7.6, 0.2, -4.38, -7.6, 2.3, -4.38, 0.025, M.steelD);
for (let i=0;i<7;i++) B(1.7, 0.045, 0.05, M.grayD, -6.8, 0.35+i*0.31, -4.28);
B(0.12, 0.5, 1.9, M.ink2, -6.8, 2.6, -4.41);
texPlane(1.7, 0.42, ct(512, 128, (g) => {
  g.fillStyle = '#2a1f1a'; g.fillRect(0,0,512,128);
  g.strokeStyle = '#d9b13b'; g.lineWidth = 5; g.strokeRect(8,8,496,112);
  tx(g, '酒の さかや', 256, 66, 56, '#e8c890', 800);
}), -6.8, 2.6, -4.48, 0, 0, 0.55);
B(0.55, 0.45, 0.32, M.steelD, -2.2, 4.4, -4.5);
Cy(0.035, 0.035, 7.6, M.steelD, -9.5, 3.9, -4.38, 8);

B(2.2, 6.6, 7.85, toon(0x2b3342), -9.4, 3.44, -0.425);
B(2.5, 0.4, 8.15, M.ink2, -9.4, 7.4, -0.425);
winBox(-10.0, 5.3, 3.56, darkWin, 0.56, 0.8);
winBox(-9.4, 5.3, 3.56, glow(0xffd9a0, 1.25), 0.56, 0.8);
winBox(-8.8, 5.3, 3.56, darkWin, 0.56, 0.8);
B(0.12, 2.0, 0.9, M.ink2, -9.4, 1.14, 3.56);
texPlane(0.66, 0.2, ct(256, 64, (g) => {
  g.fillStyle = '#2a3a55'; g.fillRect(0,0,256,64);
  tx(g, 'コーポ銀杏', 128, 34, 34, '#e8eef2', 700);
}), -9.4, 2.35, 3.63, 0, 0, 0.85);
rod(-8.7, 0.3, 3.62, -8.7, 5.9, 3.62, 0.032, M.steelD);
winBox(-8.26, 4.9, -0.4, darkWin, 0.5, 0.7, Math.PI/2);
Cy(0.4, 0.4, 0.7, M.steel, -9.9, 7.9, -0.4, 12);
rod(-9.0, 7.55, 1.6, -9.0, 8.9, 1.6, 0.018, M.ink2);

function acUnit(x, z, spinning) {
  B(0.08, 0.28, 0.08, M.ink2, x - 0.35, 0.175, z);
  B(0.08, 0.28, 0.08, M.ink2, x + 0.35, 0.175, z);
  B(0.92, 0.72, 0.44, M.steelD, x, 0.645, z);
  rod(x, 1.0, z, x + 0.2, 2.5, z + 0.28, 0.03, M.steelD);
  const ft = new T.MeshBasicMaterial({ map:fanTex });
  const fd = P(0.58, 0.58, ft, x, 0.68, z - 0.225, Math.PI, 0);
  fd.userData.noOutline = true;
  B(0.64, 0.02, 0.012, M.grayD, x, 0.56, z - 0.228);
  B(0.64, 0.02, 0.012, M.grayD, x, 0.68, z - 0.228);
  B(0.64, 0.02, 0.012, M.grayD, x, 0.8, z - 0.228);
  if (spinning) {
    const fg = new T.Group();
    fg.position.set(x, 0.68, z - 0.235);
    world.add(fg);
    for (let k=0;k<3;k++) {
      const piv = new T.Group();
      piv.rotation.z = k * 2.094;
      fg.add(piv);
      B(0.26, 0.055, 0.014, M.grayD, 0.15, 0, 0, 0, piv);
    }
    return fg;
  }
  return null;
}
const alleyFan = acUnit(0.7, -3.3, true);
acUnit(-1.25, -3.32, false);

Cy(0.13, 0.13, 0.78, toon(0xd8dce2), 2.05, 0.425, -3.62, 12);
Cy(0.13, 0.13, 0.78, toon(0xd8dce2), 2.32, 0.425, -3.62, 12);
Cy(0.05, 0.05, 0.1, M.red, 2.05, 0.85, -3.62, 8);
Cy(0.05, 0.05, 0.1, M.red, 2.32, 0.85, -3.62, 8);

B(0.85, 1.9, 0.07, M.creamDim, 2.2, 1.09, -3.035);
B(1.05, 0.06, 0.55, M.tealDeep, 2.2, 2.14, -3.32);
rod(1.75, 2.11, -3.32, 1.75, 2.17, -3.06, 0.02, M.steelD);
rod(2.65, 2.11, -3.32, 2.65, 2.17, -3.06, 0.02, M.steelD);
B(0.42, 0.34, 0.42, toon(0x4a6a92), 1.45, 0.21, -3.55);
B(0.42, 0.34, 0.42, toon(0x4a6a92), 1.5, 0.55, -3.58, 0.2);

disc(1.5, 0xffd2a0, 3.1, 0.152, 2.6, 0.5);
disc(1.3, 0x9fc8e0, 4.4, 0.152, -0.6, 0.28);
disc(2.4, 0xffd9a8, -1.0, 0.15, 3.98, 0.3);

const _outMats = {};
function outlineMat(t) {
  if (_outMats[t]) return _outMats[t];
  const m = new T.ShaderMaterial({
    uniforms: { uT: { value: t } },
    side: T.BackSide,
    vertexShader: [
      'uniform float uT;',
      'void main(){',
      '  vec3 p = position + normal*uT;',
      '  #ifdef USE_INSTANCING',
      '    gl_Position = projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.0);',
      '  #else',
      '    gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);',
      '  #endif',
      '}'
    ].join('\n'),
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.016,0.023,0.05,1.0); }'
  });
  _outMats[t] = m;
  return m;
}
const outlineTargets = [];
world.traverse(o => {
  if (o.userData.noOutline || o.isReflector) return;
  if (o.isInstancedMesh) { outlineTargets.push({ im:o }); return; }
  if (!o.isMesh) return;
  const mat = o.material;
  const arr = Array.isArray(mat) ? mat : [mat];
  if (arr.some(mm => mm.transparent || mm.isShaderMaterial)) return;
  const gt = o.geometry.type;
  if (gt === 'PlaneGeometry' || gt === 'RingGeometry' || gt === 'ShapeGeometry') return;
  outlineTargets.push({ mesh:o });
});
for (const t of outlineTargets) {
  if (t.mesh) {
    const hull = new T.Mesh(t.mesh.geometry, outlineMat(t.mesh.userData.outlineT || 0.026));
    t.mesh.add(hull);
  } else {
    const src = t.im;
    const hull = new T.InstancedMesh(src.geometry, outlineMat(src.userData.outlineT || 0.02), src.count);
    hull.instanceMatrix = src.instanceMatrix;
    hull.frustumCulled = false;
    src.parent.add(hull);
  }
}

const RAIN_N = 850;
const rainPos = new Float32Array(RAIN_N*6);
const rainSeed = new Float32Array(RAIN_N*2);
const rainTip = new Float32Array(RAIN_N*2);
for (let i=0;i<RAIN_N;i++) {
  let x, z, tries = 0;
  do { x = rnd(-11.5, 11.5); z = rnd(-11.5, 11.5); tries++; }
  while (tries < 10 && x > -3.85 && x < 4.78 && z > -3.3 && z < 4.35);
  const s = Math.random();
  for (let v=0;v<2;v++) {
    const idx = i*2 + v;
    rainPos[idx*3] = x; rainPos[idx*3+1] = 0; rainPos[idx*3+2] = z;
    rainSeed[idx] = s; rainTip[idx] = v;
  }
}
const rainGeo = new T.BufferGeometry();
rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
rainGeo.setAttribute('aSeed', new T.BufferAttribute(rainSeed, 1));
rainGeo.setAttribute('aTip', new T.BufferAttribute(rainTip, 1));
const rainTime = { value: 0 };
const rainMat = new T.ShaderMaterial({
  uniforms: { uTime: rainTime, uH: { value: 13 } },
  transparent: true, depthWrite: false, blending: T.AdditiveBlending,
  vertexShader: [
    'attribute float aSeed;',
    'attribute float aTip;',
    'uniform float uTime;',
    'uniform float uH;',
    'varying float vA;',
    'void main(){',
    '  float sp = 5.0 + 5.0*fract(aSeed*7.31);',
    '  float f = fract(aSeed*13.7 + uTime*sp/uH);',
    '  vec3 p = position;',
    '  p.y = (1.0-f)*uH - aTip*0.6;',
    '  p.x += aTip*0.13;',
    '  vA = (0.3+0.5*fract(aSeed*3.7)) * smoothstep(0.0,0.08,f) * smoothstep(1.0,0.92,f);',
    '  gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);',
    '}'
  ].join('\n'),
  fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(0.62,0.75,0.95, vA*0.5); }'
});
const rain = new T.LineSegments(rainGeo, rainMat);
rain.frustumCulled = false;
world.add(rain);

const rippleGeo = new T.RingGeometry(0.86, 1, 20);
const ripples = [];
for (let i=0;i<26;i++) {
  const m = new T.Mesh(rippleGeo, new T.MeshBasicMaterial({ color:0x9fd0ea, transparent:true, opacity:0, blending:T.AdditiveBlending, depthWrite:false, side:T.DoubleSide }));
  m.rotation.x = -Math.PI/2;
  m.visible = false;
  m.userData.noOutline = true;
  world.add(m);
  ripples.push({ m, t:0, dur:0.8, r1:0.3, active:false });
}
const puddlePts = PUDDLES.filter(p => p.a < 120);
function spawnRipple(x, y, z, r = 0.3) {
  const rp = ripples.find(q => !q.active);
  if (!rp) return;
  rp.active = true;
  rp.t = 0;
  rp.r1 = r;
  rp.m.position.set(x, y + 0.004, z);
  rp.m.visible = true;
}

const dripGeo = new T.SphereGeometry(0.032, 6, 5);
const dripMat = new T.MeshBasicMaterial({ color:0xbcd8ee, transparent:true, opacity:0.85 });
const dripSpots = [
  [-2.8,3.0,4.12,0.147],[-1.2,3.0,4.12,0.147],[0.4,3.0,4.12,0.147],[1.5,3.0,4.12,0.147],
  [2.54,3.0,3.33,0.147],[3.72,3.0,2.15,0.147],
  [4.6,3.0,-1.3,0.147],[4.6,3.0,0.0,0.147],
  [-3.66,3.72,0.6,0.045],[-3.66,3.72,2.4,0.045],
  [0.0,3.72,-3.14,0.045],
  [-6.2,7.9,-4.45,0.045],
  [-9.3,6.9,3.62,0.147]
];
const drips = [];
for (const d of dripSpots) {
  const m = new T.Mesh(dripGeo, dripMat);
  m.scale.set(1, 2.4, 1);
  m.visible = false;
  m.userData.noOutline = true;
  world.add(m);
  drips.push({ m, x:d[0], y0:d[1], z:d[2], yl:d[3], state:'wait', t:rnd(0.1,4) });
}

const steamTex = ct(128, 128, (g) => {
  const r = g.createRadialGradient(64,64,4, 64,64,62);
  r.addColorStop(0, 'rgba(255,255,255,0.9)');
  r.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0,0,128,128);
});
const steams = [];
for (const s of [[0.54,1.34,-2.375],[0.72,1.34,-2.375],[0.9,1.34,-2.375],[-2.12,1.6,-2.32]]) {
  const sp = new T.Sprite(new T.SpriteMaterial({ map:steamTex, color:0xfff6e8, transparent:true, opacity:0, depthWrite:false }));
  sp.scale.set(0.2, 0.2, 1);
  world.add(sp);
  steams.push({ sp, x:s[0], y0:s[1], z:s[2], off:rnd(0,2.4) });
}

const doorState = { phase:'closed', t:rnd(7,12), k:0 };
const doorLEDmat = doorLED.material;
function setDoorK(k) {
  doorPanels[0].position.x = -0.575 - 1.055*k;
  doorPanels[1].position.x = 0.575 + 1.055*k;
}
function easeIO(x) { return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2; }

let flickNext = rnd(6,12), flickT = -1;
const rippleAcc = { v: 0 };
let frame = 0;

animated.push((t, dt) => {
  rainTime.value = t;
  streakTime.value = t;
  if (alleyFan) alleyFan.rotation.z -= dt*8.5;

  doorState.t -= dt;
  if (doorState.phase === 'closed') {
    setDoorK(0);
    doorLEDmat.color.setHex(0x5a2a1e);
    if (doorState.t <= 0) { doorState.phase = 'sensing'; doorState.t = 0.7; }
  } else if (doorState.phase === 'sensing') {
    doorLEDmat.color.setHex(Math.sin(t*38) > 0 ? 0xff6a4a : 0x5a2a1e);
    if (doorState.t <= 0) { doorState.phase = 'opening'; doorState.t = 0.95; }
  } else if (doorState.phase === 'opening') {
    doorState.k = 1 - Math.max(doorState.t, 0)/0.95;
    setDoorK(easeIO(doorState.k));
    doorLEDmat.color.setHex(0xff6a4a);
    if (doorState.t <= 0) { doorState.phase = 'open'; doorState.t = 2.6; }
  } else if (doorState.phase === 'open') {
    setDoorK(1);
    doorLEDmat.color.setHex(0xff6a4a);
    if (doorState.t <= 0) { doorState.phase = 'closing'; doorState.t = 1.25; }
  } else if (doorState.phase === 'closing') {
    doorState.k = Math.max(doorState.t, 0)/1.25;
    setDoorK(easeIO(doorState.k));
    doorLEDmat.color.setHex(Math.sin(t*30) > 0 ? 0xff6a4a : 0x5a2a1e);
    if (doorState.t <= 0) { doorState.phase = 'closed'; doorState.t = rnd(13,24); }
  }

  if (t > flickNext) { flickT = 0.5; flickNext = t + rnd(7,15); }
  let glowK = 1;
  if (flickT > 0) {
    flickT -= dt;
    glowK = Math.abs(Math.sin(t*44)) > 0.35 ? rnd(0.3,0.7) : 1;
  }
  for (const fm of fasciaGlows) fm.color.setScalar(glowK);
  vendA.color.setScalar(1 + 0.04*Math.sin(t*31));
  vendB.color.setScalar(1 + 0.04*Math.sin(t*27+2));

  const CYC = 19;
  const c = t % CYC;
  const mastKind = c < 10 ? 'green' : (c < 11.8 ? 'yellow' : 'red');
  for (const b of mastBulbs) {
    const on = b.kind === mastKind;
    b.mat.color.copy(on ? b.on : b.off);
    b.halo.opacity = on ? 0.55 : 0.05;
  }
  const cd = (t + 5.5) % CYC;
  const distKind = cd < 10 ? 'green' : (cd < 11.8 ? 'yellow' : 'red');
  for (const b of distBulbs) b.mat.color.copy(b.kind === distKind ? b.on : b.off);
  const walking = c >= 11.8 && c < 16;
  const blinkWalk = c >= 15 && Math.sin(t*10) > 0;
  pedW.visible = walking && !blinkWalk;
  pedS.visible = !walking || blinkWalk;
  const tgc = mastKind === 'red' ? 0xff4838 : (mastKind === 'yellow' ? 0xffc838 : 0x58d868);
  trafficGlow.material.color.setHex(tgc);
  trafficGlow.material.opacity = 0.2 + 0.08*Math.sin(t*3);

  const kv = 0.5 + 0.5*Math.sin(t*2.3)*Math.sin(t*0.7+1);
  tvMat.color.setRGB(0.2+0.28*kv, 0.3+0.34*kv, 0.52+0.3*kv);

  rippleAcc.v += dt;
  while (rippleAcc.v > 0.11) {
    rippleAcc.v -= 0.11;
    const pp = pick(puddlePts);
    spawnRipple(pp.x + rnd(-pp.rx, pp.rx)*0.6, pp.y, pp.z + rnd(-pp.rz, pp.rz)*0.6, rnd(0.2, 0.4));
  }
  for (const rp of ripples) {
    if (!rp.active) continue;
    rp.t += dt;
    const k = rp.t / rp.dur;
    if (k >= 1) { rp.active = false; rp.m.visible = false; continue; }
    const e = 1 - Math.pow(1-k, 2);
    const s = 0.05 + (rp.r1 - 0.05)*e;
    rp.m.scale.set(s, s, 1);
    rp.m.material.opacity = 0.42*(1-k);
  }

  for (const d of drips) {
    d.t -= dt;
    if (d.state === 'wait') {
      if (d.t <= 0) { d.state = 'swell'; d.t = 0.8; d.m.visible = true; }
    } else if (d.state === 'swell') {
      const k = 1 - Math.max(d.t, 0)/0.8;
      d.m.position.set(d.x, d.y0 - 0.02, d.z);
      d.m.scale.set(0.5+k*0.6, 1.4+k*1.6, 0.5+k*0.6);
      if (d.t <= 0) { d.state = 'fall'; d.t = 0.45; }
    } else if (d.state === 'fall') {
      const k = 1 - Math.max(d.t, 0)/0.45;
      const yy = (d.y0 - 0.05) + (d.yl + 0.02 - d.y0 + 0.05)*(k*k);
      d.m.position.set(d.x, yy, d.z);
      d.m.scale.set(0.8, 2.6, 0.8);
      if (d.t <= 0) {
        d.state = 'wait';
        d.t = rnd(1.6, 5);
        d.m.visible = false;
        spawnRipple(d.x, d.yl, d.z, 0.16);
      }
    }
  }

  for (const s of steams) {
    const k = ((t + s.off) % 2.6)/2.6;
    s.sp.position.set(s.x + Math.sin(t*2.5 + s.off)*0.03, s.y0 + k*0.52, s.z);
    s.sp.material.opacity = Math.sin(Math.PI*k)*0.3;
    const sc = 0.15 + k*0.36;
    s.sp.scale.set(sc, sc, 1);
  }
});

let introT = 0;
let introActive = true;
const camFrom = new T.Vector3(19.5, 12.5, 20.5);
const camTo = new T.Vector3(13.4, 7.3, 14.3);
controls.addEventListener('start', () => { introActive = false; });

const clock = new T.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (introActive) {
    introT += dt/3.0;
    const e = 1 - Math.pow(1 - Math.min(introT, 1), 3);
    camera.position.lerpVectors(camFrom, camTo, e);
    if (introT >= 1) introActive = false;
  }
  for (const fn of animated) fn(t, dt);
  controls.update();
  composer.render();
  frame++;
  if (frame === 3) renderer.shadowMap.autoUpdate = false;
}
loop();

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  fxaa.material.uniforms['resolution'].value.set(1/(w*renderer.getPixelRatio()), 1/(h*renderer.getPixelRatio()));
});

