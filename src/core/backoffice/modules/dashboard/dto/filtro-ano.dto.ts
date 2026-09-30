import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class FiltroAnoDto {
  @ApiProperty({
    example: '2024-09-01T00:00:00Z',
    required: false,
    description: 'Ano a ser filtrado (Qualquer data dentro do ano informado)',
    default: 'Ano atual',
  })
  @IsOptional()
  @IsDateString()
  ano?: string;
}
