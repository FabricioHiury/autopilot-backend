import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class CriarTarefaSaidaDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idAtendimento: string;

  @ApiProperty({ example: 1 })
  @ApiProperty({ example: 'Observacoes' })
  observacoes: string;

  @ApiProperty({ example: 'Nome da tarefa' })
  nome: string;

  @ApiProperty({ example: '2000-12-20T00:00:00.000Z' })
  data: string;

  @ApiProperty({ example: '11:00' })
  horaInicio: string;

  @ApiProperty({ example: '10:00' })
  horaFim: string;

  @ApiProperty({ example: false })
  concluida: boolean;

  @ApiProperty({ example: '2000-12-20T00:00:00.000Z' })
  criadoEm: string;

  @ApiProperty({ example: '2000-12-20T00:00:00.000Z' })
  atualizadoEm: string;
}

export class CriarTarefaSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.OK] })
  statusCode: number;

  @ApiProperty()
  data: CriarTarefaSaidaDto;
}

export class CriarTarefaNotFound {
  @ApiProperty({ example: 'Nenhuma tarefa com este ID foi encontrada' })
  message: string;

  @ApiProperty({ examples: [HttpStatus.NOT_FOUND] })
  statusCode: number;

  @ApiProperty()
  data: {};
}
