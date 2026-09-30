import { Module } from '@nestjs/common';
import { IntegracaoService } from './integracao.service';
import { IntegracaoController } from './integracao.controller';
import { ChatModule } from '../loja/modules/chat/chat.module';
import { AssinaturaGuard } from '../backoffice/modules/assinatura/guards/assinatura.guard';

@Module({
  imports: [ChatModule],
  controllers: [IntegracaoController],
  providers: [IntegracaoService, AssinaturaGuard],
})
export class IntegracaoModule {}
