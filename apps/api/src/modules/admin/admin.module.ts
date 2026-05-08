import { Module } from '@nestjs/common';
import { AdminOrderController, AdminOrderService } from './admin-order.controller';

@Module({
  controllers: [AdminOrderController],
  providers: [AdminOrderService],
})
export class AdminModule {}
