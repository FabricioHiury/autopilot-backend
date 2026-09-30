import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { CriarTarefaSaidaDto } from './criar-tarefa.swagger';

export class TarefaDaListaSaidaDto extends CriarTarefaSaidaDto {}

export class ListarTarefasSaidaDto {
  @ApiProperty({ type: [TarefaDaListaSaidaDto] })
  clientes: TarefaDaListaSaidaDto[];
}

export class ListarTarefasSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: ListarTarefasSaidaDto;
}

export class ListarTarefasNotFound {
  @ApiProperty({
    example: 'Nenhum atendimento com este ID foi encontrado',
  })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
