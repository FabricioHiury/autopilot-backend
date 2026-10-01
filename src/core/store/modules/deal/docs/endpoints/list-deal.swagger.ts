import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class AssigneeDeal {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Employee of Silva' })
  name: string;

  @ApiProperty({ example: '(00) 00000-0000' })
  whatsapp: string;
}

class DealOutput {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Deal of test' })
  title: string;

  @ApiProperty({ example: 'Description...' })
  descriptionDeal: string;

  @ApiProperty({ example: 'instagram' })
  dealOrigin: string;

  @ApiProperty({ example: 'COLD' })
  temperature: string;

  @ApiProperty({ example: 'BUY' })
  dealMode: string;

  @ApiProperty({ example: 'dealInitial' })
  status: string;

  @ApiProperty({ example: '2024-12-16T15:57:40.279Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-12-16T15:57:40.279Z' })
  updatedAt: Date;

  @ApiProperty({ example: null, nullable: true })
  customer: any;

  @ApiProperty({ type: () => [AssigneeDeal] })
  assignees: AssigneeDeal[];
}

class ListDealsOutput {
  @ApiProperty({ example: '' })
  search: string;

  @ApiProperty({ example: '' })
  dealMode: string;

  @ApiProperty({ example: '' })
  origin: string;

  @ApiProperty({ example: '' })
  employeeIds: string;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  itemsPage: number;

  @ApiProperty({ type: () => [DealOutput] })
  deals: DealOutput[];
}

export class ListDealsSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: () => ListDealsOutput })
  data: ListDealsOutput;
}

export class ListDealsNotFound {
  @ApiProperty({ example: 'Deal not found.' })
  message: string;

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode: number;
}
