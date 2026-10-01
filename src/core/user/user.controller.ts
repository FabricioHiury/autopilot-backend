import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { EditUserDto } from './dto/in/edit-user.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListUsersDto } from './dto/in/list-user.dto';
import { USER_PROFILE } from './enum/profile.enum';

@ApiTags('User')
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'List users' })
  @Get('/list')
  async listUsers(@Query() query: ListUsersDto) {
    return this.userService.listUsers(USER_PROFILE.STOREOWNER, query);
  }

  @ApiOperation({ summary: 'Edits a user' })
  @ApiBody({ type: EditUserDto })
  @ApiResponse({
    status: 200,
  })
  @Put('/edit/:userId')
  async editUser(
    @Body() params: EditUserDto,
    @Param('userId') idUserEdit: string,
    @UserId() idUserLoggedIn: string,
  ) {
    return this.userService.editUser(idUserLoggedIn, idUserEdit, params);
  }

  @ApiOperation({ summary: 'Data of user' })
  @Get('/data/:userId')
  async payUserCorsan(@Param('userId') idUserEdit: string) {
    return this.userService.getUserById(idUserEdit);
  }

  @ApiOperation({ summary: 'Update Password' })
  @Put('/:userId/update-password')
  async updatePassword(
    @Body('password') password: string,
    @Param('userId') userId: string,
    @UserId() idUserLoggedIn: string,
  ) {
    return this.userService.updatePassword(idUserLoggedIn, userId, password);
  }
}
