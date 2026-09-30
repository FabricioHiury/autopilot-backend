import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SuspensaoSucesso,
  ListarSuspensoesSucesso,
  RemoverSuspensaoSucesso,
  VerificarSuspensaoSucesso,
} from './endpoints/suspensao.swagger';

const description = 'Necessário token de autenticação.';

export function criarSuspensaoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cria uma nova suspensão de atendimento para um usuário',
      description:
        'Necessário token de autenticação e permissão para gerenciar atendimentos.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: SuspensaoSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Usuário não encontrado',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Dados inválidos para criação da suspensão',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Você não tem permissão para criar suspensões',
    }),
  );
}

export function atualizarSuspensaoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Atualiza uma suspensão de atendimento existente',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: SuspensaoSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Suspensão ou usuário não encontrado',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Dados inválidos para atualização da suspensão',
    }),
  );
}

export function listarSuspensoesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lista suspensões de atendimento com filtros',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ListarSuspensoesSucesso,
    }),
  );
}

export function obterSuspensaoPorIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obtém detalhes de uma suspensão de atendimento',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: SuspensaoSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Suspensão não encontrada',
    }),
  );
}

export function removerSuspensaoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove uma suspensão de atendimento',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: RemoverSuspensaoSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Suspensão não encontrada',
    }),
  );
}

export function verificarUsuarioSuspensoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Verifica se um usuário está suspenso',
      description: description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: VerificarSuspensaoSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Usuário não encontrado',
    }),
  );
}
