import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class ListarColaboradoresDto {
  @ApiProperty({
    example: 'Colaborador da silva',
    default: '',
    required: false,
  })
  @IsOptional()
  pesquisa: string;

  @ApiProperty({
    example: 'Gerente',
    required: false,
  })
  @IsOptional()
  cargo: string;

  @ApiProperty({ example: '10', default: '1', required: false })
  @IsOptional()
  @IsNumberString()
  pagina: string;

  @ApiProperty({ example: '8', default: '10', required: false })
  @IsOptional()
  @IsNumberString()
  quantidade: string;
}
