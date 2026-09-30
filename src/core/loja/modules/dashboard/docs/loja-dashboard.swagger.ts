import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FILTRO_DATA } from 'src/core/loja/enum/filtro-data.enum';
import { PegarOrigemAtendimentosSucesso } from './endpoints/pegar-origem-atendimentos.swagger';
import { PegarRelatorioSemanalSaida } from './endpoints/pegar-relatorio-semanal.swagger';
import { PegarUltimosAtendimentosSucesso } from './endpoints/pegar-ultimos-atendimentos.swagger';

export function PegarRelatorioSemanalDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pegar relatório semanal',
      description:
        'Pegar dados semanais de atendimentos e novos vendedores (parte da dashboard)',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: PegarRelatorioSemanalSaida,
    }),
  );
}

export function PegarUltimosAtendimentosDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pegar últimos atendimentos da loja',
      description: 'Lista de atendimentos em ordem descresente de data',
    }),
    ApiQuery({
      name: 'modo',
      required: false,
      enum: ['compra', 'venda'],
      description: 'Modo de atendimento',
    }),

    ApiResponse({
      status: HttpStatus.OK,
      type: PegarUltimosAtendimentosSucesso,
      description: 'Sucesso',
    }),
  );
}

export function PegarOrigemAtendimentosDoc() {
  return applyDecorators(
    ApiOperation({
      summary: 'Pegar gráfico de origem dos atendimentos da loja',
      description:
        'Agrupamento default: mensal\n\nIntervalo de datas default: início do mês / fim do mês para agrupamento diário e semanal; início do ano / fim do ano para os outros tipos de agrupamento',
    }),
    ApiQuery({
      name: 'agrupamento',
      required: false,
      enum: [...Object.values(FILTRO_DATA)],
    }),
    ApiQuery({
      name: 'dataInicio',
      required: false,
    }),
    ApiQuery({
      name: 'dataFim',
      required: false,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      type: PegarOrigemAtendimentosSucesso,
      description: 'Sucesso',
    }),
  );
}
