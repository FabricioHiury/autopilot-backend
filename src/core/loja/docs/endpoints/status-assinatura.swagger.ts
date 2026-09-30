import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class StatusAssinaturaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({ type: Boolean })
  data: boolean;
}
