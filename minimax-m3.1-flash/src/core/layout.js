/**
 * 场景尺寸总表 —— 所有模块共享的唯一事实来源。
 * 单位约定：1 unit ≈ 1 米，底座为 12m × 12m 的正方形。
 */

export const BASE = {
  size: 12,          // 正方形底座边长
  top: 0,            // 底座上表面 y
  thickness: 0.42,   // 底座厚度
};

/** 便利店建筑体量 */
export const STORE = {
  x0: -3.6, x1: 1.7,   // 5.3 宽
  z0: -3.6, z1: 1.6,   // 5.2 深
  floorY: 0.17,        // 店内地坪（与人行道同高）
  ceilY: 2.42,         // 室内天花板
  wallTop: 3.30,       // 外墙顶部
  roofTop: 3.50,
  fasciaY0: 2.55,      // 招牌灯箱下沿
  fasciaY1: 3.30,      // 招牌灯箱上沿
  glassTop: 2.36,      // 玻璃上沿
  glassBot: 0.17,
  awningZ: 2.40,       // 雨棚外沿
  awningY: 2.47,
  wall: 0.16,          // 外墙厚度
};

/** 店内可用空间 */
export const INNER = {
  x0: -3.44, x1: 1.54,
  z0: -3.44, z1: 1.44,
};

/** 自动门（南立面） */
export const DOOR = {
  x0: -0.86, x1: 0.86,
  z: STORE.z1,
  panel: 0.86,
  h: 2.12,
};

/** 街道分区 */
export const STREET = {
  walkFrontZ0: STORE.z1,   // 1.6
  walkFrontZ1: 2.6,        // 店前人行道
  roadA0: 2.6,             // 主街 (东西向) z 范围
  roadA1: 4.95,
  walkSouth0: 4.95,
  walkSouth1: 6.0,
  walkEastX0: STORE.x1,    // 1.7
  walkEastX1: 2.7,
  roadB0: 2.7,             // 支路 (南北向) x 范围
  roadB1: 4.95,
  walkFarEastX1: 6.0,
  walkWestX1: -3.6,        // 店西侧空地
  walkNorthZ1: -3.6,       // 店后空地
  curbH: 0.17,
  sidewalkY: 0.17,
  roadY: 0.07,         // 沥青路面高度（须高于底座顶板 0.06）
};

/** 斑马线（横穿主街，位于路口西侧） */
export const CROSSWALK = {
  x0: 0.95, x1: 2.35,
  bars: 3,
  barW: 0.36,
  gap: 0.24,
};

/** 停车位（北侧空地内，靠近支路） */
export const PARKING = {
  x0: -0.6, x1: 1.5,
  z0: -5.65, z1: -4.05,
};

/** 小巷（店西侧通道） */
export const ALLEY = {
  x0: -5.55, x1: -3.76,
  z0: -3.4, z1: 2.6,
};

/** 场景里所有会动的对象都会注册到这里 */
export class Rig {
  constructor() {
    this.updaters = [];
  }
  add(fn) {
    this.updaters.push(fn);
    return fn;
  }
  update(t, dt) {
    for (const fn of this.updaters) fn(t, dt);
  }
}
