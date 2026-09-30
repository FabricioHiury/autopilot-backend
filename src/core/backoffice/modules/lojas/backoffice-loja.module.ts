import { Module } from '@nestjs/common';
import { BackofficeLojaService } from './backoffice-loja.service';
import { BackofficeLojaController } from './backoffice-loja.controller';

@Module({
  controllers: [BackofficeLojaController],
  providers: [BackofficeLojaService],
  exports: [BackofficeLojaService],
})
export class BackofficeLojaModule {}
