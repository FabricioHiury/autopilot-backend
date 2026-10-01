import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateCustomerDto } from '../dto/customer.dto';
import {
  CreateCustomerConflict,
  CreateCustomerNotFound,
  CreateCustomerSuccess,
} from './endpoints/create-customer.swagger';
import {
  GetCustomerNotFound,
  GetCustomerSuccess,
} from './endpoints/get-customer.swagger';
import {
  ListCustomerNotFound,
  ListCustomerSuccess,
} from './endpoints/list-customer.swagger';
import {
  EditCustomerConflict,
  EditCustomerNotFound,
  EditCustomerSuccess,
} from './endpoints/edit-customer.swagger';
import {
  DeactivateCustomerConflict,
  DeactivateCustomerNotFound,
  DeactivateCustomerSuccess,
} from './endpoints/deactivate-customer.swagger';
import {
  EnableCustomerConflict,
  EnableCustomerNotFound,
  EnableCustomerSuccess,
} from './endpoints/enable-customer.swagger';
import {
  AttachmentCustomerBody,
  AttachmentCustomerSuccess,
} from './endpoints/attachment-customer.swagger';

const description =
  'For access this endpoint, is required be authenticated with o profile of user or storeOwner.';

export function CreateCustomerDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create customer of store',
      description,
    }),

    ApiBody({ type: CreateCustomerDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: CreateCustomerSuccess,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: CreateCustomerConflict,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: CreateCustomerNotFound,
    }),
  );
}

export function GetCustomerDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get customer of store',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: GetCustomerSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: GetCustomerNotFound,
    }),
  );
}

export function ListCustomerDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'List customers of store',
      description:
        description +
        ' \n\nOBS: The field of data initial and data final only are retornados if for incluso in request.',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListCustomerSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ListCustomerNotFound,
    }),
  );
}

export function EditCustomerDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Edit customer of store',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EditCustomerSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: EditCustomerNotFound,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: EditCustomerConflict,
    }),
  );
}

export function EnableCustomerDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Enable customer of store',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EnableCustomerSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: EnableCustomerNotFound,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: EnableCustomerConflict,
    }),
  );
}

export function DeactivateCustomerDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Deactivate customer of store',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: DeactivateCustomerSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: DeactivateCustomerNotFound,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: DeactivateCustomerConflict,
    }),
  );
}

export function AttachmentCustomerDoc() {
  return applyDecorators(
    ApiBody({ type: AttachmentCustomerBody }),
    ApiOperation({
      summary: 'Sends document of attachment for the customer',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: AttachmentCustomerSuccess,
    }),
  );
}
