import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class FindEmployeeReply {
  @ApiProperty({ example: 2 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 1 })
  userId: string;

  @ApiProperty({ example: null })
  idPhoto: string | null;

  @ApiProperty({ example: 'Jose of Silva' })
  name: string;

  @ApiProperty({ example: '1222345678910' })
  taxId: string;

  @ApiProperty({ example: '18996496212' })
  whatsapp: string;

  @ApiProperty({ example: '18996496212' })
  phoneAdditional: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: null })
  notes: string | null;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  updatedAt: string;
}

export class FindEmployeeSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: FindEmployeeReply })
  data: FindEmployeeReply;
}

export class FindEmployeeError {
  @ApiProperty({ example: 'Employee not found.' })
  message: string;

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode: number;

  @ApiProperty()
  data: {};
}
