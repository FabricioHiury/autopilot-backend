import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';
import { ListStoresAdminDto } from './dto/list-stores-admin.dto';
import axios from 'axios';
import { ConfigureIntegrationWppDto } from './dto/configure-integration-whatsapp.dto';
import {
  AppErrorInternal,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { uuidv4 } from 'uuidv7';

@Injectable()
export class BackofficeStoreService {
  constructor(private readonly prismaService: PrismaService) {}

  private instanceAxios() {
    return axios.create({
      baseURL: process.env.API_BASE_URL,
      headers: {
        'x-micro-token': process.env.API_KEY,
      },
    });
  }

  async listStores(params: ListStoresAdminDto) {
    const page = params.page ? +params.page : 1;
    const itemsByPage = params.itemsByPage ? +params.itemsByPage : 10;
    const search = params.search || '';
    let wppConfigured: boolean | undefined;

    if (params.wppConfigured) {
      wppConfigured = params.wppConfigured === 'true';
    }

    const dataInitial = params.dataInitial
      ? new Date(params.dataInitial)
      : undefined;

    const dataFinal = params.dataFinal ? new Date(params.dataFinal) : undefined;

    const where: Prisma.StoreWhereInput = {
      createdAt: {
        gte: dataInitial,
        lte: dataFinal,
      },
      wppConfigured,
      OR: [
        {
          companyName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          taxId: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    };

    const stores = await this.prismaService.store.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        taxId: true,
        wppConfigured: true,
        createdAt: true,
        storeOwner: {
          select: {
            userId: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      skip: (page - 1) * itemsByPage,
      take: itemsByPage,
    });

    const totalStores = await this.prismaService.store.count({
      where,
    });

    const storesFormatted =
      stores?.map((store) => ({
        ...store,
        email: store.storeOwner?.user.email,
        avatarUrl: getStringUrlAvatar(store.storeOwner?.userId),
        storeOwner: undefined,
      })) || [];

    return {
      page,
      itemsByPage,
      totalPages: Math.ceil(totalStores / itemsByPage),
      wppConfigured: params.wppConfigured,
      search,
      dataInitial,
      dataFinal,
      stores: storesFormatted,
    };
  }

  async configureIntegrationWpp(params: ConfigureIntegrationWppDto) {
    const store = await this.prismaService.store.findUnique({
      where: {
        id: params.storeId,
      },
      select: {
        id: true,
      },
    });

    if (!store) {
      throw new AppErrorNotFound('Store not found');
    }

    const token = await this.prismaService.store.update({
      where: {
        id: store.id,
      },
      data: {
        integrationsEnabled: true,
        wppConfigured: true,
        wppInstance: uuidv4(),
      },
    });

    await this.instanceAxios().put(`/integrations/whatsapp`, {
      instanceId: token.wppInstance,
      storeId: String(store.id),
    });

    return token;
  }
}
