// src/atendimentos/dto/filter-atendimento.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { MODE_DEAL, STATUS_DEAL } from 'src/utils/enum/deal.enum';
import { ToISO8601 } from 'src/utils/transformers/toISO8601.transformer';

export class FilterDealDto {
  @ApiProperty({
    example: 'Name of customer',
    required: false,
    description: 'Search by title of deal or name and email of customer',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Matches(/^([a-f0-9-]+,)*[a-f0-9-]+$/i, {
    message: 'The field must be a list of ids separated by comma',
  })
  employeeIds?: string;

  @ApiProperty({ example: 'BUY', required: false })
  @IsOptional()
  @IsEnum(MODE_DEAL)
  dealMode?: MODE_DEAL;

  @ApiProperty({
    example: STATUS_DEAL.SUCCESS,
    enum: STATUS_DEAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(STATUS_DEAL)
  status?: string;

  @ApiProperty({ example: 'instagram', required: false })
  @IsOptional()
  @Matches(/^(\w+,)*\w+$/, {
    message: 'The field must be a list of origins separated by comma',
  })
  origin?: string;

  @ApiProperty({
    example: '2024-06-17',
    required: false,
  })
  @IsString()
  @IsDateString()
  @IsOptional()
  @ToISO8601()
  dataInitial: Date;

  @ApiProperty({
    example: '2024-06-17',
    required: false,
  })
  @IsString()
  @IsDateString()
  @IsOptional()
  @ToISO8601()
  dataFinal: Date;

  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsNumberString()
  itemsPage?: string;

  @ApiProperty({ example: 'createdAt', required: false })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'status'])
  orderBy?: string;

  @ApiProperty({ example: 'asc', required: false })
  @IsOptional()
  @IsIn(['asc', 'desc', 'status'])
  orderDirection?: string;

  @IsOptional()
  @IsString()
  tasksAssigned?: string;

  @ApiProperty({
    example: 'false',
    required: false,
    description:
      'Include deals archived in listing. By template, only deals not archived are displayed.',
  })
  @IsOptional()
  @IsString()
  isArchived?: string;

  @ApiProperty({
    example: 'a1b2c3d4-and5f6-7890-abcd-ef1234567890',
    required: false,
    description: 'Filter deals by ID of tag vinculada',
  })
  @IsOptional()
  @IsString()
  idTag?: string;
}
