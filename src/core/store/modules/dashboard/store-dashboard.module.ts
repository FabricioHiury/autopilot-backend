import { Module } from '@nestjs/common';
import { StoreDashboardController } from './store-dashboard.controller';
import { StoreDashboardService } from './store-dashboard.service';
import { DevStoreDashboardController } from './dev-store-dashboard.controller';

@Module({
  controllers: [StoreDashboardController, DevStoreDashboardController],
  providers: [StoreDashboardService],
})
export class StoreDashboardModule {}
