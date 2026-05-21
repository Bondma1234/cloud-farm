// ============ Admin · 指令工单管理 ============
// 农技员接单 + 完成,操作员/admin 可看可改
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt-payload';
import { PrismaService } from '../../prisma/prisma.service';
import { CommandService, CommandDto } from '../command/command.module';

class AdminCommandQueryDto {
  @ApiProperty({ required: false, enum: ['pending', 'executing', 'completed', 'rejected'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, example: 'P-A-07' })
  @IsOptional()
  @IsString()
  plotId?: string;

  @ApiProperty({ required: false, enum: ['water', 'fertilize', 'weed', 'shoot', 'pest', 'plant'] })
  @IsOptional()
  @IsString()
  type?: string;
}

class CompleteCommandDto {
  @ApiProperty({ example: '/uploads/2026-05-21/farm-cap-1.jpg', description: '完成回执照片 URL' })
  @IsString()
  photo!: string;

  @ApiProperty({ required: false, example: '已浇水 2L,土壤湿度回升' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

@ApiTags('Admin · 指令工单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator', 'agronomist')
@Controller('admin/commands')
export class AdminCommandController {
  constructor(
    private readonly cmd: CommandService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: '所有指令工单(agronomist/operator/admin 可见)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'plotId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiResponse({ status: 200, type: [CommandDto] })
  list(@Query() q: AdminCommandQueryDto) {
    return this.cmd.findAllForAdmin(q);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: '接单(pending → executing,记录农技员名字)' })
  @ApiResponse({ status: 200, type: CommandDto })
  async accept(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    // 取农技员昵称(简化:从数据库查 nickname)
    const u = await this.prisma.user.findUnique({ where: { id: user.sub } });
    const name = u?.nickname || '农技员';
    return this.cmd.accept(id, name);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '完成工单(executing → completed,带 photo,自动写 JournalEntry)' })
  @ApiResponse({ status: 200, type: CommandDto })
  complete(@Param('id') id: string, @Body() dto: CompleteCommandDto) {
    return this.cmd.complete(id, dto.photo, dto.note);
  }
}
