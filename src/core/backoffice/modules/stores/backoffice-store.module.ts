import { Module } from '@nestjs/common';
import { BackofficeStoreService } from './backoffice-store.service';
import { BackofficeStoreController } from './backoffice-store.controller';

@Module({
  controllers: [BackofficeStoreController],
  providers: [BackofficeStoreService],
  exports: [BackofficeStoreService],
})
export class BackofficeStoreModule {}
