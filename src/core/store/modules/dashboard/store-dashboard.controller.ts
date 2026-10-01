import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StoreDashboardService } from './store-dashboard.service';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { MODE_DEAL } from 'src/utils/enum/deal.enum';
import { GetOriginDealsDto } from './dto/get-origin-deals.dto';
import {
  GetReportWeeklyDoc,
  GetLastDealsDoc,
  GetOriginDealsDoc,
} from './docs/store-dashboard.swagger';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { Permissions } from 'src/auth/auth/roles-decorators/permissions/permissions.decorator';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';

@ApiTags('Store - dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions([PERMISSIONS_STORE.STORE_VIEW_DASHBOARD])
@Controller('store/dashboard')
export class StoreDashboardController {
  constructor(private readonly storeDashboardService: StoreDashboardService) {}

  @GetReportWeeklyDoc()
  @Get('/report-weekly')
  async getReportWeekly(@StoreId() storeId: string, @UserId() userId?: string) {
    return await this.storeDashboardService.getReportWeekly(storeId, userId);
  }

  @GetLastDealsDoc()
  @Get('/last-deals')
  async getLastDeals(
    @StoreId() storeId: string,
    @Query('mode') mode?: MODE_DEAL | undefined,
  ) {
    return await this.storeDashboardService.getLastDeals(storeId, mode);
  }

  @GetOriginDealsDoc()
  @Get('/origin-deals')
  async getOriginDeals(
    @StoreId() storeId: string,
    @Query() query: GetOriginDealsDto,
  ) {
    const { grouping, dataStart, dataEnd } = query;

    return await this.storeDashboardService.getOriginDeals(
      storeId,
      grouping,
      dataStart,
      dataEnd,
    );
  }

  @Get('/overview')
  async getOverview(@StoreId() storeId: string) {
    return await this.storeDashboardService.getOverview(storeId);
  }
}
