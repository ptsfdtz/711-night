import * as THREE from 'three';
import { steamSprite } from '../core/textures.js';
import { rand } from '../core/utils.js';

/* ------------------------------------------------------------------ *
 *  Gentle steam drifting off the oden pot and the coffee machine —
 *  the detail that sells "warm food inside a cold wet street".
 * ------------------------------------------------------------------ */

export function makeSteam(parent, opts = {}) {
  const {
    count = 14,
    spread = [1.4, 0.5],
    y = 1.1,
    rise = 0.9,
    scale = 0.5,
    opacity = 0.5,
  } = opts;

  const tex = steamSprite(128);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity,
    depthWrite: false,
    fog: true,
    color: 0xfff6ea,
  });

  const puffs = [];
  for (let i = 0; i < count; i++) {
    const s = new THREE.Sprite(mat.clone());
    s.userData.noOutline = true;
    s.userData.noReflect = true;
    s.renderOrder = 3;
    parent.add(s);
    puffs.push({
      sprite: s,
      life: rand(0, 1),
      dur: rand(1.6, 2.8),
      x: rand(-spread[0] / 2, spread[0] / 2),
      z: rand(-spread[1] / 2, spread[1] / 2),
      drift: rand(-0.12, 0.12),
      sz: rand(scale * 0.6, scale * 1.25),
      peak: opacity * rand(0.7, 1.15),
    });
  }

  function update(dt, t) {
    for (const p of puffs) {
      p.life += dt / p.dur;
      if (p.life > 1) p.life -= 1;
      const k = p.life;
      const s = p.sz * (0.35 + k * 1.5);
      p.sprite.position.set(
        p.x + p.drift * k * 1.6 + Math.sin(t * 0.9 + p.z * 3) * 0.05,
        y + k * rise,
        p.z + Math.cos(t * 0.7 + p.x * 2) * 0.04
      );
      p.sprite.scale.set(s, s, 1);
      p.sprite.material.opacity = p.peak * Math.sin(Math.min(1, k * 1.6) * Math.PI) * 0.9;
    }
  }

  return { update, puffs, sprites: puffs.map((p) => p.sprite) };
}