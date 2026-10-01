import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CreateRoleOutput } from './create-role.';

export class DeleteRoleSuccess {
  @ApiProperty({ example: 'Role created with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ type: CreateRoleOutput })
  data: CreateRoleOutput;
}
