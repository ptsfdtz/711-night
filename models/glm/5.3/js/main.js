/* =========================================================================
 * main.js — 渲染器 / 相机 / 灯光 / 轨道控制器（拖拽旋转·滚轮缩放·平移）/ 主循环
 * ========================================================================= */
(function () {
  'use strict';
  const DIO = window.DIO;

  /* ---------------- 渲染器 ---------------- */
  const canvas = document.getElementById('scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (e) {
    document.body.innerHTML =
      '<div style="color:#8a93a5;font-family:sans-serif;text-align:center;margin-top:40vh">' +
      'WebGL 不可用，无法显示模型。</div>';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  /* ---------------- 场景 ---------------- */
  const scene = new THREE.Scene();
  DIO.scene = scene;

  // 背景（夜空渐变，屏幕映射）
  const bgTex = DIO.texture(64, 256, function (ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0e1a');
    g.addColorStop(0.45, '#1a2338');
    g.addColorStop(0.75, '#202a44');
    g.addColorStop(1, '#12182a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });
  scene.background = bgTex;
  scene.fog = new THREE.FogExp2(0x161c2e, 0.0125);

  /* ---------------- 相机 ---------------- */
  const camera = new THREE.PerspectiveCamera(
    38, window.innerWidth / window.innerHeight, 0.1, 200
  );
  DIO.camera = camera;

  /* ---------------- 灯光 ---------------- */
  const hemi = new THREE.HemisphereLight(0x55628f, 0x1a2030, 0.55);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(0x9fb8ff, 0.85);
  moon.position.set(-9, 15, 9);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -16;
  moon.shadow.camera.right = 16;
  moon.shadow.camera.top = 16;
  moon.shadow.camera.bottom = -16;
  moon.shadow.camera.near = 2;
  moon.shadow.camera.far = 45;
  moon.shadow.bias = -0.0008;
  moon.shadow.radius = 4;
  scene.add(moon);
  scene.add(moon.target);

  // 极淡的城市反光补光（从路口方向）
  const fill = new THREE.DirectionalLight(0x3a5a8a, 0.3);
  fill.position.set(8, 6, -6);
  scene.add(fill);

  /* ---------------- 轨道控制器（自实现） ---------------- */
  const ctrl = {
    target: new THREE.Vector3(1.2, 0.8, 0.4),
    theta: Math.atan2(11.3, 12.2),   // 初始：东南方向
    phi: 0.83,
    radius: 17.5,
    tTheta: Math.atan2(11.3, 12.2),
    tPhi: 0.83,
    tRadius: 17.5,
    minR: 6.5, maxR: 42,
    minPhi: 0.12, maxPhi: 1.535,
  };

  function applyCamera() {
    const sinPhi = Math.sin(ctrl.phi);
    camera.position.set(
      ctrl.target.x + ctrl.radius * sinPhi * Math.sin(ctrl.theta),
      ctrl.target.y + ctrl.radius * Math.cos(ctrl.phi),
      ctrl.target.z + ctrl.radius * sinPhi * Math.cos(ctrl.theta)
    );
    camera.lookAt(ctrl.target);
  }
  applyCamera();

  const pointers = new Map();
  let pinchDist = 0;
  let pinchMid = null;

  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, button: e.button, shift: e.shiftKey });
    if (pointers.size === 2) {
      const ps = Array.from(pointers.values());
      pinchDist = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      pinchMid = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
    }
    document.body.classList.add('dragging');
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    const p = pointers.get(e.pointerId);
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;

    if (pointers.size === 2) {
      // 双指：缩放 + 平移
      const ps = Array.from(pointers.values());
      const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
      if (pinchDist > 0) {
        ctrl.tRadius *= pinchDist / Math.max(d, 1);
        ctrl.tRadius = Math.max(ctrl.minR, Math.min(ctrl.maxR, ctrl.tRadius));
      }
      pinchDist = d;
      const mid = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
      if (pinchMid) pan(mid.x - pinchMid.x, mid.y - pinchMid.y);
      pinchMid = mid;
      return;
    }

    if (p.button === 2 || p.shift) {
      pan(dx, dy);
    } else {
      ctrl.tTheta -= dx * 0.0055;
      ctrl.tPhi -= dy * 0.0045;
      ctrl.tPhi = Math.max(ctrl.minPhi, Math.min(ctrl.maxPhi, ctrl.tPhi));
    }
  });

  function pan(dx, dy) {
    const scale = ctrl.radius * 0.0012;
    // 相机右向 / 上向（近似水平）
    const right = new THREE.Vector3(Math.cos(ctrl.theta), 0, -Math.sin(ctrl.theta));
    const up = new THREE.Vector3(
      -Math.sin(ctrl.theta) * Math.cos(ctrl.phi),
      Math.sin(ctrl.phi),
      -Math.cos(ctrl.theta) * Math.cos(ctrl.phi)
    );
    ctrl.target.addScaledVector(right, -dx * scale);
    ctrl.target.addScaledVector(up, dy * scale);
    ctrl.target.x = Math.max(-10, Math.min(10, ctrl.target.x));
    ctrl.target.z = Math.max(-10, Math.min(10, ctrl.target.z));
    ctrl.target.y = Math.max(-0.5, Math.min(8, ctrl.target.y));
  }

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) { pinchDist = 0; pinchMid = null; }
    if (pointers.size === 0) document.body.classList.remove('dragging');
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    ctrl.tRadius *= 1 + e.deltaY * 0.0011;
    ctrl.tRadius = Math.max(ctrl.minR, Math.min(ctrl.maxR, ctrl.tRadius));
  }, { passive: false });

  /* ---------------- 构建场景 ---------------- */
  for (const build of DIO.builders) build(scene);

  /* ---------------- 主循环 ---------------- */
  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // 阻尼
    const k = 1 - Math.pow(0.0001, dt);
    ctrl.theta += (ctrl.tTheta - ctrl.theta) * k;
    ctrl.phi += (ctrl.tPhi - ctrl.phi) * k;
    ctrl.radius += (ctrl.tRadius - ctrl.radius) * k;
    applyCamera();

    const animators = DIO.animators;
    for (let i = 0; i < animators.length; i++) animators[i](t, dt);

    renderer.render(scene, camera);
  }
  loop();

  /* ---------------- 调试抓帧（不影响正常浏览；供自动化检查/截图） ---------------- */
  DIO.renderer = renderer;
  DIO.ctrl = ctrl;
  DIO.captureFrame = function (w, h, opts) {
    opts = opts || {};
    const st = {
      theta: ctrl.theta, phi: ctrl.phi, radius: ctrl.radius,
      tTheta: ctrl.tTheta, tPhi: ctrl.tPhi, tRadius: ctrl.tRadius,
      target: ctrl.target.clone(),
    };
    if (opts.theta != null) { ctrl.theta = opts.theta; ctrl.tTheta = opts.theta; }
    if (opts.phi != null) { ctrl.phi = opts.phi; ctrl.tPhi = opts.phi; }
    if (opts.radius != null) { ctrl.radius = opts.radius; ctrl.tRadius = opts.radius; }
    if (opts.target) ctrl.target.set(opts.target[0], opts.target[1], opts.target[2]);
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    applyCamera();
    renderer.render(scene, camera);
    const data = canvas.toDataURL('image/jpeg', 0.86);
    ctrl.theta = st.theta; ctrl.phi = st.phi; ctrl.radius = st.radius;
    ctrl.tTheta = st.tTheta; ctrl.tPhi = st.tPhi; ctrl.tRadius = st.tRadius;
    ctrl.target.copy(st.target);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    applyCamera();
    return data;
  };

  /* ---------------- 自适应 ---------------- */
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
