import { Injectable } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { LogActivitiesService } from '../log-activities/log-activities.service';

export interface DealEventData {
  dealId: string;
  userId?: string;
  nameUser?: string;
  dataPrevious?: any;
  dataNew?: any;
  operation:
    | 'create'
    | 'edit'
    | 'archive'
    | 'unarchive'
    | 'comentar'
    | 'task'
    | 'visit'
    | 'suspension'
    | 'distribution';
  entity:
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
export class EventService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logActivitiesService: LogActivitiesService,
  ) {
    console.log('🚀 EventService initialized');
    console.log('🔍 EventEmitter available:', !!this.eventEmitter);
  }

  @OnEvent('deal.created')
  async handleDealCreated(data: DealEventData) {
    try {
      console.log('🎯 Listener deal.created received:', data);
      await this.logActivitiesService.registerLogAutomatic({
        dealId: data.dealId,
        userId: data.userId,
        nameUser: data.nameUser,
        dataPrevious: data.dataPrevious,
        dataNew: data.dataNew,
        operation: data.operation,
        entity: data.entity,
        context: data.context,
      });
    } catch (error) {
      console.error('❌ Error in listener deal.created:', error);
    }
  }

  @OnEvent('deal.edited')
  async handleDealEdited(data: DealEventData) {
    try {
      console.log('🎯 Listener deal.edited received:', data);
      await this.logActivitiesService.registerLogAutomatic({
        dealId: data.dealId,
        userId: data.userId,
        nameUser: data.nameUser,
        dataPrevious: data.dataPrevious,
        dataNew: data.dataNew,
        operation: data.operation,
        entity: data.entity,
        context: data.context,
      });
    } catch (error) {
      console.error('❌ Error in listener deal.edited:', error);
    }
  }

  @OnEvent('deal.archived')
  async handleDealArchived(data: DealEventData) {
    try {
      console.log('🎯 Listener deal.archived received:', data);
      await this.logActivitiesService.registerLogAutomatic({
        dealId: data.dealId,
        userId: data.userId,
        nameUser: data.nameUser,
        dataPrevious: data.dataPrevious,
        dataNew: data.dataNew,
        operation: data.operation,
        entity: data.entity,
        context: data.context,
      });
    } catch (error) {
      console.error('❌ Error in listener deal.archived:', error);
    }
  }

  @OnEvent('deal.unarchived')
  async handleDealUnarchived(data: DealEventData) {
    try {
      console.log('🎯 Listener deal.unarchived received:', data);
      await this.logActivitiesService.registerLogAutomatic({
        dealId: data.dealId,
        userId: data.userId,
        nameUser: data.nameUser,
        dataPrevious: data.dataPrevious,
        dataNew: data.dataNew,
        operation: data.operation,
        entity: data.entity,
        context: data.context,
      });
    } catch (error) {
      console.error('❌ Error in listener deal.unarchived:', error);
    }
  }

  @OnEvent('deal.comment')
  async handleCommentCreated(data: DealEventData) {
    try {
      console.log('🎯 Listener deal.comment received:', data);
      await this.logActivitiesService.registerLogAutomatic({
        dealId: data.dealId,
        userId: data.userId,
        nameUser: data.nameUser,
        dataPrevious: data.dataPrevious,
        dataNew: data.dataNew,
        operation: data.operation,
        entity: data.entity,
        context: data.context,
      });
    } catch (error) {
      console.error('❌ Error in listener deal.comment:', error);
    }
  }

  @OnEvent('deal.task')
  async handleTaskCreated(data: DealEventData) {
    try {
      console.log('🎯 Listener deal.task received:', data);
      await this.logActivitiesService.registerLogAutomatic({
        dealId: data.dealId,
        userId: data.userId,
        nameUser: data.nameUser,
        dataPrevious: data.dataPrevious,
        dataNew: data.dataNew,
        operation: data.operation,
        entity: data.entity,
        context: data.context,
      });
    } catch (error) {
      console.error('❌ Error in listener deal.task:', error);
    }
  }

  @OnEvent('deal.task.edited')
  async handleTaskEdited(eventData: DealEventData) {
    console.log('🎯 Task edited:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of editing of task:', error);
    }
  }

  @OnEvent('deal.task.completed')
  async handleTaskCompleted(eventData: DealEventData) {
    console.log('🎯 Task completed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of completion of task:', error);
    }
  }

  @OnEvent('deal.task.deleted')
  async handleTaskDeleted(eventData: DealEventData) {
    console.log('🎯 Task deleted:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of deletion of task:', error);
    }
  }

  @OnEvent('deal.suspension.created')
  async handleSuspensionCreated(eventData: DealEventData) {
    console.log('🎯 Suspension created:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of suspension:', error);
    }
  }

  @OnEvent('deal.suspension.updated')
  async handleSuspensionUpdated(eventData: DealEventData) {
    console.log('🎯 Suspension updated:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of update of suspension:',
        error,
      );
    }
  }

  @OnEvent('deal.suspension.removed')
  async handleSuspensionRemoved(eventData: DealEventData) {
    console.log('🎯 Suspension removed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of removal of suspension:',
        error,
      );
    }
  }

  @OnEvent('deal.distribution.configured')
  async handleDistributionConfigured(eventData: DealEventData) {
    console.log('🎯 Distribution configured:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of configuration of distribution:',
        error,
      );
    }
  }

  @OnEvent('deal.distribution.redistributed')
  async handleDealsRedistributed(eventData: DealEventData) {
    console.log('🎯 Deals redistributed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of redistribution:', error);
    }
  }

  @OnEvent('deal.distribution.monitoring')
  async handleMonitoringExecuted(eventData: DealEventData) {
    console.log('🎯 Monitoring executed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of monitoring:', error);
    }
  }

  @OnEvent('deal.archived.automatic')
  async handleDealsArchivedAutomatically(eventData: DealEventData) {
    console.log('🎯 Deals archived automatically:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of archiving automatic:',
        error,
      );
    }
  }

  @OnEvent('deal.visit.created')
  async handleVisitCreated(eventData: DealEventData) {
    console.log('🎯 Visit created:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of visit:', error);
    }
  }

  @OnEvent('deal.visit.completed')
  async handleVisitCompleted(eventData: DealEventData) {
    console.log('🎯 Visit completed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of completion of visit:',
        error,
      );
    }
  }

  @OnEvent('deal.visit.deleted')
  async handleVisitDeleted(eventData: DealEventData) {
    console.log('🎯 Visit deleted:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of deletion of visit:', error);
    }
  }

  @OnEvent('deal.share.created')
  async handleShareCreated(eventData: DealEventData) {
    console.log('🎯 Share created:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of share:', error);
    }
  }

  @OnEvent('deal.share.removed')
  async handleShareRemoved(eventData: DealEventData) {
    console.log('🎯 Share removed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error('❌ Failed to process event of removal of share:', error);
    }
  }

  @OnEvent('deal.task.name.changed')
  async handleTaskNameChanged(eventData: DealEventData) {
    console.log('🎯 Name of task changed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of change of name of task:',
        error,
      );
    }
  }

  @OnEvent('deal.task.notes.changed')
  async handleTaskNotesChanged(eventData: DealEventData) {
    console.log('🎯 Notes of task changed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of change of notes of task:',
        error,
      );
    }
  }

  @OnEvent('deal.task.assignee.changed')
  async handleTaskAssigneeChanged(eventData: DealEventData) {
    console.log('🎯 Assignee of task changed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of change of assignee of task:',
        error,
      );
    }
  }

  @OnEvent('deal.task.hour.start.changed')
  async handleTaskHourStartChanged(eventData: DealEventData) {
    console.log('🎯 Start time of task changed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of change of hour of start of task:',
        error,
      );
    }
  }

  @OnEvent('deal.task.hour.end.changed')
  async handleTaskHourEndChanged(eventData: DealEventData) {
    console.log('🎯 Hour of end of task changed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of change of hour of end of task:',
        error,
      );
    }
  }

  @OnEvent('deal.task.data.changed')
  async handleTaskDataChanged(eventData: DealEventData) {
    console.log('🎯 Data of task changed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of change of data of task:',
        error,
      );
    }
  }

  emitDealCreated(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.created', {
      ...data,
      operation: 'create',
      entity: 'deal',
    });
  }

  emitDealEdited(data: Omit<DealEventData, 'operation' | 'entity'>) {
    console.log('📤 Emitting event deal.edited:', data);

    const eventData = {
      ...data,
      operation: 'edit' as const,
      entity: 'deal' as const,
    };

    try {
      const result = this.eventEmitter.emit('deal.edited', eventData);
      console.log('✅ Event emitted - result:', result);
    } catch (error) {
      console.error('❌ Failed to emit event:', error);
    }
  }

  emitDealArchived(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.archived', {
      ...data,
      operation: 'archive',
      entity: 'deal',
    });
  }
  emitDealUnarchived(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.unarchived', {
      ...data,
      operation: 'unarchive',
      entity: 'deal',
    });
  }

  emitCommentCreated(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.comment', {
      ...data,
      operation: 'comentar',
      entity: 'comment',
    });
  }

  emitTaskCreated(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitSuspensionCreated(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.suspension.created', {
      ...data,
      operation: 'suspension',
      entity: 'suspension',
    });
  }

  emitSuspensionUpdated(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.suspension.updated', {
      ...data,
      operation: 'suspension',
      entity: 'suspension',
    });
  }

  emitSuspensionRemoved(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.suspension.removed', {
      ...data,
      operation: 'suspension',
      entity: 'suspension',
    });
  }

  emitDistributionConfigured(
    data: Omit<DealEventData, 'operation' | 'entity'>,
  ) {
    this.eventEmitter.emit('deal.distribution.configured', {
      ...data,
      operation: 'distribution',
      entity: 'distribution',
    });
  }

  emitDealsRedistributed(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.distribution.redistributed', {
      ...data,
      operation: 'distribution',
      entity: 'distribution',
    });
  }

  emitMonitoringExecuted(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.distribution.monitoring', {
      ...data,
      operation: 'distribution',
      entity: 'distribution',
    });
  }

  emitDealsArchivedAutomatically(
    data: Omit<DealEventData, 'operation' | 'entity'>,
  ) {
    this.eventEmitter.emit('deal.archived.automatic', {
      ...data,
      operation: 'archive',
      entity: 'deal',
    });
  }

  emitVisitCreated(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.visit.created', {
      ...data,
      operation: 'visit',
      entity: 'visit',
    });
  }

  emitVisitCompleted(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.visit.completed', {
      ...data,
      operation: 'visit',
      entity: 'visit',
    });
  }

  @OnEvent('deal.visit.confirmed')
  async handleVisitConfirmed(eventData: DealEventData) {
    console.log('🎯 Visit confirmed:', eventData);
    try {
      await this.logActivitiesService.registerLogAutomatic(eventData);
    } catch (error) {
      console.error(
        '❌ Failed to process event of confirmation of visit:',
        error,
      );
    }
  }

  emitVisitConfirmed(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.visit.confirmed', {
      ...data,
      operation: 'visit',
      entity: 'visit',
    });
  }

  emitVisitDeleted(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.visit.deleted', {
      ...data,
      operation: 'visit',
      entity: 'visit',
    });
  }

  emitTaskEdited(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.edited', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitTaskCompleted(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.completed', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitTaskDeleted(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.deleted', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitShareCreated(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.share.created', {
      ...data,
      operation: 'comentar',
      entity: 'comment',
    });
  }

  emitShareRemoved(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.share.removed', {
      ...data,
      operation: 'comentar',
      entity: 'comment',
    });
  }

  emitTaskNameChanged(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.name.changed', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitTaskNotesChanged(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.notes.changed', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitTaskAssigneeChanged(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.assignee.changed', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitTaskHourStartChanged(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.hour.start.changed', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitTaskHourEndChanged(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.hour.end.changed', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }

  emitTaskDataChanged(data: Omit<DealEventData, 'operation' | 'entity'>) {
    this.eventEmitter.emit('deal.task.data.changed', {
      ...data,
      operation: 'task',
      entity: 'task',
    });
  }
}
