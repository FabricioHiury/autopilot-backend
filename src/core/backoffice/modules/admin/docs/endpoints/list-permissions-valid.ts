import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ListPermissionsValidSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({
    type: [String],
    example: [
      'autopilotViewDashboard',
      'autopilotReplyTickets',
      'autopilotViewTickets',
      'autopilotBlockSubscriber',
      'autopilotViewSubscribers',
      'autopilotEditSubscribersAdd',
      'autopilotUpdatePanelReseller',
      'autopilotUpdatePermissions',
      'autopilotCreateUserAdmin',
      'autopilotViewUsersAdmin',
    ],
  })
  data: string[];
}
