import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AtendimentoService } from './atendimento.service';

@Injectable()
export class AtendimentoScheduler {
  private readonly INACTIVE_DAYS = 30;
  constructor(private readonly atendimentoService: AtendimentoService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async executeAutoArchiving() {
    console.log(
      `Starting automatic attendance archiving job for ${this.INACTIVE_DAYS} days`,
    );
    try {
      await this.atendimentoService.archiveAttendancesAutomatically(
        this.INACTIVE_DAYS,
      );
      console.log(
        `Automatic attendance archiving completed successfully for ${this.INACTIVE_DAYS} days`,
      );
    } catch (error) {
      console.error(
        `Error executing automatic attendance archiving for ${this.INACTIVE_DAYS} days:`,
        error,
      );
    }
  }
}
