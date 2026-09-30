import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { ListarAssinantesDto } from './dto/listar-assinantes';
import { Assinatura, Prisma } from '@prisma/client';
import { STATUS_ASSINATURA } from '../../../../utils/enum/assinatura.enum';
import {
  IAssinaturaComLoja,
  IAssinaturaFormatada,
} from './interfaces/assinatura.interfaces';
import {
  AppErrorBadRequest,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { TIPOS_PLANO } from 'src/utils/enum/planos.enum';
import { addMonths, endOfDay, startOfDay } from 'date-fns';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';
import { USUARIO_STATUS } from 'src/utils/enum/usuario-status.enum';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { TiposNotificacaoEnum } from 'src/utils/enum/notificacoes.enum';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';
import Stripe from 'stripe';
import { CriarAssinaturaDto } from './dto/criar-assinatura.dto';

export interface ExtendedSubscription extends Stripe.Subscription {
  current_period_end: number;
}

@Injectable()
export class AssinaturaService {
  private stripe: Stripe;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly notificacoesService: NotificacoesService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    });
  }

  private readonly assinaturaSelect: Prisma.AssinaturaSelect = {
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
        periodo: true,
      },
    },
    loja: {
      select: {
        id: true,
        nomeEmpresa: true,
        cnpj: true,
        criadoEm: true,
        enderecoLoja: {
          select: {
            bairro: true,
            cep: true,
            cidade: true,
            complemento: true,
            filial: true,
            rua: true,
            uf: true,
          },
        },
        lojista: {
          select: {
            usuario: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        contatoLoja: {
          select: {
            telefone: true,
            celular: true,
          },
        },
      },
    },
  };

  private formatarAssinatura(
    assinatura: IAssinaturaComLoja,
  ): IAssinaturaFormatada {
    return {
      idAssinatura: assinatura.id,
      plano: assinatura.plano.nome,
      duracaoPlano: assinatura.duracaoPlano,
      valorPlano: assinatura.plano.valor,
      status: assinatura.status,
      periodo: assinatura.plano.periodo ?? '',
      formaPagamento: assinatura.formaPagamento,
      dataAquisicao: assinatura.dataAquisicao,
      dataRenovacao: assinatura.dataRenovacao ?? null,
      dataCancelamento: assinatura.dataCancelamento ?? null,
      loja: {
        idLoja: assinatura.loja.id,
        nomeEmpresa: assinatura.loja.nomeEmpresa,
        cnpj: assinatura.loja.cnpj,
        email: assinatura.loja.lojista.usuario.email,
        avatarUrl: getStringUrlAvatar(assinatura.loja.id),
        telefone: assinatura.loja.contatoLoja[0]?.telefone ?? null,
        celular: assinatura.loja.contatoLoja[0]?.celular ?? null,
        criadoEm: assinatura.loja.criadoEm,
        enderecosLoja: assinatura.loja.enderecoLoja,
      },
    };
  }

  private filtrarAssinaturasPorPlano(
    assinaturas: (Assinatura & { plano: { nome: string } })[],
    plano: TIPOS_PLANO,
  ) {
    return assinaturas.filter((assinatura) => assinatura.plano.nome === plano);
  }

  async listarAssinantes(params: ListarAssinantesDto) {
    const pagina = params.pagina ? +params.pagina : 1;
    const itensPorPagina = params.itensPorPagina ? +params.itensPorPagina : 6;
    const pesquisa = params.pesquisa ?? '';
    const plano = params.plano ?? undefined;

    const dataInicial = params.dataInicial
      ? startOfDay(new Date(params.dataInicial))
      : undefined;

    const dataFinal = params.dataFinal
      ? endOfDay(new Date(params.dataFinal))
      : undefined;

    const where: Prisma.AssinaturaWhereInput = {
      AND: [
        {
          plano: {
            nome: plano,
          },
          status: STATUS_ASSINATURA.ATIVO,
          dataAquisicao: {
            gte: dataInicial,
            lte: dataFinal,
          },
        },
      ],
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
            lojista: {
              usuario: {
                email: {
                  contains: pesquisa,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ],
    };

    const assinantes = (await this.prismaService.assinatura.findMany({
      where,
      skip: (pagina - 1) * itensPorPagina,
      take: itensPorPagina,
      select: this.assinaturaSelect,
      // coversão forçada para IAssinaturaComLoja, pois a inferência de tipo não reconhece o tipo do select corretamente
    })) as unknown as IAssinaturaComLoja[];

    const totalAssinantes = await this.prismaService.assinatura.count({
      where,
    });

    const assinantesFormatados = assinantes.map((assinatura) =>
      this.formatarAssinatura(assinatura),
    );

    return {
      pagina,
      itensPorPagina,
      totalPaginas: Math.ceil(totalAssinantes / itensPorPagina),
      pesquisa,
      plano,
      dataInicial,
      dataFinal,
      assinantes: assinantesFormatados,
    };
  }

  async listarLojas(params: ListarAssinantesDto) {
    const pagina = params.pagina ? +params.pagina : 1;
    const itensPorPagina = params.itensPorPagina ? +params.itensPorPagina : 6;
    const pesquisa =
      params.pesquisa && params.pesquisa !== '' ? params.pesquisa : undefined;
    const plano = params.plano ?? undefined;
    const estado = params.estado ?? undefined;

    const dataInicial = params.dataInicial
      ? startOfDay(new Date(params.dataInicial))
      : undefined;

    const dataFinal = params.dataFinal
      ? endOfDay(new Date(params.dataFinal))
      : undefined;

    const where: Prisma.LojaWhereInput = {
      AND: [
        {
          criadoEm: {
            gte: dataInicial,
            lte: dataFinal,
          },
        },
        pesquisa
          ? {
              OR: [
                {
                  nomeEmpresa: {
                    contains: pesquisa,
                    mode: 'insensitive',
                  },
                },
                {
                  lojista: {
                    usuario: {
                      email: {
                        contains: pesquisa,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            }
          : {},
        estado
          ? {
              enderecoLoja: {
                some: {
                  uf: {
                    equals: estado,
                    mode: 'insensitive',
                  },
                },
              },
            }
          : {},
      ],
    };

    const lojas = await this.prismaService.loja.findMany({
      where,
      include: {
        assinatura: {
          include: {
            plano: true,
          },
        },
        lojista: {
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        contatoLoja: {
          select: {
            telefone: true,
            celular: true,
          },
        },
        enderecoLoja: true,
      },
      skip: (pagina - 1) * itensPorPagina,
      take: itensPorPagina,
      orderBy: {
        criadoEm: 'desc',
      },
    });

    const totalLojas = await this.prismaService.loja.count({
      where,
    });

    return {
      pagina,
      itensPorPagina,
      totalPaginas: Math.ceil(totalLojas / itensPorPagina),
      total: totalLojas,
      pesquisa,
      plano,
      dataInicial,
      dataFinal,
      lojas,
    };
  }

  async buscarEstatisticasAssinaturas() {
    const assinaturas = await this.prismaService.assinatura.findMany({
      where: {
        status: STATUS_ASSINATURA.ATIVO,
      },
      include: {
        plano: {
          select: {
            nome: true,
          },
        },
      },
    });

    if (assinaturas.length === 0) {
      return {
        totalAssinaturas: 0,
        planos: [],
      };
    }

    const totalAssinaturas = assinaturas.length;

    const planos = assinaturas
      .map((plano) => plano.plano.nome)
      .filter((plano, index, self) => self.indexOf(plano) === index);

    const assinaturasPorPlano = planos.map((plano) => {
      return {
        plano,
        total: assinaturas.filter(
          (assinatura) => assinatura.plano.nome === plano,
        ).length,
        percentual:
          (assinaturas.filter((assinatura) => assinatura.plano.nome === plano)
            .length /
            totalAssinaturas) *
          100,
      };
    });

    return {
      totalAssinaturas,
      planos: assinaturasPorPlano,
    };
  }

  async buscarAssinantePorIdLoja(idLoja: string) {
    const assinante = (await this.prismaService.assinatura.findUnique({
      where: {
        idLoja: idLoja,
      },
      select: this.assinaturaSelect,
    })) as unknown as IAssinaturaComLoja;

    if (!assinante) {
      throw new AppErrorNotFound('Assinante não encontrado');
    }

    return this.formatarAssinatura(assinante);
  }

  async cancelarAssinaturaPorLoja(idLoja: string) {
    const assinatura = await this.prismaService.assinatura.findUnique({
      where: {
        idLoja: idLoja,
      },
      select: this.assinaturaSelect,
    });

    if (!assinatura) {
      throw new AppErrorNotFound('Assinatura não encontrada para esta loja');
    }

    if (assinatura.status === STATUS_ASSINATURA.INATIVO) {
      throw new AppErrorBadRequest('Assinatura já está cancelada');
    }

    if (assinatura.idAssinaturaStripe) {
      try {
        await this.stripe.subscriptions.cancel(assinatura.idAssinaturaStripe);
      } catch (error) {
        console.error('Erro ao cancelar assinatura no Stripe:', error);
      }
    }

    const dataFimCarencia = new Date();
    dataFimCarencia.setDate(dataFimCarencia.getDate() + 7);

    await this.prismaService.assinatura.update({
      where: {
        id: assinatura.id,
      },
      data: {
        status: STATUS_ASSINATURA.CARENCIA,
        dataRenovacao: null,
        dataCancelamento: new Date(),
        dataFimCarencia: dataFimCarencia,
      },
    });

    const assinaturaAtualizada =
      (await this.prismaService.assinatura.findUnique({
        where: {
          idLoja: idLoja,
        },
        select: this.assinaturaSelect,
      })) as unknown as IAssinaturaComLoja;

    if (assinaturaAtualizada) {
      await this.notificarAdminsSobreAssinatura(
        idLoja,
        assinaturaAtualizada.loja.nomeEmpresa,
        'desativada',
      );
    }

    return {
      message:
        'Assinatura cancelada com sucesso. Você terá acesso às integrações por mais 7 dias.',
      assinatura: assinaturaAtualizada
        ? this.formatarAssinatura(assinaturaAtualizada)
        : null,
    };
  }

  async verificarAssinaturaAtiva(idLoja: string) {
    const assinatura = await this.prismaService.assinatura.findFirst({
      where: {
        idLoja: idLoja,
        status: STATUS_ASSINATURA.ATIVO,
      },
      select: this.assinaturaSelect,
    });

    if (!assinatura) {
      return {
        temAssinaturaAtiva: false,
        assinatura: null,
      };
    }

    return {
      temAssinaturaAtiva: true,
      assinatura: this.formatarAssinatura(
        assinatura as unknown as IAssinaturaComLoja,
      ),
    };
  }

  async ativarAssinatura(idLoja: string) {
    const assinatura = await this.prismaService.assinatura.findUnique({
      where: {
        idLoja: idLoja,
      },
      select: this.assinaturaSelect,
    });

    if (assinatura) {
      if (assinatura.status === STATUS_ASSINATURA.ATIVO) {
        throw new AppErrorBadRequest('Assinatura já está ativa');
      }

      await this.prismaService.assinatura.update({
        where: {
          id: assinatura.id,
        },
        data: {
          status: STATUS_ASSINATURA.ATIVO,
          dataAquisicao: new Date(),
          dataRenovacao: addMonths(new Date(), assinatura.duracaoPlano),
          dataCancelamento: null,
        },
      });
    }

    await this.prismaService.loja.update({
      where: {
        id: idLoja,
      },
      data: {
        lojista: {
          update: {
            status: USUARIO_STATUS.ATIVO,
          },
        },
      },
    });

    const assinante = (await this.prismaService.assinatura.findUnique({
      where: {
        idLoja: idLoja,
      },
      select: this.assinaturaSelect,
    })) as unknown as IAssinaturaComLoja;

    if (assinante) {
      await this.notificarAdminsSobreAssinatura(
        idLoja,
        assinante.loja.nomeEmpresa,
        'ativada',
      );
    }

    if (!assinante) {
      return 'Assinatura ativada com sucesso';
    }

    const assinaturaAtualizada = this.formatarAssinatura(assinante);
    return assinaturaAtualizada;
  }

  private async notificarAdminsSobreAssinatura(
    idLoja: string,
    nomeEmpresa: string,
    acao: 'ativada' | 'desativada',
  ) {
    try {
      const admins = await this.prismaService.usuario.findMany({
        where: {
          perfil: USUARIO_PERFIL.AUTOPILOT,
          status: USUARIO_STATUS.ATIVO,
        },
        select: {
          id: true,
        },
      });

      if (!admins || admins.length === 0) {
        console.log(
          'Nenhum administrador encontrado para notificar sobre alteração de assinatura',
        );
        return;
      }

      const tipo =
        acao === 'ativada'
          ? TiposNotificacaoEnum.ASSINATURA_ATIVADA
          : TiposNotificacaoEnum.ASSINATURA_DESATIVADA;

      const mensagem = `A assinatura da loja ${nomeEmpresa} foi ${acao}`;

      for (const admin of admins) {
        await this.notificacoesService.criarNovaNotificacao({
          idUsuario: admin.id,
          idReferencia: idLoja,
          tipo: tipo,
          mensagem: mensagem,
        });
      }

      console.log(
        `Notificações enviadas para ${admins.length} administradores sobre assinatura ${acao}`,
      );
    } catch (error) {
      console.error(
        `Erro ao notificar administradores sobre assinatura ${acao}:`,
        error,
      );
    }
  }

  async criarAssinatura(dados: CriarAssinaturaDto) {
    const { idLoja, idPlano, idMetodoPagamentoStripe } = dados;

    const [loja, plano] = await Promise.all([
      this.prismaService.loja.findUnique({
        where: { id: idLoja },
        include: { lojista: { include: { usuario: true } } },
      }),
      this.prismaService.plano.findUnique({ where: { id: idPlano } }),
    ]);

    if (!loja) {
      throw new AppErrorNotFound('Loja não encontrada');
    }
    if (!plano) {
      throw new AppErrorNotFound('Plano não encontrado');
    }
    if (!plano.idPrecoStripe) {
      throw new AppErrorBadRequest(
        'Plano não está vinculado a um preço do Stripe.',
      );
    }
    const assinaturaExistente = await this.prismaService.assinatura.findFirst({
      where: { idLoja, status: STATUS_ASSINATURA.ATIVO },
    });
    if (assinaturaExistente) {
      throw new AppErrorBadRequest('Esta loja já possui uma assinatura ativa.');
    }

    const nomeCliente = loja.nomeEmpresa;
    const emailCliente = loja.lojista.usuario.email;
    let clienteStripe: Stripe.Customer;

    const clientes = await this.stripe.customers.list({
      email: emailCliente,
      limit: 1,
    });
    if (clientes.data.length > 0) {
      clienteStripe = clientes.data[0];
    } else {
      clienteStripe = await this.stripe.customers.create({
        name: nomeCliente,
        email: emailCliente,
        metadata: { idLoja: loja.id.toString() },
      });
    }

    await this.stripe.paymentMethods.attach(idMetodoPagamentoStripe, {
      customer: clienteStripe.id,
    });
    await this.stripe.customers.update(clienteStripe.id, {
      invoice_settings: {
        default_payment_method: idMetodoPagamentoStripe,
      },
    });

    const stripeSubscription = (await this.stripe.subscriptions.create({
      customer: clienteStripe.id,
      items: [{ price: plano.idPrecoStripe }],
      trial_period_days: 7, // 7 dias de teste gratuito
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        idLoja: idLoja.toString(),
        idPlano: idPlano.toString(),
      },
    })) as unknown as ExtendedSubscription;

    if (
      stripeSubscription.status !== 'active' &&
      stripeSubscription.status !== 'trialing'
    ) {
      throw new AppErrorBadRequest(
        `Falha ao criar assinatura no Stripe. Status: ${stripeSubscription.status}`,
      );
    }

    const dataRenovacao = stripeSubscription.current_period_end
      ? new Date(stripeSubscription.current_period_end * 1000)
      : null;

    const novaAssinatura = (await this.prismaService.assinatura.upsert({
      where: { idLoja: idLoja },
      update: {
        idPlano: idPlano,
        status: STATUS_ASSINATURA.INATIVO,
        dataAquisicao: new Date(),
        dataRenovacao: addMonths(
          new Date(),
          plano.periodo === 'mensal' ? 1 : 12,
        ),
        formaPagamento: 'stripe',
        duracaoPlano: plano.periodo === 'mensal' ? 1 : 12,
        idAssinaturaStripe: stripeSubscription.id,
        idClienteStripe: clienteStripe.id,
        dataCancelamento: null,
      },
      create: {
        idLoja: idLoja,
        idPlano: idPlano,
        status: STATUS_ASSINATURA.INATIVO,
        dataAquisicao: new Date(),
        dataRenovacao: addMonths(
          new Date(),
          plano.periodo === 'mensal' ? 1 : 12,
        ),
        formaPagamento: 'stripe',
        duracaoPlano: plano.periodo === 'mensal' ? 1 : 12,
        idAssinaturaStripe: stripeSubscription.id,
        idClienteStripe: clienteStripe.id,
      },
      select: this.assinaturaSelect,
    })) as unknown as IAssinaturaComLoja;

    await this.notificarAdminsSobreAssinatura(
      idLoja,
      loja.nomeEmpresa,
      'ativada',
    );

    return this.formatarAssinatura(novaAssinatura);
  }

  async verificarStatusCarencia(idLoja: string) {
    const assinatura = await this.prismaService.assinatura.findFirst({
      where: {
        idLoja: idLoja,
        status: STATUS_ASSINATURA.CARENCIA,
      },
      select: {
        id: true,
        status: true,
        dataCancelamento: true,
        dataFimCarencia: true,
      },
    });

    if (!assinatura) {
      return {
        emCarencia: false,
        diasRestantes: 0,
      };
    }

    const agora = new Date();
    const fimCarencia = assinatura.dataFimCarencia;

    if (!fimCarencia || agora > fimCarencia) {
      await this.prismaService.assinatura.update({
        where: { id: assinatura.id },
        data: {
          status: STATUS_ASSINATURA.INATIVO,
          dataFimCarencia: null,
        },
      });

      return {
        emCarencia: false,
        diasRestantes: 0,
      };
    }

    const diasRestantes = Math.ceil(
      (fimCarencia.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      emCarencia: true,
      diasRestantes,
      dataFimCarencia: fimCarencia,
    };
  }
}
