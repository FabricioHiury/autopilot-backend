import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { AppErrorNotFound } from 'src/utils/errors/app-errors';
import { SuspensaoService } from '../suspensao/suspensao.service';
import { EventoService } from '../eventos/evento.service';

@Injectable()
export class DistribuicaoAutomaticaService {
  private readonly LIMITE_DIFERENCA_ATENDIMENTOS = 1;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly suspensaoService: SuspensaoService,
    private readonly eventoService: EventoService,
  ) { }

  async obterColaboradorParaDistribuicao(
    idLoja: string,
    tipoEspecifico?: 'Pré-vendedor' | 'Vendedor',
  ): Promise<string | null> {
    const loja = await this.prismaService.loja.findUnique({
      where: { id: idLoja },
      select: {
        distribuicaoAutomatica: true,
      },
    });

    if (!loja?.distribuicaoAutomatica) {
      return null;
    }

    if (tipoEspecifico) {
      const colaboradores = await this.buscarColaboradoresPorTipo(
        idLoja,
        tipoEspecifico,
      );
      if (colaboradores.length > 0) {
        return this.selecionarColaboradorComMenosAtendimentos(colaboradores);
      }
      return null;
    }

    const preVendedores = await this.buscarColaboradoresPorTipo(
      idLoja,
      'Pré-vendedor',
    );

    if (preVendedores.length > 0) {
      return this.selecionarColaboradorComMenosAtendimentos(preVendedores);
    }

    const vendedores = await this.buscarColaboradoresPorTipo(
      idLoja,
      'Vendedor',
    );

    if (vendedores.length > 0) {
      return this.selecionarColaboradorComMenosAtendimentos(vendedores);
    }

    return null;
  }

  private async buscarColaboradoresPorTipo(
    idLoja: string,
    tipoColaborador: 'Pré-vendedor' | 'Vendedor',
  ) {
    const isPreVendedor = tipoColaborador === 'Pré-vendedor';

    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);
    const ontemInicio = new Date(hojeInicio);
    ontemInicio.setDate(ontemInicio.getDate() - 1);

    const colaboradores = await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        usuario: {
          status: 'ativo',
          perfil: 'usuario',
        },
        cargos: {
          some: {
            cargo: {
              contains: tipoColaborador,
              mode: 'insensitive',
              ...(isPreVendedor ? {} : { not: { contains: 'Pré' } }),
            },
          },
        },
      },
      select: {
        id: true,
        idUsuario: true,
        _count: {
          select: {
            atendimentoResponsaveis: {
              where: {
                atendimento: {
                  status: {
                    in: [
                      'preAtendimento',
                      'atendimentoInicial',
                      'emNegociacao',
                    ],
                  },
                  atendimentoManual: false,
                  criadoEm: {
                    gte: ontemInicio,
                    lt: hojeInicio,
                  },
                },
              },
            },
          },
        },
      },
    });

    const idsUsuarios = colaboradores.map((c) => c.idUsuario);
    const statusSuspensao =
      await this.suspensaoService.verificarUsuariosSuspensos(idsUsuarios);

    const colaboradoresAtivos = [];

    for (const colaborador of colaboradores) {
      if (!statusSuspensao.get(colaborador.idUsuario)) {
        await this.suspensaoService.verificarERemoverOffsetSeNecessario(
          colaborador.id,
          idLoja,
        );

        const offset = await this.suspensaoService.obterOffsetBalanceamento(
          colaborador.id,
        );

        colaboradoresAtivos.push({
          id: colaborador.id,
          _count: {
            atendimentoResponsaveis:
              offset > 0 ? offset : colaborador._count.atendimentoResponsaveis,
          },
        });
      }
    }

    return colaboradoresAtivos;
  }

  private selecionarColaboradorComMenosAtendimentos(
    colaboradores: Array<{
      id: string;
      _count: { atendimentoResponsaveis: number };
    }>,
  ): string | null {
    if (colaboradores.length === 0) return null;

    const colaboradoresOrdenados = colaboradores.sort(
      (a, b) =>
        a._count.atendimentoResponsaveis - b._count.atendimentoResponsaveis,
    );

    const menorQuantidade =
      colaboradoresOrdenados[0]._count.atendimentoResponsaveis;
    const maiorQuantidade =
      colaboradoresOrdenados[colaboradoresOrdenados.length - 1]._count
        .atendimentoResponsaveis;

    if (
      maiorQuantidade - menorQuantidade >=
      this.LIMITE_DIFERENCA_ATENDIMENTOS
    ) {
      const colaboradoresComMenorQuantidade = colaboradoresOrdenados.filter(
        (c) => c._count.atendimentoResponsaveis === menorQuantidade,
      );

      const indiceAleatorio = Math.floor(
        Math.random() * colaboradoresComMenorQuantidade.length,
      );
      return colaboradoresComMenorQuantidade[indiceAleatorio].id;
    }

    const indiceAleatorio = Math.floor(
      Math.random() * colaboradoresOrdenados.length,
    );
    return colaboradoresOrdenados[indiceAleatorio].id;
  }

  async removerAtendimentosUsuariosSuspensos(idLoja: string): Promise<void> {
    const agora = new Date();

    const suspensoesAtivas =
      await this.prismaService.suspensaoAtendimento.findMany({
        where: {
          startDate: { lte: agora },
          endDate: { gte: agora },
        },
        select: {
          idUsuario: true,
        },
      });

    if (suspensoesAtivas.length === 0) {
      return;
    }

    const idsUsuariosSuspensos = suspensoesAtivas.map((s) => s.idUsuario);

    const colaboradoresSuspensos =
      await this.prismaService.colaborador.findMany({
        where: {
          idLoja,
          idUsuario: {
            in: idsUsuariosSuspensos,
          },
        },
        select: {
          id: true,
        },
      });

    if (colaboradoresSuspensos.length === 0) {
      return;
    }

    const idsColaboradoresSuspensos = colaboradoresSuspensos.map((c) => c.id);

    const atendimentosParaRedistribuir =
      await this.prismaService.atendimentoResponsaveis.findMany({
        where: {
          idLoja,
          idColaborador: {
            in: idsColaboradoresSuspensos,
          },
          atendimento: {
            status: {
              in: ['preAtendimento', 'atendimentoInicial', 'emNegociacao'],
            },
          },
        },
        include: {
          atendimento: {
            include: {
              atendimentoResponsaveis: {
                include: {
                  colaborador: {
                    include: {
                      cargos: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    for (const responsavelSuspenso of atendimentosParaRedistribuir) {
      const atendimento = responsavelSuspenso.atendimento;

      const colaboradorSuspenso = atendimento.atendimentoResponsaveis.find(
        (resp) => resp.idColaborador === responsavelSuspenso.idColaborador,
      )?.colaborador;
      const cargosColaboradorSuspenso = colaboradorSuspenso.cargos.map((c) =>
        c.cargo.toLowerCase(),
      );

      let tipoColaborador: 'Pré-vendedor' | 'Vendedor' | undefined;

      if (
        cargosColaboradorSuspenso.some(
          (cargo) =>
            cargo.includes('pré-vendedor') || cargo.includes('pre-vendedor'),
        )
      ) {
        tipoColaborador = 'Pré-vendedor';
      } else if (
        cargosColaboradorSuspenso.some(
          (cargo) => cargo.includes('vendedor') && !cargo.includes('pré'),
        )
      ) {
        tipoColaborador = 'Vendedor';
      }

      const novoColaboradorId = await this.obterColaboradorParaDistribuicao(
        idLoja,
        tipoColaborador,
      );

      if (novoColaboradorId) {
        await this.prismaService.$transaction(async (prisma) => {
          await prisma.atendimentoResponsaveis.delete({
            where: {
              id: responsavelSuspenso.id,
            },
          });

          const jaEResponsavel = await prisma.atendimentoResponsaveis.findFirst(
            {
              where: {
                idAtendimento: atendimento.id,
                idColaborador: novoColaboradorId,
              },
            },
          );

          if (!jaEResponsavel) {
            await prisma.atendimentoResponsaveis.create({
              data: {
                idAtendimento: atendimento.id,
                idColaborador: novoColaboradorId,
                idLoja,
              },
            });
          }
        });
      } else {
        await this.prismaService.atendimentoResponsaveis.delete({
          where: {
            id: responsavelSuspenso.id,
          },
        });
      }
    }
  }

  async configurarDistribuicaoAutomatica(
    idLoja: string,
    distribuicaoAutomatica: boolean,
  ) {
    const resultado = await this.prismaService.loja.update({
      where: { id: idLoja },
      data: {
        distribuicaoAutomatica,
      },
    });

    this.eventoService.emitDistribuicaoConfigurada({
      idAtendimento: '', 
      contexto: {
        detalhes: {
          idLoja,
          nomeEmpresa: resultado.nomeEmpresa,
          distribuicaoAutomatica,
          acao: distribuicaoAutomatica ? 'ativada' : 'desativada',
        },
      },
    });

    return resultado;
  }

  async obterConfiguracaoDistribuicao(idLoja: string) {
    const loja = await this.prismaService.loja.findUnique({
      where: { id: idLoja },
      select: {
        distribuicaoAutomatica: true,
      },
    });

    if (!loja) {
      throw new AppErrorNotFound('Loja não encontrada');
    }

    return {
      ...loja,
      limiteDiferencaAtendimentos: this.LIMITE_DIFERENCA_ATENDIMENTOS,
    };
  }

  async monitorarERedistribuirSuspensos(): Promise<{
    message: string;
    lojasProcessadas: number;
    redistribuicoesRealizadas: number;
  }> {
    const lojasComDistribuicaoAutomatica =
      await this.prismaService.loja.findMany({
        where: {
          distribuicaoAutomatica: true,
        },
        select: {
          id: true,
          nomeEmpresa: true,
        },
      });

    if (lojasComDistribuicaoAutomatica.length === 0) {
      return {
        message: 'Nenhuma loja com distribuição automática encontrada',
        lojasProcessadas: 0,
        redistribuicoesRealizadas: 0,
      };
    }

    let totalRedistribuicoes = 0;

    for (const loja of lojasComDistribuicaoAutomatica) {
      const redistribuicoesAntes =
        await this.prismaService.atendimentoResponsaveis.count({
          where: {
            idLoja: loja.id,
            atendimento: {
              status: {
                in: ['preAtendimento', 'atendimentoInicial', 'emNegociacao'],
              },
            },
          },
        });

      await this.removerAtendimentosUsuariosSuspensos(loja.id);

      const redistribuicoesDepois =
        await this.prismaService.atendimentoResponsaveis.count({
          where: {
            idLoja: loja.id,
            atendimento: {
              status: {
                in: ['preAtendimento', 'atendimentoInicial', 'emNegociacao'],
              },
            },
          },
        });

      totalRedistribuicoes += Math.abs(
        redistribuicoesDepois - redistribuicoesAntes,
      );
    }

    return {
      message: `Monitoramento concluído com sucesso`,
      lojasProcessadas: lojasComDistribuicaoAutomatica.length,
      redistribuicoesRealizadas: totalRedistribuicoes,
    };
  }

  private async buscarColaboradoresParaChat(
    idLoja: string,
    tipoColaborador: 'Pré-vendedor' | 'Vendedor',
  ): Promise<Array<{ id: string; qtdChats: number }>> {
    const hojeInicio = new Date();
    hojeInicio.setHours(0, 0, 0, 0);
    const ontemInicio = new Date(hojeInicio);
    ontemInicio.setDate(ontemInicio.getDate() - 1);

    const colaboradores = await this.prismaService.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        usuario: {
          status: 'ativo',
          perfil: 'usuario',
        },
        cargos: {
          some: {
            cargo: {
              contains: tipoColaborador,
              mode: 'insensitive',
              ...(tipoColaborador === 'Vendedor'
                ? { not: { contains: 'Pré' } }
                : {}),
            },
          },
        },
      },
      select: {
        id: true,
        idUsuario: true,
        _count: {
          select: {
            ChatResponsaveis: {
              where: {
                chat: {
                  criadoEm: {
                    gte: ontemInicio,
                    lt: new Date(),
                  },
                },
              },
            },
          },
        },
      },
    });

    const idsUsuarios = colaboradores.map((c) => c.idUsuario);

    const statusSuspensao =
      await this.suspensaoService.verificarUsuariosSuspensos(idsUsuarios);

    const resultado: Array<{ id: string; qtdChats: number }> = [];
    for (const c of colaboradores) {
      if (statusSuspensao.get(c.idUsuario)) {
        continue;
      }

      const offsetChat =
        await this.suspensaoService.obterOffsetBalanceamentoChat(c.id);

      const qtd = offsetChat > 0 ? offsetChat : c._count.ChatResponsaveis;

      resultado.push({ id: c.id, qtdChats: qtd });
    }
    return resultado;
  }

  private selecionarColaboradorComMenosChats(
    colaboradores: Array<{ id: string; qtdChats: number }>,
  ): string | null {
    if (colaboradores.length === 0) return null;
    colaboradores.sort((a, b) => a.qtdChats - b.qtdChats);
    const min = colaboradores[0].qtdChats;
    const max = colaboradores[colaboradores.length - 1].qtdChats;
    if (max - min > this.LIMITE_DIFERENCA_ATENDIMENTOS) {
      const candidatos = colaboradores.filter((c) => c.qtdChats === min);
      return candidatos[Math.floor(Math.random() * candidatos.length)].id;
    }
    return colaboradores[Math.floor(Math.random() * colaboradores.length)].id;
  }

  async obterColaboradorParaDistribuicaoChat(
    idLoja: string,
    tipoEspecifico?: 'Pré-vendedor' | 'Vendedor',
  ): Promise<string | null> {
    const loja = await this.prismaService.loja.findUnique({
      where: { id: idLoja },
      select: { distribuicaoAutomatica: true },
    });
    if (!loja?.distribuicaoAutomatica) return null;

    if (tipoEspecifico) {
      const colabs = await this.buscarColaboradoresParaChat(
        idLoja,
        tipoEspecifico,
      );
      return this.selecionarColaboradorComMenosChats(colabs);
    }

    const pre = await this.buscarColaboradoresParaChat(idLoja, 'Pré-vendedor');
    if (pre.length) return this.selecionarColaboradorComMenosChats(pre);

    const vend = await this.buscarColaboradoresParaChat(idLoja, 'Vendedor');
    return this.selecionarColaboradorComMenosChats(vend);
  }
}
