import { Global, Module } from '@nestjs/common';
import { EventService } from './event.service';
import { LogActivitiesModule } from '../log-activities/log-activities.module';

@Global()
@Module({
  imports: [LogActivitiesModule],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
