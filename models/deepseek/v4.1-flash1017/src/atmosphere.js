/* atmosphere.js — rain, splashes and the slow weather of the little world */
(function () {
  "use strict";

  const T = THREE;

  function rainLayer(color, opacity, count, height, wind, speedMin, speedMax, lenMin, lenMax) {
    const positions = new Float32Array(count * 2 * 3);
    const end = new Float32Array(count * 2);
    const speed = new Float32Array(count * 2);
    const offset = new Float32Array(count * 2);
    const length = new Float32Array(count * 2);
    const alpha = new Float32Array(count * 2);
    const rand = NM.seedRandom(3819 + count);
    for (let i = 0; i < count; i++) {
      const x = (rand() * 2 - 1) * 14.2;
      const z = (rand() * 2 - 1) * 14.2;
      const len = lenMin + rand() * (lenMax - lenMin);
      const spd = speedMin + rand() * (speedMax - speedMin);
      const off = rand() * height;
      const a = 0.35 + rand() * 0.65;
      for (let j = 0; j < 2; j++) {
        const k = i * 2 + j;
        positions[k * 3 + 0] = x;
        positions[k * 3 + 1] = 0;
        positions[k * 3 + 2] = z;
        end[k] = j;
        speed[k] = spd;
        offset[k] = off;
        length[k] = len;
        alpha[k] = a;
      }
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(positions, 3));
    geo.setAttribute("aEnd", new T.BufferAttribute(end, 1));
    geo.setAttribute("aSpeed", new T.BufferAttribute(speed, 1));
    geo.setAttribute("aOffset", new T.BufferAttribute(offset, 1));
    geo.setAttribute("aLen", new T.BufferAttribute(length, 1));
    geo.setAttribute("aAlpha", new T.BufferAttribute(alpha, 1));
    const mat = new T.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHeight: { value: height },
        uWind: { value: new T.Vector2(wind[0], wind[1]) },
        uColor: { value: new T.Color(color) },
        uOpacity: { value: opacity },
      },
      vertexShader: [
        "uniform float uTime;",
        "uniform float uHeight;",
        "uniform vec2 uWind;",
        "attribute float aEnd;",
        "attribute float aSpeed;",
        "attribute float aOffset;",
        "attribute float aLen;",
        "attribute float aAlpha;",
        "varying float vAlpha;",
        "void main() {",
        "  float y = mod(aOffset - uTime * aSpeed, uHeight);",
        "  vec3 p = position;",
        "  p.y = y;",
        "  if (aEnd > 0.5) {",
        "    p.y -= aLen;",
        "    p.x += uWind.x * aLen;",
        "    p.z += uWind.y * aLen;",
        "  }",
        "  float edge = smoothstep(0.0, 1.4, y) * smoothstep(uHeight, uHeight - 2.4, y);",
        "  vAlpha = aAlpha * edge;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor;",
        "uniform float uOpacity;",
        "varying float vAlpha;",
        "void main() {",
        "  gl_FragColor = vec4(uColor, vAlpha * uOpacity);",
        "}",
      ].join("\n"),
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: T.AdditiveBlending,
      toneMapped: false,
      fog: false,
    });
    const lines = new T.LineSegments(geo, mat);
    lines.frustumCulled = false;
    lines.renderOrder = 30;
    return { mesh: lines, mat };
  }

  function makeSplashes(parent) {
    const count = 110;
    const base = new T.PlaneGeometry(1, 1);
    base.rotateX(-Math.PI / 2);
    const geo = new T.InstancedBufferGeometry();
    geo.index = base.index;
    geo.attributes.position = base.attributes.position;
    geo.attributes.uv = base.attributes.uv;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);
    const rand = NM.seedRandom(8044);
    function groundAt(x, z) {
      if (x < 3.75 && z < 3.18) return 0.154;
      if (x < 3.75 && z > 8.7) return 0.154;
      if (x > 9.55 && z < 3.18) return 0.154;
      if (x > 9.55 && z > 8.7) return 0.154;
      return 0.04;
    }
    let placed = 0;
    while (placed < count) {
      const x = (rand() * 2 - 1) * 11.1;
      const z = (rand() * 2 - 1) * 11.1;
      if (x > -8.85 && x < 2.0 && z > -7.8 && z < 1.2) continue;
      positions[placed * 3] = x;
      positions[placed * 3 + 1] = groundAt(x, z);
      positions[placed * 3 + 2] = z;
      phases[placed] = rand();
      scales[placed] = 0.55 + rand() * 0.9;
      placed++;
    }
    geo.setAttribute("aPos", new T.InstancedBufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new T.InstancedBufferAttribute(phases, 1));
    geo.setAttribute("aScale", new T.InstancedBufferAttribute(scales, 1));
    geo.instanceCount = count;
    const mat = new T.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new T.Color(0xc8e5e8) },
      },
      vertexShader: [
        "uniform float uTime;",
        "attribute vec3 aPos;",
        "attribute float aPhase;",
        "attribute float aScale;",
        "varying vec2 vUv;",
        "varying float vAlpha;",
        "void main() {",
        "  float t = fract(uTime * 0.7 + aPhase);",
        "  float s = mix(0.08, 0.36, t) * aScale;",
        "  vUv = uv;",
        "  vAlpha = (1.0 - t) * (1.0 - t);",
        "  vec3 p = position * vec3(s, 1.0, s) + aPos + vec3(0.0, 0.017, 0.0);",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "uniform vec3 uColor;",
        "varying vec2 vUv;",
        "varying float vAlpha;",
        "void main() {",
        "  vec2 q = vUv * 2.0 - 1.0;",
        "  float d = length(q);",
        "  float ring = smoothstep(0.11, 0.015, abs(d - 0.62));",
        "  float dot = smoothstep(0.25, 0.0, d) * 0.35;",
        "  float a = (ring + dot) * vAlpha * 0.34;",
        "  gl_FragColor = vec4(uColor, a);",
        "}",
      ].join("\n"),
      transparent: true,
      blending: T.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const mesh = new T.Mesh(geo, mat);
    mesh.renderOrder = 25;
    mesh.frustumCulled = false;
    parent.add(mesh);
    return mat;
  }

  function makeEaveDrips(parent, eavePoints, sideEavePoints) {
    const drips = [];
    const all = [];
    eavePoints.forEach((p) => all.push({ p, side: false }));
    sideEavePoints.forEach((p) => all.push({ p, side: true }));
    const rand = NM.seedRandom(911);
    const dripTexture = TEX.drip();
    const ringGeo = new T.RingGeometry(0.035, 0.055, 18);
    ringGeo.rotateX(-Math.PI / 2);
    all.forEach((entry, i) => {
      const instances = 2;
      for (let k = 0; k < instances; k++) {
        const mat = new T.SpriteMaterial({
          map: dripTexture,
          color: 0xcbebef,
          transparent: true,
          opacity: 0.5,
          blending: T.AdditiveBlending,
          depthWrite: false,
          depthTest: true,
          toneMapped: false,
        });
        const sprite = new T.Sprite(mat);
        sprite.scale.set(0.055, 0.34, 1);
        sprite.renderOrder = 28;
        parent.add(sprite);
        const ringMat = new T.MeshBasicMaterial({
          color: 0xbbdde2,
          transparent: true,
          opacity: 0,
          blending: T.AdditiveBlending,
          depthWrite: false,
          side: T.DoubleSide,
          toneMapped: false,
        });
        const ring = new T.Mesh(ringGeo, ringMat);
        ring.position.set(entry.p.x, 0.17, entry.p.z);
        ring.renderOrder = 27;
        parent.add(ring);
        drips.push({
          sprite,
          ring,
          x: entry.p.x + (rand() - 0.5) * 0.9,
          z: entry.p.z + (entry.side ? (rand() - 0.5) * 0.15 : 0.02),
          topY: entry.p.y - rand() * 0.1,
          groundY: entry.side ? 0.16 : 0.16,
          period: 0.85 + rand() * 1.8,
          phase: rand(),
          ringScale: 0,
          ringAlpha: 0,
        });
      }
    });
    const update = (time) => {
      for (let i = 0; i < drips.length; i++) {
        const d = drips[i];
        const t = (time / d.period + d.phase) % 1;
        if (t < 0.76) {
          const fall = t / 0.76;
          d.sprite.visible = true;
          d.sprite.position.set(d.x, d.topY - fall * (d.topY - d.groundY), d.z);
          d.sprite.material.opacity = 0.16 + Math.min(fall * 0.9, 0.5);
          d.sprite.scale.set(0.045, 0.28 + fall * 0.16, 1);
        } else {
          d.sprite.visible = false;
        }
        const rt = t < 0.76 ? 0 : (t - 0.76) / 0.24;
        d.ring.position.set(d.x, d.groundY + 0.012, d.z);
        const s = 0.7 + rt * 4.4;
        d.ring.scale.set(s, 1, s);
        d.ring.material.opacity = Math.sin(Math.min(rt * Math.PI, Math.PI)) * 0.25;
      }
    };
    return update;
  }

  function makeMist(parent) {
    const group = new T.Group();
    parent.add(group);
    const canvas = TEX._helpers.makeCanvas(256, 128);
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(128, 64, 4, 128, 64, 126);
    g.addColorStop(0, "rgba(134,166,178,0.18)");
    g.addColorStop(0.45, "rgba(107,140,153,0.08)");
    g.addColorStop(1, "rgba(79,105,120,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 128);
    const tex = TEX._helpers.toTexture(canvas);
    const wisps = [];
    const rand = NM.seedRandom(703);
    for (let i = 0; i < 7; i++) {
      const m = new T.Mesh(new T.PlaneGeometry(8 + rand() * 6, 2.4 + rand() * 2), new T.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.12 + rand() * 0.08,
        depthWrite: false,
        blending: T.AdditiveBlending,
        toneMapped: false,
        side: T.DoubleSide,
      }));
      m.rotation.x = 0;
      m.position.set(-10 + rand() * 20, 2.2 + rand() * 3.5, -9 + rand() * 20);
      m.renderOrder = 22;
      group.add(m);
      wisps.push({ m, baseX: m.position.x, phase: rand() * 10, speed: 0.12 + rand() * 0.15 });
    }
    return (time) => {
      wisps.forEach((w, i) => {
        w.m.position.x = w.baseX + Math.sin(time * w.speed + w.phase) * 1.2;
        w.m.material.opacity = 0.085 + Math.sin(time * 0.22 + w.phase) * 0.025;
      });
    };
  }

  window.buildAtmosphere = function (scene, world) {
    const group = new T.Group();
    group.name = "rain-and-atmosphere";
    scene.add(group);

    const farRain = rainLayer(0x8eb7c9, 0.23, 1500, 17, [0.13, 0.03], 8.8, 12.2, 0.28, 0.72);
    const nearRain = rainLayer(0xbfdce6, 0.32, 480, 15.5, [0.18, 0.045], 10.5, 14.5, 0.46, 1.05);
    group.add(farRain.mesh);
    group.add(nearRain.mesh);

    const splashMat = makeSplashes(group);
    const eaveUpdate = makeEaveDrips(group, world.eavePoints, world.sideEavePoints);
    const mistUpdate = makeMist(group);

    // A little extra rain caught by the shop's warm canopy light.
    const closeRain = rainLayer(0xcbe7ec, 0.22, 220, 9.5, [0.22, 0.04], 11.5, 15.0, 0.5, 1.1);
    closeRain.mesh.scale.set(0.3, 1, 0.3);
    closeRain.mesh.position.set(0.9, 0, 1.6);
    group.add(closeRain.mesh);

    // Roof-edge water: very thin, nearly vertical streams under the canopy.
    const streams = [];
    world.eavePoints.forEach((p, i) => {
      if (i % 2 !== 0) return;
      const geo = new T.PlaneGeometry(0.018, 2.65);
      const mat = new T.MeshBasicMaterial({
        color: 0xbcdde4,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        blending: T.AdditiveBlending,
        side: T.DoubleSide,
        toneMapped: false,
      });
      const m = new T.Mesh(geo, mat);
      m.position.set(p.x + 0.13, p.y - 1.4, p.z + 0.03);
      m.renderOrder = 27;
      group.add(m);
      streams.push({ m, phase: i * 1.7 });
    });

    const update = (time, dt) => {
      farRain.mat.uniforms.uTime.value = time;
      nearRain.mat.uniforms.uTime.value = time;
      closeRain.mat.uniforms.uTime.value = time;
      splashMat.uniforms.uTime.value = time;
      eaveUpdate(time);
      mistUpdate(time);
      streams.forEach((s) => {
        s.m.material.opacity = 0.08 + Math.sin(time * 3.1 + s.phase) * 0.018;
      });
    };

    return { group, update };
  };
})();
