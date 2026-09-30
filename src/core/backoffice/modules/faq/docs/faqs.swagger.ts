import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CriarFaqDto } from '../dto/criar-faq.dto';
import {
  CriarFaqBadRequest,
  CriarFaqSucesso,
} from './endpoints/criar-faq.swagger';
import {
  ListarFaqsErroBadRequest,
  ListarFaqSucesso,
} from './endpoints/listar-faqs.swagger';
import {
  ObterFaqErroBadRequest,
  ObterFaqErroNotFound,
  ObterFaqSucesso,
} from './endpoints/obter-faq-id.swagger';

export function criarFaqDoc() {
  const description = '';
  return applyDecorators(
    ApiOperation({
      summary: 'Criar | Editar FAQ',
    }),

    ApiBody({ type: CriarFaqDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CriarFaqSucesso,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: CriarFaqBadRequest,
    }),
  );
}

export function listarFaqDoc() {
  const description = '';
  return applyDecorators(
    ApiOperation({
      summary: 'Listar FAQs',
      description,
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Número da página',
    }),
    ApiQuery({
      name: 'quantidade',
      required: false,
      type: Number,
      description: 'Limite de resultados',
    }),
    ApiQuery({
      name: 'pesquisa',
      required: false,
      type: String,
      description: 'Texto para pesquisar',
    }),
    ApiQuery({
      name: 'tags',
      required: false,
      type: String,
      description:
        'nomes das tags separadas por vírgula(ex: novo,atendimento,duvida)',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarFaqSucesso,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ListarFaqsErroBadRequest,
    }),
  );
}

export function ObterFaqPorIdDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obter FAQ por ID',
    }),
    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID do faq',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ObterFaqSucesso,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ObterFaqErroBadRequest,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ObterFaqErroNotFound,
    }),
  );
}

export function ObterFaqPorSlugDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Obter FAQ por Slug',
    }),
    ApiParam({
      name: 'slug',
      type: String,
      description: 'Slug do faq',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ObterFaqSucesso,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ObterFaqErroBadRequest,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ObterFaqErroNotFound,
    }),
  );
}

export function ContarViewsDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Contar views FAQ',
    }),
    ApiHeader({
      name: 'x-api-guard',
      description: 'x-api-guard para poder acessar a rota',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ObterFaqSucesso,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      type: ObterFaqErroBadRequest,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ObterFaqErroNotFound,
    }),
  );
}

export function DeletarFaqDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Deletar FAQ',
    }),

    ApiParam({
      name: 'id',
      type: Number,
      description: 'ID do faq',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: ObterFaqSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      type: ObterFaqErroNotFound,
    }),
  );
}
