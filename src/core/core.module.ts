import { Module } from '@nestjs/common';
import { BackofficeModule } from './backoffice/backoffice.module';
import { IntegrationModule } from './integration/integration.module';
import { StoreModule } from './store/store.module';
import { UserModule } from './user/user.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    UserModule,
    StoreModule,
    BackofficeModule,
    IntegrationModule,
    SupportModule,
  ],
})
export class CoreModule {}
