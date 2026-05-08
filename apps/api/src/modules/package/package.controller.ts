import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PackageService } from './package.service';
import { PackageDto } from './dto/package.dto';
import { PackageCreateDto, PackageInputDto, PackageStatusDto } from './dto/package-input.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';

@ApiTags('套餐')
@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  // ======== 公开读 ========

  @Get()
  @ApiOperation({ summary: '套餐列表(默认只返 active)' })
  @ApiQuery({ name: 'includeArchived', required: false, example: false, description: 'admin 看下架套餐用' })
  @ApiResponse({ status: 200, type: [PackageDto] })
  findAll(@Query('includeArchived') includeArchived?: string): Promise<PackageDto[]> {
    return this.packageService.findAll(includeArchived === 'true' || includeArchived === '1');
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个套餐详情' })
  @ApiParam({ name: 'id', example: 'pkg-basic' })
  @ApiResponse({ status: 200, type: PackageDto })
  @ApiResponse({ status: 404, description: '套餐不存在' })
  findOne(@Param('id') id: string): Promise<PackageDto> {
    return this.packageService.findOne(id);
  }

  // ======== admin 写 ========
  // 必须 JWT + role ∈ {admin, operator}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '新增套餐(admin)' })
  @ApiResponse({ status: 201, type: PackageDto })
  @ApiResponse({ status: 409, description: 'id 已存在' })
  create(@Body() dto: PackageCreateDto): Promise<PackageDto> {
    return this.packageService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '更新套餐(admin)' })
  @ApiResponse({ status: 200, type: PackageDto })
  update(@Param('id') id: string, @Body() dto: PackageInputDto): Promise<PackageDto> {
    return this.packageService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'operator')
  @ApiOperation({ summary: '上架/下架套餐(admin)' })
  @ApiResponse({ status: 200, type: PackageDto })
  setStatus(@Param('id') id: string, @Body() dto: PackageStatusDto): Promise<PackageDto> {
    return this.packageService.setStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '物理删除套餐(仅 admin,且未被订单使用)' })
  @ApiResponse({ status: 409, description: '已被订单使用,需用下架' })
  delete(@Param('id') id: string): Promise<{ ok: true }> {
    return this.packageService.delete(id);
  }
}
