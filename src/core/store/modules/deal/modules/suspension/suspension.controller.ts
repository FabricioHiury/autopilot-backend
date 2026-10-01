import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { SuspensionService } from './suspension.service';
import { CreateSuspensionDto } from './dto/create-suspension.dto';
import { UpdateSuspensionDto } from './dto/update-suspension.dto';
import { FilterSuspensionDto } from './dto/filter-suspension.dto';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { Permissions } from 'src/auth/auth/roles-decorators/permissions/permissions.decorator';
import {
  updateSuspensionDoc,
  createSuspensionDoc,
  listSuspensionsDoc,
  getSuspensionByIdDoc,
  removeSuspensionDoc,
  checkUserSuspendedDoc,
} from './docs/suspension.swagger';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';

@ApiTags('Suspension of Deal')
@Controller('suspension')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SuspensionController {
  constructor(private readonly suspensionService: SuspensionService) {}

  @Post()
  @createSuspensionDoc()
  @Permissions([PERMISSIONS_STORE.STORE_MANAGE_SUSPENSIONS])
  async create(@Body() data: CreateSuspensionDto) {
    return this.suspensionService.create(data);
  }

  @Put(':id')
  @updateSuspensionDoc()
  @Permissions([PERMISSIONS_STORE.STORE_MANAGE_SUSPENSIONS])
  async update(@Param('id') id: string, @Body() data: UpdateSuspensionDto) {
    return this.suspensionService.update(id, data);
  }

  @Delete(':id')
  @removeSuspensionDoc()
  @Permissions([PERMISSIONS_STORE.STORE_MANAGE_SUSPENSIONS])
  async remove(@Param('id') id: string) {
    return this.suspensionService.remove(id);
  }

  @Get()
  @listSuspensionsDoc()
  @Permissions([PERMISSIONS_STORE.STORE_MANAGE_SUSPENSIONS])
  async list(@Query() filters: FilterSuspensionDto) {
    return this.suspensionService.list(filters);
  }

  @Get('user/:id/suspended')
  @checkUserSuspendedDoc()
  @Permissions([PERMISSIONS_STORE.STORE_MANAGE_SUSPENSIONS])
  async checkUserSuspended(@Param('id') id: string) {
    const suspended = await this.suspensionService.checkUserSuspended(id);
    return { suspended };
  }

  @Get(':id')
  @getSuspensionByIdDoc()
  @Permissions([PERMISSIONS_STORE.STORE_MANAGE_SUSPENSIONS])
  async getById(@Param('id') id: string) {
    return this.suspensionService.getById(id);
  }
}
