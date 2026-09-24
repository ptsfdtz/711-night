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
