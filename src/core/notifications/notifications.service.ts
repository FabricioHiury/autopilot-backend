import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { StatusNotificationEnum } from 'src/utils/enum/notifications.enum';
import {
  UpdateStatusNotificationDto,
  CreateNotificationDto,
  ListNotificationDto,
} from './dto/notifications.dto';
import { ListNotificationResonseDto } from './dto/response/notifications.dto';
import { Prisma } from '@prisma/client';
import { NovuService } from '../novu/novu.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly novuService: NovuService,
  ) {}

  async listNotifications(userId: string, query: ListNotificationDto) {
    const { status } = query;

    const where: Prisma.NotificationWhereInput = {
      userId: userId,
      status: status ? { equals: status } : undefined,
    };

    const [notifications, totalViewed, totalPending] = await Promise.all([
      this.prismaService.notification.findMany({
        where,
        take: 100,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.notification.count({
        where: {
          userId: userId,
          status: StatusNotificationEnum.VIEWED,
        },
      }),
      this.prismaService.notification.count({
        where: {
          userId: userId,
          status: StatusNotificationEnum.PENDING,
        },
      }),
    ]);

    return {
      notifications,
      total: totalPending + totalViewed,
      totalViewed,
      totalPending,
    };
  }

  async updateNotification(
    updateDto: UpdateStatusNotificationDto,
    idNotification: string,
  ) {
    return await this.prismaService.notification.update({
      where: {
        id: idNotification,
      },
      data: updateDto,
    });
  }

  async createNewNotification(createNotification: CreateNotificationDto) {
    const notification = await this.prismaService.notification.create({
      data: {
        userId: createNotification.userId,
        idReference: createNotification.idReference,
        message: createNotification.message,
        type: createNotification.type,
        status: StatusNotificationEnum.PENDING,
      },
    });

    this.novuService
      .triggerPushNotification({
        subscriberId: createNotification.userId,
        type: createNotification.type,
        message: createNotification.message,
        idReference: createNotification.idReference,
      })
      .catch(() => {});

    return notification;
  }

  async markAllAsRead(userId: string) {
    return await this.prismaService.notification.updateMany({
      where: {
        userId,
        status: StatusNotificationEnum.PENDING,
      },
      data: {
        status: StatusNotificationEnum.VIEWED,
      },
    });
  }
}
