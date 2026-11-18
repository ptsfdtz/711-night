export function buildStore(c) {
  const { THREE, scene, box, mat, glow, mesh, label, line, tube } = c;
  const cement = mat('#8492a0');
  const pale = mat('#b8c2c4');
  const charcoal = mat('#2c424d', { metalness: 0.18 });
  const mullion = mat('#a8b8b5', { metalness: 0.25 });
  const rubber = mat('#233641');
  const roof = mat('#435663', { roughness: 0.9 });
  const flashing = mat('#637a83', { metalness: 0.22 });
  const enamel = mat('#aebdbd');
  const green = glow('#168e68', 1.05);
  const orange = glow('#ff9b48', 1.12);
  const red = glow('#ef665d', 0.85);
  const white = glow('#ffefd2', 1.26);
  const pane = mat('#9bd9e8', { transparent: true, opacity: 0.065, depthWrite: false, roughness: 0.25, metalness: 0.18, side: THREE.DoubleSide });
  const reflection = new THREE.MeshBasicMaterial({ color: '#c1edfd', opacity: 0.08, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const runnels = [];

  box(7.18, .25, 4.82, 0, .125, -.61, cement);
  for (const x of [-2.215, 2.215]) box(2.72, .2, .13, x, .37, 1.75, cement);
  box(.13, .2, 4.77, 3.53, .37, -.63, cement);
  for (const x of [-2.23, 2.23]) box(2.77, .045, .045, x, .462, 1.823, charcoal);
  box(.045, .045, 4.77, 3.61, .462, -.61, charcoal);

  // Opaque return walls and gently shadowed horizontal siding.
  box(.18, 3.18, 4.77, -3.53, 1.82, -.61, cement);
  box(7.15, 3.18, .18, 0, 1.82, -2.94, cement);
  box(.18, 3.18, .79, 3.53, 1.82, -2.575, cement);
  for (let y = .55; y < 3.15; y += .26) {
    box(.014, .01, 4.78, -3.628, y, -.61, flashing, scene, false);
    box(7.13, .01, .014, 0, y, -3.037, flashing, scene, false);
    box(.014, .01, .79, 3.629, y, -2.575, flashing, scene, false);
  }
  box(.1, 1.95, .93, -3.632, 1.28, -2.08, charcoal);
  box(.105, 1.84, .81, -3.642, 1.28, -2.08, flashing);
  box(.05, .055, .18, -3.705, 1.2, -1.78, rubber);

  function glass(w, h, x, y, z, angle, parent = scene) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = angle;
    parent.add(group);
    const glazing = mesh(new THREE.PlaneGeometry(w, h), pane, 0, 0, 0, group);
    glazing.renderOrder = 2;
    const sheen = new THREE.BufferGeometry();
    sheen.setAttribute('position', new THREE.Float32BufferAttribute([
      -.48*w, -.12*h, .006, -.48*w, -.30*h, .006, .12*w, .49*h, .006,
      -.48*w, -.12*h, .006, .12*w, .49*h, .006, .30*w, .49*h, .006,
      -.48*w, -.37*h, .006, -.48*w, -.395*h, .006, .064*w, .34*h, .006,
      -.48*w, -.395*h, .006, .064*w, .34*h, .006, .088*w, .371*h, .006,
    ], 3));
    mesh(sheen, reflection, 0, 0, 0, group).renderOrder = 3;
    runnels.push({ group, width: w, height: h });
    return group;
  }

  const frontWindows = [[-2.79, 1.24], [-1.48, 1.23], [1.44, 1.26], [2.76, 1.29]];
  for (const [x, width] of frontWindows) glass(width, 2.38, x, 1.653, 1.805, 0);
  for (const x of [-3.49, -2.135, -.836, .804, 2.097, 3.48]) {
    const edge = Math.abs(x) > 3;
    box(edge ? .17 : .075, 2.51, edge ? .2 : .105, x, 1.68, 1.78, edge ? pale : mullion);
  }
  box(7.14, .069, .108, 0, 2.85, 1.78, mullion);
  box(7.13, .022, .026, 0, 2.804, 1.814, rubber, scene, false);
  for (const x of [-2.21, 2.21]) {
    box(2.71, .069, .108, x, .463, 1.78, mullion);
    box(2.71, .022, .026, x, .513, 1.814, rubber, scene, false);
  }
  for (const [z, width] of [[1.105, 1.085], [-.125, 1.29], [-1.49, 1.35]]) glass(width, 2.38, 3.584, 1.653, z, Math.PI / 2);
  for (const z of [-2.18, -.795, .55, 1.685]) box(.11, 2.51, .073, 3.552, 1.68, z, mullion);
  for (const y of [.463, 2.85]) box(.118, .064, 4.02, 3.548, y, -.235, mullion);
  for (const y of [.51, 2.805]) box(.023, .022, 4.02, 3.59, y, -.235, rubber, scene, false);

  // Two sliding leaves share an overhead track and recede behind the fixed glazing.
  box(1.69, .18, .18, -.016, 2.765, 1.794, charcoal);
  box(1.63, .08, .139, -.016, 2.816, 1.842, pale);
  box(1.59, .032, .149, -.016, .269, 1.829, mullion);
  box(.17, .055, .064, -.025, 2.73, 1.919, rubber);
  box(.033, .014, .012, -.055, 2.728, 1.954, glow('#75efa8', .68), scene, false);
  const doors = [];
  for (const sign of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.userData.dynamic = true;
    leaf.position.set(-.016 + sign * .391, 0, 1.76);
    scene.add(leaf);
    glass(.766, 2.37, 0, 1.51, .007, 0, leaf);
    for (const border of [-.385, .385]) box(.048, 2.42, .049, border, 1.51, 0, mullion, leaf);
    for (const y of [.315, 2.705]) box(.8, .061, .049, 0, y, 0, mullion, leaf);
    box(.115, .027, .041, -.26 * sign, 1.275, .028, rubber, leaf);
    label(.23, .114, .14 * sign, 1.477, .016, (ctx, w, h) => {
      ctx.fillStyle = '#ecf7dc'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#067859'; ctx.fillRect(w * .08, h * .17, w * .24, h * .66);
      ctx.fillStyle = '#153b3e'; ctx.font = `bold ${h * .40}px sans-serif`; ctx.textBaseline = 'middle';
      ctx.fillText('自動', w * .39, h * .52);
    }, leaf, { resolution: 280 });
    doors.push({ leaf, sign });
  }

  // Enamel canopy and a continuous three-colour fascia wrap around the corner.
  box(7.44, .30, 4.99, 0, 3.425, -.61, pale);
  box(7.55, .18, 5.14, 0, 3.6, -.61, roof);
  box(7.47, .065, 5.04, 0, 3.715, -.61, flashing);
  box(7.19, .065, 4.77, 0, 3.746, -.61, roof, scene, false);
  box(7.6, .16, 1.33, 0, 3.384, 2.243, enamel);
  box(1.31, .16, 4.86, 3.71, 3.384, .349, enamel);
  box(7.64, .61, .136, 0, 3.172, 2.887, enamel);
  box(.137, .61, 5.79, 4.297, 3.172, -.012, enamel);
  box(7.72, .061, .193, .03, 3.493, 2.903, charcoal);
  box(.191, .061, 5.87, 4.31, 3.493, -.02, charcoal);
  box(7.67, .055, .147, .025, 2.863, 2.891, charcoal);
  box(.148, .055, 5.82, 4.304, 2.863, -.013, charcoal);
  box(.12, .44, 1.35, -3.807, 3.18, 2.23, enamel);
  for (const [y, thickness, material] of [[3.412, .085, orange], [3.316, .062, green], [2.924, .066, green], [2.977, .027, red]]) {
    box(7.64, thickness, .016, .014, y, 2.96, material, scene, false);
    box(.016, thickness, 5.806, 4.37, y, -.016, material, scene, false);
  }
  box(7.64, .308, .019, .02, 3.143, 2.962, white, scene, false);
  box(.018, .308, 5.8, 4.371, 3.143, -.015, white, scene, false);

  function emblem(ctx, x, y, size) {
    ctx.fillStyle = '#235d59';
    ctx.beginPath(); ctx.roundRect(x, y, size, size, size * .17); ctx.fill();
    ctx.fillStyle = '#fff2b8';
    ctx.beginPath(); ctx.arc(x + size * .5, y + size * .51, size * .31, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#235d59';
    ctx.beginPath(); ctx.arc(x + size * .633, y + size * .399, size * .261, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f9ad5a';
    const starX = x + size * .679;
    const starY = y + size * .333;
    ctx.beginPath(); ctx.moveTo(starX, starY - size * .118); ctx.lineTo(starX + size * .085, starY);
    ctx.lineTo(starX, starY + size * .114); ctx.lineTo(starX - size * .082, starY); ctx.closePath(); ctx.fill();
  }

  function wordmark(ctx, w, h) {
    emblem(ctx, h * .03, h * .035, h * .9);
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#235653';
    ctx.font = `900 ${h * .66}px "Yu Gothic", Meiryo, sans-serif`;
    ctx.fillText('ヨルマート', h * 1.14, h * .45, w * .59);
    ctx.fillStyle = '#47756a';
    ctx.font = `800 ${h * .30}px sans-serif`;
    ctx.fillText('Y O R U   M A R T', w * .735, h * .59, w * .26);
  }
  label(3.02, .278, -.02, 3.146, 2.974, wordmark, scene, { transparent: true, resolution: 530 });
  label(2.52, .272, 4.382, 3.146, -.26, wordmark, scene, { transparent: true, rotationY: Math.PI / 2, resolution: 480 });
  label(.64, .22, 3.31, 3.146, 2.974, (ctx, w, h) => {
    ctx.fillStyle = '#d97a45'; ctx.font = `900 ${h * .79}px sans-serif`; ctx.textBaseline = 'middle';
    ctx.fillText('24h', w * .23, h * .54);
  }, scene, { transparent: true, resolution: 450 });
  const signLight = box(1.2, .036, .115, 1.39, 3.268, 2.61, glow('#ffecbb', 2.8), scene, false);
  for (const x of [-2.75, -1.39, .01, 2.76]) box(.93, .042, .14, x, 3.268, 2.61, glow('#ffefcc', 2.58), scene, false);
  for (const z of [-1.86, -.55, .76, 2.06]) box(.14, .042, .84, 4.06, 3.268, z, glow('#ffefcc', 2.5), scene, false);

  const porch = new THREE.PointLight('#ffcd94', 10, 5.4, 2);
  porch.position.set(.25, 2.78, 2.54);
  scene.add(porch);
  const flank = new THREE.PointLight('#9ad9d4', 4.8, 4, 2);
  flank.position.set(4.15, 2.79, .1);
  scene.add(flank);

  // Awning seams, overflow gutter, and downpipes.
  for (const x of [-3.46, -2.35, -1.18, 0, 1.18, 2.35, 3.49]) {
    box(.019, .015, 1.25, x, 3.471, 2.236, flashing, scene, false);
    box(.041, .039, .061, x, 2.854, 2.883, flashing, scene, false);
  }
  for (const z of [-2.49, -1.36, -.22, .91, 2.0]) box(1.26, .016, .02, 3.71, 3.475, z, flashing, scene, false);
  tube([[-3.65, 2.894, 2.74], [-3.66, 2.78, 2.47], [-3.66, 2.58, 2.28], [-3.66, .56, 2.04], [-3.67, .28, 2.1]], .04, flashing);
  tube([[4.16, 3.44, -2.8], [3.82, 3.37, -2.79], [3.7, 3.16, -2.78], [3.69, .39, -2.77], [3.75, .25, -2.73]], .039, flashing);

  // Roof membrane, rain seams, access hatch, and a compact rooftop compressor.
  box(7.29, .115, .105, 0, 3.78, -3.062, flashing);
  box(.108, .115, 4.88, -3.68, 3.78, -.60, flashing);
  box(.108, .115, 4.88, 3.68, 3.78, -.60, flashing);
  box(7.3, .071, .115, 0, 3.76, 1.858, flashing);
  for (let x = -3.45; x < 3.52; x += .89) box(.018, .012, 4.69, x, 3.785, -.61, flashing, scene, false);
  for (const z of [-2.72, -.45, 1.44]) box(7.22, .009, .022, 0, 3.785, z, charcoal, scene, false);
  box(1.48, .185, .99, 1.83, 3.875, -1.84, charcoal);
  box(1.36, .59, .81, 1.83, 4.219, -1.84, flashing);
  box(1.42, .047, .877, 1.83, 4.526, -1.84, pale);
  box(1.08, .378, .026, 1.79, 4.235, -1.422, rubber);
  for (let y = 4.085; y < 4.43; y += .048) box(1.05, .016, .033, 1.79, y, -1.396, flashing, scene, false);
  box(.76, .286, .79, -1.73, 3.91, -.85, charcoal);
  box(.84, .057, .86, -1.73, 4.074, -.85, flashing);
  box(.41, .035, .034, -1.74, 4.043, -.39, pale, scene, false);
  const vent = mesh(new THREE.CylinderGeometry(.13, .16, .24, 8), flashing, -.59, 3.89, -2.26);
  vent.rotation.y = Math.PI / 8;
  mesh(new THREE.CylinderGeometry(.19, .15, .053, 8), pale, -.59, 4.025, -2.26);
  tube([[1.36, 3.983, -2.3], [1.11, 3.889, -2.35], [.98, 3.816, -2.58], [.76, 3.814, -2.77]], .034, rubber);
  line([[-3.58, 3.841, 1.85], [3.58, 3.841, 1.85]], '#899aa2');

  return { doors, runnels, signLight, signPanel: white };
}
