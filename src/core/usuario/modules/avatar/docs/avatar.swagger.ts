import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SalvarAvatarBadRequest,
  SalvarAvatarSucesso,
} from './endpoints/salvar-avatar.swagger';
import { PegarAvatarSucesso } from './endpoints/pegar-avatar.swagger';

export function SalvarAvatarDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Salvar avatar do usuário',
      description:
        'OBS: Necessário autenticação: LOJISTA, AUTOPILOT ou USUARIO.\n\nEnviar apenas um arquivo.\n\nTipos de arquivos aceitos: image/jpeg, image/jpg, image/webp, image/png.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: SalvarAvatarSucesso,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: SalvarAvatarBadRequest,
    }),
  );
}

export function PegarAvatarDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pegar avatar do usuário',
      description:
        'Redireciona para a imagem de avatar do usuário.\n\nOBS: Não precisa de autenticação.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: PegarAvatarSucesso,
    }),
  );
}

export function DeletarAvatarDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Deletar avatar do usuário',
      description:
        'Deleta o avatar do usuário.\n\nOBS: Necessário autenticação: LOJISTA, AUTOPILOT ou USUARIO.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: PegarAvatarSucesso,
    }),
  );
}
