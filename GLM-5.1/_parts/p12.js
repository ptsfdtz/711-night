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
