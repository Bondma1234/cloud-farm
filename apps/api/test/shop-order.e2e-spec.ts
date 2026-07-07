// ============ 农产品商城下单 e2e 回归网(M-08)============
// 锁死商城成交链路:选 SKU → 结算 → 创建产地直送订单
// 覆盖:鉴权 / 正常下单+扣库存 / 冷链运费 / 库存不足 409
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, loginAsDemoUser } from './e2e-setup';

describe('农产品商城下单 (createShop)', () => {
  let app: INestApplication;
  let token: string;
  let addressId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token } = await loginAsDemoUser(app));
    const addr = await request(app.getHttpServer())
      .get('/api/users/me/addresses')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    addressId = addr.body.data[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  /** 读某个 sku 当前库存 */
  async function stockOf(goodsId: string, skuId: string): Promise<number> {
    const res = await request(app.getHttpServer()).get(`/api/goods/${goodsId}`).expect(200);
    return res.body.data.skus.find((s: { id: string }) => s.id === skuId).stock;
  }

  it('未登录下单 → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders/shop')
      .send({ items: [{ skuId: 'sku-tomato-3', qty: 1 }], addressId });
    expect(res.body.code).toBe(401);
  });

  it('正常下单 → 产地直送订单, 价格正确, 库存扣减', async () => {
    // 非冷链商品:蜜薯 3 斤装 ¥19 → 买 2 件 = 38,包邮
    const before = await stockOf('g-sweetpotah', 'sku-sweetpotah-3');
    const res = await request(app.getHttpServer())
      .post('/api/orders/shop')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ skuId: 'sku-sweetpotah-3', qty: 2 }], addressId })
      .expect(201);

    expect(res.body.code).toBe(0);
    expect(res.body.data.type).toBe('产地直送');
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.price).toBe(38); // 19×2,无冷链包邮
    expect(res.body.data.count).toBe(2);

    const after = await stockOf('g-sweetpotah', 'sku-sweetpotah-3');
    expect(after).toBe(before - 2);
  });

  it('冷链商品不满 199 → 加 ¥20 运费', async () => {
    // 草莓 2 盒 ¥39(冷链)→ 39 + 20 运费 = 59
    const res = await request(app.getHttpServer())
      .post('/api/orders/shop')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ skuId: 'sku-strawberry-2', qty: 1 }], addressId })
      .expect(201);
    expect(res.body.data.price).toBe(59);
  });

  it('库存不足 → 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/orders/shop')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ skuId: 'sku-tomato-3', qty: 999999 }], addressId });
    expect(res.body.code).toBe(409);
    expect(res.body.message).toMatch(/库存不足/);
  });
});
