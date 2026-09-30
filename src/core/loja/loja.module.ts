import { Module } from '@nestjs/common';
import { LojaController } from './loja.controller';
import { LojaService } from './loja.service';
import { LojaCargoModule } from './modules/cargo/cargo.module';
import { AtendimentoModule } from './modules/atendimento/atendimento.module';
import { ChatModule } from './modules/chat/chat.module';
import { ColaboradorModule } from './modules/colaborador/colaborador.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { HistoricoLojaModule } from './modules/historico/historico-loja.module';
import { LojaDashboardModule } from './modules/dashboard/loja-dashboard.module';
import { AvatarExternoModule } from './modules/avatar-externo/avatar-externo.module';
import { AssinaturaModule } from './modules/assinatura/assinatura.module';
import { PlanosModule } from './modules/planos/planos.module';
import { RelatoriosAtendimentosModule } from './modules/relatorios/relatorios-atendimentos.module';
import { MensagensPadroesModule } from './modules/mensagens-padroes/mensagens-padroes.module';

@Module({
  controllers: [LojaController],
  providers: [LojaService],
  exports: [LojaService],
  imports: [
    LojaCargoModule,
    AtendimentoModule,
    ChatModule,
    ColaboradorModule,
    ClienteModule,
    HistoricoLojaModule,
    LojaDashboardModule,
    AvatarExternoModule,
    AssinaturaModule,
    PlanosModule,
    RelatoriosAtendimentosModule,
    MensagensPadroesModule,
  ],
})
export class LojaModule {}
