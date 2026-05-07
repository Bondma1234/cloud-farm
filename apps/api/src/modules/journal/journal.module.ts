import { Controller, Get, Module, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ============ DTO ============
class JournalDto {
  id!: string;
  type!: string;
  icon!: string;
  title!: string;
  summary!: string;
  body!: string;
  photos!: string[];
  by!: string;
  at!: string; // ISO
  plotId?: string | null;
  likes!: number;
  comments!: number;
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
    return rows.map(this.toDto);
  }

  async findOne(id: string): Promise<JournalDto> {
    const r = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`动态 ${id} 不存在`);
    return this.toDto(r);
  }

  private toDto = (r: {
    id: string; type: string; icon: string; title: string; summary: string; body: string;
    photos: string; by: string; at: Date; plotId: string | null; likes: number; comments: number;
  }): JournalDto => ({
    id: r.id, type: r.type, icon: r.icon, title: r.title, summary: r.summary, body: r.body,
    photos: this.safeArr(r.photos), by: r.by, at: r.at.toISOString(),
    plotId: r.plotId, likes: r.likes, comments: r.comments,
  });

  private safeArr(s: string | null | undefined): string[] {
    if (!s) return [];
    try { return JSON.parse(s) as string[]; } catch { return []; }
  }
}

// ============ Controller ============
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

// ============ Module ============
@Module({
  controllers: [JournalController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}
