import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

export class OutputUserAdmin {
  @ApiProperty({ example: 5 })
  id: string;

  @ApiProperty({ example: 'admin@email.com' })
  email: string;

  @ApiProperty({ example: 'Admin of Silva' })
  name: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'autopilot' })
  profile: string;

  @ApiProperty({ example: 'https://img.com' })
  avatarUrl: string | null;

  @ApiProperty({
    example: [
      'autopilotViewSubscribers',
      'autopilotBlockSubscriber',
      'autopilotViewDashboard',
    ],
  })
  permissions: string[];
}

export class CreateUserAdminSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.CREATED })
  statusCode: number;

  @ApiProperty({ type: OutputUserAdmin })
  data: OutputUserAdmin;
}
