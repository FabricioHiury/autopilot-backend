import { ApiProperty } from '@nestjs/swagger';

class MensagemEnviada {
  @ApiProperty({ example: 47 })
  id: string;

  @ApiProperty({ example: 1 })
  idUsuario: string;

  @ApiProperty({ example: 18 })
  idChat: string;

  @ApiProperty({ example: '8743894685696123' })
  idDestinatarioApiExterna: string;

  @ApiProperty({ example: null, nullable: true })
  idMensagemExterna: string | null;

  @ApiProperty({ example: null, nullable: true })
  urlAvatar: string | null;

  @ApiProperty({ example: '', nullable: true })
  anexoMensagem: string | null;

  @ApiProperty({ example: null, nullable: true })
  tipoAnexo: string | null;

  @ApiProperty({ example: 'loja' })
  remetente: string;

  @ApiProperty({ example: 'mensagem' })
  conteudo: string;

  @ApiProperty({ example: 'facebook' })
  canal: string;

  @ApiProperty({ example: '2024-12-06T18:07:13.795Z' })
  criadoEm: Date;
}

export class RespostaEnviarMensagemSucesso {
  @ApiProperty({ example: 'Operação realizada com sucesso.' })
  message: string;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ type: MensagemEnviada })
  data: MensagemEnviada;
}

export class RespostaEnviarMensagemBadRequest {
  @ApiProperty({ example: 'Erro ao enviar mensagem.' })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({})
  data: {};
}
