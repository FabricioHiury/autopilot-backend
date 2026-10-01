import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksScheduler } from './tasks.scheduler';
import { NotificationsService } from 'src/core/notifications/notifications.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TasksScheduler, NotificationsService],
})
export class TasksModule {}
