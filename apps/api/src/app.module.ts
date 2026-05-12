import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { PackageModule } from './modules/package/package.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { JournalModule } from './modules/journal/journal.module';
import { CropModule } from './modules/crop/crop.module';
import { PhotoModule } from './modules/photo/photo.module';
import { CommandModule } from './modules/command/command.module';
import { PlotModule } from './modules/plot/plot.module';
import { AdminModule } from './modules/admin/admin.module';
import { CameraModule } from './modules/camera/camera.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    OrderModule,
    PackageModule,
    JournalModule,
    CropModule,
    PhotoModule,
    CommandModule,
    PlotModule,
    AdminModule,
    CameraModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
