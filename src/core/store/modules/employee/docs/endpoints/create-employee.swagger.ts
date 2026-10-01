import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

class CustomerAddress {
  @ApiProperty({ example: 2 })
  id: string;

  @ApiProperty({ example: 2 })
  customerId: string;

  @ApiProperty({ example: '12345678' })
  postalCode: string;

  @ApiProperty({ example: 'sp' })
  state: string;

  @ApiProperty({ example: 'São Paulo' })
  city: string;

  @ApiProperty({ example: 'Street of Flores' })
  address: string;

  @ApiProperty({ example: 'District of Flores' })
  district: string;

  @ApiProperty({ example: '123' })
  number: string;

  @ApiProperty({ example: 'Complement' })
  complement: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  updatedAt: string;
}

class Features {
  @ApiProperty({ example: ['storeViewDashboard', 'storeViewDeals'] })
  features: string[];
}

class CreateEmployeeResponse {
  @ApiProperty({ example: 2 })
  id: string;

  @ApiProperty({ example: 5 })
  userId: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: null })
  idPhoto: string | null;

  @ApiProperty({ example: 'Jose of Silva' })
  name: string;

  @ApiProperty({ example: 'individual' })
  typePerson: string;

  @ApiProperty({ example: '1222345678910' })
  taxId: string;

  @ApiProperty({ example: '123456789' })
  identityNumber: string;

  @ApiProperty({ example: false })
  foreigner: boolean;

  @ApiProperty({ example: 'masculino' })
  gender: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-12-20T00:00:00.000Z' })
  birthDate: string;

  @ApiProperty({ example: null })
  notes: string | null;

  @ApiProperty({ example: '18996496211' })
  phone: string;

  @ApiProperty({ example: '18996496211' })
  whatsapp: string;

  @ApiProperty({ example: 'emailtesteasa@email.com' })
  email: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  updatedAt: string;

  @ApiProperty({ type: CustomerAddress })
  customerAddress: CustomerAddress;

  @ApiProperty({
    type: [String],
    example: ['storeViewDashboard', 'storeViewDeals'],
  })
  features: string[];
}

export class CreateEmployeeSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.CREATED })
  statusCode: number;

  @ApiProperty({ type: CreateEmployeeResponse })
  data: CreateEmployeeResponse;
}

export class CreateEmployeeBadRequest {
  @ApiProperty({ example: 'Failed to perform a operation' })
  message: string;

  @ApiProperty({ example: HttpStatus.BAD_REQUEST })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
