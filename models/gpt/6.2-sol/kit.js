import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createKit(scene) {
  const materials = new Map();
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitEdges = new THREE.EdgesGeometry(unitBox);
  const outlineMaterial = new THREE.LineBasicMaterial({ color: '#263045', transparent: true, opacity: 0.69 });

  function mat(color, options = {}) {
    const key = options.map || options.normalMap || options.userData
      ? undefined
      : JSON.stringify([color, options]);
    if (key && materials.has(key)) return materials.get(key);
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.76, ...options });
    if (key) materials.set(key, material);
    return material;
  }

  function glow(color, intensity = 1) {
    return mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.41 });
  }

  function mesh(geometry, material, x = 0, y = 0, z = 0, parent = scene) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }

  function box(w, h, d, x, y, z, material, parent = scene, outline = true) {
    const item = mesh(unitBox, material, x, y, z, parent);
    item.scale.set(w, h, d);
    if (outline && Math.min(w, h, d) > 0.026) item.add(new THREE.LineSegments(unitEdges, outlineMaterial));
    return item;
  }

  function canvasMap(w, h, paint) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(2, Math.round(w));
    canvas.height = Math.max(2, Math.round(h));
    paint(canvas.getContext('2d'), canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }

  function label(w, h, x, y, z, paint, parent = scene, options = {}) {
    const density = options.resolution ?? 200;
    const map = canvasMap(w * density, h * density, paint);
    const settings = { map, transparent: options.transparent ?? false, side: options.side ?? THREE.FrontSide };
    const material = options.lit ? mat('#ffffff', settings) : new THREE.MeshBasicMaterial(settings);
    const item = mesh(new THREE.PlaneGeometry(w, h), material, x, y, z, parent);
    item.rotation.set(options.rotationX ?? 0, options.rotationY ?? 0, options.rotationZ ?? 0);
    return item;
  }

  function line(points, color, parent = scene) {
    const vectors = points.map(point => Array.isArray(point) ? new THREE.Vector3(...point) : point);
    const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
    const material = color?.isMaterial ? color : new THREE.LineBasicMaterial({ color });
    const item = new THREE.Line(geometry, material);
    parent.add(item);
    return item;
  }

  function tube(points, radius, material, parent = scene) {
    const vectors = points.map(point => Array.isArray(point) ? new THREE.Vector3(...point) : point);
    const path = vectors.length > 2 ? new THREE.CatmullRomCurve3(vectors) : new THREE.LineCurve3(...vectors);
    const geometry = new THREE.TubeGeometry(path, Math.max(1, (vectors.length - 1) * 7), radius, 7, false);
    return mesh(geometry, material, 0, 0, 0, parent);
  }

  return { THREE, scene, box, mat, glow, mesh, line, tube, label, canvasMap };
}

export function batchStatic(root) {
  root.updateMatrixWorld(true);
  const batches = new Map();
  const rootInverse = new THREE.Matrix4().copy(root.matrixWorld).invert();

  function collect(object) {
    if (object.userData.dynamic) return;
    const material = object.material;
    if (object.isLineSegments || (object.isMesh && !object.isInstancedMesh && !Array.isArray(material)
      && !material.transparent && !material.isShaderMaterial && object.onBeforeRender === THREE.Object3D.prototype.onBeforeRender)) {
      const format = Object.keys(object.geometry.attributes).sort().join(',');
      const key = `${material.id}/${object.type}/${format}/${!!object.geometry.index}/${object.castShadow}/${object.receiveShadow}/${object.renderOrder}`;
      if (!batches.has(key)) batches.set(key, []);
      batches.get(key).push(object);
    }
    for (const child of object.children) collect(child);
  }

  // The shared outline uses standard LineSegments and can be merged even with an alpha value.
  for (const child of root.children) collect(child);
  for (const group of batches.values()) {
    if (group.length < 3) continue;
    const geometries = group.map(object => object.geometry.clone().applyMatrix4(rootInverse.clone().multiply(object.matrixWorld)));
    const geometry = mergeGeometries(geometries);
    if (!geometry) continue;
    const sample = group[0];
    const combined = sample.isLineSegments
      ? new THREE.LineSegments(geometry, sample.material)
      : new THREE.Mesh(geometry, sample.material);
    combined.castShadow = sample.castShadow;
    combined.receiveShadow = sample.receiveShadow;
    combined.renderOrder = sample.renderOrder;
    root.add(combined);
    for (const object of group) {
      if (object.children.length) {
        // Preserve independent children such as window labels and animated props.
        for (const child of [...object.children]) root.attach(child);
      }
      object.removeFromParent();
    }
  }
}
