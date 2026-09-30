import { ApiProperty } from '@nestjs/swagger';

class CriarFaqResposta {
  @ApiProperty({ example: 71 })
  id: string;

  @ApiProperty({ example: 'Você tem problema na versão 2' })
  titulo: string;

  @ApiProperty({ example: 'voce-tem-problema-na-versao-2-16' })
  slug: string;

  @ApiProperty({ example: 'contas' })
  categoria: string;

  @ApiProperty({
    example: `Comprar um veículo é uma decisão importante que requer planejamento e pesquisa. Neste artigo, abordaremos os principais passos para ajudá-lo`,
  })
  conteudo: string;

  @ApiProperty({
    example: 'Comprar um veículo é uma decisão importante que requer...',
  })
  resumo: string;

  @ApiProperty({ example: 'publicado' })
  status: string;

  @ApiProperty({ example: 0 })
  views: number;

  @ApiProperty({ example: '2024-12-05T12:48:59.495Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-12-05T12:48:59.495Z' })
  atualizadoEm: Date;

  @ApiProperty({
    type: [Object],
    example: [{ nome: 'óleo' }, { nome: 'pão' }, { nome: 'banana' }],
  })
  tags: { nome: string }[];
}

export class CriarFaqSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({})
  data: CriarFaqResposta;
}

export class CriarFaqBadRequest {
  @ApiProperty({
    example: 'Erro ao criar Faq',
  })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty()
  data: {};
}
