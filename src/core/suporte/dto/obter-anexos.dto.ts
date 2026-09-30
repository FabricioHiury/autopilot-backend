import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class ObterAnexosDto {
  @ApiProperty({ example: '1', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina?: string;

  @ApiProperty({ example: '10', default: '4', required: false })
  @IsOptional()
  @IsNumberString()
  itensPorPagina?: string;
}
