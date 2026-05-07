import { Controller, Get, Module } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

class PhotoPostDto {
  id!: string;
  user!: { nickname: string; avatar: string };
  photo!: string;
  caption!: string;
  plotId?: string | null;
  crop?: string | null;
  likes!: number;
  comments!: number;
  at!: string; // 相对时间字符串(已格式化好)
}

@Injectable()
export class PhotoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PhotoPostDto[]> {
    const rows = await this.prisma.photoPost.findMany({
      where: { status: 'active' },
      orderBy: { at: 'desc' },
    });
    return rows.map(this.toDto);
  }

  private toDto = (r: {
    id: string; userName: string; userIcon: string; photo: string; caption: string;
    plotId: string | null; crop: string | null; likes: number; comments: number; at: Date;
  }): PhotoPostDto => ({
    id: r.id,
    user: { nickname: r.userName, avatar: r.userIcon },
    photo: r.photo,
    caption: r.caption,
    plotId: r.plotId,
    crop: r.crop,
    likes: r.likes,
    comments: r.comments,
    at: this.timeAgo(r.at),
  });

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

@Module({
  controllers: [PhotoController],
  providers: [PhotoService],
  exports: [PhotoService],
})
export class PhotoModule {}
