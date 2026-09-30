import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CadastroEnderecoDto,
  CadastroLojistaDto,
  EditarContatoDto,
} from '../dto/loja.dto';
import {
  CadastrarLojaConflito,
  CadastrarLojaMaRequisicao,
  CadastrarLojaSucesso,
} from './endpoints/cadastrar-loja.swagger';
import { ListarLojaSucesso } from './endpoints/listar-lojas.swagger';
import { EditarLojaSucesso } from './endpoints/editar-loja.swagger';
import { StatusAssinaturaSucesso } from './endpoints/status-assinatura.swagger';
import {
  PegarLojaNaoEncontrado,
  PegarLojaSucesso,
} from './endpoints/pegar-loja.swagger';
import { CadastrarEnderecoLojaSucesso } from './endpoints/cadastrar-endereco.swagger';
import { CadastrarContatoLojaSucesso } from './endpoints/cadastrar-contato.swagger';

const description = '';
export function CadastroLojaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastrar loja',
      description,
    }),

    ApiBody({ type: CadastroLojistaDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: CadastrarLojaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.CONFLICT,
      type: CadastrarLojaConflito,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: CadastrarLojaMaRequisicao,
    }),
  );
}

export function ListarLojasDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Listagem de lojas',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ListarLojaSucesso,
    }),
  );
}

export function EditarLojaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Editar Loja',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: EditarLojaSucesso,
    }),
  );
}


export function DeletarEnderecoLojaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Deletar endereço de loja logada',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: CadastrarEnderecoLojaSucesso,
    }),
  );
}


export function CadastrarEnderecoLojaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastra endereço para a loja logada',
      description: 'Edita o endereço caso idEndereco seja enviado',
    }),

    ApiBody({ type: CadastroEnderecoDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: CadastrarEnderecoLojaSucesso,
    }),
  );
}

export function CadastrarContatoLojaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cadastra contato da loja logada',
      description: 'Edita o contato caso idContado seja enviado',
    }),

    ApiBody({ type: EditarContatoDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CadastrarContatoLojaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function StatusAssinaturaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Retorna o status da assinatura da loja logada',
      description:
        'Retorna um valor booleano. Se retornar true, a assinatura da loja está ativa. Se retornar false, a assinatura da loja está inativa.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: StatusAssinaturaSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function PegarLojaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pegar Loja',
      description,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: PegarLojaSucesso,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: PegarLojaNaoEncontrado,
    }),
  );
}
