import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../common/auth/jwt-payload';
import { LoginDto, LoginResultDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 登录(MVP 短信验证码 mock)
   * - 验证 code: 任意 6 位数字通过(NODE_ENV=production 时强制要求"123456",留待 P5+ 接真短信)
   * - upsert User: 手机号没注册过的话自动创建
   * - 签 access + refresh token
   */
  async login(dto: LoginDto): Promise<LoginResultDto> {
    if (!this.verifyCode(dto.phone, dto.code)) {
      throw new UnauthorizedException('验证码错误');
    }

    // 自动注册:第一次登录的手机号直接创建账号
    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      create: {
        phone: dto.phone,
        nickname: '田园用户',
        avatar: '🧑‍🌾',
        level: 'Lv.1',
        role: 'customer',
      },
      update: {}, // 已存在时不动
    });

    // P8 W2: 软禁用账号不能登录(被 admin disable 过的)。token 已发出的 15min 内仍有效。
    if (!user.active) {
      throw new UnauthorizedException('账号已被禁用,请联系管理员');
    }

    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') || '15m';
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') || '7d';

    const accessToken = await this.jwt.signAsync({ ...payload }, { expiresIn: accessTtl as any });
    const refreshToken = await this.jwt.signAsync(
      { ...payload, type: 'refresh' },
      { expiresIn: refreshTtl as any },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        level: user.level,
        role: user.role,
      },
    };
  }

  /**
   * MVP 短信验证 mock 实现
   *   - 任意 6 位数字 → 通过
   * P5+ 真上线时改成:从 Redis 取 code, 比对, 用过即删
   */
  private verifyCode(_phone: string, code: string): boolean {
    return /^\d{6}$/.test(code);
  }
}
