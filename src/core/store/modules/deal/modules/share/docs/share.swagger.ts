import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ShareSuccess,
  ListSharesSuccess,
  RemoveShareSuccess,
} from './endpoints/share.swagger';

const description = 'Requires token of authentication.';

export function createShareDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Compartilha a deal with a employee',
      description:
        'Requires token of authentication of storeOwner or of a of assignees by the deal.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ShareSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Deal or employee not found',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Not is possible share with yourself',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'You do not have permission for share this deal',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Deal already shared with this employee',
    }),
  );
}

export function listSharesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List shares of a deal',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ListSharesSuccess,
    }),
  );
}

export function removeShareDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a share',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: RemoveShareSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Share not found',
    }),
  );
}
