import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CriarTarefaSaidaDto } from './criar-tarefa.swagger';

export class AlterarStatusTarefaSaidaDto extends CriarTarefaSaidaDto {}

export class AlterarStatusTarefaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: AlterarStatusTarefaSaidaDto;
}

export class AlterarStatusTarefaNotFound {
  @ApiProperty({
    example: 'Nenhuma tarefa com este ID foi encontrada',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}

export class AlterarStatusTarefaConflict {
  @ApiProperty({
    example: 'A tarefa com este id já foi concluída',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.CONFLICT] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
