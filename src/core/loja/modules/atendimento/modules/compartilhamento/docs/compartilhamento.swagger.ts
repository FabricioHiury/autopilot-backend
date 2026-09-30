import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CompartilhamentoSucesso,
  ListarCompartilhamentosSucesso,
  RemoverCompartilhamentoSucesso,
} from './endpoints/compartilhamento.swagger';

const description = 'Necessário token de autenticação.';

export function criarCompartilhamentoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Compartilha um atendimento com um colaborador',
      description:
        'Necessário token de autenticação do lojista ou de um dos responsáveis pelo atendimento.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: CompartilhamentoSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Atendimento ou colaborador não encontrado',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Não é possível compartilhar com si mesmo',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Você não tem permissão para compartilhar este atendimento',
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Atendimento já compartilhado com este colaborador',
    }),
  );
}

export function listarCompartilhamentosDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lista compartilhamentos de um atendimento',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ListarCompartilhamentosSucesso,
    }),
  );
}

export function removerCompartilhamentoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove um compartilhamento',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: RemoverCompartilhamentoSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Compartilhamento não encontrado',
    }),
  );
}
