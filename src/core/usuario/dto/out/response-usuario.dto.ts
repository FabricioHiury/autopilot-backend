import { ApiProperty } from '@nestjs/swagger';

export class UsuarioResponseDto {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'mail@mail.com' })
  email: string;

  @ApiProperty({ example: 'ativo' })
  status: string;

  @ApiProperty({ example: 'usuario' })
  perfil: string;

  @ApiProperty({ example: 'Fulano de Tal' })
  nome: string;

  @ApiProperty({ example: '2021-09-09T00:00:00.000Z' })
  dataCriacao: Date;

  @ApiProperty({ example: '2021-09-09T00:00:00.000Z' })
  dataAtualizacao: Date;
}

export class ResponseDefaultUsuarioDto {
    @ApiProperty({ example: 'Mensagem de sucesso.'})
    message: string;

    @ApiProperty({ example: 200})
    statusCode: number;

    @ApiProperty({ example: UsuarioResponseDto })
    data: UsuarioResponseDto
}

export class ListaDeUsuarioDto {

    @ApiProperty({example: 10})
    total: number;

    @ApiProperty({example: 1})
    pagina: number;

    @ApiProperty({example: 1})
    totalPaginas: number;

    @ApiProperty({example: 'São Paulo'})
    pesquisa: string;

    @ApiProperty({example: 'todos'})
    status: string;

    @ApiProperty({ type: [UsuarioResponseDto] })
    usuarios: UsuarioResponseDto[]
}

export class ResponseListarUsuarioDto {
    @ApiProperty({ example: 'Operação realizada com sucesso.'})
    readonly message: string;

    @ApiProperty({ example: 200})
    readonly statusCode: number;

    @ApiProperty({ type: ListaDeUsuarioDto })
    readonly data: ListaDeUsuarioDto
}