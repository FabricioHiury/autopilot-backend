import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function archiveChatDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Archive chat',
      description:
        'Arquiva a chat specific, removendo-o of list of chats active',
    }),
    ApiParam({
      name: 'chatId',
      description: 'ID of chat a be archived',
      type: 'string',
      example: '123and4567-and89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Chat archived with success',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID of chat',
            example: '123and4567-and89b-12d3-a456-426614174000',
          },
          archived: {
            type: 'boolean',
            description: 'Status of archiving',
            example: true,
          },
          nameCustomer: {
            type: 'string',
            description: 'Name of customer',
            example: 'João Silva',
          },
          channel: {
            type: 'string',
            description: 'Channel of communication',
            example: 'whatsapp',
          },
          status: {
            type: 'string',
            description: 'Status of operation',
            example: 'archived',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Chat not found',
    }),
    ApiResponse({
      status: 500,
      description: 'Error internal of servidor',
    }),
  );
}

export function unarchiveChatDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Unarchive chat',
      description:
        'Desarquiva a chat specific, returning-o for a list of chats active',
    }),
    ApiParam({
      name: 'chatId',
      description: 'ID of chat a be unarchived',
      type: 'string',
      example: '123and4567-and89b-12d3-a456-426614174000',
    }),
    ApiResponse({
      status: 200,
      description: 'Chat unarchived with success',
      schema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID of chat',
            example: '123and4567-and89b-12d3-a456-426614174000',
          },
          archived: {
            type: 'boolean',
            description: 'Status of archiving',
            example: false,
          },
          nameCustomer: {
            type: 'string',
            description: 'Name of customer',
            example: 'João Silva',
          },
          channel: {
            type: 'string',
            description: 'Channel of communication',
            example: 'whatsapp',
          },
          status: {
            type: 'string',
            description: 'Status of operation',
            example: 'unarchived',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Chat not found',
    }),
    ApiResponse({
      status: 500,
      description: 'Error internal of servidor',
    }),
  );
}
