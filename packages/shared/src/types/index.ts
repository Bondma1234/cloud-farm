// ============ 业务核心类型 ============
// 这些类型从 apps/miniapp/src/stores/mock.js 抽出来,
// P2 后端落 Prisma schema 时会与本文件保持一一映射

// Package id 是业务可读 string,P3 admin 能创建任意 id,所以放开为 string
export type PackageId = string;

export interface Package {
  id: PackageId;
  name: string;
  area: number; // 平方米
  price: number; // 元/年
  tag: string; // '热销' / '推荐' / '亲子' / '企业' / '新品' / '限定' 等
  cover: string;
  gallery: string[];
  highlights: string[];
  crops: string[];
  status?: 'active' | 'archived';
  sortOrder?: number;
}

export type PlotStatus = 'available' | 'sold' | 'maintenance' | 'reserved';

export interface Plot {
  id: string; // P-A-07
  block: string; // A 区
  row: number;
  col: number;
  status: PlotStatus;
  sunHours: number;
  soilScore: number;
}

export interface MyPlot {
  id: string;
  name: string;
  crop: string;
  cropEmoji: string;
  plantedAt: string;
  daysElapsed: number;
  daysTotal: number;
  stage: string;
  progress: number;
  nextAction: string;
  weather: { temp: number; cond: string; rainMm: number };
  cameraOnline: boolean;
  snapshot: string;
  growthLog: GrowthLogItem[];
}

export interface GrowthLogItem {
  date: string;
  title: string;
  photo: string; // emoji 或 url
}

export type CommandType = 'water' | 'fertilize' | 'weed' | 'shoot' | 'pest' | 'plant';
export type CommandStatus = 'pending' | 'executing' | 'completed' | 'rejected';

export interface Command {
  id: string;
  type: CommandType;
  icon: string;
  label: string;
  plotId: string;
  requestedAt: string;
  completedAt?: string;
  status: CommandStatus;
  statusLabel: string;
  by: string;
  note: string;
  photo: string | null;
  cost: number;
}

export type OrderStatus = 'pending' | 'shipped' | 'delivering' | 'completed' | 'growing' | 'cancelled';

export interface Order {
  id: string;
  type: '认养' | '产地直送' | string;
  typeIcon: string;
  title: string;
  cover: string;
  price: number;
  count: number;
  status: OrderStatus;
  statusLabel: string;
  date: string;
  packageId?: string;
  addressId?: string;
  subItems?: { label: string; value: string }[];
  timeline?: { at: string; event: string; done: boolean }[];
  logistics?: {
    company: string;
    no: string;
    nodes: { at: string; node: string }[];
  };
  canReview?: boolean;
  expireIn?: string;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  tag?: '家' | '公司' | '爸妈' | string;
  isDefault: boolean;
}

export interface User {
  id?: string; // 后端返回时有,前端 mock 时无
  nickname: string;
  avatar: string;
  level: string;
  phone: string;
  unionid?: string;
  openid?: string;
  role?: 'customer' | 'agronomist' | 'cs' | 'operator' | 'admin';
  /** ISO 时间, 前端用来算"种地第 N 天" */
  createdAt?: string;
}

// ============ 摄像头 (P5 才用) ============
export type CameraVendor = 'hikvision' | 'ezviz' | 'custom';
export type CameraStatus = 'online' | 'offline' | 'maintenance';

export interface Camera {
  id: string;
  deviceSerial: string;
  plotId: string;
  vendor: CameraVendor;
  channelNo: number;
  ptzSupported: boolean;
  status: CameraStatus;
  lastOnlineAt?: string;
}

// ============ 田园动态 ============
export type JournalType = 'bloom' | 'water' | 'fertilize' | 'weed' | 'shoot' | 'plant' | 'ship' | 'harvest' | 'pest';

export interface JournalEntry {
  id: string;
  type: JournalType;
  icon: string;
  title: string;
  summary: string;
  body: string;
  photos: string[];
  by: string;
  at: string;
  plotId: string | null;
  likes: number;
  comments: number;
}

// ============ 作物百科 ============
export interface Crop {
  id: string;
  name: string;
  emoji: string;
  cover: string;
  season: string; // 春秋 / 夏秋 ...
  difficulty: number; // 1-5
  daysToHarvest: string;
  yieldPerSqm: string;
  intro: string;
  tags: string[];
  recommendPkg: string[];
  status?: 'active' | 'archived';
  sortOrder?: number;
}

// ============ LiveRoom(农场直击 · C5)============
// C 端"直播"tab 的公开展示;非直播带货、非用户私有摄像头。
export interface LiveRoom {
  id: string;
  title: string;
  cover: string;
  host: string;
  viewers: number;
  live: boolean;
  scene: string;
  location: string;
  cropName: string;
  sortOrder?: number;
}

// ============ Auth ============
export interface LoginParams {
  phone: string;
  code: string;
  inviteCode?: string;   // P8 B: 新用户注册可带邀请码
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    phone: string;
    nickname: string;
    avatar: string;
    level: string;
    role: string;
  };
}

// ============ API 包装 ============
export interface ApiResponse<T> {
  code: number; // 0 = 成功
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  list: T[];
  page: number;
  size: number;
  total: number;
}
