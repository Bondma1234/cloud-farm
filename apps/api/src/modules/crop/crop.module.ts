import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
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
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';

// ============ DTOs ============
class CropDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() emoji!: string;
  @ApiProperty() cover!: string;
  @ApiProperty() season!: string;
  @ApiProperty() difficulty!: number;
  @ApiProperty() daysToHarvest!: string;
  @ApiProperty() yieldPerSqm!: string;
  @ApiProperty() intro!: string;
  @ApiProperty({ type: [String] }) tags!: string[];
  @ApiProperty({ type: [String] }) recommendPkg!: string[];
  @ApiProperty({ example: 'active', enum: ['active', 'archived'] }) status!: string;
  @ApiProperty() sortOrder!: number;
}

class CreateCropDto {
  @ApiProperty({ example: 'crop-grape', description: '可读 id, 3-30 位 a-z0-9-' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  id!: string;

  @ApiProperty({ example: '葡萄' })
  @IsString()
  @MaxLength(40)
  name!: string;

  @ApiProperty({ example: '🍇' })
  @IsString()
  @MaxLength(8)
  emoji!: string;

  @ApiProperty({ example: '/images/crop-grape.jpg' })
  @IsString()
  cover!: string;

  @ApiProperty({ example: '春种秋收' })
  @IsString()
  @MaxLength(30)
  season!: string;

  @ApiProperty({ example: 3, description: '1-5 星' })
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty!: number;

  @ApiProperty({ example: '90-110 天' })
  @IsString()
  @MaxLength(50)
  daysToHarvest!: string;

  @ApiProperty({ example: '5-8 斤' })
  @IsString()
  @MaxLength(50)
  yieldPerSqm!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  intro!: string;

  @ApiProperty({ type: [String], example: ['耐储运', '高观赏'] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiProperty({ type: [String], example: ['基础版', '亲子版'] })
  @IsArray()
  @IsString({ each: true })
  recommendPkg!: string[];

  @ApiProperty({ required: false, default: 99 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class UpdateCropDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  season?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  daysToHarvest?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  yieldPerSqm?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  intro?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendPkg?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class SetCropStatusDto {
  @ApiProperty({ enum: ['active', 'archived'] })
  @IsIn(['active', 'archived'])
  status!: string;
}

// ============ Service ============
@Injectable()
export class CropService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(season?: string, includeArchived = false): Promise<CropDto[]> {
    const rows = await this.prisma.crop.findMany({
      where: {
        ...(includeArchived ? {} : { status: 'active' }),
        ...(season ? { season: { contains: season } } : {}),
      },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  async findOne(id: string): Promise<CropDto> {
    const r = await this.prisma.crop.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`作物 ${id} 不存在`);
    return this.toDto(r);
  }

  async create(dto: CreateCropDto): Promise<CropDto> {
    if (!/^[a-z0-9-]{3,30}$/.test(dto.id)) {
      throw new BadRequestException('id 格式不对 (3-30 位 a-z0-9-)');
    }
    const exists = await this.prisma.crop.findUnique({ where: { id: dto.id } });
    if (exists) throw new ConflictException(`作物 ${dto.id} 已存在`);
    const row = await this.prisma.crop.create({
      data: {
        id: dto.id,
        name: dto.name,
        emoji: dto.emoji,
        cover: dto.cover,
        season: dto.season,
        difficulty: dto.difficulty,
        daysToHarvest: dto.daysToHarvest,
        yieldPerSqm: dto.yieldPerSqm,
        intro: dto.intro,
        tags: JSON.stringify(dto.tags),
        recommendPkg: JSON.stringify(dto.recommendPkg),
        sortOrder: dto.sortOrder ?? 99,
      },
    });
    return this.toDto(row);
  }

  async update(id: string, dto: UpdateCropDto): Promise<CropDto> {
    const exists = await this.prisma.crop.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`作物 ${id} 不存在`);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.emoji !== undefined) data.emoji = dto.emoji;
    if (dto.cover !== undefined) data.cover = dto.cover;
    if (dto.season !== undefined) data.season = dto.season;
    if (dto.difficulty !== undefined) data.difficulty = dto.difficulty;
    if (dto.daysToHarvest !== undefined) data.daysToHarvest = dto.daysToHarvest;
    if (dto.yieldPerSqm !== undefined) data.yieldPerSqm = dto.yieldPerSqm;
    if (dto.intro !== undefined) data.intro = dto.intro;
    if (dto.tags !== undefined) data.tags = JSON.stringify(dto.tags);
    if (dto.recommendPkg !== undefined) data.recommendPkg = JSON.stringify(dto.recommendPkg);
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    const row = await this.prisma.crop.update({ where: { id }, data });
    return this.toDto(row);
  }

  async setStatus(id: string, status: string): Promise<CropDto> {
    const exists = await this.prisma.crop.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`作物 ${id} 不存在`);
    const row = await this.prisma.crop.update({ where: { id }, data: { status } });
    return this.toDto(row);
  }

  async remove(id: string): Promise<{ ok: true }> {
    const exists = await this.prisma.crop.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`作物 ${id} 不存在`);
    // Order.crops 字段是 JSON String,不存外键约束;但我们不允许删除"还在订单 crops 里的作物"
    // 简化:scan 全部订单 crops 字段(seed 量小,生产可加索引)
    const usedBy = await this.prisma.order.findMany({
      where: { crops: { contains: `"${exists.name}"` } },
      select: { id: true },
    });
    if (usedBy.length > 0) {
      throw new ConflictException(`作物 ${exists.name} 已被 ${usedBy.length} 个订单引用,不能删除(可改成"下架")`);
    }
    await this.prisma.crop.delete({ where: { id } });
    return { ok: true };
  }

  private toDto(r: {
    id: string; name: string; emoji: string; cover: string; season: string;
    difficulty: number; daysToHarvest: string; yieldPerSqm: string; intro: string;
    tags: string; recommendPkg: string; status: string; sortOrder: number;
  }): CropDto {
    return {
      id: r.id, name: r.name, emoji: r.emoji, cover: r.cover, season: r.season,
      difficulty: r.difficulty, daysToHarvest: r.daysToHarvest, yieldPerSqm: r.yieldPerSqm,
      intro: r.intro,
      tags: this.safeArr(r.tags),
      recommendPkg: this.safeArr(r.recommendPkg),
      status: r.status, sortOrder: r.sortOrder,
    };
  }

  private safeArr(s: string | null | undefined): string[] {
    if (!s) return [];
    try { return JSON.parse(s) as string[]; } catch { return []; }
  }
}

// ============ Controller(公开列表 + 详情) ============
@ApiTags('作物百科')
@Controller('crops')
export class CropController {
  constructor(private readonly crop: CropService) {}

  @Get()
  @ApiOperation({ summary: '作物列表(可按 season 过滤,默认只看 active)' })
  @ApiQuery({ name: 'season', required: false, example: '春' })
  @ApiQuery({ name: 'includeArchived', required: false, example: false })
  @ApiResponse({ status: 200, type: [CropDto] })
  list(
    @Query('season') season?: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.crop.findAll(season, includeArchived === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: '作物详情' })
  @ApiResponse({ status: 200, type: CropDto })
  detail(@Param('id') id: string) {
    return this.crop.findOne(id);
  }
}

// ============ Controller(Admin · CRUD,RBAC) ============
@ApiTags('Admin · 作物管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator')
@Controller('crops')
export class AdminCropController {
  constructor(private readonly crop: CropService) {}

  @Post()
  @ApiOperation({ summary: '新增作物' })
  @ApiResponse({ status: 201, type: CropDto })
  create(@Body() dto: CreateCropDto) {
    return this.crop.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新作物' })
  @ApiResponse({ status: 200, type: CropDto })
  update(@Param('id') id: string, @Body() dto: UpdateCropDto) {
    return this.crop.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '上下架(active / archived)' })
  setStatus(@Param('id') id: string, @Body() dto: SetCropStatusDto) {
    return this.crop.setStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: '物理删除(被订单引用则 409)' })
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.crop.remove(id);
  }
}

@Module({
  controllers: [CropController, AdminCropController],
  providers: [CropService],
  exports: [CropService],
})
export class CropModule {}
