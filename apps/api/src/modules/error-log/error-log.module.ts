// ============ 前端错误收集 (P8 W2-5) ============
// 轻量方案:
//   - POST /api/errors  公开(没登录也能上报)
//   - GET  /api/admin/error-logs  admin/operator 看列表
//
// 上报方:miniapp / admin 的 main.ts 装 errorHandler + unhandledrejection
//
import {
  Body, Controller, Get, Injectable, Module, Optional, Post, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';
import { PrismaService } from '../../prisma/prisma.service';

// ============ DTOs ============
class ReportErrorDto {
  @ApiProperty({ enum: ['admin', 'miniapp'] })
  @IsIn(['admin', 'miniapp'])
  source!: string;

  @ApiProperty({ example: 'TypeError: x is undefined' })
  @IsString()
  @MaxLength(500)
  message!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  stack?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  url?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  userAgent?: string;
}

class ErrorLogListQueryDto {
  @ApiProperty({ required: false, enum: ['admin', 'miniapp'] })
  @IsOptional()
  @IsString()
  source?: string;
}

class ErrorLogItemDto {
  @ApiProperty() id!: number;
  @ApiProperty() source!: string;
  @ApiProperty() message!: string;
  @ApiProperty() stack!: string;
  @ApiProperty() url!: string;
  @ApiProperty() userAgent!: string;
  @ApiProperty({ required: false }) userId?: number;
  @ApiProperty() at!: string;
}

// ============ Service ============
@Injectable()
export class ErrorLogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 上报错误。如果调用方带了 JWT,优先取 user.sub 作 userId;
   * 否则匿名(no auth)
   */
  async report(dto: ReportErrorDto, userId: number | undefined): Promise<{ id: number }> {
    const row = await this.prisma.errorLog.create({
      data: {
        source: dto.source,
        message: dto.message,
        stack: dto.stack ?? '',
        url: dto.url ?? '',
        userAgent: dto.userAgent ?? '',
        userId: userId ?? null,
      },
    });
    return { id: row.id };
  }

  async list(filter: ErrorLogListQueryDto): Promise<ErrorLogItemDto[]> {
    const where: Record<string, unknown> = {};
    if (filter.source) where.source = filter.source;
    const rows = await this.prisma.errorLog.findMany({
      where,
      orderBy: { at: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      id: r.id,
      source: r.source,
      message: r.message,
      stack: r.stack,
      url: r.url,
      userAgent: r.userAgent,
      userId: r.userId ?? undefined,
      at: r.at.toISOString().replace('T', ' ').slice(0, 19),
    }));
  }
}

// ============ Controller (公开上报) ============
@ApiTags('错误收集')
@Controller('errors')
export class ErrorReportController {
  constructor(private readonly svc: ErrorLogService) {}

  @Post()
  @ApiOperation({ summary: '前端错误上报(公开,不需登录)' })
  @ApiResponse({ status: 201, schema: { properties: { id: { type: 'number' } } } })
  // 可选挂 JWT —— 不强制,但如果带了 token 就解出来记 userId(不写 @UseGuards,
  // 让没登录的也能匿名上报)
  report(@Body() dto: ReportErrorDto) {
    return this.svc.report(dto, undefined);
  }
}

// ============ Controller (Admin 看列表) ============
@ApiTags('Admin · 错误日志')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator')
@Controller('admin/error-logs')
export class AdminErrorLogController {
  constructor(private readonly svc: ErrorLogService) {}

  @Get()
  @ApiOperation({ summary: '错误日志列表(admin / operator)' })
  @ApiQuery({ name: 'source', required: false, enum: ['admin', 'miniapp'] })
  @ApiResponse({ status: 200, type: [ErrorLogItemDto] })
  list(@Query() q: ErrorLogListQueryDto) {
    return this.svc.list(q);
  }
}

@Module({
  controllers: [ErrorReportController, AdminErrorLogController],
  providers: [ErrorLogService],
  exports: [ErrorLogService],
})
export class ErrorLogModule {}
