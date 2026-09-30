import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListarMensagensPadroesDto {
  @ApiProperty({
    description: 'Termo de pesquisa para filtrar mensagens',
    example: 'saudação',
    required: false,
  })
  @IsString()
  @IsOptional()
  pesquisa?: string;

  @ApiProperty({
    description: 'Número da página',
    example: '1',
    required: false,
    default: '1',
  })
  @IsString()
  @IsOptional()
  pagina?: string;

  @ApiProperty({
    description: 'Quantidade de itens por página',
    example: '10',
    required: false,
    default: '10',
  })
  @IsString()
  @IsOptional()
  itensPorPagina?: string;
}
