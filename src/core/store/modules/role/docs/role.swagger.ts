import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateRoleSuccess } from './endpoints/create-role.';
import { ListRolesSuccess } from './endpoints/list-roles';
import { DeleteRoleDto } from '../dto/delete-role.dto';
import { PERMISSIONS_STORE } from 'src/core/user/enum/permissions_features.enum';

export function ListRolesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `List all the roles of a store`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListRolesSuccess,
    }),
  );
}

export function CreateRoleDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Cria a role for a store`,
      description: `Permission required: ${PERMISSIONS_STORE.STORE_MANAGE_ROLES}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CreateRoleSuccess,
    }),
  );
}

export function DeleteRoleDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Deletes a role of a store`,
      description: `Permission required: ${PERMISSIONS_STORE.STORE_MANAGE_ROLES}`,
    }),

    ApiBody({ type: DeleteRoleDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CreateRoleSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}
