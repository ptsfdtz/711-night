import * as THREE from 'three'

const gradientData = new Uint8Array([40, 40, 40, 255, 120, 120, 120, 255, 220, 220, 220, 255, 255, 255, 255, 255])
export const gradientMap = new THREE.DataTexture(gradientData, 4, 1, THREE.RGBAFormat)
gradientMap.needsUpdate = true
gradientMap.minFilter = THREE.NearestFilter
gradientMap.magFilter = THREE.NearestFilter

export function toon(color, opts = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  })
}

export function glow(color, intensity = 1) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    transparent: true,
    opacity: 0.95,
  })
}

export function glassMat(tint = 0xb8d4e8, opacity = 0.18) {
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    transparent: true,
    opacity,
    roughness: 0.08,
    metalness: 0,
    reflectivity: 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  })
}

const outlineMaterialCache = new Map()
function outlineMat(color = 0x1a1220) {
  if (!outlineMaterialCache.has(color)) {
    outlineMaterialCache.set(color, new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }))
  }
  return outlineMaterialCache.get(color)
}

export function withOutline(mesh, thickness = 0.018, color = 0x1a1220) {
  const group = new THREE.Group()
  group.add(mesh)
  const outline = new THREE.Mesh(mesh.geometry, outlineMat(color))
  outline.scale.setScalar(1 + thickness)
  outline.position.copy(mesh.position)
  outline.rotation.copy(mesh.rotation)
  outline.renderOrder = -1
  group.add(outline)
  group.userData.outline = outline
  group.userData.base = mesh
  return group
}

export function outlinedBox(w, h, d, material, thickness = 0.018) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const mesh = new THREE.Mesh(geo, material)
  return withOutline(mesh, thickness)
}

export function outlinedCylinder(rt, rb, h, seg, material, thickness = 0.02) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material)
  return withOutline(mesh, thickness)
}

export function addOutlineTo(group, thickness = 0.018) {
  group.traverse((obj) => {
    if (obj.isMesh && obj.material && !obj.material.side === THREE.BackSide) return
    if (obj.isMesh && obj.material && obj.material.side !== THREE.BackSide && !obj.userData.isOutline) {
      const outline = new THREE.Mesh(obj.geometry, outlineMat())
      outline.scale.setScalar(1 + thickness)
      outline.position.copy(obj.position)
      outline.rotation.copy(obj.rotation)
      outline.quaternion.copy(obj.quaternion)
      outline.userData.isOutline = true
      outline.renderOrder = -1
      obj.parent.add(outline)
    }
  })
}
