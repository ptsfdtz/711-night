/* main.js — renderer, a handmade orbit camera, and the quiet loop */
(function () {
  "use strict";

  const T = THREE;
  const stage = document.getElementById("stage");

  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.setClearColor(0x050a10, 0);
  renderer.domElement.setAttribute("aria-label", "雨の夜のコンビニ街角ジオラマ。ドラッグで回転、ホイールで拡大縮小できます。");
  renderer.domElement.style.opacity = "0";
  renderer.domElement.style.transition = "opacity 1.4s cubic-bezier(.2,.7,.2,1)";
  stage.appendChild(renderer.domElement);

  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x09121b, 0.0135);

  const camera = new T.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 220);
  const world = buildWorld(scene);
  const atmosphere = buildAtmosphere(scene, world);
  const bloom = new PostBloom(renderer, scene, camera, { threshold: 0.72, knee: 0.22, intensity: 0.54, blur: 1.0 });

  const focus = new T.Vector3(-0.92, 1.06, 0.78);
  let phi = T.MathUtils.degToRad(70.0);
  let theta = 0.755;
  const fitRadiusBase = () => {
    const vfov = T.MathUtils.degToRad(camera.fov);
    const tanV = Math.tan(vfov * 0.5);
    const aspect = Math.max(0.5, camera.aspect);
    const halfWidth = aspect < 0.8 ? 13.65 : 16.8;
    const horizontal = halfWidth / (tanV * aspect);
    const vertical = 10.9 / tanV;
    return Math.max(horizontal, vertical) * 1.025;
  };
  let radius = fitRadiusBase();
  let targetPhi = phi;
  let targetTheta = theta;
  let targetRadius = radius;
  let hasInteracted = false;

  function fitRadius() {
    return fitRadiusBase();
  }

  function setCameraFromOrbit() {
    const sinPhi = Math.sin(phi);
    camera.position.set(
      focus.x + radius * sinPhi * Math.sin(theta),
      focus.y + radius * Math.cos(phi),
      focus.z + radius * sinPhi * Math.cos(theta)
    );
    camera.lookAt(focus);
  }
  setCameraFromOrbit();

  /* --------------------------------------------------------------------- */
  /* Orbit interaction                                                     */
  /* --------------------------------------------------------------------- */

  const pointers = new Map();
  let lastPinch = 0;

  function markInteraction() {
    hasInteracted = true;
  }

  renderer.domElement.addEventListener("pointerdown", (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    markInteraction();
    renderer.domElement.setPointerCapture(e.pointerId);
  });

  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const p = pointers.get(e.pointerId);
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;

    if (pointers.size === 1) {
      targetTheta -= dx * 0.0053;
      targetPhi -= dy * 0.0042;
      targetPhi = NM.clamp(targetPhi, 0.42, 1.47);
    } else if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (lastPinch > 0) {
        const ratio = lastPinch / Math.max(dist, 1);
        targetRadius *= Math.pow(ratio, 0.82);
        targetRadius = NM.clamp(targetRadius, 13, 110);
      }
      lastPinch = dist;
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinch = 0;
    if (pointers.size === 0) {
      renderer.domElement.style.cursor = "grab";
    }
  }
  renderer.domElement.addEventListener("pointerup", endPointer);
  renderer.domElement.addEventListener("pointercancel", endPointer);
  renderer.domElement.addEventListener("lostpointercapture", endPointer);

  renderer.domElement.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      markInteraction();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;
      targetRadius *= Math.exp(delta * 0.00085);
      targetRadius = NM.clamp(targetRadius, 13, 110);
    },
    { passive: false }
  );

  renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "ArrowLeft") targetTheta += 0.06;
      if (e.key === "ArrowRight") targetTheta -= 0.06;
      if (e.key === "ArrowUp") targetPhi = NM.clamp(targetPhi - 0.04, 0.42, 1.47);
      if (e.key === "ArrowDown") targetPhi = NM.clamp(targetPhi + 0.04, 0.42, 1.47);
      if (e.key === "+" || e.key === "=") targetRadius = NM.clamp(targetRadius * 1.05, 13, 110);
      if (e.key === "-") targetRadius = NM.clamp(targetRadius / 1.05, 13, 110);
    },
    { passive: true }
  );

  /* --------------------------------------------------------------------- */
  /* Resize                                                               */
  /* --------------------------------------------------------------------- */

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.8 ? 55 : 32;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.5 : 2));
    renderer.setSize(w, h);
    const drawing = renderer.getDrawingBufferSize(new T.Vector2());
    bloom.setSize(drawing.x, drawing.y);
    if (!hasInteracted) {
      targetRadius = radius = fitRadius();
    } else {
      const ratio = targetRadius / Math.max(1, fitRadius()); // preserve deliberate zoom
      targetRadius = NM.clamp(fitRadius() * NM.clamp(ratio, 0.18, 1.8), 13, 110);
    }
  }
  window.addEventListener("resize", onResize);

  /* --------------------------------------------------------------------- */
  /* The loop                                                             */
  /* --------------------------------------------------------------------- */

  const clock = new T.Clock();
  let elapsed = 0;
  let last = 0;
  let fadeInStarted = false;
  let frameCount = 0;

  // tiny idle camera drift only until the viewer takes over
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    const time = elapsed + dt;

    if (!fadeInStarted) {
      fadeInStarted = true;
      requestAnimationFrame(() => {
        renderer.domElement.style.opacity = "1";
      });
    }

    // Damped, free orbit.
    theta = NM.damp(theta, targetTheta, 6.5, dt);
    phi = NM.damp(phi, targetPhi, 6.5, dt);
    radius = NM.damp(radius, targetRadius, 5.2, dt);
    setCameraFromOrbit();

    elapsed = time;
    world.update(elapsed, dt);
    atmosphere.update(elapsed, dt);

    // Let the bloom breathe with the camera: a soft halo in the wide shot,
    // almost none when the viewer leans in to inspect the shelves.
    bloom.setIntensity(NM.clamp(0.02 + (radius - 14) * 0.021, 0.035, 0.62));
    bloom.render();
    frameCount++;
    last = time;
  }

  // Small typewriter-free boot: the canvas simply fades in when it is ready.
  onResize();
  animate();

  // Expose a tiny debug handle without adding any interface.
  window.__diorama = {
    scene,
    camera,
    renderer,
    world,
    atmosphere,
    bloom,
    setTime(t) {
      elapsed = t;
    },
    setView(opts) {
      opts = opts || {};
      hasInteracted = true;
      if (opts.theta != null) theta = targetTheta = opts.theta;
      if (opts.phi != null) phi = targetPhi = opts.phi;
      if (opts.radius != null) radius = targetRadius = opts.radius;
      if (opts.focus) focus.set(opts.focus[0], opts.focus[1], opts.focus[2]);
      setCameraFromOrbit();
    },
  };
})();
