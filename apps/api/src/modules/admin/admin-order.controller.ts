import { BadRequestException, Body, Controller, Get, Injectable, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

class AdminOrderListItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: number;
  @ApiProperty({ required: false }) userPhone?: string;     // 脱敏后
  @ApiProperty({ required: false }) userNickname?: string;
  @ApiProperty() type!: string;
  @ApiProperty() title!: string;
  @ApiProperty() cover!: string;
  @ApiProperty() price!: number;
  @ApiProperty() status!: string;
  @ApiProperty() statusLabel!: string;
  @ApiProperty() date!: string;
  @ApiProperty({ required: false }) packageId?: string;
}

class AdminOrderListQueryDto {
  @ApiProperty({ required: false, description: '过滤 status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: '按 userId 过滤' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: '搜索 id / 标题(模糊匹配)' })
  @IsOptional()
  @IsString()
  q?: string;
}

class AdminUpdateStatusDto {
  @ApiProperty({
    enum: ['pending', 'paid', 'shipped', 'delivering', 'completed', 'growing', 'cancelled'],
    example: 'shipped',
  })
  @IsIn(['pending', 'paid', 'shipped', 'delivering', 'completed', 'growing', 'cancelled'])
  status!: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: '待付款',
  paid: '已付款',
  shipped: '待发货',
  delivering: '配送中',
  completed: '已完成',
  growing: '种植中',
  cancelled: '已取消',
};

@Injectable()
class AdminOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: AdminOrderListQueryDto): Promise<AdminOrderListItemDto[]> {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.userId) where.userId = Number(filter.userId);
    if (filter.q) {
      where.OR = [
        { id: { contains: filter.q } },
        { title: { contains: filter.q } },
      ];
    }
    const rows = await this.prisma.order.findMany({
      where,
      include: { user: true },
      orderBy: { date: 'desc' },
      take: 200, // 简单分页保护
    });
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userPhone: this.maskPhone(r.user?.phone || ''),
      userNickname: r.user?.nickname,
      type: r.type,
      title: r.title,
      cover: r.cover,
      price: r.price,
      status: r.status,
      statusLabel: r.statusLabel,
      date: r.date.toISOString().slice(0, 10),
      packageId: r.packageId ?? undefined,
    }));
  }

  async setStatus(id: string, status: string): Promise<AdminOrderListItemDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new BadRequestException(`订单 ${id} 不存在`);
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status, statusLabel: STATUS_LABEL[status] || status },
      include: { user: true },
    });
    return {
      id: updated.id,
      userId: updated.userId,
      userPhone: this.maskPhone(updated.user?.phone || ''),
      userNickname: updated.user?.nickname,
      type: updated.type,
      title: updated.title,
      cover: updated.cover,
      price: updated.price,
      status: updated.status,
      statusLabel: updated.statusLabel,
      date: updated.date.toISOString().slice(0, 10),
      packageId: updated.packageId ?? undefined,
    };
  }

  private maskPhone(phone: string): string {
    if (!/^1[3-9]\d{9}$/.test(phone)) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
}

@ApiTags('Admin · 订单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator', 'cs')
@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly svc: AdminOrderService) {}

  @Get()
  @ApiOperation({ summary: '所有用户的订单(admin/operator/cs 可见)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'q', required: false, description: '搜索 id / 标题' })
  @ApiResponse({ status: 200, type: [AdminOrderListItemDto] })
  list(@Query() query: AdminOrderListQueryDto) {
    return this.svc.list(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '改订单状态(admin / operator,cs 不可)' })
  @ApiResponse({ status: 200, type: AdminOrderListItemDto })
  @Roles('admin', 'operator')
  setStatus(@Param('id') id: string, @Body() dto: AdminUpdateStatusDto) {
    return this.svc.setStatus(id, dto.status);
  }
}

export { AdminOrderService, AdminOrderListItemDto };
