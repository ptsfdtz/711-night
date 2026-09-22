/* ------------------------------------------------------------------
   60-main.js  --  renderer, camera, orbit controls, and the little
                   animations that keep the diorama alive.
------------------------------------------------------------------ */
(function (RN) {
  'use strict';

  var canvas = document.getElementById('stage');

  /* ===============================================================
     RENDERER
     =============================================================== */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
  } catch (e) {
    document.body.style.background = '#0a0d16';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x05070f, 1);
  renderer.sortObjects = true;

  /* the canvas textures were created before the renderer existed,
     so give them the best filtering the GPU supports now. */
  RN.maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
  (function () {
    var aniso = Math.min(RN.maxAniso, 8);
    for (var k in RN.tex) {
      if (RN.tex[k] && RN.tex[k].isTexture) RN.tex[k].anisotropy = aniso;
    }
  })();

  /* ===============================================================
     SCENE + CAMERA
     =============================================================== */
  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(13.0, 10.2, 15.2);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(-3.4, 1.6, -3.4);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.rotateSpeed = 0.75;
  controls.zoomSpeed = 0.85;
  controls.minDistance = 8;
  controls.maxDistance = 58;
  controls.minPolarAngle = 0.10;
  controls.maxPolarAngle = Math.PI * 0.492;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.30;
  controls.update();

  var idleTimer = 0;
  var IDLE_DELAY = 7.0;
  controls.addEventListener('start', function () {
    controls.autoRotate = false;
    idleTimer = 0;
    document.body.classList.add('dragging');
  });
  controls.addEventListener('end', function () {
    document.body.classList.remove('dragging');
  });

  /* ===============================================================
     BUILD
     =============================================================== */
  var world = RN.buildWorld(scene);
  var store = RN.buildStore(scene);
  var props = RN.buildProps(scene);
  var weather = RN.buildWeather(scene);

  /* handy handles for inspection / embedding */
  RN.scene = scene;
  RN.camera = camera;
  RN.controls = controls;
  RN.renderer = renderer;
  RN.parts = { world: world, store: store, props: props, weather: weather };

  /* remember the resting position of the sliding leaves */
  var leafBaseL = store.leaves[0].position.z;
  var leafBaseR = store.leaves[1].position.z;
  var DOOR_TRAVEL = 0.86;

  var bandMats = [store.band.material[0], store.band.material[4]];

  /* ===============================================================
     ANIMATION STATE
     =============================================================== */
  var door = { state: 'closed', t: 0, next: RN.rand(3.0, 6.0) };
  var flick = { value: 1, burst: 0, next: RN.rand(2.0, 5.0) };
  var flick2 = { value: 1, burst: 0, next: RN.rand(3.0, 7.0) };

  function stepDoor(dt) {
    door.t += dt;
    var open = 0;
    if (door.state === 'closed') {
      if (door.t > door.next) {
        door.state = 'opening';
        door.t = 0;
      }
    } else if (door.state === 'opening') {
      open = RN.easeInOutCubic(door.t / 0.85);
      if (door.t >= 0.85) { door.state = 'open'; door.t = 0; door.next = RN.rand(2.4, 5.0); }
    } else if (door.state === 'open') {
      open = 1;
      if (door.t > door.next) { door.state = 'closing'; door.t = 0; }
    } else if (door.state === 'closing') {
      open = 1 - RN.easeInOutCubic(door.t / 0.85);
      if (door.t >= 0.85) { door.state = 'closed'; door.t = 0; door.next = RN.rand(4.0, 9.0); }
    }
    store.leaves[0].position.z = leafBaseL - open * DOOR_TRAVEL;
    store.leaves[1].position.z = leafBaseR + open * DOOR_TRAVEL;
    return open;
  }

  function stepFlicker(f, dt, dt_) {
    f.next -= dt;
    if (f.burst > 0) {
      f.burst -= dt;
      f.value = RN.rnd() < 0.55 ? RN.rand(0.22, 0.55) : RN.rand(0.85, 1.0);
    } else if (f.next <= 0) {
      f.burst = RN.rand(0.07, 0.26);
      f.next = RN.rand(2.2, 6.5);
      f.value = 0.3;
    } else {
      f.value += (1 - f.value) * Math.min(1, dt * 8);
    }
    return f.value;
  }

  function stepTraffic(t) {
    var cyc = t % 24.0;
    var state = cyc < 9.5 ? 'green' : (cyc < 12.0 ? 'yellow' : 'red');
    var lamps = props.traffic.lamps;
    var keys = ['red', 'yellow', 'green'];
    for (var i = 0; i < keys.length; i++) {
      var L = lamps[keys[i]];
      var on = (keys[i] === state);
      L.mat.color.setHex(on ? L.base : 0x1a1c22);
      L.halo.material.opacity = on ? 0.5 + 0.08 * Math.sin(t * 6.0) : 0.0;
    }
    var pedGreen = (state === 'red' && cyc > 13.0 && cyc < 21.0);
    props.traffic.ped.r.material.color.setHex(pedGreen ? 0x2a1010 : 0xff3b30);
    props.traffic.ped.g.material.color.setHex(pedGreen ? 0x35e06a : 0x0f2a18);
    props.traffic.ped.glow.material.color.setHex(pedGreen ? 0x35e06a : 0xff3b30);
    props.traffic.ped.glow.material.opacity = 0.30 + 0.10 * Math.sin(t * (pedGreen ? 2.0 : 5.0));
    return state;
  }

  /* ===============================================================
     LOOP
     =============================================================== */
  var clock = new THREE.Clock();
  var elapsed = 0;
  var firstFrame = true;

  function tick() {
    requestAnimationFrame(tick);

    var dt = Math.min(clock.getDelta(), 0.05);
    elapsed += dt;

    /* camera idle auto-rotate */
    if (!controls.autoRotate) {
      idleTimer += dt;
      if (idleTimer > IDLE_DELAY) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.30;
      }
    }

    /* doors */
    var doorOpen = stepDoor(dt);

    /* sign flicker */
    var f1 = stepFlicker(flick, dt);
    var f2 = stepFlicker(flick2, dt);
    store.signGlows[0].material.opacity = 0.32 * f1;
    store.signGlows[1].material.opacity = 0.32 * f1;
    store.signLight.intensity = 0.6 * f1;
    bandMats[0].color.setScalar(0.72 + 0.28 * f1);
    bandMats[1].color.setScalar(0.72 + 0.28 * f1);

    store.pylonGlow.material.opacity = 0.36 * f2;
    store.pylonLight.intensity = 0.55 * f2;
    store.stripGlow.material.opacity = 0.34 * (0.9 + 0.1 * Math.sin(elapsed * 2.2));
    store.sensorGlow.material.opacity = 0.35 + 0.25 * doorOpen;

    /* entrance light spill breathes with the door */
    if (world.lights.storeSpill) {
      world.lights.storeSpill.intensity = 1.1 + doorOpen * 0.5;
    }

    /* traffic signal */
    stepTraffic(elapsed);

    /* rain running down the glass */
    RN.tex.glassStreak.offset.y -= dt * 0.16;
    RN.tex.glassStreak.offset.x = Math.sin(elapsed * 0.21) * 0.03;

    /* wet-ground reflections follow the camera and shimmer */
    RN.updateSmears(camera.position);
    for (var i = 0; i < RN.smears.length; i++) {
      var s = RN.smears[i];
      s.mat.opacity = s.baseOpacity * (0.88 + 0.12 * Math.sin(elapsed * 2.6 + i * 1.7));
    }

    /* weather */
    weather.update(dt, elapsed, camera);

    controls.update();
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('ready');
    }
  }

  /* ===============================================================
     RESIZE
     =============================================================== */
  var resizeTimer = null;
  function onResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
    }, 90);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  tick();

})(window.RN);
