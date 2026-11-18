import * as THREE from 'three'
import { createStore } from './store.js'
import {
  createBase,
  createStreets,
  createPuddles,
  createVendingMachine,
  createBicycle,
  createUmbrellaStand,
  createTrashCan,
  createAlley,
  createSmallBuildings,
  createCrates,
  createPolesAndStreetFurniture,
} from './street.js'
import {
  createRain,
  createEaveDrips,
  createRipples,
  updateRain,
  updateDrips,
  updateRipples,
  updateSignFlicker,
  updateDoor,
  updateGlassStreaks,
  updateTraffic,
  updatePuddleShimmer,
  updateAcFan,
} from './effects.js'
import { toon, withOutline } from './materials.js'

export function buildWorld(scene) {
  const fog = new THREE.FogExp2(0x1a2030, 0.028)
  scene.fog = fog
  scene.background = new THREE.Color(0x121820)

  const hemi = new THREE.HemisphereLight(0x3a4a6a, 0x1a1520, 0.55)
  scene.add(hemi)

  const moon = new THREE.DirectionalLight(0x8aa0c8, 0.45)
  moon.position.set(-8, 14, 6)
  moon.castShadow = true
  moon.shadow.mapSize.set(1024, 1024)
  moon.shadow.camera.left = -14
  moon.shadow.camera.right = 14
  moon.shadow.camera.top = 14
  moon.shadow.camera.bottom = -14
  moon.shadow.bias = -0.0008
  scene.add(moon)

  const coolFill = new THREE.DirectionalLight(0x4a6a9a, 0.25)
  coolFill.position.set(6, 8, -6)
  scene.add(coolFill)

  const ambientBlue = new THREE.AmbientLight(0x2a3850, 0.35)
  scene.add(ambientBlue)

  const base = createBase()
  scene.add(base)

  const streets = createStreets()
  scene.add(streets)

  const puddleGroup = createPuddles()
  scene.add(puddleGroup)

  const store = createStore()
  store.position.set(0.2, 0.16, -0.3)
  scene.add(store)

  const vending = createVendingMachine()
  vending.position.set(5.6, 0.16, 1.4)
  vending.rotation.y = -0.35
  scene.add(vending)

  const bike = createBicycle()
  bike.position.set(2.6, 0.16, 2.0)
  bike.rotation.y = 1.15
  scene.add(bike)

  const bike2 = createBicycle()
  bike2.position.set(3.4, 0.16, 1.5)
  bike2.rotation.y = 1.3
  bike2.scale.setScalar(0.92)
  scene.add(bike2)

  const umbrella = createUmbrellaStand()
  umbrella.position.set(-1.8, 0.16, 2.5)
  scene.add(umbrella)

  const trash = createTrashCan()
  trash.position.set(4.0, 0.16, 2.4)
  scene.add(trash)

  const alley = createAlley()
  scene.add(alley)

  const buildings = createSmallBuildings()
  scene.add(buildings)

  const crates = createCrates()
  scene.add(crates)

  const furniture = createPolesAndStreetFurniture()
  scene.add(furniture)
  const traffic = furniture.userData.traffic

  const awningY = store.position.y + store.userData.height - 0.35
  const awningZ = store.position.z + store.userData.depth / 2 + 1.2
  const awningX = store.position.x
  const drips = createEaveDrips([
    { x: awningX, y: awningY, z: awningZ, w: store.userData.width },
    { x: vending.position.x, y: 2.0, z: vending.position.z + 0.4, w: 0.9 },
    { x: -6.2, y: 4.4, z: -3.5, w: 0.5 },
  ])
  scene.add(drips)

  const ripples = createRipples(puddleGroup.userData.puddles)
  scene.add(ripples)

  const rain = createRain(1600)
  scene.add(rain)

  const groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22),
    new THREE.MeshStandardMaterial({ color: 0x2a2c33, roughness: 0.35, metalness: 0.15 })
  )
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.position.y = 0.02
  groundPlane.receiveShadow = true
  scene.add(groundPlane)

  const wetGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({
      color: 0x3a5080,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  wetGlow.rotation.x = -Math.PI / 2
  wetGlow.position.y = 0.145
  scene.add(wetGlow)

  const storeGlow = new THREE.PointLight(0xffc080, 0.9, 14, 2)
  storeGlow.position.set(store.position.x, 1.2, store.position.z + 4.5)
  scene.add(storeGlow)

  const warmSpill = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 4),
    new THREE.MeshBasicMaterial({
      color: 0xffc080,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  warmSpill.rotation.x = -Math.PI / 2
  warmSpill.position.set(store.position.x, 0.155, store.position.z + 4.2)
  scene.add(warmSpill)

  const signSpill = new THREE.Mesh(
    new THREE.PlaneGeometry(7, 2.2),
    new THREE.MeshBasicMaterial({
      color: 0xffe0a0,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  )
  signSpill.rotation.x = -Math.PI / 2
  signSpill.position.set(store.position.x, 0.158, store.position.z + 2.8)
  scene.add(signSpill)

  const neonBounce = new THREE.PointLight(0x66aaff, 0.3, 10, 2)
  neonBounce.position.set(5.6, 1.0, 3.0)
  scene.add(neonBounce)

  const reflectStrips = new THREE.Group()
  const stripColors = [0xffc080, 0x88c8ff, 0xff8a66, 0xffe0a0, 0x66aaff]
  const stripSpots = [
    [0.5, 5.2, 0.5, 3.5],
    [3.8, 6.4, 0.35, 2.2],
    [-3.5, 5.8, 0.4, 2.8],
    [5.8, 7.4, 0.3, 1.8],
    [-6.8, 5.0, 0.35, 2.5],
    [-7.2, -1.0, 0.3, 2.0],
  ]
  stripSpots.forEach(([x, z, w, h], i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: stripColors[i % stripColors.length],
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
    strip.rotation.x = -Math.PI / 2
    strip.position.set(x, 0.15, z)
    reflectStrips.add(strip)
  })
  scene.add(reflectStrips)

  const steamGroup = new THREE.Group()
  const steamMat = new THREE.MeshBasicMaterial({
    color: 0xffe8c8,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const steams = []
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), steamMat.clone())
    s.position.set(1.8 + (Math.random() - 0.5) * 0.6, 1.2 + Math.random() * 0.5, -2.3 + (Math.random() - 0.5) * 0.3)
    steamGroup.add(s)
    steams.push({ mesh: s, offset: Math.random() * 6, speed: 0.3 + Math.random() * 0.3 })
  }
  scene.add(steamGroup)

  const clock = { t: 0 }

  function update(dt) {
    clock.t += dt
    const t = clock.t
    updateRain(rain, dt)
    updateDrips(drips, t)
    updateRipples(ripples, dt)
    updateSignFlicker(store.userData.signMesh, store.userData.sideSign, store.userData.signLight, t)
    updateDoor(store.userData.doorL, store.userData.doorR, t)
    updateGlassStreaks(store.userData.streaks, dt)
    updateTraffic(traffic, t)
    updatePuddleShimmer(puddleGroup, t)
    updateAcFan(store.userData.acFan, t)
    reflectStrips.children.forEach((strip, i) => {
      strip.material.opacity = 0.07 + Math.sin(t * 1.4 + i * 0.8) * 0.035
    })
    steams.forEach((s) => {
      const p = (t * s.speed + s.offset) % 2
      s.mesh.position.y = 1.15 + p * 0.6
      s.mesh.scale.setScalar(0.6 + p * 0.5)
      s.mesh.material.opacity = Math.sin((p / 2) * Math.PI) * 0.14
    })
  }

  return { update, store, rain, traffic }
}
