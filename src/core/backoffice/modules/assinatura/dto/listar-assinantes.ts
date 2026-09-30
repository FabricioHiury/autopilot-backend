import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { TIPOS_PLANO } from 'src/utils/enum/planos.enum';

export class ListarAssinantesDto {
  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina: string;

  @ApiProperty({ example: '8', default: '6', required: false })
  @IsOptional()
  @IsNumberString()
  itensPorPagina: string;

  @ApiProperty({ example: 'João da Silva', required: false })
  @IsString()
  @IsOptional()
  pesquisa?: string;

  @ApiProperty({ example: 'DF', required: false })
  @IsString()
  @IsOptional()
  estado?: string;

  @ApiProperty({ example: 'ativo', required: false })
  @IsString()
  @IsEnum(TIPOS_PLANO)
  @IsOptional()
  plano?: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}
