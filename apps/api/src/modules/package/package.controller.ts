import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PackageService } from './package.service';
import { PackageDto } from './dto/package.dto';

@ApiTags('套餐')
@Controller('packages')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Get()
  @ApiOperation({ summary: '获取所有上架套餐(active)' })
  @ApiResponse({ status: 200, type: [PackageDto] })
  findAll(): Promise<PackageDto[]> {
    return this.packageService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个套餐详情' })
  @ApiParam({ name: 'id', example: 'pkg-basic' })
  @ApiResponse({ status: 200, type: PackageDto })
  @ApiResponse({ status: 404, description: '套餐不存在' })
  findOne(@Param('id') id: string): Promise<PackageDto> {
    return this.packageService.findOne(id);
  }
}
