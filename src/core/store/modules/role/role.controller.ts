import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { StoreRoleService } from './role.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { CreateRoleDto } from './dto/create-role.dto';
import { StoreId } from 'src/auth/auth/decorators/store-id-decorator';
import {
  CreateRoleDoc,
  DeleteRoleDoc,
  ListRolesDoc,
} from './docs/role.swagger';
import { Permissions } from 'src/auth/auth/roles-decorators/permissions/permissions.decorator';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';

@ApiTags('Store - roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('store/role')
export class StoreRoleController {
  constructor(private readonly storeRoleService: StoreRoleService) {}

  @ListRolesDoc()
  @Get('/')
  async listRoles(@StoreId() storeId: string) {
    return await this.storeRoleService.listRoles(storeId);
  }

  @CreateRoleDoc()
  @Permissions([PERMISSIONS_STORE.STORE_MANAGE_ROLES])
  @Put('/')
  async createRole(@StoreId() storeId: string, @Body() params: CreateRoleDto) {
    return await this.storeRoleService.createRole(storeId, params);
  }

  @DeleteRoleDoc()
  @Permissions([PERMISSIONS_STORE.STORE_MANAGE_ROLES])
  @Delete('/')
  async deleteRole(@StoreId() storeId: string, @Body('id') idRole: string) {
    return this.storeRoleService.deleteRole(storeId, idRole);
  }
}
