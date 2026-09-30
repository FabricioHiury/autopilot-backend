import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class ListarComentariosDto {
  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsNumberString()
  itensPagina?: string;
}
