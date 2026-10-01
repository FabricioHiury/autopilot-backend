import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListNotificationsSuccess } from './endpoints/list-notifications.swagger';
import { UpdateStatusSuccess } from './endpoints/update-status.swagger';
import { UpdateStatusNotificationDto } from '../dto/notifications.dto';

export function ListNotificationsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List Notifications',
      description: 'List notifications of user current loggedIn',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListNotificationsSuccess,
    }),
  );
}

export function UpdateStatusNotificationDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update Status',
    }),
    ApiBody({
      type: UpdateStatusNotificationDto,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: UpdateStatusSuccess,
    }),
  );
}
