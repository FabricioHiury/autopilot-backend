import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { EditTaskDto } from './dto/edit-task.dto';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { AppErrorNotFound } from 'src/utils/errors/app-errors';
import { EventService } from '../events/event.service';
import { DealTask } from '@prisma/client';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { TypesNotificationEnum } from 'src/utils/enum/notifications.enum';

@Injectable()
export class TasksService {
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
    });

    if (!deal) {
      throw new AppErrorNotFound('None deal with this ID was found');
    }

    return deal;
  }

  private async getEmployeeById(employeeId: string, storeId: string) {
    const employee = await this.prismaService.employee.findFirst({
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

  private async emitEventsEditingTask(
    task: DealTask & { employee: { name: string } },
    dealId: string,
    nameUserLoggedIn: string,
    data: EditTaskDto,
  ) {
    if (data.name) {
      this.eventService.emitTaskNameChanged({
        dealId,
        userId: nameUserLoggedIn,
        dataPrevious: {
          name: task.name,
        },
        dataNew: {
          name: data.name,
        },
        context: {
          details: {
            action: 'task_name_changed',
            task: task.name,
          },
        },
      });
    }

    if (data.notes) {
      this.eventService.emitTaskNotesChanged({
        dealId,
        userId: nameUserLoggedIn,
        dataPrevious: {
          notes: task.notes,
        },
        dataNew: {
          notes: data.notes,
        },
        context: {
          details: {
            action: 'task_notes_changed',
            task: task.name,
          },
        },
      });
    }

    if (data.assigneeId) {
      const nameAssignee = await this.prismaService.employee.findUnique({
        where: {
          id: data.assigneeId,
        },
        select: {
          name: true,
        },
      });

      this.eventService.emitTaskAssigneeChanged({
        dealId,
        userId: nameUserLoggedIn,
        dataPrevious: {
          assigneeId: task.assigneeId,
          nameAssignee: task.employee?.name,
        },
        dataNew: {
          assigneeId: data.assigneeId,
          nameAssignee: nameAssignee,
        },
        context: {
          details: {
            action: 'task_assignee_changed',
            task: task.name,
          },
        },
      });
    }

    if (data.hourStart) {
      this.eventService.emitTaskHourStartChanged({
        dealId,
        userId: nameUserLoggedIn,
        dataPrevious: {
          hourStart: task.hourStart,
        },
        dataNew: {
          hourStart: data.hourStart,
        },
        context: {
          details: {
            action: 'task_hour_start_changed',
            task: task.name,
          },
        },
      });
    }

    if (data.hourEnd) {
      this.eventService.emitTaskHourEndChanged({
        dealId,
        userId: nameUserLoggedIn,
        dataPrevious: {
          hourEnd: task.hourEnd,
        },
        dataNew: {
          hourEnd: data.hourEnd,
        },
        context: {
          details: {
            action: 'task_hour_end_changed',
            task: task.name,
          },
        },
      });
    }

    if (data.data) {
      this.eventService.emitTaskDataChanged({
        dealId,
        userId: nameUserLoggedIn,
        dataPrevious: {
          data: task.data,
        },
        dataNew: {
          data: data.data,
        },
        context: {
          details: {
            action: 'task_data_changed',
            task: task.name,
          },
        },
      });
    }
  }

  private async createNotificationTaskDay(task: DealTask) {
    try {
      const employee = await this.prismaService.employee.findUnique({
        where: {
          id: task.assigneeId,
        },
        select: {
          userId: true,
        },
      });

      if (!employee?.userId) return;

      let hourFormatted = '';
      if (task.hourStart) {
        const [hours, minutes] = task.hourStart.split(':');
        const hoursFormatted = hours.padStart(2, '0');
        const minutesFormatted = minutes ? minutes.padStart(2, '0') : '00';
        hourFormatted = ` às ${hoursFormatted}:${minutesFormatted}`;
      }

      await this.notificationsService.createNewNotification({
        userId: employee.userId,
        idReference: task.dealId,
        type: TypesNotificationEnum.TASKS_DAY,
        message: `You have a task "${task.name}" scheduled for today ${hourFormatted}`,
      });
    } catch (error) {
      console.error('Failed to create notification of task of day:', error);
    }
  }

  private async createNotificationTaskCompleted(
    task: DealTask,
    completed: boolean,
  ) {
    if (!completed) return;

    try {
      const employee = await this.prismaService.employee.findUnique({
        where: {
          id: task.assigneeId,
        },
        select: {
          userId: true,
        },
      });

      if (!employee?.userId) return;

      await this.notificationsService.createNewNotification({
        userId: employee.userId,
        idReference: task.dealId,
        type: TypesNotificationEnum.TASK_COMPLETED,
        message: `A task "${task.name}" was completed`,
      });
    } catch (error) {
      console.error('Failed to create notification of task completed:', error);
    }
  }

  private checkTaskForToday(data: Date): boolean {
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

  async createTask(
    userId: string,
    createTaskDto: CreateTaskDto,
    dealId: string,
    storeId: string,
  ) {
    await this.getDealById(dealId, storeId);
    await this.getEmployeeById(createTaskDto.assigneeId, storeId);

    const taskCreated = await this.prismaService.dealTask.create({
      data: {
        ...createTaskDto,
        dealId,
      },
    });

    const nameUserLoggedIn = await this.getNameUserById(userId);

    this.eventService.emitTaskCreated({
      dealId,
      userId,
      nameUser: nameUserLoggedIn,
      dataNew: {
        name: createTaskDto.name,
        notes: createTaskDto.notes,
        data: createTaskDto.data,
        assigneeId: createTaskDto.assigneeId,
      },
      context: {
        details: {
          action: 'task_created',
          taskName: createTaskDto.name,
        },
      },
    });

    if (this.checkTaskForToday(taskCreated.data)) {
      await this.createNotificationTaskDay(taskCreated);
    }

    const employee = await this.prismaService.employee.findUnique({
      where: {
        id: createTaskDto.assigneeId,
      },
      select: {
        userId: true,
      },
    });

    if (employee?.userId) {
      await this.notificationsService.createNewNotification({
        userId: employee.userId,
        idReference: dealId,
        type: TypesNotificationEnum.TASK_CREATED,
        message: `Uma new task "${taskCreated.name}" was assigned a you`,
      });
    }

    return taskCreated;
  }

  async listTasks(dealId: string, storeId: string) {
    await this.getDealById(dealId, storeId);

    return this.prismaService.dealTask.findMany({
      where: {
        dealId,
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                name: true,
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        data: 'asc',
      },
    });
  }

  async getTask(idTask: string) {
    const task = await this.prismaService.dealTask.findUnique({
      where: {
        id: idTask,
      },
      include: {
        deal: {
          select: {
            storeId: true,
          },
        },
      },
    });

    if (!task) {
      throw new AppErrorNotFound('No task with this ID was found');
    }

    return task;
  }

  async editTask(userId: string, idTask: string, data: EditTaskDto) {
    const task = await this.getTask(idTask);

    if (data.assigneeId) {
      await this.getEmployeeById(data.assigneeId, task.deal.storeId);
    }

    const taskEdited = await this.prismaService.dealTask.update({
      where: {
        id: idTask,
      },
      data: { ...data },
      include: {
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    const nameUserLoggedIn = await this.getNameUserById(userId);

    this.emitEventsEditingTask(taskEdited, task.dealId, nameUserLoggedIn, data);

    return taskEdited;
  }

  async updateStatusTask(userId: string, idTask: string) {
    const task = await this.getTask(idTask);

    const taskChanged = await this.prismaService.dealTask.update({
      where: {
        id: idTask,
      },
      data: {
        completed: !task.completed,
      },
    });

    const nameUserLoggedIn = await this.getNameUserById(userId);

    this.eventService.emitTaskCompleted({
      dealId: task.dealId,
      userId,
      nameUser: nameUserLoggedIn,
      dataPrevious: { completed: task.completed },
      dataNew: { completed: taskChanged.completed },
      context: {
        details: {
          action: taskChanged.completed ? 'task_completed' : 'task_reaberta',
          taskName: task.name,
        },
      },
    });

    await this.createNotificationTaskCompleted(
      taskChanged,
      taskChanged.completed,
    );

    return taskChanged;
  }

  async deleteTask(idTask: string, userId: string) {
    await this.getTask(idTask);

    const task = await this.prismaService.dealTask.delete({
      where: {
        id: idTask,
      },
    });

    const nameUserLoggedIn = await this.getNameUserById(userId);

    this.eventService.emitTaskDeleted({
      dealId: task.dealId,
      userId,
      nameUser: nameUserLoggedIn,
      dataPrevious: {
        name: task.name,
        notes: task.notes,
        data: task.data,
        completed: task.completed,
      },
      context: {
        details: {
          action: 'task_deleted',
          taskName: task.name,
        },
      },
    });

    return task;
  }

  /**
   * Método for ser executed by um job scheduled diariamente
   * Cria notificações for all as tasks scheduled for o day current
   */
  async createNotificationsTasksOfDay() {
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

    const tasksToday = await this.prismaService.dealTask.findMany({
      where: {
        data: {
          gte: startToday,
          lte: endToday,
        },
        completed: false,
      },
    });

    for (const task of tasksToday) {
      await this.createNotificationTaskDay(task);
    }

    return {
      message: `Notifications criadas for ${tasksToday.length} tasks scheduled for today (${dataToday}).`,
    };
  }
}
