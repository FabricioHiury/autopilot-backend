import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CriarCargoSucesso } from './endpoints/criar-cargo.';
import { ListarCargosSucesso } from './endpoints/listar-cargos';
import { DeletarCargoDto } from '../dto/deletar-cargo.dto';
import { PERMISSOES_LOJA } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';

export function ListarCargosDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista todos os cargos de uma loja`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarCargosSucesso,
    }),
  );
}

export function CriarCargoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Cria um cargo para uma loja`,
      description: `Permissão necessária: ${PERMISSOES_LOJA.LOJA_GERENCIAR_CARGOS}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CriarCargoSucesso,
    }),
  );
}

export function DeletarCargoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Deleta um cargo de uma loja`,
      description: `Permissão necessária: ${PERMISSOES_LOJA.LOJA_GERENCIAR_CARGOS}`,
    }),

    ApiBody({ type: DeletarCargoDto }),

    ApiResponse({
      status: HttpStatus.OK,
      type: CriarCargoSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}
