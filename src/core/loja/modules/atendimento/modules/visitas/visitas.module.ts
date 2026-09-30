import { Module } from '@nestjs/common';
import { VisitasService } from './visitas.service';
import { VisitasController } from './visitas.controller';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';
import { VisitasScheduler } from './visitas.scheduler';
import { EventoModule } from '../eventos/evento.module';

@Module({
  controllers: [VisitasController],
  providers: [
    VisitasService, 
    PrismaService, 
    NotificacoesService,
    VisitasScheduler
  ],
  imports: [EventoModule],
  exports: [VisitasService],
})
export class VisitasModule {}
