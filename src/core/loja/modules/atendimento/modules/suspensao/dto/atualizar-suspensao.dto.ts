import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class AtualizarSuspensaoDto {
  @ApiProperty({
    description: 'ID do usuário que está suspenso',
    example: 1,
  })
  @IsOptional()
  idUsuario?: string;

  @ApiProperty({
    description: 'Descrição do motivo da suspensão',
    example: 'Usuário em período de férias',
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({
    description: 'Data e hora de início da suspensão',
    example: '2023-10-30T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Data e hora de fim da suspensão',
    example: '2023-11-05T18:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
} 