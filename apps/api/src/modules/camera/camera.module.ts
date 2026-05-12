import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';

// ============ DTOs ============
class CameraUrlDto {
  @ApiProperty({ example: '/images/plot-snapshot.jpg' })
  url!: string;

  @ApiProperty({ example: 'mock', enum: ['mock', 'ezviz', 'hikvision'] })
  vendor!: string;

  @ApiProperty({ example: true })
  online!: boolean;

  @ApiProperty({ example: true })
  ptzSupported!: boolean;

  @ApiProperty({ example: 600, description: 'token 有效期(秒); P5 接萤石云时由 OpenAPI 返回真实值' })
  ttl!: number;
}

class PtzDirectionDto {
  @ApiProperty({ enum: ['up', 'down', 'left', 'right', 'zoom-in', 'zoom-out', 'reset'] })
  @IsIn(['up', 'down', 'left', 'right', 'zoom-in', 'zoom-out', 'reset'])
  direction!: string;
}

class SnapshotDto {
  @ApiProperty({ example: '/images/farm-detail-1.jpg' })
  url!: string;

  @ApiProperty({ example: '2026-05-12T03:45:00.000Z' })
  at!: string;
}

// ============ Service ============
@Injectable()
export class CameraService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 鉴权:用户必须是该地块的认养人
   * 通过查 Order 表: 该用户有 plotId=plot.id 且状态是 paid/growing/shipped 的认养订单
   *
   * P5 真接萤石云后再考虑"农技员/场长"等角色直接看(走 RBAC,不走这层)
   */
  private async assertOwn(userId: number, plotId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        plotId,
        type: '认养',
        status: { in: ['paid', 'growing', 'shipped', 'pending'] },
      },
    });
    if (!order) {
      throw new ForbiddenException(`你不是地块 ${plotId} 的认养人`);
    }
  }

  /**
   * 拉摄像头播放地址
   * MVP mock: 返回静态图当占位画面 + 60s TTL(模拟萤石 token 有效期)
   * P5 真:调萤石 OpenAPI `/api/lapp/v2/live/address/get`
   */
  async getUrl(userId: number, plotId: string): Promise<CameraUrlDto> {
    await this.assertOwn(userId, plotId);
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: { camera: true },
    });
    if (!plot) throw new NotFoundException(`地块 ${plotId} 不存在`);
    if (!plot.camera) throw new NotFoundException(`地块 ${plotId} 未绑定摄像头`);

    return {
      url: '/images/plot-snapshot.jpg', // P5 切真:萤石返的 EZOPEN URL
      vendor: plot.camera.vendor,
      online: plot.camera.status === 'online',
      ptzSupported: plot.camera.ptzSupported,
      ttl: 600,
    };
  }

  /**
   * PTZ 云台控制
   * MVP mock: 只校验权限 + 校验云台支持,然后 200
   * P5 真:调萤石 `/api/lapp/device/ptz/start` 和 `.../stop`
   */
  async ptz(userId: number, plotId: string, direction: string): Promise<{ ok: true; direction: string }> {
    await this.assertOwn(userId, plotId);
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: { camera: true },
    });
    if (!plot?.camera) throw new NotFoundException(`地块 ${plotId} 未绑定摄像头`);
    if (!plot.camera.ptzSupported) {
      throw new BadRequestException('当前套餐摄像头是共享类型,不支持 PTZ 控制');
    }
    // mock: P5 这里调萤石 API
    return { ok: true, direction };
  }

  /**
   * 抓拍 / 拍张照
   * MVP mock: 随机选一张作物图当结果
   * P5 真:调萤石 `/api/lapp/device/capture` 拉一帧 jpeg → 上传 OSS
   *
   * 抓拍成功后自动写一条 JournalEntry(对用户透明)
   */
  async snapshot(userId: number, plotId: string): Promise<SnapshotDto> {
    await this.assertOwn(userId, plotId);
    const plot = await this.prisma.plot.findUnique({
      where: { id: plotId },
      include: { camera: true },
    });
    if (!plot?.camera) throw new NotFoundException(`地块 ${plotId} 未绑定摄像头`);

    // mock 抓拍结果:从几张候选图里挑一张
    const candidates = [
      '/images/farm-detail-1.jpg',
      '/images/farm-detail-2.jpg',
      '/images/farm-detail-3.jpg',
      '/images/plot-snapshot.jpg',
    ];
    const url = candidates[Math.floor(Math.random() * candidates.length)];
    const at = new Date();

    // 抓拍写一条动态(让用户在 journal 页看到)
    await this.prisma.journalEntry.create({
      data: {
        type: 'shoot',
        icon: '📸',
        title: '你点了"拍张照",照片来了',
        summary: `${this.fmt(at)} · 摄像头自动抓拍`,
        body: `刚刚通过摄像头远程抓拍了地块 ${plotId} 的实时画面,长势正常,已加入生长日记。`,
        photos: JSON.stringify([url]),
        by: '摄像头(自动)',
        at,
        plotId,
        likes: 0,
        comments: 0,
      },
    });

    return { url, at: at.toISOString() };
  }

  private fmt(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

// ============ Controller ============
@ApiTags('摄像头')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cameras')
export class CameraController {
  constructor(private readonly camera: CameraService) {}

  @Get(':plotId/url')
  @ApiOperation({ summary: '拉地块摄像头的播放地址(MVP mock,P5 切萤石云 EZOPEN)' })
  @ApiResponse({ status: 200, type: CameraUrlDto })
  @ApiResponse({ status: 403, description: '不是该地块的认养人' })
  getUrl(@CurrentUser() user: JwtPayload, @Param('plotId') plotId: string) {
    return this.camera.getUrl(user.sub, plotId);
  }

  @Post(':plotId/ptz')
  @ApiOperation({ summary: 'PTZ 云台控制' })
  ptz(
    @CurrentUser() user: JwtPayload,
    @Param('plotId') plotId: string,
    @Body() dto: PtzDirectionDto,
  ) {
    return this.camera.ptz(user.sub, plotId, dto.direction);
  }

  @Post(':plotId/snapshot')
  @ApiOperation({ summary: '抓拍 / 拍张照,自动写一条 JournalEntry' })
  @ApiResponse({ status: 200, type: SnapshotDto })
  snapshot(@CurrentUser() user: JwtPayload, @Param('plotId') plotId: string) {
    return this.camera.snapshot(user.sub, plotId);
  }
}

@Module({
  controllers: [CameraController],
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
