import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsDealsService } from './reports-deals.service';
import {
  FilterReportDto,
  ReportSalespersonDto,
  ReportChannelsDto,
  ReportDetailedSalespersonDto,
  ReportGeneralDto,
  RankingSalespersonDto,
  Top3SalespeopleDto,
  FilterTop3SalespeopleDto,
} from './dto/report-deals.dto';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';

@ApiTags('Reports - Deals')
@Controller('store/:storeId/reports/deals')
@UseGuards(JwtAuthGuard)
export class ReportsDealsController {
  constructor(private readonly reportsService: ReportsDealsService) {}

  @ApiOperation({ summary: 'Report by salesperson' })
  @ApiResponse({
    status: 200,
    description: 'Report generated with success',
    type: [ReportSalespersonDto],
  })
  @ApiParam({ name: 'storeId', description: 'ID of store' })
  @Get('salesperson')
  async reportBySalesperson(
    @Param('storeId') storeId: string,
    @Query() filter: FilterReportDto,
  ): Promise<ReportSalespersonDto[]> {
    return this.reportsService.generateReportBySalesperson(storeId, filter);
  }

  @ApiOperation({ summary: 'Ranking of salespeople' })
  @ApiResponse({
    status: 200,
    description: 'Ranking generated with success',
    type: RankingSalespersonDto,
  })
  @ApiParam({ name: 'storeId', description: 'ID of store' })
  @Get('salesperson/ranking')
  async rankingSalespeople(
    @Param('storeId') storeId: string,
    @Query() filter: FilterReportDto,
  ): Promise<RankingSalespersonDto> {
    return this.reportsService.generateRankingSalespeople(storeId, filter);
  }

  @ApiOperation({ summary: 'Report by channel' })
  @ApiResponse({
    status: 200,
    description: 'Report generated with success',
    type: ReportChannelsDto,
  })
  @ApiParam({ name: 'storeId', description: 'ID of store' })
  @Get('channel')
  async reportByChannel(
    @Param('storeId') storeId: string,
    @Query() filter: FilterReportDto,
  ): Promise<ReportChannelsDto> {
    return this.reportsService.generateReportByChannel(storeId, filter);
  }

  @ApiOperation({ summary: 'Report detailed by salesperson' })
  @ApiResponse({
    status: 200,
    description: 'Report generated with success',
    type: ReportDetailedSalespersonDto,
  })
  @ApiParam({ name: 'storeId', description: 'ID of store' })
  @Get('salesperson/detailed')
  async reportDetailedSalespersonConsolidated(
    @Param('storeId') storeId: string,
    @Query() filter: FilterReportDto,
    @UserId() idUserLoggedIn: string,
  ): Promise<ReportDetailedSalespersonDto[]> {
    return this.reportsService.generateReportDetailedSalesperson(
      storeId,
      filter,
      idUserLoggedIn,
    ) as Promise<ReportDetailedSalespersonDto[]>;
  }

  @ApiOperation({ summary: 'Report general' })
  @ApiResponse({
    status: 200,
    description: 'Report generated with success',
    type: ReportGeneralDto,
  })
  @ApiParam({ name: 'storeId', description: 'ID of store' })
  @Get('general')
  async reportGeneral(
    @Param('storeId') storeId: string,
    @Query() filter: FilterReportDto,
  ): Promise<ReportGeneralDto> {
    return this.reportsService.generateReportGeneral(storeId, filter);
  }

  @ApiOperation({ summary: 'Top 3 salespeople with data of user loggedIn' })
  @ApiResponse({
    status: 200,
    description: 'Report generated with success',
    type: Top3SalespeopleDto,
  })
  @ApiParam({ name: 'storeId', description: 'ID of store' })
  @Get('top3-salespeople')
  async getTop3SalespeopleWithUserLoggedIn(
    @Param('storeId') storeId: string,
    @Query() filter: FilterTop3SalespeopleDto,
    @UserId() idUserLoggedIn: string,
  ): Promise<Top3SalespeopleDto> {
    const filterWithUser = { ...filter, idUserLoggedIn };
    return this.reportsService.getTop3SalespeopleWithUserLoggedIn(
      storeId,
      filterWithUser,
    );
  }
}
