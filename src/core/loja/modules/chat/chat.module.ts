import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatWebhookController } from './chat-webhook.controller';
import { ChatScheduler } from './chat.scheduler';

import { AvatarExternoModule } from '../avatar-externo/avatar-externo.module';
import { AtendimentoModule } from '../atendimento/atendimento.module';
import { DistribuicaoAutomaticaModule } from '../atendimento/modules/distribuicao-automatica/distribuicao-automatica.module';
import { ApiHttpProvider } from './http.provider';

@Module({
  controllers: [ChatController, ChatWebhookController],
  providers: [ApiHttpProvider, ChatService, ChatScheduler],
  exports: [ChatService],
  imports: [AvatarExternoModule, AtendimentoModule, DistribuicaoAutomaticaModule],
})
export class ChatModule {}
