import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ToISO8601 } from 'src/utils/transformers/toISO8601.transformer';

export class CreateVisitDto {
  @ApiProperty({ example: 'Recebimento' })
  @IsNotEmpty()
  @IsString()
  type: string;

  @ApiProperty({ example: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: '09:00' })
  @IsNotEmpty()
  @IsString()
  hourStart: string;

  @ApiProperty({ example: '10:00', required: false })
  @IsNotEmpty()
  @IsOptional()
  hourEnd: string;

  @ApiProperty({ example: '2024-10-21' })
  @IsNotEmpty()
  @IsDateString()
  @ToISO8601()
  data: Date;
}
