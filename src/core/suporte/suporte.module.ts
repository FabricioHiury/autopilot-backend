import { Module } from '@nestjs/common';
import { SuporteService } from './suporte.service';
import { SuporteBackofficeController } from './suporte-backoffice.controller';
import { SuporteLojaController } from './suporte-loja.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [ScheduleModule.forRoot(), NotificacoesModule],
  controllers: [SuporteBackofficeController, SuporteLojaController],
  providers: [SuporteService],
})
export class SuporteModule {}
