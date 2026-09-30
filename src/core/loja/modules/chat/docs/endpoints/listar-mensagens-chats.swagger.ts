import { ApiProperty } from '@nestjs/swagger';

class Mensagem {
  @ApiProperty({ example: 1 })
  id: string;

  @ApiProperty({ example: null, nullable: true })
  idUsuario: string | null;

  @ApiProperty({ example: 1 })
  idChat: string;

  @ApiProperty({ example: '559571956924781' })
  idDestinatarioApiExterna: string;

  @ApiProperty({ example: null, nullable: true })
  idMensagemExterna: string | null;

  @ApiProperty({ example: null, nullable: true })
  urlAvatar: string | null;

  @ApiProperty({ example: null, nullable: true })
  anexoMensagem: string | null;

  @ApiProperty({ example: null, nullable: true })
  tipoAnexo: string | null;

  @ApiProperty({ example: 'cliente' })
  remetente: string;

  @ApiProperty({ example: 'oi' })
  conteudo: string;

  @ApiProperty({ example: 'instagram' })
  canal: string;

  @ApiProperty({ example: '2024-12-05T20:18:03.891Z' })
  criadoEm: Date;
}

class DadosListarChats {
  @ApiProperty({ type: [Mensagem] })
  mensagens: Mensagem[];

  @ApiProperty({ example: 1 })
  pagina: number;

  @ApiProperty({ example: 10 })
  quantidade: number;

  @ApiProperty({ example: 'instagram' })
  canal: string;
}

export class RespostaListarMensagensChatsSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: DadosListarChats })
  data: DadosListarChats;
}

export class RespostaListarMensagensChatsNotFound {
  @ApiProperty({ example: 'Nenhum chat foi encontrado.' })
  message: string;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
