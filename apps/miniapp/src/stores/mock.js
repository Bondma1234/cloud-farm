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

// ============ 田园动态（journal）============
// home 页底部"田园动态"卡片片段 + 完整列表页都来自这里。
// 字段说明：summary 是 home 卡片用的一行话；body 是详情用的全文。
export const JOURNAL_ENTRIES = [
  {
    id: 'j-001',
    type: 'bloom',
    icon: '🌸',
    title: '你的小番茄开花啦',
    summary: '第一朵小黄花开了，离结果约 7-10 天',
    body: '今天上午巡田，小祎的菜园（A-07）第一株小番茄长出了花苞，黄色的小花迎着太阳开放。按照河南这边的气候，从开花到第一颗果实成熟通常需要 7-10 天。这两天会重点关注授粉情况，如果连续阴雨会人工辅助授粉。',
    photos: [FARM.detail1, FARM.detail2],
    by: '老张（驻场农技员）',
    at: '2 小时前',
    plotId: 'P-A-07',
    likes: 12, comments: 3
  },
  {
    id: 'j-002',
    type: 'water',
    icon: '💧',
    title: '农技员已完成今日浇水',
    summary: '今天 08:12 · 土壤湿度 65%',
    body: '已按你的指令完成浇水。早晨气温 19°C，土壤较干，浇水量约 8L。浇水后土壤湿度上升到 65%，适合小番茄花期生长。下次建议追加一次叶面喷雾。',
    photos: [MISC.plotSnapshot],
    by: '老张（驻场农技员）',
    at: '今天 08:12',
    plotId: 'P-A-07',
    likes: 5, comments: 1
  },
  {
    id: 'j-003',
    type: 'ship',
    icon: '📦',
    title: '你的第一批蜜薯已发货',
    summary: '中通快递 · 预计 2 天送达',
    body: '你订的 3 斤蜜薯已经从周口发货，使用中通快递，单号 ZTO0234567891。预计明天下午到达北京，请保持手机畅通。蜜薯刚挖出来需要"晾晒"3-5 天再吃口感最好，已经帮你晾过了，到货后冷藏即可。',
    photos: [CROP.sweetpotato],
    by: '客服小燕',
    at: '昨天 17:30',
    plotId: null,
    likes: 8, comments: 0
  },
  {
    id: 'j-004',
    type: 'fertilize',
    icon: '🌿',
    title: '完成第一次追肥',
    summary: '使用有机豆饼肥，下次追肥 5 月 5 日',
    body: '今天给 A-07 完成了第一次追肥，使用我们农场自制的发酵豆饼肥（豆粕 + 红糖 + EM 菌），完全有机。施肥位置在植株根部 5cm 外侧，避免烧根。下次追肥安排在花期结束、坐果初期，约 5 月 5 日。',
    photos: [FARM.detail3],
    by: '老张（驻场农技员）',
    at: '4 月 6 日',
    plotId: 'P-A-07',
    likes: 9, comments: 2
  },
  {
    id: 'j-005',
    type: 'shoot',
    icon: '📸',
    title: '你点了"拍张照"，照片来了',
    summary: '今天上午 10:30 · 长势良好',
    body: '收到你的拍照指令，刚刚去地里给小番茄拍了一组特写。整体长势比同期种下的其他田块好一些，叶片浓绿，没有明显病虫害迹象。继续保持当前管理就行。',
    photos: [FARM.detail2, FARM.detail1],
    by: '老张（驻场农技员）',
    at: '4 月 5 日',
    plotId: 'P-A-07',
    likes: 14, comments: 4
  },
  {
    id: 'j-006',
    type: 'plant',
    icon: '🌱',
    title: '幼苗移栽成功',
    summary: '14 株小番茄苗，全部成活',
    body: '今天上午把育苗盘里的小番茄苗移栽到了 A-07 地块，间距 30cm，共 14 株。移栽后浇定根水，覆盖一层稻草保湿。河南这两天日照充足，应该能很快缓苗。',
    photos: [FARM.field, FARM.detail2],
    by: '老张（驻场农技员）',
    at: '3 月 20 日',
    plotId: 'P-A-07',
    likes: 21, comments: 7
  }
];

// ============ 指令历史（command history）============
// 用户在 my-plot 上发出的所有"浇水/施肥/除草/拍照"指令记录。
export const COMMAND_HISTORY = [
  {
    id: 'c-2026-0427-01',
    type: 'water', icon: '💧', label: '浇水',
    plotId: 'P-A-07',
    requestedAt: '2026-04-27 08:00',
    completedAt: '2026-04-27 09:45',
    status: 'completed', statusLabel: '已完成',
    by: '老张',
    note: '已完成浇水，土壤湿度 65%',
    photo: MISC.plotSnapshot,
    cost: 0
  },
  {
    id: 'c-2026-0427-02',
    type: 'shoot', icon: '📸', label: '拍张照',
    plotId: 'P-A-07',
    requestedAt: '2026-04-27 10:30',
    completedAt: '2026-04-27 10:35',
    status: 'completed', statusLabel: '已完成',
    by: '老张',
    note: '拍了 3 张特写，已上传到生长日记',
    photo: FARM.detail2,
    cost: 0
  },
  {
    id: 'c-2026-0426-01',
    type: 'shoot', icon: '📸', label: '拍张照',
    plotId: 'P-A-07',
    requestedAt: '2026-04-26 16:12',
    status: 'executing', statusLabel: '执行中',
    by: '老张',
    note: '已收到，今天傍晚去拍',
    photo: null,
    cost: 0
  },
  {
    id: 'c-2026-0420-01',
    type: 'fertilize', icon: '🌿', label: '施肥',
    plotId: 'P-A-07',
    requestedAt: '2026-04-20 09:30',
    completedAt: '2026-04-20 14:20',
    status: 'completed', statusLabel: '已完成',
    by: '老张',
    note: '已使用有机豆饼肥，根部施肥',
    photo: FARM.detail3,
    cost: 5
  },
  {
    id: 'c-2026-0418-01',
    type: 'water', icon: '💧', label: '浇水',
    plotId: 'P-A-07',
    requestedAt: '2026-04-18 07:50',
    completedAt: '2026-04-18 08:30',
    status: 'completed', statusLabel: '已完成',
    by: '小李',
    note: '已浇水，雨季临近，下次注意排水',
    photo: null,
    cost: 0
  },
  {
    id: 'c-2026-0410-01',
    type: 'weed', icon: '🍃', label: '除草',
    plotId: 'P-A-07',
    requestedAt: '2026-04-10 09:00',
    completedAt: '2026-04-10 11:30',
    status: 'completed', statusLabel: '已完成',
    by: '小李',
    note: '清除了周边 50cm 内的杂草',
    photo: null,
    cost: 10
  }
];

// ============ 作物百科（crops catalog）============
// 农场目前可种的所有作物，认养时让用户挑选。
export const CROPS_CATALOG = [
  {
    id: 'crop-tomato',
    name: '小番茄', emoji: '🍅',
    cover: CROP.tomato,
    season: '春秋', difficulty: 2, daysToHarvest: '80-95 天',
    yieldPerSqm: '1.5-2 斤/㎡',
    intro: '富含番茄红素，亲子种植首选。开花期颜值高，果实成熟周期短，适合 10-15㎡ 小地块。',
    tags: ['亲子', '高颜值', '产量稳定'],
    recommendPkg: ['进阶版', '亲子版']
  },
  {
    id: 'crop-strawberry',
    name: '红颜草莓', emoji: '🍓',
    cover: CROP.strawberry,
    season: '冬春', difficulty: 4, daysToHarvest: '120-150 天',
    yieldPerSqm: '1-1.5 斤/㎡',
    intro: '河南本地"红颜"品种，糖度高、果型美。需要大棚保温，难度较高，亲子收获时仪式感最强。',
    tags: ['亲子', '高糖度', '采摘体验'],
    recommendPkg: ['亲子版', '进阶版']
  },
  {
    id: 'crop-sweetpotato',
    name: '蜜薯', emoji: '🍠',
    cover: CROP.sweetpotato,
    season: '夏秋', difficulty: 1, daysToHarvest: '110-130 天',
    yieldPerSqm: '5-8 斤/㎡',
    intro: '产量王者，新手友好。河南沙土地最适合，挖出来烤一下软糯香甜，孩子最爱。',
    tags: ['新手', '高产', '耐储运'],
    recommendPkg: ['基础版', '进阶版', '亲子版']
  },
  {
    id: 'crop-pumpkin',
    name: '贝贝南瓜', emoji: '🎃',
    cover: CROP.pumpkin,
    season: '春夏', difficulty: 2, daysToHarvest: '90-100 天',
    yieldPerSqm: '3-4 斤/㎡',
    intro: '体型小巧（每个 0.5-1kg），蒸熟即吃，板栗口感。占地大但产量稳定，适合 15㎡ 以上地块。',
    tags: ['网红', '即蒸即食', '颜值高'],
    recommendPkg: ['进阶版']
  },
  {
    id: 'crop-carrot',
    name: '水果胡萝卜', emoji: '🥕',
    cover: PKG_COVER.basic,
    season: '春秋', difficulty: 1, daysToHarvest: '70-85 天',
    yieldPerSqm: '4-5 斤/㎡',
    intro: '生吃如水果般清甜，孩子最容易接受的根菜。基础版套餐主推作物。',
    tags: ['新手', '生吃', '孩子最爱'],
    recommendPkg: ['基础版', '亲子版']
  },
  {
    id: 'crop-potato',
    name: '紫薯土豆', emoji: '🥔',
    cover: FARM.detail1,
    season: '春秋', difficulty: 1, daysToHarvest: '90-110 天',
    yieldPerSqm: '4-6 斤/㎡',
    intro: '紫色品种，花青素含量高。耐储运，挖出来放阴凉处可存 3 个月以上。',
    tags: ['新手', '高产', '耐储运'],
    recommendPkg: ['基础版']
  },
  {
    id: 'crop-toon',
    name: '香椿', emoji: '🌿',
    cover: FARM.detail2,
    season: '春季', difficulty: 3, daysToHarvest: '一年生 / 春季采头茬',
    yieldPerSqm: '1-2 斤/㎡',
    intro: '春日限定鲜味，采头茬最嫩。一次种植年年有收，进阶版限定。',
    tags: ['限定', '春鲜', '一次多年'],
    recommendPkg: ['进阶版']
  },
  {
    id: 'crop-garlic',
    name: '紫皮蒜', emoji: '🧄',
    cover: FARM.detail3,
    season: '秋种春收', difficulty: 1, daysToHarvest: '210-240 天',
    yieldPerSqm: '2-3 斤/㎡',
    intro: '河南本地紫皮蒜，蒜瓣大、辣度足。秋种春收，几乎不用管。',
    tags: ['新手', '懒人友好', '耐储运'],
    recommendPkg: ['基础版']
  }
];

// ============ 用户照片墙（photo wall）============
// "晒田主"社区，认养用户晒地块/收获/孩子互动的照片。
export const PHOTO_WALL = [
  {
    id: 'pw-001',
    user: { nickname: '宝妈小慧', avatar: '👩‍🦰' },
    photo: CROP.strawberry,
    caption: '今天收获第一批草莓，孩子高兴坏了 🍓',
    plotId: 'P-A-12', crop: '草莓',
    likes: 87, comments: 12, at: '2 小时前'
  },
  {
    id: 'pw-002',
    user: { nickname: '老北漂Tony', avatar: '🧑' },
    photo: FARM.detail2,
    caption: '我的小番茄开花啦！第一次远程种菜，有点小激动',
    plotId: 'P-A-07', crop: '小番茄',
    likes: 56, comments: 8, at: '昨天 19:23'
  },
  {
    id: 'pw-003',
    user: { nickname: '南瓜爸爸', avatar: '👨' },
    photo: CROP.pumpkin,
    caption: '贝贝南瓜终于到了！蒸熟切开金灿灿的，板栗味',
    plotId: 'P-B-03', crop: '贝贝南瓜',
    likes: 124, comments: 23, at: '前天'
  },
  {
    id: 'pw-004',
    user: { nickname: '番茄妈妈', avatar: '👩‍💼' },
    photo: CROP.tomato,
    caption: '小番茄红了一串！每天看摄像头比看股票还紧张 😂',
    plotId: 'P-A-09', crop: '小番茄',
    likes: 92, comments: 15, at: '3 天前'
  },
  {
    id: 'pw-005',
    user: { nickname: '蜜薯专业户', avatar: '🧑‍🌾' },
    photo: CROP.sweetpotato,
    caption: '挖了 5 斤蜜薯！周末烤红薯派对走起',
    plotId: 'P-C-02', crop: '蜜薯',
    likes: 168, comments: 34, at: '4 天前'
  },
  {
    id: 'pw-006',
    user: { nickname: '田园主义', avatar: '🌾' },
    photo: FARM.field,
    caption: '清晨的农场，露水还在叶子上。这一刻治愈一周的班味',
    plotId: 'P-A-15', crop: '土豆',
    likes: 245, comments: 41, at: '1 周前'
  },
  {
    id: 'pw-007',
    user: { nickname: '小馋猫', avatar: '🐱' },
    photo: FARM.detail3,
    caption: '香椿炒鸡蛋！自己种的就是不一样',
    plotId: 'P-A-04', crop: '香椿',
    likes: 73, comments: 11, at: '1 周前'
  },
  {
    id: 'pw-008',
    user: { nickname: '亲子日记', avatar: '👶' },
    photo: FARM.hero,
    caption: '带娃去农场认地块，他自己挑了块带向日葵的',
    plotId: 'P-D-01', crop: '向日葵 + 草莓',
    likes: 198, comments: 27, at: '2 周前'
  }
];

// ============ Store: 登录态 + 用户信息 + 地址 ============
// P4-E 改造: 优先走真后端 API, 失败 fallback 到 mock 数据。
//   - bootstrap(): 启动时如果 localStorage 有 token, 拉 /me + /addresses
//   - loginReal(phone, code): 调真接口签 JWT, 自动同步用户信息
//   - logoutReal(): 清 token + 重置 mock 默认值
//   - 老的 loginMock / logoutMock 还在(签名不变), 内部委托给 real 版本

import { login as apiLogin, logout as apiLogout, getMe, listMyAddresses, getAccessToken } from '@cloud-farm/api-client';

export const useAppStore = defineStore('app', {
  state: () => ({
    user: { nickname: '田园小掌柜', avatar: '🧑‍🌾', level: 'Lv.2', phone: '138****5412' },
    isLoggedIn: true,        // Demo 默认已登录;可在 login 页 mock 切换
    cart: [],
    addresses: [...ADDRESSES],
    defaultAddressId: 'addr-1',
    // P4-E 新加:
    isApiAuth: false,        // 当前会话是不是走的真 JWT(true=真接口, false=mock 状态)
    bootstrapped: false      // 启动时是否已尝试恢复登录
  }),
  getters: {
    defaultAddress(state) {
      return state.addresses.find(a => a.id === state.defaultAddressId) || state.addresses[0];
    }
  },
  actions: {
    /** 应用启动时调一次:如有 token, 验证并拉用户/地址 */
    async bootstrap() {
      if (this.bootstrapped) return;
      this.bootstrapped = true;
      const token = getAccessToken();
      if (!token) return;
      try {
        const me = await getMe();
        this.user = {
          nickname: me.nickname,
          avatar: me.avatar,
          level: me.level,
          phone: me.phone,
          createdAt: me.createdAt,    // P8 视觉 A: home 页"第 N 天"用
          role: me.role
        };
        this.isLoggedIn = true;
        this.isApiAuth = true;
        await this.fetchAddresses();
      } catch {
        // token 失效或网络错: 静默回退到 mock,下次让用户重新登录
        apiLogout();
      }
    },

    /** 真登录: 走 /api/auth/login,成功后拉地址。inviteCode 选填(新用户注册发券) */
    async loginReal(phone, code, inviteCode) {
      const data = await apiLogin({ phone, code, inviteCode });
      this.user = {
        nickname: data.user.nickname,
        avatar: data.user.avatar,
        level: data.user.level,
        phone: phone.slice(0, 3) + '****' + phone.slice(7),
        createdAt: data.user.createdAt,
        role: data.user.role
      };
      this.isLoggedIn = true;
      this.isApiAuth = true;
      // 异步拉地址,失败用 mock 兜底
      this.fetchAddresses().catch(() => {});
      return data;
    },

    /** 拉当前用户地址列表(真后端),失败保留 mock */
    async fetchAddresses() {
      try {
        const list = await listMyAddresses();
        if (list && list.length) {
          this.addresses = list;
          const def = list.find(a => a.isDefault);
          if (def) this.defaultAddressId = def.id;
        }
      } catch {
        /* 静默,保留 mock 地址展示 */
      }
    },

    /** 退出登录(真): 清 token + 重置 mock 状态 */
    logoutReal() {
      apiLogout();
      this.isLoggedIn = false;
      this.isApiAuth = false;
      this.user = { nickname: '田园小掌柜', avatar: '🧑‍🌾', level: 'Lv.2', phone: '138****5412' };
      this.addresses = [...ADDRESSES];
      this.defaultAddressId = 'addr-1';
    },

    addToCart(item) { this.cart.push(item); },

    /** @deprecated P4-E 起改走 loginReal,本方法保留作 mock 兜底 */
    loginMock(phone) {
      this.isLoggedIn = true;
      if (phone) this.user.phone = phone.slice(0, 3) + '****' + phone.slice(7);
    },
    /** @deprecated P4-E 起改走 logoutReal,本方法保留作 mock 兜底 */
    logoutMock() {
      this.logoutReal();
    },

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
