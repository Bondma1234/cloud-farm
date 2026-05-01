// ============ 业务常量 ============

export const PACKAGE_PRICES = {
  basic: 499,
  pro: 799,
  family: 699,
} as const;

export const PACKAGE_AREAS = {
  basic: 10,
  pro: 15,
  family: 10,
} as const;

// 套餐对应推荐保底斤数
export const PACKAGE_GUARANTEE = {
  basic: 10,
  pro: 20,
  family: 10,
} as const;

// 指令冷却时间(毫秒)
export const COMMAND_COOLDOWN_MS = {
  water: 6 * 3600 * 1000,
  fertilize: 7 * 24 * 3600 * 1000,
  weed: 3 * 24 * 3600 * 1000,
  shoot: 8 * 3600 * 1000,
  pest: 0,
  plant: 0,
} as const;

// 指令季度上限
export const COMMAND_QUARTERLY_LIMIT = {
  water: Infinity,
  fertilize: 6,
  weed: 12,
  shoot: 30,
  pest: 6,
  plant: Infinity,
} as const;

// 摄像头取流地址有效期(秒, 与萤石云 token TTL 一致)
export const CAMERA_URL_TTL_SECONDS = 600;

// 手机号正则
export const PHONE_REGEX = /^1[3-9]\d{9}$/;

// 主色板(与 packages/ui-tokens 后续可能合并)
export const BRAND_COLORS = {
  primary: '#4CA777',
  primaryDark: '#2E7D32',
  accent: '#F4B942',
  danger: '#E57373',
} as const;
