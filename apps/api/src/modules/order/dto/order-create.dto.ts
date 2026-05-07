import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString, Length } from 'class-validator';

/**
 * 创建认养订单入参
 *
 * MVP 流程:
 *   1. 用户选 packageId(套餐)
 *   2. 选 plotId(地块,必须当前 status=available)
 *   3. 选 crops(作物,数组,基础版 1 种,进阶/亲子 ≤2 种)
 *   4. 选 addressId(收货地址)
 *   5. 可选 stake(立牌名,亲子版用)
 *
 * 后端动作:
 *   - 校验 plot 真的可认养(原子事务,防并发)
 *   - 把 plot.status 改成 'sold'
 *   - 创建 order(状态 'pending',24h 内未付款自动释放 — P5+)
 *   - 返回 order
 *
 * 价格 / 支付 P5+ 接微信支付时再扩展, 现在 price 直接抄 package.price
 */
export class CreateOrderDto {
  @ApiProperty({ example: 'pkg-pro' })
  @IsString()
  packageId!: string;

  @ApiProperty({ example: 'P-A-07' })
  @IsString()
  plotId!: string;

  @ApiProperty({ type: [String], example: ['小番茄', '草莓'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  crops!: string[];

  @ApiProperty({ example: 'addr-demo-1' })
  @IsString()
  addressId!: string;

  @ApiProperty({ required: false, example: '小祎的菜园' })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  stake?: string;
}
