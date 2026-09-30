import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CriarAtendimentoDto } from '../dto/criar-atendimento.dto';
import { CriarAtendimentoSucesso } from './endpoints/criar-atendimento.swagger';
import { EditarAtendimentoDto } from '../dto/editar-atendimento.dto';
import {
  ListarAtendimentosNotFound,
  ListarAtendimentosSucesso,
} from './endpoints/listar-atendimento.swagger';
import { SalvarAnexoAtendimentoDto } from '../dto/salvar-anexo.dto';
import { SalvarAnexoAtendimentoSucesso } from './endpoints/salvar-anexo.swagger';
import { DeletarAnexoAtendimentoSucesso } from './endpoints/deletar-anexo.swagger';
import { CriarComentarioAtendimentoSucesso } from './endpoints/criar-comentario.swagger';
import { ListarComentariosSucesso } from './endpoints/listar-comentarios.swagger';
import {
  RemoverResponsaveisErro,
  RemoverResponsaveisSucesso,
} from './endpoints/remover-responsaveis.swagger';
import { ObterAnexosAtendimentoSucesso } from './endpoints/obter-anexos-atendimento.swagger';
import { ObterAtendimentoPorIdSucesso } from './endpoints/obter-atendimento-por-id.swagger';
import { AlterarClienteAtendimentoSucesso } from './endpoints/alterar-cliente.swagger';

const description = 'Necessário token de autenticação.';

export function ObterAtendimentoPorIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lista um atendimento com todos os seus detalhes (menos anexos)',
      description:
        description +
        ' O cliente vem na forma de "cliente" ou "clienteTemporario", dependendo de como o atendimento foi iniciado. Portanto, um dos dois objetos será null',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ObterAtendimentoPorIdSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function CriarAtendimentoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cria um atendimento',
      description:
        description +
        ' Caso idCliente não seja informado, é criado um cliente temporário.',
    }),

    ApiBody({ type: CriarAtendimentoDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CriarAtendimentoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function EditarAtendimentoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Edita um atendimento',
      description,
    }),

    ApiBody({ type: EditarAtendimentoDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CriarAtendimentoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function ObterAnexosAtendimentoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lista todos os anexos de um atendimento',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ObterAnexosAtendimentoSucesso,
    }),
  );
}

export function SalvarAnexoAtendimentoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Salva um anexo para um atendimento',
      description:
        description +
        ' O body deve ser enviado no formato request form-data, com apenas um arquivo.',
    }),

    ApiBody({ type: SalvarAnexoAtendimentoDto }),

    ApiResponse({
      status: HttpStatus.CREATED,
      type: SalvarAnexoAtendimentoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function DeletarAnexoAtendimentoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Deleta um anexo do atendimento',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: DeletarAnexoAtendimentoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function listarAtendimentoDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lista atendimentos',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarAtendimentosSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ListarAtendimentosNotFound,
    }),
  );
}

export function buscarAtendimentoPorIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Busca um atendimento por id',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CriarAtendimentoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function criarComentariosDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lista comentários de um atendimento',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CriarComentarioAtendimentoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function listarComentariosDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lista comentários de um atendimento',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarComentariosSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ListarAtendimentosNotFound,
    }),
  );
}

export function removerResponsaveisDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove responsáveis de um atendimento',
      description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: RemoverResponsaveisSucesso,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: RemoverResponsaveisErro,
    }),
  );
}

export function alterarClienteAtendimentoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Altera o cliente vinculado ao atendimento',
      description: description,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: AlterarClienteAtendimentoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}
