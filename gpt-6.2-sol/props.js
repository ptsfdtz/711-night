const TAU = Math.PI * 2;

const font = '"Yu Gothic", "Noto Sans CJK JP", system-ui, sans-serif';

function type(ctx, words, x, y, size, fill, weight = 700, align = 'left') {
  ctx.fillStyle = fill;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(words, x, y);
}

function pill(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function buildVending(c, group, palette) {
  const { box, mat, glow, label } = c;
  const { navy, rubber, ivory, mint } = palette;
  const coral = mat('#b75561', { roughness: .38 });
  const trim = mat('#4e8791', { roughness: .34, metalness: .16 });
  const back = mat('#3f5667', { roughness: .59 });
  const whiteLight = glow('#bff9e9', .44);
  const roseLight = glow('#f77779', .8);

  box(1.04, 1.91, .62, 0, 1.035, -.015, trim, group);
  box(1.055, .09, .625, 0, 2.014, -.016, mint, group);
  box(1.06, .12, .615, 0, .082, -.01, navy, group);
  box(.976, 1.81, .041, 0, 1.067, .305, ivory, group);
  box(.938, .137, .027, 0, 1.91, .332, coral, group);
  box(.938, .019, .018, 0, 1.841, .352, roseLight, group, false);
  box(.868, .987, .027, 0, 1.307, .337, navy, group);
  box(.849, .958, .016, 0, 1.305, .353, whiteLight, group);

  label(.841, .948, 0, 1.304, .363, (ctx, w, h) => {
    const frame = ctx.createLinearGradient(0, 0, w, h);
    frame.addColorStop(0, '#d3fff0');
    frame.addColorStop(.52, '#9fd9ce');
    frame.addColorStop(1, '#d5f0d4');
    ctx.fillStyle = frame;
    ctx.fillRect(0, 0, w, h);
    const colors = ['#5a9385', '#c75e69', '#639abc', '#e2ab60', '#81569d', '#377b76', '#c2714c'];
    const words = ['お茶', '桃', '水', '珈琲', 'ぶどう', 'ラムネ', '紅茶'];
    const pitch = h / 4;
    const margin = .034 * w;
    for (let row = 0; row < 4; row++) {
      const top = row * pitch;
      const shelfY = top + pitch * .77;
      const shade = ctx.createLinearGradient(0, top, 0, shelfY);
      shade.addColorStop(0, 'rgba(51,109,115,.50)');
      shade.addColorStop(.18, 'rgba(89,145,151,.1)');
      shade.addColorStop(.88, 'rgba(124,168,146,.08)');
      shade.addColorStop(1, 'rgba(38,84,91,.39)');
      ctx.fillStyle = shade;
      ctx.fillRect(0, top, w, pitch * .77);
      for (let col = 0; col < 8; col++) {
        const kind = (col + row * 3) % colors.length;
        const left = margin + col * w * .117;
        const pw = w * (.071 + .013 * ((col + row) % 2));
        const bottle = (row + col) % 3 !== 1;
        const ph = pitch * (bottle ? .6 : .46);
        const py = shelfY - ph - h * .004;
        pill(ctx, left + pw * .16, py + ph * .04, pw, ph, pw * .22, 'rgba(25,67,73,.26)');
        if (bottle) {
          pill(ctx, left + pw * .33, py - ph * .055, pw * .34, ph * .24, pw * .055, '#e0e9d0');
          pill(ctx, left + pw * .30, py - ph * .09, pw * .40, ph * .095, pw * .048, colors[kind]);
        }
        pill(ctx, left, py + ph * .12, pw, ph * .87, pw * .18, bottle ? '#cee2be' : '#d6dfcd');
        pill(ctx, left + pw * .035, py + ph * .36, pw * .93, ph * .46, pw * .082, colors[kind]);
        pill(ctx, left + pw * .095, py + ph * .23, pw * .10, ph * .64, pw * .052, 'rgba(255,255,234,.47)');
        type(ctx, words[kind], left + pw * .5, py + ph * .56, pw * (words[kind].length > 2 ? .22 : .30), '#fff7d9', 800, 'center');
        pill(ctx, left + pw * .2, shelfY + pitch * .045, pw * .66, pitch * .094, 2, '#eaf8e2');
        type(ctx, `${120 + 10 * ((col + row) % 6)}`, left + pw * .53, shelfY + pitch * .09, pitch * .073, '#37575c', 800, 'center');
      }
      ctx.fillStyle = '#506e76';
      ctx.fillRect(0, shelfY, w, pitch * .035);
      ctx.fillStyle = '#7fb7ae';
      ctx.fillRect(0, top + pitch * .955, w, pitch * .045);
    }
    ctx.fillStyle = 'rgba(245,255,244,.15)';
    ctx.beginPath();
    ctx.moveTo(w * .09, 0);
    ctx.lineTo(w * .27, 0);
    ctx.lineTo(w * .02, h * .87);
    ctx.lineTo(0, h * .82);
    ctx.closePath();
    ctx.fill();
  }, group, { resolution: 510 });

  label(.925, .125, 0, 1.913, .352, (ctx, w, h) => {
    pill(ctx, 0, 0, w, h, h * .12, '#b85065');
    type(ctx, '夜のドリンク', w * .067, h * .5, h * .53, '#ffe7cf', 800);
    type(ctx, 'YORU DRINKS', w * .94, h * .52, h * .30, '#ffece0', 900, 'right');
  }, group, { resolution: 450 });

  box(.392, .228, .021, .244, .648, .344, back, group);
  box(.176, .059, .013, .162, .714, .362, navy, group, false);
  label(.152, .031, .162, .715, .37, (ctx, w, h) => {
    type(ctx, '￥１５０', w * .46, h * .5, h * .82, '#80f7b2', 900, 'center');
  }, group, { transparent: true, resolution: 620 });
  box(.076, .108, .019, .369, .684, .362, rubber, group);
  box(.009, .072, .013, .369, .684, .372, mint, group, false);
  box(.106, .044, .023, .245, .625, .369, ivory, group);
  box(.07, .009, .018, .245, .623, .383, navy, group, false);
  box(.041, .04, .023, .382, .562, .365, roseLight, group, false);
  box(.096, .045, .026, .242, .549, .368, navy, group);
  box(.46, .174, .026, -.193, .377, .344, back, group);
  box(.387, .103, .02, -.193, .371, .365, rubber, group);
  box(.34, .014, .015, -.193, .411, .384, navy, group, false);
  box(.887, .025, .016, 0, .246, .347, coral, group, false);

  label(.321, .144, -.224, .64, .33, (ctx, w, h) => {
    type(ctx, 'つめた〜い', w * .05, h * .32, h * .35, '#24667c', 900);
    type(ctx, '24h / CASH & IC', w * .05, h * .76, h * .19, '#34455c', 750);
  }, group, { transparent: true, resolution: 440 });

  label(.57, 1.51, -.523, 1.093, -.006, (ctx, w, h) => {
    ctx.fillStyle = '#69949b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#254d66';
    ctx.beginPath();
    ctx.moveTo(0, h * .66);
    ctx.lineTo(w, h * .40);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    const cx = w * .5;
    const cy = h * .37;
    ctx.fillStyle = '#f5e2ad';
    ctx.beginPath();
    ctx.arc(cx, cy, w * .30, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#69949b';
    ctx.beginPath();
    ctx.arc(cx + w * .14, cy - w * .1, w * .25, 0, TAU);
    ctx.fill();
    type(ctx, '夜 の 一 杯', cx, h * .70, w * .14, '#f2e8ca', 900, 'center');
    type(ctx, 'YORU', cx, h * .81, w * .27, '#dbf5e2', 900, 'center');
    type(ctx, 'D R I N K S', cx, h * .89, w * .105, '#f7ada5', 800, 'center');
  }, group, { rotationY: -Math.PI / 2, resolution: 350 });

  for (let vent = 0; vent < 5; vent++) {
    box(.013, .013, .267, -.531, .39 + .025 * vent, -.013, back, group, false);
  }
}

function buildBicycle(c, group, palette) {
  const { THREE, box, mat, mesh, tube, glow } = c;
  const { navy, rubber, mint, ivory, chrome } = palette;
  const green = mat('#4f9c8b', { roughness: .4, metalness: .13 });
  const gold = mat('#c19956', { roughness: .44, metalness: .21 });
  const copper = glow('#ff776a', .37);
  const headlight = glow('#f8ddaa', .55);
  const front = .49;
  const back = -.52;
  const axleY = .311;

  for (const axleX of [back, front]) {
    mesh(new THREE.TorusGeometry(.279, .028, 9, 40), rubber, axleX, axleY, 0, group);
    mesh(new THREE.TorusGeometry(.256, .012, 7, 40), chrome, axleX, axleY, .012, group);
    mesh(new THREE.TorusGeometry(.259, .006, 6, 40), ivory, axleX, axleY, -.016, group);
    mesh(new THREE.TorusGeometry(.281, .003, 4, 40), navy, axleX, axleY, .029, group);
    const spokePositions = [];
    for (let spoke = 0; spoke < 16; spoke++) {
      const angle = spoke * TAU / 16;
      const anchor = angle + (spoke % 2 ? .70 : -.70);
      spokePositions.push(
        axleX + .033 * Math.cos(anchor), axleY + .033 * Math.sin(anchor), .017,
        axleX + .254 * Math.cos(angle), axleY + .254 * Math.sin(angle), .013,
      );
    }
    const spokeGeom = new THREE.BufferGeometry();
    spokeGeom.setAttribute('position', new THREE.Float32BufferAttribute(spokePositions, 3));
    group.add(new THREE.LineSegments(spokeGeom, new THREE.LineBasicMaterial({ color: '#98b5b2' })));
    const hub = mesh(new THREE.CylinderGeometry(.029, .029, .083, 12), chrome, axleX, axleY, 0, group);
    hub.rotation.x = Math.PI / 2;
  }

  for (const [x, angle, length] of [[back, .13, Math.PI * 1.12], [front, -.21, Math.PI * .83]]) {
    const fender = mesh(new THREE.TorusGeometry(.324, .014, 7, 31, length), mint, x, axleY, 0, group);
    fender.scale.z = 2.46;
    fender.rotation.z = angle;
    const edge = mesh(new THREE.TorusGeometry(.332, .004, 5, 31, length), green, x, axleY, .027, group);
    edge.rotation.z = angle;
  }

  tube([[front, axleY, .039], [.415, .505, .028], [.348, .684, .023], [.326, .77, 0]], .02, green, group);
  tube([[front, axleY, -.039], [.415, .505, -.028], [.348, .684, -.023], [.326, .77, 0]], .018, green, group);
  tube([[.344, .701, 0], [.227, .486, 0], [.141, .378, 0], [-.06, .297, 0], [-.216, .435, 0], [-.324, .69, 0]], .021, mint, group);
  tube([[.309, .634, 0], [.18, .435, 0], [.081, .35, 0], [-.076, .321, 0]], .011, green, group);
  for (const z of [-.037, .037]) {
    tube([[back, axleY, z], [-.325, .675, z * .45], [-.31, .705, 0]], .013, green, group);
    tube([[back, axleY, z], [-.07, .304, z]], .014, green, group);
  }
  tube([[-.325, .689, 0], [-.349, .772, 0]], .012, chrome, group);
  tube([[.325, .746, 0], [.273, .846, 0], [.276, .915, 0]], .012, chrome, group);
  tube([[.209, .937, -.219], [.274, .937, -.121], [.277, .915, 0], [.274, .937, .121], [.209, .937, .219]], .011, chrome, group);
  for (const side of [-1, 1]) {
    tube([[.229, .938, side * .161], [.199, .938, side * .235]], .015, rubber, group);
    tube([[.232, .93, side * .166], [.286, .925, side * .205], [.276, .92, side * .225]], .0045, chrome, group);
  }
  tube([[.275, .905, .179], [.372, .83, .139], [.38, .679, .075], [.425, .521, .032]], .0043, navy, group);

  const seat = mesh(new THREE.SphereGeometry(1, 14, 9), rubber, -.332, .788, 0, group);
  seat.scale.set(.092, .022, .058);
  const saddleNose = mesh(new THREE.SphereGeometry(1, 12, 8), rubber, -.275, .785, 0, group);
  saddleNose.scale.set(.049, .019, .029);
  mesh(new THREE.CylinderGeometry(.023, .023, .014, 12), gold, .253, .95, -.126, group);

  const guard = new THREE.Shape();
  guard.moveTo(-.515, .343);
  guard.quadraticCurveTo(-.25, .352, -.077, .372);
  guard.quadraticCurveTo(.013, .369, .008, .29);
  guard.quadraticCurveTo(-.007, .248, -.093, .246);
  guard.quadraticCurveTo(-.276, .266, -.519, .277);
  guard.quadraticCurveTo(-.556, .287, -.549, .315);
  guard.quadraticCurveTo(-.548, .332, -.515, .343);
  mesh(new THREE.ExtrudeGeometry(guard, {
    depth: .016, bevelEnabled: true, bevelSegments: 1, bevelSize: .004, bevelThickness: .004,
  }), mint, 0, 0, .038, group);
  mesh(new THREE.TorusGeometry(.053, .006, 6, 20), green, -.071, .307, .059, group);
  tube([[-.073, .303, .067], [-.012, .241, .093]], .008, chrome, group);
  tube([[-.073, .303, -.066], [-.133, .372, -.094]], .008, chrome, group);
  box(.062, .018, .068, -.009, .235, .105, rubber, group, false);
  box(.060, .015, .062, -.131, .374, -.105, rubber, group, false);
  box(.039, .008, .008, -.009, .236, .14, gold, group, false);
  tube([[-.199, .309, .034], [-.213, .201, .079], [-.249, .011, .103]], .007, navy, group);

  tube([[-.65, .657, .055], [-.673, .657, 0], [-.65, .657, -.055], [-.378, .657, -.055], [-.351, .657, 0], [-.378, .657, .055], [-.65, .657, .055]], .0078, chrome, group);
  for (const z of [-.052, .052]) {
    tube([[back, axleY, z], [-.572, .64, z]], .0078, green, group);
  }
  for (let slat = 0; slat < 5; slat++) {
    const x = -.627 + slat * .054;
    tube([[x, .659, -.052], [x, .659, .052]], .0053, chrome, group);
  }
  box(.025, .039, .06, -.679, .620, 0, copper, group);

  const basketRim = [[.379, .905, -.131], [.653, .905, -.153], [.682, .905, -.117], [.682, .905, .117], [.653, .905, .153], [.379, .905, .131], [.379, .905, -.131]];
  const basketBottom = [[.407, .749, -.092], [.619, .749, -.105], [.646, .749, -.081], [.646, .749, .081], [.619, .749, .105], [.407, .749, .092], [.407, .749, -.092]];
  const basketWires = [];
  for (let index = 0; index < basketRim.length - 1; index++) {
    const topA = new THREE.Vector3(...basketRim[index]);
    const topB = new THREE.Vector3(...basketRim[index + 1]);
    const bottomA = new THREE.Vector3(...basketBottom[index]);
    const bottomB = new THREE.Vector3(...basketBottom[index + 1]);
    tube([topA.toArray(), topB.toArray()], .0068, navy, group);
    tube([bottomA.toArray(), bottomB.toArray()], .0062, navy, group);
    const verticals = topA.distanceTo(topB) > .1 ? 6 : 2;
    for (let bar = 0; bar < verticals; bar++) {
      const f = bar / verticals;
      basketWires.push(...bottomA.clone().lerp(bottomB, f).toArray(), ...topA.clone().lerp(topB, f).toArray());
    }
    for (let rail = 1; rail <= 3; rail++) {
      basketWires.push(...bottomA.clone().lerp(topA, rail / 4).toArray(), ...bottomB.clone().lerp(topB, rail / 4).toArray());
    }
  }
  const wires = new THREE.BufferGeometry();
  wires.setAttribute('position', new THREE.Float32BufferAttribute(basketWires, 3));
  group.add(new THREE.LineSegments(wires, new THREE.LineBasicMaterial({ color: '#455760' })));
  box(.209, .012, .166, .521, .749, 0, navy, group, false);
  tube([[.394, .636, .022], [.531, .736, .072]], .008, chrome, group);
  const lamp = mesh(new THREE.CylinderGeometry(.031, .023, .041, 10), navy, .552, .683, -.011, group);
  lamp.rotation.z = -Math.PI / 2;
  const glass = mesh(new THREE.CylinderGeometry(.025, .025, .009, 10), headlight, .576, .683, -.011, group);
  glass.rotation.z = -Math.PI / 2;
}

function buildUmbrellas(c, group, palette) {
  const { THREE, box, mat, mesh, tube } = c;
  const { navy, rubber, chrome } = palette;
  const tray = mat('#273f4c', { roughness: .25, metalness: .21 });
  box(.458, .051, .319, 0, .046, 0, tray, group);
  box(.387, .016, .248, 0, .074, 0, rubber, group, false);
  for (const x of [-.209, .209]) {
    for (const z of [-.139, .139]) {
      tube([[x, .043, z], [x, .474, z]], .012, chrome, group);
    }
  }
  for (const z of [-.142, .142]) {
    tube([[-.21, .475, z], [.21, .475, z]], .014, chrome, group);
    tube([[-.209, .237, z], [.209, .237, z]], .009, navy, group);
  }
  for (const x of [-.21, -.07, .07, .21]) {
    tube([[x, .473, -.141], [x, .473, .141]], .011, chrome, group);
  }

  const umbrellas = [
    { x: -.137, z: -.066, height: .835, lean: -.085, yaw: .24, cloth: '#b9dcd8', tie: '#728e9e' },
    { x: -.014, z: .078, height: .760, lean: .105, yaw: -1.10, cloth: '#ad6c82', tie: '#f2bca0' },
    { x: .126, z: -.065, height: .895, lean: -.095, yaw: 1.37, cloth: '#d3a669', tie: '#ebcc99' },
    { x: .153, z: .083, height: .781, lean: .090, yaw: -.64, cloth: '#68959e', tie: '#abc8c0' },
  ];
  for (const { x, z, height, lean, yaw, cloth, tie } of umbrellas) {
    const umbrella = new THREE.Group();
    umbrella.position.set(x, .072, z);
    umbrella.rotation.set(lean * .39, yaw, lean);
    group.add(umbrella);
    const fabric = mat(cloth, { roughness: .54 });
    const strap = mat(tie, { roughness: .57 });
    const profile = [
      [.005, .052], [.017, height * .295], [.028, height * .57],
      [.041, height * .743], [.038, height * .78], [.010, height * .794],
    ];
    const folded = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 8);
    mesh(folded, fabric, 0, 0, 0, umbrella);
    mesh(new THREE.CylinderGeometry(.024, .023, .027, 8), strap, 0, height * .48, 0, umbrella);
    tube([[0, .016, 0], [0, height * .795, 0], [0, height * .874, 0]], .006, chrome, umbrella);
    tube([[0, height * .849, 0], [0, height * .923, 0], [.022, height * .965, 0], [.065, height * .963, 0], [.084, height * .924, 0], [.08, height * .897, 0]], .011, navy, umbrella);
  }
}

function buildRecycling(c, group, palette) {
  const { box, mat, label } = c;
  const { navy, rubber, ivory, chrome } = palette;
  const types = [
    { heading: 'もえるごみ', english: 'BURNABLE', dark: '#8d535d', light: '#cf8d81' },
    { heading: 'びん・かん', english: 'BOTTLES & CANS', dark: '#397f79', light: '#75a997' },
    { heading: 'ペットボトル', english: 'PET BOTTLES', dark: '#4f7190', light: '#8babc6' },
  ];
  box(1.021, .075, .446, 0, .055, .006, navy, group);
  for (const [index, kind] of types.entries()) {
    const x = (index - 1) * .333;
    box(.318, .553, .418, x, .348, 0, ivory, group);
    box(.318, .131, .427, x, .651, .008, mat(kind.light, { roughness: .63 }), group);
    box(.239, .068, .018, x, .65, .231, rubber, group);
    box(.247, .013, .033, x, .69, .239, chrome, group, false);
    box(.021, .015, .018, x + .105, .179, .217, chrome, group, false);
    label(.214, .131, x, .477, .211, (ctx, w, h) => {
      pill(ctx, 0, 0, w, h, h * .12, kind.dark);
      type(ctx, kind.heading, w * .51, h * .36, h * .277, '#fff4d9', 900, 'center');
      type(ctx, kind.english, w * .51, h * .72, h * .146, '#faf1db', 800, 'center');
    }, group, { resolution: 540 });
  }
}

function buildSandwichBoard(c, group, palette) {
  const { THREE, box, mat, label, tube } = c;
  const { navy, chrome } = palette;
  const frame = mat('#695360', { roughness: .56 });
  const front = new THREE.Group();
  front.position.set(0, .374, .101);
  front.rotation.x = -.213;
  group.add(front);
  box(.472, .638, .029, 0, 0, 0, frame, front);
  box(.428, .597, .016, 0, .006, .021, navy, front);
  for (const x of [-.214, .214]) {
    box(.029, .704, .037, x, -.017, .004, frame, front);
    tube([[x, .685, -.006], [x, .352, -.093], [x, .034, -.173]], .015, chrome, group);
  }
  tube([[-.218, .686, .012], [.218, .686, .012]], .013, chrome, group);
  label(.418, .590, 0, .006, .032, (ctx, w, h) => {
    ctx.fillStyle = '#f8d58f';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#b55e5a';
    ctx.fillRect(0, 0, w, h * .14);
    type(ctx, 'ヨルマート', w * .50, h * .072, h * .068, '#fff3cc', 900, 'center');
    type(ctx, 'おでん', w * .50, h * .285, h * .160, '#603840', 900, 'center');
    type(ctx, 'あたたかい夜ごはん。', w * .50, h * .422, h * .048, '#824c43', 800, 'center');
    pill(ctx, w * .142, h * .595, w * .72, h * .182, h * .064, '#a85654');
    pill(ctx, w * .084, h * .595, w * .832, h * .051, h * .022, '#774451');
    pill(ctx, w * .21, h * .568, w * .21, h * .068, h * .023, '#fff3c5');
    pill(ctx, w * .433, h * .555, w * .147, h * .089, h * .038, '#e4a56d');
    pill(ctx, w * .606, h * .58, w * .142, h * .061, h * .032, '#a2a265');
    ctx.fillStyle = '#9d664f';
    ctx.fillRect(0, h * .846, w, h * .154);
    type(ctx, 'HOT ODEN', w * .5, h * .914, h * .059, '#ffe5bd', 900, 'center');
  }, front, { resolution: 490 });
}

function buildCondenser(c, group, palette, scale) {
  const { THREE, box, mat, mesh, label } = c;
  const { navy, rubber, ivory, chrome } = palette;
  const fanColor = mat('#667382', { roughness: .6 });
  group.scale.setScalar(scale);
  box(.929, .621, .348, 0, .396, 0, ivory, group);
  box(.961, .040, .373, 0, .718, 0, chrome, group);
  box(.864, .018, .312, 0, .07, -.008, navy, group);
  for (const x of [-.324, .324]) {
    box(.089, .068, .415, x, .038, .016, navy, group);
  }
  const darkDisc = mesh(new THREE.CylinderGeometry(.239, .239, .03, 28), navy, -.137, .393, .184, group);
  darkDisc.rotation.x = Math.PI / 2;
  label(.437, .437, -.137, .393, .205, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2);
    for (let blade = 0; blade < 5; blade++) {
      ctx.rotate(TAU / 5);
      ctx.fillStyle = '#657283';
      ctx.beginPath();
      ctx.moveTo(w * .025, 0);
      ctx.quadraticCurveTo(w * .20, -h * .28, w * .30, -h * .37);
      ctx.quadraticCurveTo(w * .46, -h * .20, w * .432, -h * .12);
      ctx.quadraticCurveTo(w * .41, .035 * h, w * .025, h * .085);
      ctx.fill();
    }
  }, group, { transparent: true, resolution: 300 });
  for (const radius of [.054, .084, .115, .147, .179, .209, .237]) {
    mesh(new THREE.TorusGeometry(radius, .0038, 4, 28), chrome, -.137, .393, .217, group);
  }
  box(.008, .456, .012, -.137, .393, .22, fanColor, group, false);
  box(.456, .008, .012, -.137, .393, .22, fanColor, group, false);
  mesh(new THREE.CircleGeometry(.047, 14), rubber, -.137, .393, .231, group);
  label(.165, .059, .305, .579, .176, (ctx, w, h) => {
    pill(ctx, 0, 0, w, h, h * .12, '#517489');
    type(ctx, 'AC • 07', w * .5, h * .52, h * .60, '#f2efcd', 900, 'center');
  }, group, { resolution: 350 });
  for (let vent = 0; vent < 8; vent++) {
    box(.130, .012, .006, .316, .26 + vent * .029, .176, fanColor, group, false);
  }
}

function buildNoticeBoard(c, group, palette) {
  const { box, label } = c;
  const { navy, chrome } = palette;
  box(.92, .69, .062, 0, 0, 0, navy, group);
  box(.974, .043, .105, 0, .354, .014, chrome, group);
  label(.856, .616, 0, -.003, .032, (ctx, w, h) => {
    ctx.fillStyle = '#80918e';
    ctx.fillRect(0, 0, w, h);
    pill(ctx, w * .04, h * .06, w * .92, h * .18, h * .035, '#455f70');
    type(ctx, '町 内 の お 知 ら せ', w * .5, h * .145, h * .098, '#e8eed4', 900, 'center');
    const sheets = [
      { x: .086, y: .316, width: .25, height: .564, bg: '#ddd9b8', fg: '#82634d', text: '町内清掃', angle: -.054 },
      { x: .382, y: .30, width: .235, height: .497, bg: '#b1d6cb', fg: '#4c7474', text: '資源回収', angle: .043 },
      { x: .661, y: .338, width: .259, height: .582, bg: '#e1bca9', fg: '#92646a', text: '雨の日', angle: -.061 },
    ];
    for (const sheet of sheets) {
      ctx.save();
      ctx.translate(w * sheet.x, h * sheet.y);
      ctx.rotate(sheet.angle);
      ctx.fillStyle = sheet.bg;
      ctx.fillRect(0, 0, w * sheet.width, h * sheet.height);
      pill(ctx, w * sheet.width * .47, -h * .022, w * .026, h * .06, h * .013, '#69777f');
      type(ctx, sheet.text, w * sheet.width * .5, h * .11, h * .065, sheet.fg, 900, 'center');
      for (let rule = 0; rule < 5; rule++) {
        ctx.fillStyle = sheet.fg;
        ctx.fillRect(w * .03, h * (.186 + rule * .041), w * (sheet.width - .068 - (rule % 3) * .021), h * .008);
      }
      ctx.restore();
    }
  }, group, { resolution: 430 });
}

export function buildProps(c) {
  const { THREE, scene, box, mat, label, tube } = c;
  const palette = {
    navy: mat('#253747', { roughness: .64 }),
    rubber: mat('#202430', { roughness: .74 }),
    ivory: mat('#c1c7b7', { roughness: .52 }),
    mint: mat('#80b6a2', { roughness: .36, metalness: .14 }),
    chrome: mat('#9baaaa', { roughness: .37, metalness: .23 }),
  };

  function place(x, y, z, yaw = 0) {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = yaw;
    scene.add(group);
    return group;
  }

  buildVending(c, place(3.94, .174, -2.49, Math.PI / 2), palette);
  buildBicycle(c, place(2.72, .172, 2.84, -.10), palette);
  buildUmbrellas(c, place(1.19, .173, 2.09, -.03), palette);
  buildRecycling(c, place(-2.99, .174, 2.084, .015), palette);
  buildSandwichBoard(c, place(-1.42, .174, 2.67, .175), palette);
  buildNoticeBoard(c, place(-3.604, 1.54, -.51, -Math.PI / 2), palette);
  buildCondenser(c, place(2.75, .17, -3.28, Math.PI), palette, .90);
  buildCondenser(c, place(1.85, .17, -3.25, Math.PI), palette, .72);

  const matEdge = mat('#263d43', { roughness: .76 });
  box(1.42, .021, .64, .057, .185, 2.249, matEdge, scene, false);
  label(1.377, .597, .057, .197, 2.249, (ctx, w, h) => {
    pill(ctx, 0, 0, w, h, h * .08, '#455e5e');
    pill(ctx, w * .02, h * .043, w * .96, h * .915, h * .075, '#334d4b');
    for (let y = 7; y < h - 5; y += 5) {
      ctx.fillStyle = y % 2 ? '#3c5651' : '#344e4c';
      ctx.fillRect(w * .033, y, w * .934, 1);
    }
    type(ctx, 'いらっしゃいませ', w / 2, h * .42, h * .205, '#8fa89b', 800, 'center');
    type(ctx, 'Y O R U   M A R T', w / 2, h * .705, h * .119, '#809f94', 750, 'center');
  }, scene, { rotationX: -Math.PI / 2, resolution: 290 });

  const conduit = mat('#767887', { roughness: .55 });
  const fixture = mat('#5e6376', { roughness: .55 });
  tube([[3.565, .31, -2.98], [3.573, 1.41, -2.98], [3.572, 2.76, -2.98], [3.574, 3.06, -2.98]], .015, conduit, scene);
  tube([[2.92, .438, -3.26], [3.059, .445, -3.29], [3.138, .602, -3.28], [3.14, 1.752, -3.112], [3.139, 2.08, -3.106]], .018, conduit, scene);
  tube([[1.98, .421, -3.24], [2.135, .432, -3.23], [2.166, .69, -3.154], [2.163, 1.465, -3.114]], .014, conduit, scene);
  box(.23, .254, .082, 3.139, 2.091, -3.104, fixture, scene);
  box(.155, .203, .076, 2.164, 1.49, -3.101, fixture, scene);
}
