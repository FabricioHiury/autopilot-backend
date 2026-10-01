import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CreateSuspensionDto } from './dto/create-suspension.dto';
import { UpdateSuspensionDto } from './dto/update-suspension.dto';
import { FilterSuspensionDto } from './dto/filter-suspension.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventService } from '../events/event.service';

@Injectable()
export class SuspensionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly eventService: EventService,
  ) {}

  async update(id: string, data: UpdateSuspensionDto) {
    const suspensionExists = await this.prisma.dealSuspension.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!suspensionExists) {
      throw new NotFoundException(`Suspension with ID ${id} not found`);
    }

    const userOldId = suspensionExists.userId;

    if (data.userId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!userExists) {
        throw new NotFoundException(`User with ID ${data.userId} not found`);
      }
    }

    const suspensionUpdated = await this.prisma.$transaction(async (tx) => {
      return tx.dealSuspension.update({
        where: { id },
        data: {
          userId: data.userId,
          description: data.description,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    this.eventService.emitSuspensionUpdated({
      dealId: '',
      userId: data.userId || userOldId,
      nameUser: suspensionUpdated.user.name,
      dataPrevious: suspensionExists,
      dataNew: suspensionUpdated,
      context: {
        details: {
          suspensionId: id,
          description: data.description,
          period: {
            start: data.startDate,
            end: data.endDate,
          },
        },
      },
    });

    await this.invalidateCacheUser(userOldId);
    if (data.userId && data.userId !== userOldId) {
      await this.invalidateCacheUser(data.userId);
    }

    return suspensionUpdated;
  }

  async create(data: CreateSuspensionDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        name: true,
      },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }

    const suspension = await this.prisma.$transaction(async (tx) => {
      return tx.dealSuspension.create({
        data: {
          userId: data.userId,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    this.eventService.emitSuspensionCreated({
      dealId: '',
      userId: data.userId,
      nameUser: userExists.name,
      dataNew: suspension,
      context: {
        details: {
          suspensionId: suspension.id,
          description: data.description,
          period: {
            start: data.startDate,
            end: data.endDate,
          },
        },
      },
    });

    await this.invalidateCacheUser(data.userId);

    return suspension;
  }

  async remove(id: string) {
    const suspensionExists = await this.prisma.dealSuspension.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            employee: {
              where: { status: 'active' },
              select: {
                id: true,
                storeId: true,
                roles: {
                  select: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!suspensionExists) {
      throw new NotFoundException(`Suspension with ID ${id} not found`);
    }

    const userId = suspensionExists.userId;
    const employee = suspensionExists.user.employee[0];

    const result = await this.prisma.$transaction(async (tx) => {
      return tx.dealSuspension.delete({
        where: { id },
      });
    });

    this.eventService.emitSuspensionRemoved({
      dealId: '',
      userId: userId,
      nameUser: suspensionExists.user.employee[0]?.name || 'User not found',
      dataPrevious: suspensionExists,
      context: {
        details: {
          suspensionId: id,
          description: suspensionExists.description,
        },
      },
    });

    if (employee) {
      await this.defineOffsetBalancing(
        employee.id,
        employee.storeId,
        employee.roles,
      );

      await this.defineOffsetBalancingChat(
        employee.id,
        employee.storeId,
        employee.roles,
      );
    }

    await this.invalidateCacheUser(userId);

    return result;
  }

  public async defineOffsetBalancing(
    employeeId: string,
    storeId: string,
    roles: Array<{ role: string }>,
  ) {
    const rolesText = roles.map((c) => c.role.toLowerCase());
    let typeEmployee: 'Pre-salesperson' | 'Salesperson' | undefined;

    if (
      rolesText.some(
        (role) =>
          role.includes('pre-salesperson') || role.includes('pre-salesperson'),
      )
    ) {
      typeEmployee = 'Pre-salesperson';
    } else if (
      rolesText.some(
        (role) => role.includes('salesperson') && !role.includes('pre'),
      )
    ) {
      typeEmployee = 'Salesperson';
    }

    if (!typeEmployee) return;

    const isPreSalesperson = typeEmployee === 'Pre-salesperson';

    const employees = await this.prisma.employee.findMany({
      where: {
        storeId,
        status: 'active',
        id: { not: employeeId },
        user: {
          status: 'active',
          profile: 'user',
        },
        roles: {
          some: {
            role: {
              contains: typeEmployee,
              mode: 'insensitive',
              ...(isPreSalesperson ? {} : { not: { contains: 'Pre' } }),
            },
          },
        },
      },
      select: {
        id: true,
        userId: true,
        _count: {
          select: {
            dealAssignee: {
              where: {
                deal: {
                  status: {
                    in: ['PRE_DEAL', 'AT_DEAL', 'AWAITING_CUSTOMER'],
                  },
                },
              },
            },
          },
        },
      },
    });

    if (employees.length === 0) return;

    const maxDeals = Math.max(...employees.map((c) => c._count.dealAssignee));

    const cacheKey = `balancing:offset:${employeeId}`;
    // 86400 = 24h
    await this.cacheManager.set(cacheKey, maxDeals, 86400);

    const dataKey = `balancing:data:${employeeId}`;
    // 86400 = 24h
    await this.cacheManager.set(dataKey, new Date().toISOString(), 86400);
  }

  async getOffsetBalancing(employeeId: string): Promise<number> {
    const cacheKey = `balancing:offset:${employeeId}`;
    const offset = await this.cacheManager.get<number>(cacheKey);
    return offset || 0;
  }

  async checkUserSuspended(userId: string): Promise<boolean> {
    const cacheKey = `suspension:user:${userId}`;

    const cached = await this.cacheManager.get<boolean>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const now = new Date();

    const suspensionActive = await this.prisma.dealSuspension.findFirst({
      where: {
        userId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    const isSuspended = !!suspensionActive;

    await this.cacheManager.set(cacheKey, isSuspended, 300000);

    return isSuspended;
  }

  async checkANDRemoveOffsetSeRequired(
    employeeId: string,
    storeId: string,
  ): Promise<void> {
    const offset = await this.getOffsetBalancing(employeeId);

    if (offset === 0) return;

    const dataKey = `balancing:data:${employeeId}`;
    const dataCreationStr = await this.cacheManager.get<string>(dataKey);

    if (dataCreationStr) {
      const dataCreation = new Date(dataCreationStr);
      const now = new Date();
      const daysSinceCreation = Math.floor(
        (now.getTime() - dataCreation.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceCreation >= 180) {
        await this.removeOffsetBalancing(employeeId);
        return;
      }

      if (daysSinceCreation < 7) {
        return;
      }
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        _count: {
          select: {
            dealAssignee: {
              where: {
                deal: {
                  status: {
                    in: ['PRE_DEAL', 'AT_DEAL', 'AWAITING_CUSTOMER'],
                  },
                },
              },
            },
          },
        },
        roles: {
          select: { role: true },
        },
      },
    });

    if (!employee) {
      await this.removeOffsetBalancing(employeeId);
      return;
    }

    const rolesText = employee.roles.map((c) => c.role.toLowerCase());
    let typeEmployee: 'Pre-salesperson' | 'Salesperson' | undefined;

    if (
      rolesText.some(
        (role) =>
          role.includes('pre-salesperson') || role.includes('pre-salesperson'),
      )
    ) {
      typeEmployee = 'Pre-salesperson';
    } else if (
      rolesText.some(
        (role) => role.includes('salesperson') && !role.includes('pre'),
      )
    ) {
      typeEmployee = 'Salesperson';
    }

    if (!typeEmployee) {
      await this.removeOffsetBalancing(employeeId);
      return;
    }

    const isPreSalesperson = typeEmployee === 'Pre-salesperson';

    const otherEmployees = await this.prisma.employee.findMany({
      where: {
        storeId,
        status: 'active',
        id: { not: employeeId },
        user: {
          status: 'active',
          profile: 'user',
        },
        roles: {
          some: {
            role: {
              contains: typeEmployee,
              mode: 'insensitive',
              ...(isPreSalesperson ? {} : { not: { contains: 'Pre' } }),
            },
          },
        },
      },
      select: {
        _count: {
          select: {
            dealAssignee: {
              where: {
                deal: {
                  status: {
                    in: ['PRE_DEAL', 'AT_DEAL', 'AWAITING_CUSTOMER'],
                  },
                },
              },
            },
          },
        },
      },
    });

    if (otherEmployees.length === 0) {
      await this.removeOffsetBalancing(employeeId);
      return;
    }

    const dealsActual = employee._count.dealAssignee;
    const dealsOther = otherEmployees.map((c) => c._count.dealAssignee);
    const averageOther =
      dealsOther.reduce((acc, val) => acc + val, 0) / dealsOther.length;
    const maxOther = Math.max(...dealsOther);

    // Critérios for remoção of offset:
    // 1. Atingiu 80% of méday of other
    // 2. Atingiu 70% of máximo of other
    // 3. Está above of méday of other
    const criterion1 = dealsActual >= averageOther * 0.8;
    const criterion2 = dealsActual >= maxOther * 0.7;
    const criterion3 = dealsActual >= averageOther;

    if (criterion1 || criterion2 || criterion3) {
      await this.removeOffsetBalancing(employeeId);
    }
  }

  async removeOffsetBalancing(employeeId: string): Promise<void> {
    const cacheKey = `balancing:offset:${employeeId}`;
    const dataKey = `balancing:data:${employeeId}`;

    await Promise.all([
      this.cacheManager.del(cacheKey),
      this.cacheManager.del(dataKey),
    ]);
  }

  async checkUsersSuspended(idsUsers: string[]): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    const usersForFind: string[] = [];

    for (const userId of idsUsers) {
      const cacheKey = `suspension:user:${userId}`;
      const cached = await this.cacheManager.get<boolean>(cacheKey);

      if (cached !== undefined) {
        result.set(userId, cached);
      } else {
        usersForFind.push(userId);
      }
    }

    if (usersForFind.length > 0) {
      const now = new Date();

      const suspensionsActive = await this.prisma.dealSuspension.findMany({
        where: {
          userId: { in: usersForFind },
          startDate: { lte: now },
          endDate: { gte: now },
        },
        select: { userId: true },
      });

      const usersSuspended = new Set(suspensionsActive.map((s) => s.userId));

      for (const userId of usersForFind) {
        const isSuspended = usersSuspended.has(userId);
        result.set(userId, isSuspended);

        const cacheKey = `suspension:user:${userId}`;
        await this.cacheManager.set(cacheKey, isSuspended, 300000);
      }
    }

    return result;
  }

  private async invalidateCacheUser(userId: string): Promise<void> {
    const cacheKey = `suspension:user:${userId}`;
    await this.cacheManager.del(cacheKey);
  }

  async list(filters: FilterSuspensionDto) {
    const where = this.buildFilters(filters);

    const page = filters.page ? parseInt(filters.page) : 1;
    const itemsPage = filters.itemsPage ? parseInt(filters.itemsPage) : 10;

    return this.prisma.$transaction(async (tx) => {
      const [suspensions, total] = await Promise.all([
        tx.dealSuspension.findMany({
          where,
          skip: (page - 1) * itemsPage,
          take: itemsPage,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        tx.dealSuspension.count({ where }),
      ]);

      return {
        data: suspensions,
        meta: {
          page,
          itemsPage,
          total,
          totalPages: Math.ceil(total / itemsPage),
        },
      };
    });
  }

  async getById(id: string) {
    const suspension = await this.prisma.dealSuspension.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!suspension) {
      throw new NotFoundException(`Suspension with ID ${id} not found`);
    }

    return suspension;
  }

  private buildFilters(filters: FilterSuspensionDto) {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.description) {
      where.description = {
        contains: filters.description,
        mode: 'insensitive',
      };
    }

    const startDateFilter: any = {};

    if (filters.startDateStart) {
      startDateFilter.gte = new Date(filters.startDateStart);
    }

    if (filters.startDateEnd) {
      startDateFilter.lte = new Date(filters.startDateEnd);
    }

    if (Object.keys(startDateFilter).length > 0) {
      where.startDate = startDateFilter;
    }

    if (filters.active === true) {
      const now = new Date();

      if (!where.startDate) {
        where.startDate = { lte: now };
      }

      where.endDate = { gte: now };
    }

    return where;
  }

  public async defineOffsetBalancingChat(
    employeeId: string,
    storeId: string,
    roles: Array<{ role: string }>,
  ): Promise<void> {
    const textRoles = roles.map((c) => c.role.toLowerCase());
    const type: 'Pre-salesperson' | 'Salesperson' | undefined = textRoles.some(
      (c) => c.includes('pre-salesperson'),
    )
      ? 'Pre-salesperson'
      : textRoles.some((c) => c.includes('salesperson'))
        ? 'Salesperson'
        : undefined;
    if (!type) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const all = await this.prisma.employee.findMany({
      where: {
        storeId,
        status: 'active',
        id: { not: employeeId },
        roles: { some: { role: { contains: type, mode: 'insensitive' } } },
      },
      select: {
        id: true,
        _count: {
          select: {
            ChatAssignee: {
              where: {
                chat: {
                  createdAt: { gte: yesterday, lt: today },
                },
              },
            },
          },
        },
      },
    });

    const maxChats = all.reduce(
      (max, c) => Math.max(max, c._count.ChatAssignee),
      0,
    );

    const cacheKey = `balancing:offset:chat:${employeeId}`;
    // 86400 = 24h
    await this.cacheManager.set(cacheKey, maxChats, 86400);
  }

  public async getOffsetBalancingChat(employeeId: string): Promise<number> {
    const cacheKey = `balancing:offset:chat:${employeeId}`;
    const offset = await this.cacheManager.get<number>(cacheKey);
    return offset || 0;
  }
}
