import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Post,
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
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';

// ============ DTOs ============
export class CommandDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() icon!: string;
  @ApiProperty() label!: string;
  @ApiProperty() plotId!: string;
  @ApiProperty() requestedAt!: string;
  @ApiProperty({ required: false }) completedAt?: string;
  @ApiProperty() status!: string;
  @ApiProperty() statusLabel!: string;
  @ApiProperty({ required: false }) by?: string;
  @ApiProperty() note!: string;
  @ApiProperty({ required: false }) photo?: string;
  @ApiProperty() cost!: number;
}

class CreateCommandDto {
  @ApiProperty({ enum: ['water', 'fertilize', 'weed', 'shoot', 'pest', 'plant'] })
  @IsIn(['water', 'fertilize', 'weed', 'shoot', 'pest', 'plant'])
  type!: string;

  @ApiProperty({ example: 'P-A-07' })
  @IsString()
  plotId!: string;

  @ApiProperty({ required: false, example: '小番茄叶子有点黄,麻烦看看' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

// type → icon / label / 默认 statusLabel
const TYPE_META: Record<string, { icon: string; label: string; cost: number }> = {
  water:     { icon: '💧', label: '浇水',     cost: 0 },
  fertilize: { icon: '🌱', label: '施肥',     cost: 0 },
  weed:      { icon: '🌿', label: '除草',     cost: 0 },
  shoot:     { icon: '📸', label: '拍张照',   cost: 0 },
  pest:      { icon: '🐛', label: '捉虫',     cost: 0 },
  plant:     { icon: '🌾', label: '补种',     cost: 0 },
};

const STATUS_LABEL: Record<string, string> = {
  pending:   '待执行',
  executing: '执行中',
  completed: '已完成',
  rejected:  '已拒绝',
};

// ============ Service ============
@Injectable()
export class CommandService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 校验:用户是否是该地块的认养人
   * 跟 CameraService.assertOwn 一个套路,但发指令允许 pending(没付款也能发,只是要等付款后才执行)
   */
  private async assertOwn(userId: number, plotId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        plotId,
        type: '认养',
        status: { in: ['pending', 'paid', 'growing', 'shipped'] },
      },
    });
    if (!order) {
      throw new ForbiddenException(`你不是地块 ${plotId} 的认养人,无法发指令`);
    }
  }

  async findAllByUser(userId: number, type?: string): Promise<CommandDto[]> {
    const rows = await this.prisma.command.findMany({
      where: { userId, ...(type ? { type } : {}) },
      orderBy: { requestedAt: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  /** 用户发指令(my-plot 页"浇水/施肥/除草/拍张照"按钮调它) */
  async create(userId: number, dto: CreateCommandDto): Promise<CommandDto> {
    const meta = TYPE_META[dto.type];
    if (!meta) throw new BadRequestException(`未知指令类型 ${dto.type}`);

    await this.assertOwn(userId, dto.plotId);

    // 生成 id: c-2026-0507-01 类似
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const seq = await this.prisma.command.count({
      where: {
        requestedAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    });
    const id = `c-${ymd}-${String(seq + 1).padStart(2, '0')}`;

    const row = await this.prisma.command.create({
      data: {
        id,
        userId,
        type: dto.type,
        icon: meta.icon,
        label: meta.label,
        plotId: dto.plotId,
        requestedAt: now,
        status: 'pending',
        statusLabel: STATUS_LABEL.pending,
        by: null,
        note: dto.note ?? '',
        photo: null,
        cost: meta.cost,
      },
    });
    return this.toDto(row);
  }

  /** Admin 列表(给农技员/运营查所有工单) */
  async findAllForAdmin(filter: { status?: string; plotId?: string; type?: string }): Promise<CommandDto[]> {
    const where: Record<string, unknown> = {};
    if (filter.status) where.status = filter.status;
    if (filter.plotId) where.plotId = filter.plotId;
    if (filter.type) where.type = filter.type;
    const rows = await this.prisma.command.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      take: 200,
    });
    return rows.map((r) => this.toDto(r));
  }

  /** 农技员接单: pending → executing,写入 by */
  async accept(id: string, agronomistName: string): Promise<CommandDto> {
    const row = await this.prisma.command.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`工单 ${id} 不存在`);
    if (row.status !== 'pending') {
      throw new BadRequestException(`工单 ${id} 当前状态是 ${row.statusLabel},只有"待执行"可接单`);
    }
    const updated = await this.prisma.command.update({
      where: { id },
      data: {
        status: 'executing',
        statusLabel: STATUS_LABEL.executing,
        by: agronomistName,
      },
    });
    return this.toDto(updated);
  }

  /**
   * 农技员完成:executing → completed,带 photo + 自动写 JournalEntry
   * 用户立刻在 journal 页看到"小李给你浇水了"
   */
  async complete(id: string, photo: string, note?: string): Promise<CommandDto> {
    const row = await this.prisma.command.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`工单 ${id} 不存在`);
    if (row.status !== 'executing' && row.status !== 'pending') {
      throw new BadRequestException(`工单 ${id} 当前状态是 ${row.statusLabel},无法完成`);
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedRow = await tx.command.update({
        where: { id },
        data: {
          status: 'completed',
          statusLabel: STATUS_LABEL.completed,
          completedAt: now,
          photo,
          note: note ?? row.note,
        },
      });

      // 自动写一条 JournalEntry,用户能在动态页看到
      await tx.journalEntry.create({
        data: {
          type: row.type,
          icon: row.icon,
          title: `${updatedRow.by ?? '农技员'}给你${row.label}了`,
          summary: `${this.fmt(now)} · 工单 ${id}`,
          body: `按你的指令完成了"${row.label}"操作${row.note ? `(备注:${row.note})` : ''}。`,
          photos: JSON.stringify([photo]),
          by: updatedRow.by ?? '农技员',
          at: now,
          plotId: row.plotId,
          likes: 0,
          comments: 0,
        },
      });

      return updatedRow;
    });

    return this.toDto(updated);
  }

  private toDto(r: {
    id: string; type: string; icon: string; label: string; plotId: string;
    requestedAt: Date; completedAt: Date | null; status: string; statusLabel: string;
    by: string | null; note: string; photo: string | null; cost: number;
  }): CommandDto {
    return {
      id: r.id,
      type: r.type,
      icon: r.icon,
      label: r.label,
      plotId: r.plotId,
      requestedAt: this.fmt(r.requestedAt),
      completedAt: r.completedAt ? this.fmt(r.completedAt) : undefined,
      status: r.status,
      statusLabel: r.statusLabel,
      by: r.by ?? undefined,
      note: r.note,
      photo: r.photo ?? undefined,
      cost: r.cost,
    };
  }

  private fmt(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

// ============ Controller(C 端) ============
@ApiTags('指令工单')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('commands')
export class CommandController {
  constructor(private readonly cmd: CommandService) {}

  @Get()
  @ApiOperation({ summary: '当前用户的指令历史(可按 type 过滤)' })
  @ApiQuery({ name: 'type', required: false, example: 'water' })
  @ApiResponse({ status: 200, type: [CommandDto] })
  list(@CurrentUser() user: JwtPayload, @Query('type') type?: string) {
    return this.cmd.findAllByUser(user.sub, type);
  }

  @Post()
  @ApiOperation({ summary: '用户发指令(浇水/施肥/除草/拍照等),必须是该地块认养人' })
  @ApiResponse({ status: 201, type: CommandDto })
  @ApiResponse({ status: 403, description: '不是该地块认养人' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCommandDto) {
    return this.cmd.create(user.sub, dto);
  }
}

@Module({
  controllers: [CommandController],
  providers: [CommandService],
  exports: [CommandService],
})
export class CommandModule {}
