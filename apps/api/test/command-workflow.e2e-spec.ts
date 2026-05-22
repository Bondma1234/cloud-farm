// ============ 指令工单完整闭环 e2e ============
// 验证 P8-1 的核心场景:用户发指令 → 农技员接单 → 完成 + 上传 → 用户看到日记
// 前置:demo user 必须已认养 P-A-07(seed 里 ORD-2026-0418 就是这关系)

import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, loginAsDemoUser, loginAsAgronomist } from './e2e-setup';

describe('指令工单完整闭环', () => {
  let app: INestApplication;
  let userToken: string;
  let agroToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token: userToken } = await loginAsDemoUser(app));
    ({ token: agroToken } = await loginAsAgronomist(app));
  });

  afterAll(async () => {
    await app.close();
  });

  let createdCommandId: string;

  it('用户能拉自己的认养地块', async () => {
    const r = await request(app.getHttpServer())
      .get('/api/users/me/plot')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(r.body.code).toBe(0);
    expect(r.body.data.plotId).toBeTruthy();
  });

  it('用户能创建一条 water 指令', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/commands')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'water', plotId: 'P-A-07', note: 'e2e 测试 - 浇水' })
      .expect(201);
    expect(r.body.code).toBe(0);
    expect(r.body.data.status).toBe('pending');
    expect(r.body.data.id).toMatch(/^c-\d{8}-\d{2}$/);
    createdCommandId = r.body.data.id;
  });

  it('不是认养人发指令应 403', async () => {
    const r = await request(app.getHttpServer())
      .post('/api/commands')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ type: 'water', plotId: 'P-A-99' });
    expect([400, 403]).toContain(r.status);
    expect(r.body.code).toBeGreaterThanOrEqual(400);
  });

  it('农技员能看到刚创建的 pending 工单', async () => {
    const r = await request(app.getHttpServer())
      .get('/api/admin/commands?status=pending')
      .set('Authorization', `Bearer ${agroToken}`)
      .expect(200);
    expect(r.body.data.some((c: { id: string }) => c.id === createdCommandId)).toBe(true);
  });

  it('农技员能接单, 状态变 executing', async () => {
    const r = await request(app.getHttpServer())
      .patch(`/api/admin/commands/${createdCommandId}/accept`)
      .set('Authorization', `Bearer ${agroToken}`)
      .expect(200);
    expect(r.body.data.status).toBe('executing');
    expect(r.body.data.by).toBeTruthy();
  });

  it('农技员能完成 + 自动写一条 JournalEntry', async () => {
    // 先记下当前 journal 条数
    const before = await request(app.getHttpServer())
      .get('/api/journal?plotId=P-A-07')
      .expect(200);
    const beforeCount = before.body.data.length;

    const r = await request(app.getHttpServer())
      .patch(`/api/admin/commands/${createdCommandId}/complete`)
      .set('Authorization', `Bearer ${agroToken}`)
      .send({ photo: '/images/farm-detail-1.jpg', note: 'e2e 完成 - 已浇水' })
      .expect(200);
    expect(r.body.data.status).toBe('completed');
    expect(r.body.data.photo).toBe('/images/farm-detail-1.jpg');
    expect(r.body.data.completedAt).toBeTruthy();

    const after = await request(app.getHttpServer())
      .get('/api/journal?plotId=P-A-07')
      .expect(200);
    expect(after.body.data.length).toBe(beforeCount + 1);
    // 最新一条应该是这个指令的日记
    const latest = after.body.data[0];
    expect(latest.plotId).toBe('P-A-07');
    expect(latest.type).toBe('water');
  });

  it('普通用户调 admin 接口应 403', async () => {
    await request(app.getHttpServer())
      .get('/api/admin/commands')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
