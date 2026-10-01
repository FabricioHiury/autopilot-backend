import { Module } from '@nestjs/common';
import { MessagesTemplatesController } from './messages-templates.controller';
import { MessagesTemplatesService } from './messages-templates.service';

@Module({
  controllers: [MessagesTemplatesController],
  providers: [MessagesTemplatesService],
  exports: [MessagesTemplatesService],
})
export class MessagesTemplatesModule {}
