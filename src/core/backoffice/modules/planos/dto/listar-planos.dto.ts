import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';

export class ListarPlanosDto {
  @ApiProperty({ example: '1', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina?: string;

  @ApiProperty({ example: '10', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  itensPorPagina?: string;

  @ApiProperty({ example: 'Premium', required: false })
  @IsOptional()
  @IsString()
  pesquisa?: string;

  @ApiProperty({ 
    example: 'ativo', 
    enum: ['ativo', 'inativo', 'todos'],
    required: false 
  })
  @IsOptional()
  @IsEnum(['ativo', 'inativo', 'todos'])
  status?: string;
}