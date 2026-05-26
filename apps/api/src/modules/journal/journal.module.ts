import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException,
  Param, Post, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';

// ============ DTO ============
class JournalDto {
  @ApiProperty() id!: string;
  @ApiProperty() type!: string;
  @ApiProperty() icon!: string;
  @ApiProperty() title!: string;
  @ApiProperty() summary!: string;
  @ApiProperty() body!: string;
  @ApiProperty({ type: [String] }) photos!: string[];
  @ApiProperty() by!: string;
  @ApiProperty() at!: string; // ISO
  @ApiProperty({ required: false, nullable: true }) plotId?: string | null;
  @ApiProperty() likes!: number;
  @ApiProperty() comments!: number;
}

// 默认 type → icon 映射(运营不填 icon 时兜底)
const TYPE_ICON: Record<string, string> = {
  bloom: '🌸', water: '💧', fertilize: '🌱', weed: '🌿', shoot: '📸',
  plant: '🌾', ship: '📦', harvest: '🎉', pest: '🐛', news: '📰',
};

class CreateJournalDto {
  @ApiProperty({ example: 'news', description: '动态类型: bloom/water/fertilize/weed/shoot/plant/ship/harvest/pest/news' })
  @IsString()
  @MaxLength(30)
  type!: string;

  @ApiProperty({ required: false, example: '🌸', description: '不填则按 type 自动映射' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

  @ApiProperty({ example: '今天田里开了一片小番茄花 🌸' })
  @IsString()
  @MaxLength(100)
  title!: string;

  @ApiProperty({ required: false, example: '2026-05-25 · A 区 12 号地块' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  summary?: string;

  @ApiProperty({ example: '经过一周的精心照料,昨天浇水后今早就看到第一批小番茄开花了...' })
  @IsString()
  @MaxLength(2000)
  body!: string;

  @ApiProperty({ required: false, type: [String], example: ['/uploads/2026-05-25/abc.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiProperty({ required: false, example: 'P-A-07', description: '关联地块,不填表示全场动态' })
  @IsOptional()
  @IsString()
  plotId?: string;
}

// ============ Service ============
@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: string, plotId?: string): Promise<JournalDto[]> {
    const rows = await this.prisma.journalEntry.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(plotId ? { plotId } : {}),
      },
      orderBy: { at: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async findOne(id: string): Promise<JournalDto> {
    const r = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`动态 ${id} 不存在`);
    return this.toDto(r);
  }

  /** Admin 主动发布动态 */
  async create(dto: CreateJournalDto, byNickname: string): Promise<JournalDto> {
    const now = new Date();
    const row = await this.prisma.journalEntry.create({
      data: {
        type: dto.type,
        icon: dto.icon || TYPE_ICON[dto.type] || '📰',
        title: dto.title,
        summary: dto.summary || `${this.ymd(now)} · ${byNickname}`,
        body: dto.body,
        photos: JSON.stringify(dto.photos || []),
        by: byNickname,
        at: now,
        plotId: dto.plotId || null,
        likes: 0,
        comments: 0,
      },
    });
    return this.toDto(row);
  }

  async remove(id: string): Promise<{ ok: true }> {
    const exists = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`动态 ${id} 不存在`);
    await this.prisma.journalEntry.delete({ where: { id } });
    return { ok: true };
  }

  private toDto(r: {
    id: string; type: string; icon: string; title: string; summary: string; body: string;
    photos: string; by: string; at: Date; plotId: string | null; likes: number; comments: number;
  }): JournalDto {
    return {
      id: r.id, type: r.type, icon: r.icon, title: r.title, summary: r.summary, body: r.body,
      photos: this.safeArr(r.photos), by: r.by, at: r.at.toISOString(),
      plotId: r.plotId, likes: r.likes, comments: r.comments,
    };
  }

  private safeArr(s: string | null | undefined): string[] {
    if (!s) return [];
    try { return JSON.parse(s) as string[]; } catch { return []; }
  }

  private ymd(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

// ============ Controller(公开列表 + 详情) ============
@ApiTags('田园动态')
@Controller('journal')
export class JournalController {
  constructor(private readonly journal: JournalService) {}

  @Get()
  @ApiOperation({ summary: '动态列表(可按 type / plotId 过滤)' })
  @ApiQuery({ name: 'type', required: false, example: 'bloom' })
  @ApiQuery({ name: 'plotId', required: false, example: 'P-A-07' })
  @ApiResponse({ status: 200, type: [JournalDto] })
  list(@Query('type') type?: string, @Query('plotId') plotId?: string) {
    return this.journal.findAll(type, plotId);
  }

  @Get(':id')
  @ApiOperation({ summary: '动态详情' })
  @ApiResponse({ status: 200, type: JournalDto })
  detail(@Param('id') id: string) {
    return this.journal.findOne(id);
  }
}

// ============ Controller(Admin · 发布 / 删除) ============
@ApiTags('Admin · 动态管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator', 'agronomist')
@Controller('admin/journal')
export class AdminJournalController {
  constructor(
    private readonly journal: JournalService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: '主动发布动态(by 字段从 JWT 解析,operator/agronomist/admin 可用)' })
  @ApiResponse({ status: 201, type: JournalDto })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateJournalDto) {
    const u = await this.prisma.user.findUnique({ where: { id: user.sub } });
    const name = u?.nickname || '运营';
    return this.journal.create(dto, name);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除动态(只 admin / operator,agronomist 不可)' })
  @Roles('admin', 'operator')
  remove(@Param('id') id: string) {
    return this.journal.remove(id);
  }
}

// ============ Module ============
@Module({
  controllers: [JournalController, AdminJournalController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}
