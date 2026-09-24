const vendFix = vendLight;
vendFix.position.set(4.9, 1.5, -2.3);

Cy(0.27, 0.24, 0.76, M.ink2, 3.98, 0.52, 1.28);
const umRim = new T.Mesh(new T.TorusGeometry(0.27, 0.032, 8, 18), M.steelD);
umRim.rotation.x = Math.PI/2;
umRim.position.set(3.98, 0.9, 1.28);
umRim.castShadow = true;
world.add(umRim);
const umCols = [0xdfe8f0, 0x7fb0e8, 0xe88f92];
[[3.9,1.2,0.08],[4.02,1.36,-0.06],[4.09,1.21,0.12]].forEach((u, i) => {
  Cy(0.016, 0.016, 0.9, M.woodD, u[0], 0.63, u[1]);
  const cone = new T.Mesh(new T.ConeGeometry(0.38, 0.32, 12), toon(umCols[i]));
  cone.position.set(u[0], 1.06, u[1]);
  cone.rotation.z = u[2];
  cone.castShadow = true;
  world.add(cone);
  Cy(0.012, 0.012, 0.1, M.ink2, u[0] + Math.sin(u[2])*0.05, 1.24, u[1]);
});

for (const [bx, bz] of [[4.68, 0.52], [4.68, 1.1]]) {
  Cy(0.26, 0.23, 0.8, toon(0x546a76), bx, 0.54, bz);
  const rim = new T.Mesh(new T.TorusGeometry(0.26, 0.03, 8, 16), M.steelD);
  rim.rotation.x = Math.PI/2;
  rim.position.set(bx, 0.94, bz);
  world.add(rim);
  const lid = new T.Mesh(new T.CylinderGeometry(0.27, 0.27, 0.05, 16), toon(0x546a76));
  lid.position.set(bx, 0.965, bz);
  lid.castShadow = true;
  world.add(lid);
}
Cy(0.26, 0.23, 0.8, toon(0x3a6a4a), -5.3, 0.43, -3.72);

const bagGeo = new T.SphereGeometry(0.3, 9, 7);
[[-1.1,-3.78,0.32,0x1c2027],[-1.45,-3.68,0.26,0x1c2027],[-0.85,-3.66,0.24,0x1c2027],[-1.25,-3.9,0.22,0xcfd4da]].forEach((b, i) => {
  const m = new T.Mesh(bagGeo, toon(b[3]));
  m.scale.set(b[2]/0.3, b[2]/0.75, b[2]/0.32);
  m.position.set(b[0], 0.035 + b[2]*0.68, b[1]);
  m.rotation.y = i * 1.3;
  m.castShadow = true;
  world.add(m);
  Cy(0.04, 0.05, 0.07, toon(b[3]), b[0], 0.035 + b[2]*1.36, b[1], 6);
});

for (let k=0;k<7;k++) B(0.045, 0.64, 0.045, M.green, -3.1+k*0.655, 0.465, 4.02);
B(3.99, 0.05, 0.05, M.green, -1.13, 0.78, 4.02);
B(3.99, 0.04, 0.04, M.green, -1.13, 0.42, 4.02);

const rs1 = ct(512, 128, (g) => {
  g.fillStyle = '#1a4a8a'; rr(g, 6, 6, 500, 116, 18); g.fill();
  g.strokeStyle = '#e8eef2'; g.lineWidth = 6; rr(g, 6, 6, 500, 116, 18); g.stroke();
  tx(g, '蛍坂通り', 300, 64, 62, '#f3f6fa', 800);
  g.fillStyle = '#f3f6fa';
  g.beginPath(); g.moveTo(60, 64); g.lineTo(110, 38); g.lineTo(110, 90); g.closePath(); g.fill();
  g.fillRect(105, 56, 70, 16);
});
const rs2 = ct(512, 128, (g) => {
  g.fillStyle = '#1a4a8a'; rr(g, 6, 6, 500, 116, 18); g.fill();
  g.strokeStyle = '#e8eef2'; g.lineWidth = 6; rr(g, 6, 6, 500, 116, 18); g.stroke();
  tx(g, '銀杏通り', 212, 64, 62, '#f3f6fa', 800);
  g.fillStyle = '#f3f6fa';
  g.fillRect(298, 56, 70, 16);
  g.beginPath(); g.moveTo(452, 64); g.lineTo(402, 38); g.lineTo(402, 90); g.closePath(); g.fill();
});
Cy(0.042, 0.052, 3.05, M.steelD, 4.3, 1.67, 4.55);
const rsp1 = new T.MeshBasicMaterial({ map:rs1, transparent:true, side:T.DoubleSide });
rsp1.color.setScalar(0.9);
const rsp2 = new T.MeshBasicMaterial({ map:rs2, transparent:true, side:T.DoubleSide });
rsp2.color.setScalar(0.9);
P(1.28, 0.32, rsp1, 4.3, 2.86, 4.55, Math.PI/4);
P(1.28, 0.32, rsp2, 4.3, 2.42, 4.55, Math.PI/4 - 0.22);

const grGeo1 = new T.TorusGeometry(1.05, 0.045, 8, 26, Math.PI/2);
const grGeo2 = new T.TorusGeometry(1.05, 0.035, 8, 26, Math.PI/2);
function arcRail(geo, y) {
  const m = new T.Mesh(geo, M.yellow);
  m.rotation.order = 'YXZ';
  m.rotation.x = -Math.PI/2;
  m.rotation.y = Math.PI/2;
  m.position.set(6, y, 6);
  m.castShadow = true;
  world.add(m);
}
arcRail(grGeo1, 0.62);
arcRail(grGeo2, 0.34);
for (const [px, pz] of [[6,4.95],[5.26,5.26],[4.95,6]]) {
  Cy(0.05, 0.05, 0.72, M.yellow, px, 0.5, pz);
  B(0.12, 0.07, 0.12, M.ink2, px, 0.55, pz);
  B(0.12, 0.07, 0.12, M.ink2, px, 0.3, pz);
  const ref = new T.Mesh(new T.SphereGeometry(0.035, 8, 8), glow(0xd84848, 1.6));
  ref.position.set(px, 0.72, pz);
  world.add(ref);
}

for (const [bx, bz] of [[-7.25, 3.95], [-4.75, 3.95]]) {
  Cy(0.1, 0.11, 0.6, M.concP, bx, 0.44, bz);
  B(0.23, 0.09, 0.23, M.yellow, bx, 0.5, bz);
}
