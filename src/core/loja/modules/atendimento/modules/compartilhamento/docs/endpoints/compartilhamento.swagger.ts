import { ApiProperty } from '@nestjs/swagger';

class ColaboradorCompartilhamento {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  nome: string;

  @ApiProperty({ example: '5511999999999' })
  whatsapp: string;
}

class CompartilhamentoData {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idAtendimento: string;

  @ApiProperty({ example: 1 })
  idColaborador: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 1 })
  compartilhadoPor: string;

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  atualizadoEm: Date;

  @ApiProperty({ type: ColaboradorCompartilhamento })
  colaborador: ColaboradorCompartilhamento;
}

export class CompartilhamentoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: CompartilhamentoData })
  data: CompartilhamentoData;
}

export class ListarCompartilhamentosSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: [CompartilhamentoData] })
  data: CompartilhamentoData[];
}

export class RemoverCompartilhamentoSucesso {
  @ApiProperty({ example: 'Compartilhamento removido com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
