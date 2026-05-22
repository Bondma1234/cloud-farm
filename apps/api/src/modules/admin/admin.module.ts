import { Module } from '@nestjs/common';
import { AdminOrderController, AdminOrderService } from './admin-order.controller';
import { AdminCommandController } from './admin-command.controller';
import { AdminUserController, AdminUserService } from './admin-user.controller';
import { AdminStatsController, AdminStatsService } from './admin-stats.controller';
import { CommandModule } from '../command/command.module';

@Module({
  imports: [CommandModule],
  controllers: [AdminOrderController, AdminCommandController, AdminUserController, AdminStatsController],
  providers: [AdminOrderService, AdminUserService, AdminStatsService],
})
export class AdminModule {}
