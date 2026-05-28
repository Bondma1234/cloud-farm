// ============ 优惠券模块 (P8 B) ============
// C 端:GET /api/users/me/coupons 拉自己的券(自动把过期的标记成 expired)
//
import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';

// ============ DTO ============
class UserCouponDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ['discount', 'cash'] }) type!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() threshold!: number;
  @ApiProperty({ enum: ['all', 'adopt', 'shop'] }) scope!: string;
  @ApiProperty() desc!: string;
  @ApiProperty({ enum: ['unused', 'used', 'expired'] }) status!: string;
  @ApiProperty({ enum: ['system', 'invite', 'signup'] }) source!: string;
  @ApiProperty({ example: '2026-06-25' }) expireAt!: string;
  @ApiProperty({ example: '满 200 可用' }) thresholdLabel!: string;
  @ApiProperty({ example: '认养专用' }) scopeLabel!: string;
}

// ============ Service ============
@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  /** 拉用户优惠券;顺手把过期但还标 unused 的券更新为 expired */
  async listForUser(userId: number): Promise<UserCouponDto[]> {
    const now = new Date();
    // 1. 懒过期:把 unused 且已过期的批量标记 expired
    await this.prisma.userCoupon.updateMany({
      where: { userId, status: 'unused', expireAt: { lt: now } },
      data: { status: 'expired' },
    });
    // 2. 拉全部(带 coupon 模板)
    const rows = await this.prisma.userCoupon.findMany({
      where: { userId },
      include: { coupon: true },
      orderBy: [{ status: 'asc' }, { expireAt: 'asc' }],
    });
    return rows.map((r) => this.toDto(r));
  }

  /** 给用户发一张券(供 invite / signup 复用) */
  async grant(userId: number, couponId: string, source: string): Promise<void> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon || coupon.status !== 'active') return;
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + coupon.validDays);
    await this.prisma.userCoupon.create({
      data: { userId, couponId, source, expireAt, status: 'unused' },
    });
  }

  private toDto(r: {
    id: string; status: string; source: string; expireAt: Date;
    coupon: {
      name: string; type: string; amount: number; threshold: number; scope: string; desc: string;
    };
  }): UserCouponDto {
    const c = r.coupon;
    const SCOPE_LABEL: Record<string, string> = { all: '全场通用', adopt: '认养专用', shop: '商城专用' };
    return {
      id: r.id,
      name: c.name,
      type: c.type,
      amount: c.amount,
      threshold: c.threshold,
      scope: c.scope,
      desc: c.desc,
      status: r.status,
      source: r.source,
      expireAt: r.expireAt.toISOString().slice(0, 10),
      thresholdLabel: c.threshold > 0 ? `满 ${c.threshold} 可用` : '无门槛',
      scopeLabel: SCOPE_LABEL[c.scope] || '全场通用',
    };
  }
}

// ============ Controller ============
@ApiTags('优惠券')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/coupons')
export class CouponController {
  constructor(private readonly coupon: CouponService) {}

  @Get()
  @ApiOperation({ summary: '当前用户的优惠券(过期自动标记)' })
  @ApiResponse({ status: 200, type: [UserCouponDto] })
  list(@CurrentUser() user: JwtPayload) {
    return this.coupon.listForUser(user.sub);
  }
}

@Module({
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
