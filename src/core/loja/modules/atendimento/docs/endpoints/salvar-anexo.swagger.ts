import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class SalvarAnexoAtendimentoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: HttpStatus.CREATED })
  statusCode: number;

  @ApiProperty({ type: String, example: 'https://anexo.com' })
  data: string;
}
