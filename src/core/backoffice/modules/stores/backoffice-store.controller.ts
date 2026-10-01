import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { BackofficeStoreService } from './backoffice-store.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { ListStoresAdminDto } from './dto/list-stores-admin.dto';
import {
  ConfigureIntegrationWppDoc,
  ListStoresAdminDoc,
} from './docs/backoffice-store.swagger';
import { ConfigureIntegrationWppDto } from './dto/configure-integration-whatsapp.dto';

@UseGuards(JwtAuthGuard, ProfileGuard, PermissionsGuard)
@Profile(USER_PROFILE.AUTOPILOT)
@ApiTags('AutoPilot - stores')
@Controller('backoffice/stores')
export class BackofficeStoreController {
  constructor(
    private readonly backofficeStoreService: BackofficeStoreService,
  ) {}

  @ListStoresAdminDoc()
  @Get('/')
  async listStores(@Query() params: ListStoresAdminDto) {
    return await this.backofficeStoreService.listStores(params);
  }

  @ConfigureIntegrationWppDoc()
  @Post('/configure-wpp')
  async configureIntegrationWpp(@Body() params: ConfigureIntegrationWppDto) {
    return await this.backofficeStoreService.configureIntegrationWpp(params);
  }
}
