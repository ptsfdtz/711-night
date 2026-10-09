import * as THREE from 'three';
import { toon, flat, glow } from '../core/materials.js';
import { box, group, rand, clamp, easeInOut } from '../core/utils.js';
import { posterTexture } from '../core/textures.js';

/* ------------------------------------------------------------------ *
 *  Automatic sliding door. Nobody is ever in frame, but the door keeps
 *  cycling open on its own — the light that spills onto the wet
 *  pavement is the strongest "someone is in there" cue in the scene.
 * ------------------------------------------------------------------ */

export function makeDoor(opts) {
  const { width, height, y, z, x, parent, frameMat, glass } = opts;
  const g = group({ x, y, z, name: 'auto-door' });

  const leafW = width / 2;
  const frameT = 0.055;
  const doorFrame = toon(0xb9bec7, {});
  const bandMat = flat(0xf3ede0, { transparent: true, opacity: 0.9 });

  const leaves = [];
  for (let i = 0; i < 2; i++) {
    const leaf = group({ name: 'leaf' + i });
    // stiles + rails
    leaf.add(box(frameT, height, 0.07, doorFrame, { x: -leafW / 2 + frameT / 2, y: height / 2 }));
    leaf.add(box(frameT, height, 0.07, doorFrame, { x: leafW / 2 - frameT / 2, y: height / 2 }));
    leaf.add(box(leafW, frameT, 0.07, doorFrame, { y: height - frameT / 2 }));
    leaf.add(box(leafW, frameT, 0.07, doorFrame, { y: frameT / 2 }));
    leaf.add(box(leafW, 0.05, 0.07, doorFrame, { y: height * 0.42 }));
    // glass
    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(leafW - frameT * 2, height - frameT * 2.2),
      glass
    );
    pane.position.set(0, height / 2, 0.005);
    pane.userData.noOutline = true;
    pane.renderOrder = 5;
    leaf.add(pane);
    // 自動 door sticker band
    const sticker = new THREE.Mesh(
      new THREE.PlaneGeometry(leafW - frameT * 2.2, 0.3),
      new THREE.MeshBasicMaterial({ map: posterTexture(2, 256, 96), transparent: true, opacity: 0.85 })
    );
    sticker.position.set(0, height * 0.52, 0.04);
    sticker.userData.noOutline = true;
    leaf.add(sticker);
    g.add(leaf);
    leaves.push(leaf);
  }

  // track the leaves ride on + the sensor head
  g.add(box(width + 0.3, 0.09, 0.16, doorFrame, { y: height + 0.06 }));
  const sensor = box(0.22, 0.09, 0.1, toon(0x2a3040, {}), { y: height + 0.07, z: 0.09 });
  g.add(sensor);
  g.add(box(0.06, 0.02, 0.02, glow(0x66ff9c, 1.6), { y: height + 0.02, z: 0.15, noOutline: true }));

  // warm spill that grows as the door opens
  const spill = new THREE.PointLight(0xffcf94, 0, 4.4, 2.0);
  spill.position.set(0, 1.2, 0.8);
  g.add(spill);

  parent.add(g);

  /* --------------------------- state machine --------------------- */
  const state = { open: 0, target: 0, timer: rand(2.5, 6.5), dir: 0, next: rand(4, 9) };

  function update(dt) {
    state.timer -= dt;
    if (state.timer <= 0) {
      if (state.open < 0.02) {
        state.target = 1;
        state.timer = rand(1.6, 2.8); // dwell open
      } else {
        state.target = 0;
        state.timer = rand(3.4, 7.0); // stay shut a while
      }
    }
    const speed = state.target > state.open ? 1.7 : 1.1;
    state.open = clamp(state.open + Math.sign(state.target - state.open) * speed * dt, 0, 1);
    const e = easeInOut(clamp(state.open, 0, 1));
    const travel = (leafW - 0.04) * e;
    leaves[0].position.x = -travel;
    leaves[1].position.x = travel;
    spill.intensity = 0.9 + e * 4.6;
    return e;
  }

  return { group: g, leaves, update, get openness() { return state.open; } };
}

/** Coir entrance mat with a printed border. */
export function makeEntryMat(w, d, y) {
  const g = group({ name: 'entry-mat' });
  const matTop = toon(0x3c414d, {});
  const border = toon(0x9aa3b2, {});
  g.add(box(w, 0.03, d, border, { y: 0.015 }));
  g.add(box(w - 0.16, 0.035, d - 0.16, matTop, { y: 0.017 }));
  // ribs
  for (let i = 0; i < 9; i++) {
    g.add(box(w - 0.2, 0.005, 0.02, toon(0x2f333d, {}), {
      y: 0.037, z: -d / 2 + 0.18 + i * ((d - 0.36) / 8), noOutline: true,
    }));
  }
  g.position.y = y + 0.004;
  return g;
}