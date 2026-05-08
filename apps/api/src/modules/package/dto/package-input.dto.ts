import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

/**
 * 创建/更新套餐入参 - admin 用
 *
 * id 仅 POST 时校验(必填),PATCH 时不允许改 id(用 URL 参数)
 */
export class PackageInputDto {
  @ApiProperty({ example: '基础版 · 10㎡' })
  @IsString()
  @Length(2, 50)
  name!: string;

  @ApiProperty({ example: 10, description: '面积(平方米)' })
  @IsInt()
  @Min(1)
  area!: number;

  @ApiProperty({ example: 499, description: '年费(元)' })
  @IsInt()
  @Min(0)
  price!: number;

  @ApiProperty({ example: '热销', enum: ['热销', '推荐', '亲子', '企业', '新品', '限定'] })
  @IsString()
  tag!: string;

  @ApiProperty({ example: '/images/pkg-basic.jpg' })
  @IsString()
  cover!: string;

  @ApiProperty({ type: [String], example: ['/images/pkg-basic.jpg', '/images/farm-hero.jpg'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  gallery!: string[];

  @ApiProperty({ type: [String], example: ['1 种作物', '保底 10 斤', '包邮 2 次'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  highlights!: string[];

  @ApiProperty({ type: [String], example: ['红薯', '胡萝卜', '土豆'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  crops!: string[];

  @ApiProperty({ required: false, example: 1, description: '排序权重,小的在前' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiProperty({ required: false, example: 'active', enum: ['active', 'archived'] })
  @IsOptional()
  @IsIn(['active', 'archived'])
  status?: 'active' | 'archived';
}

export class PackageCreateDto extends PackageInputDto {
  @ApiProperty({ example: 'pkg-basic', description: '业务可读 id,3-30 位小写英文/数字/连字符' })
  @IsString()
  @Length(3, 30)
  id!: string;
}

export class PackageStatusDto {
  @ApiProperty({ example: 'active', enum: ['active', 'archived'] })
  @IsIn(['active', 'archived'])
  status!: 'active' | 'archived';
}
