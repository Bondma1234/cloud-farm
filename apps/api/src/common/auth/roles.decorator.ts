import { SetMetadata } from '@nestjs/common';

/**
 * 角色装饰器 - 标记一个 controller / 路由要求的角色
 *
 * 用法:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles('admin', 'operator')
 *   @Post()
 *   create(...) {...}
 *
 * 角色定义(对应 User.role 字段):
 *   - customer    C 端用户
 *   - agronomist  农技员
 *   - cs          客服
 *   - operator    运营
 *   - admin       超管
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
