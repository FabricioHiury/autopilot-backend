import { Controller, Get, Put, Body, UseGuards, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DistributionAutomaticService } from './distribution-automatic.service';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import { ConfigureDistributionDto } from './dto/configure-distribution.dto';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';

@ApiTags('Store - Distribution Automatic')
@Controller('store/distribution-automatic')
@UseGuards(JwtAuthGuard)
export class DistributionAutomaticController {
  constructor(
    private readonly distributionAutomaticService: DistributionAutomaticService,
  ) {}

  @Get('configuration')
  @ApiOperation({ summary: 'Get configuration of distribution automatic' })
  async getConfiguration(@StoreId() storeId: string) {
    return await this.distributionAutomaticService.getConfigurationDistribution(
      storeId,
    );
  }

  @Put('configuration')
  @ApiOperation({ summary: 'Configure distribution automatic' })
  async configure(
    @StoreId() storeId: string,
    @Body() data: ConfigureDistributionDto,
  ) {
    return await this.distributionAutomaticService.configureDistributionAutomatic(
      storeId,
      data.distributionAutomatic,
    );
  }

  @Post('monitor-suspended')
  async monitorSuspended() {
    return await this.distributionAutomaticService.monitorANDRedistributeSuspended();
  }
}
