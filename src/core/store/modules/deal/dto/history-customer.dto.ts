import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsNumberString } from 'class-validator';

export class HistoryCustomerDto {
  @ApiProperty({
    description: 'ID of customer (required if not provide temporaryCustomerId)',
    example: 'uuid-of-customer',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID of customer must be a UUID valid' })
  customerId?: string;

  @ApiProperty({
    description:
      'ID of customer temporary (required if not provide customerId)',
    example: 'uuid-of-customer-temporary',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID of customer temporary must be a UUID valid' })
  temporaryCustomerId?: string;

  @ApiProperty({
    description: 'Number of page',
    example: '1',
    default: '1',
    required: false,
  })
  @IsOptional()
  @IsNumberString({}, { message: 'Page must be a number' })
  page?: string = '1';

  @ApiProperty({
    description: 'Limit of items by page',
    example: '10',
    default: '10',
    required: false,
  })
  @IsOptional()
  @IsNumberString({}, { message: 'Items by page must be a number' })
  itemsPage?: string = '10';

  @ApiProperty({
    description: 'Term of search for filter by title or description',
    example: 'problem product',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search must be a string' })
  search?: string;
}
