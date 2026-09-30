import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsString } from 'class-validator';

export class FiltroPaginaPesquisaDto {
  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina?: string;

  @ApiProperty({ example: '8', default: '6', required: false })
  @IsOptional()
  @IsNumberString()
  itensPorPagina?: string;

  @ApiProperty({ example: 'FastCar Inc.', required: false })
  @IsString()
  @IsOptional()
  pesquisa?: string;
}
