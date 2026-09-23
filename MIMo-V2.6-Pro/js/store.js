import * as THREE from 'three'
import { toon, glow, glassMat, withOutline, outlinedBox, outlinedCylinder } from './materials.js'
import {
  storeSignTexture,
  bannerTexture,
  posterTexture,
  magazineTexture,
  floorGuideTexture,
  menuBoardTexture,
  wetGlassTexture,
  awningStripeTexture,
} from './textures.js'

const C = {
  wall: 0xf2efe6,
  wallDark: 0xd8d2c4,
  roof: 0x3a3f4a,
  trim: 0xe85a3c,
  green: 0x1f6f4a,
  frame: 0x2c3038,
  wood: 0x8b5a2b,
  shelf: 0xd9d4c8,
  shelfLeg: 0x9a9588,
  floor: 0xe8e2d6,
  counter: 0x2f3540,
  metal: 0xb0b6be,
  fridge: 0xdfe8f0,
  yellow: 0xf5c542,
}

function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
}

function cyl(rt, rb, h, seg, mat) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat)
}

function shelfUnit(width, height, depth, rows, productSeed = 0) {
  const g = new THREE.Group()
  const body = box(width, height, depth, toon(C.shelf))
  body.position.y = height / 2
  g.add(withOutline(body, 0.012))
  const legMat = toon(C.shelfLeg)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = box(0.08, 0.12, 0.08, legMat)
      leg.position.set((sx * (width - 0.1)) / 2, 0.06, (sz * (depth - 0.1)) / 2)
      g.add(leg)
    }
  }
  const colors = [0xe85a3c, 0x4fc3f7, 0xf5c542, 0x9ccc65, 0xba68c8, 0xff8a65, 0x4dd0e1, 0xfff176, 0xf06292, 0xaed581]
  for (let r = 0; r < rows; r++) {
    const shelfY = 0.15 + ((height - 0.2) / rows) * r + (height - 0.2) / rows
    const board = box(width - 0.06, 0.04, depth + 0.04, toon(0xf5f1e6))
    board.position.y = shelfY
    g.add(board)
    const count = Math.floor(width / 0.28)
    for (let i = 0; i < count; i++) {
      const seed = (productSeed + r * 17 + i * 3) % colors.length
      const hgt = 0.14 + ((seed * 7) % 5) * 0.02
      const wdt = 0.14 + ((seed * 3) % 3) * 0.02
      const item = box(wdt, hgt, depth * 0.55, toon(colors[seed]))
      item.position.set(-width / 2 + 0.18 + i * 0.28, shelfY + 0.02 + hgt / 2, 0)
      if (seed % 3 === 0) {
        const can = cyl(0.05, 0.05, 0.16, 10, toon(colors[(seed + 4) % colors.length]))
        can.position.copy(item.position)
        can.position.y = shelfY + 0.1
        g.add(can)
      } else {
        g.add(item)
      }
    }
  }
  return g
}

function drinkCooler(width = 2.4, height = 2.1) {
  const g = new THREE.Group()
  const shell = box(width, height, 0.7, toon(C.fridge))
  shell.position.y = height / 2
  g.add(withOutline(shell, 0.012))
  const header = box(width * 0.98, 0.28, 0.1, glow(0xbfe8ff, 0.9))
  header.position.set(0, height - 0.18, 0.38)
  g.add(header)
  const doors = 3
  for (let i = 0; i < doors; i++) {
    const dw = width / doors - 0.08
    const frame = box(dw, height - 0.5, 0.06, toon(0x2c3038))
    frame.position.set(-width / 2 + width / doors * (i + 0.5), (height - 0.3) / 2 + 0.05, 0.36)
    g.add(frame)
    const pane = box(dw - 0.08, height - 0.6, 0.04, glassMat(0xcfefff, 0.22))
    pane.position.copy(frame.position)
    pane.position.z = 0.4
    g.add(pane)
    for (let s = 0; s < 5; s++) {
      const shelfY = 0.3 + s * ((height - 0.6) / 5)
      const shelf = box(dw - 0.1, 0.03, 0.4, toon(0xeef3f7))
      shelf.position.set(frame.position.x, shelfY, 0.15)
      g.add(shelf)
      for (let b = 0; b < 4; b++) {
        const hue = [0x4fc3f7, 0xff8a65, 0x81c784, 0xfff176, 0xce93d8, 0x90caf9][(i * 5 + s + b) % 6]
        const bottle = cyl(0.045, 0.045, 0.14, 8, toon(hue))
        bottle.position.set(frame.position.x - (dw - 0.2) / 2 + b * ((dw - 0.2) / 3), shelfY + 0.09, 0.15)
        g.add(bottle)
      }
    }
  }
  const interiorLight = new THREE.RectAreaLight(0xcfefff, 1.2, width, height)
  interiorLight.position.set(0, height / 2, 0.5)
  interiorLight.lookAt(0, height / 2, 2)
  g.add(interiorLight)
  return g
}

function freezerUnit() {
  const g = new THREE.Group()
  const body = outlinedBox(1.8, 0.95, 0.8, toon(0xe8eef4), 0.012)
  body.position.y = 0.475
  g.add(body)
  const lid = box(1.7, 0.08, 0.7, glassMat(0xb8d8ea, 0.3))
  lid.position.y = 1.0
  g.add(lid)
  const rim = box(1.85, 0.06, 0.85, toon(0x9aa6b2))
  rim.position.y = 0.96
  g.add(rim)
  const label = box(1.5, 0.2, 0.02, glow(0x88ccff, 0.85))
  label.position.set(0, 0.7, 0.42)
  g.add(label)
  return g
}

function odenCounter() {
  const g = new THREE.Group()
  const base = outlinedBox(1.6, 0.9, 0.7, toon(C.counter), 0.012)
  base.position.y = 0.45
  g.add(base)
  const top = box(1.65, 0.08, 0.75, toon(0x4a5160))
  top.position.y = 0.94
  g.add(top)
  const broth = box(1.3, 0.06, 0.5, new THREE.MeshBasicMaterial({ color: 0xc47a3a }))
  broth.position.y = 1.0
  g.add(broth)
  const stickColors = [0xffe0b2, 0xffcc80, 0xd7ccc8, 0xfff59d, 0xbcaaa4]
  for (let i = 0; i < 10; i++) {
    const stick = cyl(0.03, 0.03, 0.28, 6, toon(stickColors[i % stickColors.length]))
    stick.position.set(-0.55 + (i % 5) * 0.28, 1.1, i < 5 ? -0.12 : 0.12)
    g.add(stick)
  }
  const lamp = box(1.4, 0.1, 0.5, glow(0xffe0a0, 0.9))
  lamp.position.set(0, 1.7, 0)
  g.add(lamp)
  const poleL = cyl(0.03, 0.03, 0.8, 6, toon(C.metal))
  poleL.position.set(-0.65, 1.3, 0)
  g.add(poleL)
  const poleR = poleL.clone()
  poleR.position.x = 0.65
  g.add(poleR)
  const hood = box(1.5, 0.06, 0.55, toon(0x555c68))
  hood.position.set(0, 1.72, 0)
  g.add(hood)
  return g
}

function coffeeStation() {
  const g = new THREE.Group()
  const body = outlinedBox(0.7, 1.0, 0.5, toon(0x3a3f4a), 0.012)
  body.position.y = 0.5
  g.add(body)
  const panel = box(0.55, 0.35, 0.04, glow(0xffc080, 0.8))
  panel.position.set(0, 0.7, 0.26)
  g.add(panel)
  const spout = cyl(0.04, 0.04, 0.12, 8, toon(C.metal))
  spout.position.set(0, 0.4, 0.22)
  g.add(spout)
  const tray = box(0.4, 0.03, 0.2, toon(0x555c68))
  tray.position.set(0, 0.22, 0.2)
  g.add(tray)
  const menu = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.45),
    new THREE.MeshBasicMaterial({ map: menuBoardTexture() })
  )
  menu.position.set(0, 1.45, 0.1)
  g.add(menu)
  return g
}

function cashierDesk() {
  const g = new THREE.Group()
  const desk = outlinedBox(2.6, 0.95, 0.8, toon(0x3d4452), 0.012)
  desk.position.y = 0.475
  g.add(desk)
  const top = box(2.7, 0.06, 0.9, toon(0x2a303a))
  top.position.y = 0.98
  g.add(top)
  const register = box(0.4, 0.28, 0.35, toon(0x1f2430))
  register.position.set(-0.7, 1.15, 0)
  g.add(register)
  const screen = box(0.32, 0.18, 0.02, glow(0x88eeff, 0.9))
  screen.position.set(-0.7, 1.18, 0.18)
  g.add(screen)
  const bagStack = box(0.3, 0.15, 0.25, toon(C.yellow))
  bagStack.position.set(0.4, 1.08, 0)
  g.add(bagStack)
  const pole = cyl(0.03, 0.03, 1.5, 8, toon(C.metal))
  pole.position.set(1.2, 0.75, -0.1)
  g.add(pole)
  const basket = cyl(0.2, 0.15, 0.25, 10, toon(0xe85a3c))
  basket.position.set(1.2, 1.55, -0.1)
  g.add(basket)
  const queueA = cyl(0.04, 0.05, 0.9, 8, toon(0xcc3333))
  queueA.position.set(-1.5, 0.45, 1.2)
  g.add(queueA)
  const queueB = queueA.clone()
  queueB.position.set(0.2, 0.45, 1.2)
  g.add(queueB)
  const belt = box(1.8, 0.04, 0.05, toon(0xf0c040))
  belt.position.set(-0.6, 0.9, 1.2)
  g.add(belt)
  return g
}

function magazineRack() {
  const g = new THREE.Group()
  for (let tier = 0; tier < 3; tier++) {
    const y = 0.25 + tier * 0.55
    const angle = -0.35 + tier * 0.12
    const frame = box(1.6, 0.08, 0.35, toon(C.wood))
    frame.position.set(0, y, 0.05 + tier * 0.08)
    frame.rotation.x = angle
    g.add(frame)
    for (let i = 0; i < 5; i++) {
      const tex = magazineTexture(tier * 5 + i)
      const mag = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.32, 0.03),
        toon(0xffffff)
      )
      mag.material.map = tex
      mag.material.needsUpdate = true
      mag.position.set(-0.6 + i * 0.3, y + 0.15, 0.12 + tier * 0.08)
      mag.rotation.x = angle
      g.add(mag)
    }
  }
  const back = box(1.6, 1.9, 0.08, toon(C.wood))
  back.position.set(0, 0.95, -0.1)
  g.add(withOutline(back, 0.01))
  return g
}

function storageLocker() {
  const g = new THREE.Group()
  const body = outlinedBox(1.4, 1.8, 0.5, toon(0x7a8494), 0.012)
  body.position.y = 0.9
  g.add(body)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      const door = box(0.55, 0.45, 0.03, toon(r % 2 ? 0x8a94a4 : 0x6a7484))
      door.position.set(-0.3 + c * 0.6, 0.4 + r * 0.55, 0.26)
      g.add(door)
      const handle = box(0.08, 0.03, 0.03, toon(0xc0c6ce))
      handle.position.set(-0.12 + c * 0.6, 0.4 + r * 0.55, 0.29)
      g.add(handle)
    }
  }
  return g
}

function backDoor() {
  const g = new THREE.Group()
  const frame = box(1.1, 2.1, 0.1, toon(0x4a5160))
  frame.position.y = 1.05
  g.add(withOutline(frame, 0.01))
  const door = box(0.95, 1.95, 0.08, toon(0x5a7a8a))
  door.position.set(0, 1.0, 0.06)
  g.add(door)
  const knob = cyl(0.03, 0.03, 0.08, 8, toon(0xd0d5dc))
  knob.rotation.z = Math.PI / 2
  knob.position.set(0.35, 1.0, 0.12)
  g.add(knob)
  const sign = box(0.5, 0.2, 0.02, toon(0xf5c542))
  sign.position.set(0, 1.7, 0.12)
  g.add(sign)
  return g
}

function ceilingLights(w, d) {
  const g = new THREE.Group()
  const cols = Math.max(2, Math.floor(w / 2.2))
  const rows = Math.max(2, Math.floor(d / 2.0))
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const panel = box(1.2, 0.06, 0.7, glow(0xfff5d8, 0.95))
      panel.position.set(-w / 2 + 1.1 + i * ((w - 2.2) / Math.max(1, cols - 1) || 0), 0, -d / 2 + 1.0 + j * ((d - 2.0) / Math.max(1, rows - 1) || 0))
      g.add(panel)
      const light = new THREE.PointLight(0xffe8b8, 0.55, 6.5, 2)
      light.position.copy(panel.position)
      light.position.y = -0.2
      g.add(light)
    }
  }
  return g
}

function onigiriCase() {
  const g = new THREE.Group()
  const base = outlinedBox(1.4, 0.85, 0.55, toon(0xe8eef4), 0.012)
  base.position.y = 0.425
  g.add(base)
  const glassTop = box(1.3, 0.35, 0.48, glassMat(0xcfefff, 0.18))
  glassTop.position.y = 1.02
  g.add(glassTop)
  const rim = box(1.4, 0.05, 0.55, toon(0x9aa6b2))
  rim.position.y = 0.87
  g.add(rim)
  const rice = toon(0xf7f3ea)
  const nori = toon(0x2a3a2a)
  for (let i = 0; i < 6; i++) {
    const tri = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.1, 0.16, 3), rice)
    tri.position.set(-0.5 + (i % 3) * 0.5, 0.98, i < 3 ? -0.12 : 0.12)
    g.add(tri)
    const wrap = box(0.08, 0.06, 0.02, nori)
    wrap.position.set(-0.5 + (i % 3) * 0.5, 0.98, i < 3 ? -0.12 : 0.12)
    g.add(wrap)
  }
  const label = box(1.1, 0.12, 0.02, glow(0xaaddff, 0.85))
  label.position.set(0, 0.7, 0.29)
  g.add(label)
  return g
}

function bentoFridge() {
  const g = new THREE.Group()
  const shell = outlinedBox(1.8, 1.5, 0.6, toon(0xdfe8f0), 0.012)
  shell.position.y = 0.75
  g.add(shell)
  const door = box(1.6, 1.1, 0.04, glassMat(0xcfefff, 0.16))
  door.position.set(0, 0.8, 0.32)
  g.add(door)
  for (let s = 0; s < 3; s++) {
    const shelfY = 0.35 + s * 0.35
    const shelf = box(1.5, 0.03, 0.4, toon(0xeef3f7))
    shelf.position.set(0, shelfY, 0.1)
    g.add(shelf)
    for (let b = 0; b < 3; b++) {
      const tray = box(0.35, 0.1, 0.28, toon([0xf5c542, 0xe85a3c, 0x81c784, 0x4fc3f7, 0xba68c8, 0xff8a65, 0xfff176, 0x90caf9, 0xaed581][s * 3 + b]))
      tray.position.set(-0.45 + b * 0.45, shelfY + 0.08, 0.1)
      g.add(tray)
    }
  }
  const header = box(1.6, 0.2, 0.06, glow(0xffe080, 0.9))
  header.position.set(0, 1.4, 0.3)
  g.add(header)
  return g
}

function hotSnackCase() {
  const g = new THREE.Group()
  const base = outlinedBox(1.1, 0.75, 0.5, toon(0x3a3f4a), 0.012)
  base.position.y = 0.375
  g.add(base)
  const warm = box(0.9, 0.2, 0.4, glow(0xffaa55, 0.85))
  warm.position.set(0, 0.85, 0.05)
  g.add(warm)
  const hood = box(1.0, 0.08, 0.48, toon(0x555c68))
  hood.position.set(0, 1.05, 0.05)
  g.add(hood)
  for (let i = 0; i < 4; i++) {
    const snack = cyl(0.06, 0.05, 0.1, 8, toon([0xffcc80, 0xe85a3c, 0xffe0b2, 0xd7ccc8][i]))
    snack.position.set(-0.3 + i * 0.2, 0.8, 0.05)
    g.add(snack)
  }
  return g
}

export function createStore() {
  const store = new THREE.Group()
  const W = 8.2
  const D = 6.2
  const H = 3.4
  const wallT = 0.12

  const floorMat = toon(C.floor)
  floorMat.map = floorGuideTexture()
  const floor = box(W, 0.08, D, floorMat)
  floor.position.y = 0.04
  store.add(floor)

  const ceil = box(W, 0.1, D, toon(0xf7f3ea))
  ceil.position.y = H
  store.add(ceil)

  const backWall = box(W, H, wallT, toon(C.wall))
  backWall.position.set(0, H / 2, -D / 2)
  store.add(withOutline(backWall, 0.01))

  const leftWall = box(wallT, H, D, toon(C.wallDark))
  leftWall.position.set(-W / 2, H / 2, 0)
  store.add(withOutline(leftWall, 0.01))

  const rightLow = box(wallT, 0.5, D, toon(C.wallDark))
  rightLow.position.set(W / 2, 0.25, 0)
  store.add(rightLow)
  const rightTop = box(wallT, 0.55, D, toon(C.wall))
  rightTop.position.set(W / 2, H - 0.28, 0)
  store.add(rightTop)
  const rightRear = box(wallT, H - 1.0, 1.6, toon(C.wallDark))
  rightRear.position.set(W / 2, (H - 0.5) / 2 + 0.25, -D / 2 + 0.8)
  store.add(rightRear)

  const frontTop = box(W, 0.55, wallT, toon(C.wall))
  frontTop.position.set(0, H - 0.28, D / 2)
  store.add(frontTop)

  const mullionMat = toon(C.frame)
  const mullionXs = [-W / 2 + 0.08, -1.1, 0, 1.1, W / 2 - 0.08]
  for (const x of mullionXs) {
    const m = box(0.1, H - 0.5, 0.1, mullionMat)
    m.position.set(x, (H - 0.5) / 2 + 0.05, D / 2)
    store.add(m)
  }
  const sill = box(W, 0.1, 0.1, mullionMat)
  sill.position.set(0, 0.1, D / 2)
  store.add(sill)
  const lintel = box(W, 0.1, 0.1, mullionMat)
  lintel.position.set(0, H - 0.5, D / 2)
  store.add(lintel)

  const glassTex = wetGlassTexture()
  glassTex.wrapS = glassTex.wrapT = THREE.RepeatWrapping
  const glassMatBase = glassMat(0xb8d4e8, 0.1)

  function windowPane(x, w) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, H - 0.65), glassMatBase.clone())
    pane.position.set(x, (H - 0.55) / 2 + 0.08, D / 2 + 0.02)
    store.add(pane)
    const streakMat = new THREE.MeshBasicMaterial({
      map: glassTex.clone(),
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
    streakMat.map.repeat.set(1, 2)
    const streaks = new THREE.Mesh(new THREE.PlaneGeometry(w, H - 0.65), streakMat)
    streaks.position.copy(pane.position)
    streaks.position.z += 0.01
    streaks.userData.scrollMat = streakMat
    store.add(streaks)
    return streaks
  }

  function sidePane(z, d) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(d, H - 0.65), glassMatBase.clone())
    pane.position.set(W / 2 + 0.02, (H - 0.55) / 2 + 0.08, z)
    pane.rotation.y = Math.PI / 2
    store.add(pane)
    const streakMat = new THREE.MeshBasicMaterial({
      map: glassTex.clone(),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
    streakMat.map.repeat.set(1, 2)
    const streaks = new THREE.Mesh(new THREE.PlaneGeometry(d, H - 0.65), streakMat)
    streaks.position.copy(pane.position)
    streaks.position.x += 0.01
    streaks.rotation.y = Math.PI / 2
    streaks.userData.scrollMat = streakMat
    store.add(streaks)
    return streaks
  }

  const streaks = []
  streaks.push(windowPane(-3.2, 1.5))
  streaks.push(windowPane(-1.65, 1.35))
  streaks.push(windowPane(1.65, 1.35))
  streaks.push(windowPane(3.2, 1.5))
  streaks.push(sidePane(0.6, 3.6))
  streaks.push(sidePane(-1.5, 1.0))

  for (const z of [-2.2, -0.4, 1.4, 2.4]) {
    const m = box(0.1, H - 0.5, 0.1, toon(C.frame))
    m.position.set(W / 2, (H - 0.5) / 2 + 0.05, z)
    store.add(m)
  }

  const doorFrame = box(2.0, 2.5, 0.16, toon(C.frame))
  doorFrame.position.set(0, 1.25, D / 2)
  store.add(doorFrame)

  const doorGroup = new THREE.Group()
  doorGroup.position.set(0, 0.08, D / 2 + 0.02)
  const doorL = new THREE.Group()
  const doorR = new THREE.Group()
  const panelMat = glassMat(0xc5e0f0, 0.12)
  function doorLeaf(sign) {
    const leaf = new THREE.Group()
    const gx = sign * 0.47
    const pane = box(0.82, 2.2, 0.03, panelMat)
    pane.position.set(gx, 1.15, 0)
    leaf.add(pane)
    const frameMat = toon(C.frame)
    const edgeOuter = box(0.08, 2.3, 0.06, frameMat)
    edgeOuter.position.set(gx + sign * 0.42, 1.15, 0)
    leaf.add(edgeOuter)
    const edgeInner = box(0.06, 2.3, 0.06, frameMat)
    edgeInner.position.set(gx - sign * 0.42, 1.15, 0)
    leaf.add(edgeInner)
    const top = box(0.9, 0.08, 0.06, frameMat)
    top.position.set(gx, 2.28, 0)
    leaf.add(top)
    const bot = box(0.9, 0.08, 0.06, frameMat)
    bot.position.set(gx, 0.04, 0)
    leaf.add(bot)
    const bar = box(0.5, 0.1, 0.02, toon(0xf5c542))
    bar.position.set(gx, 1.0, 0.04)
    leaf.add(bar)
    return leaf
  }
  doorL.add(doorLeaf(-1))
  doorR.add(doorLeaf(1))
  doorGroup.add(doorL, doorR)
  store.add(doorGroup)

  const sensor = box(0.5, 0.12, 0.15, toon(0x2c3038))
  sensor.position.set(0, 2.55, D / 2 + 0.05)
  store.add(sensor)
  const sensorDot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), glow(0x33ff66, 1.2))
  sensorDot.position.set(0, 2.55, D / 2 + 0.14)
  store.add(sensorDot)

  const matRug = box(2.4, 0.03, 0.9, toon(0x2a6f4a))
  matRug.position.set(0, 0.06, D / 2 + 0.7)
  store.add(withOutline(matRug, 0.015))
  const matText = box(1.6, 0.01, 0.3, toon(0xf5f1e6))
  matText.position.set(0, 0.08, D / 2 + 0.7)
  store.add(matText)

  const awning = new THREE.Group()
  const awnMat = toon(0xffffff)
  awnMat.map = awningStripeTexture()
  awnMat.map.wrapS = THREE.RepeatWrapping
  awnMat.map.repeat.set(4, 1)
  awnMat.needsUpdate = true
  const awnCloth = box(W + 0.4, 0.08, 1.4, awnMat)
  awnCloth.position.set(0, H - 0.55, D / 2 + 0.65)
  awnCloth.rotation.x = 0.12
  awning.add(withOutline(awnCloth, 0.012))
  const awnEdge = box(W + 0.4, 0.18, 0.08, toon(C.green))
  awnEdge.position.set(0, H - 0.65, D / 2 + 1.35)
  awning.add(awnEdge)
  store.add(awning)

  const fascia = box(W + 0.3, 0.7, 0.3, toon(C.wall))
  fascia.position.set(0, H + 0.25, D / 2 - 0.05)
  store.add(withOutline(fascia, 0.01))

  const signMesh = new THREE.Mesh(
    new THREE.BoxGeometry(W * 0.95, 0.85, 0.12),
    toon(0xffffff)
  )
  signMesh.material.map = storeSignTexture()
  signMesh.material.emissive = new THREE.Color(0xfff2cc)
  signMesh.material.emissiveIntensity = 0.55
  signMesh.material.needsUpdate = true
  signMesh.position.set(0, H + 0.9, D / 2 + 0.05)
  store.add(withOutline(signMesh, 0.015))
  const signLight = new THREE.RectAreaLight(0xffe8b0, 1.4, W * 0.9, 0.8)
  signLight.position.set(0, H + 0.8, D / 2 + 0.4)
  signLight.lookAt(0, H + 0.2, D / 2 + 3)
  store.add(signLight)

  const sideSign = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 1.2), toon(0xffffff))
  sideSign.material.map = bannerTexture()
  sideSign.material.emissive = new THREE.Color(0xffe8c0)
  sideSign.material.emissiveIntensity = 0.4
  sideSign.material.needsUpdate = true
  sideSign.position.set(-W / 2 - 0.1, H * 0.55, D / 2 - 1.5)
  store.add(withOutline(sideSign, 0.012))

  const roof = box(W + 0.5, 0.25, D + 0.5, toon(C.roof))
  roof.position.y = H + 0.55
  store.add(withOutline(roof, 0.012))
  const roofLip = box(W + 0.7, 0.1, D + 0.7, toon(0x2c3038))
  roofLip.position.y = H + 0.72
  store.add(roofLip)

  const acUnit = new THREE.Group()
  const acBody = outlinedBox(0.9, 0.7, 0.45, toon(0xd8dde4), 0.012)
  acBody.position.y = 0.35
  acUnit.add(acBody)
  const acFan = cyl(0.22, 0.22, 0.05, 16, toon(0x555c68))
  acFan.rotation.x = Math.PI / 2
  acFan.position.set(0, 0.4, 0.24)
  acUnit.add(acFan)
  const acGrill = cyl(0.24, 0.24, 0.02, 16, toon(0x888f98))
  acGrill.rotation.x = Math.PI / 2
  acGrill.position.set(0, 0.4, 0.26)
  acUnit.add(acGrill)
  acUnit.position.set(-W / 2 + 1.2, H + 0.85, -D / 2 + 0.6)
  store.add(acUnit)

  const acUnit2 = acUnit.clone()
  acUnit2.position.set(W / 2 - 1.2, 0, -D / 2 - 0.35)
  acUnit2.position.y = 1.8
  store.add(acUnit2)

  const interior = new THREE.Group()
  interior.add(ceilingLights(W - 0.6, D - 0.6))
  const ceilingLightsGroup = interior.children[0]
  ceilingLightsGroup.position.y = H - 0.15

  const coolers = drinkCooler(2.5, 2.15)
  coolers.position.set(-2.4, 0, -D / 2 + 0.5)
  interior.add(coolers)

  const coolers2 = drinkCooler(2.0, 2.0)
  coolers2.position.set(2.6, 0, -D / 2 + 0.5)
  interior.add(coolers2)

  const shelf1 = shelfUnit(3.4, 1.8, 0.7, 4, 1)
  shelf1.position.set(-0.4, 0, -0.8)
  interior.add(shelf1)

  const shelf2 = shelfUnit(3.0, 1.7, 0.7, 4, 7)
  shelf2.position.set(0.6, 0, 1.1)
  shelf2.rotation.y = Math.PI
  interior.add(shelf2)

  const shelf3 = shelfUnit(1.6, 1.2, 0.55, 3, 13)
  shelf3.position.set(-2.8, 0, 1.3)
  interior.add(shelf3)

  const shelf4 = shelfUnit(1.8, 1.0, 0.5, 2, 21)
  shelf4.position.set(-1.0, 0, -2.3)
  interior.add(shelf4)

  const onigiri = onigiriCase()
  onigiri.position.set(-1.5, 0, 0.5)
  onigiri.rotation.y = Math.PI
  interior.add(onigiri)

  const bento = bentoFridge()
  bento.position.set(0.8, 0, -2.3)
  interior.add(bento)

  const hot = hotSnackCase()
  hot.position.set(2.6, 0, 1.8)
  interior.add(hot)

  const freezer = freezerUnit()
  freezer.position.set(3.2, 0, 1.5)
  freezer.rotation.y = -Math.PI / 2
  interior.add(freezer)

  const oden = odenCounter()
  oden.position.set(1.8, 0, -2.0)
  interior.add(oden)

  const coffee = coffeeStation()
  coffee.position.set(2.9, 0, -0.2)
  coffee.rotation.y = -Math.PI / 2
  interior.add(coffee)

  const cashier = cashierDesk()
  cashier.position.set(-1.8, 0, 1.9)
  cashier.rotation.y = Math.PI
  interior.add(cashier)

  const mags = magazineRack()
  mags.position.set(-3.4, 0, 0.3)
  mags.rotation.y = Math.PI / 2
  interior.add(mags)

  const locker = storageLocker()
  locker.position.set(-3.4, 0, -1.8)
  locker.rotation.y = Math.PI / 2
  interior.add(locker)

  const bdoor = backDoor()
  bdoor.position.set(2.0, 0, -D / 2 + 0.08)
  interior.add(bdoor)

  for (let i = 0; i < 4; i++) {
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), new THREE.MeshBasicMaterial({ map: posterTexture(i) }))
    poster.position.set(-W / 2 + 0.08, 1.6, -1.8 + i * 1.0)
    poster.rotation.y = Math.PI / 2
    interior.add(poster)
  }
  for (let i = 0; i < 3; i++) {
    const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.65, 0.9), new THREE.MeshBasicMaterial({ map: posterTexture(i + 2) }))
    poster.position.set(-1.5 + i * 1.3, 1.7, -D / 2 + 0.08)
    interior.add(poster)
  }

  const wallLight = new THREE.PointLight(0xffe0a0, 1.1, 12, 2)
  wallLight.position.set(0, H - 0.4, 0)
  interior.add(wallLight)
  const warmFill = new THREE.PointLight(0xffd090, 0.8, 10, 2)
  warmFill.position.set(0, 1.5, 1.5)
  interior.add(warmFill)

  store.add(interior)

  const step = box(2.8, 0.08, 0.5, toon(0xb8b2a4))
  step.position.set(0, 0.04, D / 2 + 0.35)
  store.add(step)

  store.userData = {
    doorL,
    doorR,
    signMesh,
    sideSign,
    signLight,
    streaks,
    acFan,
    width: W,
    depth: D,
    height: H,
  }

  return store
}
