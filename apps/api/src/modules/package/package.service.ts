import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PackageDto } from './dto/package.dto';
import { PackageCreateDto, PackageInputDto } from './dto/package-input.dto';

/**
 * 套餐业务服务
 * - 数据来源:Prisma SQLite(开发) / MySQL(生产)
 * - JSON 字段(gallery/highlights/crops)在这里 parse 成数组,对调用方透明
 */
@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  /** 列表 - 默认只返 active(C 端用); admin 可传 includeArchived=true 看全部 */
  async findAll(includeArchived = false): Promise<PackageDto[]> {
    const rows = await this.prisma.package.findMany({
      where: includeArchived ? {} : { status: 'active' },
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

  /** 创建(admin) */
  async create(dto: PackageCreateDto): Promise<PackageDto> {
    const exists = await this.prisma.package.findUnique({ where: { id: dto.id } });
    if (exists) throw new ConflictException(`套餐 ${dto.id} 已存在`);
    // Prisma 类型严格,这里手动满足 PackageCreateInput
    const row = await this.prisma.package.create({
      data: {
        id: dto.id,
        name: dto.name,
        area: dto.area,
        price: dto.price,
        tag: dto.tag,
        cover: dto.cover,
        gallery: JSON.stringify(dto.gallery),
        highlights: JSON.stringify(dto.highlights),
        crops: JSON.stringify(dto.crops),
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'active',
      },
    });
    return this.toDto(row);
  }

  /** 更新(admin),id 在 URL 不允许改 */
  async update(id: string, dto: PackageInputDto): Promise<PackageDto> {
    await this.findOne(id); // 触发 404
    const row = await this.prisma.package.update({
      where: { id },
      data: {
        name: dto.name,
        area: dto.area,
        price: dto.price,
        tag: dto.tag,
        cover: dto.cover,
        gallery: JSON.stringify(dto.gallery),
        highlights: JSON.stringify(dto.highlights),
        crops: JSON.stringify(dto.crops),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
    return this.toDto(row);
  }

  /** 改上下架状态(admin),不删除数据,保留历史订单关联 */
  async setStatus(id: string, status: 'active' | 'archived'): Promise<PackageDto> {
    await this.findOne(id);
    const row = await this.prisma.package.update({
      where: { id },
      data: { status },
    });
    return this.toDto(row);
  }

  /** 物理删除(admin),只允许从未被订单关联过的套餐删 */
  async delete(id: string): Promise<{ ok: true }> {
    await this.findOne(id);
    const usedByOrders = await this.prisma.order.count({ where: { packageId: id } });
    if (usedByOrders > 0) {
      throw new ConflictException(
        `套餐已被 ${usedByOrders} 个订单使用,不能物理删除,请改用下架(archived)`,
      );
    }
    await this.prisma.package.delete({ where: { id } });
    return { ok: true };
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
