import { Global, Module } from '@nestjs/common';
import { HistoryStoreService } from './history-store.service';
import { HistoryStoreController } from './history-store.controller';

@Global()
@Module({
  controllers: [HistoryStoreController],
  providers: [HistoryStoreService],
  exports: [HistoryStoreService],
})
export class HistoryStoreModule {}
