import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class LojaSimples {
  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 'Carros Corp.' })
  nomeEmpresa: string;

  @ApiProperty({ example: '999999999999999999' })
  cnpj: string;

  @ApiProperty({ example: 'https://img.com' })
  avatarUrl: string;
}

class AssinaturaSimples {
  @ApiProperty({ example: 3 })
  idAssinatura: string;

  @ApiProperty({ example: 'premium' })
  plano: string;

  @ApiProperty({ example: 'ativo' })
  status: string;

  @ApiProperty({ example: '2024-11-12T00:00:00.000Z' })
  dataAquisicao: string;

  @ApiProperty({ type: () => LojaSimples })
  loja: LojaSimples;
}

class PlanoComAssinaturas {
  @ApiProperty({ example: 'premium' })
  plano: string;

  @ApiProperty({ type: [AssinaturaSimples] })
  assinaturas: AssinaturaSimples[];
}

class PlanosSaida {
  @ApiProperty({ type: [PlanoComAssinaturas] })
  planos: PlanoComAssinaturas[];
}

export class ObterUltimasAssinaturasSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: PlanosSaida })
  data: PlanosSaida;
}
