import * as THREE from 'three';
import { groundAlbedo, groundWet } from './textures.js';
import { C, box, plane, mesh, toon, outline } from './util.js';

export const BASE = 16;
export const HALF = BASE / 2;
export const GROUND_Y = 0.0;

const spillSources = [];
export function addSpill(x, z, radius, color, intensity) {
  if (spillSources.length >= 6) return;
  spillSources.push({
    pos: new THREE.Vector4(x, z, radius, intensity),
    col: new THREE.Color(color),
  });
}

const rippleSources = [];
export function addRipple(x, z, r) {
  if (rippleSources.length >= 6) return;
  rippleSources.push(new THREE.Vector3(x, z, r));
}

export function buildGround(scene) {
  const grp = new THREE.Group();
  scene.add(grp);

  /* ---- plinth ---- */
  const plinthH = 1.15;
  const plinth = mesh(box(BASE, plinthH, BASE), toon(0x171c27, { rim: 0x2b3a55, rimStrength: 0.5 }), 0, -plinthH / 2 - 0.02, 0);
  outline(plinth, 0.03, 0x0a0d14);
  grp.add(plinth);

  const skirt = mesh(box(BASE + 0.34, 0.24, BASE + 0.34), toon(0x222836, { rim: 0x3a4c6b, rimStrength: 0.55 }), 0, -plinthH - 0.02 + 0.12, 0);
  outline(skirt, 0.03, 0x0a0d14);
  grp.add(skirt);

  // warm accent line around the plinth (collectible display feel)
  const rimMat = toon(0x2c3a52, { rim: 0x51719f, rimStrength: 0.7, emissive: 0x121c2e, emissiveIntensity: 1 });
  const rim = mesh(box(BASE + 0.1, 0.08, BASE + 0.1), rimMat, 0, -0.06, 0);
  grp.add(rim);

  /* ---- ground ---- */
  const uniforms = {
    uMap: { value: groundAlbedo() },
    uWet: { value: groundWet() },
    uReflect: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uAmbient: { value: new THREE.Color(0x4a5a7a).multiplyScalar(0.62) },
    uNightTint: { value: new THREE.Color(0x2b3b5c) },
    uSpillPos: { value: spillSources.map((s) => s.pos) },
    uSpillCol: { value: spillSources.map((s) => s.col) },
    uRipple: { value: rippleSources.map((r) => r.clone()) },
    uReflectStrength: { value: 1.0 },
  };
  while (uniforms.uSpillPos.value.length < 6) uniforms.uSpillPos.value.push(new THREE.Vector4(0, 0, 0.001, 0));
  while (uniforms.uSpillCol.value.length < 6) uniforms.uSpillCol.value.push(new THREE.Color(0, 0, 0));
  while (uniforms.uRipple.value.length < 6) uniforms.uRipple.value.push(new THREE.Vector3(0, 0, 0.001));

  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4( position, 1.0 );
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform sampler2D uWet;
      uniform sampler2D uReflect;
      uniform vec2  uRes;
      uniform float uTime;
      uniform vec3  uAmbient;
      uniform vec3  uNightTint;
      uniform vec4  uSpillPos[6];
      uniform vec3  uSpillCol[6];
      uniform vec3  uRipple[6];
      uniform float uReflectStrength;
      varying vec2 vUv;
      varying vec3 vWorld;

      float hash( vec2 p ) {
        return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 );
      }

      void main() {
        vec3 base = texture2D( uMap, vUv ).rgb;
        float wet = texture2D( uWet, vUv ).r;

        // --- warm / neon light spilling on the wet floor ---
        vec3 spill = vec3( 0.0 );
        for ( int i = 0; i < 6; i++ ) {
          vec2 d = vWorld.xz - uSpillPos[ i ].xy;
          float f = exp( -dot( d, d ) / max( uSpillPos[ i ].z * uSpillPos[ i ].z, 0.0001 ) );
          spill += uSpillCol[ i ] * f * uSpillPos[ i ].w;
        }

        // --- soft night ambient + slight cool grading ---
        vec3 col = base * ( uAmbient * 0.55 + uNightTint * 0.16 + spill * 0.85 );

        // --- night sky sheen on very wet areas ---
        col += vec3( 0.06, 0.09, 0.14 ) * wet * 0.55;

        // --- rain impact rings + puddle ripples ---
        float ring = 0.0;
        vec2 cell = floor( vWorld.xz * 1.7 );
        float h = hash( cell );
        if ( h > 0.55 ) {
          float t = fract( uTime * 0.55 + h * 3.7 );
          vec2 cp = ( cell + 0.5 + vec2( hash( cell + 1.7 ), hash( cell + 3.3 ) ) * 0.7 ) / 1.7;
          float d = distance( vWorld.xz, cp );
          ring += smoothstep( 0.055, 0.0, abs( d - t * 0.65 ) ) * ( 1.0 - t ) * 0.5;
        }
        vec2 warp = vec2( 0.0 );
        for ( int i = 0; i < 6; i++ ) {
          vec2 c = uRipple[ i ].xy;
          float r = uRipple[ i ].z;
          float d = distance( vWorld.xz, c );
          float fall = exp( -d * d / max( r * r, 0.0001 ) );
          float w = sin( d * 26.0 - uTime * 4.2 ) * fall;
          warp += vec2( w * 0.5, w * 0.35 );
          ring += smoothstep( 0.09, 0.0, abs( d - fract( uTime * 0.35 + float( i ) * 0.17 ) * r * 1.2 ) ) * fall * 0.35;
        }
        col += vec3( 0.40, 0.52, 0.70 ) * ring * wet * 0.30;

        // --- mirrored reflection of the world ---
        vec2 suv = gl_FragCoord.xy / uRes;
        suv += warp * 0.010 * wet;
        suv += vec2( sin( vWorld.x * 3.0 + uTime * 1.3 ), cos( vWorld.z * 3.0 + uTime * 1.1 ) ) * 0.0016 * wet;
        // the mirrored pass is rendered with a flipped right vector -> undo it here
        suv.x = 1.0 - suv.x;
        vec3 refl = texture2D( uReflect, clamp( suv, vec2( 0.002 ), vec2( 0.998 ) ) ).rgb;

        vec3 V = normalize( cameraPosition - vWorld );
        float fres = pow( 1.0 - clamp( V.y, 0.0, 1.0 ), 2.6 );
        float k = wet * wet * mix( 0.30, 1.0, fres ) * uReflectStrength;
        col += refl * k;

        // --- grazing specular sheen ---
        col += vec3( 0.32, 0.40, 0.55 ) * pow( fres, 3.0 ) * wet * 0.18;

        gl_FragColor = vec4( col, 1.0 );
        #include <colorspace_fragment>
      }
    `,
  });

  const ground = mesh(plane(BASE, BASE, 1, 1), mat, 0, GROUND_Y, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  grp.add(ground);

  // thin kerb geometry is painted into the texture; add a physical kerb lip so
  // the diorama reads better from a low angle
  const kerbMat = toon(C.curb, { rim: 0x4a5f80, rimStrength: 0.35, steps: 3 });
  const kerb = mesh(box(9.8, 0.12, 0.34), kerbMat, 1.5, 0.058, 4.28);
  outline(kerb, 0.018);
  grp.add(kerb);
  const kerb2 = mesh(box(0.34, 0.12, 3.5), kerbMat, 4.6, 0.058, 4.65);
  outline(kerb2, 0.018);
  grp.add(kerb2);

  return { group: grp, ground, material: mat, uniforms };
}
