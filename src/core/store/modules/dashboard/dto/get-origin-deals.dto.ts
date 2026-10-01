import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { FILTER_DATA } from '../../../enum/filter-data.enum';
import { ApiProperty } from '@nestjs/swagger';

export class GetOriginDealsDto {
  @ApiProperty({ example: 'monthly', required: false, enum: FILTER_DATA })
  @IsOptional()
  @IsEnum(FILTER_DATA)
  grouping: FILTER_DATA;

  @ApiProperty({ example: '2024-11-27', required: false })
  @IsOptional()
  @IsDateString()
  dataStart: Date;

  @ApiProperty({ example: '2024-11-27', required: false })
  @IsOptional()
  @IsDateString()
  dataEnd: Date;
}
