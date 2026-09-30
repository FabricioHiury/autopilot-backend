import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { FILTRO_DATA } from '../../../enum/filtro-data.enum';
import { ApiProperty } from '@nestjs/swagger';

export class PegarOrigemAtendimentosDto {
  @ApiProperty({ example: 'mensal', required: false, enum: FILTRO_DATA })
  @IsOptional()
  @IsEnum(FILTRO_DATA)
  agrupamento: FILTRO_DATA;

  @ApiProperty({ example: '2024-11-27', required: false })
  @IsOptional()
  @IsDateString()
  dataInicio: Date;

  @ApiProperty({ example: '2024-11-27', required: false })
  @IsOptional()
  @IsDateString()
  dataFim: Date;
}
