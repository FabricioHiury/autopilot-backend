import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { AssinanteComLoja } from './listar-assinantes';

export class DesativarAssinaturaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: AssinanteComLoja })
  data: AssinanteComLoja;
}
