import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CriarTarefaSaidaDto } from './criar-tarefa.swagger';

export class PegarTarefaSaidaDto extends CriarTarefaSaidaDto {}

export class PegarTarefaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: PegarTarefaSaidaDto;
}

export class PegarTarefaNotFound {
  @ApiProperty({
    example: 'Nenhuma tarefa com este ID foi encontrada',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
