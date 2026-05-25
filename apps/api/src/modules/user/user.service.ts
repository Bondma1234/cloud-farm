import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPublicDto, AddressDto } from './dto/user.dto';
import { AddressInputDto } from './dto/address-input.dto';
import { MyPlotDto } from './dto/my-plot.dto';

const CROP_EMOJI: Record<string, string> = {
  红薯: '🍠', 胡萝卜: '🥕', 土豆: '🥔', 南瓜: '🎃',
  草莓: '🍓', 小番茄: '🍅', 香椿: '🌿', 大蒜: '🧄',
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<UserPublicDto> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    if (!u) throw new NotFoundException(`用户 ${id} 不存在`);
    return {
      id: u.id,
      phone: this.maskPhone(u.phone),
      nickname: u.nickname,
      avatar: u.avatar,
      level: u.level,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    };
  }

  async listAddresses(userId: number): Promise<AddressDto[]> {
    const rows = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((a) => this.toAddrDto(a));
  }

  /** 创建地址(若 isDefault=true,先把现有默认地址置 false) */
  async createAddress(userId: number, dto: AddressInputDto): Promise<AddressDto> {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      } else {
        // 第一条默认设为默认地址
        const count = await tx.address.count({ where: { userId } });
        if (count === 0) dto.isDefault = true;
      }
      const a = await tx.address.create({
        data: { ...dto, userId, isDefault: dto.isDefault ?? false },
      });
      return this.toAddrDto(a);
    });
  }

  /** 更新地址(必须属于当前用户,否则 404) */
  async updateAddress(userId: number, id: string, dto: AddressInputDto): Promise<AddressDto> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundException(`地址 ${id} 不存在`);
      if (dto.isDefault) {
        await tx.address.updateMany({
          where: { userId, NOT: { id } },
          data: { isDefault: false },
        });
      }
      const a = await tx.address.update({
        where: { id },
        data: { ...dto, isDefault: dto.isDefault ?? existing.isDefault },
      });
      return this.toAddrDto(a);
    });
  }

  /** 删除地址(若被删除的是默认,自动把最早创建的另一条置默认) */
  async deleteAddress(userId: number, id: string): Promise<{ ok: true }> {
    const existing = await this.prisma.address.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException(`地址 ${id} 不存在`);

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
        });
        if (next) {
          await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
      }
    });

    return { ok: true };
  }

  private toAddrDto(a: {
    id: string; name: string; phone: string; province: string; city: string;
    district: string; detail: string; tag: string | null; isDefault: boolean;
  }): AddressDto {
    return {
      id: a.id,
      name: a.name,
      phone: this.maskPhone(a.phone),
      province: a.province,
      city: a.city,
      district: a.district,
      detail: a.detail,
      tag: a.tag ?? undefined,
      isDefault: a.isDefault,
    };
  }

  /**
   * 当前用户主要的种植中地块(my-plot 页用)
   *
   * 找 type=认养 且 status=growing/paid/shipped 的订单中最新的一条,
   * 合成"地块 + 摄像头 + 作物 + 进度"对象。
   *
   * MVP 简化: 不算真实生长进度(P5 真接传感器后从 plot 表算),
   * 这里用订单 date 距今天数 / 95(假设 95 天生长周期)粗略估。
   */
  async getMyPlot(userId: number): Promise<MyPlotDto> {
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        type: '认养',
        plotId: { not: null },
        status: { in: ['growing', 'paid', 'shipped'] },
      },
      include: {
        package: true,
      },
      orderBy: { date: 'desc' },
    });
    if (!order || !order.plotId) {
      throw new NotFoundException('你还没有种植中的地块,先去认养一个吧');
    }

    const plot = await this.prisma.plot.findUnique({
      where: { id: order.plotId },
      include: { camera: true },
    });
    if (!plot) throw new NotFoundException(`地块 ${order.plotId} 已不存在`);

    // 解 crops
    const crops: string[] = order.crops ? JSON.parse(order.crops) : [];
    const crop = crops[0] || '小番茄';
    const cropEmoji = CROP_EMOJI[crop] || '🌱';

    // 进度估算
    const daysTotal = 95;
    const msPerDay = 86_400_000;
    const daysElapsed = Math.min(
      daysTotal,
      Math.max(1, Math.floor((Date.now() - order.date.getTime()) / msPerDay)),
    );
    const progress = Math.floor((daysElapsed / daysTotal) * 100);

    // 简化的生长阶段判断
    const stage =
      daysElapsed < 14 ? '幼苗期'
        : daysElapsed < 35 ? '生长期'
        : daysElapsed < 60 ? '开花期'
        : daysElapsed < 80 ? '坐果期'
        : '收获期';

    const nextAction =
      stage === '幼苗期' ? '本周内 · 完成幼苗培育'
        : stage === '生长期' ? '近期 · 第一次追肥'
        : stage === '开花期' ? '近期 · 关注授粉'
        : stage === '坐果期' ? '近期 · 准备采摘'
        : '近期 · 收获寄出';

    return {
      plotId: plot.id,
      orderId: order.id,
      name: order.stake ?? undefined,
      crop,
      cropEmoji,
      plantedAt: order.date.toISOString().slice(0, 10),
      daysElapsed,
      daysTotal,
      stage,
      progress,
      nextAction,
      // mock 天气, P5+ 接真天气 API
      weather: { temp: 22, cond: '多云' },
      camera: plot.camera
        ? {
            id: plot.camera.id,
            online: plot.camera.status === 'online',
            ptzSupported: plot.camera.ptzSupported,
            vendor: plot.camera.vendor,
          }
        : { id: '', online: false, ptzSupported: false, vendor: '' },
    };
  }

  /** 138********1234 → 138****1234 */
  private maskPhone(phone: string): string {
    if (!/^1[3-9]\d{9}$/.test(phone)) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
}

// 让 ForbiddenException 不被 unused 警告(暂保留以备 P3 RBAC)
void ForbiddenException;
