import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length, Matches } from 'class-validator';

/**
 * 创建/更新收货地址入参
 * - phone 是真实手机号(没脱敏),后端入库前不做处理
 * - 返回时手机号才脱敏(见 UserService.maskPhone)
 */
export class AddressInputDto {
  @ApiProperty({ example: '严先生' })
  @IsString()
  @Length(1, 20)
  name!: string;

  @ApiProperty({ example: '13800000001' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone!: string;

  @ApiProperty({ example: '北京市' })
  @IsString()
  @Length(1, 30)
  province!: string;

  @ApiProperty({ example: '北京市' })
  @IsString()
  @Length(1, 30)
  city!: string;

  @ApiProperty({ example: '海淀区' })
  @IsString()
  @Length(1, 30)
  district!: string;

  @ApiProperty({ example: '中关村软件园 3 号楼 12A' })
  @IsString()
  @Length(1, 100)
  detail!: string;

  @ApiProperty({ required: false, example: '公司' })
  @IsOptional()
  @IsString()
  @Length(0, 10)
  tag?: string;

  @ApiProperty({ required: false, example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
