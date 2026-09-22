/* ------------------------------------------------------------------
   00-util.js  --  shared helpers: rng, cel materials, outlines,
                   primitive builders, glow / wet-reflection sprites
------------------------------------------------------------------ */
window.RN = window.RN || {};

(function (RN) {
  'use strict';

  RN.TAU = Math.PI * 2;
  RN.D2R = Math.PI / 180;

  /* ---------------------------------------------------------------
     deterministic random  (so the diorama is identical every load)
  --------------------------------------------------------------- */
  var _s = 0x711;
  RN.seed = function (v) { _s = v >>> 0; };
  RN.rnd = function () {
    _s = (_s + 0x6D2B79F5) >>> 0;
    var t = _s;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  RN.rand = function (a, b) { return a + (b - a) * RN.rnd(); };
  RN.randi = function (a, b) { return Math.floor(a + (b - a + 1) * RN.rnd()); };
  RN.pick = function (arr) { return arr[Math.floor(RN.rnd() * arr.length)]; };
  RN.seed(0x711);

  /* ---------------------------------------------------------------
     cel-shading gradient ramp
  --------------------------------------------------------------- */
  RN.grad = (function () {
    var stops = [0x323750, 0x5d6785, 0x8d97b4, 0xbcc5dd, 0xffffff];
    var n = stops.length;
    var data = new Uint8Array(n * 4);
    var c = new THREE.Color();
    for (var i = 0; i < n; i++) {
      c.setHex(stops[i]);
      data[i * 4 + 0] = Math.round(c.r * 255);
      data[i * 4 + 1] = Math.round(c.g * 255);
      data[i * 4 + 2] = Math.round(c.b * 255);
      data[i * 4 + 3] = 255;
    }
    var t = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  })();

  RN.toon = function (color, o) {
    o = o || {};
    o.color = color;
    o.gradientMap = RN.grad;
    return new THREE.MeshToonMaterial(o);
  };

  /* ---------------------------------------------------------------
     inverted-hull outlines
  --------------------------------------------------------------- */
  var OUTLINE_VS = [
    'uniform float uThick;',
    'void main() {',
    '  vec3 p = position + normalize(normal) * uThick;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
    '}'
  ].join('\n');

  var OUTLINE_FS = [
    'uniform vec3 uColor;',
    'void main() { gl_FragColor = vec4(uColor, 1.0); }'
  ].join('\n');

  RN.OUTLINE_COLOR = 0x191428;

  RN.addOutline = function (mesh, thick) {
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uThick: { value: thick === undefined ? 0.02 : thick },
        uColor: { value: new THREE.Color(RN.OUTLINE_COLOR) }
      },
      vertexShader: OUTLINE_VS,
      fragmentShader: OUTLINE_FS,
      side: THREE.BackSide,
      fog: false
    });
    var o = new THREE.Mesh(mesh.geometry, mat);
    o.renderOrder = -1;
    o.frustumCulled = false;
    o.name = '__outline';
    mesh.add(o);
    return o;
  };

  /* ---------------------------------------------------------------
     primitive builders
  --------------------------------------------------------------- */
  RN.box = function (w, h, d, mat, o) {
    o = o || {};
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    if (o.outline !== false) RN.addOutline(m, o.outline);
    return m;
  };

  RN.cyl = function (rt, rb, h, seg, mat, o) {
    o = o || {};
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14, 1, false), mat);
    if (o.outline !== false) RN.addOutline(m, o.outline);
    return m;
  };

  RN.plane = function (w, h, mat) {
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  };

  RN.slab = function (w, h, d, mat, o) {
    return RN.box(w, h, d, mat, o);
  };

  RN.at = function (obj, x, y, z) { obj.position.set(x, y, z); return obj; };
  RN.rot = function (obj, x, y, z) { obj.rotation.set(x, y, z); return obj; };
  RN.rotY = function (obj, y) { obj.rotation.y = y; return obj; };
  RN.group = function (parent, name) {
    var g = new THREE.Group();
    if (name) g.name = name;
    if (parent) parent.add(g);
    return g;
  };

  /* ---------------------------------------------------------------
     additive glow sprites (neon halos)
  --------------------------------------------------------------- */
  RN.glow = function (color, size, opacity) {
    var m = new THREE.SpriteMaterial({
      map: RN.tex.glow,
      color: color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      opacity: opacity === undefined ? 0.55 : opacity,
      fog: false
    });
    var s = new THREE.Sprite(m);
    s.scale.set(size, size, 1);
    s.name = '__glow';
    return s;
  };

  /* ---------------------------------------------------------------
     wet-ground light smears.  Each smear is a flat additive blob
     that always stretches from its light source toward the camera,
     imitating a reflection on the rain-soaked asphalt.
  --------------------------------------------------------------- */
  RN.smears = [];

  RN.smear = function (parent, x, z, color, w, l, opacity, y) {
    var pivot = new THREE.Group();
    pivot.position.set(x, y === undefined ? 0.012 : y, z);

    var mat = new THREE.MeshBasicMaterial({
      map: RN.tex.smear,
      color: color,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: opacity === undefined ? 0.4 : opacity,
      fog: true
    });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, l), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.z = l * 0.5;
    mesh.renderOrder = 2;
    pivot.add(mesh);
    parent.add(pivot);

    var rec = {
      pivot: pivot,
      mat: mat,
      baseOpacity: mat.opacity,
      x: x,
      z: z
    };
    RN.smears.push(rec);
    return rec;
  };

  RN.updateSmears = function (camPos) {
    for (var i = 0; i < RN.smears.length; i++) {
      var s = RN.smears[i];
      s.pivot.rotation.y = Math.atan2(camPos.x - s.x, camPos.z - s.z);
    }
  };

  /* ---------------------------------------------------------------
     tiny tween / easing helpers
  --------------------------------------------------------------- */
  RN.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  RN.lerp = function (a, b, t) { return a + (b - a) * t; };
  RN.smooth = function (t) { t = RN.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  RN.smoother = function (t) { t = RN.clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  RN.easeOutCubic = function (t) { t = RN.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); };
  RN.easeInOutCubic = function (t) {
    t = RN.clamp(t, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  /* ---------------------------------------------------------------
     contact shadow decal
  --------------------------------------------------------------- */
  RN.contactShadow = function (parent, x, z, w, l, opacity, y) {
    var mat = new THREE.MeshBasicMaterial({
      map: RN.tex.shadow,
      transparent: true,
      depthWrite: false,
      opacity: opacity === undefined ? 0.55 : opacity,
      color: 0x05060d,
      fog: true
    });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y === undefined ? 0.008 : y, z);
    m.renderOrder = 1;
    parent.add(m);
    return m;
  };

  /* ---------------------------------------------------------------
     misc
  --------------------------------------------------------------- */
  RN.disposeTree = function () { /* placeholder for future use */ };

})(window.RN);
