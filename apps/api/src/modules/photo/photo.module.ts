import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException,
  Param, Patch, Query, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';

// ============ DTOs ============
class PhotoPostDto {
  @ApiProperty() id!: string;
  @ApiProperty() user!: { nickname: string; avatar: string };
  @ApiProperty() photo!: string;
  @ApiProperty() caption!: string;
  @ApiProperty({ required: false, nullable: true }) plotId?: string | null;
  @ApiProperty({ required: false, nullable: true }) crop?: string | null;
  @ApiProperty() likes!: number;
  @ApiProperty() comments!: number;
  @ApiProperty() at!: string;
}

class AdminPhotoPostDto extends PhotoPostDto {
  @ApiProperty({ example: 'active', enum: ['active', 'removed'] }) status!: string;
  @ApiProperty({ example: '2026-05-25T08:23:45.000Z', description: '原始 ISO 时间(C 端列表是相对时间)' })
  atIso!: string;
}

class AdminPhotoListQueryDto {
  @ApiProperty({ required: false, enum: ['active', 'removed'] })
  @IsOptional()
  @IsString()
  status?: string;
}

class SetPhotoStatusDto {
  @ApiProperty({ enum: ['active', 'removed'] })
  @IsIn(['active', 'removed'])
  status!: string;
}

// ============ Service ============
@Injectable()
export class PhotoService {
  constructor(private readonly prisma: PrismaService) {}

  /** 公开列表 - 只看 active */
  async findAll(): Promise<PhotoPostDto[]> {
    const rows = await this.prisma.photoPost.findMany({
      where: { status: 'active' },
      orderBy: { at: 'desc' },
    });
    return rows.map((r) => this.toDto(r));
  }

  /** Admin 列表 - 全状态可见 + 原始时间字段 */
  async findAllForAdmin(filter: AdminPhotoListQueryDto): Promise<AdminPhotoPostDto[]> {
    const rows = await this.prisma.photoPost.findMany({
      where: filter.status ? { status: filter.status } : {},
      orderBy: { at: 'desc' },
      take: 200,
    });
    return rows.map((r) => ({
      ...this.toDto(r),
      status: r.status,
      atIso: r.at.toISOString(),
    }));
  }

  async setStatus(id: string, status: string): Promise<AdminPhotoPostDto> {
    const exists = await this.prisma.photoPost.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`照片 ${id} 不存在`);
    const updated = await this.prisma.photoPost.update({ where: { id }, data: { status } });
    return {
      ...this.toDto(updated),
      status: updated.status,
      atIso: updated.at.toISOString(),
    };
  }

  async remove(id: string): Promise<{ ok: true }> {
    const exists = await this.prisma.photoPost.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException(`照片 ${id} 不存在`);
    await this.prisma.photoPost.delete({ where: { id } });
    return { ok: true };
  }

  private toDto(r: {
    id: string; userName: string; userIcon: string; photo: string; caption: string;
    plotId: string | null; crop: string | null; likes: number; comments: number; at: Date;
  }): PhotoPostDto {
    return {
      id: r.id,
      user: { nickname: r.userName, avatar: r.userIcon },
      photo: r.photo,
      caption: r.caption,
      plotId: r.plotId,
      crop: r.crop,
      likes: r.likes,
      comments: r.comments,
      at: this.timeAgo(r.at),
    };
  }

  /** 转成"刚刚 / x 分钟前 / x 小时前 / x 天前 / yyyy-mm-dd"形式 */
  private timeAgo(t: Date): string {
    const diffMs = Date.now() - t.getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return '刚刚';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} 分钟前`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} 小时前`;
    const d = Math.floor(h / 24);
    if (d === 1) return '昨天';
    if (d === 2) return '前天';
    if (d < 7) return `${d} 天前`;
    if (d < 30) return `${Math.floor(d / 7)} 周前`;
    return t.toISOString().slice(0, 10);
  }
}

// ============ Controller(公开) ============
@ApiTags('照片墙')
@Controller('photos')
export class PhotoController {
  constructor(private readonly photo: PhotoService) {}

  @Get()
  @ApiOperation({ summary: '照片墙列表(active,按时间倒序)' })
  @ApiResponse({ status: 200, type: [PhotoPostDto] })
  list() {
    return this.photo.findAll();
  }
}

// ============ Controller(Admin · 审核) ============
@ApiTags('Admin · 照片审核')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'operator', 'cs')
@Controller('admin/photos')
export class AdminPhotoController {
  constructor(private readonly photo: PhotoService) {}

  @Get()
  @ApiOperation({ summary: '所有照片(含 removed),admin/operator/cs 可见' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'removed'] })
  @ApiResponse({ status: 200, type: [AdminPhotoPostDto] })
  list(@Query() q: AdminPhotoListQueryDto) {
    return this.photo.findAllForAdmin(q);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '改状态(active=上架 / removed=下架)' })
  setStatus(@Param('id') id: string, @Body() dto: SetPhotoStatusDto) {
    return this.photo.setStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: '物理删除(只 admin / operator)' })
  @Roles('admin', 'operator')
  remove(@Param('id') id: string) {
    return this.photo.remove(id);
  }
}

@Module({
  controllers: [PhotoController, AdminPhotoController],
  providers: [PhotoService],
  exports: [PhotoService],
})
export class PhotoModule {}
