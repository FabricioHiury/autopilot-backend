import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CustomerAddressDto } from '../../dto/customer.dto';

class LogsActivitiesDeal {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  dealId: string;

  @ApiProperty({
    example: `Jorge changed o status of deal for "completed"`,
  })
  message: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  createdAt: string;
}

export class DealCustomerOutputDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  customerId: string;

  @ApiProperty({ example: 1 })
  temporaryCustomerId: string;

  @ApiProperty({ example: 'instagram' })
  dealOrigin: string;

  @ApiProperty({ example: 'HOT' })
  temperature: string;

  @ApiProperty({ example: 'BUY' })
  mode: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'description' })
  descriptionDeal: string;

  @ApiProperty({ example: 'note' })
  note: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  updatedAt: string;

  @ApiProperty({ type: [LogsActivitiesDeal] })
  dealActivityLogs: LogsActivitiesDeal[];
}

export class GetCustomerOutputDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 1 })
  idPhoto: string;

  @ApiProperty({ example: 'Lucas of Silva' })
  name: string;

  @ApiProperty({ example: 'individual' })
  typePerson: string;

  @ApiProperty({ example: '35430843725' })
  taxId: string;

  @ApiProperty({ example: '123456789' })
  identityNumber: string;

  @ApiProperty({ example: false })
  foreigner: boolean;

  @ApiProperty({ example: 'Masculino' })
  gender: string;

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

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-08-26T21:24:04.855Z' })
  updatedAt: string;

  @ApiProperty()
  customerAddress: CustomerAddressDto;

  @ApiProperty()
  userCreator: {
    name: string;
    id: number;
    profile: string;
  };

  @ApiProperty({ isArray: true })
  deals: DealCustomerOutputDto[];

  @ApiProperty({ example: 1 })
  totalDeals: number;
}

export class GetCustomerSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: GetCustomerOutputDto;
}

export class GetCustomerNotFound {
  @ApiProperty({
    example: 'None customer with this ID was found this store.',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
