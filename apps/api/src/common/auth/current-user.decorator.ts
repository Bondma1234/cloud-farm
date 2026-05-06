import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from './jwt-payload';

/**
 * @CurrentUser() 自定义参数装饰器
 *
 * 在 controller 方法签名里写
 *   findMe(@CurrentUser() user: JwtPayload) {...}
 * JwtAuthGuard 通过后,req.user 就是 JwtPayload,这个装饰器把它取出来
 *
 * 用法:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   findMe(@CurrentUser() user: JwtPayload) {
 *     return this.usersService.findById(user.sub);
 *   }
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
