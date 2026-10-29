const _outMats = {};
function outlineMat(t) {
  if (_outMats[t]) return _outMats[t];
  const m = new T.ShaderMaterial({
    uniforms: { uT: { value: t } },
    side: T.BackSide,
    vertexShader: [
      'uniform float uT;',
      'void main(){',
      '  vec3 p = position + normal*uT;',
      '  #ifdef USE_INSTANCING',
      '    gl_Position = projectionMatrix*modelViewMatrix*instanceMatrix*vec4(p,1.0);',
      '  #else',
      '    gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);',
      '  #endif',
      '}'
    ].join('\n'),
    fragmentShader: 'void main(){ gl_FragColor = vec4(0.016,0.023,0.05,1.0); }'
  });
  _outMats[t] = m;
  return m;
}
const outlineTargets = [];
world.traverse(o => {
  if (o.userData.noOutline || o.isReflector) return;
  if (o.isInstancedMesh) { outlineTargets.push({ im:o }); return; }
  if (!o.isMesh) return;
  const mat = o.material;
  const arr = Array.isArray(mat) ? mat : [mat];
  if (arr.some(mm => mm.transparent || mm.isShaderMaterial)) return;
  const gt = o.geometry.type;
  if (gt === 'PlaneGeometry' || gt === 'RingGeometry' || gt === 'ShapeGeometry') return;
  outlineTargets.push({ mesh:o });
});
for (const t of outlineTargets) {
  if (t.mesh) {
    const hull = new T.Mesh(t.mesh.geometry, outlineMat(t.mesh.userData.outlineT || 0.026));
    t.mesh.add(hull);
  } else {
    const src = t.im;
    const hull = new T.InstancedMesh(src.geometry, outlineMat(src.userData.outlineT || 0.02), src.count);
    hull.instanceMatrix = src.instanceMatrix;
    hull.frustumCulled = false;
    src.parent.add(hull);
  }
}

const RAIN_N = 850;
const rainPos = new Float32Array(RAIN_N*6);
const rainSeed = new Float32Array(RAIN_N*2);
const rainTip = new Float32Array(RAIN_N*2);
for (let i=0;i<RAIN_N;i++) {
  let x, z, tries = 0;
  do { x = rnd(-11.5, 11.5); z = rnd(-11.5, 11.5); tries++; }
  while (tries < 10 && x > -3.85 && x < 4.78 && z > -3.3 && z < 4.35);
  const s = Math.random();
  for (let v=0;v<2;v++) {
    const idx = i*2 + v;
    rainPos[idx*3] = x; rainPos[idx*3+1] = 0; rainPos[idx*3+2] = z;
    rainSeed[idx] = s; rainTip[idx] = v;
  }
}
const rainGeo = new T.BufferGeometry();
rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
rainGeo.setAttribute('aSeed', new T.BufferAttribute(rainSeed, 1));
rainGeo.setAttribute('aTip', new T.BufferAttribute(rainTip, 1));
const rainTime = { value: 0 };
const rainMat = new T.ShaderMaterial({
  uniforms: { uTime: rainTime, uH: { value: 13 } },
  transparent: true, depthWrite: false, blending: T.AdditiveBlending,
  vertexShader: [
    'attribute float aSeed;',
    'attribute float aTip;',
    'uniform float uTime;',
    'uniform float uH;',
    'varying float vA;',
    'void main(){',
    '  float sp = 5.0 + 5.0*fract(aSeed*7.31);',
    '  float f = fract(aSeed*13.7 + uTime*sp/uH);',
    '  vec3 p = position;',
    '  p.y = (1.0-f)*uH - aTip*0.6;',
    '  p.x += aTip*0.13;',
    '  vA = (0.3+0.5*fract(aSeed*3.7)) * smoothstep(0.0,0.08,f) * smoothstep(1.0,0.92,f);',
    '  gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);',
    '}'
  ].join('\n'),
  fragmentShader: 'varying float vA; void main(){ gl_FragColor = vec4(0.62,0.75,0.95, vA*0.5); }'
});
const rain = new T.LineSegments(rainGeo, rainMat);
rain.frustumCulled = false;
world.add(rain);

const rippleGeo = new T.RingGeometry(0.86, 1, 20);
const ripples = [];
for (let i=0;i<26;i++) {
  const m = new T.Mesh(rippleGeo, new T.MeshBasicMaterial({ color:0x9fd0ea, transparent:true, opacity:0, blending:T.AdditiveBlending, depthWrite:false, side:T.DoubleSide }));
  m.rotation.x = -Math.PI/2;
  m.visible = false;
  m.userData.noOutline = true;
  world.add(m);
  ripples.push({ m, t:0, dur:0.8, r1:0.3, active:false });
}
const puddlePts = PUDDLES.filter(p => p.a < 120);
function spawnRipple(x, y, z, r = 0.3) {
  const rp = ripples.find(q => !q.active);
  if (!rp) return;
  rp.active = true;
  rp.t = 0;
  rp.r1 = r;
  rp.m.position.set(x, y + 0.004, z);
  rp.m.visible = true;
}

const dripGeo = new T.SphereGeometry(0.032, 6, 5);
const dripMat = new T.MeshBasicMaterial({ color:0xbcd8ee, transparent:true, opacity:0.85 });
const dripSpots = [
  [-2.8,3.0,4.12,0.147],[-1.2,3.0,4.12,0.147],[0.4,3.0,4.12,0.147],[1.5,3.0,4.12,0.147],
  [2.54,3.0,3.33,0.147],[3.72,3.0,2.15,0.147],
  [4.6,3.0,-1.3,0.147],[4.6,3.0,0.0,0.147],
  [-3.66,3.72,0.6,0.045],[-3.66,3.72,2.4,0.045],
  [0.0,3.72,-3.14,0.045],
  [-6.2,7.9,-4.45,0.045],
  [-9.3,6.9,3.62,0.147]
];
const drips = [];
for (const d of dripSpots) {
  const m = new T.Mesh(dripGeo, dripMat);
  m.scale.set(1, 2.4, 1);
  m.visible = false;
  m.userData.noOutline = true;
  world.add(m);
  drips.push({ m, x:d[0], y0:d[1], z:d[2], yl:d[3], state:'wait', t:rnd(0.1,4) });
}

const steamTex = ct(128, 128, (g) => {
  const r = g.createRadialGradient(64,64,4, 64,64,62);
  r.addColorStop(0, 'rgba(255,255,255,0.9)');
  r.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0,0,128,128);
});
const steams = [];
for (const s of [[0.54,1.34,-2.375],[0.72,1.34,-2.375],[0.9,1.34,-2.375],[-2.12,1.6,-2.32]]) {
  const sp = new T.Sprite(new T.SpriteMaterial({ map:steamTex, color:0xfff6e8, transparent:true, opacity:0, depthWrite:false }));
  sp.scale.set(0.2, 0.2, 1);
  world.add(sp);
  steams.push({ sp, x:s[0], y0:s[1], z:s[2], off:rnd(0,2.4) });
}
