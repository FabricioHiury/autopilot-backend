import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatesBraziliansEnum } from 'src/utils/enum/states.enum';

export class AddressStoreOutput {
  @ApiProperty({ example: 2 })
  id: string;

  @ApiProperty({ example: 1 })
  storeId: string;

  @ApiProperty({ example: '12345-678' })
  postalCode: string;

  @ApiProperty({ example: 'SP', enum: StatesBraziliansEnum })
  state: StatesBraziliansEnum;

  @ApiProperty({ example: 'São Paulo' })
  city: string;

  @ApiProperty({ example: 'Street Exemplo' })
  street: string;

  @ApiProperty({ example: '1000' })
  number: string;

  @ApiPropertyOptional({ example: 'District', nullable: true })
  district?: string;

  @ApiPropertyOptional({ example: 'Store D', nullable: true })
  complement?: string;

  @ApiProperty({ example: false })
  branch: boolean;

  @ApiProperty({ example: '2024-12-17T19:05:02.498Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-12-17T19:09:32.446Z' })
  updatedAt: string;
}

export class RegisterAddressStoreSuccess {
  @ApiProperty({ example: 'Operation completed with success' })
  message: string;

  @ApiProperty({ example: HttpStatus.CREATED })
  statusCode: number;

  @ApiProperty({ type: AddressStoreOutput })
  data: AddressStoreOutput;
}
