import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  MODO_ATENDIMENTO,
  ORIGEM_ATENDIMENTO,
  STATUS_ATENDIMENTO,
  TEMPERATURA_ATENDIMENTO,
} from 'src/utils/enum/atendimento.enum';

export class CriarAtendimentoDto {
  @ApiProperty({ example: 'Atendimento de teste' })
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @ApiProperty({ example: 'Descrição...', required: false })
  @IsOptional()
  @IsString()
  descricaoAtendimento?: string;

  @ApiProperty({ example: 'Atendimento de teste', required: false })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty({
    example: ORIGEM_ATENDIMENTO.INSTAGRAM,
    enum: ORIGEM_ATENDIMENTO,
  })
  @IsNotEmpty()
  @IsEnum(ORIGEM_ATENDIMENTO)
  origemAtendimento: ORIGEM_ATENDIMENTO;

  @ApiProperty({
    example: TEMPERATURA_ATENDIMENTO.FRIO,
    enum: TEMPERATURA_ATENDIMENTO,
  })
  @IsNotEmpty()
  @IsEnum(TEMPERATURA_ATENDIMENTO)
  temperatura: TEMPERATURA_ATENDIMENTO;

  @ApiProperty({ example: MODO_ATENDIMENTO.COMPRA, enum: MODO_ATENDIMENTO })
  @IsNotEmpty()
  @IsEnum(MODO_ATENDIMENTO)
  modoAtendimento: MODO_ATENDIMENTO;

  @ApiProperty({ example: ['8681cf27-db80-4fdb-8446-82844110a627', '8681cf27-db80-4fdb-8446-82844110a627'], description: 'Array de inteiros' })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  idResponsaveis?: string[];

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsString()
  idCliente?: string;

  @ApiProperty({ example: 'José da Silva', required: false })
  @IsOptional()
  @IsString()
  nomeCompleto?: string;

  @ApiProperty({ example: 'jose@email.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: '11999999999', required: false })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsString()
  idChat?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  distribuicaoAutomatica?: boolean;

  @ApiProperty({
    example: STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
    enum: STATUS_ATENDIMENTO,
    required: false,
  })
  @IsOptional()
  @IsEnum(STATUS_ATENDIMENTO)
  status?: STATUS_ATENDIMENTO;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  atendimentoManual?: boolean;

  @ApiProperty({ 
    example: ['8681cf27-db80-4fdb-8446-82844110a627', '8681cf27-db80-4fdb-8446-82844110a628'], 
    description: 'Array de IDs das tags a serem vinculadas ao atendimento',
    required: false 
  })
  @IsArray()
  @IsOptional()
  @IsUUID(4, { each: true })
  idTags?: string[];
}
