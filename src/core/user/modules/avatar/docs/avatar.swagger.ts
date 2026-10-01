import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SaveAvatarBadRequest,
  SaveAvatarSuccess,
} from './endpoints/save-avatar.swagger';
import { GetAvatarSuccess } from './endpoints/get-avatar.swagger';

export function SaveAvatarDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Save avatar of user',
      description:
        'OBS: Requires authentication: STOREOWNER, AUTOPILOT or USER.\n\nSend only a file.\n\nTypes of files accepted: image/jpeg, image/jpg, image/webp, image/png.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: SaveAvatarSuccess,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: SaveAvatarBadRequest,
    }),
  );
}

export function GetAvatarDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get avatar of user',
      description:
        'Redireciona for a image of avatar of user.\n\nOBS: Not precisa of authentication.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetAvatarSuccess,
    }),
  );
}

export function DeleteAvatarDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete avatar of user',
      description:
        'Deletes o avatar of user.\n\nOBS: Requires authentication: STOREOWNER, AUTOPILOT or USER.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: GetAvatarSuccess,
    }),
  );
}
