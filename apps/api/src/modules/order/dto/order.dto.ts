import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class OrderListQueryDto {
  @ApiProperty({
    required: false,
    description: '过滤状态: pending/paid/shipped/delivering/completed/growing/cancelled',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class OrderTimelineNodeDto {
  @ApiProperty() at!: string;
  @ApiProperty() event!: string;
  @ApiProperty() done!: boolean;
}

export class OrderLogisticsNodeDto {
  @ApiProperty() at!: string;
  @ApiProperty() node!: string;
}

export class OrderLogisticsDto {
  @ApiProperty() company!: string;
  @ApiProperty() no!: string;
  @ApiProperty({ type: [OrderLogisticsNodeDto] }) nodes!: OrderLogisticsNodeDto[];
}

export class OrderSubItemDto {
  @ApiProperty() label!: string;
  @ApiProperty() value!: string;
}

export class OrderDto {
  @ApiProperty({ example: 'ORD-2026-0418' })
  id!: string;

  @ApiProperty({ example: '认养' })
  type!: string;

  @ApiProperty({ example: '🌱' })
  typeIcon!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  cover!: string;

  @ApiProperty({ example: 799 })
  price!: number;

  @ApiProperty({ example: 1 })
  count!: number;

  @ApiProperty({ example: 'growing' })
  status!: string;

  @ApiProperty({ example: '种植中' })
  statusLabel!: string;

  @ApiProperty({ example: '2026-03-01' })
  date!: string;

  @ApiProperty({ required: false })
  packageId?: string;

  @ApiProperty({ required: false })
  addressId?: string;

  // ---- 以下字段从 metadata JSON 解出来,平铺到顶层方便前端用 ----
  @ApiProperty({ type: [OrderSubItemDto], required: false })
  subItems?: OrderSubItemDto[];

  @ApiProperty({ type: [OrderTimelineNodeDto], required: false })
  timeline?: OrderTimelineNodeDto[];

  @ApiProperty({ type: OrderLogisticsDto, required: false })
  logistics?: OrderLogisticsDto;

  @ApiProperty({ required: false, description: '待付款倒计时' })
  expireIn?: string;

  @ApiProperty({ required: false, description: '已完成订单是否可评价' })
  canReview?: boolean;
}
