import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#111b2d');
scene.fog = new THREE.FogExp2('#111b2d', 0.015);

const camera = new THREE.OrthographicCamera(-8.9, 8.9, 6.4, -6.4, 0.1, 100);
camera.position.set(12, 10.3, 15.8);
camera.lookAt(0, 1.65, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.42;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.45, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 8;
controls.maxDistance = 35;
controls.minZoom = 0.75;
controls.maxZoom = 2.5;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minPolarAngle = 0.22;
controls.update();

const C = {
  edge: '#172435', ink: '#26394b', cream: '#e7e3d7', warm: '#ffe5ad',
  facade: '#cbd0cd', wall: '#aeb9b7', floor: '#d9d2bb', road: '#34465a',
  sidewalk: '#7c909b', orange: '#f28e51', green: '#4ab49c', red: '#d76269',
  blue: '#66a7c6', gold: '#f7c578', dark: '#1b2c3d',
};
const mat = (color, roughness = .8, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const M = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, mat(v)]));
M.road = mat(C.road, .17, .16);
M.sidewalk = mat(C.sidewalk, .67);
M.glass = mat('#a9d6e5', .06, .05, { transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide });
M.window = mat('#bedae0', .12, .05, { transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
M.puddle = mat('#7497a9', .08, .35, { transparent: true, opacity: .35, depthWrite: false });
M.light = new THREE.MeshBasicMaterial({ color: '#ffe9ba' });
M.glow = new THREE.MeshBasicMaterial({ color: '#b2fff1' });

const group = new THREE.Group();
scene.add(group);
function box(w, h, d, x, y, z, material, parent = group) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function cyl(r, h, x, y, z, material, sides = 12, parent = group) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, sides), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function sphere(r, x, y, z, material, parent = group) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), material);
  mesh.position.set(x, y, z); mesh.castShadow = true; parent.add(mesh); return mesh;
}
function line(points, color, radius = .016, parent = group) {
  const material = mat(color);
  for (let i = 1; i < points.length; i++) {
    const a = new THREE.Vector3(...points[i - 1]), b = new THREE.Vector3(...points[i]);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 6), material);
    mesh.position.copy(a).add(b).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    parent.add(mesh);
  }
}
function flat(w, d, x, y, z, material, parent = group) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, y, z); mesh.receiveShadow = true;
  parent.add(mesh); return mesh;
}
function label(text, width, height, { bg = '#f5efdc', fg = '#253c4a', font = 70, sub = '', stripe = null, align = 'center' } = {}) {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.max(128, Math.round(1024 * height / width));
  const ctx = canvas.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (stripe) { ctx.fillStyle = stripe; ctx.fillRect(0, canvas.height * .75, canvas.width, canvas.height * .12); }
  ctx.fillStyle = fg; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.font = `bold ${font}px "Yu Gothic", "Noto Sans JP", sans-serif`;
  ctx.fillText(text, align === 'left' ? 30 : 512, sub ? canvas.height * .40 : canvas.height * .5, 960);
  if (sub) { ctx.font = `500 ${Math.max(20, font * .34)}px sans-serif`; ctx.fillText(sub, align === 'left' ? 30 : 512, canvas.height * .73, 960); }
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
}
function signFront(w, h, x, y, z, material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, z); group.add(mesh); return mesh;
}

// One solid display plinth, with sidewalks and the two turning streets inside it.
box(12, .42, 12, 0, -.26, 0, M.dark);
box(12.16, .08, 12.16, 0, -.51, 0, M.ink);
flat(12, 12, 0, -.045, 0, M.road);
box(7.25, .2, 7.25, -2.18, .075, -2.18, M.sidewalk);
box(7.22, .035, 7.22, -2.18, .195, -2.18, mat('#97a6a8', .55));
// Pavement cuts make the elevated corner read as individual wet slabs.
for (let x = -5.6; x < 1.25; x += .8) {
  flat(.018, .74, x, .215, 1.03, M.ink);
  flat(.018, .67, x, .215, -5.45, M.ink);
}
for (let z = -5.55; z < 1.32; z += .8) flat(.72, .018, 1.05, .215, z, M.ink);
// Road markings, crosswalk and parking bay.
for (let i = 0; i < 7; i++) {
  const stripe = flat(.68, .29, -4.85 + i * .88, -.017, 2.42, mat('#d2e5db', .3));
  stripe.rotation.y = -.09;
}
flat(.065, 2.75, 2.02, -.018, -3.65, mat('#d6dcbf', .4));
flat(.065, 2.75, 4.72, -.018, -3.65, mat('#d6dcbf', .4));
flat(2.7, .065, 3.37, -.018, -5.01, mat('#d6dcbf', .4));
for (let i = 0; i < 5; i++) flat(.48, .055, -4.7 + i * 2.05, -.018, 4.96, mat('#d3dbd0', .38));
// Drainage grate running along the curb.
box(6.9, .02, .14, -2.18, .21, 1.43, M.ink);
for (let x = -5.55; x < 1.2; x += .17) box(.024, .024, .12, x, .228, 1.43, M.sidewalk);
for (let z = -5.53; z < 1.38; z += .17) box(.12, .024, .024, 1.43, .228, z, M.sidewalk);
box(.14, .02, 6.9, 1.43, .21, -2.16, M.ink);
// Irregular glassy puddles, shallow enough to remain part of the road.
for (const [x, z, sx, sz, rot] of [[-3.4,3.7,1.25,.48,.2],[-.25,3.37,.76,.3,-.1],[3.3,1.72,1.1,.4,.3],[4.1,-2.1,.7,.3,-.3],[-4.0,5.22,.8,.25,0]]) {
  const p = flat(sx, sz, x, -.012, z, M.puddle); p.rotation.y = rot;
  flat(sx*.52, sz*.14, x-.1, -.009, z-.03, mat('#f2c69f', .12, .15, { transparent: true, opacity: .26, depthWrite: false })).rotation.y = rot;
}

// Building shell: a broad glass facade leaves the richly stocked interior exposed.
const store = new THREE.Group(); group.add(store);
box(6.15, .15, 5.65, -2.2, .32, -2.31, M.cream);
box(6.15, 3.68, .2, -2.2, 2.12, -5.03, M.wall);
box(.18, 3.65, 5.55, -5.2, 2.13, -2.31, M.facade);
box(.15, 3.65, 5.55, .82, 2.13, -2.31, M.facade);
box(6.2, .34, 5.7, -2.2, 4.12, -2.32, M.dark);
box(6.32, .12, 5.78, -2.2, 4.33, -2.32, M.facade);
// Roof equipment and a low parapet.
box(6.36, .2, .17, -2.2, 4.46, .57, M.ink);
box(.16, .2, 5.75, -5.32, 4.46, -2.31, M.ink);
box(.16, .2, 5.75, .94, 4.46, -2.31, M.ink);
box(6.36, .2, .17, -2.2, 4.46, -5.16, M.ink);
box(1.16, .65, .8, -.25, 4.72, -3.8, M.facade);
for (let i = 0; i < 6; i++) box(.012, .43, .75, -.77+i*.19, 4.72, -3.79, M.ink);
// Visible tiled floor and back wall accents.
for (let x = -5.05; x < .75; x += .65) flat(.012, 5.35, x, .402, -2.26, mat('#bfc8bb'));
for (let z = -4.8; z < .45; z += .65) flat(5.9, .012, -2.2, .402, z, mat('#bfc8bb'));
box(5.7, .08, .06, -2.2, 2.91, -4.9, M.orange);
box(5.7, .08, .06, -2.2, 3.03, -4.9, M.green);
// Back room door and storage lockers.
box(.95, 2.22, .07, .06, 1.45, -4.89, M.ink);
box(.77, 2.02, .08, .06, 1.47, -4.84, M.facade);
box(.42, .33, .015, .06, 2.05, -4.79, M.window);
sphere(.04, .39, 1.4, -4.77, M.ink);
for (let i = 0; i < 3; i++) {
  const x = -1.05 + i*.43;
  box(.4, 1.5, .42, x, 1.16, -4.68, M.cream);
  box(.31, .018, .015, x, 1.22, -4.447, M.ink);
  sphere(.025, x+.13, 1.6, -4.44, M.ink);
}

// Refrigerated drinks along the rear: glowing doors, shelves and colorful bottle rows.
for (let bay = 0; bay < 4; bay++) {
  const x = -4.71 + bay*.82;
  box(.78, 2.2, .49, x, 1.53, -4.57, M.ink);
  box(.68, 2.05, .025, x, 1.56, -4.29, mat('#afddd9', .18, 0, { emissive: '#3b7b7d', emissiveIntensity: .3 }));
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = .73 + shelf*.44;
    box(.67, .035, .26, x, y, -4.22, M.cream);
    for (let b = 0; b < 5; b++) {
      const palette = [M.orange, M.green, M.blue, M.red, M.gold];
      cyl(.045, .22, x-.27+b*.135, y+.13, -4.14, palette[(b+shelf+bay)%5], 8);
      cyl(.021, .025, x-.27+b*.135, y+.253, -4.14, M.cream, 8);
    }
  }
  box(.025, 2.04, .045, x+.33, 1.56, -4.26, M.cream);
}

// Aisles: packaged snacks, rice balls, bento and little price cards.
function merchandiseShelf(x, z, angle = 0) {
  const rack = new THREE.Group(); rack.position.set(x, 0, z); rack.rotation.y = angle; group.add(rack);
  for (let level = 0; level < 3; level++) {
    const y = .65 + level*.54;
    box(1.68, .075, .67, 0, y, 0, M.cream, rack);
    box(1.65, .05, .035, 0, y-.055, .345, M.orange, rack);
    for (let side of [-1, 1]) for (let i = 0; i < 9; i++) {
      const palette = [M.red, M.gold, M.green, M.blue, M.orange, M.cream];
      const product = box(.12, .19 + ((i+level)%3)*.045, .105, -.72+i*.18, y+.15, side*.16, palette[(i+level+Math.abs(side))%6], rack);
      product.rotation.y = ((i%3)-1)*.08;
      box(.075, .05, .007, -.72+i*.18, y+.13, side*.218, M.cream, rack);
    }
    for (let i = 0; i < 5; i++) box(.19, .075, .012, -.59+i*.29, y-.06, .365, M.cream, rack);
  }
  for (let x0 of [-.76,.76]) box(.06, 1.78, .64, x0, 1.23, 0, M.ink, rack);
}
merchandiseShelf(-3.65, -2.35, .12);
merchandiseShelf(-1.43, -2.5, -.12);
merchandiseShelf(-3.4, -.8, -.06);
// Bento island close to the window.
box(1.35, .72, .72, -1.35, .78, -.72, M.cream);
box(1.22, .075, .65, -1.35, 1.19, -.72, M.ink);
for (let i = 0; i < 5; i++) {
  box(.19, .055, .28, -1.83+i*.24, 1.25, -.72, M.orange);
  box(.16, .012, .13, -1.83+i*.24, 1.287, -.72, M.cream);
}
// Counter, register, coffee machine and a small oden warmer.
box(2.55, .95, .72, -.64, .85, -.02, M.cream);
box(2.59, .1, .78, -.64, 1.38, -.02, M.ink);
box(.49, .32, .3, .16, 1.62, -.22, M.dark);
box(.42, .23, .025, .16, 1.65, -.055, M.glow);
box(.36, .52, .28, -.63, 1.68, -.23, M.ink);
box(.23, .21, .015, -.63, 1.79, -.078, M.orange);
for (let i = 0; i < 3; i++) cyl(.037, .11, -.75+i*.11, 1.46, .16, M.cream, 10);
box(.55, .32, .38, -1.36, 1.56, -.14, M.red);
box(.5, .095, .34, -1.36, 1.74, -.14, M.glass);
for (let i = 0; i < 5; i++) sphere(.042, -1.56+i*.1, 1.74, -.1, M.gold);

// Front facade glazing, slim mullions, sliding doors, and the long three-color fascia.
box(6.2, .44, .28, -2.2, 3.75, .55, M.facade);
box(6.28, .09, .34, -2.2, 3.46, .59, M.orange);
box(6.28, .085, .34, -2.2, 3.34, .59, M.green);
box(6.28, .065, .34, -2.2, 3.23, .59, M.red);
box(6.33, .13, .7, -2.2, 3.14, .81, M.ink); // rain canopy
box(6.33, .045, .71, -2.2, 3.205, .81, M.facade);
signFront(3.14, .44, -2.21, 3.83, .702, label('こもれび MART', 3.14, .44, { bg:'#edf5e9', fg:'#285e5b', font:116, sub:'OPEN 24 HOURS  •  コンビニエンス', stripe:'#f1a268' }));
for (let x of [-5.18,-3.92,-2.68,-1.38,-.13,.82]) box(.065, 3.02, .08, x, 1.78, .53, M.ink);
box(6.1, .07, .09, -2.2, 2.92, .53, M.ink);
box(6.1, .075, .09, -2.2, .33, .53, M.ink);
for (let [x,w] of [[-4.55,1.2],[-3.3,1.18],[-.76,1.19],[.35,.9]]) box(w, 2.55, .018, x, 1.63, .525, M.glass);
const doorLeft = new THREE.Group(), doorRight = new THREE.Group();
group.add(doorLeft, doorRight);
function makeDoor(parent, x) {
  box(1.18, 2.57, .045, x, 1.62, .55, M.window, parent);
  box(1.2, .06, .065, x, 2.91, .56, M.ink, parent);
  box(1.2, .06, .065, x, .34, .56, M.ink, parent);
  box(.045, 2.57, .065, x-.6, 1.62, .56, M.ink, parent);
  box(.045, 2.57, .065, x+.6, 1.62, .56, M.ink, parent);
  box(.035, .43, .09, x + (x < -2 ? .52 : -.52), 1.42, .65, M.cream, parent);
}
makeDoor(doorLeft, -2.06); makeDoor(doorRight, -.77);
box(1.35, .018, .7, -1.73, .235, 1.05, M.ink);
for (let i=0;i<9;i++) box(1.18, .002, .013, -1.73, .25, .75+i*.065, M.sidewalk);
// Window posters are readable from the street.
signFront(.46, .67, -4.61, 1.68, .575, label('おでん', .46, .67, { bg:'#d67453', fg:'#fff5db', font:125, sub:'あったかい' }));
signFront(.42, .53, -.72, 1.8, .575, label('新発売', .42, .53, { bg:'#f2dda6', fg:'#9c524e', font:115, sub:'HOT COFFEE' }));

// Side windows, a narrow alley recess and outdoor air conditioner.
for (const z of [-4.15,-2.82,-1.48]) {
  box(.018, 2.24, 1.1, .91, 1.65, z, M.glass);
  box(.08, 2.28, .065, .94, 1.65, z-.57, M.ink);
}
box(.08, 2.28, 5.54, .94, 1.65, -2.31, M.ink);
box(.78, .7, .82, 1.3, .63, -4.47, M.facade);
box(.035, .54, .64, 1.71, .63, -4.47, M.ink);
for (let i=0;i<6;i++) box(.037, .015, .59, 1.735, .4+i*.09, -4.47, M.sidewalk);
line([[1.2,.93,-4.9],[1.2,1.75,-4.9],[.97,1.95,-4.75]], C.ink, .028);
// Road-facing advertisements and shop signs.
box(.09, 1.85, .82, 1.73, 1.17, -2.6, M.ink);
const sideSign = new THREE.Mesh(new THREE.PlaneGeometry(.68,1.57), label('24時間', .68,1.57, {bg:'#edf0dd',fg:'#347571',font:150,sub:'OPEN ALL NIGHT',stripe:'#ea9674'}));
sideSign.rotation.y = Math.PI/2; sideSign.position.set(1.79,1.2,-2.6); group.add(sideSign);

// Vending machine with lit individual cans.
box(.86, 1.9, .72, -4.83, 1.2, 1.02, M.red);
box(.72, 1.22, .045, -4.83, 1.45, 1.39, M.light);
for (let row=0;row<4;row++) for (let col=0;col<5;col++) {
  cyl(.035,.13,-5.1+col*.135,1.86-row*.25,1.43,[M.red,M.green,M.gold,M.blue,M.orange][(col+row)%5],8);
  box(.63,.02,.03,-4.83,1.76-row*.25,1.46,M.ink);
}
box(.57,.22,.04,-4.83,.58,1.41,M.ink);
box(.14,.23,.025,-4.43,1.31,1.41,M.ink);
box(.035,.035,.03,-4.43,1.43,1.44,M.glow);
box(.84,.07,.73,-4.83,.23,1.03,M.ink);
// Umbrella stand, wet umbrellas and small bins.
cyl(.24,.43,-3.92,.46,1.15,M.ink,12);
for (let i=0;i<5;i++) {
  const x=-4.08+i*.08;
  line([[x,.52,1.15],[x,1.17+(i%2)*.14,1.15]], i%2?C.orange:C.blue, .017);
  line([[x,1.14+(i%2)*.14,1.15],[x+.08,1.2+(i%2)*.14,1.15]], C.ink, .017);
}
for (let i=0;i<2;i++) {
  cyl(.2,.53,-3.17+i*.47,.48,1.11,i?M.green:M.cream,10);
  cyl(.21,.05,-3.17+i*.47,.76,1.11,M.ink,10);
}
// Bicycle: wheels, frame, handlebars, basket and a kickstand.
const bike = new THREE.Group(); group.add(bike); bike.position.set(-.31,.26,1.12); bike.rotation.y=-.22;
for (let x of [-.55,.58]) {
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.31,.035,7,20), M.ink); wheel.rotation.y=Math.PI/2; wheel.position.set(x,.33,0); bike.add(wheel);
  for(let a=0;a<8;a++) line([[x,.33,0],[x,.33+Math.sin(a*Math.PI/4)*.28,Math.cos(a*Math.PI/4)*.28]],'#9bb2b6',.006,bike);
}
line([[-.55,.33,0],[-.16,.83,0],[.22,.33,0],[-.55,.33,0],[.08,.88,0],[.22,.33,0],[.58,.33,0]],C.blue,.035,bike);
line([[-.16,.83,0],[-.18,1.04,0],[-.38,1.04,0]],C.ink,.035,bike);
line([[.58,.33,0],[.48,1.02,0],[.72,1.06,0]],C.ink,.035,bike);
box(.43,.16,.3,.82,.95,0,M.cream,bike);
line([[.22,.33,0],[.12,.06,.2]],C.ink,.025,bike);

// Street lamp, power pole, sagging overhead cables and Japanese street signs.
function pole(x,z,height=4.8) {
  cyl(.075,height,x,height/2+.2,z,M.ink,10);
  cyl(.115,.12,x,height+.18,z,M.facade,10);
}
pole(4.72,-4.68,5.15);
line([[4.72,4.8,-4.68],[4.72,4.8,-3.35],[4.72,4.55,-3.22]],C.ink,.055);
box(.63,.17,.43,4.72,4.56,-3.18,M.cream);
box(.56,.025,.39,4.72,4.45,-3.18,M.light);
const streetLight = new THREE.PointLight('#ffe1a7',10,5.6,2); streetLight.position.set(4.72,4.2,-3.18); group.add(streetLight);
pole(-5.26,-4.91,5.3);
for(const y of [4.35,4.65]) {
  line([[-5.26,y,-4.91],[-4.64,y,-4.91]],C.ink,.035);
  line([[-5.25,y,-4.91],[-2.7,y-.34,-5.05],[.3,y-.24,-5.05],[4.72,y-.06,-4.68]],C.ink,.018);
}
line([[-5.26,4.1,-4.91],[-5.36,3.55,-3.5],[-5.2,3.66,-1.35]],C.ink,.015);
for(const z of [-4.95,-4.64]) box(.3,.12,.14,-5.26,4.83,z,M.facade);
// Corner street sign and illuminated traffic signal.
cyl(.045,2.42,5.1,1.2,1.0,M.ink,8);
box(.08,.54,.48,5.1,2.28,1.0,M.ink);
const signalLights=[];
for(let i=0;i<3;i++) signalLights.push(sphere(.065,5.153,2.43-i*.16,1.0,i===2?mat('#55d3a3',.25,0,{emissive:'#36d296',emissiveIntensity:.9}):mat('#64404a',.4)));
box(.81,.34,.06,4.84,2.96,.99,M.cream);
signFront(.75,.27,4.84,2.96,1.028,label('旭町 2丁目',.75,.27,{bg:'#467e8b',fg:'#ffffff',font:115}));
// Guard rails along the road corner.
for(let x of [2.06,3.0,3.94]) {
  cyl(.047,.59,x,.31,1.25,M.cream,8);
  cyl(.07,.07,x,.62,1.25,M.orange,8);
}
line([[2.06,.48,1.25],[3,.48,1.25],[3.94,.48,1.25]],C.cream,.035);
// Alley marker and a poster board.
box(.1,1.47,.08,-5.6,.96,-1.11,M.ink);
box(.09,1.47,.08,-4.66,.96,-1.11,M.ink);
box(1.01,1.35,.07,-5.13,1.05,-1.11,M.facade);
signFront(.89,1.16,-5.13,1.06,-1.063,label('雨の夜\n珈琲',.89,1.16,{bg:'#e5d8bd',fg:'#547078',font:125,sub:'COFFEE · 1987'}));
box(.22,1.13,.16,-5.75,.75,-2.2,M.ink);
// Tiny flowers and curb planters provide a softer residential edge.
for(const [x,z] of [[-5.55,.9],[-5.52,-.25],[.85,-5.31]]) {
  box(.47,.25,.37,x,.34,z,M.ink);
  for(let j=0;j<7;j++) {
    const dx=((j*7)%11/11-.5)*.37, dz=((j*3)%7/7-.5)*.26;
    sphere(.105,x+dx,.52+(j%3)*.035,z+dz,j%3===0?M.orange:M.green);
  }
}

// Warm interior against blue rain light.
scene.add(new THREE.HemisphereLight('#a9c9e5','#253244',2.25));
const key = new THREE.DirectionalLight('#b7d9f5',2.15);
key.position.set(-5,10,7); key.castShadow=true; key.shadow.mapSize.set(2048,2048);
key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;
key.shadow.normalBias=.025; scene.add(key);
const storeGlow = new THREE.PointLight('#ffe4ae',16,8,1.7);
storeGlow.position.set(-2.4,2.9,-2); group.add(storeGlow);
const windowGlow = new THREE.PointLight('#ffd2a0',6,4,1.7);
windowGlow.position.set(-2.2,2.0,1.2); group.add(windowGlow);
const vendingGlow = new THREE.PointLight('#f28c84',4,3,2);
vendingGlow.position.set(-4.83,1.5,1.7); group.add(vendingGlow);
for(const x of [-4.2,-2.2,-.2]) {
  box(1.2,.06,.28,x,3.86,-2.1,M.light);
  box(1.22,.03,.3,x,3.9,-2.1,M.cream);
}
// Reflection streaks laid into puddles.
for(const [x,z,w] of [[-2.6,3.72,.55],[-1.3,3.55,.28],[3.36,1.72,.43],[4.1,-2.1,.26]]) {
  flat(w,.025,x,-.006,z,mat('#f6d4a9',.15,0,{transparent:true,opacity:.58,depthWrite:false}));
  flat(w*.58,.015,x+.05,-.005,z+.09,mat('#94e3d9',.15,0,{transparent:true,opacity:.54,depthWrite:false}));
}

// Rain occupies only the miniature world's footprint. Ripples and eave drops loop independently.
const drops = [];
const rainGeo = new THREE.BufferGeometry();
const rainPositions = new Float32Array(520*6);
const rainMaterial = new THREE.LineBasicMaterial({ color:'#bad6ed', transparent:true, opacity:.48, depthWrite:false });
for(let i=0;i<520;i++) drops.push({x:Math.random()*12-6,z:Math.random()*12-6,y:Math.random()*7.7+.1,speed:4.5+Math.random()*4.5,length:.09+Math.random()*.15});
rainGeo.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
const rainLines = new THREE.LineSegments(rainGeo,rainMaterial); group.add(rainLines);
const ripples = [];
for(let i=0;i<32;i++) {
  const x=Math.random()*11.4-5.7,z=Math.random()*11.4-5.7;
  const mesh=new THREE.Mesh(new THREE.RingGeometry(.055,.068,18),new THREE.MeshBasicMaterial({color:'#b9d4d9',side:THREE.DoubleSide,transparent:true,opacity:.28,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2; mesh.position.set(x,.004,z); group.add(mesh);
  ripples.push({mesh,phase:Math.random(),speed:.32+Math.random()*.33});
}
const eaveDrops=[];
for(let i=0;i<22;i++) {
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(.018,5,5),new THREE.MeshBasicMaterial({color:'#bde7ef',transparent:true,opacity:.55}));
  mesh.position.x=-5.25+i*.29; mesh.position.z=1.15; group.add(mesh);
  eaveDrops.push({mesh,offset:Math.random(),speed:.7+Math.random()*.65});
}
const glassStreaks=[];
for(let i=0;i<22;i++) {
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.012,.2+Math.random()*.24),new THREE.MeshBasicMaterial({color:'#d8f0ec',transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));
  mesh.position.set(-5.04+Math.random()*5.8,.4+Math.random()*2.5,.575); group.add(mesh);
  glassStreaks.push({mesh,speed:.1+Math.random()*.17});
}
const clock=new THREE.Clock();
let elapsed=0;
function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05); elapsed+=dt;
  for(let i=0;i<drops.length;i++) {
    const d=drops[i]; d.y-=d.speed*dt;
    if(d.y<.05){d.y=6.7+Math.random();d.x=Math.random()*12-6;d.z=Math.random()*12-6;}
    const k=i*6; rainPositions[k]=d.x;rainPositions[k+1]=d.y;rainPositions[k+2]=d.z;
    rainPositions[k+3]=d.x-.035;rainPositions[k+4]=d.y+d.length;rainPositions[k+5]=d.z;
  }
  rainGeo.attributes.position.needsUpdate=true;
  for(const r of ripples) {
    r.phase=(r.phase+dt*r.speed)%1;
    const s=.6+r.phase*4.4; r.mesh.scale.setScalar(s); r.mesh.material.opacity=.26*(1-r.phase);
  }
  for(const d of eaveDrops) {
    const p=(elapsed*d.speed+d.offset)%1;
    d.mesh.position.y=3.07-p*2.9;
    d.mesh.material.opacity=.5*(1-p*.4);
  }
  for(const s of glassStreaks) {
    s.mesh.position.y-=dt*s.speed;
    if(s.mesh.position.y<.4)s.mesh.position.y=2.95;
  }
  // The closed shop settles, then opens briefly as if someone just passed through.
  const phase=elapsed%12;
  const opening=phase<6.8?0:phase<7.4?(phase-6.8)/.6:phase<8.9?1:phase<9.6?1-(phase-8.9)/.7:0;
  doorLeft.position.x=-opening*.44;
  doorRight.position.x=opening*.44;
  storeGlow.intensity=16+Math.sin(elapsed*1.7)*.18+(Math.sin(elapsed*17)> .995 ? .75 : 0);
  const signal=(elapsed%14)<8;
  signalLights[0].material.color.set(signal?'#74444a':'#e56e6b');
  signalLights[0].material.emissive.set(signal?'#1b0b0b':'#b44141');
  signalLights[0].material.emissiveIntensity=signal?.1:.8;
  signalLights[2].material.color.set(signal?'#61dbb0':'#3b6359');
  signalLights[2].material.emissiveIntensity=signal?.9:.08;
  controls.update(); renderer.render(scene,camera);
}
animate();

function resize() {
  const aspect=innerWidth/innerHeight;
  const frustum=6.65;
  camera.left=-frustum*aspect;camera.right=frustum*aspect;
  camera.top=frustum;camera.bottom=-frustum;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
}
addEventListener('resize',resize); resize();
