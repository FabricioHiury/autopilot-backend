import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class ItemHistorico {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 'Atendimento iniciado' })
  tipoEvento: string;

  @ApiProperty({ example: 'Fulano iniciou um atendimento' })
  descricao: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  criadoEm?: string;
}

class ListarHistoricoLojaSaida {
  @ApiProperty({ example: 10 })
  pagina: number;

  @ApiProperty({ example: 6 })
  itensPorPagina: number;

  @ApiProperty({ example: 20 })
  totalPaginas: number;

  @ApiProperty({ example: 'João da Silva' })
  pesquisa?: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  dataInicial?: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z' })
  dataFinal?: string;
}

export class ListarHistoricoLojaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ListarHistoricoLojaSaida })
  data: ListarHistoricoLojaSaida;
}
