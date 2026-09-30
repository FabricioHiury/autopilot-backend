import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CriarSuspensaoDto } from './dto/criar-suspensao.dto';
import { AtualizarSuspensaoDto } from './dto/atualizar-suspensao.dto';
import { FiltroSuspensaoDto } from './dto/filtro-suspensao.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventoService } from '../eventos/evento.service';

@Injectable()
export class SuspensaoService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly eventoService: EventoService,
  ) {}

  async atualizar(id: string, dados: AtualizarSuspensaoDto) {
    const suspensaoExiste = await this.prisma.suspensaoAtendimento.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (!suspensaoExiste) {
      throw new NotFoundException(`Suspensão com ID ${id} não encontrada`);
    }

    const usuarioAntigoId = suspensaoExiste.idUsuario;

    if (dados.idUsuario) {
      const usuarioExiste = await this.prisma.usuario.findUnique({
        where: { id: dados.idUsuario },
      });

      if (!usuarioExiste) {
        throw new NotFoundException(
          `Usuário com ID ${dados.idUsuario} não encontrado`,
        );
      }
    }

    const suspensaoAtualizada = await this.prisma.$transaction(async (tx) => {
      return tx.suspensaoAtendimento.update({
        where: { id },
        data: {
          idUsuario: dados.idUsuario,
          descricao: dados.descricao,
          startDate: dados.startDate ? new Date(dados.startDate) : undefined,
          endDate: dados.endDate ? new Date(dados.endDate) : undefined,
        },
        include: {
          usuario: {
            select: {
              nome: true,
            },
          },
        },
      });
    });

    this.eventoService.emitSuspensaoAtualizada({
      idAtendimento: '', 
      idUsuario: dados.idUsuario || usuarioAntigoId,
      nomeUsuario: suspensaoAtualizada.usuario.nome,
      dadosAntigos: suspensaoExiste,
      dadosNovos: suspensaoAtualizada,
      contexto: {
        detalhes: {
          suspensaoId: id,
          descricao: dados.descricao,
          periodo: {
            inicio: dados.startDate,
            fim: dados.endDate,
          },
        },
      },
    });

    await this.invalidarCacheUsuario(usuarioAntigoId);
    if (dados.idUsuario && dados.idUsuario !== usuarioAntigoId) {
      await this.invalidarCacheUsuario(dados.idUsuario);
    }

    return suspensaoAtualizada;
  }

  async criar(dados: CriarSuspensaoDto) {
    const usuarioExiste = await this.prisma.usuario.findUnique({
      where: { id: dados.idUsuario },
      select: {
        nome: true,
      },
    });

    if (!usuarioExiste) {
      throw new NotFoundException(
        `Usuário com ID ${dados.idUsuario} não encontrado`,
      );
    }

    const suspensao = await this.prisma.$transaction(async (tx) => {
      return tx.suspensaoAtendimento.create({
        data: {
          idUsuario: dados.idUsuario,
          descricao: dados.descricao,
          startDate: new Date(dados.startDate),
          endDate: new Date(dados.endDate),
        },
        include: {
          usuario: {
            select: {
              nome: true,
            },
          },
        },
      });
    });

    this.eventoService.emitSuspensaoCriada({
      idAtendimento: '', 
      idUsuario: dados.idUsuario,
      nomeUsuario: usuarioExiste.nome,
      dadosNovos: suspensao,
      contexto: {
        detalhes: {
          suspensaoId: suspensao.id,
          descricao: dados.descricao,
          periodo: {
            inicio: dados.startDate,
            fim: dados.endDate,
          },
        },
      },
    });

    await this.invalidarCacheUsuario(dados.idUsuario);

    return suspensao;
  }

  async remover(id: string) {
    const suspensaoExiste = await this.prisma.suspensaoAtendimento.findUnique({
      where: { id },
      include: {
        usuario: {
          include: {
            colaborador: {
              where: { status: 'ativo' },
              select: {
                id: true,
                idLoja: true,
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
    });

    if (!suspensaoExiste) {
      throw new NotFoundException(`Suspensão com ID ${id} não encontrada`);
    }

    const usuarioId = suspensaoExiste.idUsuario;
    const colaborador = suspensaoExiste.usuario.colaborador[0];

    const resultado = await this.prisma.$transaction(async (tx) => {
      return tx.suspensaoAtendimento.delete({
        where: { id },
      });
    });

    this.eventoService.emitSuspensaoRemovida({
      idAtendimento: '', 
      idUsuario: usuarioId,
      nomeUsuario: suspensaoExiste.usuario.colaborador[0]?.nome || 'Usuário não encontrado',
      dadosAntigos: suspensaoExiste,
      contexto: {
        detalhes: {
          suspensaoId: id,
          descricao: suspensaoExiste.descricao,
        },
      },
    });

    if (colaborador) {
      await this.definirOffsetBalanceamento(
        colaborador.id,
        colaborador.idLoja,
        colaborador.cargos,
      );

      await this.definirOffsetBalanceamentoChat(
        colaborador.id,
        colaborador.idLoja,
        colaborador.cargos,
      );
    }

    await this.invalidarCacheUsuario(usuarioId);

    return resultado;
  }

  public async definirOffsetBalanceamento(
    idColaborador: string,
    idLoja: string,
    cargos: Array<{ cargo: string }>,
  ) {
    const cargosTexto = cargos.map((c) => c.cargo.toLowerCase());
    let tipoColaborador: 'Pré-vendedor' | 'Vendedor' | undefined;

    if (
      cargosTexto.some(
        (cargo) =>
          cargo.includes('pré-vendedor') || cargo.includes('pre-vendedor'),
      )
    ) {
      tipoColaborador = 'Pré-vendedor';
    } else if (
      cargosTexto.some(
        (cargo) => cargo.includes('vendedor') && !cargo.includes('pré'),
      )
    ) {
      tipoColaborador = 'Vendedor';
    }

    if (!tipoColaborador) return;

    const isPreVendedor = tipoColaborador === 'Pré-vendedor';

    const colaboradores = await this.prisma.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        id: { not: idColaborador },
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
                      'PRE_ATENDIMENTO',
                      'EM_ATENDIMENTO',
                      'AGUARDANDO_CLIENTE',
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });

    if (colaboradores.length === 0) return;

    const maxAtendimentos = Math.max(
      ...colaboradores.map((c) => c._count.atendimentoResponsaveis),
    );

    const cacheKey = `balanceamento:offset:${idColaborador}`;
    // 86400 = 24h
    await this.cacheManager.set(cacheKey, maxAtendimentos, 86400);

    const dataKey = `balanceamento:data:${idColaborador}`;
    // 86400 = 24h
    await this.cacheManager.set(dataKey, new Date().toISOString(), 86400);
  }

  async obterOffsetBalanceamento(idColaborador: string): Promise<number> {
    const cacheKey = `balanceamento:offset:${idColaborador}`;
    const offset = await this.cacheManager.get<number>(cacheKey);
    return offset || 0;
  }

  async verificarUsuarioSuspenso(idUsuario: string): Promise<boolean> {
    const cacheKey = `suspensao:usuario:${idUsuario}`;

    const cached = await this.cacheManager.get<boolean>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const agora = new Date();

    const suspensaoAtiva = await this.prisma.suspensaoAtendimento.findFirst({
      where: {
        idUsuario,
        startDate: { lte: agora },
        endDate: { gte: agora },
      },
    });

    const estaSuspenso = !!suspensaoAtiva;

    await this.cacheManager.set(cacheKey, estaSuspenso, 300000);

    return estaSuspenso;
  }

  async verificarERemoverOffsetSeNecessario(
    idColaborador: string,
    idLoja: string,
  ): Promise<void> {
    const offset = await this.obterOffsetBalanceamento(idColaborador);

    if (offset === 0) return;

    const dataKey = `balanceamento:data:${idColaborador}`;
    const dataCriacaoStr = await this.cacheManager.get<string>(dataKey);

    if (dataCriacaoStr) {
      const dataCriacao = new Date(dataCriacaoStr);
      const agora = new Date();
      const diasDesdeCreacao = Math.floor(
        (agora.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diasDesdeCreacao >= 180) {
        await this.removerOffsetBalanceamento(idColaborador);
        return;
      }

      if (diasDesdeCreacao < 7) {
        return;
      }
    }

    const colaborador = await this.prisma.colaborador.findUnique({
      where: { id: idColaborador },
      select: {
        _count: {
          select: {
            atendimentoResponsaveis: {
              where: {
                atendimento: {
                  status: {
                    in: [
                      'PRE_ATENDIMENTO',
                      'EM_ATENDIMENTO',
                      'AGUARDANDO_CLIENTE',
                    ],
                  },
                },
              },
            },
          },
        },
        cargos: {
          select: { cargo: true },
        },
      },
    });

    if (!colaborador) {
      await this.removerOffsetBalanceamento(idColaborador);
      return;
    }

    const cargosTexto = colaborador.cargos.map((c) => c.cargo.toLowerCase());
    let tipoColaborador: 'Pré-vendedor' | 'Vendedor' | undefined;

    if (
      cargosTexto.some(
        (cargo) =>
          cargo.includes('pré-vendedor') || cargo.includes('pre-vendedor'),
      )
    ) {
      tipoColaborador = 'Pré-vendedor';
    } else if (
      cargosTexto.some(
        (cargo) => cargo.includes('vendedor') && !cargo.includes('pré'),
      )
    ) {
      tipoColaborador = 'Vendedor';
    }

    if (!tipoColaborador) {
      await this.removerOffsetBalanceamento(idColaborador);
      return;
    }

    const isPreVendedor = tipoColaborador === 'Pré-vendedor';

    const outrosColaboradores = await this.prisma.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        id: { not: idColaborador },
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
        _count: {
          select: {
            atendimentoResponsaveis: {
              where: {
                atendimento: {
                  status: {
                    in: [
                      'PRE_ATENDIMENTO',
                      'EM_ATENDIMENTO',
                      'AGUARDANDO_CLIENTE',
                    ],
                  },
                },
              },
            },
          },
        },
      },
    });

    if (outrosColaboradores.length === 0) {
      await this.removerOffsetBalanceamento(idColaborador);
      return;
    }

    const atendimentosReais = colaborador._count.atendimentoResponsaveis;
    const atendimentosOutros = outrosColaboradores.map(
      (c) => c._count.atendimentoResponsaveis,
    );
    const mediaOutros =
      atendimentosOutros.reduce((acc, val) => acc + val, 0) /
      atendimentosOutros.length;
    const maxOutros = Math.max(...atendimentosOutros);

    // Critérios para remoção do offset:
    // 1. Atingiu 80% da média dos outros
    // 2. Atingiu 70% do máximo dos outros
    // 3. Está acima da média dos outros
    const criterio1 = atendimentosReais >= mediaOutros * 0.8;
    const criterio2 = atendimentosReais >= maxOutros * 0.7;
    const criterio3 = atendimentosReais >= mediaOutros;

    if (criterio1 || criterio2 || criterio3) {
      await this.removerOffsetBalanceamento(idColaborador);
    }
  }

  async removerOffsetBalanceamento(idColaborador: string): Promise<void> {
    const cacheKey = `balanceamento:offset:${idColaborador}`;
    const dataKey = `balanceamento:data:${idColaborador}`;

    await Promise.all([
      this.cacheManager.del(cacheKey),
      this.cacheManager.del(dataKey),
    ]);
  }

  async verificarUsuariosSuspensos(
    idsUsuarios: string[],
  ): Promise<Map<string, boolean>> {
    const resultado = new Map<string, boolean>();
    const usuariosParaBuscar: string[] = [];

    for (const idUsuario of idsUsuarios) {
      const cacheKey = `suspensao:usuario:${idUsuario}`;
      const cached = await this.cacheManager.get<boolean>(cacheKey);

      if (cached !== undefined) {
        resultado.set(idUsuario, cached);
      } else {
        usuariosParaBuscar.push(idUsuario);
      }
    }

    if (usuariosParaBuscar.length > 0) {
      const agora = new Date();

      const suspensoesAtivas = await this.prisma.suspensaoAtendimento.findMany({
        where: {
          idUsuario: { in: usuariosParaBuscar },
          startDate: { lte: agora },
          endDate: { gte: agora },
        },
        select: { idUsuario: true },
      });

      const usuariosSuspensos = new Set(
        suspensoesAtivas.map((s) => s.idUsuario),
      );

      for (const idUsuario of usuariosParaBuscar) {
        const estaSuspenso = usuariosSuspensos.has(idUsuario);
        resultado.set(idUsuario, estaSuspenso);

        const cacheKey = `suspensao:usuario:${idUsuario}`;
        await this.cacheManager.set(cacheKey, estaSuspenso, 300000);
      }
    }

    return resultado;
  }

  private async invalidarCacheUsuario(idUsuario: string): Promise<void> {
    const cacheKey = `suspensao:usuario:${idUsuario}`;
    await this.cacheManager.del(cacheKey);
  }

  async listar(filtros: FiltroSuspensaoDto) {
    const where = this.montarFiltros(filtros);

    const pagina = filtros.pagina ? parseInt(filtros.pagina) : 1;
    const itensPagina = filtros.itensPagina
      ? parseInt(filtros.itensPagina)
      : 10;

    return this.prisma.$transaction(async (tx) => {
      const [suspensoes, total] = await Promise.all([
        tx.suspensaoAtendimento.findMany({
          where,
          skip: (pagina - 1) * itensPagina,
          take: itensPagina,
          orderBy: { criadoEm: 'desc' },
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true
              },
            },
          },
        }),
        tx.suspensaoAtendimento.count({ where }),
      ]);

      return {
        data: suspensoes,
        meta: {
          pagina,
          itensPagina,
          total,
          totalPaginas: Math.ceil(total / itensPagina),
        },
      };
    });
  }

  async obterPorId(id: string) {
    const suspensao = await this.prisma.suspensaoAtendimento.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true
          },
        },
      },
    });

    if (!suspensao) {
      throw new NotFoundException(`Suspensão com ID ${id} não encontrada`);
    }

    return suspensao;
  }

  private montarFiltros(filtros: FiltroSuspensaoDto) {
    const where: any = {};

    if (filtros.idUsuario) {
      where.idUsuario = filtros.idUsuario;
    }

    if (filtros.descricao) {
      where.descricao = {
        contains: filtros.descricao,
        mode: 'insensitive',
      };
    }

    const startDateFilter: any = {};

    if (filtros.startDateInicio) {
      startDateFilter.gte = new Date(filtros.startDateInicio);
    }

    if (filtros.startDateFim) {
      startDateFilter.lte = new Date(filtros.startDateFim);
    }

    if (Object.keys(startDateFilter).length > 0) {
      where.startDate = startDateFilter;
    }

    if (filtros.ativas === true) {
      const agora = new Date();

      if (!where.startDate) {
        where.startDate = { lte: agora };
      }

      where.endDate = { gte: agora };
    }

    return where;
  }

  public async definirOffsetBalanceamentoChat(
    idColaborador: string,
    idLoja: string,
    cargos: Array<{ cargo: string }>,
  ): Promise<void> {
    const textoCargos = cargos.map((c) => c.cargo.toLowerCase());
    const tipo: 'Pré-vendedor' | 'Vendedor' | undefined = textoCargos.some(
      (c) => c.includes('pré-vendedor'),
    )
      ? 'Pré-vendedor'
      : textoCargos.some((c) => c.includes('vendedor'))
        ? 'Vendedor'
        : undefined;
    if (!tipo) return;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    const todos = await this.prisma.colaborador.findMany({
      where: {
        idLoja,
        status: 'ativo',
        id: { not: idColaborador },
        cargos: { some: { cargo: { contains: tipo, mode: 'insensitive' } } },
      },
      select: {
        id: true,
        _count: {
          select: {
            ChatResponsaveis: {
              where: {
                chat: {
                  criadoEm: { gte: ontem, lt: hoje },
                },
              },
            },
          },
        },
      },
    });

    const maxChats = todos.reduce(
      (max, c) => Math.max(max, c._count.ChatResponsaveis),
      0,
    );

    const cacheKey = `balanceamento:offset:chat:${idColaborador}`;
    // 86400 = 24h
    await this.cacheManager.set(cacheKey, maxChats, 86400);
  }

  public async obterOffsetBalanceamentoChat(
    idColaborador: string,
  ): Promise<number> {
    const cacheKey = `balanceamento:offset:chat:${idColaborador}`;
    const offset = await this.cacheManager.get<number>(cacheKey);
    return offset || 0;
  }
}
