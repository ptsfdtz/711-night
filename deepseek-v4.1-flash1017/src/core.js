/* core.js — shared palette, toon materials and tiny modelling helpers */
(function () {
  "use strict";

  const NM = (window.NM = {});
  const T = THREE;

  NM.T = T;
  NM.C = {
    ink: 0x121820,
    inkSoft: 0x202a32,
    asphalt: 0x202a31,
    asphaltDark: 0x141d24,
    concrete: 0x7b898b,
    concreteDark: 0x4e5d62,
    curbside: 0x9aa6a4,
    warmLight: 0xffdda2,
    warmWhite: 0xfff2d4,
    cream: 0xf0e2c7,
    night: 0x0a131d,
    teal: 0x1f6b67,
    tealLight: 0x4c9e94,
    orange: 0xdf7a3f,
    red: 0xb94f4b,
    blue: 0x315e7b,
    glass: 0xa9d8dc,
    leaf: 0x2e5144,
  };

  NM.group = function (name, parent) {
    const g = new T.Group();
    g.name = name || "group";
    (parent || NM.scene).add(g);
    return g;
  };

  /* --------------------------------------------------------------------- */
  /* Materials                                                             */
  /* --------------------------------------------------------------------- */

  NM._gradient = (() => {
    const data = new Uint8Array([26, 96, 168, 232, 255].map((v) => [v, v, v, 255]).flat());
    const tex = new T.DataTexture(data, 5, 1, T.RGBAFormat);
    tex.minFilter = T.NearestFilter;
    tex.magFilter = T.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  })();

  NM._matCache = new Map();

  NM.toon = function (color, opts) {
    opts = opts || {};
    const key = color + "|" + (opts.emissive || 0) + "|" + (opts.emissiveIntensity || 0) + "|" +
      (opts.transparent || false) + "|" + (opts.opacity == null ? 1 : opts.opacity) + "|" +
      (opts.side || 0) + "|" + (opts.depthWrite == null ? true : opts.depthWrite);
    if (!opts.unique && NM._matCache.has(key)) return NM._matCache.get(key);
    const mat = new T.MeshToonMaterial({
      color: color,
      gradientMap: NM._gradient,
      emissive: opts.emissive != null ? opts.emissive : 0x000000,
      emissiveIntensity: opts.emissiveIntensity != null ? opts.emissiveIntensity : 1,
      transparent: !!opts.transparent,
      opacity: opts.opacity == null ? 1 : opts.opacity,
      side: opts.side || T.FrontSide,
      depthWrite: opts.depthWrite == null ? true : opts.depthWrite,
      fog: opts.fog !== false,
    });
    if (opts.map) {
      mat.map = opts.map;
      mat.needsUpdate = true;
    }
    if (!opts.unique) NM._matCache.set(key, mat);
    return mat;
  };

  NM.basic = function (color, opts) {
    opts = opts || {};
    return new T.MeshBasicMaterial({
      color: color,
      map: opts.map || null,
      transparent: !!opts.transparent,
      opacity: opts.opacity == null ? 1 : opts.opacity,
      side: opts.side || T.FrontSide,
      blending: opts.blending || T.NormalBlending,
      depthWrite: opts.depthWrite == null ? true : opts.depthWrite,
      depthTest: opts.depthTest == null ? true : opts.depthTest,
      toneMapped: opts.toneMapped == null ? true : opts.toneMapped,
      fog: opts.fog !== false,
    });
  };

  NM.glassMat = function (opacity) {
    return new T.MeshBasicMaterial({
      color: 0xb7dfe8,
      transparent: true,
      opacity: opacity == null ? 0.12 : opacity,
      side: T.DoubleSide,
      depthWrite: false,
      blending: T.AdditiveBlending,
      toneMapped: false,
      fog: false,
    });
  };

  NM.edgeMat = new T.LineBasicMaterial({
    color: NM.C.ink,
    transparent: true,
    opacity: 0.92,
    depthWrite: true,
  });

  NM.edgeMatSoft = new T.LineBasicMaterial({
    color: 0x283238,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  /* --------------------------------------------------------------------- */
  /* Geometry helpers                                                      */
  /* --------------------------------------------------------------------- */

  NM.addOutline = function (mesh, threshold, color, opacity) {
    if (!mesh.geometry) return null;
    const edges = new T.EdgesGeometry(mesh.geometry, threshold == null ? 32 : threshold);
    const mat = color
      ? new T.LineBasicMaterial({
          color,
          transparent: true,
          opacity: opacity == null ? 0.9 : opacity,
          depthWrite: true,
        })
      : NM.edgeMat;
    const line = new T.LineSegments(edges, mat);
    line.scale.setScalar(1.0015);
    line.renderOrder = 2;
    line.raycast = function () {};
    mesh.add(line);
    return line;
  };

  NM.box = function (parent, o) {
    o = o || {};
    const geo = new T.BoxGeometry(o.w == null ? 1 : o.w, o.h == null ? 1 : o.h, o.d == null ? 1 : o.d);
    const mat = o.mat || NM.toon(o.color == null ? 0xffffff : o.color, o);
    const mesh = new T.Mesh(geo, mat);
    mesh.position.set(o.x || 0, o.y || 0, o.z || 0);
    if (o.rotX) mesh.rotation.x = o.rotX;
    if (o.rotY) mesh.rotation.y = o.rotY;
    if (o.rotZ) mesh.rotation.z = o.rotZ;
    mesh.castShadow = o.cast !== false;
    mesh.receiveShadow = o.receive !== false;
    mesh.name = o.name || "";
    if (o.outline) NM.addOutline(mesh, o.edgeThreshold, o.outlineColor, o.outlineOpacity);
    parent.add(mesh);
    return mesh;
  };

  NM.plane = function (parent, o) {
    o = o || {};
    const w = o.w == null ? 1 : o.w;
    const h = o.h == null ? 1 : o.h;
    const sx = o.sx == null ? 1 : o.sx;
    const sy = o.sy == null ? 1 : o.sy;
    const geo = new T.PlaneGeometry(w, h, sx, sy);
    const mat = o.mat || (o.map
      ? new T.MeshBasicMaterial({
          map: o.map,
          color: o.color == null ? 0xffffff : o.color,
          transparent: !!o.transparent,
          opacity: o.opacity == null ? 1 : o.opacity,
          side: o.side || T.FrontSide,
          depthWrite: o.depthWrite == null ? true : o.depthWrite,
          blending: o.blending || T.NormalBlending,
          toneMapped: o.toneMapped == null ? false : o.toneMapped,
          fog: o.fog !== false,
        })
      : NM.toon(o.color == null ? 0xffffff : o.color, o));
    const mesh = new T.Mesh(geo, mat);
    mesh.position.set(o.x || 0, o.y || 0, o.z || 0);
    mesh.rotation.set(o.rotX || 0, o.rotY || 0, o.rotZ || 0);
    mesh.receiveShadow = o.receive !== false;
    mesh.castShadow = !!o.cast;
    mesh.renderOrder = o.renderOrder || 0;
    mesh.name = o.name || "";
    parent.add(mesh);
    return mesh;
  };

  NM.cyl = function (parent, o) {
    o = o || {};
    const rt = o.rt == null ? (o.r == null ? 0.5 : o.r) : o.rt;
    const rb = o.rb == null ? (o.r == null ? 0.5 : o.r) : o.rb;
    const geo = new T.CylinderGeometry(rt, rb, o.h == null ? 1 : o.h, o.seg == null ? 10 : o.seg, 1, !!o.open);
    const mat = o.mat || NM.toon(o.color == null ? 0xffffff : o.color, o);
    const mesh = new T.Mesh(geo, mat);
    mesh.position.set(o.x || 0, o.y || 0, o.z || 0);
    if (o.rotX) mesh.rotation.x = o.rotX;
    if (o.rotY) mesh.rotation.y = o.rotY;
    if (o.rotZ) mesh.rotation.z = o.rotZ;
    mesh.castShadow = o.cast !== false;
    mesh.receiveShadow = o.receive !== false;
    if (o.outline) NM.addOutline(mesh, o.edgeThreshold == null ? 28 : o.edgeThreshold);
    parent.add(mesh);
    return mesh;
  };

  NM.sphere = function (parent, o) {
    o = o || {};
    const geo = new T.SphereGeometry(o.r == null ? 0.5 : o.r, o.seg == null ? 12 : o.seg, o.segY == null ? 8 : o.segY);
    const mat = o.mat || NM.toon(o.color == null ? 0xffffff : o.color, o);
    const mesh = new T.Mesh(geo, mat);
    mesh.position.set(o.x || 0, o.y || 0, o.z || 0);
    mesh.scale.set(o.sx || 1, o.sy || 1, o.sz || 1);
    mesh.castShadow = o.cast !== false;
    mesh.receiveShadow = o.receive !== false;
    parent.add(mesh);
    return mesh;
  };

  NM.panel = function (parent, o) {
    o = o || {};
    const geo = new T.PlaneGeometry(o.w == null ? 1 : o.w, o.h == null ? 1 : o.h);
    const mat = new T.MeshBasicMaterial({
      map: o.map,
      color: o.color == null ? 0xffffff : o.color,
      transparent: o.transparent !== false,
      opacity: o.opacity == null ? 1 : o.opacity,
      side: o.side || T.FrontSide,
      depthWrite: o.depthWrite == null ? true : o.depthWrite,
      depthTest: o.depthTest !== false,
      blending: o.blending || T.NormalBlending,
      toneMapped: o.toneMapped === true,
      fog: o.fog !== false,
    });
    const mesh = new T.Mesh(geo, mat);
    mesh.position.set(o.x || 0, o.y || 0, o.z || 0);
    mesh.rotation.set(o.rotX || 0, o.rotY || 0, o.rotZ || 0);
    mesh.renderOrder = o.renderOrder || 0;
    mesh.name = o.name || "";
    parent.add(mesh);
    return mesh;
  };

  NM.sprite = function (parent, o) {
    o = o || {};
    const map = o.map || (window.TEX && TEX.glow());
    const mat = new T.SpriteMaterial({
      map: map,
      color: o.color == null ? 0xffffff : o.color,
      transparent: true,
      opacity: o.opacity == null ? 1 : o.opacity,
      blending: o.blending || T.AdditiveBlending,
      depthWrite: false,
      depthTest: o.depthTest !== false,
      toneMapped: false,
      fog: false,
    });
    const sprite = new T.Sprite(mat);
    sprite.position.set(o.x || 0, o.y || 0, o.z || 0);
    sprite.scale.set(o.sx || 1, o.sy || 1, 1);
    sprite.renderOrder = o.renderOrder || 5;
    parent.add(sprite);
    return sprite;
  };

  NM.glowSprite = function (parent, o) {
    return NM.sprite(parent, Object.assign({}, o, { map: window.TEX ? TEX.glow() : null }));
  };

  NM.tubeBetween = function (parent, a, b, r, color, opts) {
    opts = opts || {};
    const start = a.isVector3 ? a : new T.Vector3(a[0], a[1], a[2]);
    const end = b.isVector3 ? b : new T.Vector3(b[0], b[1], b[2]);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const geo = new T.CylinderGeometry(r, r, len, opts.seg || 6, 1, false);
    const mesh = new T.Mesh(geo, opts.mat || NM.toon(color == null ? 0xffffff : color, opts));
    mesh.position.copy(start).add(end).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    mesh.castShadow = opts.cast !== false;
    mesh.receiveShadow = opts.receive !== false;
    parent.add(mesh);
    return mesh;
  };

  NM.pipePath = function (parent, points, radius, color, opts) {
    opts = opts || {};
    const curve = new T.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new T.Vector3(p[0], p[1], p[2]))));
    const geo = new T.TubeGeometry(curve, opts.segments || Math.max(12, points.length * 8), radius, opts.radial || 6, false);
    const mesh = new T.Mesh(geo, opts.mat || NM.toon(color == null ? 0xffffff : color, opts));
    mesh.castShadow = opts.cast !== false;
    mesh.receiveShadow = opts.receive !== false;
    parent.add(mesh);
    return mesh;
  };

  NM.line = function (parent, points, color, opacity, opts) {
    opts = opts || {};
    const geo = new T.BufferGeometry().setFromPoints(points);
    const mat = opts.mat || new T.LineBasicMaterial({
      color: color == null ? 0x05080c : color,
      transparent: true,
      opacity: opacity == null ? 0.8 : opacity,
      depthWrite: false,
      blending: opts.blending || T.NormalBlending,
      toneMapped: false,
    });
    const line = new T.Line(geo, mat);
    line.renderOrder = opts.renderOrder || 0;
    parent.add(line);
    return line;
  };

  NM.catenary = function (a, b, sag, segments) {
    const va = a.isVector3 ? a.clone() : new T.Vector3(a[0], a[1], a[2]);
    const vb = b.isVector3 ? b.clone() : new T.Vector3(b[0], b[1], b[2]);
    const pts = [];
    const count = segments || 28;
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const p = va.clone().lerp(vb, t);
      p.y -= Math.sin(Math.PI * t) * sag;
      pts.push(p);
    }
    return pts;
  };

  NM.makeInstanceBoxes = function (parent, items, mat) {
    // items: {x,y,z,w,h,d,color,rotY}
    const geo = new T.BoxGeometry(1, 1, 1);
    const material = mat || new T.MeshToonMaterial({ color: 0xffffff, gradientMap: NM._gradient });
    const inst = new T.InstancedMesh(geo, material, items.length);
    const dummy = new T.Object3D();
    const color = new T.Color();
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y, it.z);
      dummy.rotation.set(it.rotX || 0, it.rotY || 0, it.rotZ || 0);
      dummy.scale.set(it.w || 0.2, it.h || 0.2, it.d || 0.2);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      if (it.color != null) {
        color.setHex(it.color);
        inst.setColorAt(i, color);
      }
    });
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.castShadow = true;
    inst.receiveShadow = true;
    parent.add(inst);
    return inst;
  };

  /* --------------------------------------------------------------------- */
  /* Tiny utilities                                                        */
  /* --------------------------------------------------------------------- */

  NM.seedRandom = function (seed) {
    let s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  NM.lerp = function (a, b, t) {
    return a + (b - a) * t;
  };

  NM.smoothstep = function (edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };

  NM.damp = function (a, b, lambda, dt) {
    return NM.lerp(a, b, 1 - Math.exp(-lambda * dt));
  };

  NM.clamp = function (v, a, b) {
    return Math.max(a, Math.min(b, v));
  };

  NM.discGeometry = function (r, segments) {
    const geo = new T.CircleGeometry(r, segments || 24);
    geo.rotateX(-Math.PI / 2);
    return geo;
  };

  NM.irregularPuddle = function (rx, rz, seed, segments) {
    const rnd = NM.seedRandom(seed || 1);
    const n = segments || 26;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const wobble = 0.78 + rnd() * 0.26 + Math.sin(a * 3 + rnd() * 2) * 0.06;
      pts.push(new T.Vector2(Math.cos(a) * rx * wobble, Math.sin(a) * rz * wobble));
    }
    const shape = new T.Shape(pts);
    const geo = new T.ShapeGeometry(shape, 4);
    geo.rotateX(-Math.PI / 2);
    return geo;
  };

  NM.setShadow = function (obj, cast, receive) {
    obj.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = cast !== false;
        c.receiveShadow = receive !== false;
      }
    });
    return obj;
  };

  NM.labelTexture = function (text, opt) {
    // quick one-off label drawn at runtime (used for small props)
    opt = opt || {};
    const w = opt.width || 512;
    const h = opt.height || 128;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = opt.bg || "#e8dfc9";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = opt.fg || "#25363a";
    ctx.font = (opt.weight || "700") + " " + (opt.size || Math.round(h * 0.46)) + "px " + (opt.font || "'Yu Gothic', Meiryo, sans-serif");
    ctx.textAlign = opt.align || "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, opt.x == null ? w / 2 : opt.x, opt.y == null ? h / 2 : opt.y);
    const tex = new T.CanvasTexture(canvas);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  };
})();
