import { Module } from '@nestjs/common';
import { AssinaturaModule } from './modules/assinatura/assinatura.module';
import { BackofficeLojaModule } from './modules/lojas/backoffice-loja.module';
import { AdminModule } from './modules/admin/admin.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FaqModule } from './modules/faq/faq.module';
import { PlanosModule } from './modules/planos/planos.module';
import { BackofficeAuthModule } from './modules/auth/backoffice-auth.module';

@Module({
  imports: [
    AdminModule,
    AssinaturaModule,
    DashboardModule,
    FaqModule,
    BackofficeLojaModule,
    PlanosModule,
    BackofficeAuthModule,
  ],
})
export class BackofficeModule {}
