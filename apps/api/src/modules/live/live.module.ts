// ============ 农场直击 LiveRoom(C5)============
// C 端"直播"tab 的公开展示内容(采收/大棚/打包场景直击)。
// 只读公开接口,无鉴权;非"直播带货"、非用户私有摄像头(见架构 v2 §5.5)。
import { Controller, Get, Injectable, Module, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

// ============ DTO ============
class LiveRoomDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() cover!: string;
  @ApiProperty() host!: string;
  @ApiProperty() viewers!: number;
  @ApiProperty() live!: boolean;
  @ApiProperty() scene!: string;
  @ApiProperty() location!: string;
  @ApiProperty() cropName!: string;
  @ApiProperty() sortOrder!: number;
}

// ============ Service ============
@Injectable()
export class LiveService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<LiveRoomDto[]> {
    const rows = await this.prisma.liveRoom.findMany({
      orderBy: [{ live: 'desc' }, { sortOrder: 'asc' }],
    });
    return rows.map((r) => this.toDto(r));
  }

  async findOne(id: string): Promise<LiveRoomDto> {
    const r = await this.prisma.liveRoom.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`直击间 ${id} 不存在`);
    return this.toDto(r);
  }

  private toDto(r: {
    id: string; title: string; cover: string; host: string; viewers: number;
    live: boolean; scene: string; location: string; cropName: string; sortOrder: number;
  }): LiveRoomDto {
    return {
      id: r.id, title: r.title, cover: r.cover, host: r.host, viewers: r.viewers,
      live: r.live, scene: r.scene, location: r.location, cropName: r.cropName,
      sortOrder: r.sortOrder,
    };
  }
}

// ============ Controller(公开) ============
@ApiTags('农场直击')
@Controller('live')
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Get()
  @ApiOperation({ summary: '农场直击列表(直击中的排在前)' })
  @ApiResponse({ status: 200, type: [LiveRoomDto] })
  list() {
    return this.live.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '单个直击间详情' })
  @ApiResponse({ status: 200, type: LiveRoomDto })
  detail(@Param('id') id: string) {
    return this.live.findOne(id);
  }
}

@Module({
  controllers: [LiveController],
  providers: [LiveService],
  exports: [LiveService],
})
export class LiveModule {}
