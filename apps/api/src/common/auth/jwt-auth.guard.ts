import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - 标准 NestJS JWT 守卫,passport-jwt 实现
 *
 * 用法:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   getMe(...) {...}
 *
 * 没带 token / token 无效 / 过期 → 401 Unauthorized
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
