import { Module } from '@nestjs/common';
import { BackofficeStoreModule } from './modules/stores/backoffice-store.module';
import { AdminModule } from './modules/admin/admin.module';
import { FaqModule } from './modules/faq/faq.module';
import { BackofficeAuthModule } from './modules/auth/backoffice-auth.module';

@Module({
  imports: [
    AdminModule,
    FaqModule,
    BackofficeStoreModule,
    BackofficeAuthModule,
  ],
})
export class BackofficeModule {}
