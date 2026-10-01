import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { OutputUserAdmin } from './create-user-admin';

export class DeleteUserAdminSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: OutputUserAdmin })
  data: OutputUserAdmin;
}
