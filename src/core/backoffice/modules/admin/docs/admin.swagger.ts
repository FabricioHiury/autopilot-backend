import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateUserAdminDto } from '../dto/create-user-admin.dto';
import { CreateUserAdminSuccess } from './endpoints/create-user-admin';
import { GrantPermissionsSuccess } from './endpoints/grant-permissions';
import { PermissionsAdminDto } from '../dto/permissions-admin.dto';
import { RemovePermissionsSuccess } from './endpoints/remove-permissions';
import { EditAdminLoggedInSuccess } from './endpoints/edit-admin-loggedIn';
import { EditUserAdminSuccess } from './endpoints/edit-user-admin';
import { EditUserAdminDto } from '../dto/edit-user-admin.dto';
import { EditAdminLoggedInDto } from '../dto/edit-admin-loggedIn.dto';
import { DeleteUserAdminSuccess } from './endpoints/delete-user-admin';
import { ListUsersAdminDto } from '../dto/list-users-admin.dto';
import { ListUsersAdminSuccess } from './endpoints/list-users-admin';
import { FindAdminByIdSuccess } from './endpoints/find-admin-by-id';
import { FindDataAdminLoggedInSuccess } from './endpoints/find-data-admin-loggedIn';
import { ListPermissionsValidSuccess } from './endpoints/list-permissions-valid';
import { PERMISSIONS_AUTOPILOT } from 'src/core/user/enum/permissions_features.enum';

const description = `Requires token of authentication of a user with profile "autopilot"`;

export function ListPermissionsValidDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `List all the permissions of backoffice available of system`,
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListPermissionsValidSuccess,
    }),
  );
}

export function ListUsersAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `List users with profile "autopilot"`,
      description:
        description +
        ` . Permission required: ${PERMISSIONS_AUTOPILOT.AUTOPILOT_VIEW_USERS_ADMIN}\n\nOBS: Os parameters of filtragem só aparecem in reply case sejam sent in request`,
    }),

    ApiBody({ type: ListUsersAdminDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListUsersAdminSuccess,
    }),
  );
}

export function FindDataAdminLoggedInDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Returns the data of user with profile "autopilot" loggedIn`,
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: FindDataAdminLoggedInSuccess,
    }),
  );
}

export function FindAdminByIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Search a user with profile "autopilot" by id`,
      description:
        description +
        `. Permission required: ${PERMISSIONS_AUTOPILOT.AUTOPILOT_VIEW_USERS_ADMIN}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: FindAdminByIdSuccess,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function CreateUserAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Cria a user with profile "autopilot"`,
      description:
        `Cria a user of type admin and envia a email with the data of access for the email provided.\n` +
        description +
        `. Permission required: ${PERMISSIONS_AUTOPILOT.AUTOPILOT_CREATE_USER_ADMIN}`,
    }),

    ApiBody({ type: CreateUserAdminDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: CreateUserAdminSuccess,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function EditUserAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Edits a user with profile "autopilot"`,
      description:
        description +
        `. Permission required: ${PERMISSIONS_AUTOPILOT.AUTOPILOT_CREATE_USER_ADMIN}`,
    }),

    ApiBody({ type: EditUserAdminDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EditUserAdminSuccess,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function EditAdminLoggedInDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Edits o user loggedIn`,
      description,
    }),

    ApiBody({ type: EditAdminLoggedInDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EditAdminLoggedInSuccess,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function DeleteUserAdminDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Deletes permanentemente a user with profile "autopilot"`,
      description:
        description +
        `. Permission required: ${PERMISSIONS_AUTOPILOT.AUTOPILOT_CREATE_USER_ADMIN}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: DeleteUserAdminSuccess,
    }),
  );
}

export function GrantPermissionsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Concede permissions for a user with profile "autopilot"`,
      description:
        description +
        `. Permission required: ${PERMISSIONS_AUTOPILOT.AUTOPILOT_UPDATE_PERMISSIONS}`,
    }),

    ApiBody({ type: PermissionsAdminDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: GrantPermissionsSuccess,
    }),
  );
}

export function RemovePermissionsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Remove permissions of a user with profile "autopilot"`,
      description:
        description +
        `. Permission required: ${PERMISSIONS_AUTOPILOT.AUTOPILOT_UPDATE_PERMISSIONS}`,
    }),

    ApiBody({ type: PermissionsAdminDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: RemovePermissionsSuccess,
    }),
  );
}
