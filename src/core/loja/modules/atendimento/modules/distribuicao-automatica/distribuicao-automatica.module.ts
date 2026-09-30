import { Module } from '@nestjs/common';
import { DistribuicaoAutomaticaService } from './distribuicao-automatica.service';
import { DistribuicaoAutomaticaController } from './distribuicao-automatica.controller';
import { DistribuicaoAutomaticaScheduler } from './distribuicao-automatica.scheduler';
import { SuspensaoModule } from '../suspensao/suspensao.module';
import { EventoModule } from '../eventos/evento.module';

@Module({
  imports: [SuspensaoModule, EventoModule],
  controllers: [DistribuicaoAutomaticaController],
  providers: [
    DistribuicaoAutomaticaService,
    DistribuicaoAutomaticaScheduler,
  ],
  exports: [DistribuicaoAutomaticaService],
})
export class DistribuicaoAutomaticaModule {}
