import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TarefasService } from './tarefas.service';

@Injectable()
export class TarefasScheduler {
  constructor(private readonly tarefasService: TarefasService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async enviarNotificacoesTarefasDoDia() {
    try {
      const resultado = await this.tarefasService.criarNotificacoesTarefasDoDia();
      console.log(resultado.mensagem);
    } catch (error) {
      console.error('Erro ao processar notificações de tarefas do dia:', error);
    }
  }
}