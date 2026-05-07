import { Controller, Get, Module, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';

class CommandDto {
  id!: string;
  type!: string;
  icon!: string;
  label!: string;
  plotId!: string;
  requestedAt!: string;
  completedAt?: string;
  status!: string;
  statusLabel!: string;
  by?: string;
  note!: string;
  photo?: string;
  cost!: number;
}

@Injectable()
export class CommandService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: number, type?: string): Promise<CommandDto[]> {
    const rows = await this.prisma.command.findMany({
      where: {
        userId,
        ...(type ? { type } : {}),
      },
      orderBy: { requestedAt: 'desc' },
    });
    return rows.map(this.toDto);
  }

  private toDto = (r: {
    id: string; type: string; icon: string; label: string; plotId: string;
    requestedAt: Date; completedAt: Date | null; status: string; statusLabel: string;
    by: string | null; note: string; photo: string | null; cost: number;
  }): CommandDto => ({
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
  });

  /** 'YYYY-MM-DD HH:mm' 格式,跟 mock 数据一致,前端不用解析 */
  private fmt(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

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
}

@Module({
  controllers: [CommandController],
  providers: [CommandService],
  exports: [CommandService],
})
export class CommandModule {}
