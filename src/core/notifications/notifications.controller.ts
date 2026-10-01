import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserId } from 'src/auth/auth/decorators/user-id-decorator';
import { JwtAuthGuard } from 'src/auth/auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  UpdateStatusNotificationDto,
  ListNotificationDto,
} from './dto/notifications.dto';
import {
  UpdateStatusNotificationDoc,
  ListNotificationsDoc,
} from './docs/notifications.swagger';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ListNotificationsDoc()
  @Get('/list')
  async list(@UserId() userId: string, @Query() query: ListNotificationDto) {
    return await this.notificationsService.listNotifications(userId, query);
  }

  @Put('/all-viewed')
  async markAllViewed(@UserId() userId: string) {
    return await this.notificationsService.markAllAsRead(userId);
  }

  @UpdateStatusNotificationDoc()
  @Put('/update-status/:idNotification')
  async update(
    @Body() updateStatus: UpdateStatusNotificationDto,
    @Param('idNotification') idNotification: string,
  ) {
    return await this.notificationsService.updateNotification(
      updateStatus,
      idNotification,
    );
  }
}
