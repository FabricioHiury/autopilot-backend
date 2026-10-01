import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  STATUS_DEAL,
  TEMPERATURE_DEAL,
  ORIGIN_DEAL,
  STATUS_DEAL_MAP,
  MODE_DEAL,
} from 'src/utils/enum/deal.enum';
import {
  FilterReportDto,
  ReportSalespersonDto,
  ReportChannelsDto,
  ReportDetailedSalespersonDto,
  ReportGeneralDto,
  RankingSalespersonDto,
  FilterTop3SalespeopleDto,
  UserLoggedInSalesDto,
  Top3SalespeopleDto,
  ReportSalespeopleByModeDto,
} from './dto/report-deals.dto';
import {
  startOfMonth,
  endOfMonth,
  format,
  differenceInHours,
  differenceInMinutes,
  subDays,
  differenceInDays,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sender } from '../chat/enum/channel.enum';

@Injectable()
export class ReportsDealsService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Calcula a diferença em minutos entre duas datas considerando apenas dias úteis (segunda a sexta)
   * @param dataInicio Data de início
   * @param dataFim Data de fim
   * @returns Diferença em minutos considerando apenas dias úteis
   */
  private calculateDifferenceMinutesDaysBusiness(
    dataStart: Date,
    dataEnd: Date,
  ): number {
    if (dataStart >= dataEnd) return 0;

    let minutesBusiness = 0;
    const start = new Date(dataStart);
    const end = new Date(dataEnd);

    // Se as datas são no mesmo dia
    if (start.toDateString() === end.toDateString()) {
      const dayWeek = start.getDay();
      // 0 = domingo, 6 = sábado
      if (dayWeek >= 1 && dayWeek <= 5) {
        return differenceInMinutes(end, start);
      }
      return 0; // Fim de semana
    }

    // Processar dia por dia
    const dataCurrent = new Date(start);

    while (dataCurrent < end) {
      const dayWeek = dataCurrent.getDay();

      // Se é dia útil (segunda a sexta)
      if (dayWeek >= 1 && dayWeek <= 5) {
        const startToday = new Date(dataCurrent);
        const endToday = new Date(dataCurrent);
        endToday.setHours(23, 59, 59, 999);

        // Se é o primeiro dia
        if (dataCurrent.toDateString() === start.toDateString()) {
          startToday.setTime(start.getTime());
        } else {
          startToday.setHours(0, 0, 0, 0);
        }

        // Se é o último dia
        if (dataCurrent.toDateString() === end.toDateString()) {
          endToday.setTime(end.getTime());
        }

        if (startToday < endToday) {
          minutesBusiness += differenceInMinutes(endToday, startToday);
        }
      }

      // Avançar para o próximo dia
      dataCurrent.setDate(dataCurrent.getDate() + 1);
      dataCurrent.setHours(0, 0, 0, 0);
    }

    return minutesBusiness;
  }

  /**
   * Formata tempo em minutos para uma string no formato "Xd Xh Xmin"
   * @param minutos Tempo em minutos
   * @returns String formatada do tempo no formato "Xd Xh Xmin"
   */
  private formatTime(minutes: number): string {
    if (minutes <= 0) return '0min';

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const minutesRemaining = Math.floor(minutes % 60);

    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days}d`);
    }

    if (hours > 0) {
      parts.push(`${hours}h`);
    }

    if (minutesRemaining > 0) {
      parts.push(`${minutesRemaining}min`);
    }

    // Se não há nenhuma parte (caso of 0 minutes), retorna 0min
    if (parts.length === 0) {
      return '0min';
    }

    return parts.join(' ');
  }

  // Type guard for check se mode é um MODE_DEAL váisRead
  private isModeDeal(mode: MODE_DEAL | 'total'): mode is MODE_DEAL {
    return (
      mode !== 'total' && Object.values(MODE_DEAL).includes(mode as MODE_DEAL)
    );
  }

  private readonly channelMetadata = {
    [ORIGIN_DEAL.FACEBOOK]: {
      nameDisplay: 'Facebook',
      iconUrl: '/icons/facebook.svg',
    },
    [ORIGIN_DEAL.INSTAGRAM]: {
      nameDisplay: 'Instagram',
      iconUrl: '/icons/instagram.svg',
    },
    [ORIGIN_DEAL.WHATSAPP]: {
      nameDisplay: 'WhatsApp',
      iconUrl: '/icons/whatsapp.svg',
    },
    [ORIGIN_DEAL.OLX]: {
      nameDisplay: 'OLX',
      iconUrl: '/icons/olx.svg',
    },
    [ORIGIN_DEAL.SHOWROOM]: {
      nameDisplay: 'Showroom',
      iconUrl: '/icons/showroom.svg',
    },
    [ORIGIN_DEAL.USADOSBR]: {
      nameDisplay: 'UsadosBR',
      iconUrl: '/icons/usadosbr.svg',
    },
    [ORIGIN_DEAL.ICARROS]: {
      nameDisplay: 'iCarros',
      iconUrl: '/icons/icarros.svg',
    },
    [ORIGIN_DEAL.MOBIAUTO]: {
      nameDisplay: 'Mobiauto',
      iconUrl: '/icons/mobiauto.svg',
    },
    [ORIGIN_DEAL.WEBMOTORS]: {
      nameDisplay: 'Webmotors',
      iconUrl: '/icons/webmotors.svg',
    },
    [ORIGIN_DEAL.CALL]: {
      nameDisplay: 'Call',
      iconUrl: '/icons/phone.svg',
    },
    [ORIGIN_DEAL.SITE]: {
      nameDisplay: 'Site',
      iconUrl: '/icons/site.svg',
    },
    [ORIGIN_DEAL.PORTFOLIO]: {
      nameDisplay: 'Portfolio',
      iconUrl: '/icons/portfolio.svg',
    },
    [ORIGIN_DEAL.REFERRAL]: {
      nameDisplay: 'Referral',
      iconUrl: '/icons/referral.svg',
    },
    [ORIGIN_DEAL.OTHER]: {
      nameDisplay: 'Other',
      iconUrl: '/icons/others.svg',
    },
  };

  // 1. Relatório of Deals by Salesperson
  async generateReportBySalesperson(
    storeId: string,
    filter: FilterReportDto,
  ): Promise<any[]> {
    return await this.processDataSalespeopleByMode(storeId, filter);
  }

  private async processDataSalespeopleByMode(
    storeId: string,
    filter: FilterReportDto,
  ): Promise<ReportSalespeopleByModeDto[]> {
    const dataStart = new Date(filter.dataStart);
    const dataEnd = new Date(filter.dataEnd);

    let whereCondition: any = {
      storeId,
      status: 'active',
      roles: {
        some: {
          role: {
            in: ['Salesperson', 'Pre-salesperson'],
          },
        },
      },
    };

    if (filter.employeeId) {
      whereCondition.id = filter.employeeId;
    }

    const employees = await this.prismaService.employee.findMany({
      where: whereCondition,
      include: {
        user: true,
        _count: {
          select: {
            dealAssignee: {
              where: {
                deal: {
                  createdAt: {
                    gte: dataStart,
                    lte: dataEnd,
                  },
                },
              },
            },
          },
        },
      },
    });

    const modes = [...Object.values(MODE_DEAL)];
    const resultByMode = [];

    for (const mode of modes) {
      const salespeopleOfMode = [];

      if (!filter.employeeId && employees.length > 0) {
        // Relatório consolidated for o mode
        const reportConsolidated =
          await this.generateReportConsolidatedSalespeopleSimpleByMode(
            storeId,
            dataStart,
            dataEnd,
            employees,
            mode,
          );
        salespeopleOfMode.push(...reportConsolidated);
      } else {
        // Relatórios individuais for o mode
        for (const employee of employees) {
          const report = await this.generateReportSalespersonByMode(
            employee,
            storeId,
            dataStart,
            dataEnd,
            mode,
          );
          salespeopleOfMode.push(report);
        }
      }

      // Calculate totais of mode
      const totalLeads = salespeopleOfMode.reduce(
        (sum, v) => sum + v.totalLeads,
        0,
      );
      const totalConversions = salespeopleOfMode.reduce(
        (sum, v) => sum + v.converted,
        0,
      );
      const averageConversionGeneral =
        totalLeads > 0
          ? parseFloat(((totalConversions / totalLeads) * 100).toFixed(2))
          : 0;

      // Calculate totais of deals showroom and online for o mode
      const totalShowroom = await this.calculateTotalDealsShowroomByMode(
        storeId,
        dataStart,
        dataEnd,
        mode,
        filter.employeeId,
      );
      const totalOnline = await this.calculateTotalDealsOnlineByMode(
        storeId,
        dataStart,
        dataEnd,
        mode,
        filter.employeeId,
      );

      // Calculate conversões online (não showroom)
      const numberConversionOnline = await this.prismaService.deal.count({
        where: {
          storeId,
          createdAt: { gte: dataStart, lte: dataEnd },
          status: STATUS_DEAL.SUCCESS,
          dealOrigin: { not: ORIGIN_DEAL.SHOWROOM },
          ...(this.isModeDeal(mode) && { dealMode: mode }),
          ...(filter.employeeId && {
            dealAssignee: { some: { employeeId: filter.employeeId } },
          }),
        },
      });

      // Calculate conversões showroom
      const numberConversionShowroom = await this.prismaService.deal.count({
        where: {
          storeId,
          createdAt: { gte: dataStart, lte: dataEnd },
          status: STATUS_DEAL.SUCCESS,
          dealOrigin: ORIGIN_DEAL.SHOWROOM,
          ...(this.isModeDeal(mode) && { dealMode: mode }),
          ...(filter.employeeId && {
            dealAssignee: { some: { employeeId: filter.employeeId } },
          }),
        },
      });

      // Calculate total of deals showroom for rate of conversão
      const totalDealsShowroom = await this.prismaService.deal.count({
        where: {
          storeId,
          createdAt: { gte: dataStart, lte: dataEnd },
          dealOrigin: ORIGIN_DEAL.SHOWROOM,
          status: {
            in: [
              STATUS_DEAL.DEAL_INITIAL,
              STATUS_DEAL.VISIT,
              STATUS_DEAL.AT_NEGOTIATION,
              STATUS_DEAL.SUCCESS,
            ],
          },
          ...(this.isModeDeal(mode) && { dealMode: mode }),
          ...(filter.employeeId && {
            dealAssignee: { some: { employeeId: filter.employeeId } },
          }),
        },
      });

      // Calculate rate of conversão showroom
      const rateConversionShowroom =
        totalDealsShowroom > 0
          ? (numberConversionShowroom / totalDealsShowroom) * 100
          : 0;

      // Calculate rate of conversão online for o mode
      const rateConversionOnline =
        await this.calculateRateConversionOnlineByMode(
          storeId,
          dataStart,
          dataEnd,
          mode,
          filter.employeeId,
        );

      resultByMode.push({
        mode: mode,
        salespeople: salespeopleOfMode,
        totalLeads,
        totalConversions,
        averageConversionGeneral,
        percentageConversion: averageConversionGeneral,
        numberConversionOnline,
        numberConversionShowroom,
        rateConversionShowroom,
        totalShowroom,
        totalOnline,
        rateConversionOnline,
      });
    }

    // Sempre add o mode "total" to final
    const salespeopleTotal = [];

    if (!filter.employeeId && employees.length > 0) {
      // Relatório consolidated for o mode total
      const reportConsolidatedTotal =
        await this.generateReportConsolidatedSalespeopleSimpleByMode(
          storeId,
          dataStart,
          dataEnd,
          employees,
          'total',
        );
      salespeopleTotal.push(...reportConsolidatedTotal);
    } else {
      // Relatórios individuais for o mode total
      for (const employee of employees) {
        const reportTotal = await this.generateReportSalespersonByMode(
          employee,
          storeId,
          dataStart,
          dataEnd,
          'total',
        );
        salespeopleTotal.push(reportTotal);
      }
    }

    // Calculate totais of mode "total"
    const totalLeadsTotal = salespeopleTotal.reduce(
      (sum, v) => sum + v.totalLeads,
      0,
    );
    const totalConversionsTotal = salespeopleTotal.reduce(
      (sum, v) => sum + v.converted,
      0,
    );
    const averageConversionGeneralTotal =
      totalLeadsTotal > 0
        ? parseFloat(
            ((totalConversionsTotal / totalLeadsTotal) * 100).toFixed(2),
          )
        : 0;

    // Calculate totais of deals showroom and online for o mode "total"
    const totalShowroomTotal = await this.calculateTotalDealsShowroomByMode(
      storeId,
      dataStart,
      dataEnd,
      'total',
      filter.employeeId,
    );
    const totalOnlineTotal = await this.calculateTotalDealsOnlineByMode(
      storeId,
      dataStart,
      dataEnd,
      'total',
      filter.employeeId,
    );

    // Calculate rate of conversão online for o mode "total"
    const rateConversionOnlineTotal =
      await this.calculateRateConversionOnlineByMode(
        storeId,
        dataStart,
        dataEnd,
        'total',
        filter.employeeId,
      );

    // Calculate conversões for o mode "total"
    const numberConversionOnlineTotal = await this.prismaService.deal.count({
      where: {
        storeId,
        createdAt: { gte: dataStart, lte: dataEnd },
        status: STATUS_DEAL.SUCCESS,
        dealOrigin: { not: ORIGIN_DEAL.SHOWROOM },
        ...(filter.employeeId && {
          dealAssignee: { some: { employeeId: filter.employeeId } },
        }),
      },
    });

    const numberConversionShowroomTotal = await this.prismaService.deal.count({
      where: {
        storeId,
        createdAt: { gte: dataStart, lte: dataEnd },
        status: STATUS_DEAL.SUCCESS,
        dealOrigin: ORIGIN_DEAL.SHOWROOM,
        ...(filter.employeeId && {
          dealAssignee: { some: { employeeId: filter.employeeId } },
        }),
      },
    });

    const rateConversionShowroomTotal =
      totalShowroomTotal > 0
        ? (numberConversionShowroomTotal / totalShowroomTotal) * 100
        : 0;

    resultByMode.push({
      mode: 'total',
      salespeople: salespeopleTotal,
      totalLeads: totalLeadsTotal,
      totalConversions: totalConversionsTotal,
      averageConversionGeneral: averageConversionGeneralTotal,
      percentageConversion: averageConversionGeneralTotal,
      numberConversionOnline: numberConversionOnlineTotal,
      numberConversionShowroom: numberConversionShowroomTotal,
      rateConversionShowroom: rateConversionShowroomTotal,
      totalShowroom: totalShowroomTotal,
      totalOnline: totalOnlineTotal,
      rateConversionOnline: rateConversionOnlineTotal,
    });

    return resultByMode;
  }

  private async generateReportSalespersonByMode(
    employee: any,
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
  ): Promise<ReportSalespersonDto> {
    // Se o mode for "total", consolidar data of all os modes
    if (mode === 'total') {
      const modes = Object.values(MODE_DEAL);

      // Find data of all os modes
      const dataByMode = await Promise.all(
        modes.map(async (modeCurrent) => {
          const [
            statusCounts,
            temperatureCounts,
            seriesHistorical,
            timeAverageReply,
            timeAverageCompletion,
            conversionByTemperature,
            timeAverageByStage,
          ] = await Promise.all([
            this.getStatusCountsForEmployeeByMode(
              employee.id,
              dataStart,
              dataEnd,
              modeCurrent,
            ),
            this.getTemperatureCountsForEmployeeByMode(
              employee.id,
              dataStart,
              dataEnd,
              modeCurrent,
            ),
            this.generateSeriesHistoricalMonthlyByMode(
              employee.id,
              dataStart,
              dataEnd,
              modeCurrent,
            ),
            this.calculateTimeAverageReplyEmployeeByMode(
              employee.id,
              storeId,
              dataStart,
              dataEnd,
              modeCurrent,
            ),
            this.calculateTimeAverageCompletionByMode(
              storeId,
              dataStart,
              dataEnd,
              modeCurrent,
              employee.id,
            ),
            this.calculateConversionByTemperatureByMode(
              storeId,
              dataStart,
              dataEnd,
              modeCurrent,
              employee.id,
            ),
            this.calculateTimeAverageByStageByMode(
              storeId,
              dataStart,
              dataEnd,
              modeCurrent,
              employee.id,
            ),
          ]);

          return {
            statusCounts,
            temperatureCounts,
            seriesHistorical,
            timeAverageReply,
            timeAverageCompletion,
            conversionByTemperature,
            timeAverageByStage,
          };
        }),
      );

      // Consolidar status counts
      const statusCountsConsolidated = dataByMode.reduce((acc, data) => {
        data.statusCounts.forEach((item) => {
          const existing = acc.find((a) => a.status === item.status);
          if (existing) {
            existing._count.status += item._count.status;
          } else {
            acc.push({ ...item });
          }
        });
        return acc;
      }, [] as any[]);

      // Consolidar temperature counts
      const temperatureCountsConsolidated = dataByMode.reduce((acc, data) => {
        data.temperatureCounts.forEach((item) => {
          const existing = acc.find((a) => a.temperature === item.temperature);
          if (existing) {
            existing._count.temperature += item._count.temperature;
          } else {
            acc.push({ ...item });
          }
        });
        return acc;
      }, [] as any[]);

      // Consolidar série histórica
      const seriesHistoricalConsolidated = dataByMode.reduce((acc, data) => {
        data.seriesHistorical.forEach((item) => {
          const existing = acc.find((a) => a.month === item.month);
          if (existing) {
            existing.totalLeads += item.totalLeads;
            existing.converted += item.converted;
            existing.rateConversion =
              existing.totalLeads > 0
                ? parseFloat(
                    ((existing.converted / existing.totalLeads) * 100).toFixed(
                      2,
                    ),
                  )
                : 0;
          } else {
            acc.push({ ...item });
          }
        });
        return acc;
      }, [] as any[]);

      // Usar data consolidated
      const statusCounts = statusCountsConsolidated;
      const temperatureCounts = temperatureCountsConsolidated;
      const seriesHistorical = seriesHistoricalConsolidated;
      const timeAverageReply =
        await this.calculateTimeAverageReplyEmployeeByMode(
          employee.id,
          storeId,
          dataStart,
          dataEnd,
          mode,
        );
      const timeAverageCompletion =
        await this.calculateTimeAverageCompletionByMode(
          storeId,
          dataStart,
          dataEnd,
          mode,
          employee.id,
        );
      const conversionByTemperature =
        await this.calculateConversionByTemperature(
          storeId,
          dataStart,
          dataEnd,
          employee.id,
        );
      const timeAverageByStage = await this.calculateTimeAverageByStage(
        storeId,
        dataStart,
        dataEnd,
        employee.id,
      );
      const reasonsLossesBusiness = await this.calculateReasonsLossesBusiness(
        storeId,
        dataStart,
        dataEnd,
        employee.id,
      );

      // Continuar with o processamento normal usando os data consolidated
      const totalLeads = statusCounts.reduce(
        (sum, item) => sum + item._count.status,
        0,
      );
      const converted =
        statusCounts.find((s) => s.status === STATUS_DEAL.SUCCESS)?._count
          .status || 0;
      const dealsNotCompleted =
        statusCounts.find((s) => s.status === STATUS_DEAL.LOST)?._count
          .status || 0;

      const atDeal = statusCounts
        .filter((s) =>
          [
            STATUS_DEAL.CHAT,
            STATUS_DEAL.PRE_DEAL,
            STATUS_DEAL.DEAL_INITIAL,
            STATUS_DEAL.AT_NEGOTIATION,
          ].includes(s.status as STATUS_DEAL),
        )
        .reduce((sum, item) => sum + item._count.status, 0);

      const atRecovery =
        statusCounts.find((s) => s.status === STATUS_DEAL.RECOVERY)?._count
          .status || 0;

      const leadsQualified = statusCounts
        .filter((s) =>
          [
            STATUS_DEAL.DEAL_INITIAL,
            STATUS_DEAL.VISIT,
            STATUS_DEAL.AT_NEGOTIATION,
            STATUS_DEAL.SUCCESS,
          ].includes(s.status as STATUS_DEAL),
        )
        .reduce((sum, item) => sum + item._count.status, 0);

      const rateConversion =
        totalLeads > 0
          ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
          : 0;
      const rateSuccess =
        totalLeads > 0
          ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
          : 0;
      const rateFailure =
        totalLeads > 0
          ? parseFloat(((dealsNotCompleted / totalLeads) * 100).toFixed(2))
          : 0;
      const averageQualification =
        totalLeads > 0
          ? parseFloat(((leadsQualified / totalLeads) * 100).toFixed(2))
          : 0;

      const segmentationTemperature = {
        cold:
          temperatureCounts.find((t) => t.temperature === TEMPERATURE_DEAL.COLD)
            ?._count.temperature || 0,
        warm:
          temperatureCounts.find((t) => t.temperature === TEMPERATURE_DEAL.WARM)
            ?._count.temperature || 0,
        hot:
          temperatureCounts.find((t) => t.temperature === TEMPERATURE_DEAL.HOT)
            ?._count.temperature || 0,
        total: totalLeads,
      };

      return {
        id: employee.id,
        name: employee.name || employee.user?.name || 'Without name',
        avatar: employee.user?.photoUrl || employee.photoUrl || undefined,
        dataStart,
        totalLeads,
        atDeal,
        atRecovery,
        converted,
        rateConversion,
        segmentationTemperature,
        segmentationTemperatureQualification:
          await this.calculateSegmentationTemperatureQualification(
            storeId,
            dataStart,
            dataEnd,
            undefined,
            employee.id,
          ),
        dealsWellSucceeded: converted,
        rateSuccess,
        dealsNotCompleted,
        rateFailure,
        averageQualification,
        averageConversion: rateConversion,
        seriesHistorical,
        failures: dealsNotCompleted,
        timeAverageReply,
        timeAverageCompletion,
        conversionByTemperature,
        timeAverageByStage,
        reasonsLossesBusiness,
        numberConversionOnline: 0,
        percentageConversion: rateConversion,
        rateConversionShowroom: 0,
        numberConversionShowroom: 0,
        leadsVsConversionsSalesperson: [],
      };
    }

    // Processamento normal for modes específicos
    const [
      statusCounts,
      temperatureCounts,
      seriesHistorical,
      timeAverageReply,
      timeAverageCompletion,
      conversionByTemperature,
      timeAverageByStage,
      reasonsLossesBusiness,
      segmentationTemperatureQualification,
    ] = await Promise.all([
      this.getStatusCountsForEmployeeByMode(
        employee.id,
        dataStart,
        dataEnd,
        mode,
      ),
      this.getTemperatureCountsForEmployeeByMode(
        employee.id,
        dataStart,
        dataEnd,
        mode,
      ),
      this.generateSeriesHistoricalMonthlyByMode(
        employee.id,
        dataStart,
        dataEnd,
        mode,
      ),
      this.calculateTimeAverageReplyEmployeeByMode(
        employee.id,
        storeId,
        dataStart,
        dataEnd,
        mode,
      ),
      this.calculateTimeAverageCompletionByMode(
        storeId,
        dataStart,
        dataEnd,
        mode,
        employee.id,
      ),
      this.calculateConversionByTemperatureByMode(
        storeId,
        dataStart,
        dataEnd,
        mode,
        employee.id,
      ),
      this.calculateTimeAverageByStageByMode(
        storeId,
        dataStart,
        dataEnd,
        mode,
        employee.id,
      ),
      this.calculateReasonsLossesBusiness(
        storeId,
        dataStart,
        dataEnd,
        employee.id,
        mode,
      ),
      this.calculateSegmentationTemperatureQualification(
        storeId,
        dataStart,
        dataEnd,
        mode,
        employee.id,
      ),
    ]);

    const totalLeads = statusCounts.reduce(
      (sum, item) => sum + item._count.status,
      0,
    );
    const converted =
      statusCounts.find((s) => s.status === STATUS_DEAL.SUCCESS)?._count
        .status || 0;
    const dealsNotCompleted =
      statusCounts.find((s) => s.status === STATUS_DEAL.LOST)?._count.status ||
      0;

    const atDeal = statusCounts
      .filter((s) =>
        [
          STATUS_DEAL.CHAT,
          STATUS_DEAL.PRE_DEAL,
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.AT_NEGOTIATION,
        ].includes(s.status as STATUS_DEAL),
      )
      .reduce((sum, item) => sum + item._count.status, 0);

    const atRecovery =
      statusCounts.find((s) => s.status === STATUS_DEAL.RECOVERY)?._count
        .status || 0;

    const leadsQualified = statusCounts
      .filter((s) =>
        [
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.VISIT,
          STATUS_DEAL.AT_NEGOTIATION,
          STATUS_DEAL.SUCCESS,
        ].includes(s.status as STATUS_DEAL),
      )
      .reduce((sum, item) => sum + item._count.status, 0);

    const rateConversion =
      totalLeads > 0
        ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
        : 0;
    const rateSuccess =
      totalLeads > 0
        ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
        : 0;
    const rateFailure =
      totalLeads > 0
        ? parseFloat(((dealsNotCompleted / totalLeads) * 100).toFixed(2))
        : 0;
    const averageQualification =
      totalLeads > 0
        ? parseFloat(((leadsQualified / totalLeads) * 100).toFixed(2))
        : 0;

    // Keep a segmentação simple for compatibilidade
    const segmentationTemperature = {
      cold:
        temperatureCounts.find((t) => t.temperature === TEMPERATURE_DEAL.COLD)
          ?._count.temperature || 0,
      warm:
        temperatureCounts.find((t) => t.temperature === TEMPERATURE_DEAL.WARM)
          ?._count.temperature || 0,
      hot:
        temperatureCounts.find((t) => t.temperature === TEMPERATURE_DEAL.HOT)
          ?._count.temperature || 0,
      total: totalLeads,
    };

    // Calculate conversões online (não showroom)
    const numberConversionOnline = await this.prismaService.deal.count({
      where: {
        storeId,
        createdAt: { gte: dataStart, lte: dataEnd },
        status: STATUS_DEAL.SUCCESS,
        dealOrigin: { not: ORIGIN_DEAL.SHOWROOM },
        ...(this.isModeDeal(mode) && { dealMode: mode }),
        dealAssignee: { some: { employeeId: employee.id } },
      },
    });

    // Calculate conversões showroom
    const numberConversionShowroom = await this.prismaService.deal.count({
      where: {
        storeId,
        createdAt: { gte: dataStart, lte: dataEnd },
        status: STATUS_DEAL.SUCCESS,
        dealOrigin: ORIGIN_DEAL.SHOWROOM,
        ...(this.isModeDeal(mode) && { dealMode: mode }),
        dealAssignee: { some: { employeeId: employee.id } },
      },
    });

    // Calculate total of deals showroom for rate of conversão
    const totalDealsShowroom = await this.prismaService.deal.count({
      where: {
        storeId,
        createdAt: { gte: dataStart, lte: dataEnd },
        dealOrigin: ORIGIN_DEAL.SHOWROOM,
        status: {
          in: [
            STATUS_DEAL.DEAL_INITIAL,
            STATUS_DEAL.VISIT,
            STATUS_DEAL.AT_NEGOTIATION,
            STATUS_DEAL.SUCCESS,
          ],
        },
        ...(this.isModeDeal(mode) && { dealMode: mode }),
        dealAssignee: { some: { employeeId: employee.id } },
      },
    });

    // Calculate percentage of conversão general
    const percentageConversion =
      totalLeads > 0 ? (converted / totalLeads) * 100 : 0;

    // Calculate rate of conversão showroom
    const rateConversionShowroom =
      totalDealsShowroom > 0
        ? (numberConversionShowroom / totalDealsShowroom) * 100
        : 0;

    // Find all os salespeople of store for leadsVsConversionsSalesperson
    const salespeopleStore = await this.prismaService.employee.findMany({
      where: { storeId },
      include: { user: true },
    });

    // Calculate leads vs conversões for all os salespeople
    const leadsVsConversionsSalesperson = await Promise.all(
      salespeopleStore.map(async (salesperson) => {
        const leadsSalesperson = await this.prismaService.deal.count({
          where: {
            storeId,
            createdAt: { gte: dataStart, lte: dataEnd },
            ...(this.isModeDeal(mode) && { dealMode: mode }),
            dealAssignee: { some: { employeeId: salesperson.id } },
          },
        });

        const conversionsSalesperson = await this.prismaService.deal.count({
          where: {
            storeId,
            createdAt: { gte: dataStart, lte: dataEnd },
            status: STATUS_DEAL.SUCCESS,
            ...(this.isModeDeal(mode) && { dealMode: mode }),
            dealAssignee: { some: { employeeId: salesperson.id } },
          },
        });

        return {
          id: salesperson.id,
          name: salesperson.name,
          avatar:
            salesperson?.photoUrl || salesperson.user?.photoUrl || undefined,
          leads: leadsSalesperson,
          conversions: conversionsSalesperson,
        };
      }),
    );

    return {
      id: employee.id,
      name: employee.name || employee.user.name || 'Without name',
      avatar: employee.user?.photoUrl || employee.photoUrl || undefined,
      dataStart,
      totalLeads,
      atDeal,
      atRecovery,
      converted,
      rateConversion,
      segmentationTemperature,
      segmentationTemperatureQualification,
      dealsWellSucceeded: converted,
      rateSuccess,
      dealsNotCompleted,
      rateFailure,
      averageQualification,
      averageConversion: rateConversion,
      seriesHistorical,
      failures: dealsNotCompleted,
      timeAverageReply,
      timeAverageCompletion,
      conversionByTemperature,
      timeAverageByStage,
      reasonsLossesBusiness,
      numberConversionOnline,
      percentageConversion,
      rateConversionShowroom,
      numberConversionShowroom,
      leadsVsConversionsSalesperson,
    };
  }

  private async generateReportConsolidatedSalespeopleSimpleByMode(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employees: Array<{ id: string; name: string; avatar?: string }>,
    mode: MODE_DEAL | 'total',
  ): Promise<ReportSalespersonDto[]> {
    // Se o mode for "total", consolidar data of all os modes
    if (mode === 'total') {
      const modes = Object.values(MODE_DEAL);

      // Find deals of all os modes
      const dealsByMode = await Promise.all(
        modes.map(async (modeCurrent) => {
          return await this.prismaService.deal.findMany({
            where: {
              storeId,
              dealMode: modeCurrent,
              createdAt: {
                gte: dataStart,
                lte: dataEnd,
              },
              dealAssignee: {
                some: {
                  employeeId: {
                    in: employees.map((c) => c.id),
                  },
                },
              },
            },
            include: {
              dealAssignee: true,
            },
          });
        }),
      );

      // Consolidar all os deals
      const deals = dealsByMode.flat();

      // Consolidar data
      const statusCounts = deals.reduce(
        (acc, deal) => {
          acc[deal.status] = (acc[deal.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const temperatureCounts = deals.reduce(
        (acc, deal) => {
          if (deal.temperature) {
            acc[deal.temperature] = (acc[deal.temperature] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      const totalLeads = deals.length;
      const converted = statusCounts[STATUS_DEAL.SUCCESS] || 0;
      const dealsNotCompleted = statusCounts[STATUS_DEAL.LOST] || 0;

      const atDeal = [
        STATUS_DEAL.CHAT,
        STATUS_DEAL.PRE_DEAL,
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.AT_NEGOTIATION,
      ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

      const atRecovery = statusCounts[STATUS_DEAL.RECOVERY] || 0;

      const leadsQualified = [
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.VISIT,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.SUCCESS,
      ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

      const rateConversion =
        totalLeads > 0
          ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
          : 0;
      const rateSuccess =
        totalLeads > 0
          ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
          : 0;
      const rateFailure =
        totalLeads > 0
          ? parseFloat(((dealsNotCompleted / totalLeads) * 100).toFixed(2))
          : 0;
      const averageQualification =
        totalLeads > 0
          ? parseFloat(((leadsQualified / totalLeads) * 100).toFixed(2))
          : 0;

      const segmentationTemperature = {
        cold: temperatureCounts[TEMPERATURE_DEAL.COLD] || 0,
        warm: temperatureCounts[TEMPERATURE_DEAL.WARM] || 0,
        hot: temperatureCounts[TEMPERATURE_DEAL.HOT] || 0,
        total: totalLeads,
      };

      // Generate série histórica consolidated for all os employees
      const seriesHistorical =
        await this.generateSeriesHistoricalConsolidatedByMode(
          employees.map((c) => c.id),
          dataStart,
          dataEnd,
          'total',
        );

      // Calculate times médios consolidated for all os modes
      const timeAverageReply = await this.calculateTimeAverageReply(
        storeId,
        dataStart,
        dataEnd,
      );
      const timeAverageCompletion = await this.calculateTimeAverageCompletion(
        storeId,
        dataStart,
        dataEnd,
      );
      const conversionByTemperature =
        await this.calculateConversionByTemperature(
          storeId,
          dataStart,
          dataEnd,
        );
      const timeAverageByStage = await this.calculateTimeAverageByStage(
        storeId,
        dataStart,
        dataEnd,
      );
      const reasonsLossesBusiness = await this.calculateReasonsLossesBusiness(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        mode,
      );

      return [
        {
          id: 'consolidated',
          name: 'All the Employees',
          avatar: undefined,
          dataStart,
          totalLeads,
          atDeal,
          atRecovery,
          converted,
          rateConversion,
          segmentationTemperature,
          segmentationTemperatureQualification:
            await this.calculateSegmentationTemperatureQualification(
              storeId,
              dataStart,
              dataEnd,
              mode,
            ),
          dealsWellSucceeded: converted,
          rateSuccess,
          dealsNotCompleted,
          rateFailure,
          averageQualification,
          averageConversion: rateConversion,
          seriesHistorical,
          failures: dealsNotCompleted,
          timeAverageReply,
          timeAverageCompletion,
          conversionByTemperature,
          timeAverageByStage,
          reasonsLossesBusiness,
          numberConversionOnline: 0,
          percentageConversion: rateConversion,
          rateConversionShowroom: 0,
          numberConversionShowroom: 0,
          leadsVsConversionsSalesperson: [],
        },
      ];
    }

    // Processamento normal for modes específicos
    // Find all os deals of período for o mode específico
    const deals = await this.prismaService.deal.findMany({
      where: {
        storeId,
        dealMode: mode,
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
        dealAssignee: {
          some: {
            employeeId: {
              in: employees.map((c) => c.id),
            },
          },
        },
      },
      include: {
        dealAssignee: true,
      },
    });

    // Consolidar data
    const statusCounts = deals.reduce(
      (acc, deal) => {
        acc[deal.status] = (acc[deal.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const temperatureCounts = deals.reduce(
      (acc, deal) => {
        if (deal.temperature) {
          acc[deal.temperature] = (acc[deal.temperature] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalLeads = deals.length;
    const converted = statusCounts[STATUS_DEAL.SUCCESS] || 0;
    const dealsNotCompleted = statusCounts[STATUS_DEAL.LOST] || 0;

    const atDeal = [
      STATUS_DEAL.CHAT,
      STATUS_DEAL.PRE_DEAL,
      STATUS_DEAL.DEAL_INITIAL,
      STATUS_DEAL.AT_NEGOTIATION,
    ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

    const atRecovery = statusCounts[STATUS_DEAL.RECOVERY] || 0;

    const leadsQualified = [
      STATUS_DEAL.DEAL_INITIAL,
      STATUS_DEAL.VISIT,
      STATUS_DEAL.AT_NEGOTIATION,
      STATUS_DEAL.SUCCESS,
    ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

    const rateConversion =
      totalLeads > 0
        ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
        : 0;
    const rateSuccess =
      totalLeads > 0
        ? parseFloat(((converted / totalLeads) * 100).toFixed(2))
        : 0;
    const rateFailure =
      totalLeads > 0
        ? parseFloat(((dealsNotCompleted / totalLeads) * 100).toFixed(2))
        : 0;
    const averageQualification =
      totalLeads > 0
        ? parseFloat(((leadsQualified / totalLeads) * 100).toFixed(2))
        : 0;

    const segmentationTemperature = {
      cold: temperatureCounts[TEMPERATURE_DEAL.COLD] || 0,
      warm: temperatureCounts[TEMPERATURE_DEAL.WARM] || 0,
      hot: temperatureCounts[TEMPERATURE_DEAL.HOT] || 0,
      total: totalLeads,
    };

    // Generate série histórica consolidated
    const seriesHistorical =
      await this.generateSeriesHistoricalConsolidatedByMode(
        employees.map((c) => c.id),
        dataStart,
        dataEnd,
        mode,
      );

    // Calculate times médios consolidated
    const timeAverageReply = await this.calculateTimeAverageReplyComplete(
      storeId,
      dataStart,
      dataEnd,
      mode,
    );
    const timeAverageCompletion =
      await this.calculateTimeAverageCompletionByMode(
        storeId,
        dataStart,
        dataEnd,
        mode,
      );
    const conversionByTemperature =
      await this.calculateConversionByTemperatureByMode(
        storeId,
        dataStart,
        dataEnd,
        mode,
      );
    const timeAverageByStage = await this.calculateTimeAverageByStageByMode(
      storeId,
      dataStart,
      dataEnd,
      mode,
    );
    const reasonsLossesBusiness = await this.calculateReasonsLossesBusiness(
      storeId,
      dataStart,
      dataEnd,
    );

    return [
      {
        id: 'consolidated',
        name: 'All the Employees',
        avatar: undefined,
        dataStart,
        totalLeads,
        atDeal,
        atRecovery,
        converted,
        rateConversion,
        segmentationTemperature,
        segmentationTemperatureQualification:
          await this.calculateSegmentationTemperatureQualification(
            storeId,
            dataStart,
            dataEnd,
            mode,
          ),
        dealsWellSucceeded: converted,
        rateSuccess,
        dealsNotCompleted,
        rateFailure,
        averageQualification,
        averageConversion: rateConversion,
        seriesHistorical,
        failures: dealsNotCompleted,
        timeAverageReply,
        timeAverageCompletion,
        conversionByTemperature,
        timeAverageByStage,
        reasonsLossesBusiness,
        numberConversionOnline: 0,
        percentageConversion: rateConversion,
        rateConversionShowroom: 0,
        numberConversionShowroom: 0,
        leadsVsConversionsSalesperson: [],
      },
    ];
  }

  async generateRankingSalespeople(
    storeId: string,
    filter: FilterReportDto,
  ): Promise<RankingSalespersonDto> {
    const reports = await this.generateReportBySalesperson(storeId, filter);

    const topConversion = reports
      .sort((a, b) => b.rateConversion - a.rateConversion)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        name: r.name,
        rateConversion: r.rateConversion,
      }));

    const topQualification = reports
      .sort((a, b) => b.averageQualification - a.averageQualification)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        name: r.name,
        averageQualification: r.averageQualification,
      }));

    return {
      topConversion,
      topQualification,
    };
  }

  // 2. Relatório of Deals by Channel
  async generateReportByChannel(
    storeId: string,
    filter: FilterReportDto,
  ): Promise<ReportChannelsDto> {
    // Generate data for cada mode of deal
    const modes = Object.values(MODE_DEAL);
    const data: any[] = [];

    // Process cada mode individualmente
    for (const mode of modes) {
      const filterMode = { ...filter, dealMode: mode };
      const dataMode = await this.processDataChannelsByMode(
        storeId,
        filterMode,
      );
      data.push({
        mode: mode.toLowerCase(),
        ...dataMode,
      });
    }

    // Generate data totais (without filter of mode)
    const filterTotal = { ...filter };
    delete filterTotal.dealMode;
    const dataTotal = await this.processDataChannelsByMode(
      storeId,
      filterTotal,
    );
    data.push({
      mode: 'total',
      ...dataTotal,
    });

    return data as ReportChannelsDto;
  }

  private async processDataChannelsByMode(
    storeId: string,
    filter: FilterReportDto,
  ) {
    const dataStart = new Date(filter.dataStart);
    const dataEnd = new Date(filter.dataEnd);
    const { employeeId, dealMode } = filter;

    const daysPeriod = differenceInDays(dataEnd, dataStart) + 1;
    const dataStartPrevious = subDays(dataStart, daysPeriod);
    const dataEndPrevious = subDays(dataEnd, daysPeriod);

    const whereCondition: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    const whereConditionPrevious: any = {
      storeId,
      createdAt: {
        gte: dataStartPrevious,
        lte: dataEndPrevious,
      },
    };

    if (employeeId) {
      whereCondition.dealAssignee = {
        some: {
          employeeId,
        },
      };
      whereConditionPrevious.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    if (dealMode) {
      whereCondition.dealMode = dealMode;
      whereConditionPrevious.dealMode = dealMode;
    }

    const [dataAggregated, dataDaily, dataMonthly, dataAggregatedPrevious] =
      await Promise.all([
        this.prismaService.deal.groupBy({
          by: ['dealOrigin', 'status'],
          where: whereCondition,
          _count: true,
        }),

        employeeId
          ? dealMode
            ? this.prismaService.$queryRaw`
            SELECT 
              a."deal_origin" AS channel,
              DATE(a."created_at") AS data,
              COUNT(*) AS leads,
              COUNT(CASE WHEN a.status = 'success' THEN 1 END) AS conversions
            FROM "deals" a
            INNER JOIN "deal_assignees" ar ON a."id" = ar."deal_id"
            WHERE a."store_id" = ${storeId}
              AND a."created_at" >= ${dataStart}
              AND a."created_at" <= ${dataEnd}
              AND ar."employee_id" = ${employeeId}
              AND a."deal_mode" = ${dealMode}
            GROUP BY a."deal_origin", DATE(a."created_at")
            ORDER BY a."deal_origin", data
          `
            : this.prismaService.$queryRaw`
            SELECT 
              a."deal_origin" AS channel,
              DATE(a."created_at") AS data,
              COUNT(*) AS leads,
              COUNT(CASE WHEN a.status = 'success' THEN 1 END) AS conversions
            FROM "deals" a
            INNER JOIN "deal_assignees" ar ON a."id" = ar."deal_id"
            WHERE a."store_id" = ${storeId}
              AND a."created_at" >= ${dataStart}
              AND a."created_at" <= ${dataEnd}
              AND ar."employee_id" = ${employeeId}
            GROUP BY a."deal_origin", DATE(a."created_at")
            ORDER BY a."deal_origin", data
          `
          : dealMode
            ? this.prismaService.$queryRaw`
            SELECT 
              "deal_origin" AS channel,
              DATE("created_at") AS data,
              COUNT(*) AS leads,
              COUNT(CASE WHEN status = 'success' THEN 1 END) AS conversions
            FROM "deals"
            WHERE "store_id" = ${storeId}
              AND "created_at" >= ${dataStart}
              AND "created_at" <= ${dataEnd}
              AND "deal_mode" = ${dealMode}
            GROUP BY "deal_origin", DATE("created_at")
            ORDER BY "deal_origin", data
          `
            : this.prismaService.$queryRaw`
            SELECT 
              "deal_origin" AS channel,
              DATE("created_at") AS data,
              COUNT(*) AS leads,
              COUNT(CASE WHEN status = 'success' THEN 1 END) AS conversions
            FROM "deals"
            WHERE "store_id" = ${storeId}
              AND "created_at" >= ${dataStart}
              AND "created_at" <= ${dataEnd}
            GROUP BY "deal_origin", DATE("created_at")
            ORDER BY "deal_origin", data
          `,

        employeeId
          ? dealMode
            ? this.prismaService.$queryRaw`
            SELECT 
              a."deal_origin" AS channel,
              DATE_TRUNC('month', a."created_at") AS month,
              COUNT(*) AS leads,
              COUNT(CASE WHEN a.status IN ('DEAL_INITIAL', 'VISIT', 'AT_NEGOTIATION', 'SUCCESS') THEN 1 END) AS qualifications,
              COUNT(CASE WHEN a.status = 'success' THEN 1 END) AS conversions
            FROM "deals" a
            INNER JOIN "deal_assignees" ar ON a."id" = ar."deal_id"
            WHERE a."store_id" = ${storeId}
              AND a."created_at" >= ${dataStart}
              AND a."created_at" <= ${dataEnd}
              AND ar."employee_id" = ${employeeId}
              AND a."deal_mode" = ${dealMode}
            GROUP BY a."deal_origin", DATE_TRUNC('month', a."created_at")
            ORDER BY a."deal_origin", month
          `
            : this.prismaService.$queryRaw`
            SELECT 
              a."deal_origin" AS channel,
              DATE_TRUNC('month', a."created_at") AS month,
              COUNT(*) AS leads,
              COUNT(CASE WHEN a.status IN ('DEAL_INITIAL', 'VISIT', 'AT_NEGOTIATION', 'SUCCESS') THEN 1 END) AS qualifications,
              COUNT(CASE WHEN a.status = 'success' THEN 1 END) AS conversions
            FROM "deals" a
            INNER JOIN "deal_assignees" ar ON a."id" = ar."deal_id"
            WHERE a."store_id" = ${storeId}
              AND a."created_at" >= ${dataStart}
              AND a."created_at" <= ${dataEnd}
              AND ar."employee_id" = ${employeeId}
            GROUP BY a."deal_origin", DATE_TRUNC('month', a."created_at")
            ORDER BY a."deal_origin", month
          `
          : dealMode
            ? this.prismaService.$queryRaw`
            SELECT 
              "deal_origin" AS channel,
              DATE_TRUNC('month', "created_at") AS month,
              COUNT(*) AS leads,
              COUNT(CASE WHEN status IN ('DEAL_INITIAL', 'VISIT', 'AT_NEGOTIATION', 'SUCCESS') THEN 1 END) AS qualifications,
              COUNT(CASE WHEN status = 'success' THEN 1 END) AS conversions
            FROM "deals"
            WHERE "store_id" = ${storeId}
              AND "created_at" >= ${dataStart}
              AND "created_at" <= ${dataEnd}
              AND "deal_mode" = ${dealMode}
            GROUP BY "deal_origin", DATE_TRUNC('month', "created_at")
            ORDER BY "deal_origin", month
          `
            : this.prismaService.$queryRaw`
            SELECT 
              "deal_origin" AS channel,
              DATE_TRUNC('month', "created_at") AS month,
              COUNT(*) AS leads,
              COUNT(CASE WHEN status IN ('DEAL_INITIAL', 'VISIT', 'AT_NEGOTIATION', 'SUCCESS') THEN 1 END) AS qualifications,
              COUNT(CASE WHEN status = 'success' THEN 1 END) AS conversions
            FROM "deals"
            WHERE "store_id" = ${storeId}
              AND "created_at" >= ${dataStart}
              AND "created_at" <= ${dataEnd}
            GROUP BY "deal_origin", DATE_TRUNC('month', "created_at")
            ORDER BY "deal_origin", month
          `,

        this.prismaService.deal.groupBy({
          by: ['dealOrigin', 'status'],
          where: whereConditionPrevious,
          _count: true,
        }),
      ]);

    const calculateGrowth = (
      valueCurrent: number,
      valuePrevious: number,
    ): number => {
      if (valuePrevious === 0) {
        return valueCurrent > 0 ? 100 : 0;
      }
      return parseFloat(
        (((valueCurrent - valuePrevious) / valuePrevious) * 100).toFixed(2),
      );
    };

    const channelsPreviousMap = new Map<
      string,
      { leadsTotal: number; conversions: number }
    >();

    (Object.values(ORIGIN_DEAL) as string[]).forEach((channel) => {
      channelsPreviousMap.set(channel, {
        leadsTotal: 0,
        conversions: 0,
      });
    });

    dataAggregatedPrevious.forEach((item: any) => {
      const channel = channelsPreviousMap.get(item.dealOrigin);
      if (channel) {
        channel.leadsTotal += item._count;
        if (item.status === STATUS_DEAL.SUCCESS) {
          channel.conversions += item._count;
        }
      }
    });

    const channelsMap = new Map<string, any>();

    (Object.values(ORIGIN_DEAL) as string[]).forEach((channel) => {
      const metadata = this.channelMetadata[channel] || {
        nameDisplay: channel,
        iconUrl: undefined,
      };

      channelsMap.set(channel, {
        channel,
        nameDisplay: metadata.nameDisplay,
        iconUrl: metadata.iconUrl,
        leadsTotal: 0,
        conversions: 0,
        rateConversion: 0,
        summaryDay: [],
        seriesHistorical: [],
      });
    });

    dataAggregated.forEach((item: any) => {
      const channel = channelsMap.get(item.dealOrigin);
      if (channel) {
        channel.leadsTotal += item._count;
        if (item.status === STATUS_DEAL.SUCCESS) {
          channel.conversions += item._count;
        }
      }
    });

    const dataDailyMap = new Map<string, Map<string, any>>();
    (dataDaily as any[]).forEach((item: any) => {
      if (!dataDailyMap.has(item.channel)) {
        dataDailyMap.set(item.channel, new Map());
      }
      dataDailyMap
        .get(item.channel)!
        .set(item.data.toISOString().split('T')[0], {
          data: format(new Date(item.data), 'yyyy-MM-dd'),
          leads: Number(item.leads),
          conversions: Number(item.conversions),
        });
    });

    const dataMonthlyMap = new Map<string, Map<string, any>>();
    (dataMonthly as any[]).forEach((item: any) => {
      if (!dataMonthlyMap.has(item.channel)) {
        dataMonthlyMap.set(item.channel, new Map());
      }
      dataMonthlyMap
        .get(item.channel)!
        .set(format(new Date(item.month), 'yyyy-MM'), {
          month: format(new Date(item.month), 'MMM yyyy', {
            locale: ptBR,
          }).toUpperCase(),
          leads: Number(item.leads),
          qualifications: Number(item.qualifications),
          conversions: Number(item.conversions),
        });
    });

    channelsMap.forEach((channel, channelKey) => {
      channel.rateConversion =
        channel.leadsTotal > 0
          ? parseFloat(
              ((channel.conversions / channel.leadsTotal) * 100).toFixed(2),
            )
          : 0;

      const summaryDailyChannel = dataDailyMap.get(channelKey) || new Map();
      let dataCurrent = new Date(dataStart);
      while (dataCurrent <= dataEnd) {
        const dataStr = format(dataCurrent, 'yyyy-MM-dd');
        channel.summaryDay.push(
          summaryDailyChannel.get(dataStr) || {
            data: dataStr,
            leads: 0,
            conversions: 0,
          },
        );
        dataCurrent = new Date(dataCurrent.getTime() + 24 * 60 * 60 * 1000);
      }

      const seriesMonthlyChannel = dataMonthlyMap.get(channelKey) || new Map();
      let dataCurrentMonth = startOfMonth(dataStart);
      while (dataCurrentMonth <= dataEnd) {
        const monthStr = format(dataCurrentMonth, 'yyyy-MM');
        channel.seriesHistorical.push(
          seriesMonthlyChannel.get(monthStr) || {
            month: monthStr,
            leads: 0,
            qualifications: 0,
            conversions: 0,
          },
        );
        dataCurrentMonth = new Date(
          dataCurrentMonth.getFullYear(),
          dataCurrentMonth.getMonth() + 1,
          1,
        );
      }
    });

    const channels = Array.from(channelsMap.values());

    const totalLeads = channels.reduce(
      (sum, channel) => sum + channel.leadsTotal,
      0,
    );
    const totalConversions = channels.reduce(
      (sum, channel) => sum + channel.conversions,
      0,
    );
    const averageConversionGeneral = parseFloat(
      (totalLeads > 0 ? (totalConversions / totalLeads) * 100 : 0).toFixed(2),
    );

    const highlightsByLeads = channels
      .sort((a, b) => b.leadsTotal - a.leadsTotal)
      .slice(0, 3)
      .map((c) => {
        const channelPrevious = channelsPreviousMap.get(c.channel);
        const growth = calculateGrowth(
          c.leadsTotal,
          channelPrevious?.leadsTotal || 0,
        );
        return {
          channel: c.channel,
          nameDisplay: c.nameDisplay,
          value: c.leadsTotal,
          growth,
        };
      });

    const highlightsByConversations = channels
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 3)
      .map((c) => {
        const channelPrevious = channelsPreviousMap.get(c.channel);
        const growth = calculateGrowth(
          c.conversions,
          channelPrevious?.conversions || 0,
        );
        return {
          channel: c.channel,
          nameDisplay: c.nameDisplay,
          value: c.conversions,
          growth,
        };
      });

    const allLeads: any[] = [];
    const allConversions: any[] = [];

    // Agregar data by channel considerando todo o período
    (Object.values(ORIGIN_DEAL) as string[]).forEach((channel) => {
      const metadata = this.channelMetadata[channel] || {
        nameDisplay: channel,
      };

      const dataChannel = dataMonthlyMap.get(channel);

      if (dataChannel) {
        let totalLeadsChannel = 0;
        let totalConversionsChannel = 0;

        // Somar all os leads and conversões of channel at all os months
        dataChannel.forEach((dataMonth) => {
          totalLeadsChannel += dataMonth.leads;
          totalConversionsChannel += dataMonth.conversions;
        });

        if (totalLeadsChannel > 0) {
          allLeads.push({
            channel,
            nameDisplay: metadata.nameDisplay,
            value: totalLeadsChannel,
          });
        }

        if (totalConversionsChannel > 0) {
          allConversions.push({
            channel,
            nameDisplay: metadata.nameDisplay,
            value: totalConversionsChannel,
          });
        }
      }
    });

    const rankingByLeads = allLeads
      .sort((a, b) => b.value - a.value)
      .slice(0, 7)
      .map((item, index) => ({
        ...item,
        position: index + 1,
      }));

    const rankingByConversions = allConversions
      .sort((a, b) => b.value - a.value)
      .slice(0, 7)
      .map((item, index) => ({
        ...item,
        position: index + 1,
      }));

    return {
      channels: channels.sort((a, b) => b.rateConversion - a.rateConversion),
      totalLeads,
      totalConversions,
      averageConversionGeneral,
      highlights: {
        byLeads: highlightsByLeads,
        byConversations: highlightsByConversations,
      },
      ranking: {
        byLeads: rankingByLeads,
        byConversions: rankingByConversions,
      },
    };
  }

  // 3. Relatório Detailed by Salesperson
  async generateReportDetailedSalesperson(
    storeId: string,
    filter: FilterReportDto,
    idUserLoggedIn?: string,
  ): Promise<ReportDetailedSalespersonDto[]> {
    const dataStart = new Date(filter.dataStart);
    const dataEnd = new Date(filter.dataEnd);

    if (!filter.employeeId) {
      const reportConsolidated =
        await this.generateReportConsolidatedSalespeople(
          storeId,
          dataStart,
          dataEnd,
          idUserLoggedIn,
        );
      return reportConsolidated;
    }

    const employee = await this.prismaService.employee.findUnique({
      where: { id: filter.employeeId, storeId },
      include: {
        user: true,
        dealAssignee: {
          include: {
            deal: {
              include: {
                customer: true,
                temporaryCustomer: true,
                dealVisit: true,
                chat: {
                  include: {
                    message: {
                      orderBy: { createdAt: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
          where: {
            deal: {
              createdAt: {
                gte: dataStart,
                lte: dataEnd,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const deals = employee.dealAssignee.map((ar) => ar.deal);

    const totalLeads = deals.length;
    const conversions = deals.filter(
      (a) => a.status === STATUS_DEAL.SUCCESS,
    ).length;
    const percentageConversion =
      totalLeads > 0
        ? parseFloat(((conversions / totalLeads) * 100).toFixed(2))
        : 0;

    const chartLeadsByChannel = await this.generateChartLeadsByChannel(
      filter.employeeId,
      dataStart,
      dataEnd,
    );

    // Segmentação by status
    const segmentationStatus = {
      initial: deals.filter((a) =>
        [STATUS_DEAL.CHAT, STATUS_DEAL.PRE_DEAL].includes(
          a.status as STATUS_DEAL,
        ),
      ).length,
      atVisit: deals.filter((a) => a.status === STATUS_DEAL.VISIT).length,
      recovery: deals.filter((a) => a.status === STATUS_DEAL.RECOVERY).length,
      negotiation: deals.filter((a) => a.status === STATUS_DEAL.AT_NEGOTIATION)
        .length,
      total: 0,
    };

    // Calculate o total of segmentação by status
    segmentationStatus.total =
      segmentationStatus.initial +
      segmentationStatus.atVisit +
      segmentationStatus.recovery +
      segmentationStatus.negotiation;

    // Segmentação by temperature
    const segmentationTemperature = {
      cold: deals.filter((a) => a.temperature === TEMPERATURE_DEAL.COLD).length,
      warm: deals.filter((a) => a.temperature === TEMPERATURE_DEAL.WARM).length,
      hot: deals.filter((a) => a.temperature === TEMPERATURE_DEAL.HOT).length,
    };

    // Rate of conversão showroom
    const totalDealsShowroom = deals.filter(
      (a) => a.dealOrigin === ORIGIN_DEAL.SHOWROOM,
    ).length;
    const conversionShowroom = deals.filter(
      (a) =>
        a.status === STATUS_DEAL.SUCCESS &&
        a.dealOrigin === ORIGIN_DEAL.SHOWROOM,
    ).length;
    const rateConversionShowroom =
      totalDealsShowroom > 0
        ? parseFloat(
            ((conversionShowroom / totalDealsShowroom) * 100).toFixed(2),
          )
        : 0;

    // Time médio of reply
    const timeAverageReply = await this.calculateTimeAverageReply(
      storeId,
      dataStart,
      dataEnd,
    );

    const failures = deals.filter((a) => a.status === STATUS_DEAL.LOST).length;

    const rateFailure =
      totalLeads > 0
        ? parseFloat(((failures / totalLeads) * 100).toFixed(2))
        : 0;

    const rateSuccess =
      totalLeads > 0
        ? parseFloat(((conversions / totalLeads) * 100).toFixed(2))
        : 0;

    const timeAverageClosing = await this.calculateTimeAverageCompletion(
      storeId,
      dataStart,
      dataEnd,
      filter.employeeId,
    );

    const numberConversionOnline = deals.filter(
      (a) =>
        a.status === STATUS_DEAL.SUCCESS &&
        a.dealOrigin !== ORIGIN_DEAL.SHOWROOM,
    ).length;

    const numberConversionShowroom = deals.filter(
      (a) =>
        a.status === STATUS_DEAL.SUCCESS &&
        a.dealOrigin === ORIGIN_DEAL.SHOWROOM,
    ).length;

    const timeAverageByStageNegotiation =
      await this.calculateTimeAverageByStageNegotiation(
        storeId,
        dataStart,
        dataEnd,
        filter.employeeId,
      );

    const reasonsLossesBusiness = await this.calculateReasonsLossesBusiness(
      storeId,
      dataStart,
      dataEnd,
      filter.employeeId,
    );

    const salespeopleStore = await this.prismaService.employee.findMany({
      where: {
        storeId,
        status: 'active',
        roles: { some: { role: { in: ['Salesperson', 'Pre-salesperson'] } } },
      },
      include: { user: true },
    });

    // Calculate sales of success for all os salespeople
    const salespeopleWithSales = await Promise.all(
      salespeopleStore.map(async (v) => {
        const statusCountsV = await this.getStatusCountsForEmployee(
          v.id,
          dataStart,
          dataEnd,
        );
        const totalLeadsV = statusCountsV.reduce(
          (sum, item) => sum + item._count,
          0,
        );
        const conversionsV =
          statusCountsV.find((s) => s.status === STATUS_DEAL.SUCCESS)?._count ||
          0;
        return {
          id: v.id,
          name: v.name || v.user?.name || 'Without name',
          avatar: v.user?.photoUrl ?? v.photoUrl ?? undefined,
          leads: totalLeadsV,
          conversions: conversionsV,
        };
      }),
    );

    // Sort by conversões (sales of success) at order decrescente
    const salespeopleSorted = salespeopleWithSales.sort(
      (a, b) => b.conversions - a.conversions,
    );

    // Get os top 3 salespeople
    const top3Salespeople = salespeopleSorted.slice(0, 3);

    // Garantir que o usuário loggedIn seja incluíof se não estiver in top 3
    let leadsVsConversionsSalesperson = [...top3Salespeople];

    if (idUserLoggedIn) {
      const userLoggedInInTop3 = top3Salespeople.some(
        (v) => v.id === idUserLoggedIn,
      );

      if (!userLoggedInInTop3) {
        const userLoggedIn = salespeopleWithSales.find(
          (v) => v.id === idUserLoggedIn,
        );
        if (userLoggedIn) {
          leadsVsConversionsSalesperson.push(userLoggedIn);
        }
      }
    }

    const rankingMonthly = await this.calculatePositionRankingMonthly(
      filter.employeeId,
      storeId,
      dataStart,
      dataEnd,
    );

    // Calculate sales diárias for os salespeople of ranking
    const salespeopleForSalesDaily = leadsVsConversionsSalesperson.map((v) => ({
      id: v.id,
      name: v.name,
      avatar: v.avatar,
    }));

    const salesDailyBySalesperson = await this.calculateSalesDailyBySalesperson(
      salespeopleForSalesDaily,
      dataStart,
      dataEnd,
    );

    const leadsQualified = deals.filter((a) =>
      [
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.VISIT,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.SUCCESS,
      ].includes(a.status as STATUS_DEAL),
    ).length;
    const averageQualification =
      totalLeads > 0 ? (leadsQualified / totalLeads) * 100 : 0;

    return [
      {
        salesperson: {
          id: employee.id,
          name: employee.name || employee.user.name || 'Without name',
          avatar: employee.user?.photoUrl || employee.photoUrl || undefined,
        },
        period: {
          start: dataStart,
          end: dataEnd,
        },
        totalLeads,
        percentageConversion,
        dealsWellSucceeded: conversions,
        totalSalesGenerated: conversions,
        chartLeadsByChannel,
        averageQualification,
        averageConversion: percentageConversion,
        segmentationStatus,
        segmentationTemperature,
        segmentationTemperatureQualification:
          await this.calculateSegmentationTemperatureQualification(
            storeId,
            dataStart,
            dataEnd,
            undefined,
            employee.id,
          ),
        rateConversionShowroom,
        timeAverageReply,
        failures,
        rateFailure,
        rateSuccess,
        timeAverageClosing,
        numberConversionOnline,
        numberConversionShowroom,
        timeAverageByStageNegotiation,
        reasonsLossesBusiness,
        leadsVsConversionsSalesperson,
        rankingMonthly,
        salesDailyBySalesperson,
      },
    ];
  }

  // 4. Relatório General
  async generateReportGeneral(
    storeId: string,
    filter: FilterReportDto,
  ): Promise<ReportGeneralDto> {
    const dataStart = new Date(filter.dataStart);
    const dataEnd = new Date(filter.dataEnd);

    const [
      rankingChannels,
      viewPreSell,
      rankingSalespeople,
      reportByMode,
      timeAverageReplyGeneral,
      timeAverageCompletionGeneral,
      conversionByTemperatureGeneral,
      metricsVisitsPreSalespeople,
      metricsVisitsGeneral,
      timeAverageByStageNegotiationGeneral,
      dealsPreDeal,
      dealsSales,
      reasonsLossesPreDeal,
    ] = await Promise.all([
      this.generateRankingChannels(
        storeId,
        dataStart,
        dataEnd,
        filter.employeeId,
      ),
      this.generateViewPreSell(storeId, dataStart, dataEnd, filter.employeeId),
      this.generateRankingSalespeople(storeId, filter),
      this.generateReportByModeDeal(
        storeId,
        dataStart,
        dataEnd,
        filter.employeeId,
      ),
      this.calculateTimeAverageReply(
        storeId,
        dataStart,
        dataEnd,
        filter.employeeId,
      ),
      this.calculateTimeAverageCompletion(
        storeId,
        dataStart,
        dataEnd,
        filter.employeeId,
      ),
      this.calculateConversionByTemperature(
        storeId,
        dataStart,
        dataEnd,
        filter.employeeId,
      ),
      this.calculateMetricsVisitsPreSalesperson(storeId, dataStart, dataEnd),
      this.calculateMetricsVisitsGeneral(storeId, dataStart, dataEnd),
      this.calculateTimeAverageByStageNegotiation(
        storeId,
        dataStart,
        dataEnd,
        filter.employeeId,
      ),
      this.findDealsPreDealWithoutFollowUp(storeId, filter.employeeId),
      this.findDealsSalesWithoutFollowUp(storeId, filter.employeeId),
      this.calculateReasonsLossesPreDeal(
        storeId,
        dataStart,
        dataEnd,
        filter.employeeId,
      ),
    ]);

    return {
      period: {
        start: dataStart,
        end: dataEnd,
      },
      rankingChannels,
      viewPreSell,
      rankingSalespeople,
      timeAverageReplyGeneral,
      timeAverageCompletionGeneral,
      conversionByTemperatureGeneral,
      metricsVisitsPreSalespeople,
      metricsVisitsGeneral,
      timeAverageByStageNegotiationGeneral,
      reportByMode,
      dealsPreDeal,
      dealsSales,
      reasonsLossesPreDeal,
    };
  }

  private async calculateTimeAverageByStageByMode(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
    employeeId?: string,
  ): Promise<{
    'Pre-deal': string;
    'Deal Initial': string;
    Visit: string;
    'At Negotiation': string;
    Recovery: string;
  }> {
    const whereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (this.isModeDeal(mode)) {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });

    const timesByStage = {
      [STATUS_DEAL.PRE_DEAL]: [],
      [STATUS_DEAL.DEAL_INITIAL]: [],
      [STATUS_DEAL.VISIT]: [],
      [STATUS_DEAL.AT_NEGOTIATION]: [],
      [STATUS_DEAL.RECOVERY]: [],
    };

    const dealIds = deals.map((a) => a.id);

    const allOsLogs = await this.prismaService.dealActivityLog.findMany({
      where: {
        dealId: { in: dealIds },
        typeEvent: 'STATUS_CHANGED',
      },
      orderBy: { createdAt: 'asc' },
      select: {
        dealId: true,
        createdAt: true,
        message: true,
      },
    });

    const logsByDeal = new Map<string, typeof allOsLogs>();
    allOsLogs.forEach((log) => {
      const logs = logsByDeal.get(log.dealId) || [];
      logs.push(log);
      logsByDeal.set(log.dealId, logs);
    });

    for (const deal of deals) {
      const logsStatus = logsByDeal.get(deal.id) || [];

      let dataPrevious = deal.createdAt;
      let statusPrevious = STATUS_DEAL.PRE_DEAL;

      logsStatus.forEach((log) => {
        const timeInStage = differenceInHours(log.createdAt, dataPrevious);
        if (timesByStage[statusPrevious]) {
          timesByStage[statusPrevious].push(timeInStage);
        }
        dataPrevious = log.createdAt;
        statusPrevious = this.extractStatusOfLog(log.message);
      });

      const now = new Date();
      const dataFinal =
        deal.status === STATUS_DEAL.SUCCESS || deal.status === STATUS_DEAL.LOST
          ? dataPrevious
          : now;

      const timeFinal = differenceInHours(dataFinal, dataPrevious);
      if (timesByStage[statusPrevious]) {
        timesByStage[statusPrevious].push(timeFinal);
      }
    }

    const calculateAverage = (times: number[]) => {
      if (!times || times.length === 0) return '0h 0min';
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const hours = Math.floor(average);
      const minutes = Math.round((average - hours) * 60);
      return `${hours}h ${minutes}min`;
    };

    return {
      'Pre-deal': calculateAverage(timesByStage[STATUS_DEAL.PRE_DEAL]),
      'Deal Initial': calculateAverage(timesByStage[STATUS_DEAL.DEAL_INITIAL]),
      Visit: calculateAverage(timesByStage[STATUS_DEAL.VISIT]),
      'At Negotiation': calculateAverage(
        timesByStage[STATUS_DEAL.AT_NEGOTIATION],
      ),
      Recovery: calculateAverage(timesByStage[STATUS_DEAL.RECOVERY]),
    };
  }

  private async getStatusCountsForEmployeeByMode(
    employeeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
  ) {
    return this.prismaService.deal.groupBy({
      by: ['status'],
      where: {
        dealMode: mode,
        dealAssignee: {
          some: {
            employeeId,
          },
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      _count: {
        status: true,
      },
    });
  }

  private async getTemperatureCountsForEmployeeByMode(
    employeeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
  ) {
    return this.prismaService.deal.groupBy({
      by: ['temperature'],
      where: {
        dealMode: mode,
        dealAssignee: {
          some: {
            employeeId,
          },
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      _count: {
        temperature: true,
      },
    });
  }

  private async generateSeriesHistoricalMonthlyByMode(
    employeeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
  ) {
    const deals = await this.prismaService.deal.findMany({
      where: {
        dealMode: mode,
        dealAssignee: {
          some: {
            employeeId,
          },
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const seriesHistorical = [];
    const currentDate = new Date(dataStart);
    const endDate = new Date(dataEnd);

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const dealsOfMonth = deals.filter(
        (deal) => deal.createdAt >= monthStart && deal.createdAt <= monthEnd,
      );

      const leads = dealsOfMonth.length;
      const conversions = dealsOfMonth.filter(
        (deal) => deal.status === STATUS_DEAL.SUCCESS,
      ).length;

      seriesHistorical.push({
        month: format(currentDate, 'MMM', { locale: ptBR }),
        leads,
        conversions,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return seriesHistorical;
  }

  private async generateSeriesHistoricalConsolidatedByMode(
    employeeIds: string[],
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
  ) {
    const deals = await this.prismaService.deal.findMany({
      where: {
        dealMode: mode,
        dealAssignee: {
          some: {
            employeeId: {
              in: employeeIds,
            },
          },
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const seriesHistorical = [];
    const currentDate = new Date(dataStart);
    const endDate = new Date(dataEnd);

    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const dealsOfMonth = deals.filter(
        (deal) => deal.createdAt >= monthStart && deal.createdAt <= monthEnd,
      );

      const leads = dealsOfMonth.length;
      const conversions = dealsOfMonth.filter(
        (deal) => deal.status === STATUS_DEAL.SUCCESS,
      ).length;

      seriesHistorical.push({
        month: format(currentDate, 'MMM', { locale: ptBR }),
        leads,
        conversions,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return seriesHistorical;
  }

  private async calculateTimeAverageReplyEmployeeByMode(
    employeeId: string,
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
  ): Promise<string> {
    return this.calculateTimeAverageReplyComplete(
      storeId,
      dataStart,
      dataEnd,
      mode,
      employeeId,
    );
  }

  private async getStatusCountsForEmployee(
    employeeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    return this.prismaService.deal.groupBy({
      by: ['status'],
      where: {
        dealAssignee: {
          some: {
            employeeId,
          },
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      _count: true,
    });
  }

  private async getTemperatureCountsForEmployee(
    employeeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    return this.prismaService.deal.groupBy({
      by: ['temperature'],
      where: {
        dealAssignee: {
          some: {
            employeeId,
          },
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      _count: true,
    });
  }

  private async getStatusCountsForChannel(
    channel: string,
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    const whereClause: any = {
      storeId,
      dealOrigin: channel,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return this.prismaService.deal.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });
  }

  private async getStatusCountsForStore(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    const whereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return this.prismaService.deal.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });
  }

  private async getTemperatureCountsForStore(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    const whereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return this.prismaService.deal.groupBy({
      by: ['temperature'],
      where: whereClause,
      _count: true,
    });
  }

  private async generateSeriesHistoricalMonthly(
    employeeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const series = [];
    let dataCurrent = startOfMonth(dataStart);

    while (dataCurrent <= dataEnd) {
      const startMonth = startOfMonth(dataCurrent);
      const endMonth = endOfMonth(dataCurrent);

      const [leads, conversions] = await Promise.all([
        this.prismaService.deal.count({
          where: {
            dealAssignee: {
              some: {
                employeeId,
              },
            },
            createdAt: {
              gte: startMonth,
              lte: endMonth,
            },
          },
        }),
        this.prismaService.deal.count({
          where: {
            dealAssignee: {
              some: {
                employeeId,
              },
            },
            status: STATUS_DEAL.SUCCESS,
            createdAt: {
              gte: startMonth,
              lte: endMonth,
            },
          },
        }),
      ]);

      series.push({
        month: format(dataCurrent, 'yyyy-MM'),
        leads,
        conversions,
      });

      dataCurrent = new Date(
        dataCurrent.getFullYear(),
        dataCurrent.getMonth() + 1,
        1,
      );
    }

    return series;
  }

  private async generateSummaryDaily(
    channel: string,
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const summary = [];
    let dataCurrent = new Date(dataStart);

    while (dataCurrent <= dataEnd) {
      const startDay = new Date(
        dataCurrent.getFullYear(),
        dataCurrent.getMonth(),
        dataCurrent.getDate(),
      );
      const endDay = new Date(
        dataCurrent.getFullYear(),
        dataCurrent.getMonth(),
        dataCurrent.getDate(),
        23,
        59,
        59,
      );

      const [leads, conversions] = await Promise.all([
        this.prismaService.deal.count({
          where: {
            storeId,
            dealOrigin: channel,
            createdAt: {
              gte: startDay,
              lte: endDay,
            },
          },
        }),
        this.prismaService.deal.count({
          where: {
            storeId,
            dealOrigin: channel,
            status: STATUS_DEAL.SUCCESS,
            createdAt: {
              gte: startDay,
              lte: endDay,
            },
          },
        }),
      ]);

      summary.push({
        data: format(dataCurrent, 'yyyy-MM-dd'),
        leads,
        conversions,
      });

      dataCurrent = new Date(dataCurrent.getTime() + 24 * 60 * 60 * 1000);
    }

    return summary;
  }

  private async generateSeriesHistoricalChannelMonthly(
    channel: string,
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const series = [];
    let dataCurrent = startOfMonth(dataStart);

    while (dataCurrent <= dataEnd) {
      const startMonth = startOfMonth(dataCurrent);
      const endMonth = endOfMonth(dataCurrent);

      const [leads, qualifications, conversions] = await Promise.all([
        this.prismaService.deal.count({
          where: {
            storeId,
            dealOrigin: channel,
            createdAt: {
              gte: startMonth,
              lte: endMonth,
            },
          },
        }),
        this.prismaService.deal.count({
          where: {
            storeId,
            dealOrigin: channel,
            status: {
              in: [
                STATUS_DEAL.DEAL_INITIAL,
                STATUS_DEAL.VISIT,
                STATUS_DEAL.AT_NEGOTIATION,
                STATUS_DEAL.SUCCESS,
              ],
            },
            createdAt: {
              gte: startMonth,
              lte: endMonth,
            },
          },
        }),
        this.prismaService.deal.count({
          where: {
            storeId,
            dealOrigin: channel,
            status: STATUS_DEAL.SUCCESS,
            createdAt: {
              gte: startMonth,
              lte: endMonth,
            },
          },
        }),
      ]);

      series.push({
        month: format(dataCurrent, 'yyyy-MM'),
        leads,
        qualifications,
        conversions,
      });

      dataCurrent = new Date(
        dataCurrent.getFullYear(),
        dataCurrent.getMonth() + 1,
        1,
      );
    }

    return series;
  }

  private async generateChartLeadsByChannel(
    employeeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const chart = [];

    for (const channel of Object.values(ORIGIN_DEAL) as string[]) {
      const [leads, qualified] = await Promise.all([
        this.prismaService.deal.count({
          where: {
            dealAssignee: {
              some: {
                employeeId,
              },
            },
            dealOrigin: channel,
            createdAt: {
              gte: dataStart,
              lte: dataEnd,
            },
          },
        }),
        this.prismaService.deal.count({
          where: {
            dealAssignee: {
              some: {
                employeeId,
              },
            },
            dealOrigin: channel,
            status: {
              in: [
                STATUS_DEAL.DEAL_INITIAL,
                STATUS_DEAL.VISIT,
                STATUS_DEAL.AT_NEGOTIATION,
                STATUS_DEAL.SUCCESS,
              ],
            },
            createdAt: {
              gte: dataStart,
              lte: dataEnd,
            },
          },
        }),
      ]);

      if (leads > 0) {
        chart.push({
          channel,
          leads,
          qualified,
        });
      }
    }

    return chart;
  }

  private async calculatePositionRankingMonthly(
    employeeId: string,
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const ranking = [];
    let dataCurrent = startOfMonth(dataStart);

    while (dataCurrent <= dataEnd) {
      const startMonth = startOfMonth(dataCurrent);
      const endMonth = endOfMonth(dataCurrent);

      const conversionsEmployees =
        await this.prismaService.dealAssignee.groupBy({
          by: ['employeeId'],
          where: {
            storeId,
            deal: {
              status: STATUS_DEAL.SUCCESS,
              createdAt: {
                gte: startMonth,
                lte: endMonth,
              },
            },
          },
          _count: {
            employeeId: true,
          },
        });

      const conversionsEmployee = await this.prismaService.deal.count({
        where: {
          dealAssignee: {
            some: {
              employeeId,
            },
          },
          status: STATUS_DEAL.SUCCESS,
          createdAt: {
            gte: startMonth,
            lte: endMonth,
          },
        },
      });

      const employeesWithMoreConversions = conversionsEmployees.filter(
        (c) => c._count.employeeId > conversionsEmployee,
      ).length;
      const position = employeesWithMoreConversions + 1;

      ranking.push({
        month: format(dataCurrent, 'yyyy-MM'),
        conversions: conversionsEmployee,
        position,
      });

      dataCurrent = new Date(
        dataCurrent.getFullYear(),
        dataCurrent.getMonth() + 1,
        1,
      );
    }

    return ranking;
  }

  private async calculateTimeAverageReply(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ): Promise<string> {
    const whereCondition: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (employeeId) {
      whereCondition.dealAssignee = { some: { employeeId } };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
      select: {
        chat: {
          select: {
            id: true,
          },
        },
      },
    });

    if (deals.length === 0) {
      return '0min';
    }

    const chatIds = deals.flatMap((deal) => deal.chat).map((chat) => chat.id);

    if (chatIds.length === 0) {
      return '0min';
    }

    const msgs = await this.prismaService.message.findMany({
      where: {
        chatId: {
          in: chatIds,
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      select: {
        chatId: true,
        sender: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    if (msgs.length === 0) {
      return '0min';
    }

    const messagesByChat = msgs.reduce(
      (acc, message) => {
        if (!acc[message.chatId]) {
          acc[message.chatId] = [];
        }
        acc[message.chatId].push(message);
        return acc;
      },
      {} as Record<string, typeof msgs>,
    );

    const timesReply: number[] = [];

    Object.values(messagesByChat).forEach((messagesChat) => {
      let lastMessageCustomer: Date | null = null;

      messagesChat.forEach((message) => {
        if (message.sender === Sender.CUSTOMER) {
          // Message of customer - mark as última message of customer
          lastMessageCustomer = new Date(message.createdAt);
        } else if (
          (message.sender === Sender.STORE ||
            message.sender === Sender.SYSTEM) &&
          lastMessageCustomer
        ) {
          // Message of store/system após message of customer - calculate time of reply considerando only days úteis
          const timeReplyMinutes = this.calculateDifferenceMinutesDaysBusiness(
            lastMessageCustomer,
            new Date(message.createdAt),
          );

          // Considerar only times of reply positivos and razoáveis (até 7 days úteis = 7 * 24 * 60 = 10080 minutes)
          if (timeReplyMinutes > 0 && timeReplyMinutes <= 10080) {
            timesReply.push(timeReplyMinutes);
          }

          // Reset for próxima sequência
          lastMessageCustomer = null;
        }
      });
    });

    if (timesReply.length === 0) {
      return '0min';
    }

    const timeAverage =
      timesReply.reduce((sum, time) => sum + time, 0) / timesReply.length;

    // Usar a new função of formatção
    return this.formatTime(timeAverage);
  }

  private async calculateTimeAverageCompletion(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ): Promise<string> {
    const whereCondition: any = {
      storeId,
      status: {
        in: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
      },
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (employeeId) {
      whereCondition.dealAssignee = { some: { employeeId } };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
    });

    if (deals.length === 0) {
      return '0min';
    }

    const timesCompletion = deals.map((deal) => {
      return this.calculateDifferenceMinutesDaysBusiness(
        new Date(deal.createdAt),
        new Date(deal.updatedAt),
      );
    });

    const timeAverage =
      timesCompletion.reduce((sum, time) => sum + time, 0) /
      timesCompletion.length;
    return this.formatTime(timeAverage);
  }

  private async generateRankingMonthly(
    employeeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const ranking = [];
    let dataCurrent = startOfMonth(dataStart);

    while (dataCurrent <= dataEnd) {
      const startMonth = startOfMonth(dataCurrent);
      const endMonth = endOfMonth(dataCurrent);

      const conversions = await this.prismaService.deal.count({
        where: {
          dealAssignee: {
            some: {
              employeeId,
            },
          },
          status: STATUS_DEAL.SUCCESS,
          createdAt: {
            gte: startMonth,
            lte: endMonth,
          },
        },
      });

      ranking.push({
        month: format(dataCurrent, 'yyyy-MM'),
        conversions,
        position: 1,
      });

      dataCurrent = new Date(
        dataCurrent.getFullYear(),
        dataCurrent.getMonth() + 1,
        1,
      );
    }

    return ranking;
  }

  private async generateRankingChannels(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    const ranking = [];

    for (const channel of Object.values(ORIGIN_DEAL) as string[]) {
      let whereCondition: any = {
        storeId,
        dealOrigin: channel,
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      };

      if (employeeId) {
        whereCondition.dealAssignee = {
          some: {
            employeeId: employeeId,
          },
        };
      }

      const deals = await this.prismaService.deal.findMany({
        where: whereCondition,
      });

      const qualified = deals.filter((a) =>
        [
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.VISIT,
          STATUS_DEAL.AT_NEGOTIATION,
          STATUS_DEAL.SUCCESS,
        ].includes(a.status as STATUS_DEAL),
      ).length;

      const indexQualification =
        deals.length > 0
          ? parseFloat(((qualified / deals.length) * 100).toFixed(2))
          : 0;

      ranking.push({
        channel,
        indexQualification,
      });
    }

    return ranking.sort((a, b) => b.indexQualification - a.indexQualification);
  }

  private async generateViewPreSell(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    let whereCondition: any = {
      storeId,
      status: 'active',
      roles: {
        some: {
          role: {
            in: ['Salesperson', 'Pre-salesperson'],
          },
        },
      },
    };

    if (employeeId) {
      whereCondition.id = employeeId;
    }

    const employees = await this.prismaService.employee.findMany({
      where: whereCondition,
      include: {
        user: true,
        dealAssignee: {
          include: {
            deal: true,
          },
          where: {
            deal: {
              createdAt: {
                gte: dataStart,
                lte: dataEnd,
              },
            },
          },
        },
      },
    });

    return employees.map((employee) => {
      const deals = employee.dealAssignee.map((ar) => ar.deal);

      const leadsReceived = deals.length;
      const atDeal = deals.filter((a) =>
        [
          STATUS_DEAL.CHAT,
          STATUS_DEAL.PRE_DEAL,
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.AT_NEGOTIATION,
        ].includes(a.status as STATUS_DEAL),
      ).length;
      const qualified = deals.filter((a) =>
        [
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.VISIT,
          STATUS_DEAL.AT_NEGOTIATION,
          STATUS_DEAL.SUCCESS,
        ].includes(a.status as STATUS_DEAL),
      ).length;

      const leadsRecovered = deals.filter(
        (a) => a.status === STATUS_DEAL.RECOVERY,
      ).length;

      const leadsConverted = deals.filter(
        (a) => a.status === STATUS_DEAL.SUCCESS,
      ).length;

      const averageConversion =
        leadsReceived > 0
          ? parseFloat(((leadsConverted / leadsReceived) * 100).toFixed(2))
          : 0;

      const rateQualification =
        leadsReceived > 0
          ? parseFloat(((qualified / leadsReceived) * 100).toFixed(2))
          : 0;

      return {
        id: employee.id,
        salesperson: employee.name || employee.user.name || 'Without name',
        avatar: employee.user.photoUrl || null,
        timeInPlatform: `Salesperson since ${new Date(employee.createdAt).getFullYear()}`,
        leadsReceived,
        atDeal,
        qualified,
        rateQualification,
        leadsRecovered,
        leadsConverted,
        averageConversion,
      };
    });
  }

  private async calculateConversionByTemperature(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    const whereCondition: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (employeeId) {
      whereCondition.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    const results = await Promise.all([
      // Total by temperature
      this.prismaService.deal.groupBy({
        by: ['temperature'],
        where: whereCondition,
        _count: true,
      }),
      // Successes by temperature
      this.prismaService.deal.groupBy({
        by: ['temperature'],
        where: {
          ...whereCondition,
          status: STATUS_DEAL.SUCCESS,
        },
        _count: true,
      }),
    ]);

    const [totalByTemperature, successesByTemperature] = results;

    const conversionByTemperature = {
      cold: {
        total:
          totalByTemperature.find(
            (t) => t.temperature === TEMPERATURE_DEAL.COLD,
          )?._count || 0,
        conversions:
          successesByTemperature.find(
            (t) => t.temperature === TEMPERATURE_DEAL.COLD,
          )?._count || 0,
        rate: 0,
      },
      warm: {
        total:
          totalByTemperature.find(
            (t) => t.temperature === TEMPERATURE_DEAL.WARM,
          )?._count || 0,
        conversions:
          successesByTemperature.find(
            (t) => t.temperature === TEMPERATURE_DEAL.WARM,
          )?._count || 0,
        rate: 0,
      },
      hot: {
        total:
          totalByTemperature.find((t) => t.temperature === TEMPERATURE_DEAL.HOT)
            ?._count || 0,
        conversions:
          successesByTemperature.find(
            (t) => t.temperature === TEMPERATURE_DEAL.HOT,
          )?._count || 0,
        rate: 0,
      },
    };

    Object.keys(conversionByTemperature).forEach((temp) => {
      const data = conversionByTemperature[temp];
      data.rate =
        data.total > 0
          ? parseFloat(((data.conversions / data.total) * 100).toFixed(2))
          : 0;
    });

    return conversionByTemperature;
  }

  private async getLogsStatusDeal(dealId: string) {
    return await this.prismaService.dealActivityLog.findMany({
      where: {
        dealId,
        typeEvent: 'CHANGE_STATUS',
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        message: true,
        createdAt: true,
      },
    });
  }

  private extractStatusOfLog(message: string): STATUS_DEAL {
    const match = message.match(/Status changed for (.+)$/);
    if (!match) return STATUS_DEAL.PRE_DEAL;

    const statusReadable = match[1];
    const statusEnum = Object.entries(STATUS_DEAL_MAP).find(
      ([_, value]) => value === statusReadable,
    )?.[0] as STATUS_DEAL;

    return statusEnum || STATUS_DEAL.PRE_DEAL;
  }

  private async calculateTimeAverageByStage(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    const whereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (employeeId) {
      whereClause.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });

    const timesByStage = {
      [STATUS_DEAL.PRE_DEAL]: [],
      [STATUS_DEAL.DEAL_INITIAL]: [],
      [STATUS_DEAL.VISIT]: [],
      [STATUS_DEAL.AT_NEGOTIATION]: [],
      [STATUS_DEAL.RECOVERY]: [],
    };

    for (const deal of deals) {
      const logsStatus = await this.getLogsStatusDeal(deal.id);

      let dataPrevious = deal.createdAt;
      let statusPrevious = STATUS_DEAL.PRE_DEAL;

      logsStatus.forEach((log) => {
        const timeInStage = differenceInHours(log.createdAt, dataPrevious);
        if (timesByStage[statusPrevious]) {
          timesByStage[statusPrevious].push(timeInStage);
        }
        dataPrevious = log.createdAt;
        statusPrevious = this.extractStatusOfLog(log.message);
      });

      const now = new Date();
      const dataFinal =
        deal.status === STATUS_DEAL.SUCCESS || deal.status === STATUS_DEAL.LOST
          ? dataPrevious
          : now;

      const timeFinal = differenceInHours(dataFinal, dataPrevious);
      if (timesByStage[statusPrevious]) {
        timesByStage[statusPrevious].push(timeFinal);
      }
    }

    const calculateAverage = (times: number[]) => {
      if (!times || times.length === 0) return '0h 0min';
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const hours = Math.floor(average);
      const minutes = Math.round((average - hours) * 60);
      return `${hours}h ${minutes}min`;
    };

    return {
      'Pre-deal': calculateAverage(timesByStage[STATUS_DEAL.PRE_DEAL]),
      'Deal Initial': calculateAverage(timesByStage[STATUS_DEAL.DEAL_INITIAL]),
      Visit: calculateAverage(timesByStage[STATUS_DEAL.VISIT]),
      'At Negotiation': calculateAverage(
        timesByStage[STATUS_DEAL.AT_NEGOTIATION],
      ),
      Recovery: calculateAverage(timesByStage[STATUS_DEAL.RECOVERY]),
    };
  }

  private async calculateTimeAverageReplyEmployee(
    employeeId: string,
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
  ): Promise<string> {
    const msgs = await this.prismaService.message.findMany({
      where: {
        chat: {
          storeId,
          deal: {
            dealAssignee: {
              some: {
                employeeId,
              },
            },
          },
        },
        sender: {
          in: [Sender.CUSTOMER, Sender.STORE, Sender.SYSTEM],
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      select: {
        chatId: true,
        sender: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const diffs: number[] = [];
    const state = new Map<string, { customerAt?: Date; responded?: boolean }>();

    for (const { chatId, sender, createdAt } of msgs) {
      const s = state.get(chatId) ?? {};
      if (sender === Sender.CUSTOMER && !s.customerAt) {
        s.customerAt = createdAt;
        s.responded = false;
        state.set(chatId, s);
        continue;
      }
      if (
        (sender === Sender.STORE || sender === Sender.SYSTEM) &&
        s.customerAt &&
        !s.responded
      ) {
        // Calculate diferença considerando only days úteis
        const diff = this.calculateDifferenceMinutesDaysBusiness(
          s.customerAt!,
          createdAt,
        );
        if (diff > 0) {
          diffs.push(diff);
        }
        s.responded = true;
        state.set(chatId, s);
      }
    }

    if (diffs.length === 0) return '0min';
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;

    // Usar a new função of formatção
    return this.formatTime(avg);
  }

  private async calculateMetricsVisitsPreSalesperson(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const preSalespeople = await this.prismaService.employee.findMany({
      where: {
        storeId,
        status: 'active',
        roles: {
          some: {
            role: 'Pre-salesperson',
          },
        },
      },
      include: {
        user: true,
      },
    });

    const metrics = [];

    for (const preSalesperson of preSalespeople) {
      const dealsWithVisit = await this.prismaService.deal.findMany({
        where: {
          dealAssignee: {
            some: {
              employeeId: preSalesperson.id,
            },
          },
          dealVisit: {
            some: {
              createdAt: {
                gte: dataStart,
                lte: dataEnd,
              },
            },
          },
        },
        include: {
          dealVisit: true,
        },
      });

      const totalVisitsScheduled = dealsWithVisit.reduce(
        (total, deal) => total + deal.dealVisit.length,
        0,
      );

      const visitsWellSucceeded = dealsWithVisit.filter((deal) =>
        deal.dealVisit.some((visit) => visit.completed),
      ).length;

      const rateSuccessVisits =
        totalVisitsScheduled > 0
          ? (visitsWellSucceeded / totalVisitsScheduled) * 100
          : 0;

      metrics.push({
        preSalesperson: {
          id: preSalesperson.id,
          name:
            preSalesperson.name || preSalesperson.user.name || 'Without name',
        },
        totalVisitsScheduled,
        visitsWellSucceeded,
        rateSuccessVisits,
      });
    }

    return metrics;
  }

  private async calculateMetricsVisitsGeneral(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    // Find all os deals with visits in período
    const dealsWithVisit = await this.prismaService.deal.findMany({
      where: {
        storeId,
        dealVisit: {
          some: {
            createdAt: {
              gte: dataStart,
              lte: dataEnd,
            },
          },
        },
      },
      include: {
        dealVisit: {
          where: {
            createdAt: {
              gte: dataStart,
              lte: dataEnd,
            },
          },
        },
      },
    });

    // Calculate métricas agregadas
    const totalVisitsScheduled = dealsWithVisit.reduce(
      (total, deal) => total + deal.dealVisit.length,
      0,
    );

    const visitsWellSucceeded = dealsWithVisit.reduce((total, deal) => {
      const visitsCompleted = deal.dealVisit.filter(
        (visit) => visit.completed,
      ).length;
      return total + visitsCompleted;
    }, 0);

    const rateSuccessVisits =
      totalVisitsScheduled > 0
        ? (visitsWellSucceeded / totalVisitsScheduled) * 100
        : 0;

    return {
      totalVisitsScheduled,
      visitsWellSucceeded,
      rateSuccessVisits: parseFloat(rateSuccessVisits.toFixed(2)),
    };
  }

  private async generateReportByModeDeal(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    const modes = Object.values(MODE_DEAL) as MODE_DEAL[];

    const resultsModes = await Promise.all(
      modes.map(async (mode) => {
        const baseWhereCondition: any = {
          storeId,
          dealMode: mode,
          createdAt: {
            gte: dataStart,
            lte: dataEnd,
          },
        };

        if (employeeId) {
          baseWhereCondition.dealAssignee = {
            some: {
              employeeId,
            },
          };
        }

        const [statusCounts, temperatureCounts] = await Promise.all([
          this.prismaService.deal.groupBy({
            by: ['status'],
            where: baseWhereCondition,
            _count: true,
          }),
          this.prismaService.deal.groupBy({
            by: ['temperature'],
            where: baseWhereCondition,
            _count: true,
          }),
        ]);

        const totalDeals = statusCounts.reduce(
          (sum, item) => sum + item._count,
          0,
        );
        const dealsWellSucceeded =
          statusCounts.find((s) => s.status === STATUS_DEAL.SUCCESS)?._count ||
          0;
        const failures =
          statusCounts.find((s) => s.status === STATUS_DEAL.LOST)?._count || 0;

        const rateSuccess =
          totalDeals > 0
            ? parseFloat(((dealsWellSucceeded / totalDeals) * 100).toFixed(2))
            : 0;
        const rateFailure =
          totalDeals > 0
            ? parseFloat(((failures / totalDeals) * 100).toFixed(2))
            : 0;
        const averageConversion = rateSuccess;

        const segmentationStatus = {
          initial: statusCounts
            .filter((s) =>
              [STATUS_DEAL.DEAL_INITIAL].includes(s.status as STATUS_DEAL),
            )
            .reduce((sum, item) => sum + item._count, 0),
          atVisit:
            statusCounts.find((s) => s.status === STATUS_DEAL.VISIT)?._count ||
            0,
          recovery:
            statusCounts.find((s) => s.status === STATUS_DEAL.RECOVERY)
              ?._count || 0,
          negotiation:
            statusCounts.find((s) => s.status === STATUS_DEAL.AT_NEGOTIATION)
              ?._count || 0,
          total: statusCounts.reduce((sum, item) => sum + item._count, 0),
        };

        const totalTemperature = temperatureCounts.reduce(
          (sum, t) => sum + t._count,
          0,
        );

        const segmentationTemperature = {
          cold: {
            value:
              temperatureCounts.find(
                (t) => t.temperature === TEMPERATURE_DEAL.COLD,
              )?._count || 0,
            percentage:
              totalTemperature > 0
                ? parseFloat(
                    (
                      ((temperatureCounts.find(
                        (t) => t.temperature === TEMPERATURE_DEAL.COLD,
                      )?._count || 0) /
                        totalTemperature) *
                      100
                    ).toFixed(2),
                  )
                : 0,
          },
          warm: {
            value:
              temperatureCounts.find(
                (t) => t.temperature === TEMPERATURE_DEAL.WARM,
              )?._count || 0,
            percentage:
              totalTemperature > 0
                ? parseFloat(
                    (
                      ((temperatureCounts.find(
                        (t) => t.temperature === TEMPERATURE_DEAL.WARM,
                      )?._count || 0) /
                        totalTemperature) *
                      100
                    ).toFixed(2),
                  )
                : 0,
          },
          hot: {
            value:
              temperatureCounts.find(
                (t) => t.temperature === TEMPERATURE_DEAL.HOT,
              )?._count || 0,
            percentage:
              totalTemperature > 0
                ? parseFloat(
                    (
                      ((temperatureCounts.find(
                        (t) => t.temperature === TEMPERATURE_DEAL.HOT,
                      )?._count || 0) /
                        totalTemperature) *
                      100
                    ).toFixed(2),
                  )
                : 0,
          },
        };

        const [
          timeAverageReply,
          timeAverageCompletion,
          conversionByTemperature,
          limitSuccess,
          rateRecovery,
          limitConversion,
          limitQualification,
          rateConversionLeads,
          limitConversionLeads,
          limitShowroom,
          limitShowroomSuccess,
          rateShowroom,
          timeAverageReplyPreSalesperson,
          timeAverageReplySalesperson,
          appointmentsVisits,
          rateAttendanceVisits,
          visitsAttended,
          reasonsLoss,
          timeAverageReplyPreSalespersonByMonth,
          timeAverageReplySalespersonByMonth,
          dealsPreDealWithoutFollowUp,
          dealsSalesWithoutFollowUp,
          segmentationTemperatureQualification,
          timeAverageFirstReply,
          timeAverageReplyBetweenMessages,
          reasonsLossesPreDeal,
        ] = await Promise.all([
          this.calculateTimeAverageReplyByMode(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateTimeAverageCompletionByMode(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateConversionByTemperatureByMode(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateLimitSuccess(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateRateRecovery(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateLimitConversion(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateLimitQualification(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateRateConversionLeads(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateLimitConversionLeads(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateLimitShowroom(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateLimitShowroomSuccess(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateRateShowroom(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateTimeAverageReplyByType(
            storeId,
            dataStart,
            dataEnd,
            'preSalesperson',
            mode,
            employeeId,
          ),
          this.calculateTimeAverageReplyByType(
            storeId,
            dataStart,
            dataEnd,
            'salesperson',
            mode,
            employeeId,
          ),
          this.calculateAppointmentsVisits(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateRateAttendanceVisits(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateVisitsAttended(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateReasonsLoss(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateTimeAverageReplyByMonth(
            storeId,
            dataEnd,
            'preSalesperson',
            employeeId,
          ),
          this.calculateTimeAverageReplyByMonth(
            storeId,
            dataEnd,
            'salesperson',
            employeeId,
          ),
          this.findDealsPreDealWithoutFollowUpByMode(storeId, mode, employeeId),
          this.findDealsSalesWithoutFollowUpByMode(storeId, mode, employeeId),
          this.calculateSegmentationTemperatureQualification(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateTimeAverageFirstReply(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateTimeAverageReplyBetweenMessages(
            storeId,
            dataStart,
            dataEnd,
            mode,
            employeeId,
          ),
          this.calculateReasonsLossesPreDeal(
            storeId,
            dataStart,
            dataEnd,
            employeeId,
            mode,
          ),
        ]);

        return {
          mode,
          totalDeals,
          dealsWellSucceeded,
          failures,
          rateSuccess,
          rateFailure,
          averageConversion,
          averageQualification:
            totalDeals > 0
              ? parseFloat(((limitQualification / totalDeals) * 100).toFixed(2))
              : 0,
          segmentationStatus,
          segmentationTemperature,
          segmentationTemperatureQualification,
          timeAverageReply,
          timeAverageCompletion,
          conversionByTemperature,
          limitSuccess,
          rateRecovery,
          limitConversion,
          limitQualification,
          rateConversionLeads,
          limitConversionLeads,
          limitShowroom,
          limitShowroomSuccess,
          rateShowroom,
          timeAverageReplyPreSalesperson,
          timeAverageReplySalesperson,
          appointmentsVisits,
          rateAttendanceVisits,
          visitsAttended,
          reasonsLoss,
          timeAverageReplyPreSalespersonByMonth,
          timeAverageReplySalespersonByMonth,
          dealsPreDealWithoutFollowUp,
          dealsSalesWithoutFollowUp,
          timeAverageFirstReply,
          timeAverageReplyBetweenMessages,
          reasonsLossesPreDeal,
        };
      }),
    );

    const reportByMode: any[] = [...resultsModes];

    // Calculate totals general
    const [
      limitSuccessTotal,
      rateRecoveryTotal,
      limitConversionTotal,
      limitQualificationTotal,
      rateConversionLeadsTotal,
      limitConversionLeadsTotal,
      limitShowroomTotal,
      limitShowroomSuccessTotal,
      rateShowroomTotal,
      timeAverageReplyPreSalespersonTotal,
      timeAverageReplySalespersonTotal,
      appointmentsVisitsTotal,
      rateAttendanceVisitsTotal,
      reasonsLossTotal,
      timeAverageReplyPreSalespersonByMonthTotal,
      timeAverageReplySalespersonByMonthTotal,
      segmentationTemperatureQualificationTotal,
      reasonsLossesPreDealTotal,
    ] = await Promise.all([
      this.calculateLimitSuccess(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateRateRecovery(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateLimitConversion(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateLimitQualification(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateRateConversionLeads(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateLimitConversionLeads(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateLimitShowroom(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateLimitShowroomSuccess(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateRateShowroom(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateTimeAverageReplyByType(
        storeId,
        dataStart,
        dataEnd,
        'preSalesperson',
        undefined,
        employeeId,
      ),
      this.calculateTimeAverageReplyByType(
        storeId,
        dataStart,
        dataEnd,
        'salesperson',
        undefined,
        employeeId,
      ),
      this.calculateAppointmentsVisits(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateRateAttendanceVisits(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateReasonsLoss(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateTimeAverageReplyByMonth(
        storeId,
        dataEnd,
        'preSalesperson',
        employeeId,
      ),
      this.calculateTimeAverageReplyByMonth(
        storeId,
        dataEnd,
        'salesperson',
        employeeId,
      ),
      this.calculateSegmentationTemperatureQualification(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      this.calculateReasonsLossesPreDeal(
        storeId,
        dataStart,
        dataEnd,
        employeeId,
      ),
    ]);

    const totalGeneral = {
      mode: 'total',
      totalDeals: reportByMode.reduce((sum, item) => sum + item.totalDeals, 0),
      dealsWellSucceeded: reportByMode.reduce(
        (sum, item) => sum + item.dealsWellSucceeded,
        0,
      ),
      failures: reportByMode.reduce((sum, item) => sum + item.failures, 0),
      rateSuccess: 0,
      rateFailure: 0,
      averageConversion: 0,
      averageQualification: 0,
      segmentationStatus: {
        initial: reportByMode.reduce(
          (sum, item) => sum + item.segmentationStatus.initial,
          0,
        ),
        atVisit: reportByMode.reduce(
          (sum, item) => sum + item.segmentationStatus.atVisit,
          0,
        ),
        recovery: reportByMode.reduce(
          (sum, item) => sum + item.segmentationStatus.recovery,
          0,
        ),
        negotiation: reportByMode.reduce(
          (sum, item) => sum + item.segmentationStatus.negotiation,
          0,
        ),
        total: reportByMode.reduce(
          (sum, item) => sum + item.segmentationStatus.total,
          0,
        ),
      },
      segmentationTemperature: {
        cold: {
          value: reportByMode.reduce(
            (sum, item) => sum + item.segmentationTemperature.cold.value,
            0,
          ),
          percentage: 0, // Será calculado below
        },
        warm: {
          value: reportByMode.reduce(
            (sum, item) => sum + item.segmentationTemperature.warm.value,
            0,
          ),
          percentage: 0, // Será calculado below
        },
        hot: {
          value: reportByMode.reduce(
            (sum, item) => sum + item.segmentationTemperature.hot.value,
            0,
          ),
          percentage: 0, // Será calculado below
        },
      },
      segmentationTemperatureQualification:
        await this.calculateSegmentationTemperatureQualification(
          storeId,
          dataStart,
          dataEnd,
          'total',
          employeeId,
        ),
      timeAverageReply: await this.calculateTimeAverageReply(
        storeId,
        dataStart,
        dataEnd,
      ),
      timeAverageCompletion: await this.calculateTimeAverageCompletion(
        storeId,
        dataStart,
        dataEnd,
      ),
      timeAverageFirstReply: await this.calculateTimeAverageFirstReply(
        storeId,
        dataStart,
        dataEnd,
        undefined,
        employeeId,
      ),
      timeAverageReplyBetweenMessages:
        await this.calculateTimeAverageReplyBetweenMessages(
          storeId,
          dataStart,
          dataEnd,
          undefined,
          employeeId,
        ),
      conversionByTemperature: await this.calculateConversionByTemperature(
        storeId,
        dataStart,
        dataEnd,
      ),
      limitSuccess: limitSuccessTotal,
      rateRecovery: rateRecoveryTotal,
      limitConversion: limitConversionTotal,
      limitQualification: limitQualificationTotal,
      rateConversionLeads: rateConversionLeadsTotal,
      limitConversionLeads: limitConversionLeadsTotal,
      limitShowroom: limitShowroomTotal,
      limitShowroomSuccess: limitShowroomSuccessTotal,
      rateShowroom: rateShowroomTotal,
      timeAverageReplyPreSalesperson: timeAverageReplyPreSalespersonTotal,
      timeAverageReplySalesperson: timeAverageReplySalespersonTotal,
      appointmentsVisits: appointmentsVisitsTotal,
      rateAttendanceVisits: rateAttendanceVisitsTotal,
      visitsAttended: reportByMode.reduce(
        (sum, item) => sum + item.visitsAttended,
        0,
      ),
      reasonsLoss: reasonsLossTotal,
      reasonsLossesPreDeal: reasonsLossesPreDealTotal,
      timeAverageReplyPreSalespersonByMonth:
        timeAverageReplyPreSalespersonByMonthTotal,
      timeAverageReplySalespersonByMonth:
        timeAverageReplySalespersonByMonthTotal,
      dealsPreDealWithoutFollowUp: reportByMode.reduce((acc, item) => {
        const preDeal = item.dealsPreDealWithoutFollowUp;
        return preDeal ? acc.concat(preDeal) : acc;
      }, []),
      dealsSalesWithoutFollowUp: reportByMode.reduce((acc, item) => {
        const sales = item.dealsSalesWithoutFollowUp;
        return sales ? acc.concat(sales) : acc;
      }, []),
    };

    // Calculate taxas for o total general
    totalGeneral.rateSuccess =
      totalGeneral.totalDeals > 0
        ? parseFloat(
            (
              (totalGeneral.dealsWellSucceeded / totalGeneral.totalDeals) *
              100
            ).toFixed(2),
          )
        : 0;
    totalGeneral.rateFailure =
      totalGeneral.totalDeals > 0
        ? parseFloat(
            ((totalGeneral.failures / totalGeneral.totalDeals) * 100).toFixed(
              2,
            ),
          )
        : 0;
    totalGeneral.averageConversion = totalGeneral.rateSuccess;

    totalGeneral.averageQualification =
      totalGeneral.totalDeals > 0
        ? parseFloat(
            ((limitQualificationTotal / totalGeneral.totalDeals) * 100).toFixed(
              2,
            ),
          )
        : 0;

    // Calculate porcentagens of segmentação by temperature for o total general
    const totalTemperatureGeneral =
      totalGeneral.segmentationTemperature.cold.value +
      totalGeneral.segmentationTemperature.warm.value +
      totalGeneral.segmentationTemperature.hot.value;

    totalGeneral.segmentationTemperature.cold.percentage =
      totalTemperatureGeneral > 0
        ? parseFloat(
            (
              (totalGeneral.segmentationTemperature.cold.value /
                totalTemperatureGeneral) *
              100
            ).toFixed(2),
          )
        : 0;
    totalGeneral.segmentationTemperature.warm.percentage =
      totalTemperatureGeneral > 0
        ? parseFloat(
            (
              (totalGeneral.segmentationTemperature.warm.value /
                totalTemperatureGeneral) *
              100
            ).toFixed(2),
          )
        : 0;
    totalGeneral.segmentationTemperature.hot.percentage =
      totalTemperatureGeneral > 0
        ? parseFloat(
            (
              (totalGeneral.segmentationTemperature.hot.value /
                totalTemperatureGeneral) *
              100
            ).toFixed(2),
          )
        : 0;

    // Add o total in final of array
    reportByMode.push(totalGeneral);

    return reportByMode;
  }

  private async calculateTimeAverageReplyByMode(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
    employeeId?: string,
  ): Promise<string> {
    const whereCondition: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (this.isModeDeal(mode)) {
      whereCondition.dealMode = mode;
    }

    if (employeeId) {
      whereCondition.dealAssignee = { some: { employeeId } };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
      select: {
        chat: {
          select: {
            id: true,
          },
        },
      },
    });

    const chatIds = deals.flatMap((deal) => deal.chat.map((chat) => chat.id));

    if (chatIds.length === 0) {
      return '0min';
    }

    const msgs = await this.prismaService.message.findMany({
      where: {
        chatId: {
          in: chatIds,
        },
        sender: {
          in: [Sender.CUSTOMER, Sender.STORE, Sender.SYSTEM],
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      select: {
        chatId: true,
        sender: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const diffs: number[] = [];
    const state = new Map<string, { customerAt?: Date; responded?: boolean }>();

    for (const { chatId, sender, createdAt } of msgs) {
      const s = state.get(chatId) ?? {};
      if (sender === Sender.CUSTOMER) {
        if (!s.customerAt || s.responded) {
          s.customerAt = createdAt;
          s.responded = false;
          state.set(chatId, s);
        }
        continue;
      }
      if (
        (sender === Sender.STORE || sender === Sender.SYSTEM) &&
        s.customerAt &&
        !s.responded
      ) {
        const diff = this.calculateDifferenceMinutesDaysBusiness(
          s.customerAt!,
          createdAt,
        );
        diffs.push(diff);
        s.responded = true;
        state.set(chatId, s);
      }
    }

    if (diffs.length === 0) {
      return '0min';
    }

    const timeAverage =
      diffs.reduce((sum, time) => sum + time, 0) / diffs.length;
    return this.formatTime(timeAverage);
  }

  private async calculateTimeAverageCompletionByMode(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
    employeeId?: string,
  ): Promise<string> {
    const whereCondition: any = {
      storeId,
      status: {
        in: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
      },
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (this.isModeDeal(mode)) {
      whereCondition.dealMode = mode;
    }

    if (employeeId) {
      whereCondition.dealAssignee = { some: { employeeId } };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
    });

    if (deals.length === 0) {
      return '0min';
    }

    const timesCompletion = deals.map((deal) => {
      const created = new Date(deal.createdAt);
      const updated = new Date(deal.updatedAt);
      return this.calculateDifferenceMinutesDaysBusiness(created, updated);
    });

    const timeAverage =
      timesCompletion.reduce((sum, time) => sum + time, 0) /
      timesCompletion.length;
    return this.formatTime(Math.round(timeAverage));
  }

  private async calculateTimeAverageReplyComplete(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<string> {
    // Build condições of filter for deals
    const whereCondition: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    // Filter by mode se não for 'total'
    if (mode && mode !== 'total') {
      whereCondition.dealMode = mode;
    }

    // Filter by employee se especificado
    if (employeeId) {
      whereCondition.dealAssignee = { some: { employeeId } };
    }

    // Find deals que atendem aos critérios
    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
      select: {
        id: true,
        chat: {
          select: {
            id: true,
          },
        },
      },
    });

    if (deals.length === 0) {
      return '0min';
    }

    // Extract IDs of chats
    const chatIds = deals.flatMap((deal) => deal.chat).map((chat) => chat.id);

    if (chatIds.length === 0) {
      return '0min';
    }

    // Find all as messages of chats relacionados
    const messages = await this.prismaService.message.findMany({
      where: {
        chatId: { in: chatIds },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      select: {
        chatId: true,
        sender: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (messages.length === 0) {
      return '0min';
    }

    // Agrupar messages by chat
    const messagesByChat = messages.reduce(
      (acc, message) => {
        if (!acc[message.chatId]) {
          acc[message.chatId] = [];
        }
        acc[message.chatId].push(message);
        return acc;
      },
      {} as Record<string, typeof messages>,
    );

    const timesReply: number[] = [];

    // Calculate times of reply for cada chat
    Object.values(messagesByChat).forEach((messagesChat) => {
      let lastMessageCustomer: Date | null = null;

      messagesChat.forEach((message) => {
        if (message.sender === Sender.CUSTOMER) {
          // Message of customer - mark as última message of customer
          lastMessageCustomer = new Date(message.createdAt);
        } else if (
          (message.sender === Sender.STORE ||
            message.sender === Sender.SYSTEM) &&
          lastMessageCustomer
        ) {
          // Message of store/system após message of customer - calculate time of reply
          const timeReply = this.calculateDifferenceMinutesDaysBusiness(
            lastMessageCustomer,
            new Date(message.createdAt),
          );

          if (timeReply > 0) {
            timesReply.push(timeReply);
          }

          // Reset for próxima sequência
          lastMessageCustomer = null;
        }
      });
    });

    if (timesReply.length === 0) {
      return '0min';
    }

    // Calculate time médio
    const timeAverage =
      timesReply.reduce((sum, time) => sum + time, 0) / timesReply.length;

    // Usar a new função of formatção
    return this.formatTime(timeAverage);
  }

  private async calculateConversionByTemperatureByMode(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode: MODE_DEAL | 'total',
    employeeId?: string,
  ) {
    const temperatures = Object.values(TEMPERATURE_DEAL) as TEMPERATURE_DEAL[];
    const result = {
      cold: { total: 0, conversions: 0, rate: 0 },
      warm: { total: 0, conversions: 0, rate: 0 },
      hot: { total: 0, conversions: 0, rate: 0 },
    };

    for (const temperature of temperatures) {
      const baseWhereCondition: any = {
        storeId,
        dealMode: mode,
        temperature,
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      };

      if (employeeId) {
        baseWhereCondition.dealAssignee = { some: { employeeId } };
      }

      const [total, conversions] = await Promise.all([
        this.prismaService.deal.count({
          where: baseWhereCondition,
        }),
        this.prismaService.deal.count({
          where: {
            ...baseWhereCondition,
            status: STATUS_DEAL.SUCCESS,
          },
        }),
      ]);

      const rate =
        total > 0 ? parseFloat(((conversions / total) * 100).toFixed(2)) : 0;
      result[temperature] = { total, conversions, rate };
    }

    return result;
  }

  private async calculateLimitSuccess(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereClause: any = {
      storeId,
      status: STATUS_DEAL.SUCCESS,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode && mode !== 'total') {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return await this.prismaService.deal.count({
      where: whereClause,
    });
  }

  private async calculateRateRecovery(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode && mode !== 'total') {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    const [totalDeals, dealsRecovery] = await Promise.all([
      this.prismaService.deal.count({
        where: whereClause,
      }),
      this.prismaService.deal.count({
        where: {
          ...whereClause,
          status: STATUS_DEAL.RECOVERY,
        },
      }),
    ]);

    return totalDeals > 0
      ? parseFloat(((dealsRecovery / totalDeals) * 100).toFixed(2))
      : 0;
  }

  private async calculateLimitConversion(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereClause: any = {
      storeId,
      status: STATUS_DEAL.SUCCESS,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode && mode !== 'total') {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return await this.prismaService.deal.count({
      where: whereClause,
    });
  }

  private async calculateLimitQualification(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereClause: any = {
      storeId,
      status: {
        in: [
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.VISIT,
          STATUS_DEAL.AT_NEGOTIATION,
          STATUS_DEAL.SUCCESS,
        ],
      },
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode && mode !== 'total') {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return await this.prismaService.deal.count({
      where: whereClause,
    });
  }

  private async calculateRateConversionLeads(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const baseWhereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      baseWhereClause.dealMode = mode;
    }

    if (employeeId) {
      baseWhereClause.dealAssignee = { some: { employeeId } };
    }

    const [totalLeads, leadsConverted] = await Promise.all([
      this.prismaService.deal.count({
        where: {
          ...baseWhereClause,
          status: {
            in: [
              STATUS_DEAL.DEAL_INITIAL,
              STATUS_DEAL.VISIT,
              STATUS_DEAL.AT_NEGOTIATION,
              STATUS_DEAL.SUCCESS,
            ],
          },
        },
      }),
      this.prismaService.deal.count({
        where: {
          ...baseWhereClause,
          status: STATUS_DEAL.SUCCESS,
        },
      }),
    ]);

    return totalLeads > 0
      ? parseFloat(((leadsConverted / totalLeads) * 100).toFixed(2))
      : 0;
  }

  private async calculateLimitConversionLeads(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereClause: any = {
      storeId,
      status: STATUS_DEAL.SUCCESS,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return await this.prismaService.deal.count({
      where: whereClause,
    });
  }

  private async calculateLimitShowroom(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: MODE_DEAL | 'total',
    employeeId?: string,
  ): Promise<number> {
    const whereClause: any = {
      storeId,
      dealOrigin: ORIGIN_DEAL.SHOWROOM,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return await this.prismaService.deal.count({
      where: whereClause,
    });
  }

  private async calculateLimitShowroomSuccess(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereClause: any = {
      storeId,
      dealOrigin: ORIGIN_DEAL.SHOWROOM,
      status: STATUS_DEAL.SUCCESS,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    return await this.prismaService.deal.count({
      where: whereClause,
    });
  }

  private async calculateRateShowroom(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: MODE_DEAL | 'total',
    employeeId?: string,
  ): Promise<number> {
    const baseWhereClause: any = {
      storeId,
      dealOrigin: ORIGIN_DEAL.SHOWROOM,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      baseWhereClause.dealMode = mode;
    }

    if (employeeId) {
      baseWhereClause.dealAssignee = { some: { employeeId } };
    }

    const [totalShowroom, successesShowroom] = await Promise.all([
      this.prismaService.deal.count({
        where: baseWhereClause,
      }),
      this.prismaService.deal.count({
        where: {
          ...baseWhereClause,
          status: STATUS_DEAL.SUCCESS,
        },
      }),
    ]);

    return totalShowroom > 0
      ? parseFloat(((successesShowroom / totalShowroom) * 100).toFixed(2))
      : 0;
  }

  private async calculateTimeAverageReplyByType(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    typeEmployee: 'preSalesperson' | 'salesperson',
    mode?: string,
    employeeId?: string,
  ): Promise<string> {
    const whereEmployee: any = {
      storeId,
      status: 'active',
      roles: {
        some: {
          role: {
            in: [
              typeEmployee === 'preSalesperson'
                ? 'Pre-salesperson'
                : 'Salesperson',
            ],
            mode: 'insensitive',
          },
        },
      },
    };

    // Filter by employee específico se fornecido
    if (employeeId) {
      whereEmployee.id = employeeId;
    }

    const employees = await this.prismaService.employee.findMany({
      where: whereEmployee,
      select: {
        id: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (employees.length === 0) {
      return '0min';
    }

    const idsUsersEmployees = employees
      .map((c) => c.user?.id)
      .filter((id) => id !== undefined);

    if (idsUsersEmployees.length === 0) {
      return '0min';
    }

    // Find deals que têm employees of type especificado
    const whereDeal: any = {
      dealAssignee: {
        some: {
          employeeId: {
            in: employees.map((c) => c.id),
          },
        },
      },
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereDeal.dealMode = mode;
    }

    // Find chats que têm tanto messages of customer quanto of employee específico
    const chats = await this.prismaService.chat.findMany({
      where: {
        storeId,
        deal: whereDeal,
        message: {
          some: {
            sender: Sender.CUSTOMER,
          },
        },
      },
      include: {
        message: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        deal: true,
      },
    });

    if (chats.length === 0) {
      return '0min';
    }

    let totalMinutes = 0;
    let totalReplies = 0;

    for (const chat of chats) {
      const messages = chat.message;

      // Percorrer all as messages for find pares customer -> employee
      for (let i = 0; i < messages.length - 1; i++) {
        const messageCurrent = messages[i];

        // Se a message current é of customer
        if (messageCurrent.sender === Sender.CUSTOMER) {
          // Search a próxima message of employee específico
          for (let j = i + 1; j < messages.length; j++) {
            const nextMessage = messages[j];

            if (
              nextMessage.sender === Sender.STORE &&
              nextMessage.userId &&
              idsUsersEmployees.includes(nextMessage.userId)
            ) {
              const timeReply = this.calculateDifferenceMinutesDaysBusiness(
                messageCurrent.createdAt,
                nextMessage.createdAt,
              );
              totalMinutes += timeReply;
              totalReplies++;
              break; // Encontrou a reply, pular for próxima message of customer
            }
          }
        }
      }
    }

    if (totalReplies === 0) {
      return '0min';
    }

    const averageMinutes = totalMinutes / totalReplies;
    return this.formatTime(averageMinutes);
  }

  private async calculateAppointmentsVisits(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereDeal: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereDeal.dealMode = mode;
    }

    if (employeeId) {
      whereDeal.dealAssignee = { some: { employeeId } };
    }

    const appointments = await this.prismaService.dealVisit.count({
      where: {
        deal: whereDeal,
      },
    });

    return appointments;
  }

  private async calculateRateAttendanceVisits(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereDeal: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereDeal.dealMode = mode;
    }

    if (employeeId) {
      whereDeal.dealAssignee = { some: { employeeId } };
    }

    const [totalAppointments, visitsCompleted] = await Promise.all([
      this.prismaService.dealVisit.count({
        where: {
          deal: whereDeal,
        },
      }),
      this.prismaService.dealVisit.count({
        where: {
          deal: whereDeal,
          completed: true,
        },
      }),
    ]);

    if (totalAppointments === 0) {
      return 0;
    }

    return parseFloat(((visitsCompleted / totalAppointments) * 100).toFixed(2));
  }

  private async calculateVisitsAttended(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const whereDeal: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereDeal.dealMode = mode;
    }

    if (employeeId) {
      whereDeal.dealAssignee = { some: { employeeId } };
    }

    const visitsAttended = await this.prismaService.dealVisit.count({
      where: {
        deal: whereDeal,
        completed: true,
      },
    });

    return visitsAttended;
  }

  private async calculateReasonsLoss(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<
    {
      reason: string;
      percentage: number;
      total: number;
      subReasons?: Array<{
        subReason: string;
        limit: number;
        percentage: number;
      }>;
    }[]
  > {
    const whereDeal: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
      status: STATUS_DEAL.LOST,
    };

    if (mode) {
      whereDeal.dealMode = mode;
    }

    if (employeeId) {
      whereDeal.dealAssignee = { some: { employeeId } };
    }

    const comments = await this.prismaService.dealComment.findMany({
      where: {
        deal: whereDeal,
        lostReason: {
          not: null,
        },
      },
      select: {
        lostReason: true,
        subLostReason: true,
      },
    });

    // Agrupar by reason primary
    const reasonsMap = new Map<
      string,
      { total: number; subReasons: Map<string, number> }
    >();

    comments.forEach((comment) => {
      const reason = comment.lostReason || 'Not provided';

      if (!reasonsMap.has(reason)) {
        reasonsMap.set(reason, { total: 0, subReasons: new Map() });
      }

      const reasonData = reasonsMap.get(reason)!;
      reasonData.total += 1;

      // Count subReasons se existir
      if (comment.subLostReason) {
        const subReason = comment.subLostReason;
        reasonData.subReasons.set(
          subReason,
          (reasonData.subReasons.get(subReason) || 0) + 1,
        );
      }
    });

    const totalLosses = comments.length;

    return Array.from(reasonsMap.entries()).map(([reason, data]) => {
      const subReasonsArray = Array.from(data.subReasons.entries()).map(
        ([subReason, limit]) => ({
          subReason,
          limit,
          percentage:
            totalLosses > 0
              ? parseFloat(((limit / totalLosses) * 100).toFixed(2))
              : 0,
        }),
      );

      return {
        reason,
        total: data.total,
        percentage:
          totalLosses > 0
            ? parseFloat(((data.total / totalLosses) * 100).toFixed(2))
            : 0,
        subReasons: subReasonsArray.length > 0 ? subReasonsArray : undefined,
      };
    });
  }

  private async calculateTimeAverageReplyByMonth(
    storeId: string,
    dataEnd: Date,
    typeEmployee: 'preSalesperson' | 'salesperson',
    employeeId?: string,
  ): Promise<
    {
      month: string;
      timeAverage: string;
    }[]
  > {
    const results = [];

    // Calculate for os últimos 4 months a partir of data end
    for (let i = 3; i >= 0; i--) {
      const dataStartMonth = startOfMonth(
        new Date(dataEnd.getFullYear(), dataEnd.getMonth() - i, 1),
      );
      const dataEndMonth = endOfMonth(dataStartMonth);

      // Garantir que não ultrapasse a data end selecionada
      const dataEndAdjusted = dataEndMonth > dataEnd ? dataEnd : dataEndMonth;

      const timeAverage = await this.calculateTimeAverageReplyByType(
        storeId,
        dataStartMonth,
        dataEndAdjusted,
        typeEmployee,
        undefined,
        employeeId,
      );

      results.push({
        month: format(dataStartMonth, 'MMM/yyyy', { locale: ptBR }),
        timeAverage,
      });
    }

    return results;
  }

  private async calculateTimeAverageByStageNegotiation(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
  ) {
    const dealsFinalized = await this.prismaService.deal.findMany({
      where: {
        storeId,
        status: {
          in: [STATUS_DEAL.SUCCESS, STATUS_DEAL.LOST],
        },
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
        ...(employeeId && {
          dealAssignee: {
            some: {
              employeeId,
            },
          },
        }),
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Map stages for cálculo of time
    const stagesMap = {
      [STATUS_DEAL.PRE_DEAL]: 'Pre-deal',
      [STATUS_DEAL.DEAL_INITIAL]: 'Deal Initial',
      [STATUS_DEAL.VISIT]: 'Visit',
      [STATUS_DEAL.AT_NEGOTIATION]: 'At Negotiation',
      [STATUS_DEAL.RECOVERY]: 'Recovery',
    };

    const timesByStage: Record<string, number[]> = {
      'Pre-deal': [],
      'Deal Initial': [],
      Visit: [],
      'At Negotiation': [],
      Recovery: [],
    };

    // Process cada deal
    for (const deal of dealsFinalized) {
      const logs = await this.getLogsStatusDeal(deal.id);

      if (logs.length === 0) continue;

      // Add log initial (criação of deal)
      const logsWithStart = [
        {
          message: `Status changed for ${STATUS_DEAL_MAP[STATUS_DEAL.PRE_DEAL]}`,
          createdAt: deal.createdAt,
        },
        ...logs,
      ];

      // Calculate time between mudanças of status
      for (let i = 0; i < logsWithStart.length - 1; i++) {
        const logCurrent = logsWithStart[i];
        const nextLog = logsWithStart[i + 1];

        const statusCurrent = this.extractStatusOfLog(logCurrent.message);
        const stageCurrent = stagesMap[statusCurrent];

        if (stageCurrent) {
          const timeMinutes = differenceInMinutes(
            new Date(nextLog.createdAt),
            new Date(logCurrent.createdAt),
          );

          if (timeMinutes > 0) {
            timesByStage[stageCurrent].push(timeMinutes);
          }
        }
      }

      // Calculate time of última stage até finalização
      if (logsWithStart.length > 0) {
        const lastLog = logsWithStart[logsWithStart.length - 1];
        const statusLast = this.extractStatusOfLog(lastLog.message);
        const stageLast = stagesMap[statusLast];

        if (stageLast && stageLast !== 'Recovery') {
          const timeMinutes = differenceInMinutes(
            deal.updatedAt,
            new Date(lastLog.createdAt),
          );

          if (timeMinutes > 0) {
            timesByStage[stageLast].push(timeMinutes);
          }
        }
      }
    }

    // Calculate médays and format result
    const formatTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}min`;
    };

    const calculateAverage = (times: number[]): number => {
      if (times.length === 0) return 0;
      return times.reduce((acc, time) => acc + time, 0) / times.length;
    };

    const averages = {
      'Pre-deal': calculateAverage(timesByStage['Pre-deal']),
      'Deal Initial': calculateAverage(timesByStage['Deal Initial']),
      Visit: calculateAverage(timesByStage['Visit']),
      'At Negotiation': calculateAverage(timesByStage['At Negotiation']),
      Recovery: calculateAverage(timesByStage['Recovery']),
    };

    // Identificar stage more rápida and more slow
    const averagesValid = Object.entries(averages).filter(
      ([_, time]) => time > 0,
    );
    const stageMoreQuick = averagesValid.reduce(
      (min, [stage, time]) => (time < min[1] ? [stage, time] : min),
      ['', Infinity],
    );
    const stageMoreSlow = averagesValid.reduce(
      (max, [stage, time]) => (time > max[1] ? [stage, time] : max),
      ['', 0],
    );

    return {
      'Pre-deal': formatTime(averages['Pre-deal']),
      'Deal Initial': formatTime(averages['Deal Initial']),
      Visit: formatTime(averages['Visit']),
      'At Negotiation': formatTime(averages['At Negotiation']),
      Recovery: formatTime(averages['Recovery']),
      stageMoreQuick: stageMoreQuick[0]
        ? formatTime(stageMoreQuick[1])
        : '0h 0min',
      stageMoreSlow: stageMoreSlow[0]
        ? formatTime(stageMoreSlow[1])
        : '0h 0min',
    };
  }

  private async calculateReasonsLossesBusiness(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
    mode?: string,
  ) {
    // Find deals lost with seus comentários
    const dealsLost = await this.prismaService.deal.findMany({
      where: {
        storeId,
        status: STATUS_DEAL.LOST,
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
        ...(mode && mode !== 'total' && { dealMode: mode }),
        ...(employeeId && {
          dealAssignee: {
            some: {
              employeeId,
            },
          },
        }),
      },
      include: {
        dealComment: {
          where: {
            lostReason: {
              not: null,
            },
          },
          select: {
            lostReason: true,
            subLostReason: true,
          },
        },
      },
    });

    const totalLosses = dealsLost.length;

    // Counters for cada reason and subReason
    const reasonsCount = new Map<string, number>();
    const subReasonsCount = new Map<
      string,
      { reason: string; limit: number }
    >();

    // Count reasons and subReasons baseado in comentários actual
    dealsLost.forEach((deal) => {
      // Get o último comentário with reason of loss (more recent)
      const commentWithReason = deal.dealComment
        .filter((c) => c.lostReason)
        .pop(); // Pega o último comentário with reason

      if (commentWithReason && commentWithReason.lostReason) {
        const reason = commentWithReason.lostReason.trim();
        reasonsCount.set(reason, (reasonsCount.get(reason) || 0) + 1);

        // Count subReasons se existir
        if (commentWithReason.subLostReason) {
          const subReason = commentWithReason.subLostReason.trim();
          const keySubReason = `${reason}|${subReason}`;
          subReasonsCount.set(keySubReason, {
            reason,
            limit: (subReasonsCount.get(keySubReason)?.limit || 0) + 1,
          });
        }
      }
    });

    // Converter for array and sort by frequência
    const reasonsArray = Array.from(reasonsCount.entries())
      .map(([reason, limit]) => ({
        reason,
        limit,
        percentage: totalLosses > 0 ? (limit / totalLosses) * 100 : 0,
      }))
      .sort((a, b) => b.limit - a.limit);

    // Converter subReasons for array and organizar by reason primary
    const subReasonsArray = Array.from(subReasonsCount.entries())
      .map(([key, data]) => {
        const [reasonPrimary, subReason] = key.split('|');
        return {
          reasonPrimary,
          subReason,
          limit: data.limit,
          percentage: totalLosses > 0 ? (data.limit / totalLosses) * 100 : 0,
        };
      })
      .sort((a, b) => b.limit - a.limit);

    // Agrupar subReasons by reason primary
    const subReasonsByReason = subReasonsArray.reduce(
      (acc, item) => {
        if (!acc[item.reasonPrimary]) {
          acc[item.reasonPrimary] = [];
        }
        acc[item.reasonPrimary].push({
          subReason: item.subReason,
          limit: item.limit,
          percentage: item.percentage,
        });
        return acc;
      },
      {} as Record<
        string,
        Array<{ subReason: string; limit: number; percentage: number }>
      >,
    );

    // Find primary reason
    const primaryReason =
      reasonsArray.length > 0 ? reasonsArray[0].reason : 'Not provided';

    // Calculate rate of loss
    const totalDeals = await this.prismaService.deal.count({
      where: {
        storeId,
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
        ...(mode && mode !== 'total' && { dealMode: mode }),
        ...(employeeId && {
          dealAssignee: {
            some: {
              employeeId,
            },
          },
        }),
      },
    });

    const rateLoss =
      totalDeals > 0
        ? parseFloat(((totalLosses / totalDeals) * 100).toFixed(2))
        : 0;

    // Map for os fields específicos of DTO (mantendo compatibilidade)
    const getLimitByReason = (wordsKey: string[]): number => {
      return reasonsArray
        .filter((m) =>
          wordsKey.some((word) =>
            m.reason.toLowerCase().includes(word.toLowerCase()),
          ),
        )
        .reduce((sum, m) => sum + m.limit, 0);
    };

    const getPercentageByReason = (wordsKey: string[]): number => {
      const limit = getLimitByReason(wordsKey);
      return totalLosses > 0
        ? parseFloat(((limit / totalLosses) * 100).toFixed(2))
        : 0;
    };

    // Categorizar reasons baseado at words-key common
    const priceHighQtd = getLimitByReason([
      'price',
      'price',
      'caro',
      'value',
      'financial',
    ]);
    const competitionQtd = getLimitByReason([
      'competition',
      'concorrente',
      'other',
      'other',
    ]);
    const notQualifiedQtd = getLimitByReason([
      'qualified',
      'profile',
      'interest',
    ]);
    const timingQtd = getLimitByReason([
      'timing',
      'time',
      'deadline',
      'urgencia',
    ]);

    // Other reasons (que não se encaixam in categories above)
    const categorized =
      priceHighQtd + competitionQtd + notQualifiedQtd + timingQtd;
    const otherQtd = totalLosses - categorized;

    return {
      priceHigh: {
        value: priceHighQtd,
        percentage: getPercentageByReason([
          'price',
          'price',
          'caro',
          'value',
          'financial',
        ]),
      },
      competition: {
        value: competitionQtd,
        percentage: getPercentageByReason([
          'competition',
          'concorrente',
          'other',
          'other',
        ]),
      },
      notQualified: {
        value: notQualifiedQtd,
        percentage: getPercentageByReason(['qualified', 'profile', 'interest']),
      },
      timing: {
        value: timingQtd,
        percentage: getPercentageByReason([
          'timing',
          'time',
          'deadline',
          'urgencia',
        ]),
      },
      other: {
        value: otherQtd,
        percentage:
          totalLosses > 0
            ? parseFloat(((otherQtd / totalLosses) * 100).toFixed(2))
            : 0,
      },
      totalLosses,
      primaryReason,
      rateLoss,
      reasonsDetailed: reasonsArray,
      subReasonsByReason,
      subReasonsDetailed: subReasonsArray,
    };
  }

  private async findDealsPreDealWithoutFollowUp(
    storeId: string,
    employeeId?: string,
  ) {
    const whereCondition: any = {
      storeId,
      status: STATUS_DEAL.PRE_DEAL,
    };

    if (employeeId) {
      whereCondition.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
      include: {
        chat: {
          include: {
            message: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        dealComment: {
          orderBy: { createdAt: 'desc' },
        },
        dealAssignee: {
          include: {
            employee: {
              select: {
                name: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
      take: 8,
    });

    const dealsWithDays = deals.map((deal) => {
      const idsAssignees = deal.dealAssignee
        .map((r) => r.employee?.userId)
        .filter((id): id is string => id !== undefined && id !== null);

      const lastCommentAssignee = deal.dealComment.find((c) =>
        idsAssignees.includes(c.userId),
      );

      const allMessages = deal.chat?.flatMap((c) => c.message) || [];
      const lastMessageAssignee = allMessages.find(
        (m) => m.userId && idsAssignees.includes(m.userId),
      );

      const datesInteraction = [
        lastCommentAssignee?.createdAt,
        lastMessageAssignee?.createdAt,
      ].filter((d): d is Date => d !== null && d !== undefined);

      const dataLastInteraction =
        datesInteraction.length > 0
          ? datesInteraction.reduce((a, b) =>
              a.getTime() > b.getTime() ? a : b,
            )
          : deal.createdAt;

      const daysWithoutFollowUp = differenceInDays(
        new Date(),
        dataLastInteraction,
      );

      const employee = deal.dealAssignee?.[0]?.employee?.name;

      return {
        id: deal.id,
        nameDeal: deal.title,
        period: format(deal.createdAt, 'dd/MM/yyyy', { locale: ptBR }),
        status: STATUS_DEAL_MAP[deal.status],
        employee: employee || 'Not assigned',
        daysWithoutFollowUp,
      };
    });

    return dealsWithDays.sort(
      (a, b) => b.daysWithoutFollowUp - a.daysWithoutFollowUp,
    );
  }

  private async findDealsSalesWithoutFollowUp(
    storeId: string,
    employeeId?: string,
  ) {
    const statusSales = [
      STATUS_DEAL.DEAL_INITIAL,
      STATUS_DEAL.VISIT,
      STATUS_DEAL.AT_NEGOTIATION,
    ];

    const whereCondition: any = {
      storeId,
      status: {
        in: statusSales,
      },
    };

    if (employeeId) {
      whereCondition.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
      include: {
        chat: {
          include: {
            message: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        dealComment: {
          orderBy: { createdAt: 'desc' },
        },
        dealAssignee: {
          include: {
            employee: {
              select: {
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
      },
      orderBy: { updatedAt: 'asc' },
      take: 8,
    });

    const dealsWithDays = deals.map((deal) => {
      const idsAssignees = deal.dealAssignee
        .map((r) => r.employee?.userId)
        .filter((id): id is string => id !== undefined && id !== null);

      const lastCommentAssignee = deal.dealComment.find((c) =>
        idsAssignees.includes(c.userId),
      );

      const allMessages = deal.chat?.flatMap((c) => c.message) || [];
      const lastMessageAssignee = allMessages.find(
        (m) => m.userId && idsAssignees.includes(m.userId),
      );

      const datesInteraction = [
        lastCommentAssignee?.createdAt,
        lastMessageAssignee?.createdAt,
      ].filter((d): d is Date => d !== null && d !== undefined);

      const dataLastInteraction =
        datesInteraction.length > 0
          ? datesInteraction.reduce((a, b) =>
              a.getTime() > b.getTime() ? a : b,
            )
          : deal.createdAt;

      const daysWithoutFollowUp = differenceInDays(
        new Date(),
        dataLastInteraction,
      );

      let employeeSelected = null;

      if (deal.dealAssignee && deal.dealAssignee.length > 0) {
        if (deal.dealAssignee.length > 1) {
          const salesperson = deal.dealAssignee.find((assignee) => {
            return assignee.employee?.roles?.some(
              (role) => role.role.toLowerCase() === 'salesperson',
            );
          });

          if (salesperson) {
            employeeSelected = salesperson.employee;
          } else {
            employeeSelected = deal.dealAssignee[0]?.employee;
          }
        } else {
          employeeSelected = deal.dealAssignee[0]?.employee;
        }
      }

      return {
        id: deal.id,
        nameDeal: deal.title,
        period: format(deal.createdAt, 'dd/MM/yyyy', { locale: ptBR }),
        status: STATUS_DEAL_MAP[deal.status],
        employee: employeeSelected?.name || 'Not assigned',
        daysWithoutFollowUp,
      };
    });

    return dealsWithDays.sort(
      (a, b) => b.daysWithoutFollowUp - a.daysWithoutFollowUp,
    );
  }

  private async findDealsPreDealWithoutFollowUpByMode(
    storeId: string,
    mode: MODE_DEAL | 'total',
    employeeId?: string,
  ) {
    const whereCondition: any = {
      storeId,
      status: STATUS_DEAL.PRE_DEAL,
      dealMode: mode,
    };

    if (employeeId) {
      whereCondition.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
      include: {
        chat: {
          include: {
            message: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        dealComment: {
          orderBy: { createdAt: 'desc' },
        },
        dealAssignee: {
          include: {
            employee: {
              select: {
                name: true,
                userId: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
      take: 8,
    });

    const dealsWithDays = deals.map((deal) => {
      const idsAssignees = deal.dealAssignee
        .map((r) => r.employee?.userId)
        .filter((id): id is string => id !== undefined && id !== null);

      const lastCommentAssignee = deal.dealComment.find((c) =>
        idsAssignees.includes(c.userId),
      );

      const allMessages = deal.chat?.flatMap((c) => c.message) || [];
      const lastMessageAssignee = allMessages.find(
        (m) => m.userId && idsAssignees.includes(m.userId),
      );

      const datesInteraction = [
        lastCommentAssignee?.createdAt,
        lastMessageAssignee?.createdAt,
      ].filter((d): d is Date => d !== null && d !== undefined);

      const dataLastInteraction =
        datesInteraction.length > 0
          ? datesInteraction.reduce((a, b) =>
              a.getTime() > b.getTime() ? a : b,
            )
          : deal.createdAt;

      const daysWithoutFollowUp = differenceInDays(
        new Date(),
        dataLastInteraction,
      );

      const employee = deal.dealAssignee?.[0]?.employee?.name;

      return {
        id: deal.id,
        nameDeal: deal.title,
        period: format(deal.createdAt, 'dd/MM/yyyy', { locale: ptBR }),
        status: STATUS_DEAL_MAP[deal.status],
        employee: employee || 'Not assigned',
        daysWithoutFollowUp,
      };
    });

    return dealsWithDays.sort(
      (a, b) => b.daysWithoutFollowUp - a.daysWithoutFollowUp,
    );
  }

  private async findDealsSalesWithoutFollowUpByMode(
    storeId: string,
    mode: MODE_DEAL | 'total',
    employeeId?: string,
  ) {
    const whereCondition: any = {
      storeId,
      status: {
        in: [
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.AT_NEGOTIATION,
          STATUS_DEAL.VISIT,
        ],
      },
      dealMode: mode,
    };

    if (employeeId) {
      whereCondition.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereCondition,
      include: {
        chat: {
          include: {
            message: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        dealComment: {
          orderBy: { createdAt: 'desc' },
        },
        dealAssignee: {
          include: {
            employee: {
              select: {
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
      },
      orderBy: { updatedAt: 'asc' },
      take: 8,
    });

    const dealsWithDays = deals.map((deal) => {
      const idsAssignees = deal.dealAssignee
        .map((r) => r.employee?.userId)
        .filter((id): id is string => id !== undefined && id !== null);

      const lastCommentAssignee = deal.dealComment.find((c) =>
        idsAssignees.includes(c.userId),
      );

      const allMessages = deal.chat?.flatMap((c) => c.message) || [];
      const lastMessageAssignee = allMessages.find(
        (m) => m.userId && idsAssignees.includes(m.userId),
      );

      const datesInteraction = [
        lastCommentAssignee?.createdAt,
        lastMessageAssignee?.createdAt,
      ].filter((d): d is Date => d !== null && d !== undefined);

      const dataLastInteraction =
        datesInteraction.length > 0
          ? datesInteraction.reduce((a, b) =>
              a.getTime() > b.getTime() ? a : b,
            )
          : deal.createdAt;

      const daysWithoutFollowUp = differenceInDays(
        new Date(),
        dataLastInteraction,
      );

      let employeeSelected = null;

      if (deal.dealAssignee && deal.dealAssignee.length > 0) {
        if (deal.dealAssignee.length > 1) {
          const salesperson = deal.dealAssignee.find((assignee) => {
            return assignee.employee?.roles?.some(
              (role) => role.role.toLowerCase() === 'salesperson',
            );
          });

          if (salesperson) {
            employeeSelected = salesperson.employee;
          } else {
            employeeSelected = deal.dealAssignee[0]?.employee;
          }
        } else {
          employeeSelected = deal.dealAssignee[0]?.employee;
        }
      }

      return {
        id: deal.id,
        nameDeal: deal.title,
        period: format(deal.createdAt, 'dd/MM/yyyy', { locale: ptBR }),
        status: STATUS_DEAL_MAP[deal.status],
        employee: employeeSelected?.name || 'Not assigned',
        daysWithoutFollowUp,
      };
    });

    return dealsWithDays.sort(
      (a, b) => b.daysWithoutFollowUp - a.daysWithoutFollowUp,
    );
  }

  private async generateReportConsolidatedSalespeople(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    idUserLoggedIn?: string,
  ): Promise<ReportDetailedSalespersonDto[]> {
    const salespeople = await this.prismaService.employee.findMany({
      where: {
        storeId,
        status: 'active',
        roles: {
          some: {
            role: {
              in: ['Salesperson', 'Pre-salesperson'],
            },
          },
        },
      },
      include: { user: true },
    });

    if (salespeople.length === 0) {
      throw new NotFoundException('None salesperson found in store');
    }

    const deals = await this.prismaService.deal.findMany({
      where: {
        storeId,
        createdAt: { gte: dataStart, lte: dataEnd },
        dealAssignee: {
          some: {
            employee: {
              roles: {
                some: {
                  role: {
                    in: ['Salesperson', 'Pre-salesperson'],
                  },
                },
              },
            },
          },
        },
      },
      include: {
        dealVisit: true,
        dealAssignee: {
          include: {
            employee: {
              include: { user: true },
            },
          },
        },
      },
    });

    // Calculate métricas consolidated
    const totalLeads = deals.length;
    const conversions = deals.filter(
      (a) => a.status === STATUS_DEAL.SUCCESS,
    ).length;
    const percentageConversion =
      totalLeads > 0
        ? parseFloat(((conversions / totalLeads) * 100).toFixed(2))
        : 0;

    // Gráfico of leads by channel consolidated
    const chartLeadsByChannel =
      await this.generateChartLeadsByChannelConsolidated(
        storeId,
        dataStart,
        dataEnd,
      );

    // Segmentação by status consolidated
    const segmentationStatus = {
      initial: deals.filter((a) =>
        [STATUS_DEAL.CHAT, STATUS_DEAL.PRE_DEAL].includes(
          a.status as STATUS_DEAL,
        ),
      ).length,
      atVisit: deals.filter((a) => a.status === STATUS_DEAL.VISIT).length,
      recovery: deals.filter((a) => a.status === STATUS_DEAL.RECOVERY).length,
      negotiation: deals.filter((a) => a.status === STATUS_DEAL.AT_NEGOTIATION)
        .length,
      total: 0,
    };

    segmentationStatus.total =
      segmentationStatus.initial +
      segmentationStatus.atVisit +
      segmentationStatus.recovery +
      segmentationStatus.negotiation;

    // Segmentação by temperature consolidated
    const segmentationTemperature = {
      cold: deals.filter((a) => a.temperature === TEMPERATURE_DEAL.COLD).length,
      warm: deals.filter((a) => a.temperature === TEMPERATURE_DEAL.WARM).length,
      hot: deals.filter((a) => a.temperature === TEMPERATURE_DEAL.HOT).length,
    };

    // Rate of conversão showroom consolidated
    const totalDealsShowroom = deals.filter(
      (a) => a.dealOrigin === ORIGIN_DEAL.SHOWROOM,
    ).length;
    const conversionShowroom = deals.filter(
      (a) =>
        a.status === STATUS_DEAL.SUCCESS &&
        a.dealOrigin === ORIGIN_DEAL.SHOWROOM,
    ).length;
    const rateConversionShowroom =
      totalDealsShowroom > 0
        ? parseFloat(
            ((conversionShowroom / totalDealsShowroom) * 100).toFixed(2),
          )
        : 0;

    // Time médio of reply consolidated
    const timeAverageReply = await this.calculateTimeAverageReply(
      storeId,
      dataStart,
      dataEnd,
    );

    const failures = deals.filter((a) => a.status === STATUS_DEAL.LOST).length;

    const rateFailure =
      totalLeads > 0
        ? parseFloat(((failures / totalLeads) * 100).toFixed(2))
        : 0;
    const rateSuccess =
      totalLeads > 0
        ? parseFloat(((conversions / totalLeads) * 100).toFixed(2))
        : 0;

    const timeAverageClosing = await this.calculateTimeAverageCompletion(
      storeId,
      dataStart,
      dataEnd,
    );

    const numberConversionOnline = deals.filter(
      (a) =>
        a.status === STATUS_DEAL.SUCCESS &&
        a.dealOrigin !== ORIGIN_DEAL.SHOWROOM,
    ).length;

    const numberConversionShowroom = deals.filter(
      (a) =>
        a.status === STATUS_DEAL.SUCCESS &&
        a.dealOrigin === ORIGIN_DEAL.SHOWROOM,
    ).length;

    const timeAverageByStageNegotiation =
      await this.calculateTimeAverageByStageNegotiation(
        storeId,
        dataStart,
        dataEnd,
      );

    const reasonsLossesBusiness = await this.calculateReasonsLossesBusiness(
      storeId,
      dataStart,
      dataEnd,
    );

    // Leads vs conversões of top 3 salespeople + usuário loggedIn
    let salespeopleSelected = salespeople;

    if (idUserLoggedIn) {
      // Calculate sales of success for all os salespeople
      const salespeopleWithSales = await Promise.all(
        salespeople.map(async (v) => {
          const statusCountsV = await this.getStatusCountsForEmployee(
            v.id,
            dataStart,
            dataEnd,
          );
          const conversionsV =
            statusCountsV.find((s) => s.status === STATUS_DEAL.SUCCESS)
              ?._count || 0;
          return {
            ...v,
            sales: conversionsV,
          };
        }),
      );

      // Sort by sales of success (decrescente)
      salespeopleWithSales.sort((a, b) => b.sales - a.sales);

      // Get os top 3
      const top3Salespeople = salespeopleWithSales.slice(0, 3);

      // Check se o usuário loggedIn está in top 3
      const userLoggedInInTop3 = top3Salespeople.some(
        (v) => v.id === idUserLoggedIn,
      );

      if (!userLoggedInInTop3) {
        // Find o usuário loggedIn
        const userLoggedIn = salespeopleWithSales.find(
          (v) => v.id === idUserLoggedIn,
        );
        if (userLoggedIn) {
          // Add o usuário loggedIn aos salespeople selected
          salespeopleSelected = [...top3Salespeople, userLoggedIn];
        } else {
          salespeopleSelected = top3Salespeople;
        }
      } else {
        salespeopleSelected = top3Salespeople;
      }
    }

    const leadsVsConversionsSalesperson = await Promise.all(
      salespeopleSelected.map(async (v) => {
        const statusCountsV = await this.getStatusCountsForEmployee(
          v.id,
          dataStart,
          dataEnd,
        );
        const totalLeadsV = statusCountsV.reduce(
          (sum, item) => sum + item._count,
          0,
        );
        const conversionsV =
          statusCountsV.find((s) => s.status === STATUS_DEAL.SUCCESS)?._count ||
          0;
        return {
          id: v.id,
          name: v.name || v.user?.name || 'Without name',
          avatar: v.user?.photoUrl ?? v.photoUrl ?? undefined,
          leads: totalLeadsV,
          conversions: conversionsV,
        };
      }),
    );

    // Ranking monthly consolidated (baseado in best salesperson of período)
    const rankingMonthly = await this.calculateRankingMonthlyConsolidated(
      storeId,
      dataStart,
      dataEnd,
    );

    const leadsQualified = deals.filter((a) =>
      [
        STATUS_DEAL.DEAL_INITIAL,
        STATUS_DEAL.VISIT,
        STATUS_DEAL.AT_NEGOTIATION,
        STATUS_DEAL.SUCCESS,
      ].includes(a.status as STATUS_DEAL),
    ).length;
    const averageQualification =
      totalLeads > 0 ? (leadsQualified / totalLeads) * 100 : 0;

    // Create um array of relatórios for cada salesperson selected
    const reportsSalespeople: ReportDetailedSalespersonDto[] = [];

    for (const salesperson of salespeopleSelected) {
      const dealsSalesperson = deals.filter((a) =>
        a.dealAssignee.some((ar) => ar.employeeId === salesperson.id),
      );

      const totalLeadsSalesperson = dealsSalesperson.length;
      const conversionsSalesperson = dealsSalesperson.filter(
        (a) => a.status === STATUS_DEAL.SUCCESS,
      ).length;
      const percentageConversionSalesperson =
        totalLeadsSalesperson > 0
          ? (conversionsSalesperson / totalLeadsSalesperson) * 100
          : 0;

      // Calculate sales diárias for os salespeople of ranking
      const salespeopleRanking = leadsVsConversionsSalesperson.map((v) => ({
        id: v.id,
        name: v.name,
        avatar: v.avatar,
      }));
      const salesDailyBySalesperson =
        await this.calculateSalesDailyBySalesperson(
          salespeopleRanking,
          dataStart,
          dataEnd,
        );

      reportsSalespeople.push({
        salesperson: {
          id: salesperson.id,
          name: salesperson.name || salesperson.user?.name || 'Without name',
          avatar:
            salesperson.user?.photoUrl ?? salesperson.photoUrl ?? undefined,
        },
        period: {
          start: dataStart,
          end: dataEnd,
        },
        totalLeads: totalLeadsSalesperson,
        percentageConversion: percentageConversionSalesperson,
        dealsWellSucceeded: conversionsSalesperson,
        totalSalesGenerated: conversionsSalesperson,
        chartLeadsByChannel: await this.generateChartLeadsByChannel(
          salesperson.id,
          dataStart,
          dataEnd,
        ),
        averageQualification:
          totalLeadsSalesperson > 0
            ? (dealsSalesperson.filter((a) =>
                [
                  STATUS_DEAL.DEAL_INITIAL,
                  STATUS_DEAL.VISIT,
                  STATUS_DEAL.AT_NEGOTIATION,
                  STATUS_DEAL.SUCCESS,
                ].includes(a.status as STATUS_DEAL),
              ).length /
                totalLeadsSalesperson) *
              100
            : 0,
        averageConversion: percentageConversionSalesperson,
        segmentationStatus: this.transformStatusCounts(
          await this.getStatusCountsForEmployee(
            salesperson.id,
            dataStart,
            dataEnd,
          ),
        ),
        segmentationTemperature: this.transformTemperatureCounts(
          await this.getTemperatureCountsForEmployee(
            salesperson.id,
            dataStart,
            dataEnd,
          ),
        ),
        segmentationTemperatureQualification:
          await this.calculateSegmentationTemperatureQualification(
            storeId,
            dataStart,
            dataEnd,
            undefined,
            salesperson.id,
          ),
        rateConversionShowroom: await this.calculateRateShowroom(
          storeId,
          dataStart,
          dataEnd,
          undefined,
          salesperson.id,
        ),
        timeAverageReply: await this.calculateTimeAverageReplyEmployee(
          salesperson.id,
          storeId,
          dataStart,
          dataEnd,
        ),
        failures: dealsSalesperson.filter((a) => a.status === STATUS_DEAL.LOST)
          .length,
        rateFailure:
          totalLeadsSalesperson > 0
            ? (dealsSalesperson.filter((a) => a.status === STATUS_DEAL.LOST)
                .length /
                totalLeadsSalesperson) *
              100
            : 0,
        rateSuccess: percentageConversionSalesperson,
        timeAverageClosing: await this.calculateTimeAverageCompletion(
          storeId,
          dataStart,
          dataEnd,
          salesperson.id,
        ),
        numberConversionOnline: dealsSalesperson.filter(
          (a) =>
            a.status === STATUS_DEAL.SUCCESS &&
            a.dealOrigin !== ORIGIN_DEAL.SHOWROOM,
        ).length,
        numberConversionShowroom: dealsSalesperson.filter(
          (a) =>
            a.status === STATUS_DEAL.SUCCESS &&
            a.dealOrigin === ORIGIN_DEAL.SHOWROOM,
        ).length,
        timeAverageByStageNegotiation:
          await this.calculateTimeAverageByStageNegotiation(
            storeId,
            dataStart,
            dataEnd,
            salesperson.id,
          ),
        reasonsLossesBusiness: await this.calculateReasonsLossesBusiness(
          storeId,
          dataStart,
          dataEnd,
          salesperson.id,
        ),
        leadsVsConversionsSalesperson:
          await this.generateSeriesHistoricalMonthly(
            salesperson.id,
            dataStart,
            dataEnd,
          ),
        rankingMonthly: await this.generateRankingMonthly(
          salesperson.id,
          dataStart,
          dataEnd,
        ),
        salesDailyBySalesperson,
      });
    }

    return reportsSalespeople;
  }

  private async generateChartLeadsByChannelConsolidated(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const deals = await this.prismaService.deal.findMany({
      where: {
        storeId,
        createdAt: {
          gte: dataStart,
          lte: dataEnd,
        },
      },
      select: {
        dealOrigin: true,
        status: true,
      },
    });

    const channelsMap = new Map();

    for (const deal of deals) {
      const channel = deal.dealOrigin;
      if (!channelsMap.has(channel)) {
        channelsMap.set(channel, { leads: 0, qualified: 0 });
      }

      const channelData = channelsMap.get(channel);
      channelData.leads++;

      if (
        [
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.VISIT,
          STATUS_DEAL.AT_NEGOTIATION,
          STATUS_DEAL.SUCCESS,
        ].includes(deal.status as STATUS_DEAL)
      ) {
        channelData.qualified++;
      }
    }

    return Array.from(channelsMap.entries()).map(([channel, data]) => ({
      channel,
      leads: data.leads,
      qualified: data.qualified,
    }));
  }

  private async calculateRankingMonthlyConsolidated(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
  ) {
    // For o relatório consolidated, retornamos um ranking baseado in total of conversões by mês
    const months = [];
    const currentDate = new Date(dataStart);

    while (currentDate <= dataEnd) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const conversionsMonth = await this.prismaService.deal.count({
        where: {
          storeId,
          status: STATUS_DEAL.SUCCESS,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      months.push({
        month: format(currentDate, 'MMM/yyyy', { locale: ptBR }),
        conversions: conversionsMonth,
        position: 1, // For o consolidated, sempre posição 1
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months;
  }

  private async calculateSegmentationTemperatureQualification(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ) {
    // Find deals in período
    const whereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode && mode !== 'total') {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = {
        some: {
          employeeId: employeeId,
        },
      };
    }

    const deals = await this.prismaService.deal.findMany({
      where: whereClause,
      select: {
        id: true,
        temperature: true,
      },
    });

    if (deals.length === 0) {
      return {
        cold: {
          initial: 0,
          final: 0,
          percentageInitial: 0,
          percentageFinal: 0,
        },
        warm: {
          initial: 0,
          final: 0,
          percentageInitial: 0,
          percentageFinal: 0,
        },
        hot: { initial: 0, final: 0, percentageInitial: 0, percentageFinal: 0 },
        total: 0,
      };
    }

    const logsTemperature = await this.prismaService.dealActivityLog.findMany({
      where: {
        dealId: {
          in: deals.map((a) => a.id),
        },
        typeEvent: 'CHANGE_TEMPERATURE',
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const temperaturesByDeal = new Map();

    deals.forEach((deal) => {
      temperaturesByDeal.set(deal.id, {
        initial: deal.temperature,
        final: deal.temperature,
      });
    });

    // Process logs for determinar temperature initial and final
    logsTemperature.forEach((log) => {
      const dealId = log.dealId;

      let dataPrevious = null;
      if (log.dataPrevious) {
        if (typeof log.dataPrevious === 'string') {
          try {
            dataPrevious = JSON.parse(log.dataPrevious);
          } catch (error) {
            console.error('Failed to perform parse of dataPrevious:', error);
            dataPrevious = null;
          }
        } else {
          dataPrevious = log.dataPrevious;
        }
      }

      let dataNew = null;
      if (log.dataNew) {
        if (typeof log.dataNew === 'string') {
          try {
            dataNew = JSON.parse(log.dataNew);
          } catch (error) {
            console.error('Failed to perform parse of dataNew:', error);
            dataNew = null;
          }
        } else {
          dataNew = log.dataNew;
        }
      }

      if (temperaturesByDeal.has(dealId)) {
        const temperatures = temperaturesByDeal.get(dealId);

        // Se é o first log of temperature, usar dataPrevious as initial
        if (dataPrevious && dataPrevious.temperature) {
          temperatures.initial = dataPrevious.temperature;
        }

        // Sempre update a temperature final with a more recent
        if (dataNew && dataNew.temperature) {
          temperatures.final = dataNew.temperature;
        }
      }
    });

    // Count temperatures initial and final
    const counters = {
      cold: { initial: 0, final: 0 },
      warm: { initial: 0, final: 0 },
      hot: { initial: 0, final: 0 },
    };

    temperaturesByDeal.forEach((temperatures) => {
      // Count temperature initial
      if (temperatures.initial === TEMPERATURE_DEAL.COLD) {
        counters.cold.initial++;
      } else if (temperatures.initial === TEMPERATURE_DEAL.WARM) {
        counters.warm.initial++;
      } else if (temperatures.initial === TEMPERATURE_DEAL.HOT) {
        counters.hot.initial++;
      }

      // Count temperature final
      if (temperatures.final === TEMPERATURE_DEAL.COLD) {
        counters.cold.final++;
      } else if (temperatures.final === TEMPERATURE_DEAL.WARM) {
        counters.warm.final++;
      } else if (temperatures.final === TEMPERATURE_DEAL.HOT) {
        counters.hot.final++;
      }
    });

    const total = deals.length;

    return {
      cold: {
        initial: counters.cold.initial,
        final: counters.cold.final,
        percentageInitial:
          total > 0 ? Math.round((counters.cold.initial / total) * 100) : 0,
        percentageFinal:
          total > 0 ? Math.round((counters.cold.final / total) * 100) : 0,
      },
      warm: {
        initial: counters.warm.initial,
        final: counters.warm.final,
        percentageInitial:
          total > 0 ? Math.round((counters.warm.initial / total) * 100) : 0,
        percentageFinal:
          total > 0 ? Math.round((counters.warm.final / total) * 100) : 0,
      },
      hot: {
        initial: counters.hot.initial,
        final: counters.hot.final,
        percentageInitial:
          total > 0 ? Math.round((counters.hot.initial / total) * 100) : 0,
        percentageFinal:
          total > 0 ? Math.round((counters.hot.final / total) * 100) : 0,
      },
      total,
    };
  }

  private async calculateTimeAverageFirstReply(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<string> {
    const whereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    // Find chats através of deals
    const chatsStore = await this.prismaService.chat.findMany({
      where: {
        storeId: storeId,
        deal: whereClause,
      },
      select: {
        id: true,
        deal: {
          select: {
            createdAt: true,
          },
        },
      },
    });

    const chatIds = chatsStore.map((chat) => chat.id);

    if (chatIds.length === 0) {
      return '0 min';
    }

    const firstMessages = await this.prismaService.message.findMany({
      where: {
        chatId: {
          in: chatIds,
        },
        sender: Sender.STORE,
      },
      select: {
        chatId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const timesReply: number[] = [];

    for (const chat of chatsStore) {
      const firstReply = firstMessages.find((m) => m.chatId === chat.id);

      if (firstReply && chat.deal) {
        const timeReply = differenceInMinutes(
          new Date(firstReply.createdAt),
          new Date(chat.deal.createdAt),
        );

        if (timeReply >= 0) {
          timesReply.push(timeReply);
        }
      }
    }

    if (timesReply.length === 0) {
      return '0 min';
    }

    const timeAverage =
      timesReply.reduce((acc, time) => acc + time, 0) / timesReply.length;

    if (timeAverage >= 60) {
      const hours = Math.floor(timeAverage / 60);
      const minutes = Math.round(timeAverage % 60);
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }

    return `${Math.round(timeAverage)} min`;
  }

  private async calculateTimeAverageReplyBetweenMessages(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<string> {
    const whereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
    };

    if (mode) {
      whereClause.dealMode = mode;
    }

    if (employeeId) {
      whereClause.dealAssignee = { some: { employeeId } };
    }

    // Find chats através of deals
    const chatsStore = await this.prismaService.chat.findMany({
      where: {
        storeId: storeId,
        deal: whereClause,
      },
      select: { id: true },
    });

    const chatIds = chatsStore.map((chat) => chat.id);

    if (chatIds.length === 0) {
      return '0 min';
    }

    const messages = await this.prismaService.message.findMany({
      where: {
        chatId: {
          in: chatIds,
        },
        sender: {
          in: [Sender.CUSTOMER, Sender.STORE],
        },
      },
      select: {
        chatId: true,
        sender: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const timesReply: number[] = [];

    // Agrupar messages by chat
    const messagesByChat = messages.reduce(
      (acc, msg) => {
        if (!acc[msg.chatId]) {
          acc[msg.chatId] = [];
        }
        acc[msg.chatId].push(msg);
        return acc;
      },
      {} as Record<string, typeof messages>,
    );

    for (const chatId in messagesByChat) {
      const messagesOfChat = messagesByChat[chatId];

      for (let i = 0; i < messagesOfChat.length - 1; i++) {
        const messageCurrent = messagesOfChat[i];
        const nextMessage = messagesOfChat[i + 1];

        // Verifica se a message current é of customer and a próxima é of store
        if (
          messageCurrent.sender === Sender.CUSTOMER &&
          nextMessage.sender === Sender.STORE
        ) {
          const timeReply = differenceInMinutes(
            new Date(nextMessage.createdAt),
            new Date(messageCurrent.createdAt),
          );

          if (timeReply >= 0) {
            timesReply.push(timeReply);
          }
        }
      }
    }

    if (timesReply.length === 0) {
      return '0 min';
    }

    const timeAverage =
      timesReply.reduce((acc, time) => acc + time, 0) / timesReply.length;

    if (timeAverage >= 60) {
      const hours = Math.floor(timeAverage / 60);
      const minutes = Math.round(timeAverage % 60);
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }

    return `${Math.round(timeAverage)} min`;
  }

  private transformStatusCounts(statusCounts: any[]): {
    initial: number;
    atVisit: number;
    recovery: number;
    negotiation: number;
    total: number;
  } {
    const result = {
      initial: 0,
      atVisit: 0,
      recovery: 0,
      negotiation: 0,
      total: 0,
    };

    statusCounts.forEach((item) => {
      const count = item._count;
      result.total += count;

      switch (item.status) {
        case STATUS_DEAL.DEAL_INITIAL:
          result.initial += count;
          break;
        case STATUS_DEAL.VISIT:
          result.atVisit += count;
          break;
        case STATUS_DEAL.RECOVERY:
          result.recovery += count;
          break;
        case STATUS_DEAL.AT_NEGOTIATION:
          result.negotiation += count;
          break;
      }
    });

    return result;
  }

  private transformTemperatureCounts(temperatureCounts: any[]): {
    cold: number;
    warm: number;
    hot: number;
  } {
    const result = {
      cold: 0,
      warm: 0,
      hot: 0,
    };

    temperatureCounts.forEach((item) => {
      const count = item._count;

      switch (item.temperature) {
        case TEMPERATURE_DEAL.COLD:
          result.cold += count;
          break;
        case TEMPERATURE_DEAL.WARM:
          result.warm += count;
          break;
        case TEMPERATURE_DEAL.HOT:
          result.hot += count;
          break;
      }
    });

    return result;
  }

  private async calculateSalesDailyBySalesperson(
    salespeople: Array<{ id: string; name: string; avatar?: string }>,
    dataStart: Date,
    dataEnd: Date,
  ) {
    const salesDaily = await Promise.all(
      salespeople.map(async (salesperson) => {
        // Find sales of success for este salesperson através of tabela of responsáveis
        const sales = await this.prismaService.deal.findMany({
          where: {
            status: STATUS_DEAL.SUCCESS,
            createdAt: {
              gte: dataStart,
              lte: dataEnd,
            },
            dealAssignee: {
              some: {
                employeeId: salesperson.id,
              },
            },
          },
          select: {
            createdAt: true,
          },
        });

        // Agrupar sales by data
        const salesByData = new Map<string, number>();

        // Inicializar all as dates of período with 0 sales
        const currentDate = new Date(dataStart);
        while (currentDate <= dataEnd) {
          const dataFormatted = format(currentDate, 'yyyy-MM-dd');
          salesByData.set(dataFormatted, 0);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count sales by data
        sales.forEach((sell) => {
          const dataFormatted = format(new Date(sell.createdAt), 'yyyy-MM-dd');
          const count = salesByData.get(dataFormatted) || 0;
          salesByData.set(dataFormatted, count + 1);
        });

        // Converter for array ordenado
        const seriesSales = Array.from(salesByData.entries())
          .map(([data, sales]) => ({ data, sales }))
          .sort((a, b) => a.data.localeCompare(b.data));

        return {
          id: salesperson.id,
          name: salesperson.name,
          avatar: salesperson.avatar,
          seriesSales,
        };
      }),
    );

    return salesDaily;
  }

  async getTop3SalespeopleWithUserLoggedIn(
    storeId: string,
    filter: FilterTop3SalespeopleDto,
  ): Promise<Top3SalespeopleDto> {
    const { month, year } = filter;

    // Create dates of início and end of mês selected
    const dataStart = startOfMonth(new Date(year, month - 1));
    const dataEnd = endOfMonth(new Date(year, month - 1));

    // Find all os salespeople of store
    const salespeople = await this.prismaService.employee.findMany({
      where: {
        storeId,
        status: 'active',
        roles: {
          some: {
            role: {
              in: ['Salesperson'],
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
      },
    });

    const salespeopleFormatted = salespeople.map((v) => ({
      id: v.id,
      name: v.name,
      avatar: v.photoUrl ?? undefined,
    }));

    // Calculate sales diárias for all os salespeople
    const salesDaily = await this.calculateSalesDailyBySalesperson(
      salespeopleFormatted,
      dataStart,
      dataEnd,
    );

    // Calculate total of sales by salesperson
    const salespeopleWithTotal = salesDaily.map((salesperson) => {
      const totalSales = salesperson.seriesSales.reduce(
        (sum, item) => sum + item.sales,
        0,
      );

      return {
        id: salesperson.id,
        name: salesperson.name,
        avatar: salesperson.avatar,
        totalSales,
        positionRanking: 0, // Será definido após ordenação
        seriesSales: salesperson.seriesSales,
      };
    });

    // Sort by total of sales and get top 3
    const top3Salespeople = salespeopleWithTotal
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 3)
      .map((salesperson, index) => ({
        ...salesperson,
        positionRanking: index + 1,
      }));

    // Find data of usuário loggedIn for mês current and previous
    const userLoggedIn = await this.getDataUserLoggedIn(
      storeId,
      filter.idUserLoggedIn,
      year,
      month,
    );

    return {
      period: {
        month: filter.month,
        year: filter.year,
      },
      top3Salespeople,
      userLoggedIn,
    };
  }

  private async getDataUserLoggedIn(
    storeId: string,
    idUserLoggedIn: string,
    year: number,
    month: number,
  ): Promise<UserLoggedInSalesDto> {
    // Create dates for mês current
    const dataStartCurrent = new Date(year, month - 1, 1);
    const dataEndCurrent = endOfMonth(dataStartCurrent);

    // Create dates for mês previous
    const monthPrevious = subMonths(dataStartCurrent, 1);
    const dataStartPrevious = startOfMonth(monthPrevious);
    const dataEndPrevious = endOfMonth(monthPrevious);

    // Find employee of usuário loggedIn
    const employee = await this.prismaService.employee.findFirst({
      where: {
        storeId,
        userId: idUserLoggedIn,
      },
      include: {
        user: {
          select: {
            photoUrl: true,
          },
        },
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const user = {
      id: employee.id,
      name: employee.name,
      avatar: employee.user?.photoUrl || undefined,
    };

    // Calculate sales of mês current
    const salesMonthCurrent = await this.calculateSalesDailyBySalesperson(
      [user],
      dataStartCurrent,
      dataEndCurrent,
    );

    // Calculate sales of mês previous
    const salesMonthPrevious = await this.calculateSalesDailyBySalesperson(
      [user],
      dataStartPrevious,
      dataEndPrevious,
    );

    // Find all os salespeople for calculate ranking
    const allSalespeople = await this.prismaService.employee.findMany({
      where: {
        storeId,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
      },
    });

    // Calculate ranking of mês current
    const salesAllSalespeopleCurrent =
      await this.calculateSalesDailyBySalesperson(
        allSalespeople.map((v) => ({
          id: v.id,
          name: v.name,
          avatar: v.photoUrl,
        })),
        dataStartCurrent,
        dataEndCurrent,
      );

    const rankingCurrent = salesAllSalespeopleCurrent
      .map((v) => ({
        id: v.id,
        totalSales: v.seriesSales.reduce((total, day) => total + day.sales, 0),
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    const positionCurrent =
      rankingCurrent.findIndex((v) => v.id === employee.id) + 1;

    // Calculate ranking of mês previous
    const salesAllSalespeoplePrevious =
      await this.calculateSalesDailyBySalesperson(
        allSalespeople.map((v) => ({
          id: v.id,
          name: v.name,
          avatar: v.photoUrl,
        })),
        dataStartPrevious,
        dataEndPrevious,
      );

    const rankingPrevious = salesAllSalespeoplePrevious
      .map((v) => ({
        id: v.id,
        totalSales: v.seriesSales.reduce((total, day) => total + day.sales, 0),
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    const positionPrevious =
      rankingPrevious.findIndex((v) => v.id === employee.id) + 1;

    const totalMonthCurrent =
      salesMonthCurrent[0]?.seriesSales.reduce(
        (sum, item) => sum + item.sales,
        0,
      ) || 0;
    const totalMonthPrevious =
      salesMonthPrevious[0]?.seriesSales.reduce(
        (sum, item) => sum + item.sales,
        0,
      ) || 0;

    return {
      id: employee.id,
      name: employee.name,
      avatar: employee.user?.photoUrl || undefined,
      monthCurrent: {
        totalSales: totalMonthCurrent,
        positionRanking: positionCurrent,
        seriesSales: salesMonthCurrent[0]?.seriesSales || [],
      },
      monthPrevious: {
        totalSales: totalMonthPrevious,
        positionRanking: positionPrevious,
        seriesSales: salesMonthPrevious[0]?.seriesSales || [],
      },
    };
  }

  private async calculateReasonsLossesPreDeal(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    employeeId?: string,
    mode?: string,
  ): Promise<
    {
      reason: string;
      percentage: number;
      total: number;
      subReasons?: Array<{
        subReason: string;
        limit: number;
        percentage: number;
      }>;
    }[]
  > {
    // Find deals que passaram only by PRE_DEAL and foram direct for LOST
    const whereClause: any = {
      storeId,
      status: STATUS_DEAL.LOST,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
      ...(mode && mode !== 'total' && { dealMode: mode }),
    };

    if (employeeId) {
      whereClause.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    // Find deals lost
    const dealsLost = await this.prismaService.deal.findMany({
      where: whereClause,
      include: {
        dealActivityLogs: {
          where: {
            typeEvent: 'STATUS_CHANGED',
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        dealComment: {
          where: {
            lostReason: {
              not: null,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Filter only deals que passaram direct of PRE_DEAL for LOST
    const dealsPreDealLost = dealsLost.filter((deal) => {
      const logs = deal.dealActivityLogs;

      // Se não há logs of mudança of status, assumir que was direct
      if (logs.length === 0) {
        return true;
      }

      // Check se passou only by PRE_DEAL before of ir for LOST
      const statusHistory = logs
        .map((log) => {
          const dataNew = log.dataNew as any;
          return dataNew?.status;
        })
        .filter((status) => status);

      // Se só has LOST in histórico or se o first status diferente of PRE_DEAL é LOST
      const statusDifferentOfPreDeal = statusHistory.filter(
        (status) => status !== STATUS_DEAL.PRE_DEAL,
      );

      return (
        statusDifferentOfPreDeal.length === 0 ||
        (statusDifferentOfPreDeal.length === 1 &&
          statusDifferentOfPreDeal[0] === STATUS_DEAL.LOST)
      );
    });

    // Coletar reasons of loss of comentários
    const reasonsMap = new Map<
      string,
      { total: number; subReasons: Map<string, number> }
    >();

    dealsPreDealLost.forEach((deal) => {
      const commentWithReason = deal.dealComment[0]; // Get o more recent

      if (commentWithReason?.lostReason) {
        const reason = commentWithReason.lostReason;
        const subReason = commentWithReason.subLostReason;

        if (!reasonsMap.has(reason)) {
          reasonsMap.set(reason, { total: 0, subReasons: new Map() });
        }

        const reasonData = reasonsMap.get(reason)!;
        reasonData.total += 1;

        if (subReason) {
          const subReasonCount = reasonData.subReasons.get(subReason) || 0;
          reasonData.subReasons.set(subReason, subReasonCount + 1);
        }
      }
    });

    const totalDealsWithReason = Array.from(reasonsMap.values()).reduce(
      (sum, reason) => sum + reason.total,
      0,
    );

    // Converter for o formato expected
    const result = Array.from(reasonsMap.entries()).map(([reason, data]) => {
      const percentage =
        totalDealsWithReason > 0
          ? (data.total / totalDealsWithReason) * 100
          : 0;

      const subReasons = Array.from(data.subReasons.entries()).map(
        ([subReason, limit]) => ({
          subReason,
          limit,
          percentage: data.total > 0 ? (limit / data.total) * 100 : 0,
        }),
      );

      return {
        reason,
        percentage: Math.round(percentage * 100) / 100,
        total: data.total,
        subReasons: subReasons.length > 0 ? subReasons : undefined,
      };
    });

    // Sort by total (greater for smaller)
    return result.sort((a, b) => b.total - a.total);
  }

  private async calculateTotalDealsShowroomByMode(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: MODE_DEAL | 'total',
    employeeId?: string,
  ): Promise<number> {
    const baseWhereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
      dealOrigin: ORIGIN_DEAL.SHOWROOM,
      status: {
        in: [
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.VISIT,
          STATUS_DEAL.AT_NEGOTIATION,
          STATUS_DEAL.SUCCESS,
        ],
      },
    };

    if (mode && mode !== 'total') {
      baseWhereClause.dealMode = mode;
    }

    if (employeeId) {
      baseWhereClause.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    return await this.prismaService.deal.count({
      where: baseWhereClause,
    });
  }

  private async calculateTotalDealsOnlineByMode(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const baseWhereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
      dealOrigin: {
        not: ORIGIN_DEAL.SHOWROOM,
      },
      status: {
        in: [
          STATUS_DEAL.DEAL_INITIAL,
          STATUS_DEAL.VISIT,
          STATUS_DEAL.AT_NEGOTIATION,
          STATUS_DEAL.SUCCESS,
        ],
      },
    };

    if (mode && mode !== 'total') {
      baseWhereClause.dealMode = mode;
    }

    if (employeeId) {
      baseWhereClause.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    return await this.prismaService.deal.count({
      where: baseWhereClause,
    });
  }

  private async calculateRateConversionOnlineByMode(
    storeId: string,
    dataStart: Date,
    dataEnd: Date,
    mode?: string,
    employeeId?: string,
  ): Promise<number> {
    const totalOnline = await this.calculateTotalDealsOnlineByMode(
      storeId,
      dataStart,
      dataEnd,
      mode,
      employeeId,
    );

    if (totalOnline === 0) {
      return 0;
    }

    // Calculate conversões online (deals with status SUCCESS)
    const baseWhereClause: any = {
      storeId,
      createdAt: {
        gte: dataStart,
        lte: dataEnd,
      },
      dealOrigin: {
        not: ORIGIN_DEAL.SHOWROOM,
      },
      status: STATUS_DEAL.SUCCESS,
    };

    if (mode && mode !== 'total') {
      baseWhereClause.dealMode = mode;
    }

    if (employeeId) {
      baseWhereClause.dealAssignee = {
        some: {
          employeeId,
        },
      };
    }

    const conversionsOnline = await this.prismaService.deal.count({
      where: baseWhereClause,
    });

    // Calculate rate of conversão (conversões / total) * 100
    const rateConversion = (conversionsOnline / totalOnline) * 100;
    return parseFloat(rateConversion.toFixed(2));
  }
}
