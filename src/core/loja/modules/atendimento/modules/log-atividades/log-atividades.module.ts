import { Module } from '@nestjs/common';
import { LogAtividadesService } from './log-atividades.service';

@Module({
  providers: [LogAtividadesService],
  exports: [LogAtividadesService],
})
export class LogAtividadesModule {}