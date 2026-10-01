import { ApiProperty } from '@nestjs/swagger';
import { DetailsStoreDto } from '../../dto/response/store.response';
import { HttpStatus } from '@nestjs/common';

export class GetStoreSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({ type: DetailsStoreDto })
  data: DetailsStoreDto;
}

export class GetStoreNotFound {
  @ApiProperty({ example: 'Store not found' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
