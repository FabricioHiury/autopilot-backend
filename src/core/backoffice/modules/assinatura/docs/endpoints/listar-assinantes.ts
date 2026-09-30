import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class Loja {
  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 'Carros Corp.' })
  nomeEmpresa: string;

  @ApiProperty({ example: '99999999999999' })
  cnpj: string;

  @ApiProperty({ example: 'lojista@email.com' })
  email: string;

  @ApiProperty({ example: 'https://img.com' })
  avatarUrl?: string | null;

  @ApiProperty({ example: '2144444444' })
  telefone?: string | null;

  @ApiProperty({ example: '21999999999' })
  celular?: string | null;
}

export class AssinanteComLoja {
  @ApiProperty({ example: 1 })
  idAssinatura: string;

  @ApiProperty({ example: 'starter' })
  plano: string;

  @ApiProperty({ example: 3, description: 'Duração do plano em meses' })
  duracaoPlano: number;

  @ApiProperty({ example: 500, description: 'Valor do plano em reais' })
  valorPlano: string;

  @ApiProperty({ example: 'ativo' })
  status: string;

  @ApiProperty({ example: 'cartao' })
  formaPagamento: string;

  @ApiProperty({ example: '2024-12-11T00:00:00.000Z' })
  dataAquisicao: string;

  @ApiProperty({ example: '2025-01-10T00:00:00.000Z' })
  dataRenovacao: string;

  @ApiProperty({ example: '2025-01-10T00:00:00.000Z' })
  dataCancelamento?: string | null;

  @ApiProperty({ type: () => Loja })
  loja: Loja;
}

export class ListarAssinantesSaidaDto {
  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 6 })
  itensPorPagina: number;

  @ApiProperty({ example: 1 })
  totalPaginas: number;

  @ApiProperty({ example: 'starter' })
  plano: string;

  @ApiProperty({ example: 'Loja Z' })
  pesquisa: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  dataInicial: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z' })
  dataFinal: string;

  @ApiProperty({ type: [AssinanteComLoja] })
  assinantes: AssinanteComLoja[];
}

export class ListarAssinantesSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ListarAssinantesSaidaDto })
  data: ListarAssinantesSaidaDto;
}
