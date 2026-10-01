import { ApiProperty } from '@nestjs/swagger';
import { DealOutput } from './create-deal.swagger';

export class UpdateCustomerDealSuccess {
  @ApiProperty({ example: 'Customer changed with success.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: DealOutput })
  data: DealOutput;
}
