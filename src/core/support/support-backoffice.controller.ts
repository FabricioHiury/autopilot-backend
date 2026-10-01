import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { Profile } from 'src/auth/auth/roles-decorators/profile/profile.decorator';
import { USER_PROFILE } from '../user/enum/profile.enum';
import { ProfileGuard } from 'src/auth/auth/roles-decorators/profile/profile.guard';
import { PermissionsGuard } from 'src/auth/auth/roles-decorators/permissions/permissions.guard';
import { ApiTags } from '@nestjs/swagger';
import { ListTicketDto } from './dto/list-ticket-dto';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { ReplyTicketDto } from './dto/reply-ticket-dto';
import { UpdateTicketDto } from './dto/update-ticket-dto';

@ApiTags('Backoffice/Support')
@UseGuards(JwtAuthGuard, ProfileGuard, PermissionsGuard)
@Profile(USER_PROFILE.AUTOPILOT)
@Controller('backoffice/support')
export class SupportBackofficeController {
  constructor(private readonly supportService: SupportService) {}

  @Get('/')
  async listTickets(@Query() params: ListTicketDto) {
    return await this.supportService.listTickets(params);
  }

  @Get('/status')
  listStatus() {
    return this.supportService.listStatusTickets();
  }

  @Get('/categories')
  listCategories() {
    return this.supportService.listCategoryTickets();
  }

  @Get('/priorities')
  listPriorities() {
    return this.supportService.listPriorityTickets();
  }

  @Get('/:idTicket')
  async getTicket(@Param('idTicket') idTicket: string) {
    return await this.supportService.getTicket(idTicket);
  }

  @Post('/:idTicket/reply')
  async replyTicket(
    @UserId() userId: string,
    @Param('idTicket') idTicket: string,
    @Body() params: ReplyTicketDto,
  ) {
    return await this.supportService.replyTicket(idTicket, userId, params);
  }

  @Put('/:idTicket/update-status')
  async updateTicket(
    @UserId() userId: string,
    @Param('idTicket') idTicket: string,
    @Body() params: UpdateTicketDto,
  ) {
    return await this.supportService.updateStatusTicket(
      idTicket,
      userId,
      params,
    );
  }
}
