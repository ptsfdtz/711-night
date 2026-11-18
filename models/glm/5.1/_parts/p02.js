const gradData = new Uint8Array([64,64,64,255, 154,154,154,255, 255,255,255,255]);
const GRAD = new T.DataTexture(gradData, 3, 1, T.RGBAFormat);
GRAD.minFilter = T.NearestFilter;
GRAD.magFilter = T.NearestFilter;
GRAD.needsUpdate = true;

function toon(c, o = {}) {
  return new T.MeshToonMaterial(Object.assign({ color:c, gradientMap:GRAD }, o));
}
function glow(c, i = 1) {
  const col = new T.Color(c);
  col.multiplyScalar(i);
  return new T.MeshBasicMaterial({ color:col });
}
const JP = '"Yu Gothic","Hiragino Kaku Gothic ProN","Meiryo","MS Gothic",sans-serif';
function ct(w, h, fn) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  fn(g, w, h);
  const t = new T.CanvasTexture(cv);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function tx(g, s, x, y, px, fill, w = 700, align = 'center') {
  g.font = w + ' ' + px + 'px ' + JP;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillStyle = fill;
  g.fillText(s, x, y);
}
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x+r, y);
  g.arcTo(x+w, y, x+w, y+h, r);
  g.arcTo(x+w, y+h, x, y+h, r);
  g.arcTo(x, y+h, x, y, r);
  g.arcTo(x, y, x+w, y, r);
  g.closePath();
}
function rnd(a, b) { return a + Math.random()*(b-a); }
function pick(a) { return a[Math.floor(Math.random()*a.length)]; }

function B(w, h, d, mat, x, y, z, ry = 0, parent = world) {
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function Cy(rT, rB, h, mat, x, y, z, seg = 14, parent = world) {
  const m = new T.Mesh(new T.CylinderGeometry(rT, rB, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function P(w, h, mat, x, y, z, ry = 0, rx = 0, parent = world) {
  const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.order = 'YXZ';
  m.rotation.y = ry;
  m.rotation.x = rx;
  parent.add(m);
  return m;
}
function rod(ax, ay, az, bx, by, bz, r, mat, parent = world) {
  const a = new T.Vector3(ax, ay, az), b = new T.Vector3(bx, by, bz);
  const d = b.clone().sub(a);
  const m = new T.Mesh(new T.CylinderGeometry(r, r, d.length(), 8), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), d.normalize());
  m.castShadow = true;
  parent.add(m);
  return m;
}
function wire(a, b, sag, mat) {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new T.QuadraticBezierCurve3(a, mid, b);
  const m = new T.Mesh(new T.TubeGeometry(curve, 16, 0.021, 5), mat);
  m.userData.noOutline = true;
  world.add(m);
  return m;
}

const M = {
  cream: toon(0xefe6d0), creamDim: toon(0xd6cab0),
  teal: toon(0x2f9e97), tealDeep: toon(0x1e6b66), tealInk: toon(0x143c3f),
  coral: toon(0xdd7854),
  ink: toon(0x20242e), ink2: toon(0x161a22),
  steel: toon(0x97a0b0), steelD: toon(0x5c6575),
  white: toon(0xe9edf3), offw: toon(0xcfd4da),
  wood: toon(0x9d7c58), woodD: toon(0x6f543a),
  yellow: toon(0xd9b13b), red: toon(0xc05050),
  navy: toon(0x2a3a55), navyD: toon(0x232c40),
  leaf: toon(0x41603c), leafD: toon(0x2c422a),
  gray: toon(0x8a92a0), grayD: toon(0x4c545f),
  conc: toon(0x3d4553), concP: toon(0x84888f),
  black: toon(0x11141b), green: toon(0x2c4a44)
};
const GLASS = new T.MeshPhongMaterial({ color:0x9fc4e8, transparent:true, opacity:0.15, shininess:90, specular:0x9ac2e8, depthWrite:false });
const GLASS2 = new T.MeshPhongMaterial({ color:0xa8ccec, transparent:true, opacity:0.22, shininess:90, specular:0xa8cce8, depthWrite:false, side:T.DoubleSide });

const skyMat = new T.ShaderMaterial({
  side: T.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: 'varying vec3 vW; void main(){ float h = normalize(vW).y; vec3 top = vec3(0.010,0.014,0.030); vec3 hor = vec3(0.062,0.093,0.170); vec3 bot = vec3(0.026,0.036,0.062); vec3 c = h > 0.0 ? mix(hor, top, pow(h,0.55)) : mix(hor, bot, pow(-h,0.7)); c += vec3(0.10,0.16,0.27)*exp(-abs(h)*7.0)*0.4; gl_FragColor = vec4(c,1.0); }'
});
const sky = new T.Mesh(new T.SphereGeometry(72, 24, 16), skyMat);
sky.userData.noOutline = true;
scene.add(sky);

const hemi = new T.HemisphereLight(0x2c3d66, 0x11141d, 0.85);
scene.add(hemi);
const moon = new T.DirectionalLight(0x5f7bb5, 1.35);
moon.position.set(16, 20, -8);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -14; moon.shadow.camera.right = 14;
moon.shadow.camera.top = 14; moon.shadow.camera.bottom = -14;
moon.shadow.camera.near = 2; moon.shadow.camera.far = 60;
moon.shadow.bias = -0.0003;
moon.shadow.normalBias = 0.03;
scene.add(moon);
scene.add(moon.target);

const discTex = ct(128, 128, (g) => {
  const r = g.createRadialGradient(64,64,4, 64,64,64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.4, 'rgba(255,255,255,0.42)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0,0,128,128);
});
function disc(r, color, x, y, z, opacity = 0.35, parent = world) {
  const m = new T.Mesh(new T.PlaneGeometry(r*2, r*2), new T.MeshBasicMaterial({ map:discTex, color, transparent:true, opacity, blending:T.AdditiveBlending, depthWrite:false }));
  m.rotation.x = -Math.PI/2;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function texPlane(w, h, tex, x, y, z, ry = 0, rx = 0, bright = 1, parent = world) {
  const mat = new T.MeshBasicMaterial({ map:tex, transparent:true });
  mat.color.setScalar(bright);
  const m = P(w, h, mat, x, y, z, ry, rx, parent);
  return m;
}
