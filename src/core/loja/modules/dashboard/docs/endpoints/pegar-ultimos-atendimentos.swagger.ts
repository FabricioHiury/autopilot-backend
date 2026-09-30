import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

class Colaborador {
  @ApiProperty({ example: 3 })
  id: string;

  @ApiProperty({ example: 'José' })
  nome: string;

  @ApiProperty({ example: 1, nullable: true })
  idFoto: string;
}

export class Atendimento {
  @ApiProperty({ example: 5 })
  id: string;

  @ApiProperty({ example: 'redesSociais' })
  plataforma: string;

  @ApiProperty({ example: 'sucesso' })
  status: string;

  @ApiProperty({ example: '2024-10-01T15:36:16.877Z' })
  criadoEm: string;

  @ApiProperty({ type: Colaborador })
  colaborador: Colaborador;
}

class PegarUltimosAtendimentosResponse {
  @ApiProperty({ example: 'compra' })
  modo: 'compra' | 'venda';

  @ApiProperty({ type: [Atendimento] })
  atendimentos: Atendimento[];
}

export class PegarUltimosAtendimentosSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string = 'Operação realizada com sucesso';

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number = HttpStatus.OK;

  @ApiProperty({ type: PegarUltimosAtendimentosResponse })
  data: PegarUltimosAtendimentosResponse;
}
