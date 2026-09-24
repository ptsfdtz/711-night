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
