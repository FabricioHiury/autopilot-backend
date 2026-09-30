import { Module } from '@nestjs/common';
import { CompartilhamentoController } from './compartilhamento.controller';
import { CompartilhamentoService } from './compartilhamento.service';
import { EventoModule } from '../eventos/evento.module';

@Module({
  controllers: [CompartilhamentoController],
  providers: [CompartilhamentoService],
  imports: [EventoModule],
})
export class CompartilhamentoModule {}
