import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class ShopOrderItemDto {
  @ApiProperty({ example: 'sku-sweetpotah-3' })
  @IsString()
  skuId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  qty!: number;
}

/** 创建农产品商城订单(type=产地直送) */
export class CreateShopOrderDto {
  @ApiProperty({ type: [ShopOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ShopOrderItemDto)
  items!: ShopOrderItemDto[];

  @ApiProperty({ example: 'addr-demo-1' })
  @IsString()
  addressId!: string;

  @ApiProperty({ required: false, description: '使用的优惠券(UserCoupon.id)' })
  @IsOptional()
  @IsString()
  couponId?: string;
}
