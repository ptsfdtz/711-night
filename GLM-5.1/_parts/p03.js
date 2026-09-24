const PUDDLES = [
  {x:-4.2,z:7.4,rx:1.7,rz:0.85,a:70,y:0.05},
  {x:0.6,z:8.9,rx:1.2,rz:0.65,a:78,y:0.05},
  {x:-8.6,z:6.7,rx:1.5,rz:0.6,a:65,y:0.05},
  {x:3.1,z:9.3,rx:1.0,rz:0.5,a:72,y:0.05},
  {x:-1.5,z:6.9,rx:0.8,rz:0.45,a:85,y:0.05},
  {x:7.1,z:-2.6,rx:0.8,rz:1.5,a:68,y:0.05},
  {x:8.4,z:2.7,rx:1.2,rz:0.8,a:74,y:0.05},
  {x:7.6,z:-7.7,rx:1.3,rz:0.9,a:70,y:0.05},
  {x:8.8,z:-4.9,rx:0.9,rz:0.7,a:80,y:0.05},
  {x:7.9,z:7.8,rx:2.0,rz:1.9,a:62,y:0.05},
  {x:8.8,z:6.7,rx:1.1,rz:0.8,a:75,y:0.05},
  {x:6.8,z:8.9,rx:0.9,rz:0.8,a:78,y:0.05},
  {x:5.3,z:8.2,rx:0.8,rz:2.6,a:200,y:0.05},
  {x:8.2,z:5.3,rx:2.6,rz:0.8,a:200,y:0.05},
  {x:-6.2,z:1.7,rx:1.4,rz:0.7,a:66,y:0.045},
  {x:-5.1,z:2.9,rx:0.9,rz:0.55,a:74,y:0.045},
  {x:-2.6,z:-3.65,rx:1.2,rz:0.42,a:64,y:0.045},
  {x:1.1,z:-3.62,rx:0.75,rz:0.38,a:72,y:0.045},
  {x:-6.5,z:-3.68,rx:0.9,rz:0.4,a:68,y:0.045},
  {x:-6.0,z:4.8,rx:0.8,rz:0.5,a:70,y:0.045}
];

const baseGeo = new RoundedBoxGeometry(21, 1.0, 21, 3, 0.14);
const base = new T.Mesh(baseGeo, toon(0x10131b));
base.position.y = -0.5;
base.receiveShadow = true;
world.add(base);

const plateTex = ct(768, 192, (g, w, h) => {
  g.fillStyle = '#141926'; g.fillRect(0,0,w,h);
  g.strokeStyle = '#2f9e97'; g.lineWidth = 5;
  g.strokeRect(10,10,w-20,h-20);
  g.strokeStyle = 'rgba(47,158,151,0.35)'; g.lineWidth = 2;
  g.strokeRect(24,24,w-48,h-48);
  tx(g, '雨夜のコンビニ', w/2, 62, 54, '#e8dfc8');
  tx(g, '蛍坂通り · HOTARU STORE — 1/150 NIGHT DIORAMA', w/2, 128, 26, '#8fa3b8', 400);
});
const plate = texPlane(3.6, 0.9, plateTex, 4.6, -0.5, 10.51, 0, 0, 1.0);
plate.userData.noOutline = true;

const refl = new Reflector(new T.PlaneGeometry(21, 21), { clipBias:0.003, textureWidth:512, textureHeight:512, color:0x53606f });
refl.rotation.x = -Math.PI/2;
refl.position.y = 0.015;
world.add(refl);

const aspCol = ct(1024, 1024, (g, w, h) => {
  g.fillStyle = '#252c3b'; g.fillRect(0,0,w,h);
  for (let i=0;i<5200;i++) {
    g.fillStyle = 'rgba(' + (Math.random()<0.5 ? '17,21,31' : '58,66,82') + ',' + rnd(0.04,0.14).toFixed(2) + ')';
    g.fillRect(Math.random()*w, Math.random()*h, rnd(1,3), rnd(1,3));
  }
  for (let i=0;i<26;i++) {
    g.fillStyle = 'rgba(14,17,26,' + rnd(0.05,0.12).toFixed(2) + ')';
    g.beginPath();
    g.ellipse(Math.random()*w, Math.random()*h, rnd(40,130), rnd(30,90), rnd(0,3.1), 0, 6.3);
    g.fill();
  }
});
const aspAlp = ct(1024, 1024, (g, w, h) => {
  g.fillStyle = '#efefef'; g.fillRect(0,0,w,h);
  const px = v => (v+10.5)*48.76, pz = v => (10.5-v)*48.76;
  for (const p of PUDDLES) {
    g.save();
    g.translate(px(p.x), pz(p.z));
    g.scale(p.rx*48.76, p.rz*48.76);
    const gr = g.createRadialGradient(0,0,0.1, 0,0,1);
    gr.addColorStop(0, 'rgba(' + p.a + ',' + p.a + ',' + p.a + ',1)');
    gr.addColorStop(0.72, 'rgba(' + p.a + ',' + p.a + ',' + p.a + ',0.85)');
    gr.addColorStop(1, 'rgba(235,235,235,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(0,0,1,0,6.3); g.fill();
    g.restore();
  }
  g.strokeStyle = 'rgba(170,170,170,0.5)';
  g.lineWidth = 10;
  g.beginPath(); g.moveTo(0, pz(6.2)); g.lineTo(px(4.6), pz(6.2)); g.stroke();
  g.beginPath(); g.moveTo(px(6.2), 0); g.lineTo(px(6.2), pz(4.6)); g.stroke();
});
aspAlp.colorSpace = T.NoColorSpace;
const aspMat = new T.MeshToonMaterial({ color:0xbfc6d6, map:aspCol, alphaMap:aspAlp, gradientMap:GRAD, transparent:true });
const asp = new T.Mesh(new T.PlaneGeometry(21, 21), aspMat);
asp.rotation.x = -Math.PI/2;
asp.position.y = 0.035;
asp.receiveShadow = true;
asp.userData.noOutline = true;
world.add(asp);

const walkTex = ct(128, 128, (g, w, h) => {
  g.fillStyle = '#3d4553'; g.fillRect(0,0,w,h);
  g.strokeStyle = '#323947'; g.lineWidth = 3;
  g.strokeRect(0,0,w,h);
  for (let i=0;i<50;i++) {
    g.fillStyle = 'rgba(24,28,38,' + rnd(0.05,0.15).toFixed(2) + ')';
    g.fillRect(Math.random()*w, Math.random()*h, 2, 2);
  }
});
function walkSlab(x0, x1, z0, z1) {
  const w = x1-x0, d = z1-z0;
  B(w, 0.145, d, M.conc, (x0+x1)/2, 0.0725, (z0+z1)/2);
  const t = walkTex.clone();
  t.wrapS = T.RepeatWrapping; t.wrapT = T.RepeatWrapping;
  t.repeat.set(w/1.15, d/1.15);
  const m = P(w, d, new T.MeshToonMaterial({ map:t, gradientMap:GRAD }), (x0+x1)/2, 0.147, (z0+z1)/2, 0, -Math.PI/2);
  m.receiveShadow = true;
  m.userData.noOutline = true;
  return m;
}
walkSlab(-10.5, 3.5, -10.5, -4.35);
walkSlab(-10.5, 3.5, -3.0, -0.2);
walkSlab(-10.5, -7.9, -0.2, 3.5);
walkSlab(-3.9, 3.5, -0.2, 3.5);
walkSlab(-10.5, -7.3, 3.5, 6.0);
walkSlab(-4.7, 6.0, 3.5, 6.0);
walkSlab(3.5, 6.0, -10.5, 6.0);

const tacTex = ct(256, 128, (g, w, h) => {
  g.fillStyle = '#c8a433'; g.fillRect(0,0,w,h);
  g.fillStyle = '#b3922c';
  for (let y=0;y<4;y++) for (let x=0;x<8;x++) {
    g.beginPath(); g.arc(16+x*32, 16+y*32, 9, 0, 6.3); g.fill();
  }
  g.strokeStyle = '#8f7422'; g.lineWidth = 6; g.strokeRect(0,0,w,h);
});
const tac1 = P(1.15, 0.55, new T.MeshToonMaterial({ map:tacTex, gradientMap:GRAD }), 5.3, 0.1485, 5.7, 0, -Math.PI/2);
const tac2 = P(0.55, 1.15, new T.MeshToonMaterial({ map:tacTex, gradientMap:GRAD }), 5.7, 0.1485, 5.3, 0, -Math.PI/2);
tac1.userData.noOutline = true; tac2.userData.noOutline = true;
