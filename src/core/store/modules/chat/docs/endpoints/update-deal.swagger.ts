import { ApiProperty } from '@nestjs/swagger';

class UpdateDealChatOutput {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 1, nullable: true })
  dealId: string;

  @ApiProperty({ example: 1 })
  customerId: string;

  @ApiProperty({ example: 'customer' })
  typeCustomer: string;

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  updatedAt: Date;
}

export class UpdateDealChatSuccess {
  @ApiProperty({ example: 'Deal changed with success.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: UpdateDealChatOutput })
  data: UpdateDealChatOutput;
}
