import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  FindAdminByIdDoc,
  FindDataAdminLoggedInDoc,
  GrantPermissionsDoc,
  CreateUserAdminDoc,
  DeleteUserAdminDoc,
  EditAdminLoggedInDoc,
  EditUserAdminDoc,
  ListPermissionsValidDoc,
  ListUsersAdminDoc,
  RemovePermissionsDoc,
} from './docs/admin.swagger';
import { AdminService } from './admin.service';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { USER_PROFILE } from 'src/core/user/enum/profile.enum';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { Permissions } from 'src/auth/auth/roles-decorators/permissions/permissions.decorator';
import { PERMISSIONS_AUTOPILOT } from 'src/core/user/enum/permissions_features.enum';
import { ApiTags } from '@nestjs/swagger';
import { PermissionsAdminDto } from './dto/permissions-admin.dto';
import { EditUserAdminDto } from './dto/edit-user-admin.dto';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { EditAdminLoggedInDto } from './dto/edit-admin-loggedIn.dto';
import { ListUsersAdminDto } from './dto/list-users-admin.dto';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';

@UseGuards(JwtAuthGuard, ProfileGuard, PermissionsGuard)
@Profile(USER_PROFILE.AUTOPILOT)
@ApiTags('AutoPilot - admin')
@Controller('backoffice/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ListPermissionsValidDoc()
  @Get('/list-permissions')
  async listPermissionsValid() {
    return await this.adminService.listPermissionsValid();
  }

  @FindDataAdminLoggedInDoc()
  @Get('/')
  async findDataAdminLoggedIn(@UserId() userId: string) {
    return await this.adminService.findAdminById(userId);
  }

  @ListUsersAdminDoc()
  @Permissions([PERMISSIONS_AUTOPILOT.AUTOPILOT_VIEW_USERS_ADMIN])
  @Get('/users')
  async listUsers(@Query() params: ListUsersAdminDto) {
    return await this.adminService.listUsersAdmin(params);
  }

  @FindAdminByIdDoc()
  @Permissions([PERMISSIONS_AUTOPILOT.AUTOPILOT_VIEW_USERS_ADMIN])
  @Get('/:userId')
  async findAdminById(@Param('userId') userId: string) {
    return await this.adminService.findAdminById(userId);
  }

  @CreateUserAdminDoc()
  @Permissions([PERMISSIONS_AUTOPILOT.AUTOPILOT_CREATE_USER_ADMIN])
  @Post('/register-user-admin')
  async createUserAdmin(@Body() params: CreateUserAdminDto) {
    return await this.adminService.createUserAdmin(params);
  }

  @GrantPermissionsDoc()
  @Permissions([PERMISSIONS_AUTOPILOT.AUTOPILOT_UPDATE_PERMISSIONS])
  @Put('/user/:userId/grant-permissions')
  async grantPermissions(
    @Param('userId') userId: string,
    @UserId() idUserLoggedIn: string,
    @Body() params: PermissionsAdminDto,
  ) {
    return await this.adminService.grantPermissions(
      idUserLoggedIn,
      userId,
      params,
    );
  }

  @EditUserAdminDoc()
  @Permissions([PERMISSIONS_AUTOPILOT.AUTOPILOT_CREATE_USER_ADMIN])
  @Put('/user/:userId/edit')
  async editUserAdmin(
    @Param('userId') userId: string,
    @Body() params: EditUserAdminDto,
  ) {
    return await this.adminService.editUserAdmin(userId, params);
  }

  // não é necessária nenhuma permissão adicional para o usuário editar os próprios dados
  @EditAdminLoggedInDoc()
  @Put('/edit')
  async editAdminLoggedIn(
    @UserId() userId: string,
    @Body() params: EditAdminLoggedInDto,
  ) {
    return await this.adminService.editAdminLoggedIn(userId, params);
  }

  @DeleteUserAdminDoc()
  @Permissions([PERMISSIONS_AUTOPILOT.AUTOPILOT_CREATE_USER_ADMIN])
  @Delete('user/:userId/delete')
  async deleteUserAdmin(
    @Param('userId') userId: string,
    @UserId() idUserLoggedIn: string,
  ) {
    return await this.adminService.deleteUserAdmin(idUserLoggedIn, userId);
  }

  @RemovePermissionsDoc()
  @Permissions([PERMISSIONS_AUTOPILOT.AUTOPILOT_UPDATE_PERMISSIONS])
  @Delete('user/:userId/remove-permissions')
  async removePermissions(
    @Param('userId') userId: string,
    @UserId() idUserLoggedIn: string,
    @Body() params: PermissionsAdminDto,
  ) {
    return await this.adminService.removePermissions(
      idUserLoggedIn,
      userId,
      params,
    );
  }
}
