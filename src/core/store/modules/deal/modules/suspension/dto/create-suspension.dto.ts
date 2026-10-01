import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSuspensionDto {
  @ApiProperty({
    description: 'ID of user that will be suspended',
    example: 1,
  })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Description of reason of suspension',
    example: 'User at period of vacation',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Data and hour of start of suspension',
    example: '2023-10-30T10:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Data and hour of end of suspension',
    example: '2023-11-05T18:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
