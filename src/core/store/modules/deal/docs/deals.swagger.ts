import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateDealDto } from '../dto/create-deal.dto';
import { CreateDealSuccess } from './endpoints/create-deal.swagger';
import { EditDealDto } from '../dto/edit-deal.dto';
import {
  ListDealsNotFound,
  ListDealsSuccess,
} from './endpoints/list-deal.swagger';
import { SaveAttachmentDealDto } from '../dto/save-attachment.dto';
import { SaveAttachmentDealSuccess } from './endpoints/save-attachment.swagger';
import { DeleteAttachmentDealSuccess } from './endpoints/delete-attachment.swagger';
import { CreateCommentDealSuccess } from './endpoints/create-comment.swagger';
import { ListCommentsSuccess } from './endpoints/list-comments.swagger';
import {
  RemoveAssigneesError,
  RemoveAssigneesSuccess,
} from './endpoints/remove-assignees.swagger';
import { GetAttachmentsDealSuccess } from './endpoints/get-attachments-deal.swagger';
import { GetDealByIdSuccess } from './endpoints/get-deal-by-id.swagger';
import { UpdateCustomerDealSuccess } from './endpoints/update-customer.swagger';

const description = 'Requires token of authentication.';

export function GetDealByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List a deal with all the seus details (less attachments)',
      description:
        description +
        ' O customer vem in forma of "customer" or "temporaryCustomer", dependendo of the o deal was started. Portanto, a of two objetos will be null',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: GetDealByIdSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function CreateDealDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cria a deal',
      description:
        description +
        ' Caso customerId not seja provided, is created a customer temporary.',
    }),

    ApiBody({ type: CreateDealDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CreateDealSuccess,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function EditDealDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Edits a deal',
      description,
    }),

    ApiBody({ type: EditDealDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CreateDealSuccess,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function GetAttachmentsDealDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List all the attachments of a deal',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: GetAttachmentsDealSuccess,
    }),
  );
}

export function SaveAttachmentDealDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Salva a attachment for a deal',
      description:
        description +
        ' O body must be sent in format request form-data, with only a file.',
    }),

    ApiBody({ type: SaveAttachmentDealDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: SaveAttachmentDealSuccess,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function DeleteAttachmentDealDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Deletes a attachment of deal',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: DeleteAttachmentDealSuccess,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function listDealDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'List deals',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListDealsSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ListDealsNotFound,
    }),
  );
}

export function findDealByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Search a deal by id',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CreateDealSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function createCommentsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List comments of a deal',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CreateCommentDealSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function listCommentsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List comments of a deal',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListCommentsSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ListDealsNotFound,
    }),
  );
}

export function removeAssigneesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove assignees of a deal',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: RemoveAssigneesSuccess,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: RemoveAssigneesError,
    }),
  );
}

export function updateCustomerDealDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Altera o customer linked to deal',
      description: description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: UpdateCustomerDealSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}
