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
