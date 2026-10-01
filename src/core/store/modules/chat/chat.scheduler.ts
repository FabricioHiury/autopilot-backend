import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChatService } from './chat.service';

@Injectable()
export class ChatScheduler {
  constructor(private readonly chatService: ChatService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async executeArchivingAutomatic() {
    console.log('Starting job of archiving automatic of chats');
    try {
      const result = await this.chatService.archiveChatsAutomatically();
      console.log(
        `Archiving automatic completed: ${result.archived} chats archived`,
      );
    } catch (error) {
      console.error('Failed to execute archiving automatic of chats:', error);
    }
  }
}
