import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VisitsService } from './visits.service';

@Injectable()
export class VisitsScheduler {
  constructor(private readonly visitsService: VisitsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async sendNotificationsVisitsOfDay() {
    console.log('Starting job of notifications of visits of day');
    try {
      const result = await this.visitsService.createNotificationsVisitsOfDay();
      console.log(result.message);
    } catch (error) {
      console.error('Failed to process notifications of visits of day:', error);
    }
  }
}
