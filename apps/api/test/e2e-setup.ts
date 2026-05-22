// ============ E2E 测试启动器 ============
// 共用工具:把整个 NestJS app 起起来 + 暴露 supertest agent
// 跑测试前会跑 prisma db push + seed,确保数据库状态稳定
import { Test } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  return app;
}

/**
 * 用 demo customer 登录,返回 { token, userId }
 */
export async function loginAsDemoUser(app: INestApplication) {
  const r = await (await import('supertest')).default(app.getHttpServer())
    .post('/api/auth/login')
    .send({ phone: '13800000001', code: '123456' });
  if (r.body.code !== 0) throw new Error('demo user login 失败: ' + JSON.stringify(r.body));
  return { token: r.body.data.accessToken as string, userId: r.body.data.user.id as number };
}

/** 用农技员登录(seed 已加 19999999999 role=agronomist) */
export async function loginAsAgronomist(app: INestApplication) {
  const r = await (await import('supertest')).default(app.getHttpServer())
    .post('/api/auth/login')
    .send({ phone: '19999999999', code: '123456' });
  if (r.body.code !== 0) throw new Error('agronomist login 失败: ' + JSON.stringify(r.body));
  return { token: r.body.data.accessToken as string, userId: r.body.data.user.id as number };
}

/** 用 admin 登录(seed 已加 18888888888 role=admin) */
export async function loginAsAdmin(app: INestApplication) {
  const r = await (await import('supertest')).default(app.getHttpServer())
    .post('/api/auth/login')
    .send({ phone: '18888888888', code: '123456' });
  if (r.body.code !== 0) throw new Error('admin login 失败: ' + JSON.stringify(r.body));
  return { token: r.body.data.accessToken as string, userId: r.body.data.user.id as number };
}
