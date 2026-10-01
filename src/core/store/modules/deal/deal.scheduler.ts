import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DealService } from './deal.service';

@Injectable()
export class DealScheduler {
  private readonly INACTIVE_DAYS = 30;
  constructor(private readonly dealService: DealService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async executeAutoArchiving() {
    console.log(
      `Starting automatic deal archiving job for ${this.INACTIVE_DAYS} days`,
    );
    try {
      await this.dealService.archiveDealsAutomatically(this.INACTIVE_DAYS);
      console.log(
        `Automatic deal archiving completed successfully for ${this.INACTIVE_DAYS} days`,
      );
    } catch (error) {
      console.error(
        `Error executing automatic deal archiving for ${this.INACTIVE_DAYS} days:`,
        error,
      );
    }
  }
}
