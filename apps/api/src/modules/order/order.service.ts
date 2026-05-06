import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderDto } from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  /** 当前用户的订单列表(可按 status 过滤) */
  async findAllByUser(userId: number, status?: string): Promise<OrderDto[]> {
    const rows = await this.prisma.order.findMany({
      where: {
        userId,
        ...(status ? { status } : {}),
      },
      orderBy: { date: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  /** 单个订单详情(限制: 必须属于当前用户) */
  async findOneByUser(userId: number, id: string): Promise<OrderDto> {
    const r = await this.prisma.order.findFirst({ where: { id, userId } });
    if (!r) throw new NotFoundException(`订单 ${id} 不存在`);
    return this.toDto(r);
  }

  private toDto = (r: {
    id: string;
    type: string;
    typeIcon: string;
    title: string;
    cover: string;
    price: number;
    count: number;
    status: string;
    statusLabel: string;
    date: Date;
    packageId: string | null;
    addressId: string | null;
    metadata: string | null;
  }): OrderDto => ({
    id: r.id,
    type: r.type,
    typeIcon: r.typeIcon,
    title: r.title,
    cover: r.cover,
    price: r.price,
    count: r.count,
    status: r.status,
    statusLabel: r.statusLabel,
    date: r.date.toISOString().slice(0, 10),
    packageId: r.packageId ?? undefined,
    addressId: r.addressId ?? undefined,
    meta: r.metadata ? this.safeParse(r.metadata) : undefined,
  });

  private safeParse(s: string): Record<string, unknown> | undefined {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  }
}
