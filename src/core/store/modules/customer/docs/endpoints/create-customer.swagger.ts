import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerAddressDto } from '../../dto/customer.dto';

export class CreateCustomerOutputDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 1 })
  idPhoto: string;

  @ApiProperty({ example: 'Lucas Roque' })
  name: string;

  @ApiProperty({ example: 'individual' })
  typePerson: string;

  @ApiProperty({ example: '35430843725' })
  taxId: string;

  @ApiProperty({ example: '123456789' })
  identityNumber: string;

  @ApiProperty({ example: false })
  foreigner: boolean;

  @ApiProperty({ example: 'masculino' })
  gender: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2000-12-20T00:00:00.000Z' })
  birthDate: string;

  @ApiProperty({ example: 'Notes' })
  notes: string;

  @ApiProperty({ example: '(12) 91234-5678' })
  phone: string;

  @ApiProperty({ example: '(12) 91234-5678' })
  whatsapp: string;

  @ApiProperty({ example: 'lucas@email.com' })
  email: string;

  @ApiProperty({ example: 1 })
  version: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  updatedAt: Date;

  @ApiProperty()
  customerAddress: CustomerAddressDto;

  @ApiProperty({ example: 1 })
  totalDeals: number;
}

export class CreateCustomerSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: CreateCustomerOutputDto;
}

export class CreateCustomerConflict {
  @ApiProperty({
    example:
      'There is already a customer registered with this CPF or TAXID this store.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class CreateCustomerNotFound {
  @ApiProperty({ example: 'Failed to find a store with the ID provided.' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
