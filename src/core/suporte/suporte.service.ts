import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { CriarTicketDto } from './dto/criar-ticket-dto';
import { EventosTicketEnum } from './enum/eventos-ticket-enum';
import { StatusTicketEnum } from './enum/status-ticket-enum';
import { Prisma } from '@prisma/client';
import { CategoriaTicketEnum } from './enum/categoria-ticket-enum';
import { ListarTicketDto } from './dto/listar-ticket-dto';
import { PrioridadeTicketEnum } from './enum/prioridade-ticket-enum';
import { ResponderTicketDto } from './dto/responder-ticket-dto';
import { AlterarTicketDto } from './dto/alterar-ticket-dto';
import {
  AppErrorBadRequest,
  AppErrorConflict,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { USUARIO_PERFIL } from '../usuario/enum/perfil.enum';
import { ObterAnexosDto } from './dto/obter-anexos.dto';
import { FileService } from 'src/persistence/files/file/file.service';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';
import { TiposNotificacaoEnum } from 'src/utils/enum/notificacoes.enum';
import { USUARIO_STATUS } from 'src/utils/enum/usuario-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class SuporteService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async verificarTicketsSemRespostaCron() {
    console.log('Executando verificação de tickets sem resposta...');
    try {
      await this.verificarTicketsSemResposta();
    } catch (error) {
      console.error('Erro ao executar verificação de tickets sem resposta:', error);
    }
  }

  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/png',
    'application/pdf',
  ];

  private async criarEventoHistoricoTicket(
    idTicket: string,
    idUsuario: string,
    evento: EventosTicketEnum,
  ) {
    let acao: string;

    switch (evento) {
      case EventosTicketEnum.CRIAR:
        acao = 'Ticket criado por ';
        break;
      case EventosTicketEnum.RESPONDER:
        acao = 'Resposta enviada por ';
        break;
      case EventosTicketEnum.ALTERAR_STATUS:
        acao = 'Ticket alterado para ';
        break;
      default:
        acao = 'Evento desconhecido por';
    }

    const [usuario, ticket] = await Promise.all([
      this.prismaService.usuario.findUnique({
        where: {
          id: idUsuario,
        },
        select: {
          id: true,
          nome: true,
        },
      }),
      this.prismaService.ticketSuporte.findUnique({
        where: {
          id: idTicket,
        },
      }),
    ]);

    if (evento === EventosTicketEnum.ALTERAR_STATUS) {
      acao = acao + ticket.status + ' por ';
    }

    await this.prismaService.ticketHistorico.create({
      data: {
        evento: evento,
        acao: acao,
        ticket: {
          connect: {
            id: idTicket,
          },
        },
        usuario: {
          connect: {
            id: idUsuario,
          },
        },
      },
    });
  }

  private validarQuantidadeArquivos(files: Express.Multer.File[]) {
    if (!files || files?.length === 0) {
      throw new AppErrorBadRequest('Nenhum arquivo enviado');
    }

    return files;
  }

  private async pegarResposta(idResposta: string, idTicket: string) {
    const resposta = await this.prismaService.respostaTicket.findUnique({
      where: {
        id: idResposta,
        ticket: {
          id: idTicket,
        },
      },
    });

    if (!resposta) {
      throw new AppErrorNotFound('Resposta não encontrada');
    }

    return resposta;
  }

  private async pegarUrlAnexo(params: { idTicket: string; idAnexo: string }) {
    const { idTicket, idAnexo } = params;

    const anexo = await this.prismaService.anexoSuporte.findUnique({
      where: {
        id: idAnexo,
        idTicket,
        arquivo: {
          usuarioId: idTicket,
        },
      },
      include: {
        arquivo: true,
      },
    });

    if (!anexo || !anexo.arquivo) {
      throw new AppErrorNotFound('Anexo não encontrado');
    }

    const arquivo = await this.fileService.pegarArquivoPorId(anexo.idArquivo);

    if (!arquivo) {
      throw new AppErrorNotFound('Arquivo não encontrado');
    }

    return arquivo.url;
  }

  private async notificarAdminsSobreNovoTicket(ticket: any, loja: any) {
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
        console.log('Nenhum administrador encontrado para notificar sobre novo ticket');
        return;
      }

      const nomeLoja = loja.nomeEmpresa || 'Loja';
      
      for (const admin of admins) {
        await this.notificacoesService.criarNovaNotificacao({
          idUsuario: admin.id,
          idReferencia: ticket.id,
          tipo: TiposNotificacaoEnum.TICKET_CRIADO,
          mensagem: `Novo ticket de suporte criado: "${ticket.titulo}" da loja ${nomeLoja}`,
        });
      }
      
      console.log(`Notificações enviadas para ${admins.length} administradores sobre o ticket #${ticket.id}`);
    } catch (error) {
      console.error('Erro ao notificar administradores sobre novo ticket:', error);
    }
  }

  /**
   * Verifica tickets sem resposta por mais de 2 dias e notifica administradores
   * Este método é executado por um cron job
   */
  async verificarTicketsSemResposta() {
    try {
      const doisDiasAtras = new Date();
      doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
      
      console.log(`Verificando tickets sem resposta desde: ${doisDiasAtras.toISOString()}`);
      
      const ticketsSemResposta = await this.prismaService.ticketSuporte.findMany({
        where: {
          status: {
            not: StatusTicketEnum.FECHADO
          },
          criadoEm: {
            lte: doisDiasAtras
          },
          respostas: {
            none: {}
          }
        },
        include: {
          loja: {
            select: {
              id: true,
              nomeEmpresa: true
            }
          }
        }
      });
      
      console.log(`Encontrados ${ticketsSemResposta.length} tickets sem resposta há mais de 2 dias`);
      
      if (ticketsSemResposta.length === 0) {
        return {
          mensagem: 'Nenhum ticket sem resposta encontrado'
        };
      }
      
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
        console.log('Nenhum administrador encontrado para notificar sobre tickets sem resposta');
        return {
          mensagem: 'Nenhum administrador encontrado para notificar'
        };
      }
      
      let notificacoesEnviadas = 0;
      
      for (const ticket of ticketsSemResposta) {
        const nomeLoja = ticket.loja.nomeEmpresa || 'Loja';
        const diasSemResposta = Math.floor((new Date().getTime() - new Date(ticket.criadoEm).getTime()) / (1000 * 3600 * 24));
        
        for (const admin of admins) {
          await this.notificacoesService.criarNovaNotificacao({
            idUsuario: admin.id,
            idReferencia: ticket.id,
            tipo: TiposNotificacaoEnum.TICKET_SEM_RESPOSTA,
            mensagem: `Ticket "${ticket.titulo}" da loja ${nomeLoja} está sem resposta há ${diasSemResposta} dias`,
          });
          notificacoesEnviadas++;
        }
      }
      
      console.log(`Enviadas ${notificacoesEnviadas} notificações para ${admins.length} administradores`);
      
      return {
        mensagem: `Notificações enviadas para ${ticketsSemResposta.length} tickets sem resposta`,
        ticketsNotificados: ticketsSemResposta.length,
        adminsNotificados: admins.length
      };
    } catch (error) {
      console.error('Erro ao verificar tickets sem resposta:', error);
      throw error;
    }
  }

  async criarTicket(idLoja: string, idUsuario: string, params: CriarTicketDto) {
    const [loja, usuario] = await Promise.all([
      this.prismaService.loja.findUnique({
        where: {
          id: idLoja,
        },
        select: {
          id: true,
          nomeEmpresa: true,
        },
      }),
      this.prismaService.usuario.findUnique({
        where: {
          id: idUsuario,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!loja || !usuario) {
      throw new Error('Loja ou usuário não encontrados');
    }

    const data: Prisma.TicketSuporteCreateInput = {
      titulo: params.titulo || 'Sem título',
      assunto: params.assunto || 'Sem assunto',
      mensagem: params.mensagem || 'Sem mensagem',
      categoria: params.categoria || CategoriaTicketEnum.OUTROS,
      status: StatusTicketEnum.ABERTO,
      usuario: {
        connect: {
          id: usuario.id,
        },
      },
      loja: {
        connect: {
          id: loja.id,
        },
      },
    };

    const ticket = await this.prismaService.ticketSuporte.create({ data });
    
    this.criarEventoHistoricoTicket(
      ticket.id,
      usuario.id,
      EventosTicketEnum.CRIAR,
    );
    
    await this.notificarAdminsSobreNovoTicket(ticket, loja);

    return ticket;
  }

  async listarTickets(params: ListarTicketDto, idLoja?: string) {
    const pagina = parseInt(params.pagina) || 1;
    const itensPorPagina = parseInt(params.itensPagina) || 8;

    const where: Prisma.TicketSuporteWhereInput = {};

    if (idLoja) {
      where.idLoja = idLoja;
    }

    if (params.pesquisa) {
      where.OR = [
        {
          titulo: {
            contains: params.pesquisa,
            mode: 'insensitive',
          },
        },
        {
          usuario: {
            nome: {
              contains: params.pesquisa,
              mode: 'insensitive',
            },
          },
        },
        {
          assunto: {
            contains: params.pesquisa,
            mode: 'insensitive',
          },
        },
        {
          mensagem: {
            contains: params.pesquisa,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (params.prioridade) {
      where.prioridade = params.prioridade;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.categoria) {
      where.categoria = params.categoria;
    }

    if (params.dataInicial && params.dataFinal) {
      where.criadoEm = {
        gte: new Date(params.dataInicial),
        lte: new Date(params.dataFinal),
      };
    }

    const [tickets, totalTickets] = await Promise.all([
      this.prismaService.ticketSuporte.findMany({
        where,
        skip: (pagina - 1) * itensPorPagina,
        take: itensPorPagina,
        include: {
          usuario: {
            select: {
              nome: true,
            },
          },
        },
        orderBy: {
          criadoEm: 'desc',
        },
      }),
      this.prismaService.ticketSuporte.count({
        where,
      }),
    ]);

    return {
      total: totalTickets,
      pagina,
      totalPaginas: Math.ceil(totalTickets / itensPorPagina),
      tickets,
    };
  }

  async listarTicketsLoja(idLoja: string, params: ListarTicketDto) {
    return await this.listarTickets(params, idLoja);
  }

  async pegarTicket(idTicket: string, idLoja?: string) {
    const where: Prisma.TicketSuporteWhereUniqueInput = {
      id: idTicket,
    };

    const ticket = await this.prismaService.ticketSuporte.findUnique({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
        respostas: {
          include: {
            arquivos: {
              include: {
                arquivo: {
                  select: {
                    id: true,
                    nome: true,
                    tipo: true,
                    tamanho: true,
                  },
                },
              },
            },
            usuario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            criadoEm: 'asc',
          },
        },
        arquivos: {
          include: {
            arquivo: {
              select: {
                id: true,
                nome: true,
                tipo: true,
                tamanho: true,
                url: true,
              },
            },
          },
        },
        historico: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
          orderBy: {
            criadoEm: 'asc',
          },
        },
        loja: {
          include: {
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
          },
        },
      },
    });

    if (!ticket) {
      throw new AppErrorNotFound('Ticket não encontrado');
    }

    if (idLoja) {
      if (ticket.loja.id !== idLoja) {
        throw new AppErrorBadRequest('Ticket não pertence a loja');
      }
    }

    const ticketFormatado = {
      ...ticket,
      respostas: await Promise.all(
        ticket?.respostas.map(async (resposta) => ({
          ...resposta,
          arquivos: await Promise.all(
            resposta?.arquivos.map(async (arquivo) => ({
              ...arquivo,
              url: await this.pegarUrlAnexo({
                idTicket: ticket.id,
                idAnexo: arquivo.id,
              }),
            })),
          ),
        })),
      ),
      arquivos: await Promise.all(
        ticket?.arquivos.map(async (arquivo) => ({
          ...arquivo,
          url: await this.pegarUrlAnexo({
            idTicket: ticket.id,
            idAnexo: arquivo.id,
          }),
        })),
      ),
    };

    return ticketFormatado;
  }

  async responderTicket(
    idTicket: string,
    idUsuario: string,
    params: ResponderTicketDto,
    lojaId?: string,
  ) {
    const [usuario, ticket] = await Promise.all([
      this.prismaService.usuario.findUnique({
        where: {
          id: idUsuario,
        },
        select: {
          id: true,
          nome: true,
          perfil: true,
        },
      }),
      this.prismaService.ticketSuporte.findUnique({
        where: {
          id: idTicket,
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    if (!ticket) {
      throw new AppErrorNotFound('Ticket não encontrado');
    }

    if (!usuario) {
      throw new AppErrorBadRequest('Usuário não encontrado');
    }

    if (ticket.status === StatusTicketEnum.FECHADO) {
      throw new AppErrorConflict('Ticket fechado, não é possível responder');
    }

    if (usuario.perfil !== USUARIO_PERFIL.AUTOPILOT && !lojaId) {
      throw new AppErrorBadRequest('Sem permissão para responder ticket');
    }

    const data: Prisma.RespostaTicketCreateInput = {
      resposta: params.resposta,
      ticket: {
        connect: {
          id: idTicket,
        },
      },
      usuario: {
        connect: {
          id: idUsuario,
        },
      },
    };

    const resposta = await this.prismaService.respostaTicket.create({ data });

    this.criarEventoHistoricoTicket(
      idTicket,
      usuario.id,
      EventosTicketEnum.RESPONDER,
    );

    return resposta;
  }

  async alterarStatusTicket(
    idTicket: string,
    idUsuario: string,
    params: AlterarTicketDto,
  ) {
    const [usuario, ticket] = await Promise.all([
      this.prismaService.usuario.findUnique({
        where: {
          id: idUsuario,
        },
        select: {
          id: true,
          nome: true,
        },
      }),
      this.prismaService.ticketSuporte.findUnique({
        where: {
          id: idTicket,
        },
        select: {
          id: true,
          status: true,
        },
      }),
    ]);

    if (!ticket) {
      throw new AppErrorNotFound('Ticket não encontrado');
    }

    if (!usuario) {
      throw new AppErrorBadRequest('Usuário não encontrado');
    }

    if (ticket.status === params.status) {
      throw new AppErrorConflict('Status do ticket já está como solicitado');
    }

    const ticketAtualizado = await this.prismaService.ticketSuporte.update({
      where: {
        id: idTicket,
      },
      data: {
        status: params.status,
      },
    });

    this.criarEventoHistoricoTicket(
      idTicket,
      usuario.id,
      EventosTicketEnum.ALTERAR_STATUS,
    );

    return ticketAtualizado;
  }

  listarCategoriaTickets() {
    return Object.values(CategoriaTicketEnum);
  }

  listarPrioridadeTickets() {
    return Object.values(PrioridadeTicketEnum);
  }

  listarStatusTickets() {
    return Object.values(StatusTicketEnum);
  }

  async salvarAnexo(params: {
    lojaId: string;
    ticketId: string;
    arquivos: Express.Multer.File[];
    respostaId?: string;
  }) {
    const { lojaId, ticketId, arquivos, respostaId } = params;

    await this.pegarTicket(ticketId, lojaId);

    if (respostaId) {
      await this.pegarResposta(respostaId, ticketId);
    }

    const arquivosValidados = this.validarQuantidadeArquivos(arquivos);

    arquivosValidados.forEach((arquivo) => {
      if (!this.ALLOWED_MIME_TYPES.includes(arquivo.mimetype)) {
        throw new AppErrorBadRequest(
          `Um dos arquivos enviados é inválido. São aceitos um dos seguintes tipos: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
        );
      }
    });

    const arquivosSalvos = await this.prismaService.$transaction(
      async (prisma) => {
        return await Promise.all(
          arquivosValidados.map(async (arquivo) => {
            const nomeOriginal = arquivo.originalname || arquivo.filename;

            const anexo = await prisma.anexoSuporte.create({
              data: {
                idTicket: ticketId,
                idResposta: respostaId,
                nomeOriginal,
              },
              select: {
                id: true,
                idArquivo: true,
                criadoEm: true,
                atualizadoEm: true,
              },
            });

            const arquivoSalvo = await this.fileService.salvarArquivo({
              file: arquivo,
              entidade: 'anexo',
              usuarioId: ticketId,
              entidadeId: anexo.id,
            });

            await prisma.anexoSuporte.update({
              where: {
                id: anexo.id,
              },
              data: {
                idArquivo: arquivoSalvo.id,
              },
            });

            return {
              id: anexo.id,
              idResposta: respostaId,
              nome: arquivoSalvo.nome,
              nomeOriginal,
              tipo: arquivoSalvo.tipo,
              criadoEm: anexo.criadoEm,
              atualizadoEm: anexo.atualizadoEm,
            };
          }),
        );
      },
    );

    const arquivosFormatados = await Promise.all(
      arquivosSalvos.map(async (anexo) => {
        return {
          idAnexo: anexo.id,
          idResposta: anexo.idResposta,
          url: await this.pegarUrlAnexo({
            idTicket: ticketId,
            idAnexo: anexo.id,
          }),
          nome: anexo.nome,
          nomeOriginal: anexo.nomeOriginal,
          tipo: anexo.tipo,
          criadoEm: anexo.criadoEm,
          atualizadoEm: anexo.atualizadoEm,
        };
      }),
    );

    return arquivosFormatados;
  }

  async deletarAnexo(idTicket: string, idLoja: string, idAnexo: string) {
    await this.pegarTicket(idTicket, idLoja);

    const anexo = await this.prismaService.anexoSuporte.findUnique({
      where: {
        id: idAnexo,
        idTicket,
      },
    });

    if (!anexo) {
      throw new AppErrorNotFound('Anexo não encontrado');
    }

    await this.fileService.deletarArquivo(anexo.idArquivo);

    await this.prismaService.anexoSuporte.delete({
      where: {
        id: idAnexo,
      },
    });
  }

  async listarAnexos(params: {
    idTicket: string;
    idLoja: string;
    dados: ObterAnexosDto;
  }) {
    const { idTicket, idLoja, dados } = params;

    const pagina = dados.pagina ? parseInt(dados.pagina) : 1;
    const itensPorPagina = dados.itensPorPagina
      ? parseInt(dados.itensPorPagina)
      : 4;

    await this.pegarTicket(idTicket, idLoja);

    const anexos = await this.prismaService.anexoSuporte.findMany({
      where: {
        idTicket,
      },
      include: {
        arquivo: true,
      },
      take: itensPorPagina,
      skip: (pagina - 1) * itensPorPagina,
    });

    const totalAnexos = await this.prismaService.anexoSuporte.count({
      where: {
        idTicket,
      },
    });

    if (!anexos || anexos.length === 0) {
      return {
        pagina,
        itensPorPagina,
        totalPaginas: Math.ceil(totalAnexos / itensPorPagina),
        anexos: [],
      };
    }

    const anexosFormatados = await Promise.all(
      anexos.map(async (anexo) => {
        return {
          idAnexo: anexo.id,
          idResposta: anexo.idResposta,
          url: await this.pegarUrlAnexo({
            idTicket: idTicket,
            idAnexo: anexo.id,
          }),
          nome: anexo.arquivo.nome,
          tipo: anexo.arquivo.tipo,
          data: anexo.criadoEm,
        };
      }),
    );

    return {
      pagina,
      itensPorPagina,
      totalPaginas: Math.ceil(totalAnexos / itensPorPagina),
      anexos: anexosFormatados,
    };
  }

  async pegarAnexo(idTicket: string, idLoja: string, idAnexo: string) {
    const anexo = await this.prismaService.anexoSuporte.findUnique({
      where: {
        id: idAnexo,
        idTicket,
      },
      include: {
        arquivo: true,
      },
    });

    if (!anexo) {
      throw new AppErrorNotFound('Anexo não encontrado');
    }

    const anexoFormatado = {
      idAnexo: anexo.id,
      idResposta: anexo.idResposta,
      url: await this.pegarUrlAnexo({
        idTicket: idTicket,
        idAnexo: anexo.id,
      }),
      nome: anexo.arquivo.nome,
      tipo: anexo.arquivo.tipo,
      criadoEm: anexo.criadoEm,
      atualizadoEm: anexo.atualizadoEm,
    };

    return anexoFormatado;
  }
}
