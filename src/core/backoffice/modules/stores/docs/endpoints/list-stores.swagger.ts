import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class OutputStoreAdmin {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Carros Corp.' })
  companyName: string;

  @ApiProperty({ example: '99999999999999/9999' })
  taxId: string;

  @ApiProperty({ example: false })
  wppConfigured: boolean;

  @ApiProperty({ example: '2024-12-06T14:43:54.937Z' })
  createdAt: string;

  @ApiProperty({ example: 'storeOwner@email.com' })
  email: string;

  @ApiProperty({ example: 'http://localhost:3003/avatar/user/1' })
  avatarUrl: string;
}

class ListStoresAdminOutput {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  itemsByPage: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiPropertyOptional({ example: '', nullable: true })
  search?: string;

  @ApiPropertyOptional({ example: 'false', nullable: true })
  wppConfigured?: string;

  @ApiProperty({ type: [OutputStoreAdmin] })
  stores: OutputStoreAdmin[];
}

export class ListStoresAdminSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: ListStoresAdminOutput })
  data: ListStoresAdminOutput;
}
