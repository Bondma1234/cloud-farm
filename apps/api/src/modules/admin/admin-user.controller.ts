// ============ Admin · 用户管理 ============
// admin 才能调,不能改自己的 role / status(防误锁)
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';
import { PrismaService } from '../../prisma/prisma.service';

// ============ DTOs ============
class AdminUserItemDto {
  @ApiProperty() id!: number;
  @ApiProperty({ example: '138****0001' }) phone!: string; // 脱敏
  @ApiProperty() nickname!: string;
  @ApiProperty() avatar!: string;
  @ApiProperty() level!: string;
  @ApiProperty({ enum: ['customer', 'agronomist', 'cs', 'operator', 'admin'] }) role!: string;
  @ApiProperty() active!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty({ description: '认养订单数' }) orderCount!: number;
}

class AdminUserListQueryDto {
  @ApiProperty({ required: false, enum: ['customer', 'agronomist', 'cs', 'operator', 'admin'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false, description: '搜索 手机号 / 昵称(模糊匹配)' })
  @IsOptional()
  @IsString()
  q?: string;
}

class SetRoleDto {
  @ApiProperty({ enum: ['customer', 'agronomist', 'cs', 'operator', 'admin'] })
  @IsIn(['customer', 'agronomist', 'cs', 'operator', 'admin'])
  role!: string;
}

class SetActiveDto {
  @ApiProperty({ example: false, description: 'false=禁用,true=启用' })
  @IsBoolean()
  active!: boolean;
}

// ============ Service ============
@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: AdminUserListQueryDto): Promise<AdminUserItemDto[]> {
    const where: Record<string, unknown> = {};
    if (filter.role) where.role = filter.role;
    if (filter.q) {
      where.OR = [
        { phone: { contains: filter.q } },
        { nickname: { contains: filter.q } },
      ];
    }
    const rows = await this.prisma.user.findMany({
      where,
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return rows.map((r) => this.toDto(r));
  }

  async setRole(targetId: number, currentUserId: number, role: string): Promise<AdminUserItemDto> {
    if (targetId === currentUserId) {
      throw new ForbiddenException('不能修改自己的角色');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException(`用户 ${targetId} 不存在`);
    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      include: { _count: { select: { orders: true } } },
    });
    return this.toDto(updated);
  }

  async setActive(targetId: number, currentUserId: number, active: boolean): Promise<AdminUserItemDto> {
    if (targetId === currentUserId) {
      throw new ForbiddenException('不能禁用 / 启用自己');
    }
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException(`用户 ${targetId} 不存在`);
    if (user.role === 'admin' && !active) {
      throw new BadRequestException('不能禁用其他 admin 账号(防止全员锁死)');
    }
    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { active },
      include: { _count: { select: { orders: true } } },
    });
    return this.toDto(updated);
  }

  private toDto(r: {
    id: number; phone: string; nickname: string; avatar: string; level: string;
    role: string; active: boolean; createdAt: Date;
    _count: { orders: number };
  }): AdminUserItemDto {
    return {
      id: r.id,
      phone: this.maskPhone(r.phone),
      nickname: r.nickname,
      avatar: r.avatar,
      level: r.level,
      role: r.role,
      active: r.active,
      createdAt: r.createdAt.toISOString().slice(0, 10),
      orderCount: r._count.orders,
    };
  }

  private maskPhone(phone: string): string {
    if (!/^1[3-9]\d{9}$/.test(phone)) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
}

// ============ Controller ============
@ApiTags('Admin · 用户管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly svc: AdminUserService) {}

  @Get()
  @ApiOperation({ summary: '所有用户(admin 可见,带订单数)' })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'q', required: false, description: '搜索 手机号 / 昵称' })
  @ApiResponse({ status: 200, type: [AdminUserItemDto] })
  list(@Query() q: AdminUserListQueryDto) {
    return this.svc.list(q);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: '改用户角色(不能改自己)' })
  @ApiResponse({ status: 200, type: AdminUserItemDto })
  setRole(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetRoleDto,
  ) {
    return this.svc.setRole(id, user.sub, dto.role);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '禁用 / 启用(不能改自己,不能禁用其他 admin)' })
  @ApiResponse({ status: 200, type: AdminUserItemDto })
  setActive(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetActiveDto,
  ) {
    return this.svc.setActive(id, user.sub, dto.active);
  }
}
