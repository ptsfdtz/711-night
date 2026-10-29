/* =========================================================================
 * utils.js — 核心工具：三渲二材质 / 轮廓壳 / 画布纹理 / 动画注册 / 闪烁系统
 * ========================================================================= */
(function () {
  'use strict';

  const DIO = (window.DIO = window.DIO || {
    builders: [],   // [fn(scene)] 按注册顺序在 main 中执行
    animators: [],  // [fn(t, dt)]
    flickers: [],   // 灯光闪烁源
    glows: [],      // {sprite, baseOpacity}
    pools: [],      // 地面光池 {mesh, baseOpacity, flicker}
    streaks: [],    // 湿地面反射光带 {mesh, light, baseOpacity}
  });

  window.DIO = DIO;

  /* ---------- 确定性随机（保证每次加载构图一致） ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(20261029);
  DIO.rand = () => rng();
  DIO.range = (a, b) => a + (b - a) * rng();
  DIO.pick = (arr) => arr[Math.floor(rng() * arr.length) % arr.length];
  DIO.hash1 = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };

  /* ---------- 色板（雨夜 · 日式动画） ---------- */
  const C = {
    night: 0x151a2b,      // 夜空底
    asphalt: 0x2a3142,    // 沥青（偏蓝）
    asphaltDark: 0x232939,
    walk: 0x5b6577,       // 人行道
    walkLight: 0x6d788c,
    curb: 0x7a8497,
    buildingA: 0xcfc6b4,  // 米白墙面
    buildingB: 0xb9b3a6,
    buildingC: 0x9aa3ad,
    roofDark: 0x3a4152,
    metal: 0x8a93a5,
    metalDark: 0x545d70,
    storeWall: 0xf1e9d6,  // 便利店外墙奶白
    storeInner: 0xf6f0e2,
    accentOrange: 0xff8c3a, // 招牌橙
    accentGreen: 0x35c46e,
    accentRed: 0xff5a54,
    accentCyan: 0x69d2ff,
    warmLight: 0xffd9a0,  // 室内暖光
    coolLight: 0xcfe0ff,  // 路灯冷光
    neonBlue: 0x5f9bff,
    glass: 0x9db8d6,
    treeLeaf: 0x4f7a54,
    treeLeaf2: 0x41684c,
    wood: 0x9c8468,
    paper: 0xf2eee4,
    outline: 0x0d1020,
  };
  DIO.C = C;

  /* ---------- 三渲二渐变贴图（3 档） ---------- */
  const gradientMap = (() => {
    const data = new Uint8Array([110, 178, 255]);
    const tex = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  })();
  DIO.gradientMap = gradientMap;

  /* ---------- 材质工厂 ---------- */
  DIO.toon = function (color, opts) {
    opts = opts || {};
    const m = new THREE.MeshToonMaterial(
      Object.assign({ color: color }, opts)
    );
    m.gradientMap = gradientMap;
    return m;
  };

  DIO.basic = function (color, opts) {
    return new THREE.MeshBasicMaterial(Object.assign({ color: color }, opts));
  };

  /* ---------- 轮廓线壳（反向外壳法） ---------- */
  const outlineCache = new Map();
  function getOutlineMat(thickness, color) {
    const key = thickness.toFixed(4) + '_' + (color || 0);
    if (outlineCache.has(key)) return outlineCache.get(key);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uT: { value: thickness },
        uColor: { value: new THREE.Color(color == null ? C.outline : color) },
      },
      vertexShader: [
        'uniform float uT;',
        'void main(){',
        '  vec3 p = position + normal * uT;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'void main(){ gl_FragColor = vec4(uColor, 1.0); }',
      ].join('\n'),
      side: THREE.BackSide,
    });
    outlineCache.set(key, mat);
    return mat;
  }

  /** 给网格添加反向外壳轮廓（沿法线膨胀，BackSide 黑壳） */
  DIO.outline = function (mesh, thickness, color) {
    if (thickness == null) thickness = 0.018;
    const hull = new THREE.Mesh(mesh.geometry, getOutlineMat(thickness, color));
    hull.renderOrder = 2;
    mesh.add(hull);
    return mesh;
  };

  /** 轮廓版本的基础网格（box / cylinder / sphere） */
  function withOutline(mesh, t, color) {
    DIO.outline(mesh, t, color);
    return mesh;
  }
  DIO.box = function (w, h, d, mat, t) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    if (t !== 0) withOutline(m, t == null ? 0.016 : t);
    return m;
  };
  DIO.cyl = function (rt, rb, h, mat, seg, t) {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(rt, rb, h, seg || 14, 1),
      mat
    );
    if (t !== 0) withOutline(m, t == null ? 0.016 : t);
    return m;
  };
  DIO.sphere = function (r, mat, w, h, t) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, w || 18, h || 14)
    );
    m.material = mat;
    if (t !== 0) withOutline(m, t == null ? 0.016 : t);
    return m;
  };

  /* ---------- 画布纹理 ---------- */
  DIO.makeCanvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  };

  DIO.texture = function (w, h, draw, opts) {
    opts = opts || {};
    const c = DIO.makeCanvas(w, h);
    const ctx = c.getContext('2d');
    draw(ctx, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = opts.aniso || 4;
    if (opts.wrap) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    }
    return tex;
  };

  /** 噪点颗粒（用于材质做旧/沥青） */
  DIO.speckle = function (ctx, w, h, n, color, aMin, aMax, size) {
    for (let i = 0; i < n; i++) {
      const a = aMin + (aMax - aMin) * rng();
      ctx.fillStyle = 'rgba(' + color + ',' + a.toFixed(3) + ')';
      const s = size || 2;
      ctx.fillRect(rng() * w, rng() * h, s * (0.5 + rng()), s * (0.5 + rng()));
    }
  };

  /* ---------- 动画注册 ---------- */
  DIO.animate = function (fn) { DIO.animators.push(fn); };

  /* ---------- 灯光闪烁系统 ---------- */
  DIO.hashN = function (n) { return DIO.hash1(n); };

  /**
   * 注册一个闪烁源。
   * cfg: { mats:[], sprites:[], lights:[], base, freq, prob, len, depth, wobble }
   *  - freq: 平均每多少秒出现一次故障窗口
   *  - prob: 窗口触发概率   - len: 故障持续秒数
   *  - depth: 掉到多暗(0~1)  - wobble: 常态抖动幅度
   */
  DIO.flicker = function (cfg) {
    const f = Object.assign(
      { base: 1, freq: 9, prob: 0.6, len: 0.55, depth: 0.25, wobble: 0.06 },
      cfg
    );
    f.seed = rng() * 100;
    f.value = 1;
    DIO.flickers.push(f);
    return f;
  };

  DIO.animate(function (t) {
    for (let i = 0; i < DIO.flickers.length; i++) {
      const f = DIO.flickers[i];
      let v = 1;
      if (f.wobble > 0) {
        v -=
          f.wobble *
          (0.5 + 0.35 * Math.sin(t * 6.7 + f.seed) + 0.25 * Math.sin(t * 15.3 + f.seed * 2));
      }
      const k = Math.floor(t / f.freq + f.seed);
      const tIn = t / f.freq + f.seed - k;
      const r = DIO.hash1(k * 7.13 + f.seed);
      if (r < f.prob && tIn > 0.25 && tIn < 0.25 + f.len) {
        const q = DIO.hash1(Math.floor(t * 16) * 3.7 + f.seed);
        if (q < 0.62) v *= f.depth + 0.4 * DIO.hash1(Math.floor(t * 34) + f.seed);
      }
      f.value = f.base * Math.max(0.05, v);
      if (f.mats) {
        for (const m of f.mats) {
          if (m.emissiveIntensity !== undefined) m.emissiveIntensity = f.value;
        }
      }
      if (f.sprites) {
        for (const s of f.sprites) {
          s.material.opacity = s.userData.baseOpacity * f.value;
        }
      }
      if (f.lights) {
        for (const l of f.lights) {
          l.intensity = l.userData.baseIntensity * f.value;
        }
      }
    }
  });

  /* ---------- 通用几何缓存 ---------- */
  const boxGeoCache = new Map();
  DIO.boxGeo = function (w, h, d) {
    const k = w + ',' + h + ',' + d;
    if (!boxGeoCache.has(k)) boxGeoCache.set(k, new THREE.BoxGeometry(w, h, d));
    return boxGeoCache.get(k);
  };

  /* ---------- 平面（贴地 / 贴墙的贴花） ---------- */
  DIO.decal = function (w, h, tex, opts) {
    opts = opts || {};
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial(
        Object.assign(
          { map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 },
          opts
        )
      )
    );
    m.renderOrder = opts.renderOrder || 5;
    return m;
  };

  /* ---------- 文本辅助 ---------- */
  DIO.jpFont = '"Yu Gothic", "Hiragino Sans", "Meiryo", "MS Gothic", sans-serif';
  DIO.roundRect = function (ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
})();
