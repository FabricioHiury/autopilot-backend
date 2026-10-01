import { IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ORIGIN_DEAL, MODE_DEAL } from 'src/utils/enum/deal.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilterReportDto {
  @ApiProperty({
    type: String,
    format: 'date',
    description: 'Data initial in format YYYY-MM-DD',
  })
  @IsDateString()
  dataStart: string;

  @ApiProperty({
    type: String,
    format: 'date',
    description: 'Data final in format YYYY-MM-DD',
  })
  @IsDateString()
  dataEnd: string;

  @ApiPropertyOptional({
    type: String,
    description: 'ID of employee for filter',
  })
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({
    enum: ORIGIN_DEAL,
    description: 'Filtra by channel/origin of deal',
  })
  @IsOptional()
  @IsEnum(ORIGIN_DEAL)
  channel?: ORIGIN_DEAL;

  @ApiPropertyOptional({
    enum: MODE_DEAL,
    description: 'Filtra by mode of deal',
  })
  @IsOptional()
  @IsEnum(MODE_DEAL)
  dealMode?: MODE_DEAL;
}

export class ReportSalespersonDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  dataStart: Date;

  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  atDeal: number;

  @ApiProperty()
  atRecovery: number;

  @ApiProperty()
  converted: number;

  @ApiProperty({ description: 'Rate of conversion at %' })
  rateConversion: number;

  @ApiProperty({
    type: 'object',
    description: 'Segmentation of leads by temperature',
  })
  segmentationTemperature: {
    cold: number;
    warm: number;
    hot: number;
    total: number;
  };

  @ApiProperty({
    type: 'object',
    description: 'Segmentation of temperature initial/final for qualification',
  })
  segmentationTemperatureQualification: {
    cold: {
      initial: number;
      final: number;
      percentageInitial: number;
      percentageFinal: number;
    };
    warm: {
      initial: number;
      final: number;
      percentageInitial: number;
      percentageFinal: number;
    };
    hot: {
      initial: number;
      final: number;
      percentageInitial: number;
      percentageFinal: number;
    };
    total: number;
  };

  @ApiProperty()
  dealsWellSucceeded: number;

  @ApiProperty({ description: 'Rate of success at %' })
  rateSuccess: number;

  @ApiProperty()
  dealsNotCompleted: number;

  @ApiProperty({ description: 'Rate of failure at %' })
  rateFailure: number;

  @ApiProperty({ description: 'Average of leads qualified at %' })
  averageQualification: number;

  @ApiProperty({ description: 'Average of conversion at %' })
  averageConversion: number;

  @ApiProperty({
    type: [Object],
    description: 'Series historical by month',
  })
  seriesHistorical: {
    month: string;
    leads: number;
    conversions: number;
  }[];

  @ApiProperty()
  failures: number;

  @ApiProperty({ description: 'Time average of reply, example: "3h 20min"' })
  timeAverageReply: string;

  @ApiProperty({
    description: 'Time average of completion, example: "2h 15min"',
  })
  timeAverageCompletion: string;

  @ApiProperty({
    type: Object,
    description: 'Conversion by temperature',
  })
  conversionByTemperature: {
    cold: { total: number; conversions: number; rate: number };
    warm: { total: number; conversions: number; rate: number };
    hot: { total: number; conversions: number; rate: number };
  };

  @ApiProperty({
    type: Object,
    description: 'Time average by stage of deal',
  })
  timeAverageByStage: {
    'Pre-deal': string;
    'Deal Initial': string;
    Visit: string;
    'At Negotiation': string;
    Recovery: string;
  };

  @ApiProperty({
    type: Object,
    description: 'Reasons of losses and business with values and porcentagens',
  })
  reasonsLossesBusiness: {
    priceHigh: { value: number; percentage: number };
    competition: { value: number; percentage: number };
    notQualified: { value: number; percentage: number };
    timing: { value: number; percentage: number };
    other: { value: number; percentage: number };
    totalLosses: number;
    primaryReason: string;
    rateLoss: number;
    subReasonsByReason: Record<
      string,
      Array<{ subReason: string; limit: number; percentage: number }>
    >;
    subReasonsDetailed: Array<{
      reasonPrimary: string;
      subReason: string;
      limit: number;
      percentage: number;
    }>;
  };

  @ApiProperty({ description: 'Percentage of conversion at %' })
  percentageConversion: number;

  @ApiProperty()
  rateConversionShowroom: number;

  @ApiProperty()
  numberConversionOnline: number;

  @ApiProperty()
  numberConversionShowroom: number;

  @ApiProperty({
    type: [Object],
    description:
      'Leads vs conversions at sales of all the salespeople of store in period selected',
  })
  leadsVsConversionsSalesperson: {
    id: string;
    name: string;
    avatar?: string;
    leads: number;
    conversions: number;
  }[];
}

export class RankingSalespersonDto {
  @ApiProperty({
    type: [Object],
    description: 'Top salespeople by rate of conversion',
  })
  topConversion: {
    id: string;
    name: string;
    rateConversion: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Top salespeople by average of qualification',
  })
  topQualification: {
    id: string;
    name: string;
    averageQualification: number;
  }[];
}

export class ReportChannelDto {
  @ApiProperty()
  channel: string;

  @ApiProperty()
  nameDisplay: string;

  @ApiPropertyOptional()
  iconUrl?: string;

  @ApiPropertyOptional()
  url?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  dataRegistration?: Date;

  @ApiProperty()
  leadsTotal: number;

  @ApiProperty()
  conversions: number;

  @ApiProperty({ description: 'Rate of conversion at %' })
  rateConversion: number;

  @ApiProperty({
    type: [Object],
    description: 'Summary daily of leads and conversions',
  })
  summaryDay: {
    data: string;
    leads: number;
    conversions: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Series historical monthly',
  })
  seriesHistorical: {
    month: string;
    leads: number;
    qualifications: number;
    conversions: number;
  }[];
}

export class ReportChannelsDto extends Array<{
  mode: string;
  channels: ReportChannelDto[];
  totalLeads: number;
  totalConversions: number;
  averageConversionGeneral: number;
  highlights: {
    byLeads: {
      channel: string;
      nameDisplay: string;
      value: number;
      growth: number;
    }[];
    byConversations: {
      channel: string;
      nameDisplay: string;
      value: number;
      growth: number;
    }[];
  };
  ranking: {
    byLeads: {
      channel: string;
      nameDisplay: string;
      value: number;
      position: number;
    }[];
    byConversions: {
      channel: string;
      nameDisplay: string;
      value: number;
      position: number;
    }[];
  };
}> {}

export class ReportDetailedSalespersonDto {
  @ApiProperty({ type: Object })
  salesperson: {
    id: string;
    name: string;
    avatar?: string;
  };

  @ApiPropertyOptional({
    type: [Object],
    description:
      'List of salespeople that contributed for the metrics (only in report consolidated)',
  })
  salespeopleContributors?: {
    id: string;
    name: string;
    avatar?: string;
  }[];

  @ApiProperty({ type: Object })
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  totalLeads: number;

  @ApiProperty({ description: 'Percentage of conversion at %' })
  percentageConversion: number;

  @ApiProperty()
  dealsWellSucceeded: number;

  @ApiProperty()
  totalSalesGenerated: number;

  @ApiProperty({
    type: [Object],
    description: 'Chart of leads of salesperson by channel',
  })
  chartLeadsByChannel: {
    channel: string;
    leads: number;
    qualified: number;
  }[];

  @ApiProperty()
  averageQualification: number;

  @ApiProperty()
  averageConversion: number;

  @ApiProperty({ type: Object })
  segmentationStatus: {
    initial: number;
    atVisit: number;
    recovery: number;
    negotiation: number;
    total: number;
  };

  @ApiProperty({ type: Object })
  segmentationTemperature: {
    cold: number;
    warm: number;
    hot: number;
  };

  @ApiProperty({
    type: 'object',
    description: 'Segmentation of temperature initial/final for qualification',
  })
  segmentationTemperatureQualification: {
    cold: {
      initial: number;
      final: number;
      percentageInitial: number;
      percentageFinal: number;
    };
    warm: {
      initial: number;
      final: number;
      percentageInitial: number;
      percentageFinal: number;
    };
    hot: {
      initial: number;
      final: number;
      percentageInitial: number;
      percentageFinal: number;
    };
    total: number;
  };

  @ApiProperty()
  rateConversionShowroom: number;

  @ApiProperty({ description: 'Time average of reply, example: "3h 20min"' })
  timeAverageReply: string;

  @ApiProperty()
  failures: number;

  @ApiProperty({ description: 'Rate of failure at %' })
  rateFailure: number;

  @ApiProperty({ description: 'Rate of success at %' })
  rateSuccess: number;

  @ApiProperty({
    description: 'Time average until o closing, example: "2h 15min"',
  })
  timeAverageClosing: string;

  @ApiProperty()
  numberConversionOnline: number;

  @ApiProperty()
  numberConversionShowroom: number;

  @ApiProperty({
    type: Object,
    description: 'Time average by stage of negotiation',
  })
  timeAverageByStageNegotiation: {
    'Pre-deal': string;
    'Deal Initial': string;
    Visit: string;
    'At Negotiation': string;
    Recovery: string;
    stageMoreQuick: string;
    stageMoreSlow: string;
  };

  @ApiProperty({
    type: Object,
    description: 'Reasons of losses and business with values and porcentagens',
  })
  reasonsLossesBusiness: {
    priceHigh: { value: number; percentage: number };
    competition: { value: number; percentage: number };
    notQualified: { value: number; percentage: number };
    timing: { value: number; percentage: number };
    other: { value: number; percentage: number };
    totalLosses: number;
    primaryReason: string;
    rateLoss: number;
    subReasonsByReason: Record<
      string,
      Array<{ subReason: string; limit: number; percentage: number }>
    >;
    subReasonsDetailed: Array<{
      reasonPrimary: string;
      subReason: string;
      limit: number;
      percentage: number;
    }>;
  };

  @ApiProperty({
    type: [Object],
    description:
      'Leads vs conversions at sales of all the salespeople of store in period selected',
  })
  leadsVsConversionsSalesperson: {
    id: string;
    name: string;
    avatar?: string;
    leads: number;
    conversions: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'Ranking of salesperson each month',
  })
  rankingMonthly: {
    month: string;
    conversions: number;
    position: number;
  }[];

  @ApiProperty({
    type: [Object],
    description:
      'Sales daily by salesperson of ranking (top 3 + user loggedIn)',
  })
  salesDailyBySalesperson: {
    id: string;
    name: string;
    avatar?: string;
    seriesSales: {
      data: string;
      sales: number;
    }[];
  }[];
}

export class ReportGeneralDto {
  @ApiProperty({ type: Object })
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty({
    type: [Object],
    description: 'Ranking of channels by index of qualification',
  })
  rankingChannels: {
    channel: string;
    indexQualification: number;
  }[];

  @ApiProperty({
    type: [Object],
    description: 'View of indicators of pre-sell',
  })
  viewPreSell: {
    id: string;
    salesperson: string;
    avatar?: string;
    timeInPlatform: string;
    leadsReceived: number;
    atDeal: number;
    qualified: number;
    rateQualification: number;
    leadsRecovered: number;
    leadsConverted: number;
    averageConversion: number;
  }[];

  @ApiProperty({
    type: RankingSalespersonDto,
    description: 'Ranking of salespeople by conversion and qualification',
  })
  rankingSalespeople: RankingSalespersonDto;

  @ApiProperty({
    description: 'Time average of reply general, example: "3h 20min"',
  })
  timeAverageReplyGeneral: string;

  @ApiProperty({
    description: 'Time average of completion general, example: "2h 15min"',
  })
  timeAverageCompletionGeneral: string;

  @ApiProperty({
    type: Object,
    description: 'Conversion by temperature general',
  })
  conversionByTemperatureGeneral: {
    cold: { total: number; conversions: number; rate: number };
    warm: { total: number; conversions: number; rate: number };
    hot: { total: number; conversions: number; rate: number };
  };

  @ApiProperty({
    type: [Object],
    description: 'Metrics of visits by pre-salespeople',
  })
  metricsVisitsPreSalespeople: {
    salesperson: string;
    visitsScheduled: number;
    visitsCompleted: number;
    visitsConverted: number;
    rateConversionVisits: number;
  }[];

  @ApiProperty({
    type: Object,
    description: 'Metrics general of visits aggregated',
  })
  metricsVisitsGeneral: {
    totalVisitsScheduled: number;
    visitsWellSucceeded: number;
    rateSuccessVisits: number;
  };

  @ApiProperty({
    type: Object,
    description: 'Time average by stage of negotiation general',
  })
  timeAverageByStageNegotiationGeneral: {
    'Pre-deal': string;
    'Deal Initial': string;
    Visit: string;
    'At Negotiation': string;
    Recovery: string;
    stageMoreQuick: string;
    stageMoreSlow: string;
  };

  @ApiProperty({
    type: [Object],
    description: 'Report detailed by mode of deal, including totals general',
  })
  reportByMode: {
    mode: string;
    totalDeals: number;
    dealsWellSucceeded: number;
    failures: number;
    rateSuccess: number;
    rateFailure: number;
    averageConversion: number;
    averageQualification: number;
    limitSuccess: number;
    rateRecovery: number;
    limitConversion: number;
    limitQualification: number;
    rateConversionLeads: number;
    limitConversionLeads: number;
    limitShowroom: number;
    limitShowroomSuccess: number;
    rateShowroom: number;
    timeAverageReplyPreSalesperson: {
      month: string;
      timeAverage: string;
    }[];
    timeAverageReplySalesperson: {
      month: string;
      timeAverage: string;
    }[];
    appointmentsVisits: number;
    rateAttendanceVisits: number;
    visitsAttended: number;
    reasonsLoss: {
      reason: string;
      percentage: number;
      total: number;
      subReasons?: Array<{
        subReason: string;
        limit: number;
        percentage: number;
      }>;
    }[];
    reasonsLossesPreDeal: {
      reason: string;
      percentage: number;
      total: number;
      subReasons?: Array<{
        subReason: string;
        limit: number;
        percentage: number;
      }>;
    }[];
    segmentationStatus: {
      initial: number;
      atVisit: number;
      recovery: number;
      negotiation: number;
      total: number;
    };
    segmentationTemperature: {
      cold: { value: number; percentage: number };
      warm: { value: number; percentage: number };
      hot: { value: number; percentage: number };
    };
    timeAverageReply?: string;
    timeAverageCompletion?: string;
    conversionByTemperature?: {
      cold: { total: number; conversions: number; rate: number };
      warm: { total: number; conversions: number; rate: number };
      hot: { total: number; conversions: number; rate: number };
    };
    dealsPreDealWithoutFollowUp?: {
      id: string;
      nameDeal: string;
      period: string;
      status: string;
      employee?: string;
      daysWithoutFollowUp: number;
    }[];
    dealsSalesWithoutFollowUp?: {
      id: string;
      nameDeal: string;
      period: string;
      status: string;
      employee?: string;
      daysWithoutFollowUp: number;
    }[];
  }[];

  @ApiProperty({
    type: [Object],
    description: 'List of 8 deals at PRE_DEAL for more time without follow-up',
  })
  dealsPreDeal: {
    id: string;
    nameDeal: string;
    period: string;
    status: string;
    employee?: string;
    daysWithoutFollowUp: number;
  }[];

  @ApiProperty({
    type: [Object],
    description:
      'List of 8 deals at sales (DEAL_INITIAL, VISIT, AT_NEGOTIATION) for more time without follow-up',
  })
  dealsSales: {
    id: string;
    nameDeal: string;
    period: string;
    status: string;
    employee?: string;
    daysWithoutFollowUp: number;
  }[];

  @ApiProperty({
    type: [Object],
    description:
      'Main reasons of loss of deals that passed only by PRE_DEAL and were direct for LOST',
  })
  reasonsLossesPreDeal: {
    reason: string;
    percentage: number;
    total: number;
    subReasons?: Array<{
      subReason: string;
      limit: number;
      percentage: number;
    }>;
  }[];
}

export class FilterTop3SalespeopleDto {
  @ApiProperty({
    type: Number,
    description: 'Month (1-12)',
    minimum: 1,
    maximum: 12,
  })
  month: number;

  @ApiProperty({
    type: Number,
    description: 'Year (ex: 2024)',
  })
  year: number;

  @ApiProperty({
    type: String,
    description: 'ID of user loggedIn for include in data',
  })
  idUserLoggedIn: string;
}

export class SalespersonSalesDailyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty()
  totalSales: number;

  @ApiProperty()
  positionRanking: number;

  @ApiProperty({
    type: [Object],
    description: 'Series of sales daily of month',
  })
  seriesSales: {
    data: string;
    sales: number;
  }[];
}

export class UserLoggedInSalesDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiProperty({
    type: Object,
    description: 'Data of month current',
  })
  monthCurrent: {
    totalSales: number;
    positionRanking: number;
    seriesSales: {
      data: string;
      sales: number;
    }[];
  };

  @ApiProperty({
    type: Object,
    description: 'Data of month previous',
  })
  monthPrevious: {
    totalSales: number;
    positionRanking: number;
    seriesSales: {
      data: string;
      sales: number;
    }[];
  };
}

export class Top3SalespeopleDto {
  @ApiProperty({
    type: Object,
    description: 'Period analyzed',
  })
  period: {
    month: number;
    year: number;
  };

  @ApiProperty({
    type: [SalespersonSalesDailyDto],
    description: 'Top 3 salespeople of month',
  })
  top3Salespeople: SalespersonSalesDailyDto[];

  @ApiProperty({
    type: UserLoggedInSalesDto,
    description: 'Data of user loggedIn (month current and previous)',
  })
  userLoggedIn: UserLoggedInSalesDto;
}

export class ReportSalespeopleByModeDto {
  @ApiProperty()
  mode: string;

  @ApiProperty({
    type: [ReportSalespersonDto],
    description: 'List of salespeople for the mode',
  })
  salespeople: ReportSalespersonDto[];

  @ApiProperty()
  totalLeads: number;

  @ApiProperty()
  totalConversions: number;

  @ApiProperty({ description: 'Average of conversion general at %' })
  averageConversionGeneral: number;

  @ApiProperty({ description: 'Percentage of conversion at %' })
  percentageConversion: number;

  @ApiProperty()
  numberConversionOnline: number;

  @ApiProperty()
  numberConversionShowroom: number;

  @ApiProperty()
  rateConversionShowroom: number;

  @ApiProperty()
  totalShowroom: number;

  @ApiProperty()
  totalOnline: number;

  @ApiProperty({ description: 'Rate of conversion online at %' })
  rateConversionOnline: number;
}
