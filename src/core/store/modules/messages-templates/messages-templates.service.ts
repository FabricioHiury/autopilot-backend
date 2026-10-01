import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import { EditMessageTemplateDto } from './dto/edit-message-template.dto';
import { ListMessagesTemplatesDto } from './dto/list-messages-templates.dto';

@Injectable()
export class MessagesTemplatesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(storeId: string, data: CreateMessageTemplateDto) {
    if (!storeId) {
      throw new AppErrorBadRequest('ID of store not provided');
    }

    const messageCreated = await this.prismaService.messageTemplate.create({
      data: {
        storeId,
        title: data.title,
        content: data.content,
      },
    });

    return messageCreated;
  }

  async list(storeId: string, filters: ListMessagesTemplatesDto) {
    if (!storeId) {
      throw new AppErrorBadRequest('ID of store not provided');
    }

    const { search = '', page = '1', itemsByPage = '10' } = filters;

    const pageNumber = Number(page);
    const itemsByPageNumber = Number(itemsByPage);

    const whereCondition: any = {
      storeId,
    };

    if (search && search.trim() !== '') {
      whereCondition.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [messages, total] = await Promise.all([
      this.prismaService.messageTemplate.findMany({
        where: whereCondition,
        skip: (pageNumber - 1) * itemsByPageNumber,
        take: itemsByPageNumber,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.messageTemplate.count({
        where: whereCondition,
      }),
    ]);

    return {
      messages,
      page: pageNumber,
      itemsByPage: itemsByPageNumber,
      total,
      totalPages: Math.ceil(total / itemsByPageNumber),
    };
  }

  async getById(storeId: string, id: string) {
    if (!storeId) {
      throw new AppErrorBadRequest('ID of store not provided');
    }

    if (!id) {
      throw new AppErrorBadRequest('ID of message not provided');
    }

    const message = await this.prismaService.messageTemplate.findUnique({
      where: {
        id,
        storeId,
      },
    });

    if (!message) {
      throw new AppErrorNotFound('Message template not found');
    }

    return message;
  }

  async edit(storeId: string, id: string, data: EditMessageTemplateDto) {
    await this.getById(storeId, id);

    if (!data.title && !data.content) {
      throw new AppErrorBadRequest('Provide at least a field for update');
    }

    const messageUpdated = await this.prismaService.messageTemplate.update({
      where: {
        id,
        storeId,
      },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.content && { content: data.content }),
      },
    });

    return messageUpdated;
  }

  async delete(storeId: string, id: string) {
    await this.getById(storeId, id);

    await this.prismaService.messageTemplate.delete({
      where: {
        id,
        storeId,
      },
    });

    return { message: 'Message template deleted with success' };
  }
}
