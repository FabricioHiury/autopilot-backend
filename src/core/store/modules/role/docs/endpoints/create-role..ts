import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleOutput {
  @ApiProperty({
    example: 7,
  })
  id: string;

  @ApiProperty({
    example: 1,
  })
  storeId: string;

  @ApiProperty({ example: 'Salesperson' })
  role: string;

  @ApiProperty({
    example: 'storeRegisterEditCustomers,storeSearchCustomers',
  })
  features: string;
}

export class CreateRoleSuccess {
  @ApiProperty({ example: 'Role created with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ type: CreateRoleOutput })
  data: CreateRoleOutput;
}
