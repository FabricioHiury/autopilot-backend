import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VisitasService } from './visitas.service';

@Injectable()
export class VisitasScheduler {
  constructor(private readonly visitasService: VisitasService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async enviarNotificacoesVisitasDoDia() {
    console.log('Iniciando job de notificações de visitas do dia');
    try {
      const resultado = await this.visitasService.criarNotificacoesVisitasDoDia();
      console.log(resultado.mensagem);
    } catch (error) {
      console.error('Erro ao processar notificações de visitas do dia:', error);
    }
  }
}