import * as THREE from 'three';
import * as T from './textures.js';
import {
  C, box, cyl, plane, mesh, group, rot, toon, flat, outline, glow,
  rnd, pick, range,
} from './util.js';

/* store footprint */
export const SX = 3.6;        // half width  (x)
export const SZ_F = 2.9;      // front wall  (z)
export const SZ_B = -3.6;     // back wall   (z)
export const WALL_H = 3.3;
export const ROOF_H = 3.5;
export const PARAPET_H = 3.9;
export const FLOOR_Y = 0.05;

/* shared materials ------------------------------------------------ */
const M = {};
function mats() {
  if (M.ready) return M;
  M.wall = toon(C.wallCream, { rim: 0x8fb4e0, rimStrength: 0.28, emissive: 0x2a2620, emissiveIntensity: 0.35 });
  M.wallIn = toon(C.wallWarm, { rim: 0xffd9a0, rimStrength: 0.22, emissive: 0x3a2f22, emissiveIntensity: 0.55 });
  M.base = toon(0x9aa0aa, { rim: 0x7fa0cc, rimStrength: 0.3 });
  M.parapet = toon(0xd8d4c8, { rim: 0x8fb4e0, rimStrength: 0.35 });
  M.mullion = toon(0x5c6470, { rim: 0x9fc0e8, rimStrength: 0.3 });
  M.metal = toon(C.metal, { rim: 0xa8c4e8, rimStrength: 0.4 });
  M.metalDark = toon(C.metalDark, { rim: 0x8fa8cc, rimStrength: 0.35 });
  M.floor = toon(0xffffff, { map: T.interiorFloor(), rim: 0xffd9a0, rimStrength: 0.14, emissive: 0x2b2419, emissiveIntensity: 0.4 });
  M.ceiling = toon(0xf6f4ee, { rim: 0xffd9a0, rimStrength: 0.18, emissive: 0x3a3326, emissiveIntensity: 0.7 });
  M.shelfBody = toon(0xe6e2d6, { rim: 0xffd9a0, rimStrength: 0.2, emissive: 0x2c271c, emissiveIntensity: 0.4 });
  M.shelfEdge = toon(0x7d848f, { rim: 0x9fb8d8, rimStrength: 0.3 });
  M.cooler = toon(0xdfe6ec, { rim: 0xa9d6f0, rimStrength: 0.35, emissive: 0x243038, emissiveIntensity: 0.5 });
  M.counter = toon(0xe4e0d3, { rim: 0xffd9a0, rimStrength: 0.25, emissive: 0x2c271c, emissiveIntensity: 0.45 });
  M.counterTop = toon(0xb9b2a2, { rim: 0xffd9a0, rimStrength: 0.3 });
  M.steel = toon(0xb7bec7, { rim: 0xbcd8f5, rimStrength: 0.45 });
  M.register = toon(0x40474f, { rim: 0x9fc0e8, rimStrength: 0.4 });
  M.coffee = toon(0x33383f, { rim: 0xa8c4e8, rimStrength: 0.4 });
  M.ready = true;
  return M;
}

/* glass with rain running down it --------------------------------- */
export function rainGlassMaterial(tint = 0x9fd0e8, opacity = 0.16) {
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: new THREE.Color(tint) },
      uOpacity: { value: opacity },
      uWet: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4( position, 1.0 );
        vWorld = wp.xyz;
        vNormalW = normalize( mat3( modelMatrix ) * normal );
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3  uTint;
      uniform float uOpacity;
      uniform float uWet;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying vec3 vNormalW;

      float hash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }

      float droplets( vec2 uv, float t, float cols, float rows, float speed ) {
        vec2 gv = vec2( uv.x * cols, uv.y * rows );
        vec2 id = floor( gv );
        float r1 = hash( id );
        float r2 = hash( id + 11.3 );
        float acc = 0.0;
        // main droplet
        float py = fract( r1 - t * ( 0.30 + r2 * 0.55 ) * speed );
        float fy = fract( gv.y );
        float wob = sin( t * 2.0 + r2 * 6.28 ) * 0.05;
        float dx = fract( gv.x ) - 0.5 - wob;
        float dy = fy - py;
        float d = length( vec2( dx * 1.6, dy * 0.55 ) );
        acc += smoothstep( 0.20, 0.02, d ) * ( 0.55 + r2 * 0.45 );
        // the wet trail it leaves behind
        float above = fy - py;
        if ( above > 0.0 && above < 0.8 && abs( dx ) < 0.22 ) {
          acc += ( 1.0 - above / 0.8 ) * 0.16 * ( 0.4 + r2 * 0.6 );
        }
        return acc;
      }

      void main() {
        // two layers of running water + static beads
        float t = uTime;
        float d1 = droplets( vUv, t, 14.0, 3.0, 1.0 );
        float d2 = droplets( vUv * 1.7 + 0.37, t * 1.35, 9.0, 2.0, 0.6 );
        vec2 sp = vUv * 26.0;
        float beads = smoothstep( 0.55, 0.95, hash( floor( sp ) * 0.7 ) ) *
                      smoothstep( 0.35, 0.0, length( fract( sp ) - 0.5 ) );

        float wetMask = clamp( d1 + d2 * 0.7 + beads * 0.35, 0.0, 1.4 ) * uWet;

        // fresnel haze so the pane reads as glass from grazing angles
        vec3 V = normalize( cameraPosition - vWorld );
        float fres = pow( 1.0 - clamp( abs( dot( normalize( vNormalW ), V ) ), 0.0, 1.0 ), 2.5 );

        vec3 col = uTint * 0.35 + vec3( 0.75, 0.85, 1.0 ) * wetMask * 0.85;
        float a = uOpacity + wetMask * 0.30 + fres * 0.30;
        col += vec3( 0.55, 0.68, 0.85 ) * fres * 0.5;
        gl_FragColor = vec4( col, clamp( a, 0.0, 0.92 ) );
        #include <colorspace_fragment>
      }
    `,
  });
  mat.userData.noShadow = true;
  return mat;
}

/* ------------------------------------------------------------------ *
 *  product instancing (shelves)
 * ------------------------------------------------------------------ */

const productPalette = [
  0xe8534f, 0x4f86e8, 0x3fa86a, 0xf0b13c, 0x8b5fd6, 0x43b8c4,
  0xe0729b, 0xdfe4ea, 0xf5f0e2, 0x6a8f52, 0xe08b4a, 0x5f7fa8,
];

export function productBatch(items) {
  const geo = box(1, 1, 1);
  const mat = toon(0xffffff, { rim: 0xffd9a0, rimStrength: 0.16, emissive: 0x241f16, emissiveIntensity: 0.35 });
  const inst = new THREE.InstancedMesh(geo, mat, items.length);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  items.forEach((it, i) => {
    m4.makeScale(it.s[0], it.s[1], it.s[2]);
    m4.setPosition(it.p[0], it.p[1], it.p[2]);
    inst.setMatrixAt(i, m4);
    col.setHex(it.c ?? pick(productPalette));
    inst.setColorAt(i, col);
  });
  inst.instanceMatrix.needsUpdate = true;
  if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  return inst;
}

/* ------------------------------------------------------------------ *
 *  shelves
 * ------------------------------------------------------------------ */

function shelfIsland(ctx, { len, x, z, ry = 0, levels = 4, depth = 0.86, height = 1.66 }) {
  const m = mats();
  const g = group(0, 0, 0);
  g.position.set(x, 0, z);
  g.rotation.y = ry;

  const bodyH = height;
  // side panels
  const side = mesh(box(0.06, bodyH, depth), m.shelfBody, -len / 2, bodyH / 2, 0);
  outline(side, 0.016);
  g.add(side);
  const side2 = side.clone();
  side2.position.x = len / 2;
  g.add(side2);
  // back panel
  const back = mesh(box(len, bodyH, 0.05), m.shelfBody, 0, bodyH / 2, -depth / 2 + 0.03);
  g.add(back);

  const items = [];
  const levelH = (bodyH - 0.12) / levels;
  for (let l = 0; l < levels; l++) {
    const y = 0.16 + l * levelH;
    const board = mesh(box(len, 0.05, depth - 0.06), m.shelfEdge, 0, y, 0.02);
    g.add(board);
    // price rail
    const rail = mesh(box(len, 0.035, 0.03), m.shelfEdge, 0, y + 0.055, depth / 2 - 0.03);
    g.add(rail);

    const n = Math.max(4, Math.round(len / 0.30));
    for (let i = 0; i < n; i++) {
      const px = -len / 2 + 0.16 + i * ((len - 0.32) / (n - 1));
      const cnt = 1 + Math.floor(rnd() * 2);
      for (let k = 0; k < cnt; k++) {
        const h = range(0.20, 0.30);
        const w = range(0.13, 0.21);
        const d = range(0.12, 0.20);
        items.push({
          p: [px + range(-0.02, 0.02), y + 0.025 + h / 2 + 0.05, range(-0.10, 0.16) + k * 0.005],
          s: [w, h, d],
          c: pick(productPalette),
        });
      }
    }
  }

  // header board with a price tag
  const header = mesh(box(len, 0.16, 0.04), m.shelfBody, 0, bodyH + 0.08, depth / 2 - 0.02);
  g.add(header);

  ctx.interior.add(g);
  return items;
}

/* ------------------------------------------------------------------ *
 *  interior
 * ------------------------------------------------------------------ */

function buildInterior(ctx) {
  const m = mats();
  const inner = group(0, 0, 0);
  ctx.interior = inner;
  ctx.root.add(inner);

  const ix0 = -SX + 0.12, ix1 = SX - 0.12;
  const iz0 = SZ_B + 0.12, iz1 = SZ_F - 0.12;
  const iw = ix1 - ix0, id = iz1 - iz0;

  // floor
  const floor = mesh(plane(iw, id), m.floor, (ix0 + ix1) / 2, FLOOR_Y, (iz0 + iz1) / 2);
  floor.rotation.x = -Math.PI / 2;
  inner.add(floor);

  // ceiling
  const ceil = mesh(plane(iw, id), m.ceiling, (ix0 + ix1) / 2, 3.02, (iz0 + iz1) / 2);
  ceil.rotation.x = Math.PI / 2;
  inner.add(ceil);

  // ceiling light panels
  const panelMat = flat(0xffffff, { map: T.lightPanel() });
  const panelMat2 = panelMat.clone();
  panelMat2.color.setHex(0xfff0d8);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const p = mesh(plane(1.9, 0.62), i === 1 ? panelMat2 : panelMat, -2.2 + i * 2.2, 2.985, -1.6 + j * 2.6);
      p.rotation.x = Math.PI / 2;
      inner.add(p);
      const gl = glow(0xffe6bb, 2.4, 0.22);
      gl.position.set(p.position.x, 2.9, p.position.z);
      gl.rotation.x = Math.PI / 2;
      inner.add(gl);
    }
  }

  // ---- back wall : drink coolers ----
  const coolerFront = [];
  for (let i = 0; i < 4; i++) {
    const cx = -2.55 + i * 1.72;
    const cz = iz0 + 0.42;
    const body = mesh(box(1.58, 2.16, 0.78), m.cooler, cx, 1.10, cz);
    outline(body, 0.02);
    inner.add(body);
    // glass door
    const doorTex = T.drinkShelf(i);
    const door = mesh(plane(1.42, 1.92), flat(0xffffff, { map: doorTex }), cx, 1.18, cz + 0.40);
    inner.add(door);
    door.userData.noShadow = true;
    // door frame
    const fr = mesh(box(1.5, 2.0, 0.04), m.mullion, cx, 1.18, cz + 0.415);
    fr.visible = true;
    fr.material = new THREE.MeshBasicMaterial({ color: 0x2b313a, wireframe: false, transparent: true, opacity: 0 });
    inner.add(fr);
    const frameTop = mesh(box(1.6, 0.14, 0.06), m.mullion, cx, 2.18, cz + 0.41);
    inner.add(frameTop);
    const frameBot = mesh(box(1.6, 0.14, 0.06), m.mullion, cx, 0.2, cz + 0.41);
    inner.add(frameBot);
    const frameL = mesh(box(0.08, 2.05, 0.06), m.mullion, cx - 0.74, 1.18, cz + 0.41);
    inner.add(frameL);
    const frameR = frameL.clone();
    frameR.position.x = cx + 0.74;
    inner.add(frameR);
    // inner glow of the cooler
    const cg = glow(0xbfe4ff, 2.0, 0.16);
    cg.position.set(cx, 1.2, cz + 0.6);
    inner.add(cg);
    coolerFront.push(door);
  }

  // menu light boxes above the coolers
  for (let i = 0; i < 3; i++) {
    const lb = mesh(plane(1.9, 0.95), flat(0xffffff, { map: T.menuBoard(i) }), -2.2 + i * 2.2, 2.42, iz0 + 0.06);
    inner.add(lb);
    const g = glow(0xffe0b0, 2.2, 0.18);
    g.position.set(lb.position.x, 2.42, iz0 + 0.3);
    inner.add(g);
    ctx.lightboxes.push(lb);
  }

  // ---- left wall : magazine rack ----
  const rackBase = mesh(box(0.62, 1.7, 3.0), m.shelfBody, ix0 + 0.32, 0.85, -0.2);
  outline(rackBase, 0.02);
  inner.add(rackBase);
  for (let i = 0; i < 3; i++) {
    const sl = mesh(plane(2.86, 0.42), flat(0xffffff, { map: T.magazineRack() }), ix0 + 0.64, 1.32 - i * 0.44, -0.2);
    sl.rotation.set(0, Math.PI / 2, -0.42);
    inner.add(sl);
  }
  const rackTop = mesh(box(0.68, 0.06, 3.0), m.shelfEdge, ix0 + 0.32, 1.72, -0.2);
  inner.add(rackTop);

  // ---- shelves ----
  const items = [];
  items.push(...shelfIsland(ctx, { len: 4.4, x: -0.6, z: -0.55, levels: 4 }));
  items.push(...shelfIsland(ctx, { len: 4.4, x: -0.6, z: -1.95, levels: 4 }));
  items.push(...shelfIsland(ctx, { len: 2.2, x: -2.6, z: 1.55, ry: Math.PI / 2, levels: 3, height: 1.35 }));

  // ---- open refrigerated bento case along the right window ----
  const caseBody = mesh(box(1.05, 1.05, 2.6), m.cooler, 2.72, 0.58, -0.6);
  outline(caseBody, 0.02);
  inner.add(caseBody);
  const caseTop = mesh(plane(2.5, 0.9), flat(0xffffff, { map: T.bentoCase() }), 2.72, 1.12, -0.6);
  caseTop.rotation.set(-Math.PI / 2 + 0.22, 0, Math.PI / 2);
  inner.add(caseTop);
  const caseGlass = mesh(plane(2.6, 0.5), rainGlassMaterial(0xbfe4ff, 0.10), 2.72 + 0.02, 1.32, -0.6);
  caseGlass.rotation.set(0, Math.PI / 2, -Math.PI / 2 + 0.25);
  inner.add(caseGlass);
  ctx.glassMats.push(caseGlass.material);

  // ---- oden / hot counter ----
  const oden = mesh(box(1.15, 0.95, 1.15), m.steel, 1.75, 0.48, 1.75);
  outline(oden, 0.02);
  inner.add(oden);
  const odenTop = mesh(box(1.2, 0.06, 1.2), m.counterTop, 1.75, 0.97, 1.75);
  inner.add(odenTop);
  for (let i = 0; i < 3; i++) {
    const pot = mesh(cyl(0.17, 0.17, 0.14, 14), m.steel, 1.55 + (i % 2) * 0.4, 1.02, 1.55 + Math.floor(i / 2) * 0.4);
    inner.add(pot);
    const soup = mesh(cyl(0.145, 0.145, 0.02, 14), flat(0xd9a55f), pot.position.x, 1.09, pot.position.z);
    inner.add(soup);
  }
  ctx.steamAnchors.push(new THREE.Vector3(1.75, 1.15, 1.75));

  // ---- register counter ----
  const cw = 2.9;
  const counter = mesh(box(cw, 0.95, 0.78), m.counter, -1.7, 0.48, 2.0);
  outline(counter, 0.02);
  inner.add(counter);
  const cTop = mesh(box(cw + 0.12, 0.07, 0.9), m.counterTop, -1.7, 0.97, 2.0);
  inner.add(cTop);
  // cash register
  const reg = mesh(box(0.62, 0.42, 0.52), m.register, -2.35, 1.24, 2.02);
  outline(reg, 0.014);
  inner.add(reg);
  const regScreen = mesh(plane(0.34, 0.2), flat(0x8fd8ff), -2.35, 1.36, 1.75);
  inner.add(regScreen);
  const regScreen2 = mesh(plane(0.3, 0.16), flat(0x2b3a4a), -2.35, 1.24, 2.3);
  regScreen2.rotation.x = -0.5;
  inner.add(regScreen2);
  // coffee machine on the back bar
  const backBar = mesh(box(3.0, 0.9, 0.5), m.counter, -1.6, 0.45, 0.95);
  inner.add(backBar);
  const coffee = mesh(box(0.8, 0.72, 0.5), m.coffee, -1.0, 1.28, 0.92);
  outline(coffee, 0.014);
  inner.add(coffee);
  const coffeePanel = mesh(plane(0.5, 0.3), flat(0x7fd8ff), -1.0, 1.5, 0.66);
  inner.add(coffeePanel);
  ctx.lightboxes.push(coffeePanel);
  const coffeeCup = mesh(cyl(0.07, 0.06, 0.12, 10), flat(0xf6f1e6), -1.0, 1.02, 0.72);
  inner.add(coffeeCup);
  // hot snack case
  const snack = mesh(box(0.9, 0.66, 0.5), m.cooler, -2.2, 1.05, 0.92);
  inner.add(snack);
  const snackTop = mesh(plane(0.82, 0.42), flat(0xffffff, { map: T.bentoCase() }), -2.2, 1.38, 0.92);
  snackTop.rotation.x = -Math.PI / 2;
  inner.add(snackTop);

  // ---- back room door + lockers ----
  const doorFrame = mesh(box(1.05, 2.15, 0.12), m.mullion, -3.05, 1.08, iz0 + 0.02);
  inner.add(doorFrame);
  const doorLeaf = mesh(box(0.9, 2.0, 0.08), toon(0xbfc6cf, { rim: 0x9fc0e8, rimStrength: 0.3 }), -3.05, 1.05, iz0 + 0.06);
  inner.add(doorLeaf);
  const doorWin = mesh(plane(0.42, 0.5), flat(0xffe0b0), -3.05, 1.6, iz0 + 0.11);
  inner.add(doorWin);
  ctx.lightboxes.push(doorWin);

  // lockers
  const locker = mesh(box(0.9, 1.9, 0.5), toon(0x5f6b7a, { rim: 0x9fc0e8, rimStrength: 0.3 }), 3.05, 0.95, -2.9);
  locker.rotation.y = -Math.PI / 2;
  outline(locker, 0.018);
  inner.add(locker);

  // ---- ceiling hung price tags ----
  const tagData = [['おにぎり', '¥140'], ['弁当', '¥520'], ['コーヒー', '¥120'], ['おでん', '¥130']];
  tagData.forEach((d, i) => {
    const tag = mesh(plane(0.72, 0.36), flat(0xffffff, { map: T.priceTag(d[0], d[1]), side: THREE.DoubleSide }), -2.4 + i * 1.6, 2.32, -0.55 - (i % 2) * 1.4);
    tag.rotation.y = i % 2 ? 0.2 : -0.2;
    inner.add(tag);
    ctx.hangTags.push(tag);
  });

  // ---- posters on the inside of the glass (read from the street) ----
  for (let i = 0; i < 3; i++) {
    const p = mesh(plane(0.62, 0.92), flat(0xffffff, { map: T.poster(i) }), -2.9 + i * 2.6, 1.95, iz1 - 0.06);
    p.rotation.y = Math.PI;
    inner.add(p);
  }
  for (let i = 0; i < 2; i++) {
    const p = mesh(plane(0.6, 0.9), flat(0xffffff, { map: T.poster(i + 1) }), ix1 - 0.08, 1.9, 1.4 - i * 1.6);
    p.rotation.y = -Math.PI / 2;
    inner.add(p);
  }

  // ---- products ----
  const inst = productBatch(items);
  inner.add(inst);

  // ---- interior lighting ----
  const l1 = new THREE.PointLight(0xffd9a8, 26, 16, 2.0);
  l1.position.set(0, 2.75, 0.2);
  inner.add(l1);
  const l2 = new THREE.PointLight(0xffcf94, 16, 13, 2.0);
  l2.position.set(-2.0, 2.7, 1.4);
  inner.add(l2);
  const l3 = new THREE.PointLight(0xffe7c4, 14, 12, 2.0);
  l3.position.set(2.2, 2.7, -1.6);
  inner.add(l3);
  ctx.interiorLights = [l1, l2, l3];

  return inner;
}

/* ------------------------------------------------------------------ *
 *  exterior
 * ------------------------------------------------------------------ */

export function buildStore(ctx) {
  const m = mats();
  const root = ctx.root;

  /* ---- shell ---- */
  const wallT = 0.14;
  const wBack = mesh(box(SX * 2 + wallT, WALL_H, wallT), m.wall, 0, WALL_H / 2, SZ_B);
  outline(wBack, 0.03);
  root.add(wBack);
  const wLeft = mesh(box(wallT, WALL_H, SZ_F - SZ_B), m.wall, -SX, WALL_H / 2, (SZ_F + SZ_B) / 2);
  outline(wLeft, 0.03);
  root.add(wLeft);

  // inner faces (so the inside reads warm and finished)
  const inBack = mesh(box(SX * 2, WALL_H - 0.06, 0.02), m.wallIn, 0, WALL_H / 2, SZ_B + wallT / 2 + 0.01);
  root.add(inBack);
  const inLeft = mesh(box(0.02, WALL_H - 0.06, SZ_F - SZ_B - 0.1), m.wallIn, -SX + wallT / 2 + 0.01, WALL_H / 2, (SZ_F + SZ_B) / 2);
  root.add(inLeft);

  // front + right : low base wall, glass above
  const baseFront = mesh(box(SX * 2, 0.42, wallT), m.base, 0, 0.21, SZ_F);
  outline(baseFront, 0.022);
  root.add(baseFront);
  const baseRight = mesh(box(wallT, 0.42, SZ_F - SZ_B), m.base, SX, 0.21, (SZ_F + SZ_B) / 2);
  outline(baseRight, 0.022);
  root.add(baseRight);

  /* ---- glass ---- */
  ctx.glassMats = [];
  const glassMat = rainGlassMaterial(0xa9d8ee, 0.15);
  ctx.glassMats.push(glassMat);
  ctx.weather.glassMats.push(glassMat);

  const gFront = mesh(plane(SX * 2 - 0.06, 2.32), glassMat, 0, 0.42 + 2.32 / 2, SZ_F + wallT / 2);
  root.add(gFront);
  const gRight = mesh(plane(SZ_F - SZ_B - 0.06, 2.32), glassMat, SX + wallT / 2, 0.42 + 2.32 / 2, (SZ_F + SZ_B) / 2);
  gRight.rotation.y = Math.PI / 2;
  root.add(gRight);

  // mullions
  const mullionMat = m.mullion;
  const addBar = (w, h, d, x, y, z, ry = 0) => {
    const b = mesh(box(w, h, d), mullionMat, x, y, z);
    b.rotation.y = ry;
    root.add(b);
    outline(b, 0.012);
    return b;
  };
  for (let i = -3; i <= 3; i++) {
    addBar(0.07, 2.32, 0.09, i * 1.0, 1.58, SZ_F + wallT / 2 + 0.005);
  }
  for (let i = -3; i <= 3; i++) {
    addBar(0.09, 2.32, 0.07, SX + wallT / 2 + 0.005, 1.58, i * 1.0 + 0.05);
  }
  // horizontal rail
  addBar(SX * 2, 0.06, 0.1, 0, 2.30, SZ_F + wallT / 2 + 0.01);
  addBar(0.1, 0.06, SZ_F - SZ_B, SX + wallT / 2 + 0.01, 2.30, (SZ_F + SZ_B) / 2);
  // corner post
  addBar(0.14, 3.3, 0.14, SX, 1.65, SZ_F);

  /* ---- fascia / sign band ---- */
  const signTex = T.storeSign();
  const signTexSide = T.storeSign();
  signTexSide.repeat.set(0.9, 1);
  const signMatF = flat(0xffffff, { map: signTex });
  const signMatR = flat(0xffffff, { map: signTexSide });
  const fasciaF = mesh(box(SX * 2 + 0.2, 0.62, 0.16), m.parapet, 0, 3.06, SZ_F + 0.08);
  outline(fasciaF, 0.022);
  root.add(fasciaF);
  const signF = mesh(plane(SX * 2 + 0.04, 0.5), signMatF, 0, 3.06, SZ_F + 0.17);
  root.add(signF);
  const fasciaR = mesh(box(0.16, 0.62, SZ_F - SZ_B + 0.2), m.parapet, SX + 0.08, 3.06, (SZ_F + SZ_B) / 2);
  outline(fasciaR, 0.022);
  root.add(fasciaR);
  const signR = mesh(plane(SZ_F - SZ_B + 0.04, 0.5), signMatR, SX + 0.17, 3.06, (SZ_F + SZ_B) / 2);
  signR.rotation.y = Math.PI / 2;
  root.add(signR);

  // glow in front of the sign
  const signGlowF = glow(0xffd9a0, 6.4, 0.30, 0.7);
  signGlowF.position.set(0, 3.06, SZ_F + 0.5);
  root.add(signGlowF);
  const signGlowR = glow(0xffd9a0, 5.6, 0.26, 0.7);
  signGlowR.position.set(SX + 0.5, 3.06, -0.4);
  signGlowR.rotation.y = Math.PI / 2;
  root.add(signGlowR);
  ctx.signGlows.push(signGlowF, signGlowR);

  /* ---- roof + parapet ---- */
  const roof = mesh(box(SX * 2 + 0.5, 0.22, SZ_F - SZ_B + 0.5), m.parapet, 0, ROOF_H - 0.11, (SZ_F + SZ_B) / 2);
  outline(roof, 0.028);
  root.add(roof);
  const parapetF = mesh(box(SX * 2 + 0.5, 0.42, 0.1), m.parapet, 0, ROOF_H + 0.2, SZ_F + 0.24);
  root.add(parapetF);
  const parapetB = parapetF.clone();
  parapetB.position.z = SZ_B - 0.24;
  root.add(parapetB);
  const parapetL = mesh(box(0.1, 0.42, SZ_F - SZ_B + 0.5), m.parapet, -SX - 0.24, ROOF_H + 0.2, (SZ_F + SZ_B) / 2);
  root.add(parapetL);
  const parapetR = parapetL.clone();
  parapetR.position.x = SX + 0.24;
  root.add(parapetR);

  // roof top clutter
  const roofAC = mesh(box(1.1, 0.62, 0.8), m.metalDark, 1.6, ROOF_H + 0.31, -1.6);
  outline(roofAC, 0.02);
  root.add(roofAC);
  const roofFan = mesh(cyl(0.24, 0.24, 0.06, 16), m.metal, 1.6, ROOF_H + 0.64, -1.6);
  root.add(roofFan);
  ctx.fans.push({ mesh: roofFan, axis: 'y', speed: 2.2 });
  const vent = mesh(cyl(0.16, 0.16, 0.5, 10), m.metal, -1.4, ROOF_H + 0.25, -2.4);
  root.add(vent);
  const ventCap = mesh(cyl(0.22, 0.22, 0.08, 10), m.metal, -1.4, ROOF_H + 0.52, -2.4);
  root.add(ventCap);
  const tank = mesh(box(0.9, 0.7, 0.7), m.metalDark, -2.3, ROOF_H + 0.35, 1.2);
  outline(tank, 0.02);
  root.add(tank);

  /* ---- awning over the pavement ---- */
  const awningTex = T.awningStripe();
  awningTex.repeat.set(6, 1);
  const awMat = toon(0xffffff, { map: awningTex, rim: 0xffd9a0, rimStrength: 0.3 });
  const aw = mesh(box(7.4, 0.1, 1.5), awMat, 0.1, 2.76, 3.6);
  aw.rotation.x = 0.10;
  outline(aw, 0.022);
  root.add(aw);
  // underside
  const under = mesh(box(7.4, 0.06, 1.5), toon(0xbfc4cc, { rim: 0xffd9a0, rimStrength: 0.25 }), 0.1, 2.70, 3.6);
  under.rotation.x = 0.10;
  root.add(under);
  // fascia edge
  const edge = mesh(box(7.5, 0.24, 0.08), m.parapet, 0.1, 2.66, 4.33);
  outline(edge, 0.02);
  root.add(edge);
  // support posts
  [-3.3, 3.5].forEach((px) => {
    const post = mesh(cyl(0.07, 0.08, 2.62, 10), m.metal, px, 1.31, 4.28);
    outline(post, 0.016);
    root.add(post);
  });
  // down lights under the awning
  for (let i = 0; i < 4; i++) {
    const dz = 3.55 + (i % 2) * 0.4;
    const dl = mesh(plane(0.34, 0.14), flat(0xfff0cf), -2.7 + i * 1.8, 2.63 + (i % 2) * 0.02, dz);
    dl.rotation.x = Math.PI / 2 + 0.10;
    root.add(dl);
    const g = glow(0xffe0b0, 1.6, 0.30);
    g.position.set(dl.position.x, dl.position.y - 0.12, dl.position.z);
    g.rotation.x = Math.PI / 2;
    root.add(g);
  }
  const awLight = new THREE.PointLight(0xffd9a8, 12, 9, 2.0);
  awLight.position.set(0, 2.45, 3.5);
  root.add(awLight);
  ctx.lampLights.push({ light: awLight, base: 12 });

  // drip points along the awning edge
  for (let i = 0; i < 7; i++) {
    ctx.dripAnchors.push(new THREE.Vector3(-3.4 + i * 1.15, 2.52, 4.35));
  }

  /* ---- automatic doors ---- */
  const doorZ = SZ_F + wallT / 2 + 0.02;
  const doorFrameTop = mesh(box(2.3, 0.22, 0.2), m.mullion, -0.4, 2.42, doorZ);
  outline(doorFrameTop, 0.018);
  root.add(doorFrameTop);
  const sensor = mesh(box(0.5, 0.1, 0.16), m.metalDark, -0.4, 2.30, doorZ);
  root.add(sensor);
  const sensorLed = mesh(plane(0.1, 0.05), flat(0xff6a5a), -0.4, 2.30, doorZ + 0.09);
  root.add(sensorLed);
  ctx.blinkers.push({ mesh: sensorLed, speed: 1.6, base: 0.9 });

  const doorMat = rainGlassMaterial(0xa9d8ee, 0.14);
  ctx.glassMats.push(doorMat);
  ctx.weather.glassMats.push(doorMat);
  const doorGeo = box(0.98, 2.24, 0.06);
  const doorL = mesh(doorGeo, doorMat, -0.89, 1.14, doorZ + 0.04);
  const doorR = mesh(doorGeo, doorMat, 0.09, 1.14, doorZ + 0.04);
  const frameL = mesh(box(1.02, 2.3, 0.03), m.mullion, -0.89, 1.14, doorZ + 0.02);
  const frameR = frameL.clone();
  frameR.position.x = 0.09;
  outline(frameL, 0.014);
  outline(frameR, 0.014);
  root.add(doorL, doorR, frameL, frameR);
  // handles
  const hL = mesh(box(0.05, 0.5, 0.05), m.metal, -0.45, 1.1, doorZ + 0.10);
  const hR = hL.clone();
  hR.position.x = -0.35;
  root.add(hL, hR);
  ctx.doors = { doorL, doorR, frameL, frameR, hL, hR, closedL: -0.89, closedR: 0.09, openL: -1.86, openR: 1.06 };

  // entrance floor mat
  const mat = mesh(plane(1.5, 0.7), flat(0xffffff, { map: T.doorMat() }), -0.4, 0.02, 3.2);
  mat.rotation.x = -Math.PI / 2;
  root.add(mat);

  /* ---- corner pole + vertical sign ---- */
  const pole = mesh(cyl(0.09, 0.11, 4.6, 10), m.metalDark, SX + 0.62, 2.3, SZ_F + 0.55);
  outline(pole, 0.018);
  root.add(pole);
  const vSignTex = T.verticalSign();
  const vsFront = mesh(plane(0.86, 2.3), flat(0xffffff, { map: vSignTex }), SX + 0.62, 3.05, SZ_F + 1.0);
  root.add(vsFront);
  const vsBack = vsFront.clone();
  vsBack.position.z = SZ_F + 0.1;
  vsBack.rotation.y = Math.PI;
  root.add(vsBack);
  const vsSide = mesh(plane(0.86, 2.3), flat(0x2b3444), SX + 0.16, 3.05, SZ_F + 0.55);
  vsSide.rotation.y = -Math.PI / 2;
  root.add(vsSide);
  const vsGlow = glow(0xffd9a0, 3.4, 0.24, 0.75);
  vsGlow.position.set(SX + 0.62, 3.05, SZ_F + 1.15);
  root.add(vsGlow);
  ctx.signGlows.push(vsGlow);
  const vSignLight = new THREE.PointLight(0xffcf94, 7, 7, 2.0);
  vSignLight.position.set(SX + 0.62, 3.05, SZ_F + 0.9);
  root.add(vSignLight);

  /* ---- air-con units on the back ---- */
  [[-2.2, 1.35], [-0.6, 1.35]].forEach(([px, py]) => {
    const rackBar = mesh(box(1.0, 0.06, 0.5), m.metalDark, px, py - 0.42, SZ_B - 0.42);
    root.add(rackBar);
    const unit = mesh(box(0.94, 0.72, 0.62), toon(0xbfc5cd, { rim: 0x9fc0e8, rimStrength: 0.35 }), px, py, SZ_B - 0.55);
    outline(unit, 0.02);
    root.add(unit);
    const fanRing = mesh(cyl(0.26, 0.26, 0.06, 16), m.metalDark, px, py + 0.02, SZ_B - 0.87);
    fanRing.rotation.x = Math.PI / 2;
    root.add(fanRing);
    const fan = mesh(box(0.44, 0.08, 0.03), m.metal, px, py + 0.02, SZ_B - 0.9);
    root.add(fan);
    const fan2 = fan.clone();
    fan2.rotation.z = Math.PI / 2;
    root.add(fan2);
    ctx.fans.push({ mesh: fan, axis: 'z', speed: 3.6 }, { mesh: fan2, axis: 'z', speed: 3.6 });
  });

  /* ---- back door + service hatch ---- */
  const backDoor = mesh(box(1.0, 2.1, 0.1), m.metalDark, 2.6, 1.05, SZ_B - 0.09);
  outline(backDoor, 0.018);
  root.add(backDoor);
  const backLamp = mesh(box(0.4, 0.12, 0.14), m.metalDark, 2.6, 2.24, SZ_B - 0.2);
  root.add(backLamp);
  const backLampGlow = glow(0xffd9a0, 1.3, 0.45);
  backLampGlow.position.set(2.6, 2.16, SZ_B - 0.3);
  root.add(backLampGlow);

  /* ---- wall mounted notice board (facing the alley) ---- */
  const nb = mesh(plane(0.9, 1.12), flat(0xffffff, { map: T.noticeBoard() }), -SX - 0.09, 1.7, 0.1);
  nb.rotation.y = -Math.PI / 2;
  root.add(nb);
  const nbFrame = mesh(box(0.06, 1.24, 0.98), m.metalDark, -SX - 0.05, 1.7, 0.1);
  root.add(nbFrame);

  /* ---- warm light spilling out of the shop ---- */
  ctx.spills.push(
    { x: 0, z: 4.2, r: 5.0, color: 0xffbe72, i: 0.55 },
    { x: 4.4, z: 0.2, r: 3.2, color: 0xffbe72, i: 0.35 },
    { x: -4.2, z: 2.4, r: 2.0, color: 0xffa860, i: 0.22 }
  );

  buildInterior(ctx);
  return root;
}
