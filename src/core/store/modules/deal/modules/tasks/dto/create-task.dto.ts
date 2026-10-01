import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ToISO8601 } from 'src/utils/transformers/toISO8601.transformer';

export class CreateTaskDto {
  @ApiProperty({ example: 'New Task' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Notes' })
  @IsOptional()
  @IsString()
  notes: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsString()
  assigneeId: string;

  @ApiProperty({ example: '09:00', required: false })
  @IsNotEmpty()
  @IsOptional()
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
