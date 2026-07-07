import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { OrderDto, OrderListQueryDto } from './dto/order.dto';
import { CreateOrderDto } from './dto/order-create.dto';
import { CreateShopOrderDto } from './dto/shop-order-create.dto';
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

  @Post()
  @ApiOperation({ summary: '创建认养订单(自动锁地块,30 分钟未付款自动释放 — P5+)' })
  @ApiResponse({ status: 201, type: OrderDto })
  @ApiResponse({ status: 409, description: '地块已被认养' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto): Promise<OrderDto> {
    return this.orderService.create(user.sub, dto);
  }

  @Post('shop')
  @ApiOperation({ summary: '创建农产品商城订单(type=产地直送,扣库存 + 冷链运费)' })
  @ApiResponse({ status: 201, type: OrderDto })
  @ApiResponse({ status: 409, description: '库存不足' })
  createShop(@CurrentUser() user: JwtPayload, @Body() dto: CreateShopOrderDto): Promise<OrderDto> {
    return this.orderService.createShop(user.sub, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消订单(待付款 / 待发货可取消)' })
  @ApiResponse({ status: 200, type: OrderDto })
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<OrderDto> {
    return this.orderService.cancel(user.sub, id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: '支付订单(MVP mock,认养类 paid → growing;产地直送 paid → shipped)' })
  @ApiResponse({ status: 200, type: OrderDto })
  @ApiResponse({ status: 400, description: '订单状态不允许支付' })
  pay(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<OrderDto> {
    return this.orderService.pay(user.sub, id);
  }
}
