import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EnviarMensagemDto } from '../dto/mensagem.dto';
import { RespostaEnviarMensagemSucesso } from './endpoints/enviar-mensagem.swagger';
import { RespostaListarMensagensChatsNotFound } from './endpoints/listar-mensagens-chats.swagger';
import {
  RespostaListarChatsNotFound,
  RespostaListarChatsSucesso,
} from './endpoints/listar-chats.swagger';
import { AlterarAtendimentoChatSucesso } from './endpoints/alterar-atendimento.swagger';

export function enviarMensagemDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Enviar mensagem',
      description: 'Envia uma mensagem para o chat',
    }),

    ApiBody({ type: EnviarMensagemDto }),

    ApiResponse({
      status: 200,
      type: RespostaEnviarMensagemSucesso,
    }),

    ApiResponse({
      status: 400,
    }),
  );
}

export function listarMensagensChatDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar mensagens de um chat',
      description: 'Lista todas as mensagens de um chat',
    }),

    ApiResponse({
      status: 200,
      type: RespostaEnviarMensagemSucesso,
    }),

    ApiResponse({
      status: 404,
      type: RespostaListarMensagensChatsNotFound,
    }),
  );
}

export function listarChatsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar chats',
      description: 'Lista todos os chats',
    }),

    ApiResponse({
      status: 200,
      type: RespostaListarChatsSucesso,
    }),

    ApiResponse({
      status: 404,
      type: RespostaListarChatsNotFound,
    }),
  );
}

const description = 'Necessário token de autenticação.';

export function alterarAtendimentoChatDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Altera o atendimento vinculado ao chat',
      description: description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: AlterarAtendimentoChatSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}
