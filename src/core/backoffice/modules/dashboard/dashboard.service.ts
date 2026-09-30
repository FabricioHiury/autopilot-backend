import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  addMonths,
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiltroDataDto } from './dto/filtro-data.dto';
import { STATUS_ASSINATURA } from '../../../../utils/enum/assinatura.enum';
import { Assinatura, Prisma } from '@prisma/client';
import { FiltroPaginaPesquisaDto } from './dto/filtro-pagina-pesquisa';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';
import { FiltroAnoDto } from './dto/filtro-ano.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  private async calcularVidaUtilMediaClientes() {
    const clientes = await this.prismaService.assinatura.findMany({
      include: {
        historicoPagementos: true,
      },
    });

    const totalDuracao = clientes.reduce((acc, cliente) => {
      const duracaoAssinatura = cliente.duracaoPlano || 1;
      const numeroPagamentos = cliente.historicoPagementos.length;
      return acc + duracaoAssinatura * numeroPagamentos;
    }, 0);

    const vidaUtilMedia =
      clientes.length > 0 ? totalDuracao / clientes.length : 24;

    return vidaUtilMedia;
  }

  private agruparAssinaturasPorMes(
    inicioAno: Date,
    fimAno: Date,
    assinaturas: Assinatura[],
  ) {
    const resultado: {
      mes: string;
      assinaturas: number;
      cancelamentos: number;
    }[] = [];

    let dataAtual = inicioAno;
    const dataFinal = fimAno;

    while (dataAtual <= dataFinal) {
      const comecoDoMes = startOfMonth(dataAtual);
      const fimDoMes = endOfMonth(dataAtual);

      const assinaturasAtivasNoMes = assinaturas.filter((assinatura) => {
        const dataAquisicao = assinatura.dataAquisicao;
        const dataRenovacao = assinatura.dataRenovacao;

        const dataFimPlano = addMonths(dataAquisicao, assinatura.duracaoPlano);

        const adquiridaNoMes =
          dataAquisicao >= comecoDoMes && dataAquisicao <= fimDoMes;

        const renovadaNoMes =
          dataRenovacao &&
          dataRenovacao >= comecoDoMes &&
          dataRenovacao <= fimDoMes;

        const ativaNoMes =
          dataAquisicao <= fimDoMes && dataFimPlano >= comecoDoMes;

        return (
          adquiridaNoMes ||
          renovadaNoMes ||
          (assinatura.status === STATUS_ASSINATURA.ATIVO && ativaNoMes)
        );
      });

      const assinaturasCanceladasNoMes = assinaturas.filter(
        (assinatura) =>
          assinatura.dataCancelamento &&
          assinatura.dataCancelamento >= comecoDoMes &&
          assinatura.dataCancelamento <= fimDoMes,
      );

      const nomeDoMes = format(dataAtual, 'LLLL', { locale: ptBR });

      resultado.push({
        mes: nomeDoMes,
        assinaturas: assinaturasAtivasNoMes.length,
        cancelamentos: assinaturasCanceladasNoMes.length,
      });

      dataAtual = addMonths(dataAtual, 1);
    }

    return resultado;
  }

  async obterEstatisticasCadastros(params: FiltroDataDto) {
    const dataInicial = params.dataInicial
      ? startOfDay(new Date(params.dataInicial))
      : undefined;

    const dataFinal = params.dataFinal
      ? endOfDay(new Date(params.dataFinal))
      : undefined;

    const novosCadastros = await this.prismaService.loja.count({
      where: {
        criadoEm: {
          gte: dataInicial,
          lte: dataFinal,
        },
      },
    });

    const novosUpgrades = await this.prismaService.assinatura.count({
      where: {
        status: STATUS_ASSINATURA.ATIVO,
        dataAquisicao: {
          gte: dataInicial,
          lte: dataFinal,
        },
      },
    });

    const desativacoesConta = await this.prismaService.assinatura.count({
      where: {
        status: STATUS_ASSINATURA.INATIVO,
        dataCancelamento: {
          gte: dataInicial,
          lte: dataFinal,
        },
      },
    });

    const cancelamentosPlano = await this.prismaService.assinatura.count({
      where: {
        dataCancelamento: {
          gte: dataInicial,
          lte: dataFinal,
        },
      },
    });

    return {
      dataInicial,
      dataFinal,
      estatisticas: {
        novosCadastros,
        novosUpgrades,
        desativacoesConta,
        cancelamentosPlano,
      },
    };
  }

  async obterReceitaETaxaChurn(params: FiltroDataDto) {
    const dataInicial = params.dataInicial
      ? startOfDay(new Date(params.dataInicial))
      : undefined;

    const dataFinal = params.dataFinal
      ? endOfDay(new Date(params.dataFinal))
      : undefined;

    const { _sum } = await this.prismaService.historicoPagamento.aggregate({
      where: {
        criadoEm: {
          gte: dataInicial,
          lte: dataFinal,
        },
      },
      _sum: {
        valor: true,
      },
    });

    const totalClientesInicioPeriodo =
      await this.prismaService.assinatura.count({
        where: {
          status: STATUS_ASSINATURA.ATIVO,
          dataAquisicao: {
            lte: dataInicial,
          },
        },
      });

    const totalClientesPerdidosPeriodo =
      await this.prismaService.assinatura.count({
        where: {
          status: STATUS_ASSINATURA.INATIVO,
          dataCancelamento: {
            gte: dataInicial,
            lte: dataFinal,
          },
        },
      });

    const receita = _sum.valor ?? 0;

    const taxaChurn =
      totalClientesInicioPeriodo !== 0
        ? (totalClientesPerdidosPeriodo / totalClientesInicioPeriodo) * 100
        : 0;

    return {
      dataInicial,
      dataFinal,
      dados: {
        receita,
        taxaChurn,
      },
    };
  }

  async obterVidaUtilClientes(params: FiltroPaginaPesquisaDto) {
    const pesquisa = params.pesquisa ?? '';
    const pagina = params.pagina ? +params.pagina : 1;
    const itensPorPagina = params.itensPorPagina ? +params.itensPorPagina : 10;

    const where: Prisma.AssinaturaWhereInput = {
      OR: [
        {
          loja: {
            nomeEmpresa: {
              contains: pesquisa,
              mode: 'insensitive',
            },
          },
        },
        {
          loja: {
            cnpj: {
              contains: pesquisa,
              mode: 'insensitive',
            },
          },
        },
      ],
    };

    const clientes = await this.prismaService.assinatura.findMany({
      where,
      include: {
        loja: true,
        historicoPagementos: true,
      },
      skip: (pagina - 1) * itensPorPagina,
      take: itensPorPagina,
    });

    const totalClientes = await this.prismaService.assinatura.count({
      where,
    });

    const vidaUtilMediaClientes = await this.calcularVidaUtilMediaClientes();

    const clientesFormatados = clientes.map((cliente) => {
      const totalGasto = cliente.historicoPagementos.reduce(
        (acc, pagamento) => acc + pagamento.valor,
        0,
      );

      const numeroPagamentos = cliente.historicoPagementos.length;

      const valorMedioCompra =
        numeroPagamentos > 0 ? totalGasto / numeroPagamentos : 0;

      const duracaoMeses =
        cliente.duracaoPlano * cliente.historicoPagementos.length;

      let duracao: string;
      if (duracaoMeses >= 12) {
        duracao = `${(duracaoMeses / 12).toFixed(1)} anos`;
      } else {
        duracao = `${duracaoMeses} ${duracaoMeses === 1 ? 'mês' : 'meses'}`;
      }

      const clv = valorMedioCompra * numeroPagamentos * vidaUtilMediaClientes;

      return {
        id: cliente.idLoja,
        nome: cliente.loja.nomeEmpresa,
        cnpj: cliente.loja.cnpj,
        totalGasto,
        frequencia: numeroPagamentos,
        duracao,
        clv: parseFloat(clv.toFixed(1)),
      };
    });

    return {
      pagina,
      itensPorPagina,
      totalPaginas: Math.ceil(totalClientes / itensPorPagina),
      pesquisa,
      clientes: clientesFormatados,
    };
  }

  async obterUltimasAssinaturas() {
    const assinaturas = await this.prismaService.assinatura.findMany({
      where: {
        status: STATUS_ASSINATURA.ATIVO,
      },
      take: 10,
      orderBy: {
        dataAquisicao: 'desc',
      },
      select: {
        id: true,
        status: true,
        formaPagamento: true,
        duracaoPlano: true,
        dataAquisicao: true,
        dataRenovacao: true,
        dataCancelamento: true,
        plano: {
          select: {
            nome: true,
            valor: true,
          },
        },
        loja: {
          select: {
            id: true,
            nomeEmpresa: true,
            cnpj: true,
            lojista: {
              select: {
                usuario: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const assinaturasFormatadas = assinaturas.map((assinatura) => {
      return {
        idAssinatura: assinatura.id,
        plano: assinatura.plano.nome,
        status: assinatura.status,
        dataAquisicao: assinatura.dataAquisicao,
        loja: {
          idLoja: assinatura.loja.id,
          nomeEmpresa: assinatura.loja.nomeEmpresa,
          cnpj: assinatura.loja.cnpj,
          avatarUrl: getStringUrlAvatar(assinatura.loja.id),
        },
      };
    });

    const planos = assinaturasFormatadas.reduce(
      (acc, assinatura) => {
        if (!acc[assinatura.plano]) {
          acc[assinatura.plano] = {
            plano: assinatura.plano,
            assinaturas: [],
          };
        }

        acc[assinatura.plano].assinaturas.push(assinatura);

        return acc;
      },
      {} as Record<
        string,
        { plano: string; assinaturas: typeof assinaturasFormatadas }
      >,
    );

    const planosArray = Object.values(planos);

    return { planos: planosArray };
  }

  async obterAssinaturasAno(params: FiltroAnoDto) {
    const data = params.ano ? new Date(params.ano) : new Date();
    const anoAtual = new Date(data).getFullYear();
    const inicioAno = new Date(anoAtual, 0, 1);
    const fimAno = new Date(anoAtual, 11, 31);

    const assinaturasDoAno = await this.prismaService.assinatura.findMany({
      where: {
        OR: [
          {
            dataAquisicao: {
              gte: inicioAno,
              lte: fimAno,
            },
          },
          {
            dataRenovacao: {
              gte: inicioAno,
              lte: fimAno,
            },
          },
          {
            dataCancelamento: {
              gte: inicioAno,
              lte: fimAno,
            },
          },
        ],
      },
    });

    const totalAssinaturas = assinaturasDoAno.filter((assinatura) => {
      const dataAquisicao = assinatura.dataAquisicao;
      const dataRenovacao = assinatura.dataRenovacao;

      const dataFimPlano = addMonths(dataAquisicao, assinatura.duracaoPlano);

      const adquiridaNoAno =
        dataAquisicao >= inicioAno && dataAquisicao <= fimAno;

      const renovadaNoAno =
        dataRenovacao && dataRenovacao >= inicioAno && dataRenovacao <= fimAno;

      const ativaNoMes = dataAquisicao <= fimAno && dataFimPlano >= inicioAno;

      return (
        adquiridaNoAno ||
        renovadaNoAno ||
        (assinatura.status === STATUS_ASSINATURA.ATIVO && ativaNoMes)
      );
    }).length;

    const totalCancelamentos = assinaturasDoAno.filter(
      (assinatura) =>
        assinatura.dataCancelamento >= inicioAno &&
        assinatura.dataCancelamento <= fimAno,
    ).length;

    const assinaturasPorMes = this.agruparAssinaturasPorMes(
      inicioAno,
      fimAno,
      assinaturasDoAno,
    );

    return {
      ano: anoAtual.toString(),
      assinaturas: totalAssinaturas,
      cancelamentos: totalCancelamentos,
      meses: assinaturasPorMes,
    };
  }
}
