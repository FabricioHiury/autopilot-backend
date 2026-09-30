import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SaidaLojaAdmin {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Carros Corp.' })
  nomeEmpresa: string;

  @ApiProperty({ example: '99999999999999/9999' })
  cnpj: string;

  @ApiProperty({ example: false })
  wppConfigurado: boolean;

  @ApiProperty({ example: '2024-12-06T14:43:54.937Z' })
  criadoEm: string;

  @ApiProperty({ example: 'lojista@email.com' })
  email: string;

  @ApiProperty({ example: 'http://localhost:3003/avatar/usuario/1' })
  avatarUrl: string;
}

class ListarLojasAdminSaida {
  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  itensPorPagina: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  @ApiPropertyOptional({ example: '', nullable: true })
  pesquisa?: string;

  @ApiPropertyOptional({ example: 'false', nullable: true })
  wppConfigurado?: string;

  @ApiProperty({ type: [SaidaLojaAdmin] })
  lojas: SaidaLojaAdmin[];
}

export class ListarLojasAdminSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: ListarLojasAdminSaida })
  data: ListarLojasAdminSaida;
}
