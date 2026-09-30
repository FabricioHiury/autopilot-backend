import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { PegarTarefaSaidaDto } from './pegar-terefa.swagger';

export class EditarTarefaSaidaDto extends PegarTarefaSaidaDto {}

export class EditarTarefaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: EditarTarefaSaidaDto;
}

export class EditarTarefaNotFound {
  @ApiProperty({ example: 'Nenhuma tarefa com este ID foi encontrada' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
