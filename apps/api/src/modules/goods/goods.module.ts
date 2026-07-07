// ============ 农产品商城 Goods(M-08)============
// C 端商城:商品列表 + 详情,公开只读。一个 Goods 挂多个 Sku(规格)。
import { Controller, Get, Injectable, Module, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

// ============ DTO ============
class SkuDto {
  @ApiProperty() id!: string;
  @ApiProperty() spec!: string;
  @ApiProperty() price!: number;
  @ApiProperty() originalPrice!: number;
  @ApiProperty() stock!: number;
}

class GoodsDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() category!: string;
  @ApiProperty() cover!: string;
  @ApiProperty() intro!: string;
  @ApiProperty() origin!: string;
  @ApiProperty({ type: [String] }) tags!: string[];
  @ApiProperty() coldChain!: boolean;
  @ApiProperty() sales!: number;
  @ApiProperty({ description: '评分,如 4.8' }) rating!: number;
  @ApiProperty({ description: '最低价(元),列表页展示用' }) minPrice!: number;
  @ApiProperty({ type: [SkuDto] }) skus!: SkuDto[];
}

type GoodsRow = {
  id: string; name: string; category: string; cover: string; intro: string;
  origin: string; tags: string; coldChain: boolean; sales: number; rating: number;
  skus: { id: string; spec: string; price: number; originalPrice: number; stock: number }[];
};

// ============ Service ============
@Injectable()
export class GoodsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string): Promise<GoodsDto[]> {
    const rows = await this.prisma.goods.findMany({
      where: { status: 'active', ...(category ? { category } : {}) },
      orderBy: { sortOrder: 'asc' },
      include: { skus: { orderBy: { sortOrder: 'asc' } } },
    });
    return rows.map((r) => this.toDto(r));
  }

  async findOne(id: string): Promise<GoodsDto> {
    const r = await this.prisma.goods.findUnique({
      where: { id },
      include: { skus: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!r || r.status !== 'active') throw new NotFoundException(`商品 ${id} 不存在或已下架`);
    return this.toDto(r);
  }

  private toDto(r: GoodsRow): GoodsDto {
    const prices = r.skus.map((s) => s.price);
    return {
      id: r.id, name: r.name, category: r.category, cover: r.cover, intro: r.intro,
      origin: r.origin, tags: this.safeArr(r.tags), coldChain: r.coldChain,
      sales: r.sales, rating: r.rating / 10,
      minPrice: prices.length ? Math.min(...prices) : 0,
      skus: r.skus.map((s) => ({
        id: s.id, spec: s.spec, price: s.price, originalPrice: s.originalPrice, stock: s.stock,
      })),
    };
  }

  private safeArr(s: string | null | undefined): string[] {
    if (!s) return [];
    try { return JSON.parse(s) as string[]; } catch { return []; }
  }
}

// ============ Controller(公开) ============
@ApiTags('农产品商城')
@Controller('goods')
export class GoodsController {
  constructor(private readonly goods: GoodsService) {}

  @Get()
  @ApiOperation({ summary: '商品列表(可按 category 过滤)' })
  @ApiQuery({ name: 'category', required: false, example: 'fresh' })
  @ApiResponse({ status: 200, type: [GoodsDto] })
  list(@Query('category') category?: string) {
    return this.goods.findAll(category);
  }

  @Get(':id')
  @ApiOperation({ summary: '商品详情(含 SKU)' })
  @ApiResponse({ status: 200, type: GoodsDto })
  detail(@Param('id') id: string) {
    return this.goods.findOne(id);
  }
}

@Module({
  controllers: [GoodsController],
  providers: [GoodsService],
  exports: [GoodsService],
})
export class GoodsModule {}
