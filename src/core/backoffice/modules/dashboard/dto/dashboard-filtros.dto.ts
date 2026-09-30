import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumberString,
  IsString,
  IsDateString,
} from 'class-validator';

export class DashboardFiltrosDto {
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

  @ApiProperty({ example: '2024-09-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}
