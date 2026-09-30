import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListarHistoricoLojaSucesso } from './endpoints/listar-historico-loja';

export function ListarHistoricoLojaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista histórico de eventos de uma loja`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarHistoricoLojaSucesso,
    }),
  );
}
