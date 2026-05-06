import { ApiProperty } from '@nestjs/swagger';

/**
 * 套餐返回对象 - 对应 packages/shared 里的 Package 类型
 *
 * 注意: DB 里 gallery/highlights/crops 是 JSON 字符串,
 * service 层会把它们 parse 成数组返回给前端(对客户端透明)
 */
export class PackageDto {
  @ApiProperty({ example: 'pkg-basic' })
  id!: string;

  @ApiProperty({ example: '基础版 · 10㎡' })
  name!: string;

  @ApiProperty({ example: 10, description: '面积(平方米)' })
  area!: number;

  @ApiProperty({ example: 499, description: '年费(元)' })
  price!: number;

  @ApiProperty({ example: '热销' })
  tag!: string;

  @ApiProperty({ example: '/images/pkg-basic.jpg' })
  cover!: string;

  @ApiProperty({ type: [String], example: ['/images/pkg-basic.jpg', '/images/farm-hero.jpg'] })
  gallery!: string[];

  @ApiProperty({ type: [String], example: ['1 种作物', '保底 10 斤'] })
  highlights!: string[];

  @ApiProperty({ type: [String], example: ['红薯', '胡萝卜', '土豆'] })
  crops!: string[];

  @ApiProperty({ example: 'active', enum: ['active', 'archived'] })
  status!: string;
}
