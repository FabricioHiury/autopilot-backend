import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { IHistoryStoreDto } from './interfaces/history-store.interface';
import { ListHistoryStoreDto } from './dto/list-history-store.dto';
import { endOfDay, startOfDay } from 'date-fns';
import { Prisma } from '@prisma/client';

@Injectable()
export class HistoryStoreService {
  constructor(private readonly prismaService: PrismaService) {}

  @OnEvent('store.event')
  private async logEventStore(params: IHistoryStoreDto) {
    const store = await this.prismaService.store.findUnique({
      where: {
        id: params.storeId,
      },
    });

    if (!store) {
      throw new Error('Store not found');
    }

    await this.prismaService.storeHistory.create({
      data: {
        storeId: params.storeId,
        typeEvent: params.typeEvent,
        description: params.description,
      },
    });
  }

  async listHistoryStore(storeId: string, params: ListHistoryStoreDto) {
    const page = params.page ? +params.page : 1;
    const itemsByPage = params.itemsByPage ? +params.itemsByPage : 10;
    const search = params.search || '';

    const dataInitial = params.dataInitial
      ? startOfDay(new Date(params.dataInitial))
      : undefined;

    const dataFinal = params.dataFinal
      ? endOfDay(new Date(params.dataFinal))
      : undefined;

    const where: Prisma.StoreHistoryWhereInput = {
      AND: [
        {
          storeId,
          createdAt: {
            gte: dataInitial,
            lte: dataFinal,
          },
        },
        {
          OR: [
            {
              typeEvent: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };

    const history = await this.prismaService.storeHistory.findMany({
      where,
      take: itemsByPage,
      skip: (page - 1) * itemsByPage,
    });

    const total = await this.prismaService.storeHistory.count({
      where,
    });

    return {
      page,
      itemsByPage,
      totalPages: Math.ceil(total / itemsByPage),
      dataInitial,
      dataFinal,
      items: history,
    };
  }
}
