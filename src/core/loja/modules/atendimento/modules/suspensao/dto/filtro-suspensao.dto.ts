import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumberString, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FiltroSuspensaoDto {
  @ApiProperty({
    description: 'Página atual',
    example: '1',
    required: false,
  })
  @IsNumberString()
  @IsOptional()
  pagina?: string = '1';

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: '10',
    required: false,
  })
  @IsNumberString()
  @IsOptional()
  itensPagina?: string = '10';

  @ApiProperty({
    description: 'ID do usuário suspenso',
    example: 1,
    required: false,
  })
  @IsOptional()
  idUsuario?: string;

  @ApiProperty({
    description: 'Filtrar por parte da descrição',
    example: 'férias',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({
    description: 'Filtrar por data de início a partir de',
    example: '2023-10-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDateInicio?: string;

  @ApiProperty({
    description: 'Filtrar por data de início até',
    example: '2023-10-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDateFim?: string;

  @ApiProperty({
    description: 'Filtrar suspensões ativas na data atual',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  ativas?: boolean;
} 