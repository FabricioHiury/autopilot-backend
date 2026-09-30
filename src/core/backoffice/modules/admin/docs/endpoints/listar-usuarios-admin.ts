import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { SaidaUsuarioAdmin } from './criar-usuario-admin';

class ListarUsuariosAdminSaida {
  @ApiProperty({ example: 10 })
  pagina: number;

  @ApiProperty({ example: 6 })
  itensPorPagina: number;

  @ApiProperty({ example: 20 })
  totalPaginas: number;

  @ApiProperty({ example: 'João da Silva' })
  pesquisa?: string;

  @ApiProperty({ example: 'ativo' })
  status?: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z' })
  dataInicial?: string;

  @ApiProperty({ example: '2024-09-30T23:59:59Z' })
  dataFinal?: string;

  @ApiProperty({ type: [SaidaUsuarioAdmin] })
  usuarios: SaidaUsuarioAdmin[];
}

export class ListarUsuariosAdminSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: ListarUsuariosAdminSaida })
  data: ListarUsuariosAdminSaida;
}
