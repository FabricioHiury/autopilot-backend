import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContactStoreOutput {
  @ApiProperty({ example: 2 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: 'aaa' })
  name: string;

  @ApiProperty({ example: '21999999999', nullable: true })
  mobile: string;

  @ApiPropertyOptional({ example: '2144444444', nullable: true })
  phone?: string;

  @ApiProperty({ example: 'store@email.com' })
  email: string;

  @ApiPropertyOptional({ example: 'www.store.com', nullable: true })
  site?: string;

  @ApiProperty({ example: '2024-12-17T19:47:33.178Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-12-17T19:47:50.770Z' })
  updatedAt: string;
}

export class RegisterContactStoreSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ContactStoreOutput })
  data: ContactStoreOutput;
}
