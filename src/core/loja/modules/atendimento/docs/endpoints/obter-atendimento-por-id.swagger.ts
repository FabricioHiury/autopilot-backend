import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ORIGEM_ATENDIMENTO,
  STATUS_ATENDIMENTO,
} from 'src/utils/enum/atendimento.enum';

class ClienteComAvatar {
  @ApiProperty({ example: 6 })
  id: string;

  @ApiProperty({ example: '9999999999' })
  whatsapp: string;

  @ApiProperty({ example: 'email@email.co,' })
  email: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3003/avatar/usuario/3',
    nullable: true,
  })
  urlAvatar?: string;
}

class ClienteTemporario {
  @ApiProperty({ example: 6 })
  id: string;

  @ApiProperty({ example: '9999999999' })
  whatsapp: string;

  @ApiProperty({ example: 'email@email.co,' })
  email: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3003/avatar/usuario/3',
    nullable: true,
  })
  avatar?: string;
}

class ResponsavelComCargos {
  @ApiProperty({ example: 2 })
  idColaborador: string;

  @ApiProperty({ example: 'João Silva' })
  nome: string;

  @ApiProperty({ example: 'http://localhost:3003/avatar/usuario/3' })
  avatarUrl: string;

  @ApiProperty({ example: '' })
  cargos: string;
}

class ComentarioComUsuario {
  @ApiProperty({ example: 1 })
  idComentario: string;

  @ApiProperty({ example: 2 })
  idUsuario: string;

  @ApiProperty({ example: 'José Carlos' })
  usuario: string;

  @ApiProperty({ example: 'http://localhost:3003/avatar/usuario/2' })
  urlAvatar: string;

  @ApiProperty({ example: '2024-12-17T15:17:48.969Z' })
  data: string;
}

class TarefaComUsuario {
  @ApiProperty({ example: 3 })
  idTarefa: string;

  @ApiProperty({ example: '' })
  observacoes: string;

  @ApiProperty({ example: 'teste' })
  nome: string;

  @ApiProperty({ example: '1970-01-01T00:00:00.000Z' })
  data: string;

  @ApiProperty({ example: '15:00' })
  horaInicio: string;

  @ApiProperty({ example: '21:00' })
  horaFim: string;

  @ApiProperty({ example: false })
  concluida: boolean;

  @ApiProperty({ example: '2024-12-17T15:16:05.755Z' })
  criadoEm: string;

  @ApiProperty({ example: 'Maria Teixeira' })
  nomeResponsavel: string;

  @ApiProperty({ example: 'http://localhost:3003/avatar/usuario/2' })
  avatarResponsavel: string;
}

export class AtendimentoDetalhadoSaida {
  @ApiProperty({ example: 6 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiPropertyOptional({ example: 1, nullable: true })
  idCliente?: string;

  @ApiPropertyOptional({ example: 6, nullable: true })
  idClienteTemporario?: string;

  @ApiProperty({ example: ORIGEM_ATENDIMENTO.FACEBOOK })
  origemAtendimento: string;

  @ApiProperty({ example: 'frio' })
  temperatura: string;

  @ApiPropertyOptional({ example: 'venda', nullable: true })
  modoAtendimento?: string;

  @ApiProperty({ example: STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL })
  status: string;

  @ApiProperty({ example: 'Atendimento teste 1' })
  titulo: string;

  @ApiProperty({ example: 'Teste aaa' })
  descricaoAtendimento: string;

  @ApiPropertyOptional({
    example: 'Esse é uma observacao de teste',
    nullable: true,
  })
  observacao?: string;

  @ApiProperty({ example: '2024-12-16T13:52:31.689Z' })
  criadoEm: string;

  @ApiProperty({ example: '2024-12-16T17:00:44.595Z' })
  atualizadoEm: string;

  @ApiPropertyOptional({ type: ClienteComAvatar, nullable: true })
  cliente?: ClienteComAvatar;

  @ApiPropertyOptional({ type: ClienteTemporario, nullable: true })
  clienteTemporario?: ClienteTemporario;

  @ApiProperty({ type: [ResponsavelComCargos] })
  responsaveis: ResponsavelComCargos[];

  @ApiProperty({ type: [ComentarioComUsuario] })
  comentarios: ComentarioComUsuario[];

  @ApiProperty({ type: [TarefaComUsuario] })
  tarefas: TarefaComUsuario[];
}

export class ObterAtendimentoPorIdSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: HttpStatus.OK })
  statusCode: number;

  @ApiProperty({ type: AtendimentoDetalhadoSaida })
  data: AtendimentoDetalhadoSaida;
}
