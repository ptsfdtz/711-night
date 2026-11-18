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
