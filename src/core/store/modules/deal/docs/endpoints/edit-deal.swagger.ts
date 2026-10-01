import { ApiProperty } from '@nestjs/swagger';
import { DealOutput } from './create-deal.swagger';

export class EditDealSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: DealOutput })
  data: DealOutput;
}
