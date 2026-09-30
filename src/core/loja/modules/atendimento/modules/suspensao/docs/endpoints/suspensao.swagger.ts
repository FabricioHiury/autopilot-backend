import { ApiProperty } from '@nestjs/swagger';

class UsuarioSuspensao {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'João Silva' })
  nome: string;

  @ApiProperty({ example: 'joao.silva@email.com' })
  email: string;

  @ApiProperty({ example: { arquivo: { url: 'https://example.com/avatar.jpg' } } })
  avatar?: { arquivo: { url: string } };
}

class SuspensaoData {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idUsuario: string;

  @ApiProperty({ example: 'Usuário em período de férias' })
  descricao: string;

  @ApiProperty({ example: '2024-06-01T00:00:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: '2024-06-15T23:59:59.000Z' })
  endDate: Date;

  @ApiProperty({ example: '2024-05-25T12:00:00.000Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-05-25T12:00:00.000Z' })
  atualizadoEm: Date;

  @ApiProperty({ type: UsuarioSuspensao })
  usuario: UsuarioSuspensao;
}

class Meta {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 3 })
  pages: number;
}

export class SuspensaoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: SuspensaoData })
  data: SuspensaoData;
}

export class ListarSuspensoesSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: [SuspensaoData] })
  data: SuspensaoData[];

  @ApiProperty({ type: Meta })
  meta: Meta;
}

export class RemoverSuspensaoSucesso {
  @ApiProperty({ example: 'Suspensão removida com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class VerificarSuspensaoSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: { suspenso: true } })
  data: { suspenso: boolean };
} 