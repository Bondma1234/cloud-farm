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
  await prisma.user.upsert({
    where: { phone: DEMO_USER.phone },
    create: DEMO_USER,
    update: DEMO_USER,
  });
  console.log('  ✓ 1 demo 用户');

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
