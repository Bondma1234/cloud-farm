// ============ 下单链路 e2e 回归网 ============
// 锁死 C 端核心成交链路:选套餐 → 选地块 → 选地址 → 创建认养订单
// 覆盖:鉴权 / 正常下单 / 地块原子锁 / 作物数量校验 / 优惠券抵扣 / 进我的订单
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, loginAsDemoUser } from './e2e-setup';

describe('下单链路 (创建认养订单)', () => {
  let app: INestApplication;
  let token: string;
  let addressId: string;
  let proPrice: number; // pkg-pro 套餐原价

  beforeAll(async () => {
    app = await createTestApp();
    ({ token } = await loginAsDemoUser(app));

    // 取一个收货地址(默认地址置顶)
    const addrRes = await request(app.getHttpServer())
      .get('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    addressId = addrRes.body.data[0].id;

    // 取 pkg-pro 原价,后面验优惠券抵扣用
    const pkgRes = await request(app.getHttpServer()).get('/api/packages').expect(200);
    proPrice = pkgRes.body.data.find((p: { id: string }) => p.id === 'pkg-pro').price;
  });

  afterAll(async () => {
    await app.close();
  });

  /** 取一块当前可认养的地块 id */
  async function firstAvailablePlotId(): Promise<string> {
    const res = await request(app.getHttpServer())
      .get('/api/plots/available')
      .expect(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    return res.body.data[0].id;
  }

  it('未登录创建订单 → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .send({ packageId: 'pkg-pro', plotId: 'P-A-02', crops: ['小番茄'], addressId: 'x' });
    expect(res.body.code).toBe(401);
  });

  it('正常下单 → 返回 pending 认养订单, 且地块被锁成 sold', async () => {
    const plotId = await firstAvailablePlotId();

    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId: 'pkg-pro', plotId, crops: ['小番茄', '草莓'], addressId, stake: '回归测试田' })
      .expect(201);

    expect(res.body.code).toBe(0);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.type).toBe('认养');
    expect(res.body.data.price).toBe(proPrice); // 没用券 = 原价
    expect(res.body.data.id).toMatch(/^ORD-/);

    // 地块应已被锁:不再出现在 available 列表里
    const avail = await request(app.getHttpServer()).get('/api/plots/available').expect(200);
    expect(avail.body.data.some((p: { id: string }) => p.id === plotId)).toBe(false);

    // 该订单应出现在"我的订单"
    const mine = await request(app.getHttpServer())
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(mine.body.data.some((o: { id: string }) => o.id === res.body.data.id)).toBe(true);
  });

  it('对已被锁的地块再次下单 → 409 冲突', async () => {
    // 先占一块
    const plotId = await firstAvailablePlotId();
    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId: 'pkg-basic', plotId, crops: ['红薯'], addressId })
      .expect(201);

    // 同一块再下单
    const dup = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId: 'pkg-basic', plotId, crops: ['红薯'], addressId });
    expect(dup.body.code).toBe(409);
    expect(dup.body.message).toMatch(/已被认养|维护中/);
  });

  it('基础版选 2 种作物 → 400 (超出上限)', async () => {
    const plotId = await firstAvailablePlotId();
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId: 'pkg-basic', plotId, crops: ['红薯', '草莓'], addressId });
    expect(res.body.code).toBe(400);
    expect(res.body.message).toMatch(/最多选 1 种/);
  });

  it('带优惠券下单 → 实付 = 原价 - 券额, 且券标记为已用', async () => {
    // 找一张:未使用 + 非商城专用 + 满门槛(基于 pkg-pro 原价)
    const couponsRes = await request(app.getHttpServer())
      .get('/api/users/me/coupons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const usable = couponsRes.body.data.find(
      (c: { status: string; scope: string; threshold: number }) =>
        c.status === 'unused' && c.scope !== 'shop' && proPrice >= c.threshold,
    );
    if (!usable) {
      console.warn('没有可用优惠券(可能此前测试已用完),跳过抵扣用例');
      return;
    }

    const plotId = await firstAvailablePlotId();
    const res = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ packageId: 'pkg-pro', plotId, crops: ['小番茄'], addressId, couponId: usable.id })
      .expect(201);

    expect(res.body.data.price).toBe(Math.max(0, proPrice - usable.amount));

    // 券应已被标记为 used
    const after = await request(app.getHttpServer())
      .get('/api/users/me/coupons')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const used = after.body.data.find((c: { id: string }) => c.id === usable.id);
    expect(used.status).toBe('used');
  });
});
