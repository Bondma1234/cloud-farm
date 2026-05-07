import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPublicDto, AddressDto } from './dto/user.dto';
import { AddressInputDto } from './dto/address-input.dto';

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

  /** 138********1234 → 138****1234 */
  private maskPhone(phone: string): string {
    if (!/^1[3-9]\d{9}$/.test(phone)) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
}

// 让 ForbiddenException 不被 unused 警告(暂保留以备 P3 RBAC)
void ForbiddenException;
