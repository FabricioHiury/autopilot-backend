import { Module } from '@nestjs/common';
import { MensagensPadroesController } from './mensagens-padroes.controller';
import { MensagensPadroesService } from './mensagens-padroes.service';

@Module({
  controllers: [MensagensPadroesController],
  providers: [MensagensPadroesService],
  exports: [MensagensPadroesService],
})
export class MensagensPadroesModule {}
