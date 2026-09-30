import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { ListarAssinantesSucesso } from './endpoints/listar-assinantes';
import { BuscarAssinaturaPorIdLojaSucesso } from './endpoints/buscar-assinatura-por-idLoja';
import { BuscarEstatisticasAssinaturasSucesso } from './endpoints/buscar-estatisticas-assinaturas';
import { DesativarAssinaturaSucesso } from './endpoints/desativar-assinatura';
import { AtivarAssinaturaSucesso } from './endpoints/ativar-assinatura';

const description = `Necessário token de autenticação de um usuário com perfil "autopilot"`;

export function ListarAssinantesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista os assinantes do sistema`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES}\n\nOBS: Os parâmetros de filtragem só aparecem na resposta caso sejam enviados na requisição`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ListarAssinantesSucesso,
    }),
  );
}

export function BuscarEstatisticasAssinaturasDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Busca estatísticas das assinaturas (totais e percentuais)`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: BuscarEstatisticasAssinaturasSucesso,
    }),
  );
}

export function BuscarAssinaturaPorIdLojaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Busca assinatura por idLoja`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_ASSINANTES}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: BuscarAssinaturaPorIdLojaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),
  );
}

export function DesativarAssinaturaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Desativa a assinatura de uma loja`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: DesativarAssinaturaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}

export function AtivarAssinaturaDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Ativa a assinatura de uma loja`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_EDITAR_ASSINANTES_ADICIONAR}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: AtivarAssinaturaSucesso,
    }),

    ApiResponse({
      status: HttpStatus.NOT_FOUND,
    }),

    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
    }),
  );
}
