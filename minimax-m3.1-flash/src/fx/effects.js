import * as THREE from 'three';
import * as TX from '../core/textures.js';
import { STORE, STREET, INNER } from '../core/layout.js';

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/* ------------------------------------------------------------------ *
 *  涟漪池
 * ------------------------------------------------------------------ */
class RipplePool {
  constructor(scene, size = 44) {
    this.items = [];
    const geo = new THREE.RingGeometry(0.42, 0.5, 20);
    for (let i = 0; i < size; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xbcd8ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      m.renderOrder = 4;
      scene.add(m);
      this.items.push({ mesh: m, t: 0, life: 0, maxR: 0.4 });
    }
  }
  spawn(x, y, z, maxR = 0.42, life = 1.1) {
    const it = this.items.find((i) => i.life <= 0);
    if (!it) return;
    it.mesh.visible = true;
    it.mesh.position.set(x, y + 0.012, z);
    it.t = 0;
    it.life = life;
    it.maxR = maxR;
  }
  update(dt) {
    for (const it of this.items) {
      if (it.life <= 0) continue;
      it.t += dt;
      const p = it.t / it.life;
      if (p >= 1) {
        it.life = 0;
        it.mesh.visible = false;
        continue;
      }
      const s = 0.12 + p * it.maxR * 2.6;
      it.mesh.scale.set(s, s, s);
      it.mesh.material.opacity = (1 - p) * (1 - p) * 0.5;
    }
  }
}

/* ------------------------------------------------------------------ *
 *  屋檐滴水
 * ------------------------------------------------------------------ */
function buildDrips(scene, rig, ripples) {
  const count = 46;
  const geo = new THREE.SphereGeometry(0.028, 6, 5);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xcfe4ff,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const im = new THREE.InstancedMesh(geo, mat, count);
  im.frustumCulled = false;
  im.renderOrder = 5;
  scene.add(im);

  const rnd = TX.rng(8181);
  const drops = [];
  const y0 = STORE.awningY - 0.05;
  const groundY = STREET.sidewalkY;
  for (let i = 0; i < count; i++) {
    drops.push({
      x: -3.6 + rnd() * 5.3,
      z: STORE.awningZ + 0.08 + rnd() * 0.06,
      y: y0 - rnd() * 1.4,
      v: 0,
      wait: rnd() * 2.4,
    });
  }

  const d = new THREE.Object3D();
  rig.add((t, dt) => {
    for (let i = 0; i < count; i++) {
      const p = drops[i];
      if (p.wait > 0) {
        p.wait -= dt;
        d.position.set(p.x, y0 + 0.02, p.z);
        d.scale.set(0, 0, 0);
        d.updateMatrix();
        im.setMatrixAt(i, d.matrix);
        continue;
      }
      p.v += 9.0 * dt;
      p.y -= p.v * dt;
      if (p.y <= groundY) {
        ripples.spawn(p.x, groundY, p.z, 0.16, 0.55);
        p.y = y0;
        p.v = 0;
        p.wait = 0.25 + Math.random() * 2.2;
        d.scale.set(0, 0, 0);
      } else {
        d.scale.set(0.7, 1.6 + p.v * 0.1, 0.7);
      }
      d.position.set(p.x, p.y, p.z);
      d.updateMatrix();
      im.setMatrixAt(i, d.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  });
}

/* ------------------------------------------------------------------ *
 *  地面积水的随机涟漪（雨点砸落）
 * ------------------------------------------------------------------ */
function buildRainRipples(scene, rig, ripples) {
  const rnd = TX.rng(5150);
  const zones = [
    [-1.9, 3.1, 1.1], [1.4, 4.1, 0.85], [-4.6, 3.9, 1.15],
    [3.6, 0.4, 0.95], [3.5, -4.4, 1.05], [-3.4, 2.0, 0.6],
  ];
  let timer = 0;
  rig.add((t, dt) => {
    timer -= dt;
    if (timer <= 0) {
      timer = 0.045 + Math.random() * 0.05;
      const z = zones[Math.floor(Math.random() * zones.length)];
      const x = z[0] + (Math.random() - 0.5) * z[2] * 2;
      const zz = z[1] + (Math.random() - 0.5) * z[2];
      ripples.spawn(x, STREET.roadY, zz, 0.1 + Math.random() * 0.1, 0.7);
    }
  });
}

/* ------------------------------------------------------------------ *
 *  关东煮蒸汽
 * ------------------------------------------------------------------ */
function buildSteam(scene, rig) {
  const tex = TX.glowTexture('rgba(255,255,255,0.7)', 'rgba(255,255,255,0)');
  const count = 26;
  const pots = [1.22, -1.1];
  const spots = [
    [1.22, 1.15, -1.1], [1.22, 1.15, -0.6], [1.22, 1.15, -0.1],
    [1.22, 1.15, -0.85],
  ];
  const rnd = TX.rng(3131);
  const items = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: 0xf2f6ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.renderOrder = 5;
    scene.add(sp);
    const s = spots[i % spots.length];
    items.push({ sp, x: s[0], y: s[1], z: s[2], life: rnd(), speed: 0.14 + rnd() * 0.12, drift: rnd() * 0.1 });
  }
  rig.add((t, dt) => {
    for (const it of items) {
      it.life += dt * it.speed;
      if (it.life > 1) {
        it.life = 0;
        it.x = 1.22 + (Math.random() - 0.5) * 0.16;
        it.z = [-1.1, -0.6, -0.1][Math.floor(Math.random() * 3)];
      }
      const p = it.life;
      it.sp.position.set(
        it.x + Math.sin(t * 0.8 + it.drift * 10) * 0.06 * p,
        it.y + p * 0.95,
        it.z + Math.cos(t * 0.7 + it.drift * 7) * 0.05 * p
      );
      const s = 0.16 + p * 0.5;
      it.sp.scale.set(s, s * 1.25, 1);
      it.sp.material.opacity = Math.sin(p * Math.PI) * 0.22;
    }
  });
}

/* ------------------------------------------------------------------ *
 *  玻璃上的雨水滑落
 * ------------------------------------------------------------------ */
function buildGlassRain(scene, rig) {
  const tex = TX.glassRainTexture();
  const groups = [];

  const makeMat = (speed, opacity) => {
    const t = tex.clone();
    t.needsUpdate = true;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    const m = new THREE.MeshBasicMaterial({
      map: t,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    m.userData.outlineParameters = { visible: false };
    groups.push({ tex: t, speed });
    return m;
  };

  const mats = [makeMat(0.13, 0.55), makeMat(0.19, 0.42), makeMat(0.09, 0.62)];
  let mi = 0;
  const nextMat = () => mats[mi++ % mats.length];

  const fz = STORE.z1 - 0.045;
  const glassTop = STORE.glassTop;
  const glassBot = STORE.floorY + 0.08;
  const h = glassTop - glassBot;

  // 南立面
  for (const [gx0, gx1] of [[-3.42, -0.98], [0.98, 1.52]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(gx1 - gx0, h), nextMat());
    m.position.set((gx0 + gx1) / 2, (glassTop + glassBot) / 2, fz);
    m.renderOrder = 5;
    scene.add(m);
  }
  // 东立面
  const ex = STORE.x1 - 0.045;
  for (const [gz0, gz1] of [[-2.64, -1.66], [-1.54, -0.56], [-0.44, 0.54], [0.66, 1.42]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(gz1 - gz0, h), nextMat());
    m.position.set(ex, (glassTop + glassBot) / 2, (gz0 + gz1) / 2);
    m.rotation.y = Math.PI / 2;
    m.renderOrder = 5;
    scene.add(m);
  }
  // 饮料柜玻璃
  const coolerMat = nextMat();
  coolerMat.opacity = 0.3;
  const cm = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.8), coolerMat);
  cm.position.set(1.54, STORE.floorY + 1.02, -2.39);
  cm.rotation.y = Math.PI / 2;
  cm.renderOrder = 5;
  scene.add(cm);

  rig.add((t) => {
    for (const g of groups) {
      g.tex.offset.y = -(t * g.speed) % 1;
      g.tex.offset.x = (t * g.speed * 0.05) % 1;
    }
  });
}

/* ------------------------------------------------------------------ *
 *  地面薄雾
 * ------------------------------------------------------------------ */
function buildMist(scene, rig) {
  const tex = TX.glowTexture('rgba(190,215,255,0.5)', 'rgba(190,215,255,0)');
  const count = 14;
  const rnd = TX.rng(99);
  const items = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: 0x8fb0e0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const sp = new THREE.Sprite(mat);
    sp.renderOrder = 3;
    scene.add(sp);
    items.push({
      sp,
      x: -5 + rnd() * 10,
      z: -5 + rnd() * 10,
      sp0: 2.4 + rnd() * 3,
      speed: 0.05 + rnd() * 0.06,
      off: rnd() * 10,
    });
  }
  rig.add((t) => {
    for (const it of items) {
      const p = (t * it.speed + it.off) % 12;
      it.sp.position.set(
        -6 + ((it.x + 6 + p * 0.4) % 12),
        0.35 + Math.sin(t * 0.3 + it.off) * 0.12,
        -6 + ((it.z + 6 + p * 0.25) % 12)
      );
      const s = it.sp0;
      it.sp.scale.set(s, s * 0.45, 1);
      it.sp.material.opacity = 0.055;
    }
  });
}

/* ------------------------------------------------------------------ *
 *  组装
 * ------------------------------------------------------------------ */
export function buildEffects(scene, rig) {
  const ripples = new RipplePool(scene, 46);
  buildDrips(scene, rig, ripples);
  buildRainRipples(scene, rig, ripples);
  buildSteam(scene, rig);
  buildGlassRain(scene, rig);
  buildMist(scene, rig);

  rig.add((t, dt) => ripples.update(dt));
  return ripples;
}
