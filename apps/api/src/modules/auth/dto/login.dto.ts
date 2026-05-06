import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

/**
 * 短信验证码登录入参
 *
 * MVP 阶段:不真发短信,任意 6 位数字都接受(默认 "123456" 给 demo 用)
 * P5+ 接阿里云短信后:数据库存验证码 + 5 分钟过期 + 同号 1 分钟 1 条
 */
export class LoginDto {
  @ApiProperty({ example: '13800000001', description: '中国大陆手机号' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone!: string;

  @ApiProperty({ example: '123456', description: '6 位验证码 (MVP 任意 6 位通过)' })
  @IsString()
  @Length(6, 6, { message: '验证码必须是 6 位' })
  code!: string;
}

/**
 * 登录返回值
 */
export class LoginResultDto {
  @ApiProperty({ description: 'access token (15min)' })
  accessToken!: string;

  @ApiProperty({ description: 'refresh token (7d)' })
  refreshToken!: string;

  @ApiProperty()
  user!: {
    id: number;
    phone: string;
    nickname: string;
    avatar: string;
    level: string;
    role: string;
  };
}
