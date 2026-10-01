import { ApiProperty } from '@nestjs/swagger';
import {
  MODE_DEAL,
  ORIGIN_DEAL,
  STATUS_DEAL,
  TEMPERATURE_DEAL,
} from 'src/utils/enum/deal.enum';

export class DealOutput {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 1 })
  customerId: string;

  @ApiProperty({ example: 1, nullable: true })
  temporaryCustomerId?: string;

  @ApiProperty({ example: ORIGIN_DEAL.INSTAGRAM })
  dealOrigin: string;

  @ApiProperty({ example: TEMPERATURE_DEAL.WARM })
  temperature: string;

  @ApiProperty({ example: MODE_DEAL.SELL })
  mode: string;

  @ApiProperty({ example: STATUS_DEAL.CHAT })
  status: string;

  @ApiProperty({ example: 'Notes...', nullable: true })
  note?: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  updatedAt: Date;
}

export class CreateDealSuccess {
  @ApiProperty({ example: 'Operation completed successfully.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: DealOutput })
  data: DealOutput;
}
