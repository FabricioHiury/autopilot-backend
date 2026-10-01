import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class ItemHistory {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 'Deal started' })
  typeEvent: string;

  @ApiProperty({ example: 'Fulano iniciou a deal' })
  description: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  createdAt?: string;
}

class ListHistoryStoreOutput {
  @ApiProperty({ example: 10 })
  page: number;

  @ApiProperty({ example: 6 })
  itemsByPage: number;

  @ApiProperty({ example: 20 })
  totalPages: number;

  @ApiProperty({ example: 'João of Silva' })
  search?: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  dataInitial?: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z' })
  dataFinal?: string;
}

export class ListHistoryStoreSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ListHistoryStoreOutput })
  data: ListHistoryStoreOutput;
}
