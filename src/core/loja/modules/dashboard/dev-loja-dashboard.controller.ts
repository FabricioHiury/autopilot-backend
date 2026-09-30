import { Controller, Get } from '@nestjs/common';
import { LojaDashboardService } from './loja-dashboard.service';

@Controller('dev/loja/dashboard')
export class DevLojaDashboardController {
  constructor(private readonly lojaDashboardService: LojaDashboardService) {}

  @Get()
  async obterOverview() {
    return await this.lojaDashboardService.pegarUltimosAtendimentos('2');
  }
}
