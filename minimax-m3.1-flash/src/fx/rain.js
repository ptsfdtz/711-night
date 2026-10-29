import * as THREE from 'three';
import * as TX from '../core/textures.js';

/**
 * GPU 雨幕
 * 用 InstancedBufferGeometry 生成朝向相机的细长雨丝，
 * 顶点着色器内完成下落与循环，无需 CPU 更新。
 */
export function buildRain(scene, { count = 2400, area = 34, height = 15, width = 0.028 } = {}) {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.attributes.position);
  geo.setAttribute('uv', base.attributes.uv);

  const rnd = TX.rng(1234);
  const offsets = new Float32Array(count * 3);
  const params = new Float32Array(count * 3); // speed, length, alpha
  for (let i = 0; i < count; i++) {
    offsets[i * 3 + 0] = (rnd() - 0.5) * area;
    offsets[i * 3 + 1] = rnd() * height;
    offsets[i * 3 + 2] = (rnd() - 0.5) * area;
    params[i * 3 + 0] = 7 + rnd() * 7;
    params[i * 3 + 1] = 0.22 + rnd() * 0.5;
    params[i * 3 + 2] = 0.2 + rnd() * 0.55;
  }
  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geo.setAttribute('aParams', new THREE.InstancedBufferAttribute(params, 3));
  geo.instanceCount = count;

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uCenter: { value: new THREE.Vector3() },
      uHeight: { value: height },
      uWidth: { value: width },
      uWind: { value: new THREE.Vector3(0.16, -1, 0.1).normalize() },
      uMap: { value: TX.rainDropTexture() },
      uTint: { value: new THREE.Color(0xa6bfe0) },
      uOpacity: { value: 0.88 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aOffset;
      attribute vec3 aParams;
      uniform float uTime;
      uniform vec3 uCenter;
      uniform float uHeight;
      uniform float uWidth;
      uniform vec3 uWind;
      varying vec2 vUv;
      varying float vFade;

      void main() {
        vUv = uv;
        float speed = aParams.x;
        float len = aParams.y;

        float fall = mod(aOffset.y - uTime * speed, uHeight);
        vec3 base = vec3(aOffset.x, fall, aOffset.z) + uCenter;

        vec3 dir = normalize(uWind);
        vec3 toCam = normalize(cameraPosition - base);
        vec3 right = normalize(cross(dir, toCam));

        vec3 p = base + dir * (position.y * len) + right * (position.x * uWidth);

        // 靠近地面淡出
        vFade = smoothstep(0.0, 1.2, base.y) * aParams.z;
        vFade *= smoothstep(0.0, 0.6, fall < uHeight - 0.5 ? 1.0 : 0.0);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec3 uTint;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vFade;
      void main() {
        vec4 t = texture2D(uMap, vUv);
        float a = t.a * vFade * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uTint * t.rgb, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 6;
  scene.add(mesh);

  return {
    mesh,
    material: mat,
    update(t, camera, target) {
      mat.uniforms.uTime.value = t;
      const c = mat.uniforms.uCenter.value;
      c.set(target.x, 0, target.z);
      // 轻微风向摆动
      mat.uniforms.uWind.value.set(0.16 + Math.sin(t * 0.23) * 0.09, -1, 0.1 + Math.cos(t * 0.17) * 0.07).normalize();
    },
  };
}
