import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';
import { ListarLojaSaidaDto } from '../../dto/response/loja.response';

export class ListarLojaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty({ type: ListarLojaSaidaDto })
  data: ListarLojaSaidaDto;
}
