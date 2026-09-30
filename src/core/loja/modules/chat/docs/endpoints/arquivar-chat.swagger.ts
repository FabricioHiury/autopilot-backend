import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function arquivarChatDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Arquivar chat',
      description: 'Arquiva um chat específico, removendo-o da lista de chats ativos',
    }),
    ApiParam({
      name: 'idChat',
      description: 'ID do chat a ser arquivado',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Chat arquivado com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID do chat',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          arquivado: {
            type: 'boolean',
            description: 'Status de arquivamento',
            example: true,
          },
          nomeCliente: {
            type: 'string',
            description: 'Nome do cliente',
            example: 'João Silva',
          },
          canal: {
            type: 'string',
            description: 'Canal de comunicação',
            example: 'whatsapp',
          },
          status: {
            type: 'string',
            description: 'Status da operação',
            example: 'arquivado',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Chat não encontrado',
    }),
    ApiResponse({
      status: 500,
      description: 'Erro interno do servidor',
    }),
  );
}

export function desarquivarChatDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Desarquivar chat',
      description: 'Desarquiva um chat específico, retornando-o para a lista de chats ativos',
    }),
    ApiParam({
      name: 'idChat',
      description: 'ID do chat a ser desarquivado',
      type: 'string',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Chat desarquivado com sucesso',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID do chat',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          arquivado: {
            type: 'boolean',
            description: 'Status de arquivamento',
            example: false,
          },
          nomeCliente: {
            type: 'string',
            description: 'Nome do cliente',
            example: 'João Silva',
          },
          canal: {
            type: 'string',
            description: 'Canal de comunicação',
            example: 'whatsapp',
          },
          status: {
            type: 'string',
            description: 'Status da operação',
            example: 'desarquivado',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Chat não encontrado',
    }),
    ApiResponse({
      status: 500,
      description: 'Erro interno do servidor',
    }),
  );
}