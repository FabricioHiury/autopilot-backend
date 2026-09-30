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
import { MODO_ATENDIMENTO, STATUS_ATENDIMENTO } from 'src/utils/enum/atendimento.enum';
import { ToISO8601 } from 'src/utils/transformers/toISO8601.transformer';

export class FiltroAtendimentoDto {
  @ApiProperty({
    example: 'Nome do cliente',
    required: false,
    description:
      'Pesquisa por titulo do atendimento ou nome e email do cliente',
  })
  @IsOptional()
  @IsString()
  pesquisa?: string;

  @IsOptional()
  @Matches(/^([a-f0-9-]+,)*[a-f0-9-]+$/i, {
    message: 'O campo deve ser uma lista de ids separados por vírgula',
  })
  colaboradorIds?: string;

  @ApiProperty({ example: 'compra', required: false })
  @IsOptional()
  @IsEnum(MODO_ATENDIMENTO)
  modoAtendimento?: MODO_ATENDIMENTO;

  @ApiProperty({
    example: STATUS_ATENDIMENTO.SUCESSO,
    enum: STATUS_ATENDIMENTO,
    required: false,
  })
  @IsOptional()
  @IsEnum(STATUS_ATENDIMENTO)
  status?: string;

  @ApiProperty({ example: 'instagram', required: false })
  @IsOptional()
  @Matches(/^(\w+,)*\w+$/, {
    message: 'O campo deve ser uma lista de origens separadas por vírgula',
  })
  origem?: string;

  @ApiProperty({
    example: '2024-06-17',
    required: false,
  })
  @IsString()
  @IsDateString()
  @IsOptional()
  @ToISO8601()
  dataInicial: Date;

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
  pagina?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsNumberString()
  itensPagina?: string;

  @ApiProperty({ example: 'criadoEm', required: false })
  @IsOptional()
  @IsIn(['criadoEm', 'atualizadoEm', 'status'])
  orderBy?: string;

  @ApiProperty({ example: 'asc', required: false })
  @IsOptional()
  @IsIn(['asc', 'desc', 'status'])
  orderDirection?: string;

  @IsOptional()
  @IsString()
  tarefasAtribuidas?: string;

  @ApiProperty({ 
    example: 'false', 
    required: false,
    description: 'Incluir atendimentos arquivados na listagem. Por padrão, apenas atendimentos não arquivados são exibidos.'
  })
  @IsOptional()
  @IsString()
  isArchived?: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    required: false,
    description: 'Filtrar atendimentos por ID da tag vinculada'
  })
  @IsOptional()
  @IsString()
  idTag?: string;
}
