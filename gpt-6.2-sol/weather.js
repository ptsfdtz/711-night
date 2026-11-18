export function buildWeather(c, store) {
  const { THREE, scene } = c;
  let seed = 71138;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function lines(count, color, opacity, parent = scene) {
    const positions = new Float32Array(count * 6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    const strands = new THREE.LineSegments(geometry, material);
    strands.frustumCulled = false;
    strands.renderOrder = 5;
    parent.add(strands);
    return { positions, geometry };
  }

  function write(positions, index, x, y, z, dx, dy, dz) {
    const offset = index * 6;
    positions[offset] = x;
    positions[offset + 1] = y;
    positions[offset + 2] = z;
    positions[offset + 3] = x + dx;
    positions[offset + 4] = y + dy;
    positions[offset + 5] = z + dz;
  }

  const count = 694;
  const rain = lines(count, '#a1c7ee', .21);
  const drops = Array.from({ length: count }, () => {
    const x = -6.75 + random() * 13.13;
    const z = -6.62 + random() * 13.38;
    const onRoof = x > -3.81 && x < 3.82 && z > -3.15 && z < 1.9;
    const onCanopy = (x > -3.81 && x < 4.41 && z > 1.83 && z < 2.97)
      || (x > 3.53 && x < 4.41 && z > -2.99 && z < 2.97);
    const floor = onRoof ? 3.76 : onCanopy ? 3.48 : z < 3.25 && z > -4.9 && x > -5.2 && x < 4.75 ? .17 : .015;
    return { x, z, floor, phase: random() * 7, speed: 5.5 + 4.7 * random(), length: .082 + random() * .16 };
  });

  const gutterCount = 44;
  const gutter = lines(gutterCount, '#dfecf6', .39);
  const beads = Array.from({ length: gutterCount }, (_, index) => ({
    x: index < 29 ? -3.71 + random() * 7.72 : 4.392,
    z: index < 29 ? 2.956 + random() * .071 : -2.86 + random() * 5.82,
    phase: random(), frequency: .6 + random() * 1.17, length: .025 + random() * .15,
  }));

  const glassTracks = store.runnels.map(({ group, width, height }) => ({
    ...lines(9, '#d7f8ff', .25, group), height,
    drops: Array.from({ length: 9 }, () => ({ x: (random() - .5) * width * .88, seed: random(), speed: .15 + random() * .43, length: .021 + random() * .145 })),
  }));

  const rings = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(2, 2));
  const centers = [];
  const ringCount = 91;
  for (let i = 0; i < ringCount; i++) {
    let x, z;
    do {
      x = (random() - .5) * 13.12;
      z = (random() - .5) * 13.05;
    } while ((x < 4.78 && x > -4.9 && z < 3.36 && z > -4.3) || (x > 3.73 && x < 6.14 && z > 3.43 && z < 6.22 && i % 3));
    if (i < 16) {
      x = -3.6 + random() * 7.6;
      z = 3.01 + random() * .16;
    }
    centers.push(x, i < 16 ? .176 : .025, z, random());
  }
  rings.setAttribute('center', new THREE.InstancedBufferAttribute(new Float32Array(centers), 4));
  rings.instanceCount = ringCount;
  const disturbance = new THREE.Mesh(rings, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { time: { value: 0 } },
    vertexShader: `
      attribute vec4 center;
      uniform float time;
      varying vec2 ripple;
      varying float age;
      varying float tint;
      void main() {
        age=fract(time*(.52+.38*center.w)+center.w*27.);
        float radius=(.032+age*.18)*(.7+.55*center.w);
        ripple=position.xy;
        tint=center.w;
        vec3 world=center.xyz+vec3(position.x,0.,position.y)*radius;
        gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
      }`,
    fragmentShader: `
      varying vec2 ripple;
      varying float age;
      varying float tint;
      void main() {
        float r=length(ripple);
        float outer=smoothstep(.68,.80,r)*(1.-smoothstep(.85,.98,r));
        float inner=smoothstep(.40,.55,r)*(1.-smoothstep(.56,.65,r));
        vec3 hue=mix(vec3(.45,.64,.79),vec3(.82,.65,.47),tint*.77);
        float fade=(1.-age)*(1.-age)*smoothstep(0.,.17,age);
        gl_FragColor=vec4(hue,(outer+inner*.33)*fade*.48);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  disturbance.frustumCulled = false;
  disturbance.renderOrder = 4;
  scene.add(disturbance);

  function update(t) {
    for (let i = 0; i < count; i++) {
      const p = drops[i];
      const travel = 7.6 - p.floor;
      const y = p.floor + travel - (p.phase + t * p.speed) % travel;
      write(rain.positions, i, p.x + (7.6 - y) * .047, y, p.z - (7.6 - y) * .014, -.047 * p.length, p.length, .014 * p.length);
    }
    rain.geometry.attributes.position.needsUpdate = true;
    for (let i = 0; i < gutterCount; i++) {
      const p = beads[i];
      const age = (p.phase + p.frequency * t) % 1;
      const y = 2.857 - 2.66 * age * age;
      write(gutter.positions, i, p.x + age * .016, y, p.z, .003, p.length * (.46 + age), -.01);
    }
    gutter.geometry.attributes.position.needsUpdate = true;
    for (const track of glassTracks) {
      track.drops.forEach((p, i) => {
        const age = (p.seed + t * p.speed) % 1;
        const y = track.height * (.464 - .933 * age);
        const length = Math.min(p.length * (.4 + age), track.height * .488 - y);
        write(track.positions, i, p.x + Math.sin(age * 8 + i) * .014, y, .013, -.004, length, -.001);
      });
      track.geometry.attributes.position.needsUpdate = true;
    }
    disturbance.material.uniforms.time.value = t;
  }

  return { update };
}
