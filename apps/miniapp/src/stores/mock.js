import { defineStore } from 'pinia';
import { PKG_COVER, CROP, FARM, LIVE, MISC } from '../mock/images';

// ============ 认养套餐 ============
export const PACKAGES = [
  {
    id: 'pkg-basic',
    name: '基础版 · 10㎡',
    area: 10,
    price: 499,
    tag: '热销',
    cover: PKG_COVER.basic,
    gallery: [PKG_COVER.basic, FARM.hero, CROP.pumpkin, FARM.detail1],
    highlights: ['1 种作物', '保底 10 斤', '包邮 2 次', '共享摄像头'],
    crops: ['红薯', '胡萝卜', '土豆', '南瓜']
  },
  {
    id: 'pkg-pro',
    name: '进阶版 · 15㎡',
    area: 15,
    price: 799,
    tag: '推荐',
    cover: PKG_COVER.pro,
    gallery: [PKG_COVER.pro, CROP.tomato, CROP.strawberry, FARM.detail2],
    highlights: ['2 种作物', '保底 20 斤', '包邮 3 次', '专属可遥控摄像头'],
    crops: ['红薯', '胡萝卜', '小番茄', '草莓', '南瓜', '香椿']
  },
  {
    id: 'pkg-family',
    name: '亲子版 · 10㎡',
    area: 10,
    price: 699,
    tag: '亲子',
    cover: PKG_COVER.family,
    gallery: [PKG_COVER.family, CROP.strawberry, CROP.tomato, FARM.detail3],
    highlights: ['线上自然教育 3 节', '实体种植工具包', '孩子名字立牌'],
    crops: ['小番茄', '草莓', '胡萝卜', '南瓜']
  }
];

// ============ 地块（示例 12 块） ============
export const PLOTS = Array.from({ length: 12 }).map((_, i) => ({
  id: `P-A-${String(i + 1).padStart(2, '0')}`,
  block: 'A 区',
  row: Math.floor(i / 4) + 1,
  col: (i % 4) + 1,
  status: i === 2 || i === 5 || i === 9 ? 'sold' : 'available',
  sunHours: 6 + (i % 3),
  soilScore: 85 + (i % 10)
}));

// ============ 我的田 ============
export const MY_PLOT = {
  id: 'P-A-07',
  name: '小祎的菜园',
  crop: '小番茄',
  cropEmoji: '🍅',
  plantedAt: '2026-03-01',
  daysElapsed: 49,
  daysTotal: 95,
  stage: '开花期',
  progress: 52,
  nextAction: '5月5日 · 第二次追肥',
  weather: { temp: 22, cond: '多云', rainMm: 0 },
  cameraOnline: true,
  snapshot: MISC.plotSnapshot,
  growthLog: [
    { date: '2026-04-15', title: '首批花朵开放', photo: '🌸' },
    { date: '2026-04-06', title: '完成第一次追肥', photo: '💧' },
    { date: '2026-03-20', title: '幼苗移栽成功', photo: '🌱' },
    { date: '2026-03-01', title: '种子下地', photo: '🌰' }
  ]
};

// ============ 可执行指令 ============
export const COMMANDS = [
  { key: 'water', label: '浇水', icon: '💧', cooldown: '每日 1 次', price: 0 },
  { key: 'fertilize', label: '施肥', icon: '🌿', cooldown: '7 日 1 次', price: 5 },
  { key: 'weed', label: '除草', icon: '🍃', cooldown: '按需', price: 10 },
  { key: 'shoot', label: '拍张照', icon: '📸', cooldown: '每日 3 次', price: 0 }
];

// ============ 直播 ============
export const LIVE_ROOMS = [
  { id: 'live-001', title: '挖红薯直播 · A 区',  cover: LIVE.harvest,    viewers: 1243, live: true },
  { id: 'live-002', title: '草莓大棚慢直播',      cover: LIVE.greenhouse, viewers: 482,  live: true },
  { id: 'live-003', title: '周四打包发货',        cover: LIVE.packing,    viewers: 77,   live: false }
];

// ============ 收货地址 ============
export const ADDRESSES = [
  {
    id: 'addr-1',
    name: '严先生',
    phone: '138****5412',
    province: '北京市',
    city: '北京市',
    district: '海淀区',
    detail: '中关村软件园 3 号楼 12A',
    tag: '公司',
    isDefault: true
  },
  {
    id: 'addr-2',
    name: '严小祎',
    phone: '139****7829',
    province: '北京市',
    city: '北京市',
    district: '朝阳区',
    detail: '望京 SOHO T1 塔楼 2304',
    tag: '家',
    isDefault: false
  },
  {
    id: 'addr-3',
    name: '严爸爸',
    phone: '136****2108',
    province: '江苏省',
    city: '南京市',
    district: '鼓楼区',
    detail: '中山北路 200 号 15 栋 3 单元 501',
    tag: '爸妈',
    isDefault: false
  }
];

// ============ 订单（带完整详情）============
// status 取值：pending(待付款) | shipped(待发货) | delivering(配送中) | completed(已完成) | growing(种植中) | cancelled(已取消)
export const ORDERS = [
  {
    id: 'ORD-2026-0418',
    type: '认养',
    typeIcon: '🌱',
    title: '小祎的菜园（进阶版 15㎡）',
    cover: PKG_COVER.pro,
    price: 799,
    count: 1,
    status: 'growing',
    statusLabel: '种植中',
    date: '2026-03-01',
    addressId: 'addr-1',
    subItems: [
      { label: '地块', value: 'A 区 · 07 号' },
      { label: '作物', value: '🍅 小番茄' },
      { label: '立牌', value: '小祎的菜园' },
      { label: '到期', value: '2027-03-01' }
    ],
    timeline: [
      { at: '2026-03-01 10:23', event: '下单成功', done: true },
      { at: '2026-03-01 10:25', event: '支付完成', done: true },
      { at: '2026-03-01 14:00', event: '分配地块 A-07', done: true },
      { at: '2026-03-05 09:00', event: '首批作物下地', done: true },
      { at: '2026-04-15 08:12', event: '进入开花期', done: true },
      { at: '2026-05-30', event: '预计首次收获', done: false }
    ]
  },
  {
    id: 'ORD-2026-0415',
    type: '产地直送',
    typeIcon: '📦',
    title: '蜜薯 3 斤 · 今日现挖',
    cover: CROP.sweetpotato,
    price: 9.9,
    count: 1,
    status: 'delivering',
    statusLabel: '配送中',
    date: '2026-04-15',
    addressId: 'addr-2',
    logistics: {
      company: '顺丰速运',
      no: 'SF1456789201',
      nodes: [
        { at: '2026-04-16 09:20', node: '北京朝阳分拣中心 已发出，派送中' },
        { at: '2026-04-15 22:10', node: '北京顺义转运中心 已到达' },
        { at: '2026-04-15 14:45', node: '河南周口 已揽收' },
        { at: '2026-04-15 11:30', node: '订单已打包' }
      ]
    }
  },
  {
    id: 'ORD-2026-0402',
    type: '产地直送',
    typeIcon: '📦',
    title: '红心草莓 2 斤 · 亲子采摘专享',
    cover: CROP.strawberry,
    price: 89,
    count: 1,
    status: 'completed',
    statusLabel: '已签收',
    date: '2026-04-02',
    addressId: 'addr-2',
    canReview: true
  },
  {
    id: 'ORD-2026-0326',
    type: '认养',
    typeIcon: '🌱',
    title: '基础版 · 10㎡（孝心送爸妈）',
    cover: PKG_COVER.basic,
    price: 499,
    count: 1,
    status: 'pending',
    statusLabel: '待付款',
    date: '2026-04-20',
    addressId: 'addr-3',
    expireIn: '29:48'
  }
];

// ============ Store：用户登录态 + 临时数据 ============
export const useAppStore = defineStore('app', {
  state: () => ({
    user: { nickname: '田园小掌柜', avatar: '🧑‍🌾', level: 'Lv.2', phone: '138****5412' },
    isLoggedIn: true,    // Demo 默认已登录；可在 login 页 mock 切换
    cart: [],
    addresses: [...ADDRESSES],
    defaultAddressId: 'addr-1'
  }),
  getters: {
    defaultAddress(state) {
      return state.addresses.find(a => a.id === state.defaultAddressId) || state.addresses[0];
    }
  },
  actions: {
    addToCart(item) { this.cart.push(item); },
    loginMock(phone) {
      this.isLoggedIn = true;
      if (phone) this.user.phone = phone.slice(0, 3) + '****' + phone.slice(7);
    },
    logoutMock() { this.isLoggedIn = false; },
    upsertAddress(addr) {
      const i = this.addresses.findIndex(a => a.id === addr.id);
      if (i >= 0) this.addresses.splice(i, 1, addr);
      else this.addresses.unshift({ ...addr, id: 'addr-' + Date.now() });
      if (addr.isDefault) this.defaultAddressId = addr.id || this.addresses[0].id;
    },
    removeAddress(id) {
      this.addresses = this.addresses.filter(a => a.id !== id);
      if (this.defaultAddressId === id && this.addresses.length) {
        this.defaultAddressId = this.addresses[0].id;
      }
    },
    setDefaultAddress(id) { this.defaultAddressId = id; }
  }
});
