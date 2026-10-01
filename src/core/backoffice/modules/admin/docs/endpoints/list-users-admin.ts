import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { OutputUserAdmin } from './create-user-admin';

class ListUsersAdminOutput {
  @ApiProperty({ example: 10 })
  page: number;

  @ApiProperty({ example: 6 })
  itemsByPage: number;

  @ApiProperty({ example: 20 })
  totalPages: number;

  @ApiProperty({ example: 'João of Silva' })
  search?: string;

  @ApiProperty({ example: 'active' })
  status?: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  dataInitial?: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z' })
  dataFinal?: string;

  @ApiProperty({ type: [OutputUserAdmin] })
  users: OutputUserAdmin[];
}

export class ListUsersAdminSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ListUsersAdminOutput })
  data: ListUsersAdminOutput;
}
