import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DistributionAutomaticService } from './distribution-automatic.service';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { SuspensionService } from '../suspension/suspension.service';

@Injectable()
export class DistributionAutomaticScheduler {
  private readonly logger = new Logger(DistributionAutomaticScheduler.name);

  constructor(
    private readonly distributionAutomaticService: DistributionAutomaticService,
    private readonly prismaService: PrismaService,
    private readonly suspensionService: SuspensionService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorSuspensionsANDRedistribute() {
    try {
      this.logger.log(
        'Starting monitoring of suspensions and redistribution automatic',
      );

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
        this.logger.log('No store with distribution automatic found');
        return;
      }

      let totalRedistributions = 0;

      for (const store of storesWithDistributionAutomatic) {
        try {
          this.logger.log(
            `Processando store: ${store.companyName} (ID: ${store.id})`,
          );

          const redistributionsBefore = await this.countDealsActive(store.id);

          await this.distributionAutomaticService.removeDealsUsersSuspended(
            store.id,
          );

          await this.redistributeChatsUsersSuspended(store.id);

          const redistributionsAfter = await this.countDealsActive(store.id);
          const redistributionsStore = Math.abs(
            redistributionsAfter - redistributionsBefore,
          );

          if (redistributionsStore > 0) {
            this.logger.log(
              `Store ${store.companyName}: ${redistributionsStore} redistribuições completed`,
            );
            totalRedistributions += redistributionsStore;
          }
        } catch (error) {
          this.logger.error(
            `Failed to process store ${store.companyName} (ID: ${store.id}):`,
            error,
          );
        }
      }

      if (totalRedistributions > 0) {
        this.logger.log(
          `Monitoring completed. Total of redistribuições: ${totalRedistributions}`,
        );
      } else {
        this.logger.log('Monitoring completed. No redistribution required');
      }
    } catch (error) {
      this.logger.error('Error during o monitoring of suspensions:', error);
    }
  }

  private async countDealsActive(storeId: string): Promise<number> {
    return await this.prismaService.dealAssignee.count({
      where: {
        storeId,
        deal: {
          status: {
            in: ['preDeal', 'dealInitial', 'atNegotiation'],
          },
        },
      },
    });
  }

  private async redistributeChatsUsersSuspended(
    storeId: string,
  ): Promise<void> {
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
        roles: true,
      },
    });

    if (employeesSuspended.length === 0) {
      return;
    }

    const idsEmployeesSuspended = employeesSuspended.map((c) => c.id);

    const chatsWithAssigneesSuspended = await this.prismaService.chat.findMany({
      where: {
        storeId,
        deal: {
          dealAssignee: {
            some: {
              employeeId: {
                in: idsEmployeesSuspended,
              },
            },
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
    });

    for (const chat of chatsWithAssigneesSuspended) {
      if (!chat.deal) continue;

      const assigneesSuspended = chat.deal.dealAssignee.filter((resp) =>
        idsEmployeesSuspended.includes(resp.employeeId),
      );

      for (const assigneeSuspended of assigneesSuspended) {
        const employeeSuspended = assigneeSuspended.employee;
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

        const newEmployeeId =
          await this.distributionAutomaticService.getEmployeeForDistribution(
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
                dealId: chat.deal.id,
                employeeId: newEmployeeId,
              },
            });

            if (!alreadyANDAssignee) {
              await prisma.dealAssignee.create({
                data: {
                  dealId: chat.deal.id,
                  employeeId: newEmployeeId,
                  storeId,
                },
              });
            }
          });

          this.logger.log(
            `Chat ${chat.id}: assignee suspended ${employeeSuspended.id} redistributed for ${newEmployeeId}`,
          );
        } else {
          await this.prismaService.dealAssignee.delete({
            where: {
              id: assigneeSuspended.id,
            },
          });

          this.logger.log(
            `Chat ${chat.id}: assignee suspended removed, none employee available for redistribution`,
          );
        }
      }
    }
  }

  private async processUsersLeftSuspension(): Promise<void> {
    const now = new Date();
    const lastExecution = new Date(now.getTime() - 5 * 60 * 1000);

    const suspensionsExpired = await this.prismaService.dealSuspension.findMany(
      {
        where: {
          endDate: {
            gte: lastExecution,
            lte: now,
          },
        },
        include: {
          user: {
            include: {
              employee: {
                where: { status: 'active' },
                include: {
                  roles: { select: { role: true } },
                },
              },
            },
          },
        },
      },
    );

    for (const suspension of suspensionsExpired) {
      const employee = suspension.user.employee[0];
      if (employee) {
        const offsetExisting = await this.suspensionService.getOffsetBalancing(
          employee.id,
        );
        if (offsetExisting === 0) {
          await this.suspensionService.defineOffsetBalancing(
            employee.id,
            employee.storeId,
            employee.roles,
          );

          this.logger.log(
            `Offset of balancing aplicado for employee ${employee.id} after expiresção of suspension`,
          );
        }
      }
    }
  }
}
