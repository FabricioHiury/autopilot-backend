import { ApiProperty } from '@nestjs/swagger';
import {
  MODO_ATENDIMENTO,
  ORIGEM_ATENDIMENTO,
  STATUS_ATENDIMENTO,
  TEMPERATURA_ATENDIMENTO,
} from 'src/utils/enum/atendimento.enum';

export class AtendimentoSaida {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 1 })
  idCliente: string;

  @ApiProperty({ example: 1, nullable: true })
  idClienteTemporario?: string;

  @ApiProperty({ example: ORIGEM_ATENDIMENTO.INSTAGRAM })
  origemAtendimento: string;

  @ApiProperty({ example: TEMPERATURA_ATENDIMENTO.MORNO })
  temperatura: string;

  @ApiProperty({ example: MODO_ATENDIMENTO.VENDA })
  modo: string;

  @ApiProperty({ example: STATUS_ATENDIMENTO.CHAT })
  status: string;

  @ApiProperty({ example: 'Observações...', nullable: true })
  observacao?: string;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-10-03T16:39:02.820Z' })
  atualizadoEm: Date;
}

export class CriarAtendimentoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: AtendimentoSaida })
  data: AtendimentoSaida;
}
