import * as THREE from 'three';
import { PAL } from './palette.js';
import * as TX from './textures.js';

/**
 * 三渲二材质库
 * - 主体用 MeshToonMaterial + 色阶贴图制造硬边明暗
 * - 霓虹 / 灯箱用 MeshBasicMaterial（不受光，永远亮）
 * - 湿地用 MeshPhongMaterial + 环境贴图制造高光反射
 */
export function createMaterials() {
  const ramp = TX.toonRamp([0.30, 0.56, 0.78, 1.0]);
  ramp.wrapS = ramp.wrapT = THREE.ClampToEdgeWrapping;

  const toon = (color, opts = {}) =>
    new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...opts });

  /** 关闭描边（用于大面积平面 / 透明件） */
  const noOutline = (m) => {
    m.userData.outlineParameters = { visible: false };
    return m;
  };

  /** 自定义描边粗细与颜色 */
  const outlined = (m, thickness = 0.0045, color = [0.03, 0.04, 0.08]) => {
    m.userData.outlineParameters = { thickness, color, alpha: 1.0 };
    return m;
  };

  const flat = (color, opts = {}) => new THREE.MeshBasicMaterial({ color, ...opts });

  const mats = {
    ramp,

    // —— 基础 ——
    base: toon(PAL.nightDeep),
    baseRim: toon(0x1b2130),
    concrete: toon(PAL.concrete),
    concreteDark: toon(0x3f434b),
    steel: toon(PAL.steel),
    steelDark: toon(PAL.steelDark),
    frame: toon(PAL.frame),
    frameDark: toon(PAL.frameDark),
    white: toon(0xf1eee4),
    black: toon(0x1a1d22),
    rubber: toon(0x23262b),
    wood: toon(PAL.wood),
    cardboard: toon(PAL.cardboard),
    leaf: toon(PAL.leaf),

    // —— 街道 ——
    curb: toon(PAL.curb),
    curbTop: toon(PAL.curbTop),
    sidewalk: toon(0xffffff, { map: TX.sidewalkTexture() }),
    tactile: toon(PAL.tactile),
    gutter: toon(PAL.gutter),
    manhole: toon(PAL.manhole),
    lineWhite: noOutline(toon(PAL.asphaltLine, { emissive: 0x2a3348, emissiveIntensity: 0.8 })),
    crosswalk: noOutline(toon(0xd8e2ee, { emissive: 0x39445c, emissiveIntensity: 0.9 })),

    // —— 店体 ——
    storeWall: toon(PAL.storeWall),
    storeWallShade: toon(PAL.storeWallShade),
    storeTrim: toon(PAL.storeTrim),
    brandGreen: toon(PAL.brandGreen),
    brandGreenDark: toon(PAL.brandGreenDark),
    brandOrange: toon(PAL.brandOrange),
    brandCream: toon(PAL.brandCream),
    brandRed: toon(PAL.brandRed),
    awning: toon(0xe2ddd0),
    awningEdge: toon(PAL.awningEdge),
    roof: toon(0x33383f),
    roofTrim: toon(0x1f242b),

    // —— 室内 ——
    innerWall: toon(PAL.wallInner),
    floorTile: toon(PAL.floorTile),
    shelf: toon(PAL.shelfMetal),
    shelfTrim: toon(PAL.shelfTrim),
    counter: toon(PAL.counterBody),
    counterTop: toon(PAL.counterTop),
    coolerFrame: toon(PAL.coolerFrame),
    freezerBody: toon(0xdfe3e6),
    locker: toon(0xc9cdd2),

    // —— 玻璃 ——
    glass: noOutline(new THREE.MeshPhongMaterial({
      color: 0x9fc4d8,
      transparent: true,
      opacity: 0.085,
      shininess: 40,
      specular: 0x2f4256,
      reflectivity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    })),
    glassCooler: noOutline(new THREE.MeshPhongMaterial({
      color: 0xcfe8f2,
      transparent: true,
      opacity: 0.16,
      shininess: 90,
      specular: 0x8fb4c8,
      reflectivity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    })),
    caseGlass: noOutline(new THREE.MeshPhongMaterial({
      color: 0xdcecf2,
      transparent: true,
      opacity: 0.13,
      shininess: 80,
      specular: 0x9fc0cc,
      reflectivity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    })),

    // —— 发光件 ——
    lampGlass: flat(0xfff6e2),
    lampHousing: toon(0x40454e),
    signPanel: flat(0xffffff),
    neonSign: flat(0xffffff),
    vendingBody: toon(0xb8341f),
    vendingGlow: flat(0xfff2d4),
    coolerGlow: flat(0xe8f7ff),
    trafficLens: flat(0x222222),
    trafficRed: flat(PAL.trafficRed),
    trafficGreen: flat(PAL.trafficGreen),
    trafficAmber: flat(PAL.trafficAmber),
    headLight: flat(0xfff6dd),
    taillight: flat(0xff5a4a),
  };

  // —— 湿路面（带环境反射） ——
  mats.road = noOutline(new THREE.MeshPhongMaterial({
    color: 0x171b23,
    specular: 0x5c7593,
    shininess: 95,
    reflectivity: 0.28,
  }));
  mats.road.map = TX.asphaltTexture();

  mats.puddle = noOutline(new THREE.MeshPhongMaterial({
    color: 0x0e131c,
    specular: 0x7e9cc0,
    shininess: 130,
    reflectivity: 0.42,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  }));

  mats.asphaltLine = mats.lineWhite;

  // —— 自发光描边微调 ——
  outlined(mats.white, 0.005);
  outlined(mats.storeWall, 0.005);
  outlined(mats.frame, 0.0035);
  outlined(mats.counter, 0.004);

  return mats;
}

/**
 * 创建一枚面向相机的柔光光晕（Sprite）。
 */
export function makeGlow(color, size, opacity = 0.65) {
  const mat = new THREE.SpriteMaterial({
    map: TX.glowTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(size, size, 1);
  return sp;
}

/** 地面的湿光反射拖尾 */
export function makeStreak(color, width, length, opacity = 0.55) {
  const geo = new THREE.PlaneGeometry(width, length);
  const mat = new THREE.MeshBasicMaterial({
    map: TX.reflectionStreakTexture(),
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 2;
  return m;
}
