import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  STATUS_ATENDIMENTO,
  TEMPERATURA_ATENDIMENTO,
  ORIGEM_ATENDIMENTO,
  STATUS_ATENDIMENTO_MAP,
  MODO_ATENDIMENTO,
} from 'src/utils/enum/atendimento.enum';
import {
  FiltroRelatorioDto,
  RelatorioVendedorDto,
  RelatorioCanaisDto,
  RelatorioDetalhadoVendedorDto,
  RelatorioGeralDto,
  RankingVendedorDto,
  FiltroTop3VendedoresDto,
  UsuarioLogadoVendasDto,
  Top3VendedoresDto,
  RelatorioVendedoresPorModoDto,
} from './dto/relatorio-atendimentos.dto';
import {
  startOfMonth,
  endOfMonth,
  format,
  differenceInHours,
  differenceInMinutes,
  subDays,
  differenceInDays,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Remetente } from '../chat/enum/canal.enum';

@Injectable()
export class RelatoriosAtendimentosService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Calcula a diferença em minutos entre duas datas considerando apenas dias úteis (segunda a sexta)
   * @param dataInicio Data de início
   * @param dataFim Data de fim
   * @returns Diferença em minutos considerando apenas dias úteis
   */
  private calcularDiferencaMinutosDiasUteis(dataInicio: Date, dataFim: Date): number {
    if (dataInicio >= dataFim) return 0;

    let minutosUteis = 0;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Se as datas são no mesmo dia
    if (inicio.toDateString() === fim.toDateString()) {
      const diaSemana = inicio.getDay();
      // 0 = domingo, 6 = sábado
      if (diaSemana >= 1 && diaSemana <= 5) {
        return differenceInMinutes(fim, inicio);
      }
      return 0; // Fim de semana
    }

    // Processar dia por dia
    const dataAtual = new Date(inicio);
    
    while (dataAtual < fim) {
      const diaSemana = dataAtual.getDay();
      
      // Se é dia útil (segunda a sexta)
      if (diaSemana >= 1 && diaSemana <= 5) {
        const inicioHoje = new Date(dataAtual);
        const fimHoje = new Date(dataAtual);
        fimHoje.setHours(23, 59, 59, 999);

        // Se é o primeiro dia
        if (dataAtual.toDateString() === inicio.toDateString()) {
          inicioHoje.setTime(inicio.getTime());
        } else {
          inicioHoje.setHours(0, 0, 0, 0);
        }

        // Se é o último dia
        if (dataAtual.toDateString() === fim.toDateString()) {
          fimHoje.setTime(fim.getTime());
        }

        if (inicioHoje < fimHoje) {
          minutosUteis += differenceInMinutes(fimHoje, inicioHoje);
        }
      }

      // Avançar para o próximo dia
      dataAtual.setDate(dataAtual.getDate() + 1);
      dataAtual.setHours(0, 0, 0, 0);
    }

    return minutosUteis;
  }

  /**
   * Formata tempo em minutos para uma string no formato "Xd Xh Xmin"
   * @param minutos Tempo em minutos
   * @returns String formatada do tempo no formato "Xd Xh Xmin"
   */
  private formatarTempo(minutos: number): string {
    if (minutos <= 0) return '0min';

    const dias = Math.floor(minutos / (24 * 60));
    const horas = Math.floor((minutos % (24 * 60)) / 60);
    const minutosRestantes = Math.floor(minutos % 60);

    const partes: string[] = [];

    if (dias > 0) {
      partes.push(`${dias}d`);
    }

    if (horas > 0) {
      partes.push(`${horas}h`);
    }

    if (minutosRestantes > 0) {
      partes.push(`${minutosRestantes}min`);
    }

    // Se não há nenhuma parte (caso de 0 minutos), retorna 0min
    if (partes.length === 0) {
      return '0min';
    }

    return partes.join(' ');
  }

  // Type guard para verificar se modo é um MODO_ATENDIMENTO válido
  private isModoAtendimento(modo: MODO_ATENDIMENTO | 'total'): modo is MODO_ATENDIMENTO {
    return modo !== 'total' && Object.values(MODO_ATENDIMENTO).includes(modo as MODO_ATENDIMENTO);
  }

  private readonly canalMetadata = {
    [ORIGEM_ATENDIMENTO.FACEBOOK]: {
      nomeExibicao: 'Facebook',
      iconeUrl: '/icons/facebook.svg',
    },
    [ORIGEM_ATENDIMENTO.INSTAGRAM]: {
      nomeExibicao: 'Instagram',
      iconeUrl: '/icons/instagram.svg',
    },
    [ORIGEM_ATENDIMENTO.WHATSAPP]: {
      nomeExibicao: 'WhatsApp',
      iconeUrl: '/icons/whatsapp.svg',
    },
    [ORIGEM_ATENDIMENTO.OLX]: {
      nomeExibicao: 'OLX',
      iconeUrl: '/icons/olx.svg',
    },
    [ORIGEM_ATENDIMENTO.SHOWROOM]: {
      nomeExibicao: 'Showroom',
      iconeUrl: '/icons/showroom.svg',
    },
    [ORIGEM_ATENDIMENTO.USADOSBR]: {
      nomeExibicao: 'UsadosBR',
      iconeUrl: '/icons/usadosbr.svg',
    },
    [ORIGEM_ATENDIMENTO.ICARROS]: {
      nomeExibicao: 'iCarros',
      iconeUrl: '/icons/icarros.svg',
    },
    [ORIGEM_ATENDIMENTO.MOBIAUTO]: {
      nomeExibicao: 'Mobiauto',
      iconeUrl: '/icons/mobiauto.svg',
    },
    [ORIGEM_ATENDIMENTO.WEBMOTORS]: {
      nomeExibicao: 'Webmotors',
      iconeUrl: '/icons/webmotors.svg',
    },
    [ORIGEM_ATENDIMENTO.LIGACAO]: {
      nomeExibicao: 'Ligação',
      iconeUrl: '/icons/phone.svg',
    },
    [ORIGEM_ATENDIMENTO.SITE]: {
      nomeExibicao: 'Site',
      iconeUrl: '/icons/site.svg',
    },
    [ORIGEM_ATENDIMENTO.CARTEIRA]: {
      nomeExibicao: 'Carteira',
      iconeUrl: '/icons/carteira.svg',
    },
    [ORIGEM_ATENDIMENTO.INDICACAO]: {
      nomeExibicao: 'Indicação',
      iconeUrl: '/icons/indicacao.svg',
    },
    [ORIGEM_ATENDIMENTO.OUTROS]: {
      nomeExibicao: 'Outros',
      iconeUrl: '/icons/others.svg',
    },
  };

  // 1. Relatório de Atendimentos por Vendedor
  async gerarRelatorioPorVendedor(
    idLoja: string,
    filtro: FiltroRelatorioDto,
  ): Promise<any[]> {
    return await this.processarDadosVendedoresPorModo(idLoja, filtro);
  }

  private async processarDadosVendedoresPorModo(
    idLoja: string,
    filtro: FiltroRelatorioDto,
  ): Promise<RelatorioVendedoresPorModoDto[]> {
    const dataInicio = new Date(filtro.dataInicio);
    const dataFim = new Date(filtro.dataFim);

    let whereCondition: any = {
      idLoja,
      status: 'ativo',
      cargos: {
        some: {
          cargo: {
            in: ['Vendedor', 'Pré-vendedor'],
          },
        },
      },
    };

    if (filtro.idColaborador) {
      whereCondition.id = filtro.idColaborador;
    }

    const colaboradores = await this.prismaService.colaborador.findMany({
      where: whereCondition,
      include: {
        usuario: true,
        _count: {
          select: {
            atendimentoResponsaveis: {
              where: {
                atendimento: {
                  criadoEm: {
                    gte: dataInicio,
                    lte: dataFim,
                  },
                },
              },
            },
          },
        },
      },
    });

    const modos = [...Object.values(MODO_ATENDIMENTO)];
    const resultadoPorModo = [];

    for (const modo of modos) {
      const vendedoresDoModo = [];

      if (!filtro.idColaborador && colaboradores.length > 0) {
        // Relatório consolidado para o modo
        const relatorioConsolidado = await this.gerarRelatorioConsolidadoVendedoresSimplesPorModo(
          idLoja,
          dataInicio,
          dataFim,
          colaboradores,
          modo,
        );
        vendedoresDoModo.push(...relatorioConsolidado);
      } else {
        // Relatórios individuais para o modo
        for (const colaborador of colaboradores) {
          const relatorio = await this.gerarRelatorioVendedorPorModo(
            colaborador,
            idLoja,
            dataInicio,
            dataFim,
            modo,
          );
          vendedoresDoModo.push(relatorio);
        }
      }

      // Calcular totais do modo
      const totalLeads = vendedoresDoModo.reduce((sum, v) => sum + v.totalLeads, 0);
      const totalConversoes = vendedoresDoModo.reduce((sum, v) => sum + v.convertidos, 0);
      const mediaConversaoGeral = totalLeads > 0 ? parseFloat(((totalConversoes / totalLeads) * 100).toFixed(2)) : 0;

      // Calcular totais de atendimentos showroom e online para o modo
      const totalShowroom = await this.calcularTotalAtendimentosShowroomPorModo(
        idLoja,
        dataInicio,
        dataFim,
        modo,
        filtro.idColaborador,
      );
      const totalOnline = await this.calcularTotalAtendimentosOnlinePorModo(
        idLoja,
        dataInicio,
        dataFim,
        modo,
        filtro.idColaborador,
      );

      // Calcular conversões online (não showroom)
      const numeroConversaoOnline = await this.prismaService.atendimento.count({
        where: {
          idLoja,
          criadoEm: { gte: dataInicio, lte: dataFim },
          status: STATUS_ATENDIMENTO.SUCESSO,
          origemAtendimento: { not: ORIGEM_ATENDIMENTO.SHOWROOM },
          ...(this.isModoAtendimento(modo) && { modoAtendimento: modo }),
          ...(filtro.idColaborador && { 
            atendimentoResponsaveis: { some: { idColaborador: filtro.idColaborador } }
          })
        },
      });

      // Calcular conversões showroom
      const numeroConversaoShowroom = await this.prismaService.atendimento.count({
        where: {
          idLoja,
          criadoEm: { gte: dataInicio, lte: dataFim },
          status: STATUS_ATENDIMENTO.SUCESSO,
          origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
          ...(this.isModoAtendimento(modo) && { modoAtendimento: modo }),
          ...(filtro.idColaborador && { 
            atendimentoResponsaveis: { some: { idColaborador: filtro.idColaborador } }
          })
        }
      });

      // Calcular total de atendimentos showroom para taxa de conversão
      const totalAtendimentosShowroom = await this.prismaService.atendimento.count({
        where: {
          idLoja,
          criadoEm: { gte: dataInicio, lte: dataFim },
          origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
          status: {
            in: [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL, STATUS_ATENDIMENTO.VISITA, STATUS_ATENDIMENTO.EM_NEGOCIACAO, STATUS_ATENDIMENTO.SUCESSO],
          },
          ...(this.isModoAtendimento(modo) && { modoAtendimento: modo }),
          ...(filtro.idColaborador && { 
            atendimentoResponsaveis: { some: { idColaborador: filtro.idColaborador } }
          })
        }
      });

      // Calcular taxa de conversão showroom
      const taxaConversaoShowroom = totalAtendimentosShowroom > 0 
        ? (numeroConversaoShowroom / totalAtendimentosShowroom) * 100 
        : 0;

      // Calcular taxa de conversão online para o modo
      const taxaConversaoOnline = await this.calcularTaxaConversaoOnlinePorModo(
        idLoja,
        dataInicio,
        dataFim,
        modo,
        filtro.idColaborador,
      );

      resultadoPorModo.push({
        modo: modo,
        vendedores: vendedoresDoModo,
        totalLeads,
        totalConversoes,
        mediaConversaoGeral,
        percentualConversao: mediaConversaoGeral,
        numeroConversaoOnline,
        numeroConversaoShowroom,
        taxaConversaoShowroom,
        totalShowroom,
        totalOnline,
        taxaConversaoOnline,
      });
    }

    // Sempre adicionar o modo "total" ao final
    const vendedoresTotal = [];

    if (!filtro.idColaborador && colaboradores.length > 0) {
      // Relatório consolidado para o modo total
      const relatorioConsolidadoTotal = await this.gerarRelatorioConsolidadoVendedoresSimplesPorModo(
        idLoja,
        dataInicio,
        dataFim,
        colaboradores,
        'total',
      );
      vendedoresTotal.push(...relatorioConsolidadoTotal);
    } else {
      // Relatórios individuais para o modo total
      for (const colaborador of colaboradores) {
        const relatorioTotal = await this.gerarRelatorioVendedorPorModo(
          colaborador,
          idLoja,
          dataInicio,
          dataFim,
          'total',
        );
        vendedoresTotal.push(relatorioTotal);
      }
    }

    // Calcular totais do modo "total"
    const totalLeadsTotal = vendedoresTotal.reduce((sum, v) => sum + v.totalLeads, 0);
    const totalConversoesTotal = vendedoresTotal.reduce((sum, v) => sum + v.convertidos, 0);
    const mediaConversaoGeralTotal = totalLeadsTotal > 0 ? parseFloat(((totalConversoesTotal / totalLeadsTotal) * 100).toFixed(2)) : 0;

    // Calcular totais de atendimentos showroom e online para o modo "total"
    const totalShowroomTotal = await this.calcularTotalAtendimentosShowroomPorModo(
      idLoja,
      dataInicio,
      dataFim,
      'total',
      filtro.idColaborador,
    );
    const totalOnlineTotal = await this.calcularTotalAtendimentosOnlinePorModo(
      idLoja,
      dataInicio,
      dataFim,
      'total',
      filtro.idColaborador,
    );

    // Calcular taxa de conversão online para o modo "total"
    const taxaConversaoOnlineTotal = await this.calcularTaxaConversaoOnlinePorModo(
      idLoja,
      dataInicio,
      dataFim,
      'total',
      filtro.idColaborador,
    );

    // Calcular conversões para o modo "total"
    const numeroConversaoOnlineTotal = await this.prismaService.atendimento.count({
      where: {
        idLoja,
        criadoEm: { gte: dataInicio, lte: dataFim },
        status: STATUS_ATENDIMENTO.SUCESSO,
        origemAtendimento: { not: ORIGEM_ATENDIMENTO.SHOWROOM },
        ...(filtro.idColaborador && { 
          atendimentoResponsaveis: { some: { idColaborador: filtro.idColaborador } }
        })
      },
    });

    const numeroConversaoShowroomTotal = await this.prismaService.atendimento.count({
      where: {
        idLoja,
        criadoEm: { gte: dataInicio, lte: dataFim },
        status: STATUS_ATENDIMENTO.SUCESSO,
        origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
        ...(filtro.idColaborador && { 
          atendimentoResponsaveis: { some: { idColaborador: filtro.idColaborador } }
        })
      },
    });

    const taxaConversaoShowroomTotal = totalShowroomTotal > 0 
      ? (numeroConversaoShowroomTotal / totalShowroomTotal) * 100 
      : 0;

    resultadoPorModo.push({
      modo: 'total',
      vendedores: vendedoresTotal,
      totalLeads: totalLeadsTotal,
      totalConversoes: totalConversoesTotal,
      mediaConversaoGeral: mediaConversaoGeralTotal,
      percentualConversao: mediaConversaoGeralTotal,
      numeroConversaoOnline: numeroConversaoOnlineTotal,
      numeroConversaoShowroom: numeroConversaoShowroomTotal,
      taxaConversaoShowroom: taxaConversaoShowroomTotal,
      totalShowroom: totalShowroomTotal,
      totalOnline: totalOnlineTotal,
      taxaConversaoOnline: taxaConversaoOnlineTotal,
    });

    return resultadoPorModo;
  }

  private async gerarRelatorioVendedorPorModo(
    colaborador: any,
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
  ): Promise<RelatorioVendedorDto> {
    // Se o modo for "total", consolidar dados de todos os modos
    if (modo === 'total') {
      const modos = Object.values(MODO_ATENDIMENTO);
      
      // Buscar dados de todos os modos
      const dadosPorModo = await Promise.all(
        modos.map(async (modoAtual) => {
          const [
            statusCounts,
            temperaturaCounts,
            serieHistorica,
            tempoMedioResposta,
            tempoMedioFinalizacao,
            conversaoPorTemperatura,
            tempoMedioPorEtapa,
          ] = await Promise.all([
            this.getStatusCountsForColaboradorPorModo(colaborador.id, dataInicio, dataFim, modoAtual),
            this.getTemperaturaCountsForColaboradorPorModo(colaborador.id, dataInicio, dataFim, modoAtual),
            this.gerarSerieHistoricaMensalPorModo(colaborador.id, dataInicio, dataFim, modoAtual),
            this.calcularTempoMedioRespostaColaboradorPorModo(colaborador.id, idLoja, dataInicio, dataFim, modoAtual),
            this.calcularTempoMedioFinalizacaoPorModo(idLoja, dataInicio, dataFim, modoAtual, colaborador.id),
            this.calcularConversaoPorTemperaturaPorModo(idLoja, dataInicio, dataFim, modoAtual, colaborador.id),
            this.calcularTempoMedioPorEtapaPorModo(idLoja, dataInicio, dataFim, modoAtual, colaborador.id),
          ]);
          
          return {
            statusCounts,
            temperaturaCounts,
            serieHistorica,
            tempoMedioResposta,
            tempoMedioFinalizacao,
            conversaoPorTemperatura,
            tempoMedioPorEtapa,
          };
        })
      );
      
      // Consolidar status counts
      const statusCountsConsolidado = dadosPorModo.reduce((acc, dados) => {
        dados.statusCounts.forEach(item => {
          const existing = acc.find(a => a.status === item.status);
          if (existing) {
            existing._count.status += item._count.status;
          } else {
            acc.push({ ...item });
          }
        });
        return acc;
      }, [] as any[]);
      
      // Consolidar temperatura counts
      const temperaturaCountsConsolidado = dadosPorModo.reduce((acc, dados) => {
        dados.temperaturaCounts.forEach(item => {
          const existing = acc.find(a => a.temperatura === item.temperatura);
          if (existing) {
            existing._count.temperatura += item._count.temperatura;
          } else {
            acc.push({ ...item });
          }
        });
        return acc;
      }, [] as any[]);
      
      // Consolidar série histórica
      const serieHistoricaConsolidada = dadosPorModo.reduce((acc, dados) => {
        dados.serieHistorica.forEach(item => {
          const existing = acc.find(a => a.mes === item.mes);
          if (existing) {
            existing.totalLeads += item.totalLeads;
            existing.convertidos += item.convertidos;
            existing.taxaConversao = existing.totalLeads > 0 ? 
              parseFloat(((existing.convertidos / existing.totalLeads) * 100).toFixed(2)) : 0;
          } else {
            acc.push({ ...item });
          }
        });
        return acc;
      }, [] as any[]);
      
      // Usar dados consolidados
      const statusCounts = statusCountsConsolidado;
      const temperaturaCounts = temperaturaCountsConsolidado;
      const serieHistorica = serieHistoricaConsolidada;
      const tempoMedioResposta = await this.calcularTempoMedioRespostaColaboradorPorModo(colaborador.id, idLoja, dataInicio, dataFim, modo);
      const tempoMedioFinalizacao = await this.calcularTempoMedioFinalizacaoPorModo(idLoja, dataInicio, dataFim, modo, colaborador.id);
      const conversaoPorTemperatura = await this.calcularConversaoPorTemperatura(idLoja, dataInicio, dataFim, colaborador.id);
      const tempoMedioPorEtapa = await this.calcularTempoMedioPorEtapa(idLoja, dataInicio, dataFim, colaborador.id);
      const motivosPerdasNegociais = await this.calcularMotivosPerdasNegociais(idLoja, dataInicio, dataFim, colaborador.id);
      
      // Continuar com o processamento normal usando os dados consolidados
      const totalLeads = statusCounts.reduce((sum, item) => sum + item._count.status, 0);
      const convertidos = statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.SUCESSO)?._count.status || 0;
      const atendimentosNaoConcluidos = statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.PERDIDO)?._count.status || 0;

      const emAtendimento = statusCounts
        .filter((s) =>
          [
            STATUS_ATENDIMENTO.CHAT,
            STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
            STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
            STATUS_ATENDIMENTO.EM_NEGOCIACAO,
          ].includes(s.status as STATUS_ATENDIMENTO),
        )
        .reduce((sum, item) => sum + item._count.status, 0);

      const emResgate = statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.RESGATE)?._count.status || 0;

      const leadsQualificados = statusCounts
        .filter((s) =>
          [
            STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
            STATUS_ATENDIMENTO.VISITA,
            STATUS_ATENDIMENTO.EM_NEGOCIACAO,
            STATUS_ATENDIMENTO.SUCESSO,
          ].includes(s.status as STATUS_ATENDIMENTO),
        )
        .reduce((sum, item) => sum + item._count.status, 0);

      const taxaConversao = totalLeads > 0 ? parseFloat(((convertidos / totalLeads) * 100).toFixed(2)) : 0;
      const taxaSucesso = totalLeads > 0 ? parseFloat(((convertidos / totalLeads) * 100).toFixed(2)) : 0;
      const taxaInsucesso = totalLeads > 0 ? parseFloat(((atendimentosNaoConcluidos / totalLeads) * 100).toFixed(2)) : 0;
      const mediaQualificacao = totalLeads > 0 ? parseFloat(((leadsQualificados / totalLeads) * 100).toFixed(2)) : 0;

      const segmentacaoTemperatura = {
        frio: temperaturaCounts.find((t) => t.temperatura === TEMPERATURA_ATENDIMENTO.FRIO)?._count.temperatura || 0,
        morno: temperaturaCounts.find((t) => t.temperatura === TEMPERATURA_ATENDIMENTO.MORNO)?._count.temperatura || 0,
        quente: temperaturaCounts.find((t) => t.temperatura === TEMPERATURA_ATENDIMENTO.QUENTE)?._count.temperatura || 0,
        total: totalLeads,
      };

      return {
        id: colaborador.id,
        nome: colaborador.nome || colaborador.usuario?.nome || 'Sem nome',
        avatar: colaborador.usuario?.urlFoto || colaborador.urlFoto || undefined,
        dataInicio,
        totalLeads,
        emAtendimento,
        emResgate,
        convertidos,
        taxaConversao,
        segmentacaoTemperatura,
        segmentacaoTemperaturaQualificacao: await this.calcularSegmentacaoTemperaturaQualificacao(idLoja, dataInicio, dataFim, undefined, colaborador.id),
        atendimentosBemSucedidos: convertidos,
        taxaSucesso,
        atendimentosNaoConcluidos,
        taxaInsucesso,
        mediaQualificacao,
        mediaConversao: taxaConversao,
        serieHistorica,
        insucessos: atendimentosNaoConcluidos,
        tempoMedioResposta,
        tempoMedioFinalizacao,
        conversaoPorTemperatura,
        tempoMedioPorEtapa,
        motivosPerdasNegociais,
        numeroConversaoOnline: 0,
        percentualConversao: taxaConversao,
        taxaConversaoShowroom: 0,
        numeroConversaoShowroom: 0,
        leadsVsConversoesVendedor: [],
      };
    }
    
    // Processamento normal para modos específicos
    const [
      statusCounts,
      temperaturaCounts,
      serieHistorica,
      tempoMedioResposta,
      tempoMedioFinalizacao,
      conversaoPorTemperatura,
      tempoMedioPorEtapa,
      motivosPerdasNegociais,
      segmentacaoTemperaturaQualificacao,
    ] = await Promise.all([
      this.getStatusCountsForColaboradorPorModo(colaborador.id, dataInicio, dataFim, modo),
      this.getTemperaturaCountsForColaboradorPorModo(colaborador.id, dataInicio, dataFim, modo),
      this.gerarSerieHistoricaMensalPorModo(colaborador.id, dataInicio, dataFim, modo),
      this.calcularTempoMedioRespostaColaboradorPorModo(colaborador.id, idLoja, dataInicio, dataFim, modo),
      this.calcularTempoMedioFinalizacaoPorModo(idLoja, dataInicio, dataFim, modo, colaborador.id),
      this.calcularConversaoPorTemperaturaPorModo(idLoja, dataInicio, dataFim, modo, colaborador.id),
      this.calcularTempoMedioPorEtapaPorModo(idLoja, dataInicio, dataFim, modo, colaborador.id),
      this.calcularMotivosPerdasNegociais(idLoja, dataInicio, dataFim, colaborador.id, modo),
      this.calcularSegmentacaoTemperaturaQualificacao(idLoja, dataInicio, dataFim, modo, colaborador.id),
    ]);

    const totalLeads = statusCounts.reduce((sum, item) => sum + item._count.status, 0);
    const convertidos = statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.SUCESSO)?._count.status || 0;
    const atendimentosNaoConcluidos = statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.PERDIDO)?._count.status || 0;

    const emAtendimento = statusCounts
      .filter((s) =>
        [
          STATUS_ATENDIMENTO.CHAT,
          STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
          STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
          STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        ].includes(s.status as STATUS_ATENDIMENTO),
      )
      .reduce((sum, item) => sum + item._count.status, 0);

    const emResgate = statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.RESGATE)?._count.status || 0;

    const leadsQualificados = statusCounts
      .filter((s) =>
        [
          STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
          STATUS_ATENDIMENTO.VISITA,
          STATUS_ATENDIMENTO.EM_NEGOCIACAO,
          STATUS_ATENDIMENTO.SUCESSO,
        ].includes(s.status as STATUS_ATENDIMENTO),
      )
      .reduce((sum, item) => sum + item._count.status, 0);

    const taxaConversao = totalLeads > 0 ? parseFloat(((convertidos / totalLeads) * 100).toFixed(2)) : 0;
    const taxaSucesso = totalLeads > 0 ? parseFloat(((convertidos / totalLeads) * 100).toFixed(2)) : 0;
    const taxaInsucesso = totalLeads > 0 ? parseFloat(((atendimentosNaoConcluidos / totalLeads) * 100).toFixed(2)) : 0;
    const mediaQualificacao = totalLeads > 0 ? parseFloat(((leadsQualificados / totalLeads) * 100).toFixed(2)) : 0;

    // Manter a segmentação simples para compatibilidade
    const segmentacaoTemperatura = {
      frio: temperaturaCounts.find((t) => t.temperatura === TEMPERATURA_ATENDIMENTO.FRIO)?._count.temperatura || 0,
      morno: temperaturaCounts.find((t) => t.temperatura === TEMPERATURA_ATENDIMENTO.MORNO)?._count.temperatura || 0,
      quente: temperaturaCounts.find((t) => t.temperatura === TEMPERATURA_ATENDIMENTO.QUENTE)?._count.temperatura || 0,
      total: totalLeads,
    };

    // Calcular conversões online (não showroom)
    const numeroConversaoOnline = await this.prismaService.atendimento.count({
      where: {
        idLoja,
        criadoEm: { gte: dataInicio, lte: dataFim },
        status: STATUS_ATENDIMENTO.SUCESSO,
        origemAtendimento: { not: ORIGEM_ATENDIMENTO.SHOWROOM },
        ...(this.isModoAtendimento(modo) && { modoAtendimento: modo }),
        atendimentoResponsaveis: { some: { idColaborador: colaborador.id } }
      },
    });

    // Calcular conversões showroom
    const numeroConversaoShowroom = await this.prismaService.atendimento.count({
      where: {
        idLoja,
        criadoEm: { gte: dataInicio, lte: dataFim },
        status: STATUS_ATENDIMENTO.SUCESSO,
        origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
        ...(this.isModoAtendimento(modo) && { modoAtendimento: modo }),
        atendimentoResponsaveis: { some: { idColaborador: colaborador.id } }
      }
    });

    // Calcular total de atendimentos showroom para taxa de conversão
    const totalAtendimentosShowroom = await this.prismaService.atendimento.count({
      where: {
        idLoja,
        criadoEm: { gte: dataInicio, lte: dataFim },
        origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
        status: {
          in: [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL, STATUS_ATENDIMENTO.VISITA, STATUS_ATENDIMENTO.EM_NEGOCIACAO, STATUS_ATENDIMENTO.SUCESSO],
        },
        ...(this.isModoAtendimento(modo) && { modoAtendimento: modo }),
        atendimentoResponsaveis: { some: { idColaborador: colaborador.id } }
      }
    });

    // Calcular percentual de conversão geral
    const percentualConversao = totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0;

    // Calcular taxa de conversão showroom
    const taxaConversaoShowroom = totalAtendimentosShowroom > 0 
      ? (numeroConversaoShowroom / totalAtendimentosShowroom) * 100 
      : 0;

    // Buscar todos os vendedores da loja para leadsVsConversoesVendedor
    const vendedoresLoja = await this.prismaService.colaborador.findMany({
      where: { idLoja },
      include: { usuario: true }
    });

    // Calcular leads vs conversões para todos os vendedores
    const leadsVsConversoesVendedor = await Promise.all(
      vendedoresLoja.map(async (vendedor) => {
        const leadsVendedor = await this.prismaService.atendimento.count({
          where: {
            idLoja,
            criadoEm: { gte: dataInicio, lte: dataFim },
            ...(this.isModoAtendimento(modo) && { modoAtendimento: modo }),
            atendimentoResponsaveis: { some: { idColaborador: vendedor.id } }
          }
        });

        const conversoesVendedor = await this.prismaService.atendimento.count({
          where: {
            idLoja,
            criadoEm: { gte: dataInicio, lte: dataFim },
            status: STATUS_ATENDIMENTO.SUCESSO,
            ...(this.isModoAtendimento(modo) && { modoAtendimento: modo }),
            atendimentoResponsaveis: { some: { idColaborador: vendedor.id } }
          }
        });

        return {
          id: vendedor.id,
          nome: vendedor.nome,
          avatar: vendedor?.urlFoto || vendedor.usuario?.urlFoto || undefined,
          leads: leadsVendedor,
          conversoes: conversoesVendedor
        };
      })
    );

    return {
      id: colaborador.id,
      nome: colaborador.nome || colaborador.usuario.nome || 'Sem nome',
      avatar: colaborador.usuario?.urlFoto || colaborador.urlFoto || undefined,
      dataInicio,
      totalLeads,
      emAtendimento,
      emResgate,
      convertidos,
      taxaConversao,
      segmentacaoTemperatura,
      segmentacaoTemperaturaQualificacao,
      atendimentosBemSucedidos: convertidos,
      taxaSucesso,
      atendimentosNaoConcluidos,
      taxaInsucesso,
      mediaQualificacao,
      mediaConversao: taxaConversao,
      serieHistorica,
      insucessos: atendimentosNaoConcluidos,
      tempoMedioResposta,
      tempoMedioFinalizacao,
      conversaoPorTemperatura,
      tempoMedioPorEtapa,
      motivosPerdasNegociais,
      numeroConversaoOnline,
      percentualConversao,
      taxaConversaoShowroom,
      numeroConversaoShowroom,
      leadsVsConversoesVendedor,
    };
  }

  private async gerarRelatorioConsolidadoVendedoresSimplesPorModo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    colaboradores: Array<{ id: string; nome: string; avatar?: string }>,
    modo: MODO_ATENDIMENTO | 'total',
  ): Promise<RelatorioVendedorDto[]> {
    // Se o modo for "total", consolidar dados de todos os modos
    if (modo === 'total') {
      const modos = Object.values(MODO_ATENDIMENTO);
      
      // Buscar atendimentos de todos os modos
      const atendimentosPorModo = await Promise.all(
        modos.map(async (modoAtual) => {
          return await this.prismaService.atendimento.findMany({
            where: {
              idLoja,
              modoAtendimento: modoAtual,
              criadoEm: {
                gte: dataInicio,
                lte: dataFim,
              },
              atendimentoResponsaveis: {
                some: {
                  idColaborador: {
                    in: colaboradores.map(c => c.id),
                  },
                },
              },
            },
            include: {
              atendimentoResponsaveis: true,
            },
          });
        })
      );
      
      // Consolidar todos os atendimentos
      const atendimentos = atendimentosPorModo.flat();
      
      // Consolidar dados
      const statusCounts = atendimentos.reduce((acc, atendimento) => {
        acc[atendimento.status] = (acc[atendimento.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const temperaturaCounts = atendimentos.reduce((acc, atendimento) => {
        if (atendimento.temperatura) {
          acc[atendimento.temperatura] = (acc[atendimento.temperatura] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const totalLeads = atendimentos.length;
      const convertidos = statusCounts[STATUS_ATENDIMENTO.SUCESSO] || 0;
      const atendimentosNaoConcluidos = statusCounts[STATUS_ATENDIMENTO.PERDIDO] || 0;

      const emAtendimento = [
        STATUS_ATENDIMENTO.CHAT,
        STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
      ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

      const emResgate = statusCounts[STATUS_ATENDIMENTO.RESGATE] || 0;

      const leadsQualificados = [
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.SUCESSO,
      ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

      const taxaConversao = totalLeads > 0 ? parseFloat(((convertidos / totalLeads) * 100).toFixed(2)) : 0;
      const taxaSucesso = totalLeads > 0 ? parseFloat(((convertidos / totalLeads) * 100).toFixed(2)) : 0;
      const taxaInsucesso = totalLeads > 0 ? parseFloat(((atendimentosNaoConcluidos / totalLeads) * 100).toFixed(2)) : 0;
      const mediaQualificacao = totalLeads > 0 ? parseFloat(((leadsQualificados / totalLeads) * 100).toFixed(2)) : 0;

      const segmentacaoTemperatura = {
        frio: temperaturaCounts[TEMPERATURA_ATENDIMENTO.FRIO] || 0,
        morno: temperaturaCounts[TEMPERATURA_ATENDIMENTO.MORNO] || 0,
        quente: temperaturaCounts[TEMPERATURA_ATENDIMENTO.QUENTE] || 0,
        total: totalLeads,
      };

      // Gerar série histórica consolidada para todos os colaboradores
      const serieHistorica = await this.gerarSerieHistoricaConsolidadaPorModo(colaboradores.map(c => c.id), dataInicio, dataFim, 'total');

      // Calcular tempos médios consolidados para todos os modos
      const tempoMedioResposta = await this.calcularTempoMedioResposta(idLoja, dataInicio, dataFim);
      const tempoMedioFinalizacao = await this.calcularTempoMedioFinalizacao(idLoja, dataInicio, dataFim);
      const conversaoPorTemperatura = await this.calcularConversaoPorTemperatura(idLoja, dataInicio, dataFim);
      const tempoMedioPorEtapa = await this.calcularTempoMedioPorEtapa(idLoja, dataInicio, dataFim);
      const motivosPerdasNegociais = await this.calcularMotivosPerdasNegociais(idLoja, dataInicio, dataFim, undefined, modo);

      return [{
        id: 'consolidado',
        nome: 'Todos os Colaboradores',
        avatar: undefined,
        dataInicio,
        totalLeads,
        emAtendimento,
        emResgate,
        convertidos,
        taxaConversao,
        segmentacaoTemperatura,
        segmentacaoTemperaturaQualificacao: await this.calcularSegmentacaoTemperaturaQualificacao(idLoja, dataInicio, dataFim, modo),
        atendimentosBemSucedidos: convertidos,
        taxaSucesso,
        atendimentosNaoConcluidos,
        taxaInsucesso,
        mediaQualificacao,
        mediaConversao: taxaConversao,
        serieHistorica,
        insucessos: atendimentosNaoConcluidos,
        tempoMedioResposta,
        tempoMedioFinalizacao,
        conversaoPorTemperatura,
        tempoMedioPorEtapa,
        motivosPerdasNegociais,
        numeroConversaoOnline: 0,
        percentualConversao: taxaConversao,
        taxaConversaoShowroom: 0,
        numeroConversaoShowroom: 0,
        leadsVsConversoesVendedor: [],
      }];
    }
    
    // Processamento normal para modos específicos
    // Buscar todos os atendimentos do período para o modo específico
    const atendimentos = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        modoAtendimento: modo,
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
        atendimentoResponsaveis: {
          some: {
            idColaborador: {
              in: colaboradores.map(c => c.id),
            },
          },
        },
      },
      include: {
        atendimentoResponsaveis: true,
      },
    });

    // Consolidar dados
    const statusCounts = atendimentos.reduce((acc, atendimento) => {
      acc[atendimento.status] = (acc[atendimento.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const temperaturaCounts = atendimentos.reduce((acc, atendimento) => {
      if (atendimento.temperatura) {
        acc[atendimento.temperatura] = (acc[atendimento.temperatura] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalLeads = atendimentos.length;
    const convertidos = statusCounts[STATUS_ATENDIMENTO.SUCESSO] || 0;
    const atendimentosNaoConcluidos = statusCounts[STATUS_ATENDIMENTO.PERDIDO] || 0;

    const emAtendimento = [
      STATUS_ATENDIMENTO.CHAT,
      STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
      STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
      STATUS_ATENDIMENTO.EM_NEGOCIACAO,
    ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

    const emResgate = statusCounts[STATUS_ATENDIMENTO.RESGATE] || 0;

    const leadsQualificados = [
      STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
      STATUS_ATENDIMENTO.VISITA,
      STATUS_ATENDIMENTO.EM_NEGOCIACAO,
      STATUS_ATENDIMENTO.SUCESSO,
    ].reduce((sum, status) => sum + (statusCounts[status] || 0), 0);

    const taxaConversao = totalLeads > 0 ? parseFloat(((convertidos / totalLeads) * 100).toFixed(2)) : 0;
    const taxaSucesso = totalLeads > 0 ? parseFloat(((convertidos / totalLeads) * 100).toFixed(2)) : 0;
    const taxaInsucesso = totalLeads > 0 ? parseFloat(((atendimentosNaoConcluidos / totalLeads) * 100).toFixed(2)) : 0;
    const mediaQualificacao = totalLeads > 0 ? parseFloat(((leadsQualificados / totalLeads) * 100).toFixed(2)) : 0;

    const segmentacaoTemperatura = {
      frio: temperaturaCounts[TEMPERATURA_ATENDIMENTO.FRIO] || 0,
      morno: temperaturaCounts[TEMPERATURA_ATENDIMENTO.MORNO] || 0,
      quente: temperaturaCounts[TEMPERATURA_ATENDIMENTO.QUENTE] || 0,
      total: totalLeads,
    };

    // Gerar série histórica consolidada
    const serieHistorica = await this.gerarSerieHistoricaConsolidadaPorModo(colaboradores.map(c => c.id), dataInicio, dataFim, modo);

    // Calcular tempos médios consolidados
    const tempoMedioResposta = await this.calcularTempoMedioRespostaCompleto(idLoja, dataInicio, dataFim, modo);
    const tempoMedioFinalizacao = await this.calcularTempoMedioFinalizacaoPorModo(idLoja, dataInicio, dataFim, modo);
    const conversaoPorTemperatura = await this.calcularConversaoPorTemperaturaPorModo(idLoja, dataInicio, dataFim, modo);
    const tempoMedioPorEtapa = await this.calcularTempoMedioPorEtapaPorModo(idLoja, dataInicio, dataFim, modo);
    const motivosPerdasNegociais = await this.calcularMotivosPerdasNegociais(idLoja, dataInicio, dataFim);

    return [{
      id: 'consolidado',
      nome: 'Todos os Colaboradores',
      avatar: undefined,
      dataInicio,
      totalLeads,
      emAtendimento,
      emResgate,
      convertidos,
      taxaConversao,
      segmentacaoTemperatura,
      segmentacaoTemperaturaQualificacao: await this.calcularSegmentacaoTemperaturaQualificacao(idLoja, dataInicio, dataFim, modo),
      atendimentosBemSucedidos: convertidos,
      taxaSucesso,
      atendimentosNaoConcluidos,
      taxaInsucesso,
      mediaQualificacao,
      mediaConversao: taxaConversao,
      serieHistorica,
      insucessos: atendimentosNaoConcluidos,
      tempoMedioResposta,
      tempoMedioFinalizacao,
      conversaoPorTemperatura,
      tempoMedioPorEtapa,
      motivosPerdasNegociais,
      numeroConversaoOnline: 0,
      percentualConversao: taxaConversao,
      taxaConversaoShowroom: 0,
      numeroConversaoShowroom: 0,
      leadsVsConversoesVendedor: [],
    }];
  }

  async gerarRankingVendedores(
    idLoja: string,
    filtro: FiltroRelatorioDto,
  ): Promise<RankingVendedorDto> {
    const relatorios = await this.gerarRelatorioPorVendedor(idLoja, filtro);

    const topConversao = relatorios
      .sort((a, b) => b.taxaConversao - a.taxaConversao)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        nome: r.nome,
        taxaConversao: r.taxaConversao,
      }));

    const topQualificacao = relatorios
      .sort((a, b) => b.mediaQualificacao - a.mediaQualificacao)
      .slice(0, 5)
      .map((r) => ({
        id: r.id,
        nome: r.nome,
        mediaQualificacao: r.mediaQualificacao,
      }));

    return {
      topConversao,
      topQualificacao,
    };
  }

  // 2. Relatório de Atendimentos por Canal
  async gerarRelatorioPorCanal(
    idLoja: string,
    filtro: FiltroRelatorioDto,
  ): Promise<RelatorioCanaisDto> {
    // Gerar dados para cada modo de atendimento
    const modos = Object.values(MODO_ATENDIMENTO);
    const dados: any[] = [];
    
    // Processar cada modo individualmente
    for (const modo of modos) {
      const filtroModo = { ...filtro, modoAtendimento: modo };
      const dadosModo = await this.processarDadosCanaisPorModo(idLoja, filtroModo);
      dados.push({
        modo: modo.toLowerCase(),
        ...dadosModo,
      });
    }
    
    // Gerar dados totais (sem filtro de modo)
    const filtroTotal = { ...filtro };
    delete filtroTotal.modoAtendimento;
    const dadosTotal = await this.processarDadosCanaisPorModo(idLoja, filtroTotal);
    dados.push({
      modo: 'total',
      ...dadosTotal,
    });
    
    return dados as RelatorioCanaisDto;
  }

  private async processarDadosCanaisPorModo(
    idLoja: string,
    filtro: FiltroRelatorioDto,
  ) {
    const dataInicio = new Date(filtro.dataInicio);
    const dataFim = new Date(filtro.dataFim);
    const { idColaborador, modoAtendimento } = filtro;

    const diasPeriodo = differenceInDays(dataFim, dataInicio) + 1;
    const dataInicioAnterior = subDays(dataInicio, diasPeriodo);
    const dataFimAnterior = subDays(dataFim, diasPeriodo);

    const whereCondition: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    const whereConditionAnterior: any = {
      idLoja,
      criadoEm: {
        gte: dataInicioAnterior,
        lte: dataFimAnterior,
      },
    };

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
      whereConditionAnterior.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    if (modoAtendimento) {
      whereCondition.modoAtendimento = modoAtendimento;
      whereConditionAnterior.modoAtendimento = modoAtendimento;
    }

    const [dadosAgregados, dadosDiarios, dadosMensais, dadosAgregadosAnteriores] = await Promise.all([
      this.prismaService.atendimento.groupBy({
        by: ['origemAtendimento', 'status'],
        where: whereCondition,
        _count: true,
      }),

      idColaborador 
        ? (modoAtendimento 
          ? this.prismaService.$queryRaw`
            SELECT 
              a."origem_atendimento" as canal,
              DATE(a."criado_em") as data,
              COUNT(*) as leads,
              COUNT(CASE WHEN a.status = 'SUCESSO' THEN 1 END) as conversoes
            FROM "atendimento" a
            INNER JOIN "atendimento_responsaveis" ar ON a."id" = ar."id_atendimento"
            WHERE a."id_loja" = ${idLoja}
              AND a."criado_em" >= ${dataInicio}
              AND a."criado_em" <= ${dataFim}
              AND ar."id_colaborador" = ${idColaborador}
              AND a."modo_atendimento" = ${modoAtendimento}
            GROUP BY a."origem_atendimento", DATE(a."criado_em")
            ORDER BY a."origem_atendimento", data
          `
          : this.prismaService.$queryRaw`
            SELECT 
              a."origem_atendimento" as canal,
              DATE(a."criado_em") as data,
              COUNT(*) as leads,
              COUNT(CASE WHEN a.status = 'SUCESSO' THEN 1 END) as conversoes
            FROM "atendimento" a
            INNER JOIN "atendimento_responsaveis" ar ON a."id" = ar."id_atendimento"
            WHERE a."id_loja" = ${idLoja}
              AND a."criado_em" >= ${dataInicio}
              AND a."criado_em" <= ${dataFim}
              AND ar."id_colaborador" = ${idColaborador}
            GROUP BY a."origem_atendimento", DATE(a."criado_em")
            ORDER BY a."origem_atendimento", data
          `)
        : (modoAtendimento
          ? this.prismaService.$queryRaw`
            SELECT 
              "origem_atendimento" as canal,
              DATE("criado_em") as data,
              COUNT(*) as leads,
              COUNT(CASE WHEN status = 'SUCESSO' THEN 1 END) as conversoes
            FROM "atendimento"
            WHERE "id_loja" = ${idLoja}
              AND "criado_em" >= ${dataInicio}
              AND "criado_em" <= ${dataFim}
              AND "modo_atendimento" = ${modoAtendimento}
            GROUP BY "origem_atendimento", DATE("criado_em")
            ORDER BY "origem_atendimento", data
          `
          : this.prismaService.$queryRaw`
            SELECT 
              "origem_atendimento" as canal,
              DATE("criado_em") as data,
              COUNT(*) as leads,
              COUNT(CASE WHEN status = 'SUCESSO' THEN 1 END) as conversoes
            FROM "atendimento"
            WHERE "id_loja" = ${idLoja}
              AND "criado_em" >= ${dataInicio}
              AND "criado_em" <= ${dataFim}
            GROUP BY "origem_atendimento", DATE("criado_em")
            ORDER BY "origem_atendimento", data
          `),

      idColaborador
        ? (modoAtendimento
          ? this.prismaService.$queryRaw`
            SELECT 
              a."origem_atendimento" as canal,
              DATE_TRUNC('month', a."criado_em") as mes,
              COUNT(*) as leads,
              COUNT(CASE WHEN a.status IN ('ATENDIMENTO_INICIAL', 'VISITA', 'EM_NEGOCIACAO', 'SUCESSO') THEN 1 END) as qualificacoes,
              COUNT(CASE WHEN a.status = 'SUCESSO' THEN 1 END) as conversoes
            FROM "atendimento" a
            INNER JOIN "atendimento_responsaveis" ar ON a."id" = ar."id_atendimento"
            WHERE a."id_loja" = ${idLoja}
              AND a."criado_em" >= ${dataInicio}
              AND a."criado_em" <= ${dataFim}
              AND ar."id_colaborador" = ${idColaborador}
              AND a."modo_atendimento" = ${modoAtendimento}
            GROUP BY a."origem_atendimento", DATE_TRUNC('month', a."criado_em")
            ORDER BY a."origem_atendimento", mes
          `
          : this.prismaService.$queryRaw`
            SELECT 
              a."origem_atendimento" as canal,
              DATE_TRUNC('month', a."criado_em") as mes,
              COUNT(*) as leads,
              COUNT(CASE WHEN a.status IN ('ATENDIMENTO_INICIAL', 'VISITA', 'EM_NEGOCIACAO', 'SUCESSO') THEN 1 END) as qualificacoes,
              COUNT(CASE WHEN a.status = 'SUCESSO' THEN 1 END) as conversoes
            FROM "atendimento" a
            INNER JOIN "atendimento_responsaveis" ar ON a."id" = ar."id_atendimento"
            WHERE a."id_loja" = ${idLoja}
              AND a."criado_em" >= ${dataInicio}
              AND a."criado_em" <= ${dataFim}
              AND ar."id_colaborador" = ${idColaborador}
            GROUP BY a."origem_atendimento", DATE_TRUNC('month', a."criado_em")
            ORDER BY a."origem_atendimento", mes
          `)
        : (modoAtendimento
          ? this.prismaService.$queryRaw`
            SELECT 
              "origem_atendimento" as canal,
              DATE_TRUNC('month', "criado_em") as mes,
              COUNT(*) as leads,
              COUNT(CASE WHEN status IN ('ATENDIMENTO_INICIAL', 'VISITA', 'EM_NEGOCIACAO', 'SUCESSO') THEN 1 END) as qualificacoes,
              COUNT(CASE WHEN status = 'SUCESSO' THEN 1 END) as conversoes
            FROM "atendimento"
            WHERE "id_loja" = ${idLoja}
              AND "criado_em" >= ${dataInicio}
              AND "criado_em" <= ${dataFim}
              AND "modo_atendimento" = ${modoAtendimento}
            GROUP BY "origem_atendimento", DATE_TRUNC('month', "criado_em")
            ORDER BY "origem_atendimento", mes
          `
          : this.prismaService.$queryRaw`
            SELECT 
              "origem_atendimento" as canal,
              DATE_TRUNC('month', "criado_em") as mes,
              COUNT(*) as leads,
              COUNT(CASE WHEN status IN ('ATENDIMENTO_INICIAL', 'VISITA', 'EM_NEGOCIACAO', 'SUCESSO') THEN 1 END) as qualificacoes,
              COUNT(CASE WHEN status = 'SUCESSO' THEN 1 END) as conversoes
            FROM "atendimento"
            WHERE "id_loja" = ${idLoja}
              AND "criado_em" >= ${dataInicio}
              AND "criado_em" <= ${dataFim}
            GROUP BY "origem_atendimento", DATE_TRUNC('month', "criado_em")
            ORDER BY "origem_atendimento", mes
          `),

      this.prismaService.atendimento.groupBy({
        by: ['origemAtendimento', 'status'],
        where: whereConditionAnterior,
        _count: true,
      }),
    ]);

    const calcularCrescimento = (valorAtual: number, valorAnterior: number): number => {
      if (valorAnterior === 0) {
        return valorAtual > 0 ? 100 : 0;
      }
      return parseFloat((((valorAtual - valorAnterior) / valorAnterior) * 100).toFixed(2));
    };

    const canaisAnterioresMap = new Map<string, { leadsTotal: number; conversoes: number }>();
    
    (Object.values(ORIGEM_ATENDIMENTO) as string[]).forEach((canal) => {
      canaisAnterioresMap.set(canal, {
        leadsTotal: 0,
        conversoes: 0,
      });
    });

    dadosAgregadosAnteriores.forEach((item: any) => {
      const canal = canaisAnterioresMap.get(item.origemAtendimento);
      if (canal) {
        canal.leadsTotal += item._count;
        if (item.status === STATUS_ATENDIMENTO.SUCESSO) {
          canal.conversoes += item._count;
        }
      }
    });

    const canaisMap = new Map<string, any>();

    (Object.values(ORIGEM_ATENDIMENTO) as string[]).forEach((canal) => {
      const metadata = this.canalMetadata[canal] || {
        nomeExibicao: canal,
        iconeUrl: undefined,
      };

      canaisMap.set(canal, {
        canal,
        nomeExibicao: metadata.nomeExibicao,
        iconeUrl: metadata.iconeUrl,
        leadsTotal: 0,
        conversoes: 0,
        taxaConversao: 0,
        resumoDia: [],
        serieHistorica: [],
      });
    });

    dadosAgregados.forEach((item: any) => {
      const canal = canaisMap.get(item.origemAtendimento);
      if (canal) {
        canal.leadsTotal += item._count;
        if (item.status === STATUS_ATENDIMENTO.SUCESSO) {
          canal.conversoes += item._count;
        }
      }
    });

    const dadosDiariosMap = new Map<string, Map<string, any>>();
    (dadosDiarios as any[]).forEach((item: any) => {
      if (!dadosDiariosMap.has(item.canal)) {
        dadosDiariosMap.set(item.canal, new Map());
      }
      dadosDiariosMap
        .get(item.canal)!
        .set(item.data.toISOString().split('T')[0], {
          data: format(new Date(item.data), 'yyyy-MM-dd'),
          leads: Number(item.leads),
          conversoes: Number(item.conversoes),
        });
    });

    const dadosMensaisMap = new Map<string, Map<string, any>>();
    (dadosMensais as any[]).forEach((item: any) => {
      if (!dadosMensaisMap.has(item.canal)) {
        dadosMensaisMap.set(item.canal, new Map());
      }
      dadosMensaisMap
        .get(item.canal)!
        .set(format(new Date(item.mes), 'yyyy-MM'), {
          mes: format(new Date(item.mes), 'MMM yyyy', { locale: ptBR }).toUpperCase(),
          leads: Number(item.leads),
          qualificacoes: Number(item.qualificacoes),
          conversoes: Number(item.conversoes),
        });
    });

    canaisMap.forEach((canal, canalKey) => {
      canal.taxaConversao =
        canal.leadsTotal > 0 ? parseFloat(((canal.conversoes / canal.leadsTotal) * 100).toFixed(2)) : 0;

      const resumoDiarioCanal = dadosDiariosMap.get(canalKey) || new Map();
      let dataAtual = new Date(dataInicio);
      while (dataAtual <= dataFim) {
        const dataStr = format(dataAtual, 'yyyy-MM-dd');
        canal.resumoDia.push(
          resumoDiarioCanal.get(dataStr) || {
            data: dataStr,
            leads: 0,
            conversoes: 0,
          },
        );
        dataAtual = new Date(dataAtual.getTime() + 24 * 60 * 60 * 1000);
      }

      const serieMensalCanal = dadosMensaisMap.get(canalKey) || new Map();
      let dataAtualMes = startOfMonth(dataInicio);
      while (dataAtualMes <= dataFim) {
        const mesStr = format(dataAtualMes, 'yyyy-MM');
        canal.serieHistorica.push(
          serieMensalCanal.get(mesStr) || {
            mes: mesStr,
            leads: 0,
            qualificacoes: 0,
            conversoes: 0,
          },
        );
        dataAtualMes = new Date(
          dataAtualMes.getFullYear(),
          dataAtualMes.getMonth() + 1,
          1,
        );
      }
    });

    const canais = Array.from(canaisMap.values());

    const totalLeads = canais.reduce((sum, canal) => sum + canal.leadsTotal, 0);
    const totalConversoes = canais.reduce(
      (sum, canal) => sum + canal.conversoes,
      0,
    );
    const mediaConversaoGeral =
      parseFloat((totalLeads > 0 ? (totalConversoes / totalLeads) * 100 : 0).toFixed(2));

    const destaquesPorLeads = canais
      .sort((a, b) => b.leadsTotal - a.leadsTotal)
      .slice(0, 3)
      .map((c) => {
        const canalAnterior = canaisAnterioresMap.get(c.canal);
        const crescimento = calcularCrescimento(c.leadsTotal, canalAnterior?.leadsTotal || 0);
        return {
          canal: c.canal,
          nomeExibicao: c.nomeExibicao,
          valor: c.leadsTotal,
          crescimento,
        };
      });

    const destaquesPorConversas = canais
      .sort((a, b) => b.conversoes - a.conversoes)
      .slice(0, 3)
      .map((c) => {
        const canalAnterior = canaisAnterioresMap.get(c.canal);
        const crescimento = calcularCrescimento(c.conversoes, canalAnterior?.conversoes || 0);
        return {
          canal: c.canal,
          nomeExibicao: c.nomeExibicao,
          valor: c.conversoes,
          crescimento,
        };
      });

    const todosLeads: any[] = [];
    const todasConversoes: any[] = [];
    
    // Agregar dados por canal considerando todo o período
    (Object.values(ORIGEM_ATENDIMENTO) as string[]).forEach((canal) => {
      const metadata = this.canalMetadata[canal] || {
        nomeExibicao: canal,
      };
      
      const dadosCanal = dadosMensaisMap.get(canal);
      
      if (dadosCanal) {
        let totalLeadsCanal = 0;
        let totalConversoesCanal = 0;
        
        // Somar todos os leads e conversões do canal em todos os meses
        dadosCanal.forEach((dadosMes) => {
          totalLeadsCanal += dadosMes.leads;
          totalConversoesCanal += dadosMes.conversoes;
        });
        
        if (totalLeadsCanal > 0) {
          todosLeads.push({
            canal,
            nomeExibicao: metadata.nomeExibicao,
            valor: totalLeadsCanal,
          });
        }
        
        if (totalConversoesCanal > 0) {
          todasConversoes.push({
            canal,
            nomeExibicao: metadata.nomeExibicao,
            valor: totalConversoesCanal,
          });
        }
      }
    });

    const rankingPorLeads = todosLeads
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 7)
      .map((item, index) => ({
        ...item,
        posicao: index + 1,
      }));

    const rankingPorConversoes = todasConversoes
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 7)
      .map((item, index) => ({
        ...item,
        posicao: index + 1,
      }));

    return {
      canais: canais.sort((a, b) => b.taxaConversao - a.taxaConversao),
      totalLeads,
      totalConversoes,
      mediaConversaoGeral,
      destaques: {
        porLeads: destaquesPorLeads,
        porConversas: destaquesPorConversas,
      },
      ranking: {
        porLeads: rankingPorLeads,
        porConversoes: rankingPorConversoes,
      },
    };
  }

  // 3. Relatório Detalhado por Vendedor
  async gerarRelatorioDetalhadoVendedor(
    idLoja: string,
    filtro: FiltroRelatorioDto,
    idUsuarioLogado?: string,
  ): Promise<RelatorioDetalhadoVendedorDto[]> {
    const dataInicio = new Date(filtro.dataInicio);
    const dataFim = new Date(filtro.dataFim);

    if (!filtro.idColaborador) {
      const relatorioConsolidado = await this.gerarRelatorioConsolidadoVendedores(idLoja, dataInicio, dataFim, idUsuarioLogado);
      return relatorioConsolidado;
    }

    const colaborador = await this.prismaService.colaborador.findUnique({
      where: { id: filtro.idColaborador, idLoja },
      include: {
        usuario: true,
        atendimentoResponsaveis: {
          include: {
            atendimento: {
              include: {
                cliente: true,
                clienteTemporario: true,
                visitasAtendimento: true,
                chat: {
                  include: {
                    mensagem: {
                      orderBy: { criadoEm: 'asc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
          where: {
            atendimento: {
              criadoEm: {
                gte: dataInicio,
                lte: dataFim,
              },
            },
          },
        },
      },
    });

    if (!colaborador) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    const atendimentos = colaborador.atendimentoResponsaveis.map(
      (ar) => ar.atendimento,
    );

    const totalLeads = atendimentos.length;
    const conversoes = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.SUCESSO,
    ).length;
    const percentualConversao =
      totalLeads > 0 ? parseFloat(((conversoes / totalLeads) * 100).toFixed(2)) : 0;

    const graficoLeadsPorCanal = await this.gerarGraficoLeadsPorCanal(
      filtro.idColaborador,
      dataInicio,
      dataFim,
    );

    // Segmentação por status
    const segmentacaoStatus = {
      inicial: atendimentos.filter((a) =>
        [STATUS_ATENDIMENTO.CHAT, STATUS_ATENDIMENTO.PRE_ATENDIMENTO].includes(
          a.status as STATUS_ATENDIMENTO,
        ),
      ).length,
      emVisita: atendimentos.filter(
        (a) => a.status === STATUS_ATENDIMENTO.VISITA,
      ).length,
      resgate: atendimentos.filter(
        (a) => a.status === STATUS_ATENDIMENTO.RESGATE,
      ).length,
      negociacao: atendimentos.filter(
        (a) => a.status === STATUS_ATENDIMENTO.EM_NEGOCIACAO,
      ).length,
      total: 0, 
    };

    // Calcular o total da segmentação por status
    segmentacaoStatus.total = segmentacaoStatus.inicial + segmentacaoStatus.emVisita + 
      segmentacaoStatus.resgate + segmentacaoStatus.negociacao;

    // Segmentação por temperatura
    const segmentacaoTemperatura = {
      frio: atendimentos.filter(
        (a) => a.temperatura === TEMPERATURA_ATENDIMENTO.FRIO,
      ).length,
      morno: atendimentos.filter(
        (a) => a.temperatura === TEMPERATURA_ATENDIMENTO.MORNO,
      ).length,
      quente: atendimentos.filter(
        (a) => a.temperatura === TEMPERATURA_ATENDIMENTO.QUENTE,
      ).length,
    };

    // Taxa de conversão showroom
    const totalAtendimentosShowroom = atendimentos.filter(
      (a) => a.origemAtendimento === ORIGEM_ATENDIMENTO.SHOWROOM,
    ).length;
    const conversaoShowroom = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.SUCESSO && 
             a.origemAtendimento === ORIGEM_ATENDIMENTO.SHOWROOM,
    ).length;
    const taxaConversaoShowroom =
      totalAtendimentosShowroom > 0
        ? parseFloat(((conversaoShowroom / totalAtendimentosShowroom) * 100).toFixed(2))
        : 0;

    // Tempo médio de resposta
    const tempoMedioResposta = await this.calcularTempoMedioResposta(
      idLoja,
      dataInicio,
      dataFim,
    );

    const insucessos = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.PERDIDO,
    ).length;

    const taxaInsucesso = totalLeads > 0 ? parseFloat(((insucessos / totalLeads) * 100).toFixed(2)) : 0;

    const taxaSucesso = totalLeads > 0 ? parseFloat(((conversoes / totalLeads) * 100).toFixed(2)) : 0;

    const tempoMedioFechamento = await this.calcularTempoMedioFinalizacao(
      idLoja,
      dataInicio,
      dataFim,
      filtro.idColaborador,
    );

    const numeroConversaoOnline = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.SUCESSO && 
             a.origemAtendimento !== ORIGEM_ATENDIMENTO.SHOWROOM,
    ).length;

    const numeroConversaoShowroom = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.SUCESSO && 
             a.origemAtendimento === ORIGEM_ATENDIMENTO.SHOWROOM,
    ).length;

    const tempoMedioPorEtapaNegociacao = await this.calcularTempoMedioPorEtapaNegociacao(
      idLoja,
      dataInicio,
      dataFim,
      filtro.idColaborador,
    );

    const motivosPerdasNegociais = await this.calcularMotivosPerdasNegociais(
      idLoja,
      dataInicio,
      dataFim,
      filtro.idColaborador,
    );

    const vendedoresLoja = await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        cargos: { some: { cargo: { in: ['Vendedor', 'Pré-vendedor'] } } },
      },
      include: { usuario: true },
    });

    // Calcular vendas de sucesso para todos os vendedores
    const vendedoresComVendas = await Promise.all(
      vendedoresLoja.map(async (v) => {
        const statusCountsV = await this.getStatusCountsForColaborador(
          v.id,
          dataInicio,
          dataFim,
        );
        const totalLeadsV = statusCountsV.reduce((sum, item) => sum + item._count, 0);
        const conversoesV =
          statusCountsV.find((s) => s.status === STATUS_ATENDIMENTO.SUCESSO)?._count || 0;
        return {
          id: v.id,
          nome: v.nome || v.usuario?.nome || 'Sem nome',
          avatar: v.usuario?.urlFoto ?? v.urlFoto ?? undefined,
          leads: totalLeadsV,
          conversoes: conversoesV,
        };
      }),
    );

    // Ordenar por conversões (vendas de sucesso) em ordem decrescente
    const vendedoresOrdenados = vendedoresComVendas.sort((a, b) => b.conversoes - a.conversoes);

    // Pegar os top 3 vendedores
    const top3Vendedores = vendedoresOrdenados.slice(0, 3);

    // Garantir que o usuário logado seja incluído se não estiver no top 3
    let leadsVsConversoesVendedor = [...top3Vendedores];
    
    if (idUsuarioLogado) {
      const usuarioLogadoNoTop3 = top3Vendedores.some(v => v.id === idUsuarioLogado);
      
      if (!usuarioLogadoNoTop3) {
        const usuarioLogado = vendedoresComVendas.find(v => v.id === idUsuarioLogado);
        if (usuarioLogado) {
          leadsVsConversoesVendedor.push(usuarioLogado);
        }
      }
    }

    const rankingMensal = await this.calcularPosicaoRankingMensal(
      filtro.idColaborador,
      idLoja,
      dataInicio,
      dataFim,
    );

    // Calcular vendas diárias para os vendedores do ranking
    const vendedoresParaVendasDiarias = leadsVsConversoesVendedor.map(v => ({
      id: v.id,
      nome: v.nome,
      avatar: v.avatar,
    }));
    
    const vendasDiariasPorVendedor = await this.calcularVendasDiariasPorVendedor(
      vendedoresParaVendasDiarias,
      dataInicio,
      dataFim,
    );

    const leadsQualificados = atendimentos.filter((a) =>
      [
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.SUCESSO,
      ].includes(a.status as STATUS_ATENDIMENTO),
    ).length;
    const mediaQualificacao =
      totalLeads > 0 ? (leadsQualificados / totalLeads) * 100 : 0;

    return [{
      vendedor: {
        id: colaborador.id,
        nome: colaborador.nome || colaborador.usuario.nome || 'Sem nome',
        avatar: colaborador.usuario?.urlFoto || colaborador.urlFoto || undefined,
      },
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
      totalLeads,
      percentualConversao,
      atendimentosBemSucedidos: conversoes,
      totalVendasGeradas: conversoes,
      graficoLeadsPorCanal,
      mediaQualificacao,
      mediaConversao: percentualConversao,
      segmentacaoStatus,
      segmentacaoTemperatura,
      segmentacaoTemperaturaQualificacao: await this.calcularSegmentacaoTemperaturaQualificacao(
        idLoja,
        dataInicio,
        dataFim,
        undefined,
        colaborador.id,
      ),
      taxaConversaoShowroom,
      tempoMedioResposta,
      insucessos,
      taxaInsucesso,
      taxaSucesso,
      tempoMedioFechamento,
      numeroConversaoOnline,
      numeroConversaoShowroom,
      tempoMedioPorEtapaNegociacao,
      motivosPerdasNegociais,
      leadsVsConversoesVendedor,
      rankingMensal,
      vendasDiariasPorVendedor,
    }];
  }

  // 4. Relatório Geral
  async gerarRelatorioGeral(
    idLoja: string,
    filtro: FiltroRelatorioDto,
  ): Promise<RelatorioGeralDto> {
    const dataInicio = new Date(filtro.dataInicio);
    const dataFim = new Date(filtro.dataFim);

    const [
      rankingCanais,
      visaoPreVenda,
      rankingVendedores,
      relatorioPorModo,
      tempoMedioRespostaGeral,
      tempoMedioFinalizacaoGeral,
      conversaoPorTemperaturaGeral,
      metricasVisitasPreVendedores,
      metricasVisitasGeral,
      tempoMedioPorEtapaNegociacaoGeral,
      atendimentosPreAtendimento,
      atendimentosVendas,
      motivosPerdasPreAtendimento,
    ] = await Promise.all([
      this.gerarRankingCanais(idLoja, dataInicio, dataFim, filtro.idColaborador),
      this.gerarVisaoPreVenda(idLoja, dataInicio, dataFim, filtro.idColaborador),
      this.gerarRankingVendedores(idLoja, filtro),
      this.gerarRelatorioPorModoAtendimento(idLoja, dataInicio, dataFim, filtro.idColaborador),
      this.calcularTempoMedioResposta(idLoja, dataInicio, dataFim, filtro.idColaborador),
      this.calcularTempoMedioFinalizacao(idLoja, dataInicio, dataFim, filtro.idColaborador),
      this.calcularConversaoPorTemperatura(idLoja, dataInicio, dataFim, filtro.idColaborador),
      this.calcularMetricasVisitasPreVendedor(idLoja, dataInicio, dataFim),
      this.calcularMetricasVisitasGeral(idLoja, dataInicio, dataFim),
      this.calcularTempoMedioPorEtapaNegociacao(idLoja, dataInicio, dataFim, filtro.idColaborador),
      this.buscarAtendimentosPreAtendimentoSemFollowUp(idLoja, filtro.idColaborador),
      this.buscarAtendimentosVendasSemFollowUp(idLoja, filtro.idColaborador),
      this.calcularMotivosPerdasPreAtendimento(idLoja, dataInicio, dataFim, filtro.idColaborador),
    ]);

    return {
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
      rankingCanais,
      visaoPreVenda,
      rankingVendedores,
      tempoMedioRespostaGeral,
      tempoMedioFinalizacaoGeral,
      conversaoPorTemperaturaGeral,
      metricasVisitasPreVendedores,
      metricasVisitasGeral,
      tempoMedioPorEtapaNegociacaoGeral,
      relatorioPorModo,
      atendimentosPreAtendimento,
      atendimentosVendas,
      motivosPerdasPreAtendimento,
    };
  }

  private async calcularTempoMedioPorEtapaPorModo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
    idColaborador?: string,
  ): Promise<{
    'Pré-atendimento': string;
    'Atendimento Inicial': string;
    'Visita': string;
    'Em Negociação': string;
    'Resgate': string;
  }> {
    const whereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (this.isModoAtendimento(modo)) {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereClause,
      select: {
        id: true,
        criadoEm: true,
        status: true,
      },
    });

    const temposPorEtapa = {
      [STATUS_ATENDIMENTO.PRE_ATENDIMENTO]: [],
      [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL]: [],
      [STATUS_ATENDIMENTO.VISITA]: [],
      [STATUS_ATENDIMENTO.EM_NEGOCIACAO]: [],
      [STATUS_ATENDIMENTO.RESGATE]: [],
    };

    const atendimentoIds = atendimentos.map(a => a.id);
    
    const todosOsLogs = await this.prismaService.logAtividadesAtendimento.findMany({
      where: {
        idAtendimento: { in: atendimentoIds },
        tipoEvento: 'STATUS_ALTERADO',
      },
      orderBy: { criadoEm: 'asc' },
      select: {
        idAtendimento: true,
        criadoEm: true,
        mensagem: true,
      },
    });

    const logsPorAtendimento = new Map<string, typeof todosOsLogs>();
    todosOsLogs.forEach(log => {
      const logs = logsPorAtendimento.get(log.idAtendimento) || [];
      logs.push(log);
      logsPorAtendimento.set(log.idAtendimento, logs);
    });

    for (const atendimento of atendimentos) {
      const logsStatus = logsPorAtendimento.get(atendimento.id) || [];

      let dataAnterior = atendimento.criadoEm;
      let statusAnterior = STATUS_ATENDIMENTO.PRE_ATENDIMENTO;

      logsStatus.forEach((log) => {
        const tempoNaEtapa = differenceInHours(log.criadoEm, dataAnterior);
        if (temposPorEtapa[statusAnterior]) {
          temposPorEtapa[statusAnterior].push(tempoNaEtapa);
        }
        dataAnterior = log.criadoEm;
        statusAnterior = this.extrairStatusDoLog(log.mensagem);
      });

      const agora = new Date();
      const dataFinal =
        atendimento.status === STATUS_ATENDIMENTO.SUCESSO ||
        atendimento.status === STATUS_ATENDIMENTO.PERDIDO
          ? dataAnterior
          : agora;

      const tempoFinal = differenceInHours(dataFinal, dataAnterior);
      if (temposPorEtapa[statusAnterior]) {
        temposPorEtapa[statusAnterior].push(tempoFinal);
      }
    }

    const calcularMedia = (tempos: number[]) => {
      if (!tempos || tempos.length === 0) return '0h 0min';
      const media =
        tempos.reduce((sum, tempo) => sum + tempo, 0) / tempos.length;
      const horas = Math.floor(media);
      const minutos = Math.round((media - horas) * 60);
      return `${horas}h ${minutos}min`;
    };

    return {
      'Pré-atendimento': calcularMedia(
        temposPorEtapa[STATUS_ATENDIMENTO.PRE_ATENDIMENTO],
      ),
      'Atendimento Inicial': calcularMedia(
        temposPorEtapa[STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL],
      ),
      'Visita': calcularMedia(temposPorEtapa[STATUS_ATENDIMENTO.VISITA]),
      'Em Negociação': calcularMedia(
        temposPorEtapa[STATUS_ATENDIMENTO.EM_NEGOCIACAO],
      ),
      'Resgate': calcularMedia(temposPorEtapa[STATUS_ATENDIMENTO.RESGATE]),
    };
  }

  private async getStatusCountsForColaboradorPorModo(
    idColaborador: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
  ) {
    return this.prismaService.atendimento.groupBy({
      by: ['status'],
      where: {
        modoAtendimento: modo,
        atendimentoResponsaveis: {
          some: {
            idColaborador,
          },
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _count: {
        status: true,
      },
    });
  }

  private async getTemperaturaCountsForColaboradorPorModo(
    idColaborador: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
  ) {
    return this.prismaService.atendimento.groupBy({
      by: ['temperatura'],
      where: {
        modoAtendimento: modo,
        atendimentoResponsaveis: {
          some: {
            idColaborador,
          },
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _count: {
        temperatura: true,
      },
    });
  }

  private async gerarSerieHistoricaMensalPorModo(
    idColaborador: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
  ) {
    const atendimentos = await this.prismaService.atendimento.findMany({
      where: {
        modoAtendimento: modo,
        atendimentoResponsaveis: {
          some: {
            idColaborador,
          },
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      select: {
        criadoEm: true,
        status: true,
      },
    });

    const serieHistorica = [];
    const currentDate = new Date(dataInicio);
    const endDate = new Date(dataFim);

    while (currentDate <= endDate) {
      const mesInicio = startOfMonth(currentDate);
      const mesFim = endOfMonth(currentDate);

      const atendimentosDoMes = atendimentos.filter(
        (atendimento) =>
          atendimento.criadoEm >= mesInicio && atendimento.criadoEm <= mesFim,
      );

      const leads = atendimentosDoMes.length;
      const conversoes = atendimentosDoMes.filter(
        (atendimento) => atendimento.status === STATUS_ATENDIMENTO.SUCESSO,
      ).length;

      serieHistorica.push({
        mes: format(currentDate, 'MMM', { locale: ptBR }),
        leads,
        conversoes,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return serieHistorica;
  }

  private async gerarSerieHistoricaConsolidadaPorModo(
    colaboradorIds: string[],
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
  ) {
    const atendimentos = await this.prismaService.atendimento.findMany({
      where: {
        modoAtendimento: modo,
        atendimentoResponsaveis: {
          some: {
            idColaborador: {
              in: colaboradorIds,
            },
          },
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      select: {
        criadoEm: true,
        status: true,
      },
    });

    const serieHistorica = [];
    const currentDate = new Date(dataInicio);
    const endDate = new Date(dataFim);

    while (currentDate <= endDate) {
      const mesInicio = startOfMonth(currentDate);
      const mesFim = endOfMonth(currentDate);

      const atendimentosDoMes = atendimentos.filter(
        (atendimento) =>
          atendimento.criadoEm >= mesInicio && atendimento.criadoEm <= mesFim,
      );

      const leads = atendimentosDoMes.length;
      const conversoes = atendimentosDoMes.filter(
        (atendimento) => atendimento.status === STATUS_ATENDIMENTO.SUCESSO,
      ).length;

      serieHistorica.push({
        mes: format(currentDate, 'MMM', { locale: ptBR }),
        leads,
        conversoes,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return serieHistorica;
  }

  private async calcularTempoMedioRespostaColaboradorPorModo(
    idColaborador: string,
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
  ): Promise<string> {
    return this.calcularTempoMedioRespostaCompleto(idLoja, dataInicio, dataFim, modo, idColaborador);
  }

  private async getStatusCountsForColaborador(
    idColaborador: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    return this.prismaService.atendimento.groupBy({
      by: ['status'],
      where: {
        atendimentoResponsaveis: {
          some: {
            idColaborador,
          },
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _count: true,
    });
  }

  private async getTemperaturaCountsForColaborador(
    idColaborador: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    return this.prismaService.atendimento.groupBy({
      by: ['temperatura'],
      where: {
        atendimentoResponsaveis: {
          some: {
            idColaborador,
          },
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      _count: true,
    });
  }

  private async getStatusCountsForCanal(
    canal: string,
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    const whereClause: any = {
      idLoja,
      origemAtendimento: canal,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return this.prismaService.atendimento.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });
  }

  private async getStatusCountsForLoja(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    const whereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return this.prismaService.atendimento.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });
  }

  private async getTemperaturaCountsForLoja(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    const whereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return this.prismaService.atendimento.groupBy({
      by: ['temperatura'],
      where: whereClause,
      _count: true,
    });
  }

  private async gerarSerieHistoricaMensal(
    idColaborador: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const serie = [];
    let dataAtual = startOfMonth(dataInicio);

    while (dataAtual <= dataFim) {
      const inicioMes = startOfMonth(dataAtual);
      const fimMes = endOfMonth(dataAtual);

      const [leads, conversoes] = await Promise.all([
        this.prismaService.atendimento.count({
          where: {
            atendimentoResponsaveis: {
              some: {
                idColaborador,
              },
            },
            criadoEm: {
              gte: inicioMes,
              lte: fimMes,
            },
          },
        }),
        this.prismaService.atendimento.count({
          where: {
            atendimentoResponsaveis: {
              some: {
                idColaborador,
              },
            },
            status: STATUS_ATENDIMENTO.SUCESSO,
            criadoEm: {
              gte: inicioMes,
              lte: fimMes,
            },
          },
        }),
      ]);

      serie.push({
        mes: format(dataAtual, 'yyyy-MM'),
        leads,
        conversoes,
      });

      dataAtual = new Date(
        dataAtual.getFullYear(),
        dataAtual.getMonth() + 1,
        1,
      );
    }

    return serie;
  }

  private async gerarResumoDiario(
    canal: string,
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const resumo = [];
    let dataAtual = new Date(dataInicio);

    while (dataAtual <= dataFim) {
      const inicioDia = new Date(
        dataAtual.getFullYear(),
        dataAtual.getMonth(),
        dataAtual.getDate(),
      );
      const fimDia = new Date(
        dataAtual.getFullYear(),
        dataAtual.getMonth(),
        dataAtual.getDate(),
        23,
        59,
        59,
      );

      const [leads, conversoes] = await Promise.all([
        this.prismaService.atendimento.count({
          where: {
            idLoja,
            origemAtendimento: canal,
            criadoEm: {
              gte: inicioDia,
              lte: fimDia,
            },
          },
        }),
        this.prismaService.atendimento.count({
          where: {
            idLoja,
            origemAtendimento: canal,
            status: STATUS_ATENDIMENTO.SUCESSO,
            criadoEm: {
              gte: inicioDia,
              lte: fimDia,
            },
          },
        }),
      ]);

      resumo.push({
        data: format(dataAtual, 'yyyy-MM-dd'),
        leads,
        conversoes,
      });

      dataAtual = new Date(dataAtual.getTime() + 24 * 60 * 60 * 1000);
    }

    return resumo;
  }

  private async gerarSerieHistoricaCanalMensal(
    canal: string,
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const serie = [];
    let dataAtual = startOfMonth(dataInicio);

    while (dataAtual <= dataFim) {
      const inicioMes = startOfMonth(dataAtual);
      const fimMes = endOfMonth(dataAtual);

      const [leads, qualificacoes, conversoes] = await Promise.all([
        this.prismaService.atendimento.count({
          where: {
            idLoja,
            origemAtendimento: canal,
            criadoEm: {
              gte: inicioMes,
              lte: fimMes,
            },
          },
        }),
        this.prismaService.atendimento.count({
          where: {
            idLoja,
            origemAtendimento: canal,
            status: {
              in: [
                STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
                STATUS_ATENDIMENTO.VISITA,
                STATUS_ATENDIMENTO.EM_NEGOCIACAO,
                STATUS_ATENDIMENTO.SUCESSO,
              ],
            },
            criadoEm: {
              gte: inicioMes,
              lte: fimMes,
            },
          },
        }),
        this.prismaService.atendimento.count({
          where: {
            idLoja,
            origemAtendimento: canal,
            status: STATUS_ATENDIMENTO.SUCESSO,
            criadoEm: {
              gte: inicioMes,
              lte: fimMes,
            },
          },
        }),
      ]);

      serie.push({
        mes: format(dataAtual, 'yyyy-MM'),
        leads,
        qualificacoes,
        conversoes,
      });

      dataAtual = new Date(
        dataAtual.getFullYear(),
        dataAtual.getMonth() + 1,
        1,
      );
    }

    return serie;
  }

  private async gerarGraficoLeadsPorCanal(
    idColaborador: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const grafico = [];

    for (const canal of (Object.values(ORIGEM_ATENDIMENTO) as string[])) {
      const [leads, qualificados] = await Promise.all([
        this.prismaService.atendimento.count({
          where: {
            atendimentoResponsaveis: {
              some: {
                idColaborador,
              },
            },
            origemAtendimento: canal,
            criadoEm: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
        }),
        this.prismaService.atendimento.count({
          where: {
            atendimentoResponsaveis: {
              some: {
                idColaborador,
              },
            },
            origemAtendimento: canal,
            status: {
              in: [
                STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
                STATUS_ATENDIMENTO.VISITA,
                STATUS_ATENDIMENTO.EM_NEGOCIACAO,
                STATUS_ATENDIMENTO.SUCESSO,
              ],
            },
            criadoEm: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
        }),
      ]);

      if (leads > 0) {
        grafico.push({
          canal,
          leads,
          qualificados,
        });
      }
    }

    return grafico;
  }

  private async calcularPosicaoRankingMensal(
    idColaborador: string,
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const ranking = [];
    let dataAtual = startOfMonth(dataInicio);

    while (dataAtual <= dataFim) {
      const inicioMes = startOfMonth(dataAtual);
      const fimMes = endOfMonth(dataAtual);

      const conversoesColaboradores =
        await this.prismaService.atendimentoResponsaveis.groupBy({
          by: ['idColaborador'],
          where: {
            idLoja,
            atendimento: {
              status: STATUS_ATENDIMENTO.SUCESSO,
              criadoEm: {
                gte: inicioMes,
                lte: fimMes,
              },
            },
          },
          _count: {
            idColaborador: true,
          },
        });

      const conversoesColaborador = await this.prismaService.atendimento.count({
        where: {
          atendimentoResponsaveis: {
            some: {
              idColaborador,
            },
          },
          status: STATUS_ATENDIMENTO.SUCESSO,
          criadoEm: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
      });

      const colaboradoresComMaisConversoes = conversoesColaboradores.filter(
        (c) => c._count.idColaborador > conversoesColaborador,
      ).length;
      const posicao = colaboradoresComMaisConversoes + 1;

      ranking.push({
        mes: format(dataAtual, 'yyyy-MM'),
        conversoes: conversoesColaborador,
        posicao,
      });

      dataAtual = new Date(
        dataAtual.getFullYear(),
        dataAtual.getMonth() + 1,
        1,
      );
    }

    return ranking;
  }

  private async calcularTempoMedioResposta(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ): Promise<string> {
    const whereCondition: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
      select: {
        chat: {
          select: {
            id: true,
          },
        },
      },
    });

    if (atendimentos.length === 0) {
      return '0min';
    }

    const chatIds = atendimentos
      .flatMap(atendimento => atendimento.chat)
      .map(chat => chat.id);

    if (chatIds.length === 0) {
      return '0min';
    }

    const msgs = await this.prismaService.mensagem.findMany({
      where: {
        idChat: {
          in: chatIds,
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      select: {
        idChat: true,
        remetente: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'asc' },
    });

    if (msgs.length === 0) {
      return '0min';
    }

    const mensagensPorChat = msgs.reduce((acc, mensagem) => {
      if (!acc[mensagem.idChat]) {
        acc[mensagem.idChat] = [];
      }
      acc[mensagem.idChat].push(mensagem);
      return acc;
    }, {} as Record<string, typeof msgs>);

    const temposResposta: number[] = [];

    Object.values(mensagensPorChat).forEach(mensagensChat => {
      let ultimaMensagemCliente: Date | null = null;

      mensagensChat.forEach(mensagem => {
        if (mensagem.remetente === Remetente.CLIENTE) {
          // Mensagem do cliente - marcar como última mensagem do cliente
          ultimaMensagemCliente = new Date(mensagem.criadoEm);
        } else if (
          (mensagem.remetente === Remetente.LOJA || mensagem.remetente === Remetente.SISTEMA) &&
          ultimaMensagemCliente
        ) {
          // Mensagem da loja/sistema após mensagem do cliente - calcular tempo de resposta considerando apenas dias úteis
          const tempoRespostaMinutos = this.calcularDiferencaMinutosDiasUteis(
            ultimaMensagemCliente,
            new Date(mensagem.criadoEm),
          );
          
          // Considerar apenas tempos de resposta positivos e razoáveis (até 7 dias úteis = 7 * 24 * 60 = 10080 minutos)
          if (tempoRespostaMinutos > 0 && tempoRespostaMinutos <= 10080) {
            temposResposta.push(tempoRespostaMinutos);
          }
          
          // Reset para próxima sequência
          ultimaMensagemCliente = null;
        }
      });
    });

    if (temposResposta.length === 0) {
      return '0min';
    }

    const tempoMedio = temposResposta.reduce((sum, tempo) => sum + tempo, 0) / temposResposta.length;
    
    // Usar a nova função de formatação
    return this.formatarTempo(tempoMedio);
  }

  private async calcularTempoMedioFinalizacao(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ): Promise<string> {
    const whereCondition: any = {
      idLoja,
      status: {
        in: [STATUS_ATENDIMENTO.SUCESSO, STATUS_ATENDIMENTO.PERDIDO],
      },
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
    });

    if (atendimentos.length === 0) {
      return '0min';
    }

    const temposFinalizacao = atendimentos.map((atendimento) => {
      return this.calcularDiferencaMinutosDiasUteis(
        new Date(atendimento.criadoEm),
        new Date(atendimento.atualizadoEm),
      );
    });

    const tempoMedio = temposFinalizacao.reduce((sum, tempo) => sum + tempo, 0) / temposFinalizacao.length;
    return this.formatarTempo(tempoMedio);
  }

  private async gerarRankingMensal(
    idColaborador: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const ranking = [];
    let dataAtual = startOfMonth(dataInicio);

    while (dataAtual <= dataFim) {
      const inicioMes = startOfMonth(dataAtual);
      const fimMes = endOfMonth(dataAtual);

      const conversoes = await this.prismaService.atendimento.count({
        where: {
          atendimentoResponsaveis: {
            some: {
              idColaborador,
            },
          },
          status: STATUS_ATENDIMENTO.SUCESSO,
          criadoEm: {
            gte: inicioMes,
            lte: fimMes,
          },
        },
      });

      ranking.push({
        mes: format(dataAtual, 'yyyy-MM'),
        conversoes,
        posicao: 1,
      });

      dataAtual = new Date(
        dataAtual.getFullYear(),
        dataAtual.getMonth() + 1,
        1,
      );
    }

    return ranking;
  }

  private async gerarRankingCanais(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    const ranking = [];

    for (const canal of (Object.values(ORIGEM_ATENDIMENTO) as string[])) {
      let whereCondition: any = {
        idLoja,
        origemAtendimento: canal,
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      };

      if (idColaborador) {
        whereCondition.atendimentoResponsaveis = {
          some: {
            idColaborador: idColaborador,
          },
        };
      }

      const atendimentos = await this.prismaService.atendimento.findMany({
        where: whereCondition,
      });

      const qualificados = atendimentos.filter((a) =>
        [
          STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
          STATUS_ATENDIMENTO.VISITA,
          STATUS_ATENDIMENTO.EM_NEGOCIACAO,
          STATUS_ATENDIMENTO.SUCESSO,
        ].includes(a.status as STATUS_ATENDIMENTO),
      ).length;

      const indiceQualificacao =
        atendimentos.length > 0
          ? parseFloat(((qualificados / atendimentos.length) * 100).toFixed(2))
          : 0;

      ranking.push({
        canal,
        indiceQualificacao,
      });
    }

    return ranking.sort((a, b) => b.indiceQualificacao - a.indiceQualificacao);
  }

  private async gerarVisaoPreVenda(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    let whereCondition: any = {
      idLoja,
      status: 'ativo',
      cargos: {
        some: {
          cargo: {
            in: ['Vendedor', 'Pré-vendedor'],
          },
        },
      },
    };

    if (idColaborador) {
      whereCondition.id = idColaborador;
    }

    const colaboradores = await this.prismaService.colaborador.findMany({
      where: whereCondition,
      include: {
        usuario: true,
        atendimentoResponsaveis: {
          include: {
            atendimento: true,
          },
          where: {
            atendimento: {
              criadoEm: {
                gte: dataInicio,
                lte: dataFim,
              },
            },
          },
        },
      },
    });

    return colaboradores.map((colaborador) => {
      const atendimentos = colaborador.atendimentoResponsaveis.map(
        (ar) => ar.atendimento,
      );

      const leadsRecebidos = atendimentos.length;
      const emAtendimento = atendimentos.filter((a) =>
        [
          STATUS_ATENDIMENTO.CHAT,
          STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
          STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
          STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        ].includes(a.status as STATUS_ATENDIMENTO),
      ).length;
      const qualificados = atendimentos.filter((a) =>
        [
          STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
          STATUS_ATENDIMENTO.VISITA,
          STATUS_ATENDIMENTO.EM_NEGOCIACAO,
          STATUS_ATENDIMENTO.SUCESSO,
        ].includes(a.status as STATUS_ATENDIMENTO),
      ).length;
      
      const leadsResgatados = atendimentos.filter((a) =>
        a.status === STATUS_ATENDIMENTO.RESGATE
      ).length;
      
      const leadsConvertidos = atendimentos.filter((a) =>
        a.status === STATUS_ATENDIMENTO.SUCESSO
      ).length;
      
      const mediaConversao = leadsRecebidos > 0 
        ? parseFloat(((leadsConvertidos / leadsRecebidos) * 100).toFixed(2)) 
        : 0;

      const taxaQualificacao =
        leadsRecebidos > 0 ? parseFloat(((qualificados / leadsRecebidos) * 100).toFixed(2)) : 0;

      return {
        id: colaborador.id,
        vendedor: colaborador.nome || colaborador.usuario.nome || 'Sem nome',
        avatar: colaborador.usuario.urlFoto || null,
        tempoNaPlataforma: `Vendedor desde ${new Date(colaborador.criadoEm).getFullYear()}`,
        leadsRecebidos,
        emAtendimento,
        qualificados,
        taxaQualificacao,
        leadsResgatados,
        leadsConvertidos,
        mediaConversao,
      };
    });
  }

  private async calcularConversaoPorTemperatura(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    const whereCondition: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    const resultados = await Promise.all([
      // Total por temperatura
      this.prismaService.atendimento.groupBy({
        by: ['temperatura'],
        where: whereCondition,
        _count: true,
      }),
      // Sucessos por temperatura
      this.prismaService.atendimento.groupBy({
        by: ['temperatura'],
        where: {
          ...whereCondition,
          status: STATUS_ATENDIMENTO.SUCESSO,
        },
        _count: true,
      }),
    ]);

    const [totalPorTemperatura, sucessosPorTemperatura] = resultados;

    const conversaoPorTemperatura = {
      frio: {
        total:
          totalPorTemperatura.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.FRIO,
          )?._count || 0,
        conversoes:
          sucessosPorTemperatura.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.FRIO,
          )?._count || 0,
        taxa: 0,
      },
      morno: {
        total:
          totalPorTemperatura.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.MORNO,
          )?._count || 0,
        conversoes:
          sucessosPorTemperatura.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.MORNO,
          )?._count || 0,
        taxa: 0,
      },
      quente: {
        total:
          totalPorTemperatura.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.QUENTE,
          )?._count || 0,
        conversoes:
          sucessosPorTemperatura.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.QUENTE,
          )?._count || 0,
        taxa: 0,
      },
    };

    Object.keys(conversaoPorTemperatura).forEach((temp) => {
      const dados = conversaoPorTemperatura[temp];
      dados.taxa = dados.total > 0 ? parseFloat(((dados.conversoes / dados.total) * 100).toFixed(2)) : 0;
    });

    return conversaoPorTemperatura;
  }

  private async obterLogsStatusAtendimento(idAtendimento: string) {
    return await this.prismaService.logAtividadesAtendimento.findMany({
      where: {
        idAtendimento,
        tipoEvento: 'MUDANCA_STATUS',
      },
      orderBy: {
        criadoEm: 'asc',
      },
      select: {
        mensagem: true,
        criadoEm: true,
      },
    });
  }

  private extrairStatusDoLog(mensagem: string): STATUS_ATENDIMENTO {
    const match = mensagem.match(/Status alterado para (.+)$/);
    if (!match) return STATUS_ATENDIMENTO.PRE_ATENDIMENTO;

    const statusLegivel = match[1];
    const statusEnum = Object.entries(STATUS_ATENDIMENTO_MAP).find(
      ([_, valor]) => valor === statusLegivel,
    )?.[0] as STATUS_ATENDIMENTO;

    return statusEnum || STATUS_ATENDIMENTO.PRE_ATENDIMENTO;
  }

  private async calcularTempoMedioPorEtapa(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    const whereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereClause,
      select: {
        id: true,
        criadoEm: true,
        status: true,
      },
    });

    const temposPorEtapa = {
      [STATUS_ATENDIMENTO.PRE_ATENDIMENTO]: [],
      [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL]: [],
      [STATUS_ATENDIMENTO.VISITA]: [],
      [STATUS_ATENDIMENTO.EM_NEGOCIACAO]: [],
      [STATUS_ATENDIMENTO.RESGATE]: [],
    };

    for (const atendimento of atendimentos) {
      const logsStatus = await this.obterLogsStatusAtendimento(atendimento.id);

      let dataAnterior = atendimento.criadoEm;
      let statusAnterior = STATUS_ATENDIMENTO.PRE_ATENDIMENTO;

      logsStatus.forEach((log) => {
        const tempoNaEtapa = differenceInHours(log.criadoEm, dataAnterior);
        if (temposPorEtapa[statusAnterior]) {
          temposPorEtapa[statusAnterior].push(tempoNaEtapa);
        }
        dataAnterior = log.criadoEm;
        statusAnterior = this.extrairStatusDoLog(log.mensagem);
      });

      const agora = new Date();
      const dataFinal =
        atendimento.status === STATUS_ATENDIMENTO.SUCESSO ||
        atendimento.status === STATUS_ATENDIMENTO.PERDIDO
          ? dataAnterior
          : agora;

      const tempoFinal = differenceInHours(dataFinal, dataAnterior);
      if (temposPorEtapa[statusAnterior]) {
        temposPorEtapa[statusAnterior].push(tempoFinal);
      }
    }

    const calcularMedia = (tempos: number[]) => {
      if (!tempos || tempos.length === 0) return '0h 0min';
      const media =
        tempos.reduce((sum, tempo) => sum + tempo, 0) / tempos.length;
      const horas = Math.floor(media);
      const minutos = Math.round((media - horas) * 60);
      return `${horas}h ${minutos}min`;
    };

    return {
      'Pré-atendimento': calcularMedia(
        temposPorEtapa[STATUS_ATENDIMENTO.PRE_ATENDIMENTO],
      ),
      'Atendimento Inicial': calcularMedia(
        temposPorEtapa[STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL],
      ),
      'Visita': calcularMedia(temposPorEtapa[STATUS_ATENDIMENTO.VISITA]),
      'Em Negociação': calcularMedia(
        temposPorEtapa[STATUS_ATENDIMENTO.EM_NEGOCIACAO],
      ),
      'Resgate': calcularMedia(temposPorEtapa[STATUS_ATENDIMENTO.RESGATE]),
    };
  }

  private async calcularTempoMedioRespostaColaborador(
    idColaborador: string,
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<string> {
    const msgs = await this.prismaService.mensagem.findMany({
      where: {
        chat: {
          idLoja,
          atendimento: {
            atendimentoResponsaveis: {
              some: {
                idColaborador,
              },
            },
          },
        },
        remetente: {
          in: [Remetente.CLIENTE, Remetente.LOJA, Remetente.SISTEMA],
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      select: {
        idChat: true,
        remetente: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'asc' },
    });

    const diffs: number[] = [];
    const state = new Map<string, { clienteEm?: Date; responded?: boolean }>();

    for (const { idChat, remetente, criadoEm } of msgs) {
      const s = state.get(idChat) ?? {};
      if (remetente === Remetente.CLIENTE && !s.clienteEm) {
        s.clienteEm = criadoEm;
        s.responded = false;
        state.set(idChat, s);
        continue;
      }
      if (
        (remetente === Remetente.LOJA || remetente === Remetente.SISTEMA) &&
        s.clienteEm &&
        !s.responded
      ) {
        // Calcular diferença considerando apenas dias úteis
        const diff = this.calcularDiferencaMinutosDiasUteis(s.clienteEm!, criadoEm);
        if (diff > 0) {
          diffs.push(diff);
        }
        s.responded = true;
        state.set(idChat, s);
      }
    }

    if (diffs.length === 0) return '0min';
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    
    // Usar a nova função de formatação
    return this.formatarTempo(avg);
  }

  private async calcularMetricasVisitasPreVendedor(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const preVendedores = await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        cargos: {
          some: {
            cargo: 'Pré-vendedor',
          },
        },
      },
      include: {
        usuario: true,
      },
    });

    const metricas = [];

    for (const preVendedor of preVendedores) {
      const atendimentosComVisita =
        await this.prismaService.atendimento.findMany({
          where: {
            atendimentoResponsaveis: {
              some: {
                idColaborador: preVendedor.id,
              },
            },
            visitasAtendimento: {
              some: {
                criadoEm: {
                  gte: dataInicio,
                  lte: dataFim,
                },
              },
            },
          },
          include: {
            visitasAtendimento: true,
          },
        });

      const totalVisitasAgendadas = atendimentosComVisita.reduce(
        (total, atendimento) => total + atendimento.visitasAtendimento.length,
        0,
      );

      const visitasBemSucedidas = atendimentosComVisita.filter((atendimento) =>
        atendimento.visitasAtendimento.some((visita) => visita.concluida),
      ).length;

      const taxaSucessoVisitas =
        totalVisitasAgendadas > 0
          ? (visitasBemSucedidas / totalVisitasAgendadas) * 100
          : 0;

      metricas.push({
        preVendedor: {
          id: preVendedor.id,
          nome: preVendedor.nome || preVendedor.usuario.nome || 'Sem nome',
        },
        totalVisitasAgendadas,
        visitasBemSucedidas,
        taxaSucessoVisitas,
      });
    }

    return metricas;
  }

  private async calcularMetricasVisitasGeral(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    // Buscar todos os atendimentos com visitas no período
    const atendimentosComVisita = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        visitasAtendimento: {
          some: {
            criadoEm: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
        },
      },
      include: {
        visitasAtendimento: {
          where: {
            criadoEm: {
              gte: dataInicio,
              lte: dataFim,
            },
          },
        },
      },
    });

    // Calcular métricas agregadas
    const totalVisitasAgendadas = atendimentosComVisita.reduce(
      (total, atendimento) => total + atendimento.visitasAtendimento.length,
      0,
    );

    const visitasBemSucedidas = atendimentosComVisita.reduce(
      (total, atendimento) => {
        const visitasConcluidas = atendimento.visitasAtendimento.filter(
          (visita) => visita.concluida,
        ).length;
        return total + visitasConcluidas;
      },
      0,
    );

    const taxaSucessoVisitas =
      totalVisitasAgendadas > 0
        ? (visitasBemSucedidas / totalVisitasAgendadas) * 100
        : 0;

    return {
      totalVisitasAgendadas,
      visitasBemSucedidas,
      taxaSucessoVisitas: parseFloat((taxaSucessoVisitas).toFixed(2)),
    };
  }

  private async gerarRelatorioPorModoAtendimento(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    const modos = Object.values(MODO_ATENDIMENTO) as MODO_ATENDIMENTO[];
    
    const resultadosModos = await Promise.all(
      modos.map(async (modo) => {
        const baseWhereCondition: any = {
          idLoja,
          modoAtendimento: modo,
          criadoEm: {
            gte: dataInicio,
            lte: dataFim,
          },
        };

      if (idColaborador) {
        baseWhereCondition.atendimentoResponsaveis = {
          some: {
            idColaborador,
          },
        };
      }

      const [statusCounts, temperaturaCounts] = await Promise.all([
        this.prismaService.atendimento.groupBy({
          by: ['status'],
          where: baseWhereCondition,
          _count: true,
        }),
        this.prismaService.atendimento.groupBy({
          by: ['temperatura'],
          where: baseWhereCondition,
          _count: true,
        }),
      ]);

      const totalAtendimentos = statusCounts.reduce(
        (sum, item) => sum + item._count,
        0,
      );
      const atendimentosBemSucedidos =
        statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.SUCESSO)
          ?._count || 0;
      const insucessos =
        statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.PERDIDO)
          ?._count || 0;

      const taxaSucesso =
        totalAtendimentos > 0
          ? parseFloat(((atendimentosBemSucedidos / totalAtendimentos) * 100).toFixed(2))
          : 0;
      const taxaInsucesso =
        totalAtendimentos > 0
          ? parseFloat(((insucessos / totalAtendimentos) * 100).toFixed(2))
          : 0;
      const mediaConversao = taxaSucesso;

      const segmentacaoStatus = {
        inicial: statusCounts
          .filter((s) =>
            [
              STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
            ].includes(s.status as STATUS_ATENDIMENTO),
          )
          .reduce((sum, item) => sum + item._count, 0),
        emVisita:
          statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.VISITA)
            ?._count || 0,
        resgate:
          statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.RESGATE)
            ?._count || 0,
        negociacao:
          statusCounts.find((s) => s.status === STATUS_ATENDIMENTO.EM_NEGOCIACAO)
            ?._count || 0,
        total: statusCounts.reduce((sum, item) => sum + item._count, 0),
      };

      const totalTemperatura = temperaturaCounts.reduce((sum, t) => sum + t._count, 0);
      
      const segmentacaoTemperatura = {
        frio: {
          valor: temperaturaCounts.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.FRIO,
          )?._count || 0,
          porcentagem: totalTemperatura > 0 ? 
            parseFloat((((temperaturaCounts.find(
              (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.FRIO,
            )?._count || 0) / totalTemperatura) * 100).toFixed(2)) : 0
        },
        morno: {
          valor: temperaturaCounts.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.MORNO,
          )?._count || 0,
          porcentagem: totalTemperatura > 0 ? 
            parseFloat((((temperaturaCounts.find(
              (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.MORNO,
            )?._count || 0) / totalTemperatura) * 100).toFixed(2)) : 0
        },
        quente: {
          valor: temperaturaCounts.find(
            (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.QUENTE,
          )?._count || 0,
          porcentagem: totalTemperatura > 0 ? 
            parseFloat((((temperaturaCounts.find(
              (t) => t.temperatura === TEMPERATURA_ATENDIMENTO.QUENTE,
            )?._count || 0) / totalTemperatura) * 100).toFixed(2)) : 0
        },
      };

      const [
        tempoMedioResposta, 
        tempoMedioFinalizacao, 
        conversaoPorTemperatura,
        quantidadeSucesso,
        taxaResgate,
        quantidadeConversao,
        quantidadeQualificacao,
        taxaConversaoLeads,
        quantidadeConversaoLeads,
        quantidadeShowroom,
        quantidadeShowroomSucesso,
        taxaShowroom,
        tempoMedioRespostaPreVendedor,
        tempoMedioRespostaVendedor,
        agendamentosVisitas,
        taxaComparecimentoVisitas,
        visitasCompareceram,
        motivosPerda,
        tempoMedioRespostaPreVendedorPorMes,
        tempoMedioRespostaVendedorPorMes,
        atendimentosPreAtendimentoSemFollowUp,
        atendimentosVendasSemFollowUp,
        segmentacaoTemperaturaQualificacao,
        tempoMedioPrimeiraResposta,
        tempoMedioRespostaEntreMensagens,
        motivosPerdasPreAtendimento,
      ] = await Promise.all([
        this.calcularTempoMedioRespostaPorModo(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTempoMedioFinalizacaoPorModo(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularConversaoPorTemperaturaPorModo(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularQuantidadeSucesso(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTaxaResgate(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularQuantidadeConversao(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularQuantidadeQualificacao(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTaxaConversaoLeads(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularQuantidadeConversaoLeads(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularQuantidadeShowroom(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularQuantidadeShowroomSucesso(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTaxaShowroom(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTempoMedioRespostaPorTipo(idLoja, dataInicio, dataFim, 'preVendedor', modo, idColaborador),
        this.calcularTempoMedioRespostaPorTipo(idLoja, dataInicio, dataFim, 'vendedor', modo, idColaborador),
        this.calcularAgendamentosVisitas(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTaxaComparecimentoVisitas(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularVisitasCompareceram(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularMotivosPerda(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTempoMedioRespostaPorMes(idLoja, dataFim, 'preVendedor', idColaborador),
        this.calcularTempoMedioRespostaPorMes(idLoja, dataFim, 'vendedor', idColaborador),
        this.buscarAtendimentosPreAtendimentoSemFollowUpPorModo(idLoja, modo, idColaborador),
        this.buscarAtendimentosVendasSemFollowUpPorModo(idLoja, modo, idColaborador),
        this.calcularSegmentacaoTemperaturaQualificacao(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTempoMedioPrimeiraResposta(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularTempoMedioRespostaEntreMensagens(idLoja, dataInicio, dataFim, modo, idColaborador),
        this.calcularMotivosPerdasPreAtendimento(idLoja, dataInicio, dataFim, idColaborador, modo),
      ]);

      return {
        modo,
        totalAtendimentos,
        atendimentosBemSucedidos,
        insucessos,
        taxaSucesso,
        taxaInsucesso,
        mediaConversao,
        mediaQualificacao: totalAtendimentos > 0 
          ? parseFloat(((quantidadeQualificacao / totalAtendimentos) * 100).toFixed(2)) 
          : 0,
        segmentacaoStatus,
        segmentacaoTemperatura,
        segmentacaoTemperaturaQualificacao,
        tempoMedioResposta,
        tempoMedioFinalizacao,
        conversaoPorTemperatura,
        quantidadeSucesso,
        taxaResgate,
        quantidadeConversao,
        quantidadeQualificacao,
        taxaConversaoLeads,
        quantidadeConversaoLeads,
        quantidadeShowroom,
        quantidadeShowroomSucesso,
        taxaShowroom,
        tempoMedioRespostaPreVendedor,
        tempoMedioRespostaVendedor,
        agendamentosVisitas,
        taxaComparecimentoVisitas,
        visitasCompareceram,
        motivosPerda,
        tempoMedioRespostaPreVendedorPorMes,
        tempoMedioRespostaVendedorPorMes,
        atendimentosPreAtendimentoSemFollowUp,
        atendimentosVendasSemFollowUp,
        tempoMedioPrimeiraResposta,
        tempoMedioRespostaEntreMensagens,
        motivosPerdasPreAtendimento,
      };
    }));

    const relatorioPorModo: any[] = [...resultadosModos];

    // Calcular totalizador geral
    const [
      quantidadeSucessoTotal,
      taxaResgateTotal,
      quantidadeConversaoTotal,
      quantidadeQualificacaoTotal,
      taxaConversaoLeadsTotal,
      quantidadeConversaoLeadsTotal,
      quantidadeShowroomTotal,
      quantidadeShowroomSucessoTotal,
      taxaShowroomTotal,
      tempoMedioRespostaPreVendedorTotal,
      tempoMedioRespostaVendedorTotal,
      agendamentosVisitasTotal,
      taxaComparecimentoVisitasTotal,
      motivosPerdaTotal,
      tempoMedioRespostaPreVendedorPorMesTotal,
      tempoMedioRespostaVendedorPorMesTotal,
      segmentacaoTemperaturaQualificacaoTotal,
      motivosPerdasPreAtendimentoTotal,
    ] = await Promise.all([
      this.calcularQuantidadeSucesso(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularTaxaResgate(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularQuantidadeConversao(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularQuantidadeQualificacao(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularTaxaConversaoLeads(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularQuantidadeConversaoLeads(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularQuantidadeShowroom(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularQuantidadeShowroomSucesso(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularTaxaShowroom(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularTempoMedioRespostaPorTipo(idLoja, dataInicio, dataFim, 'preVendedor', undefined, idColaborador),
      this.calcularTempoMedioRespostaPorTipo(idLoja, dataInicio, dataFim, 'vendedor', undefined, idColaborador),
      this.calcularAgendamentosVisitas(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularTaxaComparecimentoVisitas(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularMotivosPerda(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularTempoMedioRespostaPorMes(idLoja, dataFim, 'preVendedor', idColaborador),
      this.calcularTempoMedioRespostaPorMes(idLoja, dataFim, 'vendedor', idColaborador),
      this.calcularSegmentacaoTemperaturaQualificacao(idLoja, dataInicio, dataFim, undefined, idColaborador),
      this.calcularMotivosPerdasPreAtendimento(idLoja, dataInicio, dataFim, idColaborador),
    ]);

    const totalGeral = {
      modo: 'total',
      totalAtendimentos: relatorioPorModo.reduce((sum, item) => sum + item.totalAtendimentos, 0),
      atendimentosBemSucedidos: relatorioPorModo.reduce((sum, item) => sum + item.atendimentosBemSucedidos, 0),
      insucessos: relatorioPorModo.reduce((sum, item) => sum + item.insucessos, 0),
      taxaSucesso: 0,
      taxaInsucesso: 0,
      mediaConversao: 0,
      mediaQualificacao: 0,
      segmentacaoStatus: {
        inicial: relatorioPorModo.reduce((sum, item) => sum + item.segmentacaoStatus.inicial, 0),
        emVisita: relatorioPorModo.reduce((sum, item) => sum + item.segmentacaoStatus.emVisita, 0),
        resgate: relatorioPorModo.reduce((sum, item) => sum + item.segmentacaoStatus.resgate, 0),
        negociacao: relatorioPorModo.reduce((sum, item) => sum + item.segmentacaoStatus.negociacao, 0),
        total: relatorioPorModo.reduce((sum, item) => sum + item.segmentacaoStatus.total, 0),
      },
      segmentacaoTemperatura: {
        frio: {
          valor: relatorioPorModo.reduce((sum, item) => sum + item.segmentacaoTemperatura.frio.valor, 0),
          porcentagem: 0 // Será calculado abaixo
        },
        morno: {
          valor: relatorioPorModo.reduce((sum, item) => sum + item.segmentacaoTemperatura.morno.valor, 0),
          porcentagem: 0 // Será calculado abaixo
        },
        quente: {
          valor: relatorioPorModo.reduce((sum, item) => sum + item.segmentacaoTemperatura.quente.valor, 0),
          porcentagem: 0 // Será calculado abaixo
        },
      },
      segmentacaoTemperaturaQualificacao: await this.calcularSegmentacaoTemperaturaQualificacao(idLoja, dataInicio, dataFim, 'total', idColaborador),
      tempoMedioResposta: await this.calcularTempoMedioResposta(idLoja, dataInicio, dataFim),
      tempoMedioFinalizacao: await this.calcularTempoMedioFinalizacao(idLoja, dataInicio, dataFim),
      tempoMedioPrimeiraResposta: await this.calcularTempoMedioPrimeiraResposta(idLoja, dataInicio, dataFim, undefined, idColaborador),
      tempoMedioRespostaEntreMensagens: await this.calcularTempoMedioRespostaEntreMensagens(idLoja, dataInicio, dataFim, undefined, idColaborador),
      conversaoPorTemperatura: await this.calcularConversaoPorTemperatura(idLoja, dataInicio, dataFim),
      quantidadeSucesso: quantidadeSucessoTotal,
      taxaResgate: taxaResgateTotal,
      quantidadeConversao: quantidadeConversaoTotal,
      quantidadeQualificacao: quantidadeQualificacaoTotal,
      taxaConversaoLeads: taxaConversaoLeadsTotal,
      quantidadeConversaoLeads: quantidadeConversaoLeadsTotal,
      quantidadeShowroom: quantidadeShowroomTotal,
      quantidadeShowroomSucesso: quantidadeShowroomSucessoTotal,
      taxaShowroom: taxaShowroomTotal,
      tempoMedioRespostaPreVendedor: tempoMedioRespostaPreVendedorTotal,
      tempoMedioRespostaVendedor: tempoMedioRespostaVendedorTotal,
      agendamentosVisitas: agendamentosVisitasTotal,
      taxaComparecimentoVisitas: taxaComparecimentoVisitasTotal,
      visitasCompareceram: relatorioPorModo.reduce((sum, item) => sum + item.visitasCompareceram, 0),
      motivosPerda: motivosPerdaTotal,
      motivosPerdasPreAtendimento: motivosPerdasPreAtendimentoTotal,
      tempoMedioRespostaPreVendedorPorMes: tempoMedioRespostaPreVendedorPorMesTotal,
      tempoMedioRespostaVendedorPorMes: tempoMedioRespostaVendedorPorMesTotal,
      atendimentosPreAtendimentoSemFollowUp: relatorioPorModo.reduce((acc, item) => {
        const preAtendimento = item.atendimentosPreAtendimentoSemFollowUp;
        return preAtendimento ? acc.concat(preAtendimento) : acc;
      }, []),
      atendimentosVendasSemFollowUp: relatorioPorModo.reduce((acc, item) => {
        const vendas = item.atendimentosVendasSemFollowUp;
        return vendas ? acc.concat(vendas) : acc;
      }, []),
    };

    // Calcular taxas para o total geral
    totalGeral.taxaSucesso = totalGeral.totalAtendimentos > 0 
      ? parseFloat(((totalGeral.atendimentosBemSucedidos / totalGeral.totalAtendimentos) * 100).toFixed(2))
      : 0;
    totalGeral.taxaInsucesso = totalGeral.totalAtendimentos > 0 
      ? parseFloat(((totalGeral.insucessos / totalGeral.totalAtendimentos) * 100).toFixed(2))
      : 0;
    totalGeral.mediaConversao = totalGeral.taxaSucesso;
    
    totalGeral.mediaQualificacao = totalGeral.totalAtendimentos > 0 
      ? parseFloat(((quantidadeQualificacaoTotal / totalGeral.totalAtendimentos) * 100).toFixed(2))
      : 0;

    // Calcular porcentagens da segmentação por temperatura para o total geral
    const totalTemperaturaGeral = totalGeral.segmentacaoTemperatura.frio.valor + 
      totalGeral.segmentacaoTemperatura.morno.valor + 
      totalGeral.segmentacaoTemperatura.quente.valor;
    
    totalGeral.segmentacaoTemperatura.frio.porcentagem = totalTemperaturaGeral > 0 
      ? parseFloat(((totalGeral.segmentacaoTemperatura.frio.valor / totalTemperaturaGeral) * 100).toFixed(2))
      : 0;
    totalGeral.segmentacaoTemperatura.morno.porcentagem = totalTemperaturaGeral > 0 
      ? parseFloat(((totalGeral.segmentacaoTemperatura.morno.valor / totalTemperaturaGeral) * 100).toFixed(2))
      : 0;
    totalGeral.segmentacaoTemperatura.quente.porcentagem = totalTemperaturaGeral > 0 
      ? parseFloat(((totalGeral.segmentacaoTemperatura.quente.valor / totalTemperaturaGeral) * 100).toFixed(2))
      : 0;

    // Adicionar o total no final do array
    relatorioPorModo.push(totalGeral);

    return relatorioPorModo;
  }

  private async calcularTempoMedioRespostaPorModo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
    idColaborador?: string,
  ): Promise<string> {
    const whereCondition: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (this.isModoAtendimento(modo)) {
      whereCondition.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
      select: {
        chat: {
          select: {
            id: true,
          },
        },
      },
    });

    const chatIds = atendimentos.flatMap(atendimento => 
      atendimento.chat.map(chat => chat.id)
    );

    if (chatIds.length === 0) {
      return '0min';
    }

    const msgs = await this.prismaService.mensagem.findMany({
      where: {
        idChat: {
          in: chatIds,
        },
        remetente: {
          in: [Remetente.CLIENTE, Remetente.LOJA, Remetente.SISTEMA],
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      select: {
        idChat: true,
        remetente: true,
        criadoEm: true,
      },
      orderBy: { criadoEm: 'asc' },
    });

    const diffs: number[] = [];
    const state = new Map<string, { clienteEm?: Date; responded?: boolean }>();

    for (const { idChat, remetente, criadoEm } of msgs) {
      const s = state.get(idChat) ?? {};
      if (remetente === Remetente.CLIENTE) {
        if (!s.clienteEm || s.responded) {
          s.clienteEm = criadoEm;
          s.responded = false;
          state.set(idChat, s);
        }
        continue;
      }
      if (
        (remetente === Remetente.LOJA || remetente === Remetente.SISTEMA) &&
        s.clienteEm &&
        !s.responded
      ) {
        const diff = this.calcularDiferencaMinutosDiasUteis(s.clienteEm!, criadoEm);
        diffs.push(diff);
        s.responded = true;
        state.set(idChat, s);
      }
    }

    if (diffs.length === 0) {
      return '0min';
    }

    const tempoMedio = diffs.reduce((sum, tempo) => sum + tempo, 0) / diffs.length;
    return this.formatarTempo(tempoMedio);
  }

  private async calcularTempoMedioFinalizacaoPorModo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
    idColaborador?: string,
  ): Promise<string> {
    const whereCondition: any = {
      idLoja,
      status: {
        in: [STATUS_ATENDIMENTO.SUCESSO, STATUS_ATENDIMENTO.PERDIDO],
      },
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (this.isModoAtendimento(modo)) {
      whereCondition.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
    });

    if (atendimentos.length === 0) {
      return '0min';
    }

    const temposFinalizacao = atendimentos.map((atendimento) => {
      const criado = new Date(atendimento.criadoEm);
      const atualizado = new Date(atendimento.atualizadoEm);
      return this.calcularDiferencaMinutosDiasUteis(criado, atualizado);
    });

    const tempoMedio = temposFinalizacao.reduce((sum, tempo) => sum + tempo, 0) / temposFinalizacao.length;
    return this.formatarTempo(Math.round(tempoMedio));
  }

  private async calcularTempoMedioRespostaCompleto(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<string> {
    // Construir condições de filtro para atendimentos
    const whereCondition: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    // Filtrar por modo se não for 'total'
    if (modo && modo !== 'total') {
      whereCondition.modoAtendimento = modo;
    }

    // Filtrar por colaborador se especificado
    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = { some: { idColaborador } };
    }

    // Buscar atendimentos que atendem aos critérios
    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
      select: {
        id: true,
        chat: {
          select: {
            id: true,
          },
        },
      },
    });

    if (atendimentos.length === 0) {
      return '0min';
    }

    // Extrair IDs dos chats
    const chatIds = atendimentos
      .flatMap(atendimento => atendimento.chat)
      .map(chat => chat.id);

    if (chatIds.length === 0) {
      return '0min';
    }

    // Buscar todas as mensagens dos chats relacionados
    const mensagens = await this.prismaService.mensagem.findMany({
      where: {
        idChat: { in: chatIds },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      select: {
        idChat: true,
        remetente: true,
        criadoEm: true,
      },
      orderBy: {
        criadoEm: 'asc',
      },
    });

    if (mensagens.length === 0) {
      return '0min';
    }

    // Agrupar mensagens por chat
    const mensagensPorChat = mensagens.reduce((acc, mensagem) => {
      if (!acc[mensagem.idChat]) {
        acc[mensagem.idChat] = [];
      }
      acc[mensagem.idChat].push(mensagem);
      return acc;
    }, {} as Record<string, typeof mensagens>);

    const temposResposta: number[] = [];

    // Calcular tempos de resposta para cada chat
    Object.values(mensagensPorChat).forEach(mensagensChat => {
      let ultimaMensagemCliente: Date | null = null;

      mensagensChat.forEach(mensagem => {
        if (mensagem.remetente === Remetente.CLIENTE) {
          // Mensagem do cliente - marcar como última mensagem do cliente
          ultimaMensagemCliente = new Date(mensagem.criadoEm);
        } else if (
          (mensagem.remetente === Remetente.LOJA || mensagem.remetente === Remetente.SISTEMA) &&
          ultimaMensagemCliente
        ) {
          // Mensagem da loja/sistema após mensagem do cliente - calcular tempo de resposta
          const tempoResposta = this.calcularDiferencaMinutosDiasUteis(
            ultimaMensagemCliente,
            new Date(mensagem.criadoEm),
          );
          
          if (tempoResposta > 0) {
            temposResposta.push(tempoResposta);
          }
          
          // Reset para próxima sequência
          ultimaMensagemCliente = null;
        }
      });
    });

    if (temposResposta.length === 0) {
      return '0min';
    }

    // Calcular tempo médio
    const tempoMedio = temposResposta.reduce((sum, tempo) => sum + tempo, 0) / temposResposta.length;
    
    // Usar a nova função de formatação
    return this.formatarTempo(tempoMedio);
  }

  private async calcularConversaoPorTemperaturaPorModo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo: MODO_ATENDIMENTO | 'total',
    idColaborador?: string,
  ) {
    const temperaturas = Object.values(TEMPERATURA_ATENDIMENTO) as TEMPERATURA_ATENDIMENTO[];
    const resultado = {
      frio: { total: 0, conversoes: 0, taxa: 0 },
      morno: { total: 0, conversoes: 0, taxa: 0 },
      quente: { total: 0, conversoes: 0, taxa: 0 },
    };

    for (const temperatura of temperaturas) {
      const baseWhereCondition: any = {
        idLoja,
        modoAtendimento: modo,
        temperatura,
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      };

      if (idColaborador) {
        baseWhereCondition.atendimentoResponsaveis = { some: { idColaborador } };
      }

      const [total, conversoes] = await Promise.all([
        this.prismaService.atendimento.count({
          where: baseWhereCondition,
        }),
        this.prismaService.atendimento.count({
          where: {
            ...baseWhereCondition,
            status: STATUS_ATENDIMENTO.SUCESSO,
          },
        }),
      ]);

      const taxa = total > 0 ? parseFloat(((conversoes / total) * 100).toFixed(2)) : 0;
      resultado[temperatura] = { total, conversoes, taxa };
    }

    return resultado;
  }

  private async calcularQuantidadeSucesso(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereClause: any = {
      idLoja,
      status: STATUS_ATENDIMENTO.SUCESSO,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo && modo !== 'total') {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return await this.prismaService.atendimento.count({
      where: whereClause,
    });
  }

  private async calcularTaxaResgate(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo && modo !== 'total') {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const [totalAtendimentos, atendimentosResgate] = await Promise.all([
      this.prismaService.atendimento.count({
        where: whereClause,
      }),
      this.prismaService.atendimento.count({
        where: {
          ...whereClause,
          status: STATUS_ATENDIMENTO.RESGATE,
        },
      }),
    ]);

    return totalAtendimentos > 0 ? parseFloat(((atendimentosResgate / totalAtendimentos) * 100).toFixed(2)) : 0;
  }

  private async calcularQuantidadeConversao(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereClause: any = {
      idLoja,
      status: STATUS_ATENDIMENTO.SUCESSO,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo && modo !== 'total') {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return await this.prismaService.atendimento.count({
      where: whereClause,
    });
  }

  private async calcularQuantidadeQualificacao(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereClause: any = {
      idLoja,
      status: {
        in: [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL, STATUS_ATENDIMENTO.VISITA, STATUS_ATENDIMENTO.EM_NEGOCIACAO, STATUS_ATENDIMENTO.SUCESSO],
      },
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo && modo !== 'total') {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return await this.prismaService.atendimento.count({
      where: whereClause,
    });
  }

  private async calcularTaxaConversaoLeads(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const baseWhereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      baseWhereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      baseWhereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const [totalLeads, leadsConvertidos] = await Promise.all([
      this.prismaService.atendimento.count({
        where: {
          ...baseWhereClause,
          status: {
            in: [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL, STATUS_ATENDIMENTO.VISITA, STATUS_ATENDIMENTO.EM_NEGOCIACAO, STATUS_ATENDIMENTO.SUCESSO],
          },
        },
      }),
      this.prismaService.atendimento.count({
        where: {
          ...baseWhereClause,
          status: STATUS_ATENDIMENTO.SUCESSO,
        },
      }),
    ]);

    return totalLeads > 0 ? parseFloat(((leadsConvertidos / totalLeads) * 100).toFixed(2)) : 0;
  }

  private async calcularQuantidadeConversaoLeads(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereClause: any = {
      idLoja,
      status: STATUS_ATENDIMENTO.SUCESSO,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return await this.prismaService.atendimento.count({
      where: whereClause,
    });
  }

  private async calcularQuantidadeShowroom(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: MODO_ATENDIMENTO | 'total',
    idColaborador?: string,
  ): Promise<number> {
    const whereClause: any = {
      idLoja,
      origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return await this.prismaService.atendimento.count({
      where: whereClause,
    });
  }

  private async calcularQuantidadeShowroomSucesso(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereClause: any = {
      idLoja,
      origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
      status: STATUS_ATENDIMENTO.SUCESSO,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    return await this.prismaService.atendimento.count({
      where: whereClause,
    });
  }

  private async calcularTaxaShowroom(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: MODO_ATENDIMENTO | 'total',
    idColaborador?: string,
  ): Promise<number> {
    const baseWhereClause: any = {
      idLoja,
      origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      baseWhereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      baseWhereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const [totalShowroom, sucessosShowroom] = await Promise.all([
      this.prismaService.atendimento.count({
        where: baseWhereClause,
      }),
      this.prismaService.atendimento.count({
        where: {
          ...baseWhereClause,
          status: STATUS_ATENDIMENTO.SUCESSO,
        },
      }),
    ]);

    return totalShowroom > 0 ? parseFloat(((sucessosShowroom / totalShowroom) * 100).toFixed(2)) : 0;
  }

  private async calcularTempoMedioRespostaPorTipo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    tipoColaborador: 'preVendedor' | 'vendedor',
    modo?: string,
    idColaborador?: string,
  ): Promise<string> {
    const whereColaborador: any = {
      idLoja,
      status: 'ativo',
      cargos: {
        some: {
          cargo: {
            in: [tipoColaborador === 'preVendedor' ? 'Pré-vendedor' : 'Vendedor'],
            mode: 'insensitive',
          },
        },
      },
    };

    // Filtrar por colaborador específico se fornecido
    if (idColaborador) {
      whereColaborador.id = idColaborador;
    }

    const colaboradores = await this.prismaService.colaborador.findMany({
      where: whereColaborador,
      select: {
        id: true,
        usuario: {
          select: {
            id: true,
          },
        },
      },
    });

    if (colaboradores.length === 0) {
      return '0min';
    }

    const idsUsuariosColaboradores = colaboradores
      .map(c => c.usuario?.id)
      .filter(id => id !== undefined);

    if (idsUsuariosColaboradores.length === 0) {
      return '0min';
    }

    // Buscar atendimentos que têm colaboradores do tipo especificado
    const whereAtendimento: any = {
      atendimentoResponsaveis: {
        some: {
          idColaborador: {
            in: colaboradores.map(c => c.id),
          },
        },
      },
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereAtendimento.modoAtendimento = modo;
    }

    // Buscar chats que têm tanto mensagens do cliente quanto do colaborador específico
    const chats = await this.prismaService.chat.findMany({
      where: {
        idLoja,
        atendimento: whereAtendimento,
        mensagem: {
          some: {
            remetente: Remetente.CLIENTE,
          },
        },
      },
      include: {
        mensagem: {
          orderBy: {
            criadoEm: 'asc',
          },
        },
        atendimento: true,
      },
    });

    if (chats.length === 0) {
      return '0min';
    }

    let totalMinutos = 0;
    let totalRespostas = 0;

    for (const chat of chats) {
      const mensagens = chat.mensagem;
      
      // Percorrer todas as mensagens para encontrar pares cliente -> colaborador
      for (let i = 0; i < mensagens.length - 1; i++) {
        const mensagemAtual = mensagens[i];
        
        // Se a mensagem atual é do cliente
        if (mensagemAtual.remetente === Remetente.CLIENTE) {
          // Procurar a próxima mensagem do colaborador específico
          for (let j = i + 1; j < mensagens.length; j++) {
            const proximaMensagem = mensagens[j];
            
            if (proximaMensagem.remetente === Remetente.LOJA && 
                proximaMensagem.idUsuario &&
                idsUsuariosColaboradores.includes(proximaMensagem.idUsuario)) {
              
              const tempoResposta = this.calcularDiferencaMinutosDiasUteis(
                mensagemAtual.criadoEm,
                proximaMensagem.criadoEm,
              );
              totalMinutos += tempoResposta;
              totalRespostas++;
              break; // Encontrou a resposta, pular para próxima mensagem do cliente
            }
          }
        }
      }
    }

    if (totalRespostas === 0) {
      return '0min';
    }

    const mediaMinutos = totalMinutos / totalRespostas;
    return this.formatarTempo(mediaMinutos);
  }

  private async calcularAgendamentosVisitas(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereAtendimento: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereAtendimento.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereAtendimento.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const agendamentos = await this.prismaService.visitasAtendimento.count({
      where: {
        atendimento: whereAtendimento,
      },
    });

    return agendamentos;
  }

  private async calcularTaxaComparecimentoVisitas(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereAtendimento: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereAtendimento.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereAtendimento.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const [totalAgendamentos, visitasRealizadas] = await Promise.all([
      this.prismaService.visitasAtendimento.count({
        where: {
          atendimento: whereAtendimento,
        },
      }),
      this.prismaService.visitasAtendimento.count({
        where: {
          atendimento: whereAtendimento,
          concluida: true,
        },
      }),
    ]);

    if (totalAgendamentos === 0) {
      return 0;
    }

    return parseFloat(((visitasRealizadas / totalAgendamentos) * 100).toFixed(2));
  }

  private async calcularVisitasCompareceram(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const whereAtendimento: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereAtendimento.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereAtendimento.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const visitasCompareceram = await this.prismaService.visitasAtendimento.count({
      where: {
        atendimento: whereAtendimento,
        concluida: true,
      },
    });

    return visitasCompareceram;
  }

  private async calcularMotivosPerda(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<{
    motivo: string;
    porcentagem: number;
    total: number;
    submotivos?: Array<{ submotivo: string; quantidade: number; porcentagem: number }>;
  }[]> {
    const whereAtendimento: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
      status: STATUS_ATENDIMENTO.PERDIDO,
    };

    if (modo) {
      whereAtendimento.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereAtendimento.atendimentoResponsaveis = { some: { idColaborador } };
    }

    const comentarios = await this.prismaService.comentariosAtendimento.findMany({
      where: {
        atendimento: whereAtendimento,
        motivoPerdido: {
          not: null,
        },
      },
      select: {
        motivoPerdido: true,
        subMotivoPerdido: true,
      },
    });

    // Agrupar por motivo principal
    const motivosMap = new Map<string, { total: number; submotivos: Map<string, number> }>();
    
    comentarios.forEach((comentario) => {
      const motivo = comentario.motivoPerdido || 'Não informado';
      
      if (!motivosMap.has(motivo)) {
        motivosMap.set(motivo, { total: 0, submotivos: new Map() });
      }
      
      const motivoData = motivosMap.get(motivo)!;
      motivoData.total += 1;
      
      // Contar submotivos se existir
      if (comentario.subMotivoPerdido) {
        const submotivo = comentario.subMotivoPerdido;
        motivoData.submotivos.set(submotivo, (motivoData.submotivos.get(submotivo) || 0) + 1);
      }
    });

    const totalPerdas = comentarios.length;

    return Array.from(motivosMap.entries()).map(([motivo, data]) => {
      const submotivosArray = Array.from(data.submotivos.entries()).map(([submotivo, quantidade]) => ({
        submotivo,
        quantidade,
        porcentagem: totalPerdas > 0 ? parseFloat(((quantidade / totalPerdas) * 100).toFixed(2)) : 0,
      }));

      return {
        motivo,
        total: data.total,
        porcentagem: totalPerdas > 0 ? parseFloat(((data.total / totalPerdas) * 100).toFixed(2)) : 0,
        submotivos: submotivosArray.length > 0 ? submotivosArray : undefined,
      };
    });
  }

  private async calcularTempoMedioRespostaPorMes(
    idLoja: string,
    dataFim: Date,
    tipoColaborador: 'preVendedor' | 'vendedor',
    idColaborador?: string,
  ): Promise<{
    mes: string;
    tempoMedio: string;
  }[]> {
    const resultados = [];
    
    // Calcular para os últimos 4 meses a partir da data fim
    for (let i = 3; i >= 0; i--) {
      const dataInicioMes = startOfMonth(new Date(dataFim.getFullYear(), dataFim.getMonth() - i, 1));
      const dataFimMes = endOfMonth(dataInicioMes);
      
      // Garantir que não ultrapasse a data fim selecionada
      const dataFimAjustada = dataFimMes > dataFim ? dataFim : dataFimMes;
      
      const tempoMedio = await this.calcularTempoMedioRespostaPorTipo(
        idLoja,
        dataInicioMes,
        dataFimAjustada,
        tipoColaborador,
        undefined,
        idColaborador,
      );
      
      resultados.push({
        mes: format(dataInicioMes, 'MMM/yyyy', { locale: ptBR }),
        tempoMedio,
      });
    }
    
    return resultados;
  }

  private async calcularTempoMedioPorEtapaNegociacao(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
  ) {
    const atendimentosFinalizados = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        status: {
          in: [STATUS_ATENDIMENTO.SUCESSO, STATUS_ATENDIMENTO.PERDIDO],
        },
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
        ...(idColaborador && {
          atendimentoResponsaveis: {
            some: {
              idColaborador,
            },
          },
        }),
      },
      select: {
        id: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    // Mapear etapas para cálculo de tempo
    const etapasMap = {
      [STATUS_ATENDIMENTO.PRE_ATENDIMENTO]: 'Pré-atendimento',
      [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL]: 'Atendimento Inicial',
      [STATUS_ATENDIMENTO.VISITA]: 'Visita',
      [STATUS_ATENDIMENTO.EM_NEGOCIACAO]: 'Em Negociação',
      [STATUS_ATENDIMENTO.RESGATE]: 'Resgate',
    };

    const temposPorEtapa: Record<string, number[]> = {
      'Pré-atendimento': [],
      'Atendimento Inicial': [],
      'Visita': [],
      'Em Negociação': [],
      'Resgate': [],
    };

    // Processar cada atendimento
    for (const atendimento of atendimentosFinalizados) {
      const logs = await this.obterLogsStatusAtendimento(atendimento.id);
      
      if (logs.length === 0) continue;

      // Adicionar log inicial (criação do atendimento)
      const logsComInicio = [
        {
          mensagem: `Status alterado para ${STATUS_ATENDIMENTO_MAP[STATUS_ATENDIMENTO.PRE_ATENDIMENTO]}`,
          criadoEm: atendimento.criadoEm,
        },
        ...logs,
      ];

      // Calcular tempo entre mudanças de status
      for (let i = 0; i < logsComInicio.length - 1; i++) {
        const logAtual = logsComInicio[i];
        const proximoLog = logsComInicio[i + 1];

        const statusAtual = this.extrairStatusDoLog(logAtual.mensagem);
        const etapaAtual = etapasMap[statusAtual];

        if (etapaAtual) {
          const tempoMinutos = differenceInMinutes(
            new Date(proximoLog.criadoEm),
            new Date(logAtual.criadoEm),
          );
          
          if (tempoMinutos > 0) {
            temposPorEtapa[etapaAtual].push(tempoMinutos);
          }
        }
      }

      // Calcular tempo da última etapa até finalização
      if (logsComInicio.length > 0) {
        const ultimoLog = logsComInicio[logsComInicio.length - 1];
        const statusUltimo = this.extrairStatusDoLog(ultimoLog.mensagem);
        const etapaUltima = etapasMap[statusUltimo];

        if (etapaUltima && etapaUltima !== 'Resgate') {
          const tempoMinutos = differenceInMinutes(
            atendimento.atualizadoEm,
            new Date(ultimoLog.criadoEm),
          );
          
          if (tempoMinutos > 0) {
            temposPorEtapa[etapaUltima].push(tempoMinutos);
          }
        }
      }
    }

    // Calcular médias e formatar resultado
    const formatarTempo = (minutos: number): string => {
      const horas = Math.floor(minutos / 60);
      const mins = Math.round(minutos % 60);
      return `${horas}h ${mins}min`;
    };

    const calcularMedia = (tempos: number[]): number => {
      if (tempos.length === 0) return 0;
      return tempos.reduce((acc, tempo) => acc + tempo, 0) / tempos.length;
    };

    const medias = {
      'Pré-atendimento': calcularMedia(temposPorEtapa['Pré-atendimento']),
      'Atendimento Inicial': calcularMedia(temposPorEtapa['Atendimento Inicial']),
      'Visita': calcularMedia(temposPorEtapa['Visita']),
      'Em Negociação': calcularMedia(temposPorEtapa['Em Negociação']),
      'Resgate': calcularMedia(temposPorEtapa['Resgate']),
    };

    // Identificar etapa mais rápida e mais lenta
    const mediasValidas = Object.entries(medias).filter(([_, tempo]) => tempo > 0);
    const etapaMaisRapida = mediasValidas.reduce((min, [etapa, tempo]) => 
      tempo < min[1] ? [etapa, tempo] : min, ['', Infinity]);
    const etapaMaisLenta = mediasValidas.reduce((max, [etapa, tempo]) => 
      tempo > max[1] ? [etapa, tempo] : max, ['', 0]);

    return {
      'Pré-atendimento': formatarTempo(medias['Pré-atendimento']),
      'Atendimento Inicial': formatarTempo(medias['Atendimento Inicial']),
      'Visita': formatarTempo(medias['Visita']),
      'Em Negociação': formatarTempo(medias['Em Negociação']),
      'Resgate': formatarTempo(medias['Resgate']),
      etapaMaisRapida: etapaMaisRapida[0] ? formatarTempo(etapaMaisRapida[1]) : '0h 0min',
      etapaMaisLenta: etapaMaisLenta[0] ? formatarTempo(etapaMaisLenta[1]) : '0h 0min',
    };
  }

  private async calcularMotivosPerdasNegociais(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
    modo?: string,
  ) {
    // Buscar atendimentos perdidos com seus comentários
    const atendimentosPerdidos = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        status: STATUS_ATENDIMENTO.PERDIDO,
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
        ...(modo && modo !== 'total' && { modoAtendimento: modo }),
        ...(idColaborador && {
          atendimentoResponsaveis: {
            some: {
              idColaborador,
            },
          },
        }),
      },
      include: {
        comentariosAtendimento: {
          where: {
            motivoPerdido: {
              not: null,
            },
          },
          select: {
            motivoPerdido: true,
            subMotivoPerdido: true,
          },
        },
      },
    });

    const totalPerdas = atendimentosPerdidos.length;
    
    // Contadores para cada motivo e submotivo
    const motivosCount = new Map<string, number>();
    const submotivosCount = new Map<string, { motivo: string; quantidade: number }>();
    
    // Contar motivos e submotivos baseado nos comentários reais
    atendimentosPerdidos.forEach((atendimento) => {
      // Pegar o último comentário com motivo de perda (mais recente)
      const comentarioComMotivo = atendimento.comentariosAtendimento
        .filter(c => c.motivoPerdido)
        .pop(); // Pega o último comentário com motivo
      
      if (comentarioComMotivo && comentarioComMotivo.motivoPerdido) {
        const motivo = comentarioComMotivo.motivoPerdido.trim();
        motivosCount.set(motivo, (motivosCount.get(motivo) || 0) + 1);
        
        // Contar submotivos se existir
        if (comentarioComMotivo.subMotivoPerdido) {
          const submotivo = comentarioComMotivo.subMotivoPerdido.trim();
          const chaveSubmotivo = `${motivo}|${submotivo}`;
          submotivosCount.set(chaveSubmotivo, {
            motivo,
            quantidade: (submotivosCount.get(chaveSubmotivo)?.quantidade || 0) + 1
          });
        }
      }
    });

    // Converter para array e ordenar por frequência
    const motivosArray = Array.from(motivosCount.entries())
      .map(([motivo, quantidade]) => ({
        motivo,
        quantidade,
        porcentagem: totalPerdas > 0 ? (quantidade / totalPerdas) * 100 : 0,
      }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // Converter submotivos para array e organizar por motivo principal
    const submotivosArray = Array.from(submotivosCount.entries())
      .map(([chave, dados]) => {
        const [motivoPrincipal, submotivo] = chave.split('|');
        return {
          motivoPrincipal,
          submotivo,
          quantidade: dados.quantidade,
          porcentagem: totalPerdas > 0 ? (dados.quantidade / totalPerdas) * 100 : 0,
        };
      })
      .sort((a, b) => b.quantidade - a.quantidade);

    // Agrupar submotivos por motivo principal
    const submotivosPorMotivo = submotivosArray.reduce((acc, item) => {
      if (!acc[item.motivoPrincipal]) {
        acc[item.motivoPrincipal] = [];
      }
      acc[item.motivoPrincipal].push({
        submotivo: item.submotivo,
        quantidade: item.quantidade,
        porcentagem: item.porcentagem,
      });
      return acc;
    }, {} as Record<string, Array<{ submotivo: string; quantidade: number; porcentagem: number }>>);

    // Encontrar principal motivo
    const principalMotivo = motivosArray.length > 0 ? motivosArray[0].motivo : 'Não informado';

    // Calcular taxa de perda
    const totalAtendimentos = await this.prismaService.atendimento.count({
      where: {
        idLoja,
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
        ...(modo && modo !== 'total' && { modoAtendimento: modo }),
        ...(idColaborador && {
          atendimentoResponsaveis: {
            some: {
              idColaborador,
            },
          },
        }),
      },
    });

    const taxaPerda = totalAtendimentos > 0 ? parseFloat(((totalPerdas / totalAtendimentos) * 100).toFixed(2)) : 0;

    // Mapear para os campos específicos do DTO (mantendo compatibilidade)
    const getQuantidadePorMotivo = (palavrasChave: string[]): number => {
      return motivosArray
        .filter(m => palavrasChave.some(palavra => 
          m.motivo.toLowerCase().includes(palavra.toLowerCase())
        ))
        .reduce((sum, m) => sum + m.quantidade, 0);
    };

    const getPorcentagemPorMotivo = (palavrasChave: string[]): number => {
      const quantidade = getQuantidadePorMotivo(palavrasChave);
      return totalPerdas > 0 ? parseFloat(((quantidade / totalPerdas) * 100).toFixed(2)) : 0;
    };

    // Categorizar motivos baseado em palavras-chave comuns
    const precoAltoQtd = getQuantidadePorMotivo(['preço', 'preco', 'caro', 'valor', 'financeiro']);
    const concorrenciaQtd = getQuantidadePorMotivo(['concorrencia', 'concorrente', 'outro', 'outra']);
    const naoQualificadoQtd = getQuantidadePorMotivo(['qualificado', 'perfil', 'interesse']);
    const timingQtd = getQuantidadePorMotivo(['timing', 'tempo', 'prazo', 'urgencia']);
    
    // Outros motivos (que não se encaixam nas categorias acima)
    const categorizados = precoAltoQtd + concorrenciaQtd + naoQualificadoQtd + timingQtd;
    const outrosQtd = totalPerdas - categorizados;

    return {
      precoAlto: { 
        valor: precoAltoQtd, 
        porcentagem: getPorcentagemPorMotivo(['preço', 'preco', 'caro', 'valor', 'financeiro'])
      },
      concorrencia: { 
        valor: concorrenciaQtd, 
        porcentagem: getPorcentagemPorMotivo(['concorrencia', 'concorrente', 'outro', 'outra'])
      },
      naoQualificado: { 
        valor: naoQualificadoQtd, 
        porcentagem: getPorcentagemPorMotivo(['qualificado', 'perfil', 'interesse'])
      },
      timing: { 
        valor: timingQtd, 
        porcentagem: getPorcentagemPorMotivo(['timing', 'tempo', 'prazo', 'urgencia'])
      },
      outros: { 
        valor: outrosQtd, 
        porcentagem: totalPerdas > 0 ? parseFloat(((outrosQtd / totalPerdas) * 100).toFixed(2)) : 0
      },
      totalPerdas,
      principalMotivo,
      taxaPerda,
      motivosDetalhados: motivosArray,
      submotivosPorMotivo,
      submotivosDetalhados: submotivosArray,
    };
  }

  private async buscarAtendimentosPreAtendimentoSemFollowUp(idLoja: string, idColaborador?: string) {
    const whereCondition: any = {
      idLoja,
      status: STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
    };

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
      include: {
        chat: {
          include: {
            mensagem: {
              orderBy: { criadoEm: 'desc' },
            },
          },
        },
        comentariosAtendimento: {
          orderBy: { criadoEm: 'desc' },
        },
        atendimentoResponsaveis: {
          include: {
            colaborador: {
              select: {
                nome: true,
                idUsuario: true,
              },
            },
          },
        },
      },
      orderBy: { atualizadoEm: 'asc' },
      take: 8,
    });

    const atendimentosComDias = atendimentos.map((atendimento) => {
      const idsResponsaveis = atendimento.atendimentoResponsaveis
        .map(r => r.colaborador?.idUsuario)
        .filter((id): id is string => id !== undefined && id !== null);

      const ultimoComentarioResponsavel = atendimento.comentariosAtendimento
        .find(c => idsResponsaveis.includes(c.idUsuario));

      const todasMensagens = atendimento.chat?.flatMap(c => c.mensagem) || [];
      const ultimaMensagemResponsavel = todasMensagens
        .find(m => m.idUsuario && idsResponsaveis.includes(m.idUsuario));

      const datasInteracao = [
        ultimoComentarioResponsavel?.criadoEm,
        ultimaMensagemResponsavel?.criadoEm,
      ].filter((d): d is Date => d !== null && d !== undefined);

      const dataUltimaInteracao = datasInteracao.length > 0
        ? datasInteracao.reduce((a, b) => a.getTime() > b.getTime() ? a : b)
        : atendimento.criadoEm;

      const diasSemFollowUp = differenceInDays(new Date(), dataUltimaInteracao);
      
      const colaborador = atendimento.atendimentoResponsaveis?.[0]?.colaborador?.nome;

      return {
        id: atendimento.id,
        nomeAtendimento: atendimento.titulo,
        periodo: format(atendimento.criadoEm, 'dd/MM/yyyy', { locale: ptBR }),
        status: STATUS_ATENDIMENTO_MAP[atendimento.status],
        colaborador: colaborador || 'Não atribuído',
        diasSemFollowUp,
      };
    });

    return atendimentosComDias.sort((a, b) => b.diasSemFollowUp - a.diasSemFollowUp);
  }

  private async buscarAtendimentosVendasSemFollowUp(idLoja: string, idColaborador?: string) {
    const statusVendas = [
      STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
      STATUS_ATENDIMENTO.VISITA,
      STATUS_ATENDIMENTO.EM_NEGOCIACAO,
    ];

    const whereCondition: any = {
      idLoja,
      status: {
        in: statusVendas,
      },
    };

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
      include: {
        chat: {
          include: {
            mensagem: {
              orderBy: { criadoEm: 'desc' },
            },
          },
        },
        comentariosAtendimento: {
          orderBy: { criadoEm: 'desc' },
        },
        atendimentoResponsaveis: {
          include: {
            colaborador: {
              select: {
                nome: true,
                idUsuario: true,
                cargos: {
                  select: {
                    cargo: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { atualizadoEm: 'asc' },
      take: 8,
    });

    const atendimentosComDias = atendimentos.map((atendimento) => {
      const idsResponsaveis = atendimento.atendimentoResponsaveis
        .map(r => r.colaborador?.idUsuario)
        .filter((id): id is string => id !== undefined && id !== null);

      const ultimoComentarioResponsavel = atendimento.comentariosAtendimento
        .find(c => idsResponsaveis.includes(c.idUsuario));

      const todasMensagens = atendimento.chat?.flatMap(c => c.mensagem) || [];
      const ultimaMensagemResponsavel = todasMensagens
        .find(m => m.idUsuario && idsResponsaveis.includes(m.idUsuario));

      const datasInteracao = [
        ultimoComentarioResponsavel?.criadoEm,
        ultimaMensagemResponsavel?.criadoEm,
      ].filter((d): d is Date => d !== null && d !== undefined);

      const dataUltimaInteracao = datasInteracao.length > 0
        ? datasInteracao.reduce((a, b) => a.getTime() > b.getTime() ? a : b)
        : atendimento.criadoEm;

      const diasSemFollowUp = differenceInDays(new Date(), dataUltimaInteracao);
      
      let colaboradorSelecionado = null;
      
      if (atendimento.atendimentoResponsaveis && atendimento.atendimentoResponsaveis.length > 0) {
        if (atendimento.atendimentoResponsaveis.length > 1) {
          const vendedor = atendimento.atendimentoResponsaveis.find(responsavel => {
            return responsavel.colaborador?.cargos?.some(cargo => 
              cargo.cargo.toLowerCase() === 'vendedor'
            );
          });
          
          if (vendedor) {
            colaboradorSelecionado = vendedor.colaborador;
          } else {
            colaboradorSelecionado = atendimento.atendimentoResponsaveis[0]?.colaborador;
          }
        } else {
          colaboradorSelecionado = atendimento.atendimentoResponsaveis[0]?.colaborador;
        }
      }

      return {
        id: atendimento.id,
        nomeAtendimento: atendimento.titulo,
        periodo: format(atendimento.criadoEm, 'dd/MM/yyyy', { locale: ptBR }),
        status: STATUS_ATENDIMENTO_MAP[atendimento.status],
        colaborador: colaboradorSelecionado?.nome || 'Não atribuído',
        diasSemFollowUp,
      };
    });

    return atendimentosComDias.sort((a, b) => b.diasSemFollowUp - a.diasSemFollowUp);
  }

  private async buscarAtendimentosPreAtendimentoSemFollowUpPorModo(
    idLoja: string, 
    modo: MODO_ATENDIMENTO | 'total', 
    idColaborador?: string
  ) {
    const whereCondition: any = {
      idLoja,
      status: STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
      modoAtendimento: modo,
    };

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
      include: {
        chat: {
          include: {
            mensagem: {
              orderBy: { criadoEm: 'desc' },
            },
          },
        },
        comentariosAtendimento: {
          orderBy: { criadoEm: 'desc' },
        },
        atendimentoResponsaveis: {
          include: {
            colaborador: {
              select: {
                nome: true,
                idUsuario: true,
              },
            },
          },
        },
      },
      orderBy: { atualizadoEm: 'asc' },
      take: 8,
    });

    const atendimentosComDias = atendimentos.map((atendimento) => {
      const idsResponsaveis = atendimento.atendimentoResponsaveis
        .map(r => r.colaborador?.idUsuario)
        .filter((id): id is string => id !== undefined && id !== null);

      const ultimoComentarioResponsavel = atendimento.comentariosAtendimento
        .find(c => idsResponsaveis.includes(c.idUsuario));

      const todasMensagens = atendimento.chat?.flatMap(c => c.mensagem) || [];
      const ultimaMensagemResponsavel = todasMensagens
        .find(m => m.idUsuario && idsResponsaveis.includes(m.idUsuario));

      const datasInteracao = [
        ultimoComentarioResponsavel?.criadoEm,
        ultimaMensagemResponsavel?.criadoEm,
      ].filter((d): d is Date => d !== null && d !== undefined);

      const dataUltimaInteracao = datasInteracao.length > 0
        ? datasInteracao.reduce((a, b) => a.getTime() > b.getTime() ? a : b)
        : atendimento.criadoEm;

      const diasSemFollowUp = differenceInDays(new Date(), dataUltimaInteracao);
      
      const colaborador = atendimento.atendimentoResponsaveis?.[0]?.colaborador?.nome;

      return {
        id: atendimento.id,
        nomeAtendimento: atendimento.titulo,
        periodo: format(atendimento.criadoEm, 'dd/MM/yyyy', { locale: ptBR }),
        status: STATUS_ATENDIMENTO_MAP[atendimento.status],
        colaborador: colaborador || 'Não atribuído',
        diasSemFollowUp,
      };
    });

    return atendimentosComDias.sort((a, b) => b.diasSemFollowUp - a.diasSemFollowUp);
  }

  private async buscarAtendimentosVendasSemFollowUpPorModo(
    idLoja: string, 
    modo: MODO_ATENDIMENTO | 'total', 
    idColaborador?: string
  ) {
    const whereCondition: any = {
      idLoja,
      status: { in: [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL, STATUS_ATENDIMENTO.EM_NEGOCIACAO, STATUS_ATENDIMENTO.VISITA] },
      modoAtendimento: modo,
    };

    if (idColaborador) {
      whereCondition.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereCondition,
      include: {
        chat: {
          include: {
            mensagem: {
              orderBy: { criadoEm: 'desc' },
            },
          },
        },
        comentariosAtendimento: {
          orderBy: { criadoEm: 'desc' },
        },
        atendimentoResponsaveis: {
          include: {
            colaborador: {
              select: {
                nome: true,
                idUsuario: true,
                cargos: {
                  select: {
                    cargo: true,
                  }
                }
              },
            },
          },
        },
      },
      orderBy: { atualizadoEm: 'asc' },
      take: 8,
    });

    const atendimentosComDias = atendimentos.map((atendimento) => {
      const idsResponsaveis = atendimento.atendimentoResponsaveis
        .map(r => r.colaborador?.idUsuario)
        .filter((id): id is string => id !== undefined && id !== null);

      const ultimoComentarioResponsavel = atendimento.comentariosAtendimento
        .find(c => idsResponsaveis.includes(c.idUsuario));

      const todasMensagens = atendimento.chat?.flatMap(c => c.mensagem) || [];
      const ultimaMensagemResponsavel = todasMensagens
        .find(m => m.idUsuario && idsResponsaveis.includes(m.idUsuario));

      const datasInteracao = [
        ultimoComentarioResponsavel?.criadoEm,
        ultimaMensagemResponsavel?.criadoEm,
      ].filter((d): d is Date => d !== null && d !== undefined);

      const dataUltimaInteracao = datasInteracao.length > 0
        ? datasInteracao.reduce((a, b) => a.getTime() > b.getTime() ? a : b)
        : atendimento.criadoEm;

      const diasSemFollowUp = differenceInDays(new Date(), dataUltimaInteracao);
      
      let colaboradorSelecionado = null;
      
      if (atendimento.atendimentoResponsaveis && atendimento.atendimentoResponsaveis.length > 0) {
        if (atendimento.atendimentoResponsaveis.length > 1) {
          const vendedor = atendimento.atendimentoResponsaveis.find(responsavel => {
            return responsavel.colaborador?.cargos?.some(cargo => 
              cargo.cargo.toLowerCase() === 'vendedor'
            );
          });
          
          if (vendedor) {
            colaboradorSelecionado = vendedor.colaborador;
          } else {
            colaboradorSelecionado = atendimento.atendimentoResponsaveis[0]?.colaborador;
          }
        } else {
          colaboradorSelecionado = atendimento.atendimentoResponsaveis[0]?.colaborador;
        }
      }

      return {
        id: atendimento.id,
        nomeAtendimento: atendimento.titulo,
        periodo: format(atendimento.criadoEm, 'dd/MM/yyyy', { locale: ptBR }),
        status: STATUS_ATENDIMENTO_MAP[atendimento.status],
        colaborador: colaboradorSelecionado?.nome || 'Não atribuído',
        diasSemFollowUp,
      };
    });

    return atendimentosComDias.sort((a, b) => b.diasSemFollowUp - a.diasSemFollowUp);
  }

  private async gerarRelatorioConsolidadoVendedores(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idUsuarioLogado?: string,
  ): Promise<RelatorioDetalhadoVendedorDto[]> {
    const vendedores = await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        cargos: {
          some: {
            cargo: {
              in: ['Vendedor', 'Pré-vendedor'],
            },
          },
        },
      },
      include: { usuario: true },
    });

    if (vendedores.length === 0) {
      throw new NotFoundException('Nenhum vendedor encontrado na loja');
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        criadoEm: { gte: dataInicio, lte: dataFim },
        atendimentoResponsaveis: {
          some: {
            colaborador: {
              cargos: {
                some: {
                  cargo: {
                    in: ['Vendedor', 'Pré-vendedor'],
                  },
                },
              },
            },
          },
        },
      },
      include: {
        visitasAtendimento: true,
        atendimentoResponsaveis: {
          include: {
            colaborador: {
              include: { usuario: true },
            },
          },
        },
      },
    });

    // Calcular métricas consolidadas
    const totalLeads = atendimentos.length;
    const conversoes = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.SUCESSO,
    ).length;
    const percentualConversao =
      totalLeads > 0 ? parseFloat(((conversoes / totalLeads) * 100).toFixed(2)) : 0;

    // Gráfico de leads por canal consolidado
    const graficoLeadsPorCanal = await this.gerarGraficoLeadsPorCanalConsolidado(
      idLoja,
      dataInicio,
      dataFim,
    );

    // Segmentação por status consolidada
    const segmentacaoStatus = {
      inicial: atendimentos.filter((a) =>
        [STATUS_ATENDIMENTO.CHAT, STATUS_ATENDIMENTO.PRE_ATENDIMENTO].includes(
          a.status as STATUS_ATENDIMENTO,
        ),
      ).length,
      emVisita: atendimentos.filter(
        (a) => a.status === STATUS_ATENDIMENTO.VISITA,
      ).length,
      resgate: atendimentos.filter(
        (a) => a.status === STATUS_ATENDIMENTO.RESGATE,
      ).length,
      negociacao: atendimentos.filter(
        (a) => a.status === STATUS_ATENDIMENTO.EM_NEGOCIACAO,
      ).length,
      total: 0,
    };

    segmentacaoStatus.total = segmentacaoStatus.inicial + segmentacaoStatus.emVisita + 
      segmentacaoStatus.resgate + segmentacaoStatus.negociacao;

    // Segmentação por temperatura consolidada
    const segmentacaoTemperatura = {
      frio: atendimentos.filter(
        (a) => a.temperatura === TEMPERATURA_ATENDIMENTO.FRIO,
      ).length,
      morno: atendimentos.filter(
        (a) => a.temperatura === TEMPERATURA_ATENDIMENTO.MORNO,
      ).length,
      quente: atendimentos.filter(
        (a) => a.temperatura === TEMPERATURA_ATENDIMENTO.QUENTE,
      ).length,
    };

    // Taxa de conversão showroom consolidada
    const totalAtendimentosShowroom = atendimentos.filter(
      (a) => a.origemAtendimento === ORIGEM_ATENDIMENTO.SHOWROOM,
    ).length;
    const conversaoShowroom = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.SUCESSO && 
             a.origemAtendimento === ORIGEM_ATENDIMENTO.SHOWROOM,
    ).length;
    const taxaConversaoShowroom =
      totalAtendimentosShowroom > 0
        ? parseFloat(((conversaoShowroom / totalAtendimentosShowroom) * 100).toFixed(2))
        : 0;

    // Tempo médio de resposta consolidado
    const tempoMedioResposta = await this.calcularTempoMedioResposta(
      idLoja,
      dataInicio,
      dataFim,
    );

    const insucessos = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.PERDIDO,
    ).length;

    const taxaInsucesso = totalLeads > 0 ? parseFloat(((insucessos / totalLeads) * 100).toFixed(2)) : 0;
    const taxaSucesso = totalLeads > 0 ? parseFloat(((conversoes / totalLeads) * 100).toFixed(2)) : 0;

    const tempoMedioFechamento = await this.calcularTempoMedioFinalizacao(
      idLoja,
      dataInicio,
      dataFim,
    );

    const numeroConversaoOnline = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.SUCESSO && 
             a.origemAtendimento !== ORIGEM_ATENDIMENTO.SHOWROOM,
    ).length;

    const numeroConversaoShowroom = atendimentos.filter(
      (a) => a.status === STATUS_ATENDIMENTO.SUCESSO && 
             a.origemAtendimento === ORIGEM_ATENDIMENTO.SHOWROOM,
    ).length;

    const tempoMedioPorEtapaNegociacao = await this.calcularTempoMedioPorEtapaNegociacao(
      idLoja,
      dataInicio,
      dataFim,
    );

    const motivosPerdasNegociais = await this.calcularMotivosPerdasNegociais(
      idLoja,
      dataInicio,
      dataFim,
    );

    // Leads vs conversões dos top 3 vendedores + usuário logado
    let vendedoresSelecionados = vendedores;
    
    if (idUsuarioLogado) {
      // Calcular vendas de sucesso para todos os vendedores
      const vendedoresComVendas = await Promise.all(
        vendedores.map(async (v) => {
          const statusCountsV = await this.getStatusCountsForColaborador(
            v.id,
            dataInicio,
            dataFim,
          );
          const conversoesV =
            statusCountsV.find((s) => s.status === STATUS_ATENDIMENTO.SUCESSO)?._count || 0;
          return {
            ...v,
            vendas: conversoesV,
          };
        }),
      );

      // Ordenar por vendas de sucesso (decrescente)
      vendedoresComVendas.sort((a, b) => b.vendas - a.vendas);

      // Pegar os top 3
      const top3Vendedores = vendedoresComVendas.slice(0, 3);

      // Verificar se o usuário logado está nos top 3
      const usuarioLogadoNoTop3 = top3Vendedores.some(v => v.id === idUsuarioLogado);

      if (!usuarioLogadoNoTop3) {
        // Buscar o usuário logado
        const usuarioLogado = vendedoresComVendas.find(v => v.id === idUsuarioLogado);
        if (usuarioLogado) {
          // Adicionar o usuário logado aos vendedores selecionados
          vendedoresSelecionados = [...top3Vendedores, usuarioLogado];
        } else {
          vendedoresSelecionados = top3Vendedores;
        }
      } else {
        vendedoresSelecionados = top3Vendedores;
      }
    }

    const leadsVsConversoesVendedor = await Promise.all(
      vendedoresSelecionados.map(async (v) => {
        const statusCountsV = await this.getStatusCountsForColaborador(
          v.id,
          dataInicio,
          dataFim,
        );
        const totalLeadsV = statusCountsV.reduce((sum, item) => sum + item._count, 0);
        const conversoesV =
          statusCountsV.find((s) => s.status === STATUS_ATENDIMENTO.SUCESSO)?._count || 0;
        return {
          id: v.id,
          nome: v.nome || v.usuario?.nome || 'Sem nome',
          avatar: v.usuario?.urlFoto ?? v.urlFoto ?? undefined,
          leads: totalLeadsV,
          conversoes: conversoesV,
        };
      }),
    );

    // Ranking mensal consolidado (baseado no melhor vendedor do período)
    const rankingMensal = await this.calcularRankingMensalConsolidado(
      idLoja,
      dataInicio,
      dataFim,
    );

    const leadsQualificados = atendimentos.filter((a) =>
      [
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.SUCESSO,
      ].includes(a.status as STATUS_ATENDIMENTO),
    ).length;
    const mediaQualificacao =
      totalLeads > 0 ? (leadsQualificados / totalLeads) * 100 : 0;

    // Criar um array de relatórios para cada vendedor selecionado
    const relatoriosVendedores: RelatorioDetalhadoVendedorDto[] = [];

    for (const vendedor of vendedoresSelecionados) {
      const atendimentosVendedor = atendimentos.filter(a => 
        a.atendimentoResponsaveis.some(ar => ar.idColaborador === vendedor.id)
      );
      
      const totalLeadsVendedor = atendimentosVendedor.length;
      const conversoesVendedor = atendimentosVendedor.filter(a => 
        a.status === STATUS_ATENDIMENTO.SUCESSO
      ).length;
      const percentualConversaoVendedor = totalLeadsVendedor > 0 
        ? (conversoesVendedor / totalLeadsVendedor) * 100 
        : 0;

      // Calcular vendas diárias para os vendedores do ranking
      const vendedoresRanking = leadsVsConversoesVendedor.map(v => ({
        id: v.id,
        nome: v.nome,
        avatar: v.avatar,
      }));
      const vendasDiariasPorVendedor = await this.calcularVendasDiariasPorVendedor(
        vendedoresRanking,
        dataInicio,
        dataFim,
      );

      relatoriosVendedores.push({
        vendedor: {
          id: vendedor.id,
          nome: vendedor.nome || vendedor.usuario?.nome || 'Sem nome',
          avatar: vendedor.usuario?.urlFoto ?? vendedor.urlFoto ?? undefined,
        },
        periodo: {
          inicio: dataInicio,
          fim: dataFim,
        },
        totalLeads: totalLeadsVendedor,
        percentualConversao: percentualConversaoVendedor,
        atendimentosBemSucedidos: conversoesVendedor,
        totalVendasGeradas: conversoesVendedor,
        graficoLeadsPorCanal: await this.gerarGraficoLeadsPorCanal(vendedor.id, dataInicio, dataFim),
        mediaQualificacao: totalLeadsVendedor > 0 
          ? (atendimentosVendedor.filter(a => [
              STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
              STATUS_ATENDIMENTO.VISITA,
              STATUS_ATENDIMENTO.EM_NEGOCIACAO,
              STATUS_ATENDIMENTO.SUCESSO,
            ].includes(a.status as STATUS_ATENDIMENTO)).length / totalLeadsVendedor) * 100 
          : 0,
        mediaConversao: percentualConversaoVendedor,
        segmentacaoStatus: this.transformStatusCounts(await this.getStatusCountsForColaborador(vendedor.id, dataInicio, dataFim)),
        segmentacaoTemperatura: this.transformTemperaturaCounts(await this.getTemperaturaCountsForColaborador(vendedor.id, dataInicio, dataFim)),
        segmentacaoTemperaturaQualificacao: await this.calcularSegmentacaoTemperaturaQualificacao(idLoja, dataInicio, dataFim, undefined, vendedor.id),
        taxaConversaoShowroom: await this.calcularTaxaShowroom(idLoja, dataInicio, dataFim, undefined, vendedor.id),
        tempoMedioResposta: await this.calcularTempoMedioRespostaColaborador(vendedor.id, idLoja, dataInicio, dataFim),
        insucessos: atendimentosVendedor.filter(a => a.status === STATUS_ATENDIMENTO.PERDIDO).length,
        taxaInsucesso: totalLeadsVendedor > 0 
          ? (atendimentosVendedor.filter(a => a.status === STATUS_ATENDIMENTO.PERDIDO).length / totalLeadsVendedor) * 100 
          : 0,
        taxaSucesso: percentualConversaoVendedor,
        tempoMedioFechamento: await this.calcularTempoMedioFinalizacao(idLoja, dataInicio, dataFim, vendedor.id),
        numeroConversaoOnline: atendimentosVendedor.filter(a => 
          a.status === STATUS_ATENDIMENTO.SUCESSO && a.origemAtendimento !== ORIGEM_ATENDIMENTO.SHOWROOM
        ).length,
        numeroConversaoShowroom: atendimentosVendedor.filter(a => 
          a.status === STATUS_ATENDIMENTO.SUCESSO && a.origemAtendimento === ORIGEM_ATENDIMENTO.SHOWROOM
        ).length,
        tempoMedioPorEtapaNegociacao: await this.calcularTempoMedioPorEtapaNegociacao(idLoja, dataInicio, dataFim, vendedor.id),
        motivosPerdasNegociais: await this.calcularMotivosPerdasNegociais(idLoja, dataInicio, dataFim, vendedor.id),
        leadsVsConversoesVendedor: await this.gerarSerieHistoricaMensal(vendedor.id, dataInicio, dataFim),
        rankingMensal: await this.gerarRankingMensal(vendedor.id, dataInicio, dataFim),
        vendasDiariasPorVendedor,
      });
    }

    return relatoriosVendedores;
  }

  private async gerarGraficoLeadsPorCanalConsolidado(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const atendimentos = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
      select: {
        origemAtendimento: true,
        status: true,
      },
    });

    const canaisMap = new Map();

    for (const atendimento of atendimentos) {
      const canal = atendimento.origemAtendimento;
      if (!canaisMap.has(canal)) {
        canaisMap.set(canal, { leads: 0, qualificados: 0 });
      }

      const canalData = canaisMap.get(canal);
      canalData.leads++;

      if ([
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.SUCESSO,
      ].includes(atendimento.status as STATUS_ATENDIMENTO)) {
        canalData.qualificados++;
      }
    }

    return Array.from(canaisMap.entries()).map(([canal, data]) => ({
      canal,
      leads: data.leads,
      qualificados: data.qualificados,
    }));
  }

  private async calcularRankingMensalConsolidado(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
  ) {
    // Para o relatório consolidado, retornamos um ranking baseado no total de conversões por mês
    const meses = [];
    const currentDate = new Date(dataInicio);
    
    while (currentDate <= dataFim) {
      const mesInicio = startOfMonth(currentDate);
      const mesFim = endOfMonth(currentDate);
      
      const conversoesMes = await this.prismaService.atendimento.count({
        where: {
          idLoja,
          status: STATUS_ATENDIMENTO.SUCESSO,
          criadoEm: {
            gte: mesInicio,
            lte: mesFim,
          },
        },
      });

      meses.push({
        mes: format(currentDate, 'MMM/yyyy', { locale: ptBR }),
        conversoes: conversoesMes,
        posicao: 1, // Para o consolidado, sempre posição 1
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return meses;
  }

  private async calcularSegmentacaoTemperaturaQualificacao(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ) {
    // Buscar atendimentos no período
    const whereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo && modo !== 'total') {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = {
        some: {
          idColaborador: idColaborador,
        },
      };
    }

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereClause,
      select: {
        id: true,
        temperatura: true,
      },
    });

    if (atendimentos.length === 0) {
      return {
        frio: { inicial: 0, final: 0, porcentagemInicial: 0, porcentagemFinal: 0 },
        morno: { inicial: 0, final: 0, porcentagemInicial: 0, porcentagemFinal: 0 },
        quente: { inicial: 0, final: 0, porcentagemInicial: 0, porcentagemFinal: 0 },
        total: 0,
      };
    }

    const logsTemperatura = await this.prismaService.logAtividadesAtendimento.findMany({
      where: {
        idAtendimento: {
          in: atendimentos.map(a => a.id),
        },
        tipoEvento: 'ALTERACAO_TEMPERATURA',
      },
      orderBy: {
        criadoEm: 'asc',
      },
    });

    const temperaturasPorAtendimento = new Map();

    atendimentos.forEach(atendimento => {
      temperaturasPorAtendimento.set(atendimento.id, {
        inicial: atendimento.temperatura, 
        final: atendimento.temperatura,
      });
    });

    // Processar logs para determinar temperatura inicial e final
    logsTemperatura.forEach(log => {
      const atendimentoId = log.idAtendimento;
      
      let dadosAntigos = null;
      if (log.dadosAntigos) {
        if (typeof log.dadosAntigos === 'string') {
          try {
            dadosAntigos = JSON.parse(log.dadosAntigos);
          } catch (error) {
            console.error('Erro ao fazer parse de dadosAntigos:', error);
            dadosAntigos = null;
          }
        } else {
          dadosAntigos = log.dadosAntigos;
        }
      }
      
      let dadosNovos = null;
      if (log.dadosNovos) {
        if (typeof log.dadosNovos === 'string') {
          try {
            dadosNovos = JSON.parse(log.dadosNovos);
          } catch (error) {
            console.error('Erro ao fazer parse de dadosNovos:', error);
            dadosNovos = null;
          }
        } else {
          dadosNovos = log.dadosNovos;
        }
      }

      if (temperaturasPorAtendimento.has(atendimentoId)) {
        const temperaturas = temperaturasPorAtendimento.get(atendimentoId);
        
        // Se é o primeiro log de temperatura, usar dadosAntigos como inicial
        if (dadosAntigos && dadosAntigos.temperatura) {
          temperaturas.inicial = dadosAntigos.temperatura;
        }
        
        // Sempre atualizar a temperatura final com a mais recente
        if (dadosNovos && dadosNovos.temperatura) {
          temperaturas.final = dadosNovos.temperatura;
        }
      }
    });

    // Contar temperaturas inicial e final
    const contadores = {
      frio: { inicial: 0, final: 0 },
      morno: { inicial: 0, final: 0 },
      quente: { inicial: 0, final: 0 },
    };

    temperaturasPorAtendimento.forEach(temperaturas => {
      // Contar temperatura inicial
      if (temperaturas.inicial === TEMPERATURA_ATENDIMENTO.FRIO) {
        contadores.frio.inicial++;
      } else if (temperaturas.inicial === TEMPERATURA_ATENDIMENTO.MORNO) {
        contadores.morno.inicial++;
      } else if (temperaturas.inicial === TEMPERATURA_ATENDIMENTO.QUENTE) {
        contadores.quente.inicial++;
      }

      // Contar temperatura final
      if (temperaturas.final === TEMPERATURA_ATENDIMENTO.FRIO) {
        contadores.frio.final++;
      } else if (temperaturas.final === TEMPERATURA_ATENDIMENTO.MORNO) {
        contadores.morno.final++;
      } else if (temperaturas.final === TEMPERATURA_ATENDIMENTO.QUENTE) {
        contadores.quente.final++;
      }
    });

    const total = atendimentos.length;

    return {
      frio: {
        inicial: contadores.frio.inicial,
        final: contadores.frio.final,
        porcentagemInicial: total > 0 ? Math.round((contadores.frio.inicial / total) * 100) : 0,
        porcentagemFinal: total > 0 ? Math.round((contadores.frio.final / total) * 100) : 0,
      },
      morno: {
        inicial: contadores.morno.inicial,
        final: contadores.morno.final,
        porcentagemInicial: total > 0 ? Math.round((contadores.morno.inicial / total) * 100) : 0,
        porcentagemFinal: total > 0 ? Math.round((contadores.morno.final / total) * 100) : 0,
      },
      quente: {
        inicial: contadores.quente.inicial,
        final: contadores.quente.final,
        porcentagemInicial: total > 0 ? Math.round((contadores.quente.inicial / total) * 100) : 0,
        porcentagemFinal: total > 0 ? Math.round((contadores.quente.final / total) * 100) : 0,
      },
      total,
    };
  }

  private async calcularTempoMedioPrimeiraResposta(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<string> {
    const whereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    // Buscar chats através dos atendimentos
    const chatsLoja = await this.prismaService.chat.findMany({
      where: { 
        idLoja: idLoja,
        atendimento: whereClause,
      },
      select: { 
        id: true,
        atendimento: {
          select: {
            criadoEm: true,
          },
        },
      },
    });

    const chatIds = chatsLoja.map(chat => chat.id);
    
    if (chatIds.length === 0) {
      return '0 min';
    }

    const primeirasMensagens = await this.prismaService.mensagem.findMany({
      where: {
        idChat: {
          in: chatIds,
        },
        remetente: Remetente.LOJA,
      },
      select: {
        idChat: true,
        criadoEm: true,
      },
      orderBy: {
        criadoEm: 'asc',
      },
    });

    const temposResposta: number[] = [];

    for (const chat of chatsLoja) {
      const primeiraResposta = primeirasMensagens.find(m => m.idChat === chat.id);
      
      if (primeiraResposta && chat.atendimento) {
        const tempoResposta = differenceInMinutes(
          new Date(primeiraResposta.criadoEm),
          new Date(chat.atendimento.criadoEm),
        );
        
        if (tempoResposta >= 0) {
          temposResposta.push(tempoResposta);
        }
      }
    }

    if (temposResposta.length === 0) {
      return '0 min';
    }

    const tempoMedio = temposResposta.reduce((acc, tempo) => acc + tempo, 0) / temposResposta.length;

    if (tempoMedio >= 60) {
      const horas = Math.floor(tempoMedio / 60);
      const minutos = Math.round(tempoMedio % 60);
      return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    }

    return `${Math.round(tempoMedio)} min`;
  }

  private async calcularTempoMedioRespostaEntreMensagens(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<string> {
    const whereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    if (modo) {
      whereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = { some: { idColaborador } };
    }

    // Buscar chats através dos atendimentos
    const chatsLoja = await this.prismaService.chat.findMany({
      where: { 
        idLoja: idLoja,
        atendimento: whereClause,
      },
      select: { id: true },
    });

    const chatIds = chatsLoja.map(chat => chat.id);
    
    if (chatIds.length === 0) {
      return '0 min';
    }

    const mensagens = await this.prismaService.mensagem.findMany({
      where: {
        idChat: {
          in: chatIds,
        },
        remetente: {
          in: [Remetente.CLIENTE, Remetente.LOJA],
        },
      },
      select: {
        idChat: true,
        remetente: true,
        criadoEm: true,
      },
      orderBy: {
        criadoEm: 'asc',
      },
    });

    const temposResposta: number[] = [];

    // Agrupar mensagens por chat
    const mensagensPorChat = mensagens.reduce((acc, msg) => {
      if (!acc[msg.idChat]) {
        acc[msg.idChat] = [];
      }
      acc[msg.idChat].push(msg);
      return acc;
    }, {} as Record<string, typeof mensagens>);

    for (const chatId in mensagensPorChat) {
      const mensagensDoChat = mensagensPorChat[chatId];
      
      for (let i = 0; i < mensagensDoChat.length - 1; i++) {
        const mensagemAtual = mensagensDoChat[i];
        const proximaMensagem = mensagensDoChat[i + 1];

        // Verifica se a mensagem atual é do cliente e a próxima é da loja
        if (
          mensagemAtual.remetente === Remetente.CLIENTE &&
          proximaMensagem.remetente === Remetente.LOJA
        ) {
          const tempoResposta = differenceInMinutes(
            new Date(proximaMensagem.criadoEm),
            new Date(mensagemAtual.criadoEm),
          );
          
          if (tempoResposta >= 0) {
            temposResposta.push(tempoResposta);
          }
        }
      }
    }

    if (temposResposta.length === 0) {
      return '0 min';
    }

    const tempoMedio = temposResposta.reduce((acc, tempo) => acc + tempo, 0) / temposResposta.length;

    if (tempoMedio >= 60) {
      const horas = Math.floor(tempoMedio / 60);
      const minutos = Math.round(tempoMedio % 60);
      return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
    }

    return `${Math.round(tempoMedio)} min`;
  }

  private transformStatusCounts(statusCounts: any[]): {
    inicial: number;
    emVisita: number;
    resgate: number;
    negociacao: number;
    total: number;
  } {
    const result = {
      inicial: 0,
      emVisita: 0,
      resgate: 0,
      negociacao: 0,
      total: 0,
    };

    statusCounts.forEach(item => {
      const count = item._count;
      result.total += count;

      switch (item.status) {
        case STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL:
          result.inicial += count;
          break;
        case STATUS_ATENDIMENTO.VISITA:
          result.emVisita += count;
          break;
        case STATUS_ATENDIMENTO.RESGATE:
          result.resgate += count;
          break;
        case STATUS_ATENDIMENTO.EM_NEGOCIACAO:
          result.negociacao += count;
          break;
      }
    });

    return result;
  }

  private transformTemperaturaCounts(temperaturaCounts: any[]): {
    frio: number;
    morno: number;
    quente: number;
  } {
    const result = {
      frio: 0,
      morno: 0,
      quente: 0,
    };

    temperaturaCounts.forEach(item => {
      const count = item._count;

      switch (item.temperatura) {
        case TEMPERATURA_ATENDIMENTO.FRIO:
          result.frio += count;
          break;
        case TEMPERATURA_ATENDIMENTO.MORNO:
          result.morno += count;
          break;
        case TEMPERATURA_ATENDIMENTO.QUENTE:
          result.quente += count;
          break;
      }
    });

    return result;
  }

  private async calcularVendasDiariasPorVendedor(
    vendedores: Array<{ id: string; nome: string; avatar?: string }>,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const vendasDiarias = await Promise.all(
      vendedores.map(async (vendedor) => {
        // Buscar vendas de sucesso para este vendedor através da tabela de responsáveis
        const vendas = await this.prismaService.atendimento.findMany({
          where: {
            status: STATUS_ATENDIMENTO.SUCESSO,
            criadoEm: {
              gte: dataInicio,
              lte: dataFim,
            },
            atendimentoResponsaveis: {
              some: {
                idColaborador: vendedor.id,
              },
            },
          },
          select: {
            criadoEm: true,
          },
        });

        // Agrupar vendas por data
        const vendasPorData = new Map<string, number>();
        
        // Inicializar todas as datas do período com 0 vendas
        const currentDate = new Date(dataInicio);
        while (currentDate <= dataFim) {
          const dataFormatada = format(currentDate, 'yyyy-MM-dd');
          vendasPorData.set(dataFormatada, 0);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Contar vendas por data
        vendas.forEach((venda) => {
          const dataFormatada = format(new Date(venda.criadoEm), 'yyyy-MM-dd');
          const count = vendasPorData.get(dataFormatada) || 0;
          vendasPorData.set(dataFormatada, count + 1);
        });

        // Converter para array ordenado
        const serieVendas = Array.from(vendasPorData.entries())
          .map(([data, vendas]) => ({ data, vendas }))
          .sort((a, b) => a.data.localeCompare(b.data));

        return {
          id: vendedor.id,
          nome: vendedor.nome,
          avatar: vendedor.avatar,
          serieVendas,
        };
      })
    );

    return vendasDiarias;
  }

  async obterTop3VendedoresComUsuarioLogado(
    idLoja: string,
    filtro: FiltroTop3VendedoresDto,
  ): Promise<Top3VendedoresDto> {
    const { mes, ano } = filtro;
    
    // Criar datas de início e fim do mês selecionado
    const dataInicio = startOfMonth(new Date(ano, mes - 1));
    const dataFim = endOfMonth(new Date(ano, mes - 1));

    // Buscar todos os vendedores da loja
    const vendedores = await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        cargos: {
          some: {
            cargo: {
              in: ['Vendedor'],
            },
          },
        },
      },
      select: {
        id: true,
        nome: true,
        urlFoto: true,
      },
    });

    const vendedoresFormatados = vendedores.map(v => ({
      id: v.id,
      nome: v.nome,
      avatar: v.urlFoto ?? undefined,
    }));

    // Calcular vendas diárias para todos os vendedores
    const vendasDiarias = await this.calcularVendasDiariasPorVendedor(
      vendedoresFormatados,
      dataInicio,
      dataFim,
    );

    // Calcular total de vendas por vendedor
    const vendedoresComTotal = vendasDiarias.map(vendedor => {
      const totalVendas = vendedor.serieVendas.reduce((sum, item) => sum + item.vendas, 0);
      
      return {
        id: vendedor.id,
        nome: vendedor.nome,
        avatar: vendedor.avatar,
        totalVendas,
        posicaoRanking: 0, // Será definido após ordenação
        serieVendas: vendedor.serieVendas,
      };
    });

    // Ordenar por total de vendas e pegar top 3
    const top3Vendedores = vendedoresComTotal
      .sort((a, b) => b.totalVendas - a.totalVendas)
      .slice(0, 3)
      .map((vendedor, index) => ({
        ...vendedor,
        posicaoRanking: index + 1,
      }));

    // Buscar dados do usuário logado para mês atual e anterior
    const usuarioLogado = await this.obterDadosUsuarioLogado(idLoja, filtro.idUsuarioLogado, ano, mes);

    return {
      periodo: {
        mes: filtro.mes,
        ano: filtro.ano,
      },
      top3Vendedores,
      usuarioLogado,
    };
  }

  private async obterDadosUsuarioLogado(
    idLoja: string,
    idUsuarioLogado: string,
    ano: number,
    mes: number,
  ): Promise<UsuarioLogadoVendasDto> {
    // Criar datas para mês atual
    const dataInicioAtual = new Date(ano, mes - 1, 1);
    const dataFimAtual = endOfMonth(dataInicioAtual);
    
    // Criar datas para mês anterior
    const mesAnterior = subMonths(dataInicioAtual, 1);
    const dataInicioAnterior = startOfMonth(mesAnterior);
    const dataFimAnterior = endOfMonth(mesAnterior);

    // Buscar colaborador do usuário logado
    const colaborador = await this.prismaService.colaborador.findFirst({
      where: {
        idLoja,
        idUsuario: idUsuarioLogado,
      },
      include: {
        usuario: {
          select: {
            urlFoto: true,
          }
        }
      }
    });
    if (!colaborador) {
      throw new NotFoundException('Colaborador não encontrado');
    }

    const usuario = {
      id: colaborador.id,
      nome: colaborador.nome,
      avatar: colaborador.usuario?.urlFoto || undefined,
    };

    // Calcular vendas do mês atual
    const vendasMesAtual = await this.calcularVendasDiariasPorVendedor(
      [usuario],
      dataInicioAtual,
      dataFimAtual,
    );

    // Calcular vendas do mês anterior
    const vendasMesAnterior = await this.calcularVendasDiariasPorVendedor(
      [usuario],
      dataInicioAnterior,
      dataFimAnterior,
    );

    // Buscar todos os vendedores para calcular ranking
    const todosVendedores = await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
      },
      select: {
        id: true,
        nome: true,
        urlFoto: true,
      },
    });

    // Calcular ranking do mês atual
    const vendasTodosVendedoresAtual = await this.calcularVendasDiariasPorVendedor(
      todosVendedores.map(v => ({ id: v.id, nome: v.nome, avatar: v.urlFoto })),
      dataInicioAtual,
      dataFimAtual,
    );

    const rankingAtual = vendasTodosVendedoresAtual
      .map(v => ({
        id: v.id,
        totalVendas: v.serieVendas.reduce((total, dia) => total + dia.vendas, 0),
      }))
      .sort((a, b) => b.totalVendas - a.totalVendas);

    const posicaoAtual = rankingAtual.findIndex(v => v.id === colaborador.id) + 1;

    // Calcular ranking do mês anterior
    const vendasTodosVendedoresAnterior = await this.calcularVendasDiariasPorVendedor(
      todosVendedores.map(v => ({ id: v.id, nome: v.nome, avatar: v.urlFoto })),
      dataInicioAnterior,
      dataFimAnterior,
    );

    const rankingAnterior = vendasTodosVendedoresAnterior
      .map(v => ({
        id: v.id,
        totalVendas: v.serieVendas.reduce((total, dia) => total + dia.vendas, 0),
      }))
      .sort((a, b) => b.totalVendas - a.totalVendas);

    const posicaoAnterior = rankingAnterior.findIndex(v => v.id === colaborador.id) + 1;

    const totalMesAtual = vendasMesAtual[0]?.serieVendas.reduce((sum, item) => sum + item.vendas, 0) || 0;
    const totalMesAnterior = vendasMesAnterior[0]?.serieVendas.reduce((sum, item) => sum + item.vendas, 0) || 0;

    return {
      id: colaborador.id,
      nome: colaborador.nome,
      avatar: colaborador.usuario?.urlFoto || undefined,
      mesAtual: {
        totalVendas: totalMesAtual,
        posicaoRanking: posicaoAtual,
        serieVendas: vendasMesAtual[0]?.serieVendas || [],
      },
      mesAnterior: {
        totalVendas: totalMesAnterior,
        posicaoRanking: posicaoAnterior,
        serieVendas: vendasMesAnterior[0]?.serieVendas || [],
      },
    };
  }

  private async calcularMotivosPerdasPreAtendimento(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    idColaborador?: string,
    modo?: string,
  ): Promise<{
    motivo: string;
    porcentagem: number;
    total: number;
    submotivos?: Array<{ submotivo: string; quantidade: number; porcentagem: number }>;
  }[]> {
    // Buscar atendimentos que passaram apenas por PRE_ATENDIMENTO e foram direto para PERDIDO
    const whereClause: any = {
      idLoja,
      status: STATUS_ATENDIMENTO.PERDIDO,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
      ...(modo && modo !== 'total' && { modoAtendimento: modo }),
    };

    if (idColaborador) {
      whereClause.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    // Buscar atendimentos perdidos
    const atendimentosPerdidos = await this.prismaService.atendimento.findMany({
      where: whereClause,
      include: {
        logsAtividadesAtendimento: {
          where: {
            tipoEvento: 'STATUS_ALTERADO',
          },
          orderBy: {
            criadoEm: 'asc',
          },
        },
        comentariosAtendimento: {
          where: {
            motivoPerdido: {
              not: null,
            },
          },
          orderBy: {
            criadoEm: 'desc',
          },
        },
      },
    });

    // Filtrar apenas atendimentos que passaram direto de PRE_ATENDIMENTO para PERDIDO
    const atendimentosPreAtendimentoPerdidos = atendimentosPerdidos.filter(atendimento => {
      const logs = atendimento.logsAtividadesAtendimento;
      
      // Se não há logs de mudança de status, assumir que foi direto
      if (logs.length === 0) {
        return true;
      }

      // Verificar se passou apenas por PRE_ATENDIMENTO antes de ir para PERDIDO
      const statusHistorico = logs.map(log => {
        const dadosNovos = log.dadosNovos as any;
        return dadosNovos?.status;
      }).filter(status => status);

      // Se só tem PERDIDO no histórico ou se o primeiro status diferente de PRE_ATENDIMENTO é PERDIDO
      const statusDiferentesDePreAtendimento = statusHistorico.filter(
        status => status !== STATUS_ATENDIMENTO.PRE_ATENDIMENTO
      );

      return statusDiferentesDePreAtendimento.length === 0 || 
             (statusDiferentesDePreAtendimento.length === 1 && 
              statusDiferentesDePreAtendimento[0] === STATUS_ATENDIMENTO.PERDIDO);
    });

    // Coletar motivos de perda dos comentários
    const motivosMap = new Map<string, { total: number; submotivos: Map<string, number> }>();

    atendimentosPreAtendimentoPerdidos.forEach(atendimento => {
      const comentarioComMotivo = atendimento.comentariosAtendimento[0]; // Pegar o mais recente
      
      if (comentarioComMotivo?.motivoPerdido) {
        const motivo = comentarioComMotivo.motivoPerdido;
        const submotivo = comentarioComMotivo.subMotivoPerdido;

        if (!motivosMap.has(motivo)) {
          motivosMap.set(motivo, { total: 0, submotivos: new Map() });
        }

        const motivoData = motivosMap.get(motivo)!;
        motivoData.total += 1;

        if (submotivo) {
          const submotivoCount = motivoData.submotivos.get(submotivo) || 0;
          motivoData.submotivos.set(submotivo, submotivoCount + 1);
        }
      }
    });

    const totalAtendimentosComMotivo = Array.from(motivosMap.values())
      .reduce((sum, motivo) => sum + motivo.total, 0);

    // Converter para o formato esperado
    const resultado = Array.from(motivosMap.entries()).map(([motivo, data]) => {
      const porcentagem = totalAtendimentosComMotivo > 0 
        ? (data.total / totalAtendimentosComMotivo) * 100 
        : 0;

      const submotivos = Array.from(data.submotivos.entries()).map(([submotivo, quantidade]) => ({
        submotivo,
        quantidade,
        porcentagem: data.total > 0 ? (quantidade / data.total) * 100 : 0,
      }));

      return {
        motivo,
        porcentagem: Math.round(porcentagem * 100) / 100,
        total: data.total,
        submotivos: submotivos.length > 0 ? submotivos : undefined,
      };
    });

    // Ordenar por total (maior para menor)
    return resultado.sort((a, b) => b.total - a.total);
  }

  private async calcularTotalAtendimentosShowroomPorModo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: MODO_ATENDIMENTO | 'total',
    idColaborador?: string,
  ): Promise<number> {
    const baseWhereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
      origemAtendimento: ORIGEM_ATENDIMENTO.SHOWROOM,
      status: {
        in: [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL, STATUS_ATENDIMENTO.VISITA, STATUS_ATENDIMENTO.EM_NEGOCIACAO, STATUS_ATENDIMENTO.SUCESSO],
      },
    };

    if (modo && modo !== 'total') {
      baseWhereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      baseWhereClause.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    return await this.prismaService.atendimento.count({
      where: baseWhereClause,
    });
  }

  private async calcularTotalAtendimentosOnlinePorModo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const baseWhereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
      origemAtendimento: {
        not: ORIGEM_ATENDIMENTO.SHOWROOM,
      },
      status: {
        in: [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL, STATUS_ATENDIMENTO.VISITA, STATUS_ATENDIMENTO.EM_NEGOCIACAO, STATUS_ATENDIMENTO.SUCESSO],
      },
    };

    if (modo && modo !== 'total') {
      baseWhereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      baseWhereClause.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    return await this.prismaService.atendimento.count({
      where: baseWhereClause,
    });
  }

  private async calcularTaxaConversaoOnlinePorModo(
    idLoja: string,
    dataInicio: Date,
    dataFim: Date,
    modo?: string,
    idColaborador?: string,
  ): Promise<number> {
    const totalOnline = await this.calcularTotalAtendimentosOnlinePorModo(
      idLoja,
      dataInicio,
      dataFim,
      modo,
      idColaborador,
    );

    if (totalOnline === 0) {
      return 0;
    }

    // Calcular conversões online (atendimentos com status SUCESSO)
    const baseWhereClause: any = {
      idLoja,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
      origemAtendimento: {
        not: ORIGEM_ATENDIMENTO.SHOWROOM,
      },
      status: STATUS_ATENDIMENTO.SUCESSO,
    };

    if (modo && modo !== 'total') {
      baseWhereClause.modoAtendimento = modo;
    }

    if (idColaborador) {
      baseWhereClause.atendimentoResponsaveis = {
        some: {
          idColaborador,
        },
      };
    }

    const conversoesOnline = await this.prismaService.atendimento.count({
      where: baseWhereClause,
    });

    // Calcular taxa de conversão (conversões / total) * 100
    const taxaConversao = (conversoesOnline / totalOnline) * 100;
    return parseFloat(taxaConversao.toFixed(2));
  }
}