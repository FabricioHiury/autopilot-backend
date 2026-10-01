import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { AppErrorNotFound } from 'src/utils/errors/app-errors';
import { SuspensionService } from '../suspension/suspension.service';
import { EventService } from '../events/event.service';

@Injectable()
export class DistributionAutomaticService {
  private readonly LIMIT_DIFFERENCE_DEALS = 1;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly suspensionService: SuspensionService,
    private readonly eventService: EventService,
  ) {}

  async getEmployeeForDistribution(
    storeId: string,
    typeSpecific?: 'Pre-salesperson' | 'Salesperson',
  ): Promise<string | null> {
    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
      select: {
        distributionAutomatic: true,
      },
    });

    if (!store?.distributionAutomatic) {
      return null;
    }

    if (typeSpecific) {
      const employees = await this.findEmployeesByType(storeId, typeSpecific);
      if (employees.length > 0) {
        return this.selectEmployeeWithLessDeals(employees);
      }
      return null;
    }

    const preSalespeople = await this.findEmployeesByType(
      storeId,
      'Pre-salesperson',
    );

    if (preSalespeople.length > 0) {
      return this.selectEmployeeWithLessDeals(preSalespeople);
    }

    const salespeople = await this.findEmployeesByType(storeId, 'Salesperson');

    if (salespeople.length > 0) {
      return this.selectEmployeeWithLessDeals(salespeople);
    }

    return null;
  }

  private async findEmployeesByType(
    storeId: string,
    typeEmployee: 'Pre-salesperson' | 'Salesperson',
  ) {
    const isPreSalesperson = typeEmployee === 'Pre-salesperson';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const employees = await this.prismaService.employee.findMany({
      where: {
        storeId,
        status: 'active',
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
                    in: ['preDeal', 'dealInitial', 'atNegotiation'],
                  },
                  dealManual: false,
                  createdAt: {
                    gte: yesterdayStart,
                    lt: todayStart,
                  },
                },
              },
            },
          },
        },
      },
    });

    const idsUsers = employees.map((c) => c.userId);
    const statusSuspension =
      await this.suspensionService.checkUsersSuspended(idsUsers);

    const employeesActive = [];

    for (const employee of employees) {
      if (!statusSuspension.get(employee.userId)) {
        await this.suspensionService.checkANDRemoveOffsetSeRequired(
          employee.id,
          storeId,
        );

        const offset = await this.suspensionService.getOffsetBalancing(
          employee.id,
        );

        employeesActive.push({
          id: employee.id,
          _count: {
            dealAssignee: offset > 0 ? offset : employee._count.dealAssignee,
          },
        });
      }
    }

    return employeesActive;
  }

  private selectEmployeeWithLessDeals(
    employees: Array<{
      id: string;
      _count: { dealAssignee: number };
    }>,
  ): string | null {
    if (employees.length === 0) return null;

    const employeesSorted = employees.sort(
      (a, b) => a._count.dealAssignee - b._count.dealAssignee,
    );

    const smallerLimit = employeesSorted[0]._count.dealAssignee;
    const greaterLimit =
      employeesSorted[employeesSorted.length - 1]._count.dealAssignee;

    if (greaterLimit - smallerLimit >= this.LIMIT_DIFFERENCE_DEALS) {
      const employeesWithSmallerLimit = employeesSorted.filter(
        (c) => c._count.dealAssignee === smallerLimit,
      );

      const indexRandom = Math.floor(
        Math.random() * employeesWithSmallerLimit.length,
      );
      return employeesWithSmallerLimit[indexRandom].id;
    }

    const indexRandom = Math.floor(Math.random() * employeesSorted.length);
    return employeesSorted[indexRandom].id;
  }

  async removeDealsUsersSuspended(storeId: string): Promise<void> {
    const now = new Date();

    const suspensionsActive = await this.prismaService.dealSuspension.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        userId: true,
      },
    });

    if (suspensionsActive.length === 0) {
      return;
    }

    const idsUsersSuspended = suspensionsActive.map((s) => s.userId);

    const employeesSuspended = await this.prismaService.employee.findMany({
      where: {
        storeId,
        userId: {
          in: idsUsersSuspended,
        },
      },
      select: {
        id: true,
      },
    });

    if (employeesSuspended.length === 0) {
      return;
    }

    const idsEmployeesSuspended = employeesSuspended.map((c) => c.id);

    const dealsForRedistribute = await this.prismaService.dealAssignee.findMany(
      {
        where: {
          storeId,
          employeeId: {
            in: idsEmployeesSuspended,
          },
          deal: {
            status: {
              in: ['preDeal', 'dealInitial', 'atNegotiation'],
            },
          },
        },
        include: {
          deal: {
            include: {
              dealAssignee: {
                include: {
                  employee: {
                    include: {
                      roles: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    );

    for (const assigneeSuspended of dealsForRedistribute) {
      const deal = assigneeSuspended.deal;

      const employeeSuspended = deal.dealAssignee.find(
        (resp) => resp.employeeId === assigneeSuspended.employeeId,
      )?.employee;
      const rolesEmployeeSuspended = employeeSuspended.roles.map((c) =>
        c.role.toLowerCase(),
      );

      let typeEmployee: 'Pre-salesperson' | 'Salesperson' | undefined;

      if (
        rolesEmployeeSuspended.some(
          (role) =>
            role.includes('pre-salesperson') ||
            role.includes('pre-salesperson'),
        )
      ) {
        typeEmployee = 'Pre-salesperson';
      } else if (
        rolesEmployeeSuspended.some(
          (role) => role.includes('salesperson') && !role.includes('pre'),
        )
      ) {
        typeEmployee = 'Salesperson';
      }

      const newEmployeeId = await this.getEmployeeForDistribution(
        storeId,
        typeEmployee,
      );

      if (newEmployeeId) {
        await this.prismaService.$transaction(async (prisma) => {
          await prisma.dealAssignee.delete({
            where: {
              id: assigneeSuspended.id,
            },
          });

          const alreadyANDAssignee = await prisma.dealAssignee.findFirst({
            where: {
              dealId: deal.id,
              employeeId: newEmployeeId,
            },
          });

          if (!alreadyANDAssignee) {
            await prisma.dealAssignee.create({
              data: {
                dealId: deal.id,
                employeeId: newEmployeeId,
                storeId,
              },
            });
          }
        });
      } else {
        await this.prismaService.dealAssignee.delete({
          where: {
            id: assigneeSuspended.id,
          },
        });
      }
    }
  }

  async configureDistributionAutomatic(
    storeId: string,
    distributionAutomatic: boolean,
  ) {
    const result = await this.prismaService.store.update({
      where: { id: storeId },
      data: {
        distributionAutomatic,
      },
    });

    this.eventService.emitDistributionConfigured({
      dealId: '',
      context: {
        details: {
          storeId,
          companyName: result.companyName,
          distributionAutomatic,
          action: distributionAutomatic ? 'activated' : 'disabled',
        },
      },
    });

    return result;
  }

  async getConfigurationDistribution(storeId: string) {
    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
      select: {
        distributionAutomatic: true,
      },
    });

    if (!store) {
      throw new AppErrorNotFound('Store not found');
    }

    return {
      ...store,
      limitDifferenceDeals: this.LIMIT_DIFFERENCE_DEALS,
    };
  }

  async monitorANDRedistributeSuspended(): Promise<{
    message: string;
    storesProcessed: number;
    redistributionsCompleted: number;
  }> {
    const storesWithDistributionAutomatic =
      await this.prismaService.store.findMany({
        where: {
          distributionAutomatic: true,
        },
        select: {
          id: true,
          companyName: true,
        },
      });

    if (storesWithDistributionAutomatic.length === 0) {
      return {
        message: 'No store with distribution automatic found',
        storesProcessed: 0,
        redistributionsCompleted: 0,
      };
    }

    let totalRedistributions = 0;

    for (const store of storesWithDistributionAutomatic) {
      const redistributionsBefore = await this.prismaService.dealAssignee.count(
        {
          where: {
            storeId: store.id,
            deal: {
              status: {
                in: ['preDeal', 'dealInitial', 'atNegotiation'],
              },
            },
          },
        },
      );

      await this.removeDealsUsersSuspended(store.id);

      const redistributionsAfter = await this.prismaService.dealAssignee.count({
        where: {
          storeId: store.id,
          deal: {
            status: {
              in: ['preDeal', 'dealInitial', 'atNegotiation'],
            },
          },
        },
      });

      totalRedistributions += Math.abs(
        redistributionsAfter - redistributionsBefore,
      );
    }

    return {
      message: `Monitoring completed with success`,
      storesProcessed: storesWithDistributionAutomatic.length,
      redistributionsCompleted: totalRedistributions,
    };
  }

  private async findEmployeesForChat(
    storeId: string,
    typeEmployee: 'Pre-salesperson' | 'Salesperson',
  ): Promise<Array<{ id: string; qtdChats: number }>> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const employees = await this.prismaService.employee.findMany({
      where: {
        storeId,
        status: 'active',
        user: {
          status: 'active',
          profile: 'user',
        },
        roles: {
          some: {
            role: {
              contains: typeEmployee,
              mode: 'insensitive',
              ...(typeEmployee === 'Salesperson'
                ? { not: { contains: 'Pre' } }
                : {}),
            },
          },
        },
      },
      select: {
        id: true,
        userId: true,
        _count: {
          select: {
            ChatAssignee: {
              where: {
                chat: {
                  createdAt: {
                    gte: yesterdayStart,
                    lt: new Date(),
                  },
                },
              },
            },
          },
        },
      },
    });

    const idsUsers = employees.map((c) => c.userId);

    const statusSuspension =
      await this.suspensionService.checkUsersSuspended(idsUsers);

    const result: Array<{ id: string; qtdChats: number }> = [];
    for (const c of employees) {
      if (statusSuspension.get(c.userId)) {
        continue;
      }

      const offsetChat = await this.suspensionService.getOffsetBalancingChat(
        c.id,
      );

      const qtd = offsetChat > 0 ? offsetChat : c._count.ChatAssignee;

      result.push({ id: c.id, qtdChats: qtd });
    }
    return result;
  }

  private selectEmployeeWithLessChats(
    employees: Array<{ id: string; qtdChats: number }>,
  ): string | null {
    if (employees.length === 0) return null;
    employees.sort((a, b) => a.qtdChats - b.qtdChats);
    const min = employees[0].qtdChats;
    const max = employees[employees.length - 1].qtdChats;
    if (max - min > this.LIMIT_DIFFERENCE_DEALS) {
      const candidates = employees.filter((c) => c.qtdChats === min);
      return candidates[Math.floor(Math.random() * candidates.length)].id;
    }
    return employees[Math.floor(Math.random() * employees.length)].id;
  }

  async getEmployeeForDistributionChat(
    storeId: string,
    typeSpecific?: 'Pre-salesperson' | 'Salesperson',
  ): Promise<string | null> {
    const store = await this.prismaService.store.findUnique({
      where: { id: storeId },
      select: { distributionAutomatic: true },
    });
    if (!store?.distributionAutomatic) return null;

    if (typeSpecific) {
      const employees = await this.findEmployeesForChat(storeId, typeSpecific);
      return this.selectEmployeeWithLessChats(employees);
    }

    const pre = await this.findEmployeesForChat(storeId, 'Pre-salesperson');
    if (pre.length) return this.selectEmployeeWithLessChats(pre);

    const sales = await this.findEmployeesForChat(storeId, 'Salesperson');
    return this.selectEmployeeWithLessChats(sales);
  }
}
