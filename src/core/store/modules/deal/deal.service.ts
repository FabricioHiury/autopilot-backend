import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  MODE_DEAL,
  ORIGIN_DEAL,
  STATUS_DEAL,
  STATUS_DEAL_MAP,
  SUBREASONS_BY_REASON,
} from 'src/utils/enum/deal.enum';

import {
  AppErrorBadRequest,
  AppErrorForbidden,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { CreateDealDto } from './dto/create-deal.dto';
import { FilterDealDto } from './dto/filters-deal.dto';
import { EventService } from './modules/events/event.service';
import { EditDealDto } from './dto/edit-deal.dto';
import { FileService } from 'src/persistence/files/file/file.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsDto } from './dto/list-comment.dto';
import { GetAttachmentsDealDto } from './dto/get-attachments-deal';
import { HistoryCustomerDto } from './dto/history-customer.dto';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { TypesNotificationEnum } from 'src/utils/enum/notifications.enum';
import { Sender } from '../chat/enum/channel.enum';
import { DistributionAutomaticService } from './modules/distribution-automatic/distribution-automatic.service';
import { TagsService } from './modules/tags/tags.service';
import { normalizePhone } from 'src/utils/phone';

@Injectable()
export class DealService {
  logger = new Logger(DealService.name);
  private phoneVariationsCache = new Map<string, string[]>();
  private readonly PHONE_CACHE_TTL = 5 * 60 * 1000; // 5 min
  private phoneCacheTimestamps = new Map<string, number>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
    private readonly eventService: EventService,
    private readonly notificationsService: NotificationsService,
    private readonly distributionAutomaticService: DistributionAutomaticService,
    private readonly tagsService: TagsService,
  ) {}

  private validateLimitFiles(files: Express.Multer.File[]) {
    if (!files || files?.length === 0) {
      return null;
    }

    if (files.length > 1) {
      throw new AppErrorBadRequest('Upload exactly one file.');
    }

    return files[0];
  }

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

  private async validateTransitionStatus(
    statusCurrent: string,
    newStatus: string,
    userId: string,
    storeId: string,
  ) {
    const hasPreSalespeople = await this.prismaService.employee.count({
      where: {
        storeId,
        roles: {
          some: {
            role: 'Pre-salesperson',
          },
        },
      },
    });

    const hasSalespeople = await this.prismaService.employee.count({
      where: {
        storeId,
        roles: {
          some: {
            role: 'Salesperson',
          },
        },
      },
    });

    if (hasPreSalespeople === 0 || hasSalespeople === 0) {
      return;
    }

    const employee = await this.prismaService.employee.findFirst({
      where: {
        userId,
        storeId,
      },
      include: {
        roles: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      return;
    }

    const roles = employee.roles.map((c) => c.role);
    const isPreSalesperson = roles.includes('Pre-salesperson');
    const isSalesperson = roles.includes('Salesperson');

    if (isPreSalesperson && !isSalesperson) {
      const hasPermission = await this.prismaService.permission.findFirst({
        where: {
          userId,
          feature: PERMISSIONS_STORE.STORE_PRE_SALESPERSON_FINALIZE_DEAL,
          status: 'active',
        },
        select: { id: true },
      });

      if (hasPermission) {
        return;
      }

      if (newStatus === STATUS_DEAL.LOST || newStatus === STATUS_DEAL.SUCCESS) {
        throw new AppErrorForbidden(
          'You do not have permission for finalize deals (Lost/Success).',
        );
      }
    }

    const transitionsPreSalesperson: { [key: string]: string[] } = {
      [STATUS_DEAL.CHAT]: [
        STATUS_DEAL.PRE_DEAL,
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.VISIT,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.LOST,
        STATUS_DEAL.SUCCESS,
      ],
      [STATUS_DEAL.PRE_DEAL]: [
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.VISIT,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.LOST,
        STATUS_DEAL.SUCCESS,
      ],
      [STATUS_DEAL.LOST]: [STATUS_DEAL.RECOVERY, STATUS_DEAL.SUCCESS],
      [STATUS_DEAL.RECOVERY]: [
        STATUS_DEAL.PRE_DEAL,
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.VISIT,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.LOST,
        STATUS_DEAL.SUCCESS,
      ],
      [STATUS_DEAL.SUCCESS]: [STATUS_DEAL.LOST],
    };

    const transitionsSalesperson: { [key: string]: string[] } = {
      [STATUS_DEAL.DEAL_INITIAL]: [
        STATUS_DEAL.VISIT,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.LOST,
        STATUS_DEAL.SUCCESS,
      ],
      [STATUS_DEAL.VISIT]: [
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.LOST,
        STATUS_DEAL.SUCCESS,
      ],
      [STATUS_DEAL.AT_NEGOTIATION]: [
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.VISIT,
        STATUS_DEAL.LOST,
        STATUS_DEAL.SUCCESS,
      ],
      [STATUS_DEAL.LOST]: [STATUS_DEAL.RECOVERY, STATUS_DEAL.SUCCESS],
      [STATUS_DEAL.RECOVERY]: [
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.VISIT,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.LOST,
        STATUS_DEAL.SUCCESS,
      ],
      [STATUS_DEAL.SUCCESS]: [STATUS_DEAL.LOST],
    };

    if (isPreSalesperson && !isSalesperson) {
      const transitionsAllowed = transitionsPreSalesperson[statusCurrent] || [];
      if (!transitionsAllowed.includes(newStatus)) {
        throw new AppErrorBadRequest(
          `Pre-salespeople not podem update o status of "${STATUS_DEAL_MAP[statusCurrent]}" for "${STATUS_DEAL_MAP[newStatus]}"`,
        );
      }
    } else if (isSalesperson && !isPreSalesperson) {
      const transitionsAllowed = transitionsSalesperson[statusCurrent] || [];
      if (!transitionsAllowed.includes(newStatus)) {
        throw new AppErrorBadRequest(
          `Salespeople not podem update o status of "${STATUS_DEAL_MAP[statusCurrent]}" for "${STATUS_DEAL_MAP[newStatus]}"`,
        );
      }
    }
  }

  private async getEmployeeById(employeeId: string, storeId: string) {
    const employee = await this.prismaService.employee.findUnique({
      where: {
        id: employeeId,
        storeId,
      },
    });

    if (!employee) {
      throw new AppErrorNotFound('Employee not found');
    }

    return employee;
  }

  private async checkDealAtOpen(
    storeId: string,
    customerId?: string,
    phone?: string,
    nameComplete?: string,
  ) {
    const statusAtOpen = [
      STATUS_DEAL.CHAT,
      STATUS_DEAL.PRE_DEAL,
      STATUS_DEAL.DEAL_INITIAL,
      STATUS_DEAL.VISIT,
      STATUS_DEAL.AT_NEGOTIATION,
      STATUS_DEAL.RECOVERY,
    ];

    let whereCondition: any = {
      storeId,
      status: {
        in: statusAtOpen,
      },
      isArchived: false,
    };

    if (customerId) {
      whereCondition.customerId = customerId;
    } else {
      const orConditions = [];

      if (phone) {
        const phoneNormalized = normalizePhone(phone);
        orConditions.push({
          temporaryCustomer: {
            whatsapp: phoneNormalized,
          },
        });

        if (phoneNormalized.length === 13) {
          const phoneAlternative =
            phoneNormalized.substring(0, 4) + phoneNormalized.substring(5);
          orConditions.push({
            temporaryCustomer: {
              whatsapp: phoneAlternative,
            },
          });
        }
      }

      if (orConditions.length > 0) {
        whereCondition.OR = orConditions;
      } else {
        return null;
      }
    }

    const dealExisting = await this.prismaService.deal.findFirst({
      where: whereCondition,
      include: {
        dealAssignee: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        temporaryCustomer: {
          select: {
            name: true,
            whatsapp: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return dealExisting;
  }

  private async manageAssigneesTransitionStatus(
    deal: any,
    params: EditDealDto,
    assigneesDeal: string[],
    dealId: string,
    storeId: string,
    store: any,
  ): Promise<void> {
    if (params.idAssignees && params.idAssignees.length > 0) {
      return;
    }

    if (deal.status === params.status) {
      return;
    }

    const statusCurrent = deal.status;
    const newStatus = params.status;
    const assigneesNotDefined =
      !params.idAssignees || params.idAssignees.length === 0;

    if (!assigneesNotDefined) {
      return;
    }

    if (
      statusCurrent === STATUS_DEAL.CHAT &&
      newStatus === STATUS_DEAL.PRE_DEAL
    ) {
      params.idAssignees = assigneesDeal;
      return;
    }

    const statusesQueRequireSalesperson = [
      STATUS_DEAL.DEAL_INITIAL,
      STATUS_DEAL.VISIT,
      STATUS_DEAL.AT_NEGOTIATION,
    ];

    if (
      statusCurrent === STATUS_DEAL.PRE_DEAL &&
      statusesQueRequireSalesperson.includes(newStatus as STATUS_DEAL)
    ) {
      await this.processTransitionWithSalesperson(
        params,
        assigneesDeal,
        dealId,
        storeId,
        store,
      );
      return;
    }

    const statusesPreservation = [
      STATUS_DEAL.VISIT,
      STATUS_DEAL.AT_NEGOTIATION,
    ];
    if (
      statusCurrent !== STATUS_DEAL.PRE_DEAL &&
      statusesPreservation.includes(newStatus as STATUS_DEAL)
    ) {
      params.idAssignees = assigneesDeal;
      return;
    }
  }

  private async processTransitionWithSalesperson(
    params: EditDealDto,
    assigneesDeal: string[],
    dealId: string,
    storeId: string,
    store: any,
  ): Promise<void> {
    const assigneeSalesperson = await this.findSalespersonAssignee(dealId);

    if (assigneeSalesperson) {
      params.idAssignees = store?.distributionAutomatic
        ? assigneesDeal
        : [assigneeSalesperson.employee.id];
    } else {
      const idSalesperson =
        await this.distributionAutomaticService.getEmployeeForDistribution(
          storeId,
          'Salesperson',
        );

      if (idSalesperson) {
        params.idAssignees = store?.distributionAutomatic
          ? [...assigneesDeal, idSalesperson]
          : [idSalesperson];
      }
    }
  }

  private async findSalespersonAssignee(dealId: string) {
    return this.prismaService.dealAssignee.findFirst({
      where: {
        dealId,
        employee: {
          roles: {
            some: {
              role: 'Salesperson',
            },
          },
        },
      },
      include: {
        employee: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  private async createDeal(
    data: CreateDealDto,
    storeId: string,
    customerTemp: boolean,
    userId?: string,
  ) {
    let customerId = data.customerId;

    if (data.phone) {
      data.phone = normalizePhone(data.phone);
    }

    if (userId) {
      const employeeCreator = await this.prismaService.employee.findFirst({
        where: {
          userId,
          storeId,
        },
        include: {
          roles: {
            select: {
              role: true,
            },
          },
        },
      });

      if (employeeCreator) {
        const roles = employeeCreator.roles.map((c) => c.role);
        const isAgent = roles.includes('Agent');

        if (isAgent) {
          data.idAssignees = [employeeCreator.id];
        }
      }
    }

    if (!data.idAssignees || data.idAssignees.length === 0) {
      let typeEmployee: 'Pre-salesperson' | 'Salesperson' | undefined;

      if (data.status === 'preDeal' || data.status === 'chat') {
        typeEmployee = 'Pre-salesperson';
      } else if (
        data.status === 'dealInitial' ||
        data.status === 'visit' ||
        data.status === 'atNegotiation'
      ) {
        typeEmployee = 'Salesperson';
      }
      const idEmployeeAutomatic =
        await this.distributionAutomaticService.getEmployeeForDistribution(
          storeId,
          typeEmployee,
        );

      if (idEmployeeAutomatic) {
        data.idAssignees = [idEmployeeAutomatic];
      }
    }

    const deal = await this.prismaService.$transaction(async (prisma) => {
      const dealCreated = await prisma.deal.create({
        data: {
          storeId,
          dealOrigin: data.dealOrigin,
          temperature: data.temperature,
          title: data.title,
          descriptionDeal: data.descriptionDeal,
          note: data.note,
          dealMode: data.dealMode,
          status: data?.status || STATUS_DEAL.PRE_DEAL,
          dealManual: data.dealManual ?? false,
        },
        include: {
          store: {
            include: {
              storeOwner: true,
            },
          },
        },
      });

      if (data.idAssignees) {
        await Promise.all(
          data.idAssignees.map(async (id) => {
            return prisma.dealAssignee.create({
              data: {
                dealId: dealCreated.id,
                employeeId: id,
                storeId,
              },
            });
          }),
        );
      }

      if (data.chatId) {
        const chat = await prisma.chat.update({
          where: {
            id: data.chatId,
          },
          data: {
            dealId: dealCreated.id,
          },
        });

        if (!chat) {
          throw new AppErrorNotFound('Chat not found');
        }

        if (chat.temporaryCustomerId) {
          const customerTemporaryExisting =
            await prisma.temporaryCustomer.findUnique({
              where: { id: chat.temporaryCustomerId },
              select: { avatar: true },
            });

          await prisma.temporaryCustomer.upsert({
            where: {
              id: chat.temporaryCustomerId,
            },
            update: {
              name: data.nameComplete,
              email: data.email,
              whatsapp: data.phone,
              avatar: customerTemporaryExisting?.avatar,
            },
            create: {
              name: data.nameComplete,
              email: data.email,
              whatsapp: data.phone,
              channel: data.dealOrigin,
              externalContactId: chat.externalRecipientId,
            },
          });

          await prisma.deal.update({
            where: { id: dealCreated.id },
            data: { temporaryCustomerId: chat.temporaryCustomerId },
          });
        } else if (chat.customerId) {
          await prisma.deal.update({
            where: { id: dealCreated.id },
            data: { customerId: chat.customerId },
          });
        }
      }

      return dealCreated;
    });

    if (data.idTags && data.idTags.length > 0) {
      await this.tagsService.linkTagsToTicket(storeId, deal.id, {
        tags: data.idTags,
      });
    }

    if (data.chatId) {
      const chat = await this.prismaService.chat.findUnique({
        where: {
          id: data.chatId,
        },
      });

      if (chat) {
        await this.prismaService.message.create({
          data: {
            sender: Sender.SYSTEM,
            chatId: data.chatId,
            content: `Chat linked to deal ${data.title}`,
            channel: chat.channel,
          },
        });
      }
    }

    if (customerTemp) {
      let temporaryCustomer =
        await this.prismaService.temporaryCustomer.findFirst({
          where: {
            whatsapp: data.phone,
            chat: {
              some: {
                storeId: storeId,
              },
            },
          },
          include: {
            chat: {
              where: {
                storeId: storeId,
              },
            },
          },
        });

      if (!temporaryCustomer && data.phone && data.phone.length === 13) {
        const phoneAlternative =
          data.phone.substring(0, 4) + data.phone.substring(5);

        temporaryCustomer =
          await this.prismaService.temporaryCustomer.findFirst({
            where: {
              whatsapp: phoneAlternative,
              chat: {
                some: {
                  storeId: storeId,
                },
              },
            },
            include: {
              chat: {
                where: {
                  storeId: storeId,
                },
              },
            },
          });
      }

      if (!temporaryCustomer) {
        temporaryCustomer = await this.prismaService.temporaryCustomer.create({
          data: {
            name: data.nameComplete,
            email: data.email,
            whatsapp: data.phone,
            channel: data.dealOrigin,
            externalContactId: '',
          },
          include: {
            chat: {
              where: {
                storeId,
              },
            },
          },
        });
      } else {
        await this.prismaService.temporaryCustomer.update({
          where: { id: temporaryCustomer.id },
          data: {
            name: data.nameComplete || temporaryCustomer.name,
            email: data.email || temporaryCustomer.email,
          },
        });

        const chatExisting = temporaryCustomer.chat?.[0];

        if (chatExisting && !chatExisting.dealId) {
          await this.prismaService.chat.update({
            where: { id: chatExisting.id },
            data: { dealId: deal.id },
          });

          await this.prismaService.message.create({
            data: {
              sender: Sender.SYSTEM,
              chatId: chatExisting.id,
              content: `Chat linked to deal ${data.title}`,
              channel: chatExisting.channel,
            },
          });
        } else if (chatExisting) {
          console.log('Chat already has deal linked:', chatExisting.dealId);
        } else {
          console.log('None chat found for link');
        }
      }

      customerId = temporaryCustomer.id;
    }

    const nameParameter = customerTemp ? 'temporaryCustomerId' : 'customerId';

    const dealUpdated = await this.prismaService.deal.update({
      where: { id: deal.id },
      data: { [nameParameter]: customerId },
      include: {
        dealAssignee: {
          select: {
            employee: {
              select: {
                user: true,
              },
            },
          },
        },
      },
    });

    const namesAssignees = dealUpdated.dealAssignee
      .map((assignee) => assignee.employee.user.name)
      .join(', ');

    await this.notificationsService.createNewNotification({
      userId: deal.store.storeOwner.userId,
      idReference: deal.id,
      type: TypesNotificationEnum.NEW_DEAL,
      message: `One new deal was created for ${namesAssignees}`,
    });

    return {
      ...dealUpdated,
      dealAssignee: undefined,
    };
  }

  private async createNotificationDeal(params: {
    dealId: string;
    idsEmployees?: string[];
    idsUsers?: string[];
    message: string;
    type: TypesNotificationEnum;
  }) {
    const { dealId, idsEmployees, idsUsers = [], message, type } = params;
    try {
      let usersEmployees: string[] = [];

      if (idsEmployees && idsEmployees.length > 0) {
        const employees = await this.prismaService.employee.findMany({
          where: {
            id: {
              in: idsEmployees,
            },
          },
          select: {
            userId: true,
          },
        });
        usersEmployees = employees.map((employee) => employee.userId);
      }

      const idsNotified = [...usersEmployees, ...idsUsers];
      const idNotifiedUnique = [...new Set(idsNotified)];

      await Promise.all(
        idNotifiedUnique.map(async (userId) => {
          await this.notificationsService.createNewNotification({
            userId,
            idReference: dealId,
            type,
            message,
          });
        }),
      );
    } catch (error) {
      console.error(error);
    }
  }

  async getDealById(dealId: string, storeId: string) {
    const deal = await this.prismaService.deal.findUnique({
      where: {
        id: dealId,
        storeId,
      },
      include: {
        dealTags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            whatsapp: true,
            email: true,
            avatarUrl: true,
            name: true,
          },
        },
        temporaryCustomer: {
          select: {
            id: true,
            whatsapp: true,
            email: true,
            avatar: true,
            name: true,
          },
        },
        dealAssignee: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                userId: true,
                roles: {
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
        chat: true,
        dealComment: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                employee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                storeOwner: {
                  select: {
                    id: true,
                    store: {
                      select: {
                        companyName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        dealTask: {
          orderBy: {
            data: 'asc',
          },
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!deal) {
      throw new AppErrorNotFound('Deal not found');
    }

    const assignees = deal.dealAssignee?.map((assignee) => {
      return {
        employeeId: assignee.employeeId,
        name: assignee.employee?.name || '',
        avatarUrl: getStringUrlAvatar(assignee.employee?.userId),
        userId: assignee.employee?.userId,
        roles:
          assignee.employee?.roles.map((role) => role.role).join(', ') || '',
      };
    });

    const comments = deal.dealComment?.map((comment) => {
      const user = comment.user.employee
        ? comment.user.employee.name
        : comment.user.storeOwner.store.companyName;

      return {
        idComment: comment.id,
        userId: comment.userId,
        user,
        avatarUrl: getStringUrlAvatar(comment.userId),
        data: comment.createdAt,
      };
    });

    const tasks = deal.dealTask?.map((task) => {
      return {
        idTask: task.id,
        notes: task.notes || '',
        name: task.name,
        data: task.data,
        hourStart: task.hourStart,
        hourEnd: task.hourEnd,
        completed: task.completed,
        createdAt: task.createdAt,
        nameAssignee: task.employee?.name || '',
        avatarAssignee: getStringUrlAvatar(task.employee?.userId),
      };
    });

    const dealFormatted = {
      ...deal,
      totalTasks: deal.dealTask?.length || 0,
      totalComments: deal.dealComment?.length || 0,
      dealAssignee: undefined,
      dealComment: undefined,
      dealTask: undefined,
      assignees,
      comments,
      tasks,
      chats: deal.chat,
    };

    return dealFormatted;
  }

  async create(params: CreateDealDto, storeId: string, userId: string) {
    if (!storeId) {
      throw new AppErrorNotFound('Store iño provided');
    }

    if (params.chatId) {
      const chat = await this.prismaService.chat.findUnique({
        where: {
          id: params.chatId,
        },
      });

      if (!chat) {
        throw new AppErrorNotFound('Chat not found');
      }
    }

    if (params.idAssignees) {
      await Promise.all(
        params.idAssignees.map(async (employeeId) => {
          return this.getEmployeeById(employeeId, storeId);
        }),
      );
    }

    const dealExisting = await this.checkDealAtOpen(
      storeId,
      params.customerId,
      params.phone,
      params.nameComplete,
    );

    if (dealExisting) {
      const nameCustomer =
        dealExisting.customer?.name ||
        dealExisting.temporaryCustomer?.name ||
        'Customer not identified';

      const phoneCustomer =
        dealExisting.customer?.phone ||
        dealExisting.temporaryCustomer?.whatsapp ||
        'Phone not provided';

      const assignees =
        dealExisting.dealAssignee
          .map((resp) => resp.employee.user.name)
          .join(', ') || 'Not assigned';

      const statusCurrent =
        STATUS_DEAL_MAP[dealExisting.status] || dealExisting.status;

      throw new AppErrorBadRequest(
        `There is already a deal at open for this contact.\n\n` +
          `Customer: ${nameCustomer}\n` +
          `Phone: ${phoneCustomer}\n` +
          `Status current: ${statusCurrent}\n` +
          `Assignee(is): ${assignees}\n` +
          `Deal ID: ${dealExisting.id}\n\n` +
          `Finalize o deal existing before of create a new.`,
      );
    }

    const nameUserLoggedIn = await this.getNameUserById(userId);

    if (params.customerId) {
      const deal = await this.createDeal(params, storeId, false, userId);

      if (params.idAssignees) {
        await Promise.all(
          params.idAssignees.map(async (employeeId) => {
            const employee = await this.prismaService.employee.findUnique({
              where: {
                id: employeeId,
                storeId,
              },
            });

            this.notificationsService.createNewNotification({
              userId: employee.userId,
              idReference: deal.id,
              type: TypesNotificationEnum.NEW_DEAL,
              message: `One new deal was assigned a you by ${nameUserLoggedIn}`,
            });
          }),
        );
      }

      if (params.note && params.note !== '' && params.note.length > 0) {
        this.prismaService.dealComment.create({
          data: {
            dealId: deal.id,
            userId,
            comment: params.note,
          },
        });
        await this.prismaService.deal.update({
          where: { id: deal.id },
          data: { updatedAt: new Date() },
        });
      }

      return deal;
    }

    if (!params.nameComplete) {
      throw new AppErrorBadRequest('Name of customer temporary not provided');
    }

    const deal = await this.createDeal(params, storeId, true, userId);

    if (!deal) {
      throw new AppErrorNotFound('Unable to create o deal');
    }

    if (params.note && params.note !== '' && params.note.length > 0) {
      this.prismaService.dealComment.create({
        data: {
          dealId: deal.id,
          userId,
          comment: params.note,
        },
      });
      await this.prismaService.deal.update({
        where: { id: deal.id },
        data: { updatedAt: new Date() },
      });
    }

    if (params.idAssignees && params.idAssignees.length > 0) {
      await this.createNotificationDeal({
        dealId: deal.id,
        idsEmployees: params.idAssignees,
        message: `One new deal was assigned a you by ${nameUserLoggedIn}`,
        type: TypesNotificationEnum.NEW_DEAL,
      });
    }

    this.eventService.emitDealCreated({
      dealId: deal.id,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataNew: {
        title: deal.title,
        status: deal.status,
        temperature: deal.temperature,
        dealOrigin: deal.dealOrigin,
      },
    });

    return deal;
  }

  async editDeal(
    dealId: string,
    storeId: string,
    params: EditDealDto,
    userId: string,
  ) {
    const deal = await this.getDealById(dealId, storeId);

    if (params.idAssignees) {
      await Promise.all(
        params.idAssignees.map(async (employeeId) => {
          return this.getEmployeeById(employeeId, storeId);
        }),
      );
    }

    const store = await this.prismaService.store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        distributionAutomatic: true,
        storeOwner: {
          select: {
            userId: true,
          },
        },
      },
    });

    const nameUserLoggedIn = await this.getNameUserById(userId);

    const employeeUser = await this.prismaService.employee.findFirst({
      where: {
        userId,
        storeId,
      },
    });

    const assigneesDeal =
      deal.assignees?.map((assignee) => assignee.employeeId) || [];

    const isAssignee =
      employeeUser && assigneesDeal.some((id) => id === employeeUser.id);
    const isStoreOwner = store.storeOwner?.userId === userId;

    if (!isAssignee && !isStoreOwner) {
      throw new AppErrorForbidden(
        'You do not have permission for edit this deal',
      );
    }

    if (params.status && deal.status !== params.status) {
      await this.validateTransitionStatus(
        deal.status,
        params.status,
        userId,
        storeId,
      );
    }

    if (params.subLostReason && params.lostReason) {
      const subReasonsValid = SUBREASONS_BY_REASON[params.lostReason];
      if (!subReasonsValid || !subReasonsValid.includes(params.subLostReason)) {
        throw new AppErrorBadRequest(
          `SubReason "${params.subLostReason}" not is valid for the reason "${params.lostReason}". SubReasons valid: ${subReasonsValid?.join(', ') || 'none'}`,
        );
      }
    }

    const { lostReason, subLostReason, idTags, ...paramsClean } = params;
    const dataEditing = {
      ...paramsClean,
      idAssignees: undefined,
    };

    await this.manageAssigneesTransitionStatus(
      deal,
      params,
      assigneesDeal,
      dealId,
      storeId,
      store,
    );

    const assigneesRemoved = assigneesDeal.filter(
      (id) => !params.idAssignees?.includes(id),
    );
    const assigneesAdded = params.idAssignees?.filter(
      (id) => !assigneesDeal.includes(id),
    );

    const [dealEdited, ..._] = await this.prismaService.$transaction([
      this.prismaService.deal.update({
        where: {
          id: dealId,
          storeId,
        },
        data: {
          ...dataEditing,
        },
      }),
      ...assigneesRemoved.map((employeeId) => {
        return this.prismaService.dealAssignee.deleteMany({
          where: {
            dealId,
            employeeId,
          },
        });
      }),
      ...assigneesAdded.map((employeeId) => {
        return this.prismaService.dealAssignee.create({
          data: {
            dealId,
            storeId,
            employeeId,
          },
        });
      }),
    ]);

    if (params.idTags !== undefined) {
      await this.prismaService.$transaction(async (prisma) => {
        await prisma.dealTag.deleteMany({
          where: { dealId },
        });

        if (params.idTags.length > 0) {
          const tagsExisting = await prisma.tag.findMany({
            where: {
              id: { in: params.idTags },
              storeId,
            },
            select: { id: true },
          });

          const idsTagsExisting = tagsExisting.map((tag) => tag.id);
          const tagsInvalid = params.idTags.filter(
            (idTag) => !idsTagsExisting.includes(idTag),
          );

          if (tagsInvalid.length > 0) {
            throw new AppErrorNotFound(
              `Tags not found or not pertencem to store: ${tagsInvalid.join(', ')}`,
            );
          }

          await prisma.dealTag.createMany({
            data: params.idTags.map((idTag) => ({
              dealId,
              idTag,
            })),
          });
        }
      });
    }
    this.eventService.emitDealEdited({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataPrevious: {
        status: deal.status,
        title: deal.title,
        note: deal.note,
        temperature: deal.temperature,
        dealMode: deal.dealMode,
      },
      dataNew: {
        status: dealEdited.status,
        title: dealEdited.title,
        note: dealEdited.note,
        temperature: dealEdited.temperature,
        dealMode: dealEdited.dealMode,
      },
      context: {
        details: {
          assigneesAdded,
          assigneesRemoved,
          lostReason,
          subLostReason,
        },
      },
    });

    if (assigneesRemoved && assigneesRemoved.length > 0) {
      await this.createNotificationDeal({
        dealId,
        idsEmployees: assigneesRemoved,
        message: `O deal ${deal.title} was removed of you by ${nameUserLoggedIn}`,
        type: TypesNotificationEnum.DEAL_TRANSFERRED,
      });
    }

    if (assigneesAdded && assigneesAdded.length > 0) {
      await this.createNotificationDeal({
        dealId,
        idsEmployees: assigneesAdded,
        message: `O deal ${dealEdited.title} was assigned a you by ${nameUserLoggedIn}`,
        type: TypesNotificationEnum.DEAL_TRANSFERRED,
      });
    }

    if (deal.status !== dealEdited.status) {
      await this.createNotificationDeal({
        dealId,
        idsEmployees: params.idAssignees,
        message: `O deal ${deal.title} was changed for ${STATUS_DEAL_MAP[dealEdited.status]} by ${nameUserLoggedIn}`,
        type: TypesNotificationEnum.DEAL_TRANSFERRED,
      });
    }

    if (
      dealEdited.status === STATUS_DEAL.LOST &&
      params.lostReason &&
      params.note &&
      params.note !== ''
    ) {
      await this.prismaService.dealComment.create({
        data: {
          dealId,
          userId,
          comment: params.note,
          lostReason: params.lostReason,
          subLostReason: params.subLostReason,
        },
      });
      await this.prismaService.deal.update({
        where: { id: dealId },
        data: { updatedAt: new Date() },
      });
    } else if (
      deal.status !== dealEdited.status &&
      dealEdited.status !== STATUS_DEAL.LOST &&
      params.note &&
      params.note !== ''
    ) {
      await this.prismaService.dealComment.create({
        data: {
          dealId,
          userId,
          comment: params.note,
        },
      });
      await this.prismaService.deal.update({
        where: { id: dealId },
        data: { updatedAt: new Date() },
      });
    }
    return dealEdited;
  }

  async getAttachmentsDeal(
    dealId: string,
    storeId: string,
    params: GetAttachmentsDealDto,
  ) {
    const page = params.page ? parseInt(params.page) : 1;
    const itemsByPage = params.itemsByPage ? parseInt(params.itemsByPage) : 4;

    await this.getDealById(dealId, storeId);

    const attachments = await this.prismaService.dealAttachment.findMany({
      where: {
        dealId,
      },
      include: {
        file: true,
      },
      take: itemsByPage,
      skip: (page - 1) * itemsByPage,
    });

    const totalAttachments = await this.prismaService.dealAttachment.count({
      where: {
        dealId,
      },
    });

    if (!attachments || attachments.length === 0) {
      return {
        page,
        itemsByPage,
        totalPages: Math.ceil(totalAttachments / itemsByPage),
        attachments: [],
      };
    }

    const attachmentsFormatted = attachments.map((attachment) => {
      return {
        idAttachment: attachment.id,
        url: attachment.file.url,
        name: attachment.file.name,
        type: attachment.file.type,
        data: attachment.createdAt,
        nameOriginal: attachment.nameOriginal,
      };
    });

    return {
      page,
      itemsByPage,
      totalPages: Math.ceil(totalAttachments / itemsByPage),
      attachments: attachmentsFormatted,
    };
  }

  async saveAttachment(
    storeId: string,
    userId: string,
    dealId: string,
    files: Express.Multer.File[],
  ) {
    const file = this.validateLimitFiles(files);

    if (!file) {
      throw new AppErrorBadRequest(
        'It is necessary to send a file for save o attachment.',
      );
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/png',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new AppErrorBadRequest(
        `Type of file invalid. Accepts one of these types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    const nameOriginal = file.originalname || file.filename;

    const fileSaved = await this.prismaService.$transaction(async (prisma) => {
      const fileSaved = await this.fileService.saveFile({
        file: file,
        entity: 'attachment',
        userId: storeId,
        entityId: dealId,
      });

      const attachmentSaved = await prisma.dealAttachment.create({
        data: {
          dealId,
          fileId: fileSaved.id,
          nameOriginal,
        },
        select: {
          id: true,
          fileId: true,
          updatedAt: true,
          nameOriginal: true,
        },
      });

      return {
        ...fileSaved,
        id: attachmentSaved.id,
        fileId: attachmentSaved.fileId,
        updatedAt: attachmentSaved.updatedAt,
        nameOriginal: attachmentSaved.nameOriginal,
      };
    });

    this.eventService.emitDealEdited({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataNew: {
        attachment: {
          name: fileSaved.name,
          id: fileSaved.id,
        },
      },
      context: {
        details: {
          action: 'attachment_adicionado',
        },
      },
    });

    return {
      url: fileSaved.url,
      idAttachment: fileSaved.id,
      fileId: fileSaved.fileId,
      data: fileSaved.updatedAt,
      nameOriginal: fileSaved.nameOriginal,
    };
  }

  async deleteAttachment(
    dealId: string,
    userId: string,
    storeId: string,
    idAttachment: string,
  ) {
    if (!dealId || !storeId || !idAttachment) {
      throw new AppErrorBadRequest(
        'ID of deal, store or attachment not provided',
      );
    }

    const deal = await this.prismaService.deal.findUnique({
      where: { id: dealId, storeId },
    });

    if (!deal) {
      throw new AppErrorNotFound('Deal not found');
    }

    const attachment = await this.prismaService.dealAttachment.findUnique({
      where: { id: idAttachment, dealId },
    });

    if (!attachment) {
      return;
    }

    await this.prismaService.dealAttachment.delete({
      where: { id: idAttachment, dealId },
    });

    this.eventService.emitDealEdited({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataPrevious: {
        attachment: {
          name: attachment?.nameOriginal,
          id: idAttachment,
        },
      },
      context: {
        details: {
          action: 'attachment_removed',
        },
      },
    });

    try {
      await this.fileService.deleteFile(attachment.fileId);
    } catch (error) {
      this.logger.warn(`Failed to delete file of Firebase: ${error.message}`);
    }
  }

  private generatePhoneVariations(cleanTerm: string): string[] {
    const cacheKey = cleanTerm;
    const now = Date.now();

    if (this.phoneVariationsCache.has(cacheKey)) {
      const timestamp = this.phoneCacheTimestamps.get(cacheKey) || 0;
      if (now - timestamp < this.PHONE_CACHE_TTL) {
        return this.phoneVariationsCache.get(cacheKey)!;
      }
    }

    const variations = new Set([cleanTerm]);

    if (!cleanTerm.startsWith('55') && cleanTerm.length >= 8) {
      variations.add('55' + cleanTerm);
    }

    if (cleanTerm.startsWith('55') && cleanTerm.length > 10) {
      variations.add(cleanTerm.substring(2));
    }

    if (cleanTerm.length >= 4 && cleanTerm.length <= 9) {
      const dddsCommon = ['11', '21', '31', '41', '51', '61', '71', '81', '85'];
      dddsCommon.forEach((ddd) => {
        if (!cleanTerm.startsWith(ddd)) {
          variations.add(ddd + cleanTerm);
          variations.add('55' + ddd + cleanTerm);
        }
      });
    }

    const result = Array.from(variations);

    this.phoneVariationsCache.set(cacheKey, result);
    this.phoneCacheTimestamps.set(cacheKey, now);

    return result;
  }

  private async createPhoneSearchConditions(
    searchTerm: string,
    storeId: string,
  ): Promise<Prisma.DealWhereInput[]> {
    const cleanTerm = searchTerm.replace(/\D+/g, '');
    if (!cleanTerm || cleanTerm.length < 3) return [];

    try {
      const variations = this.generatePhoneVariations(cleanTerm);

      const placeholders = variations.map(() => '?').join(',');

      const dealsWithPhone = await this.prismaService.$queryRaw<
        { id: string }[]
      >`
        SELECT DISTINCT a.id
        FROM "deals" a
        LEFT JOIN "customers" c ON a."customer_id" = c.id
        LEFT JOIN "temporary_customers" ct ON a."temporary_customer_id" = ct.id
        WHERE a."store_id" = ${storeId}
        AND (
          EXISTS (
            SELECT 1 FROM unnest(ARRAY[${Prisma.join(variations)}]) AS v(variation)
            WHERE (
              REGEXP_REPLACE(COALESCE(c.phone, ''), '[^0-9]', '', 'g') LIKE '%' || v.variation || '%'
              OR REGEXP_REPLACE(COALESCE(c.whatsapp, ''), '[^0-9]', '', 'g') LIKE '%' || v.variation || '%'
              OR REGEXP_REPLACE(COALESCE(ct.whatsapp, ''), '[^0-9]', '', 'g') LIKE '%' || v.variation || '%'
            )
          )
        )
      `;

      if (dealsWithPhone.length === 0) {
        return [];
      }

      return [
        {
          id: {
            in: dealsWithPhone.map((item) => item.id),
          },
        },
      ];
    } catch (error) {
      this.logger.error('Error in search otimizada by phone:', error);

      return this.createSimplePhoneSearchFallback(cleanTerm);
    }
  }

  private createSimplePhoneSearchFallback(
    cleanTerm: string,
  ): Prisma.DealWhereInput[] {
    const variations = this.generatePhoneVariations(cleanTerm);

    return variations.flatMap((variation) => [
      {
        customer: {
          phone: { contains: variation, mode: 'insensitive' as const },
        },
      },
      {
        customer: {
          whatsapp: { contains: variation, mode: 'insensitive' as const },
        },
      },
      {
        temporaryCustomer: {
          whatsapp: { contains: variation, mode: 'insensitive' as const },
        },
      },
    ]);
  }

  private isPhoneSearch(term: string): boolean {
    const cleanTerm = term.replace(/\D+/g, '');
    return (
      cleanTerm.length >= 3 && cleanTerm.length <= 15 && /\d{3,}/.test(term)
    );
  }

  private async buildSearchConditions(
    search: string,
    storeId: string,
  ): Promise<Prisma.DealWhereInput> {
    if (!search || search.trim() === '') {
      return {};
    }

    const isPhone = this.isPhoneSearch(search);

    const baseTextConditions = [
      {
        customer: {
          email: { contains: search, mode: 'insensitive' as const },
        },
      },
      {
        customer: {
          name: { contains: search, mode: 'insensitive' as const },
        },
      },
      {
        temporaryCustomer: {
          email: { contains: search, mode: 'insensitive' as const },
        },
      },
      {
        temporaryCustomer: {
          name: { contains: search, mode: 'insensitive' as const },
        },
      },
      { title: { contains: search, mode: 'insensitive' as const } },
    ];

    if (isPhone) {
      const phoneConditions = await this.createPhoneSearchConditions(
        search,
        storeId,
      );
      return {
        OR: [...phoneConditions, ...baseTextConditions],
      };
    } else {
      return {
        OR: [
          ...baseTextConditions,
          {
            customer: {
              phone: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            customer: {
              whatsapp: { contains: search, mode: 'insensitive' as const },
            },
          },
          {
            temporaryCustomer: {
              whatsapp: { contains: search, mode: 'insensitive' as const },
            },
          },
        ],
      };
    }
  }

  async listDeals(storeId: string, filter: FilterDealDto, userId?: string) {
    const {
      search = '',
      dealMode = '',
      origin = '',
      employeeIds = '',
      status = '',
      page = '1',
      itemsPage = '10',
      dataInitial,
      dataFinal,
      isArchived = 'false',
      idTag,
    } = filter;

    const pageNumber = Number(page);
    const itemsByPage = Number(itemsPage);

    const idsEmployees = employeeIds ? employeeIds.split(',') : [];

    const originsDeal = origin ? origin.split(',') : [];

    const allOriginsValid = originsDeal.every((value) =>
      Object.values(ORIGIN_DEAL).includes(value as ORIGIN_DEAL),
    );

    if (!allOriginsValid) {
      throw new AppErrorBadRequest(
        `Origin of deal invalid. As origins allowed are: ${Object.values(ORIGIN_DEAL).join(', ')}`,
      );
    }

    let roleBasedFilter: Prisma.DealWhereInput = {};

    if (userId) {
      const employee = await this.prismaService.employee.findFirst({
        where: {
          userId,
          storeId,
        },
        include: {
          roles: true,
        },
      });

      const storeOwner = await this.prismaService.storeOwner.findFirst({
        where: {
          userId,
          store: {
            id: storeId,
          },
        },
      });
      const isStoreOwner = !!storeOwner;

      if (!isStoreOwner && employee) {
        const rolesUser = employee.roles.map((c) => c.role.toLowerCase()) || [];

        const isManagerSales = rolesUser.some(
          (role) =>
            role.includes('manager_of_sales') || role.includes('manager'),
        );

        const isAgent = rolesUser.some((role) => role.includes('agent'));

        const isPreSalesperson = rolesUser.some(
          (role) =>
            role.includes('pre-salesperson') ||
            role.includes('pre-salesperson'),
        );
        const isSalesperson = rolesUser.some(
          (role) => role.includes('salesperson') && !role.includes('pre'),
        );

        if (isManagerSales) {
          roleBasedFilter = {};
        } else if (isAgent) {
          roleBasedFilter = {
            OR: [
              {
                dealAssignee: {
                  some: {
                    employee: {
                      userId: userId,
                    },
                  },
                },
              },
              {
                shares: {
                  some: {
                    employee: {
                      userId: userId,
                    },
                  },
                },
              },
            ],
          };
        } else {
          const salespeopleStore = await this.prismaService.employee.findMany({
            where: {
              storeId,
              roles: {
                some: {
                  role: {
                    contains: 'Salesperson',
                    mode: 'insensitive',
                    not: { contains: 'Pre' },
                  },
                },
              },
            },
            select: { id: true },
          });

          const preSalespeopleStore =
            await this.prismaService.employee.findMany({
              where: {
                storeId,
                roles: {
                  some: {
                    role: {
                      contains: 'Pre-salesperson',
                      mode: 'insensitive',
                    },
                  },
                },
              },
              select: { id: true },
            });

          const storeHasSalespeople = salespeopleStore.length > 0;
          const storeHasPreSalespeople = preSalespeopleStore.length > 0;

          if (isSalesperson && storeHasSalespeople) {
            if (storeHasPreSalespeople) {
              roleBasedFilter = {
                OR: [
                  {
                    dealAssignee: {
                      some: {
                        employee: {
                          userId: userId,
                        },
                      },
                    },
                  },
                  {
                    shares: {
                      some: {
                        employee: {
                          userId: userId,
                        },
                      },
                    },
                  },
                ],
              };
            } else {
              roleBasedFilter = {
                OR: [
                  {
                    dealAssignee: {
                      none: {},
                    },
                  },
                  {
                    dealAssignee: {
                      some: {
                        employee: {
                          userId: userId,
                        },
                      },
                    },
                  },
                  {
                    shares: {
                      some: {
                        employee: {
                          userId: userId,
                        },
                      },
                    },
                  },
                ],
              };
            }
          } else if (isPreSalesperson && storeHasPreSalespeople) {
            roleBasedFilter = {
              OR: [
                {
                  dealAssignee: {
                    none: {},
                  },
                },
                {
                  dealAssignee: {
                    some: {
                      employee: {
                        userId: userId,
                      },
                    },
                  },
                },
                {
                  shares: {
                    some: {
                      employee: {
                        userId: userId,
                      },
                    },
                  },
                },
              ],
            };
          }
        }
      }
    }

    const searchConditions = await this.buildSearchConditions(search, storeId);

    const filtersBase: Prisma.DealWhereInput = {
      AND: [
        { storeId },
        isArchived === 'true' ? { isArchived: true } : { isArchived: false },
        roleBasedFilter,
        searchConditions,
        dealMode ? { dealMode } : {},
        status ? { status } : {},
        idsEmployees.length > 0
          ? {
              dealAssignee: {
                some: {
                  employeeId: { in: idsEmployees },
                },
              },
            }
          : {},
        originsDeal.length > 0 ? { dealOrigin: { in: originsDeal } } : {},
        idTag
          ? {
              dealTags: {
                some: {
                  idTag: idTag,
                },
              },
            }
          : {},
      ],
      createdAt: {
        lte: new Date(),
      },
    };

    if (filter.tasksAssigned === 'true' && userId) {
      const employee = await this.prismaService.employee.findFirst({
        where: {
          userId: userId,
          storeId,
        },
        select: {
          id: true,
        },
      });

      if (employee) {
        if (!Array.isArray(filtersBase.AND)) {
          filtersBase.AND = [filtersBase.AND];
        }

        filtersBase.AND.push({
          dealTask: {
            some: {
              assigneeId: employee.id,
            },
          },
        });
      }
    }

    let filtersData: Prisma.DealWhereInput | undefined;

    if (dataInitial || dataFinal) {
      const start = dataInitial ? new Date(new Date(dataInitial)) : undefined;
      const end = dataFinal ? new Date(new Date(dataFinal)) : undefined;

      filtersData = {
        createdAt: {
          ...(start && { gte: start }),
          ...(end && { lte: end }),
        },
      };
    }

    const whereFinal: Prisma.DealWhereInput = {
      ...filtersBase,
      ...filtersData,
    };

    const deals = await this.prismaService.deal.findMany({
      where: whereFinal,
      include: {
        dealTags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                description: true,
                color: true,
              },
            },
          },
        },
        customer: true,
        temporaryCustomer: true,
        dealAssignee: {
          include: {
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        chat: true,
        dealTask: true,
        dealComment: true,
      },
      skip: (pageNumber - 1) * itemsByPage,
      take: itemsByPage,
      orderBy: filter.orderBy
        ? {
            [filter.orderBy]: filter.orderDirection ?? 'asc',
          }
        : undefined,
    });

    const result = deals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      descriptionDeal: deal.descriptionDeal,
      dealOrigin: deal.dealOrigin,
      temperature: deal.temperature,
      dealMode: deal.dealMode,
      status: deal.status,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      customer: deal.customer
        ? {
            name: deal.customer.name,
            email: deal.customer.email,
            phone: deal.customer.whatsapp,
            avatar: deal.customer.avatarUrl,
          }
        : deal.temporaryCustomer
          ? {
              name: deal.temporaryCustomer.name,
              email: deal.temporaryCustomer.email,
              phone: deal.temporaryCustomer.whatsapp,
              avatar: deal.temporaryCustomer.avatar,
            }
          : null,
      assignees: deal.dealAssignee.map((resp) => ({
        id: resp.employeeId,
        name: resp.employee.name,
        whatsapp: resp.employee.whatsapp,
        userId: resp.employee.userId,
      })),
      tasks: deal.dealTask.length,
      comments: deal.dealComment.length,
      chats: deal.chat,
      tags: deal.dealTags.map((tag) => tag.tag),
    }));

    return {
      search,
      dealMode,
      origin,
      status,
      employeeIds,
      page: pageNumber,
      itemsPage: itemsByPage,
      dataInitial,
      dataFinal,
      deals: result,
    };
  }

  async listChats(storeId: string, filter: FilterDealDto, userId?: string) {
    const {
      search = '',
      dealMode = '',
      origin = '',
      employeeIds = '',
      status = '',
      page = '1',
      itemsPage = '10',
      dataInitial,
      dataFinal,
      isArchived = 'false',
    } = filter;

    if (employeeIds && employeeIds !== '') {
      return {
        search,
        dealMode,
        origin,
        status: STATUS_DEAL.CHAT,
        employeeIds,
        page: Number(page),
        itemsPage: Number(itemsPage),
        dataInitial,
        dataFinal,
        deals: [],
      };
    }

    const pageNumber = Number(page);
    const itemsByPage = Number(itemsPage);
    const originsDeal = origin ? origin.split(',') : [];

    const allOriginsValid = originsDeal.every((value) =>
      Object.values(ORIGIN_DEAL).includes(value as ORIGIN_DEAL),
    );

    if (!allOriginsValid) {
      throw new AppErrorBadRequest(
        `Origin of deal invalid. As origins allowed are: ${Object.values(ORIGIN_DEAL).join(', ')}`,
      );
    }

    const [store, employeeInfo] = await Promise.all([
      this.prismaService.store.findUnique({
        where: { id: storeId },
        select: {
          distributionAutomatic: true,
        },
      }),
      userId ? this.getInformationUser(userId, storeId) : null,
    ]);

    const roleBasedFilter = this.buildFilterRole(employeeInfo);
    const whereFinal = this.buildFiltersChat({
      storeId,
      search,
      originsDeal,
      dataInitial,
      dataFinal,
      roleBasedFilter,
      isArchived,
    });

    const chats = await this.prismaService.chat.findMany({
      where: whereFinal,
      include: {
        temporaryCustomer: {
          select: {
            name: true,
            avatar: true,
            email: true,
            whatsapp: true,
          },
        },
        chatAssignee: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                whatsapp: true,
                userId: true,
              },
            },
          },
        },
        deal: {
          select: {
            title: true,
            descriptionDeal: true,
            temperature: true,
          },
        },
      },
      skip: (pageNumber - 1) * itemsByPage,
      take: itemsByPage,
      orderBy: filter.orderBy
        ? {
            [filter.orderBy]: filter.orderDirection ?? 'asc',
          }
        : { createdAt: 'desc' },
    });

    const chatsWithoutAssignee = chats.filter(
      (chat) => chat.chatAssignee.length === 0,
    );

    if (store?.distributionAutomatic && chatsWithoutAssignee.length > 0) {
      await this.processDistributionAutomaticBatch(
        chatsWithoutAssignee,
        storeId,
      );
    }

    const resultChats = chats.map((chat) => ({
      id: chat.id,
      title: chat.deal?.title || 'Chat',
      descriptionDeal: chat.deal?.descriptionDeal || '',
      dealOrigin: chat.channel,
      dealMode: MODE_DEAL.BUY,
      status: STATUS_DEAL.CHAT,
      temperature: chat.deal?.temperature || 'WARM',
      archived: chat.archived,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      customer: {
        name: chat.temporaryCustomer?.name || 'Unknown',
        email: chat.temporaryCustomer?.email || '',
        phone: chat.temporaryCustomer?.whatsapp || '',
        avatar: chat.temporaryCustomer?.avatar || '',
      },
      chats: [
        {
          id: chat.id,
          channel: chat.channel,
        },
      ],
      assignees: chat.chatAssignee.map((cr) => cr.employee),
    }));

    const searchConditionsDeal = await this.buildSearchConditions(
      search,
      storeId,
    );

    const filtersDealsChat: Prisma.DealWhereInput = {
      AND: [
        { storeId },
        isArchived === 'true' ? { isArchived: true } : { isArchived: false },
        searchConditionsDeal,
        { status: STATUS_DEAL.CHAT },
        originsDeal.length > 0 ? { dealOrigin: { in: originsDeal } } : {},
      ],
    };

    if (dataInitial || dataFinal) {
      const start = dataInitial ? new Date(new Date(dataInitial)) : undefined;
      const end = dataFinal ? new Date(new Date(dataFinal)) : undefined;

      (filtersDealsChat as any).createdAt = {
        ...(start && { gte: start }),
        ...(end && { lte: end }),
      };
    }

    if (userId) {
      const employeeInfoDeal = await this.getInformationUser(userId, storeId);
      if (!employeeInfoDeal.isStoreOwner && employeeInfoDeal.employee) {
        const rolesUser = employeeInfoDeal.roles || [];
        const isManagerSales = rolesUser.some(
          (role: string) =>
            role.includes('manager_of_sales') || role.includes('manager'),
        );
        const isAgent = rolesUser.some((role: string) =>
          role.includes('agent'),
        );
        const isPreSalesperson = rolesUser.some(
          (role: string) =>
            role.includes('pre-salesperson') ||
            role.includes('pre-salesperson'),
        );
        const isSalesperson = rolesUser.some(
          (role: string) =>
            role.includes('salesperson') && !role.includes('pre'),
        );

        let roleFilter: Prisma.DealWhereInput = {};

        if (!isManagerSales) {
          if (isAgent) {
            roleFilter = {
              OR: [
                {
                  dealAssignee: {
                    some: {
                      employee: { userId },
                    },
                  },
                },
                {
                  shares: {
                    some: {
                      employee: { userId },
                    },
                  },
                },
              ],
            };
          } else if (isSalesperson || isPreSalesperson) {
            roleFilter = {
              OR: [
                { dealAssignee: { none: {} } },
                {
                  dealAssignee: {
                    some: {
                      employee: { userId },
                    },
                  },
                },
                {
                  shares: {
                    some: {
                      employee: { userId },
                    },
                  },
                },
              ],
            };
          }
        }

        if (!Array.isArray((filtersDealsChat as any).AND)) {
          (filtersDealsChat as any).AND = [(filtersDealsChat as any).AND];
        }
        (filtersDealsChat as any).AND.push(roleFilter);
      }
    }

    const dealsChat = await this.prismaService.deal.findMany({
      where: filtersDealsChat,
      include: {
        customer: true,
        temporaryCustomer: true,
        dealAssignee: {
          include: {
            employee: true,
          },
        },
        chat: true,
      },
      orderBy: filter.orderBy
        ? { [filter.orderBy]: filter.orderDirection ?? 'asc' }
        : { createdAt: 'desc' },
      skip: (pageNumber - 1) * itemsByPage,
      take: itemsByPage,
    });

    const resultDeals = dealsChat.map((deal) => ({
      id: deal.id,
      title: deal.title || 'Deal',
      descriptionDeal: deal.descriptionDeal || '',
      dealOrigin: deal.dealOrigin,
      dealMode: deal.dealMode || MODE_DEAL.SELL,
      status: deal.status,
      temperature: deal.temperature || 'WARM',
      archived: deal.isArchived,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      customer: deal.customer
        ? {
            name: deal.customer.name,
            email: deal.customer.email,
            phone: deal.customer.whatsapp,
            avatar: deal.customer.avatarUrl,
          }
        : deal.temporaryCustomer
          ? {
              name: deal.temporaryCustomer.name,
              email: deal.temporaryCustomer.email,
              phone: deal.temporaryCustomer.whatsapp,
              avatar: deal.temporaryCustomer.avatar,
            }
          : null,
      chats: deal.chat?.map((c) => ({ id: c.id, channel: c.channel })) || [],
      assignees: deal.dealAssignee.map((resp) => ({
        id: resp.employeeId,
        name: resp.employee?.name,
        whatsapp: resp.employee?.whatsapp,
        userId: resp.employee?.userId,
      })),
    }));

    const result = [...resultChats, ...resultDeals].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    return {
      search,
      dealMode,
      origin,
      status: STATUS_DEAL.CHAT,
      employeeIds,
      page: pageNumber,
      itemsPage: itemsByPage,
      dataInitial,
      dataFinal,
      isArchived,
      deals: result,
    };
  }

  private async getInformationUser(userId: string, storeId: string) {
    const [employee, storeOwner] = await Promise.all([
      this.prismaService.employee.findFirst({
        where: { userId, storeId },
        include: { roles: true },
      }),
      this.prismaService.storeOwner.findFirst({
        where: {
          userId,
          store: { id: storeId },
        },
      }),
    ]);

    return {
      employee,
      isStoreOwner: !!storeOwner,
      roles: employee?.roles.map((c) => c.role.toLowerCase()) || [],
    };
  }

  private buildFilterRole(employeeInfo: any): Prisma.ChatWhereInput {
    if (!employeeInfo || employeeInfo.isStoreOwner) {
      return {};
    }

    const { employee, roles } = employeeInfo;

    const isPreSalesperson = roles.some(
      (role: string) =>
        role.includes('pre-salesperson') || role.includes('pre-salesperson'),
    );
    const isSalesperson = roles.some(
      (role: string) => role.includes('salesperson') && !role.includes('pre'),
    );

    if (isPreSalesperson || isSalesperson) {
      return {
        chatAssignee: {
          some: {
            employee: {
              userId: employee.userId,
            },
          },
        },
      };
    }

    return {};
  }

  private buildFiltersChat(params: {
    storeId: string;
    search: string;
    originsDeal: string[];
    dataInitial?: Date;
    dataFinal?: Date;
    roleBasedFilter: Prisma.ChatWhereInput;
    isArchived: string;
  }): Prisma.ChatWhereInput {
    const {
      storeId,
      search,
      originsDeal,
      dataInitial,
      dataFinal,
      roleBasedFilter,
      isArchived,
    } = params;

    const filtersBase: Prisma.ChatWhereInput = {
      AND: [
        { storeId },
        { dealId: null },
        isArchived === 'true' ? { archived: true } : { archived: false },
        roleBasedFilter,
        search && search !== ''
          ? {
              OR: [
                {
                  temporaryCustomer: {
                    email: { contains: search, mode: 'insensitive' },
                  },
                },
                {
                  temporaryCustomer: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {},
        originsDeal.length > 0 ? { channel: { in: originsDeal } } : {},
      ],
    };

    if (dataInitial || dataFinal) {
      filtersBase.createdAt = {
        ...(dataInitial && { gte: dataInitial }),
        ...(dataFinal && { lte: dataFinal }),
      };
    }

    return filtersBase;
  }

  private async processDistributionAutomaticBatch(
    chats: any[],
    storeId: string,
  ) {
    const employeesAvailable =
      await this.distributionAutomaticService.getEmployeeForDistribution(
        storeId,
      );

    if (!employeesAvailable) return;
    const distributions = chats.map((chat) => ({
      chatId: chat.id,
      employeeId: employeesAvailable,
      storeId,
    }));

    await this.prismaService.chatAssignee.createMany({
      data: distributions,
      skipDuplicates: true,
    });
  }

  async createComment(
    dealId: string,
    userId: string,
    comment: CreateCommentDto,
  ) {
    const dealExists = await this.prismaService.deal.findUnique({
      where: {
        id: dealId,
      },
    });

    if (!dealExists) {
      throw new AppErrorNotFound('Deal not found');
    }

    const commentCreated = await this.prismaService.dealComment.create({
      data: {
        dealId,
        userId: userId,
        comment: comment.comment,
      },
      select: {
        id: true,
        comment: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    await this.prismaService.deal.update({
      where: { id: dealId },
      data: { updatedAt: new Date() },
    });

    this.eventService.emitCommentCreated({
      dealId,
      userId,
      nameUser: commentCreated.user.name,
      dataNew: {
        comment: commentCreated.comment,
        id: commentCreated.id,
      },
    });

    return commentCreated;
  }

  async listComments(dealId: string, storeId: string, params: ListCommentsDto) {
    const page = params.page ? Number(params.page) : 1;
    const itemsPage = params.itemsPage ? Number(params.itemsPage) : 10;

    await this.getDealById(dealId, storeId);

    const comments = await this.prismaService.dealComment.findMany({
      where: {
        dealId,
      },
      include: {
        user: true,
      },
      skip: (page - 1) * itemsPage,
      take: itemsPage,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const result = comments.map((comment) => ({
      id: comment.id,
      comment: comment.comment,
      createdAt: comment.createdAt,
      userId: comment.userId,
      name: comment.user.name,
      avatar: getStringUrlAvatar(comment.userId),
    }));

    return {
      page,
      itemsPage,
      comments: result,
    };
  }

  async removeAssignees(
    dealId: string,
    storeId: string,
    userId: string,
    idAssignees: string[],
  ) {
    const deal = await this.getDealById(dealId, storeId);

    const assigneesDeal = deal.dealAssignee.map(
      (assignee) => assignee.employeeId,
    );

    const store = await this.prismaService.store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        storeOwner: {
          select: {
            userId: true,
          },
        },
      },
    });

    const isStoreOwner = store.storeOwner?.userId === userId;

    if (!isStoreOwner) {
      throw new AppErrorForbidden(
        'You do not have permission for remove assignees this deal',
      );
    }

    const assigneesForRemove = idAssignees.filter((id) =>
      assigneesDeal.includes(id),
    );

    if (assigneesForRemove.length === 0) {
      throw new AppErrorBadRequest(
        'None of assignees provided is linked to deal',
      );
    }

    await this.prismaService.dealAssignee.deleteMany({
      where: {
        dealId,
        employeeId: {
          in: assigneesForRemove,
        },
      },
    });

    this.eventService.emitDealEdited({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      context: {
        details: {
          assigneesRemoved: deal.assignees.map((r) => ({
            name: r.name,
          })),
        },
      },
    });
  }

  async updateTitle(
    dealId: string,
    userId: string,
    storeId: string,
    title: string,
  ) {
    await this.getDealById(dealId, storeId);

    const dealUpdated = await this.prismaService.deal.update({
      where: {
        id: dealId,
      },
      data: {
        title,
      },
    });

    this.eventService.emitDealEdited({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataNew: { title: dealUpdated.title },
    });

    return dealUpdated;
  }

  async updateDescription(
    dealId: string,
    userId: string,
    storeId: string,
    description: string,
  ) {
    await this.getDealById(dealId, storeId);

    const dealUpdated = await this.prismaService.deal.update({
      where: {
        id: dealId,
      },
      data: {
        descriptionDeal: description,
      },
    });

    this.eventService.emitDealEdited({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataNew: { descriptionDeal: description },
    });

    return dealUpdated;
  }

  async listFilesOfChat(dealId: string, storeId: string) {
    await this.getDealById(dealId, storeId);

    const chatsDeal = await this.prismaService.chat.findMany({
      where: {
        dealId,
      },
    });

    const messages = await this.prismaService.message.findMany({
      where: {
        AND: [
          {
            chatId: {
              in: chatsDeal.map((chat) => chat.id),
            },
          },
          {
            attachmentUrl: {
              not: null,
            },
          },
        ],
      },
      select: {
        id: true,
        chatId: true,
        channel: true,
        attachmentType: true,
        attachmentUrl: true,
        createdAt: true,
        type: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const messagesFiltered = messages.filter((message) => {
      if (message.type === 'sticker') return false;
      if (!message.attachmentType) return false;
      if (message.attachmentType.includes('image')) return true;
      if (message.attachmentType.includes('application')) return true;

      return false;
    });

    return messagesFiltered;
  }

  async updateCustomer(params: {
    dealId: string;
    userId: string;
    storeId: string;
    customerId: string;
  }) {
    const { dealId, storeId, customerId, userId } = params;

    const deal = await this.prismaService.deal.findUnique({
      where: {
        id: dealId,
        storeId,
      },
    });

    if (!deal) {
      throw new AppErrorNotFound('Deal not found');
    }

    const customer = await this.prismaService.customer.findUnique({
      where: {
        id: customerId,
        storeId,
      },
    });

    if (!customer) {
      throw new AppErrorNotFound('Customer not found');
    }

    const dealUpdated = await this.prismaService.deal.update({
      where: {
        id: dealId,
        storeId,
      },
      data: {
        customerId,
        temporaryCustomerId: null,
      },
    });

    this.eventService.emitDealEdited({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataNew: {
        customer: {
          name: customer?.name,
          email: customer?.email,
          whatsapp: customer?.whatsapp,
        },
      },
    });

    return dealUpdated;
  }

  /**
   * Automatically archives deals based on status and last interaction date
   * @param inactivityDays Number of inactivity days to archive (default: 30)
   */
  async archiveDealsAutomatically(inactivityDays: number = 30): Promise<void> {
    try {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - inactivityDays);

      const dealsToArchive = await this.prismaService.deal.findMany({
        where: {
          isArchived: false,
          status: {
            in: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
          },
          updatedAt: {
            lt: limitDate,
          },
        },
        select: {
          id: true,
          storeId: true,
          status: true,
        },
      });

      if (dealsToArchive.length > 0) {
        await this.prismaService.deal.updateMany({
          where: {
            id: {
              in: dealsToArchive.map((a) => a.id),
            },
          },
          data: {
            isArchived: true,
          },
        });

        this.logger.log(
          `Automatically archived ${dealsToArchive.length} deals`,
        );
      }
    } catch (error) {
      this.logger.error('Error automatically archiving deals:', error);
    }
  }

  /**
   * Archives a specific deal
   * @param dealId Deal ID
   * @param storeId Store ID
   */
  async archiveDeal(
    dealId: string,
    storeId: string,
    userId: string,
  ): Promise<void> {
    const deal = await this.prismaService.deal.findFirst({
      where: {
        id: dealId,
        storeId,
      },
    });

    if (!deal) {
      throw new AppErrorNotFound('Deal not found');
    }

    await this.prismaService.deal.update({
      where: {
        id: dealId,
      },
      data: {
        isArchived: true,
      },
    });

    this.eventService.emitDealArchived({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataNew: { isArchived: true },
    });
  }

  /**
   * Unarchives a specific deal
   * @param dealId Deal ID
   * @param storeId Store ID
   */
  async unarchiveDeal(
    dealId: string,
    storeId: string,
    userId: string,
  ): Promise<void> {
    const deal = await this.prismaService.deal.findFirst({
      where: {
        id: dealId,
        storeId,
      },
    });

    if (!deal) {
      throw new AppErrorNotFound('Deal not found');
    }

    await this.prismaService.deal.update({
      where: {
        id: dealId,
      },
      data: {
        isArchived: false,
      },
    });

    this.eventService.emitDealUnarchived({
      dealId,
      userId,
      nameUser: await this.getNameUserById(userId),
      dataPrevious: { isArchived: true },
      dataNew: { isArchived: false },
    });
  }

  async deleteDealUnlinkingChats(
    dealId: string,
    storeId: string,
    userId: string,
  ): Promise<{ message: string; chatsUnlinked: number }> {
    const deal = await this.prismaService.deal.findFirst({
      where: {
        id: dealId,
        storeId,
      },
    });

    if (!deal) {
      throw new AppErrorNotFound('Deal not found');
    }

    const chatsLinked = await this.prismaService.chat.findMany({
      where: { dealId, storeId },
      select: { id: true, channel: true },
    });

    await this.prismaService.$transaction(async (prisma) => {
      if (chatsLinked.length > 0) {
        await prisma.chat.updateMany({
          where: { dealId, storeId },
          data: { dealId: null },
        });

        for (const chat of chatsLinked) {
          await prisma.message.create({
            data: {
              sender: Sender.SYSTEM,
              chatId: chat.id,
              content: 'Deal unlinked and deleted.',
              channel: chat.channel as any,
            },
          });
        }
      }

      await prisma.deal.delete({ where: { id: dealId } });
    });

    return {
      message: 'Deal deleted with success. Chats were unlinked and preserved.',
      chatsUnlinked: chatsLinked.length,
    };
  }

  async getHistoryCustomer(storeId: string, params: HistoryCustomerDto) {
    if (!params.customerId && !params.temporaryCustomerId) {
      throw new AppErrorBadRequest(
        'It is necessary to provide the ID of customer or of customer temporary',
      );
    }

    if (params.customerId && params.temporaryCustomerId) {
      throw new AppErrorBadRequest(
        'Provide only the ID of customer OR of customer temporary, not ambos',
      );
    }

    const page = parseInt(params.page || '1');
    const itemsPage = parseInt(params.itemsPage || '10');
    const skip = (page - 1) * itemsPage;

    const whereConditions: Prisma.DealWhereInput = {
      storeId,
    };

    if (params.customerId) {
      whereConditions.customerId = params.customerId;
    } else if (params.temporaryCustomerId) {
      whereConditions.temporaryCustomerId = params.temporaryCustomerId;
    }

    if (params.search) {
      whereConditions.OR = [
        {
          title: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          descriptionDeal: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [deals, total] = await Promise.all([
      this.prismaService.deal.findMany({
        where: whereConditions,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              whatsapp: true,
              avatarUrl: true,
            },
          },
          temporaryCustomer: {
            select: {
              id: true,
              name: true,
              email: true,
              whatsapp: true,
              avatar: true,
            },
          },
          dealAssignee: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                },
              },
            },
          },
          dealTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: {
              dealComment: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: itemsPage,
      }),
      this.prismaService.deal.count({
        where: whereConditions,
      }),
    ]);

    const dealsWithAttachments = await Promise.all(
      deals.map(async (deal) => {
        const totalAttachments = await this.prismaService.dealAttachment.count({
          where: {
            dealId: deal.id,
          },
        });

        const customer: any = deal.customer || deal.temporaryCustomer;

        return {
          id: deal.id,
          title: deal.title,
          descriptionDeal: deal.descriptionDeal,
          status: deal.status,
          dealMode: deal.dealMode,
          dealOrigin: deal.dealOrigin,
          temperature: deal.temperature,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
          customer: customer
            ? {
                id: customer.id,
                name: customer.name,
                email: customer.email,
                phone: deal.customer ? customer.phone : null,
                whatsapp: customer.whatsapp,
                avatarUrl: deal.customer ? customer.avatarUrl : customer.avatar,
                type: deal.customer ? 'customer' : 'temporaryCustomer',
              }
            : null,
          assignees: deal.dealAssignee.map((resp) => ({
            id: resp.employee.id,
            name: resp.employee.name,
            avatarUrl: getStringUrlAvatar(resp.employee.userId),
          })),
          tags: deal.dealTags.map((tagRel) => ({
            id: tagRel.tag.id,
            name: tagRel.tag.name,
            color: tagRel.tag.color,
          })),
          counters: {
            comments: deal._count.dealComment,
            attachments: totalAttachments,
          },
        };
      }),
    );

    const totalPages = Math.ceil(total / itemsPage);

    return {
      search: params.search || '',
      customerId: params.customerId || null,
      temporaryCustomerId: params.temporaryCustomerId || null,
      page,
      itemsPage,
      totalItems: total,
      totalPages,
      deals: dealsWithAttachments || deals,
    };
  }
}
