import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket-dto';
import { EventsTicketEnum } from './enum/events-ticket-enum';
import { StatusTicketEnum } from './enum/status-ticket-enum';
import { Prisma } from '@prisma/client';
import { CategoryTicketEnum } from './enum/category-ticket-enum';
import { ListTicketDto } from './dto/list-ticket-dto';
import { PriorityTicketEnum } from './enum/priority-ticket-enum';
import { ReplyTicketDto } from './dto/reply-ticket-dto';
import { UpdateTicketDto } from './dto/update-ticket-dto';
import {
  AppErrorBadRequest,
  AppErrorConflict,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { USER_PROFILE } from '../user/enum/profile.enum';
import { GetAttachmentsDto } from './dto/get-attachments.dto';
import { FileService } from 'src/persistence/files/file/file.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { TypesNotificationEnum } from 'src/utils/enum/notifications.enum';
import { USER_STATUS } from 'src/utils/enum/user-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SupportService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkTicketsWithoutReplyCron() {
    console.log('Running verification of tickets without reply...');
    try {
      await this.checkTicketsWithoutReply();
    } catch (error) {
      console.error(
        'Failed to execute verification of tickets without reply:',
        error,
      );
    }
  }

  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/png',
    'application/pdf',
  ];

  private async createEventHistoryTicket(
    idTicket: string,
    userId: string,
    event: EventsTicketEnum,
  ) {
    let action: string;

    switch (event) {
      case EventsTicketEnum.CREATE:
        action = 'Ticket created by ';
        break;
      case EventsTicketEnum.REPLY:
        action = 'Reply sent by ';
        break;
      case EventsTicketEnum.UPDATE_STATUS:
        action = 'Ticket changed for ';
        break;
      default:
        action = 'Event unknown by';
    }

    const [user, ticket] = await Promise.all([
      this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
        },
      }),
      this.prismaService.supportTicket.findUnique({
        where: {
          id: idTicket,
        },
      }),
    ]);

    if (event === EventsTicketEnum.UPDATE_STATUS) {
      action = action + ticket.status + ' by ';
    }

    await this.prismaService.ticketHistory.create({
      data: {
        event: event,
        action: action,
        ticket: {
          connect: {
            id: idTicket,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  private validateLimitFiles(files: Express.Multer.File[]) {
    if (!files || files?.length === 0) {
      throw new AppErrorBadRequest('None file sent');
    }

    return files;
  }

  private async getReply(idReply: string, idTicket: string) {
    const reply = await this.prismaService.ticketReply.findUnique({
      where: {
        id: idReply,
        ticket: {
          id: idTicket,
        },
      },
    });

    if (!reply) {
      throw new AppErrorNotFound('Reply not found');
    }

    return reply;
  }

  private async getUrlAttachment(params: {
    idTicket: string;
    idAttachment: string;
  }) {
    const { idTicket, idAttachment } = params;

    const attachment = await this.prismaService.supportAttachment.findUnique({
      where: {
        id: idAttachment,
        idTicket,
        file: {
          userId: idTicket,
        },
      },
      include: {
        file: true,
      },
    });

    if (!attachment || !attachment.file) {
      throw new AppErrorNotFound('Attachment not found');
    }

    const file = await this.fileService.getFileById(attachment.fileId);

    if (!file) {
      throw new AppErrorNotFound('File not found');
    }

    return file.url;
  }

  private async notifyAdminsAboutNewTicket(ticket: any, store: any) {
    try {
      const admins = await this.prismaService.user.findMany({
        where: {
          profile: USER_PROFILE.AUTOPILOT,
          status: USER_STATUS.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      if (!admins || admins.length === 0) {
        console.log('None administrator found for notify about new ticket');
        return;
      }

      const nameStore = store.companyName || 'Store';

      for (const admin of admins) {
        await this.notificationsService.createNewNotification({
          userId: admin.id,
          idReference: ticket.id,
          type: TypesNotificationEnum.TICKET_CREATED,
          message: `New ticket of support created: "${ticket.title}" of store ${nameStore}`,
        });
      }

      console.log(
        `Notifications sent for ${admins.length} administradores about o ticket #${ticket.id}`,
      );
    } catch (error) {
      console.error(
        'Failed to notify administradores about new ticket:',
        error,
      );
    }
  }

  /**
   * Verifica tickets without reply by more of 2 days and notifica administradores
   * Este método é executed by um cron job
   */
  async checkTicketsWithoutReply() {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      console.log(
        `Verificando tickets without reply since: ${twoDaysAgo.toISOString()}`,
      );

      const ticketsWithoutReply =
        await this.prismaService.supportTicket.findMany({
          where: {
            status: {
              not: StatusTicketEnum.CLOSED,
            },
            createdAt: {
              lte: twoDaysAgo,
            },
            replies: {
              none: {},
            },
          },
          include: {
            store: {
              select: {
                id: true,
                companyName: true,
              },
            },
          },
        });

      console.log(
        `Encontrados ${ticketsWithoutReply.length} tickets without reply for more of 2 days`,
      );

      if (ticketsWithoutReply.length === 0) {
        return {
          message: 'None ticket without reply found',
        };
      }

      const admins = await this.prismaService.user.findMany({
        where: {
          profile: USER_PROFILE.AUTOPILOT,
          status: USER_STATUS.ACTIVE,
        },
        select: {
          id: true,
        },
      });

      if (!admins || admins.length === 0) {
        console.log(
          'None administrator found for notify about tickets without reply',
        );
        return {
          message: 'None administrator found for notify',
        };
      }

      let notificationsSent = 0;

      for (const ticket of ticketsWithoutReply) {
        const nameStore = ticket.store.companyName || 'Store';
        const daysWithoutReply = Math.floor(
          (new Date().getTime() - new Date(ticket.createdAt).getTime()) /
            (1000 * 3600 * 24),
        );

        for (const admin of admins) {
          await this.notificationsService.createNewNotification({
            userId: admin.id,
            idReference: ticket.id,
            type: TypesNotificationEnum.TICKET_WITHOUT_REPLY,
            message: `Ticket "${ticket.title}" of store ${nameStore} is without reply for ${daysWithoutReply} days`,
          });
          notificationsSent++;
        }
      }

      console.log(
        `Sent ${notificationsSent} notifications for ${admins.length} administradores`,
      );

      return {
        message: `Notifications sent for ${ticketsWithoutReply.length} tickets without reply`,
        ticketsNotified: ticketsWithoutReply.length,
        adminsNotified: admins.length,
      };
    } catch (error) {
      console.error('Failed to check tickets without reply:', error);
      throw error;
    }
  }

  async createTicket(storeId: string, userId: string, params: CreateTicketDto) {
    const [store, user] = await Promise.all([
      this.prismaService.store.findUnique({
        where: {
          id: storeId,
        },
        select: {
          id: true,
          companyName: true,
        },
      }),
      this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!store || !user) {
      throw new Error('Store or user not found');
    }

    const data: Prisma.SupportTicketCreateInput = {
      title: params.title || 'Without title',
      subject: params.subject || 'Without subject',
      message: params.message || 'Without message',
      category: params.category || CategoryTicketEnum.OTHER,
      status: StatusTicketEnum.OPEN,
      user: {
        connect: {
          id: user.id,
        },
      },
      store: {
        connect: {
          id: store.id,
        },
      },
    };

    const ticket = await this.prismaService.supportTicket.create({ data });

    this.createEventHistoryTicket(ticket.id, user.id, EventsTicketEnum.CREATE);

    await this.notifyAdminsAboutNewTicket(ticket, store);

    return ticket;
  }

  async listTickets(params: ListTicketDto, storeId?: string) {
    const page = parseInt(params.page) || 1;
    const itemsByPage = parseInt(params.itemsPage) || 8;

    const where: Prisma.SupportTicketWhereInput = {};

    if (storeId) {
      where.storeId = storeId;
    }

    if (params.search) {
      where.OR = [
        {
          title: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            name: {
              contains: params.search,
              mode: 'insensitive',
            },
          },
        },
        {
          subject: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
        {
          message: {
            contains: params.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (params.priority) {
      where.priority = params.priority;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.category) {
      where.category = params.category;
    }

    if (params.dataInitial && params.dataFinal) {
      where.createdAt = {
        gte: new Date(params.dataInitial),
        lte: new Date(params.dataFinal),
      };
    }

    const [tickets, totalTickets] = await Promise.all([
      this.prismaService.supportTicket.findMany({
        where,
        skip: (page - 1) * itemsByPage,
        take: itemsByPage,
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prismaService.supportTicket.count({
        where,
      }),
    ]);

    return {
      total: totalTickets,
      page,
      totalPages: Math.ceil(totalTickets / itemsByPage),
      tickets,
    };
  }

  async listTicketsStore(storeId: string, params: ListTicketDto) {
    return await this.listTickets(params, storeId);
  }

  async getTicket(idTicket: string, storeId?: string) {
    const where: Prisma.SupportTicketWhereUniqueInput = {
      id: idTicket,
    };

    const ticket = await this.prismaService.supportTicket.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          include: {
            files: {
              include: {
                file: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    size: true,
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        files: {
          include: {
            file: {
              select: {
                id: true,
                name: true,
                type: true,
                size: true,
                url: true,
              },
            },
          },
        },
        history: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        store: {
          include: {
            storeOwner: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppErrorNotFound('Ticket not found');
    }

    if (storeId) {
      if (ticket.store.id !== storeId) {
        throw new AppErrorBadRequest('Ticket not belongs the store');
      }
    }

    const ticketFormatted = {
      ...ticket,
      replies: await Promise.all(
        ticket?.replies.map(async (reply) => ({
          ...reply,
          files: await Promise.all(
            reply?.files.map(async (file) => ({
              ...file,
              url: await this.getUrlAttachment({
                idTicket: ticket.id,
                idAttachment: file.id,
              }),
            })),
          ),
        })),
      ),
      files: await Promise.all(
        ticket?.files.map(async (file) => ({
          ...file,
          url: await this.getUrlAttachment({
            idTicket: ticket.id,
            idAttachment: file.id,
          }),
        })),
      ),
    };

    return ticketFormatted;
  }

  async replyTicket(
    idTicket: string,
    userId: string,
    params: ReplyTicketDto,
    storeId?: string,
  ) {
    const [user, ticket] = await Promise.all([
      this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
          profile: true,
        },
      }),
      this.prismaService.supportTicket.findUnique({
        where: {
          id: idTicket,
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    if (!ticket) {
      throw new AppErrorNotFound('Ticket not found');
    }

    if (!user) {
      throw new AppErrorBadRequest('User not found');
    }

    if (ticket.status === StatusTicketEnum.CLOSED) {
      throw new AppErrorConflict('Ticket closed, not is possible reply');
    }

    if (user.profile !== USER_PROFILE.AUTOPILOT && !storeId) {
      throw new AppErrorBadRequest('Without permission for reply ticket');
    }

    const data: Prisma.TicketReplyCreateInput = {
      reply: params.reply,
      ticket: {
        connect: {
          id: idTicket,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    };

    const reply = await this.prismaService.ticketReply.create({ data });

    this.createEventHistoryTicket(idTicket, user.id, EventsTicketEnum.REPLY);

    return reply;
  }

  async updateStatusTicket(
    idTicket: string,
    userId: string,
    params: UpdateTicketDto,
  ) {
    const [user, ticket] = await Promise.all([
      this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          name: true,
        },
      }),
      this.prismaService.supportTicket.findUnique({
        where: {
          id: idTicket,
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    if (!ticket) {
      throw new AppErrorNotFound('Ticket not found');
    }

    if (!user) {
      throw new AppErrorBadRequest('User not found');
    }

    if (ticket.status === params.status) {
      throw new AppErrorConflict('Status of ticket already is the requested');
    }

    const ticketUpdated = await this.prismaService.supportTicket.update({
      where: {
        id: idTicket,
      },
      data: {
        status: params.status,
      },
    });

    this.createEventHistoryTicket(
      idTicket,
      user.id,
      EventsTicketEnum.UPDATE_STATUS,
    );

    return ticketUpdated;
  }

  listCategoryTickets() {
    return Object.values(CategoryTicketEnum);
  }

  listPriorityTickets() {
    return Object.values(PriorityTicketEnum);
  }

  listStatusTickets() {
    return Object.values(StatusTicketEnum);
  }

  async saveAttachment(params: {
    storeId: string;
    ticketId: string;
    files: Express.Multer.File[];
    replyId?: string;
  }) {
    const { storeId, ticketId, files, replyId } = params;

    await this.getTicket(ticketId, storeId);

    if (replyId) {
      await this.getReply(replyId, ticketId);
    }

    const filesValidated = this.validateLimitFiles(files);

    filesValidated.forEach((file) => {
      if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new AppErrorBadRequest(
          `One of files sent is invalid. Accepts one of these types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
        );
      }
    });

    const filesSaved = await this.prismaService.$transaction(async (prisma) => {
      return await Promise.all(
        filesValidated.map(async (file) => {
          const nameOriginal = file.originalname || file.filename;

          const attachment = await prisma.supportAttachment.create({
            data: {
              idTicket: ticketId,
              idReply: replyId,
              nameOriginal,
            },
            select: {
              id: true,
              fileId: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          const fileSaved = await this.fileService.saveFile({
            file: file,
            entity: 'attachment',
            userId: ticketId,
            entityId: attachment.id,
          });

          await prisma.supportAttachment.update({
            where: {
              id: attachment.id,
            },
            data: {
              fileId: fileSaved.id,
            },
          });

          return {
            id: attachment.id,
            idReply: replyId,
            name: fileSaved.name,
            nameOriginal,
            type: fileSaved.type,
            createdAt: attachment.createdAt,
            updatedAt: attachment.updatedAt,
          };
        }),
      );
    });

    const filesFormatted = await Promise.all(
      filesSaved.map(async (attachment) => {
        return {
          idAttachment: attachment.id,
          idReply: attachment.idReply,
          url: await this.getUrlAttachment({
            idTicket: ticketId,
            idAttachment: attachment.id,
          }),
          name: attachment.name,
          nameOriginal: attachment.nameOriginal,
          type: attachment.type,
          createdAt: attachment.createdAt,
          updatedAt: attachment.updatedAt,
        };
      }),
    );

    return filesFormatted;
  }

  async deleteAttachment(
    idTicket: string,
    storeId: string,
    idAttachment: string,
  ) {
    await this.getTicket(idTicket, storeId);

    const attachment = await this.prismaService.supportAttachment.findUnique({
      where: {
        id: idAttachment,
        idTicket,
      },
    });

    if (!attachment) {
      throw new AppErrorNotFound('Attachment not found');
    }

    await this.fileService.deleteFile(attachment.fileId);

    await this.prismaService.supportAttachment.delete({
      where: {
        id: idAttachment,
      },
    });
  }

  async listAttachments(params: {
    idTicket: string;
    storeId: string;
    data: GetAttachmentsDto;
  }) {
    const { idTicket, storeId, data } = params;

    const page = data.page ? parseInt(data.page) : 1;
    const itemsByPage = data.itemsByPage ? parseInt(data.itemsByPage) : 4;

    await this.getTicket(idTicket, storeId);

    const attachments = await this.prismaService.supportAttachment.findMany({
      where: {
        idTicket,
      },
      include: {
        file: true,
      },
      take: itemsByPage,
      skip: (page - 1) * itemsByPage,
    });

    const totalAttachments = await this.prismaService.supportAttachment.count({
      where: {
        idTicket,
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

    const attachmentsFormatted = await Promise.all(
      attachments.map(async (attachment) => {
        return {
          idAttachment: attachment.id,
          idReply: attachment.idReply,
          url: await this.getUrlAttachment({
            idTicket: idTicket,
            idAttachment: attachment.id,
          }),
          name: attachment.file.name,
          type: attachment.file.type,
          data: attachment.createdAt,
        };
      }),
    );

    return {
      page,
      itemsByPage,
      totalPages: Math.ceil(totalAttachments / itemsByPage),
      attachments: attachmentsFormatted,
    };
  }

  async getAttachment(idTicket: string, storeId: string, idAttachment: string) {
    const attachment = await this.prismaService.supportAttachment.findUnique({
      where: {
        id: idAttachment,
        idTicket,
      },
      include: {
        file: true,
      },
    });

    if (!attachment) {
      throw new AppErrorNotFound('Attachment not found');
    }

    const attachmentFormatted = {
      idAttachment: attachment.id,
      idReply: attachment.idReply,
      url: await this.getUrlAttachment({
        idTicket: idTicket,
        idAttachment: attachment.id,
      }),
      name: attachment.file.name,
      type: attachment.file.type,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };

    return attachmentFormatted;
  }
}
