import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserPublicDto, AddressDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';

@ApiTags('用户')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前登录用户' })
  @ApiResponse({ status: 200, type: UserPublicDto })
  @ApiResponse({ status: 401, description: '未登录' })
  me(@CurrentUser() user: JwtPayload): Promise<UserPublicDto> {
    return this.userService.findById(user.sub);
  }

  @Get('me/addresses')
  @ApiOperation({ summary: '当前用户收货地址列表' })
  @ApiResponse({ status: 200, type: [AddressDto] })
  myAddresses(@CurrentUser() user: JwtPayload): Promise<AddressDto[]> {
    return this.userService.listAddresses(user.sub);
  }
}
