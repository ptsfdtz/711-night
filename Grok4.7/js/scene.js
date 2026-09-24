(function () {
  'use strict';

  const WALK_Y = 0.18;
  const ROAD_Y = 0.03;
  const S = { x0: -3.55, x1: 3.05, z0: -3.35, z1: 2.45 };
  const CURB_S = 3.62;
  const CURB_E = 4.22;
  const WALL_TOP = WALK_Y + 3.02;
  const WT = 0.12;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x070a12, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070a12);

  const camera = new THREE.PerspectiveCamera(32, window.innerWidth / Math.max(1, window.innerHeight), 0.06, 160);
  camera.layers.enable(0);
  camera.layers.enable(1);

  const orbit = {
    target: new THREE.Vector3(0.05, 1.05, 0.05),
    theta: 0.74,
    phi: 0.98,
    radius: 19.5
  };

  const clock = new THREE.Clock();
  const rayDummy = new THREE.Object3D();
  const snackQ = [];
  const cylQ = [];
  const flickers = [];
  const anim = {};

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function canvasTex(w, h, draw, wrap) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (wrap) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    }
    t.needsUpdate = true;
    return t;
  }

  function starPath(g, x, y, spikes, outer, inner) {
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    g.beginPath();
    for (let i = 0; i < spikes; i++) {
      g.lineTo(x + Math.cos(rot) * outer, y + Math.sin(rot) * outer);
      rot += step;
      g.lineTo(x + Math.cos(rot) * inner, y + Math.sin(rot) * inner);
      rot += step;
    }
    g.closePath();
    g.fill();
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  const gradData = new Uint8Array([
    48, 50, 62, 255,
    122, 126, 140, 255,
    198, 200, 210, 255,
    255, 255, 255, 255
  ]);
  const gradientMap = new THREE.DataTexture(gradData, 4, 1);
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.wrapS = THREE.ClampToEdgeWrapping;
  gradientMap.wrapT = THREE.ClampToEdgeWrapping;
  gradientMap.generateMipmaps = false;
  gradientMap.colorSpace = THREE.NoColorSpace;
  gradientMap.needsUpdate = true;

  const toonCache = new Map();
  function toon(color, emissive, emissiveIntensity) {
    const em = emissive || 0x000000;
    const ei = emissiveIntensity == null ? 1 : emissiveIntensity;
    const key = color + ':' + em + ':' + ei;
    let m = toonCache.get(key);
    if (!m) {
      m = new THREE.MeshToonMaterial({ color: color, emissive: em, emissiveIntensity: ei, gradientMap: gradientMap });
      toonCache.set(key, m);
    }
    return m;
  }

  function toonTex(map, emissiveIntensity, color) {
    return new THREE.MeshToonMaterial({
      color: color == null ? 0xffffff : color,
      map: map,
      emissive: 0xffffff,
      emissiveMap: map,
      emissiveIntensity: emissiveIntensity == null ? 0.8 : emissiveIntensity,
      gradientMap: gradientMap
    });
  }

  const outlineMat = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: 0.0062 },
      uAspect: { value: window.innerWidth / Math.max(1, window.innerHeight) },
      uColor: { value: new THREE.Color(0x16121a) }
    },
    vertexShader: [
      'uniform float uThickness;',
      'uniform float uAspect;',
      'void main() {',
      '  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '  vec3 n = normalize(normalMatrix * normal);',
      '  vec2 dir = n.xy;',
      '  float len = length(dir);',
      '  dir = len < 0.001 ? vec2(1.0, 0.0) : dir / len;',
      '  vec2 off = dir * uThickness * clip.w;',
      '  off.x /= uAspect;',
      '  clip.xy += off;',
      '  gl_Position = clip;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uColor;',
      'void main() {',
      '  gl_FragColor = vec4(uColor, 1.0);',
      '  #include <colorspace_fragment>',
      '}'
    ].join('\n'),
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false
  });

  function addOutline(mesh) {
    const o = new THREE.Mesh(mesh.geometry, outlineMat);
    o.castShadow = false;
    o.receiveShadow = false;
    o.layers.mask = mesh.layers.mask;
    o.userData.outline = true;
    mesh.add(o);
  }

  function block(parent, x0, y0, z0, x1, y1, z1, mat, opt) {
    opt = opt || {};
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)),
      mat
    );
    mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    mesh.castShadow = !!opt.cast;
    mesh.receiveShadow = !!opt.recv;
    mesh.layers.set(opt.layer || 0);
    if (opt.outline) addOutline(mesh);
    parent.add(mesh);
    return mesh;
  }

  function cyl(parent, r, h, x, y0, z, mat, opt) {
    opt = opt || {};
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, opt.r2 == null ? r : opt.r2, h, opt.seg || 16), mat);
    mesh.position.set(x, y0 + h / 2, z);
    if (opt.rx) mesh.rotation.x = opt.rx;
    if (opt.rz) mesh.rotation.z = opt.rz;
    if (opt.ry) mesh.rotation.y = opt.ry;
    mesh.castShadow = !!opt.cast;
    mesh.receiveShadow = !!opt.recv;
    mesh.layers.set(opt.layer || 0);
    if (opt.outline) addOutline(mesh);
    parent.add(mesh);
    return mesh;
  }

  function qBox(x, y, z, w, h, d, color, layer) {
    snackQ.push({ x: x, y: y, z: z, w: w, h: h, d: d, color: color, layer: layer == null ? 1 : layer });
  }

  function qCyl(x, y, z, r, h, color, layer) {
    cylQ.push({ x: x, y: y, z: z, r: r, h: h, color: color, layer: layer == null ? 1 : layer });
  }

  function flushInstances(parent) {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 10);
    const groups = new Map();
    snackQ.forEach(function (it) {
      const key = 'b' + it.color + ':' + it.layer;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(it);
    });
    groups.forEach(function (items) {
      const mesh = new THREE.InstancedMesh(unitBox, toon(items[0].color), items.length);
      mesh.layers.set(items[0].layer);
      items.forEach(function (it, i) {
        rayDummy.position.set(it.x, it.y, it.z);
        rayDummy.rotation.set(0, 0, 0);
        rayDummy.scale.set(it.w, it.h, it.d);
        rayDummy.updateMatrix();
        mesh.setMatrixAt(i, rayDummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      parent.add(mesh);
    });
    const cgroups = new Map();
    cylQ.forEach(function (it) {
      const key = 'c' + it.color + ':' + it.layer;
      if (!cgroups.has(key)) cgroups.set(key, []);
      cgroups.get(key).push(it);
    });
    cgroups.forEach(function (items) {
      const mesh = new THREE.InstancedMesh(unitCyl, toon(items[0].color), items.length);
      mesh.layers.set(items[0].layer);
      items.forEach(function (it, i) {
        rayDummy.position.set(it.x, it.y, it.z);
        rayDummy.rotation.set(0, 0, 0);
        rayDummy.scale.set(it.r, it.h, it.r);
        rayDummy.updateMatrix();
        mesh.setMatrixAt(i, rayDummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      parent.add(mesh);
    });
    snackQ.length = 0;
    cylQ.length = 0;
  }

  const logoTex = canvasTex(1024, 512, function (g) {
    g.fillStyle = '#ef8b30';
    g.fillRect(0, 0, 1024, 512);
    g.fillStyle = '#e24d48';
    g.fillRect(0, 392, 1024, 18);
    g.fillStyle = '#2f9a56';
    g.fillRect(0, 410, 1024, 102);
    g.fillStyle = '#fff8ef';
    starPath(g, 168, 196, 5, 78, 32);
    g.fillStyle = '#fffaf4';
    g.font = '700 132px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';
    g.fillText('あかり', 280, 210);
    g.font = '700 64px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.fillText('マート', 292, 300);
    g.font = '700 40px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.fillText('24時間営業', 620, 478);
  });

  const fasciaTex = canvasTex(1024, 256, function (g) {
    g.fillStyle = '#ef8b30';
    g.fillRect(0, 0, 1024, 256);
    g.fillStyle = '#fff6ea';
    g.fillRect(0, 78, 1024, 28);
    g.fillStyle = '#2f9a56';
    g.fillRect(0, 168, 1024, 56);
    g.fillStyle = '#e24d48';
    g.fillRect(0, 224, 1024, 32);
    g.fillStyle = '#fffaf4';
    g.font = '700 72px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('あかりマート', 512, 118);
    g.font = '700 28px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.fillText('24時間', 512, 196);
  });

  const stripeTex = canvasTex(256, 64, function (g) {
    g.fillStyle = '#ef8b30';
    g.fillRect(0, 0, 256, 22);
    g.fillStyle = '#fff6ea';
    g.fillRect(0, 22, 256, 14);
    g.fillStyle = '#2f9a56';
    g.fillRect(0, 36, 256, 18);
    g.fillStyle = '#e24d48';
    g.fillRect(0, 54, 256, 10);
  }, true);

  function posterTex(bg, accent, title, sub) {
    return canvasTex(512, 720, function (g) {
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 720);
      g.fillStyle = accent;
      g.fillRect(0, 0, 512, 28);
      g.fillRect(0, 640, 512, 80);
      g.fillStyle = '#fffaf3';
      starPath(g, 256, 150, 5, 54, 22);
      g.fillStyle = '#fffaf3';
      g.font = '700 64px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      const lines = title.split('\n');
      lines.forEach(function (line, i) {
        g.fillText(line, 256, 300 + i * 78);
      });
      g.font = '500 32px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
      g.fillStyle = accent;
      g.fillText(sub, 256, 680);
    });
  }

  const posters = [
    posterTex('#e07a32', '#fff3e4', 'おでん\nはじめました', 'あたたかい夜'),
    posterTex('#2f6f86', '#e8f7fb', 'ホット\nコーヒー', '深夜もあかり'),
    posterTex('#d4534a', '#fff4ef', '新発売\nおにぎり', '本日のおすすめ'),
    posterTex('#3d7a52', '#f3fff6', '弁当\n出来たて', 'あかりマート')
  ];

  function vendingTex(bg, header, title) {
    return canvasTex(512, 1024, function (g) {
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 1024);
      g.fillStyle = header;
      g.fillRect(24, 24, 464, 120);
      g.fillStyle = '#fffaf4';
      g.font = '700 48px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(title, 256, 84);
      const colors = ['#e24d48', '#ef8b30', '#f2d15c', '#3caa6a', '#3aa0d8', '#7a6ad4', '#f0f2f4', '#c9864a', '#5ec8d4', '#e888a8'];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 4; c++) {
          const x = 48 + c * 108;
          const y = 190 + r * 130;
          g.fillStyle = '#1c2430';
          roundRect(g, x, y, 88, 110, 10);
          g.fill();
          g.fillStyle = colors[(r * 4 + c) % colors.length];
          roundRect(g, x + 16, y + 14, 56, 70, 8);
          g.fill();
          g.fillStyle = '#fffaf4';
          g.fillRect(x + 24, y + 36, 40, 8);
        }
      }
      g.fillStyle = '#12161c';
      g.fillRect(40, 860, 432, 120);
      g.fillStyle = header;
      g.fillRect(70, 900, 150, 48);
      g.fillStyle = '#f4f1ea';
      g.fillRect(250, 888, 180, 72);
    });
  }

  const vendCoolTex = vendingTex('#14323a', '#3ec6d4', 'ドリンク');
  const vendHotTex = vendingTex('#3a1818', '#e25a4a', 'ホット');

  function bentoTex(a, b, c) {
    return canvasTex(256, 256, function (g) {
      g.fillStyle = '#f4efe4';
      g.fillRect(0, 0, 256, 256);
      g.strokeStyle = '#c8b89a';
      g.lineWidth = 8;
      g.strokeRect(10, 10, 236, 236);
      g.fillStyle = a;
      g.fillRect(28, 28, 120, 90);
      g.fillStyle = b;
      g.fillRect(156, 28, 70, 90);
      g.fillStyle = '#f7f4ee';
      g.fillRect(28, 130, 198, 96);
      g.fillStyle = c;
      g.beginPath();
      g.arc(70, 178, 22, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#6aaa58';
      g.fillRect(120, 150, 80, 18);
      g.fillStyle = '#e0a050';
      g.fillRect(120, 176, 80, 18);
    });
  }

  const bentoTexes = [
    bentoTex('#c4473a', '#e6c36a', '#de4d4d'),
    bentoTex('#d4833c', '#7aaa55', '#c9a06a'),
    bentoTex('#6a8f4a', '#e2b84a', '#d25a48')
  ];
  const bentoMats = bentoTexes.map(function (t) {
    return new THREE.MeshToonMaterial({ color: 0xffffff, map: t, gradientMap: gradientMap });
  });

  function magTex(bg, title) {
    return canvasTex(320, 440, function (g) {
      g.fillStyle = bg;
      g.fillRect(0, 0, 320, 440);
      g.fillStyle = 'rgba(255,250,244,0.92)';
      g.fillRect(24, 150, 272, 150);
      g.fillStyle = bg;
      g.font = '700 42px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(title, 160, 225);
      g.fillStyle = '#fffaf4';
      g.fillRect(24, 36, 80, 12);
    });
  }

  const magTextures = [
    magTex('#d4534a', 'ねこ日和'),
    magTex('#2f6f86', '夜更かし'),
    magTex('#3d7a52', 'ごはん'),
    magTex('#c47a32', '街の音'),
    magTex('#6a5ac8', 'あお'),
    magTex('#b76a8a', '花便り')
  ];

  const menuTex = canvasTex(768, 512, function (g) {
    g.fillStyle = '#1c1814';
    g.fillRect(0, 0, 768, 512);
    g.fillStyle = '#ef8b30';
    g.fillRect(0, 0, 768, 70);
    g.fillStyle = '#fffaf4';
    g.font = '700 40px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('あかりキッチン', 384, 36);
    const items = [['おでん', '150'], ['コーヒー', '120'], ['からあげ', '180'], ['肉まん', '130'], ['おにぎり', '120'], ['弁当', '480']];
    g.font = '600 36px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.textAlign = 'left';
    items.forEach(function (it, i) {
      const col = i < 3 ? 48 : 400;
      const row = (i % 3) * 110 + 130;
      g.fillStyle = '#fff6ea';
      g.fillText(it[0], col, row);
      g.fillStyle = '#f0c36a';
      g.fillText(it[1], col + 210, row);
    });
  });

  const floorTex = canvasTex(1024, 896, function (g) {
    g.fillStyle = '#e4dccb';
    g.fillRect(0, 0, 1024, 896);
    g.strokeStyle = '#d4cbb8';
    g.lineWidth = 2;
    for (let x = 0; x <= 1024; x += 64) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 896);
      g.stroke();
    }
    for (let y = 0; y <= 896; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(1024, y);
      g.stroke();
    }
    g.strokeStyle = '#e07a32';
    g.lineWidth = 10;
    g.strokeRect(80, 80, 860, 740);
    g.fillStyle = 'rgba(62,154,98,0.28)';
    g.fillRect(700, 40, 280, 220);
    g.fillStyle = '#2f9a56';
    g.font = '700 42px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.textAlign = 'center';
    g.fillText('レジ', 840, 130);
    g.font = '600 28px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.fillText('→', 840, 180);
    g.fillStyle = '#e07a32';
    g.fillText('入口', 180, 780);
  });

  const openTex = canvasTex(512, 180, function (g) {
    g.fillStyle = '#123c86';
    g.fillRect(0, 0, 512, 180);
    g.fillStyle = '#7ec8ff';
    g.font = '700 72px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('営業中', 256, 90);
  });

  const bannerTex = function (text, bg) {
    return canvasTex(640, 160, function (g) {
      g.fillStyle = bg;
      g.fillRect(0, 0, 640, 160);
      g.fillStyle = '#fffaf4';
      g.font = '700 64px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, 320, 82);
    });
  };

  const banners = [
    bannerTex('おでん', '#e07a32'),
    bannerTex('弁当', '#2f9a56'),
    bannerTex('コーヒー', '#8a3e32')
  ];

  const matTex = canvasTex(256, 128, function (g) {
    g.fillStyle = '#4a6a52';
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#6d8a6a';
    for (let i = 0; i < 8; i++) g.fillRect(8, 8 + i * 15, 240, 7);
  });

  const tileTex = canvasTex(256, 256, function (g) {
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const s = 196 + ((x + y) % 2) * 14;
        g.fillStyle = 'rgb(' + s + ',' + (s - 6) + ',' + (s - 16) + ')';
        g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
      }
    }
  });

  const tactileTex = canvasTex(256, 256, function (g) {
    g.fillStyle = '#e2b43a';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#c49222';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        g.beginPath();
        g.arc(16 + x * 32, 16 + y * 32, 7, 0, Math.PI * 2);
        g.fill();
      }
    }
  });

  const grateTex = canvasTex(128, 64, function (g) {
    g.fillStyle = '#2a313c';
    g.fillRect(0, 0, 128, 64);
    g.fillStyle = '#12171e';
    for (let i = 0; i < 5; i++) g.fillRect(8, 6 + i * 12, 112, 5);
  }, true);
  grateTex.repeat.set(1, 1);

  const manholeTex = canvasTex(512, 512, function (g) {
    g.fillStyle = '#66717c';
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = '#d5dde4';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(256, 256, 220, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(256, 256, 150, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(256, 256, 70, 0, Math.PI * 2);
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      g.beginPath();
      g.moveTo(256 + Math.cos(a) * 80, 256 + Math.sin(a) * 80);
      g.lineTo(256 + Math.cos(a) * 210, 256 + Math.sin(a) * 210);
      g.stroke();
    }
  });

  const signPlateTex = canvasTex(512, 192, function (g) {
    g.fillStyle = '#1d4e89';
    g.fillRect(0, 0, 512, 192);
    g.fillStyle = '#f4f7fb';
    g.font = '700 64px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('青葉通り', 256, 96);
  });

  const signSmallTex = canvasTex(256, 256, function (g) {
    g.fillStyle = '#1d4e89';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#f4f7fb';
    g.font = '700 42px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('南', 128, 108);
    g.font = '500 28px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
    g.fillText('1', 128, 160);
  });

  const binLabel = function (text, bg) {
    return canvasTex(256, 128, function (g) {
      g.fillStyle = bg;
      g.fillRect(0, 0, 256, 128);
      g.fillStyle = '#1c1c1c';
      g.font = '700 36px "Yu Gothic", "Yu Gothic UI", Meiryo, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(text, 128, 64);
    });
  };

  const radialTex = canvasTex(256, 256, function (g) {
    const grd = g.createRadialGradient(128, 128, 8, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.35)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
  });

  const steamTex = canvasTex(128, 128, function (g) {
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,255,255,0.7)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  });

  const shadowTex = canvasTex(256, 256, function (g) {
    const grd = g.createRadialGradient(128, 128, 20, 128, 128, 120);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
  });

  const wallMat = toon(0xf3ecdf);
  const wallDark = toon(0xe4d9c8);
  const frameMat = toon(0x2c2826);
  const roofMat = toon(0x3a4254);
  const metalMat = toon(0xc5ccd4);
  const darkMat = toon(0x23262e);
  const trimMat = toon(0xc6a36e, 0x3a2a10, 0.18);
  const plinthMat = toon(0x1c1e26);
  const plinthTopMat = toon(0x2a2d38);
  const asphaltMatColor = toon(0x2a3142);

  const extHemi = new THREE.HemisphereLight(0x9bb0cc, 0x2a2830, 0.46);
  extHemi.layers.set(0);
  scene.add(extHemi);
  const intHemi = new THREE.HemisphereLight(0xfff6ea, 0xffd8b4, 0.72);
  intHemi.layers.set(1);
  scene.add(intHemi);

  const moon = new THREE.DirectionalLight(0xc5d4ee, 0.72);
  moon.position.set(-8, 14, -6);
  moon.castShadow = true;
  moon.layers.set(0);
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -16;
  moon.shadow.camera.right = 16;
  moon.shadow.camera.top = 16;
  moon.shadow.camera.bottom = -16;
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 40;
  moon.shadow.bias = -0.00035;
  moon.shadow.normalBias = 0.04;
  scene.add(moon);

  const fill = new THREE.DirectionalLight(0xffd8b8, 0.2);
  fill.position.set(7, 5, 9);
  fill.layers.set(0);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0x8eb4ff, 0.28);
  rim.position.set(-12, 7, -10);
  rim.layers.set(0);
  scene.add(rim);

  function point(color, intensity, dist, x, y, z, layer) {
    const l = new THREE.PointLight(color, intensity, dist, 2);
    l.position.set(x, y, z);
    l.layers.set(layer || 0);
    scene.add(l);
    return l;
  }

  const signLight = point(0xffb060, 18, 9, 2.2, 3.7, 2.3, 0);
  const lampLight = point(0xffc080, 26, 10, 6.05, 3.35, 4.85, 0);
  const vendLight = point(0x40d0e0, 8, 5, -6.9, 1.5, 2.7, 0);
  const spillS = point(0xffc090, 7, 5.5, 0.2, 1.5, 3.15, 0);
  const spillE = point(0xffc090, 6, 5, 3.7, 1.5, 0.4, 0);
  const doorSpill = point(0xffe0b8, 2, 3.2, -0.15, 1.2, 2.9, 0);
  point(0xfff0d4, 36, 10, -0.2, 2.7, -0.3, 1);
  point(0xffe2c0, 22, 6, 1.8, 2.3, 1.3, 1);
  const odenLight = point(0xff7a32, 5, 2.4, 2.35, 1.15, 0.85, 1);

  const puddles = [
    new THREE.Vector4(0.7, 5.35, 1.75, 1.15),
    new THREE.Vector4(6.7, 6.7, 1.4, 1.0),
    new THREE.Vector4(-2.4, 7.15, 1.25, 0.9),
    new THREE.Vector4(5.35, 4.15, 0.9, 0.62),
    new THREE.Vector4(7.6, 4.9, 0.75, 0.55),
    new THREE.Vector4(-4.35, 0.35, 0.62, 1.05)
  ];
  const rings = [];
  for (let i = 0; i < 8; i++) rings.push(new THREE.Vector4(0, 0, -100, 0));
  let ringCursor = 0;

  const groundUniforms = {
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    uTime: { value: 0 },
    uCam: { value: new THREE.Vector3() },
    uPuddles: { value: puddles },
    uRings: { value: rings },
    uCross: { value: new THREE.Vector4(-1.15, 4.55, 3.65, 6.45) },
    uPark: { value: new THREE.Vector4(5.45, 5.65, 9.05, 8.75) },
    uCurbS: { value: CURB_S },
    uCurbE: { value: CURB_E },
    uLamp: { value: new THREE.Vector3(6.05, 3.35, 4.85) },
    uStore: { value: new THREE.Vector3(1.6, 2.4, 2.6) },
    uVend: { value: new THREE.Vector3(-6.9, 1.6, 2.7) },
    uSignal: { value: new THREE.Vector3(8.35, 2.2, 8.15) },
    uSignalColor: { value: new THREE.Color(0x3dcc72) }
  };

  const groundMat = new THREE.ShaderMaterial({
    uniforms: groundUniforms,
    vertexShader: [
      'uniform mat4 textureMatrix;',
      'varying vec4 vUvRefl;',
      'varying vec3 vWorld;',
      'void main() {',
      '  vec4 world = modelMatrix * vec4(position, 1.0);',
      '  vWorld = world.xyz;',
      '  vUvRefl = textureMatrix * vec4(position, 1.0);',
      '  gl_Position = projectionMatrix * viewMatrix * world;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform float uTime;',
      'uniform vec3 uCam;',
      'uniform vec4 uPuddles[6];',
      'uniform vec4 uRings[8];',
      'uniform vec4 uCross;',
      'uniform vec4 uPark;',
      'uniform float uCurbS;',
      'uniform float uCurbE;',
      'uniform vec3 uLamp;',
      'uniform vec3 uStore;',
      'uniform vec3 uVend;',
      'uniform vec3 uSignal;',
      'uniform vec3 uSignalColor;',
      'varying vec4 vUvRefl;',
      'varying vec3 vWorld;',
      'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float vnoise(vec2 p) {',
      '  vec2 i = floor(p); vec2 f = fract(p);',
      '  float a = hash(i); float b = hash(i + vec2(1.0, 0.0));',
      '  float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
      '}',
      'float rectLine(vec2 p, vec4 r, float w) {',
      '  float ix = step(r.x, p.x) * step(p.x, r.z);',
      '  float iz = step(r.y, p.y) * step(p.y, r.w);',
      '  float ex = min(abs(p.x - r.x), abs(p.x - r.z));',
      '  float ez = min(abs(p.y - r.y), abs(p.y - r.w));',
      '  return max(step(ex, w) * iz, step(ez, w) * ix);',
      '}',
      'vec3 streak(vec3 world, vec3 V, vec3 lamp, vec3 color, float power) {',
      '  vec3 L = lamp - world;',
      '  float dist = length(L);',
      '  L /= max(dist, 0.001);',
      '  vec3 R = reflect(-L, vec3(0.0, 1.0, 0.0));',
      '  float spec = pow(max(dot(normalize(R), V), 0.0), 28.0);',
      '  float atten = 1.0 / (1.0 + dist * dist * 0.09);',
      '  return color * spec * atten * power;',
      '}',
      'void main() {',
      '  vec2 xz = vWorld.xz;',
      '  float n = vnoise(xz * 3.5);',
      '  vec3 asphalt = vec3(0.045, 0.05, 0.065) * (0.82 + 0.28 * n);',
      '  float alley = step(xz.x, -3.7) * step(xz.x, -3.45) * (1.0 - step(xz.x, -5.3));',
      '  alley = step(-5.2, xz.x) * step(xz.x, -3.5) * step(xz.y, 2.6);',
      '  asphalt = mix(asphalt, asphalt * 0.55, alley);',
      '  float inCross = step(uCross.x, xz.x) * step(xz.x, uCross.z) * step(uCross.y, xz.y) * step(xz.y, uCross.w);',
      '  float stripe = step(0.46, fract((xz.x - uCross.x) * 0.78));',
      '  float cross = inCross * stripe;',
      '  asphalt = mix(asphalt, vec3(0.42, 0.46, 0.52), cross * 0.82);',
      '  float park = rectLine(xz, uPark, 0.045);',
      '  asphalt = mix(asphalt, vec3(0.55, 0.58, 0.62), park);',
      '  float edgeS = smoothstep(0.07, 0.0, abs(xz.y - (uCurbS + 0.08))) * step(-8.8, xz.x) * step(xz.x, uCurbE + 0.2);',
      '  float edgeE = smoothstep(0.07, 0.0, abs(xz.x - (uCurbE + 0.08))) * step(-4.5, xz.y) * step(xz.y, uCurbS + 0.2);',
      '  asphalt = mix(asphalt, vec3(0.5, 0.53, 0.58), max(edgeS, edgeE) * 0.75);',
      '  float puddle = 0.0;',
      '  for (int i = 0; i < 6; i++) {',
      '    vec2 d = (xz - uPuddles[i].xy) / max(uPuddles[i].zw, vec2(0.001));',
      '    puddle = max(puddle, 1.0 - smoothstep(0.68, 1.0, length(d)));',
      '  }',
      '  float rip = 0.0;',
      '  for (int i = 0; i < 8; i++) {',
      '    float age = uTime - uRings[i].z;',
      '    float alive = step(0.0, age) * step(age, 1.5);',
      '    float rad = age * 0.62;',
      '    float d = length(xz - uRings[i].xy);',
      '    rip += smoothstep(0.07, 0.0, abs(d - rad)) * (1.0 - age / 1.5) * alive;',
      '  }',
      '  for (int i = 0; i < 3; i++) {',
      '    float fi = float(i);',
      '    vec2 c = vec2(sin(uTime * 0.21 + fi * 4.2) * 2.8 + 1.2, cos(uTime * 0.17 + fi * 2.4) * 2.2 + 5.6);',
      '    float age = fract(uTime * 0.28 + fi * 0.37);',
      '    float rad = age * 0.95;',
      '    float d = length(xz - c);',
      '    rip += smoothstep(0.055, 0.0, abs(d - rad)) * (1.0 - age) * 0.65;',
      '  }',
      '  vec4 proj = vUvRefl;',
      '  proj.x += rip * 0.018 * puddle;',
      '  proj.y += sin(xz.x * 18.0 + uTime * 2.0) * 0.004 * puddle;',
      '  vec3 refl = texture2DProj(tDiffuse, proj).rgb;',
      '  vec3 V = normalize(uCam - vWorld);',
      '  float fres = pow(1.0 - clamp(dot(vec3(0.0, 1.0, 0.0), V), 0.0, 1.0), 2.4);',
      '  float wet = mix(0.2, 0.78, puddle);',
      '  wet += cross * 0.12;',
      '  wet *= mix(0.75, 1.0, fres);',
      '  float spill = smoothstep(8.0, 1.3, length(xz - vec2(1.2, 3.4)));',
      '  asphalt += vec3(0.08, 0.035, 0.015) * spill;',
      '  vec3 col = mix(asphalt, refl, clamp(wet, 0.0, 0.86));',
      '  col += streak(vWorld, V, uLamp, vec3(1.0, 0.78, 0.45), 1.15) * (0.35 + puddle);',
      '  col += streak(vWorld, V, uStore, vec3(1.0, 0.62, 0.32), 1.35) * (0.3 + puddle * 0.8);',
      '  col += streak(vWorld, V, uVend, vec3(0.35, 0.85, 1.0), 0.55) * (0.25 + puddle);',
      '  col += streak(vWorld, V, uSignal, uSignalColor, 0.45) * (0.2 + puddle);',
      '  col += vec3(0.75, 0.85, 1.0) * rip * puddle * 0.18;',
      '  gl_FragColor = vec4(col, 1.0);',
      '  #include <tonemapping_fragment>',
      '  #include <colorspace_fragment>',
      '}'
    ].join('\n')
  });

  const wet = new THREE.Mesh(new THREE.PlaneGeometry(19.7, 19.7), groundMat);
  wet.rotation.x = -Math.PI / 2;
  wet.position.y = ROAD_Y;
  wet.receiveShadow = false;
  scene.add(wet);

  (function attachReflector(mesh) {
    const reflectorPlane = new THREE.Plane();
    const normal = new THREE.Vector3();
    const reflectorWorldPosition = new THREE.Vector3();
    const cameraWorldPosition = new THREE.Vector3();
    const rotationMatrix = new THREE.Matrix4();
    const lookAtPosition = new THREE.Vector3(0, 0, -1);
    const clipPlane = new THREE.Vector4();
    const view = new THREE.Vector3();
    const target = new THREE.Vector3();
    const q = new THREE.Vector4();
    const virtualCamera = new THREE.PerspectiveCamera();
    virtualCamera.layers.enable(0);
    virtualCamera.layers.enable(1);
    const renderTarget = new THREE.WebGLRenderTarget(1024, 768, { samples: 0, type: THREE.HalfFloatType });
    groundUniforms.tDiffuse.value = renderTarget.texture;
    const hide = [];
    let rendering = false;
    mesh.onBeforeRender = function (rdr, sc, cam) {
      if (rendering) return;
      rendering = true;
      reflectorWorldPosition.setFromMatrixPosition(mesh.matrixWorld);
      cameraWorldPosition.setFromMatrixPosition(cam.matrixWorld);
      rotationMatrix.extractRotation(mesh.matrixWorld);
      normal.set(0, 0, 1);
      normal.applyMatrix4(rotationMatrix);
      view.subVectors(reflectorWorldPosition, cameraWorldPosition);
      if (view.dot(normal) > 0) {
        rendering = false;
        return;
      }
      view.reflect(normal).negate();
      view.add(reflectorWorldPosition);
      rotationMatrix.extractRotation(cam.matrixWorld);
      lookAtPosition.set(0, 0, -1);
      lookAtPosition.applyMatrix4(rotationMatrix);
      lookAtPosition.add(cameraWorldPosition);
      target.subVectors(reflectorWorldPosition, lookAtPosition);
      target.reflect(normal).negate();
      target.add(reflectorWorldPosition);
      virtualCamera.position.copy(view);
      virtualCamera.up.set(0, 1, 0);
      virtualCamera.up.applyMatrix4(rotationMatrix);
      virtualCamera.up.reflect(normal);
      virtualCamera.lookAt(target);
      virtualCamera.far = cam.far;
      virtualCamera.updateMatrixWorld();
      virtualCamera.projectionMatrix.copy(cam.projectionMatrix);
      virtualCamera.layers.mask = cam.layers.mask;
      groundUniforms.textureMatrix.value.set(
        0.5, 0.0, 0.0, 0.5,
        0.0, 0.5, 0.0, 0.5,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
      );
      groundUniforms.textureMatrix.value.multiply(virtualCamera.projectionMatrix);
      groundUniforms.textureMatrix.value.multiply(virtualCamera.matrixWorldInverse);
      groundUniforms.textureMatrix.value.multiply(mesh.matrixWorld);
      reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition);
      reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse);
      clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant);
      const projectionMatrix = virtualCamera.projectionMatrix;
      q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0];
      q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5];
      q.z = -1.0;
      q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14];
      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
      projectionMatrix.elements[2] = clipPlane.x;
      projectionMatrix.elements[6] = clipPlane.y;
      projectionMatrix.elements[10] = clipPlane.z + 1.0 - 0.003;
      projectionMatrix.elements[14] = clipPlane.w;
      const savedVis = mesh.visible;
      mesh.visible = false;
      const saved = hide.map(function (o) { return o.visible; });
      hide.forEach(function (o) { o.visible = false; });
      const currentRenderTarget = rdr.getRenderTarget();
      const currentXr = rdr.xr.enabled;
      const currentShadow = rdr.shadowMap.autoUpdate;
      rdr.xr.enabled = false;
      rdr.shadowMap.autoUpdate = false;
      rdr.setRenderTarget(renderTarget);
      rdr.state.buffers.depth.setMask(true);
      if (rdr.autoClear === false) rdr.clear();
      rdr.render(sc, virtualCamera);
      rdr.xr.enabled = currentXr;
      rdr.shadowMap.autoUpdate = currentShadow;
      rdr.setRenderTarget(currentRenderTarget);
      if (cam.viewport !== undefined) rdr.state.viewport(cam.viewport);
      mesh.visible = savedVis;
      hide.forEach(function (o, i) { o.visible = saved[i]; });
      rendering = false;
    };
    mesh.userData.setReflectionSize = function (w, h) { renderTarget.setSize(w, h); };
    mesh.userData.hideInReflection = hide;
  })(wet);

  const shadowCatch = new THREE.Mesh(
    new THREE.PlaneGeometry(19.6, 19.6),
    new THREE.ShadowMaterial({ opacity: 0.34, color: 0x0b1020 })
  );
  shadowCatch.rotation.x = -Math.PI / 2;
  shadowCatch.position.y = 0.036;
  shadowCatch.receiveShadow = true;
  scene.add(shadowCatch);
  wet.userData.hideInReflection.push(shadowCatch);

  block(scene, -10.45, -1.18, -10.45, 10.45, -0.08, 10.45, plinthMat, { outline: true, cast: true, recv: true });
  block(scene, -10.15, -0.08, -10.15, 10.15, 0.03, 10.15, plinthTopMat, { recv: true, outline: true });
  block(scene, -10.48, -0.1, -10.48, 10.48, -0.045, -10.32, trimMat, {});
  block(scene, -10.48, -0.1, 10.32, 10.48, -0.045, 10.48, trimMat, {});
  block(scene, -10.48, -0.1, -10.32, -10.32, -0.045, 10.32, trimMat, {});
  block(scene, 10.32, -0.1, -10.32, 10.48, -0.045, 10.32, trimMat, {});
  [[-9.7, -9.7], [9.7, -9.7], [-9.7, 9.7], [9.7, 9.7]].forEach(function (p) {
    cyl(scene, 0.16, 0.08, p[0], -1.26, p[1], darkMat, { seg: 12 });
  });

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 28),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, color: 0x000000 })
  );
  contact.rotation.x = -Math.PI / 2;
  contact.position.y = -1.24;
  scene.add(contact);
  wet.userData.hideInReflection.push(contact);

  function sidewalk(x0, z0, x1, z1) {
    const w = Math.abs(x1 - x0);
    const d = Math.abs(z1 - z0);
    const side = toon(0xb7b1a4);
    const top = new THREE.MeshToonMaterial({ color: 0xffffff, map: tileTex, gradientMap: gradientMap });
    const mats = [side, side, top, side, side, side];
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, WALK_Y - 0.04, d), mats);
    mesh.position.set((x0 + x1) / 2, (WALK_Y + 0.04) / 2, (z0 + z1) / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addOutline(mesh);
    scene.add(mesh);
    return mesh;
  }

  sidewalk(S.x0, S.z1, CURB_E, CURB_S);
  sidewalk(S.x1, S.z0, CURB_E, S.z1);
  sidewalk(-9.35, 1.55, -5.15, CURB_S);

  block(scene, -9.2, ROAD_Y, CURB_S + 0.02, 4.15, ROAD_Y + 0.025, CURB_S + 0.2, toon(0x1a212c), { recv: true });
  block(scene, CURB_E + 0.02, ROAD_Y, -4.3, CURB_E + 0.2, ROAD_Y + 0.025, CURB_S + 0.02, toon(0x1a212c), { recv: true });

  const grateMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: grateTex, gradientMap: gradientMap });
  const grateS = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 0.16), grateMat);
  grateS.rotation.x = -Math.PI / 2;
  grateS.position.set(-2.2, 0.042, CURB_S + 0.1);
  const guv = grateS.geometry.attributes.uv;
  for (let i = 0; i < guv.count; i++) guv.setX(i, guv.getX(i) * 18);
  scene.add(grateS);

  function lightPool(x, z, sx, sz, color, opacity, y) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(sx, sz),
      new THREE.MeshBasicMaterial({
        map: radialTex,
        color: color,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: opacity
      })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.renderOrder = 1;
    scene.add(m);
    return m;
  }

  lightPool(0.4, 3.15, 5.2, 2.2, 0xffb27a, 0.22, WALK_Y + 0.01);
  lightPool(1.0, 4.6, 4.8, 3.2, 0xffb27a, 0.16, 0.045);
  lightPool(3.55, 0.2, 2.2, 4.6, 0xffb27a, 0.18, WALK_Y + 0.01);
  lightPool(6.05, 4.85, 4.2, 4.2, 0xffc48a, 0.28, 0.045);
  lightPool(-6.9, 2.7, 2.4, 1.6, 0x7ae0ee, 0.2, WALK_Y + 0.01);

  const glassMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() } },
    vertexShader: [
      'varying vec2 vUv;',
      'varying vec3 vNormal;',
      'varying vec3 vWorld;',
      'void main() {',
      '  vUv = uv;',
      '  vec4 world = modelMatrix * vec4(position, 1.0);',
      '  vWorld = world.xyz;',
      '  vNormal = normalize(mat3(modelMatrix) * normal);',
      '  gl_Position = projectionMatrix * viewMatrix * world;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform float uTime;',
      'uniform vec3 uCam;',
      'varying vec2 vUv;',
      'varying vec3 vNormal;',
      'varying vec3 vWorld;',
      'void main() {',
      '  vec3 V = normalize(uCam - vWorld);',
      '  vec3 N = normalize(vNormal);',
      '  float ndv = abs(dot(N, V));',
      '  float fres = pow(1.0 - ndv, 2.6);',
      '  float col = floor(vUv.x * 42.0);',
      '  float shift = fract(sin(col * 91.7) * 43.2);',
      '  float speed = 0.28 + shift * 0.85;',
      '  float y = fract(vUv.y * (1.4 + shift * 1.6) - uTime * speed + shift);',
      '  float band = smoothstep(0.0, 0.015, y) * smoothstep(0.16, 0.03, y);',
      '  float gate = step(0.62, fract(sin(col * 12.9) * 8.1));',
      '  float streak = band * gate;',
      '  float drop = smoothstep(0.045, 0.0, length(fract(vec2(vUv.x * 16.0, vUv.y * 5.5 - uTime * 0.15)) - 0.5) - 0.12);',
      '  drop *= step(0.82, fract(sin(floor(vUv.x * 16.0) * 3.1) * 19.0));',
      '  vec3 tint = vec3(0.62, 0.76, 0.9);',
      '  float alpha = mix(0.035, 0.26, fres) + streak * 0.42 + drop * 0.22;',
      '  vec3 rgb = tint * (0.25 + fres * 0.55) + vec3(0.82, 0.9, 1.0) * streak + vec3(0.9, 0.95, 1.0) * drop;',
      '  gl_FragColor = vec4(rgb, clamp(alpha, 0.0, 0.72));',
      '  #include <colorspace_fragment>',
      '}'
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  glassMat.toneMapped = false;

  const fridgeGlassMat = new THREE.MeshBasicMaterial({
    color: 0xd5e8f5,
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });
  const fridgeGlowMat = new THREE.MeshBasicMaterial({ color: 0xf3fbff });
  const odenGlowMat = new THREE.MeshBasicMaterial({ color: 0xff7a32 });

  function trackFlicker(mat, base) {
    flickers.push({ mat: mat, base: base });
  }

  const logoMat = toonTex(logoTex, 1.25);
  const fasciaMat = toonTex(fasciaTex, 1.05);
  const openMat = toonTex(openTex, 1.35);
  const menuMat = toonTex(menuTex, 0.95);
  trackFlicker(logoMat, 1.25);
  trackFlicker(fasciaMat, 1.05);
  trackFlicker(openMat, 1.35);
  trackFlicker(menuMat, 0.95);
  banners.forEach(function (t) {
    const m = toonTex(t, 0.7);
    trackFlicker(m, 0.7);
    t.userData = { mat: m };
  });

  const stripeMat = new THREE.MeshToonMaterial({ map: stripeTex, gradientMap: gradientMap, color: 0xffffff });

  block(scene, S.x0, WALK_Y, S.z0 + WT, S.x0 + WT, WALL_TOP, S.z1 - WT, wallMat, { cast: true, recv: true, outline: true });
  block(scene, S.x0 + WT, WALK_Y, S.z0, S.x1 - WT, WALL_TOP, S.z0 + WT, wallMat, { cast: true, recv: true, outline: true });
  block(scene, S.x0, WALK_Y, S.z1 - WT, S.x0 + 0.16, WALL_TOP, S.z1, frameMat, { cast: true, outline: true });
  block(scene, S.x1 - 0.16, WALK_Y, S.z1 - 0.16, S.x1, WALL_TOP, S.z1, frameMat, { cast: true, outline: true });
  block(scene, S.x1 - WT, WALK_Y, S.z0, S.x1, WALL_TOP, S.z1 - 0.16, frameMat, { cast: true, outline: true });

  const doorCX = -0.15;
  const doorW = 1.62;
  const doorL = doorCX - doorW / 2;
  const doorR = doorCX + doorW / 2;
  const glassBot = WALK_Y + 0.2;
  const glassTop = WALK_Y + 2.46;
  const doorTop = WALK_Y + 2.14;

  block(scene, S.x0 + 0.16, WALK_Y, S.z1 - WT, doorL - 0.04, glassBot, S.z1, frameMat, { cast: true });
  block(scene, doorR + 0.04, WALK_Y, S.z1 - WT, S.x1 - 0.16, glassBot, S.z1, frameMat, { cast: true });
  block(scene, S.x0 + 0.16, glassTop, S.z1 - WT, S.x1 - 0.16, WALL_TOP, S.z1, frameMat, { cast: true });
  block(scene, doorL - 0.05, glassBot, S.z1 - WT, doorL + 0.02, glassTop, S.z1, frameMat, {});
  block(scene, doorR - 0.02, glassBot, S.z1 - WT, doorR + 0.05, glassTop, S.z1, frameMat, {});
  block(scene, doorL, doorTop, S.z1 - WT, doorR, glassTop, S.z1, frameMat, {});

  function glassPane(w, h, x, y, z, rotY) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
    m.position.set(x, y, z);
    if (rotY) m.rotation.y = rotY;
    m.renderOrder = 2;
    m.layers.set(0);
    scene.add(m);
    return m;
  }

  glassPane(doorL - 0.08 - (S.x0 + 0.2), glassTop - glassBot, (S.x0 + 0.2 + doorL - 0.08) / 2, (glassBot + glassTop) / 2, S.z1 + 0.012, 0);
  glassPane(S.x1 - 0.2 - (doorR + 0.08), glassTop - glassBot, (doorR + 0.08 + S.x1 - 0.2) / 2, (glassBot + glassTop) / 2, S.z1 + 0.012, 0);
  glassPane(doorW - 0.08, glassTop - doorTop - 0.04, doorCX, (doorTop + glassTop) / 2, S.z1 + 0.012, 0);

  const ez0 = S.z0 + 0.22;
  const ez1 = S.z1 - 0.22;
  const eSpan = ez1 - ez0;
  const ePane = (eSpan - 0.12) / 3;
  for (let i = 0; i < 3; i++) {
    const zc = ez0 + 0.04 + ePane / 2 + i * (ePane + 0.04);
    glassPane(ePane - 0.04, glassTop - glassBot, S.x1 + 0.012, (glassBot + glassTop) / 2, zc, Math.PI / 2);
    if (i < 2) {
      const mz = ez0 + (i + 1) * (ePane + 0.04);
      block(scene, S.x1 - WT, glassBot, mz - 0.025, S.x1, glassTop, mz + 0.025, frameMat, {});
    }
  }
  block(scene, S.x1 - WT, WALK_Y, ez0, S.x1, glassBot, ez1, frameMat, { cast: true });
  block(scene, S.x1 - WT, glassTop, ez0, S.x1, WALL_TOP, ez1, frameMat, { cast: true });

  function makeDoorPanel(x, dir) {
    const g = new THREE.Group();
    g.position.set(x, 0, 0);
    const pw = 0.78;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(pw, doorTop - WALK_Y, 0.045), frameMat);
    frame.position.set(0, (doorTop + WALK_Y) / 2, S.z1 + 0.03);
    g.add(frame);
    const gp = new THREE.Mesh(new THREE.PlaneGeometry(pw - 0.1, doorTop - WALK_Y - 0.16), glassMat);
    gp.position.set(0, (doorTop + WALK_Y) / 2 + 0.02, S.z1 + 0.056);
    gp.renderOrder = 3;
    g.add(gp);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(pw - 0.08, 0.045, 0.03), metalMat);
    rail.position.set(0, WALK_Y + 1.05, S.z1 + 0.07);
    g.add(rail);
    scene.add(g);
    return g;
  }

  anim.doorL = makeDoorPanel(doorL + 0.4, -1);
  anim.doorR = makeDoorPanel(doorR - 0.4, 1);
  anim.doorL0 = anim.doorL.position.x;
  anim.doorR0 = anim.doorR.position.x;
  anim.doorSlide = 0.72;

  const sensor = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.2, 0.06, 0.08), darkMat);
  sensor.position.set(doorCX, doorTop + 0.05, S.z1 + 0.04);
  scene.add(sensor);
  const sensorLed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0x3dcc72 }));
  sensorLed.position.set(doorCX + 0.55, doorTop + 0.05, S.z1 + 0.09);
  scene.add(sensorLed);
  anim.sensorLed = sensorLed;

  block(scene, S.x0 - 0.02, 2.5, S.z1 - 0.04, CURB_E, 2.58, CURB_S, toon(0xef8b30), { cast: true, recv: true, outline: true });
  block(scene, S.x1 - 0.04, 2.5, S.z0 - 0.02, CURB_E, 2.58, S.z1, toon(0xef8b30), { cast: true, recv: true });
  const lipS = new THREE.Mesh(new THREE.PlaneGeometry(CURB_E - S.x0, 0.1), stripeMat);
  lipS.position.set((S.x0 + CURB_E) / 2, 2.52, CURB_S + 0.01);
  scene.add(lipS);
  const lipE = new THREE.Mesh(new THREE.PlaneGeometry(CURB_S - S.z0, 0.1), stripeMat);
  lipE.position.set(CURB_E + 0.01, 2.52, (S.z0 + CURB_S) / 2);
  lipE.rotation.y = Math.PI / 2;
  scene.add(lipE);

  for (let x = S.x0 + 0.4; x < S.x1; x += 1.3) {
    cyl(scene, 0.025, 1.15, x, WALK_Y + 1.35, (S.z1 + CURB_S) / 2, metalMat, { rx: Math.PI / 2, seg: 8 });
  }

  const fasciaS = new THREE.Mesh(new THREE.PlaneGeometry(S.x1 - S.x0 - 0.2, 0.5), fasciaMat);
  fasciaS.position.set((S.x0 + S.x1) / 2, 2.9, S.z1 + 0.02);
  scene.add(fasciaS);
  const fasciaE = new THREE.Mesh(new THREE.PlaneGeometry(S.z1 - S.z0 - 0.3, 0.5), fasciaMat);
  fasciaE.position.set(S.x1 + 0.02, 2.9, (S.z0 + S.z1) / 2);
  fasciaE.rotation.y = Math.PI / 2;
  scene.add(fasciaE);

  block(scene, S.x0 - 0.1, WALL_TOP - 0.02, S.z0 - 0.1, S.x1 + 0.1, WALL_TOP + 0.12, S.z1 + 0.1, roofMat, { cast: true, recv: true, outline: true });
  block(scene, S.x0 - 0.06, WALL_TOP + 0.12, S.z0 - 0.06, S.x1 + 0.06, WALL_TOP + 0.32, S.z0 + 0.08, wallDark, { outline: true });
  block(scene, S.x0 - 0.06, WALL_TOP + 0.12, S.z1 - 0.08, S.x1 + 0.06, WALL_TOP + 0.32, S.z1 + 0.06, wallDark, {});
  block(scene, S.x0 - 0.06, WALL_TOP + 0.12, S.z0, S.x0 + 0.08, WALL_TOP + 0.32, S.z1, wallDark, {});
  block(scene, S.x1 - 0.08, WALL_TOP + 0.12, S.z0, S.x1 + 0.06, WALL_TOP + 0.32, S.z1, wallDark, {});

  cyl(scene, 0.06, 0.7, 2.15, WALL_TOP + 0.32, 1.85, metalMat, { cast: true, seg: 10 });
  cyl(scene, 0.06, 0.7, 2.15, WALL_TOP + 0.32, 0.55, metalMat, { cast: true, seg: 10 });
  const signBoxMats = [logoMat, toon(0xef8b30), darkMat, darkMat, logoMat, fasciaMat];
  const signBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 1.35), signBoxMats);
  signBox.position.set(2.15, WALL_TOP + 1.05, 1.85);
  signBox.castShadow = true;
  addOutline(signBox);
  scene.add(signBox);
  const signBox2 = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.72, 0.18), [fasciaMat, fasciaMat, darkMat, darkMat, logoMat, logoMat]);
  signBox2.position.set(1.35, WALL_TOP + 1.05, 2.15);
  addOutline(signBox2);
  scene.add(signBox2);

  function buildAC(x, y, z, ry) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = ry || 0;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.42, 0.34), toon(0xd8dee6));
    body.position.y = 0.21;
    body.castShadow = true;
    addOutline(body);
    g.add(body);
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 14), toon(0x8a929c));
    fan.rotation.x = Math.PI / 2;
    fan.position.set(0, 0.21, 0.18);
    g.add(fan);
    scene.add(g);
  }
  buildAC(-1.6, WALL_TOP + 0.14, -1.4, 0.4);
  buildAC(0.4, WALL_TOP + 0.14, -2.2, 0);
  buildAC(-2.4, WALK_Y, -3.7, Math.PI);

  cyl(scene, 0.05, 0.55, -0.4, WALL_TOP + 0.14, -0.6, metalMat, { seg: 8 });
  cyl(scene, 0.04, 0.4, 0.2, WALL_TOP + 0.14, -0.2, metalMat, { seg: 8 });

  const floorMat = new THREE.MeshToonMaterial({ color: 0xffffff, map: floorTex, gradientMap: gradientMap });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(S.x1 - S.x0 - WT * 2, 0.06, S.z1 - S.z0 - WT * 2), floorMat);
  floor.position.set((S.x0 + S.x1) / 2, WALK_Y + 0.03, (S.z0 + S.z1) / 2);
  floor.layers.set(1);
  floor.receiveShadow = false;
  scene.add(floor);

  const ceil = block(scene, S.x0 + WT, WALL_TOP - 0.08, S.z0 + WT, S.x1 - WT, WALL_TOP - 0.02, S.z1 - WT, toon(0xf7f3ec), { layer: 1 });
  ceil.layers.set(1);

  function fluo(x, z, w, d) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.04, d),
      new THREE.MeshToonMaterial({ color: 0xfff8ee, emissive: 0xfff4e4, emissiveIntensity: 1.4, gradientMap: gradientMap })
    );
    m.position.set(x, WALL_TOP - 0.12, z);
    m.layers.set(1);
    scene.add(m);
    flickers.push({ mat: m.material, base: 1.4, gentle: true });
    return m;
  }
  fluo(-1.6, -1.4, 1.3, 0.42);
  fluo(0.2, -1.4, 1.3, 0.42);
  fluo(-1.6, 0.5, 1.3, 0.42);
  fluo(1.5, 0.8, 1.1, 0.38);

  function gondola(x, z0, z1) {
    const zc = (z0 + z1) / 2;
    const len = z1 - z0;
    block(scene, x - 0.03, WALK_Y, z0, x + 0.03, WALK_Y + 1.55, z1, toon(0xd9d3c6), { layer: 1, outline: true, cast: true });
    block(scene, x - 0.28, WALK_Y, z0, x - 0.24, WALK_Y + 1.55, z1, toon(0xcfc8ba), { layer: 1 });
    block(scene, x + 0.24, WALK_Y, z0, x + 0.28, WALK_Y + 1.55, z1, toon(0xcfc8ba), { layer: 1 });
    const levels = [0.08, 0.46, 0.84, 1.22];
    levels.forEach(function (ly) {
      block(scene, x - 0.26, WALK_Y + ly, z0 + 0.02, x + 0.26, WALK_Y + ly + 0.025, z1 - 0.02, toon(0xe7e0d2), { layer: 1 });
      fillRow(x - 0.14, WALK_Y + ly + 0.03, zc, len - 0.12, 0.22, true);
      fillRow(x + 0.14, WALK_Y + ly + 0.03, zc, len - 0.12, 0.22, true);
    });
  }

  const snackColors = [0xd64545, 0xe8943a, 0xf0d15c, 0x5aaa62, 0x3a9ad4, 0x7a6ad4, 0xe888a8, 0xf4f0e4, 0x8d6844, 0x3e6a88, 0xf27a3a, 0x66c4b0];
  function fillRow(x, y, z, len, depth, alongZ) {
    let cursor = -len / 2;
    let i = 0;
    while (cursor < len / 2 - 0.06) {
      const w = 0.1 + (i % 3) * 0.02;
      const h = 0.13 + (i % 4) * 0.018;
      const color = snackColors[i % snackColors.length];
      if (alongZ) qBox(x, y + h / 2, z + cursor + w / 2, depth, h, w, color, 1);
      else qBox(x + cursor + w / 2, y + h / 2, z, w, h, depth, color, 1);
      cursor += w + 0.012;
      i++;
    }
  }

  gondola(-2.15, -2.25, 0.25);
  gondola(-0.45, -2.25, 0.25);
  gondola(1.05, -2.25, 0.05);

  function endCap(x, z) {
    for (let i = 0; i < 5; i++) {
      const h = 0.16 + (i % 3) * 0.05;
      qBox(x + (i - 2) * 0.12, WALK_Y + 0.08 + h / 2, z, 0.1, h, 0.12, snackColors[(i * 3) % snackColors.length], 1);
    }
    for (let i = 0; i < 4; i++) {
      qBox(x + (i - 1.5) * 0.13, WALK_Y + 0.42, z + 0.02, 0.11, 0.2, 0.1, snackColors[(i + 4) % snackColors.length], 1);
    }
  }
  endCap(-2.15, 0.48);
  endCap(-0.45, 0.48);
  endCap(1.05, 0.32);

  fillRow(-0.85, WALK_Y + 0.55, 1.15, 0.7, 0.28, false);
  block(scene, -1.25, WALK_Y, 0.95, -0.45, WALK_Y + 0.52, 1.4, toon(0xe6dfd0), { layer: 1, outline: true });

  block(scene, 0.55, WALK_Y, 0.95, 2.55, WALK_Y + 0.96, 2.05, toon(0xd7cfc0), { layer: 1, outline: true, cast: true });
  block(scene, 0.55, WALK_Y + 0.96, 0.95, 2.55, WALK_Y + 1.0, 2.05, toon(0x2c3038), { layer: 1 });
  const monitor = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.28, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xd7e8ff })
  );
  monitor.position.set(1.15, WALK_Y + 1.22, 1.15);
  monitor.layers.set(1);
  scene.add(monitor);
  block(scene, 1.08, WALK_Y + 1.0, 1.1, 1.22, WALK_Y + 1.08, 1.2, darkMat, { layer: 1 });

  const coffee = new THREE.Group();
  coffee.position.set(2.15, WALK_Y + 1.0, 1.55);
  const coffeeBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.52, 0.36), toon(0x2a2e34));
  coffeeBody.position.y = 0.26;
  coffee.add(coffeeBody);
  const coffeeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshBasicMaterial({ color: 0x9fd0ff }));
  coffeeScreen.position.set(0.191, 0.32, 0);
  coffeeScreen.rotation.y = Math.PI / 2;
  coffee.add(coffeeScreen);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.07, 10), toon(0xf4f0e8));
  cup.position.set(0.22, 0.04, 0.08);
  coffee.add(cup);
  coffee.traverse(function (o) { o.layers.set(1); });
  scene.add(coffee);

  function buildOden(x, z) {
    block(scene, x - 0.42, WALK_Y, z - 0.28, x + 0.42, WALK_Y + 0.72, z + 0.28, toon(0x8a9298), { layer: 1, outline: true });
    const broth = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.42), odenGlowMat);
    broth.position.set(x, WALK_Y + 0.7, z);
    broth.layers.set(1);
    scene.add(broth);
    const bits = [[-0.22, -0.08, 0.07, 0xf0d2a0], [0.0, 0.06, 0.06, 0xe8c8a0], [0.2, -0.05, 0.055, 0xd4553a], [-0.05, -0.1, 0.05, 0xf2e2c8], [0.18, 0.1, 0.045, 0xc98448]];
    bits.forEach(function (b) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(b[2], 10, 8), toon(b[3]));
      s.position.set(x + b[0], WALK_Y + 0.74, z + b[1]);
      s.layers.set(1);
      scene.add(s);
      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6), toon(0xe6d2b0));
      stick.position.set(x + b[0], WALK_Y + 0.86, z + b[1]);
      stick.layers.set(1);
      scene.add(stick);
    });
    anim.oden = { x: x, z: z, y: WALK_Y + 0.78 };
  }
  buildOden(2.32, 0.72);

  block(scene, 1.85, WALK_Y, 1.15, 2.55, WALK_Y + 0.7, 1.7, toon(0xc4553a), { layer: 1, outline: true });
  const hotGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.42), fridgeGlassMat);
  hotGlass.position.set(2.56, WALK_Y + 0.48, 1.42);
  hotGlass.rotation.y = Math.PI / 2;
  hotGlass.layers.set(1);
  scene.add(hotGlass);
  for (let i = 0; i < 5; i++) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), toon(0xd4a04a));
    ball.position.set(2.35, WALK_Y + 0.5, 1.25 + i * 0.08);
    ball.layers.set(1);
    scene.add(ball);
  }

  function buildBentoRow(x, z0, z1) {
    block(scene, x - 0.28, WALK_Y, z0, x + 0.22, WALK_Y + 0.7, z1, toon(0xd5dbe2), { layer: 1, outline: true });
    const n = 6;
    for (let i = 0; i < n; i++) {
      const z = z0 + 0.12 + i * ((z1 - z0 - 0.2) / n);
      const top = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.14), bentoMats[i % 3]);
      top.position.set(x - 0.02, WALK_Y + 0.74, z);
      top.layers.set(1);
      scene.add(top);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.14), toon(0xf0ebe2));
      body.position.set(x - 0.02, WALK_Y + 0.69, z);
      body.layers.set(1);
      scene.add(body);
    }
  }
  buildBentoRow(2.5, -1.85, -0.35);

  const oniGeo = (function () {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.07);
    shape.lineTo(-0.055, -0.04);
    shape.lineTo(0.055, -0.04);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
    geo.translate(0, 0.04, -0.02);
    return geo;
  })();
  const oniMat = toon(0xf7f4ee);
  const noriMat = toon(0x2a2420);
  block(scene, 2.15, WALK_Y, -0.15, 2.7, WALK_Y + 0.55, 0.95, toon(0xe7e2d6), { layer: 1, outline: true });
  for (let i = 0; i < 8; i++) {
    const oz = -0.02 + (i % 4) * 0.2;
    const ox = 2.28 + Math.floor(i / 4) * 0.16;
    const oni = new THREE.Mesh(oniGeo, oniMat);
    oni.position.set(ox, WALK_Y + 0.56, oz);
    oni.layers.set(1);
    scene.add(oni);
    const nori = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.028, 0.046), noriMat);
    nori.position.set(ox, WALK_Y + 0.6, oz);
    nori.layers.set(1);
    scene.add(nori);
  }

  function fridgeBank(x0, x1, z, depth) {
    block(scene, x0, WALK_Y, z, x1, WALK_Y + 2.02, z + depth, toon(0xd5dde6), { layer: 1, outline: true, cast: true });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.12, 1.7), fridgeGlowMat);
    glow.position.set((x0 + x1) / 2, WALK_Y + 1.05, z + 0.06);
    glow.layers.set(1);
    scene.add(glow);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.08, 1.82), fridgeGlassMat);
    glass.position.set((x0 + x1) / 2, WALK_Y + 1.02, z + depth + 0.01);
    glass.layers.set(1);
    glass.renderOrder = 2;
    scene.add(glass);
    const cols = Math.floor((x1 - x0) / 0.18);
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < 4; r++) {
        qCyl(x0 + 0.14 + c * 0.18, WALK_Y + 0.28 + r * 0.42, z + depth * 0.55, 0.045, 0.2, snackColors[(c + r * 2) % snackColors.length], 1);
      }
    }
  }
  fridgeBank(-2.7, 2.55, -3.12, 0.48);
  fridgeBank(1.7, 2.7, -2.55, 0.7);

  block(scene, -3.28, WALK_Y, -0.2, -2.85, WALK_Y + 1.45, 1.15, toon(0xc8c2b4), { layer: 1, outline: true });
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      block(scene, -3.22 + c * 0.18, WALK_Y + 0.08 + r * 0.44, -0.1, -3.08 + c * 0.18, WALK_Y + 0.46 + r * 0.44, 1.05, toon(r === 1 && c === 0 ? 0x3a7a4a : 0xb7b1a4), { layer: 1 });
    }
  }

  block(scene, -2.55, WALK_Y, -3.18, -1.55, WALK_Y + 1.9, -2.7, toon(0x4a4038), { layer: 1, outline: true });
  const doorWin = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.4), new THREE.MeshBasicMaterial({ color: 0xffe0b0 }));
  doorWin.position.set(-2.05, WALK_Y + 1.35, -2.69);
  doorWin.layers.set(1);
  scene.add(doorWin);

  for (let i = 0; i < 6; i++) {
    const mag = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.32, 0.24),
      new THREE.MeshToonMaterial({ map: magTextures[i % magTextures.length], gradientMap: gradientMap })
    );
    mag.position.set(-2.55, WALK_Y + 0.55 + (i % 2) * 0.38, 1.35 + i * 0.06);
    mag.rotation.y = -0.35 + i * 0.08;
    mag.layers.set(1);
    scene.add(mag);
  }
  block(scene, -2.9, WALK_Y, 1.25, -2.35, WALK_Y + 0.9, 1.85, toon(0xc8b8a0), { layer: 1, outline: true });

  posters.forEach(function (tex, i) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.64),
      new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientMap })
    );
    m.position.set(-2.3 + i * 0.7, WALK_Y + 2.15, -3.2);
    m.layers.set(1);
    scene.add(m);
  });

  const menu = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.72), menuMat);
  menu.position.set(1.55, WALK_Y + 2.15, 1.35);
  menu.layers.set(1);
  scene.add(menu);

  const openSign = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.22), openMat);
  openSign.position.set(1.7, WALK_Y + 2.25, S.z1 - 0.05);
  openSign.layers.set(1);
  scene.add(openSign);

  banners.forEach(function (tex, i) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.2), tex.userData.mat);
    m.position.set(-1.5 + i * 1.15, glassTop - 0.02, S.z1 - 0.04);
    m.layers.set(1);
    scene.add(m);
  });
  const eastBanner = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.18), banners[0].userData.mat);
  eastBanner.position.set(S.x1 - 0.04, glassTop - 0.05, 0.4);
  eastBanner.rotation.y = Math.PI / 2;
  eastBanner.layers.set(1);
  scene.add(eastBanner);

  for (let i = 0; i < 4; i++) {
    block(scene, -1.7, WALK_Y, 1.55 + i * 0.06, -1.35, WALK_Y + 0.08 + i * 0.045, 1.85, toon(0xd24a4a), { layer: 1 });
  }

  cyl(scene, 0.07, 0.42, -2.7, WALK_Y, 1.95, toon(0xd24a3a), { layer: 1, seg: 10 });

  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ color: 0xf7f4ee }));
  clockFace.position.set(-3.4, WALK_Y + 2.35, 0.2);
  clockFace.rotation.y = Math.PI / 2;
  clockFace.layers.set(1);
  scene.add(clockFace);
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.012), darkMat);
  const minHand = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.11, 0.01), darkMat);
  hourHand.layers.set(1);
  minHand.layers.set(1);
  hourHand.geometry.translate(0, 0.04, 0);
  minHand.geometry.translate(0, 0.055, 0);
  const clockPivotH = new THREE.Group();
  const clockPivotM = new THREE.Group();
  clockPivotH.position.set(-3.38, WALK_Y + 2.35, 0.2);
  clockPivotM.position.copy(clockPivotH.position);
  clockPivotH.add(hourHand);
  clockPivotM.add(minHand);
  hourHand.position.set(0, 0, 0);
  minHand.position.set(0, 0, 0);
  clockPivotH.layers.set(1);
  clockPivotM.layers.set(1);
  scene.add(clockPivotH);
  scene.add(clockPivotM);
  anim.clockH = clockPivotH;
  anim.clockM = clockPivotM;

  anim.steam = [];
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: steamTex,
      color: 0xfff6ee,
      transparent: true,
      opacity: 0,
      depthWrite: false
    }));
    s.layers.set(1);
    s.userData.seed = i * 0.37;
    scene.add(s);
    anim.steam.push(s);
  }

  flushInstances(scene);

  const doorMatMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.015, 0.7),
    new THREE.MeshToonMaterial({ map: matTex, gradientMap: gradientMap })
  );
  doorMatMesh.position.set(doorCX, WALK_Y + 0.01, S.z1 + 0.48);
  doorMatMesh.receiveShadow = true;
  scene.add(doorMatMesh);

  function buildBike(x, z, ry, color, basket) {
    const g = new THREE.Group();
    g.position.set(x, WALK_Y, z);
    g.rotation.y = ry;
    const frame = toon(color);
    const tire = toon(0x1c1c22);
    const metal = toon(0xd5d8de);
    function wheel(wz) {
      const wg = new THREE.Group();
      wg.position.set(0, 0.34, wz);
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 8, 18), tire);
      t.rotation.y = Math.PI / 2;
      wg.add(t);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 8), metal);
      hub.rotation.z = Math.PI / 2;
      wg.add(hub);
      for (let i = 0; i < 6; i++) {
        const sg = new THREE.Group();
        sg.rotation.x = i * Math.PI / 3;
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.3, 0.012), metal);
        spoke.position.y = 0.15;
        sg.add(spoke);
        wg.add(sg);
      }
      g.add(wg);
    }
    wheel(-0.52);
    wheel(0.5);
    const tubes = [
      [0, 0.34, -0.52, 0, 0.72, -0.05],
      [0, 0.34, 0.5, 0, 0.62, 0.05],
      [0, 0.72, -0.05, 0, 0.62, 0.05],
      [0, 0.5, -0.15, 0, 0.34, 0.15]
    ];
    tubes.forEach(function (t) {
      const a = new THREE.Vector3(t[0], t[1], t[2]);
      const b = new THREE.Vector3(t[3], t[4], t[5]);
      const len = a.distanceTo(b);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, len, 6), frame);
      m.position.copy(mid);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
      g.add(m);
    });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.16), darkMat);
    seat.position.set(0, 0.78, -0.12);
    g.add(seat);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.36, 8), metal);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 0.78, 0.48);
    g.add(bar);
    if (basket) {
      block(g, -0.16, 0.55, 0.58, 0.16, 0.72, 0.82, toon(0xc8b49a), {});
    }
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.28, 0.015), metal);
    stand.position.set(0.12, 0.14, -0.1);
    stand.rotation.z = 0.3;
    g.add(stand);
    g.traverse(function (o) {
      if (o.isMesh) {
        o.castShadow = true;
        o.layers.set(0);
      }
    });
    addOutline(g.children[0] ? g : g);
    scene.add(g);
  }
  buildBike(-2.85, 3.22, 0.35, 0xc4554a, true);
  buildBike(-2.05, 3.38, -0.2, 0x3d6a8a, false);

  (function umbrellaStand(x, z) {
    cyl(scene, 0.18, 0.08, x, WALK_Y, z, metalMat, { seg: 16, cast: true });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.012, 6, 16), metalMat);
    ring.position.set(x, WALK_Y + 0.22, z);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    const colors = [0x2a3f86, 0xd24a4a, 0xe6c84a, 0xf2f2f2];
    colors.forEach(function (col, i) {
      const a = i * 1.5 + 0.4;
      const u = new THREE.Group();
      u.position.set(x + Math.cos(a) * 0.07, WALK_Y + 0.08, z + Math.sin(a) * 0.07);
      u.rotation.z = (i - 1.5) * 0.07;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.78, 8), toon(col));
      shaft.position.y = 0.4;
      shaft.castShadow = true;
      u.add(shaft);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 6, 10, Math.PI), darkMat);
      handle.position.y = 0.02;
      u.add(handle);
      scene.add(u);
    });
  })(1.15, 3.12);

  function buildBin(x, z, color, label, bg) {
    block(scene, x - 0.2, WALK_Y, z - 0.2, x + 0.2, WALK_Y + 0.58, z + 0.2, toon(color), { cast: true, outline: true, recv: true });
    cyl(scene, 0.18, 0.06, x, WALK_Y + 0.58, z, darkMat, { seg: 14 });
    const lab = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.12),
      new THREE.MeshToonMaterial({ map: binLabel(label, bg), gradientMap: gradientMap })
    );
    lab.position.set(x, WALK_Y + 0.36, z + 0.205);
    scene.add(lab);
  }
  buildBin(-3.35, 3.2, 0x6a8f6a, '燃える', '#e7f0df');
  buildBin(-3.85, 3.28, 0x4a6a9a, 'かん', '#e4eef8');

  function buildVending(x, z, tex, glowColor) {
    const g = new THREE.Group();
    g.position.set(x, WALK_Y, z);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.82, 0.58), toon(0x20262e));
    body.position.y = 0.91;
    body.castShadow = true;
    addOutline(body);
    g.add(body);
    const front = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 1.55),
      new THREE.MeshToonMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.55, gradientMap: gradientMap })
    );
    front.position.set(0, 0.95, 0.292);
    g.add(front);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 10),
      new THREE.MeshBasicMaterial({ color: glowColor, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.position.set(0, 1.35, 0.2);
    g.add(glow);
    g.traverse(function (o) { o.layers.set(0); });
    scene.add(g);
    return front.material;
  }
  const vendA = buildVending(-7.15, 2.55, vendCoolTex, 0x7ae8f0);
  const vendB = buildVending(-6.2, 2.55, vendHotTex, 0xff8a78);
  anim.vending = [vendA, vendB];

  (function bulletin(x, z) {
    cyl(scene, 0.04, 1.35, x - 0.45, WALK_Y, z, metalMat, { cast: true, seg: 8 });
    cyl(scene, 0.04, 1.35, x + 0.45, WALK_Y, z, metalMat, { cast: true, seg: 8 });
    block(scene, x - 0.55, WALK_Y + 0.85, z - 0.04, x + 0.55, WALK_Y + 1.7, z + 0.04, toon(0x6a543c), { outline: true, cast: true });
    for (let i = 0; i < 2; i++) {
      const p = new THREE.Mesh(
        new THREE.PlaneGeometry(0.42, 0.58),
        new THREE.MeshToonMaterial({ map: posters[i + 1], gradientMap: gradientMap })
      );
      p.position.set(x - 0.24 + i * 0.48, WALK_Y + 1.28, z + 0.05);
      p.rotation.y = Math.PI / 2;
      scene.add(p);
    }
  })(3.62, -0.55);

  (function lamp(x, z) {
    cyl(scene, 0.055, 3.15, x, WALK_Y, z, darkMat, { cast: true, outline: true, seg: 10 });
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), darkMat);
    arm.position.set(x - 0.05, WALK_Y + 3.15, z + 0.22);
    arm.rotation.x = Math.PI / 2.4;
    scene.add(arm);
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.1, 0.42),
      new THREE.MeshToonMaterial({ color: 0x2a2e34, emissive: 0xffe2b8, emissiveIntensity: 0.85, gradientMap: gradientMap })
    );
    head.position.set(x, WALK_Y + 3.22, z + 0.42);
    scene.add(head);
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffe6bf, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    bulb.position.set(x, WALK_Y + 3.16, z + 0.42);
    scene.add(bulb);
  })(6.05, 4.55);

  function wire(ax, ay, az, bx, by, bz, sag) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.012, 4, false), toon(0x8a97ad));
    scene.add(mesh);
  }

  (function pole(x, z) {
    cyl(scene, 0.07, 7.3, x, 0, z, darkMat, { cast: true, outline: true, seg: 10 });
    block(scene, x - 0.45, 6.55, z - 0.06, x + 0.55, 6.68, z + 0.06, darkMat, {});
    block(scene, x - 0.35, 5.9, z - 0.05, x + 0.4, 6.02, z + 0.05, darkMat, {});
    block(scene, x - 0.16, 4.3, z - 0.16, x + 0.16, 4.85, z + 0.16, toon(0x4a525c), { outline: true });
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.32),
      new THREE.MeshToonMaterial({ map: signPlateTex, emissive: 0xffffff, emissiveMap: signPlateTex, emissiveIntensity: 0.35, gradientMap: gradientMap })
    );
    plate.position.set(x - 0.15, 3.3, z + 0.1);
    plate.rotation.y = -0.6;
    scene.add(plate);
  })(8.15, 7.55);

  wire(8.15, 6.7, 7.55, 2.15, WALL_TOP + 1.35, 1.2, 0.55);
  wire(8.15, 6.35, 7.55, -7.2, 5.7, -1.2, 0.85);
  wire(2.15, WALL_TOP + 1.2, 1.6, -6.5, 5.55, 0.2, 0.45);
  wire(8.15, 5.95, 7.55, 3.2, WALL_TOP + 0.45, 2.2, 0.35);

  (function signal(x, z) {
    cyl(scene, 0.045, 2.15, x, 0, z, darkMat, { seg: 8, cast: true });
    const house = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 0.16), darkMat);
    house.position.set(x, 2.05, z);
    scene.add(house);
    const colors = [0xd24a4a, 0xe2b84a, 0x3dcc72];
    const lenses = colors.map(function (col, i) {
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.055, 14), new THREE.MeshBasicMaterial({ color: 0x241c16 }));
      lens.position.set(x, 2.24 - i * 0.16, z + 0.082);
      scene.add(lens);
      return lens;
    });
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x3dcc72, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.position.set(x, 1.92, z + 0.05);
    scene.add(glow);
    const sigLight = point(0x3dcc72, 0.7, 3.5, x, 2.0, z, 0);
    anim.signal = { lenses: lenses, colors: colors, glow: glow, light: sigLight };
  })(8.35, 8.15);

  (function guard(x0, z0, x1, z1) {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ang = Math.atan2(x1 - x0, z1 - z0);
    const posts = Math.max(2, Math.round(len / 0.85));
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      cyl(scene, 0.035, 0.72, x0 + (x1 - x0) * t, ROAD_Y, z0 + (z1 - z0) * t, metalMat, { seg: 8, cast: true });
    }
    for (let h = 0.32; h <= 0.62; h += 0.3) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, len), metalMat);
      rail.position.set((x0 + x1) / 2, ROAD_Y + h, (z0 + z1) / 2);
      rail.rotation.y = ang;
      rail.castShadow = true;
      scene.add(rail);
    }
  })(4.45, 3.78, 6.6, 3.78);
  (function guard2() {
    const x0 = 4.45, z0 = 3.78, x1 = 4.45, z1 = 5.35;
    const len = z1 - z0;
    for (let i = 0; i <= 2; i++) cyl(scene, 0.035, 0.72, x0, ROAD_Y, z0 + i * len / 2, metalMat, { seg: 8 });
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, len), metalMat);
    rail.position.set(x0, ROAD_Y + 0.55, (z0 + z1) / 2);
    scene.add(rail);
  })();

  (function mirror(x, z) {
    cyl(scene, 0.04, 2.15, x, WALK_Y, z, darkMat, { seg: 8, cast: true });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 8, 20), toon(0xe2b84a));
    rim.position.set(x - 0.18, WALK_Y + 2.15, z);
    rim.rotation.y = 0.8;
    scene.add(rim);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.25, 20),
      new THREE.MeshBasicMaterial({ color: 0xb7c9d6 })
    );
    face.position.set(x - 0.18, WALK_Y + 2.15, z);
    face.rotation.y = 0.8;
    scene.add(face);
  })(4.28, 3.95);

  const plate2 = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.36),
    new THREE.MeshToonMaterial({ map: signSmallTex, emissive: 0xffffff, emissiveMap: signSmallTex, emissiveIntensity: 0.3, gradientMap: gradientMap })
  );
  plate2.position.set(4.55, WALK_Y + 1.55, 2.15);
  plate2.rotation.y = -0.9;
  scene.add(plate2);
  cyl(scene, 0.03, 1.55, 4.55, WALK_Y, 2.15, metalMat, { seg: 8 });

  const mh = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 20),
    new THREE.MeshToonMaterial({ map: manholeTex, gradientMap: gradientMap })
  );
  mh.rotation.x = -Math.PI / 2;
  mh.position.set(1.7, 0.04, 7.35);
  mh.receiveShadow = true;
  scene.add(mh);

  const tactileMat = new THREE.MeshToonMaterial({ map: tactileTex, gradientMap: gradientMap });
  const tac1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.4), tactileMat);
  tac1.position.set(3.55, WALK_Y + 0.01, 3.35);
  scene.add(tac1);
  const tac2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.9), tactileMat);
  tac2.position.set(3.95, WALK_Y + 0.01, 2.9);
  scene.add(tac2);

  const pMark = canvasTex(256, 256, function (g) {
    g.clearRect(0, 0, 256, 256);
    g.fillStyle = '#f2f4f6';
    g.font = '700 180px "Yu Gothic", Meiryo, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('P', 128, 140);
  });
  const pMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.7, 0.7),
    new THREE.MeshBasicMaterial({ map: pMark, transparent: true, depthWrite: false, color: 0xffffff })
  );
  pMesh.rotation.x = -Math.PI / 2;
  pMesh.position.set(7.2, 0.042, 7.15);
  scene.add(pMesh);

  (function neighbor(x0, y0, z0, x1, y1, z1, litFace) {
    block(scene, x0, 0.03, z0, x1, y1, z1, toon(0x343c4e), { cast: true, recv: true, outline: true });
    block(scene, x0 - 0.08, y1, z0 - 0.08, x1 + 0.08, y1 + 0.16, z1 + 0.08, toon(0x2a3142), { cast: true });
    const w = 0.46, h = 0.62;
    if (litFace === 'south') {
      for (let i = 0; i < 3; i++) {
        const wx = x0 + 0.55 + i * 1.15;
        block(scene, wx, 1.35, z1, wx + w, 1.35 + h, z1 + 0.04, frameMat, {});
        const pane = new THREE.Mesh(
          new THREE.PlaneGeometry(w - 0.08, h - 0.08),
          new THREE.MeshBasicMaterial({ color: i === 1 ? 0xffc898 : 0x1a2436 })
        );
        pane.position.set(wx + w / 2, 1.35 + h / 2, z1 + 0.05);
        scene.add(pane);
        if (i === 1) {
          const glow = new THREE.Mesh(
            new THREE.PlaneGeometry(0.7, 0.5),
            new THREE.MeshBasicMaterial({ color: 0xffb070, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
          );
          glow.position.set(wx + w / 2, 1.35 + h / 2, z1 + 0.08);
          scene.add(glow);
        }
      }
    }
    if (litFace === 'east') {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66), new THREE.MeshBasicMaterial({ color: 0xffc898 }));
      pane.position.set(x1 + 0.02, 2.1, z0 + 1.2);
      pane.rotation.y = Math.PI / 2;
      scene.add(pane);
    }
  })(-9.55, 0.03, -6.2, -5.15, 5.35, 1.55, 'south');

  (function () {
    const x0 = -1.1, x1 = 6.6, z0 = -9.55, z1 = -4.55, y1 = 4.35;
    block(scene, x0, 0.03, z0, x1, y1, z1, toon(0x3a4254), { cast: true, recv: true, outline: true });
    block(scene, x0 - 0.06, y1, z0 - 0.06, x1 + 0.06, y1 + 0.14, z1 + 0.06, toon(0x2a3142), { cast: true });
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), new THREE.MeshBasicMaterial({ color: 0xffc898 }));
    pane.position.set(x1 + 0.02, 2.3, -6.4);
    pane.rotation.y = Math.PI / 2;
    scene.add(pane);
    cyl(scene, 0.32, 0.62, -7.4, 5.5, -2.2, metalMat, { seg: 12, cast: true });
    cyl(scene, 0.04, 0.45, -7.7, 5.5, -2.2, metalMat, { seg: 6 });
    cyl(scene, 0.04, 0.45, -7.1, 5.5, -2.2, metalMat, { seg: 6 });
  })();

  const alleyPane = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.55), new THREE.MeshBasicMaterial({ color: 0xffc898 }));
  alleyPane.position.set(-5.12, 2.4, -0.4);
  alleyPane.rotation.y = Math.PI / 2;
  scene.add(alleyPane);

  block(scene, S.x0 - 0.02, WALK_Y + 0.15, -2.4, S.x0 + 0.02, WALK_Y + 1.7, -1.3, toon(0x6a543c), {});
  const alleyPoster = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, 0.58),
    new THREE.MeshToonMaterial({ map: posters[0], gradientMap: gradientMap })
  );
  alleyPoster.position.set(S.x0 - 0.03, WALK_Y + 1.15, -1.85);
  alleyPoster.rotation.y = -Math.PI / 2;
  scene.add(alleyPoster);

  block(scene, -1.2, WALK_Y, S.z0 - 0.55, -0.35, WALK_Y + 1.7, S.z0 - 0.02, toon(0x6a727c), { outline: true, cast: true });
  block(scene, -4.7, ROAD_Y, 1.7, -4.25, ROAD_Y + 0.28, 2.15, toon(0xd24a4a), { cast: true });
  block(scene, -4.55, ROAD_Y + 0.28, 1.78, -4.25, ROAD_Y + 0.5, 2.08, toon(0x3a7ad4), { cast: true });
  block(scene, -4.9, ROAD_Y, 0.4, -4.5, ROAD_Y + 0.32, 0.85, toon(0x3a9a62), { cast: true });
  cyl(scene, 0.05, 1.1, -4.2, WALK_Y, -1.2, metalMat, { seg: 8 });
  cyl(scene, 0.04, 0.8, S.x0 - 0.08, WALK_Y + 0.4, -0.4, metalMat, { seg: 6 });

  const pot = cyl(scene, 0.12, 0.16, 3.28, WALK_Y, 2.75, toon(0x8a5a3a), { seg: 10 });
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), toon(0x6aaa62));
  leaves.position.set(3.28, WALK_Y + 0.28, 2.75);
  scene.add(leaves);
  const leaves2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), toon(0x8ec87a));
  leaves2.position.set(3.38, WALK_Y + 0.36, 2.7);
  scene.add(leaves2);

  const rainCount = 1400;
  const rainGeo = new THREE.BoxGeometry(0.012, 1, 0.012);
  const rainMat = new THREE.MeshBasicMaterial({
    color: 0xd5e6f8,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const rain = new THREE.InstancedMesh(rainGeo, rainMat, rainCount);
  rain.frustumCulled = false;
  rain.renderOrder = 5;
  const rainState = [];
  for (let i = 0; i < rainCount; i++) {
    rainState.push({
      x: (Math.random() - 0.5) * 20,
      y: Math.random() * 9,
      z: (Math.random() - 0.5) * 20,
      s: 6.5 + Math.random() * 5.5,
      len: 0.28 + Math.random() * 0.45
    });
  }
  scene.add(rain);
  wet.userData.hideInReflection.push(rain);

  const dripCount = 36;
  const dripGeo = new THREE.SphereGeometry(0.025, 6, 6);
  const dripMat = new THREE.MeshBasicMaterial({
    color: 0xd0e4f8,
    transparent: true,
    opacity: 0.75,
    depthWrite: false
  });
  const dripsMesh = new THREE.InstancedMesh(dripGeo, dripMat, dripCount);
  dripsMesh.frustumCulled = false;
  scene.add(dripsMesh);
  wet.userData.hideInReflection.push(dripsMesh);
  const dripPts = [];
  for (let x = S.x0 + 0.2; x <= CURB_E; x += 0.55) dripPts.push({ x: x, z: CURB_S + 0.1, y: 2.5 });
  for (let z = S.z0 + 0.2; z <= CURB_S; z += 0.55) dripPts.push({ x: CURB_E + 0.1, z: z, y: 2.5 });
  const drips = [];
  for (let i = 0; i < dripCount; i++) drips.push({ x: 0, y: -5, z: 0, vy: 0, alive: false });

  const splashGeo = new THREE.RingGeometry(0.06, 0.09, 18);
  const splashes = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(splashGeo, new THREE.MeshBasicMaterial({
      color: 0xc5d8ee,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = -5;
    m.renderOrder = 4;
    scene.add(m);
    splashes.push({ mesh: m, age: 10 });
  }
  const splashGroupProxy = { visible: true };
  wet.userData.hideInReflection.push({
    get visible() { return splashes[0].mesh.visible; },
    set visible(v) { splashes.forEach(function (s) { s.mesh.visible = v; }); }
  });

  let dripAcc = 0;
  function spawnDrip() {
    const p = dripPts[(Math.random() * dripPts.length) | 0];
    for (let i = 0; i < drips.length; i++) {
      if (!drips[i].alive) {
        drips[i].x = p.x + (Math.random() - 0.5) * 0.08;
        drips[i].z = p.z + (Math.random() - 0.5) * 0.08;
        drips[i].y = p.y;
        drips[i].vy = -0.15;
        drips[i].alive = true;
        return;
      }
    }
  }
  function spawnSplash(x, z) {
    for (let i = 0; i < splashes.length; i++) {
      if (splashes[i].age > 0.8) {
        splashes[i].age = 0;
        splashes[i].mesh.position.set(x, 0.05, z);
        splashes[i].mesh.scale.set(0.4, 0.4, 0.4);
        splashes[i].mesh.material.opacity = 0.55;
        return;
      }
    }
  }
  function spawnRing(x, z, time) {
    rings[ringCursor].set(x, z, time, 1);
    ringCursor = (ringCursor + 1) % rings.length;
  }

  function insideStore(x, y, z) {
    return x > S.x0 && x < S.x1 && z > S.z0 && z < S.z1 && y < WALL_TOP + 0.05;
  }

  const el = renderer.domElement;
  let dragging = false;
  let pointerId = null;
  let lastX = 0;
  let lastY = 0;
  let velTheta = 0;
  let velPhi = 0;
  let pinchDist = 0;

  function applyOrbit() {
    orbit.phi = clamp(orbit.phi, 0.32, 1.42);
    orbit.radius = clamp(orbit.radius, 3.4, 34);
    const sinPhi = Math.sin(orbit.phi);
    camera.position.set(
      orbit.target.x + orbit.radius * sinPhi * Math.sin(orbit.theta),
      Math.max(0.18, orbit.target.y + orbit.radius * Math.cos(orbit.phi)),
      orbit.target.z + orbit.radius * sinPhi * Math.cos(orbit.theta)
    );
    camera.lookAt(orbit.target);
  }

  function pan(dx, dy) {
    const panX = new THREE.Vector3();
    const panY = new THREE.Vector3();
    camera.updateMatrixWorld();
    panX.setFromMatrixColumn(camera.matrix, 0);
    panY.setFromMatrixColumn(camera.matrix, 1);
    const scale = orbit.radius * 0.00115;
    orbit.target.addScaledVector(panX, -dx * scale);
    orbit.target.addScaledVector(panY, dy * scale);
    orbit.target.x = clamp(orbit.target.x, -6, 6);
    orbit.target.y = clamp(orbit.target.y, 0.2, 4.2);
    orbit.target.z = clamp(orbit.target.z, -6, 6);
  }

  el.addEventListener('pointerdown', function (e) {
    dragging = true;
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    velTheta = 0;
    velPhi = 0;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    if (e.buttons & 2 || e.shiftKey) pan(dx, dy);
    else {
      orbit.theta -= dx * 0.005;
      orbit.phi -= dy * 0.004;
      velTheta = -dx * 0.005;
      velPhi = -dy * 0.004;
    }
  });
  window.addEventListener('pointerup', function () { dragging = false; });
  el.addEventListener('wheel', function (e) {
    e.preventDefault();
    orbit.radius *= Math.exp(e.deltaY * 0.00115);
  }, { passive: false });
  el.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  }, { passive: false });
  el.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && pinchDist > 0) {
      e.preventDefault();
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      orbit.radius *= pinchDist / d;
      pinchDist = d;
    }
  }, { passive: false });

  function resize() {
    const w = window.innerWidth;
    const h = Math.max(1, window.innerHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    outlineMat.uniforms.uAspect.value = w / h;
    const dpr = renderer.getPixelRatio();
    const rw = Math.max(320, Math.min(1400, Math.floor(w * dpr * 0.65)));
    const rh = Math.max(240, Math.min(1400, Math.floor(h * dpr * 0.65)));
    if (wet.userData.setReflectionSize) wet.userData.setReflectionSize(rw, rh);
  }
  window.addEventListener('resize', resize);
  resize();
  applyOrbit();

  function smoothstep(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.033, clock.getDelta());
    const t = clock.elapsedTime;

    if (!dragging) {
      orbit.theta += velTheta;
      orbit.phi += velPhi;
      velTheta *= 0.9;
      velPhi *= 0.9;
    }
    applyOrbit();

    groundUniforms.uTime.value = t;
    groundUniforms.uCam.value.copy(camera.position);
    glassMat.uniforms.uTime.value = t;
    glassMat.uniforms.uCam.value.copy(camera.position);

    let dip = 1;
    if (!anim.flicker) anim.flicker = 0;
    if (anim.flicker > 0) anim.flicker -= dt;
    else if (Math.random() < dt * 0.22) anim.flicker = 0.06 + Math.random() * 0.14;
    if (anim.flicker > 0) dip = 0.28 + Math.random() * 0.35;
    const pulse = 0.94 + Math.sin(t * 6.5) * 0.035;
    flickers.forEach(function (f) {
      const g = f.gentle ? (0.94 + Math.sin(t * 9.0 + 1.2) * 0.06) : pulse * dip;
      f.mat.emissiveIntensity = f.base * g;
    });
    signLight.intensity = 18 * dip * pulse;

    const cycle = 10.5;
    const p = t % cycle;
    let open = 0;
    if (p < 0.55) open = smoothstep(p / 0.55);
    else if (p < 2.15) open = 1;
    else if (p < 2.7) open = 1 - smoothstep((p - 2.15) / 0.55);
    anim.doorL.position.x = anim.doorL0 - open * anim.doorSlide;
    anim.doorR.position.x = anim.doorR0 + open * anim.doorSlide;
    doorSpill.intensity = 1.5 + open * 8;
    if (anim.sensorLed) anim.sensorLed.material.color.set(open > 0.05 && open < 0.98 ? 0xe2b84a : 0x3dcc72);

    const sigT = t % 16;
    let sigState = 2;
    if (sigT > 7 && sigT <= 8.3) sigState = 1;
    else if (sigT > 8.3) sigState = 0;
    if (anim.signal) {
      anim.signal.lenses.forEach(function (lens, i) {
        lens.material.color.set(i === sigState ? anim.signal.colors[i] : 0x2a221c);
      });
      anim.signal.glow.material.color.set(anim.signal.colors[sigState]);
      anim.signal.glow.position.y = 2.24 - sigState * 0.16;
      anim.signal.light.color.set(anim.signal.colors[sigState]);
      anim.signal.light.intensity = 0.55;
      groundUniforms.uSignalColor.value.set(anim.signal.colors[sigState]);
    }

    if (anim.vending) {
      const vp = 0.45 + Math.sin(t * 1.7) * 0.08;
      anim.vending.forEach(function (m, i) {
        m.emissiveIntensity = vp + Math.sin(t * 2.2 + i) * 0.04;
      });
    }

    if (anim.clockH) {
      const now = new Date();
      const hh = now.getHours() % 12;
      const mm = now.getMinutes();
      const ss = now.getSeconds() + now.getMilliseconds() / 1000;
      anim.clockM.rotation.x = -(mm + ss / 60) / 60 * Math.PI * 2;
      anim.clockH.rotation.x = -(hh + mm / 60) / 12 * Math.PI * 2;
    }

    if (anim.steam && anim.oden) {
      anim.steam.forEach(function (s) {
        const u = (t * 0.22 + s.userData.seed) % 1;
        s.position.set(
          anim.oden.x + Math.sin(t + s.userData.seed * 8) * 0.08,
          anim.oden.y + u * 0.55,
          anim.oden.z + Math.cos(t * 0.8 + s.userData.seed) * 0.06
        );
        s.material.opacity = Math.sin(u * Math.PI) * 0.28;
        const sc = 0.12 + u * 0.28;
        s.scale.set(sc, sc, sc);
      });
    }

    for (let i = 0; i < rainCount; i++) {
      const r = rainState[i];
      r.y -= r.s * dt;
      r.x += 0.85 * dt;
      r.z += 0.25 * dt;
      if (r.y < 0.05 || insideStore(r.x, r.y, r.z)) {
        r.y = 7.5 + Math.random() * 2.5;
        r.x = (Math.random() - 0.5) * 19.2;
        r.z = (Math.random() - 0.5) * 19.2;
      }
      if (r.x > 9.8) r.x = -9.8;
      if (r.z > 9.8) r.z = -9.8;
      rayDummy.position.set(r.x, r.y, r.z);
      rayDummy.rotation.set(0.05, 0, -0.12);
      rayDummy.scale.set(1, r.len, 1);
      rayDummy.updateMatrix();
      rain.setMatrixAt(i, rayDummy.matrix);
    }
    rain.instanceMatrix.needsUpdate = true;

    dripAcc += dt;
    while (dripAcc > 0.11) {
      dripAcc -= 0.11;
      spawnDrip();
    }
    for (let i = 0; i < drips.length; i++) {
      const d = drips[i];
      if (!d.alive) {
        rayDummy.position.set(0, -8, 0);
        rayDummy.scale.set(0.001, 0.001, 0.001);
      } else {
        d.vy -= 9.5 * dt;
        d.y += d.vy * dt;
        if (d.y <= 0.06) {
          d.alive = false;
          spawnSplash(d.x, d.z);
          spawnRing(d.x, d.z, t);
          rayDummy.position.set(0, -8, 0);
          rayDummy.scale.set(0.001, 0.001, 0.001);
        } else {
          rayDummy.position.set(d.x, d.y, d.z);
          rayDummy.rotation.set(0, 0, 0);
          rayDummy.scale.set(1, 1.6, 1);
        }
      }
      rayDummy.updateMatrix();
      dripsMesh.setMatrixAt(i, rayDummy.matrix);
    }
    dripsMesh.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < splashes.length; i++) {
      const s = splashes[i];
      if (s.age > 0.85) continue;
      s.age += dt;
      const k = s.age / 0.85;
      s.mesh.scale.setScalar(0.4 + k * 2.4);
      s.mesh.material.opacity = (1 - k) * 0.5;
    }

    renderer.render(scene, camera);
  }

  animate();
})();
