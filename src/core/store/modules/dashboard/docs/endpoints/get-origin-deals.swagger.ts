import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

class CountOriginDeals {
  @ApiProperty({ example: 3 })
  ads: number;

  @ApiProperty({ example: 2 })
  store: number;

  @ApiProperty({ example: 5 })
  networksSocial: number;

  @ApiProperty({ example: 1 })
  mediaIndividual: number;

  @ApiProperty({ example: 0 })
  other: number;
}

export class ItemOriginDeals {
  @ApiProperty({ example: '2024-10-01' })
  data: string;

  @ApiProperty({ type: CountOriginDeals })
  count: CountOriginDeals;
}

class GetOriginDealsResponse {
  @ApiProperty({ example: 'daily' })
  grouping: string;

  @ApiProperty({ example: '2024-10-01' })
  dataStart: string;

  @ApiProperty({ example: '2024-10-01' })
  dataEnd: string;

  @ApiProperty({ type: [ItemOriginDeals] })
  data: ItemOriginDeals[];
}

export class GetOriginDealsSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string = 'Operation completed with success';

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number = HttpStatus.OK;

  @ApiProperty({ type: GetOriginDealsResponse })
  data: GetOriginDealsResponse;
}
