import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserPublicDto, AddressDto } from './dto/user.dto';

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
    return rows.map((a) => ({
      id: a.id,
      name: a.name,
      phone: this.maskPhone(a.phone),
      province: a.province,
      city: a.city,
      district: a.district,
      detail: a.detail,
      tag: a.tag ?? undefined,
      isDefault: a.isDefault,
    }));
  }

  /** 138********1234 → 138****1234 */
  private maskPhone(phone: string): string {
    if (!/^1[3-9]\d{9}$/.test(phone)) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
}
