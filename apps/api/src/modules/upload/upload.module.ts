// ============ 文件上传模块 ============
// MVP:本地磁盘存,目录 apps/api/uploads/YYYY-MM-DD/<random>.ext
// 浏览器访问:GET /uploads/2026-05-21/abc.jpg(main.ts 里 useStaticAssets 暴露)
// P7 上线时换 OSS / R2,只改这里 store 的写法,接口契约不变
//
// 单文件最大 5MB,只允许图片
//
import {
  BadRequestException,
  Controller,
  Injectable,
  Module,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';

export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

// ============ DTOs ============
export class UploadResultDto {
  @ApiProperty({ example: '/uploads/2026-05-21/a3f4c1.jpg' })
  url!: string;

  @ApiProperty({ example: 'a3f4c1.jpg' })
  filename!: string;

  @ApiProperty({ example: 12345 })
  size!: number;

  @ApiProperty({ example: 'image/jpeg' })
  mimetype!: string;
}

// 自定义 disk storage:按日期分目录 + 随机文件名
const storage = diskStorage({
  destination: (_req, _file, cb) => {
    const today = new Date();
    const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dir = path.join(UPLOAD_ROOT, ymd);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const rand = Math.random().toString(36).slice(2, 10);
    cb(null, `${Date.now()}-${rand}${ext}`);
  },
});

const fileFilter = (
  _req: unknown,
  file: { mimetype: string },
  cb: (error: Error | null, accept: boolean) => void,
) => {
  if (!/^image\/(jpeg|png|gif|webp|bmp)$/i.test(file.mimetype)) {
    cb(new BadRequestException(`不支持的图片类型: ${file.mimetype}`), false);
    return;
  }
  cb(null, true);
};

// ============ Service ============
@Injectable()
export class UploadService {
  toResult(file: Express.Multer.File): UploadResultDto {
    if (!file) throw new BadRequestException('请上传文件(字段名 file)');
    const dir = path.basename(path.dirname(file.path));     // YYYY-MM-DD
    const url = `/uploads/${dir}/${file.filename}`;
    return {
      url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}

// ============ Controller ============
@ApiTags('上传')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly svc: UploadService) {}

  @Post()
  @ApiOperation({ summary: '上传一张图片(multipart/form-data,字段名 file,最大 5MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, type: UploadResultDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File): UploadResultDto {
    return this.svc.toResult(file);
  }
}

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
