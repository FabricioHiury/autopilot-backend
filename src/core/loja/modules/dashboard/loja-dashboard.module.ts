import { Module } from '@nestjs/common';
import { LojaDashboardController } from './loja-dashboard.controller';
import { LojaDashboardService } from './loja-dashboard.service';
import { DevLojaDashboardController } from './dev-loja-dashboard.controller';

@Module({
  controllers: [LojaDashboardController, DevLojaDashboardController],
  providers: [LojaDashboardService],
})
export class LojaDashboardModule {}
