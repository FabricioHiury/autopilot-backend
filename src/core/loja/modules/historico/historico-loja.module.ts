import { Global, Module } from '@nestjs/common';
import { HistoricoLojaService } from './historico-loja.service';
import { HistoricoLojaController } from './historico-loja.controller';

@Global()
@Module({
  controllers: [HistoricoLojaController],
  providers: [HistoricoLojaService],
  exports: [HistoricoLojaService],
})
export class HistoricoLojaModule {}
