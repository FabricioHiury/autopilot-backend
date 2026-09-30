import { ApiProperty } from '@nestjs/swagger';

export class ComentarioSaida {
  @ApiProperty({ example: 3 })
  id: string;

  @ApiProperty({ example: 1 })
  idAtendimento: string;

  @ApiProperty({ example: 1 })
  idUsuario: string;

  @ApiProperty({ example: 'Comentário de teste' })
  comentario: string;

  @ApiProperty({ example: '2024-12-16T22:39:59.099Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-12-16T22:39:59.099Z' })
  atualizadoEm: Date;
}

export class CriarComentarioAtendimentoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ type: ComentarioSaida })
  data: ComentarioSaida;
}
