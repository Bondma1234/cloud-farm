import { Controller, Get } from '@nestjs/common';

/**
 * 健康检查 - P1 阶段唯一接口,用来验证 API 启动是否正常
 * P2 阶段会被真正的业务接口替代
 */
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'cloud-farm-api',
      version: '0.1.0',
      time: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
    };
  }
}
