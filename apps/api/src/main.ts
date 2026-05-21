import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UPLOAD_ROOT } from './modules/upload/upload.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');

  // 静态资源:暴露 /uploads/* (本地磁盘存的图片,P7 上 OSS 时这段删掉)
  // 上传接口在 /api/upload (单数),静态文件在 /uploads/<日期>/<文件>,不冲突
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  app.useStaticAssets(UPLOAD_ROOT, { prefix: '/uploads/' });

  // 跨域: dev 阶段允许所有来源(prod 时收紧)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 全局: 入参校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // DTO 上没声明的字段会被剥掉
      transform: true,         // 自动把 query 字符串转成数字等
      forbidNonWhitelisted: false,
    }),
  );

  // 全局: 统一响应格式 + 异常拦截
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger 文档 (/api/docs)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('云上田园 API')
    .setDescription('NestJS + Prisma · 详见架构 v2 §3')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const doc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`[云上田园 API] http://localhost:${port}/api/health`);
  // eslint-disable-next-line no-console
  console.log(`[Swagger 文档] http://localhost:${port}/api/docs`);
}

bootstrap();
