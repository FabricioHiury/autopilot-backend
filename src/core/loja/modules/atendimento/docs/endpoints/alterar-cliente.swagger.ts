import { ApiProperty } from '@nestjs/swagger';
import { AtendimentoSaida } from './criar-atendimento.swagger';

export class AlterarClienteAtendimentoSucesso {
  @ApiProperty({ example: 'Cliente alterado com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: AtendimentoSaida })
  data: AtendimentoSaida;
}
