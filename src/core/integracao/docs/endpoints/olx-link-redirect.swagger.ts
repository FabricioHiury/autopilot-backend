import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class OlxLinkRedirectSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({
    example:
      'https://autopilot-integracoes.um1vpc.easypanel.host/olx/auth/chave-acesso',
  })
  data: string;
}
