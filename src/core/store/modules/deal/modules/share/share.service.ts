import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorNotFound,
  AppErrorBadRequest,
  AppErrorConflict,
  AppErrorUnauthorized,
} from 'src/utils/errors/app-errors';
import { EventService } from '../events/event.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { TypesNotificationEnum } from 'src/utils/enum/notifications.enum';

@Injectable()
export class ShareService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventService: EventService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getNameUserById(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return user?.name ?? '';
  }

  private async checkPermissionShare(
    userId: string,
    dealId: string,
    storeId: string,
  ) {
    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
      include: {
        storeOwner: true,
      },
    });

    if (store.storeOwner.userId === userId) {
      return;
    }

    const deal = await this.prismaService.deal.findUnique({
      where: { id: dealId, storeId },
      select: {
        dealAssignee: {
          select: {
            employee: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (
      deal.dealAssignee.some((assignee) => assignee.employee.userId === userId)
    ) {
      return;
    }

    throw new AppErrorUnauthorized(
      'You do not have permission for update settings of share this deal',
    );
  }

  async create(params: {
    dealId: string;
    storeId: string;
    userId: string;
    employeeId: string;
  }) {
    const { dealId, storeId, userId, employeeId } = params;

    await this.checkPermissionShare(userId, dealId, storeId);

    const deal = await this.prismaService.deal.findUnique({
      where: {
        id: dealId,
        storeId,
      },
    });

    if (!deal) {
      throw new AppErrorNotFound('Deal not found');
    }

    const employee = await this.prismaService.employee.findUnique({
      where: {
        id: employeeId,
        storeId,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
        dealsShared: {
          select: {
            dealId: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AppErrorNotFound('Employee not found');
    }

    if (employee.user.id === userId) {
      throw new AppErrorBadRequest('You cannot can share o deal with yourself');
    }

    if (employee.dealsShared.some((share) => share.dealId === dealId)) {
      throw new AppErrorConflict(
        'This deal already is shared with this employee',
      );
    }

    const share = await this.prismaService.dealShare.create({
      data: {
        dealId,
        employeeId,
        storeId,
        sharedBy: userId,
      },
    });

    const nameUser = await this.getNameUserById(userId);

    this.eventService.emitShareCreated({
      dealId,
      userId,
      nameUser,
      dataNew: {
        employeeShared: employee.name,
        employeeId: employee.id,
      },
      context: {
        details: {
          action: 'share_created',
          employee: employee.name,
        },
      },
    });

    await this.notificationsService.createNewNotification({
      userId: employee.userId,
      idReference: dealId,
      type: TypesNotificationEnum.DEAL_SHARED,
      message: `${nameUser} compartilhou a deal with you`,
    });

    return share;
  }

  async list(params: { dealId: string; storeId: string }) {
    const { dealId, storeId } = params;

    return await this.prismaService.dealShare.findMany({
      where: { dealId, storeId },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            whatsapp: true,
            userId: true,
            roles: true,
          },
        },
      },
    });
  }

  async remove(params: {
    dealId: string;
    storeId: string;
    userId: string;
    employeeId: string;
  }) {
    const { dealId, storeId, userId, employeeId } = params;

    await this.checkPermissionShare(userId, dealId, storeId);

    const share = await this.prismaService.dealShare.findFirst({
      where: { dealId, storeId, employeeId },
      include: {
        employee: {
          select: {
            name: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!share) {
      throw new AppErrorNotFound('Share not found');
    }

    await this.prismaService.dealShare.delete({
      where: { id: share.id },
    });

    const nameUser = await this.getNameUserById(userId);

    this.eventService.emitShareRemoved({
      dealId: share.dealId,
      userId,
      nameUser,
      dataPrevious: {
        employeeShared: share.employee.name,
        employeeId: share.employeeId,
      },
      context: {
        details: {
          action: 'share_removed',
          employee: share.employee.name,
        },
      },
    });

    await this.notificationsService.createNewNotification({
      userId: share.employee.user.id,
      idReference: share.dealId,
      type: TypesNotificationEnum.DEAL_SHARED,
      message: `${nameUser} removeu o share of a deal with you`,
    });
  }
}
