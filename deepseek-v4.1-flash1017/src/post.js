/* post.js — a small, self-contained bloom pass for the rainy light */
(function () {
  "use strict";

  const T = THREE;

  function makeTarget(w, h, depth, samples) {
    const rt = new T.WebGLRenderTarget(Math.max(2, Math.floor(w)), Math.max(2, Math.floor(h)), {
      minFilter: T.LinearFilter,
      magFilter: T.LinearFilter,
      format: T.RGBAFormat,
      type: T.UnsignedByteType,
      depthBuffer: !!depth,
      stencilBuffer: false,
      samples: samples || 0,
    });
    rt.texture.colorSpace = T.LinearSRGBColorSpace;
    return rt;
  }

  window.PostBloom = function (renderer, scene, camera, options) {
    const opt = Object.assign({ threshold: 0.66, knee: 0.28, intensity: 0.72, blur: 1.0 }, options || {});
    const quadScene = new T.Scene();
    const quadCamera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeo = new T.PlaneGeometry(2, 2);
    const quad = new T.Mesh(quadGeo, null);
    quad.frustumCulled = false;
    quadScene.add(quad);

    const brightMat = new T.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uThreshold: { value: opt.threshold },
        uKnee: { value: opt.knee },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform float uThreshold;",
        "uniform float uKnee;",
        "varying vec2 vUv;",
        "void main(){",
        "  vec3 c = texture2D(tDiffuse, vUv).rgb;",
        "  float br = max(c.r, max(c.g, c.b));",
        "  float f = smoothstep(uThreshold, uThreshold + uKnee, br);",
        "  gl_FragColor = vec4(c * f, 1.0);",
        "}",
      ].join("\n"),
      depthTest: false,
      depthWrite: false,
      transparent: false,
      toneMapped: false,
    });

    const blurMat = new T.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uDirection: { value: new T.Vector2(1, 0) },
        uTexel: { value: new T.Vector2(1 / 512, 1 / 512) },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D tDiffuse;",
        "uniform vec2 uDirection;",
        "uniform vec2 uTexel;",
        "varying vec2 vUv;",
        "void main(){",
        "  vec2 d = uDirection * uTexel;",
        "  vec3 c = texture2D(tDiffuse, vUv).rgb * 0.227027;",
        "  c += texture2D(tDiffuse, vUv + d * 1.384615).rgb * 0.316216;",
        "  c += texture2D(tDiffuse, vUv - d * 1.384615).rgb * 0.316216;",
        "  c += texture2D(tDiffuse, vUv + d * 3.230769).rgb * 0.070270;",
        "  c += texture2D(tDiffuse, vUv - d * 3.230769).rgb * 0.070270;",
        "  gl_FragColor = vec4(c, 1.0);",
        "}",
      ].join("\n"),
      depthTest: false,
      depthWrite: false,
      transparent: false,
      toneMapped: false,
    });

    const compositeMat = new T.ShaderMaterial({
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        uIntensity: { value: opt.intensity },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      ].join("\n"),
      fragmentShader: [
        "uniform sampler2D tScene;",
        "uniform sampler2D tBloom;",
        "uniform float uIntensity;",
        "varying vec2 vUv;",
        "vec3 linearToSRGB(vec3 c){",
        "  c = max(c, vec3(0.0));",
        "  return mix(pow(c, vec3(0.4166667)) * 1.055 - 0.055, c * 12.92, step(c, vec3(0.0031308)));",
        "}",
        "void main(){",
        "  vec4 base = texture2D(tScene, vUv);",
        "  vec3 bloom = texture2D(tBloom, vUv).rgb;",
        "  vec3 col = base.rgb + bloom * uIntensity;",
        "  gl_FragColor = vec4(linearToSRGB(col), base.a);",
        "}",
      ].join("\n"),
      depthTest: false,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
      blending: T.NoBlending,
    });

    let sceneRT = null;
    let brightRT = null;
    let blurA = null;
    let blurB = null;
    let width = 2;
    let height = 2;

    function disposeTargets() {
      [sceneRT, brightRT, blurA, blurB].forEach((rt) => {
        if (rt) rt.dispose();
      });
    }

    function setSize(w, h) {
      width = Math.max(2, Math.floor(w));
      height = Math.max(2, Math.floor(h));
      disposeTargets();
      sceneRT = makeTarget(width, height, true, 4);
      brightRT = makeTarget(width / 2, height / 2, false, 0);
      blurA = makeTarget(width / 2, height / 2, false, 0);
      blurB = makeTarget(width / 2, height / 2, false, 0);
    }

    function renderQuad(material, target) {
      quad.material = material;
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(quadScene, quadCamera);
    }

    const self = {
      enabled: true,
      setSize,
      setIntensity(value) {
        compositeMat.uniforms.uIntensity.value = value;
      },
      render() {
        if (!self.enabled || !sceneRT) {
          renderer.setRenderTarget(null);
          renderer.render(scene, camera);
          return;
        }
        renderer.setRenderTarget(sceneRT);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(scene, camera);

        brightMat.uniforms.tDiffuse.value = sceneRT.texture;
        quad.material = brightMat;
        renderer.setRenderTarget(brightRT);
        renderer.clear();
        renderer.render(quadScene, quadCamera);

        const tw = Math.max(2, Math.floor(width / 2));
        const th = Math.max(2, Math.floor(height / 2));
        blurMat.uniforms.uTexel.value.set(1 / tw, 1 / th);

        blurMat.uniforms.tDiffuse.value = brightRT.texture;
        blurMat.uniforms.uDirection.value.set(1, 0);
        renderQuad(blurMat, blurA);

        blurMat.uniforms.tDiffuse.value = blurA.texture;
        blurMat.uniforms.uDirection.value.set(0, 1);
        renderQuad(blurMat, blurB);

        compositeMat.uniforms.tScene.value = sceneRT.texture;
        compositeMat.uniforms.tBloom.value = blurB.texture;
        quad.material = compositeMat;
        renderer.setRenderTarget(null);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(quadScene, quadCamera);
      },
      dispose() {
        disposeTargets();
        quadGeo.dispose();
        brightMat.dispose();
        blurMat.dispose();
        compositeMat.dispose();
      },
    };

    setSize(renderer.domElement.width, renderer.domElement.height);
    return self;
  };
})();
