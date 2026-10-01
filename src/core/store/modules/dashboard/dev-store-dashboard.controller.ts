import { Controller, Get } from '@nestjs/common';
import { StoreDashboardService } from './store-dashboard.service';

@Controller('dev/store/dashboard')
export class DevStoreDashboardController {
  constructor(private readonly storeDashboardService: StoreDashboardService) {}

  @Get()
  async getOverview() {
    return await this.storeDashboardService.getLastDeals('2');
  }
}
