import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { ListarNotificacaoResonseDto } from '../../dto/response/notificacoes.dto';

export class AlterarStatusSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
