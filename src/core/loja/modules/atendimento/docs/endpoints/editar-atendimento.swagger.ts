import { ApiProperty } from '@nestjs/swagger';
import { AtendimentoSaida } from './criar-atendimento.swagger';

export class EditarAtendimentoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: AtendimentoSaida })
  data: AtendimentoSaida;
}
