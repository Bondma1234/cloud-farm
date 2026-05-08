import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import type { JwtPayload } from './jwt-payload';

/**
 * 角色守卫
 *
 * 必须配合 JwtAuthGuard 使用 — JwtAuthGuard 把 req.user 填上,
 * 然后这个 guard 看 user.role 是不是在 @Roles(...) 列表里。
 *
 * 用法:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('admin', 'operator')
 *   @Post()
 *   ...
 *
 * 没标 @Roles 的接口,这个 guard 直接放行(等于无角色限制)。
 * 角色不匹配 → 403 Forbidden(不是 401 Unauthorized,因为已登录但权限不够)。
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = req.user;
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException(`需要角色: ${required.join(' / ')}`);
    }
    return true;
  }
}
