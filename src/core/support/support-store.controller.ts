import {
  Body,
  Controller,
  Get,
  Query,
  UseGuards,
  Post,
  Param,
  ParseIntPipe,
  Res,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { ListTicketDto } from './dto/list-ticket-dto';
import { CreateTicketDto } from './dto/create-ticket-dto';
import { ReplyTicketDto } from './dto/reply-ticket-dto';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { GetAttachmentsDto } from './dto/get-attachments.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Store/Support')
@UseGuards(JwtAuthGuard, ProfileGuard, PermissionsGuard)
@Controller('support')
export class SupportStoreController {
  constructor(private readonly supportService: SupportService) {}

  @Get('/')
  async listTickets(
    @StoreId() storeId: string,
    @Query() params: ListTicketDto,
  ) {
    return await this.supportService.listTicketsStore(storeId, params);
  }

  @Get('/status')
  listStatus() {
    return this.supportService.listStatusTickets();
  }

  @Get('/categories')
  listCategories() {
    return this.supportService.listCategoryTickets();
  }

  @Get('/priorities')
  listPriorities() {
    return this.supportService.listPriorityTickets();
  }

  @Post('/')
  async createTicket(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Body() params: CreateTicketDto,
  ) {
    return await this.supportService.createTicket(storeId, userId, params);
  }

  @Get('/:idTicket')
  async getTicket(
    @StoreId() storeId: string,
    @Param('idTicket') idTicket: string,
  ) {
    return await this.supportService.getTicket(idTicket, storeId);
  }

  @Post('/:idTicket/reply')
  async replyTicket(
    @UserId() userId: string,
    @StoreId() storeId: string,
    @Param('idTicket') idTicket: string,
    @Body() params: ReplyTicketDto,
  ) {
    return await this.supportService.replyTicket(
      idTicket,
      userId,
      params,
      storeId,
    );
  }

  @UseInterceptors(AnyFilesInterceptor())
  @Post('/:idTicket/attachments')
  async saveAttachment(
    @StoreId() storeId: string,
    @Param('idTicket') idTicket: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.supportService.saveAttachment({
      storeId: storeId,
      ticketId: idTicket,
      files,
    });
  }

  @UseInterceptors(AnyFilesInterceptor())
  @Post('/:idTicket/replies/:idReply/attachments')
  async saveAttachmentReply(
    @StoreId() storeId: string,
    @Param('idTicket') idTicket: string,
    @Param('idReply') idReply: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.supportService.saveAttachment({
      storeId: storeId,
      ticketId: idTicket,
      files,
      replyId: idReply,
    });
  }

  @Get('/:idTicket/attachments')
  async listAttachments(
    @StoreId() storeId: string,
    @Param('idTicket') idTicket: string,
    @Query() data: GetAttachmentsDto,
  ) {
    return await this.supportService.listAttachments({
      idTicket,
      storeId,
      data,
    });
  }

  @Get('/:idTicket/attachments/:idAttachment')
  async getAttachment(
    @StoreId() storeId: string,
    @Param('idTicket') idTicket: string,
    @Param('idAttachment') idAttachment: string,
  ) {
    return await this.supportService.getAttachment(
      idTicket,
      storeId,
      idAttachment,
    );
  }
}
