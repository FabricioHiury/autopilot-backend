import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SuspensionSuccess,
  ListSuspensionsSuccess,
  RemoveSuspensionSuccess,
  CheckSuspensionSuccess,
} from './endpoints/suspension.swagger';

const description = 'Requires token of authentication.';

export function createSuspensionDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cria a new suspension of deal for a user',
      description:
        'Requires token of authentication and permission for manage deals.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: SuspensionSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Data invalid for creation of suspension',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'You do not have permission for create suspensions',
    }),
  );
}

export function updateSuspensionDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Updates a suspension of deal existing',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: SuspensionSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Suspension or user not found',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Data invalid for update of suspension',
    }),
  );
}

export function listSuspensionsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List suspensions of deal with filters',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ListSuspensionsSuccess,
    }),
  );
}

export function getSuspensionByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Gets details of a suspension of deal',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: SuspensionSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Suspension not found',
    }),
  );
}

export function removeSuspensionDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove a suspension of deal',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: RemoveSuspensionSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Suspension not found',
    }),
  );
}

export function checkUserSuspendedDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Checks if a user is suspended',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: CheckSuspensionSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
    }),
  );
}
