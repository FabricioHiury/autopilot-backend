import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SendMessageDto } from '../dto/message.dto';
import { ReplySendMessageSuccess } from './endpoints/send-message.swagger';
import { ReplyListMessagesChatsNotFound } from './endpoints/list-messages-chats.swagger';
import {
  ReplyListChatsNotFound,
  ReplyListChatsSuccess,
} from './endpoints/list-chats.swagger';
import { UpdateDealChatSuccess } from './endpoints/update-deal.swagger';

export function sendMessageDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Send message',
      description: 'Sends a message for the chat',
    }),

    ApiBody({ type: SendMessageDto }),

    ApiResponse({
      status: 200,
      type: ReplySendMessageSuccess,
    }),

    ApiResponse({
      status: 400,
    }),
  );
}

export function listMessagesChatDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'List messages of a chat',
      description: 'List all the messages of a chat',
    }),

    ApiResponse({
      status: 200,
      type: ReplySendMessageSuccess,
    }),

    ApiResponse({
      status: 404,
      type: ReplyListMessagesChatsNotFound,
    }),
  );
}

export function listChatsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'List chats',
      description: 'List all the chats',
    }),

    ApiResponse({
      status: 200,
      type: ReplyListChatsSuccess,
    }),

    ApiResponse({
      status: 404,
      type: ReplyListChatsNotFound,
    }),
  );
}

const description = 'Requires token of authentication.';

export function updateDealChatDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Altera o deal linked to chat',
      description: description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: UpdateDealChatSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}
