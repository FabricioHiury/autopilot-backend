import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateSuspensionDto {
  @ApiProperty({
    description: 'ID of user that is suspended',
    example: 1,
  })
  @IsOptional()
  userId?: string;

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
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Data and hour of end of suspension',
    example: '2023-11-05T18:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
