import * as THREE from 'three';
import { plane, mesh, group, glow, rnd, range, flat } from './util.js';

/* ------------------------------------------------------------------ *
 *  rain : GPU animated line segments
 * ------------------------------------------------------------------ */

function makeRain(count = 2600) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 2 * 3);
  const start = new Float32Array(count * 2 * 3);
  const speed = new Float32Array(count * 2);
  const seed = new Float32Array(count * 2);

  const AREA = 22;
  const H = 11;
  for (let i = 0; i < count; i++) {
    const x = range(-AREA / 2, AREA / 2);
    const z = range(-AREA / 2, AREA / 2);
    const y = range(0, H);
    const s = range(15, 24);
    const len = range(0.35, 0.85);
    const sd = rnd();
    for (let v = 0; v < 2; v++) {
      const k = (i * 2 + v) * 3;
      pos[k] = 0;
      pos[k + 1] = v === 0 ? 0 : -len;
      pos[k + 2] = 0;
      start[k] = x;
      start[k + 1] = y;
      start[k + 2] = z;
      speed[i * 2 + v] = s;
      seed[i * 2 + v] = sd;
    }
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 5, 0), 30);

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uH: { value: H },
      uWind: { value: 0.22 },
      uColor: { value: new THREE.Color(0xbcd8f5) },
      uOpacity: { value: 0.42 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aStart;
      attribute float aSpeed;
      attribute float aSeed;
      uniform float uTime;
      uniform float uH;
      uniform float uWind;
      varying float vAlpha;
      void main() {
        float fall = mod( aStart.y - uTime * aSpeed, uH );
        vec3 base = vec3( aStart.x + uWind * ( uH - fall ) * 0.35, fall, aStart.z );
        vec3 dir = normalize( vec3( uWind, -1.0, 0.0 ) );
        vec3 p = base + dir * position.y;
        vAlpha = smoothstep( 0.0, 1.2, fall ) * ( 0.45 + aSeed * 0.55 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        gl_FragColor = vec4( uColor, vAlpha * uOpacity );
      }
    `,
  });

  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.userData.noShadow = true;
  lines.renderOrder = 8;
  return { lines, mat };
}

/* ------------------------------------------------------------------ *
 *  splashes on the wet ground
 * ------------------------------------------------------------------ */

function makeSplashes(count = 26, ctx) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xbcd8f5,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const geo = new THREE.RingGeometry(0.05, 0.085, 18);
  const items = [];
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(geo, mat.clone());
    m.rotation.x = -Math.PI / 2;
    const src = ctx.wetSpots[Math.floor(rnd() * ctx.wetSpots.length)];
    m.position.set(src[0] + range(-src[2], src[2]), 0.012, src[1] + range(-src[3], src[3]));
    m.userData.t = rnd();
    m.userData.dur = range(0.7, 1.3);
    m.userData.max = range(0.35, 0.95);
    g.add(m);
    items.push(m);
  }
  g.userData.noShadow = true;
  return { group: g, items };
}

/* ------------------------------------------------------------------ *
 *  drips from the awnings
 * ------------------------------------------------------------------ */

function makeDrips(ctx) {
  const g = new THREE.Group();
  const mat = flat(0xcfe4f8, { transparent: true, opacity: 0.85 });
  const items = [];
  ctx.dripAnchors.forEach((a, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.032, 7, 6), mat.clone());
    m.scale.set(1, 1.7, 1);
    m.userData.origin = a.clone();
    m.userData.t = rnd();
    m.userData.speed = range(0.55, 0.95);
    m.userData.dur = range(1.1, 2.0);
    g.add(m);
    items.push(m);
  });
  return { group: g, items };
}

/* ------------------------------------------------------------------ *
 *  steam from the oden counter
 * ------------------------------------------------------------------ */

function makeSteam(ctx) {
  const g = new THREE.Group();
  const texGlow = glow(0xffe6c8, 1, 1).material.map;
  const mat = new THREE.MeshBasicMaterial({
    map: texGlow,
    color: 0xfff0dc,
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const geo = new THREE.PlaneGeometry(0.5, 0.5);
  const items = [];
  ctx.steamAnchors.forEach((anchor) => {
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(geo, mat.clone());
      m.position.copy(anchor);
      m.userData.anchor = anchor.clone();
      m.userData.t = rnd();
      m.userData.speed = range(0.16, 0.3);
      m.userData.sway = range(0.1, 0.3);
      m.userData.phase = rnd() * 6.28;
      g.add(m);
      items.push(m);
    }
  });
  g.userData.noShadow = true;
  return { group: g, items };
}

/* ------------------------------------------------------------------ *
 *  public
 * ------------------------------------------------------------------ */

export function buildWeather(scene, ctx) {
  const rain = makeRain(2600);
  scene.add(rain.lines);

  const splashes = makeSplashes(26, ctx);
  scene.add(splashes.group);

  const drips = makeDrips(ctx);
  scene.add(drips.group);

  const steam = makeSteam(ctx);
  scene.add(steam.group);

  function update(dt, t) {
    rain.mat.uniforms.uTime.value = t;

    // splashes
    for (const m of splashes.items) {
      m.userData.t += dt / m.userData.dur;
      if (m.userData.t > 1) {
        m.userData.t = 0;
        const src = ctx.wetSpots[Math.floor(rnd() * ctx.wetSpots.length)];
        m.position.set(src[0] + range(-src[2], src[2]), 0.012, src[1] + range(-src[3], src[3]));
      }
      const k = m.userData.t;
      const s = 0.2 + k * m.userData.max;
      m.scale.set(s, s, s);
      m.material.opacity = (1 - k) * 0.55;
    }

    // drips
    for (const m of drips.items) {
      const u = m.userData;
      u.t += dt / u.dur;
      if (u.t > 1) u.t -= 1;
      const k = u.t;
      const y = u.origin.y - k * u.origin.y * u.speed * 1.6;
      m.position.set(u.origin.x, Math.max(0.02, y), u.origin.z);
      const stretch = 1.0 + Math.min(2.6, k * 4.0);
      m.scale.set(1 / Math.sqrt(stretch), stretch, 1 / Math.sqrt(stretch));
      m.material.opacity = k > 0.9 ? (1 - k) * 8.5 : 0.85;
    }

    // steam
    for (const m of steam.items) {
      const u = m.userData;
      u.t += dt * u.speed;
      if (u.t > 1) u.t -= 1;
      const k = u.t;
      m.position.set(
        u.anchor.x + Math.sin(k * 3.0 + u.phase) * u.sway * k,
        u.anchor.y + k * 1.1,
        u.anchor.z + Math.cos(k * 2.2 + u.phase) * u.sway * k
      );
      const s = 0.4 + k * 1.5;
      m.scale.set(s, s, s);
      m.material.opacity = Math.sin(k * Math.PI) * 0.16;
    }
  }

  return { update, rain: rain.lines };
}
