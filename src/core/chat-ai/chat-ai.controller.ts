import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { ChatAiService } from './chat-ai.service';
@Controller('chats/:chatId/copilot')
@UseGuards(JwtAuthGuard)
export class ChatAiController {
  constructor(private readonly service: ChatAiService) {}
  @Get() get(
    @StoreId() storeId: string,
    @Param('chatId', ParseUUIDPipe) chatId: string,
  ) {
    return this.service.get(storeId, chatId);
  }
  @Post('refresh')
  @HttpCode(202)
  refresh(
    @StoreId() storeId: string,
    @Param('chatId', ParseUUIDPipe) chatId: string,
  ) {
    return this.service.refresh(storeId, chatId);
  }
}
