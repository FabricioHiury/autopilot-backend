import { Module } from '@nestjs/common';
import { DealController } from './deal.controller';
import { DealService } from './deal.service';
import { TasksModule } from './modules/tasks/tasks.module';
import { EventModule } from './modules/events/event.module';
import { VisitsModule } from './modules/visits/visits.module';
import { ShareModule } from './modules/share/share.module';
import { SuspensionModule } from './modules/suspension/suspension.module';
import { DistributionAutomaticModule } from './modules/distribution-automatic/distribution-automatic.module';
import { FileModule } from 'src/persistence/files/file/file.module';
import { DealScheduler } from './deal.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { LogActivitiesModule } from './modules/log-activities/log-activities.module';
import { TagsModule } from './modules/tags/tags.module';

@Module({
  controllers: [DealController],
  providers: [DealService, DealScheduler],
  exports: [DealService],
  imports: [
    ScheduleModule.forRoot(),
    FileModule,
    TasksModule,
    EventModule,
    VisitsModule,
    ShareModule,
    SuspensionModule,
    DistributionAutomaticModule,
    LogActivitiesModule,
    TagsModule,
  ],
})
export class DealModule {}
