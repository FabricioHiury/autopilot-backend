import { applyDecorators, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiBody, ApiResponse } from "@nestjs/swagger";
import { CriarColaboradorDto, EditarColaboradorDto } from "../dto/colaborador.dto";
import { CriarColaboradorBadRequest, CriarColaboradorSucesso } from "./endpoints/criar-colaborador.swagger";
import { AppErrorBadRequest, AppErrorNotFound } from "src/utils/errors/app-errors";
import { EditarColaboradorBadRequest, EditarColaboradorSucesso } from "./endpoints/editar-colaborador.swagger";
import { BuscarColaboradorErro, BuscarColaboradorSucesso } from "./endpoints/buscar-colaborador.swagger";
import { BuscarColaboradoresErro, BuscarColaboradoresSucesso } from "./endpoints/buscar-todos-colaboradores.swagger";

const description =
  'Para acessar esses endpoints, é necessário estar autenticado com o perfil de lojista.';

export function criarColaboradorDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Criação de um novo colaborador' }),
    ApiBody({ type: CriarColaboradorDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Colaborador criado com sucesso.',
      type: CriarColaboradorSucesso,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Requisição inválida.',
      type: CriarColaboradorBadRequest,
    })
  );
}

export function editarColaboradorDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Editar as informações de um colaborador'}),
    ApiBody({ type: EditarColaboradorDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Operação realizada com sucesso.',
      type: EditarColaboradorSucesso
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Erro ao realizar a operação',
      type: EditarColaboradorBadRequest
    })
  )  
}

export function buscarColaboradorDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Buscar informações de um colaborador'}),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Operação realizada com sucesso',
      type: BuscarColaboradorSucesso
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Colaborador não encontrado.',
      type: BuscarColaboradorErro
    })
  )
}

export function buscarTodosColaboradoresDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Buscar informações de todos colaboradores'}),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Operação realizada com sucesso',
      type: BuscarColaboradoresSucesso
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Colaborador não encontrado.',
      type: BuscarColaboradoresErro
    })
  )
}

export function editarColaboresDoc() {
  return applyDecorators(
    ApiOperation({ summary: 'Editar informações de um colaborador'}),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Operação realizada com sucesso',
      type: BuscarColaboradorSucesso
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Colaborador não encontrado.',
      type: BuscarColaboradorErro
    })
  )
}