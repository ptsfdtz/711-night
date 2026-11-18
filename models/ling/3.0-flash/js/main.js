import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createLighting, createFlicker, updateFlickers } from './lighting.js';
import { createToonGradient, createWetGroundTexture, createPavementTexture } from './textures.js';
import { WeatherSystem } from './weather.js';

const gradientMap = createToonGradient(4);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080c18);
scene.fog = new THREE.FogExp2(0x080c18, 0.05);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(9, 6, 9);
camera.lookAt(0, 1, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 4;
controls.maxDistance = 22;
controls.maxPolarAngle = Math.PI / 2.1;
controls.update();

const M = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap });
const MD = (c) => new THREE.MeshToonMaterial({ color: c, gradientMap });

// Ground
const wetGround = createWetGroundTexture(512);
const groundGeo = new THREE.PlaneGeometry(14, 14);
const ground = new THREE.Mesh(groundGeo, new THREE.MeshToonMaterial({ map: wetGround, color: 0x1a2030, gradientMap }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.01;
ground.receiveShadow = true;
scene.add(ground);

const pavement = createPavementTexture(512);
const pavementGeo = new THREE.BoxGeometry(12, 0.02, 12);
const pavementMesh = new THREE.Mesh(pavementGeo, new THREE.MeshToonMaterial({ map: pavement, color: 0x333540, gradientMap }));
pavementMesh.position.y = 0.085;
scene.add(pavementMesh);

// Base platform
const baseGeo = new THREE.BoxGeometry(8.2, 0.08, 8.2);
const base = new THREE.Mesh(baseGeo, MD(0x1a1a24));
base.position.y = -0.04;
scene.add(base);

// === Convenience Store ===
const store = new THREE.Group();
const SW = 4, SH = 3.5, SD = 3;

const storeFloorMat = M(0x2a2a34);
const storeWallMat = M(0x3a3a4a);
const storeRoofMat = MD(0x1e1e2c);
const awningMat = M(0xcc2244);

// Floor
const fGeo = new THREE.BoxGeometry(SW, 0.1, SD);
const floor = new THREE.Mesh(fGeo, storeFloorMat);
floor.position.y = 0; floor.receiveShadow = true;
store.add(floor);

// Back wall
const bwGeo = new THREE.BoxGeometry(SW, SH, 0.1);
const bw = new THREE.Mesh(bwGeo, storeWallMat);
bw.position.set(0, SH / 2, -SD / 2);
store.add(bw);

// Left wall
const lwGeo = new THREE.BoxGeometry(0.1, SH, SD);
const lw = new THREE.Mesh(lwGeo, storeWallMat);
lw.position.set(-SW / 2, SH / 2, 0);
store.add(lw);

// Right wall (with glass)
const rwGeo = new THREE.BoxGeometry(0.1, SH, SD);
const rw = new THREE.Mesh(rwGeo, storeWallMat);
rw.position.set(SW / 2, SH / 2, 0);
store.add(rw);

// Glass windows
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x88ccff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0.1, side: THREE.DoubleSide });
const gw1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.8), glassMat);
gw1.position.set(-0.8, 1.2, SD / 2 + 0.02);
store.add(gw1);
const gw2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.2, 0.8), glassMat);
gw2.position.set(0.8, 1.2, SD / 2 + 0.02);
store.add(gw2);
const gwc = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.8), glassMat);
gwc.position.set(0, 2.2, SD / 2 + 0.02);
store.add(gwc);

// Door frame
const dfGeo = new THREE.BoxGeometry(1.4, 0.1, 0.1);
const df = new THREE.Mesh(dfGeo, MD(0x445566));
df.position.set(0, 0.05, SD / 2 + 0.06);
store.add(df);

// Automatic door
const adGeo = new THREE.BoxGeometry(0.1, 2.0, 1.0);
const adMat = M(0x336699);
const autoDoor = new THREE.Mesh(adGeo, adMat);
autoDoor.position.set(0, 1.0, SD / 2 + 0.06);
store.add(autoDoor);

// Roof
const rGeo = new THREE.BoxGeometry(SW + 0.4, 0.15, SD + 0.4);
const roof = new THREE.Mesh(rGeo, storeRoofMat);
roof.position.y = SH;
store.add(roof);

// Awning
const aGeo = new THREE.BoxGeometry(SW + 0.6, 0.1, 0.6);
const awning = new THREE.Mesh(aGeo, awningMat);
awning.position.set(0, SH + 0.08, SD / 2 + 0.3);
store.add(awning);

const asGeo = new THREE.BoxGeometry(0.05, 0.3, 0.1);
const as1 = new THREE.Mesh(asGeo, MD(0x445566));
as1.position.set(-SW / 2 - 0.1, SH + 0.15, SD / 2 + 0.3);
store.add(as1);
const as2 = new THREE.Mesh(asGeo, MD(0x445566));
as2.position.set(SW / 2 + 0.1, SH + 0.15, SD / 2 + 0.3);
store.add(as2);

// Sign
const signGeo = new THREE.BoxGeometry(1.2, 0.4, 0.08);
const sign = new THREE.Mesh(signGeo, M(0xffffff));
sign.position.set(0, SH + 0.08, SD / 2 + 0.15);
store.add(sign);

// Sign texture
const sCanvas = document.createElement('canvas');
sCanvas.width = 256; sCanvas.height = 128;
const sc = sCanvas.getContext('2d');
sc.fillStyle = '#cc2244'; sc.fillRect(0, 0, 256, 128);
sc.fillStyle = '#ffffff'; sc.font = 'bold 36px sans-serif'; sc.textAlign = 'center'; sc.textBaseline = 'middle';
sc.fillText('7-ELEVEN', 128, 64);
sc.font = '18px sans-serif'; sc.fillText('OPEN 24H', 128, 96);
const sTex = new THREE.CanvasTexture(sCanvas);
const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: sTex }));
signMesh.position.set(0, SH + 0.08, SD / 2 + 0.2);
store.add(signMesh);

// Neon light
const neonGeo = new THREE.PlaneGeometry(0.05, SH - 0.5);
const neonMat = new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.8 });
const neonLeft = new THREE.Mesh(neonGeo, neonMat);
neonLeft.position.set(-SW / 2 - 0.02, SH / 2, SD / 2 + 0.1);
store.add(neonLeft);

// Interior
const interior = new THREE.Group();

const sMat = M(0x556677);
const sMat2 = M(0x4a5566);
const counterMat = M(0x2a3344);
const registerMat = M(0x334455);
const drinkCoolerMat = M(0x3366aa);
const magazineMat = M(0x667788);
const bentoMat = M(0xcc9944);
const riceBallMat = M(0xddaa66);
const snackMat = M(0xeebb77);
const coffeeMat = M(0x554433);
const freezerMat = M(0x445566);
const wallIntMat = M(0x445566);
const lightFixtureMat = M(0xffeedd);
const floorDecoMat = M(0x223344);

// Shelves left
for (let i = 0; i < 5; i++) {
  const shGeo = new THREE.BoxGeometry(0.8, 0.05, 0.6);
  const sh = new THREE.Mesh(shGeo, sMat);
  sh.position.set(-SW / 2 + 0.45, 0.6 + i * 0.6, -SD / 2 + 0.8);
  interior.add(sh);
  const icGeo = new THREE.BoxGeometry(0.7, 0.05, 0.08);
  const colors = [0xff4444, 0x44aa44, 0x4488ff, 0xffaa00, 0xff66cc, 0xffffff, 0xeeeeee];
  for (let j = 0; j < 3; j++) {
    const ic = new THREE.Mesh(icGeo, M(colors[(i * 3 + j) % colors.length]));
    ic.position.set(-SW / 2 + 0.45, 0.625 + i * 0.6, -SD / 2 + 0.5 + j * 0.15);
    interior.add(ic);
  }
}

// Drink cooler
const dcGeo = new THREE.BoxGeometry(0.6, 1.0, 0.5);
const dc = new THREE.Mesh(dcGeo, drinkCoolerMat);
dc.position.set(-SW / 2 + 0.1, 0.5, -SD / 2 + 0.3);
interior.add(dc);
const dcLightGeo = new THREE.PlaneGeometry(0.55, 0.9);
const dcLightMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.3 });
const dcLight = new THREE.Mesh(dcLightGeo, dcLightMat);
dcLight.position.set(-SW / 2 + 0.1, 0.5, -SD / 2 + 0.56);
interior.add(dcLight);

// More shelves right
for (let i = 0; i < 4; i++) {
  const shGeo = new THREE.BoxGeometry(0.6, 0.05, 0.5);
  const sh = new THREE.Mesh(shGeo, sMat2);
  sh.position.set(-SW / 2 + 0.3, 0.6 + i * 0.7, 0.5);
  interior.add(sh);
  const icGeo = new THREE.BoxGeometry(0.5, 0.06, 0.08);
  const icColors = [0xff6600, 0x00aa44, 0xffdd00, 0xff4488];
  for (let j = 0; j < 2; j++) {
    const ic = new THREE.Mesh(icGeo, M(icColors[(i * 2 + j) % 4]));
    ic.position.set(-SW / 2 + 0.3, 0.63 + i * 0.7, 0.5 + j * 0.1);
    interior.add(ic);
  }
}

// Register counter
const counterGeo = new THREE.BoxGeometry(1.2, 0.9, 0.6);
const counter = new THREE.Mesh(counterGeo, counterMat);
counter.position.set(0, 0.45, -SD / 2 + 0.3);
interior.add(counter);

// Register
const regGeo = new THREE.BoxGeometry(0.4, 0.5, 0.3);
const reg = new THREE.Mesh(regGeo, registerMat);
reg.position.set(0.5, 0.9, -SD / 2 + 0.6);
interior.add(reg);
const rsGeo = new THREE.PlaneGeometry(0.2, 0.15);
const rsMat = new THREE.MeshBasicMaterial({ color: 0x00ff44, transparent: true, opacity: 0.8 });
const rs = new THREE.Mesh(rsGeo, rsMat);
rs.position.set(0.5, 0.9, -SD / 2 + 0.75);
interior.add(rs);

// Coffee machine
const cmGeo = new THREE.BoxGeometry(0.3, 0.6, 0.35);
const cm = new THREE.Mesh(cmGeo, coffeeMat);
cm.position.set(-0.5, 0.8, -SD / 2 + 0.3);
interior.add(cm);
const csGeo = new THREE.PlaneGeometry(0.2, 0.1);
const csMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
const cs = new THREE.Mesh(csGeo, csMat);
cs.position.set(-0.5, 1.15, -SD / 2 + 0.45);
cs.userData.isSteam = true;
cs.userData.phase = Math.random() * Math.PI * 2;
interior.add(cs);

// Magazine rack
const mrGeo = new THREE.BoxGeometry(0.3, 0.5, 0.15);
const mr = new THREE.Mesh(mrGeo, magazineMat);
mr.position.set(0.6, 0.75, -SD / 2 + 0.1);
interior.add(mr);
for (let i = 0; i < 5; i++) {
  const mgGeo = new THREE.BoxGeometry(0.25, 0.02, 0.12);
  const mgColors = [0xff3333, 0x3366ff, 0x33aa33, 0xffcc00, 0xff66cc];
  const mg = new THREE.Mesh(mgGeo, M(mgColors[i]));
  mg.position.set(0.6, 0.5 + i * 0.08, -SD / 2 + 0.02);
  interior.add(mg);
}

// Freezer case
const fcGeo = new THREE.BoxGeometry(0.5, 0.6, 0.4);
const fc = new THREE.Mesh(fcGeo, freezerMat);
fc.position.set(0.3, 0.3, 0.2);
interior.add(fc);
const fgGeo = new THREE.PlaneGeometry(0.45, 0.55);
const fgMat = new THREE.MeshPhysicalMaterial({ color: 0xaaddff, transparent: true, opacity: 0.2, roughness: 0.05 });
const fg = new THREE.Mesh(fgGeo, fgMat);
fg.position.set(0.3, 0.3, 0.42);
interior.add(fg);

// Bento display
const bdGeo = new THREE.BoxGeometry(0.4, 0.3, 0.3);
const bd = new THREE.Mesh(bdGeo, bentoMat);
bd.position.set(-0.3, 0.65, 0.2);
interior.add(bd);

// Rice balls
for (let i = 0; i < 3; i++) {
  const rbGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8);
  const rb = new THREE.Mesh(rbGeo, riceBallMat);
  rb.position.set(-SW / 2 + 0.5, 0.65, -SD / 2 + 0.5);
  rb.rotation.z = (i - 1) * 0.2;
  interior.add(rb);
}

// Snack display
const sdGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
const sd = new THREE.Mesh(sdGeo, snackMat);
sd.position.set(-SW / 2 + 0.3, 1.4, -SD / 2 + 0.3);
interior.add(sd);

// Light fixtures
const lfGeo = new THREE.BoxGeometry(0.8, 0.05, 0.1);
for (let i = 0; i < 2; i++) {
  const lf = new THREE.Mesh(lfGeo, new THREE.MeshBasicMaterial({ color: 0xffeedd }));
  lf.position.set(0, SH - 0.2, -SD / 2 + 0.5 + i * 0.8);
  interior.add(lf);
  const ll = new THREE.PointLight(0xffeedd, 0.5, 3, 2);
  ll.position.set(0, SH - 0.2, -SD / 2 + 0.5 + i * 0.8);
  interior.add(ll);
}

// Interior wall panel
const wGeo = new THREE.BoxGeometry(SW - 0.2, SH - 0.1, 0.05);
const wPanel = new THREE.Mesh(wGeo, wallIntMat);
wPanel.position.set(0, SH / 2, SD / 2 - 0.08);
interior.add(wPanel);

// Oden counter
const ocGeo = new THREE.BoxGeometry(0.5, 0.4, 0.3);
const oc = new THREE.Mesh(ocGeo, counterMat);
oc.position.set(-0.7, 0.5, 0.6);
interior.add(oc);
const opGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.3, 8);
const opMat = M(0xcc4422);
const op = new THREE.Mesh(opGeo, opMat);
op.position.set(-0.7, 0.7, 0.6);
interior.add(op);
const osGeo = new THREE.PlaneGeometry(0.3, 0.15);
const osMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 });
const os = new THREE.Mesh(osGeo, osMat);
os.position.set(-0.7, 0.9, 0.6);
os.userData.isSteam = true;
os.userData.phase = Math.random() * Math.PI * 2;
interior.add(os);

// Storage door
const storeGeo = new THREE.BoxGeometry(0.6, 0.8, 0.05);
const storePanel = new THREE.Mesh(storeGeo, MD(0x556677));
storePanel.position.set(0, SH / 2, SD / 2 - 0.06);
interior.add(storePanel);

store.add(interior);
store.position.set(0, 0, 0);
scene.add(store);

// Step
const stepGeo = new THREE.BoxGeometry(1.4, 0.05, 0.3);
const step = new THREE.Mesh(stepGeo, MD(0x334455));
step.position.set(0, 0.025, SD / 2 + 0.15);
scene.add(step);

// Auto door animation
const adGroup = new THREE.Group();
adGroup.position.set(0, SH + 0.1, SD / 2 + 0.06);
const adPanelGeo = new THREE.BoxGeometry(1.4, 2.0, 0.05);
const adPanel = new THREE.Mesh(adPanelGeo, adMat);
adGroup.add(adPanel);
scene.add(adGroup);

// Street lamp 1
const lpGeo = new THREE.CylinderGeometry(0.05, 0.06, 4, 8);
const lp = new THREE.Mesh(lpGeo, M(0x667788));
lp.position.set(-4, 2, -3);
lp.castShadow = true;
scene.add(lp);
const lhGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
const lh = new THREE.Mesh(lhGeo, MD(0x445566));
lh.position.set(-4, 4.1, -3);
scene.add(lh);
const llGeo = new THREE.PlaneGeometry(0.3, 0.3);
const llMat = new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.6 });
const ll = new THREE.Mesh(llGeo, llMat);
ll.position.set(-4, 4.2, -3);
scene.add(ll);

// Street lamp 2
const lp2Geo = new THREE.CylinderGeometry(0.05, 0.06, 3.5, 8);
const lp2 = new THREE.Mesh(lp2Geo, M(0x667788));
lp2.position.set(5, 1.75, 2);
scene.add(lp2);
const lh2Geo = new THREE.BoxGeometry(0.18, 0.12, 0.18);
const lh2 = new THREE.Mesh(lh2Geo, MD(0x445566));
lh2.position.set(5, 3.9, 2);
scene.add(lh2);
const ll2Mat = new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.5 });
const ll2 = new THREE.Mesh(llGeo, ll2Mat);
ll2.position.set(5, 4.0, 2);
scene.add(ll2);

// Electric pole
const poGeo = new THREE.CylinderGeometry(0.03, 0.04, 5, 6);
const po = new THREE.Mesh(poGeo, MD(0x556677));
po.position.set(-6, 2.5, 2);
scene.add(po);
const ptGeo = new THREE.BoxGeometry(0.4, 0.05, 0.05);
const pt = new THREE.Mesh(ptGeo, MD(0x556677));
pt.position.set(-6, 5.0, 2);
scene.add(pt);
const wGeo2 = new THREE.BoxGeometry(8, 0.01, 0.01);
const wMat = new THREE.MeshBasicMaterial({ color: 0x556677 });
const w1 = new THREE.Mesh(wGeo2, wMat); w1.position.set(-1, 5.0, 2); scene.add(w1);
const w2 = new THREE.Mesh(wGeo2, wMat); w2.position.set(1, 5.0, 1); scene.add(w2);

// Road sign
const spGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6);
const sp = new THREE.Mesh(spGeo, M(0x667788));
sp.position.set(3, 1.25, -3);
scene.add(sp);
const sbGeo = new THREE.BoxGeometry(0.6, 0.4, 0.04);
const sb = new THREE.Mesh(sbGeo, M(0xeeeeee));
sb.position.set(3, 2.5, -3);
scene.add(sb);
const rsc = document.createElement('canvas');
rsc.width = 128; rsc.height = 64;
const rsc2d = rsc.getContext('2d');
rsc2d.fillStyle = '#ffcc00'; rsc2d.fillRect(0, 0, 128, 64);
rsc2d.fillStyle = '#000000'; rsc2d.font = 'bold 24px sans-serif'; rsc2d.textAlign = 'center'; rsc2d.textBaseline = 'middle';
rsc2d.fillText('LEFT', 64, 32);
const rst = new THREE.CanvasTexture(rsc);
const rsMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshBasicMaterial({ map: rst }));
rsMesh.position.set(3, 2.5, -3.03);
scene.add(rsMesh);

// Street name sign
const ssnGeo = new THREE.BoxGeometry(1.0, 0.5, 0.05);
const ssn = new THREE.Mesh(ssnGeo, M(0xcccccc));
ssn.position.set(0, 3.5, -3.5);
scene.add(ssn);
const ssc = document.createElement('canvas');
ssc.width = 200; ssc.height = 100;
const ssc2d = ssc.getContext('2d');
ssc2d.fillStyle = '#223344'; ssc2d.fillRect(0, 0, 200, 100);
ssc2d.fillStyle = '#ffffff'; ssc2d.font = 'bold 32px sans-serif'; ssc2d.textAlign = 'center'; ssc2d.textBaseline = 'middle';
ssc2d.fillText('中山路', 100, 50);
ssc2d.font = '16px sans-serif'; ssc2d.fillText('Nakayama-dori', 100, 75);
const sst = new THREE.CanvasTexture(ssc);
const ssnMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ map: sst }));
ssnMesh.position.set(0, 3.5, -3.53);
scene.add(ssnMesh);

// Guardrail
const rgGeo = new THREE.BoxGeometry(0.08, 0.6, 0.5);
const rgMat = M(0xcccccc);
for (let i = -3; i <= 3; i += 1.5) {
  const r = new THREE.Mesh(rgGeo, rgMat); r.position.set(i, 0.3, 3.5); scene.add(r);
}
const rbGeo = new THREE.BoxGeometry(0.08, 0.03, 4);
const rb = new THREE.Mesh(rbGeo, rgMat); rb.position.set(0, 0.6, 3.5); scene.add(rb);

// Vending machine
const vmGroup = new THREE.Group();
const vmbGeo = new THREE.BoxGeometry(0.8, 1.5, 0.5);
const vmb = new THREE.Mesh(vmbGeo, M(0x336699));
vmb.position.set(0, 0.75, 0);
vmGroup.add(vmb);
const vmgGeo = new THREE.PlaneGeometry(0.7, 1.2);
const vmgMat = new THREE.MeshPhysicalMaterial({ color: 0xaaddff, transparent: true, opacity: 0.15, roughness: 0.05 });
const vmg = new THREE.Mesh(vmgGeo, vmgMat); vmg.position.set(0, 0.75, 0.26); vmGroup.add(vmg);
const vmcGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);
const vmcColors = [0xff4444, 0x44aa44, 0x4488ff, 0xffaa00];
for (let i = 0; i < 6; i++) {
  const vmc = new THREE.Mesh(vmcGeo, M(vmcColors[i % 4]));
  vmc.position.set(-0.25 + (i % 3) * 0.25, 0.3 + Math.floor(i / 3) * 0.4, 0.2);
  vmGroup.add(vmc);
}
const vmsGeo = new THREE.PlaneGeometry(0.3, 0.2);
const vmsMat = new THREE.MeshBasicMaterial({ color: 0x00ff66, transparent: true, opacity: 0.5 });
const vms = new THREE.Mesh(vmsGeo, vmsMat); vms.position.set(0.4, 1.0, 0.26); vmGroup.add(vms);
vmGroup.position.set(-3, 0, 3.2);
scene.add(vmGroup);

// Bicycle
const bwGeo2 = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12);
const bwMat2 = M(0x222222);
const bwrimGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.04, 12);
const bwrimMat = M(0x999999);
const bwframeMat = M(0x555555);
const bwseatMat = M(0x333333);

const bikeGroup = new THREE.Group();
const wl = new THREE.Mesh(bwGeo2, bwMat2); wl.rotation.z = Math.PI / 2; wl.position.set(-0.2, 0.12, 0); bikeGroup.add(wl);
const wr = new THREE.Mesh(bwGeo2, bwMat2); wr.rotation.z = Math.PI / 2; wr.position.set(0.2, 0.12, 0); bikeGroup.add(wr);
const rl = new THREE.Mesh(bwrimGeo, bwrimMat); rl.rotation.z = Math.PI / 2; rl.position.set(-0.2, 0.12, 0); bikeGroup.add(rl);
const rr = new THREE.Mesh(bwrimGeo, bwrimMat); rr.rotation.z = Math.PI / 2; rr.position.set(0.2, 0.12, 0); bikeGroup.add(rr);
const f1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), bwframeMat); f1.position.set(0, 0.2, 0); f1.rotation.z = Math.PI / 6; bikeGroup.add(f1);
const f2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6), bwframeMat); f2.position.set(0, 0.2, 0); f2.rotation.z = -Math.PI / 4; bikeGroup.add(f2);
const seat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.1), bwseatMat); seat.position.set(0, 0.35, 0); bikeGroup.add(seat);
const hGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 6);
const h = new THREE.Mesh(hGeo, bwframeMat); h.position.set(0, 0.4, -0.15); h.rotation.z = 0.2; bikeGroup.add(h);
bikeGroup.position.set(2.5, 0, -1.5); bikeGroup.rotation.y = 0.3;
scene.add(bikeGroup);

const bike2Group = bikeGroup.clone();
bike2Group.position.set(-2, 0, -2); bike2Group.rotation.y = -0.5;
scene.add(bike2Group);

// Umbrella rack
const urGeo = new THREE.BoxGeometry(0.15, 0.8, 0.1);
const urMat = M(0x888888);
const ur = new THREE.Mesh(urGeo, urMat); ur.position.set(1, 0.4, 2.8); scene.add(ur);
const uGeo = new THREE.CylinderGeometry(0.01, 0.3, 1.2, 8);
const uMat = M(0xcc3366);
const u = new THREE.Mesh(uGeo, uMat); u.position.set(1, 1.3, 2.8); u.rotation.x = 0.1; scene.add(u);
const utGeo = new THREE.SphereGeometry(0.02, 6, 6);
const ut = new THREE.Mesh(utGeo, M(0x999999)); ut.position.set(1, 1.95, 2.8); scene.add(ut);

// Trash cans
const tcGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.6, 8);
const tcMat = M(0x556677);
const tc = new THREE.Mesh(tcGeo, tcMat); tc.position.set(-2.5, 0.3, 3.2); scene.add(tc);
const tlGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 8);
const tl = new THREE.Mesh(tlGeo, tcMat); tl.position.set(-2.5, 0.62, 3.2); scene.add(tl);
const tc2 = new THREE.Mesh(tcGeo, tcMat); tc2.position.set(2.5, 0.3, 3.2); scene.add(tc2);
const tl2 = new THREE.Mesh(tlGeo, tcMat); tl2.position.set(2.5, 0.62, 3.2); scene.add(tl2);

// Parking
const plGeo = new THREE.BoxGeometry(2, 0.02, 2.5);
const plMat = M(0xffffff);
const pl = new THREE.Mesh(plGeo, plMat); pl.position.set(3, 0.01, -1); scene.add(pl);
const pl2 = new THREE.Mesh(plGeo, plMat); pl2.position.set(-3, 0.01, -1); scene.add(pl2);

// Car
const carGroup = new THREE.Group();
const cbGeo = new THREE.BoxGeometry(1.8, 0.6, 0.9);
const cb = new THREE.Mesh(cbGeo, M(0xee3344)); cb.position.y = 0.3; carGroup.add(cb);
const ctGeo = new THREE.BoxGeometry(0.9, 0.4, 0.6);
const ct = new THREE.Mesh(ctGeo, M(0x3366cc)); ct.position.set(0, 0.7, 0); carGroup.add(ct);
const wcGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.15, 12);
const wcMat = M(0x222222);
[[-0.8, 0.15, -0.4], [0.8, 0.15, -0.4], [-0.8, 0.15, 0.4], [0.8, 0.15, 0.4]].forEach(p => {
  const w = new THREE.Mesh(wcGeo, wcMat); w.rotation.z = Math.PI / 2; w.position.set(p[0], p[1], p[2]); carGroup.add(w);
});
carGroup.position.set(3.5, 0, -1); scene.add(carGroup);

const carGroup2 = carGroup.clone();
carGroup2.position.set(-3.5, 0, -1);
carGroup2.children[0].material = M(0x33aa44);
carGroup2.children[1].material = M(0x557799);
scene.add(carGroup2);

// Drainage
const drGeo = new THREE.BoxGeometry(0.4, 0.04, 0.4);
const drMat = M(0x666666);
const dr = new THREE.Mesh(drGeo, drMat); dr.position.set(-1.5, 0.02, 2.5); scene.add(dr);
const dbGeo = new THREE.BoxGeometry(0.4, 0.06, 0.02);
for (let i = -1; i <= 1; i++) {
  const dbar = new THREE.Mesh(dbGeo, drMat); dbar.position.set(-1.5, 0.04, 2.5 + i * 0.12); scene.add(dbar);
}

// Crosswalk
const zlGeo = new THREE.BoxGeometry(1.0, 0.03, 0.2);
const zlMat = M(0xcccccc);
for (let i = 0; i < 5; i++) {
  const zl = new THREE.Mesh(zlGeo, zlMat); zl.position.set(i * 0.2 - 0.4, 0.015, 3.8); scene.add(zl);
}
const cwGeo = new THREE.BoxGeometry(1.0, 0.01, 1.0);
const cwMat = new THREE.MeshToonMaterial({ color: 0x334455, gradientMap, transparent: true, opacity: 0.5 });
const cw = new THREE.Mesh(cwGeo, cwMat); cw.position.set(0, 0.005, 3.5); scene.add(cw);

// Alley entrance
const alleyGeo = new THREE.BoxGeometry(1.5, 2.5, 0.5);
const alleyMat = MD(0x222233);
const alley = new THREE.Mesh(alleyGeo, alleyMat); alley.position.set(-4, 1.25, 3); scene.add(alley);
const adGeo2 = new THREE.BoxGeometry(1.3, 2.2, 0.05);
const adMat2 = M(0x445566);
const ad2 = new THREE.Mesh(adGeo2, adMat2); ad2.position.set(-4, 1.1, 3.26); scene.add(ad2);

// AC unit
const acGeo = new THREE.BoxGeometry(0.5, 0.3, 0.4);
const ac = new THREE.Mesh(acGeo, M(0x8899aa)); ac.position.set(2, 2.8, -3.5); scene.add(ac);
const avGeo = new THREE.BoxGeometry(0.52, 0.02, 0.02);
const avMat = MD(0x333333);
const av1 = new THREE.Mesh(avGeo, avMat); av1.position.set(2, 2.95, -3.3); scene.add(av1);
const av2 = new THREE.Mesh(avGeo, avMat); av2.position.set(2, 2.65, -3.7); scene.add(av2);

// Bulletin board
const bbGeo = new THREE.BoxGeometry(0.6, 0.8, 0.05);
const bbMat = M(0xeeddcc);
const bb = new THREE.Mesh(bbGeo, bbMat); bb.position.set(0, 3.2, -3.5); scene.add(bb);
const bc = document.createElement('canvas');
bc.width = 120; bc.height = 160;
const bc2d = bc.getContext('2d');
bc2d.fillStyle = '#ffeedd'; bc2d.fillRect(0, 0, 120, 160);
bc2d.fillStyle = '#cc3344'; bc2d.fillRect(5, 5, 110, 40);
bc2d.fillStyle = '#ffffff'; bc2d.font = 'bold 16px sans-serif'; bc2d.textAlign = 'center'; bc2d.textBaseline = 'middle';
bc2d.fillText('EVENT', 60, 25); bc2d.fillText('映画祭', 60, 25);
bc2d.font = '12px sans-serif'; bc2d.fillStyle = '#333333'; bc2d.fillText('2024年12月開催', 60, 50);
bc2d.fillStyle = '#cc6600'; bc2d.fillRect(5, 50, 110, 60);
bc2d.fillStyle = '#ffffff'; bc2d.fillText('ポスター', 60, 80); bc2d.fillText('お知らせ', 60, 100);
bc2d.fillRect(5, 120, 110, 35);
bc2d.fillStyle = '#3366cc'; bc2d.fillText('チラシ', 60, 138);
const bt = new THREE.CanvasTexture(bc);
const bbMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), new THREE.MeshBasicMaterial({ map: bt }));
bbMesh.position.set(0, 3.2, -3.53); scene.add(bbMesh);

const bb2 = new THREE.Mesh(bbGeo, bbMat); bb2.position.set(3, 3.2, -3.5); scene.add(bb2);

// Plant
const ppGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8);
const ppMat = M(0xcc8844);
const pp = new THREE.Mesh(ppGeo, ppMat); pp.position.set(0.3, 0.1, -3.5); scene.add(pp);
const lm = M(0x44aa44);
for (let i = 0; i < 3; i++) {
  const lg = new THREE.SphereGeometry(0.08, 6, 6);
  const l = new THREE.Mesh(lg, lm); l.position.set(0.3 + (i - 1) * 0.08, 0.2 + i * 0.06, -3.5); scene.add(l);
}

// Fog
const fogGeo = new THREE.PlaneGeometry(20, 20);
const fogMat = new THREE.MeshBasicMaterial({ color: 0x1a2030, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
const fogMesh = new THREE.Mesh(fogGeo, fogMat);
fogMesh.rotation.x = -Math.PI / 2; fogMesh.position.y = 0.02; scene.add(fogMesh);

// Lighting
const lights = createLighting(scene);
const flickers = createFlicker(lights);

// Weather system
const weather = new WeatherSystem(scene);
weather.init();

// Post-processing
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 1.5;
outlinePass.edgeThickness = 1.0;
outlinePass.visibleEdgeColor.set('#000000');
outlinePass.hiddenEdgeColor.set('#000000');
composer.addPass(outlinePass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.3, 0.5, 0.85);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// Animation loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  controls.update();
  updateFlickers(flickers, time);
  weather.update(time);

  // Auto door animation
  const doorOpen = Math.sin(time * 0.5) > 0.3;
  adGroup.position.x = doorOpen ? 0.3 : 0;
  adGroup.rotation.y = doorOpen ? 0.1 : 0;

  // Steam animation
  scene.children.forEach(child => {
    if (child.userData.isSteam) {
      child.position.y += Math.sin(time * 0.5 + child.userData.phase) * 0.002;
      child.material.opacity = Math.max(0.01, 0.05 + Math.sin(time * 0.8 + child.userData.phase) * 0.04);
    }
  });

  // Light flicker
  if (lights.streetLamp1) lights.streetLamp1.intensity = 2 + Math.sin(time * 0.3) * 0.3;
  if (lights.streetLamp2) lights.streetLamp2.intensity = 1.5 + Math.sin(time * 0.4 + 1) * 0.2;

  composer.render();
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('loader').style.display = 'none';
