import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { OrderDto, OrderListQueryDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';

@ApiTags('订单')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: '当前用户的订单列表(可按 status 过滤)' })
  @ApiQuery({ name: 'status', required: false, example: 'growing' })
  @ApiResponse({ status: 200, type: [OrderDto] })
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: OrderListQueryDto,
  ): Promise<OrderDto[]> {
    return this.orderService.findAllByUser(user.sub, query.status);
  }

  @Get(':id')
  @ApiOperation({ summary: '订单详情(必须属于当前用户)' })
  @ApiResponse({ status: 200, type: OrderDto })
  @ApiResponse({ status: 404, description: '订单不存在或不属于当前用户' })
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<OrderDto> {
    return this.orderService.findOneByUser(user.sub, id);
  }
}
