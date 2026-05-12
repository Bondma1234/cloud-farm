// ============ 种子数据 ============
// 把项目早期的 mock 数据(套餐/地块/动态等)灌进数据库,用于本地开发演示。
// 跑法: pnpm db:seed (或 prisma migrate reset 时自动调用)
//
// idempotent 设计: 用 upsert,反复跑不重复插入。

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============ 套餐(对齐 mock.js + packages/shared) ============
const PACKAGES = [
  {
    id: 'pkg-basic',
    name: '基础版 · 10㎡',
    area: 10,
    price: 499,
    tag: '热销',
    cover: '/images/pkg-basic.jpg',
    gallery: ['/images/pkg-basic.jpg', '/images/farm-hero.jpg', '/images/crop-pumpkin.jpg', '/images/farm-detail-1.jpg'],
    highlights: ['1 种作物', '保底 10 斤', '包邮 2 次', '共享摄像头'],
    crops: ['红薯', '胡萝卜', '土豆', '南瓜'],
    sortOrder: 1,
  },
  {
    id: 'pkg-pro',
    name: '进阶版 · 15㎡',
    area: 15,
    price: 799,
    tag: '推荐',
    cover: '/images/pkg-pro.jpg',
    gallery: ['/images/pkg-pro.jpg', '/images/crop-tomato.jpg', '/images/crop-strawberry.jpg', '/images/farm-detail-2.jpg'],
    highlights: ['2 种作物', '保底 20 斤', '包邮 3 次', '专属可遥控摄像头'],
    crops: ['红薯', '胡萝卜', '小番茄', '草莓', '南瓜', '香椿'],
    sortOrder: 2,
  },
  {
    id: 'pkg-family',
    name: '亲子版 · 10㎡',
    area: 10,
    price: 699,
    tag: '亲子',
    cover: '/images/pkg-family.jpg',
    gallery: ['/images/pkg-family.jpg', '/images/crop-strawberry.jpg', '/images/crop-tomato.jpg', '/images/farm-detail-3.jpg'],
    highlights: ['线上自然教育 3 节', '实体种植工具包', '孩子名字立牌'],
    crops: ['小番茄', '草莓', '胡萝卜', '南瓜'],
    sortOrder: 3,
  },
];

// ============ 地块(12 块,A 区 4×3 网格) ============
const PLOTS = Array.from({ length: 12 }).map((_, i) => ({
  id: `P-A-${String(i + 1).padStart(2, '0')}`,
  block: 'A 区',
  row: Math.floor(i / 4) + 1,
  col: (i % 4) + 1,
  status: i === 2 || i === 5 || i === 9 ? 'sold' : 'available',
  sunHours: 6 + (i % 3),
  soilScore: 85 + (i % 10),
}));

// ============ Demo 用户 ============
const DEMO_USER = {
  phone: '13800000001',
  nickname: '田园小掌柜',
  avatar: '🧑‍🌾',
  level: 'Lv.2',
  role: 'customer',
};

async function main() {
  console.log('🌱 开始 seed...');

  // 1. 套餐(JSON 字段序列化为字符串)
  for (const p of PACKAGES) {
    await prisma.package.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        area: p.area,
        price: p.price,
        tag: p.tag,
        cover: p.cover,
        gallery: JSON.stringify(p.gallery),
        highlights: JSON.stringify(p.highlights),
        crops: JSON.stringify(p.crops),
        sortOrder: p.sortOrder,
      },
      update: {
        name: p.name,
        area: p.area,
        price: p.price,
        tag: p.tag,
        cover: p.cover,
        gallery: JSON.stringify(p.gallery),
        highlights: JSON.stringify(p.highlights),
        crops: JSON.stringify(p.crops),
        sortOrder: p.sortOrder,
      },
    });
  }
  console.log(`  ✓ ${PACKAGES.length} 套餐`);

  // 2. 地块
  for (const plot of PLOTS) {
    await prisma.plot.upsert({
      where: { id: plot.id },
      create: plot,
      update: plot,
    });
  }
  console.log(`  ✓ ${PLOTS.length} 地块`);

  // 3. Demo 用户(C 端)+ admin 用户(B 端)
  const user = await prisma.user.upsert({
    where: { phone: DEMO_USER.phone },
    create: DEMO_USER,
    update: DEMO_USER,
  });
  const adminUser = {
    phone: '18888888888',
    nickname: '管理员',
    avatar: '🛡️',
    level: 'Lv.99',
    role: 'admin',
  };
  await prisma.user.upsert({
    where: { phone: adminUser.phone },
    create: adminUser,
    update: adminUser,
  });
  console.log('  ✓ 2 用户 (1 demo customer + 1 admin)');

  // 4. Demo 用户的收货地址(2 条)
  const addresses = [
    {
      id: 'addr-demo-1',
      userId: user.id,
      name: '严先生',
      phone: '13800000001',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      detail: '中关村软件园 3 号楼 12A',
      tag: '公司',
      isDefault: true,
    },
    {
      id: 'addr-demo-2',
      userId: user.id,
      name: '严小祎',
      phone: '13900007829',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '望京 SOHO T1 塔楼 2304',
      tag: '家',
      isDefault: false,
    },
  ];
  for (const a of addresses) {
    await prisma.address.upsert({
      where: { id: a.id },
      create: a,
      update: a,
    });
  }
  console.log(`  ✓ ${addresses.length} 收货地址`);

  // 5. Demo 用户的订单(3 条,覆盖不同状态)
  const orders = [
    {
      id: 'ORD-2026-0418',
      userId: user.id,
      type: '认养',
      typeIcon: '🌱',
      title: '小祎的菜园(进阶版 15㎡)',
      cover: '/images/pkg-pro.jpg',
      price: 799,
      count: 1,
      status: 'growing',
      statusLabel: '种植中',
      date: new Date('2026-03-01'),
      packageId: 'pkg-pro',
      plotId: 'P-A-07',
      addressId: 'addr-demo-1',
      crops: JSON.stringify(['小番茄']),
      stake: '小祎的菜园',
      metadata: JSON.stringify({
        subItems: [
          { label: '地块', value: 'A 区 · 07 号' },
          { label: '作物', value: '🍅 小番茄' },
          { label: '立牌', value: '小祎的菜园' },
          { label: '到期', value: '2027-03-01' },
        ],
        timeline: [
          { at: '2026-03-01 10:23', event: '下单成功', done: true },
          { at: '2026-03-01 10:25', event: '支付完成', done: true },
          { at: '2026-03-01 14:00', event: '分配地块 A-07', done: true },
          { at: '2026-03-05 09:00', event: '首批作物下地', done: true },
          { at: '2026-04-15 08:12', event: '进入开花期', done: true },
          { at: '2026-05-30', event: '预计首次收获', done: false },
        ],
      }),
    },
    {
      id: 'ORD-2026-0415',
      userId: user.id,
      type: '产地直送',
      typeIcon: '📦',
      title: '蜜薯 3 斤 · 今日现挖',
      cover: '/images/crop-sweetpotato.jpg',
      price: 9.9 as unknown as number, // Prisma Int 不支持小数,改成元 *100 存才是规范,P2+ 暂存粗糙值方便看
      count: 1,
      status: 'delivering',
      statusLabel: '配送中',
      date: new Date('2026-04-15'),
      addressId: 'addr-demo-2',
      metadata: JSON.stringify({
        logistics: {
          company: '顺丰速运',
          no: 'SF1456789201',
          nodes: [
            { at: '2026-04-16 09:20', node: '北京朝阳分拣中心 已发出,派送中' },
            { at: '2026-04-15 22:10', node: '北京顺义转运中心 已到达' },
            { at: '2026-04-15 14:45', node: '河南周口 已揽收' },
            { at: '2026-04-15 11:30', node: '订单已打包' },
          ],
        },
      }),
    },
    {
      id: 'ORD-2026-0326',
      userId: user.id,
      type: '认养',
      typeIcon: '🌱',
      title: '基础版 · 10㎡(孝心送爸妈)',
      cover: '/images/pkg-basic.jpg',
      price: 499,
      count: 1,
      status: 'pending',
      statusLabel: '待付款',
      date: new Date('2026-04-20'),
      packageId: 'pkg-basic',
      addressId: 'addr-demo-1',
      crops: JSON.stringify(['红薯', '胡萝卜']),
      metadata: JSON.stringify({ expireIn: '29:48' }),
    },
  ];
  // 注: order.price 在 schema 里是 Int, 9.9 这个有小数的会被四舍五入成 10
  // 真上线前要把 price 改成"分"为单位的 Int(规范金额),P2+ 暂略
  for (const o of orders) {
    await prisma.order.upsert({
      where: { id: o.id },
      create: { ...o, price: Math.round(o.price) },
      update: { ...o, price: Math.round(o.price) },
    });
  }
  console.log(`  ✓ ${orders.length} 订单`);

  // 5.1 已被认养(status=growing/paid)的地块强制 sold
  const adoptionPlotIds = orders
    .filter((o) => o.type === '认养' && (o as { plotId?: string }).plotId && ['growing', 'paid'].includes(o.status))
    .map((o) => (o as { plotId: string }).plotId);
  if (adoptionPlotIds.length) {
    await prisma.plot.updateMany({
      where: { id: { in: adoptionPlotIds } },
      data: { status: 'sold' },
    });
    console.log(`  ✓ ${adoptionPlotIds.length} 地块锁定 sold`);
  }

  // 5.2 P5-mock: 摄像头 - 给所有地块各绑一个 mock 摄像头
  // 真萤石云接入时, 只需把 deviceSerial 改成真序列号 + vendor='ezviz',
  // CameraService 那边切到调萤石 OpenAPI 即可,前端代码 0 改动
  for (const plot of PLOTS) {
    const cameraId = `cam-${plot.id.toLowerCase()}`;
    await prisma.camera.upsert({
      where: { id: cameraId },
      create: {
        id: cameraId,
        deviceSerial: `MOCK-${plot.id}`,
        vendor: 'mock',
        channelNo: 1,
        ptzSupported: plot.id !== 'P-A-03', // 演示用:其中一块共享摄像头(基础版)不支持 PTZ
        status: 'online',
        lastOnlineAt: new Date(),
      },
      update: { status: 'online', lastOnlineAt: new Date() },
    });
    await prisma.plot.update({
      where: { id: plot.id },
      data: { cameraId },
    });
  }
  console.log(`  ✓ ${PLOTS.length} 摄像头绑到地块(mock vendor,P5 切萤石)`);

  // 6. 田园动态 (从 miniapp/src/stores/mock.js 的 JOURNAL_ENTRIES 迁过来)
  const journalEntries = [
    {
      id: 'j-001',
      type: 'bloom',
      icon: '🌸',
      title: '你的小番茄开花啦',
      summary: '第一朵小黄花开了,离结果约 7-10 天',
      body: '今天上午巡田,小祎的菜园(A-07)第一株小番茄长出了花苞,黄色的小花迎着太阳开放。按照河南这边的气候,从开花到第一颗果实成熟通常需要 7-10 天。这两天会重点关注授粉情况,如果连续阴雨会人工辅助授粉。',
      photos: JSON.stringify(['/images/farm-detail-1.jpg', '/images/farm-detail-2.jpg']),
      by: '老张(驻场农技员)',
      at: new Date('2026-04-29 14:00'),
      plotId: 'P-A-07',
      likes: 12, comments: 3,
    },
    {
      id: 'j-002',
      type: 'water',
      icon: '💧',
      title: '农技员已完成今日浇水',
      summary: '今天 08:12 · 土壤湿度 65%',
      body: '已按你的指令完成浇水。早晨气温 19°C,土壤较干,浇水量约 8L。浇水后土壤湿度上升到 65%,适合小番茄花期生长。下次建议追加一次叶面喷雾。',
      photos: JSON.stringify(['/images/plot-snapshot.jpg']),
      by: '老张(驻场农技员)',
      at: new Date('2026-04-29 08:12'),
      plotId: 'P-A-07',
      likes: 5, comments: 1,
    },
    {
      id: 'j-003',
      type: 'ship',
      icon: '📦',
      title: '你的第一批蜜薯已发货',
      summary: '中通快递 · 预计 2 天送达',
      body: '你订的 3 斤蜜薯已经从周口发货,使用中通快递,单号 ZTO0234567891。预计明天下午到达北京,请保持手机畅通。蜜薯刚挖出来需要"晾晒"3-5 天再吃口感最好,已经帮你晾过了,到货后冷藏即可。',
      photos: JSON.stringify(['/images/crop-sweetpotato.jpg']),
      by: '客服小燕',
      at: new Date('2026-04-28 17:30'),
      plotId: null,
      likes: 8, comments: 0,
    },
    {
      id: 'j-004',
      type: 'fertilize',
      icon: '🌿',
      title: '完成第一次追肥',
      summary: '使用有机豆饼肥,下次追肥 5 月 5 日',
      body: '今天给 A-07 完成了第一次追肥,使用我们农场自制的发酵豆饼肥,完全有机。施肥位置在植株根部 5cm 外侧,避免烧根。下次追肥安排在花期结束、坐果初期,约 5 月 5 日。',
      photos: JSON.stringify(['/images/farm-detail-3.jpg']),
      by: '老张(驻场农技员)',
      at: new Date('2026-04-06 10:00'),
      plotId: 'P-A-07',
      likes: 9, comments: 2,
    },
    {
      id: 'j-005',
      type: 'shoot',
      icon: '📸',
      title: '你点了"拍张照",照片来了',
      summary: '今天上午 10:30 · 长势良好',
      body: '收到你的拍照指令,刚刚去地里给小番茄拍了一组特写。整体长势比同期种下的其他田块好一些,叶片浓绿,没有明显病虫害迹象。继续保持当前管理就行。',
      photos: JSON.stringify(['/images/farm-detail-2.jpg', '/images/farm-detail-1.jpg']),
      by: '老张(驻场农技员)',
      at: new Date('2026-04-05 10:30'),
      plotId: 'P-A-07',
      likes: 14, comments: 4,
    },
    {
      id: 'j-006',
      type: 'plant',
      icon: '🌱',
      title: '幼苗移栽成功',
      summary: '14 株小番茄苗,全部成活',
      body: '今天上午把育苗盘里的小番茄苗移栽到了 A-07 地块,间距 30cm,共 14 株。移栽后浇定根水,覆盖一层稻草保湿。河南这两天日照充足,应该能很快缓苗。',
      photos: JSON.stringify(['/images/farm-field.jpg', '/images/farm-detail-2.jpg']),
      by: '老张(驻场农技员)',
      at: new Date('2026-03-20 11:00'),
      plotId: 'P-A-07',
      likes: 21, comments: 7,
    },
  ];
  for (const j of journalEntries) {
    await prisma.journalEntry.upsert({
      where: { id: j.id },
      create: j,
      update: j,
    });
  }
  console.log(`  ✓ ${journalEntries.length} 田园动态`);

  // 7. 作物百科
  const crops = [
    {
      id: 'crop-tomato',
      name: '小番茄', emoji: '🍅',
      cover: '/images/crop-tomato.jpg',
      season: '春秋', difficulty: 2, daysToHarvest: '80-95 天',
      yieldPerSqm: '1.5-2 斤/㎡',
      intro: '富含番茄红素,亲子种植首选。开花期颜值高,果实成熟周期短,适合 10-15㎡ 小地块。',
      tags: JSON.stringify(['亲子', '高颜值', '产量稳定']),
      recommendPkg: JSON.stringify(['进阶版', '亲子版']),
      sortOrder: 1,
    },
    {
      id: 'crop-strawberry',
      name: '红颜草莓', emoji: '🍓',
      cover: '/images/crop-strawberry.jpg',
      season: '冬春', difficulty: 4, daysToHarvest: '120-150 天',
      yieldPerSqm: '1-1.5 斤/㎡',
      intro: '河南本地"红颜"品种,糖度高、果型美。需要大棚保温,难度较高,亲子收获时仪式感最强。',
      tags: JSON.stringify(['亲子', '高糖度', '采摘体验']),
      recommendPkg: JSON.stringify(['亲子版', '进阶版']),
      sortOrder: 2,
    },
    {
      id: 'crop-sweetpotato',
      name: '蜜薯', emoji: '🍠',
      cover: '/images/crop-sweetpotato.jpg',
      season: '夏秋', difficulty: 1, daysToHarvest: '110-130 天',
      yieldPerSqm: '5-8 斤/㎡',
      intro: '产量王者,新手友好。河南沙土地最适合,挖出来烤一下软糯香甜,孩子最爱。',
      tags: JSON.stringify(['新手', '高产', '耐储运']),
      recommendPkg: JSON.stringify(['基础版', '进阶版', '亲子版']),
      sortOrder: 3,
    },
    {
      id: 'crop-pumpkin',
      name: '贝贝南瓜', emoji: '🎃',
      cover: '/images/crop-pumpkin.jpg',
      season: '春夏', difficulty: 2, daysToHarvest: '90-100 天',
      yieldPerSqm: '3-4 斤/㎡',
      intro: '体型小巧(每个 0.5-1kg),蒸熟即吃,板栗口感。占地大但产量稳定,适合 15㎡ 以上地块。',
      tags: JSON.stringify(['网红', '即蒸即食', '颜值高']),
      recommendPkg: JSON.stringify(['进阶版']),
      sortOrder: 4,
    },
    {
      id: 'crop-carrot',
      name: '水果胡萝卜', emoji: '🥕',
      cover: '/images/pkg-basic.jpg',
      season: '春秋', difficulty: 1, daysToHarvest: '70-85 天',
      yieldPerSqm: '4-5 斤/㎡',
      intro: '生吃如水果般清甜,孩子最容易接受的根菜。基础版套餐主推作物。',
      tags: JSON.stringify(['新手', '生吃', '孩子最爱']),
      recommendPkg: JSON.stringify(['基础版', '亲子版']),
      sortOrder: 5,
    },
    {
      id: 'crop-potato',
      name: '紫薯土豆', emoji: '🥔',
      cover: '/images/farm-detail-1.jpg',
      season: '春秋', difficulty: 1, daysToHarvest: '90-110 天',
      yieldPerSqm: '4-6 斤/㎡',
      intro: '紫色品种,花青素含量高。耐储运,挖出来放阴凉处可存 3 个月以上。',
      tags: JSON.stringify(['新手', '高产', '耐储运']),
      recommendPkg: JSON.stringify(['基础版']),
      sortOrder: 6,
    },
    {
      id: 'crop-toon',
      name: '香椿', emoji: '🌿',
      cover: '/images/farm-detail-2.jpg',
      season: '春季', difficulty: 3, daysToHarvest: '一年生 / 春季采头茬',
      yieldPerSqm: '1-2 斤/㎡',
      intro: '春日限定鲜味,采头茬最嫩。一次种植年年有收,进阶版限定。',
      tags: JSON.stringify(['限定', '春鲜', '一次多年']),
      recommendPkg: JSON.stringify(['进阶版']),
      sortOrder: 7,
    },
    {
      id: 'crop-garlic',
      name: '紫皮蒜', emoji: '🧄',
      cover: '/images/farm-detail-3.jpg',
      season: '秋种春收', difficulty: 1, daysToHarvest: '210-240 天',
      yieldPerSqm: '2-3 斤/㎡',
      intro: '河南本地紫皮蒜,蒜瓣大、辣度足。秋种春收,几乎不用管。',
      tags: JSON.stringify(['新手', '懒人友好', '耐储运']),
      recommendPkg: JSON.stringify(['基础版']),
      sortOrder: 8,
    },
  ];
  for (const c of crops) {
    await prisma.crop.upsert({
      where: { id: c.id },
      create: c,
      update: c,
    });
  }
  console.log(`  ✓ ${crops.length} 作物`);

  // 8. 用户照片墙
  const photoPosts = [
    { id: 'pw-001', userName: '宝妈小慧',   userIcon: '👩‍🦰', photo: '/images/crop-strawberry.jpg', caption: '今天收获第一批草莓,孩子高兴坏了 🍓', plotId: 'P-A-12', crop: '草莓',           likes: 87,  comments: 12, at: new Date('2026-04-29 13:00') },
    { id: 'pw-002', userName: '老北漂Tony', userIcon: '🧑',     photo: '/images/farm-detail-2.jpg',    caption: '我的小番茄开花啦!第一次远程种菜,有点小激动',   plotId: 'P-A-07', crop: '小番茄',         likes: 56,  comments: 8,  at: new Date('2026-04-28 19:23') },
    { id: 'pw-003', userName: '南瓜爸爸',   userIcon: '👨',     photo: '/images/crop-pumpkin.jpg',     caption: '贝贝南瓜终于到了!蒸熟切开金灿灿的,板栗味',     plotId: 'P-B-03', crop: '贝贝南瓜',       likes: 124, comments: 23, at: new Date('2026-04-27 12:00') },
    { id: 'pw-004', userName: '番茄妈妈',   userIcon: '👩‍💼', photo: '/images/crop-tomato.jpg',      caption: '小番茄红了一串!每天看摄像头比看股票还紧张 😂', plotId: 'P-A-09', crop: '小番茄',         likes: 92,  comments: 15, at: new Date('2026-04-26 10:00') },
    { id: 'pw-005', userName: '蜜薯专业户', userIcon: '🧑‍🌾', photo: '/images/crop-sweetpotato.jpg', caption: '挖了 5 斤蜜薯!周末烤红薯派对走起',             plotId: 'P-C-02', crop: '蜜薯',           likes: 168, comments: 34, at: new Date('2026-04-25 15:00') },
    { id: 'pw-006', userName: '田园主义',   userIcon: '🌾',     photo: '/images/farm-field.jpg',       caption: '清晨的农场,露水还在叶子上。这一刻治愈一周的班味', plotId: 'P-A-15', crop: '土豆',           likes: 245, comments: 41, at: new Date('2026-04-22 06:30') },
    { id: 'pw-007', userName: '小馋猫',     userIcon: '🐱',     photo: '/images/farm-detail-3.jpg',    caption: '香椿炒鸡蛋!自己种的就是不一样',                 plotId: 'P-A-04', crop: '香椿',           likes: 73,  comments: 11, at: new Date('2026-04-22 19:00') },
    { id: 'pw-008', userName: '亲子日记',   userIcon: '👶',     photo: '/images/farm-hero.jpg',        caption: '带娃去农场认地块,他自己挑了块带向日葵的',       plotId: 'P-D-01', crop: '向日葵 + 草莓', likes: 198, comments: 27, at: new Date('2026-04-15 16:00') },
  ];
  for (const p of photoPosts) {
    await prisma.photoPost.upsert({
      where: { id: p.id },
      create: p,
      update: p,
    });
  }
  console.log(`  ✓ ${photoPosts.length} 照片墙帖子`);

  // 9. 指令历史(给 demo 用户)
  const commands = [
    { id: 'c-2026-0427-01', userId: user.id, type: 'water',     icon: '💧', label: '浇水',   plotId: 'P-A-07', requestedAt: new Date('2026-04-27 08:00'), completedAt: new Date('2026-04-27 09:45'), status: 'completed', statusLabel: '已完成', by: '老张', note: '已完成浇水,土壤湿度 65%',                photo: '/images/plot-snapshot.jpg', cost: 0 },
    { id: 'c-2026-0427-02', userId: user.id, type: 'shoot',     icon: '📸', label: '拍张照', plotId: 'P-A-07', requestedAt: new Date('2026-04-27 10:30'), completedAt: new Date('2026-04-27 10:35'), status: 'completed', statusLabel: '已完成', by: '老张', note: '拍了 3 张特写,已上传到生长日记',         photo: '/images/farm-detail-2.jpg', cost: 0 },
    { id: 'c-2026-0426-01', userId: user.id, type: 'shoot',     icon: '📸', label: '拍张照', plotId: 'P-A-07', requestedAt: new Date('2026-04-26 16:12'),                                          status: 'executing', statusLabel: '执行中', by: '老张', note: '已收到,今天傍晚去拍',                     photo: null,                        cost: 0 },
    { id: 'c-2026-0420-01', userId: user.id, type: 'fertilize', icon: '🌿', label: '施肥',   plotId: 'P-A-07', requestedAt: new Date('2026-04-20 09:30'), completedAt: new Date('2026-04-20 14:20'), status: 'completed', statusLabel: '已完成', by: '老张', note: '已使用有机豆饼肥,根部施肥',               photo: '/images/farm-detail-3.jpg', cost: 5 },
    { id: 'c-2026-0418-01', userId: user.id, type: 'water',     icon: '💧', label: '浇水',   plotId: 'P-A-07', requestedAt: new Date('2026-04-18 07:50'), completedAt: new Date('2026-04-18 08:30'), status: 'completed', statusLabel: '已完成', by: '小李', note: '已浇水,雨季临近,下次注意排水',           photo: null,                        cost: 0 },
    { id: 'c-2026-0410-01', userId: user.id, type: 'weed',      icon: '🍃', label: '除草',   plotId: 'P-A-07', requestedAt: new Date('2026-04-10 09:00'), completedAt: new Date('2026-04-10 11:30'), status: 'completed', statusLabel: '已完成', by: '小李', note: '清除了周边 50cm 内的杂草',                photo: null,                        cost: 10 },
  ];
  for (const c of commands) {
    await prisma.command.upsert({
      where: { id: c.id },
      create: c,
      update: c,
    });
  }
  console.log(`  ✓ ${commands.length} 指令工单`);

  console.log('🌾 seed 完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
