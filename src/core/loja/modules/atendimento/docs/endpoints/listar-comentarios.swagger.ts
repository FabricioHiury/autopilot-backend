import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

class UsuarioComentario {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: null, nullable: true })
  nome: string;

  @ApiProperty({ example: null, nullable: true })
  idFoto: string;
}

class ComentarioSaida {
  @ApiProperty({ example: 3 })
  id: string;

  @ApiProperty({ example: 'Comentário de teste' })
  comentario: string;

  @ApiProperty({ example: '2024-12-16T22:39:59.099Z' })
  criadoEm: Date;

  @ApiProperty({ type: () => UsuarioComentario })
  usuario: UsuarioComentario;
}

class ListarComentariosSaida {
  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  itensPagina: number;

  @ApiProperty({ type: () => [ComentarioSaida] })
  comentarios: ComentarioSaida[];
}

export class ListarComentariosSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: () => ListarComentariosSaida })
  data: ListarComentariosSaida;
}

export class ListarComentariosNotFound {
  @ApiProperty({ example: 'Atendimento não encontrado.' })
  message: string;

  @ApiProperty({ example: HttpStatus.NOT_FOUND })
  statusCode: number;
}
