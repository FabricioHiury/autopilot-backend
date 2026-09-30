import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CriarSuspensaoDto {
  @ApiProperty({
    description: 'ID do usuário que será suspenso',
    example: 1,
  })
  @IsNotEmpty()
  idUsuario: string;

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
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Data e hora de fim da suspensão',
    example: '2023-11-05T18:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
} 