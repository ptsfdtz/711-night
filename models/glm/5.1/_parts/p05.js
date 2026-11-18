const streakTime = { value: 0 };
function streakMat(seed) {
  return new T.ShaderMaterial({
    uniforms: { uTime: streakTime, uSeed: { value: seed } },
    transparent: true, depthWrite: false, side: T.FrontSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: [
      'varying vec2 vUv;',
      'uniform float uTime; uniform float uSeed;',
      'float h1(float n){ return fract(sin(n*127.1+uSeed)*43758.5453); }',
      'void main(){',
      '  vec3 col = vec3(0.30,0.42,0.58);',
      '  float a = 0.09;',
      '  float acc = 0.0;',
      '  for(int i=0;i<3;i++){',
      '    float fi = float(i);',
      '    float cols = 16.0 + fi*10.0;',
      '    float cx = floor(vUv.x*cols);',
      '    float r1 = h1(cx*3.1+fi*17.7);',
      '    float r2 = h1(cx*9.3+fi*5.1);',
      '    float speed = 0.045 + r1*0.075;',
      '    float yh = 1.0 - fract(uTime*speed + r2*7.0);',
      '    float d = vUv.y - yh;',
      '    float head = smoothstep(0.045, 0.0, abs(d));',
      '    float tail = smoothstep(0.0, -0.22, d);',
      '    float wide = 0.45 + 0.55*r2;',
      '    acc += (head*1.3 + tail*0.4) * wide;',
      '  }',
      '  vec2 g = vUv*vec2(80.0,54.0);',
      '  vec2 id = floor(g);',
      '  float hd = h1(id.x*13.7+id.y*7.3);',
      '  float drop = smoothstep(0.17,0.04,length(fract(g)-vec2(0.5,0.55))) * step(0.94,hd);',
      '  a += acc*0.5 + drop*0.3;',
      '  col += acc*0.4 + drop*0.25;',
      '  gl_FragColor = vec4(col, clamp(a,0.0,0.62));',
      '}'
    ].join('\n')
  });
}

B(7.12, 3.3, 0.12, M.cream, 0, 1.79, -3.0);
B(0.12, 3.3, 6.0, M.cream, -3.5, 1.79, 0);
B(0.12, 3.3, 1.16, M.cream, 3.5, 1.79, -2.42);
B(4.76, 0.54, 0.12, M.cream, -1.15, 3.17, 3.0);
B(4.76, 0.36, 0.15, M.creamDim, -1.15, 0.32, 3.0);
B(0.12, 0.54, 2.58, M.cream, 3.5, 3.17, -0.55);
B(0.12, 0.36, 2.58, M.creamDim, 3.5, 0.32, -0.55);
B(0.2, 3.3, 0.2, M.cream, -3.42, 1.79, 2.92);
B(0.18, 3.3, 0.18, M.cream, 1.25, 1.79, 2.93);
B(0.18, 3.3, 0.18, M.cream, 3.44, 1.79, 0.76);
B(0.5, 3.3, 0.13, M.cream, 1.367, 1.79, 2.833, Math.PI/4);
B(0.5, 3.3, 0.13, M.cream, 3.333, 1.79, 0.867, Math.PI/4);
B(2.42, 0.5, 0.13, M.cream, 2.35, 3.19, 1.85, Math.PI/4);

P(4.66, 2.4, streakMat(1.0), -1.11, 1.7, 2.98);
P(2.58, 2.4, streakMat(7.0), 3.48, 1.7, -0.55, -Math.PI/2);
for (const mx of [-2.15, -0.85, 0.45]) B(0.075, 2.4, 0.1, M.tealDeep, mx, 1.7, 3.0);
for (const mz of [-1.05, -0.2]) B(0.1, 2.4, 0.075, M.tealDeep, 3.5, 1.7, mz);

const doorGrp = new T.Group();
doorGrp.position.set(2.35, 0, 1.85);
doorGrp.rotation.y = Math.PI/4;
world.add(doorGrp);
B(2.42, 0.34, 0.16, M.cream, 0, 2.78, 0, 0, doorGrp);
B(2.4, 0.05, 0.3, M.ink2, 0, 0.165, 0, 0, doorGrp);
B(0.3, 0.08, 0.09, M.ink, 0, 2.53, 0.11, 0, doorGrp);
const doorLED = new T.Mesh(new T.SphereGeometry(0.024, 8, 8), glow(0xff8866, 1.6));
doorLED.position.set(0, 2.53, 0.16);
doorGrp.add(doorLED);

const doorPanels = [];
for (const s of [-1, 1]) {
  const p = new T.Group();
  p.position.x = s * 0.575;
  doorGrp.add(p);
  doorPanels.push(p);
  B(1.16, 0.44, 0.075, M.tealDeep, 0, 0.36, 0, 0, p);
  B(1.16, 0.13, 0.075, M.tealDeep, 0, 2.625, 0, 0, p);
  B(0.06, 2.14, 0.075, M.tealDeep, -0.55, 1.56, 0.005, 0, p);
  B(0.06, 2.14, 0.075, M.tealDeep, 0.55, 1.56, 0.005, 0, p);
  const gl = P(1.02, 2.0, streakMat(s < 0 ? 3.0 : 11.0), 0, 1.56, 0.02, 0, 0, p);
  gl.rotation.order = 'YXZ';
}
