import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

class Employee {
  @ApiProperty({ example: 3 })
  id: string;

  @ApiProperty({ example: 'José' })
  name: string;

  @ApiProperty({ example: 1, nullable: true })
  idPhoto: string;
}

export class Deal {
  @ApiProperty({ example: 5 })
  id: string;

  @ApiProperty({ example: 'networksSocial' })
  platform: string;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: '2024-10-01T15:36:16.877Z' })
  createdAt: string;

  @ApiProperty({ type: Employee })
  employee: Employee;
}

class GetLastDealsResponse {
  @ApiProperty({ example: 'BUY' })
  mode: 'BUY' | 'SELL';

  @ApiProperty({ type: [Deal] })
  deals: Deal[];
}

export class GetLastDealsSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string = 'Operation completed with success';

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number = HttpStatus.OK;

  @ApiProperty({ type: GetLastDealsResponse })
  data: GetLastDealsResponse;
}
