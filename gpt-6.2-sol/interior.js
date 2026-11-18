export function buildInterior(c) {
  const { THREE, scene, mat, glow, box, label, canvasMap, mesh } = c;
  const room = new THREE.Group();
  room.name = 'Inside Yoru Mart';
  scene.add(room);

  const bone = mat('#efe3c8');
  const porcelain = mat('#fff5dd', { roughness: 0.48 });
  const chrome = mat('#7a9591', { metalness: 0.35, roughness: 0.33 });
  const shadow = mat('#263947');
  const pine = mat('#394d51');
  const oak = mat('#bd7c56');
  const orange = mat('#d96246');
  const mint = mat('#3ea58d');
  const coldWhite = glow('#d3ffff', 1.7);
  const warmWhite = glow('#fff0c2', 1.95);
  const glass = new THREE.MeshBasicMaterial({
    color: '#c3f6f7', transparent: true, opacity: 0.08, depthWrite: false,
    side: THREE.DoubleSide,
  });
  const b = (w, h, d, x, y, z, material, outline = true) => (
    box(w, h, d, x, y, z, material, room, outline)
  );
  const jp = '"Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif';

  function lettering(w, h, x, y, z, draw, options = {}) {
    return label(w, h, x, y, z, draw, room, { resolution: 280, ...options });
  }

  function centerText(ctx, str, x, y, size, color, font = jp) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px ${font}`;
    ctx.fillText(str, x, y);
  }

  function fixture(w, x, z, tint = warmWhite) {
    b(w + 0.08, 0.09, 0.21, x, 3.17, z, pine);
    b(w, 0.038, 0.155, x, 3.116, z, tint, false);
  }

  for (const z of [-2.17, -0.63, 0.98]) {
    fixture(2.43, -1.63, z);
    fixture(2.43, 1.62, z);
  }
  for (const [x, y, z, power, tint] of [
    [-1.94, 2.99, 0.45, 11, '#ffd097'],
    [1.64, 3.00, 0.38, 10, '#ffdaa4'],
    [0.0, 2.91, -1.99, 6.5, '#fff1d7'],
  ]) {
    const light = new THREE.PointLight(tint, power, 6.4, 2);
    light.position.set(x, y, z);
    room.add(light);
  }

  lettering(6.93, 4.55, 0, 0.253, -0.61, (ctx, w, h) => {
    const tones = ['#d4c6aa', '#deceb3', '#d9cbb5', '#d7c6ad', '#cdd0bb'];
    const cols = 15;
    const rows = 10;
    const dx = w / cols;
    const dz = h / rows;
    ctx.fillStyle = '#969e8c';
    ctx.fillRect(0, 0, w, h);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        ctx.fillStyle = tones[(j * 17 + i * 7 + j * i) % tones.length];
        ctx.fillRect(i * dx + 1.2, j * dz + 1.2, dx - 2.4, dz - 2.4);
      }
    }
    ctx.fillStyle = '#648b79';
    ctx.fillRect(dx * 0.27, dz * 0.32, w - dx * 0.54, 7);
    ctx.fillRect(dx * 0.27, h - dz * 0.32, w - dx * 0.54, 7);
  }, { rotationX: -Math.PI / 2, lit: true, resolution: 157 });

  lettering(0.64, 0.57, 0.08, 0.257, 0.37, (ctx, w, h) => {
    ctx.fillStyle = '#477b71';
    ctx.beginPath();
    ctx.roundRect(w * .06, h * .06, w * .88, h * .88, h * .12);
    ctx.fill();
    ctx.strokeStyle = '#cfe9c9';
    ctx.lineWidth = h * .05;
    ctx.beginPath();
    ctx.moveTo(w * .37, h * .49);
    ctx.lineTo(w * .5, h * .32);
    ctx.lineTo(w * .63, h * .49);
    ctx.moveTo(w * .5, h * .32);
    ctx.lineTo(w * .5, h * .65);
    ctx.stroke();
    centerText(ctx, '入口', w / 2, h * .79, h * .13, '#f6eecc');
  }, { rotationX: -Math.PI / 2, transparent: true });

  const products = [
    ['緑茶', '#7b9f53', '#e4e3aa', 'leaf'], ['麦茶', '#975c3c', '#f3d592', 'leaf'],
    ['水', '#5fadc2', '#e4f6ee', 'wave'], ['珈琲', '#634546', '#f2dfb2', 'bean'],
    ['ソーダ', '#458c9c', '#f4fbdb', 'wave'], ['オレンジ', '#e18442', '#fff8db', 'fruit'],
    ['牛乳', '#d2ecdf', '#447bbe', 'wave'], ['いちご', '#d96c76', '#fff3dd', 'fruit'],
    ['カレー', '#ba6d58', '#fff2a6', 'beam'], ['お弁当', '#ecbc78', '#4b5352', 'bento'],
    ['海苔', '#477e61', '#ecf3cf', 'rice'], ['梅', '#a66077', '#fff3d6', 'rice'],
    ['鮭', '#d57753', '#f7e7ba', 'rice'], ['抹茶', '#87a26c', '#eef1d0', 'leaf'],
    ['チップス', '#da8d6c', '#fff6cf', 'beam'], ['クッキー', '#ac8e6d', '#fff1cb', 'bean'],
    ['ラムネ', '#74afae', '#e9f9e2', 'wave'], ['グミ', '#996f9e', '#fae2d2', 'fruit'],
    ['焼そば', '#dc7854', '#f9e5b3', 'beam'], ['ラーメン', '#cbab57', '#fffadd', 'wave'],
    ['スープ', '#62919b', '#fce8be', 'wave'], ['プリン', '#d2ac69', '#633c43', 'bean'],
    ['みかん', '#c9ad56', '#fff4e3', 'fruit'], ['アイス', '#7eabd3', '#eef7e3', 'wave'],
    ['夜のおやつ', '#9a665d', '#fed3a4', 'beam'],
  ];
  const atlas = canvasMap(640, 640, (ctx) => {
    products.forEach(([name, main, accent, mark], index) => {
      const x = (index % 5) * 128;
      const y = Math.floor(index / 5) * 128;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = main;
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = accent;
      ctx.fillRect(10, 10, 108, 10);
      ctx.fillRect(10, 108, 108, 10);
      centerText(ctx, name, 64, 37, name.length > 3 ? 20 : 27, accent);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 5;
      ctx.fillStyle = accent;
      ctx.beginPath();
      if (mark === 'leaf') {
        ctx.ellipse(63, 77, 11, 24, Math.PI * .29, 0, Math.PI * 2);
        ctx.fill();
      } else if (mark === 'wave') {
        ctx.moveTo(26, 86);
        ctx.quadraticCurveTo(48, 53, 70, 77);
        ctx.quadraticCurveTo(85, 91, 104, 63);
        ctx.stroke();
      } else if (mark === 'rice') {
        ctx.moveTo(40, 94);
        ctx.lineTo(64, 58);
        ctx.lineTo(88, 94);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = main;
        ctx.fillRect(58, 82, 12, 14);
      } else if (mark === 'fruit' || mark === 'bean') {
        ctx.ellipse(56, 77, 13, 20, Math.PI * .27, 0, Math.PI * 2);
        ctx.ellipse(79, 84, 10, 15, -Math.PI * .17, 0, Math.PI * 2);
        ctx.fill();
      } else {
        for (let i = 0; i < 3; i++) ctx.fillRect(30 + i * 23, 65 + i * 3, 18, 30 - i * 3);
      }
      ctx.restore();
    });
  });

  const triangular = new THREE.Shape();
  triangular.moveTo(-0.45, -0.5);
  triangular.quadraticCurveTo(-0.52, -0.49, -0.48, -0.39);
  triangular.lineTo(-0.09, 0.43);
  triangular.quadraticCurveTo(0, 0.58, 0.09, 0.43);
  triangular.lineTo(0.48, -0.39);
  triangular.quadraticCurveTo(0.52, -0.49, 0.45, -0.5);
  triangular.closePath();
  const triangleGeometry = new THREE.ExtrudeGeometry(triangular, { depth: 1, bevelEnabled: false });
  triangleGeometry.translate(0, 0, -0.5);
  const batches = {
    block: { geometry: new THREE.BoxGeometry(1, 1, 1), parts: [] },
    cylinder: { geometry: new THREE.CylinderGeometry(.5, .5, 1, 9), parts: [] },
    shoulder: { geometry: new THREE.CylinderGeometry(.32, .5, 1, 9), parts: [] },
    cup: { geometry: new THREE.CylinderGeometry(.5, .35, 1, 9), parts: [] },
    triangle: { geometry: triangleGeometry, parts: [] },
  };
  const labelPositions = [];
  const labelUvs = [];
  const labelIndex = [];

  function part(shape, x, y, z, w, h, d, color, angle = 0) {
    batches[shape].parts.push({ x, y, z, w, h, d, color, angle });
  }

  function printProduct(id, x, y, z, w, h, d, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const half = w / 2;
    const base = labelPositions.length / 3;
    const zOffset = d / 2 + 0.002;
    for (const [localX, localY] of [[-half, -h / 2], [half, -h / 2], [half, h / 2], [-half, h / 2]]) {
      labelPositions.push(x + c * localX + s * zOffset, y + localY, z - s * localX + c * zOffset);
    }
    const u0 = (id % 5 + 0.026) / 5;
    const v0 = 1 - (Math.floor(id / 5) + .974) / 5;
    const u1 = (id % 5 + .974) / 5;
    const v1 = 1 - (Math.floor(id / 5) + .026) / 5;
    labelUvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
    labelIndex.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  function stock(kind, id, x, y, z, size = 1, angle = 0) {
    const [, color, edge] = products[id];
    if (kind === 'bottle') {
      const r = .125 * size;
      part('cylinder', x, y + .099 * size, z, r, .198 * size, r, color, angle);
      part('shoulder', x, y + .221 * size, z, r, .051 * size, r, color, angle);
      part('cylinder', x, y + .259 * size, z, r * .67, .031 * size, r * .67, edge, angle);
      printProduct(id, x, y + .103 * size, z, r * .79, .105 * size, r, angle);
    } else if (kind === 'can' || kind === 'cup') {
      const r = .151 * size;
      const h = (kind === 'cup' ? .136 : .177) * size;
      part(kind === 'cup' ? 'cup' : 'cylinder', x, y + h / 2, z, r, h, r, color, angle);
      part('cylinder', x, y + h, z, r * 1.05, .021 * size, r * 1.05, edge, angle);
      printProduct(id, x, y + h * .50, z, r * .84, h * .89, r, angle);
    } else if (kind === 'rice') {
      part('triangle', x, y + .089 * size, z, .178 * size, .178 * size, .07 * size, '#f3dfb2', angle);
      printProduct(id, x, y + .072 * size, z, .098 * size, .075 * size, .07 * size, angle);
    } else {
      const [w, h, d] = kind === 'bento' ? [.247, .071, .19] : [.173, .225, .056];
      part('block', x, y + h / 2 * size, z, w * size, h * size, d * size, color, angle);
      printProduct(id, x, y + h / 2 * size, z, w * size * .94, h * size * .93, d * size, angle);
      if (kind === 'bento') {
        part('block', x, y + h * size, z, w * size, .016 * size, d * size, '#ffe1b0', angle);
        const offset = .070 * size;
        part('block', x - offset * Math.cos(angle), y + (h + .016) * size, z + offset * Math.sin(angle),
          .049 * size, .018 * size, d * .89 * size, '#8b9c59', angle);
      }
    }
  }

  function aisleSign(x, y, z, title, detail, theme, angle = 0) {
    lettering(1.1, .176, x, y, z, (ctx, w, h) => {
      ctx.fillStyle = theme;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f1e1af';
      ctx.fillRect(0, h * .89, w, h * .11);
      centerText(ctx, title, w * .32, h * .47, h * .64, '#fff6dd');
      centerText(ctx, detail, w * .75, h * .49, h * .30, '#fff6dd', 'sans-serif');
    }, { rotationY: angle });
  }

  const shelfTags = new Map();

  function priceStrip(w, x, y, z, count, angle = 0) {
    const key = `${w}/${count}`;
    if (!shelfTags.has(key)) {
      const map = canvasMap(w * 410, 19, (ctx, width, height) => {
        ctx.fillStyle = '#9bad9f';
        ctx.fillRect(0, 0, width, height);
        for (let i = 0; i < count; i++) {
          const step = width / count;
          ctx.fillStyle = i % 3 ? '#fff3d9' : '#f1cd85';
          ctx.fillRect((i + .20) * step, height * .12, step * .63, height * .72);
          centerText(ctx, `¥${[128, 178, 205, 148, 240][i % 5]}`, (i + .51) * step, height * .49, height * .63, '#556862');
        }
      });
      shelfTags.set(key, new THREE.MeshBasicMaterial({ map }));
    }
    mesh(new THREE.PlaneGeometry(w, .045), shelfTags.get(key), x, y, z, room).rotation.y = angle;
  }

  // Refrigerated drinks and dairy. The merchandise remains visible through the glass.
  for (let bay = 0; bay < 5; bay++) {
    const x = -1.72 + bay * 1.01;
    b(.993, 2.30, .086, x, 1.41, -2.754, shadow);
    b(.925, 2.10, .034, x, 1.42, -2.694, mat(bay === 4 ? '#728e8e' : '#527879'), false);
    b(.973, .139, .466, x, 2.443, -2.39, porcelain);
    b(.892, .026, .065, x, 2.359, -2.18, coldWhite, false);
    for (const side of [-1, 1]) {
      b(.036, 2.17, .63, x + side * .468, 1.40, -2.43, chrome);
      b(.017, 2.06, .022, x + side * .419, 1.41, -2.227, coldWhite, false);
    }
    const ids = [[0, 1, 2, 0, 13], [4, 5, 5, 16, 4], [2, 2, 6, 6, 2], [3, 3, 1, 18, 3], [6, 7, 21, 23, 7]][bay];
    for (let shelf = 0; shelf < 5; shelf++) {
      const h = .47 + .371 * shelf;
      b(.895, .048, .465, x, h - .024, -2.449, porcelain, false);
      priceStrip(.89, x, h - 0.025, -2.215, 5);
      for (let i = 0; i < 5; i++) {
        const slot = x + (i - 2) * .155;
        const id = ids[(i + Math.floor(shelf / 2)) % ids.length];
        const kind = id === 6 ? 'box' : id === 21 || id === 23 ? 'cup' : shelf === 1 || id === 3 ? 'can' : 'bottle';
        stock(kind, id, slot, h, -2.29, .84 + .08 * ((shelf + i) % 3));
        stock(kind, id, slot, h, -2.438, .77);
      }
    }
    b(.888, 1.985, .012, x, 1.45, -2.081, glass, false);
    b(.029, .341, .047, x + .379, 1.36, -2.056, chrome);
    b(.946, .156, .531, x, .331, -2.505, pine);
  }

  lettering(5.05, .297, .30, 2.642, -2.214, (ctx, w, h) => {
    ctx.fillStyle = '#bde9dc';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#569787';
    ctx.fillRect(0, 0, w, h * .12);
    ctx.fillRect(0, h * .89, w, h * .11);
    centerText(ctx, '冷たいお飲み物', w * .23, h * .52, h * .59, '#3f7675');
    centerText(ctx, 'FRESH DRINKS  /  MILK  /  COFFEE', w * .74, h * .52, h * .36, '#3f7675', 'sans-serif');
  });

  // Staff entrance tucked behind the cash desk.
  b(.808, 2.29, .078, -2.86, 1.395, -2.826, pine);
  b(.716, 2.20, .047, -2.86, 1.39, -2.764, mat('#79978d'));
  b(.268, .375, .022, -2.86, 2.085, -2.730, mat('#bfd1b5'));
  b(.040, .178, .055, -2.60, 1.279, -2.709, chrome);
  lettering(.41, .112, -2.86, 1.787, -2.724, (ctx, w, h) => {
    ctx.fillStyle = '#eddec6';
    ctx.fillRect(0, 0, w, h);
    centerText(ctx, 'STAFF ONLY', w / 2, h / 2, h * .57, '#465c52', 'sans-serif');
  });

  // Ready meals on the left, pantry products and sweets on the right.
  function gondola(x, z, width, rearPanel, theme, warm) {
    const depth = .69;
    b(width, .12, depth + .07, x, .312, z, pine);
    b(width, 1.23, .072, x, .926, z, rearPanel);
    b(width + .045, .075, .173, x, 1.563, z, porcelain);
    for (const side of [-1, 1]) {
      b(.068, 1.28, depth, x + side * (width / 2 - .075), .947, z, porcelain, false);
      const color = side === -1 ? '#86a595' : '#a2ad9c';
      b(.019, .734, .35, x + side * (width / 2 - .034), .918, z, mat(color), false);
      for (let row = 0; row < 4; row++) {
        const level = .395 + row * .288;
        const shelfZ = z + side * .208;
        b(width - .11, .043, .333, x, level - .023, shelfZ, porcelain);
        priceStrip(width - .15, x, level - .022, z + side * .38, 7, side > 0 ? 0 : Math.PI);
        for (let i = 0; i < 7; i++) {
          const slot = x + (i - 3) * (width - .29) / 6.35;
          const id = warm ? [[9, 9, 8, 9, 9, 8, 9], [10, 11, 12, 10, 12, 11, 10], [6, 7, 21, 7, 21, 6, 7], [10, 12, 12, 11, 10, 12, 10]][row][i]
            : [[18, 19, 20, 19, 18, 20, 19], [13, 14, 15, 16, 17, 22, 24], [8, 15, 16, 17, 22, 15, 8], [24, 15, 13, 14, 24, 17, 16]][row][i];
          const kind = warm ? ['bento', 'rice', 'cup', 'rice'][row] : row === 0 ? 'cup' : 'box';
          const size = kind === 'bento' ? .79 : .9 + .07 * ((row + i) % 3);
          const face = side > 0 ? 0 : Math.PI;
          stock(kind, id, slot, level, shelfZ + side * .083, size, face);
          stock(kind, id, slot + .011, level, shelfZ - side * .068, size * .93, face);
        }
      }
    }
    aisleSign(x, 1.589, z + .095, warm ? 'お弁当' : 'お菓子', warm ? 'DELI' : 'SNACKS', theme);
  }

  gondola(-1.02, -.662, 1.73, mat('#a3ac8e'), '#b26a4c', true);
  gondola(1.49, -.592, 1.78, mat('#81a996'), '#487d6d', false);

  // Cash wrap, with its oden warmer, coffee maker, checkout and small impulse rack.
  b(.88, .743, 2.06, -2.847, .619, -.125, oak);
  b(.93, .065, 2.16, -2.847, 1.024, -.125, porcelain);
  b(.872, .10, 2.055, -2.847, .306, -.125, shadow);
  for (let i = 0; i < 12; i++) {
    b(.015, .53, .011, -2.401, .664, -.963 + i * .152, shadow, false);
  }
  b(.02, .145, 2.074, -2.398, .888, -.125, mint, false);
  b(.02, .037, 2.074, -2.395, .977, -.125, orange, false);
  lettering(.61, .22, -2.381, .789, .21, (ctx, w, h) => {
    ctx.fillStyle = '#e9d2a9';
    ctx.fillRect(0, 0, w, h);
    centerText(ctx, 'ヨルマート', w / 2, h * .4, h * .47, '#485f54');
    centerText(ctx, 'YORU MART', w / 2, h * .78, h * .22, '#a56649', 'sans-serif');
  }, { rotationY: Math.PI / 2 });

  b(.44, .093, .35, -2.769, 1.105, .52, shadow);
  b(.131, .16, .125, -2.794, 1.199, .49, shadow);
  const register = b(.461, .271, .069, -2.817, 1.353, .49, shadow);
  register.rotation.y = Math.PI / 2;
  lettering(.392, .206, -2.777, 1.357, .49, (ctx, w, h) => {
    ctx.fillStyle = '#6ba89f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#dbebc8';
    ctx.fillRect(w * .06, h * .13, w * .49, h * .72);
    for (let i = 0; i < 4; i++) ctx.fillRect(w * .64, h * (.14 + .19 * i), w * .28, h * .1);
    centerText(ctx, '¥ 0', w * .30, h * .52, h * .44, '#365e57', 'sans-serif');
  }, { rotationY: Math.PI / 2 });
  b(.124, .069, .151, -2.523, 1.098, .79, pine);
  b(.084, .009, .094, -2.523, 1.138, .78, coldWhite, false);

  b(.418, .559, .344, -2.897, 1.342, -.676, shadow);
  b(.414, .07, .352, -2.898, 1.591, -.676, chrome);
  b(.026, .409, .257, -2.674, 1.345, -.676, chrome);
  b(.031, .238, .169, -2.654, 1.289, -.676, shadow, false);
  b(.052, .019, .14, -2.632, 1.194, -.676, chrome, false);
  b(.035, .053, .135, -2.636, 1.472, -.676, mat('#425e53'), false);
  b(.011, .025, .113, -2.615, 1.479, -.676, coldWhite, false);
  stock('cup', 3, -2.59, 1.205, -.676, .60, Math.PI / 2);
  for (let i = 0; i < 4; i++) stock('cup', 3, -2.98 + i * .047, 1.062, -.984, .28);

  b(.49, .131, .473, -2.778, 1.125, -.086, shadow);
  b(.473, .053, .472, -2.776, 1.203, -.086, chrome);
  const broth = mat('#bf7d48', { roughness: .34 });
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const x = -2.929 + .151 * i;
      const z = -.199 + j * .226;
      b(.137, .016, .204, x, 1.234, z, broth, false);
      for (let k = 0; k < 3; k++) {
        const food = mesh(new THREE.CylinderGeometry(.022 + .006 * i, .020, .025, 7),
          i === 1 ? porcelain : bone, x + (k % 2 ? .034 : -.018), 1.252, z + (k - 1) * .054, room);
        food.rotation.y = i * .44;
      }
    }
  }
  b(.491, .016, .477, -2.776, 1.352, -.086, glass, false);
  for (const x of [-2.999, -2.548]) b(.012, .14, .015, x, 1.285, -.306, chrome, false);
  for (const x of [-2.999, -2.548]) b(.012, .14, .015, x, 1.285, .134, chrome, false);
  lettering(.345, .117, -2.517, 1.12, -.086, (ctx, w, h) => {
    ctx.fillStyle = '#cc5d45';
    ctx.fillRect(0, 0, w, h);
    centerText(ctx, 'おでん', w / 2, h / 2, h * .73, '#fff0c2');
  }, { rotationY: Math.PI / 2 });

  // Frozen goods along the side window, with a split sliding glass lid.
  b(.56, .530, 1.52, 2.975, .526, -1.115, porcelain);
  b(.546, .082, 1.484, 2.975, .29, -1.115, pine);
  for (const x of [2.719, 3.231]) b(.037, .098, 1.488, x, .838, -1.115, chrome);
  for (const z of [-1.842, -.388]) b(.489, .098, .034, 2.975, .838, z, chrome);
  b(.493, .013, 1.432, 2.975, .892, -1.115, glass, false);
  b(.012, .033, 1.431, 2.974, .90, -1.115, shadow, false);
  for (const z of [-1.63, -.57]) b(.046, .028, .102, 2.982, .915, z, chrome, false);
  b(.485, .014, 1.424, 2.975, .798, -1.115, coldWhite, false);
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 2; j++) stock('bento', [23, 7, 16, 21][(i + j) % 4], 2.854 + .242 * j, .804, -1.687 + i * .19, .85, -Math.PI / 2);
  }
  aisleSign(3.258, .67, -1.113, 'アイス', 'ICE CREAM', '#4d8ca0', Math.PI / 2);

  // Magazines face the window and act as small blocks of illustrated color.
  b(1.22, .058, .235, 2.53, .306, 1.355, pine);
  b(1.14, .65, .047, 2.53, .639, 1.315, mint);
  b(1.13, .051, .151, 2.53, .431, 1.386, porcelain);
  b(1.13, .046, .140, 2.53, .669, 1.386, porcelain);
  b(1.13, .029, .038, 2.53, .477, 1.466, chrome);
  b(1.13, .029, .038, 2.53, .713, 1.461, chrome);
  const covers = [
    ['深夜散歩', '#6c88a2', '#e9c982'], ['秋の旅', '#b06654', '#f1dc95'],
    ['暮らし', '#747ba5', '#e4cad1'], ['食べる', '#6e9a75', '#f5dac4'],
    ['まち', '#c48d6e', '#fff4cf'], ['週末', '#457d8a', '#f1c5b7'],
  ];

  function cover(ctx, w, h, title, color, fill, index) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(w * .70, h * .53, w * .20, w * .20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * .07, h * .83);
    ctx.lineTo(w * .34, h * (.42 + .08 * (index % 2)));
    ctx.lineTo(w * .48, h * .66);
    ctx.lineTo(w * .63, h * .58);
    ctx.lineTo(w * .94, h * .84);
    ctx.fill();
    ctx.fillRect(w * .08, h * .89, w * .53, h * .033);
    centerText(ctx, title, w / 2, h * .19, w * (title.length === 4 ? .205 : .25), fill);
  }

  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const x = 2.53 + (i - 2) * .205;
      const y = .521 + row * .241;
      const [title, color, fill] = covers[(row * 2 + i) % covers.length];
      b(.181, .215, .032, x, y, 1.400, bone, false);
      lettering(.171, .197, x, y, 1.418, (ctx, w, h) => cover(ctx, w, h, title, color, fill, i));
    }
  }

  // Seasonal point-of-sale posters and a suspended checkout marker.
  b(.73, .405, .049, -2.65, 2.21, -.91, pine);
  for (const x of [-2.9, -2.4]) b(.014, .844, .014, x, 2.81, -.91, shadow, false);
  lettering(.671, .343, -2.65, 2.213, -.882, (ctx, w, h) => {
    ctx.fillStyle = '#e9ae73';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#63484b';
    ctx.fillRect(0, h * .78, w, h * .22);
    centerText(ctx, 'あったか おでん', w / 2, h * .43, h * .30, '#654645');
    centerText(ctx, 'YORU MART', w / 2, h * .881, h * .14, '#ffebc4', 'sans-serif');
  });
  b(.406, .261, .044, -2.99, 2.506, .35, pine);
  for (const x of [-3.13, -2.85]) b(.012, .555, .012, x, 2.889, .35, shadow, false);
  lettering(.371, .224, -2.99, 2.506, .376, (ctx, w, h) => {
    ctx.fillStyle = '#a5c4a3';
    ctx.fillRect(0, 0, w, h);
    centerText(ctx, 'お会計', w / 2, h * .4, h * .42, '#426153');
    centerText(ctx, 'CHECKOUT', w / 2, h * .77, h * .185, '#426153', 'sans-serif');
  });

  const packageMaterial = mat('#ffffff', { roughness: .68 });
  const placement = new THREE.Object3D();
  for (const { geometry, parts } of Object.values(batches)) {
    const display = new THREE.InstancedMesh(geometry, packageMaterial, parts.length);
    parts.forEach(({ x, y, z, w, h, d, color, angle }, index) => {
      placement.position.set(x, y, z);
      placement.scale.set(w, h, d);
      placement.rotation.y = angle;
      placement.updateMatrix();
      display.setMatrixAt(index, placement.matrix);
      display.setColorAt(index, new THREE.Color(color));
    });
    display.computeBoundingSphere();
    room.add(display);
  }
  const productLabels = new THREE.BufferGeometry();
  productLabels.setAttribute('position', new THREE.Float32BufferAttribute(labelPositions, 3));
  productLabels.setAttribute('uv', new THREE.Float32BufferAttribute(labelUvs, 2));
  productLabels.setIndex(labelIndex);
  productLabels.computeVertexNormals();
  mesh(productLabels, new THREE.MeshBasicMaterial({ map: atlas, color: '#f3eacb' }), 0, 0, 0, room);
}
