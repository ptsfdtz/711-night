import * as THREE from 'three';

export function buildGround(c) {
  const { root, box, tube, toon, M, edges } = c;
  box(root, 26, 1.5, 26, M.base, 0, -0.75, 0, { edge: 20 });
  box(root, 27, 0.5, 27, toon(0x0d1322), 0, -1.72, 0, { edge: 20 });
  box(root, 27.6, 0.22, 27.6, toon(0x080c17), 0, -2.05, 0, { edge: 20 });

  box(root, 19.2, 0.05, 19.2, M.pad, -3.4, 0.025, -3.4, { edge: false, cast: false });
  box(root, 21.3, 0.04, 1.8, M.walk, -2.35, 0.05, 7.1, { edge: false, cast: false });
  box(root, 1.8, 0.04, 19.2, M.walk, 7.1, 0.05, -3.4, { edge: false, cast: false });
  box(root, 21.5, 0.03, 4.8, M.road, 0.75, 0.045, 10.6, { edge: false, cast: false });
  box(root, 4.8, 0.03, 19.2, M.road, 10.6, 0.045, -3.4, { edge: false, cast: false });
  box(root, 21.5, 0.13, 0.3, M.curb, 0.75, 0.065, 8.14, { edge: 40, cast: false });
  box(root, 0.3, 0.13, 19.2, M.curb, 8.14, 0.065, -3.4, { edge: 40, cast: false });

  for (let x = -12; x <= 11.6; x += 1.7) {
    box(root, 1.5, 0.02, 0.36, M.grill, x, 0.072, 7.86, { edge: false, cast: false });
    for (let i = 0; i < 3; i++) box(root, 1.3, 0.035, 0.06, M.darker, x, 0.078, 7.79 + i * 0.075, { edge: false, cast: false });
  }
  for (let z = -12.8; z <= 6; z += 1.7) {
    box(root, 0.36, 0.02, 1.5, M.grill, 7.86, 0.072, z, { edge: false, cast: false });
    for (let i = 0; i < 3; i++) box(root, 0.06, 0.035, 1.3, M.darker, 7.79 + i * 0.075, 0.078, z, { edge: false, cast: false });
  }
  for (const [mx, mz, my] of [[-2.2, 5.5, 0.055], [11.2, -6.5, 0.06], [11.6, 10.2, 0.06]]) {
    const mh = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.03, 18), M.darker);
    mh.position.set(mx, my, mz);
    root.add(mh);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.035, 6, 22), M.frameDark);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(mx, my + 0.012, mz);
    root.add(ring);
  }

  for (let i = 0; i < 6; i++) box(root, 0.42, 0.012, 4.0, M.paint, 0.6 + i * 0.78, 0.053, 10.6, { edge: false, cast: false });
  for (let i = 0; i < 6; i++) box(root, 4.0, 0.012, 0.42, M.paint, 10.6, 0.053, 9.1 + i * 0.78, { edge: false, cast: false });
  box(root, 5.2, 0.012, 0.18, M.paint, 2.35, 0.053, 8.48, { edge: false, cast: false });
  box(root, 0.18, 0.012, 5.2, M.paint, 8.48, 0.053, 11.6, { edge: false, cast: false });
  for (let x = -12.4; x <= -3; x += 2.4) box(root, 1.15, 0.01, 0.13, M.paintY, x, 0.052, 10.6, { edge: false, cast: false });
  for (let z = -12.4; z <= -1; z += 2.4) box(root, 0.13, 0.01, 1.15, M.paintY, 10.6, 0.052, z, { edge: false, cast: false });
  for (let i = 0; i < 3; i++) {
    const px = -11.6 + i * 1.75;
    box(root, 0.09, 0.012, 2.6, M.paint, px, 0.056, 4.4, { edge: false, cast: false });
    box(root, 1.75, 0.012, 0.09, M.paint, px + 0.87, 0.056, 3.1, { edge: false, cast: false });
  }
  box(root, 5.25, 0.012, 0.09, M.paint, -9.87, 0.056, 5.7, { edge: false, cast: false });
  for (let i = 0; i < 9; i++) box(root, 0.26, 0.015, 0.26, M.paintY, -0.2 + i * 0.5, 0.072, 7.55, { edge: false, cast: false });
}
