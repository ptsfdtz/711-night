const doorState = { phase:'closed', t:rnd(7,12), k:0 };
const doorLEDmat = doorLED.material;
function setDoorK(k) {
  doorPanels[0].position.x = -0.575 - 1.055*k;
  doorPanels[1].position.x = 0.575 + 1.055*k;
}
function easeIO(x) { return x < 0.5 ? 4*x*x*x : 1 - Math.pow(-2*x+2, 3)/2; }

let flickNext = rnd(6,12), flickT = -1;
const rippleAcc = { v: 0 };
let frame = 0;

animated.push((t, dt) => {
  rainTime.value = t;
  streakTime.value = t;
  if (alleyFan) alleyFan.rotation.z -= dt*8.5;

  doorState.t -= dt;
  if (doorState.phase === 'closed') {
    setDoorK(0);
    doorLEDmat.color.setHex(0x5a2a1e);
    if (doorState.t <= 0) { doorState.phase = 'sensing'; doorState.t = 0.7; }
  } else if (doorState.phase === 'sensing') {
    doorLEDmat.color.setHex(Math.sin(t*38) > 0 ? 0xff6a4a : 0x5a2a1e);
    if (doorState.t <= 0) { doorState.phase = 'opening'; doorState.t = 0.95; }
  } else if (doorState.phase === 'opening') {
    doorState.k = 1 - Math.max(doorState.t, 0)/0.95;
    setDoorK(easeIO(doorState.k));
    doorLEDmat.color.setHex(0xff6a4a);
    if (doorState.t <= 0) { doorState.phase = 'open'; doorState.t = 2.6; }
  } else if (doorState.phase === 'open') {
    setDoorK(1);
    doorLEDmat.color.setHex(0xff6a4a);
    if (doorState.t <= 0) { doorState.phase = 'closing'; doorState.t = 1.25; }
  } else if (doorState.phase === 'closing') {
    doorState.k = Math.max(doorState.t, 0)/1.25;
    setDoorK(easeIO(doorState.k));
    doorLEDmat.color.setHex(Math.sin(t*30) > 0 ? 0xff6a4a : 0x5a2a1e);
    if (doorState.t <= 0) { doorState.phase = 'closed'; doorState.t = rnd(13,24); }
  }

  if (t > flickNext) { flickT = 0.5; flickNext = t + rnd(7,15); }
  let glowK = 1;
  if (flickT > 0) {
    flickT -= dt;
    glowK = Math.abs(Math.sin(t*44)) > 0.35 ? rnd(0.3,0.7) : 1;
  }
  for (const fm of fasciaGlows) fm.color.setScalar(glowK);
  vendA.color.setScalar(1 + 0.04*Math.sin(t*31));
  vendB.color.setScalar(1 + 0.04*Math.sin(t*27+2));

  const CYC = 19;
  const c = t % CYC;
  const mastKind = c < 10 ? 'green' : (c < 11.8 ? 'yellow' : 'red');
  for (const b of mastBulbs) {
    const on = b.kind === mastKind;
    b.mat.color.copy(on ? b.on : b.off);
    b.halo.opacity = on ? 0.55 : 0.05;
  }
  const cd = (t + 5.5) % CYC;
  const distKind = cd < 10 ? 'green' : (cd < 11.8 ? 'yellow' : 'red');
  for (const b of distBulbs) b.mat.color.copy(b.kind === distKind ? b.on : b.off);
  const walking = c >= 11.8 && c < 16;
  const blinkWalk = c >= 15 && Math.sin(t*10) > 0;
  pedW.visible = walking && !blinkWalk;
  pedS.visible = !walking || blinkWalk;
  const tgc = mastKind === 'red' ? 0xff4838 : (mastKind === 'yellow' ? 0xffc838 : 0x58d868);
  trafficGlow.material.color.setHex(tgc);
  trafficGlow.material.opacity = 0.2 + 0.08*Math.sin(t*3);

  const kv = 0.5 + 0.5*Math.sin(t*2.3)*Math.sin(t*0.7+1);
  tvMat.color.setRGB(0.2+0.28*kv, 0.3+0.34*kv, 0.52+0.3*kv);

  rippleAcc.v += dt;
  while (rippleAcc.v > 0.11) {
    rippleAcc.v -= 0.11;
    const pp = pick(puddlePts);
    spawnRipple(pp.x + rnd(-pp.rx, pp.rx)*0.6, pp.y, pp.z + rnd(-pp.rz, pp.rz)*0.6, rnd(0.2, 0.4));
  }
  for (const rp of ripples) {
    if (!rp.active) continue;
    rp.t += dt;
    const k = rp.t / rp.dur;
    if (k >= 1) { rp.active = false; rp.m.visible = false; continue; }
    const e = 1 - Math.pow(1-k, 2);
    const s = 0.05 + (rp.r1 - 0.05)*e;
    rp.m.scale.set(s, s, 1);
    rp.m.material.opacity = 0.42*(1-k);
  }

  for (const d of drips) {
    d.t -= dt;
    if (d.state === 'wait') {
      if (d.t <= 0) { d.state = 'swell'; d.t = 0.8; d.m.visible = true; }
    } else if (d.state === 'swell') {
      const k = 1 - Math.max(d.t, 0)/0.8;
      d.m.position.set(d.x, d.y0 - 0.02, d.z);
      d.m.scale.set(0.5+k*0.6, 1.4+k*1.6, 0.5+k*0.6);
      if (d.t <= 0) { d.state = 'fall'; d.t = 0.45; }
    } else if (d.state === 'fall') {
      const k = 1 - Math.max(d.t, 0)/0.45;
      const yy = (d.y0 - 0.05) + (d.yl + 0.02 - d.y0 + 0.05)*(k*k);
      d.m.position.set(d.x, yy, d.z);
      d.m.scale.set(0.8, 2.6, 0.8);
      if (d.t <= 0) {
        d.state = 'wait';
        d.t = rnd(1.6, 5);
        d.m.visible = false;
        spawnRipple(d.x, d.yl, d.z, 0.16);
      }
    }
  }

  for (const s of steams) {
    const k = ((t + s.off) % 2.6)/2.6;
    s.sp.position.set(s.x + Math.sin(t*2.5 + s.off)*0.03, s.y0 + k*0.52, s.z);
    s.sp.material.opacity = Math.sin(Math.PI*k)*0.3;
    const sc = 0.15 + k*0.36;
    s.sp.scale.set(sc, sc, 1);
  }
});

let introT = 0;
let introActive = true;
const camFrom = new T.Vector3(19.5, 12.5, 20.5);
const camTo = new T.Vector3(13.4, 7.3, 14.3);
controls.addEventListener('start', () => { introActive = false; });

const clock = new T.Clock();
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (introActive) {
    introT += dt/3.0;
    const e = 1 - Math.pow(1 - Math.min(introT, 1), 3);
    camera.position.lerpVectors(camFrom, camTo, e);
    if (introT >= 1) introActive = false;
  }
  for (const fn of animated) fn(t, dt);
  controls.update();
  composer.render();
  frame++;
  if (frame === 3) renderer.shadowMap.autoUpdate = false;
}
loop();

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  fxaa.material.uniforms['resolution'].value.set(1/(w*renderer.getPixelRatio()), 1/(h*renderer.getPixelRatio()));
});
</script>
</body>
</html>
