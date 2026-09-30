import { Global, Module } from '@nestjs/common';
import { EventoService } from './evento.service';
import { LogAtividadesModule } from '../log-atividades/log-atividades.module';

@Global()
@Module({
  imports: [LogAtividadesModule],
  providers: [EventoService],
  exports: [EventoService],
})
export class EventoModule {}
