import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserPublicDto, AddressDto } from './dto/user.dto';
import { AddressInputDto } from './dto/address-input.dto';
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

  @Post('me/addresses')
  @ApiOperation({ summary: '新增收货地址' })
  @ApiResponse({ status: 201, type: AddressDto })
  createAddress(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AddressInputDto,
  ): Promise<AddressDto> {
    return this.userService.createAddress(user.sub, dto);
  }

  @Patch('me/addresses/:id')
  @ApiOperation({ summary: '更新收货地址' })
  @ApiResponse({ status: 200, type: AddressDto })
  @ApiResponse({ status: 404, description: '地址不存在或不属于当前用户' })
  updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddressInputDto,
  ): Promise<AddressDto> {
    return this.userService.updateAddress(user.sub, id, dto);
  }

  @Delete('me/addresses/:id')
  @ApiOperation({ summary: '删除收货地址' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: '地址不存在或不属于当前用户' })
  deleteAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    return this.userService.deleteAddress(user.sub, id);
  }
}
