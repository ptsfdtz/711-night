import * as THREE from 'three';

/* ------------------------------------------------------------------ *
 *  Hand-rolled post chain (no addons, no external deps):
 *
 *    1. main pass          -> colour RT (with depth texture attached)
 *    2. normal+depth pass  -> half-res normals for line detection
 *    3. bright pass        -> half-res emissive extraction
 *    4. separable blur x2  -> soft neon bloom
 *    5. composite          -> toon ink outline + bloom + night grade
 * ------------------------------------------------------------------ */

const QUAD_VS = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const BRIGHT_FS = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform float uThreshold;
uniform float uSoft;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tColor, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  float k = smoothstep(uThreshold, uThreshold + uSoft, l);
  gl_FragColor = vec4(c * k, 1.0);
}`;

const BLUR_FS = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform vec2 uDir;      // texel-space direction
varying vec2 vUv;
void main() {
  vec4 sum = texture2D(tColor, vUv) * 0.2270270270;
  sum += texture2D(tColor, vUv + uDir * 1.3846153846) * 0.3162162162;
  sum += texture2D(tColor, vUv - uDir * 1.3846153846) * 0.3162162162;
  sum += texture2D(tColor, vUv + uDir * 3.2307692308) * 0.0702702703;
  sum += texture2D(tColor, vUv - uDir * 3.2307692308) * 0.0702702703;
  gl_FragColor = sum;
}`;

const COMPOSITE_FS = /* glsl */ `
precision highp float;

uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform sampler2D tBloom;
uniform vec2  uTexel;        // 1 / colour-res
uniform vec2  uNormalTexel;  // 1 / normal-res
uniform float uNear;
uniform float uFar;
uniform float uOutline;      // ink strength
uniform float uBloom;
uniform float uExposure;
uniform float uVignette;
uniform vec3  uInkColor;
uniform vec3  uShadowTint;
uniform vec3  uHighlightTint;
uniform float uTime;
uniform float uGrain;
uniform float uSaturation;

varying vec2 vUv;

float ld(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  float z = d * 2.0 - 1.0;
  return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 col = texture2D(tColor, vUv).rgb;

  /* ---------------- toon ink outline (depth Laplacian + normal) ---------- */
  vec2 o = uNormalTexel;
  float dC = ld(vUv);
  float dL = ld(vUv - vec2(o.x, 0.0));
  float dR = ld(vUv + vec2(o.x, 0.0));
  float dU = ld(vUv + vec2(0.0, o.y));
  float dD = ld(vUv - vec2(0.0, o.y));

  // second-derivative term stays quiet on smooth surfaces
  float lap = abs(dL + dR + dU + dD - 4.0 * dC);
  // normalise by the local gradient: a steeply-slanted plane (ceiling,
  // road at a grazing angle) has a big Laplacian purely from perspective,
  // and would otherwise turn into a field of fake ink stripes
  float grad = abs(dR - dL) + abs(dU - dD);
  float edgeD = smoothstep(0.012, 0.06, lap / (1.0 + grad * 5.0));

  vec3 nC = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
  vec3 nL = texture2D(tNormal, vUv - vec2(o.x, 0.0)).xyz * 2.0 - 1.0;
  vec3 nR = texture2D(tNormal, vUv + vec2(o.x, 0.0)).xyz * 2.0 - 1.0;
  vec3 nU = texture2D(tNormal, vUv + vec2(0.0, o.y)).xyz * 2.0 - 1.0;
  vec3 nD = texture2D(tNormal, vUv - vec2(0.0, o.y)).xyz * 2.0 - 1.0;
  float edgeN = smoothstep(0.35, 1.05,
      (length(nC - nL) + length(nC - nR) + length(nC - nU) + length(nC - nD)) * 0.25);

  float sky = step(0.99995, texture2D(tDepth, vUv).x);
  float ink = clamp(max(edgeD, edgeN * 0.85), 0.0, 1.0) * (1.0 - sky) * uOutline;

  // ink lines get a faint cool core so they read as ink, not as a black mask
  vec3 inkCol = uInkColor + vec3(0.02, 0.03, 0.06) * (1.0 - ink);
  col = mix(col, inkCol, ink);

  /* ----------------------------- neon bloom ---------------------------- */
  vec3 bloom = texture2D(tBloom, vUv).rgb;
  col += bloom * uBloom;

  /* -------------------------- night colour grade ----------------------- */
  col *= uExposure;

  // gentle S-curve: crush the blues, keep the neon hot
  col = clamp(col, 0.0, 4.0);
  col = col * col * (3.0 - 2.0 * clamp(col, 0.0, 1.0)) * 0.5 + col * 0.55;

  // soft shoulder (keeps neon from clipping to flat white)
  col = col / (1.0 + max(vec3(0.0), col - 0.72) * 0.8);

  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  vec3 graded = mix(uShadowTint * lum * 1.5, uHighlightTint * lum, smoothstep(0.01, 0.42, lum));
  col = mix(col, graded, 0.2);
  col = mix(vec3(lum), col, uSaturation);

  /* -------------------------- vignette + grain ------------------------- */
  vec2 q = vUv - 0.5;
  float vig = 1.0 - dot(q, q) * uVignette;
  col *= clamp(vig, 0.0, 1.0);

  float g = (hash(vUv * 1024.0 + uTime) - 0.5) * uGrain;
  col += g * (1.0 - smoothstep(0.0, 0.32, lum));

  /* ------------------------------ output ------------------------------- */
  // manual linear -> sRGB (this pass writes straight to the canvas)
  vec3 srgb = mix(col * 12.92,
                  1.055 * pow(max(col, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
                  step(vec3(0.0031308), col));
  gl_FragColor = vec4(clamp(srgb, 0.0, 1.0), 1.0);
}`;

export class PostFX {
  constructor(renderer, opts = {}) {
    this.renderer = renderer;
    this.enabled = true;
    this.outline = opts.outline ?? 1.0;
    this.bloom = opts.bloom ?? 0.85;
    this.exposure = opts.exposure ?? 1.0;
    this.grain = opts.grain ?? 0.02;

    this.normalMaterial = new THREE.MeshNormalMaterial();
    this.normalMaterial.side = THREE.DoubleSide;

    const rtOpts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    };

    this.depthTexture = new THREE.DepthTexture(1, 1);
    this.depthTexture.type = THREE.UnsignedIntType;
    this.depthTexture.minFilter = THREE.NearestFilter;
    this.depthTexture.magFilter = THREE.NearestFilter;

    this.rtColor = new THREE.WebGLRenderTarget(1, 1, rtOpts);
    this.rtColor.texture.colorSpace = THREE.NoColorSpace;
    this.rtColor.depthTexture = this.depthTexture;

    // The line pass uses its OWN depth buffer: anything excluded from it
    // (thin wires, glass, rain) must not sprout a fat ink outline.
    this.normalDepth = new THREE.DepthTexture(1, 1);
    this.normalDepth.type = THREE.UnsignedIntType;
    this.normalDepth.minFilter = THREE.NearestFilter;
    this.normalDepth.magFilter = THREE.NearestFilter;

    this.rtNormal = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.rtNormal.depthTexture = this.normalDepth;

    this.rtBrightA = new THREE.WebGLRenderTarget(1, 1, rtOpts);
    this.rtBrightB = new THREE.WebGLRenderTarget(1, 1, rtOpts);
    this.rtBlurA = new THREE.WebGLRenderTarget(1, 1, rtOpts);
    this.rtBlurB = new THREE.WebGLRenderTarget(1, 1, rtOpts);

    this.brightMat = new THREE.ShaderMaterial({
      vertexShader: QUAD_VS,
      fragmentShader: BRIGHT_FS,
      uniforms: {
        tColor: { value: this.rtColor.texture },
        uThreshold: { value: 0.95 },
        uSoft: { value: 0.55 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.blurMat = new THREE.ShaderMaterial({
      vertexShader: QUAD_VS,
      fragmentShader: BLUR_FS,
      uniforms: { tColor: { value: null }, uDir: { value: new THREE.Vector2() } },
      depthTest: false,
      depthWrite: false,
    });

    this.compositeMat = new THREE.ShaderMaterial({
      vertexShader: QUAD_VS,
      fragmentShader: COMPOSITE_FS,
      uniforms: {
        tColor: { value: this.rtColor.texture },
        tNormal: { value: this.rtNormal.texture },
        tDepth: { value: this.normalDepth },
        tBloom: { value: this.rtBlurB.texture },
        uTexel: { value: new THREE.Vector2() },
        uNormalTexel: { value: new THREE.Vector2() },
        uNear: { value: 0.1 },
        uFar: { value: 200 },
        uOutline: { value: this.outline },
        uBloom: { value: this.bloom },
        uExposure: { value: this.exposure },
        uVignette: { value: 0.72 },
        uInkColor: { value: new THREE.Color(0x0b0f1a) },
        uShadowTint: { value: new THREE.Color(0x3d5a8f) },
        uHighlightTint: { value: new THREE.Color(0xffe6c2) },
        uTime: { value: 0 },
        uGrain: { value: this.grain },
        uSaturation: { value: 1.06 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(this.quadGeo, this.compositeMat);
    this.quad.frustumCulled = false;
    this.quadScene = new THREE.Scene();
    this.quadScene.add(this.quad);
  }

  setSize(w, h, pixelRatio = 1) {
    const W = Math.max(2, Math.floor(w * pixelRatio));
    const H = Math.max(2, Math.floor(h * pixelRatio));
    this.width = W;
    this.height = H;
    this.rtColor.setSize(W, H);
    const hw = Math.max(2, W >> 1);
    const hh = Math.max(2, H >> 1);
    this.rtNormal.setSize(hw, hh);
    this.rtBrightA.setSize(hw, hh);
    this.rtBrightB.setSize(hw, hh);
    this.rtBlurA.setSize(hw >> 1, hh >> 1);
    this.rtBlurB.setSize(hw >> 1, hh >> 1);
    this.compositeMat.uniforms.uTexel.value.set(1 / W, 1 / H);
    this.compositeMat.uniforms.uNormalTexel.value.set(1 / hw, 1 / hh);
  }

  _blit(material, target) {
    this.quad.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCam);
  }

  /**
   * @param {THREE.Scene} scene
   * @param {THREE.PerspectiveCamera} camera
   * @param {{include:Array, exclude:Array}} lists meshes that take part in the
   *        ink-line pass (include) and ones that must vanish during it (exclude)
   * @param {number} time
   */
  render(scene, camera, lists, time) {
    const r = this.renderer;

    /* 1 — beauty pass */
    r.setRenderTarget(this.rtColor);
    r.clear();
    r.render(scene, camera);

    /* 2 — normal/depth pass for ink lines (half res) */
    const include = lists.include;
    const exclude = lists.exclude;
    for (let i = 0; i < include.length; i++) {
      const m = include[i];
      m.userData._mat = m.material;
      m.material = this.normalMaterial;
    }
    const hidden = [];
    for (let i = 0; i < exclude.length; i++) {
      const m = exclude[i];
      if (m.visible) {
        m.visible = false;
        hidden.push(m);
      }
    }
    r.setRenderTarget(this.rtNormal);
    r.clear();
    r.render(scene, camera);
    for (let i = 0; i < include.length; i++) {
      const m = include[i];
      m.material = m.userData._mat;
      m.userData._mat = null;
    }
    for (let i = 0; i < hidden.length; i++) hidden[i].visible = true;

    /* 3 — bright pass + separable blur (two octaves, ping-ponged) */
    this._blit(this.brightMat, this.rtBrightA);

    const bw = this.rtBlurA.width;
    const bh = this.rtBlurA.height;

    // octave 1 — tight halo
    this.blurMat.uniforms.tColor.value = this.rtBrightA.texture;
    this.blurMat.uniforms.uDir.value.set(1 / bw, 0);
    this._blit(this.blurMat, this.rtBlurA);
    this.blurMat.uniforms.tColor.value = this.rtBlurA.texture;
    this.blurMat.uniforms.uDir.value.set(0, 1 / bh);
    this._blit(this.blurMat, this.rtBlurB);

    // octave 2 — wide glow (read/write always targets different buffers)
    this.blurMat.uniforms.tColor.value = this.rtBlurB.texture;
    this.blurMat.uniforms.uDir.value.set(2.6 / bw, 0);
    this._blit(this.blurMat, this.rtBlurA);
    this.blurMat.uniforms.tColor.value = this.rtBlurA.texture;
    this.blurMat.uniforms.uDir.value.set(0, 2.6 / bh);
    this._blit(this.blurMat, this.rtBlurB);

    /* 4 — composite to canvas */
    this.compositeMat.uniforms.uNear.value = camera.near;
    this.compositeMat.uniforms.uFar.value = camera.far;
    this.compositeMat.uniforms.uOutline.value = this.outline;
    this.compositeMat.uniforms.uBloom.value = this.bloom;
    this.compositeMat.uniforms.uExposure.value = this.exposure;
    this.compositeMat.uniforms.uGrain.value = this.grain;
    this.compositeMat.uniforms.uTime.value = time;
    this.quad.material = this.compositeMat;
    r.setRenderTarget(null);
    r.render(this.quadScene, this.quadCam);
  }
}