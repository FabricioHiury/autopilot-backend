import { Module } from '@nestjs/common';
import { BackofficeModule } from './backoffice/backoffice.module';
import { IntegracaoModule } from './integracao/integracao.module';
import { LojaModule } from './loja/loja.module';
import { UsuarioModule } from './usuario/usuario.module';
import { SuporteModule } from './suporte/suporte.module';

@Module({
  imports: [UsuarioModule, LojaModule, BackofficeModule, IntegracaoModule, SuporteModule],
})
export class CoreModule {}
