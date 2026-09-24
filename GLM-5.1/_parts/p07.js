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
