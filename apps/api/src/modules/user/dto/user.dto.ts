import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户公开信息 - 不含 openid / unionid 等敏感字段
 * 手机号脱敏成 138****1234
 */
export class UserPublicDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '138****0001', description: '已脱敏' })
  phone!: string;

  @ApiProperty({ example: '田园小掌柜' })
  nickname!: string;

  @ApiProperty({ example: '🧑‍🌾' })
  avatar!: string;

  @ApiProperty({ example: 'Lv.2' })
  level!: string;

  @ApiProperty({ example: 'customer', enum: ['customer', 'agronomist', 'cs', 'operator', 'admin'] })
  role!: string;

  @ApiProperty({ example: '2026-03-15T08:23:45.000Z', description: 'ISO 时间;前端算"种地第 N 天"用' })
  createdAt!: string;
}

export class AddressDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ example: '138****1234' })
  phone!: string;

  @ApiProperty()
  province!: string;

  @ApiProperty()
  city!: string;

  @ApiProperty()
  district!: string;

  @ApiProperty()
  detail!: string;

  @ApiProperty({ example: '家', required: false })
  tag?: string;

  @ApiProperty()
  isDefault!: boolean;
}
