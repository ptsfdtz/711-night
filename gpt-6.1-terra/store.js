export function createStore(THREE) {
  const g = new THREE.Group();
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.72, ...extra });
  const cream = mat(0xf3eee0), white = mat(0xf9f5e9), trim = mat(0x34454b), dark = mat(0x26323a);
  const red = mat(0xe2503d), orange = mat(0xf5a142), green = mat(0x23845c), yellow = mat(0xffdc80, { emissive: 0xd49c38, emissiveIntensity: .38 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xb9eced, transparent: true, opacity: .16, roughness: .12, metalness: .05, side: THREE.DoubleSide, depthWrite: false });
  const box = (w,h,d,x,y,z,m,parent=g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); parent.add(o); return o; };
  const planeText = (text, w, h, bg, fg, size=74, align='center') => {
    const c = document.createElement('canvas'); c.width=1024; c.height=256;
    const x = c.getContext('2d'); x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
    x.fillStyle=fg; x.textAlign=align; x.textBaseline='middle'; x.font=`700 ${size}px sans-serif`;
    x.fillText(text, align === 'left' ? 30 : 512, 132);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({map:t, side:THREE.DoubleSide}));
    return mesh;
  };
  const sign = (text,w,h,x,y,z,bg,fg,size=74) => { const p=planeText(text,w,h,bg,fg,size); p.position.set(x,y,z); g.add(p); return p; };
  // The shell is open behind the glazing so the miniature interior remains visible.
  box(5.8,.16,4.2,0,.08,-1.4,cream);
  box(5.8,3.35,.13,0,1.8,-3.43,cream);
  box(.13,3.35,4.2,-2.84,1.8,-1.4,cream);
  box(.13,.48,4.2,2.84,.4,-1.4,cream);
  box(.13,.38,4.2,2.84,3.18,-1.4,cream);
  box(5.96,.2,4.35,0,3.48,-1.4,trim);
  box(5.95,.08,4.35,0,3.59,-1.4,cream);
  box(5.9,.24,.1,0,.27,.72,cream);
  box(5.9,.21,.2,0,2.79,.72,white);
  // Corner glazing and slim metal mullions.
  box(2.93,2.27,.035,-1.42,1.55,.73,glass);
  box(1.15,2.27,.035,2.28,1.55,.73,glass);
  box(.035,2.25,3.8,2.78,1.56,-1.38,glass);
  [-2.86,-.03,1.69,2.86].forEach(x=>box(.055,2.46,.075,x,1.57,.75,trim));
  [-3.32,-1.45,.55].forEach(z=>box(.075,2.5,.05,2.82,1.56,z,trim));
  box(5.85,.055,.08,0,2.77,.76,trim);
  box(.08,.06,4.0,2.81,2.76,-1.4,trim);
  // Two sliding glass doors, with their rails and caution decals.
  const doors = new THREE.Group(); g.add(doors);
  const leftDoor = new THREE.Group(), rightDoor = new THREE.Group();
  leftDoor.position.x=.39; rightDoor.position.x=1.19; doors.add(leftDoor, rightDoor);
  for (const panel of [leftDoor,rightDoor]) {
    box(.78,2.25,.055,0,1.52,.77,glass,panel);
    box(.045,2.3,.075,-.39,1.52,.8,trim,panel);
    box(.045,2.3,.075,.39,1.52,.8,trim,panel);
    box(.19,.045,.018,0,1.36,.82,white,panel);
  }
  box(1.68,.12,.15,.8,2.73,.8,dark);
  box(1.68,.06,.15,.8,.35,.8,trim);
  g.userData.doors = { left: leftDoor, right: rightDoor };
  g.userData.update = (time) => {
    const phase = time % 15;
    const smooth = t => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
    const open = smooth((phase - 4) / 1.1) * (1 - smooth((phase - 7) / 1.1));
    leftDoor.position.x = .39 - open * .32;
    rightDoor.position.x = 1.19 + open * .32;
  };
  // Continuous striped fascia and luminous name panel.
  box(6.05,.68,.27,0,3.05,.78,white);
  box(6.06,.105,.285,0,3.33,.79,orange);
  box(6.06,.10,.29,0,3.22,.8,red);
  box(6.06,.11,.30,0,2.91,.81,green);
  box(2.04,.5,.035,0,3.08,.96,white);
  sign('NANAIRO',1.8,.24,0,3.15,.985,'#f7f4e8','#db513b',100);
  sign('ナナイロ  •  コンビニ',1.55,.11,0,2.99,.987,'#f7f4e8','#22825a',75);
  box(.32,.68,4.2,2.92,3.05,-1.4,white);
  box(.34,.10,4.2,2.94,3.30,-1.4,orange); box(.35,.10,4.2,2.95,3.19,-1.4,red); box(.36,.11,4.2,2.96,2.91,-1.4,green);
  // Interior tiled floor, with a softly lit ceiling.
  const tile = mat(0xe8dfca); box(5.55,.025,3.95,0,.18,-1.4,tile);
  const grout=mat(0xc7c4b7);
  for(let x=-2.5;x<=2.5;x+=.55) box(.012,.005,3.8,x,.197,-1.4,grout);
  for(let z=-3.2;z<=.4;z+=.55) box(5.45,.005,.012,0,.198,z,grout);
  for(const x of [-1.9,0,1.9]) { box(.75,.04,.22,x,3.35,-1.55,yellow); box(.75,.04,.22,x,3.35,-2.7,yellow); }
  const light = new THREE.PointLight(0xffdba0, 9, 7); light.position.set(0,2.8,-1.2); g.add(light);
  // Back wall refrigerator and colorful products.
  box(4.85,2.14,.48,-.12,1.3,-3.12,white);
  box(4.7,1.74,.04,-.12,1.32,-2.85,mat(0x8bb5b3));
  for (let i=0;i<5;i++) {
    const x=-2.1+i*.98;
    box(.035,1.82,.06,x-.45,1.3,-2.81,trim);
    for(let row=0;row<4;row++) {
      box(.86,.045,.18,x,.58+row*.38,-2.75,white);
      for(let j=0;j<5;j++) {
        const colors=[0xe66b56,0xf4c76a,0x7db493,0xe8e0bf,0x83a8c2];
        box(.105,.22,.10,x-.33+j*.16,.72+row*.38,-2.65,mat(colors[(i+j+row)%5]));
      }
    }
  }
  sign('DRINKS  •  お飲みもの',3.6,.18,-.15,2.48,-2.79,'#f4f1e5','#478578',70);
  // Low gondola shelves leave a clear sightline through the shopfront.
  const shelf = (x,z,rotation=0) => {
    const s=new THREE.Group(); s.position.set(x,.2,z); s.rotation.y=rotation; g.add(s);
    box(1.35,.12,.65,0,.07,0,white,s); box(1.35,1.35,.1,0,.72,0,cream,s);
    for(let r=0;r<3;r++) {
      box(1.35,.06,.58,0,.33+r*.38,.01,white,s);
      for(let j=0;j<6;j++) {
        const colors=[0xe7b25d,0xef7970,0x84b09a,0xefdca0,0x87a6bf,0xe7a3a3];
        box(.15,.22,.13,-.52+j*.205,.47+r*.38,.24,mat(colors[(j+r)%6]),s);
      }
    }
    return s;
  };
  shelf(-1.5,-1.65); shelf(.1,-1.8); shelf(1.65,-1.8);
  // Checkout area, coffee machine and a hot-food case.
  box(1.35,.82,.55,-1.82,.61,-.14,mat(0xe2c9a4));
  box(1.42,.09,.62,-1.82,1.04,-.14,white);
  box(.3,.32,.25,-2.15,1.25,-.14,dark); box(.24,.17,.03,-2.15,1.29,.0,mat(0x9cd4c4));
  box(.36,.32,.3,-1.45,1.25,-.14,glass); box(.37,.04,.3,-1.45,1.1,-.14,white);
  sign('おでん',.25,.10,-1.45,1.28,.025,'#f8e7b5','#b8533c',110);
  box(.55,.85,.48,1.95,.62,-.25,white); box(.4,.52,.12,1.95,1.07,.02,dark); box(.29,.19,.03,1.95,1.13,.09,mat(0xabbeb1));
  sign('COFFEE',.45,.1,1.95,1.34,.1,'#eeeeea','#57665c',100);
  // Posters and window stickers are positioned on the interior of the glass.
  sign('新発売',.44,.30,-2.25,1.95,.78,'#fff1bf','#d75846',120);
  sign('おにぎり',.45,.25,-1.72,1.95,.78,'#e4f0d6','#398164',100);
  sign('ATM',.31,.15,2.28,2.15,.79,'#e5f2e6','#d44f42',110);
  sign('OPEN  24h',.57,.18,2.25,1.87,.79,'#f5edc7','#398466',90);
  box(1.22,.025,.64,.8,.2,1.13,mat(0x455c58));
  sign('WELCOME',.8,.16,.8,.22,1.12,'#455c58','#d9e3cf',85).rotation.x=-Math.PI/2;
  return g;
}
