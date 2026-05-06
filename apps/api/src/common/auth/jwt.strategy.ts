import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './jwt-payload';

/**
 * Passport JWT 策略
 *
 * passport 调 super() 解开 token, 验签通过后调 validate(payload)
 * 我们在这里只校验 payload 形态; payload 本身就放进 req.user
 *
 * 后续 P3+ 可以扩展:
 *   - 检查 payload.sub 还是不是有效用户(查 DB,贵)
 *   - 检查 token 是否在 Redis 黑名单(注销)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-only-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload;
  }
}
