import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  RegistrationAddressDto,
  RegistrationStoreOwnerDto,
  EditContactDto,
} from '../dto/store.dto';
import {
  RegisterStoreConflict,
  RegisterStoreMaRequest,
  RegisterStoreSuccess,
} from './endpoints/register-store.swagger';
import { ListStoreSuccess } from './endpoints/list-stores.swagger';
import { EditStoreSuccess } from './endpoints/edit-store.swagger';
import {
  GetStoreNotFound,
  GetStoreSuccess,
} from './endpoints/get-store.swagger';
import { RegisterAddressStoreSuccess } from './endpoints/register-address.swagger';
import { RegisterContactStoreSuccess } from './endpoints/register-contact.swagger';

const description = '';
export function RegistrationStoreDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register store',
      description,
    }),

    ApiBody({ type: RegistrationStoreOwnerDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: RegisterStoreSuccess,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: RegisterStoreConflict,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: RegisterStoreMaRequest,
    }),
  );
}

export function ListStoresDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listing of stores',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ListStoreSuccess,
    }),
  );
}

export function EditStoreDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Edit Store',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: EditStoreSuccess,
    }),
  );
}

export function DeleteAddressStoreDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete address of store logada',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: RegisterAddressStoreSuccess,
    }),
  );
}

export function RegisterAddressStoreDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastra address for the store logada',
      description: 'Edits o address case idAddress seja sent',
    }),

    ApiBody({ type: RegistrationAddressDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: RegisterAddressStoreSuccess,
    }),
  );
}

export function RegisterContactStoreDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastra contact of store logada',
      description: 'Edits o contact case idContado seja sent',
    }),

    ApiBody({ type: EditContactDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: RegisterContactStoreSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function GetStoreDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get Store',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetStoreSuccess,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: GetStoreNotFound,
    }),
  );
}
