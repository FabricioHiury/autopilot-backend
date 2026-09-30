import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class DeletarAnexoAtendimentoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
