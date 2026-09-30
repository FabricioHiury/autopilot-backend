import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class ListarLojasAdminDto {
  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina: string;

  @ApiProperty({ example: '8', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  itensPorPagina: string;

  @ApiProperty({ example: 'Carros Corp.', required: false })
  @IsString()
  @IsOptional()
  pesquisa?: string;

  @ApiProperty({ example: 'false', required: false, enum: ['true', 'false'] })
  @IsString()
  @IsIn(['true', 'false'])
  @IsOptional()
  wppConfigurado?: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}
