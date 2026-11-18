/* ------------------------------------------------------------------ *
 *  Single source of truth for the diorama's footprint. Every module
 *  reads these numbers so nothing drifts out of alignment.
 *
 *  Top view (X → right, Z → toward viewer):
 *
 *        -Z  ──────────────  backdrop blocks ──────────────
 *              ┌────────┬──────────────┐
 *              │ alley  │              │
 *              ├────────┤   STORE      │▓ side walk
 *              │        │  (corner)   │▓
 *   front walk ▓▓▓▓▓▓▓▓┴──────────────┘▓
 *   ───────── road (front) ──────────▓ side road ──────────
 *              ▓▓▓ corner: crosswalk / signal ▓▓▓
 * ------------------------------------------------------------------ */

export const L = {
  base: 24,
  baseTop: 0,
  plinthDepth: 0.72,

  walkTop: 0.2, // sidewalk surface height

  store: {
    x0: -7.0,
    x1: 3.2,
    z0: -7.0,
    z1: 3.0,
    wallH: 4.55,
    parapet: 0.62,
    floorY: 0.3,
  },

  // outer edges of the sidewalk L-band
  walkFrontZ: 5.5,
  walkSideX: 5.7,

  // alley between the store's west wall and the neighbouring block
  alley: { x0: -8.8, x1: -7.0, zBack: -5.2, mouthZ: 3.0 },

  // neighbouring block (west) that forms the alley + a little shopfront glow
  neighbour: { x0: -11.4, x1: -8.8, z0: -7.0, z1: 3.0, h: 6.6 },

  // dark backdrop blocks behind the shop — kept low so the shop stays the subject
  backdrop: [
    { x0: -12.0, x1: -7.4, z0: -11.7, z1: -7.2, h: 7.2, seed: 1 },
    { x0: -7.0, x1: 0.6, z0: -11.7, z1: -7.2, h: 8.6, seed: 2 },
    { x0: 1.0, x1: 5.6, z0: -11.7, z1: -7.2, h: 5.8, seed: 3 },
  ],

  // road furniture anchors
  lamp: { x: 4.4, z: 4.3, h: 5.4 },
  vending: { x: 3.9, z: -3.4 },
  pole: { x: 5.05, z: 1.4, h: 8.6 },
  signal: { x: 9.5, z: 9.4 },
  cornerGuard: { x: 5.7, z: 5.5 },
};
