import { Module } from '@nestjs/common';
import { DistributionAutomaticService } from './distribution-automatic.service';
import { DistributionAutomaticController } from './distribution-automatic.controller';
import { DistributionAutomaticScheduler } from './distribution-automatic.scheduler';
import { SuspensionModule } from '../suspension/suspension.module';
import { EventModule } from '../events/event.module';

@Module({
  imports: [SuspensionModule, EventModule],
  controllers: [DistributionAutomaticController],
  providers: [DistributionAutomaticService, DistributionAutomaticScheduler],
  exports: [DistributionAutomaticService],
})
export class DistributionAutomaticModule {}
