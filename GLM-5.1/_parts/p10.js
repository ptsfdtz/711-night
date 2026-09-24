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
