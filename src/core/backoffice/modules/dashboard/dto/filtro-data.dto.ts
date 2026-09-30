import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class FiltroDataDto {
  @ApiProperty({ example: '2024-09-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}
