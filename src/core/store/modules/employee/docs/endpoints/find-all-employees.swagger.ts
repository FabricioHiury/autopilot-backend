import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ListRolesSuccess } from '../../../role/docs/endpoints/list-roles';

class RoleWithFeaturesArray {
  @ApiProperty({ example: 'Manager' })
  role: string;

  @ApiProperty({ example: ['storeViewDeals', 'storeViewDashboard'] })
  features: string[];
}
class FindEmployeeReply {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 3 })
  userId: string;

  @ApiProperty({ example: 1 })
  idPhoto: string | null;

  @ApiProperty({
    example: [
      { role: 'Manager', features: ['storeViewDeals', 'storeViewDashboard'] },
    ],
  })
  roles: RoleWithFeaturesArray[];

  @ApiProperty({ example: 'employee souza' })
  name: string;

  @ApiProperty({ example: '101.000.000-00' })
  taxId: string;

  @ApiProperty({ example: '(00) 00000-0000' })
  whatsapp: string;

  @ApiProperty({ example: '(00) 00000-0000' })
  phoneAdditional: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'Lorem ipsum dolor sit amet....' })
  notes: string | null;

  @ApiProperty({ example: '2024-09-27T19:10:29.356Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-09-30T18:56:28.092Z' })
  updatedAt: string;
}

class DataEmployees {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 2 })
  totalPages: number;

  @ApiProperty({ example: 11 })
  totalEmployees: number;

  @ApiProperty({ type: FindEmployeeReply, isArray: true })
  employees: FindEmployeeReply[];
}

export class FindEmployeesSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: DataEmployees })
  data: DataEmployees;
}

export class FindEmployeesError {
  @ApiProperty({ example: 'None employee not found.' })
  message: string;

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode: number;

  @ApiProperty()
  data: {};
}
