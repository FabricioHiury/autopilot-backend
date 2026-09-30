import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PERMISSOES_AUTOPILOT } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { ObterEstatisticasCadastrosSucesso } from './endpoints/obter-estatisticas-cadastros';
import { ObterReceitaETaxaChurnSucesso } from './endpoints/obter-receita-taxachurn';
import { ObterVidaUtilClientesSucesso } from './endpoints/obter-vida-util-clientes';
import { ObterUltimasAssinaturasSucesso } from './endpoints/obter-ultimas-assinaturas';
import { ObterAssinaturasAnoSucesso } from './endpoints/obter-assinaturas-ano';

const description = `Necessário token de autenticação de um usuário com perfil "autopilot"`;

export function ObterEstatisticasCadastrosDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista as estatísticas de cadastros, upgrades, desativações de conta e cancelamentos de plano`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_DASHBOARD}\n\nOBS: Os parâmetros de filtragem só aparecem na resposta caso sejam enviados na requisição`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ObterEstatisticasCadastrosSucesso,
    }),
  );
}

export function ObterReceitaETaxaChurnDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Retorna a receita e a taxa de churn do período definido`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_DASHBOARD}\n\nOBS: Os parâmetros de filtragem só aparecem na resposta caso sejam enviados na requisição`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ObterReceitaETaxaChurnSucesso,
    }),
  );
}

export function ObterVidaUtilClientesDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Retorna lista de clientes com vida útil, total gasto, frequência, duração e CLV`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_DASHBOARD}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ObterVidaUtilClientesSucesso,
    }),
  );
}

export function ObterUltimasAssinaturasDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista as últimas dez assinaturas, separadas por plano`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_DASHBOARD}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ObterUltimasAssinaturasSucesso,
    }),
  );
}

export function ObterAssinaturasAnoDoc() {
  return applyDecorators(
    ApiOperation({
      summary: `Lista estatísticas de assinaturas e cancelamentos do ano selecionado`,
      description:
        description +
        `. Permissão necessária: ${PERMISSOES_AUTOPILOT.AUTOPILOT_VER_DASHBOARD}`,
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: ObterAssinaturasAnoSucesso,
    }),
  );
}
