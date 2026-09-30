import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContatoLojaSaida {
  @ApiProperty({ example: 2 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 'aaa' })
  nome: string;

  @ApiProperty({ example: '21999999999', nullable: true })
  celular: string;

  @ApiPropertyOptional({ example: '2144444444', nullable: true })
  telefone?: string;

  @ApiProperty({ example: 'loja@email.com' })
  email: string;

  @ApiPropertyOptional({ example: 'www.loja.com', nullable: true })
  site?: string;

  @ApiProperty({ example: '2024-12-17T19:47:33.178Z' })
  criadoEm: string;

  @ApiProperty({ example: '2024-12-17T19:47:50.770Z' })
  atualizadoEm: string;
}

export class CadastrarContatoLojaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ContatoLojaSaida })
  data: ContatoLojaSaida;
}
