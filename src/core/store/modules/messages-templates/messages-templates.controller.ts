import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { Permissions } from 'src/auth/auth/roles-decorators/permissions/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';
import { MessagesTemplatesService } from './messages-templates.service';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { EditMessageTemplateDto } from './dto/edit-message-template.dto';
import { ListMessagesTemplatesDto } from './dto/list-messages-templates.dto';
import {
  createMessageTemplateSwagger,
  listMessagesTemplatesSwagger,
  editMessageTemplateSwagger,
  deleteMessageTemplateSwagger,
  getMessageTemplateByIdSwagger,
} from './docs/messages-templates.swagger';

@ApiTags('Messages Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('messages-templates')
export class MessagesTemplatesController {
  constructor(
    private readonly messagesTemplatesService: MessagesTemplatesService,
  ) {}

  @Post()
  @Permissions([PERMISSIONS_STORE.STORE_CREATE_MESSAGE_TEMPLATE])
  @ApiOperation(createMessageTemplateSwagger)
  async create(
    @StoreId() storeId: string,
    @Body() data: CreateMessageTemplateDto,
  ) {
    return await this.messagesTemplatesService.create(storeId, data);
  }

  @Get()
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_MESSAGES_TEMPLATE])
  @ApiOperation(listMessagesTemplatesSwagger)
  async list(
    @StoreId() storeId: string,
    @Query() filters: ListMessagesTemplatesDto,
  ) {
    return await this.messagesTemplatesService.list(storeId, filters);
  }

  @Get(':id')
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_MESSAGES_TEMPLATE])
  @ApiOperation(getMessageTemplateByIdSwagger)
  async getById(@StoreId() storeId: string, @Param('id') id: string) {
    return await this.messagesTemplatesService.getById(storeId, id);
  }

  @Patch(':id')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_MESSAGE_TEMPLATE])
  @ApiOperation(editMessageTemplateSwagger)
  async edit(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() data: EditMessageTemplateDto,
  ) {
    return await this.messagesTemplatesService.edit(storeId, id, data);
  }

  @Delete(':id')
  @Permissions([PERMISSIONS_STORE.STORE_DELETE_MESSAGE_TEMPLATE])
  @ApiOperation(deleteMessageTemplateSwagger)
  async delete(@StoreId() storeId: string, @Param('id') id: string) {
    return await this.messagesTemplatesService.delete(storeId, id);
  }
}
