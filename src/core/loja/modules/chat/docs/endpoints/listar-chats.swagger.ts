import { ApiProperty } from '@nestjs/swagger';

class Colaborador {
  @ApiProperty({ example: 1 })
  idUsuario: string;

  @ApiProperty({ example: 'Nome do Colaborador' })
  nome: string;
}

class AtendimentoResponsavel {
  @ApiProperty({ type: Colaborador })
  colaborador: Colaborador;
}

class Atendimento {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 'status' })
  status: string;

  @ApiProperty({ type: [AtendimentoResponsavel] })
  atendimentoResponsaveis: AtendimentoResponsavel[];
}

class ClienteTemporario {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: null, nullable: true })
  idAtendimento: string | null;

  @ApiProperty({ example: null, nullable: true })
  avatar: string | null;

  @ApiProperty({ example: null, nullable: true })
  nome: string | null;

  @ApiProperty({ example: null, nullable: true })
  email: string | null;

  @ApiProperty({ example: null, nullable: true })
  whatsapp: string | null;

  @ApiProperty({ example: 'instagram' })
  canal: string;

  @ApiProperty({ example: '559571956924781' })
  idContatoApiExterna: string;

  @ApiProperty({ example: '2024-12-05T20:18:03.639Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-12-05T20:18:03.639Z' })
  atualizadoEm: Date;
}

class Chat {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: 1 })
  idLoja: string;

  @ApiProperty({ example: null, nullable: true })
  idCliente: string | null;

  @ApiProperty({ example: 1 })
  idClienteTemporario: string;

  @ApiProperty({ example: null, nullable: true })
  idAtendimento: string | null;

  @ApiProperty({ example: '559571956924781' })
  idDestinatarioApiExterna: string;

  @ApiProperty({ example: 'instagram' })
  canal: string;

  @ApiProperty({ example: '2024-12-05T20:18:03.820Z' })
  criadoEm: Date;

  @ApiProperty({ example: '2024-12-05T20:18:03.820Z' })
  atualizadoEm: Date;

  @ApiProperty({ type: ClienteTemporario, nullable: true })
  clienteTemporario: ClienteTemporario | null;

  @ApiProperty({ example: null, nullable: true })
  cliente: any | null;

  @ApiProperty({ type: Atendimento, nullable: true })
  atendimento: Atendimento | null;
}

class DadosListarChats {
  @ApiProperty({ type: [Chat] })
  chats: Chat[];

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  quantidade: number;
}

export class RespostaListarChatsSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: DadosListarChats })
  data: DadosListarChats;
}

export class RespostaListarChatsNotFound {
  @ApiProperty({ example: 'Nenhum chat encontrado.' })
  message: string;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
