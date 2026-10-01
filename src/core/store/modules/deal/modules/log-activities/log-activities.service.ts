import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { TYPE_EVENT_LOG } from '../../utils/log-activities.enum';
import {
  STATUS_DEAL_MAP,
  REASONS_LOSS_MAP,
  SUB_REASONS_LOSS_MAP,
} from 'src/utils/enum/deal.enum';

export interface LogActivityAutomaticParams {
  dealId: string;
  userId?: string;
  nameUser?: string;
  dataPrevious?: any;
  dataNew?: any;
  operation?:
    | 'create'
    | 'edit'
    | 'archive'
    | 'unarchive'
    | 'comentar'
    | 'task'
    | 'visit'
    | 'suspension'
    | 'distribution';
  entity?:
    | 'deal'
    | 'task'
    | 'visit'
    | 'comment'
    | 'customer'
    | 'suspension'
    | 'distribution';
  context?: {
    details?: any;
  };
}

@Injectable()
export class LogActivitiesService {
  private readonly logger = new Logger(LogActivitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registerLogAutomatic(
    params: LogActivityAutomaticParams,
  ): Promise<void> {
    console.log('📝 Starting record of log automatic:', params);
    try {
      const events = this.detectEvents(params);
      console.log('🔍 Events detected:', events.length);

      for (const event of events) {
        console.log('💾 Recording event:', event);
        await this.registerLog(event);
      }
    } catch (error) {
      this.logger.error(
        `Failed to register log automatic: ${error.message}`,
        error.stack,
      );
      console.error('❌ Error detailed:', error);
    }
  }

  private detectEvents(params: LogActivityAutomaticParams): Array<{
    dealId: string;
    userId?: string;
    typeEvent: TYPE_EVENT_LOG;
    message: string;
    dataPrevious?: any;
    dataNew?: any;
  }> {
    const events = [];
    const {
      dealId,
      userId,
      nameUser,
      dataPrevious,
      dataNew,
      context,
      operation,
      entity,
    } = params;

    if (operation === 'create') {
      if (entity === 'deal') {
        events.push({
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.CREATION,
          message: `Deal created by ${nameUser || 'user'}`,
          dataNew,
        });
      } else if (entity === 'comment') {
        const commentTruncated =
          dataNew?.comment?.length > 50
            ? dataNew.comment.substring(0, 50) + '...'
            : dataNew?.comment;

        events.push({
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.ADDITION_COMMENT,
          message: `Comment adicionado by ${nameUser || 'user'}: "${commentTruncated}"`,
          dataNew,
        });
      }
      return events;
    }

    if (operation === 'task' && context?.details?.action === 'task_created') {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.CREATION_TASK,
        message: `Task "${dataNew?.name || 'New task'}" created by ${nameUser || 'user'}`,
        dataNew,
      });
    }

    if (
      operation === 'visit' &&
      context?.details?.action === 'visit_scheduled'
    ) {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.SCHEDULING_VISIT,
        message: `Visit scheduled for ${dataNew?.data} by ${nameUser || 'user'}`,
        dataNew,
      });
    }

    if (
      operation === 'visit' &&
      context?.details?.action === 'visit_confirmed'
    ) {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.CONFIRMATION_VISIT,
        message: `Visit confirmed by ${nameUser || 'user'}`,
        dataNew,
      });
    }

    if (operation === 'archive') {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.ARCHIVING,
        message: `Deal archived by ${nameUser || 'user'}`,
        dataNew: { isArchived: true },
      });
      return events;
    }

    if (operation === 'unarchive') {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.UNARCHIVING,
        message: `Deal unarchived by ${nameUser || 'user'}`,
        dataNew: { isArchived: false },
      });
      return events;
    }

    if (operation === 'edit' && entity === 'deal') {
      if (dataPrevious && dataNew) {
        const changes = this.compareData(dataPrevious, dataNew);

        for (const change of changes) {
          const event = this.createEventByChange(
            change,
            dealId,
            userId,
            nameUser,
            context,
          );
          if (event) {
            events.push(event);
          }
        }
      }

      if (events.length === 0) {
        events.push({
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.CHANGE_STATUS,
          message: `Deal edited by ${nameUser || 'user'}`,
          dataPrevious,
          dataNew,
        });
      }

      return events;
    }

    if (entity === 'task' && context?.details?.action) {
      const action = context.details.action;
      const taskName = context.details.task || dataNew?.name || 'task';

      switch (action) {
        case 'task_name_changed':
          events.push({
            dealId,
            userId,
            typeEvent: TYPE_EVENT_LOG.CHANGE_NAME_TASK,
            message: `Name of task changed of "${dataPrevious?.name}" for "${dataNew?.name}" by ${nameUser || 'user'}`,
            dataPrevious,
            dataNew,
          });
          break;

        case 'task_notes_changed':
          const notesOld = dataPrevious?.notes || 'without notes';
          const notesNew =
            dataNew?.notes?.length > 50
              ? dataNew.notes.substring(0, 50) + '...'
              : dataNew?.notes;

          events.push({
            dealId,
            userId,
            typeEvent: TYPE_EVENT_LOG.CHANGE_NOTES_TASK,
            message: `Notes of task "${taskName}" changed by ${nameUser || 'user'}`,
            dataPrevious,
            dataNew,
          });
          break;

        case 'task_assignee_changed':
          const assigneeOld = dataPrevious?.nameAssignee || 'without assignee';
          const assigneeNew = dataNew?.nameAssignee?.name || 'without assignee';

          events.push({
            dealId,
            userId,
            typeEvent: TYPE_EVENT_LOG.CHANGE_ASSIGNEE_TASK,
            message: `Assignee of task "${taskName}" changed of "${assigneeOld}" for "${assigneeNew}" by ${nameUser || 'user'}`,
            dataPrevious,
            dataNew,
          });
          break;

        case 'task_hour_start_changed':
          events.push({
            dealId,
            userId,
            typeEvent: TYPE_EVENT_LOG.CHANGE_HOUR_START_TASK,
            message: `Start time of task "${taskName}" changed for ${dataNew?.hourStart}h by ${nameUser || 'user'}`,
            dataPrevious,
            dataNew,
          });
          break;

        case 'task_hour_end_changed':
          events.push({
            dealId,
            userId,
            typeEvent: TYPE_EVENT_LOG.CHANGE_HOUR_END_TASK,
            message: `Hour of end of task "${taskName}" changed for ${dataNew?.hourEnd}h by ${nameUser || 'user'}`,
            dataPrevious,
            dataNew,
          });
          break;

        case 'task_data_changed':
          const dataFormatted = new Date(dataNew?.data).toLocaleDateString(
            'pt-BR',
            {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            },
          );

          events.push({
            dealId,
            userId,
            typeEvent: TYPE_EVENT_LOG.CHANGE_DATA_TASK,
            message: `Data of task "${taskName}" changed for ${dataFormatted} by ${nameUser || 'user'}`,
            dataPrevious,
            dataNew,
          });
          break;
      }
    }

    if (dataPrevious && dataNew) {
      const changes = this.compareData(dataPrevious, dataNew);

      for (const change of changes) {
        const event = this.createEventByChange(
          change,
          dealId,
          userId,
          nameUser,
          context,
        );
        if (event) {
          events.push(event);
        }
      }
    }

    if (context?.details?.assigneesAdded?.length > 0) {
      for (const assignee of context.details.assigneesAdded) {
        events.push({
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.ASSIGNMENT_ASSIGNEE,
          message: `${assignee.name} was assigned the assignee by ${nameUser || 'user'}`,
          dataNew: { assignee: assignee.name },
        });
      }
    }

    if (context?.details?.assigneesRemoved?.length > 0) {
      for (const assignee of context.details.assigneesRemoved) {
        events.push({
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.REMOVAL_ASSIGNEE,
          message: `${assignee.name} was removed the assignee by ${nameUser || 'user'}`,
          dataPrevious: { assignee: assignee.name },
        });
      }
    }

    if (entity === 'task' && dataNew?.completed === true) {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.COMPLETION_TASK,
        message: `Task "${dataNew.name || 'task'}" completed by ${nameUser || 'user'}`,
        dataNew,
      });
    }

    if (entity === 'visit' && dataNew?.completed === true) {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.COMPLETION_VISIT,
        message: `Visit completed by ${nameUser || 'user'}`,
        dataNew,
      });
    }

    if (entity === 'task' && context?.details?.action === 'task_deleted') {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.REMOVAL_TASK,
        message: `Task "${context.details.taskName || 'task'}" removed by ${nameUser || 'user'}`,
        dataPrevious,
      });
    }

    if (entity === 'visit' && context?.details?.action === 'visit_deleted') {
      events.push({
        dealId,
        userId,
        typeEvent: TYPE_EVENT_LOG.REMOVAL_VISIT,
        message: `Visit of ${context.details.typeVisit} removed by ${nameUser || 'user'}`,
        dataPrevious,
      });
    }

    return events;
  }

  private createEventByChange(
    change: { field: string; valueOld: any; valueNew: any },
    dealId: string,
    userId?: string,
    nameUser?: string,
    context?: any,
  ) {
    const { field, valueOld, valueNew } = change;

    switch (field) {
      case 'status':
        const statusOld = STATUS_DEAL_MAP[valueOld] || valueOld;
        const statusNew = STATUS_DEAL_MAP[valueNew] || valueNew;
        let messageStatus = `Status changed of "${statusOld}" for "${statusNew}" by ${nameUser || 'user'}`;

        const dataNewStatus: any = { status: valueNew };

        if (valueNew === 'lost' && context?.details?.lostReason) {
          const reasonReadable =
            REASONS_LOSS_MAP[context.details.lostReason] ||
            context.details.lostReason;
          messageStatus += `. Reason: ${reasonReadable}`;

          dataNewStatus.reason = reasonReadable;

          if (context.details.subLostReason) {
            const subReasonReadable =
              SUB_REASONS_LOSS_MAP[context.details.subLostReason] ||
              context.details.subLostReason;
            messageStatus += ` - ${subReasonReadable}`;

            dataNewStatus.subReason = subReasonReadable;
          }
        }

        return {
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.CHANGE_STATUS,
          message: messageStatus,
          dataPrevious: { status: valueOld },
          dataNew: dataNewStatus,
        };

      case 'title':
        return {
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.CHANGE_TITLE,
          message: `Title changed of "${valueOld}" for "${valueNew}" by ${nameUser || 'user'}`,
          dataPrevious: { title: valueOld },
          dataNew: { title: valueNew },
        };

      case 'note':
        const noteOldTruncated =
          valueOld?.length > 30
            ? valueOld.substring(0, 30) + '...'
            : valueOld || 'vazia';
        const noteNewTruncated =
          valueNew?.length > 30
            ? valueNew.substring(0, 30) + '...'
            : valueNew || 'vazia';

        return {
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.CHANGE_NOTE,
          message: `Observação changed of "${noteOldTruncated}" for "${noteNewTruncated}" by ${nameUser || 'user'}`,
          dataPrevious: { note: valueOld },
          dataNew: { note: valueNew },
        };

      case 'temperature':
        return {
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.CHANGE_TEMPERATURE,
          message: `Temperature changed of "${valueOld}" for "${valueNew}" by ${nameUser || 'user'}`,
          dataPrevious: { temperature: valueOld },
          dataNew: { temperature: valueNew },
        };

      case 'dealMode':
        return {
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.CHANGE_TYPE_DEAL,
          message: `Type of deal changed of "${valueOld}" for "${valueNew}" by ${nameUser || 'user'}`,
          dataPrevious: { type: valueOld },
          dataNew: { type: valueNew },
        };

      case 'name':
      case 'email':
      case 'whatsapp':
        return {
          dealId,
          userId,
          typeEvent: TYPE_EVENT_LOG.CHANGE_DATA_CUSTOMER,
          message: `Data of customer alterados by ${nameUser || 'user'}: ${field} of "${valueOld}" for "${valueNew}"`,
          dataPrevious: { [field]: valueOld },
          dataNew: { [field]: valueNew },
        };

      default:
        return null;
    }
  }

  private async registerLog(params: {
    dealId: string;
    userId?: string;
    typeEvent: TYPE_EVENT_LOG;
    message: string;
    dataPrevious?: any;
    dataNew?: any;
  }): Promise<void> {
    await this.prisma.dealActivityLog.create({
      data: {
        dealId: params.dealId,
        userId: params.userId,
        typeEvent: params.typeEvent,
        message: params.message,
        dataPrevious: params.dataPrevious,
        dataNew: params.dataNew,
      },
    });

    this.logger.log(`Log registrado: ${params.typeEvent} - ${params.message}`);
  }

  async listLogsDeal(dealId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.dealActivityLog.findMany({
        where: { dealId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.dealActivityLog.count({
        where: { dealId },
      }),
    ]);

    if (!logs.length) {
      return {
        logs: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private compareData(
    dataPrevious: any,
    dataNew: any,
  ): Array<{ field: string; valueOld: any; valueNew: any }> {
    const changes = [];
    const fields = new Set([
      ...Object.keys(dataPrevious || {}),
      ...Object.keys(dataNew || {}),
    ]);

    for (const field of fields) {
      const valueOld = dataPrevious?.[field];
      const valueNew = dataNew?.[field];

      if (typeof valueOld === 'string' && typeof valueNew === 'string') {
        if (valueOld.trim() !== valueNew.trim()) {
          changes.push({
            field,
            valueOld,
            valueNew,
          });
        }
      } else if (JSON.stringify(valueOld) !== JSON.stringify(valueNew)) {
        changes.push({
          field,
          valueOld,
          valueNew,
        });
      }
    }

    return changes;
  }
}
