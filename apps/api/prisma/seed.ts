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

  // 3. Demo 用户
  const user = await prisma.user.upsert({
    where: { phone: DEMO_USER.phone },
    create: DEMO_USER,
    update: DEMO_USER,
  });
  console.log('  ✓ 1 demo 用户');

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
      addressId: 'addr-demo-1',
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
