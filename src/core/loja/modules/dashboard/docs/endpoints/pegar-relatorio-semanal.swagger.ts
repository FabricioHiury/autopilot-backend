import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class SucessoAtendimento {
  @ApiProperty({ example: 2 })
  quantidade: number;

  @ApiProperty({
    example: 100,
    description: 'Diferença percentual em relação à semana anterior.',
  })
  percentual: number;
}

class NovosAtendimentos {
  @ApiProperty({ example: 3 })
  quantidade: number;

  @ApiProperty({
    example: 50,
    description: 'Diferença percentual em relação à semana anterior.',
  })
  percentual: number;

  @ApiProperty()
  sucesso: SucessoAtendimento;
}

class VendedorDestaque {
  @ApiProperty({ example: 3 })
  id: string;

  @ApiProperty({ example: 1 })
  idFoto: string;

  @ApiProperty({ example: 'José' })
  nome: string;

  @ApiProperty({
    example: 2,
    description:
      'Quantidade de vendas (atendimentos com status sucesso) realizadas na semana.',
  })
  quantidadeVendas: number;

  @ApiProperty({
    example: 20,
    description: 'Diferença percentual em relação a equipe na semana.',
  })
  percentualVendasAcimaMedia: number;
}

class RelatorioSemanal {
  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 'Loja Exemplo' })
  nome: string;

  @ApiProperty({ example: 2 })
  novosVendedores: number;

  @ApiProperty()
  novosAtendimentos: NovosAtendimentos;

  @ApiProperty()
  vendedorDestaque: VendedorDestaque;
}

export class PegarRelatorioSemanalSaida {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty()
  data: RelatorioSemanal;
}
