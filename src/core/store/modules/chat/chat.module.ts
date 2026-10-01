import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatScheduler } from './chat.scheduler';

import { AvatarExternalModule } from '../avatar-external/avatar-external.module';
import { DealModule } from '../deal/deal.module';
import { DistributionAutomaticModule } from '../deal/modules/distribution-automatic/distribution-automatic.module';
import { ApiHttpProvider } from './http.provider';

@Module({
  controllers: [ChatController],
  providers: [ApiHttpProvider, ChatService, ChatScheduler],
  exports: [ChatService],
  imports: [AvatarExternalModule, DealModule, DistributionAutomaticModule],
})
export class ChatModule {}
