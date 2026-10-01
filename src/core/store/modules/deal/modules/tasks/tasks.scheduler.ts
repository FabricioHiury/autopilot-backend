import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TasksService } from './tasks.service';

@Injectable()
export class TasksScheduler {
  constructor(private readonly tasksService: TasksService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async sendNotificationsTasksOfDay() {
    try {
      const result = await this.tasksService.createNotificationsTasksOfDay();
      console.log(result.message);
    } catch (error) {
      console.error('Failed to process notifications of tasks of day:', error);
    }
  }
}
