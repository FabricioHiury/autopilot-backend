import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CriarClienteDto } from '../dto/cliente.dto';
import {
  CriarClienteConflict,
  CriarClienteNotFound,
  CriarClienteSucesso,
} from './endpoints/criar-cliente.swagger';
import {
  PegarClienteNotFound,
  PegarClienteSucesso,
} from './endpoints/pegar-cliente.swagger';
import {
  ListarClienteNotFound,
  ListarClienteSucesso,
} from './endpoints/listar-cliente.swagger';
import {
  EditarClienteConflict,
  EditarClienteNotFound,
  EditarClienteSucesso,
} from './endpoints/editar-cliente.swagger';
import {
  InativarClienteConflict,
  InativarClienteNotFound,
  InativarClienteSucesso,
} from './endpoints/inativar-cliente.swagger';
import {
  AtivarClienteConflict,
  AtivarClienteNotFound,
  AtivarClienteSucesso,
} from './endpoints/ativar-cliente.swagger';
import { AnexoClienteBody, AnexoClienteSucesso } from './endpoints/anexo-cliente.swagger';

const description =
  'Para acessar este endpoint, é necessário estar autenticado com o perfil de usuário ou lojista.';

export function CriarClienteDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Criar cliente da loja',
      description,
    }),

    ApiBody({ type: CriarClienteDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: CriarClienteSucesso,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: CriarClienteConflict,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: CriarClienteNotFound,
    }),
  );
}

export function PegarClienteDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pegar cliente da loja',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: PegarClienteSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: PegarClienteNotFound,
    }),
  );
}

export function ListarClienteDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listar clientes da loja',
      description:
        description +
        ' \n\nOBS: O campo da data inicial e data final apenas são retornados se for incluso na requisição.',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarClienteSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ListarClienteNotFound,
    }),
  );
}

export function EditarClienteDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Editar cliente da loja',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: EditarClienteSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: EditarClienteNotFound,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: EditarClienteConflict,
    }),
  );
}

export function AtivarClienteDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Ativar cliente da loja',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: AtivarClienteSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: AtivarClienteNotFound,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: AtivarClienteConflict,
    }),
  );
}

export function InativarClienteDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Inativar cliente da loja',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: InativarClienteSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: InativarClienteNotFound,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: InativarClienteConflict,
    }),
  );
}

export function AnexoClienteDoc() {
  return applyDecorators(
    ApiBody({type: AnexoClienteBody}),
    ApiOperation({
      summary: 'Envia documento de anexo para o cliente',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: AnexoClienteSucesso,
    }),

  );
}
