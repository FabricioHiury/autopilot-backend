import { ApiProperty } from '@nestjs/swagger';

class AlterarAtendimentoChatSaida {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: 1, nullable: true })
  idAtendimento: string;

  @ApiProperty({ example: 1 })
  idCliente: string;

  @ApiProperty({ example: 'cliente' })
  tipoCliente: string;

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-03-19T12:00:00.000Z' })
  atualizadoEm: Date;
}

export class AlterarAtendimentoChatSucesso {
  @ApiProperty({ example: 'Atendimento alterado com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: AlterarAtendimentoChatSaida })
  data: AlterarAtendimentoChatSaida;
}
