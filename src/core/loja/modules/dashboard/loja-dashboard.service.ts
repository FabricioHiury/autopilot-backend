import { UTCDate } from '@date-fns/utc';
import { Injectable } from '@nestjs/common';
import { Atendimento, AtendimentoResponsaveis } from '@prisma/client';
import {
  subWeeks,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  startOfMonth,
  addMonths,
  startOfQuarter,
  endOfQuarter,
  addQuarters,
  startOfYear,
  endOfYear,
  addYears,
  format,
} from 'date-fns';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  ORIGEM_ATENDIMENTO,
  STATUS_ATENDIMENTO,
  MODO_ATENDIMENTO,
} from 'src/utils/enum/atendimento.enum';
import {
  AppErrorNotFound,
  AppErrorBadRequest,
} from 'src/utils/errors/app-errors';
import { FILTRO_DATA } from '../../enum/filtro-data.enum';
import { IItemGraficoOrigemAtendimentos } from '../../interfaces/item-grafico-atendimentos.interface';

@Injectable()
export class LojaDashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  private async pegarColaboradorPorId(idColaborador: string, idLoja: string) {
    return await this.prismaService.colaborador.findUnique({
      where: {
        id: idColaborador,
        idLoja,
      },
      select: {
        id: true,
        nome: true,
      },
    });
  }

  private async pegarColaboradoresCadastradosSemana(idLoja: string) {
    return await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        criadoEm: { gte: subWeeks(new Date(), 1) },
      },
    });
  }

  private pegarIntervaloDeSemanas() {
    const now = new Date();
    return {
      inicioSemanaAtual: startOfWeek(now, { weekStartsOn: 0 }),
      fimSemanaAtual: endOfWeek(now, { weekStartsOn: 0 }),
      inicioSemanaAnterior: startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }),
      fimSemanaAnterior: endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 }),
    };
  }

  private filtrarAtendimentosPorData(
    atendimentos: Atendimento[],
    inicio: Date,
    fim: Date,
  ) {
    return atendimentos.filter((atendimento) => {
      const dataAtendimento = new Date(atendimento.criadoEm);
      return dataAtendimento >= inicio && dataAtendimento <= fim;
    });
  }

  private calcularDiferencaPercentual(atual: number, anterior: number): number {
    if (anterior === 0) {
      if (atual === 0) return 0;
      return Math.round(atual * 100 * 100) / 100;
    }

    const percentual = ((atual - anterior) / anterior) * 100;
    return Math.round(percentual * 100) / 100;
  }

  private filtrarAtendimentosPorStatus(
    atendimentos: Atendimento[],
    status: string,
  ) {
    const atendimentosFiltrados = atendimentos.filter(
      (atendimento) => atendimento.status === status,
    );

    return atendimentosFiltrados;
  }

  private mapearAtendimentosPorVendedor(
    atendimentoResponsaveis: (AtendimentoResponsaveis & {
      atendimento: Atendimento;
    })[],
  ): Map<string, number> {
    const atendimentosPorColaboradorMap = new Map<string, number>();

    atendimentoResponsaveis.forEach((atendimento) => {
      const idColaborador = atendimento.idColaborador;
      const totalAtendimentos =
        atendimentosPorColaboradorMap.get(idColaborador) || 0;
      atendimentosPorColaboradorMap.set(idColaborador, totalAtendimentos + 1);

      return {
        idColaborador: atendimento.idColaborador,
        ...atendimento.atendimento,
      };
    });

    return atendimentosPorColaboradorMap;
  }

  private pegarMaiorElementoDeMap(map: Map<string, number>) {
    const maiorElementoArray = Array.from(map.entries()).reduce(
      (anterior, atual) => (atual[1] > anterior[1] ? atual : anterior),
      ['', 0] as [string, number],
    );

    return {
      chave: maiorElementoArray[0],
      valor: maiorElementoArray[1],
    };
  }

  private calcularMediaVendas(
    atendimentosPorColaboradorMap: Map<string, number>,
  ): number {
    let totalVendas = 0;
    atendimentosPorColaboradorMap.forEach((vendas) => {
      totalVendas += vendas;
    });

    const quantidadeColaboradores = atendimentosPorColaboradorMap.size;

    if (quantidadeColaboradores === 0) {
      return 0;
    }

    return totalVendas / quantidadeColaboradores;
  }

  private async pegarAtendimentosConsolidados(
    idLoja: string,
    inicioSemanaAtual: Date,
    fimSemanaAtual: Date,
    inicioSemanaAnterior: Date,
    fimSemanaAnterior: Date,
  ) {
    const [
      atendimentosSemanaAtual,
      atendimentosSemanaAnterior,
      vendasSemanaAtual,
      vendasSemanaAnterior,
      atendimentosEmAbertoAtual,
      atendimentosEmAbertoSemanaAnterior,
      vendasRealizadasAtual,
      vendasRealizadasSemanaAnterior,
      vendasPorColaborador,
    ] = await Promise.all([
      this.prismaService.atendimento.count({
        where: {
          idLoja,
          criadoEm: {
            gte: inicioSemanaAtual,
            lte: fimSemanaAtual,
          },
        },
      }),
      this.prismaService.atendimento.count({
        where: {
          idLoja,
          criadoEm: {
            gte: inicioSemanaAnterior,
            lte: fimSemanaAnterior,
          },
        },
      }),
      this.prismaService.atendimento.count({
        where: {
          idLoja,
          status: STATUS_ATENDIMENTO.SUCESSO,
          criadoEm: {
            gte: inicioSemanaAtual,
            lte: fimSemanaAtual,
          },
        },
      }),
      this.prismaService.atendimento.count({
        where: {
          idLoja,
          status: STATUS_ATENDIMENTO.SUCESSO,
          criadoEm: {
            gte: inicioSemanaAnterior,
            lte: fimSemanaAnterior,
          },
        },
      }),
      this.prismaService.atendimento.count({
        where: {
          idLoja,
          status: {
            notIn: [STATUS_ATENDIMENTO.SUCESSO, STATUS_ATENDIMENTO.PERDIDO],
          },
          criadoEm: {
            gte: inicioSemanaAtual,
            lte: fimSemanaAtual,
          },
        },
      }),
      this.prismaService.atendimento.count({
        where: {
          idLoja,
          status: {
            notIn: [STATUS_ATENDIMENTO.SUCESSO, STATUS_ATENDIMENTO.PERDIDO],
          },
          criadoEm: {
            gte: inicioSemanaAnterior,
            lte: fimSemanaAnterior,
          },
        },
      }),
      this.prismaService.atendimento.count({
        where: {
          idLoja,
          status: STATUS_ATENDIMENTO.SUCESSO,
          criadoEm: {
            gte: inicioSemanaAtual,
            lte: fimSemanaAtual,
          },
        },
      }),
      this.prismaService.atendimento.count({
        where: {
          idLoja,
          status: STATUS_ATENDIMENTO.SUCESSO,
          criadoEm: {
            gte: inicioSemanaAnterior,
            lte: fimSemanaAnterior,
          },
        },
      }),
      this.prismaService.atendimentoResponsaveis.groupBy({
        by: ['idColaborador'],
        where: {
          idLoja,
          atendimento: {
            status: STATUS_ATENDIMENTO.SUCESSO,
            criadoEm: {
              gte: inicioSemanaAtual,
              lte: fimSemanaAtual,
            },
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      }),
    ]);

    return {
      atendimentosSemanaAtual,
      atendimentosSemanaAnterior,
      vendasSemanaAtual,
      vendasSemanaAnterior,
      atendimentosEmAbertoAtual,
      atendimentosEmAbertoSemanaAnterior,
      vendasRealizadasAtual,
      vendasRealizadasSemanaAnterior,
      vendasPorColaborador,
    };
  }

  private async pegarChatsSemRespostaConsolidados(
    idLoja: string,
    inicioSemanaAtual: Date,
    fimSemanaAtual: Date,
    inicioSemanaAnterior: Date,
    fimSemanaAnterior: Date,
  ) {
    const [chatsSemRespostaAtual, chatsSemRespostaSemanaAnterior] =
      await Promise.all([
        this.prismaService.$queryRaw`
          SELECT COUNT(*) as count
          FROM Chat c
          WHERE c.id_loja = ${idLoja}
            AND EXISTS (
              SELECT 1 FROM Atendimento a 
              WHERE a.id = c."idAtendimento" 
                AND a.status NOT IN (${STATUS_ATENDIMENTO.SUCESSO}, ${STATUS_ATENDIMENTO.PERDIDO})
            )
            AND EXISTS (
              SELECT 1 FROM Mensagem m 
              WHERE m.id_chat = c.id 
                AND m.remetente = 'cliente'
                AND m.id = (
                  SELECT m2.id FROM Mensagem m2 
                  WHERE m2.id_chat = c.id 
                  ORDER BY m2.criado_em DESC 
                  LIMIT 1
                )
                AND m.criado_em >= ${inicioSemanaAtual}
                AND m.criado_em <= ${fimSemanaAtual}
            )
        `,
        this.prismaService.$queryRaw`
          SELECT COUNT(*) as count
          FROM Chat c
          WHERE c.id_loja = ${idLoja}
            AND EXISTS (
              SELECT 1 FROM Atendimento a 
              WHERE a.id = c."idAtendimento" 
                AND a.status NOT IN (${STATUS_ATENDIMENTO.SUCESSO}, ${STATUS_ATENDIMENTO.PERDIDO})
            )
            AND EXISTS (
              SELECT 1 FROM Mensagem m 
              WHERE m.id_chat = c.id 
                AND m.remetente = 'cliente'
                AND m.id = (
                  SELECT m2.id FROM Mensagem m2 
                  WHERE m2.id_chat = c.id 
                  ORDER BY m2.criado_em DESC 
                  LIMIT 1
                )
                AND m.criado_em >= ${inicioSemanaAnterior}
                AND m.criado_em <= ${fimSemanaAnterior}
            )
        `,
      ]);

    return {
      chatsSemRespostaAtual: Number(
        (chatsSemRespostaAtual as any)[0]?.count || 0,
      ),
      chatsSemRespostaSemanaAnterior: Number(
        (chatsSemRespostaSemanaAnterior as any)[0]?.count || 0,
      ),
    };
  }

  private async pegarTarefasConsolidadas(
    idLoja: string,
    idUsuario: string | undefined,
    inicioSemanaAtual: Date,
    fimSemanaAtual: Date,
    inicioSemanaAnterior: Date,
    fimSemanaAnterior: Date,
  ) {
    let tarefasPendentesAtual = 0;
    let tarefasPendentesSemanaAnterior = 0;

    if (idUsuario) {
      const colaborador = await this.prismaService.colaborador.findFirst({
        where: {
          idLoja,
          idUsuario,
        },
        select: {
          id: true,
        },
      });

      if (colaborador) {
        [tarefasPendentesAtual, tarefasPendentesSemanaAnterior] =
          await Promise.all([
            this.prismaService.tarefasAtendimento.count({
              where: {
                idResponsavel: colaborador.id,
                concluida: false,
                data: {
                  gte: inicioSemanaAtual,
                  lte: fimSemanaAtual,
                },
              },
            }),
            this.prismaService.tarefasAtendimento.count({
              where: {
                idResponsavel: colaborador.id,
                concluida: false,
                data: {
                  gte: inicioSemanaAnterior,
                  lte: fimSemanaAnterior,
                },
              },
            }),
          ]);
      }
    } else {
      [tarefasPendentesAtual, tarefasPendentesSemanaAnterior] = await Promise.all([
        this.prismaService.tarefasAtendimento.count({
          where: {
            concluida: false,
            colaborador: { idLoja },
            data: {
              gte: inicioSemanaAtual,
              lte: fimSemanaAtual,
            },
          },
        }),
        this.prismaService.tarefasAtendimento.count({
          where: {
            concluida: false,
            colaborador: { idLoja },
            data: {
              gte: inicioSemanaAnterior,
              lte: fimSemanaAnterior,
            },
          },
        }),
      ]);
    }

    return {
      tarefasPendentesAtual,
      tarefasPendentesSemanaAnterior,
    };
  }

  private comecoDoSemestre(date: Date): Date {
    const mes = date.getMonth();
    const mesComeco = mes < 6 ? 0 : 6;
    return new Date(date.getFullYear(), mesComeco, 1);
  }

  private fimDoSemestre(date: Date): Date {
    const mes = date.getMonth();
    const mesFim = mes < 6 ? 5 : 11;
    return endOfMonth(new Date(date.getFullYear(), mesFim, 1));
  }

  private tratarAgrupamentoDiario(
    atendimentos: Atendimento[],
    dataInicio: Date,
    dataFim: Date,
  ): IItemGraficoOrigemAtendimentos[] {
    const resultado: IItemGraficoOrigemAtendimentos[] = [];

    let dataAtual = startOfDay(dataInicio);
    const dataFinal = endOfDay(dataFim);

    while (dataAtual <= dataFinal) {
      const inicioDoDia = startOfDay(dataAtual);
      const fimDoDia = endOfDay(dataAtual);

      const atendimentosDoDia = atendimentos.filter(
        (a) => a.criadoEm >= inicioDoDia && a.criadoEm <= fimDoDia,
      );

      const contagem: Record<string, number> = {};
      Object.values(ORIGEM_ATENDIMENTO).forEach((origem) => {
        contagem[origem] = 0;
      });

      atendimentosDoDia.forEach((a) => {
        contagem[a.origemAtendimento] += 1;
      });

      resultado.push({
        data: format(inicioDoDia, 'yyyy-MM-dd'),
        contagem,
      });

      dataAtual = addDays(dataAtual, 1);
    }

    return resultado;
  }

  private tratarAgrupamentoSemanal(
    atendimentos: Atendimento[],
    dataInicio: Date,
    dataFim: Date,
  ): IItemGraficoOrigemAtendimentos[] {
    const resultado: IItemGraficoOrigemAtendimentos[] = [];

    let dataAtual = startOfWeek(dataInicio, { weekStartsOn: 0 });
    const dataFinal = endOfWeek(dataFim, { weekStartsOn: 0 });

    while (dataAtual <= dataFinal) {
      const comecoDaSemana = startOfWeek(dataAtual, { weekStartsOn: 0 });
      const fimDaSemana = endOfWeek(dataAtual, { weekStartsOn: 0 });

      const atendimentosSemana = atendimentos.filter(
        (a) => a.criadoEm >= comecoDaSemana && a.criadoEm <= fimDaSemana,
      );

      const contagem: Record<string, number> = {};
      Object.values(ORIGEM_ATENDIMENTO).forEach((origem) => {
        contagem[origem] = 0;
      });

      atendimentosSemana.forEach((a) => {
        contagem[a.origemAtendimento] += 1;
      });

      resultado.push({
        data: format(dataAtual, 'yyyy-MM-dd'),
        contagem,
      });

      dataAtual = addWeeks(dataAtual, 1);
    }

    return resultado;
  }

  private tratarAgrupamentoMensal(
    atendimentos: Atendimento[],
    dataInicio: Date,
    dataFim: Date,
  ): IItemGraficoOrigemAtendimentos[] {
    const resultado: IItemGraficoOrigemAtendimentos[] = [];

    let dataAtual = startOfMonth(dataInicio);
    const dataFinal = endOfMonth(dataFim);

    while (dataAtual <= dataFinal) {
      const comecoDoMes = startOfMonth(dataAtual);
      const fimDoMes = endOfMonth(dataAtual);

      const atendimentosMes = atendimentos.filter(
        (a) => a.criadoEm >= comecoDoMes && a.criadoEm <= fimDoMes,
      );

      const contagem: Record<string, number> = {};
      Object.values(ORIGEM_ATENDIMENTO).forEach((origem) => {
        contagem[origem] = 0;
      });

      atendimentosMes.forEach((a) => {
        contagem[a.origemAtendimento] += 1;
      });

      resultado.push({
        data: format(dataAtual, 'yyyy-MM'),
        contagem,
      });

      dataAtual = addMonths(dataAtual, 1);
    }

    return resultado;
  }

  private tratarAgrupamentoTrimestral(
    atendimentos: Atendimento[],
    dataInicio: Date,
    dataFim: Date,
  ): IItemGraficoOrigemAtendimentos[] {
    const resultado: IItemGraficoOrigemAtendimentos[] = [];

    let dataAtual = startOfQuarter(dataInicio);
    const dataFinal = endOfQuarter(dataFim);

    while (dataAtual <= dataFinal) {
      const comecoDoTrimestre = startOfQuarter(dataAtual);
      const fimDoTrimestre = endOfQuarter(dataAtual);

      const atendimentosTrimestre = atendimentos.filter(
        (a) => a.criadoEm >= comecoDoTrimestre && a.criadoEm <= fimDoTrimestre,
      );

      const contagem: Record<string, number> = {};
      Object.values(ORIGEM_ATENDIMENTO).forEach((origem) => {
        contagem[origem] = 0;
      });

      atendimentosTrimestre.forEach((a) => {
        contagem[a.origemAtendimento] += 1;
      });

      resultado.push({
        data: format(dataAtual, 'yyyy-MM'),
        contagem,
      });

      dataAtual = addQuarters(dataAtual, 1);
    }

    return resultado;
  }

  private tratarAgrupamentoSemestral(
    atendimentos: Atendimento[],
    dataInicio: Date,
    dataFim: Date,
  ): IItemGraficoOrigemAtendimentos[] {
    const resultado: IItemGraficoOrigemAtendimentos[] = [];

    let dataAtual = this.comecoDoSemestre(dataInicio);
    const dataFinal = this.fimDoSemestre(dataFim);

    while (dataAtual <= dataFinal) {
      const comecoDoSemestre = this.comecoDoSemestre(dataAtual);
      const fimDoSemestre = this.fimDoSemestre(dataAtual);

      const atendimentosSemestre = atendimentos.filter(
        (a) => a.criadoEm >= comecoDoSemestre && a.criadoEm <= fimDoSemestre,
      );

      const contagem: Record<string, number> = {};
      Object.values(ORIGEM_ATENDIMENTO).forEach((origem) => {
        contagem[origem] = 0;
      });

      atendimentosSemestre.forEach((a) => {
        contagem[a.origemAtendimento] += 1;
      });

      resultado.push({
        data: format(dataAtual, 'yyyy-MM'),
        contagem,
      });

      dataAtual = addMonths(dataAtual, 6);
    }

    return resultado;
  }

  private tratarAgrupamentoAnual(
    atendimentos: Atendimento[],
    dataInicio: Date,
    dataFim: Date,
  ): IItemGraficoOrigemAtendimentos[] {
    const resultado: IItemGraficoOrigemAtendimentos[] = [];

    let dataAtual = startOfYear(dataInicio);
    const dataFinal = endOfYear(dataFim);

    while (dataAtual <= dataFinal) {
      const comecoDoAno = startOfYear(dataAtual);
      const fimDoAno = endOfYear(dataAtual);

      const atendimentosAno = atendimentos.filter(
        (a) => a.criadoEm >= comecoDoAno && a.criadoEm <= fimDoAno,
      );

      const contagem: Record<string, number> = {};
      Object.values(ORIGEM_ATENDIMENTO).forEach((origem) => {
        contagem[origem] = 0;
      });

      atendimentosAno.forEach((a) => {
        contagem[a.origemAtendimento] += 1;
      });

      const ano = format(dataAtual, 'yyyy');

      resultado.push({
        data: ano,
        contagem,
      });

      dataAtual = addYears(dataAtual, 1);
    }

    return resultado;
  }

  async pegarRelatorioSemanal(idLoja: string, idUsuario?: string) {
    const loja = await this.prismaService.loja.findUnique({
      where: {
        id: idLoja,
      },
      select: {
        id: true,
        nomeEmpresa: true,
      },
    });

    if (!loja) {
      throw new AppErrorNotFound('Loja não encontrada');
    }

    const {
      inicioSemanaAtual,
      fimSemanaAtual,
      inicioSemanaAnterior,
      fimSemanaAnterior,
    } = this.pegarIntervaloDeSemanas();

    const [
      colaboradoresCadastradosSemana,
      atendimentosConsolidados,
      chatsSemRespostaConsolidados,
      tarefasData,
    ] = await Promise.all([
      this.pegarColaboradoresCadastradosSemana(idLoja),
      this.pegarAtendimentosConsolidados(
        idLoja,
        inicioSemanaAtual,
        fimSemanaAtual,
        inicioSemanaAnterior,
        fimSemanaAnterior,
      ),
      this.pegarChatsSemRespostaConsolidados(
        idLoja,
        inicioSemanaAtual,
        fimSemanaAtual,
        inicioSemanaAnterior,
        fimSemanaAnterior,
      ),
      this.pegarTarefasConsolidadas(
        idLoja,
        idUsuario,
        inicioSemanaAtual,
        fimSemanaAtual,
        inicioSemanaAnterior,
        fimSemanaAnterior,
      ),
    ]);

    const diferencaPercentualSemanaAnterior = this.calcularDiferencaPercentual(
      atendimentosConsolidados.atendimentosSemanaAtual,
      atendimentosConsolidados.atendimentosSemanaAnterior,
    );

    const diferencaPercentualVendasSemanaAtualSemanaAnterior =
      this.calcularDiferencaPercentual(
        atendimentosConsolidados.vendasSemanaAtual,
        atendimentosConsolidados.vendasSemanaAnterior,
      );

    const percentualAtendimentosEmAberto =
      atendimentosConsolidados.atendimentosSemanaAtual > 0
        ? Math.round(
            (atendimentosConsolidados.atendimentosEmAbertoAtual /
              atendimentosConsolidados.atendimentosSemanaAtual) *
              10000,
          ) / 100
        : 0;

    const diferencaPercentualVendasRealizadas =
      this.calcularDiferencaPercentual(
        atendimentosConsolidados.vendasRealizadasAtual,
        atendimentosConsolidados.vendasRealizadasSemanaAnterior,
      );

    const diferencaPercentualChatsSemResposta =
      this.calcularDiferencaPercentual(
        chatsSemRespostaConsolidados.chatsSemRespostaAtual,
        chatsSemRespostaConsolidados.chatsSemRespostaSemanaAnterior,
      );

    const diferencaPercentualTarefasPendentes =
      this.calcularDiferencaPercentual(
        tarefasData.tarefasPendentesAtual,
        tarefasData.tarefasPendentesSemanaAnterior,
      );

    let colaboradorComMaisVendas = null;
    let vendasTopColaborador = 0;
    let diferencaPercentualVendasTopColaboradorMediaEquipe = 0;

    if (atendimentosConsolidados.vendasPorColaborador.length > 0) {
      const topVendedor = atendimentosConsolidados.vendasPorColaborador[0];
      vendasTopColaborador = topVendedor._count.id;

      colaboradorComMaisVendas = await this.pegarColaboradorPorId(
        topVendedor.idColaborador,
        idLoja,
      );

      const mediaVendas =
        atendimentosConsolidados.vendasPorColaborador.reduce(
          (acc, curr) => acc + curr._count.id,
          0,
        ) / atendimentosConsolidados.vendasPorColaborador.length;

      diferencaPercentualVendasTopColaboradorMediaEquipe =
        this.calcularDiferencaPercentual(vendasTopColaborador, mediaVendas);
    }

    return {
      idLoja: loja.id,
      nome: loja.nomeEmpresa,
      novosVendedores: colaboradoresCadastradosSemana.length,
      novosAtendimentos: {
        quantidade: atendimentosConsolidados.atendimentosSemanaAtual,
        percentual: diferencaPercentualSemanaAnterior,
        sucesso: {
          quantidade: atendimentosConsolidados.vendasSemanaAtual,
          percentual: diferencaPercentualVendasSemanaAtualSemanaAnterior,
        },
      },
      vendedorDestaque: {
        ...colaboradorComMaisVendas,
        quantidadeVendas: vendasTopColaborador,
        percentualVendasAcimaMedia: Math.floor(
          diferencaPercentualVendasTopColaboradorMediaEquipe,
        ),
      },
      atendimentosEmAberto: {
        quantidade: atendimentosConsolidados.atendimentosEmAbertoAtual,
        percentual: percentualAtendimentosEmAberto,
      },
      vendasRealizadas: {
        quantidade: atendimentosConsolidados.vendasRealizadasAtual,
        percentual: diferencaPercentualVendasRealizadas,
      },
      chatsSemResposta: {
        quantidade: chatsSemRespostaConsolidados.chatsSemRespostaAtual,
        percentual: diferencaPercentualChatsSemResposta,
      },
      tarefasPendentes: {
        quantidade: tarefasData.tarefasPendentesAtual,
        percentual: diferencaPercentualTarefasPendentes,
      },
    };
  }

  async pegarUltimosAtendimentos(idLoja: string, modo?: string) {
    const filtroModo = modo ?? MODO_ATENDIMENTO.COMPRA;

    // const aux = await this.prismaService.atendimentoResponsaveis.findMany({
    //   where: {
    //     idLoja,
    //   },
    //   include: {
    //     atendimento: {
    //       select: {
    //         id: true,
    //         origemAtendimento: true,
    //         modoAtendimento: true,
    //         status: true,
    //         criadoEm: true,
    //       },
    //     },
    //     colaborador: {
    //       select: {
    //         id: true,
    //         nome: true,
    //         idFoto: true,
    //         idUsuario: true,
    //       },
    //     },
    //   },
    //   orderBy: {
    //     criadoEm: 'desc',
    //   },
    // });

    // const atendimentos = aux
    //   .filter(
    //     (atendimento) => atendimento.atendimento.modoAtendimento === filtroModo,
    //   )
    //   .map((aux) => {
    //     return {
    //       ...{
    //         id: aux.atendimento.id,
    //         plataforma: aux.atendimento.origemAtendimento,
    //         status: aux.atendimento.status,
    //         criadoEm: aux.atendimento.criadoEm,
    //       },
    //       colaborador: aux.colaborador,
    //     };
    //   });

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        modoAtendimento: filtroModo,
      },
      include: {
        atendimentoResponsaveis: {
          include: {
            colaborador: true,
          },
        },
        cliente: true,
        clienteTemporario: true,
      },
      orderBy: {
        criadoEm: 'desc',
      },
      take: 10,
    });

    return { modo: filtroModo, atendimentos };
  }

  async pegarOrigemAtendimentos(
    idLoja: string,
    agrupamento: FILTRO_DATA,
    dataInicio: Date,
    dataFim: Date,
  ) {
    agrupamento = agrupamento ?? FILTRO_DATA.MENSAL;

    if (
      (agrupamento === FILTRO_DATA.DIARIO ||
        agrupamento === FILTRO_DATA.SEMANAL) &&
      (!dataInicio || !dataFim)
    ) {
      dataInicio = startOfMonth(new UTCDate());
      dataFim = endOfMonth(new UTCDate());
    } else {
      dataInicio = dataInicio ?? startOfYear(new UTCDate());
      dataFim = dataFim ?? endOfYear(new UTCDate());
    }

    dataInicio = new UTCDate(startOfDay(dataInicio));
    dataFim = new UTCDate(endOfDay(dataFim));

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        criadoEm: {
          gte: dataInicio,
          lte: dataFim,
        },
      },
    });

    let dados: IItemGraficoOrigemAtendimentos[] = [];

    switch (agrupamento) {
      case FILTRO_DATA.DIARIO:
        dados = this.tratarAgrupamentoDiario(atendimentos, dataInicio, dataFim);
        break;
      case FILTRO_DATA.SEMANAL:
        dados = this.tratarAgrupamentoSemanal(
          atendimentos,
          dataInicio,
          dataFim,
        );
        break;
      case FILTRO_DATA.MENSAL:
        dados = this.tratarAgrupamentoMensal(atendimentos, dataInicio, dataFim);
        break;
      case FILTRO_DATA.TRIMESTRAL:
        dados = this.tratarAgrupamentoTrimestral(
          atendimentos,
          dataInicio,
          dataFim,
        );
        break;
      case FILTRO_DATA.SEMESTRAL:
        dados = this.tratarAgrupamentoSemestral(
          atendimentos,
          dataInicio,
          dataFim,
        );
        break;
      case FILTRO_DATA.ANUAL:
        dados = this.tratarAgrupamentoAnual(atendimentos, dataInicio, dataFim);
        break;
      default:
        throw new AppErrorBadRequest('Filtro de data inválido');
    }

    return {
      agrupamento,
      dataInicio: format(dataInicio, 'yyyy-MM-dd'),
      dataFim: format(dataFim, 'yyyy-MM-dd'),
      dados,
    };
  }

  async obterOverview(idLoja: string) {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    const quatorzeDiasAtras = new Date(hoje);
    quatorzeDiasAtras.setDate(hoje.getDate() - 14);

    const cargos = await this.prismaService.cargo.findMany({
      where: {
        idLoja,
      },
      include: {
        colaboradores: true,
      },
    });

    const vendedoresIds = new Set();
    const preVendedoresIds = new Set();

    cargos.forEach((cargo) => {
      if (
        cargo.cargo.toLowerCase().includes('vendedor') &&
        !cargo.cargo.toLowerCase().includes('pré') &&
        !cargo.cargo.toLowerCase().includes('pre')
      ) {
        cargo.colaboradores.forEach((colaborador) => {
          vendedoresIds.add(colaborador.id);
        });
      } else if (
        cargo.cargo.toLowerCase().includes('pré-vendedor') ||
        cargo.cargo.toLowerCase().includes('pre-vendedor')
      ) {
        cargo.colaboradores.forEach((colaborador) => {
          preVendedoresIds.add(colaborador.id);
        });
      }
    });

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: {
        idLoja,
        OR: [
          {
            criadoEm: {
              gte: quatorzeDiasAtras,
              lte: hoje,
            },
          },
          {
            atualizadoEm: {
              gte: quatorzeDiasAtras,
              lte: hoje,
            },
          },
        ],
      },
      include: {
        atendimentoResponsaveis: {
          include: {
            colaborador: true,
          },
        },
      },
    });

    const {
      atendimentosCriadosSemanaAtual,
      atendimentosCriadosSemanaPassada,
      atendimentosAtualizadosSemanaAtual,
      atendimentosAtualizadosSemanaPassada,
      atendimentosSucessoCompraSemanaAtual,
      atendimentosSucessoCompraSemanaPassada,
      atendimentosSucessoVendaSemanaAtual,
      atendimentosSucessoVendaSemanaPassada,
    } = atendimentos.reduce(
      (acc, atendimento) => {
        const isCriadoSemanaAtual = atendimento.criadoEm >= seteDiasAtras;
        const isAtualizadoSemanaAtual =
          atendimento.atualizadoEm >= seteDiasAtras;

        isCriadoSemanaAtual
          ? acc.atendimentosCriadosSemanaAtual.push(atendimento)
          : atendimento.criadoEm >= quatorzeDiasAtras &&
            acc.atendimentosCriadosSemanaPassada.push(atendimento);

        isAtualizadoSemanaAtual
          ? acc.atendimentosAtualizadosSemanaAtual.push(atendimento)
          : acc.atendimentosAtualizadosSemanaPassada.push(atendimento);

        if (atendimento.status === STATUS_ATENDIMENTO.SUCESSO) {
          if (atendimento.modoAtendimento === MODO_ATENDIMENTO.COMPRA) {
            isAtualizadoSemanaAtual
              ? acc.atendimentosSucessoCompraSemanaAtual.push(atendimento)
              : acc.atendimentosSucessoCompraSemanaPassada.push(atendimento);
          } else if (atendimento.modoAtendimento === MODO_ATENDIMENTO.VENDA) {
            isAtualizadoSemanaAtual
              ? acc.atendimentosSucessoVendaSemanaAtual.push(atendimento)
              : acc.atendimentosSucessoVendaSemanaPassada.push(atendimento);
          }
        }
        return acc;
      },
      {
        atendimentosCriadosSemanaAtual: [],
        atendimentosCriadosSemanaPassada: [],
        atendimentosAtualizadosSemanaAtual: [],
        atendimentosAtualizadosSemanaPassada: [],
        atendimentosSucessoCompraSemanaAtual: [],
        atendimentosSucessoCompraSemanaPassada: [],
        atendimentosSucessoVendaSemanaAtual: [],
        atendimentosSucessoVendaSemanaPassada: [],
      },
    );

    const colaboradores = new Map<
      string,
      {
        id: string;
        idColaborador: string;
        nome: string;
        isVendedor: boolean;
        isPreVendedor: boolean;
        quantidadeAtendimentos: {
          semanaAtual: number;
          semanaPassada: number;
        };
        quantidadeNovosAtendimentos: {
          semanaAtual: number;
          semanaPassada: number;
        };
        quantidadeSucessoCompra: {
          semanaAtual: number;
          semanaPassada: number;
        };
        quantidadeSucessoVenda: {
          semanaAtual: number;
          semanaPassada: number;
        };
        quantidadeSucesso: {
          semanaAtual: number;
          semanaPassada: number;
        };
      }
    >();

    atendimentos.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach((responsavel) => {
        const colaborador = colaboradores.get(
          responsavel.colaborador.idUsuario,
        ) || {
          id: responsavel.colaborador.idUsuario,
          idColaborador: responsavel.colaborador.id,
          nome: responsavel.colaborador.nome,
          isVendedor: vendedoresIds.has(responsavel.colaborador.id),
          isPreVendedor: preVendedoresIds.has(responsavel.colaborador.id),
          quantidadeAtendimentos: {
            semanaAtual: 0,
            semanaPassada: 0,
          },
          quantidadeNovosAtendimentos: {
            semanaAtual: 0,
            semanaPassada: 0,
          },
          quantidadeSucessoCompra: {
            semanaAtual: 0,
            semanaPassada: 0,
          },
          quantidadeSucessoVenda: {
            semanaAtual: 0,
            semanaPassada: 0,
          },
          quantidadeSucesso: {
            semanaAtual: 0,
            semanaPassada: 0,
          },
        };
        colaboradores.set(responsavel.colaborador.idUsuario, colaborador);
      });
    });

    atendimentosCriadosSemanaAtual.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach(
        (responsavel: { colaborador: { idUsuario: string } }) => {
          const colaborador = colaboradores.get(
            responsavel.colaborador.idUsuario,
          );
          if (colaborador) {
            colaborador.quantidadeNovosAtendimentos.semanaAtual++;
          }
        },
      );
    });

    atendimentosCriadosSemanaPassada.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach(
        (responsavel: { colaborador: { idUsuario: string } }) => {
          const colaborador = colaboradores.get(
            responsavel.colaborador.idUsuario,
          );
          if (colaborador) {
            colaborador.quantidadeNovosAtendimentos.semanaPassada++;
          }
        },
      );
    });

    atendimentosAtualizadosSemanaAtual.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach(
        (responsavel: { colaborador: { idUsuario: string } }) => {
          const colaborador = colaboradores.get(
            responsavel.colaborador.idUsuario,
          );
          if (colaborador) {
            colaborador.quantidadeAtendimentos.semanaAtual++;
          }
        },
      );
    });

    atendimentosAtualizadosSemanaPassada.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach(
        (responsavel: { colaborador: { idUsuario: string } }) => {
          const colaborador = colaboradores.get(
            responsavel.colaborador.idUsuario,
          );
          if (colaborador) {
            colaborador.quantidadeAtendimentos.semanaPassada++;
          }
        },
      );
    });

    atendimentosSucessoCompraSemanaAtual.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach(
        (responsavel: { colaborador: { idUsuario: string } }) => {
          const colaborador = colaboradores.get(
            responsavel.colaborador.idUsuario,
          );
          if (colaborador) {
            colaborador.quantidadeSucessoCompra.semanaAtual++;
            colaborador.quantidadeSucesso.semanaAtual++;
          }
        },
      );
    });

    atendimentosSucessoCompraSemanaPassada.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach(
        (responsavel: { colaborador: { idUsuario: string } }) => {
          const colaborador = colaboradores.get(
            responsavel.colaborador.idUsuario,
          );
          if (colaborador) {
            colaborador.quantidadeSucessoCompra.semanaPassada++;
            colaborador.quantidadeSucesso.semanaPassada++;
          }
        },
      );
    });

    atendimentosSucessoVendaSemanaAtual.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach(
        (responsavel: { colaborador: { idUsuario: string } }) => {
          const colaborador = colaboradores.get(
            responsavel.colaborador.idUsuario,
          );
          if (colaborador) {
            colaborador.quantidadeSucessoVenda.semanaAtual++;
            colaborador.quantidadeSucesso.semanaAtual++;
          }
        },
      );
    });

    atendimentosSucessoVendaSemanaPassada.forEach((atendimento) => {
      atendimento.atendimentoResponsaveis.forEach(
        (responsavel: { colaborador: { idUsuario: string } }) => {
          const colaborador = colaboradores.get(
            responsavel.colaborador.idUsuario,
          );
          if (colaborador) {
            colaborador.quantidadeSucessoVenda.semanaPassada++;
            colaborador.quantidadeSucesso.semanaPassada++;
          }
        },
      );
    });

    const vendedores = Array.from(colaboradores.values()).filter(
      (c) => c.isVendedor,
    );
    const preVendedores = Array.from(colaboradores.values()).filter(
      (c) => c.isPreVendedor,
    );

    const vendedorMaisAtendimentos =
      vendedores.length > 0
        ? vendedores.reduce((prev, current) =>
            prev.quantidadeAtendimentos.semanaAtual >
            current.quantidadeAtendimentos.semanaAtual
              ? prev
              : current,
          )
        : null;

    const vendedorMaisVendas =
      vendedores.length > 0
        ? vendedores.reduce((prev, current) =>
            prev.quantidadeSucessoVenda.semanaAtual >
            current.quantidadeSucessoVenda.semanaAtual
              ? prev
              : current,
          )
        : null;

    const vendedorMaisCompras =
      vendedores.length > 0
        ? vendedores.reduce((prev, current) =>
            prev.quantidadeSucessoCompra.semanaAtual >
            current.quantidadeSucessoCompra.semanaAtual
              ? prev
              : current,
          )
        : null;

    const preVendedorMaisSucessos =
      preVendedores.length > 0
        ? preVendedores.reduce((prev, current) =>
            prev.quantidadeSucesso.semanaAtual >
            current.quantidadeSucesso.semanaAtual
              ? prev
              : current,
          )
        : null;

    const preVendedorMaisAtendimentos =
      preVendedores.length > 0
        ? preVendedores.reduce((prev, current) =>
            prev.quantidadeAtendimentos.semanaAtual >
            current.quantidadeAtendimentos.semanaAtual
              ? prev
              : current,
          )
        : null;

    const topPerformers = {
      vendedor: {
        maisAtendimentos: vendedorMaisAtendimentos
          ? {
              id: vendedorMaisAtendimentos.idColaborador,
              nome: vendedorMaisAtendimentos.nome,
              quantidade:
                vendedorMaisAtendimentos.quantidadeAtendimentos.semanaAtual,
              variacao: this.calcularDiferencaPercentual(
                vendedorMaisAtendimentos.quantidadeAtendimentos.semanaAtual,
                vendedorMaisAtendimentos.quantidadeAtendimentos.semanaPassada,
              ),
            }
          : null,
        maisVendas: vendedorMaisVendas
          ? {
              id: vendedorMaisVendas.idColaborador,
              nome: vendedorMaisVendas.nome,
              quantidade: vendedorMaisVendas.quantidadeSucessoVenda.semanaAtual,
              variacao: this.calcularDiferencaPercentual(
                vendedorMaisVendas.quantidadeSucessoVenda.semanaAtual,
                vendedorMaisVendas.quantidadeSucessoVenda.semanaPassada,
              ),
            }
          : null,
        maisCompras: vendedorMaisCompras
          ? {
              id: vendedorMaisCompras.idColaborador,
              nome: vendedorMaisCompras.nome,
              quantidade:
                vendedorMaisCompras.quantidadeSucessoCompra.semanaAtual,
              variacao: this.calcularDiferencaPercentual(
                vendedorMaisCompras.quantidadeSucessoCompra.semanaAtual,
                vendedorMaisCompras.quantidadeSucessoCompra.semanaPassada,
              ),
            }
          : null,
      },
      preVendedor: {
        maisSucessos: preVendedorMaisSucessos
          ? {
              id: preVendedorMaisSucessos.idColaborador,
              nome: preVendedorMaisSucessos.nome,
              quantidade: preVendedorMaisSucessos.quantidadeSucesso.semanaAtual,
              variacao: this.calcularDiferencaPercentual(
                preVendedorMaisSucessos.quantidadeSucesso.semanaAtual,
                preVendedorMaisSucessos.quantidadeSucesso.semanaPassada,
              ),
            }
          : null,
        maisAtendimentos: preVendedorMaisAtendimentos
          ? {
              id: preVendedorMaisAtendimentos.idColaborador,
              nome: preVendedorMaisAtendimentos.nome,
              quantidade:
                preVendedorMaisAtendimentos.quantidadeAtendimentos.semanaAtual,
              variacao: this.calcularDiferencaPercentual(
                preVendedorMaisAtendimentos.quantidadeAtendimentos.semanaAtual,
                preVendedorMaisAtendimentos.quantidadeAtendimentos
                  .semanaPassada,
              ),
            }
          : null,
      },
    };

    return {
      topPerformers,
    };
  }
}
