import * as THREE from 'three'
import { rainDropTexture, rippleTexture } from './textures.js'

export function createRain(count = 1800) {
  const group = new THREE.Group()
  const positions = new Float32Array(count * 3)
  const speeds = new Float32Array(count)
  const area = 24
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * area
    positions[i * 3 + 1] = Math.random() * 16
    positions[i * 3 + 2] = (Math.random() - 0.5) * area
    speeds[i] = 0.18 + Math.random() * 0.22
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    map: rainDropTexture(),
    color: 0xb8d4f0,
    size: 0.18,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  })
  const points = new THREE.Points(geo, mat)
  group.add(points)

  const lineCount = 400
  const linePos = new Float32Array(lineCount * 6)
  const lineSpeed = new Float32Array(lineCount)
  for (let i = 0; i < lineCount; i++) {
    const x = (Math.random() - 0.5) * area
    const y = Math.random() * 14
    const z = (Math.random() - 0.5) * area
    const len = 0.35 + Math.random() * 0.4
    linePos[i * 6] = x
    linePos[i * 6 + 1] = y
    linePos[i * 6 + 2] = z
    linePos[i * 6 + 3] = x - 0.03
    linePos[i * 6 + 4] = y + len
    linePos[i * 6 + 5] = z
    lineSpeed[i] = 0.25 + Math.random() * 0.25
  }
  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
  const lineMat = new THREE.LineBasicMaterial({
    color: 0xa8c8e8,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const lines = new THREE.LineSegments(lineGeo, lineMat)
  group.add(lines)

  group.userData = {
    count,
    speeds,
    area,
    lineCount,
    lineSpeed,
    points,
    lines,
    floorY: 0.15,
  }
  return group
}

export function createEaveDrips(positions) {
  const group = new THREE.Group()
  const drops = []
  const mat = new THREE.MeshBasicMaterial({
    color: 0xc8e0ff,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  for (const p of positions) {
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mat)
      mesh.position.set(p.x + (Math.random() - 0.5) * p.w, p.y, p.z)
      mesh.scale.y = 1.8
      group.add(mesh)
      drops.push({
        mesh,
        x: p.x + (Math.random() - 0.5) * p.w,
        y: p.y,
        z: p.z,
        speed: 0.08 + Math.random() * 0.1,
        offset: Math.random() * 2,
      })
    }
  }
  group.userData.drops = drops
  return group
}

export function createRipples(puddles) {
  const group = new THREE.Group()
  const tex = rippleTexture()
  const ripples = []
  for (const p of puddles) {
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(
        p.x + (Math.random() - 0.5) * p.sx * 0.8,
        0.15,
        p.z + (Math.random() - 0.5) * p.sz * 0.8
      )
      group.add(mesh)
      ripples.push({
        mesh,
        life: Math.random(),
        speed: 0.35 + Math.random() * 0.35,
        maxScale: 0.4 + Math.random() * 0.5,
        puddle: p,
      })
    }
  }
  group.userData.ripples = ripples
  return group
}

export function updateRain(rain, dt) {
  const { count, speeds, area, points, lineCount, lineSpeed, lines } = rain.userData
  const pos = points.geometry.attributes.position.array
  for (let i = 0; i < count; i++) {
    pos[i * 3 + 1] -= speeds[i] * dt * 28
    pos[i * 3] -= dt * 1.2
    if (pos[i * 3 + 1] < rain.userData.floorY) {
      pos[i * 3 + 1] = 12 + Math.random() * 5
      pos[i * 3] = (Math.random() - 0.5) * area
      pos[i * 3 + 2] = (Math.random() - 0.5) * area
    }
  }
  points.geometry.attributes.position.needsUpdate = true

  const lpos = lines.geometry.attributes.position.array
  for (let i = 0; i < lineCount; i++) {
    const fall = lineSpeed[i] * dt * 30
    lpos[i * 6 + 1] -= fall
    lpos[i * 6 + 4] -= fall
    lpos[i * 6] -= dt * 1.2
    lpos[i * 6 + 3] -= dt * 1.2
    if (lpos[i * 6 + 4] < rain.userData.floorY) {
      const x = (Math.random() - 0.5) * area
      const y = 11 + Math.random() * 4
      const z = (Math.random() - 0.5) * area
      const len = 0.35 + Math.random() * 0.4
      lpos[i * 6] = x
      lpos[i * 6 + 1] = y
      lpos[i * 6 + 2] = z
      lpos[i * 6 + 3] = x - 0.03
      lpos[i * 6 + 4] = y + len
      lpos[i * 6 + 5] = z
    }
  }
  lines.geometry.attributes.position.needsUpdate = true
}

export function updateDrips(drips, t) {
  for (const d of drips.userData.drops) {
    const cycle = (t * d.speed + d.offset) % 1
    d.mesh.position.y = d.y - cycle * 2.4
    d.mesh.position.x = d.x - cycle * 0.15
    d.mesh.visible = cycle > 0.05
    d.mesh.scale.set(1, 1.5 + cycle * 1.5, 1)
  }
}

export function updateRipples(ripples, dt) {
  for (const r of ripples.userData.ripples) {
    r.life += dt * r.speed
    if (r.life > 1) {
      r.life = 0
      const p = r.puddle
      r.mesh.position.set(
        p.x + (Math.random() - 0.5) * p.sx * 0.9,
        0.15,
        p.z + (Math.random() - 0.5) * p.sz * 0.9
      )
    }
    const s = 0.15 + r.life * r.maxScale
    r.mesh.scale.set(s * 1.4, s, 1)
    r.mesh.material.opacity = Math.sin(r.life * Math.PI) * 0.45
  }
}

export function updateSignFlicker(signMesh, sideSign, signLight, t) {
  let v = 0.5 + Math.sin(t * 2.2) * 0.04 + Math.sin(t * 7.1) * 0.02
  const glitch = Math.sin(t * 13.7) * Math.sin(t * 3.3)
  if (glitch > 0.96) v *= 0.35
  if (Math.sin(t * 0.7) > 0.995) v *= 0.6
  signMesh.material.emissiveIntensity = v
  sideSign.material.emissiveIntensity = v * 0.75
  signLight.intensity = 1.1 + v * 0.8
}

export function updateDoor(doorL, doorR, t) {
  const cycle = t % 14
  let open = 0
  if (cycle > 3 && cycle < 7) {
    open = Math.sin(((cycle - 3) / 4) * Math.PI)
    open = Math.min(1, open * 1.8)
  } else if (cycle > 10 && cycle < 12) {
    open = Math.sin(((cycle - 10) / 2) * Math.PI) * 0.7
  }
  doorL.position.x = -open * 0.85
  doorR.position.x = open * 0.85
}

export function updateGlassStreaks(streaks, dt) {
  for (const s of streaks) {
    const map = s.userData.scrollMat.map
    map.offset.y -= dt * 0.08
  }
}

export function updateTraffic(traffic, t) {
  const { lights, point } = traffic.userData
  const phase = t % 12
  let active = 'green'
  if (phase < 5) active = 'green'
  else if (phase < 6.5) active = 'yellow'
  else active = 'red'
  const colors = { red: 0xff3333, yellow: 0xffcc33, green: 0x33ff66 }
  for (const key of Object.keys(lights)) {
    const on = key === active
    lights[key].material.opacity = on ? 0.95 : 0.18
    lights[key].material.color.setHex(colors[key])
    if (on) {
      point.color.setHex(colors[key])
      point.intensity = 0.35
    }
  }
}

export function updatePuddleShimmer(puddleGroup, t) {
  puddleGroup.children.forEach((child, i) => {
    if (child.material && child.material.opacity !== undefined && i % 2 === 1) {
      child.material.opacity = 0.08 + Math.sin(t * 1.3 + i) * 0.04
    }
  })
}

export function updateAcFan(fan, t) {
  fan.rotation.z = t * 8
}
