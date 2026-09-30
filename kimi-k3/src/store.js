// The convenience store: building shell, storefront, sign, awning,
// and a fully stocked interior visible through the glass.
import * as THREE from 'three';
import {
  toon, addOutline, canvasTex, box, cyl,
  aoBlob, glowSprite, flatStreak,
} from './materials.js';

const FLOOR = 0.20;       // interior floor height
const WALK_Y = 0.12;

// ---------- canvas art ----------
function signTex() {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#fdfdf6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff7a1a'; g.fillRect(0, 14, w, 22);
    g.fillStyle = '#ef4b4b'; g.fillRect(0, 36, w, 22);
    g.fillStyle = '#39b77f'; g.fillRect(0, 58, w, 22);
    g.fillStyle = '#22304a';
    g.font = 'bold 108px "Hiragino Kaku Gothic ProN", "MS Gothic", "Yu Gothic", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('ミニマート', w / 2 - 90, 165);
    g.fillStyle = '#ef4b4b';
    g.font = 'bold 64px "MS Gothic", sans-serif';
    g.fillText('24h', w - 130, 165);
    g.fillStyle = 'rgba(34,48,74,0.25)';
    g.fillRect(0, h - 12, w, 12);
  });
}

function bandTex() {
  return canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = '#fdfdf6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff7a1a'; g.fillRect(0, 8, w, 20);
    g.fillStyle = '#ef4b4b'; g.fillRect(0, 28, w, 20);
    g.fillStyle = '#39b77f'; g.fillRect(0, 48, w, 20);
    g.fillStyle = 'rgba(34,48,74,0.18)'; g.fillRect(0, h - 14, w, 14);
  });
}

function neonTex() {
  return canvasTex(128, 384, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#2a1030';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff7eb9';
    g.shadowColor = '#ff7eb9';
    g.shadowBlur = 18;
    g.font = 'bold 72px "MS Gothic", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('2', w / 2, 80);
    g.fillText('4', w / 2, 180);
    g.fillText('h', w / 2, 290);
    g.strokeStyle = '#ff9ccb';
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
  });
}

function posterTex(bg, accent, circle) {
  return canvasTex(256, 384, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = accent;
    g.beginPath(); g.arc(w * 0.5, h * 0.36, 70, 0, 7); g.fill();
    if (circle) {
      g.fillStyle = bg;
      g.beginPath(); g.arc(w * 0.62, h * 0.3, 34, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.fillRect(28, h * 0.62, w - 56, 16);
    g.fillRect(28, h * 0.62 + 30, w - 96, 10);
    g.fillRect(28, h * 0.62 + 52, w - 76, 10);
    g.fillStyle = accent;
    g.fillRect(28, h - 44, 90, 20);
  });
}

function tileTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#f4e9d6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ddcfb6'; g.lineWidth = 3;
    for (let i = 0; i <= 8; i++) {
      g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke();
    }
  }, { repeat: [3, 2] });
}

function arrowFloorTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(216,178,106,0.9)';
    g.beginPath();
    g.moveTo(64, 18); g.lineTo(104, 62); g.lineTo(78, 62);
    g.lineTo(78, 110); g.lineTo(50, 110); g.lineTo(50, 62); g.lineTo(24, 62);
    g.closePath(); g.fill();
  });
}

function glassStreakTex() {
  const t = canvasTex(256, 512, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 42; i++) {
      const x = rnd() * w, y0 = rnd() * h, len = 40 + rnd() * 130;
      g.strokeStyle = `rgba(200,225,255,${0.10 + rnd() * 0.22})`;
      g.lineWidth = 1 + rnd() * 2;
      g.beginPath();
      g.moveTo(x, y0);
      g.bezierCurveTo(x + 3, y0 + len * 0.3, x - 3, y0 + len * 0.6, x + 1, y0 + len);
      g.stroke();
      g.fillStyle = `rgba(210,230,255,${0.25 + rnd() * 0.3})`;
      g.beginPath(); g.arc(x + 1, y0 + len, 1.5 + rnd() * 1.6, 0, 7); g.fill();
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(205,228,255,${0.12 + rnd() * 0.25})`;
      g.beginPath(); g.arc(rnd() * w, rnd() * h, 0.8 + rnd() * 1.8, 0, 7); g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function coffeeTex() {
  return canvasTex(128, 160, (g, w, h) => {
    g.fillStyle = '#232833'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#10141d'; g.fillRect(12, 14, w - 24, 60);
    ['#ff6b6b', '#ffd43b', '#8ce99a', '#74c0fc'].forEach((c, i) => {
      g.fillStyle = c;
      g.beginPath(); g.arc(26 + i * 26, 100, 8, 0, 7); g.fill();
    });
    g.fillStyle = '#e8ecf4'; g.fillRect(30, 124, w - 60, 22);
  });
}

function hangSignTex(text) {
  return canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = '#fff6e2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ff7a1a'; g.fillRect(0, 0, w, 10);
    g.fillStyle = '#22304a';
    g.font = 'bold 44px "MS Gothic", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 6);
  });
}

// ---------- product instancing ----------
const UP = new THREE.Vector3(0, 1, 0);
function instancedBoxes(list, size, palette) {
  const geo = new THREE.BoxGeometry(...size);
  const mat = toon(0xffffff);
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(),
        s = new THREE.Vector3(), c = new THREE.Color(), v = new THREE.Vector3();
  list.forEach((p, i) => {
    q.setFromAxisAngle(UP, p[3] || 0);
    s.set(1, p[4] || 1, 1);
    m.compose(v.set(p[0], p[1], p[2]), q, s);
    im.setMatrixAt(i, m);
    c.setHex(palette[i % palette.length]);
    im.setColorAt(i, c);
  });
  return im;
}

const SNACK = [0xff6b6b, 0xffa94d, 0xffd43b, 0x8ce99a, 0x66d9e8, 0x74c0fc, 0xb197fc, 0xf783ac, 0xe9ecef, 0x96f2d7];
const DRINK = [0x74c0fc, 0x66d9e8, 0x8ce99a, 0xe9ecef, 0xffd43b, 0xffa94d, 0xa5d8ff, 0x96f2d7];

// ---------- main ----------
export function buildStore(scene) {
  const S = new THREE.Group();
  scene.add(S);
  const add = (m, x = 0, y = 0, z = 0, ry = 0) => {
    m.position.set(x, y, z); m.rotation.y = ry; S.add(m); return m;
  };

  const cream = toon(0xf0e9dc);
  const aluminum = toon(0x8a93a6);
  const mullionMat = toon(0x3a4152);

  // ===== foundation & interior floor =====
  const slab = box(12.6, 0.18, 8.6, toon(0x6b7386));
  add(slab, -5, 0.09, -3); addOutline(slab, 0.03);
  const floor = box(11.7, 0.02, 7.7, new THREE.MeshToonMaterial({ map: tileTex(), gradientMap: null }));
  add(floor, -5, FLOOR - 0.01, -3);
  const slabAO = aoBlob(13.4, 9.4, 0.35); slabAO.position.set(-5, WALK_Y + 0.005, -3); S.add(slabAO);

  // ===== walls =====
  const wallL = box(0.3, 3.2, 8, cream); add(wallL, -11, 1.78, -3); addOutline(wallL, 0.04);
  const wallR = box(0.3, 3.2, 8, cream); add(wallR, 1, 1.78, -3); addOutline(wallR, 0.04);
  const wallB = box(12, 3.2, 0.3, cream); add(wallB, -5, 1.78, -7); addOutline(wallB, 0.04);

  // ===== storefront (z = 1) =====
  const mullionXs = [-11, -9.2, -7.4, -5.6, -4.9, -3.1, -1.9, -0.7, 1];
  mullionXs.forEach((x) => {
    const m = box(0.14, 2.31, 0.16, mullionMat);
    add(m, x, 1.345, 1);
  });
  const header = box(12, 0.88, 0.3, cream); add(header, -5, 2.94, 1); addOutline(header, 0.03);
  const band = new THREE.Mesh(new THREE.PlaneGeometry(11.9, 0.8),
    new THREE.MeshBasicMaterial({ map: bandTex() }));
  add(band, -5, 2.94, 1.16);

  // glass panes
  const glassMat = new THREE.MeshBasicMaterial({
    color: 0x8fb4d6, transparent: true, opacity: 0.10, depthWrite: false,
  });
  const spans = [[-10.93, -9.27], [-9.13, -7.47], [-7.33, -5.67], [-5.53, -4.97],
                 [-3.03, -1.97], [-1.83, -0.77], [-0.63, 0.93]];
  spans.forEach(([a, b]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(b - a, 2.31), glassMat);
    p.position.set((a + b) / 2, 1.345, 1); p.renderOrder = 5; S.add(p);
  });

  // rain streak layers on the outside of the glass
  const streakTexA = glassStreakTex(); streakTexA.repeat.set(3, 1);
  const streakTexB = glassStreakTex(); streakTexB.repeat.set(4, 1.6);
  const streakMatA = new THREE.MeshBasicMaterial({
    map: streakTexA, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const streakMatB = new THREE.MeshBasicMaterial({
    map: streakTexB, transparent: true, opacity: 0.3,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const streakPlaneA = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 2.3), streakMatA);
  streakPlaneA.position.set(-5, 1.35, 1.07); streakPlaneA.renderOrder = 6; S.add(streakPlaneA);
  const streakPlaneB = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 2.3), streakMatB);
  streakPlaneB.position.set(-5, 1.35, 1.09); streakPlaneB.renderOrder = 6; S.add(streakPlaneB);

  // ===== automatic sliding door =====
  const doorFrameTop = box(1.94, 0.12, 0.18, aluminum); add(doorFrameTop, -4, 2.44, 1);
  const doorTrack = box(1.94, 0.04, 0.2, aluminum); add(doorTrack, -4, FLOOR + 0.01, 1);
  const mkDoor = () => {
    const g = new THREE.Group();
    const frame = box(0.92, 2.2, 0.05, aluminum); addOutline(frame, 0.015); g.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 2.05), glassMat);
    glass.position.z = 0.03; glass.renderOrder = 5; g.add(glass);
    const handle = box(0.04, 0.8, 0.06, mullionMat); handle.position.set(0.38, 0, 0.04); g.add(handle);
    return g;
  };
  const doorL = mkDoor(); doorL.position.set(-4.44, 1.29, 1); S.add(doorL);
  const doorR = mkDoor(); doorR.position.set(-3.56, 1.29, 1); S.add(doorR);
  // door mat + step
  const mat1 = box(1.9, 0.02, 0.9, toon(0x2f5d4a)); add(mat1, -4, WALK_Y + 0.012, 1.6);
  const step = box(2.4, 0.08, 0.5, toon(0x6b7386)); add(step, -4, 0.15, 1.2);

  // ===== awning =====
  const awn = box(12.2, 0.08, 1.9, toon(0x2b3a5e));
  awn.rotation.x = 0.1; add(awn, -5, 2.92, 1.85); addOutline(awn, 0.03);
  const awnTrim = box(12.2, 0.1, 0.08, toon(0xf0e9dc));
  awnTrim.rotation.x = 0.1; add(awnTrim, -5, 2.83, 2.78);
  const awnLight = box(11.5, 0.03, 0.12, new THREE.MeshBasicMaterial({ color: 0xffe8c0 }));
  awnLight.rotation.x = 0.1; add(awnLight, -5, 2.86, 2.55);

  // ===== roof =====
  const roof = box(12.4, 0.22, 8.4, toon(0x565f78)); add(roof, -5, 3.49, -3); addOutline(roof, 0.03);
  const parF = box(12.4, 0.5, 0.15, cream); add(parF, -5, 3.85, 0.9); addOutline(parF, 0.03);
  const parB = box(12.4, 0.5, 0.15, cream); add(parB, -5, 3.85, -6.9); addOutline(parB, 0.03);
  const parL = box(0.15, 0.5, 8.1, cream); add(parL, -11.15, 3.85, -3); addOutline(parL, 0.03);
  const parR = box(0.15, 0.5, 8.1, cream); add(parR, 1.15, 3.85, -3); addOutline(parR, 0.03);
  const condenser = box(1.3, 0.55, 0.9, toon(0x9aa3b2)); add(condenser, -8.5, 3.88, -4.5); addOutline(condenser, 0.02);
  const vent = cyl(0.18, 0.7, toon(0x7a8296)); add(vent, -3, 3.95, -5);

  // ===== rooftop sign lightbox =====
  const post1 = box(0.12, 0.7, 0.12, aluminum); add(post1, -9, 3.9, 0.5);
  const post2 = box(0.12, 0.7, 0.12, aluminum); add(post2, -1, 3.9, 0.5);
  const signBox = box(11, 1.15, 0.8, toon(0xf2ede4)); add(signBox, -5, 4.65, 0.5); addOutline(signBox, 0.03);
  const signFaceMat = new THREE.MeshBasicMaterial({ map: signTex() });
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(10.8, 1.05), signFaceMat);
  add(signFace, -5, 4.65, 0.92);
  const signGlow = glowSprite(0xfff2d8, 13, 3.2, 0.22); add(signGlow, -5, 4.65, 1.6);

  // ===== vertical neon sign (sleeve sign on the corner) =====
  const nTex = neonTex();
  const neonBox = box(0.14, 1.7, 0.55, toon(0x2a1030)); add(neonBox, 1.3, 2.6, 0.6); addOutline(neonBox, 0.02);
  const neonMatA = new THREE.MeshBasicMaterial({ map: nTex, transparent: true });
  const neonA = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), neonMatA);
  add(neonA, 1.38, 2.6, 0.6, Math.PI / 2);
  const neonMatB = neonMatA.clone();
  const neonB = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), neonMatB);
  add(neonB, 1.22, 2.6, 0.6, -Math.PI / 2);
  const neonGlow = glowSprite(0xff7eb9, 2.4, 3.4, 0.5); add(neonGlow, 1.35, 2.6, 0.6);
  const neonStreak = flatStreak(0xff7eb9, 0.8, 2.6, 0.2); add(neonStreak, 1.7, WALK_Y + 0.02, 1.9);

  // ===== entrance light spill + door light =====
  const spill = flatStreak(0xffd9a0, 3.6, 4.0, 0.28); add(spill, -4, WALK_Y + 0.018, 3.0);
  const doorLight = new THREE.PointLight(0xffd9a0, 8, 6.5, 1.8);
  doorLight.position.set(-4, 2.35, 1.7);
  S.add(doorLight);

  // ================= INTERIOR =================
  const innerCream = toon(0xf5ead8);
  // ceiling + light panels
  const ceil = box(11.7, 0.04, 7.7, toon(0xf8f2e8)); add(ceil, -5, 3.0, -3);
  const panelMat = new THREE.MeshBasicMaterial({ color: 0xfff2dd });
  for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 2; iz++) {
    add(box(1.3, 0.04, 0.55, panelMat), -9.3 + ix * 3, 2.96, -5.2 + iz * 3.6);
  }
  // interior wall surfaces (warm)
  const iwB = box(11.7, 3.0, 0.05, innerCream); add(iwB, -5, 1.7, -6.83);
  const iwL = box(0.05, 3.0, 7.7, innerCream); add(iwL, -10.83, 1.7, -3);
  const iwR = box(0.05, 3.0, 7.7, innerCream); add(iwR, 0.83, 1.7, -3);

  // interior lights
  const mkLight = (x, y, z, c, i, d) => {
    const L = new THREE.PointLight(c, i, d, 1.8); L.position.set(x, y, z); S.add(L);
  };
  mkLight(-7, 2.65, -2.5, 0xffe2b8, 30, 10);
  mkLight(-2.5, 2.65, -2.0, 0xffe2b8, 26, 10);
  mkLight(-6, 2.65, -5.5, 0xffe8cc, 22, 9);
  mkLight(-6, 1.6, -5.6, 0xbfe0ff, 6, 5);

  // ===== drink coolers along the back wall =====
  const coolerBody = toon(0x2a3350);
  const coolerGlowMat = new THREE.MeshBasicMaterial({ color: 0xd8ecff });
  const coolerGlassMat = new THREE.MeshBasicMaterial({
    color: 0xbfe4ff, transparent: true, opacity: 0.16, depthWrite: false,
  });
  const drinkList = [];
  for (let i = 0; i < 6; i++) {
    const cx = -9.72 + i * 1.55;
    const body = box(1.5, 2.15, 0.65, coolerBody); add(body, cx, FLOOR + 1.075, -6.5); addOutline(body, 0.02);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.85), coolerGlowMat);
    add(glow, cx, FLOOR + 1.1, -6.75);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.9), coolerGlassMat);
    glass.renderOrder = 4; add(glass, cx, FLOOR + 1.1, -6.16);
    const mull = box(0.05, 1.9, 0.04, aluminum); add(mull, cx, FLOOR + 1.1, -6.15);
    [-0.3, 0.3].forEach((dx) => {
      const h = box(0.03, 0.7, 0.03, aluminum); add(h, cx + dx, FLOOR + 1.1, -6.13);
    });
    // shelves of drinks
    for (let s = 0; s < 4; s++) {
      const shelf = box(1.3, 0.03, 0.4, toon(0xd8dde8));
      add(shelf, cx, FLOOR + 0.42 + s * 0.42, -6.42);
      for (let k = 0; k < 9; k++) {
        drinkList.push([cx - 0.56 + k * 0.14, FLOOR + 0.52 + s * 0.42, -6.42, 0, 0.9 + (k % 3) * 0.12]);
      }
    }
  }
  S.add(instancedBoxes(drinkList, [0.1, 0.16, 0.1], DRINK));
  // wall sign strip above coolers
  const wallSign = box(9.5, 0.4, 0.06, new THREE.MeshBasicMaterial({ color: 0xfff2dd }));
  add(wallSign, -5.6, 2.62, -6.82);

  // ===== gondola shelves (snacks) =====
  const shelfMat = toon(0xe8e2d4);
  const snackList = [];
  [-3.5, -1.7].forEach((gz) => {
    const base = box(5.4, 0.12, 0.9, shelfMat); add(base, -5.9, FLOOR + 0.06, gz); addOutline(base, 0.02);
    const backPanel = box(5.4, 1.45, 0.08, shelfMat); add(backPanel, -5.9, FLOOR + 0.78, gz);
    [-8.5, -3.3].forEach((ex) => {
      const side = box(0.08, 1.45, 0.9, shelfMat); add(side, ex, FLOOR + 0.78, gz);
    });
    for (let lvl = 0; lvl < 3; lvl++) {
      const y = FLOOR + 0.35 + lvl * 0.4;
      [-0.26, 0.26].forEach((dz) => {
        const sh = box(5.4, 0.04, 0.4, shelfMat); add(sh, -5.9, y, gz + dz);
        for (let k = 0; k < 26; k++) {
          snackList.push([-8.35 + k * 0.2, y + 0.12, gz + dz, (k % 5) * 0.06, 0.8 + (k % 4) * 0.15]);
        }
      });
    }
  });
  S.add(instancedBoxes(snackList, [0.15, 0.2, 0.14], SNACK));

  // ===== bento & onigiri case (front-left, visible through window) =====
  {
    const caseBody = box(3, 1.05, 0.7, toon(0xd8dde8)); add(caseBody, -8.5, FLOOR + 0.525, -0.15); addOutline(caseBody, 0.02);
    const caseGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.8),
      new THREE.MeshBasicMaterial({ color: 0xfff2dd }));
    add(caseGlow, -8.5, FLOOR + 0.6, -0.45);
    const caseGlass = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.85), coolerGlassMat);
    caseGlass.renderOrder = 4; add(caseGlass, -8.5, FLOOR + 0.6, 0.21);
    const shelf1 = box(2.8, 0.03, 0.5, shelfMat); add(shelf1, -8.5, FLOOR + 0.38, -0.15);
    const shelf2 = box(2.8, 0.03, 0.5, shelfMat); add(shelf2, -8.5, FLOOR + 0.72, -0.15);
    // onigiri (triangular prisms) on the left half
    const oniGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.07, 3);
    const oni = new THREE.InstancedMesh(oniGeo, toon(0xf5f2ea), 16);
    const nori = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.07, 0.03), toon(0x1e2a22), 16);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
    let idx = 0;
    for (let row = 0; row < 2; row++) for (let k = 0; k < 8; k++) {
      const x = -9.65 + k * 0.32, y = FLOOR + 0.44 + row * 0.34, z = -0.18;
      q.setFromEuler(new THREE.Euler(Math.PI / 2, 0, Math.PI / 6));
      m.compose(new THREE.Vector3(x, y, z), q, s);
      oni.setMatrixAt(idx, m);
      m.compose(new THREE.Vector3(x, y - 0.02, z + 0.055), new THREE.Quaternion(), s);
      nori.setMatrixAt(idx, m);
      idx++;
    }
    S.add(oni, nori);
    // bento boxes on the right half
    const bentoList = [];
    for (let row = 0; row < 2; row++) for (let k = 0; k < 5; k++) {
      bentoList.push([-8.05 + k * 0.34, FLOOR + 0.44 + row * 0.34, -0.15, (k % 3) * 0.1, 1]);
    }
    S.add(instancedBoxes(bentoList, [0.26, 0.08, 0.18], [0xd84a4a, 0x2b7de0, 0x39b77f, 0xffa94d, 0xe9ecef]));
  }

  // ===== freezer chest =====
  {
    const fz = box(1.8, 0.95, 0.9, toon(0xe8ecf4)); add(fz, -4.5, FLOOR + 0.475, -5.2); addOutline(fz, 0.02);
    const fzGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7),
      new THREE.MeshBasicMaterial({ color: 0xd8ecff, transparent: true, opacity: 0.6 }));
    fzGlow.rotation.x = -Math.PI / 2; add(fzGlow, -4.5, FLOOR + 0.9, -5.2);
    const fzGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.8), coolerGlassMat);
    fzGlass.rotation.x = -Math.PI / 2; fzGlass.renderOrder = 4; add(fzGlass, -4.5, FLOOR + 0.97, -5.2);
    const iceList = [];
    for (let k = 0; k < 8; k++) iceList.push([-5.2 + (k % 4) * 0.45, FLOOR + 0.82, -5.35 + Math.floor(k / 4) * 0.3, k * 0.3, 1]);
    S.add(instancedBoxes(iceList, [0.3, 0.12, 0.2], [0xf783ac, 0x74c0fc, 0xffd43b, 0xe9ecef]));
  }

  // ===== cashier counter =====
  {
    const counter = box(2.4, 0.95, 0.7, toon(0xf2ede4)); add(counter, -1.5, FLOOR + 0.475, -0.85); addOutline(counter, 0.02);
    const counterTop = box(2.5, 0.06, 0.8, toon(0xd8dde8)); add(counterTop, -1.5, FLOOR + 0.98, -0.85);
    // registers
    [-2.1, -1.0].forEach((x) => {
      const reg = box(0.35, 0.22, 0.3, toon(0x3a4152)); add(reg, x, FLOOR + 1.12, -0.9); addOutline(reg, 0.015);
      const disp = box(0.2, 0.12, 0.02, new THREE.MeshBasicMaterial({ color: 0x9fe8c0 }));
      disp.rotation.x = -0.3; add(disp, x, FLOOR + 1.3, -1.0);
    });
    // back counter along the right wall with coffee machine + oden
    const backCounter = box(0.55, 0.9, 2.2, toon(0xf2ede4)); add(backCounter, 0.5, FLOOR + 0.45, -2.6); addOutline(backCounter, 0.02);
    const coffee = box(0.45, 0.6, 0.4, toon(0x2b303c)); add(coffee, 0.5, FLOOR + 1.2, -1.9); addOutline(coffee, 0.015);
    const coffeeFace = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.5),
      new THREE.MeshBasicMaterial({ map: coffeeTex() }));
    add(coffeeFace, 0.5, FLOOR + 1.2, -1.695);
    // oden warmer
    const oden = box(0.6, 0.4, 0.45, toon(0xb8bfcc)); add(oden, 0.5, FLOOR + 1.1, -3.1); addOutline(oden, 0.015);
    const odenGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xffc987 }));
    add(odenGlow, 0.5, FLOOR + 1.1, -2.87);
    const odenGlass = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.3), coolerGlassMat);
    odenGlass.renderOrder = 4; add(odenGlass, 0.5, FLOOR + 1.1, -2.86);
    // basket stack by the door
    for (let i = 0; i < 3; i++) {
      const b = box(0.42, 0.13, 0.32, toon(0xd84a4a));
      add(b, -5.7, FLOOR + 0.065 + i * 0.13, 0.3); addOutline(b, 0.012);
    }
  }

  // ===== magazine rack (right wall, near window) =====
  {
    const rack = box(0.4, 1.35, 1.6, toon(0x8a93a6));
    rack.rotation.z = -0.18; add(rack, 0.62, FLOOR + 0.675, -0.6); addOutline(rack, 0.02);
    const magList = [];
    for (let lvl = 0; lvl < 3; lvl++) for (let k = 0; k < 5; k++) {
      magList.push([0.45, FLOOR + 0.38 + lvl * 0.4, -1.25 + k * 0.3, 0, 1]);
    }
    const mags = instancedBoxes(magList, [0.02, 0.3, 0.22], SNACK);
    S.add(mags);
  }

  // ===== posters, hanging signs, floor arrows, back door, ATM =====
  const poster1 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0),
    new THREE.MeshBasicMaterial({ map: posterTex('#f783ac', '#ffd43b', true) }));
  add(poster1, 0.8, FLOOR + 1.7, -4.5, -Math.PI / 2);
  const poster2 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0),
    new THREE.MeshBasicMaterial({ map: posterTex('#66d9e8', '#ff7a1a', false) }));
  add(poster2, 0.8, FLOOR + 1.7, -5.5, -Math.PI / 2);
  const poster3 = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0),
    new THREE.MeshBasicMaterial({ map: posterTex('#ffd43b', '#ef4b4b', true) }));
  add(poster3, -10.8, FLOOR + 1.7, -2, Math.PI / 2);

  const hang1 = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.36),
    new THREE.MeshBasicMaterial({ map: hangSignTex('お弁当'), side: THREE.DoubleSide }));
  add(hang1, -5.9, 2.45, -2.6);
  const hang2 = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.36),
    new THREE.MeshBasicMaterial({ map: hangSignTex('ドリンク'), side: THREE.DoubleSide }));
  add(hang2, -5.9, 2.45, -4.4);
  [-2.6, -4.4].forEach((z) => {
    S.add((() => { const w = cyl(0.01, 0.5, toon(0x8a93a6)); w.position.set(-5.9, 2.75, z); return w; })());
  });

  const arrowTex = arrowFloorTex();
  [[0.5, Math.PI], [-0.5, Math.PI]].forEach(([z, r]) => {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({ map: arrowTex, transparent: true, opacity: 0.85 }));
    a.rotation.x = -Math.PI / 2; a.rotation.z = r;
    a.position.set(-4, FLOOR + 0.008, z); S.add(a);
  });

  const backDoor = box(0.9, 2.0, 0.08, toon(0x8a93a6)); add(backDoor, 0.35, FLOOR + 1.0, -6.78); addOutline(backDoor, 0.02);
  const backSign = box(0.5, 0.18, 0.02, new THREE.MeshBasicMaterial({ color: 0xffd43b }));
  add(backSign, 0.35, FLOOR + 2.15, -6.73);
  // stock boxes near the back door
  const sb1 = box(0.5, 0.4, 0.5, toon(0x8a6f4d)); add(sb1, 0.62, FLOOR + 0.2, -6.15); addOutline(sb1, 0.015);
  const sb2 = box(0.4, 0.3, 0.4, toon(0x9a7d58)); add(sb2, 0.62, FLOOR + 0.55, -6.15); addOutline(sb2, 0.015);

  // ATM
  const atm = box(0.6, 1.4, 0.5, toon(0xe8e2d4)); add(atm, -0.72, FLOOR + 0.7, -6.4); addOutline(atm, 0.02);
  const atmScr = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26),
    new THREE.MeshBasicMaterial({ color: 0x9fd4ff }));
  atmScr.rotation.x = -0.12; add(atmScr, -0.72, FLOOR + 1.05, -6.13);

  // ===== drip points along the awning front edge =====
  const dripPoints = [];
  for (let x = -10.5; x <= 0.6; x += 1.4) {
    dripPoints.push(new THREE.Vector3(x, 2.78, 2.74));
  }

  return {
    doorL, doorR,
    doorPos: { lClosed: -4.44, lOpen: -5.36, rClosed: -3.56, rOpen: -2.64 },
    spillMat: spill.material,
    doorLight,
    neonMats: [neonMatA, neonMatB],
    neonGlowMat: neonGlow.material,
    neonStreakMat: neonStreak.material,
    signFaceMat,
    bandMat: band.material,
    streakMatA, streakMatB,
    dripPoints,
  };
}
