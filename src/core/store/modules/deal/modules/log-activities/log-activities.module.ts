import { Module } from '@nestjs/common';
import { LogActivitiesService } from './log-activities.service';

@Module({
  providers: [LogActivitiesService],
  exports: [LogActivitiesService],
})
export class LogActivitiesModule {}
