import { Injectable } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto';
import { EditTaskDto } from './dto/edit-visit.dto';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { AppErrorNotFound } from 'src/utils/errors/app-errors';
import { EventService } from '../events/event.service';
import { DealTask, DealVisit } from '@prisma/client';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { TypesNotificationEnum } from 'src/utils/enum/notifications.enum';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventService: EventService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async getNameUserById(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
      },
    });

    return user?.name ?? '';
  }

  private async getDealById(dealId: string, storeId: string) {
    const deal = await this.prismaService.deal.findFirst({
      where: {
        id: dealId,
        storeId,
      },
      include: {
        customer: true,
        temporaryCustomer: true,
      },
    });

    if (!deal) {
      throw new AppErrorNotFound('None deal with this ID was found');
    }

    return deal;
  }

  private async getEmployeeByIdUser(userId: string, storeId: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new AppErrorNotFound('User not found');
    }

    if (!user.employee && user.profile === USER_PROFILE.STOREOWNER) {
      return {
        employeeId: null,
        userId: user.id,
        storeId,
        name: user.name,
      };
    }

    const employee = await this.prismaService.employee.findFirst({
      where: {
        userId: userId,
        storeId,
      },
    });

    if (!employee) {
      throw new AppErrorNotFound('Employee not found');
    }

    return employee;
  }

  private async createNotificationVisitDay(visit: DealVisit, deal: any) {
    try {
      const nameCustomer =
        deal.customer?.name ?? deal.temporaryCustomer?.name ?? 'customer';

      const assignees = await this.prismaService.dealAssignee.findMany({
        where: {
          dealId: visit.dealId,
        },
        select: {
          employee: {
            select: {
              userId: true,
            },
          },
        },
      });

      let hourFormatted = '';
      if (visit.hourStart) {
        const [hours, minutes] = visit.hourStart.split(':');
        const hoursFormatted = hours.padStart(2, '0');
        const minutesFormatted = minutes ? minutes.padStart(2, '0') : '00';
        hourFormatted = ` às ${hoursFormatted}:${minutesFormatted}`;
      }

      for (const assignee of assignees) {
        if (assignee.employee?.userId) {
          await this.notificationsService.createNewNotification({
            userId: assignee.employee.userId,
            idReference: visit.dealId,
            type: TypesNotificationEnum.VISIT_DAY,
            message: `You have a visit of ${visit.type} scheduled for today${hourFormatted} with ${nameCustomer}`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to create notification of visit of day:', error);
    }
  }

  private async createNotificationVisitCompleted(visit: DealVisit, deal: any) {
    try {
      const nameCustomer =
        deal.customer?.name ?? deal.temporaryCustomer?.name ?? 'customer';

      const assignees = await this.prismaService.dealAssignee.findMany({
        where: {
          dealId: visit.dealId,
        },
        select: {
          employee: {
            select: {
              userId: true,
            },
          },
        },
      });

      for (const assignee of assignees) {
        if (assignee.employee?.userId) {
          await this.notificationsService.createNewNotification({
            userId: assignee.employee.userId,
            idReference: visit.dealId,
            type: TypesNotificationEnum.VISIT_COMPLETED,
            message: `A visit of ${visit.type} with ${nameCustomer} was completed`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to create notification of visit completed:', error);
    }
  }

  private checkVisitForToday(data: Date): boolean {
    const today = new Date();
    const dayToday = today.getDate();
    const monthToday = today.getMonth();
    const yearToday = today.getFullYear();

    const dataScheduled = new Date(data);
    const dayScheduled = dataScheduled.getDate();
    const monthScheduled = dataScheduled.getMonth();
    const yearScheduled = dataScheduled.getFullYear();

    const result =
      dayToday === dayScheduled &&
      monthToday === monthScheduled &&
      yearToday === yearScheduled;

    return result;
  }

  async createVisit(
    userId: string,
    createVisitDto: CreateVisitDto,
    dealId: string,
    storeId: string,
  ) {
    const deal = await this.getDealById(dealId, storeId);
    await this.getEmployeeByIdUser(userId, storeId);

    const visitData =
      createVisitDto.data instanceof Date
        ? createVisitDto.data
        : new Date(createVisitDto.data);

    const visitCreated = await this.prismaService.dealVisit.create({
      data: {
        ...createVisitDto,
        dealId,
      },
    });

    const nameUserLoggedIn = await this.getNameUserById(userId);

    this.eventService.emitVisitCreated({
      dealId,
      userId,
      nameUser: nameUserLoggedIn,
      dataNew: {
        type: createVisitDto.type,
        data: createVisitDto.data,
        hourStart: createVisitDto.hourStart,
        hourEnd: createVisitDto.hourEnd,
        notes: createVisitDto.notes,
        customerName: deal.customer?.name ?? deal.temporaryCustomer?.name,
      },
      context: {
        details: {
          action: 'visit_scheduled',
          customerName: deal.customer?.name ?? deal.temporaryCustomer?.name,
          typeVisit: createVisitDto.type,
        },
      },
    });

    if (this.checkVisitForToday(visitCreated.data)) {
      await this.createNotificationVisitDay(visitCreated, deal);
    }

    const assignees = await this.prismaService.dealAssignee.findMany({
      where: {
        dealId,
      },
      select: {
        employee: {
          select: {
            userId: true,
          },
        },
      },
    });

    const nameCustomer =
      deal.customer?.name ?? deal.temporaryCustomer?.name ?? 'customer';
    const dataFormatted = new Date(visitCreated.data).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    );

    let hourFormatted = '';
    if (visitCreated.hourStart) {
      const [hours, minutes] = visitCreated.hourStart.split(':');
      const hoursFormatted = hours.padStart(2, '0');
      const minutesFormatted = minutes ? minutes.padStart(2, '0') : '00';
      hourFormatted = ` às ${hoursFormatted}:${minutesFormatted}`;
    }

    for (const assignee of assignees) {
      if (assignee.employee?.userId) {
        await this.notificationsService.createNewNotification({
          userId: assignee.employee.userId,
          idReference: dealId,
          type: TypesNotificationEnum.VISIT_SCHEDULED,
          message: `New visit of ${visitCreated.type} scheduled for ${dataFormatted}${hourFormatted} with ${nameCustomer}`,
        });
      }
    }

    return visitCreated;
  }

  async listVisits(dealId: string, storeId: string) {
    await this.getDealById(dealId, storeId);

    const visit = await this.prismaService.dealVisit.findFirst({
      where: {
        dealId,
        completed: false,
      },
      include: {
        deal: {
          include: {
            customer: true,
            temporaryCustomer: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return visit ? [visit] : [];
  }

  async getVisit(idVisit: string) {
    const visit = await this.prismaService.dealVisit.findUnique({
      where: {
        id: idVisit,
      },
      include: {
        deal: {
          include: {
            customer: true,
            temporaryCustomer: true,
          },
        },
      },
    });

    if (!visit) {
      throw new AppErrorNotFound('No visit with this ID was found');
    }

    return visit;
  }

  async completeVisit(userId: string, idVisit: string) {
    const visit = await this.getVisit(idVisit);

    if (visit.completed) {
      return visit;
    }

    const visitChanged = await this.prismaService.dealVisit.update({
      where: {
        id: idVisit,
      },
      data: {
        completed: true,
      },
    });

    const nameUserLoggedIn = await this.getNameUserById(userId);

    this.eventService.emitVisitCompleted({
      dealId: visit.dealId,
      userId,
      nameUser: nameUserLoggedIn,
      dataPrevious: { completed: false },
      dataNew: { completed: true },
      context: {
        details: {
          action: 'visit_completed',
          typeVisit: visitChanged.type,
          dataVisit: visitChanged.data,
          customerName:
            visit.deal.customer?.name ?? visit.deal.temporaryCustomer?.name,
        },
      },
    });

    await this.createNotificationVisitCompleted(visitChanged, visit.deal);

    return visitChanged;
  }

  async deleteVisit(params: {
    storeId: string;
    userId: string;
    idVisit: string;
    dealId: string;
  }) {
    const { storeId, dealId, userId, idVisit } = params;
    await this.getEmployeeByIdUser(userId, storeId);
    const visit = await this.getVisit(idVisit);

    const visitDeleted = await this.prismaService.dealVisit.delete({
      where: {
        id: idVisit,
        deal: {
          id: dealId,
          storeId,
        },
      },
    });

    const nameUserLoggedIn = await this.getNameUserById(userId);

    this.eventService.emitVisitDeleted({
      dealId: visit.dealId,
      userId,
      nameUser: nameUserLoggedIn,
      dataPrevious: {
        type: visit.type,
        data: visit.data,
        hourStart: visit.hourStart,
        hourEnd: visit.hourEnd,
        notes: visit.notes,
      },
      context: {
        details: {
          action: 'visit_deleted',
          typeVisit: visit.type,
        },
      },
    });

    return visitDeleted;
  }

  /**
   * Método for ser executed by um job scheduled diariamente
   * Cria notificações for all as visits scheduled for o day current
   */
  async createNotificationsVisitsOfDay() {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const dataToday = `${year}-${month}-${day}`;

    const startToday = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0),
    );
    const endToday = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const visitsToday = await this.prismaService.dealVisit.findMany({
      where: {
        data: {
          gte: startToday,
          lte: endToday,
        },
        completed: false,
      },
      include: {
        deal: {
          include: {
            customer: true,
            temporaryCustomer: true,
          },
        },
      },
    });

    for (const visit of visitsToday) {
      await this.createNotificationVisitDay(visit, visit.deal);
    }

    return {
      message: `Notifications criadas for ${visitsToday.length} visits scheduled for today (${dataToday}).`,
    };
  }
}
