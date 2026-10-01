import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FILTER_DATA } from 'src/core/store/enum/filter-data.enum';
import { GetOriginDealsSuccess } from './endpoints/get-origin-deals.swagger';
import { GetReportWeeklyOutput } from './endpoints/get-report-weekly.swagger';
import { GetLastDealsSuccess } from './endpoints/get-last-deals.swagger';

export function GetReportWeeklyDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get report weekly',
      description:
        'Get data semanais of deals and new salespeople (part of dashboard)',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: GetReportWeeklyOutput,
    }),
  );
}

export function GetLastDealsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get latest deals of store',
      description: 'List of deals at order descresente of data',
    }),
    ApiQuery({
      name: 'mode',
      required: false,
      enum: ['BUY', 'SELL'],
      description: 'Mode of deal',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: GetLastDealsSuccess,
      description: 'Success',
    }),
  );
}

export function GetOriginDealsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get chart of origin of deals of store',
      description:
        'Grouping default: monthly\n\nInterval of dates default: start of month / end of month for grouping daily and weekly; start of year / end of year for the other types of grouping',
    }),
    ApiQuery({
      name: 'grouping',
      required: false,
      enum: [...Object.values(FILTER_DATA)],
    }),
    ApiQuery({
      name: 'dataStart',
      required: false,
    }),
    ApiQuery({
      name: 'dataEnd',
      required: false,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetOriginDealsSuccess,
      description: 'Success',
    }),
  );
}
