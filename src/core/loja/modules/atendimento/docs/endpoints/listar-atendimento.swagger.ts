import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class ResponsavelAtendimento {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Colaborador da Silva' })
  nome: string;

  @ApiProperty({ example: '(00) 00000-0000' })
  whatsapp: string;
}

class AtendimentoSaida {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'Atendimento de teste' })
  titulo: string;

  @ApiProperty({ example: 'Descrição...' })
  descricaoAtendimento: string;

  @ApiProperty({ example: 'instagram' })
  origemAtendimento: string;

  @ApiProperty({ example: 'frio' })
  temperatura: string;

  @ApiProperty({ example: 'compra' })
  modoAtendimento: string;

  @ApiProperty({ example: 'atendimentoInicial' })
  status: string;

  @ApiProperty({ example: '2024-12-16T15:57:40.279Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-12-16T15:57:40.279Z' })
  atualizadoEm: Date;

  @ApiProperty({ example: null, nullable: true })
  cliente: any;

  @ApiProperty({ type: () => [ResponsavelAtendimento] })
  responsaveis: ResponsavelAtendimento[];
}

class ListarAtendimentosSaida {
  @ApiProperty({ example: '' })
  pesquisa: string;

  @ApiProperty({ example: '' })
  modoAtendimento: string;

  @ApiProperty({ example: '' })
  origem: string;

  @ApiProperty({ example: '' })
  colaboradorIds: string;

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  itensPagina: number;

  @ApiProperty({ type: () => [AtendimentoSaida] })
  atendimentos: AtendimentoSaida[];
}

export class ListarAtendimentosSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: () => ListarAtendimentosSaida })
  data: ListarAtendimentosSaida;
}

export class ListarAtendimentosNotFound {
  @ApiProperty({ example: 'Atendimento não encontrado.' })
  message: string;

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode: number;
}
