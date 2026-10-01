import {
  Body,
  Controller,
  Query,
  Post,
  Get,
  UseGuards,
  Put,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { DealService } from './deal.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { FilterDealDto } from './dto/filters-deal.dto';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateDealDoc,
  createCommentsDoc,
  DeleteAttachmentDealDoc,
  EditDealDoc,
  listDealDocs,
  listCommentsDoc,
  GetAttachmentsDealDoc,
  GetDealByIdDoc,
  removeAssigneesDoc,
  SaveAttachmentDealDoc,
  updateCustomerDealDoc,
} from './docs/deals.swagger';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { Permissions } from 'src/auth/auth/roles-decorators/permissions/permissions.decorator';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';
import { EditDealDto } from './dto/edit-deal.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comment.dto';
import { RemoveAssigneesDto } from './dto/remove-assignees.dto';
import { GetAttachmentsDealDto } from './dto/get-attachments-deal';
import { ListLogsDto } from './dto/list-logs.dto';
import { LogActivitiesService } from './modules/log-activities/log-activities.service';
import { HistoryCustomerDto } from './dto/history-customer.dto';

@ApiTags('Deal')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('deals')
export class DealController {
  constructor(
    private readonly dealService: DealService,
    private readonly logActivitiesService: LogActivitiesService,
  ) {}

  @CreateDealDoc()
  @Post()
  async createDeal(
    @Body() data: CreateDealDto,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return await this.dealService.create(data, storeId, userId);
  }

  @listDealDocs()
  @Get()
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_DEALS])
  async getAll(
    @Query() filters: FilterDealDto,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return await this.dealService.listDeals(storeId, filters, userId);
  }

  @Get('list-chats')
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_CHAT])
  async listChats(
    @Query() filters: FilterDealDto,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return await this.dealService.listChats(storeId, filters, userId);
  }

  @Get('history-customer')
  @ApiOperation({
    summary: 'Get history complete of deals of a customer',
    description:
      'Returns all the deals previous associados a a customer (normal or temporary) with pagination and filters',
  })
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_DEALS])
  @ApiResponse({
    status: 200,
    description: 'History of deals retrieved with success',
    schema: {
      type: 'object',
      properties: {
        deals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string' },
              dealMode: { type: 'string' },
              origin: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              customer: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  phone: { type: 'string' },
                  whatsapp: { type: 'string' },
                  avatarUrl: { type: 'string', nullable: true },
                  type: {
                    type: 'string',
                    enum: ['customer', 'temporaryCustomer'],
                  },
                },
              },
              assignees: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    avatarUrl: { type: 'string' },
                  },
                },
              },
              tags: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    color: { type: 'string' },
                  },
                },
              },
              counters: {
                type: 'object',
                properties: {
                  comments: { type: 'number' },
                  attachments: { type: 'number' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            pageCurrent: { type: 'number' },
            itemsByPage: { type: 'number' },
            totalItems: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPagePrevious: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Parameters invalid - is required provide the ID of customer or customer temporary',
  })
  async getHistoryCustomer(
    @Query() params: HistoryCustomerDto,
    @StoreId() storeId: string,
  ) {
    return await this.dealService.getHistoryCustomer(storeId, params);
  }

  @GetDealByIdDoc()
  @Get('/:dealId')
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_DEALS])
  async findDealById(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
  ) {
    return await this.dealService.getDealById(dealId, storeId);
  }

  @Get('/:dealId/attachments-chat')
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_CHAT])
  async findAttachmentsDealById(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
  ) {
    return await this.dealService.listFilesOfChat(dealId, storeId);
  }

  @EditDealDoc()
  @Patch('/:dealId/status')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async editDeal(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @Body() updateDealDto: EditDealDto,
    @UserId() userId: string,
  ) {
    return await this.dealService.editDeal(
      dealId,
      storeId,
      updateDealDto,
      userId,
    );
  }

  @updateCustomerDealDoc()
  @Put('/:dealId/update-customer/:customerId')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async updateCustomer(
    @Param('dealId') dealId: string,
    @Param('customerId') customerId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return await this.dealService.updateCustomer({
      dealId,
      userId,
      storeId,
      customerId,
    });
  }

  @Patch('/:dealId/update-title')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async updateTitle(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Body() body: { title: string },
  ) {
    return await this.dealService.updateTitle(
      dealId,
      userId,
      storeId,
      body.title,
    );
  }

  @Patch('/:dealId/update-description')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async updateDescription(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Body() body: { description: string },
  ) {
    return await this.dealService.updateDescription(
      dealId,
      userId,
      storeId,
      body.description,
    );
  }

  @GetAttachmentsDealDoc()
  @Get('/:dealId/attachments')
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_DEALS])
  async getAttachmentsDeal(
    @StoreId() storeId: string,
    @Param('dealId') dealId: string,
    @Query() params: GetAttachmentsDealDto,
  ) {
    return await this.dealService.getAttachmentsDeal(dealId, storeId, params);
  }

  @SaveAttachmentDealDoc()
  @UseInterceptors(AnyFilesInterceptor())
  @Post('/:dealId/attachment')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async saveAttachment(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('dealId') dealId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return await this.dealService.saveAttachment(
      storeId,
      userId,
      dealId,
      files,
    );
  }

  @DeleteAttachmentDealDoc()
  @Delete('/:dealId/attachment/:idAttachment')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async deleteAvatar(
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Param('dealId') dealId: string,
    @Param('idAttachment') idAttachment: string,
  ) {
    await this.dealService.deleteAttachment(
      dealId,
      userId,
      storeId,
      idAttachment,
    );

    return {
      success: true,
      message: 'Attachment deleted with success',
    };
  }

  @createCommentsDoc()
  @Post('/:dealId/comments')
  @Permissions([PERMISSIONS_STORE.STORE_REPLY_CHAT])
  async createComment(
    @Param('dealId') dealId: string,
    @UserId() userId: string,
    @Body() comment: CreateCommentDto,
  ) {
    return await this.dealService.createComment(dealId, userId, comment);
  }

  @listCommentsDoc()
  @Get('/:dealId/comments')
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_DEALS])
  async getComments(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @Query() params: ListCommentsDto,
  ) {
    return await this.dealService.listComments(dealId, storeId, params);
  }

  @removeAssigneesDoc()
  @Delete('/:dealId/assignees')
  @Permissions([PERMISSIONS_STORE.STORE_LINK_DEAL_USER])
  async removeAssignees(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
    @Body() removeAssignees: RemoveAssigneesDto,
  ) {
    return await this.dealService.removeAssignees(
      dealId,
      storeId,
      userId,
      removeAssignees.idAssignees,
    );
  }

  @ApiOperation({
    summary: 'Delete deal preservando chats',
    description:
      'Deletes a deal and unlinks all the chats related (the chats are preserved and remain accessible).',
  })
  @ApiResponse({
    status: 200,
    description: 'Deal deleted with success and chats unlinked',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        chatsUnlinked: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Deal not found' })
  @Delete('/:dealId')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async deleteDeal(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return await this.dealService.deleteDealUnlinkingChats(
      dealId,
      storeId,
      userId,
    );
  }

  @Patch('/:dealId/archive')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async archiveDeal(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return await this.dealService.archiveDeal(dealId, storeId, userId);
  }

  @Patch('/:dealId/unarchive')
  @Permissions([PERMISSIONS_STORE.STORE_EDIT_DELETE_DEAL])
  async unarchiveDeal(
    @Param('dealId') dealId: string,
    @StoreId() storeId: string,
    @UserId() userId: string,
  ) {
    return await this.dealService.unarchiveDeal(dealId, storeId, userId);
  }

  @Get('/:dealId/logs')
  @ApiOperation({
    summary: 'List logs of activities of a deal',
    description:
      'Returns the logs of activities of a deal specific with pagination',
  })
  @Permissions([PERMISSIONS_STORE.STORE_VIEW_DEALS])
  @ApiResponse({
    status: 200,
    description: 'Logs listados with success',
    schema: {
      type: 'object',
      properties: {
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              typeEvent: { type: 'string' },
              description: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            pageCurrent: { type: 'number' },
            itemsByPage: { type: 'number' },
            totalItems: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPagePrevious: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Deal not found',
  })
  async listLogsDeal(
    @Param('dealId') dealId: string,
    @Query() params: ListLogsDto,
  ) {
    return await this.logActivitiesService.listLogsDeal(
      dealId,
      params.page,
      params.limit,
    );
  }
}
