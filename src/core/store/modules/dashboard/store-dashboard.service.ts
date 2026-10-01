import { UTCDate } from '@date-fns/utc';
import { Injectable } from '@nestjs/common';
import { Deal, DealAssignee } from '@prisma/client';
import {
  subWeeks,
  startOfWeek,
  endOfWeek as dateEndOfWeek,
  endOfMonth as dateEndOfMonth,
  startOfDay as dateStartOfDay,
  endOfDay as dateEndOfDay,
  addDays,
  addWeeks,
  startOfMonth,
  addMonths,
  startOfQuarter,
  endOfQuarter as dateEndOfQuarter,
  addQuarters,
  startOfYear,
  endOfYear as dateEndOfYear,
  addYears,
  format,
} from 'date-fns';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { ORIGIN_DEAL, STATUS_DEAL, MODE_DEAL } from 'src/utils/enum/deal.enum';
import {
  AppErrorNotFound,
  AppErrorBadRequest,
} from 'src/utils/errors/app-errors';
import { FILTER_DATA } from '../../enum/filter-data.enum';
import { IItemChartOriginDeals } from '../../interfaces/item-chart-deals.interface';

@Injectable()
export class StoreDashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getEmployeeById(employeeId: string, storeId: string) {
    return await this.prismaService.employee.findUnique({
      where: {
        id: employeeId,
        storeId,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }

  private async getEmployeesRegisteredWeek(storeId: string) {
    return await this.prismaService.employee.findMany({
      where: {
        storeId,
        createdAt: { gte: subWeeks(new Date(), 1) },
      },
    });
  }

  private getIntervalOfWeeks() {
    const now = new Date();
    return {
      startWeekCurrent: startOfWeek(now, { weekStartsOn: 0 }),
      endWeekCurrent: dateEndOfWeek(now, { weekStartsOn: 0 }),
      startWeekPrevious: startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }),
      endWeekPrevious: dateEndOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }),
    };
  }

  private filterDealsByData(deals: Deal[], start: Date, end: Date) {
    return deals.filter((deal) => {
      const dataDeal = new Date(deal.createdAt);
      return dataDeal >= start && dataDeal <= end;
    });
  }

  private calculateDifferencePercentage(
    current: number,
    previous: number,
  ): number {
    if (previous === 0) {
      if (current === 0) return 0;
      return Math.round(current * 100 * 100) / 100;
    }

    const percentage = ((current - previous) / previous) * 100;
    return Math.round(percentage * 100) / 100;
  }

  private filterDealsByStatus(deals: Deal[], status: string) {
    const dealsFiltered = deals.filter((deal) => deal.status === status);

    return dealsFiltered;
  }

  private mapDealsBySalesperson(
    dealAssignee: (DealAssignee & {
      deal: Deal;
    })[],
  ): Map<string, number> {
    const dealsByEmployeeMap = new Map<string, number>();

    dealAssignee.forEach((deal) => {
      const employeeId = deal.employeeId;
      const totalDeals = dealsByEmployeeMap.get(employeeId) || 0;
      dealsByEmployeeMap.set(employeeId, totalDeals + 1);

      return {
        employeeId: deal.employeeId,
        ...deal.deal,
      };
    });

    return dealsByEmployeeMap;
  }

  private getGreaterElementOfMap(map: Map<string, number>) {
    const greaterElementArray = Array.from(map.entries()).reduce(
      (previous, current) => (current[1] > previous[1] ? current : previous),
      ['', 0] as [string, number],
    );

    return {
      key: greaterElementArray[0],
      value: greaterElementArray[1],
    };
  }

  private calculateAverageSales(
    dealsByEmployeeMap: Map<string, number>,
  ): number {
    let totalSales = 0;
    dealsByEmployeeMap.forEach((sales) => {
      totalSales += sales;
    });

    const limitEmployees = dealsByEmployeeMap.size;

    if (limitEmployees === 0) {
      return 0;
    }

    return totalSales / limitEmployees;
  }

  private async getDealsConsolidated(
    storeId: string,
    startWeekCurrent: Date,
    endWeekCurrent: Date,
    startWeekPrevious: Date,
    endWeekPrevious: Date,
  ) {
    const [
      dealsWeekCurrent,
      dealsWeekPrevious,
      salesWeekCurrent,
      salesWeekPrevious,
      dealsAtOpenCurrent,
      dealsAtOpenWeekPrevious,
      salesCompletedCurrent,
      salesCompletedWeekPrevious,
      salesByEmployee,
    ] = await Promise.all([
      this.prismaService.deal.count({
        where: {
          storeId,
          createdAt: {
            gte: startWeekCurrent,
            lte: endWeekCurrent,
          },
        },
      }),
      this.prismaService.deal.count({
        where: {
          storeId,
          createdAt: {
            gte: startWeekPrevious,
            lte: endWeekPrevious,
          },
        },
      }),
      this.prismaService.deal.count({
        where: {
          storeId,
          status: STATUS_DEAL.SUCCESS,
          createdAt: {
            gte: startWeekCurrent,
            lte: endWeekCurrent,
          },
        },
      }),
      this.prismaService.deal.count({
        where: {
          storeId,
          status: STATUS_DEAL.SUCCESS,
          createdAt: {
            gte: startWeekPrevious,
            lte: endWeekPrevious,
          },
        },
      }),
      this.prismaService.deal.count({
        where: {
          storeId,
          status: {
            notIn: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
          },
          createdAt: {
            gte: startWeekCurrent,
            lte: endWeekCurrent,
          },
        },
      }),
      this.prismaService.deal.count({
        where: {
          storeId,
          status: {
            notIn: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
          },
          createdAt: {
            gte: startWeekPrevious,
            lte: endWeekPrevious,
          },
        },
      }),
      this.prismaService.deal.count({
        where: {
          storeId,
          status: STATUS_DEAL.SUCCESS,
          createdAt: {
            gte: startWeekCurrent,
            lte: endWeekCurrent,
          },
        },
      }),
      this.prismaService.deal.count({
        where: {
          storeId,
          status: STATUS_DEAL.SUCCESS,
          createdAt: {
            gte: startWeekPrevious,
            lte: endWeekPrevious,
          },
        },
      }),
      this.prismaService.dealAssignee.groupBy({
        by: ['employeeId'],
        where: {
          storeId,
          deal: {
            status: STATUS_DEAL.SUCCESS,
            createdAt: {
              gte: startWeekCurrent,
              lte: endWeekCurrent,
            },
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),
    ]);

    return {
      dealsWeekCurrent,
      dealsWeekPrevious,
      salesWeekCurrent,
      salesWeekPrevious,
      dealsAtOpenCurrent,
      dealsAtOpenWeekPrevious,
      salesCompletedCurrent,
      salesCompletedWeekPrevious,
      salesByEmployee,
    };
  }

  private async getChatsWithoutReplyConsolidated(
    storeId: string,
    startWeekCurrent: Date,
    endWeekCurrent: Date,
    startWeekPrevious: Date,
    endWeekPrevious: Date,
  ) {
    const [chatsWithoutReplyCurrent, chatsWithoutReplyWeekPrevious] =
      await Promise.all([
        this.prismaService.$queryRaw`
          SELECT COUNT(*) AS count
          FROM chats c
          WHERE c.store_id = ${storeId}
            AND EXISTS (
              SELECT 1 FROM deals a 
              WHERE a.id = c."deal_id" 
                AND a.status NOT IN (${STATUS_DEAL.SUCCESS}, ${STATUS_DEAL.LOST})
            )
            AND EXISTS (
              SELECT 1 FROM messages m 
              WHERE m.chat_id = c.id 
                AND m.sender = 'CUSTOMER'
                AND m.id = (
                  SELECT m2.id FROM messages m2 
                  WHERE m2.chat_id = c.id 
                  ORDER BY m2.created_at DESC 
                  LIMIT 1
                )
                AND m.created_at >= ${startWeekCurrent}
                AND m.created_at <= ${endWeekCurrent}
            )
        `,
        this.prismaService.$queryRaw`
          SELECT COUNT(*) AS count
          FROM chats c
          WHERE c.store_id = ${storeId}
            AND EXISTS (
              SELECT 1 FROM deals a 
              WHERE a.id = c."deal_id" 
                AND a.status NOT IN (${STATUS_DEAL.SUCCESS}, ${STATUS_DEAL.LOST})
            )
            AND EXISTS (
              SELECT 1 FROM messages m 
              WHERE m.chat_id = c.id 
                AND m.sender = 'CUSTOMER'
                AND m.id = (
                  SELECT m2.id FROM messages m2 
                  WHERE m2.chat_id = c.id 
                  ORDER BY m2.created_at DESC 
                  LIMIT 1
                )
                AND m.created_at >= ${startWeekPrevious}
                AND m.created_at <= ${endWeekPrevious}
            )
        `,
      ]);

    return {
      chatsWithoutReplyCurrent: Number(
        (chatsWithoutReplyCurrent as any)[0]?.count || 0,
      ),
      chatsWithoutReplyWeekPrevious: Number(
        (chatsWithoutReplyWeekPrevious as any)[0]?.count || 0,
      ),
    };
  }

  private async getTasksConsolidated(
    storeId: string,
    userId: string | undefined,
    startWeekCurrent: Date,
    endWeekCurrent: Date,
    startWeekPrevious: Date,
    endWeekPrevious: Date,
  ) {
    let tasksPendingCurrent = 0;
    let tasksPendingWeekPrevious = 0;

    if (userId) {
      const employee = await this.prismaService.employee.findFirst({
        where: {
          storeId,
          userId,
        },
        select: {
          id: true,
        },
      });

      if (employee) {
        [tasksPendingCurrent, tasksPendingWeekPrevious] = await Promise.all([
          this.prismaService.dealTask.count({
            where: {
              assigneeId: employee.id,
              completed: false,
              data: {
                gte: startWeekCurrent,
                lte: endWeekCurrent,
              },
            },
          }),
          this.prismaService.dealTask.count({
            where: {
              assigneeId: employee.id,
              completed: false,
              data: {
                gte: startWeekPrevious,
                lte: endWeekPrevious,
              },
            },
          }),
        ]);
      }
    } else {
      [tasksPendingCurrent, tasksPendingWeekPrevious] = await Promise.all([
        this.prismaService.dealTask.count({
          where: {
            completed: false,
            employee: { storeId },
            data: {
              gte: startWeekCurrent,
              lte: endWeekCurrent,
            },
          },
        }),
        this.prismaService.dealTask.count({
          where: {
            completed: false,
            employee: { storeId },
            data: {
              gte: startWeekPrevious,
              lte: endWeekPrevious,
            },
          },
        }),
      ]);
    }

    return {
      tasksPendingCurrent,
      tasksPendingWeekPrevious,
    };
  }

  private beginningOfSemester(date: Date): Date {
    const month = date.getMonth();
    const monthBeginning = month < 6 ? 0 : 6;
    return new Date(date.getFullYear(), monthBeginning, 1);
  }

  private endOfSemester(date: Date): Date {
    const month = date.getMonth();
    const monthEnd = month < 6 ? 5 : 11;
    return dateEndOfMonth(new Date(date.getFullYear(), monthEnd, 1));
  }

  private handleGroupingDaily(
    deals: Deal[],
    dataStart: Date,
    dataEnd: Date,
  ): IItemChartOriginDeals[] {
    const result: IItemChartOriginDeals[] = [];

    let dataCurrent = dateStartOfDay(dataStart);
    const dataFinal = dateEndOfDay(dataEnd);

    while (dataCurrent <= dataFinal) {
      const startOfDay = dateStartOfDay(dataCurrent);
      const endOfDay = dateEndOfDay(dataCurrent);

      const dealsOfDay = deals.filter(
        (a) => a.createdAt >= startOfDay && a.createdAt <= endOfDay,
      );

      const count: Record<string, number> = {};
      Object.values(ORIGIN_DEAL).forEach((origin) => {
        count[origin] = 0;
      });

      dealsOfDay.forEach((a) => {
        count[a.dealOrigin] += 1;
      });

      result.push({
        data: format(startOfDay, 'yyyy-MM-dd'),
        count,
      });

      dataCurrent = addDays(dataCurrent, 1);
    }

    return result;
  }

  private handleGroupingWeekly(
    deals: Deal[],
    dataStart: Date,
    dataEnd: Date,
  ): IItemChartOriginDeals[] {
    const result: IItemChartOriginDeals[] = [];

    let dataCurrent = startOfWeek(dataStart, { weekStartsOn: 0 });
    const dataFinal = dateEndOfWeek(dataEnd, { weekStartsOn: 0 });

    while (dataCurrent <= dataFinal) {
      const beginningOfWeek = startOfWeek(dataCurrent, { weekStartsOn: 0 });
      const endOfWeek = dateEndOfWeek(dataCurrent, { weekStartsOn: 0 });

      const dealsWeek = deals.filter(
        (a) => a.createdAt >= beginningOfWeek && a.createdAt <= endOfWeek,
      );

      const count: Record<string, number> = {};
      Object.values(ORIGIN_DEAL).forEach((origin) => {
        count[origin] = 0;
      });

      dealsWeek.forEach((a) => {
        count[a.dealOrigin] += 1;
      });

      result.push({
        data: format(dataCurrent, 'yyyy-MM-dd'),
        count,
      });

      dataCurrent = addWeeks(dataCurrent, 1);
    }

    return result;
  }

  private handleGroupingMonthly(
    deals: Deal[],
    dataStart: Date,
    dataEnd: Date,
  ): IItemChartOriginDeals[] {
    const result: IItemChartOriginDeals[] = [];

    let dataCurrent = startOfMonth(dataStart);
    const dataFinal = dateEndOfMonth(dataEnd);

    while (dataCurrent <= dataFinal) {
      const beginningOfMonth = startOfMonth(dataCurrent);
      const endOfMonth = dateEndOfMonth(dataCurrent);

      const dealsMonth = deals.filter(
        (a) => a.createdAt >= beginningOfMonth && a.createdAt <= endOfMonth,
      );

      const count: Record<string, number> = {};
      Object.values(ORIGIN_DEAL).forEach((origin) => {
        count[origin] = 0;
      });

      dealsMonth.forEach((a) => {
        count[a.dealOrigin] += 1;
      });

      result.push({
        data: format(dataCurrent, 'yyyy-MM'),
        count,
      });

      dataCurrent = addMonths(dataCurrent, 1);
    }

    return result;
  }

  private handleGroupingQuarterly(
    deals: Deal[],
    dataStart: Date,
    dataEnd: Date,
  ): IItemChartOriginDeals[] {
    const result: IItemChartOriginDeals[] = [];

    let dataCurrent = startOfQuarter(dataStart);
    const dataFinal = dateEndOfQuarter(dataEnd);

    while (dataCurrent <= dataFinal) {
      const beginningOfQuarter = startOfQuarter(dataCurrent);
      const endOfQuarter = dateEndOfQuarter(dataCurrent);

      const dealsQuarter = deals.filter(
        (a) => a.createdAt >= beginningOfQuarter && a.createdAt <= endOfQuarter,
      );

      const count: Record<string, number> = {};
      Object.values(ORIGIN_DEAL).forEach((origin) => {
        count[origin] = 0;
      });

      dealsQuarter.forEach((a) => {
        count[a.dealOrigin] += 1;
      });

      result.push({
        data: format(dataCurrent, 'yyyy-MM'),
        count,
      });

      dataCurrent = addQuarters(dataCurrent, 1);
    }

    return result;
  }

  private handleGroupingSemiannual(
    deals: Deal[],
    dataStart: Date,
    dataEnd: Date,
  ): IItemChartOriginDeals[] {
    const result: IItemChartOriginDeals[] = [];

    let dataCurrent = this.beginningOfSemester(dataStart);
    const dataFinal = this.endOfSemester(dataEnd);

    while (dataCurrent <= dataFinal) {
      const beginningOfSemester = this.beginningOfSemester(dataCurrent);
      const endOfSemester = this.endOfSemester(dataCurrent);

      const dealsSemester = deals.filter(
        (a) =>
          a.createdAt >= beginningOfSemester && a.createdAt <= endOfSemester,
      );

      const count: Record<string, number> = {};
      Object.values(ORIGIN_DEAL).forEach((origin) => {
        count[origin] = 0;
      });

      dealsSemester.forEach((a) => {
        count[a.dealOrigin] += 1;
      });

      result.push({
        data: format(dataCurrent, 'yyyy-MM'),
        count,
      });

      dataCurrent = addMonths(dataCurrent, 6);
    }

    return result;
  }

  private handleGroupingAnnual(
    deals: Deal[],
    dataStart: Date,
    dataEnd: Date,
  ): IItemChartOriginDeals[] {
    const result: IItemChartOriginDeals[] = [];

    let dataCurrent = startOfYear(dataStart);
    const dataFinal = dateEndOfYear(dataEnd);

    while (dataCurrent <= dataFinal) {
      const beginningOfYear = startOfYear(dataCurrent);
      const endOfYear = dateEndOfYear(dataCurrent);

      const dealsYear = deals.filter(
        (a) => a.createdAt >= beginningOfYear && a.createdAt <= endOfYear,
      );

      const count: Record<string, number> = {};
      Object.values(ORIGIN_DEAL).forEach((origin) => {
        count[origin] = 0;
      });

      dealsYear.forEach((a) => {
        count[a.dealOrigin] += 1;
      });

      const year = format(dataCurrent, 'yyyy');

      result.push({
        data: year,
        count,
      });

      dataCurrent = addYears(dataCurrent, 1);
    }

    return result;
  }

  async getReportWeekly(storeId: string, userId?: string) {
    const store = await this.prismaService.store.findUnique({
      where: {
        id: storeId,
      },
      select: {
        id: true,
        companyName: true,
      },
    });

    if (!store) {
      throw new AppErrorNotFound('Store not found');
    }

    const {
      startWeekCurrent,
      endWeekCurrent,
      startWeekPrevious,
      endWeekPrevious,
    } = this.getIntervalOfWeeks();

    const [
      employeesRegisteredWeek,
      dealsConsolidated,
      chatsWithoutReplyConsolidated,
      tasksData,
    ] = await Promise.all([
      this.getEmployeesRegisteredWeek(storeId),
      this.getDealsConsolidated(
        storeId,
        startWeekCurrent,
        endWeekCurrent,
        startWeekPrevious,
        endWeekPrevious,
      ),
      this.getChatsWithoutReplyConsolidated(
        storeId,
        startWeekCurrent,
        endWeekCurrent,
        startWeekPrevious,
        endWeekPrevious,
      ),
      this.getTasksConsolidated(
        storeId,
        userId,
        startWeekCurrent,
        endWeekCurrent,
        startWeekPrevious,
        endWeekPrevious,
      ),
    ]);

    const differencePercentageWeekPrevious = this.calculateDifferencePercentage(
      dealsConsolidated.dealsWeekCurrent,
      dealsConsolidated.dealsWeekPrevious,
    );

    const differencePercentageSalesWeekCurrentWeekPrevious =
      this.calculateDifferencePercentage(
        dealsConsolidated.salesWeekCurrent,
        dealsConsolidated.salesWeekPrevious,
      );

    const percentageDealsAtOpen =
      dealsConsolidated.dealsWeekCurrent > 0
        ? Math.round(
            (dealsConsolidated.dealsAtOpenCurrent /
              dealsConsolidated.dealsWeekCurrent) *
              10000,
          ) / 100
        : 0;

    const differencePercentageSalesCompleted =
      this.calculateDifferencePercentage(
        dealsConsolidated.salesCompletedCurrent,
        dealsConsolidated.salesCompletedWeekPrevious,
      );

    const differencePercentageChatsWithoutReply =
      this.calculateDifferencePercentage(
        chatsWithoutReplyConsolidated.chatsWithoutReplyCurrent,
        chatsWithoutReplyConsolidated.chatsWithoutReplyWeekPrevious,
      );

    const differencePercentageTasksPending = this.calculateDifferencePercentage(
      tasksData.tasksPendingCurrent,
      tasksData.tasksPendingWeekPrevious,
    );

    let employeeWithMoreSales = null;
    let salesTopEmployee = 0;
    let differencePercentageSalesTopEmployeeAverageTeam = 0;

    if (dealsConsolidated.salesByEmployee.length > 0) {
      const topSalesperson = dealsConsolidated.salesByEmployee[0];
      salesTopEmployee = topSalesperson._count.id;

      employeeWithMoreSales = await this.getEmployeeById(
        topSalesperson.employeeId,
        storeId,
      );

      const averageSales =
        dealsConsolidated.salesByEmployee.reduce(
          (acc, curr) => acc + curr._count.id,
          0,
        ) / dealsConsolidated.salesByEmployee.length;

      differencePercentageSalesTopEmployeeAverageTeam =
        this.calculateDifferencePercentage(salesTopEmployee, averageSales);
    }

    return {
      storeId: store.id,
      name: store.companyName,
      newSalespeople: employeesRegisteredWeek.length,
      newDeals: {
        limit: dealsConsolidated.dealsWeekCurrent,
        percentage: differencePercentageWeekPrevious,
        success: {
          limit: dealsConsolidated.salesWeekCurrent,
          percentage: differencePercentageSalesWeekCurrentWeekPrevious,
        },
      },
      salespersonHighlight: {
        ...employeeWithMoreSales,
        limitSales: salesTopEmployee,
        percentageSalesAboveAverage: Math.floor(
          differencePercentageSalesTopEmployeeAverageTeam,
        ),
      },
      dealsAtOpen: {
        limit: dealsConsolidated.dealsAtOpenCurrent,
        percentage: percentageDealsAtOpen,
      },
      salesCompleted: {
        limit: dealsConsolidated.salesCompletedCurrent,
        percentage: differencePercentageSalesCompleted,
      },
      chatsWithoutReply: {
        limit: chatsWithoutReplyConsolidated.chatsWithoutReplyCurrent,
        percentage: differencePercentageChatsWithoutReply,
      },
      tasksPending: {
        limit: tasksData.tasksPendingCurrent,
        percentage: differencePercentageTasksPending,
      },
    };
  }

  async getLastDeals(storeId: string, mode?: string) {
    const filterMode = mode ?? MODE_DEAL.BUY;

    // const aux = await this.prismaService.dealAssignee.findMany({
    //   where: {
    //     storeId,
    //   },
    //   include: {
    //     deal: {
    //       select: {
    //         id: true,
    //         dealOrigin: true,
    //         dealMode: true,
    //         status: true,
    //         createdAt: true,
    //       },
    //     },
    //     employee: {
    //       select: {
    //         id: true,
    //         name: true,
    //         idPhoto: true,
    //         userId: true,
    //       },
    //     },
    //   },
    //   orderBy: {
    //     createdAt: 'desc',
    //   },
    // });

    // const deals = aux
    //   .filter(
    //     (deal) => deal.deal.dealMode === filterMode,
    //   )
    //   .map((aux) => {
    //     return {
    //       ...{
    //         id: aux.deal.id,
    //         platform: aux.deal.dealOrigin,
    //         status: aux.deal.status,
    //         createdAt: aux.deal.createdAt,
    //       },
    //       employee: aux.employee,
    //     };
    //   });

    const deals = await this.prismaService.deal.findMany({
      where: {
        storeId,
        dealMode: filterMode,
      },
      include: {
        dealAssignee: {
          include: {
            employee: true,
          },
        },
        customer: true,
        temporaryCustomer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return { mode: filterMode, deals };
  }

  async getOriginDeals(
    storeId: string,
    grouping: FILTER_DATA,
    dataStart: Date,
    dataEnd: Date,
  ) {
    grouping = grouping ?? FILTER_DATA.MONTHLY;

    if (
      (grouping === FILTER_DATA.DAILY || grouping === FILTER_DATA.WEEKLY) &&
      (!dataStart || !dataEnd)
    ) {
      dataStart = startOfMonth(new UTCDate());
      dataEnd = dateEndOfMonth(new UTCDate());
    } else {
      dataStart = dataStart ?? startOfYear(new UTCDate());
      dataEnd = dataEnd ?? dateEndOfYear(new UTCDate());
    }

    dataStart = new UTCDate(dateStartOfDay(dataStart));
    dataEnd = new UTCDate(dateEndOfDay(dataEnd));

    const deals = await this.prismaService.deal.findMany({
      where: {
        storeId,
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
    });

    let data: IItemChartOriginDeals[] = [];

    switch (grouping) {
      case FILTER_DATA.DAILY:
        data = this.handleGroupingDaily(deals, dataStart, dataEnd);
        break;
      case FILTER_DATA.WEEKLY:
        data = this.handleGroupingWeekly(deals, dataStart, dataEnd);
        break;
      case FILTER_DATA.MONTHLY:
        data = this.handleGroupingMonthly(deals, dataStart, dataEnd);
        break;
      case FILTER_DATA.QUARTERLY:
        data = this.handleGroupingQuarterly(deals, dataStart, dataEnd);
        break;
      case FILTER_DATA.SEMIANNUAL:
        data = this.handleGroupingSemiannual(deals, dataStart, dataEnd);
        break;
      case FILTER_DATA.ANNUAL:
        data = this.handleGroupingAnnual(deals, dataStart, dataEnd);
        break;
      default:
        throw new AppErrorBadRequest('Filter of data invalid');
    }

    return {
      grouping,
      dataStart: format(dataStart, 'yyyy-MM-dd'),
      dataEnd: format(dataEnd, 'yyyy-MM-dd'),
      data,
    };
  }

  async getOverview(storeId: string) {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const roles = await this.prismaService.role.findMany({
      where: {
        storeId,
      },
      include: {
        employees: true,
      },
    });

    const salespeopleIds = new Set();
    const preSalespeopleIds = new Set();

    roles.forEach((role) => {
      if (
        role.role.toLowerCase().includes('salesperson') &&
        !role.role.toLowerCase().includes('pre') &&
        !role.role.toLowerCase().includes('pre')
      ) {
        role.employees.forEach((employee) => {
          salespeopleIds.add(employee.id);
        });
      } else if (
        role.role.toLowerCase().includes('pre-salesperson') ||
        role.role.toLowerCase().includes('pre-salesperson')
      ) {
        role.employees.forEach((employee) => {
          preSalespeopleIds.add(employee.id);
        });
      }
    });

    const deals = await this.prismaService.deal.findMany({
      where: {
        storeId,
        OR: [
          {
            createdAt: {
              gte: fourteenDaysAgo,
              lte: today,
            },
          },
          {
            updatedAt: {
              gte: fourteenDaysAgo,
              lte: today,
            },
          },
        ],
      },
      include: {
        dealAssignee: {
          include: {
            employee: true,
          },
        },
      },
    });

    const {
      dealsCreatedWeekCurrent,
      dealsCreatedWeekPast,
      dealsUpdatedWeekCurrent,
      dealsUpdatedWeekPast,
      dealsSuccessBuyWeekCurrent,
      dealsSuccessBuyWeekPast,
      dealsSuccessSellWeekCurrent,
      dealsSuccessSellWeekPast,
    } = deals.reduce(
      (acc, deal) => {
        const isCreatedWeekCurrent = deal.createdAt >= sevenDaysAgo;
        const isUpdatedWeekCurrent = deal.updatedAt >= sevenDaysAgo;

        isCreatedWeekCurrent
          ? acc.dealsCreatedWeekCurrent.push(deal)
          : deal.createdAt >= fourteenDaysAgo &&
            acc.dealsCreatedWeekPast.push(deal);

        isUpdatedWeekCurrent
          ? acc.dealsUpdatedWeekCurrent.push(deal)
          : acc.dealsUpdatedWeekPast.push(deal);

        if (deal.status === STATUS_DEAL.SUCCESS) {
          if (deal.dealMode === MODE_DEAL.BUY) {
            isUpdatedWeekCurrent
              ? acc.dealsSuccessBuyWeekCurrent.push(deal)
              : acc.dealsSuccessBuyWeekPast.push(deal);
          } else if (deal.dealMode === MODE_DEAL.SELL) {
            isUpdatedWeekCurrent
              ? acc.dealsSuccessSellWeekCurrent.push(deal)
              : acc.dealsSuccessSellWeekPast.push(deal);
          }
        }
        return acc;
      },
      {
        dealsCreatedWeekCurrent: [],
        dealsCreatedWeekPast: [],
        dealsUpdatedWeekCurrent: [],
        dealsUpdatedWeekPast: [],
        dealsSuccessBuyWeekCurrent: [],
        dealsSuccessBuyWeekPast: [],
        dealsSuccessSellWeekCurrent: [],
        dealsSuccessSellWeekPast: [],
      },
    );

    const employees = new Map<
      string,
      {
        id: string;
        employeeId: string;
        name: string;
        isSalesperson: boolean;
        isPreSalesperson: boolean;
        limitDeals: {
          weekCurrent: number;
          weekPast: number;
        };
        limitNewDeals: {
          weekCurrent: number;
          weekPast: number;
        };
        limitSuccessBuy: {
          weekCurrent: number;
          weekPast: number;
        };
        limitSuccessSell: {
          weekCurrent: number;
          weekPast: number;
        };
        limitSuccess: {
          weekCurrent: number;
          weekPast: number;
        };
      }
    >();

    deals.forEach((deal) => {
      deal.dealAssignee.forEach((assignee) => {
        const employee = employees.get(assignee.employee.userId) || {
          id: assignee.employee.userId,
          employeeId: assignee.employee.id,
          name: assignee.employee.name,
          isSalesperson: salespeopleIds.has(assignee.employee.id),
          isPreSalesperson: preSalespeopleIds.has(assignee.employee.id),
          limitDeals: {
            weekCurrent: 0,
            weekPast: 0,
          },
          limitNewDeals: {
            weekCurrent: 0,
            weekPast: 0,
          },
          limitSuccessBuy: {
            weekCurrent: 0,
            weekPast: 0,
          },
          limitSuccessSell: {
            weekCurrent: 0,
            weekPast: 0,
          },
          limitSuccess: {
            weekCurrent: 0,
            weekPast: 0,
          },
        };
        employees.set(assignee.employee.userId, employee);
      });
    });

    dealsCreatedWeekCurrent.forEach((deal) => {
      deal.dealAssignee.forEach(
        (assignee: { employee: { userId: string } }) => {
          const employee = employees.get(assignee.employee.userId);
          if (employee) {
            employee.limitNewDeals.weekCurrent++;
          }
        },
      );
    });

    dealsCreatedWeekPast.forEach((deal) => {
      deal.dealAssignee.forEach(
        (assignee: { employee: { userId: string } }) => {
          const employee = employees.get(assignee.employee.userId);
          if (employee) {
            employee.limitNewDeals.weekPast++;
          }
        },
      );
    });

    dealsUpdatedWeekCurrent.forEach((deal) => {
      deal.dealAssignee.forEach(
        (assignee: { employee: { userId: string } }) => {
          const employee = employees.get(assignee.employee.userId);
          if (employee) {
            employee.limitDeals.weekCurrent++;
          }
        },
      );
    });

    dealsUpdatedWeekPast.forEach((deal) => {
      deal.dealAssignee.forEach(
        (assignee: { employee: { userId: string } }) => {
          const employee = employees.get(assignee.employee.userId);
          if (employee) {
            employee.limitDeals.weekPast++;
          }
        },
      );
    });

    dealsSuccessBuyWeekCurrent.forEach((deal) => {
      deal.dealAssignee.forEach(
        (assignee: { employee: { userId: string } }) => {
          const employee = employees.get(assignee.employee.userId);
          if (employee) {
            employee.limitSuccessBuy.weekCurrent++;
            employee.limitSuccess.weekCurrent++;
          }
        },
      );
    });

    dealsSuccessBuyWeekPast.forEach((deal) => {
      deal.dealAssignee.forEach(
        (assignee: { employee: { userId: string } }) => {
          const employee = employees.get(assignee.employee.userId);
          if (employee) {
            employee.limitSuccessBuy.weekPast++;
            employee.limitSuccess.weekPast++;
          }
        },
      );
    });

    dealsSuccessSellWeekCurrent.forEach((deal) => {
      deal.dealAssignee.forEach(
        (assignee: { employee: { userId: string } }) => {
          const employee = employees.get(assignee.employee.userId);
          if (employee) {
            employee.limitSuccessSell.weekCurrent++;
            employee.limitSuccess.weekCurrent++;
          }
        },
      );
    });

    dealsSuccessSellWeekPast.forEach((deal) => {
      deal.dealAssignee.forEach(
        (assignee: { employee: { userId: string } }) => {
          const employee = employees.get(assignee.employee.userId);
          if (employee) {
            employee.limitSuccessSell.weekPast++;
            employee.limitSuccess.weekPast++;
          }
        },
      );
    });

    const salespeople = Array.from(employees.values()).filter(
      (c) => c.isSalesperson,
    );
    const preSalespeople = Array.from(employees.values()).filter(
      (c) => c.isPreSalesperson,
    );

    const salespersonMoreDeals =
      salespeople.length > 0
        ? salespeople.reduce((prev, current) =>
            prev.limitDeals.weekCurrent > current.limitDeals.weekCurrent
              ? prev
              : current,
          )
        : null;

    const salespersonMoreSales =
      salespeople.length > 0
        ? salespeople.reduce((prev, current) =>
            prev.limitSuccessSell.weekCurrent >
            current.limitSuccessSell.weekCurrent
              ? prev
              : current,
          )
        : null;

    const salespersonMorePurchases =
      salespeople.length > 0
        ? salespeople.reduce((prev, current) =>
            prev.limitSuccessBuy.weekCurrent >
            current.limitSuccessBuy.weekCurrent
              ? prev
              : current,
          )
        : null;

    const preSalespersonMoreSuccesses =
      preSalespeople.length > 0
        ? preSalespeople.reduce((prev, current) =>
            prev.limitSuccess.weekCurrent > current.limitSuccess.weekCurrent
              ? prev
              : current,
          )
        : null;

    const preSalespersonMoreDeals =
      preSalespeople.length > 0
        ? preSalespeople.reduce((prev, current) =>
            prev.limitDeals.weekCurrent > current.limitDeals.weekCurrent
              ? prev
              : current,
          )
        : null;

    const topPerformers = {
      salesperson: {
        moreDeals: salespersonMoreDeals
          ? {
              id: salespersonMoreDeals.employeeId,
              name: salespersonMoreDeals.name,
              limit: salespersonMoreDeals.limitDeals.weekCurrent,
              variation: this.calculateDifferencePercentage(
                salespersonMoreDeals.limitDeals.weekCurrent,
                salespersonMoreDeals.limitDeals.weekPast,
              ),
            }
          : null,
        moreSales: salespersonMoreSales
          ? {
              id: salespersonMoreSales.employeeId,
              name: salespersonMoreSales.name,
              limit: salespersonMoreSales.limitSuccessSell.weekCurrent,
              variation: this.calculateDifferencePercentage(
                salespersonMoreSales.limitSuccessSell.weekCurrent,
                salespersonMoreSales.limitSuccessSell.weekPast,
              ),
            }
          : null,
        morePurchases: salespersonMorePurchases
          ? {
              id: salespersonMorePurchases.employeeId,
              name: salespersonMorePurchases.name,
              limit: salespersonMorePurchases.limitSuccessBuy.weekCurrent,
              variation: this.calculateDifferencePercentage(
                salespersonMorePurchases.limitSuccessBuy.weekCurrent,
                salespersonMorePurchases.limitSuccessBuy.weekPast,
              ),
            }
          : null,
      },
      preSalesperson: {
        moreSuccesses: preSalespersonMoreSuccesses
          ? {
              id: preSalespersonMoreSuccesses.employeeId,
              name: preSalespersonMoreSuccesses.name,
              limit: preSalespersonMoreSuccesses.limitSuccess.weekCurrent,
              variation: this.calculateDifferencePercentage(
                preSalespersonMoreSuccesses.limitSuccess.weekCurrent,
                preSalespersonMoreSuccesses.limitSuccess.weekPast,
              ),
            }
          : null,
        moreDeals: preSalespersonMoreDeals
          ? {
              id: preSalespersonMoreDeals.employeeId,
              name: preSalespersonMoreDeals.name,
              limit: preSalespersonMoreDeals.limitDeals.weekCurrent,
              variation: this.calculateDifferencePercentage(
                preSalespersonMoreDeals.limitDeals.weekCurrent,
                preSalespersonMoreDeals.limitDeals.weekPast,
              ),
            }
          : null,
      },
    };

    return {
      topPerformers,
    };
  }
}
