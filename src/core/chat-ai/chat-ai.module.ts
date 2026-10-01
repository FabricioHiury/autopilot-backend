import { Module } from '@nestjs/common';
import { ChatAiService } from './chat-ai.service';
import { ChatAiController } from './chat-ai.controller';
@Module({ providers: [ChatAiService], controllers: [ChatAiController] })
export class ChatAiModule {}
