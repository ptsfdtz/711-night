import { Reflector } from 'three/addons/objects/Reflector.js';

function roundedSquare(THREE, half, radius) {
  const path = new THREE.Shape();
  path.moveTo(-half + radius, -half);
  path.lineTo(half - radius, -half);
  path.quadraticCurveTo(half, -half, half, -half + radius);
  path.lineTo(half, half - radius);
  path.quadraticCurveTo(half, half, half - radius, half);
  path.lineTo(-half + radius, half);
  path.quadraticCurveTo(-half, half, -half, half - radius);
  path.lineTo(-half, -half + radius);
  path.quadraticCurveTo(-half, -half, -half + radius, -half);
  return path;
}

export function buildStage(c) {
  const { THREE, scene, mat, mesh, canvasMap } = c;
  const half = 6.8;
  const shadowMap = canvasMap(256, 256, (ctx, w, h) => {
    const shade = ctx.createRadialGradient(w * .5, h * .5, w * .249, w * .5, h * .5, w * .50);
    shade.addColorStop(0, 'rgba(0,2,9,.82)');
    shade.addColorStop(.60, 'rgba(0,2,9,.41)');
    shade.addColorStop(1, 'rgba(0,2,9,0)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, w, h);
  });
  const stage = mesh(new THREE.PlaneGeometry(31, 31), new THREE.ShaderMaterial({
    depthWrite: false,
    vertexShader: `void main() { gl_Position = vec4(position.xy / 15.5, .9999, 1.); }`,
    fragmentShader: `
      uniform vec2 viewport;
      void main() {
        vec2 n = gl_FragCoord.xy / viewport;
        vec2 p = (n - vec2(.49,.53)) * vec2(1.05,.83);
        float haze = exp(-dot(p,p)*6.8);
        float blue = exp(-length((n-vec2(.34,.67))*vec2(.83,1.1))*2.85);
        vec3 color = vec3(.0045,.0092,.021) + haze*vec3(.008,.010,.020) + blue*vec3(.004,.009,.022);
        gl_FragColor=vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    uniforms: { viewport: { value: new THREE.Vector2(1, 1) } },
  }));
  stage.frustumCulled = false;
  stage.renderOrder = -50;

  const shadow = mesh(new THREE.PlaneGeometry(23.5, 22), new THREE.MeshBasicMaterial({
    map: shadowMap, transparent: true, depthWrite: false, toneMapped: false,
  }), .16, -.96, .13);
  shadow.renderOrder = -6;
  shadow.rotation.x = -Math.PI / 2;

  function slice(size, radius, y, thickness, bevel, material) {
    const geometry = new THREE.ExtrudeGeometry(roundedSquare(THREE, size - bevel, radius), {
      depth: thickness - 2 * bevel, steps: 1, curveSegments: 6,
      bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2,
    });
    const block = mesh(geometry, material, 0, y + bevel, 0);
    block.rotation.x = -Math.PI / 2;
  }

  slice(half - .12, .18, -.848, .205, .055, mat('#141e31'));
  slice(half - .046, .17, -.675, .146, .023, mat('#43516a', { metalness: .2 }));
  slice(half, .17, -.55, .548, .061, mat('#252f47', { metalness: .14 }));

  const asphalt = new Reflector(new THREE.ShapeGeometry(roundedSquare(THREE, half - .004, .17), 12), {
    textureWidth: 832,
    textureHeight: 832,
    multisample: 0,
    color: '#1d2940',
    clipBias: .001,
    shader: {
      uniforms: {
        color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, time: { value: 0 },
      },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 projected;
        varying vec2 ground;
        void main() {
          projected=textureMatrix*vec4(position,1.);
          ground=vec2(position.x,-position.y);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
        }`,
      fragmentShader: `
        uniform vec3 color;
        uniform sampler2D tDiffuse;
        uniform float time;
        varying vec4 projected;
        varying vec2 ground;
        float hash(vec2 x) { return fract(sin(dot(x,vec2(97.39,203.43))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i=floor(p),f=fract(p);
          f=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
        }
        float pool(vec2 p,vec2 c,vec2 s) { return 1.-length((p-c)/s); }
        void main() {
          vec2 p=ground;
          float aggregate=noise(p*150.)*.53+noise(p*73.)*.3+noise(p*23.)*.17;
          float water=pool(p,vec2(-.66,4.37),vec2(3.89,1.15));
          water=max(water,pool(p,vec2(1.,5.66),vec2(1.73,.52)));
          water=max(water,pool(p,vec2(-4.66,4.85),vec2(1.79,.61)));
          water=max(water,pool(p,vec2(5.28,.13),vec2(.86,3.14)));
          water=max(water,pool(p,vec2(4.61,4.68),vec2(1.45,1.77)));
          water=max(water,pool(p,vec2(-4.95,-.14),vec2(.55,2.01)));
          water=max(water,pool(p,vec2(-3.6,-4.6),vec2(1.7,.76)));
          float tattered=water+(noise(p*3.8)-.5)*.52+(noise(p*12.)-.5)*.16;
          float puddle=smoothstep(-.045,.12,tattered);
          float edge=(1.-smoothstep(.0,.048,abs(tattered+.026)))*.10;
          vec2 warp=vec2(noise(p*vec2(7.,18.)+time*.4)-.5,noise(p*vec2(15.,8.)-time*.23)-.5);
          vec2 uv=projected.xy/projected.w+warp*mix(.010,.0034,puddle);
          float scatter=mix(.009,.0038,puddle);
          vec3 image=texture2D(tDiffuse,uv).rgb*.46;
          image+=texture2D(tDiffuse,uv+vec2(scatter,scatter*.32)).rgb*.27;
          image+=texture2D(tDiffuse,uv-vec2(scatter,scatter*.32)).rgb*.27;
          image=max(image-vec3(.020,.025,.045),0.);
          float streak=.48+.52*noise(p*vec2(12.,2.8));
          vec3 base=color*(.69+.43*aggregate)*(1.-.47*puddle);
          base+=edge*vec3(.035,.051,.077);
          base+=pow(max(0.,1.-length((p-vec2(-3.65,4.04))/vec2(2.64,2.00))),2.)*vec3(.027,.023,.044);
          base+=pow(max(0.,1.-length((p-vec2(.0,3.23))/vec2(4.5,2.4))),2.)*vec3(.083,.043,.022);
          base+=pow(max(0.,1.-length((p-vec2(5.25,-2.01))/vec2(1.7,2.25))),2.)*vec3(.013,.045,.065);
          base+=image*mix(.13,.49,puddle)*streak;
          gl_FragColor=vec4(base,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    },
  });
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.y = .002;
  scene.add(asphalt);
  // The infinite background uses the main drawing-buffer dimensions. Suppress it in the mirror camera.
  const drawReflection = asphalt.onBeforeRender.bind(asphalt);
  const lastView = new THREE.Matrix4();
  const lastProjection = new THREE.Matrix4();
  let lastReflection = -Infinity;
  asphalt.onBeforeRender = (renderer, renderScene, camera) => {
    const now = performance.now();
    if (now - lastReflection < 31 && lastView.equals(camera.matrixWorld) && lastProjection.equals(camera.projectionMatrix)) return;
    lastReflection = now;
    lastView.copy(camera.matrixWorld);
    lastProjection.copy(camera.projectionMatrix);
    stage.visible = false;
    shadow.visible = false;
    try {
      drawReflection(renderer, renderScene, camera);
    } finally {
      stage.visible = true;
      shadow.visible = true;
    }
  };
  return { asphalt, stage };
}
