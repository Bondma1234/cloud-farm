// ============ Admin · 看板聚合接口 ============
// 给前端 Dashboard 直接画 ECharts 用,后端把所有计算 + 0 值补位都做完
// admin / operator 可访问

import { Controller, Get, Injectable, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

// ============ DTOs ============
class StatKV {
  @ApiProperty() label!: string;
  @ApiProperty() value!: number;
}
class GmvPoint {
  @ApiProperty({ example: '2026-05-15' }) date!: string;
  @ApiProperty({ example: 1598 }) gmv!: number;
  @ApiProperty({ example: 2 }) orderCount!: number;
}
class PackageRank {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() orderCount!: number;
  @ApiProperty() gmv!: number;
}
class AdminStatsDto {
  @ApiProperty({ description: 'KPI 总览 4 卡' })
  totals!: {
    userCount: number;
    orderCount: number;
    gmvAll: number;       // 累计 GMV(认养付费 + 产地直送已付款部分)
    commandPending: number; // 待处理工单
  };

  @ApiProperty({ type: [StatKV], description: '用户按 role 分布' })
  userByRole!: StatKV[];

  @ApiProperty({ type: [StatKV], description: '订单按状态分布' })
  orderByStatus!: StatKV[];

  @ApiProperty({ type: [StatKV], description: '工单按状态分布' })
  commandByStatus!: StatKV[];

  @ApiProperty({ type: [GmvPoint], description: '最近 30 天 GMV(按日,0 值补位)' })
  gmv30d!: GmvPoint[];

  @ApiProperty({ type: [PackageRank], description: '套餐销量 top 3' })
  packageTop!: PackageRank[];

  @ApiProperty({
    description: '摄像头在线率',
    example: { online: 11, total: 12, rate: 0.917 },
  })
  cameraOnline!: { online: number; total: number; rate: number };
}

// ============ Service ============
@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<AdminStatsDto> {
    // 1. 总览
    const [userCount, orderCount, gmvAllResult, commandPending] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { price: true },
        where: { status: { in: ['paid', 'growing', 'shipped', 'delivering', 'completed'] } },
      }),
      this.prisma.command.count({ where: { status: 'pending' } }),
    ]);

    // 2. 用户按 role(Prisma groupBy)
    const userByRoleRows = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
    const ROLE_LABEL: Record<string, string> = {
      customer: '普通用户',
      agronomist: '农技员',
      cs: '客服',
      operator: '运营',
      admin: '管理员',
    };
    const userByRole: StatKV[] = userByRoleRows.map((r) => ({
      label: ROLE_LABEL[r.role] ?? r.role,
      value: r._count._all,
    }));

    // 3. 订单按状态
    const orderByStatusRows = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const STATUS_LABEL: Record<string, string> = {
      pending: '待付款', paid: '已付款', shipped: '待发货',
      delivering: '配送中', completed: '已完成', growing: '种植中', cancelled: '已取消',
    };
    const orderByStatus: StatKV[] = orderByStatusRows.map((r) => ({
      label: STATUS_LABEL[r.status] ?? r.status,
      value: r._count._all,
    }));

    // 4. 工单按状态
    const cmdByStatusRows = await this.prisma.command.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const CMD_STATUS_LABEL: Record<string, string> = {
      pending: '待执行', executing: '执行中', completed: '已完成', rejected: '已拒绝',
    };
    const commandByStatus: StatKV[] = cmdByStatusRows.map((r) => ({
      label: CMD_STATUS_LABEL[r.status] ?? r.status,
      value: r._count._all,
    }));

    // 5. 最近 30 天 GMV(SQLite 没 date_trunc,用 Prisma 拉数据后 JS 聚合)
    // 范围:从今天往前数 29 天到今天,共 30 天
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 29);

    const ordersIn30d = await this.prisma.order.findMany({
      where: {
        date: { gte: start },
        status: { in: ['paid', 'growing', 'shipped', 'delivering', 'completed'] },
      },
      select: { date: true, price: true },
    });
    // 按日期 key 聚合
    const byDate: Record<string, { gmv: number; orderCount: number }> = {};
    for (const o of ordersIn30d) {
      const k = this.ymd(o.date);
      if (!byDate[k]) byDate[k] = { gmv: 0, orderCount: 0 };
      byDate[k].gmv += o.price;
      byDate[k].orderCount += 1;
    }
    // 0 值补位,填满 30 天
    const gmv30d: GmvPoint[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const k = this.ymd(d);
      gmv30d.push({
        date: k,
        gmv: byDate[k]?.gmv ?? 0,
        orderCount: byDate[k]?.orderCount ?? 0,
      });
    }

    // 6. 套餐销量 top 3
    const pkgRows = await this.prisma.order.groupBy({
      by: ['packageId'],
      _count: { _all: true },
      _sum: { price: true },
      where: { packageId: { not: null }, status: { not: 'cancelled' } },
      orderBy: { _count: { packageId: 'desc' } },
      take: 3,
    });
    const pkgIds = pkgRows.map((r) => r.packageId).filter((x): x is string => !!x);
    const pkgs = pkgIds.length
      ? await this.prisma.package.findMany({ where: { id: { in: pkgIds } } })
      : [];
    const pkgNameById = Object.fromEntries(pkgs.map((p) => [p.id, p.name]));
    const packageTop: PackageRank[] = pkgRows.map((r) => ({
      id: r.packageId!,
      name: pkgNameById[r.packageId!] ?? r.packageId!,
      orderCount: r._count._all,
      gmv: r._sum.price ?? 0,
    }));

    // 7. 摄像头在线率
    const [camTotal, camOnline] = await Promise.all([
      this.prisma.camera.count(),
      this.prisma.camera.count({ where: { status: 'online' } }),
    ]);
    const cameraOnline = {
      online: camOnline,
      total: camTotal,
      rate: camTotal === 0 ? 0 : Math.round((camOnline / camTotal) * 1000) / 1000,
    };

    return {
      totals: {
        userCount,
        orderCount,
        gmvAll: gmvAllResult._sum.price ?? 0,
        commandPending,
      },
      userByRole,
      orderByStatus,
      commandByStatus,
      gmv30d,
      packageTop,
      cameraOnline,
    };
  }

  private ymd(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}

// ============ Controller ============
@ApiTags('Admin · 看板')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator')
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly svc: AdminStatsService) {}

  @Get()
  @ApiOperation({ summary: '运营看板聚合数据(admin / operator)' })
  @ApiResponse({ status: 200, type: AdminStatsDto })
  stats() {
    return this.svc.getStats();
  }
}
