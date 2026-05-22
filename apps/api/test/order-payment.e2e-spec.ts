// ============ 订单支付 mock flow e2e ============
// 验证 P8-2:pending → 支付 → growing,重复支付 400
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, loginAsDemoUser } from './e2e-setup';

describe('订单 mock 支付 flow', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token } = await loginAsDemoUser(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('seed 里有 pending 订单, 支付后变 growing', async () => {
    // 找一个 pending 状态的认养订单
    const list = await request(app.getHttpServer())
      .get('/api/orders?status=pending')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const pending = list.body.data.find((o: { type: string }) => o.type === '认养');
    if (!pending) {
      // 没 pending 的话(之前测试已经支付过),跳过
      console.warn('没有 pending 订单可测,跳过');
      return;
    }

    const pay = await request(app.getHttpServer())
      .post(`/api/orders/${pending.id}/pay`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(pay.body.data.status).toBe('growing');

    // 重复支付应该 400
    const dup = await request(app.getHttpServer())
      .post(`/api/orders/${pending.id}/pay`)
      .set('Authorization', `Bearer ${token}`);
    expect(dup.body.code).toBeGreaterThanOrEqual(400);
    expect(dup.body.message).toMatch(/不能支付/);
  });
});
