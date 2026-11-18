import * as THREE from 'three'
import { toon, glow, glassMat, withOutline, outlinedBox, outlinedCylinder } from './materials.js'
import {
  roadTexture,
  crosswalkTexture,
  vendingFrontTexture,
  bulletinTexture,
  posterTexture,
} from './textures.js'

const C = {
  concrete: 0xb8b2a4,
  asphalt: 0x2a2c33,
  curb: 0xd0cabc,
  white: 0xf0eee6,
  red: 0xe85a3c,
  metal: 0x8a929c,
  dark: 0x2c3038,
  green: 0x1f6f4a,
  yellow: 0xf5c542,
  wood: 0x8b5a2b,
  wall: 0x6a6e78,
  wall2: 0x555a66,
}

function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
}

function cyl(rt, rb, h, seg, mat) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
}

export function createBase() {
  const g = new THREE.Group()
  const S = 22
  const baseH = 1.1

  const slab = box(S, baseH, S, toon(0x3a3640))
  slab.position.y = -baseH / 2
  g.add(withOutline(slab, 0.01))

  const top = box(S - 0.15, 0.08, S - 0.15, toon(0x4a4652))
  top.position.y = 0.04
  g.add(top)

  const rim = box(S + 0.05, 0.1, S + 0.05, toon(0x2a2830))
  rim.position.y = -0.02
  g.add(rim)

  const cornerMat = toon(0xc9a86a)
  for (const [x, z] of [
    [-S / 2, -S / 2],
    [S / 2, -S / 2],
    [-S / 2, S / 2],
    [S / 2, S / 2],
  ]) {
    const cap = box(0.5, 0.12, 0.5, cornerMat)
    cap.position.set(x * 0.97, 0.02, z * 0.97)
    g.add(cap)
  }

  return g
}

export function createStreets() {
  const g = new THREE.Group()
  const roadMat = toon(0xffffff)
  roadMat.map = roadTexture()
  roadMat.needsUpdate = true

  const frontRoad = box(21, 0.06, 7, roadMat)
  frontRoad.position.set(0, 0.08, 6.5)
  g.add(frontRoad)

  const sideRoad = box(7, 0.06, 14, roadMat.clone())
  sideRoad.material.map = roadTexture()
  sideRoad.position.set(-7.5, 0.08, -1.5)
  g.add(sideRoad)

  const sidewalk = box(21, 0.16, 3.2, toon(C.concrete))
  sidewalk.position.set(0, 0.12, 1.2)
  g.add(withOutline(sidewalk, 0.008))

  const sideWalk2 = box(3.2, 0.16, 10, toon(C.concrete))
  sideWalk2.position.set(-3.5, 0.12, -3.5)
  g.add(sideWalk2)

  const cornerWalk = box(7.5, 0.16, 7.5, toon(C.concrete))
  cornerWalk.position.set(1.2, 0.12, -1.8)
  g.add(cornerWalk)

  const storePad = box(9.5, 0.14, 7.5, toon(0xc4beb0))
  storePad.position.set(0.4, 0.11, -0.4)
  g.add(storePad)

  const curbMat = toon(C.curb)
  const curb1 = box(21, 0.2, 0.25, curbMat)
  curb1.position.set(0, 0.1, 2.75)
  g.add(curb1)
  const curb2 = box(0.25, 0.2, 10, curbMat)
  curb2.position.set(-5.0, 0.1, -3.5)
  g.add(curb2)

  const yellowLine = box(18, 0.02, 0.12, toon(C.yellow))
  yellowLine.position.set(1, 0.12, 5.0)
  g.add(yellowLine)

  const whiteLine = box(18, 0.02, 0.08, toon(C.white))
  whiteLine.position.set(1, 0.12, 7.8)
  g.add(whiteLine)

  const cwMat = new THREE.MeshBasicMaterial({
    map: crosswalkTexture(),
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  })
  const crosswalk = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 6.5), cwMat)
  crosswalk.rotation.x = -Math.PI / 2
  crosswalk.position.set(-6.8, 0.13, 6.5)
  g.add(crosswalk)

  const crosswalk2 = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 4.5), cwMat.clone())
  crosswalk2.rotation.x = -Math.PI / 2
  crosswalk2.rotation.z = Math.PI / 2
  crosswalk2.position.set(-7.5, 0.13, -0.5)
  g.add(crosswalk2)

  const drainMat = toon(0x4a5058)
  for (let i = 0; i < 6; i++) {
    const drain = box(1.2, 0.04, 0.35, drainMat)
    drain.position.set(-4 + i * 1.6, 0.12, 2.55)
    g.add(drain)
    for (let s = 0; s < 5; s++) {
      const slot = box(0.08, 0.02, 0.3, toon(0x1a1c22))
      slot.position.set(-4.4 + i * 1.6 + s * 0.2, 0.145, 2.55)
      g.add(slot)
    }
  }
  const drain2 = box(0.35, 0.04, 4.5, drainMat)
  drain2.position.set(-5.3, 0.12, -1.5)
  g.add(drain2)

  const parking = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const line = box(0.08, 0.02, 2.8, toon(C.white))
    line.position.set(4.5 + i * 1.8, 0.12, 7.2)
    parking.add(line)
  }
  const parkBack = box(5.4, 0.02, 0.08, toon(C.white))
  parkBack.position.set(6.3, 0.12, 5.85)
  parking.add(parkBack)
  const parkNum = box(0.6, 0.01, 0.6, toon(0xf5c542))
  parkNum.position.set(5.4, 0.13, 7.2)
  parking.add(parkNum)
  g.add(parking)

  const rail = new THREE.Group()
  const railMat = toon(C.metal)
  for (let i = 0; i < 5; i++) {
    const post = cyl(0.06, 0.06, 0.7, 8, railMat)
    post.position.set(-2 + i * 1.2, 0.45, 2.55)
    rail.add(withOutline(post, 0.03))
  }
  const bar = box(5.0, 0.08, 0.08, railMat)
  bar.position.set(0.4, 0.75, 2.55)
  rail.add(bar)
  const bar2 = box(5.0, 0.06, 0.06, toon(C.white))
  bar2.position.set(0.4, 0.5, 2.55)
  rail.add(bar2)
  g.add(rail)

  const rail2 = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const post = cyl(0.06, 0.06, 0.7, 8, railMat)
    post.position.set(-5.1, 0.45, -4.5 + i * 1.3)
    rail2.add(withOutline(post, 0.03))
  }
  const bar3 = box(0.08, 0.08, 4.2, railMat)
  bar3.position.set(-5.1, 0.75, -2.5)
  rail2.add(bar3)
  g.add(rail2)

  const cornerGuard = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const seg = box(0.2, 0.35, 1.1, toon(i % 2 ? C.white : C.red))
    seg.position.set(-5.2, 0.3, 3.5 + i * 1.1)
    seg.rotation.y = 0.3
    cornerGuard.add(withOutline(seg, 0.02))
  }
  g.add(cornerGuard)

  const curbPaint = box(0.3, 0.35, 3.2, toon(C.yellow))
  curbPaint.position.set(4.2, 0.3, 2.7)
  g.add(curbPaint)

  return g
}

export function createPuddles() {
  const g = new THREE.Group()
  const spots = [
    [-2, 0.135, 5.5, 2.8, 1.6],
    [3.5, 0.135, 7.0, 2.2, 1.3],
    [-6.5, 0.135, 4.8, 1.8, 1.2],
    [-7.2, 0.135, -1.5, 1.5, 2.4],
    [0.5, 0.14, 3.4, 1.6, 0.9],
    [6.8, 0.135, 8.2, 2.0, 1.1],
  ]
  const puddles = []
  for (const [x, y, z, sx, sz] of spots) {
    const geo = new THREE.CircleGeometry(1, 28)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x8eb6d8,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(x, y, z)
    mesh.scale.set(sx, sz, 1)
    g.add(mesh)
    puddles.push({ mesh, x, z, sx, sz })
    const shine = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.12, depthWrite: false })
    )
    shine.rotation.x = -Math.PI / 2
    shine.position.set(x + 0.3, y + 0.01, z - 0.2)
    shine.scale.set(sx * 0.7, sz * 0.7, 1)
    g.add(shine)
  }
  g.userData.puddles = puddles
  return g
}

export function createVendingMachine() {
  const g = new THREE.Group()
  const body = outlinedBox(1.0, 1.9, 0.7, toon(0xe85a3c), 0.015)
  body.position.y = 0.95
  g.add(body)
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.6), new THREE.MeshBasicMaterial({ map: vendingFrontTexture() }))
  front.position.set(0, 1.0, 0.36)
  g.add(front)
  const glowFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 1.5),
    new THREE.MeshBasicMaterial({ color: 0xaad4ff, transparent: true, opacity: 0.12, depthWrite: false })
  )
  glowFace.position.set(0, 1.0, 0.38)
  g.add(glowFace)
  const topper = box(1.0, 0.2, 0.65, glow(0xffffff, 0.9))
  topper.position.set(0, 1.95, 0.05)
  g.add(topper)
  const light = new THREE.PointLight(0x88c8ff, 0.5, 4, 2)
  light.position.set(0, 1.2, 0.8)
  g.add(light)
  const legL = box(0.08, 0.08, 0.6, toon(C.dark))
  legL.position.set(-0.35, 0.04, 0)
  g.add(legL)
  const legR = legL.clone()
  legR.position.x = 0.35
  g.add(legR)
  return g
}

export function createBicycle() {
  const g = new THREE.Group()
  const frameMat = toon(0x2a6f8a)
  const wheelMat = toon(0x1a1c22)
  const wheelGeo = new THREE.TorusGeometry(0.32, 0.03, 8, 20)
  const w1 = new THREE.Mesh(wheelGeo, wheelMat)
  w1.position.set(-0.5, 0.34, 0)
  w1.rotation.y = Math.PI / 2
  g.add(withOutline(w1, 0.03))
  const w2 = new THREE.Mesh(wheelGeo, wheelMat)
  w2.position.set(0.5, 0.34, 0)
  w2.rotation.y = Math.PI / 2
  g.add(withOutline(w2, 0.03))
  const bar = cyl(0.02, 0.02, 1.0, 6, frameMat)
  bar.rotation.z = Math.PI / 2
  bar.position.set(0, 0.55, 0)
  g.add(bar)
  const down = cyl(0.02, 0.02, 0.55, 6, frameMat)
  down.rotation.z = 0.6
  down.position.set(0.15, 0.5, 0)
  g.add(down)
  const seatPost = cyl(0.02, 0.02, 0.35, 6, frameMat)
  seatPost.position.set(-0.15, 0.7, 0)
  g.add(seatPost)
  const seat = box(0.22, 0.06, 0.1, toon(0x2c3038))
  seat.position.set(-0.15, 0.9, 0)
  g.add(seat)
  const stem = cyl(0.015, 0.015, 0.3, 6, frameMat)
  stem.rotation.z = -0.3
  stem.position.set(0.45, 0.7, 0)
  g.add(stem)
  const handle = cyl(0.015, 0.015, 0.35, 6, toon(0x333))
  handle.rotation.x = Math.PI / 2
  handle.position.set(0.5, 0.88, 0)
  g.add(handle)
  const basket = box(0.25, 0.18, 0.2, toon(C.metal))
  basket.position.set(0.55, 0.7, 0)
  g.add(withOutline(basket, 0.02))
  const fender = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.02, 6, 12, Math.PI * 0.6), toon(0x3a5a6a))
  fender.position.set(0.5, 0.34, 0)
  fender.rotation.y = Math.PI / 2
  fender.rotation.z = 0.8
  g.add(fender)
  const kick = cyl(0.015, 0.015, 0.35, 6, toon(C.dark))
  kick.rotation.z = 0.4
  kick.position.set(-0.3, 0.18, 0.08)
  g.add(kick)
  return g
}

export function createUmbrellaStand() {
  const g = new THREE.Group()
  const stand = outlinedCylinder(0.22, 0.18, 0.55, 12, toon(0x555c68), 0.02)
  stand.position.y = 0.275
  g.add(stand)
  const rim = cyl(0.24, 0.24, 0.04, 12, toon(0x3a3f4a))
  rim.position.y = 0.55
  g.add(rim)
  const umbColors = [0x3355aa, 0xaa3355, 0x33aa66, 0xddaa22]
  for (let i = 0; i < 4; i++) {
    const stick = cyl(0.015, 0.015, 0.7, 6, toon(0x222))
    stick.position.set(-0.08 + i * 0.05, 0.7, -0.05 + i * 0.04)
    stick.rotation.z = (i - 1.5) * 0.08
    g.add(stick)
    const tip = cyl(0.04, 0.01, 0.15, 8, toon(umbColors[i]))
    tip.position.set(-0.08 + i * 0.05, 1.05, -0.05 + i * 0.04)
    g.add(tip)
  }
  const folded = cyl(0.06, 0.04, 0.5, 8, toon(0x2a4a6a))
  folded.position.set(0.12, 0.55, 0.1)
  folded.rotation.z = 0.15
  g.add(folded)
  return g
}

export function createTrashCan() {
  const g = new THREE.Group()
  const body = outlinedCylinder(0.28, 0.24, 0.7, 12, toon(0x4a6a5a), 0.02)
  body.position.y = 0.35
  g.add(body)
  const lid = cyl(0.3, 0.3, 0.06, 12, toon(0x2c3038))
  lid.position.y = 0.72
  g.add(lid)
  const hole = cyl(0.12, 0.12, 0.02, 12, toon(0x111))
  hole.position.y = 0.76
  g.add(hole)
  const band = cyl(0.285, 0.285, 0.05, 12, toon(C.white))
  band.position.y = 0.45
  g.add(band)
  return g
}

export function createStreetLamp() {
  const g = new THREE.Group()
  const base = outlinedCylinder(0.18, 0.22, 0.15, 10, toon(0x3a3f4a), 0.02)
  base.position.y = 0.08
  g.add(base)
  const pole = cyl(0.06, 0.08, 3.6, 8, toon(0x4a5160))
  pole.position.y = 1.9
  g.add(withOutline(pole, 0.03))
  const arm = cyl(0.04, 0.04, 1.2, 8, toon(0x4a5160))
  arm.rotation.z = Math.PI / 2
  arm.position.set(0.55, 3.6, 0)
  g.add(arm)
  const head = box(0.55, 0.18, 0.3, toon(0x2c3038))
  head.position.set(1.1, 3.5, 0)
  g.add(withOutline(head, 0.02))
  const bulb = box(0.4, 0.06, 0.2, glow(0xffe0a0, 1.0))
  bulb.position.set(1.1, 3.38, 0)
  g.add(bulb)
  const light = new THREE.PointLight(0xffd090, 1.3, 10, 2)
  light.position.set(1.1, 3.2, 0)
  light.castShadow = true
  g.add(light)
  return g
}

export function createUtilityPole() {
  const g = new THREE.Group()
  const pole = outlinedCylinder(0.1, 0.14, 6.5, 8, toon(0x6a6258), 0.025)
  pole.position.y = 3.25
  g.add(pole)
  for (const y of [5.2, 5.7]) {
    const arm = box(1.8, 0.08, 0.08, toon(0x5a544c))
    arm.position.set(0, y, 0)
    g.add(arm)
    for (const x of [-0.7, -0.25, 0.25, 0.7]) {
      const ins = cyl(0.04, 0.05, 0.12, 6, toon(0x88aacc))
      ins.position.set(x, y + 0.1, 0)
      g.add(ins)
    }
  }
  const boxTrans = box(0.45, 0.6, 0.35, toon(0x8a9088))
  boxTrans.position.set(0.3, 3.8, 0.1)
  g.add(withOutline(boxTrans, 0.02))
  const transformer = cyl(0.18, 0.18, 0.5, 10, toon(0x6a7078))
  transformer.position.set(-0.35, 4.3, 0.05)
  g.add(transformer)
  const stickers = box(0.2, 0.3, 0.02, toon(C.yellow))
  stickers.position.set(0, 1.2, 0.12)
  g.add(stickers)
  return g
}

export function createWires() {
  const g = new THREE.Group()
  const mat = new THREE.MeshBasicMaterial({ color: 0x1a1c22 })
  function wire(points, radius = 0.015) {
    const curve = new THREE.CatmullRomCurve3(points)
    const geo = new THREE.TubeGeometry(curve, 20, radius, 5, false)
    const mesh = new THREE.Mesh(geo, mat)
    g.add(mesh)
    return mesh
  }
  const topY = 5.5
  wire([
    new THREE.Vector3(-8, topY, -4),
    new THREE.Vector3(-3, topY - 0.4, -3.5),
    new THREE.Vector3(2, topY - 0.2, -3.8),
    new THREE.Vector3(8, topY - 0.6, -4.2),
  ])
  wire([
    new THREE.Vector3(-8, topY - 0.3, -4),
    new THREE.Vector3(-2, topY - 0.7, -3.4),
    new THREE.Vector3(4, topY - 0.5, -3.9),
    new THREE.Vector3(9, topY - 0.9, -4.5),
  ])
  wire([
    new THREE.Vector3(-8, topY + 0.2, -4.1),
    new THREE.Vector3(0, topY - 0.1, -3.7),
    new THREE.Vector3(7, topY - 0.3, -4.0),
  ], 0.01)
  wire([
    new THREE.Vector3(-8.2, 4.8, -4),
    new THREE.Vector3(-7.8, 4.2, 0),
    new THREE.Vector3(-7.5, 3.8, 5),
    new THREE.Vector3(-7, 3.5, 10),
  ], 0.012)
  return g
}

export function createRoadSign() {
  const g = new THREE.Group()
  const pole = cyl(0.04, 0.04, 1.6, 8, toon(0x8a929c))
  pole.position.y = 0.8
  g.add(pole)
  const signA = box(0.7, 0.5, 0.04, toon(0x2a6f8a))
  signA.position.set(0, 1.5, 0)
  g.add(withOutline(signA, 0.02))
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshBasicMaterial({ map: posterTexture(0) }))
  face.position.set(0, 1.5, 0.03)
  g.add(face)
  const signB = box(0.55, 0.4, 0.04, toon(C.yellow))
  signB.position.set(0, 1.0, 0)
  g.add(withOutline(signB, 0.02))
  return g
}

export function createTrafficLight() {
  const g = new THREE.Group()
  const pole = cyl(0.05, 0.06, 2.8, 8, toon(0x3a3f4a))
  pole.position.y = 1.4
  g.add(pole)
  const arm = cyl(0.04, 0.04, 1.4, 8, toon(0x3a3f4a))
  arm.rotation.z = Math.PI / 2
  arm.position.set(0.65, 2.7, 0)
  g.add(arm)
  const housing = box(0.28, 0.7, 0.22, toon(0x2c3038))
  housing.position.set(1.2, 2.35, 0)
  g.add(withOutline(housing, 0.02))
  const lights = {}
  const colors = { red: 0xff3333, yellow: 0xffcc33, green: 0x33ff66 }
  let i = 0
  for (const key of ['red', 'yellow', 'green']) {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(0.08, 12),
      new THREE.MeshBasicMaterial({ color: colors[key], transparent: true, opacity: 0.25 })
    )
    m.position.set(1.2, 2.55 - i * 0.22, 0.12)
    g.add(m)
    const hood = box(0.14, 0.04, 0.08, toon(0x1a1c22))
    hood.position.set(1.2, 2.62 - i * 0.22, 0.1)
    g.add(hood)
    lights[key] = m
    i++
  }
  const point = new THREE.PointLight(colors.green, 0.25, 4, 2)
  point.position.set(1.2, 2.3, 0.3)
  g.add(point)
  g.userData.lights = lights
  g.userData.point = point
  return g
}

export function createAlley() {
  const g = new THREE.Group()
  const wallA = box(0.3, 4.5, 7, toon(C.wall))
  wallA.position.set(-6.2, 2.25, -5.5)
  g.add(withOutline(wallA, 0.01))
  const wallB = box(0.3, 3.8, 7, toon(C.wall2))
  wallB.position.set(-3.6, 1.9, -5.5)
  g.add(withOutline(wallB, 0.01))
  const floor = box(2.5, 0.06, 7, toon(0x3a3c44))
  floor.position.set(-4.9, 0.1, -5.5)
  g.add(floor)
  for (let i = 0; i < 3; i++) {
    const win = box(0.08, 0.6, 0.5, glow(0xffcc88, 0.5))
    win.position.set(-6.0, 2.0 + (i % 2) * 1.0, -7 + i * 2.0)
    g.add(win)
  }
  const lamp = box(0.15, 0.15, 0.15, glow(0xffe0a0, 0.8))
  lamp.position.set(-4.9, 2.8, -3.5)
  g.add(lamp)
  const alleyLight = new THREE.PointLight(0xffd090, 0.35, 5, 2)
  alleyLight.position.set(-4.9, 2.6, -3.5)
  g.add(alleyLight)
  const pipe = cyl(0.05, 0.05, 4.0, 8, toon(0x5a6068))
  pipe.position.set(-6.0, 2.0, -2.5)
  g.add(pipe)
  const dumpster = outlinedBox(1.2, 0.8, 0.8, toon(0x3a5a4a), 0.015)
  dumpster.position.set(-4.8, 0.5, -7.5)
  g.add(dumpster)
  return g
}

export function createBulletinBoard() {
  const g = new THREE.Group()
  const frame = outlinedBox(1.6, 1.3, 0.1, toon(C.wood), 0.015)
  frame.position.y = 1.0
  g.add(frame)
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 1.05), new THREE.MeshBasicMaterial({ map: bulletinTexture() }))
  board.position.set(0, 1.0, 0.06)
  g.add(board)
  const roof = box(1.8, 0.08, 0.3, toon(0x3a3f4a))
  roof.position.set(0, 1.7, 0)
  roof.rotation.x = 0.15
  g.add(roof)
  const postL = box(0.1, 0.45, 0.1, toon(C.wood))
  postL.position.set(-0.6, 0.22, 0)
  g.add(postL)
  const postR = postL.clone()
  postR.position.x = 0.6
  g.add(postR)
  return g
}

export function createSmallBuildings() {
  const g = new THREE.Group()
  const b1 = outlinedBox(5.5, 5.5, 5.0, toon(0x5a6070), 0.01)
  b1.position.set(6.5, 2.75, -5.5)
  g.add(b1)
  const b1w = [0, 1, 2]
  for (const i of b1w) {
    for (const j of [0, 1]) {
      const lit = (i + j) % 3 !== 0
      const win = box(0.7, 0.9, 0.08, lit ? glow(0xffcc88, 0.55) : toon(0x2a3038))
      win.position.set(4.5 + i * 1.4, 1.5 + j * 1.8, -3.0)
      g.add(win)
    }
  }
  const b2 = outlinedBox(4.0, 4.2, 4.0, toon(0x6a6258), 0.01)
  b2.position.set(8.5, 2.1, 0.5)
  g.add(b2)
  for (let i = 0; i < 2; i++) {
    const win = box(0.6, 0.8, 0.08, i ? glow(0xffcc88, 0.4) : toon(0x2a3038))
    win.position.set(6.45, 1.5 + i * 1.5, 0.5 + i * 0.8)
    win.rotation.y = Math.PI / 2
    g.add(win)
  }
  const fence = new THREE.Group()
  for (let i = 0; i < 8; i++) {
    const slat = box(0.08, 1.0, 0.04, toon(0x7a6a58))
    slat.position.set(3.5 + i * 0.35, 0.55, -2.8)
    fence.add(slat)
  }
  const rail = box(2.8, 0.08, 0.04, toon(0x6a5a48))
  rail.position.set(4.8, 0.95, -2.8)
  fence.add(rail)
  g.add(fence)
  return g
}

export function createCrates() {
  const g = new THREE.Group()
  const colors = [0x8b5a2b, 0xa07040, 0x6a4a28]
  for (let i = 0; i < 4; i++) {
    const c = outlinedBox(0.45, 0.3, 0.35, toon(colors[i % 3]), 0.02)
    c.position.set(3.8 + (i % 2) * 0.5, 0.2 + Math.floor(i / 2) * 0.32, -1.8)
    c.rotation.y = i * 0.2
    g.add(c)
  }
  return g
}

export function createPolesAndStreetFurniture() {
  const g = new THREE.Group()
  const pole = createUtilityPole()
  pole.position.set(-8.5, 0, -4)
  g.add(pole)
  const wires = createWires()
  g.add(wires)
  const lamp = createStreetLamp()
  lamp.position.set(4.5, 0, 3.2)
  lamp.rotation.y = -0.3
  g.add(lamp)
  const lamp2 = createStreetLamp()
  lamp2.position.set(-6.5, 0, 2.8)
  lamp2.rotation.y = Math.PI
  lamp2.scale.setScalar(0.9)
  g.add(lamp2)
  const traffic = createTrafficLight()
  traffic.position.set(-8.2, 0, 3.0)
  traffic.rotation.y = 0.4
  g.add(traffic)
  const sign = createRoadSign()
  sign.position.set(2.8, 0, 2.6)
  g.add(sign)
  const board = createBulletinBoard()
  board.position.set(3.2, 0, -0.5)
  board.rotation.y = -0.5
  g.add(board)
  g.userData.traffic = traffic
  return g
}
