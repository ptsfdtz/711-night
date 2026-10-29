export function createStreet(THREE) {
  const group = new THREE.Group();
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.76, ...extra });
  const asphalt = mat(0x273946, { roughness: 0.35, metalness: 0.18 });
  const pavement = mat(0x74838a);
  const dark = mat(0x243340);
  const black = mat(0x17232c);
  const white = mat(0xe4e5d8);
  const steel = mat(0x9baeb0, { metalness: 0.45, roughness: 0.45 });
  const red = mat(0xd55c54);
  const glow = (color, intensity = 0.7) => mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.3 });
  const box = (x, y, z, w, h, d, material, parent = group) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (x, y, z, radius, height, material, parent = group, segments = 12) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const rod = (a, b, radius, material, parent = group) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, start.distanceTo(end), 8), material);
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    parent.add(mesh);
    return mesh;
  };
  const line = (points, material = black, radius = 0.025) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, radius, 6, false), material);
    group.add(mesh);
  };
  const label = (text, bg, fg, width = 512, height = 256, font = 'bold 74px sans-serif') => {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = fg; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    text.split('\n').forEach((s, i, lines) => ctx.fillText(s, width / 2, height / 2 + (i - (lines.length - 1) / 2) * 84));
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshBasicMaterial({ map: texture });
  };
  const signPlane = (x, y, z, w, h, material, rotation = 0) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(x, y, z); mesh.rotation.y = rotation; group.add(mesh); return mesh;
  };

  // A layered square plinth keeps the entire street within one miniature base.
  box(0, -0.31, 0, 12, 0.62, 12, mat(0x344951));
  box(0, -0.57, 0, 12.04, 0.12, 12.04, mat(0x20323b));
  box(0, -0.025, 0, 11.96, 0.05, 11.96, mat(0x465b61));

  // Road and raised sidewalk form the corner around the shop.
  box(0, -0.029, 2.85, 12, 0.07, 6.3, asphalt);
  box(4.55, -0.025, -2.85, 2.9, 0.06, 5.7, asphalt);
  box(-0.55, 0.055, 1.37, 9.9, 0.11, 1.45, pavement);
  box(-5.57, 0.055, -1.9, 0.86, 0.11, 5.1, pavement);
  box(-0.55, 0.12, 2.08, 9.9, 0.12, 0.13, mat(0xb4bcb8));
  box(4.42, 0.12, 1.28, 0.13, 0.12, 1.55, mat(0xb4bcb8));
  for (let x = -5.2; x < 4.3; x += 0.62) box(x, 0.113, 1.37, 0.016, 0.005, 1.37, mat(0x606f76));

  // Crosswalk on the foreground street and small parking bay in the alley.
  for (let x = -4.95; x <= -1.25; x += 0.75) box(x, 0.012, 4.64, 0.47, 0.012, 2.35, white);
  box(4.72, 0.013, -2.5, 0.07, 0.013, 2.5, white);
  box(5.45, 0.013, -1.28, 1.5, 0.013, 0.07, white);
  box(5.45, 0.013, -3.72, 1.5, 0.013, 0.07, white);
  box(2.45, 0.014, 4.85, 2.1, 0.012, 0.09, mat(0xd8c978));
  box(0.18, 0.014, 4.85, 1.15, 0.012, 0.09, mat(0xd8c978));

  // Soft colored streaks suggest reflections in the wet asphalt.
  const wet = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const reflections = [
    [-3.3, 3.05, 0.16, 1.35, 0x74b7c3, 0.24], [-3.12, 3.62, 0.08, 1.65, 0xf0c886, 0.16],
    [2.8, 3.22, 0.18, 1.5, 0xf9c577, 0.18], [3.05, 3.94, 0.08, 1.85, 0x76d4d3, 0.21],
    [4.95, 0.4, 0.08, 1.05, 0xffa7a0, 0.2], [-0.45, 3.35, 0.09, 0.9, 0xf8d7a5, 0.14]
  ];
  reflections.forEach(([x, z, w, d, c, o]) => box(x, 0.021, z, w, 0.004, d, wet(c, o)));

  // Roadside drain and manhole.
  box(1.9, 0.125, 2.01, 1.55, 0.025, 0.2, dark);
  for (let x = 1.2; x < 2.6; x += 0.105) box(x, 0.143, 2.01, 0.025, 0.008, 0.18, steel);
  const cover = cylinder(3.55, 0.018, 4.5, 0.36, 0.025, dark, group, 24);
  for (let x = -0.2; x <= 0.2; x += 0.1) box(3.55 + x, 0.035, 4.5, 0.018, 0.005, 0.48, steel);

  // Vending machine and a small refuse bin on the right of the shop.
  box(3.68, 1.17, -0.35, 1.03, 2.26, 0.76, mat(0xe9eee8));
  box(3.68, 2.13, 0.042, 0.94, 0.23, 0.035, red);
  signPlane(3.68, 2.13, 0.064, 0.85, 0.16, label('DRINKS', '#dd6156', '#fff4e7', 512, 128, 'bold 74px sans-serif'));
  box(3.58, 1.48, 0.045, 0.68, 1.05, 0.035, glow(0xc4eaf0, 0.42));
  const drinkColors = [0xe87d61, 0xecc870, 0x80b8c7, 0x9dcf99, 0xe9dcd1, 0xb4a8d2];
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    const x = 3.31 + col * 0.135, y = 1.15 + row * 0.28;
    box(x, y, 0.073, 0.085, 0.19, 0.045, mat(drinkColors[(row * 5 + col) % drinkColors.length]));
    box(x, y - 0.105, 0.1, 0.095, 0.025, 0.008, white);
  }
  box(4.08, 1.4, 0.06, 0.13, 0.58, 0.04, mat(0x7f999d));
  box(4.08, 1.48, 0.085, 0.08, 0.07, 0.012, glow(0xb4e7d4));
  box(3.67, 0.36, 0.06, 0.54, 0.25, 0.06, dark);
  box(4.28, 0.41, 0.38, 0.53, 0.72, 0.48, mat(0x879b9a));
  box(4.28, 0.78, 0.38, 0.57, 0.08, 0.51, dark);
  box(4.28, 0.79, 0.62, 0.24, 0.035, 0.02, black);

  // Bicycle, with thin frame tubes and spokes, parked by the left curb.
  const bike = new THREE.Group(); bike.position.set(-4.1, 0.14, 1.34); bike.rotation.y = -0.16; group.add(bike);
  const tire = mat(0x202a2c), rim = mat(0xb6c4bd), frame = mat(0x91b7ac);
  const wheel = x => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.035, 8, 24), tire); mesh.position.set(x, 0.48, 0); bike.add(mesh);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.012, 6, 24), rim); inner.position.set(x, 0.48, 0.002); bike.add(inner);
    for (let a = 0; a < Math.PI; a += Math.PI / 4) rod([x - Math.cos(a) * 0.37, 0.48 - Math.sin(a) * 0.37, 0], [x + Math.cos(a) * 0.37, 0.48 + Math.sin(a) * 0.37, 0], 0.008, rim, bike);
  };
  wheel(-0.68); wheel(0.68);
  rod([-0.68, 0.48, 0], [-0.2, 0.99, 0], 0.027, frame, bike);
  rod([-0.2, 0.99, 0], [0.15, 0.48, 0], 0.027, frame, bike);
  rod([0.15, 0.48, 0], [-0.68, 0.48, 0], 0.027, frame, bike);
  rod([-0.2, 0.99, 0], [0.45, 0.96, 0], 0.027, frame, bike);
  rod([0.45, 0.96, 0], [0.15, 0.48, 0], 0.027, frame, bike);
  rod([0.45, 0.96, 0], [0.68, 0.48, 0], 0.027, frame, bike);
  rod([-0.2, 0.99, 0], [-0.25, 1.19, 0], 0.025, dark, bike);
  box(-0.28, 1.2, 0, 0.27, 0.065, 0.12, dark, bike);
  rod([0.45, 0.96, 0], [0.48, 1.25, 0], 0.022, steel, bike);
  rod([0.48, 1.25, 0], [0.61, 1.29, 0], 0.022, steel, bike);
  box(0.7, 1.07, 0, 0.4, 0.3, 0.3, mat(0x63777a), bike);
  box(0.7, 1.22, 0, 0.42, 0.035, 0.32, steel, bike);

  // Street lamp casts a warm pool across the pavement.
  cylinder(-5.25, 1.8, 0.35, 0.075, 3.6, dark);
  cylinder(-5.25, 0.18, 0.35, 0.16, 0.3, dark);
  rod([-5.25, 3.55, 0.35], [-4.9, 3.87, 0.35], 0.06, dark);
  box(-4.76, 3.83, 0.35, 0.47, 0.12, 0.34, dark);
  box(-4.76, 3.75, 0.35, 0.36, 0.045, 0.25, glow(0xffd99c, 1.5));
  const lamp = new THREE.PointLight(0xffc98a, 1.8, 6, 2); lamp.position.set(-4.76, 3.68, 0.35); group.add(lamp);

  // Utility poles and gently sagging overhead cables behind the shop.
  for (const x of [-5.45, 5.4]) {
    cylinder(x, 2.65, -5.2, 0.09, 5.3, mat(0x5f6970));
    box(x, 4.75, -5.2, 0.95, 0.1, 0.12, dark);
    for (let dx = -0.35; dx <= 0.36; dx += 0.35) cylinder(x + dx, 4.84, -5.2, 0.045, 0.12, steel);
  }
  for (let i = 0; i < 3; i++) line([[-5.45, 4.9 + i * 0.13, -5.2 + i * 0.11], [0, 4.48 + i * 0.13, -5.2 + i * 0.11], [5.4, 4.9 + i * 0.13, -5.2 + i * 0.11]], black, 0.016);
  box(-5.45, 3.8, -5.2, 0.52, 0.62, 0.42, mat(0x89928c));

  // Low street guardrail, with an opening at the crossing.
  for (const x of [0.7, 2.05, 3.4]) cylinder(x, 0.4, 2.05, 0.035, 0.65, steel);
  rod([0.7, 0.7, 2.05], [3.4, 0.7, 2.05], 0.035, steel);
  rod([0.7, 0.31, 2.05], [3.4, 0.31, 2.05], 0.025, steel);

  // Direction sign and a subtly illuminated traffic signal at the corner.
  cylinder(5.23, 1.45, 1.45, 0.055, 2.9, dark);
  box(5.23, 2.35, 1.44, 0.95, 0.45, 0.12, mat(0x376e91));
  signPlane(5.23, 2.35, 1.512, 0.84, 0.35, label('みどり通り', '#386f91', '#f5f2db', 512, 200, 'bold 66px sans-serif'));
  box(5.23, 3.0, 1.45, 0.78, 0.28, 0.18, dark);
  const signalColors = [0xe47e66, 0xe9c76d, 0x73d5b1];
  const signals = [];
  signalColors.forEach((c, i) => {
    const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.073, 16), glow(c, i === 2 ? 1.5 : 0.15));
    bulb.position.set(4.99 + i * 0.24, 3.0, 1.548); group.add(bulb); signals.push(bulb);
  });
  group.userData.trafficSignals = signals;

  // An air conditioner, small notice board, and umbrella stand add domestic scale.
  box(3.45, 0.52, -2.65, 0.62, 0.75, 0.86, mat(0xb5c2bc));
  box(3.78, 0.52, -2.65, 0.025, 0.52, 0.62, dark);
  for (let z = -2.9; z <= -2.4; z += 0.09) box(3.8, 0.52, z, 0.012, 0.49, 0.018, steel);
  box(-4.95, 1.68, -2.3, 0.15, 1.38, 1.1, mat(0x687d7a));
  box(-4.86, 1.68, -2.3, 0.04, 1.18, 0.94, mat(0xd8dfd2));
  signPlane(-4.83, 1.8, -2.3, 0.66, 0.7, label('お知らせ\n町内だより', '#f1eadd', '#64867e', 512, 512, 'bold 65px sans-serif'), Math.PI / 2);
  box(-3.26, 0.27, 0.84, 0.55, 0.5, 0.36, mat(0x758d8c));
  for (let i = 0; i < 3; i++) {
    const x = -3.43 + i * 0.16;
    rod([x, 0.25, 0.84], [x + 0.06, 1.18 + (i % 2) * 0.14, 0.84], 0.025, i === 1 ? red : dark);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.23, 8), mat([0x9bb8bc, 0xd88981, 0xcedbd2][i]));
    top.position.set(x + 0.06, 1.16 + (i % 2) * 0.14, 0.84); top.rotation.z = Math.PI; group.add(top);
  }
  return group;
}
