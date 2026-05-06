import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PackageDto } from './dto/package.dto';

/**
 * 套餐业务服务
 * - 数据来源:Prisma SQLite(开发) / MySQL(生产)
 * - JSON 字段(gallery/highlights/crops)在这里 parse 成数组,对调用方透明
 */
@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  /** 列表 - 只返 active 状态,按 sortOrder 升序 */
  async findAll(): Promise<PackageDto[]> {
    const rows = await this.prisma.package.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(this.toDto);
  }

  /** 单个 */
  async findOne(id: string): Promise<PackageDto> {
    const row = await this.prisma.package.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`套餐 ${id} 不存在`);
    return this.toDto(row);
  }

  /** DB 行 -> DTO(把 JSON 字符串字段还原为数组) */
  private toDto = (row: {
    id: string;
    name: string;
    area: number;
    price: number;
    tag: string;
    cover: string;
    gallery: string;
    highlights: string;
    crops: string;
    status: string;
  }): PackageDto => ({
    id: row.id,
    name: row.name,
    area: row.area,
    price: row.price,
    tag: row.tag,
    cover: row.cover,
    gallery: this.safeParse<string[]>(row.gallery, []),
    highlights: this.safeParse<string[]>(row.highlights, []),
    crops: this.safeParse<string[]>(row.crops, []),
    status: row.status,
  });

  private safeParse<T>(s: string | null | undefined, fallback: T): T {
    if (!s) return fallback;
    try {
      return JSON.parse(s) as T;
    } catch {
      return fallback;
    }
  }
}
