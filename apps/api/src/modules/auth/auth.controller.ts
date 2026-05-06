import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResultDto } from './dto/login.dto';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '短信验证码登录(MVP mock,任意 6 位数字通过)' })
  @ApiResponse({ status: 200, type: LoginResultDto })
  @ApiResponse({ status: 401, description: '验证码错误' })
  login(@Body() dto: LoginDto): Promise<LoginResultDto> {
    return this.authService.login(dto);
  }
}
