import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ToISO8601 } from 'src/utils/transformers/toISO8601.transformer';

export class CriarTarefaDto {
  @ApiProperty({ example: 'Nova Tarefa' })
  @IsNotEmpty()
  @IsString()
  nome: string;

  @ApiProperty({ example: 'Observacoes' })
  @IsOptional()
  @IsString()
  observacoes: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsString()
  idResponsavel: string;

  @ApiProperty({ example: '09:00', required: false })
  @IsNotEmpty()
  @IsOptional()
  horaInicio: string;

  @ApiProperty({ example: '10:00', required: false })
  @IsNotEmpty()
  @IsOptional()
  horaFim: string;

  @ApiProperty({ example: '2024-10-21' })
  @IsNotEmpty()
  @IsDateString()
  @ToISO8601()
  data: Date;
}
