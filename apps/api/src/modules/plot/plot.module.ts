import { Controller, Get, Module, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

class PlotDto {
  id!: string;        // 'P-A-07'
  block!: string;     // 'A 区'
  row!: number;
  col!: number;
  status!: string;    // available / sold / maintenance / reserved
  sunHours!: number;
  soilScore!: number;
  cameraId?: string | null;
}

@Injectable()
export class PlotService {
  constructor(private readonly prisma: PrismaService) {}

  /** 全部地块(给地图视图) */
  async findAll(block?: string, status?: string): Promise<PlotDto[]> {
    const rows = await this.prisma.plot.findMany({
      where: {
        ...(block ? { block } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: [{ block: 'asc' }, { row: 'asc' }, { col: 'asc' }],
    });
    return rows.map(this.toDto);
  }

  /** 可认养(GET /api/plots/available) */
  async findAvailable(block?: string): Promise<PlotDto[]> {
    return this.findAll(block, 'available');
  }

  async findOne(id: string): Promise<PlotDto> {
    const r = await this.prisma.plot.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`地块 ${id} 不存在`);
    return this.toDto(r);
  }

  private toDto = (r: {
    id: string; block: string; row: number; col: number; status: string;
    sunHours: number; soilScore: number; cameraId: string | null;
  }): PlotDto => ({
    id: r.id, block: r.block, row: r.row, col: r.col, status: r.status,
    sunHours: r.sunHours, soilScore: r.soilScore, cameraId: r.cameraId,
  });
}

@ApiTags('地块')
@Controller('plots')
export class PlotController {
  constructor(private readonly plot: PlotService) {}

  @Get()
  @ApiOperation({ summary: '所有地块(可按 block / status 过滤)' })
  @ApiQuery({ name: 'block', required: false, example: 'A 区' })
  @ApiQuery({ name: 'status', required: false, example: 'available' })
  list(@Query('block') block?: string, @Query('status') status?: string) {
    return this.plot.findAll(block, status);
  }

  @Get('available')
  @ApiOperation({ summary: '可认养的地块(status=available)' })
  available(@Query('block') block?: string) {
    return this.plot.findAvailable(block);
  }

  @Get(':id')
  @ApiOperation({ summary: '地块详情' })
  detail(@Param('id') id: string) {
    return this.plot.findOne(id);
  }
}

@Module({
  controllers: [PlotController],
  providers: [PlotService],
  exports: [PlotService],
})
export class PlotModule {}
