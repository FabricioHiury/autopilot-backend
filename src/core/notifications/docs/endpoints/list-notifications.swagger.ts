import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ListNotificationResonseDto } from '../../dto/response/notifications.dto';

export class ListNotificationsSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({ type: [ListNotificationResonseDto] })
  data: [ListNotificationResonseDto];
}
