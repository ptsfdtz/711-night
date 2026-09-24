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
