import { Module } from '@nestjs/common';
import { AtendimentoController } from './atendimento.controller';
import { AtendimentoService } from './atendimento.service';
import { TarefasModule } from './modules/tarefas/tarefas.module';
import { EventoModule } from './modules/eventos/evento.module';
import { VisitasModule } from './modules/visitas/visitas.module';
import { CompartilhamentoModule } from './modules/compartilhamento/compartilhamento.module';
import { SuspensaoModule } from './modules/suspensao/suspensao.module';
import { DistribuicaoAutomaticaModule } from './modules/distribuicao-automatica/distribuicao-automatica.module';
import { FileModule } from 'src/persistence/files/file/file.module';
import { AtendimentoScheduler } from './atendimento.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { LogAtividadesModule } from './modules/log-atividades/log-atividades.module';
import { TagsModule } from './modules/tags/tags.module';

@Module({
  controllers: [AtendimentoController],
  providers: [AtendimentoService, AtendimentoScheduler],
  exports: [AtendimentoService],
  imports: [
    ScheduleModule.forRoot(),
    FileModule,
    TarefasModule, 
    EventoModule, 
    VisitasModule, 
    CompartilhamentoModule,
    SuspensaoModule,
    DistribuicaoAutomaticaModule,
    LogAtividadesModule,
    TagsModule
  ],
})
export class AtendimentoModule {}
