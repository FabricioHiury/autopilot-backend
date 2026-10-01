import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCustomerOutputDto } from './create-customer.swagger';

export class CustomerOfListOutputDto extends CreateCustomerOutputDto {}

export class ListCustomerOutputDto {
  @ApiProperty({ example: 'Lucas' })
  search: string;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  dataInitial: Date;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  dataFinal: Date;

  @ApiProperty({ example: 1 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalCustomers: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ type: [CustomerOfListOutputDto] })
  customers: CustomerOfListOutputDto[];
}

export class ListCustomerSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: ListCustomerOutputDto;
}

export class ListCustomerNotFound {
  @ApiProperty({ example: 'Failed to find a store with the ID provided.' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
