// ============ 邀请好友模块 (P8 B) ============
// GET /api/users/me/invite — 返回我的邀请码 + 已邀请人数 + 累计奖励
// 邀请码首次访问时懒生成(CF + 6 位大写字母数字)
//
// 注册时带邀请码的发券逻辑在 AuthService.login 里(它持有 InviteService)
//
import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';
import { CouponModule } from '../coupon/coupon.module';
import { CouponService } from '../coupon/coupon.module';

// 邀请成功双方各发这张券
export const INVITE_COUPON_ID = 'cp-invite-50';

class InviteInfoDto {
  @ApiProperty({ example: 'CF8K2M9X' }) code!: string;
  @ApiProperty({ example: 3, description: '已成功邀请人数' }) invitedCount!: number;
  @ApiProperty({ example: 150, description: '累计获得奖励(元)' }) rewardTotal!: number;
  @ApiProperty({ type: [String], example: ['田***1', '微***8'], description: '已邀请用户脱敏昵称' })
  invitedNames!: string[];
}

@Injectable()
export class InviteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couponSvc: CouponService,
  ) {}

  /** 取/生成我的邀请码 + 统计 */
  async getInfo(userId: number): Promise<InviteInfoDto> {
    let user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');
    // 懒生成邀请码
    if (!user.inviteCode) {
      const code = await this.genUniqueCode();
      user = await this.prisma.user.update({ where: { id: userId }, data: { inviteCode: code } });
    }
    // 我邀请了多少人(invitedBy = 我)
    const invited = await this.prisma.user.findMany({
      where: { invitedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    // 累计奖励 = 我因邀请获得的 invite 券金额之和
    const inviteCoupons = await this.prisma.userCoupon.findMany({
      where: { userId, source: 'invite' },
      include: { coupon: true },
    });
    const rewardTotal = inviteCoupons.reduce((sum, uc) => sum + uc.coupon.amount, 0);

    return {
      code: user.inviteCode!,
      invitedCount: invited.length,
      rewardTotal,
      invitedNames: invited.map((u) => this.maskName(u.nickname)),
    };
  }

  /**
   * 注册时绑定邀请关系 + 双方发券
   * 只在"新用户首次登录(刚创建)"时调,inviteCode 来自前端
   */
  async bindInviteOnSignup(newUserId: number, inviteCode: string): Promise<void> {
    if (!inviteCode) return;
    const inviter = await this.prisma.user.findUnique({ where: { inviteCode } });
    if (!inviter || inviter.id === newUserId) return; // 码无效 / 自己邀请自己
    // 记 invitedBy
    await this.prisma.user.update({ where: { id: newUserId }, data: { invitedBy: inviter.id } });
    // 双方各发一张邀请券
    await this.couponSvc.grant(newUserId, INVITE_COUPON_ID, 'invite');
    await this.couponSvc.grant(inviter.id, INVITE_COUPON_ID, 'invite');
  }

  private async genUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混 0/O/1/I
    for (let attempt = 0; attempt < 10; attempt++) {
      let code = 'CF';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      const exists = await this.prisma.user.findUnique({ where: { inviteCode: code } });
      if (!exists) return code;
    }
    // 极小概率兜底:加时间戳
    return `CF${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }

  private maskName(name: string): string {
    if (name.length <= 1) return name + '**';
    return name[0] + '***' + name.slice(-1);
  }
}

@ApiTags('邀请好友')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users/me/invite')
export class InviteController {
  constructor(private readonly invite: InviteService) {}

  @Get()
  @ApiOperation({ summary: '我的邀请码 + 邀请统计' })
  @ApiResponse({ status: 200, type: InviteInfoDto })
  info(@CurrentUser() user: JwtPayload) {
    return this.invite.getInfo(user.sub);
  }
}

@Module({
  imports: [CouponModule],
  controllers: [InviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
