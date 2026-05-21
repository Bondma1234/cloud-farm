import { Module } from '@nestjs/common';
import { AdminOrderController, AdminOrderService } from './admin-order.controller';
import { AdminCommandController } from './admin-command.controller';
import { CommandModule } from '../command/command.module';

@Module({
  imports: [CommandModule],
  controllers: [AdminOrderController, AdminCommandController],
  providers: [AdminOrderService],
})
export class AdminModule {}
