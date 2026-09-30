import * as THREE from 'three';

export function addOutline(mesh, scale = 1.03, color = 0x111122) {
  const outlineMat = new THREE.MeshBasicMaterial({ color, side: THREE.BackSide });
  const outline = new THREE.Mesh(mesh.geometry, outlineMat);
  outline.scale.multiplyScalar(scale);
  mesh.add(outline);
  return outline;
}

export function makeToon(geo, color, gradientMap) {
  const mat = new THREE.MeshToonMaterial({ color, gradientMap });
  return new THREE.Mesh(geo, mat);
}

export function makeOutline(geo, scale, color) {
  const mat = new THREE.MeshBasicMaterial({ color: color || 0x111122, side: THREE.BackSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.scale.multiplyScalar(scale || 1.03);
  return mesh;
}

export function attachOutline(mesh, scale = 1.03, color = 0x111122) {
  const outline = makeOutline(mesh.geometry, scale, color);
  mesh.add(outline);
  return outline;
}
