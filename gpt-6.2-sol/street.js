export function buildStreet(c) {
  const { THREE, scene, box, mat, glow, mesh, line, tube, label, canvasMap } = c;
  const street = new THREE.Group();
  street.name = 'Corner streets, utilities, and garden wall';
  scene.add(street);

  let seed = 70519;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const curbTop = mat(0x858c9e, { roughness: 0.68 });
  const curbSide = mat(0x4c556e, { roughness: 0.8 });
  const concrete = mat(0x62687d, { roughness: 0.82 });
  const seam = mat(0x353e52);
  const drain = mat(0x1c283b, { roughness: 0.4, metalness: 0.47 });
  const grayMetal = mat(0x778c9b, { roughness: 0.57, metalness: 0.23 });
  const graphite = mat(0x273647, { roughness: 0.58, metalness: 0.2 });
  const porcelain = mat(0xa1a4a8);
  const streetPaint = mat(0xa6bdcf, {
    roughness: 0.43, emissive: 0x516d83, emissiveIntensity: 0.19,
  });
  const oldPaint = mat(0x647991, { roughness: 0.72 });
  const yellow = mat(0xb99a61, { roughness: 0.68 });
  const yellowDot = mat(0xd5b779, { roughness: 0.71 });
  const enamel = mat(0xa1b8bd, { roughness: 0.43, metalness: 0.12 });

  const sidewalkMap = canvasMap(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d9dce4';
    ctx.fillRect(0, 0, w, h);
    const tones = ['#d8dbe2', '#ccd1dc', '#dedce5', '#d3d7e0'];
    tones.forEach((tone, i) => {
      const x = (i % 2) * w / 2;
      const y = Math.floor(i / 2) * h / 2;
      ctx.fillStyle = tone;
      ctx.fillRect(x + 2, y + 2, w / 2 - 3, h / 2 - 3);
      ctx.fillStyle = 'rgba(98,117,138,0.27)';
      ctx.fillRect(x, y, w / 2, 2);
      ctx.fillRect(x, y, 2, h / 2);
      ctx.fillStyle = 'rgba(255,255,255,0.27)';
      ctx.fillRect(x + 2, y + 2, w / 2 - 3, 1);
      ctx.fillRect(x + 2, y + 2, 1, h / 2 - 3);
    });
    for (let i = 0; i < 170; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(240,244,253,0.36)' : 'rgba(93,107,130,0.15)';
      ctx.fillRect(random() * w, random() * h, 1 + random() * 2, 1);
    }
  });
  sidewalkMap.wrapS = sidewalkMap.wrapT = THREE.RepeatWrapping;
  sidewalkMap.repeat.set(0.94, 0.94);
  const sidewalkTop = mat(0x9699aa, { map: sidewalkMap, roughness: 0.68 });

  function deck(points, bottom, top, surface, edge = surface) {
    const shape = new THREE.Shape();
    points.forEach(([x, z], i) => {
      if (i === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: top - bottom, bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    return mesh(geometry, [surface, edge], 0, bottom, 0, street);
  }

  const solidSlabs = new Map();
  function slab(w, h, d, x, y, z, material, outline = false) {
    if (outline) {
      box(w, h, d, x, y, z, material, street);
      return;
    }
    if (!solidSlabs.has(material)) solidSlabs.set(material, []);
    solidSlabs.get(material).push(new THREE.Matrix4().makeScale(w, h, d).setPosition(x, y, z));
  }

  function addInstances(geometry, material, transforms) {
    const batch = new THREE.InstancedMesh(geometry, material, transforms.length);
    transforms.forEach((transform, i) => batch.setMatrixAt(i, transform));
    batch.receiveShadow = true;
    street.add(batch);
  }

  function cylinder(top, bottom, height, x, y, z, material, sides = 12) {
    return mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material, x, y, z, street);
  }

  const curbCurve = [];
  for (let i = 0; i <= 8; i++) {
    const angle = i * Math.PI / 16;
    curbCurve.push([4.12 + 0.63 * Math.sin(angle), 2.61 + 0.63 * Math.cos(angle)]);
  }
  deck([[-6.8, -6.8], [-6.8, 3.24], ...curbCurve, [4.75, -6.8]],
    0, 0.17, sidewalkTop, curbSide);

  const curbFace = [[-6.8, 3.24], ...curbCurve, [4.75, -6.8]];
  const innerFace = [[4.59, -6.8], ...Array.from(curbCurve).reverse().map(([x, z]) => [
    4.12 + (x - 4.12) * 0.75, 2.61 + (z - 2.61) * 0.75,
  ]), [-6.8, 3.08]];
  deck([...curbFace, ...innerFace], 0.115, 0.176, curbTop, curbSide);
  for (let x = -6.35; x < 4.14; x += 0.61) {
    slab(0.013, 0.003, 0.157, x, 0.178, 3.158, seam);
  }
  for (let z = -6.51; z < 2.64; z += 0.61) {
    slab(0.156, 0.003, 0.013, 4.67, 0.178, z, seam);
  }
  deck([[6.02, -4.19], [6.8, -3.58], [6.8, -6.8], [6.04, -6.8]],
    0, 0.12, curbTop, curbSide);

  for (let i = 0; i < 5; i++) {
    const z = 3.6 + i * 0.59;
    slab(2.48, 0.005, 0.292, 4.87, 0.016, z, streetPaint);
    slab(0.18 + 0.1 * i, 0.001, 0.01, 3.68 + 0.19 * i, 0.019, z + 0.15, oldPaint);
    slab(0.12, 0.001, 0.021, 5.9 - 0.23 * i, 0.019, z - 0.144, oldPaint);
  }
  slab(0.11, 0.004, 2.61, 6.3, 0.014, 4.79, oldPaint);
  slab(0.11, 0.004, 2.13, 3.44, 0.014, 5.01, oldPaint);
  slab(1.27, 0.005, 0.119, 5.47, 0.015, -2.38, streetPaint);
  slab(1.17, 0.005, 0.024, 5.47, 0.011, -2.52, oldPaint);
  slab(0.06, 0.005, 2.31, 5.98, 0.012, -5.48, oldPaint);
  slab(1.17, 0.004, 0.05, 4.256, 0.015, 6.49, oldPaint);
  slab(2.56, 0.004, 0.051, -2.71, 0.013, 5.37, oldPaint);
  slab(2.14, 0.004, 0.051, 0.7, 0.013, 5.37, oldPaint);

  for (const x of [-4.4, -1.95, 0.51, 2.96]) {
    slab(0.061, 0.005, 1.24, x, 0.013, 4.07, oldPaint);
  }
  for (const x of [-3.175, -0.725, 1.735]) {
    slab(2.39, 0.005, 0.061, x, 0.013, 4.66, oldPaint);
    slab(0.22, 0.066, 0.077, x - 0.54, 0.033, 3.64, concrete, true);
    slab(0.22, 0.066, 0.077, x + 0.54, 0.033, 3.64, concrete, true);
    slab(0.12, 0.014, 0.082, x - 0.54, 0.067, 3.64, yellow);
    slab(0.12, 0.014, 0.082, x + 0.54, 0.067, 3.64, yellow);
  }

  label(0.52, 1.57, 5.37, 0.019, -3.39, (ctx, w, h) => {
    ctx.fillStyle = '#b2c5d2';
    ctx.font = `bold ${Math.round(w * 0.77)}px 'Yu Gothic', 'Meiryo', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ['止', 'ま', 'れ'].forEach((character, i) => ctx.fillText(character, w / 2, h * (i + 0.57) / 3));
  }, street, { rotationX: -Math.PI / 2, transparent: true, lit: true });

  const tactileStuds = [];
  for (const [x, z, count] of [[3.69, 2.99, 5], [4.49, -2.23, 3]]) {
    for (let i = 0; i < count; i++) {
      const px = x + (z > 0 ? i * 0.171 : 0);
      const pz = z - (z > 0 ? 0 : i * 0.171);
      slab(0.166, 0.011, 0.166, px, 0.177, pz, yellow);
      for (let u = -1; u <= 1; u++) {
        for (let v = -1; v <= 1; v++) tactileStuds.push([px + u * 0.046, 0.184, pz + v * 0.046]);
      }
    }
  }
  addInstances(new THREE.CylinderGeometry(0.012, 0.016, 0.009, 8), yellowDot,
    tactileStuds.map(([x, y, z]) => new THREE.Matrix4().makeTranslation(x, y, z)));

  function grate(x, z, turned) {
    slab(turned ? 0.33 : 0.64, 0.022, turned ? 0.64 : 0.33, x, 0.013, z, grayMetal);
    slab(turned ? 0.284 : 0.594, 0.006, turned ? 0.594 : 0.284, x, 0.026, z, drain);
    for (let i = -5; i <= 5; i++) {
      const offset = i * 0.049;
      slab(turned ? 0.273 : 0.024, 0.012, turned ? 0.024 : 0.273,
        x + (turned ? 0 : offset), 0.029, z + (turned ? offset : 0), grayMetal);
    }
  }
  grate(-2.13, 3.406, false);
  grate(2.77, 3.402, false);
  grate(4.915, 0.956, true);
  grate(4.914, -4.66, true);

  function manhole(x, z, r) {
    cylinder(r, r, 0.015, x, 0.012, z, grayMetal, 28);
    cylinder(r * 0.92, r * 0.92, 0.013, x, 0.019, z, drain, 28);
    const ring = mesh(new THREE.RingGeometry(r * 0.79, r * 0.825, 36), grayMetal, x, 0.026, z, street);
    ring.rotation.x = -Math.PI / 2;
    for (let row = -3; row <= 3; row++) {
      for (let col = -2; col <= 2; col++) {
        const u = col * r * 0.24 + (row % 2) * 0.024;
        const v = row * r * 0.2;
        if (Math.hypot(u, v) < r * 0.75) slab(r * 0.14, 0.003, r * 0.057, x + u, 0.026, z + v, grayMetal);
      }
    }
  }
  manhole(-0.04, 5.84, 0.21);
  manhole(5.53, 0.62, 0.18);

  function guardrail(x, z, length, alongZ = false) {
    const point = (u, y) => [x + (alongZ ? 0 : u), y, z + (alongZ ? u : 0)];
    const half = length / 2;
    for (const u of [-half + 0.11, 0, half - 0.11]) {
      const [px, , pz] = point(u, 0);
      cylinder(0.025, 0.037, 0.42, px, 0.385, pz, enamel);
      cylinder(0.04, 0.045, 0.027, px, 0.191, pz, graphite);
    }
    tube([point(-half, 0.50), point(-half + 0.05, 0.63), point(-half + 0.15, 0.665),
      point(0, 0.665), point(half - 0.15, 0.665), point(half - 0.05, 0.63), point(half, 0.50)],
    0.028, enamel, street);
    tube([point(-half + 0.10, 0.418), point(0, 0.418), point(half - 0.10, 0.418)],
      0.019, enamel, street);
    for (const u of [-half + 0.25, half - 0.25]) {
      const [px, py, pz] = point(u, 0.666);
      slab(0.07, 0.049, 0.07, px, py, pz, yellow, true);
    }
  }
  guardrail(-5.79, 3.02, 1.52);
  guardrail(4.52, -4.65, 1.42, true);

  const gravel = mat(0x48585e);
  const soil = mat(0x334347);
  const foliage = [mat(0x335354), mat(0x476265), mat(0x396563), mat(0x56736d)];
  const pebble = mat(0x7c7b86);
  const bark = mat(0x4d444d);
  const blockMaterials = [mat(0x6b687b), mat(0x5e6073), mat(0x767486), mat(0x5d6175)];
  const crown = mat(0x898597);

  slab(1.06, 0.051, 4.72, -5.75, 0.193, -2.08, gravel, true);
  slab(0.82, 0.058, 4.54, -5.75, 0.201, -2.08, soil);
  slab(6.62, 0.051, 0.88, -2.86, 0.194, -5.93, gravel, true);
  slab(6.46, 0.054, 0.7, -2.86, 0.199, -5.93, soil);

  const leafPiles = foliage.map(() => []);
  function plant(x, z, size, y = 0.24) {
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + random() * 0.66;
      const r = size * (0.48 + random() * 0.36);
      const pile = leafPiles[Math.floor(random() * foliage.length)];
      pile.push(new THREE.Matrix4().makeRotationY(angle)
        .scale(new THREE.Vector3(r * 1.18, r * (0.92 + random() * 0.5), r * 0.93))
        .setPosition(x + Math.sin(angle) * size * 0.45, y + r * 0.53, z + Math.cos(angle) * size * 0.45));
    }
  }

  for (let i = 0; i < 12; i++) plant(-5.75 + (random() - 0.5) * 0.41, -4.31 + i * 0.4, random() * 0.11 + 0.1);
  for (let i = 0; i < 16; i++) plant(-5.89 + i * 0.4, -5.84 + (random() - 0.5) * 0.37, random() * 0.15 + 0.1);
  const leafShape = new THREE.IcosahedronGeometry(1, 0);
  leafPiles.forEach((pile, i) => addInstances(leafShape, foliage[i], pile));
  const rocks = Array.from({ length: 20 }, () => {
    const r = 0.037 + random() * 0.053;
    return new THREE.Matrix4().makeScale(r, r * 0.54, r)
      .setPosition(-5.39 - random() * 0.7, 0.244, 0.08 - random() * 4.4);
  });
  addInstances(new THREE.DodecahedronGeometry(1, 0), pebble, rocks);

  for (let i = 0; i < 11; i++) {
    const x = -6.19 + 0.62 * i;
    for (let row = 0; row < 3; row++) {
      slab(0.608, 0.189, 0.22, x + (row === 1 ? 0.052 : 0), 0.274 + row * 0.2, -6.39,
        blockMaterials[(i + row * 3) % 4]);
    }
  }
  slab(6.94, 0.085, 0.29, -3.084, 0.765, -6.39, crown, true);
  for (const x of [-6.39, -4.23, -1.75, 0.31]) {
    slab(0.255, 0.68, 0.31, x, 0.515, -6.39, concrete, true);
    slab(0.31, 0.073, 0.367, x, 0.88, -6.39, crown, true);
  }

  const slat = mat(0x424f62);
  for (const z of [-5.78, -4.02, -2.25, -0.5]) {
    slab(0.17, 0.88, 0.17, -6.43, 0.61, z, grayMetal, true);
    slab(0.19, 0.06, 0.19, -6.43, 1.07, z, graphite, true);
  }
  slab(0.081, 0.072, 5.29, -6.43, 0.908, -3.14, grayMetal, true);
  slab(0.08, 0.057, 5.29, -6.43, 0.36, -3.14, graphite, true);
  for (let i = 0; i < 34; i++) slab(0.063, 0.577, 0.086, -6.429, 0.638, -5.77 + i * 0.159, slat);

  tube([[-5.91, 0.23, -4.96], [-5.88, 0.99, -4.93], [-5.99, 1.60, -4.83],
    [-5.92, 2.42, -4.74]], 0.071, bark, street);
  tube([[-5.93, 1.45, -4.87], [-5.63, 1.82, -4.76], [-5.48, 2.14, -4.6]], 0.044, bark, street);
  tube([[-5.93, 1.68, -4.89], [-6.16, 1.97, -5.03], [-6.21, 2.29, -5.13]], 0.03, bark, street);
  const treeLeaves = [
    [-6.12, 2.04, -5.10, 0.38], [-5.57, 2.13, -4.57, 0.38], [-6.16, 2.38, -4.80, 0.42],
    [-5.82, 2.57, -4.89, 0.46], [-5.64, 2.23, -5.13, 0.35], [-5.43, 2.46, -4.85, 0.31],
    [-5.9, 2.76, -4.77, 0.27],
  ];
  treeLeaves.forEach(([x, y, z, r], i) => {
    const bunch = mesh(new THREE.IcosahedronGeometry(r, 1), foliage[i % foliage.length], x, y, z, street);
    bunch.scale.set(1.15, 0.79, 0.94);
    bunch.rotation.y = i * 1.25;
  });

  const pavers = mat(0x73798a);
  for (let i = 0; i < 5; i++) {
    slab(1.16, 0.028, 0.36, 2.93, 0.182, -3.55 - i * 0.473, pavers, true);
  }
  const serviceBox = mat(0x677b89, { roughness: 0.46, metalness: 0.2 });
  slab(0.67, 0.13, 0.36, -4.82, 0.228, -5.35, curbSide, true);
  slab(0.56, 0.65, 0.30, -4.82, 0.582, -5.35, serviceBox, true);
  slab(0.501, 0.577, 0.022, -4.82, 0.577, -5.192, grayMetal, true);
  for (let i = 0; i < 6; i++) slab(0.146, 0.011, 0.013, -4.775, 0.74 - i * 0.023, -5.177, graphite);
  slab(0.033, 0.1, 0.045, -4.65, 0.53, -5.168, drain, true);

  const cable = mat(0x131c2c, { roughness: 0.87 });
  const utilityGray = mat(0x626e82, { roughness: 0.86 });
  const foot = mat(0x3f4e60);

  function utilityPole(x, z, top, wiredBox) {
    cylinder(0.063, 0.137, top - 0.17, x, (top + 0.17) / 2, z, utilityGray);
    cylinder(0.174, 0.194, 0.123, x, 0.236, z, foot);
    cylinder(0.09, 0.13, 0.375, x, 0.47, z, graphite);
    for (let i = 0; i < 4; i++) cylinder(0.126 - i * 0.006, 0.127 - i * 0.006, 0.039,
      x, 0.363 + i * 0.078, z, yellow);
    const beamY = top - 0.35;
    slab(1.17, 0.051, 0.081, x, beamY, z, foot, true);
    slab(0.84, 0.045, 0.069, x + 0.09, beamY - 0.35, z + 0.07, graphite, true);
    tube([[x - 0.26, beamY, z], [x - 0.07, beamY - 0.22, z]], 0.014, grayMetal, street);
    tube([[x + 0.26, beamY, z], [x + 0.07, beamY - 0.22, z]], 0.014, grayMetal, street);
    const offsets = [-0.49, 0.19, 0.48];
    for (const delta of offsets) {
      cylinder(0.018, 0.018, 0.16, x + delta, beamY + 0.065, z, graphite, 8);
      for (let j = 0; j < 3; j++) cylinder(0.042, 0.032, 0.031,
        x + delta, beamY + 0.046 + j * 0.034, z, porcelain, 10);
    }
    if (wiredBox) {
      slab(0.46, 0.053, 0.29, x - 0.16, top - 1.28, z, graphite, true);
      cylinder(0.22, 0.204, 0.53, x - 0.27, top - 1.01, z, serviceBox);
      cylinder(0.237, 0.234, 0.055, x - 0.27, top - 0.733, z, grayMetal);
      cylinder(0.212, 0.226, 0.057, x - 0.27, top - 1.24, z, graphite);
      for (let j = 0; j < 3; j++) cylinder(0.029, 0.04, 0.042,
        x - 0.33, top - 0.69 + j * 0.039, z, porcelain, 10);
      tube([[x - 0.33, top - 0.61, z], [x - 0.34, top - 0.48, z + 0.14],
        [x - 0.09, top - 0.32, z + 0.19], [x + 0.08, top - 0.48, z + 0.07]], 0.013, cable, street);
      tube([[x - 0.32, top - 1.26, z], [x - 0.26, top - 1.52, z + 0.10],
        [x + 0.04, top - 1.46, z + 0.09], [x + 0.07, 1.46, z + 0.08]], 0.015, cable, street);
    }
    slab(0.116, 0.226, 0.022, x, 1.79, z + 0.12, graphite, true);
    label(0.09, 0.194, x, 1.787, z + 0.134, (ctx, w, h) => {
      ctx.fillStyle = '#aab8ac';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#3a5660';
      ctx.fillRect(0, 0, w, h * 0.18);
      ctx.font = `bold ${Math.round(w * 0.47)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('07', w / 2, h * 0.49);
      ctx.fillText('22', w / 2, h * 0.75);
    }, street, { lit: true, resolution: 420 });
    return { x, z, beamY, offsets };
  }

  const leftPole = utilityPole(-4.91, -3.4, 5.62, true);
  const rightPole = utilityPole(4.09, -5.36, 5.04, false);
  function suspendedWire(start, end, slack, radius) {
    const points = Array.from({ length: 13 }, (_, i) => {
      const u = i / 12;
      return [
        THREE.MathUtils.lerp(start[0], end[0], u),
        THREE.MathUtils.lerp(start[1], end[1], u) - slack * Math.sin(Math.PI * u),
        THREE.MathUtils.lerp(start[2], end[2], u),
      ];
    });
    tube(points, radius, cable, street);
  }
  leftPole.offsets.forEach((delta, i) => suspendedWire([
    leftPole.x + delta, leftPole.beamY + 0.136, leftPole.z + i * 0.10,
  ], [rightPole.x + delta, rightPole.beamY + 0.136, rightPole.z + i * 0.10], 0.41 + i * 0.102, 0.012));
  suspendedWire([leftPole.x - 0.22, leftPole.beamY - 0.24, leftPole.z],
    [rightPole.x - 0.24, rightPole.beamY - 0.24, rightPole.z], 0.7, 0.013);
  suspendedWire([leftPole.x + 0.12, leftPole.beamY - 0.37, leftPole.z + 0.16],
    [-3.31, 3.45, -2.88], 0.29, 0.014);

  const lampX = -4.83;
  const lampZ = 2.71;
  cylinder(0.09, 0.12, 0.342, lampX, 0.34, lampZ, graphite);
  cylinder(0.061, 0.075, 0.083, lampX, 0.538, lampZ, grayMetal);
  tube([[lampX, 0.54, lampZ], [lampX, 2.31, lampZ], [lampX, 3.37, lampZ],
    [lampX + 0.09, 3.83, lampZ + 0.13], [lampX + 0.31, 3.994, lampZ + 0.453],
    [lampX + 0.46, 3.978, lampZ + 0.688]], 0.034, graphite, street);
  const lampHead = mesh(new THREE.SphereGeometry(0.25, 14, 8), grayMetal,
    lampX + 0.47, 3.96, lampZ + 0.707, street);
  lampHead.scale.set(0.64, 0.235, 1.08);
  lampHead.rotation.y = 0.55;
  const diffuser = mesh(new THREE.SphereGeometry(0.232, 14, 8), glow(0xffe5b4, 2.3),
    lampX + 0.475, 3.929, lampZ + 0.719, street);
  diffuser.scale.set(0.58, 0.114, 1.01);
  diffuser.rotation.y = 0.55;
  const lampLight = new THREE.PointLight(0xffdfaa, 23, 6.5, 2);
  lampLight.position.set(lampX + 0.48, 3.75, lampZ + 0.72);
  street.add(lampLight);

  const signalX = 6.28;
  const signalZ = -4.67;
  cylinder(0.067, 0.093, 2.82, signalX, 1.53, signalZ, graphite);
  cylinder(0.127, 0.162, 0.10, signalX, 0.179, signalZ, curbSide);
  tube([[signalX, 2.72, signalZ], [6.16, 2.91, signalZ], [5.88, 2.95, signalZ],
    [5.61, 2.95, signalZ]], 0.035, graphite, street);
  slab(0.816, 0.273, 0.155, 5.51, 2.84, signalZ + 0.023, graphite, true);
  slab(0.845, 0.044, 0.208, 5.51, 2.983, signalZ + 0.052, grayMetal, true);
  const signal = [];
  const lensColors = [0xff605b, 0xffb250, 0x6ff3c0];
  lensColors.forEach((color, i) => {
    const x = 5.762 - i * 0.253;
    const socket = cylinder(0.102, 0.109, 0.077, x, 2.845, signalZ + 0.139, drain);
    socket.rotation.x = Math.PI / 2;
    const hood = mesh(new THREE.CylinderGeometry(0.11, 0.106, 0.176, 12, 1, true, -Math.PI / 2, Math.PI),
      graphite, x, 2.85, signalZ + 0.19, street);
    hood.rotation.x = -Math.PI / 2;
    const lens = mesh(new THREE.SphereGeometry(0.083, 14, 8), glow(color, i === 0 ? 1.4 : 0.065),
      x, 2.844, signalZ + 0.191, street);
    lens.scale.z = 0.39;
    signal.push(lens);
  });

  slab(0.59, 0.246, 0.046, signalX, 2.23, signalZ + 0.101, grayMetal, true);
  label(0.565, 0.218, signalX, 2.23, signalZ + 0.127, (ctx, w, h) => {
    ctx.fillStyle = '#354f79';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#a6c4d5';
    ctx.lineWidth = w * 0.021;
    ctx.strokeRect(w * 0.034, h * 0.073, w * 0.932, h * 0.854);
    ctx.fillStyle = '#e2ece9';
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(h * 0.47)}px 'Yu Gothic', 'Meiryo', sans-serif`;
    ctx.fillText('文月町', w * 0.5, h * 0.54);
    ctx.font = `bold ${Math.round(h * 0.18)}px sans-serif`;
    ctx.fillText('FUMIZUKI', w * 0.5, h * 0.79);
  }, street, { lit: true, resolution: 370 });

  const stopX = 5.99;
  const stopZ = -2.69;
  cylinder(0.029, 0.046, 1.45, stopX, 0.75, stopZ, graphite);
  label(0.47, 0.434, stopX, 1.61, stopZ + 0.01, (ctx, w, h) => {
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * 0.09);
    ctx.lineTo(w * 0.95, h * 0.09);
    ctx.lineTo(w * 0.5, h * 0.93);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.lineWidth = w * 0.061;
    ctx.strokeStyle = '#dfd9d3';
    ctx.fillStyle = '#b85550';
    ctx.fill();
    ctx.stroke();
    ctx.font = `bold ${Math.round(h * 0.2)}px 'Yu Gothic', 'Meiryo', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6ddd1';
    ctx.fillText('止まれ', w * 0.5, h * 0.355);
    ctx.font = `bold ${Math.round(h * 0.11)}px sans-serif`;
    ctx.fillText('STOP', w * 0.5, h * 0.51);
  }, street, { transparent: true, lit: true, resolution: 420 });

  const unitSlab = new THREE.BoxGeometry(1, 1, 1);
  for (const [material, transforms] of solidSlabs) addInstances(unitSlab, material, transforms);
  line([[-6.78, 0.173, 3.241], [-0.1, 0.173, 3.241], [4.12, 0.173, 3.241]], 0x454d64, street);
  return { signal };
}
