import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Patch,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/message.dto';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { ApiTags } from '@nestjs/swagger';
import { FiltersRoutesListing } from './dto/filters.dto';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import {
  sendMessageDocs,
  listChatsDocs,
  listMessagesChatDocs,
  updateDealChatDoc,
} from './docs/chat.swagger';
import {
  archiveChatDocs,
  unarchiveChatDocs,
} from './docs/endpoints/archive-chat.swagger';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { IsPublic } from 'src/auth/auth/decorators/is-public.decorator';
import { OlxReceiveLeadDto } from './dto/receive-lead.dto';

@ApiTags('Chat')
@UseGuards(JwtAuthGuard)
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('number-whatsapp-available')
  async whatsappAvailable(
    @StoreId() storeId: string,
    @Query() query: { number: string },
  ) {
    return await this.chatService.whatsappAvailable(storeId, query.number);
  }

  @Get('find-contact-by-number')
  async findContactByNumber(
    @StoreId() storeId: string,
    @Query() query: { number: string },
  ) {
    return await this.chatService.findContactByNumber(storeId, query.number);
  }

  @Post('new-chat')
  @UseGuards(JwtAuthGuard)
  async createChat(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Body() params: SendMessageDto,
    @Query()
    query: {
      typeCustomer: 'customer' | 'temporary';
      customerId?: string;
      name?: string;
      mobile?: string;
    },
  ) {
    return await this.chatService.newChat({
      storeId,
      userId,
      message: params,
      customerId: query.customerId,
      typeCustomer: query.typeCustomer,
      name: query.name,
      mobile: query.mobile,
    });
  }

  @Put('/message/:messageId/read')
  async messageRead(
    @Param('messageId') messageId: string,
    @StoreId() storeId: string,
  ) {
    return await this.chatService.markMessageRead(storeId, messageId);
  }

  @Patch('/:chatId/read')
  async markChatIsRead(
    @Param('chatId') chatId: string,
    @StoreId() storeId: string,
  ) {
    return await this.chatService.markChatIsRead(storeId, chatId);
  }

  @sendMessageDocs()
  @UseGuards(JwtAuthGuard)
  @Post(':chatId/messages')
  async sendMessage(
    @Param('chatId') chatId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return await this.chatService.sendMessage(
      chatId,
      storeId,
      userId,
      sendMessageDto,
    );
  }

  @listMessagesChatDocs()
  @Get(':chatId/messages')
  async findMessages(
    @Param('chatId') chatId: string,
    @Query() params: FiltersRoutesListing,
    @UserId() userId: string,
    @StoreId() storeId: string,
  ) {
    return await this.chatService.findMessagesChat(storeId, chatId, params);
  }

  @Get('message/:messageId')
  async findMessage(
    @Param('messageId') messageId: string,
    @StoreId() storeId: string,
  ) {
    return await this.chatService.findMessageById(messageId, storeId);
  }

  @Get('message/:messageId/page')
  async findPageMessage(
    @Param('messageId') messageId: string,
    @StoreId() storeId: string,
    @Query('limit') limit?: string,
  ) {
    const qtd = limit ? +limit : 10;
    return await this.chatService.findPageMessage(messageId, storeId, qtd);
  }

  @listChatsDocs()
  @Get()
  async listChats(
    @StoreId() storeId: string,
    @Query() params: FiltersRoutesListing,
    @UserId() userId: string,
  ) {
    return await this.chatService.listChats(storeId, userId, params);
  }

  @Get('list-chats-archived')
  async listChatsArchived(
    @StoreId() storeId: string,
    @Query() params: FiltersRoutesListing,
    @UserId() userId: string,
  ) {
    return await this.chatService.listChatsArchived(storeId, userId, params);
  }

  @UseInterceptors(AnyFilesInterceptor())
  @UseGuards(JwtAuthGuard)
  @Post('generate-attachment/:chatId')
  async generateAttachment(
    @StoreId() storeId: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Param('chatId') chatId: string,
  ) {
    return await this.chatService.generateAttachment(files, chatId, storeId);
  }

  @Get('/:chatId')
  async getChat(
    @Param('chatId') chatId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return await this.chatService.getChat(chatId, storeId);
  }

  @updateDealChatDoc()
  @Put('/:chatId/update-deal/:dealId')
  async updateDeal(
    @Param('chatId') chatId: string,
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
  ) {
    return await this.chatService.updateDeal({
      chatId,
      dealId,
      storeId,
    });
  }

  @archiveChatDocs()
  @Put('/:chatId/archive')
  async archiveChat(
    @Param('chatId') chatId: string,
    @StoreId() storeId: string,
  ) {
    return await this.chatService.updateStatusArchiving(chatId, storeId, true);
  }

  @unarchiveChatDocs()
  @Put('/:chatId/unarchive')
  async unarchiveChat(
    @Param('chatId') chatId: string,
    @StoreId() storeId: string,
  ) {
    return await this.chatService.updateStatusArchiving(chatId, storeId, false);
  }
}
