import { ApiProperty } from '@nestjs/swagger';

class EmployeeShare {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ example: '5511999999999' })
  whatsapp: string;
}

class ShareData {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  dealId: string;

  @ApiProperty({ example: 1 })
  employeeId: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 1 })
  sharedBy: string;

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: EmployeeShare })
  employee: EmployeeShare;
}

export class ShareSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: ShareData })
  data: ShareData;
}

export class ListSharesSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: [ShareData] })
  data: ShareData[];
}

export class RemoveShareSuccess {
  @ApiProperty({ example: 'Share removed with success.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
