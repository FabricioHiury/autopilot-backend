import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterSuspensionDto {
  @ApiProperty({
    description: 'Page current',
    example: '1',
    required: false,
  })
  @IsNumberString()
  @IsOptional()
  page?: string = '1';

  @ApiProperty({
    description: 'Limit of items by page',
    example: '10',
    required: false,
  })
  @IsNumberString()
  @IsOptional()
  itemsPage?: string = '10';

  @ApiProperty({
    description: 'ID of user suspended',
    example: 1,
    required: false,
  })
  @IsOptional()
  userId?: string;

  @ApiProperty({
    description: 'Filter by part of description',
    example: 'vacation',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Filter by data of start starting of',
    example: '2023-10-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDateStart?: string;

  @ApiProperty({
    description: 'Filter by data of start until',
    example: '2023-10-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDateEnd?: string;

  @ApiProperty({
    description: 'Filter suspensions active in data current',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  active?: boolean;
}
