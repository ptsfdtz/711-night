// store.js — the Japanese convenience-store building, its fascia sign, canopy,
// automatic doors, and a fully furnished, brightly lit interior.
import * as THREE from 'three';
import { box, cyl, sphere, plane, at, canvasTexture, roundRect, rand, clamp } from './util.js';
import {
  toon, glow, glassMat, PALETTE,
  storeSignTexture, posterTexture, drinksTexture, magazineTexture, odenTexture,
  shelfProductsTexture, bentoTexture, onigiriTexture, glassRainTexture, bannerTexture, poolTexture,
} from './materials.js';
import { LAYOUT, addGroundReflection } from './environment.js';

const S = LAYOUT.store;                 // { minX, maxX, minZ, maxZ, frontZ, height }
const WALL = 0.2;                        // wall thickness
const CX = (S.minX + S.maxX) / 2;        // building centre X
const WIDTH = S.maxX - S.minX;           // 8.5
const DEPTH = S.maxZ - S.minZ;           // 6.0
const H = S.height;                      // 3.6
const FLOOR_Y = 0.12;                    // interior floor level
const CEIL_Y = 3.15;

// Front-façade segmentation (along X, at z = frontZ)
const FRONT = {
  pillarL: [S.minX, S.minX + 0.9],       // solid left pillar
  window: [S.minX + 0.9, S.maxX - 2.0],  // big display window
  door: [S.maxX - 2.0, S.maxX - 0.8],    // automatic door opening (1.2 wide)
  pillarR: [S.maxX - 0.8, S.maxX],       // solid right pillar
};

/* ------------------------------------------------------------------ *
 * Interior product textures (created once, reused)
 * ------------------------------------------------------------------ */
const TEX = {
  shelf: [shelfProductsTexture(0), shelfProductsTexture(1), shelfProductsTexture(2)],
  drinks: drinksTexture(),
  bento: bentoTexture(),
  onigiri: onigiriTexture(),
  magazine: magazineTexture(),
  poster: [posterTexture(0), posterTexture(1), posterTexture(2), posterTexture(3)],
  oden: odenTexture(),
};

/* ------------------------------------------------------------------ *
 * Shell (walls, roof, floor, ceiling)
 * ------------------------------------------------------------------ */
function buildShell(group) {
  const wallMat = toon(PALETTE.wall);
  const wallShade = toon(PALETTE.wallShade);
  const floorMat = toon(0xdfe4e8, { grad: undefined });

  // Interior floor
  const floor = plane(WIDTH - WALL, DEPTH - WALL, floorMat);
  floor.rotation.x = -Math.PI / 2;
  at(floor, CX, FLOOR_Y, S.minZ + DEPTH / 2);
  floor.receiveShadow = true;
  group.add(floor);

  // Floor tile lines + guidance decal
  const tileTex = canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e6eaee'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(150,160,175,0.5)'; ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { const p = i * (w / 4); ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(w, p); ctx.stroke(); }
  }, { repeat: [5, 4] });
  floorMat.map = tileTex; floorMat.color = new THREE.Color(0xffffff);
  floorMat.emissive = new THREE.Color(0x3a2a14); floorMat.emissiveIntensity = 0.7;

  // Back wall
  const back = box(WIDTH, H, WALL, wallMat);
  at(back, CX, H / 2, S.minZ);
  group.add(back);

  // Left wall
  const left = box(WALL, H, DEPTH, wallShade);
  at(left, S.minX, H / 2, S.minZ + DEPTH / 2);
  group.add(left);

  // Right wall (faces the corner) — with a poster + small window
  const right = box(WALL, H, DEPTH, wallShade);
  at(right, S.maxX, H / 2, S.minZ + DEPTH / 2);
  group.add(right);

  // Ceiling slab (interior side light)
  const ceil = plane(WIDTH - WALL, DEPTH - WALL, toon(0xf2f5f8, { grad: undefined }));
  ceil.rotation.x = Math.PI / 2;
  at(ceil, CX, CEIL_Y, S.minZ + DEPTH / 2);
  group.add(ceil);

  // Roof slab on top
  const roof = box(WIDTH + 0.5, 0.3, DEPTH + 0.5, toon(PALETTE.roof));
  at(roof, CX, H + 0.15, S.minZ + DEPTH / 2);
  group.add(roof);

  // Parapet
  const par = toon(0x4a5464);
  const pN = box(WIDTH + 0.6, 0.35, 0.2, par, { outline: false }); at(pN, CX, H + 0.42, S.minZ - 0.15); group.add(pN);
  const pS = pN.clone(); at(pS, CX, H + 0.42, S.maxZ + 0.15); group.add(pS);
  const pW = box(0.2, 0.35, DEPTH + 0.6, par, { outline: false }); at(pW, S.minX - 0.15, H + 0.42, S.minZ + DEPTH / 2); group.add(pW);
  const pE = pW.clone(); at(pE, S.maxX + 0.15, H + 0.42, S.minZ + DEPTH / 2); group.add(pE);

  return { wallMat };
}

/* ------------------------------------------------------------------ *
 * Front façade: pillars, header, sill, glass, mullions, posters
 * ------------------------------------------------------------------ */
function buildFacade(group) {
  const z = S.frontZ;
  const glassH = 2.45;
  const glassBottom = 0.28;

  const pillarMat = toon(PALETTE.wall);
  const trimMat = toon(PALETTE.trim);

  // Solid end pillars (full height)
  [[FRONT.pillarL], [FRONT.pillarR]].forEach(([[a, b]]) => {
    const w = b - a;
    const p = box(w, H, WALL + 0.06, pillarMat);
    at(p, (a + b) / 2, H / 2, z);
    group.add(p);
  });

  // Header band above the glass (spans window+door)
  const headerA = FRONT.window[0], headerB = FRONT.door[1];
  const header = box(headerB - headerA, H - (glassBottom + glassH), WALL + 0.05, toon(PALETTE.wallShade));
  at(header, (headerA + headerB) / 2, glassBottom + glassH + (H - (glassBottom + glassH)) / 2, z);
  group.add(header);

  // Sill below the glass
  const sill = box(headerB - headerA, glassBottom, WALL + 0.08, trimMat);
  at(sill, (headerA + headerB) / 2, glassBottom / 2, z);
  group.add(sill);

  // ---- Display window glass (left of door) ----
  const [wa, wb] = FRONT.window;
  const glass = plane(wb - wa, glassH, glassMat({ opacity: 0.09 }));

  // Warm light spill pooling on the wet pavement in front of the shop
  const doorCX = (FRONT.door[0] + FRONT.door[1]) / 2;
  const pool = poolTexture();
  const spillMat = new THREE.MeshBasicMaterial({ map: pool, color: 0xffb066, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
  const spillW = new THREE.Mesh(new THREE.PlaneGeometry(wb - wa + 2.0, 3.0), spillMat);
  spillW.rotation.x = -Math.PI / 2;
  spillW.position.set((wa + wb) / 2, 0.03, z + 1.4);
  spillW.renderOrder = 2;
  group.add(spillW);
  const spillD = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6), spillMat.clone());
  spillD.material.opacity = 0.45;
  spillD.rotation.x = -Math.PI / 2;
  spillD.position.set(doorCX, 0.03, z + 1.2);
  spillD.renderOrder = 2;
  group.add(spillD);
  const doorLight = new THREE.PointLight(0xffc080, 1.2, 7, 2);
  doorLight.position.set(doorCX, 1.4, z + 0.8);
  group.add(doorLight);
  at(glass, (wa + wb) / 2, glassBottom + glassH / 2, z + 0.02);
  group.add(glass);

  // Window frame + a couple of vertical mullions
  const frameMat = toon(0x9aa3ad);
  const frameT = box(wb - wa + 0.1, 0.12, 0.14, frameMat, { outline: false }); at(frameT, (wa + wb) / 2, glassBottom + glassH, z + 0.02); group.add(frameT);
  const frameBm = frameT.clone(); at(frameBm, (wa + wb) / 2, glassBottom, z + 0.02); group.add(frameBm);
  const mullions = 3;
  for (let i = 1; i < mullions; i++) {
    const mx = wa + (wb - wa) * (i / mullions);
    const m = box(0.09, glassH, 0.12, frameMat, { outline: false });
    at(m, mx, glassBottom + glassH / 2, z + 0.02);
    group.add(m);
  }

  // Rain film on the outside of the display window (animated in update)
  const rainTex = glassRainTexture();
  const rainFilm = plane(wb - wa, glassH, new THREE.MeshBasicMaterial({
    map: rainTex, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.NormalBlending,
  }));
  at(rainFilm, (wa + wb) / 2, glassBottom + glassH / 2, z + 0.06);
  group.add(rainFilm);

  // Posters stuck on the inside of the window glass
  const p1 = plane(1.1, 1.5, new THREE.MeshBasicMaterial({ map: TEX.poster[0] }));
  at(p1, wa + 0.9, glassBottom + 0.95, z - 0.05); group.add(p1);
  const p2 = plane(1.1, 1.5, new THREE.MeshBasicMaterial({ map: TEX.poster[2] }));
  at(p2, wa + 2.2, glassBottom + 0.95, z - 0.05); group.add(p2);

  // ---- Door frame ----
  const [da, db] = FRONT.door;
  const dCenter = (da + db) / 2;
  const doorH = 2.35;
  const dfMat = toon(0x8d97a6);
  const dfL = box(0.12, doorH + 0.1, 0.16, dfMat, { outline: false }); at(dfL, da, doorH / 2, z + 0.02); group.add(dfL);
  const dfR = dfL.clone(); at(dfR, db, doorH / 2, z + 0.02); group.add(dfR);
  const dfT = box(db - da + 0.24, 0.16, 0.16, dfMat, { outline: false }); at(dfT, dCenter, doorH + 0.05, z + 0.02); group.add(dfT);

  // Transom glass above the door
  const transom = plane(db - da, H - (doorH + 0.1) - 0.05, glassMat({ opacity: 0.2 }));
  at(transom, dCenter, doorH + 0.1 + (H - doorH - 0.1) / 2, z + 0.02);
  group.add(transom);

  // Sliding door panels (animated)
  const panelW = (db - da) / 2;
  const doorMat = glassMat({ opacity: 0.22 });
  const doorEdge = toon(0x9aa3ad);
  const mkPanel = (dir) => {
    const g = new THREE.Group();
    const glassP = plane(panelW, doorH, doorMat);
    at(glassP, 0, doorH / 2, 0);
    g.add(glassP);
    const topRail = box(panelW, 0.1, 0.1, doorEdge, { outline: false }); at(topRail, 0, doorH - 0.05, 0); g.add(topRail);
    const botRail = box(panelW, 0.12, 0.1, doorEdge, { outline: false }); at(botRail, 0, 0.06, 0); g.add(botRail);
    const sideRail = box(0.08, doorH, 0.1, doorEdge, { outline: false }); at(sideRail, dir * panelW / 2, doorH / 2, 0); g.add(sideRail);
    // rain film on door glass
    const rf = plane(panelW, doorH, new THREE.MeshBasicMaterial({ map: glassRainTexture(), transparent: true, opacity: 0.3, depthWrite: false }));
    at(rf, 0, doorH / 2, 0.03); g.add(rf);
    g.userData.rainFilm = rf;
    return g;
  };
  const doorL = mkPanel(-1);
  const doorR = mkPanel(1);
  // closed positions: panels meet at dCenter
  at(doorL, dCenter - panelW / 2, 0, z + 0.02);
  at(doorR, dCenter + panelW / 2, 0, z + 0.02);
  group.add(doorL); group.add(doorR);

  // Entrance floor mat (outside, on the sidewalk)
  const mat = plane(db - da + 0.4, 1.0, toon(0x2f6fd0, { grad: undefined }));
  mat.material.map = canvasTexture(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#2f6fd0'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('WELCOME', w / 2, h / 2);
  });
  mat.material.color = new THREE.Color(0xffffff);
  mat.rotation.x = -Math.PI / 2;
  at(mat, dCenter, 0.03, z + 0.7);
  group.add(mat);

  // Small step / threshold
  const step = box(db - da + 0.3, 0.12, 0.4, toon(0x6a7280), { outline: false });
  at(step, dCenter, 0.06, z + 0.2);
  group.add(step);

  return { doorL, doorR, dCenter, panelW, rainFilm, glassBottom, glassH, wa, wb, z };
}

/* ------------------------------------------------------------------ *
 * Fascia sign + canopy (with drip edge)
 * ------------------------------------------------------------------ */
function buildSign(group, facade) {
  const z = S.frontZ;

  // Main horizontal fascia sign
  const signMat = new THREE.MeshBasicMaterial({ map: storeSignTexture() });
  signMat.toneMapped = false;
  const signW = WIDTH + 1.0;
  const sign = plane(signW, 1.05, signMat);
  at(sign, CX, H + 0.05, z + 0.28);
  group.add(sign);

  // Sign housing (frame around it)
  const housing = box(signW + 0.2, 1.25, 0.3, toon(PALETTE.trim), {});
  at(housing, CX, H + 0.05, z + 0.14);
  group.add(housing);
  // re-add sign in front of housing
  group.remove(sign);
  at(sign, CX, H + 0.05, z + 0.30);
  group.add(sign);

  // Under-sign glow strip
  const glowStrip = box(signW, 0.1, 0.1, glow(0x9fe8ff, { intensity: 1.6 }));
  at(glowStrip, CX, H - 0.55, z + 0.28);
  group.add(glowStrip);

  // Canopy / awning over the entrance & window
  const canopyMat = toon(0xeef2f5);
  const canopyDepth = 1.7;
  const canopy = box(signW - 0.4, 0.18, canopyDepth, canopyMat);
  at(canopy, CX, H - 0.75, z + canopyDepth / 2 - 0.1);
  group.add(canopy);
  // Canopy fascia (coloured edge)
  const canopyEdge = box(signW - 0.4, 0.28, 0.16, toon(PALETTE.trimGreen));
  at(canopyEdge, CX, H - 0.86, z + canopyDepth - 0.18);
  group.add(canopyEdge);
  // Canopy support brackets
  [-1, 1].forEach((sx) => {
    const br = box(0.12, 0.12, canopyDepth - 0.2, toon(PALETTE.metalDark), { outline: false });
    at(br, CX + sx * (signW / 2 - 0.7), H - 0.9, z + canopyDepth / 2 - 0.1);
    group.add(br);
  });

  // Side vertical banner sign on the right pillar
  const banner = plane(0.5, 2.0, new THREE.MeshBasicMaterial({ map: bannerTexture('営業中', '#e8524f', '#fff') }));
  banner.material.toneMapped = false;
  at(banner, S.maxX - 0.4, 1.7, z + 0.16);
  group.add(banner);

  const dripEdgeZ = z + canopyDepth - 0.18;
  return { sign, signMat, glowStrip, canopyEdgeX: CX, canopyFrontZ: dripEdgeZ, canopyY: H - 0.95, canopyHalfW: (signW - 0.4) / 2 };
}

/* ------------------------------------------------------------------ *
 * Interior furnishing
 * ------------------------------------------------------------------ */
function makeShelfUnit(w, d, h, tex) {
  const g = new THREE.Group();
  const frame = toon(0xcfd6dd);
  // side uprights
  const up1 = box(0.08, h, d, frame, { outline: false }); at(up1, -w / 2, h / 2, 0); g.add(up1);
  const up2 = up1.clone(); at(up2, w / 2, h / 2, 0); g.add(up2);
  // shelves + product facings
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const y = 0.15 + i * ((h - 0.2) / tiers);
    const board = box(w, 0.05, d, frame, { outline: false }); at(board, 0, y, 0); g.add(board);
    const facing = plane(w * 0.94, (h - 0.2) / tiers - 0.04, new THREE.MeshBasicMaterial({ map: tex }));
    at(facing, 0, y + ((h - 0.2) / tiers) / 2, d / 2 + 0.005);
    g.add(facing);
  }
  // top cap
  const cap = box(w + 0.06, 0.06, d + 0.06, frame, { outline: false }); at(cap, 0, h, 0); g.add(cap);
  return g;
}

function buildInterior(group) {
  const innerMinX = S.minX + WALL, innerMaxX = S.maxX - WALL;
  const innerMinZ = S.minZ + WALL, innerMaxZ = S.frontZ - WALL;
  const items = [];

  // ---- Ceiling light boxes (bright, warm) ----
  const lightMat = glow(PALETTE.warmWhite, { intensity: 2.6 });
  for (let ix = 0; ix < 3; ix++) {
    for (let iz = 0; iz < 2; iz++) {
      const lp = plane(1.7, 0.7, lightMat);
      lp.rotation.x = Math.PI / 2;
      at(lp, innerMinX + 1.4 + ix * 2.3, CEIL_Y - 0.02, innerMinZ + 1.6 + iz * 2.6);
      group.add(lp);
      // housing
      const hs = box(1.8, 0.1, 0.8, toon(0xdfe4e8), { outline: false });
      at(hs, innerMinX + 1.4 + ix * 2.3, CEIL_Y + 0.03, innerMinZ + 1.6 + iz * 2.6);
      group.add(hs);
    }
  }

  // ---- Drink cooler along the back wall ----
  const coolerW = WIDTH - WALL * 2 - 0.4;
  const coolerGroup = new THREE.Group();
  const coolerBody = box(coolerW, 2.2, 0.75, toon(0xd7dde3));
  at(coolerBody, 0, 1.1, 0);
  coolerGroup.add(coolerBody);
  // glowing interior + drinks facing
  const drinksFace = plane(coolerW - 0.2, 1.9, new THREE.MeshBasicMaterial({ map: TEX.drinks }));
  at(drinksFace, 0, 1.15, 0.38); coolerGroup.add(drinksFace);
  const coolerGlow = plane(coolerW - 0.2, 1.9, glow(0x9fe8ff, { intensity: 0.5, transparent: true, opacity: 0.35 }));
  at(coolerGlow, 0, 1.15, 0.40); coolerGroup.add(coolerGlow);
  // glass doors + vertical dividers
  const cg = glassMat({ opacity: 0.14 });
  const cdoor = plane(coolerW - 0.2, 1.95, cg); at(cdoor, 0, 1.15, 0.42); coolerGroup.add(cdoor);
  for (let i = 1; i < 5; i++) {
    const dv = box(0.06, 1.95, 0.08, toon(0x9aa3ad), { outline: false });
    at(dv, -coolerW / 2 + 0.1 + i * ((coolerW - 0.2) / 5), 1.15, 0.42); coolerGroup.add(dv);
  }
  // top灯箱 header
  const coolerHeader = box(coolerW, 0.34, 0.5, glow(0x2f6fd0, { intensity: 1.2 }));
  at(coolerHeader, 0, 2.35, 0.05); coolerGroup.add(coolerHeader);
  at(coolerGroup, CX, FLOOR_Y, innerMinZ + 0.45);
  group.add(coolerGroup);

  // ---- Gondola shelves (aisles receding from the front) ----
  const shelfXs = [innerMinX + 1.3, innerMinX + 3.0, innerMinX + 4.7];
  shelfXs.forEach((sx, i) => {
    const unit = makeShelfUnit(0.95, 0.85, 1.55, TEX.shelf[i % TEX.shelf.length]);
    // long run of shelving along Z
    for (let k = 0; k < 2; k++) {
      const u = makeShelfUnit(0.95, 1.6, 1.55, TEX.shelf[(i + k) % TEX.shelf.length]);
      at(u, sx, FLOOR_Y, innerMinZ + 1.7 + k * 1.7);
      group.add(u);
    }
  });

  // ---- Right wall: bento / onigiri refrigerated cases ----
  const caseX = innerMaxX - 0.55;
  const bentoCase = new THREE.Group();
  const bcBody = box(0.9, 1.5, 3.2, toon(0xd7dde3)); at(bcBody, 0, 0.75, 0); bentoCase.add(bcBody);
  const bentoFace = plane(3.0, 1.1, new THREE.MeshBasicMaterial({ map: TEX.bento }));
  bentoFace.rotation.y = -Math.PI / 2; at(bentoFace, -0.46, 1.0, 0); bentoCase.add(bentoFace);
  const onigFace = plane(3.0, 0.5, new THREE.MeshBasicMaterial({ map: TEX.onigiri }));
  onigFace.rotation.y = -Math.PI / 2; at(onigFace, -0.46, 0.42, 0); bentoCase.add(onigFace);
  const bcGlass = plane(3.2, 1.5, glassMat({ opacity: 0.12 })); bcGlass.rotation.y = -Math.PI / 2; at(bcGlass, -0.5, 0.8, 0); bentoCase.add(bcGlass);
  at(bentoCase, caseX, FLOOR_Y, innerMinZ + 2.4);
  group.add(bentoCase);

  // ---- Magazine rack near the entrance (left of door) ----
  const magRack = new THREE.Group();
  const mrBody = box(0.9, 1.3, 0.5, toon(0xcfd6dd)); at(mrBody, 0, 0.65, 0); magRack.add(mrBody);
  const magFace = plane(0.85, 1.1, new THREE.MeshBasicMaterial({ map: TEX.magazine }));
  at(magFace, 0, 0.7, 0.26); magRack.add(magFace);
  at(magRack, innerMinX + 0.7, FLOOR_Y, innerMaxZ - 0.5);
  group.add(magRack);

  // ---- Checkout counter near the door (right-front) ----
  const counter = new THREE.Group();
  const cTop = box(2.4, 0.14, 0.9, toon(0xb9c0c8)); at(cTop, 0, 0.92, 0); counter.add(cTop);
  const cBody = box(2.4, 0.85, 0.85, toon(0x9aa3ad)); at(cBody, 0, 0.45, 0); counter.add(cBody);
  const cPanel = plane(2.3, 0.6, new THREE.MeshBasicMaterial({ map: TEX.poster[3] })); at(cPanel, 0, 0.5, 0.44); counter.add(cPanel);
  // register
  const reg = box(0.5, 0.28, 0.4, toon(0x6a7280)); at(reg, 0.7, 1.13, 0); counter.add(reg);
  const regScreen = plane(0.34, 0.2, glow(0x8ff0c0, { intensity: 1.3 })); regScreen.rotation.x = -0.5; at(regScreen, 0.7, 1.32, 0.05); counter.add(regScreen);
  // coffee machine
  const coffee = box(0.42, 0.55, 0.4, toon(0x3a4149)); at(coffee, -0.2, 1.28, 0); counter.add(coffee);
  const coffeeGlow = plane(0.2, 0.14, glow(0xff8a3d, { intensity: 1.4 })); at(coffeeGlow, -0.2, 1.4, 0.21); counter.add(coffeeGlow);
  const cupDisp = cyl(0.12, 0.12, 0.3, 10, toon(0xdfe4e8)); at(cupDisp, -0.65, 1.15, 0); counter.add(cupDisp);
  at(counter, innerMaxX - 1.5, FLOOR_Y, innerMaxZ - 0.7);
  group.add(counter);

  // ---- Oden counter (hot, steaming) beside the register ----
  const oden = new THREE.Group();
  const odenBody = box(1.1, 0.9, 0.7, toon(0xb9c0c8)); at(odenBody, 0, 0.45, 0); oden.add(odenBody);
  const odenFace = plane(1.0, 0.5, new THREE.MeshBasicMaterial({ map: TEX.oden })); at(odenFace, 0, 0.5, 0.36); oden.add(odenFace);
  const pot = box(0.95, 0.16, 0.55, toon(0x8d97a6)); at(pot, 0, 0.98, 0); oden.add(pot);
  const broth = plane(0.85, 0.45, glow(0xffb46b, { intensity: 1.1 })); broth.rotation.x = -Math.PI / 2; at(broth, 0, 1.07, 0); oden.add(broth);
  // little dividers in the pot
  for (let i = 0; i < 3; i++) { const d = box(0.02, 0.06, 0.5, toon(0x6a7280), { outline: false }); at(d, -0.3 + i * 0.3, 1.09, 0); oden.add(d); }
  at(oden, innerMaxX - 3.0, FLOOR_Y, innerMaxZ - 0.7);
  group.add(oden);

  // ---- Back-left: lockers + staff door ----
  const lockers = box(1.6, 2.0, 0.5, toon(0x8d97a6)); at(lockers, innerMinX + 0.9, FLOOR_Y + 1.0, innerMinZ + 0.9); group.add(lockers);
  for (let i = 0; i < 3; i++) { const ln = box(0.45, 1.8, 0.06, toon(0x7a828e), { outline: false }); at(ln, innerMinX + 0.35 + i * 0.5, FLOOR_Y + 1.0, innerMinZ + 1.16); group.add(ln); }
  const staffDoor = box(0.9, 2.1, 0.1, toon(0x6a7280)); at(staffDoor, innerMinX + 2.4, FLOOR_Y + 1.05, innerMinZ + 0.12); group.add(staffDoor);
  const staffSign = plane(0.6, 0.2, new THREE.MeshBasicMaterial({ map: bannerTexture('関係者以外立入禁止', '#2f6fd0', '#fff') }));
  staffSign.material.toneMapped = false; staffSign.rotation.x = 0; at(staffSign, innerMinX + 2.4, FLOOR_Y + 1.9, innerMinZ + 0.19); group.add(staffSign);

  // ---- Wall posters (back + right) ----
  const wp = plane(1.2, 1.6, new THREE.MeshBasicMaterial({ map: TEX.poster[1] }));
  at(wp, innerMinX + 2.0, 1.9, innerMinZ + 0.72); group.add(wp);
  const wp2 = plane(1.2, 1.6, new THREE.MeshBasicMaterial({ map: TEX.poster[2] }));
  wp2.rotation.y = -Math.PI / 2; at(wp2, innerMaxX - 0.12, 1.9, innerMinZ + 4.6); group.add(wp2);

  // ---- Hanging aisle sign (灯箱) ----
  const hangSign = box(1.4, 0.4, 0.08, glow(0x2fbf7a, { intensity: 1.2 }));
  at(hangSign, innerMinX + 3.0, 2.5, innerMinZ + 2.4); group.add(hangSign);
  const hangText = plane(1.3, 0.32, new THREE.MeshBasicMaterial({
    map: canvasTexture(256, 64, (ctx, w, h) => { ctx.fillStyle = '#0b3'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fff'; ctx.font = 'bold 40px "Yu Gothic",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('お弁当・飲料', w / 2, h / 2 + 2); }),
  }));
  hangText.material.toneMapped = false;
  at(hangText, innerMinX + 3.0, 2.5, innerMinZ + 2.45); group.add(hangText);

  // ---- Floor guidance decal near entrance ----
  const guide = plane(1.4, 0.7, new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0.85,
    map: canvasTexture(256, 128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.moveTo(40, 64); ctx.lineTo(120, 30); ctx.lineTo(120, 98); ctx.closePath(); ctx.fill();
      ctx.fillRect(120, 52, 90, 24);
    }),
  }));
  guide.rotation.x = -Math.PI / 2;
  at(guide, innerMinX + 1.0, FLOOR_Y + 0.01, innerMaxZ - 0.9);
  group.add(guide);

  // ---- Warm interior lights ----
  const l1 = new THREE.PointLight(0xffe0b0, 4.5, 16, 2);
  at(l1, CX, 2.7, innerMinZ + 2.0); group.add(l1);
  const l2 = new THREE.PointLight(0xfff0d0, 3.5, 14, 2);
  at(l2, CX, 2.5, innerMinZ + 4.6); group.add(l2);
  const l3 = new THREE.PointLight(0xffe8c0, 3.0, 12, 2);
  at(l3, CX - 1.5, 2.2, innerMinZ + 3.2); group.add(l3);

  return { lights: [l1, l2, l3], items, odenBroth: broth };
}

/* ------------------------------------------------------------------ *
 * Public builder
 * ------------------------------------------------------------------ */
export function buildStore(scene) {
  const group = new THREE.Group();
  group.name = 'store';

  buildShell(group);
  const facade = buildFacade(group);
  const sign = buildSign(group, facade);
  const interior = buildInterior(group);

  // Warm light spilling out of the doorway onto the wet sidewalk
  const doorSpill = new THREE.SpotLight(0xffd9a0, 4.5, 12, Math.PI / 4.2, 0.5, 1.4);
  at(doorSpill, facade.dCenter, 2.4, S.frontZ + 0.2);
  doorSpill.target.position.set(facade.dCenter, 0, S.frontZ + 3.4);
  group.add(doorSpill); group.add(doorSpill.target);
  doorSpill.castShadow = true;
  doorSpill.shadow.mapSize.set(1024, 1024);
  doorSpill.shadow.bias = -0.0008;

  // Fake reflection of the bright storefront on the wet ground
  const storeRefl = addGroundReflection(group, {
    x: CX, z: S.frontZ + 2.2, w: WIDTH * 0.9, len: 4.2, color: '#ffd9a0', intensity: 0.7,
  });

  scene.add(group);

  /* ---- animation state ---- */
  const state = {
    doorTimer: rand(2, 4),
    doorOpen: 0,        // 0..1
    doorTarget: 0,
    doorPhase: 'wait',  // wait -> opening -> open -> closing
    holdTimer: 0,
    flicker: 1,
  };

  function update(dt, t) {
    // Automatic door state machine
    const maxSlide = facade.panelW * 0.92;
    switch (state.doorPhase) {
      case 'wait':
        state.doorTimer -= dt;
        if (state.doorTimer <= 0) { state.doorPhase = 'opening'; }
        break;
      case 'opening':
        state.doorOpen = clamp(state.doorOpen + dt * 1.6, 0, 1);
        if (state.doorOpen >= 1) { state.doorPhase = 'open'; state.holdTimer = rand(1.4, 2.6); }
        break;
      case 'open':
        state.holdTimer -= dt;
        if (state.holdTimer <= 0) state.doorPhase = 'closing';
        break;
      case 'closing':
        state.doorOpen = clamp(state.doorOpen - dt * 1.4, 0, 1);
        if (state.doorOpen <= 0) { state.doorPhase = 'wait'; state.doorTimer = rand(5, 9); }
        break;
    }
    const e = easeInOut(state.doorOpen);
    facade.doorL.position.x = facade.dCenter - facade.panelW / 2 - e * maxSlide;
    facade.doorR.position.x = facade.dCenter + facade.panelW / 2 + e * maxSlide;

    // Rain film sliding down the glass
    if (facade.rainFilm.material.map) {
      facade.rainFilm.material.map.offset.y = (facade.rainFilm.material.map.offset.y - dt * 0.25) % 1;
    }
    facade.doorL.userData.rainFilm.material.map.offset.y -= dt * 0.22;
    facade.doorR.userData.rainFilm.material.map.offset.y -= dt * 0.22;

    // Sign / neon flicker
    const base = 1.0;
    let fl = base + Math.sin(t * 9.0) * 0.03 + Math.sin(t * 23.0) * 0.02;
    // occasional deeper flicker
    if (Math.sin(t * 2.1) > 0.985) fl *= rand(0.55, 0.8);
    state.flicker = fl;
    sign.signMat.color.setScalar(fl);
    sign.glowStrip.material.color.setRGB(0.62 * fl, 0.91 * fl, 1.0 * fl);
    const ilBases = [4.5, 3.5, 3.0];
    interior.lights.forEach((L, i) => { L.intensity = (ilBases[i] || 3.0) * (0.94 + 0.06 * Math.sin(t * 3 + i)); });
    doorSpill.intensity = 4.5 * (0.9 + 0.1 * fl);
    storeRefl.material.opacity = 0.6 + 0.15 * fl;
  }

  return { group, update, sign };
}

function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
