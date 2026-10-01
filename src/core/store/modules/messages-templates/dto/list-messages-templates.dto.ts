import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListMessagesTemplatesDto {
  @ApiProperty({
    description: 'Term of search for filter messages',
    example: 'greeting',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Number of page',
    example: '1',
    required: false,
    default: '1',
  })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiProperty({
    description: 'Limit of items by page',
    example: '10',
    required: false,
    default: '10',
  })
  @IsString()
  @IsOptional()
  itemsByPage?: string;
}
