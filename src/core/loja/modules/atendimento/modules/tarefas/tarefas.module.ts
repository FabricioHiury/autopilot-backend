import { Module } from '@nestjs/common';
import { TarefasService } from './tarefas.service';
import { TarefasController } from './tarefas.controller';
import { TarefasScheduler } from './tarefas.scheduler';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';

@Module({
  controllers: [TarefasController],
  providers: [TarefasService, TarefasScheduler, NotificacoesService],
})
export class TarefasModule {}
