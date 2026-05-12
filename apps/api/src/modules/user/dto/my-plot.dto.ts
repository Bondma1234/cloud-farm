import { ApiProperty } from '@nestjs/swagger';

/**
 * GET /api/users/me/plot 返回值
 *
 * 把"用户的认养订单 + 关联地块 + 摄像头 + 套餐 + 作物"合成一个对象,
 * 让 miniapp my-plot 页一个请求拿全。
 */
export class MyPlotDto {
  @ApiProperty({ example: 'P-A-07' })
  plotId!: string;

  @ApiProperty({ example: 'ORD-2026-0418' })
  orderId!: string;

  @ApiProperty({ example: '小祎的菜园', required: false })
  name?: string; // 立牌名

  @ApiProperty({ example: '小番茄' })
  crop!: string; // 第一种作物(简化展示)

  @ApiProperty({ example: '🍅' })
  cropEmoji!: string;

  @ApiProperty({ example: '2026-03-01' })
  plantedAt!: string;

  @ApiProperty({ example: 49 })
  daysElapsed!: number;

  @ApiProperty({ example: 95 })
  daysTotal!: number;

  @ApiProperty({ example: '开花期' })
  stage!: string;

  @ApiProperty({ example: 52 })
  progress!: number;

  @ApiProperty({ example: '5月5日 · 第二次追肥' })
  nextAction!: string;

  @ApiProperty({ example: { temp: 22, cond: '多云' } })
  weather!: { temp: number; cond: string };

  @ApiProperty({ example: { id: 'cam-p-a-07', online: true, ptzSupported: true, vendor: 'mock' } })
  camera!: { id: string; online: boolean; ptzSupported: boolean; vendor: string };
}
