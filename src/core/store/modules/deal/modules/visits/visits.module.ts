import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { VisitsScheduler } from './visits.scheduler';
import { EventModule } from '../events/event.module';

@Module({
  controllers: [VisitsController],
  providers: [
    VisitsService,
    PrismaService,
    NotificationsService,
    VisitsScheduler,
  ],
  imports: [EventModule],
  exports: [VisitsService],
})
export class VisitsModule {}
