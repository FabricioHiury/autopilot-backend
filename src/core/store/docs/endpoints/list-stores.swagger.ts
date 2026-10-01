import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { ListStoreOutputDto } from '../../dto/response/store.response';

export class ListStoreSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({ type: ListStoreOutputDto })
  data: ListStoreOutputDto;
}
