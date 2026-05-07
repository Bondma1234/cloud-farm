import { Controller, Get, Module, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

class CropDto {
  id!: string;
  name!: string;
  emoji!: string;
  cover!: string;
  season!: string;
  difficulty!: number;
  daysToHarvest!: string;
  yieldPerSqm!: string;
  intro!: string;
  tags!: string[];
  recommendPkg!: string[];
}

@Injectable()
export class CropService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(season?: string): Promise<CropDto[]> {
    const rows = await this.prisma.crop.findMany({
      where: {
        status: 'active',
        ...(season ? { season: { contains: season } } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(this.toDto);
  }

  async findOne(id: string): Promise<CropDto> {
    const r = await this.prisma.crop.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`作物 ${id} 不存在`);
    return this.toDto(r);
  }

  private toDto = (r: {
    id: string; name: string; emoji: string; cover: string; season: string;
    difficulty: number; daysToHarvest: string; yieldPerSqm: string; intro: string;
    tags: string; recommendPkg: string;
  }): CropDto => ({
    id: r.id, name: r.name, emoji: r.emoji, cover: r.cover, season: r.season,
    difficulty: r.difficulty, daysToHarvest: r.daysToHarvest, yieldPerSqm: r.yieldPerSqm,
    intro: r.intro,
    tags: this.safeArr(r.tags),
    recommendPkg: this.safeArr(r.recommendPkg),
  });

  private safeArr(s: string | null | undefined): string[] {
    if (!s) return [];
    try { return JSON.parse(s) as string[]; } catch { return []; }
  }
}

@ApiTags('作物百科')
@Controller('crops')
export class CropController {
  constructor(private readonly crop: CropService) {}

  @Get()
  @ApiOperation({ summary: '作物列表(可按 season 过滤)' })
  @ApiQuery({ name: 'season', required: false, example: '春' })
  @ApiResponse({ status: 200, type: [CropDto] })
  list(@Query('season') season?: string) {
    return this.crop.findAll(season);
  }

  @Get(':id')
  @ApiOperation({ summary: '作物详情' })
  @ApiResponse({ status: 200, type: CropDto })
  detail(@Param('id') id: string) {
    return this.crop.findOne(id);
  }
}

@Module({
  controllers: [CropController],
  providers: [CropService],
  exports: [CropService],
})
export class CropModule {}
