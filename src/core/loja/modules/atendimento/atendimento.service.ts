import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PERMISSOES_LOJA } from 'src/core/usuario/enum/permissoes_funcionalidades.enum';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  MODO_ATENDIMENTO,
  ORIGEM_ATENDIMENTO,
  STATUS_ATENDIMENTO,
  STATUS_ATENDIMENTO_MAP,
  SUBMOTIVOS_POR_MOTIVO,
} from 'src/utils/enum/atendimento.enum';

import {
  AppErrorBadRequest,
  AppErrorForbidden,
  AppErrorNotFound,
} from 'src/utils/errors/app-errors';
import { CriarAtendimentoDto } from './dto/criar-atendimento.dto';
import { FiltroAtendimentoDto } from './dto/filtros-atendimento.dto';
import { EventoService } from './modules/eventos/evento.service';
import { EditarAtendimentoDto } from './dto/editar-atendimento.dto';
import { FileService } from 'src/persistence/files/file/file.service';
import { CriarComentarioDto } from './dto/criar-comentario.dto';
import { ListarComentariosDto } from './dto/listar-comentario.dto';
import { ObterAnexosAtendimentoDto } from './dto/obter-anexos-atendimento';
import { HistoricoClienteDto } from './dto/historico-cliente.dto';
import { getStringUrlAvatar } from 'src/utils/avatarUtils';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';
import { TiposNotificacaoEnum } from 'src/utils/enum/notificacoes.enum';
import { Remetente } from '../chat/enum/canal.enum';
import { DistribuicaoAutomaticaService } from './modules/distribuicao-automatica/distribuicao-automatica.service';
import { TagsService } from './modules/tags/tags.service';
import { normalizePhone } from 'src/utils/phone';

@Injectable()
export class AtendimentoService {
  logger = new Logger(AtendimentoService.name);
  private phoneVariationsCache = new Map<string, string[]>();
  private readonly PHONE_CACHE_TTL = 5 * 60 * 1000; // 5 min
  private phoneCacheTimestamps = new Map<string, number>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly fileService: FileService,
    private readonly eventoService: EventoService,
    private readonly notificacoesService: NotificacoesService,
    private readonly distribuicaoAutomaticaService: DistribuicaoAutomaticaService,
    private readonly tagsService: TagsService,
  ) {}

  private validarQuantidadeArquivos(files: Express.Multer.File[]) {
    if (!files || files?.length === 0) {
      return null;
    }

    if (files.length > 1) {
      throw new AppErrorBadRequest(
        'Mais de um arquivo foi enviado. Envie apenas um arquivo.',
      );
    }

    return files[0];
  }

  private async obterNomeUsuarioPorId(idUsuario: string) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: {
        id: idUsuario,
      },
      select: {
        nome: true,
      },
    });

    return usuario?.nome ?? '';
  }



  private async validarTransicaoStatus(
    statusAtual: string,
    novoStatus: string,
    idUsuario: string,
    idLoja: string,
  ) {
    const temPreVendedores = await this.prismaService.colaborador.count({
      where: {
        idLoja,
        cargos: {
          some: {
            cargo: 'Pré-vendedor',
          },
        },
      },
    });

    const temVendedores = await this.prismaService.colaborador.count({
      where: {
        idLoja,
        cargos: {
          some: {
            cargo: 'Vendedor',
          },
        },
      },
    });

    if (temPreVendedores === 0 || temVendedores === 0) {
      return;
    }

    const colaborador = await this.prismaService.colaborador.findFirst({
      where: {
        idUsuario,
        idLoja,
      },
      include: {
        cargos: {
          select: {
            cargo: true,
          },
        },
      },
    });

    if (!colaborador) {
      return;
    }

    const cargos = colaborador.cargos.map((c) => c.cargo);
    const isPreVendedor = cargos.includes('Pré-vendedor');
    const isVendedor = cargos.includes('Vendedor');

    if (isPreVendedor && !isVendedor) {
      const possuiPermissao = await this.prismaService.permissao.findFirst({
        where: {
          idUsuario,
          funcionalidade:
            PERMISSOES_LOJA.LOJA_PRE_VENDEDOR_FINALIZAR_ATENDIMENTO,
          status: 'ativo',
        },
        select: { id: true },
      });

      if (possuiPermissao) {
        return;
      }

      if (
        novoStatus === STATUS_ATENDIMENTO.PERDIDO ||
        novoStatus === STATUS_ATENDIMENTO.SUCESSO
      ) {
        throw new AppErrorForbidden(
          'Você não possui permissão para finalizar atendimentos (Perdido/Sucesso).',
        );
      }
    }

    const transicoesPreVendedor: { [key: string]: string[] } = {
      [STATUS_ATENDIMENTO.CHAT]: [
        STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.PERDIDO,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.PRE_ATENDIMENTO]: [
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.PERDIDO,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.PERDIDO]: [
        STATUS_ATENDIMENTO.RESGATE,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.RESGATE]: [
        STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.PERDIDO,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.SUCESSO]: [STATUS_ATENDIMENTO.PERDIDO],
    };

    const transicoesVendedor: { [key: string]: string[] } = {
      [STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL]: [
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.PERDIDO,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.VISITA]: [
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.PERDIDO,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.EM_NEGOCIACAO]: [
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.PERDIDO,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.PERDIDO]: [
        STATUS_ATENDIMENTO.RESGATE,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.RESGATE]: [
        STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
        STATUS_ATENDIMENTO.VISITA,
        STATUS_ATENDIMENTO.EM_NEGOCIACAO,
        STATUS_ATENDIMENTO.PERDIDO,
        STATUS_ATENDIMENTO.SUCESSO,
      ],
      [STATUS_ATENDIMENTO.SUCESSO]: [STATUS_ATENDIMENTO.PERDIDO],
    };

    if (isPreVendedor && !isVendedor) {
      const transicoesPermitidas = transicoesPreVendedor[statusAtual] || [];
      if (!transicoesPermitidas.includes(novoStatus)) {
        throw new AppErrorBadRequest(
          `Pré-vendedores não podem alterar o status de "${STATUS_ATENDIMENTO_MAP[statusAtual]}" para "${STATUS_ATENDIMENTO_MAP[novoStatus]}"`,
        );
      }
    } else if (isVendedor && !isPreVendedor) {
      const transicoesPermitidas = transicoesVendedor[statusAtual] || [];
      if (!transicoesPermitidas.includes(novoStatus)) {
        throw new AppErrorBadRequest(
          `Vendedores não podem alterar o status de "${STATUS_ATENDIMENTO_MAP[statusAtual]}" para "${STATUS_ATENDIMENTO_MAP[novoStatus]}"`,
        );
      }
    }
  }

  private async obterColaboradorPorId(idColaborador: string, idLoja: string) {
    const colaborador = await this.prismaService.colaborador.findUnique({
      where: {
        id: idColaborador,
        idLoja,
      },
    });

    if (!colaborador) {
      throw new AppErrorNotFound('Colaborador não encontrado');
    }

    return colaborador;
  }

  private async verificarAtendimentoEmAberto(
    idLoja: string,
    idCliente?: string,
    telefone?: string,
    nomeCompleto?: string,
  ) {
    const statusEmAberto = [
      STATUS_ATENDIMENTO.CHAT,
      STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
      STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
      STATUS_ATENDIMENTO.VISITA,
      STATUS_ATENDIMENTO.EM_NEGOCIACAO,
      STATUS_ATENDIMENTO.RESGATE,
    ];

    let whereCondition: any = {
      idLoja,
      status: {
        in: statusEmAberto,
      },
      isArchived: false,
    };

    if (idCliente) {
      whereCondition.idCliente = idCliente;
    } else {
      const orConditions = [];

      if (telefone) {
        const telefoneNormalizado = normalizePhone(telefone);
        orConditions.push({
          clienteTemporario: {
            whatsapp: telefoneNormalizado,
          },
        });

        if (telefoneNormalizado.length === 13) {
          const telefoneAlternativo = telefoneNormalizado.substring(0, 4) + telefoneNormalizado.substring(5);
          orConditions.push({
            clienteTemporario: {
              whatsapp: telefoneAlternativo,
            },
          });
        }
      }

      if (orConditions.length > 0) {
        whereCondition.OR = orConditions;
      } else {
        return null;
      }
    }

    const atendimentoExistente = await this.prismaService.atendimento.findFirst({
      where: whereCondition,
      include: {
        atendimentoResponsaveis: {
          include: {
            colaborador: {
              include: {
                usuario: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
        cliente: {
          select: {
            nome: true,
            telefone: true,
          },
        },
        clienteTemporario: {
          select: {
            nome: true,
            whatsapp: true,
          },
        },
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    return atendimentoExistente;
  }

  private async gerenciarResponsaveisTransicaoStatus(
    atendimento: any,
    params: EditarAtendimentoDto,
    responsaveisAtendimento: string[],
    idAtendimento: string,
    idLoja: string,
    loja: any,
  ): Promise<void> {
    if (params.idResponsaveis && params.idResponsaveis.length > 0) {
      return;
    }

    if (atendimento.status === params.status) {
      return;
    }

    const statusAtual = atendimento.status;
    const novoStatus = params.status;
    const responsaveisNaoDefinidos =
      !params.idResponsaveis || params.idResponsaveis.length === 0;

    if (!responsaveisNaoDefinidos) {
      return;
    }

    if (
      statusAtual === STATUS_ATENDIMENTO.CHAT &&
      novoStatus === STATUS_ATENDIMENTO.PRE_ATENDIMENTO
    ) {
      params.idResponsaveis = responsaveisAtendimento;
      return;
    }

    const statusesQueRequeremVendedor = [
      STATUS_ATENDIMENTO.ATENDIMENTO_INICIAL,
      STATUS_ATENDIMENTO.VISITA,
      STATUS_ATENDIMENTO.EM_NEGOCIACAO,
    ];

    if (
      statusAtual === STATUS_ATENDIMENTO.PRE_ATENDIMENTO &&
      statusesQueRequeremVendedor.includes(novoStatus as STATUS_ATENDIMENTO)
    ) {
      await this.processarTransicaoComVendedor(
        params,
        responsaveisAtendimento,
        idAtendimento,
        idLoja,
        loja,
      );
      return;
    }

    const statusesPreservacao = [
      STATUS_ATENDIMENTO.VISITA,
      STATUS_ATENDIMENTO.EM_NEGOCIACAO,
    ];
    if (
      statusAtual !== STATUS_ATENDIMENTO.PRE_ATENDIMENTO &&
      statusesPreservacao.includes(novoStatus as STATUS_ATENDIMENTO)
    ) {
      params.idResponsaveis = responsaveisAtendimento;
      return;
    }
  }

  private async processarTransicaoComVendedor(
    params: EditarAtendimentoDto,
    responsaveisAtendimento: string[],
    idAtendimento: string,
    idLoja: string,
    loja: any,
  ): Promise<void> {
    const responsavelVendedor =
      await this.buscarVendedorResponsavel(idAtendimento);

    if (responsavelVendedor) {
      params.idResponsaveis = loja?.distribuicaoAutomatica
        ? responsaveisAtendimento
        : [responsavelVendedor.colaborador.id];
    } else {
      const idVendedor =
        await this.distribuicaoAutomaticaService.obterColaboradorParaDistribuicao(
          idLoja,
          'Vendedor',
        );

      if (idVendedor) {
        params.idResponsaveis = loja?.distribuicaoAutomatica
          ? [...responsaveisAtendimento, idVendedor]
          : [idVendedor];
      }
    }
  }

  private async buscarVendedorResponsavel(idAtendimento: string) {
    return this.prismaService.atendimentoResponsaveis.findFirst({
      where: {
        idAtendimento,
        colaborador: {
          cargos: {
            some: {
              cargo: 'Vendedor',
            },
          },
        },
      },
      include: {
        colaborador: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  private async criarAtendimento(
    data: CriarAtendimentoDto,
    idLoja: string,
    clienteTemp: boolean,
    idUsuario?: string,
  ) {
    let idCliente = data.idCliente;

    if (data.telefone) {
      data.telefone = normalizePhone(data.telefone);
    }

    if (idUsuario) {
      const colaboradorCriador = await this.prismaService.colaborador.findFirst(
        {
          where: {
            idUsuario,
            idLoja,
          },
          include: {
            cargos: {
              select: {
                cargo: true,
              },
            },
          },
        },
      );

      if (colaboradorCriador) {
        const cargos = colaboradorCriador.cargos.map((c) => c.cargo);
        const isAtendente = cargos.includes('Atendente');

        if (isAtendente) {
          data.idResponsaveis = [colaboradorCriador.id];
        }
      }
    }

    if (!data.idResponsaveis || data.idResponsaveis.length === 0) {
      let tipoColaborador: 'Pré-vendedor' | 'Vendedor' | undefined;

      if (data.status === 'preAtendimento' || data.status === 'chat') {
        tipoColaborador = 'Pré-vendedor';
      } else if (
        data.status === 'atendimentoInicial' ||
        data.status === 'visita' ||
        data.status === 'emNegociacao'
      ) {
        tipoColaborador = 'Vendedor';
      }
      const idColaboradorAutomatico =
        await this.distribuicaoAutomaticaService.obterColaboradorParaDistribuicao(
          idLoja,
          tipoColaborador,
        );

      if (idColaboradorAutomatico) {
        data.idResponsaveis = [idColaboradorAutomatico];
      }
    }

    const atendimento = await this.prismaService.$transaction(
      async (prisma) => {
        const atendimentoCriado = await prisma.atendimento.create({
          data: {
            idLoja,
            origemAtendimento: data.origemAtendimento,
            temperatura: data.temperatura,
            titulo: data.titulo,
            descricaoAtendimento: data.descricaoAtendimento,
            observacao: data.observacao,
            modoAtendimento: data.modoAtendimento,
            status: data?.status || STATUS_ATENDIMENTO.PRE_ATENDIMENTO,
            atendimentoManual: data.atendimentoManual ?? false,
          },
          include: {
            loja: {
              include: {
                lojista: true,
              },
            },
          },
        });

        if (data.idResponsaveis) {
          await Promise.all(
            data.idResponsaveis.map(async (id) => {
              return prisma.atendimentoResponsaveis.create({
                data: {
                  idAtendimento: atendimentoCriado.id,
                  idColaborador: id,
                  idLoja,
                },
              });
            }),
          );
        }

        if (data.idChat) {
          const chat = await prisma.chat.update({
            where: {
              id: data.idChat,
            },
            data: {
              idAtendimento: atendimentoCriado.id,
            },
          });

          if (!chat) {
            throw new AppErrorNotFound('Chat não encontrado');
          }

          if (chat.idClienteTemporario) {
            const clienteTemporarioExistente =
              await prisma.clienteTemporario.findUnique({
                where: { id: chat.idClienteTemporario },
                select: { avatar: true },
              });

            await prisma.clienteTemporario.upsert({
              where: {
                id: chat.idClienteTemporario,
              },
              update: {
                nome: data.nomeCompleto,
                email: data.email,
                whatsapp: data.telefone,
                avatar: clienteTemporarioExistente?.avatar,
              },
              create: {
                nome: data.nomeCompleto,
                email: data.email,
                whatsapp: data.telefone,
                canal: data.origemAtendimento,
                idContatoApiExterna: chat.idDestinatarioApiExterna,
              },
            });

            await prisma.atendimento.update({
              where: { id: atendimentoCriado.id },
              data: { idClienteTemporario: chat.idClienteTemporario },
            });
          } else if (chat.idCliente) {
            await prisma.atendimento.update({
              where: { id: atendimentoCriado.id },
              data: { idCliente: chat.idCliente },
            });
          }
        }

        return atendimentoCriado;
      },
    );

    if (data.idTags && data.idTags.length > 0) {
      await this.tagsService.linkTagsToTicket(idLoja, atendimento.id, {
        tags: data.idTags,
      });
    }

    if (data.idChat) {
      const chat = await this.prismaService.chat.findUnique({
        where: {
          id: data.idChat,
        },
      });

      if (chat) {
        await this.prismaService.mensagem.create({
          data: {
            remetente: Remetente.SISTEMA,
            idChat: data.idChat,
            conteudo: `Chat vinculado ao atendimento ${data.titulo}`,
            canal: chat.canal,
          },
        });
      }
    }

    if (clienteTemp) {
      let clienteTemporario = await this.prismaService.clienteTemporario.findFirst({
        where: {
          whatsapp: data.telefone,
          chat: {
            some: {
              idLoja: idLoja,
            },
          },
        },
        include: {
          chat: {
            where: {
              idLoja: idLoja,
            },
          },
        },
      });

      if (!clienteTemporario && data.telefone && data.telefone.length === 13) {
        const telefoneAlternativo = data.telefone.substring(0, 4) + data.telefone.substring(5);
        
        clienteTemporario = await this.prismaService.clienteTemporario.findFirst({
          where: {
            whatsapp: telefoneAlternativo,
            chat: {
              some: {
                idLoja: idLoja,
              },
            },
          },
          include: {
            chat: {
              where: {
                idLoja: idLoja,
              },
            },
          },
        });
      }

      if (!clienteTemporario) {
        clienteTemporario = await this.prismaService.clienteTemporario.create({
          data: {
            nome: data.nomeCompleto,
            email: data.email,
            whatsapp: data.telefone,
            canal: data.origemAtendimento,
            idContatoApiExterna: '',
          },
          include: {
            chat: {
              where: {
                idLoja,
              },
            },
          },
        });
      } else {
        await this.prismaService.clienteTemporario.update({
          where: { id: clienteTemporario.id },
          data: {
            nome: data.nomeCompleto || clienteTemporario.nome,
            email: data.email || clienteTemporario.email,
          },
        });

        const chatExistente = clienteTemporario.chat?.[0];
        
        if (chatExistente && !chatExistente.idAtendimento) {
          await this.prismaService.chat.update({
            where: { id: chatExistente.id },
            data: { idAtendimento: atendimento.id },
          });

          await this.prismaService.mensagem.create({
            data: {
              remetente: Remetente.SISTEMA,
              idChat: chatExistente.id,
              conteudo: `Chat vinculado ao atendimento ${data.titulo}`,
              canal: chatExistente.canal,
            },
          });
        } else if (chatExistente) {
          console.log('Chat já possui atendimento vinculado:', chatExistente.idAtendimento);
        } else {
          console.log('Nenhum chat encontrado para vincular');
        }
      }

      idCliente = clienteTemporario.id;
    }

    const nomeParametro = clienteTemp ? 'idClienteTemporario' : 'idCliente';

    const atendimentoAtualizado = await this.prismaService.atendimento.update({
      where: { id: atendimento.id },
      data: { [nomeParametro]: idCliente },
      include: {
        atendimentoResponsaveis: {
          select: {
            colaborador: {
              select: {
                usuario: true,
              },
            },
          },
        },
      },
    });

    const nomesResponsaveis = atendimentoAtualizado.atendimentoResponsaveis
      .map((responsavel) => responsavel.colaborador.usuario.nome)
      .join(', ');

    await this.notificacoesService.criarNovaNotificacao({
      idUsuario: atendimento.loja.lojista.idUsuario,
      idReferencia: atendimento.id,
      tipo: TiposNotificacaoEnum.NOVO_ATENDIMENTO,
      mensagem: `Um novo atendimento foi criado para ${nomesResponsaveis}`,
    });

    return {
      ...atendimentoAtualizado,
      atendimentoResponsaveis: undefined,
    };
  }

  private async criarNotificacaoAtendimento(params: {
    idAtendimento: string;
    idsColaboradores?: string[];
    idsUsuarios?: string[];
    mensagem: string;
    tipo: TiposNotificacaoEnum;
  }) {
    const {
      idAtendimento,
      idsColaboradores,
      idsUsuarios = [],
      mensagem,
      tipo,
    } = params;
    try {
      let usuariosColaboradores: string[] = [];

      if (idsColaboradores && idsColaboradores.length > 0) {
        const colaboradores = await this.prismaService.colaborador.findMany({
          where: {
            id: {
              in: idsColaboradores,
            },
          },
          select: {
            idUsuario: true,
          },
        });
        usuariosColaboradores = colaboradores.map(
          (colaborador) => colaborador.idUsuario,
        );
      }

      const idsNotificados = [...usuariosColaboradores, ...idsUsuarios];
      const idNotificadosUnicos = [...new Set(idsNotificados)];

      await Promise.all(
        idNotificadosUnicos.map(async (idUsuario) => {
          await this.notificacoesService.criarNovaNotificacao({
            idUsuario,
            idReferencia: idAtendimento,
            tipo,
            mensagem,
          });
        }),
      );
    } catch (error) {
      console.error(error);
    }
  }

  async obterAtendimentoPorId(idAtendimento: string, idLoja: string) {
    const atendimento = await this.prismaService.atendimento.findUnique({
      where: {
        id: idAtendimento,
        idLoja,
      },
      include: {
        atendimentoTags: {
          select: {
            tag: {
              select: {
                id: true,
                nome: true,
                descricao: true,
                cor: true,
              },
            },
          },
        },
        cliente: {
          select: {
            id: true,
            whatsapp: true,
            email: true,
            urlAvatar: true,
            nome: true,
          },
        },
        clienteTemporario: {
          select: {
            id: true,
            whatsapp: true,
            email: true,
            avatar: true,
            nome: true,
          },
        },
        atendimentoResponsaveis: {
          include: {
            colaborador: {
              select: {
                id: true,
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
        chat: true,
        comentariosAtendimento: {
          orderBy: {
            criadoEm: 'desc',
          },
          include: {
            usuario: {
              select: {
                id: true,
                colaborador: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
                lojista: {
                  select: {
                    id: true,
                    loja: {
                      select: {
                        nomeEmpresa: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        tarefasAtendimento: {
          orderBy: {
            data: 'asc',
          },
          include: {
            colaborador: {
              select: {
                id: true,
                nome: true,
                idUsuario: true,
              },
            },
          },
        },
      },
    });

    if (!atendimento) {
      throw new AppErrorNotFound('Atendimento não encontrado');
    }

    const responsaveis = atendimento.atendimentoResponsaveis?.map(
      (responsavel) => {
        return {
          idColaborador: responsavel.idColaborador,
          nome: responsavel.colaborador?.nome || '',
          avatarUrl: getStringUrlAvatar(responsavel.colaborador?.idUsuario),
          idUsuario: responsavel.colaborador?.idUsuario,
          cargos:
            responsavel.colaborador?.cargos
              .map((cargo) => cargo.cargo)
              .join(', ') || '',
        };
      },
    );

    const comentarios = atendimento.comentariosAtendimento?.map(
      (comentario) => {
        const usuario = comentario.usuario.colaborador
          ? comentario.usuario.colaborador.nome
          : comentario.usuario.lojista.loja.nomeEmpresa;

        return {
          idComentario: comentario.id,
          idUsuario: comentario.idUsuario,
          usuario,
          urlAvatar: getStringUrlAvatar(comentario.idUsuario),
          data: comentario.criadoEm,
        };
      },
    );

    const tarefas = atendimento.tarefasAtendimento?.map((tarefa) => {
      return {
        idTarefa: tarefa.id,
        observacoes: tarefa.observacoes || '',
        nome: tarefa.nome,
        data: tarefa.data,
        horaInicio: tarefa.horaInicio,
        horaFim: tarefa.horaFim,
        concluida: tarefa.concluida,
        criadoEm: tarefa.criadoEm,
        nomeResponsavel: tarefa.colaborador?.nome || '',
        avatarResponsavel: getStringUrlAvatar(tarefa.colaborador?.idUsuario),
      };
    });

    const atendimentoFormatado = {
      ...atendimento,
      totalTarefas: atendimento.tarefasAtendimento?.length || 0,
      totalComentarios: atendimento.comentariosAtendimento?.length || 0,
      atendimentoResponsaveis: undefined,
      comentariosAtendimento: undefined,
      tarefasAtendimento: undefined,
      responsaveis,
      comentarios,
      tarefas,
      chats: atendimento.chat,
    };

    return atendimentoFormatado;
  }

  async criar(params: CriarAtendimentoDto, idLoja: string, idUsuario: string) {
    if (!idLoja) {
      throw new AppErrorNotFound('Loja não informada');
    }

    if (params.idChat) {
      const chat = await this.prismaService.chat.findUnique({
        where: {
          id: params.idChat,
        },
      });

      if (!chat) {
        throw new AppErrorNotFound('Chat não encontrado');
      }
    }

    if (params.idResponsaveis) {
      await Promise.all(
        params.idResponsaveis.map(async (idColaborador) => {
          return this.obterColaboradorPorId(idColaborador, idLoja);
        }),
      );
    }

    const atendimentoExistente = await this.verificarAtendimentoEmAberto(
      idLoja,
      params.idCliente,
      params.telefone,
      params.nomeCompleto,
    );

    if (atendimentoExistente) {
      const nomeCliente = atendimentoExistente.cliente?.nome || 
                         atendimentoExistente.clienteTemporario?.nome || 
                         'Cliente não identificado';
      
      const telefoneCliente = atendimentoExistente.cliente?.telefone || 
                             atendimentoExistente.clienteTemporario?.whatsapp || 
                             'Telefone não informado';

      const responsaveis = atendimentoExistente.atendimentoResponsaveis
        .map(resp => resp.colaborador.usuario.nome)
        .join(', ') || 'Não atribuído';

      const statusAtual = STATUS_ATENDIMENTO_MAP[atendimentoExistente.status] || atendimentoExistente.status;

      throw new AppErrorBadRequest(
        `Já existe um atendimento em aberto para este contato.\n\n` +
        `Cliente: ${nomeCliente}\n` +
        `Telefone: ${telefoneCliente}\n` +
        `Status atual: ${statusAtual}\n` +
        `Responsável(is): ${responsaveis}\n` +
        `Atendimento ID: ${atendimentoExistente.id}\n\n` +
        `Finalize o atendimento existente antes de criar um novo.`
      );
    }

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    if (params.idCliente) {
      const atendimento = await this.criarAtendimento(
        params,
        idLoja,
        false,
        idUsuario,
      );

      if (params.idResponsaveis) {
        await Promise.all(
          params.idResponsaveis.map(async (idColaborador) => {
            const colaborador = await this.prismaService.colaborador.findUnique(
              {
                where: {
                  id: idColaborador,
                  idLoja,
                },
              },
            );

            this.notificacoesService.criarNovaNotificacao({
              idUsuario: colaborador.idUsuario,
              idReferencia: atendimento.id,
              tipo: TiposNotificacaoEnum.NOVO_ATENDIMENTO,
              mensagem: `Um novo atendimento foi atribuído a você por ${nomeUsuarioLogado}`,
            });
          }),
        );
      }

      if (
        params.observacao &&
        params.observacao !== '' &&
        params.observacao.length > 0
      ) {
        this.prismaService.comentariosAtendimento.create({
          data: {
            idAtendimento: atendimento.id,
            idUsuario,
            comentario: params.observacao,
          },
        });
        await this.prismaService.atendimento.update({where: {id: atendimento.id}, data: {atualizadoEm: new Date()}})
      }

      return atendimento;
    }

    if (!params.nomeCompleto) {
      throw new AppErrorBadRequest('Nome do cliente temporário não informado');
    }

    const atendimento = await this.criarAtendimento(
      params,
      idLoja,
      true,
      idUsuario,
    );

    if (!atendimento) {
      throw new AppErrorNotFound('Não foi possível criar o atendimento');
    }

    if (
      params.observacao &&
      params.observacao !== '' &&
      params.observacao.length > 0
    ) {
      this.prismaService.comentariosAtendimento.create({
        data: {
          idAtendimento: atendimento.id,
          idUsuario,
          comentario: params.observacao,
        },
      });
      await this.prismaService.atendimento.update({where: {id: atendimento.id}, data: {atualizadoEm: new Date()}})
    }

    if (params.idResponsaveis && params.idResponsaveis.length > 0) {
      await this.criarNotificacaoAtendimento({
        idAtendimento: atendimento.id,
        idsColaboradores: params.idResponsaveis,
        mensagem: `Um novo atendimento foi atribuído a você por ${nomeUsuarioLogado}`,
        tipo: TiposNotificacaoEnum.NOVO_ATENDIMENTO,
      });
    }

    this.eventoService.emitAtendimentoCriado({
      idAtendimento: atendimento.id,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosNovos: {
        titulo: atendimento.titulo,
        status: atendimento.status,
        temperatura: atendimento.temperatura,
        origemAtendimento: atendimento.origemAtendimento,
      },
    });

    return atendimento;
  }

  async editarAtendimento(
    idAtendimento: string,
    idLoja: string,
    params: EditarAtendimentoDto,
    idUsuario: string,
  ) {    
    const atendimento = await this.obterAtendimentoPorId(idAtendimento, idLoja);

    if (params.idResponsaveis) {
      await Promise.all(
        params.idResponsaveis.map(async (idColaborador) => {
          return this.obterColaboradorPorId(idColaborador, idLoja);
        }),
      );
    }

    const loja = await this.prismaService.loja.findUnique({
      where: {
        id: idLoja,
      },
      select: {
        distribuicaoAutomatica: true,
        lojista: {
          select: {
            idUsuario: true,
          },
        },
      },
    });

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    const colaboradorUsuario = await this.prismaService.colaborador.findFirst({
      where: {
        idUsuario,
        idLoja,
      },
    });

    const responsaveisAtendimento = atendimento.responsaveis?.map(
      (responsavel) => responsavel.idColaborador,
    ) || [];

    const isResponsavel =
      colaboradorUsuario &&
      responsaveisAtendimento.some((id) => id === colaboradorUsuario.id);
    const isLojista = loja.lojista?.idUsuario === idUsuario;

    if (!isResponsavel && !isLojista) {
      throw new AppErrorForbidden(
        'Você não tem permissão para editar esse atendimento',
      );
    }

    if (params.status && atendimento.status !== params.status) {
      await this.validarTransicaoStatus(
        atendimento.status,
        params.status,
        idUsuario,
        idLoja,
      );
    }

    if (params.subMotivoPerdido && params.motivoPerdido) {
      const submotivosValidos = SUBMOTIVOS_POR_MOTIVO[params.motivoPerdido];
      if (!submotivosValidos || !submotivosValidos.includes(params.subMotivoPerdido)) {
        throw new AppErrorBadRequest(
          `Submotivo "${params.subMotivoPerdido}" não é válido para o motivo "${params.motivoPerdido}". Submotivos válidos: ${submotivosValidos?.join(', ') || 'nenhum'}`
        );
      }
    }

    const { motivoPerdido, subMotivoPerdido, idTags, ...paramsLimpos } = params;
    const dadosEdicao = {
      ...paramsLimpos,
      idResponsaveis: undefined,
    };

    await this.gerenciarResponsaveisTransicaoStatus(
      atendimento,
      params,
      responsaveisAtendimento,
      idAtendimento,
      idLoja,
      loja,
    );

    const responsaveisRemovidos = responsaveisAtendimento.filter(
      (id) => !params.idResponsaveis?.includes(id),
    );
    const responsaveisAdicionados = params.idResponsaveis?.filter(
      (id) => !responsaveisAtendimento.includes(id),
    );

    const [atendimentoEditado, ..._] = await this.prismaService.$transaction([
      this.prismaService.atendimento.update({
        where: {
          id: idAtendimento,
          idLoja,
        },
        data: {
          ...dadosEdicao,
        },
      }),
      ...responsaveisRemovidos.map((idColaborador) => {
        return this.prismaService.atendimentoResponsaveis.deleteMany({
          where: {
            idAtendimento,
            idColaborador,
          },
        });
      }),
      ...responsaveisAdicionados.map((idColaborador) => {
        return this.prismaService.atendimentoResponsaveis.create({
          data: {
            idAtendimento,
            idLoja,
            idColaborador,
          },
        });
      }),
    ]);

    if (params.idTags !== undefined) {
      await this.prismaService.$transaction(async (prisma) => {
        await prisma.atendimentoTag.deleteMany({
          where: { idAtendimento },
        });

        if (params.idTags.length > 0) {
          const tagsExistentes = await prisma.tag.findMany({
            where: {
              id: { in: params.idTags },
              idLoja,
            },
            select: { id: true },
          });

          const idsTagsExistentes = tagsExistentes.map((tag) => tag.id);
          const tagsInvalidas = params.idTags.filter(
            (idTag) => !idsTagsExistentes.includes(idTag),
          );

          if (tagsInvalidas.length > 0) {
            throw new AppErrorNotFound(
              `Tags não encontradas ou não pertencem à loja: ${tagsInvalidas.join(', ')}`,
            );
          }

          await prisma.atendimentoTag.createMany({
            data: params.idTags.map((idTag) => ({
              idAtendimento,
              idTag,
            })),
          });
        }
      });
    }
    this.eventoService.emitAtendimentoEditado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosAntigos: {
        status: atendimento.status,
        titulo: atendimento.titulo,
        observacao: atendimento.observacao,
        temperatura: atendimento.temperatura,
        modoAtendimento: atendimento.modoAtendimento,
      },
      dadosNovos: {
        status: atendimentoEditado.status,
        titulo: atendimentoEditado.titulo,
        observacao: atendimentoEditado.observacao,
        temperatura: atendimentoEditado.temperatura,
        modoAtendimento: atendimentoEditado.modoAtendimento,
      },
      contexto: {
        detalhes: {
          responsaveisAdicionados,
          responsaveisRemovidos,
          motivoPerdido,
          subMotivoPerdido,
        },
      },
    });

    if (responsaveisRemovidos && responsaveisRemovidos.length > 0) {
      await this.criarNotificacaoAtendimento({
        idAtendimento,
        idsColaboradores: responsaveisRemovidos,
        mensagem: `O atendimento ${atendimento.titulo} foi removido de você por ${nomeUsuarioLogado}`,
        tipo: TiposNotificacaoEnum.ATENDIMENTO_TRANSFERIDO,
      });
    }

    if (responsaveisAdicionados && responsaveisAdicionados.length > 0) {
      await this.criarNotificacaoAtendimento({
        idAtendimento,
        idsColaboradores: responsaveisAdicionados,
        mensagem: `O atendimento ${atendimentoEditado.titulo} foi atribuído a você por ${nomeUsuarioLogado}`,
        tipo: TiposNotificacaoEnum.ATENDIMENTO_TRANSFERIDO,
      });
    }

    if (atendimento.status !== atendimentoEditado.status) {
      await this.criarNotificacaoAtendimento({
        idAtendimento,
        idsColaboradores: params.idResponsaveis,
        mensagem: `O atendimento ${atendimento.titulo} foi alterado para ${STATUS_ATENDIMENTO_MAP[atendimentoEditado.status]} por ${nomeUsuarioLogado}`,
        tipo: TiposNotificacaoEnum.ATENDIMENTO_TRANSFERIDO,
      });
    }

    if (
      atendimentoEditado.status === STATUS_ATENDIMENTO.PERDIDO &&
      params.motivoPerdido &&
      params.observacao &&
      params.observacao !== ''
    ) {
      await this.prismaService.comentariosAtendimento.create({
        data: {
          idAtendimento,
          idUsuario,
          comentario: params.observacao,
          motivoPerdido: params.motivoPerdido,
          subMotivoPerdido: params.subMotivoPerdido,
        },
      });
      await this.prismaService.atendimento.update({where: {id: idAtendimento}, data: {atualizadoEm: new Date()}})
    } else if (
      atendimento.status !== atendimentoEditado.status &&
      atendimentoEditado.status !== STATUS_ATENDIMENTO.PERDIDO &&
      params.observacao &&
      params.observacao !== ''
    ) {
      await this.prismaService.comentariosAtendimento.create({
        data: {
          idAtendimento,
          idUsuario,
          comentario: params.observacao,
        },
      });
      await this.prismaService.atendimento.update({where: {id: idAtendimento}, data: {atualizadoEm: new Date()}})
    }    
    return atendimentoEditado;
  }

  async obterAnexosAtendimento(
    idAtendimento: string,
    idLoja: string,
    params: ObterAnexosAtendimentoDto,
  ) {
    const pagina = params.pagina ? parseInt(params.pagina) : 1;
    const itensPorPagina = params.itensPorPagina
      ? parseInt(params.itensPorPagina)
      : 4;

    await this.obterAtendimentoPorId(idAtendimento, idLoja);

    const anexos = await this.prismaService.anexoAtendimento.findMany({
      where: {
        idAtendimento,
      },
      include: {
        arquivo: true,
      },
      take: itensPorPagina,
      skip: (pagina - 1) * itensPorPagina,
    });

    const totalAnexos = await this.prismaService.anexoAtendimento.count({
      where: {
        idAtendimento,
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

    const anexosFormatados = anexos.map((anexo) => {
      return {
        idAnexo: anexo.id,
        url: anexo.arquivo.url,
        nome: anexo.arquivo.nome,
        tipo: anexo.arquivo.tipo,
        data: anexo.criadoEm,
        nomeOriginal: anexo.nomeOriginal,
      };
    });

    return {
      pagina,
      itensPorPagina,
      totalPaginas: Math.ceil(totalAnexos / itensPorPagina),
      anexos: anexosFormatados,
    };
  }

  async salvarAnexo(
    idLoja: string,
    idUsuario: string,
    idAtendimento: string,
    arquivos: Express.Multer.File[],
  ) {
    const arquivo = this.validarQuantidadeArquivos(arquivos);

    if (!arquivo) {
      throw new AppErrorBadRequest(
        'É necessário enviar um arquivo para salvar o anexo.',
      );
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/png',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(arquivo.mimetype)) {
      throw new AppErrorBadRequest(
        `Tipo de arquivo inválido. São aceitos um dos seguintes tipos: ${allowedMimeTypes.join(', ')}`,
      );
    }

    const nomeOriginal = arquivo.originalname || arquivo.filename;

    const arquivoSalvo = await this.prismaService.$transaction(
      async (prisma) => {
        const arquivoSalvo = await this.fileService.salvarArquivo({
          file: arquivo,
          entidade: 'anexo',
          usuarioId: idLoja,
          entidadeId: idAtendimento,
        });

        const anexoSalvo = await prisma.anexoAtendimento.create({
          data: {
            idAtendimento,
            idArquivo: arquivoSalvo.id,
            nomeOriginal,
          },
          select: {
            id: true,
            idArquivo: true,
            atualizadoEm: true,
            nomeOriginal: true,
          },
        });

        return {
          ...arquivoSalvo,
          id: anexoSalvo.id,
          idArquivo: anexoSalvo.idArquivo,
          atualizadoEm: anexoSalvo.atualizadoEm,
          nomeOriginal: anexoSalvo.nomeOriginal,
        };
      },
    );

    this.eventoService.emitAtendimentoEditado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosNovos: {
        anexo: {
          nome: arquivoSalvo.nome,
          id: arquivoSalvo.id,
        },
      },
      contexto: {
        detalhes: {
          acao: 'anexo_adicionado',
        },
      },
    });

    return {
      url: arquivoSalvo.url,
      idAnexo: arquivoSalvo.id,
      idArquivo: arquivoSalvo.idArquivo,
      data: arquivoSalvo.atualizadoEm,
      nomeOriginal: arquivoSalvo.nomeOriginal,
    };
  }

  async deletarAnexo(
    idAtendimento: string,
    idUsuario: string,
    idLoja: string,
    idAnexo: string,
  ) {
    if (!idAtendimento || !idLoja || !idAnexo) {
      throw new AppErrorBadRequest(
        'ID do atendimento, loja ou anexo não informado',
      );
    }

    const atendimento = await this.prismaService.atendimento.findUnique({
      where: { id: idAtendimento, idLoja },
    });

    if (!atendimento) {
      throw new AppErrorNotFound('Atendimento não encontrado');
    }

    const anexo = await this.prismaService.anexoAtendimento.findUnique({
      where: { id: idAnexo, idAtendimento },
    });

    if (!anexo) {
      return;
    }

    await this.prismaService.anexoAtendimento.delete({
      where: { id: idAnexo, idAtendimento },
    });

    this.eventoService.emitAtendimentoEditado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosAntigos: {
        anexo: {
          nome: anexo?.nomeOriginal,
          id: idAnexo,
        },
      },
      contexto: {
        detalhes: {
          acao: 'anexo_removido',
        },
      },
    });

    try {
      await this.fileService.deletarArquivo(anexo.idArquivo);
    } catch (error) {
      this.logger.warn(`Erro ao deletar arquivo do Firebase: ${error.message}`);
    }
  }

  private generatePhoneVariations(cleanTerm: string): string[] {
    const cacheKey = cleanTerm;
    const now = Date.now();

    if (this.phoneVariationsCache.has(cacheKey)) {
      const timestamp = this.phoneCacheTimestamps.get(cacheKey) || 0;
      if (now - timestamp < this.PHONE_CACHE_TTL) {
        return this.phoneVariationsCache.get(cacheKey)!;
      }
    }

    const variations = new Set([cleanTerm]);

    if (!cleanTerm.startsWith('55') && cleanTerm.length >= 8) {
      variations.add('55' + cleanTerm);
    }

    if (cleanTerm.startsWith('55') && cleanTerm.length > 10) {
      variations.add(cleanTerm.substring(2));
    }

    if (cleanTerm.length >= 4 && cleanTerm.length <= 9) {
      const dddsComuns = ['11', '21', '31', '41', '51', '61', '71', '81', '85'];
      dddsComuns.forEach((ddd) => {
        if (!cleanTerm.startsWith(ddd)) {
          variations.add(ddd + cleanTerm);
          variations.add('55' + ddd + cleanTerm);
        }
      });
    }

    const result = Array.from(variations);

    this.phoneVariationsCache.set(cacheKey, result);
    this.phoneCacheTimestamps.set(cacheKey, now);

    return result;
  }

  private async createPhoneSearchConditions(
    searchTerm: string,
    idLoja: string,
  ): Promise<Prisma.AtendimentoWhereInput[]> {
    const cleanTerm = searchTerm.replace(/\D+/g, '');
    if (!cleanTerm || cleanTerm.length < 3) return [];

    try {
      const variations = this.generatePhoneVariations(cleanTerm);

      const placeholders = variations.map(() => '?').join(',');

      const atendimentosComTelefone = await this.prismaService.$queryRaw<
        { id: string }[]
      >`
        SELECT DISTINCT a.id
        FROM "atendimento" a
        LEFT JOIN "cliente" c ON a."id_cliente" = c.id
        LEFT JOIN "cliente_temporario" ct ON a."id_cliente_temporario" = ct.id
        WHERE a."id_loja" = ${idLoja}
        AND (
          EXISTS (
            SELECT 1 FROM unnest(ARRAY[${Prisma.join(variations)}]) AS v(variation)
            WHERE (
              REGEXP_REPLACE(COALESCE(c.telefone, ''), '[^0-9]', '', 'g') LIKE '%' || v.variation || '%'
              OR REGEXP_REPLACE(COALESCE(c.whatsapp, ''), '[^0-9]', '', 'g') LIKE '%' || v.variation || '%'
              OR REGEXP_REPLACE(COALESCE(ct.whatsapp, ''), '[^0-9]', '', 'g') LIKE '%' || v.variation || '%'
            )
          )
        )
      `;

      if (atendimentosComTelefone.length === 0) {
        return [];
      }

      return [
        {
          id: {
            in: atendimentosComTelefone.map((item) => item.id),
          },
        },
      ];
    } catch (error) {
      this.logger.error('Erro na busca otimizada por telefone:', error);

      return this.createSimplePhoneSearchFallback(cleanTerm);
    }
  }

  private createSimplePhoneSearchFallback(
    cleanTerm: string,
  ): Prisma.AtendimentoWhereInput[] {
    const variations = this.generatePhoneVariations(cleanTerm);

    return variations.flatMap((variation) => [
      {
        cliente: {
          telefone: { contains: variation, mode: 'insensitive' as const },
        },
      },
      {
        cliente: {
          whatsapp: { contains: variation, mode: 'insensitive' as const },
        },
      },
      {
        clienteTemporario: {
          whatsapp: { contains: variation, mode: 'insensitive' as const },
        },
      },
    ]);
  }

  private isPhoneSearch(term: string): boolean {
    const cleanTerm = term.replace(/\D+/g, '');
    return (
      cleanTerm.length >= 3 && cleanTerm.length <= 15 && /\d{3,}/.test(term)
    );
  }

  private async buildSearchConditions(
    pesquisa: string,
    idLoja: string,
  ): Promise<Prisma.AtendimentoWhereInput> {
    if (!pesquisa || pesquisa.trim() === '') {
      return {};
    }

    const isPhone = this.isPhoneSearch(pesquisa);

    const baseTextConditions = [
      {
        cliente: {
          email: { contains: pesquisa, mode: 'insensitive' as const },
        },
      },
      {
        cliente: {
          nome: { contains: pesquisa, mode: 'insensitive' as const },
        },
      },
      {
        clienteTemporario: {
          email: { contains: pesquisa, mode: 'insensitive' as const },
        },
      },
      {
        clienteTemporario: {
          nome: { contains: pesquisa, mode: 'insensitive' as const },
        },
      },
      { titulo: { contains: pesquisa, mode: 'insensitive' as const } },
    ];

    if (isPhone) {
      const phoneConditions = await this.createPhoneSearchConditions(
        pesquisa,
        idLoja,
      );
      return {
        OR: [...phoneConditions, ...baseTextConditions],
      };
    } else {
      return {
        OR: [
          ...baseTextConditions,
          {
            cliente: {
              telefone: { contains: pesquisa, mode: 'insensitive' as const },
            },
          },
          {
            cliente: {
              whatsapp: { contains: pesquisa, mode: 'insensitive' as const },
            },
          },
          {
            clienteTemporario: {
              whatsapp: { contains: pesquisa, mode: 'insensitive' as const },
            },
          },
        ],
      };
    }
  }

  async listarAtendimentos(
    idLoja: string,
    filtro: FiltroAtendimentoDto,
    idUsuario?: string,
  ) {
    const {
      pesquisa = '',
      modoAtendimento = '',
      origem = '',
      colaboradorIds = '',
      status = '',
      pagina = '1',
      itensPagina = '10',
      dataInicial,
      dataFinal,
      isArchived = 'false',
      idTag,
    } = filtro;

    const paginaNumero = Number(pagina);
    const itensPorPagina = Number(itensPagina);

    const idsColaboradores = colaboradorIds ? colaboradorIds.split(',') : [];

    const origensAtendimento = origem ? origem.split(',') : [];

    const todasOrigensValidas = origensAtendimento.every((value) =>
      Object.values(ORIGEM_ATENDIMENTO).includes(value as ORIGEM_ATENDIMENTO),
    );

    if (!todasOrigensValidas) {
      throw new AppErrorBadRequest(
        `Origem de atendimento inválida. As origens permitidas são: ${Object.values(ORIGEM_ATENDIMENTO).join(', ')}`,
      );
    }

    let roleBasedFilter: Prisma.AtendimentoWhereInput = {};

    if (idUsuario) {
      const colaborador = await this.prismaService.colaborador.findFirst({
        where: {
          idUsuario,
          idLoja,
        },
        include: {
          cargos: true,
        },
      });

      const lojista = await this.prismaService.lojista.findFirst({
        where: {
          idUsuario,
          loja: {
            id: idLoja,
          },
        },
      });
      const isLojista = !!lojista;

      if (!isLojista && colaborador) {
        const cargosUsuario =
          colaborador.cargos.map((c) => c.cargo.toLowerCase()) || [];

        const isGerenteVendas = cargosUsuario.some(
          (cargo) =>
            cargo.includes('gerente_de_vendas') || cargo.includes('gerente'),
        );

        const isAtendente = cargosUsuario.some((cargo) =>
          cargo.includes('atendente'),
        );

        const isPreVendedor = cargosUsuario.some(
          (cargo) =>
            cargo.includes('pré-vendedor') || cargo.includes('pre-vendedor'),
        );
        const isVendedor = cargosUsuario.some(
          (cargo) => cargo.includes('vendedor') && !cargo.includes('pré'),
        );

        if (isGerenteVendas) {
          roleBasedFilter = {};
        } else if (isAtendente) {
          roleBasedFilter = {
            OR: [
              {
                atendimentoResponsaveis: {
                  some: {
                    colaborador: {
                      idUsuario: idUsuario,
                    },
                  },
                },
              },
              {
                compartilhamentos: {
                  some: {
                    colaborador: {
                      idUsuario: idUsuario,
                    },
                  },
                },
              },
            ],
          };
        } else {
          const vendedoresLoja = await this.prismaService.colaborador.findMany({
            where: {
              idLoja,
              cargos: {
                some: {
                  cargo: {
                    contains: 'Vendedor',
                    mode: 'insensitive',
                    not: { contains: 'Pré' },
                  },
                },
              },
            },
            select: { id: true },
          });

          const preVendedoresLoja =
            await this.prismaService.colaborador.findMany({
              where: {
                idLoja,
                cargos: {
                  some: {
                    cargo: {
                      contains: 'Pré-vendedor',
                      mode: 'insensitive',
                    },
                  },
                },
              },
              select: { id: true },
            });

          const lojaTemVendedores = vendedoresLoja.length > 0;
          const lojaTemPreVendedores = preVendedoresLoja.length > 0;

          if (isVendedor && lojaTemVendedores) {
            if (lojaTemPreVendedores) {
              roleBasedFilter = {
                OR: [
                  {
                    atendimentoResponsaveis: {
                      some: {
                        colaborador: {
                          idUsuario: idUsuario,
                        },
                      },
                    },
                  },
                  {
                    compartilhamentos: {
                      some: {
                        colaborador: {
                          idUsuario: idUsuario,
                        },
                      },
                    },
                  },
                ],
              };
            } else {
              roleBasedFilter = {
                OR: [
                  {
                    atendimentoResponsaveis: {
                      none: {},
                    },
                  },
                  {
                    atendimentoResponsaveis: {
                      some: {
                        colaborador: {
                          idUsuario: idUsuario,
                        },
                      },
                    },
                  },
                  {
                    compartilhamentos: {
                      some: {
                        colaborador: {
                          idUsuario: idUsuario,
                        },
                      },
                    },
                  },
                ],
              };
            }
          } else if (isPreVendedor && lojaTemPreVendedores) {
            roleBasedFilter = {
              OR: [
                {
                  atendimentoResponsaveis: {
                    none: {},
                  },
                },
                {
                  atendimentoResponsaveis: {
                    some: {
                      colaborador: {
                        idUsuario: idUsuario,
                      },
                    },
                  },
                },
                {
                  compartilhamentos: {
                    some: {
                      colaborador: {
                        idUsuario: idUsuario,
                      },
                    },
                  },
                },
              ],
            };
          }
        }
      }
    }

    const searchConditions = await this.buildSearchConditions(pesquisa, idLoja);

    const filtrosBase: Prisma.AtendimentoWhereInput = {
      AND: [
        { idLoja },
        isArchived === 'true' ? { isArchived: true } : { isArchived: false },
        roleBasedFilter,
        searchConditions,
        modoAtendimento ? { modoAtendimento } : {},
        status ? { status } : {},
        idsColaboradores.length > 0
          ? {
              atendimentoResponsaveis: {
                some: {
                  idColaborador: { in: idsColaboradores },
                },
              },
            }
          : {},
        origensAtendimento.length > 0
          ? { origemAtendimento: { in: origensAtendimento } }
          : {},
        idTag
          ? {
              atendimentoTags: {
                some: {
                  idTag: idTag,
                },
              },
            }
          : {},
      ],
      criadoEm: {
        lte: new Date(),
      },
    };

    if (filtro.tarefasAtribuidas === 'true' && idUsuario) {
      const colaborador = await this.prismaService.colaborador.findFirst({
        where: {
          idUsuario: idUsuario,
          idLoja,
        },
        select: {
          id: true,
        },
      });

      if (colaborador) {
        if (!Array.isArray(filtrosBase.AND)) {
          filtrosBase.AND = [filtrosBase.AND];
        }

        filtrosBase.AND.push({
          tarefasAtendimento: {
            some: {
              idResponsavel: colaborador.id,
            },
          },
        });
      }
    }

    let filtrosData: Prisma.AtendimentoWhereInput | undefined;

    if (dataInicial || dataFinal) {
      const inicio = dataInicial ? new Date(new Date(dataInicial)) : undefined;
      const fim = dataFinal ? new Date(new Date(dataFinal)) : undefined;

      filtrosData = {
        criadoEm: {
          ...(inicio && { gte: inicio }),
          ...(fim && { lte: fim }),
        },
      };
    }

    const whereFinal: Prisma.AtendimentoWhereInput = {
      ...filtrosBase,
      ...filtrosData,
    };

    const atendimentos = await this.prismaService.atendimento.findMany({
      where: whereFinal,
      include: {
        atendimentoTags: {
          select: {
            tag: {
              select: {
                id: true,
                nome: true,
                descricao: true,
                cor: true,
              },
            },
          },
        },
        cliente: true,
        clienteTemporario: true,
        atendimentoResponsaveis: {
          include: {
            colaborador: {
              include: {
                usuario: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        chat: true,
        tarefasAtendimento: true,
        comentariosAtendimento: true,
      },
      skip: (paginaNumero - 1) * itensPorPagina,
      take: itensPorPagina,
      orderBy: filtro.orderBy
        ? {
            [filtro.orderBy]: filtro.orderDirection ?? 'asc',
          }
        : undefined,
    });

    const resultado = atendimentos.map((atendimento) => ({
      id: atendimento.id,
      titulo: atendimento.titulo,
      descricaoAtendimento: atendimento.descricaoAtendimento,
      origemAtendimento: atendimento.origemAtendimento,
      temperatura: atendimento.temperatura,
      modoAtendimento: atendimento.modoAtendimento,
      status: atendimento.status,
      criadoEm: atendimento.criadoEm,
      atualizadoEm: atendimento.atualizadoEm,
      cliente: atendimento.cliente
        ? {
            nome: atendimento.cliente.nome,
            email: atendimento.cliente.email,
            telefone: atendimento.cliente.whatsapp,
            avatar: atendimento.cliente.urlAvatar,
          }
        : atendimento.clienteTemporario
          ? {
              nome: atendimento.clienteTemporario.nome,
              email: atendimento.clienteTemporario.email,
              telefone: atendimento.clienteTemporario.whatsapp,
              avatar: atendimento.clienteTemporario.avatar,
            }
          : null,
      responsaveis: atendimento.atendimentoResponsaveis.map((resp) => ({
        id: resp.idColaborador,
        nome: resp.colaborador.nome,
        whatsapp: resp.colaborador.whatsapp,
        idUsuario: resp.colaborador.idUsuario,
      })),
      tarefas: atendimento.tarefasAtendimento.length,
      comentarios: atendimento.comentariosAtendimento.length,
      chats: atendimento.chat,
      tags: atendimento.atendimentoTags.map((tag) => tag.tag),
    }));

    return {
      pesquisa,
      modoAtendimento,
      origem,
      status,
      colaboradorIds,
      pagina: paginaNumero,
      itensPagina: itensPorPagina,
      dataInicial,
      dataFinal,
      atendimentos: resultado,
    };
  }

  async listarChats(
    idLoja: string,
    filtro: FiltroAtendimentoDto,
    idUsuario?: string,
  ) {
    const {
      pesquisa = '',
      modoAtendimento = '',
      origem = '',
      colaboradorIds = '',
      status = '',
      pagina = '1',
      itensPagina = '10',
      dataInicial,
      dataFinal,
      isArchived = 'false',
    } = filtro;

    if (colaboradorIds && colaboradorIds !== '') {
      return {
        pesquisa,
        modoAtendimento,
        origem,
        status: STATUS_ATENDIMENTO.CHAT,
        colaboradorIds,
        pagina: Number(pagina),
        itensPagina: Number(itensPagina),
        dataInicial,
        dataFinal,
        atendimentos: [],
      };
    }

    const paginaNumero = Number(pagina);
    const itensPorPagina = Number(itensPagina);
    const origensAtendimento = origem ? origem.split(',') : [];

    const todasOrigensValidas = origensAtendimento.every((value) =>
      Object.values(ORIGEM_ATENDIMENTO).includes(value as ORIGEM_ATENDIMENTO),
    );

    if (!todasOrigensValidas) {
      throw new AppErrorBadRequest(
        `Origem de atendimento inválida. As origens permitidas são: ${Object.values(ORIGEM_ATENDIMENTO).join(', ')}`,
      );
    }

    const [loja, colaboradorInfo] = await Promise.all([
      this.prismaService.loja.findUnique({
        where: { id: idLoja },
        select: {
          distribuicaoAutomatica: true,
        },
      }),
      idUsuario ? this.obterInformacoesUsuario(idUsuario, idLoja) : null,
    ]);

    const roleBasedFilter = this.construirFiltroRole(colaboradorInfo);
    const whereFinal = this.construirFiltrosChat({
      idLoja,
      pesquisa,
      origensAtendimento,
      dataInicial,
      dataFinal,
      roleBasedFilter,
      isArchived,
    });

    const chats = await this.prismaService.chat.findMany({
      where: whereFinal,
      include: {
        clienteTemporario: {
          select: {
            nome: true,
            avatar: true,
            email: true,
            whatsapp: true,
          },
        },
        chatResponsaveis: {
          include: {
            colaborador: {
              select: {
                id: true,
                nome: true,
                whatsapp: true,
                idUsuario: true,
              },
            },
          },
        },
        atendimento: {
          select: {
            titulo: true,
            descricaoAtendimento: true,
            temperatura: true,
          },
        },
      },
      skip: (paginaNumero - 1) * itensPorPagina,
      take: itensPorPagina,
      orderBy: filtro.orderBy
        ? {
            [filtro.orderBy]: filtro.orderDirection ?? 'asc',
          }
        : { criadoEm: 'desc' },
    });

    const chatsSemResponsavel = chats.filter(
      (chat) => chat.chatResponsaveis.length === 0,
    );

    if (loja?.distribuicaoAutomatica && chatsSemResponsavel.length > 0) {
      await this.processarDistribuicaoAutomaticaLote(
        chatsSemResponsavel,
        idLoja,
      );
    }

    const retornoChats = chats.map((chat) => ({
      id: chat.id,
      titulo: chat.atendimento?.titulo || 'Chat',
      descricaoAtendimento: chat.atendimento?.descricaoAtendimento || '',
      origemAtendimento: chat.canal,
      modoAtendimento: MODO_ATENDIMENTO.COMPRA,
      status: STATUS_ATENDIMENTO.CHAT,
      temperatura: chat.atendimento?.temperatura || 'morno',
      arquivado: chat.arquivado,
      criadoEm: chat.criadoEm,
      atualizadoEm: chat.atualizadoEm,
      cliente: {
        nome: chat.clienteTemporario?.nome || 'Desconhecido',
        email: chat.clienteTemporario?.email || '',
        telefone: chat.clienteTemporario?.whatsapp || '',
        avatar: chat.clienteTemporario?.avatar || '',
      },
      chats: [
        {
          id: chat.id,
          canal: chat.canal,
        },
      ],
      responsaveis: chat.chatResponsaveis.map((cr) => cr.colaborador),
    }));

    const searchConditionsAtendimento = await this.buildSearchConditions(pesquisa, idLoja);

    const filtrosAtendimentosChat: Prisma.AtendimentoWhereInput = {
      AND: [
        { idLoja },
        isArchived === 'true' ? { isArchived: true } : { isArchived: false },
        searchConditionsAtendimento,
        { status: STATUS_ATENDIMENTO.CHAT },
        origensAtendimento.length > 0
          ? { origemAtendimento: { in: origensAtendimento } }
          : {},
      ],
    };

    if (dataInicial || dataFinal) {
      const inicio = dataInicial ? new Date(new Date(dataInicial)) : undefined;
      const fim = dataFinal ? new Date(new Date(dataFinal)) : undefined;

      (filtrosAtendimentosChat as any).criadoEm = {
        ...(inicio && { gte: inicio }),
        ...(fim && { lte: fim }),
      };
    }

    if (idUsuario) {
      const colaboradorInfoAtend = await this.obterInformacoesUsuario(idUsuario, idLoja);
      if (!colaboradorInfoAtend.isLojista && colaboradorInfoAtend.colaborador) {
        const cargosUsuario = colaboradorInfoAtend.cargos || [];
        const isGerenteVendas = cargosUsuario.some(
          (cargo: string) => cargo.includes('gerente_de_vendas') || cargo.includes('gerente'),
        );
        const isAtendente = cargosUsuario.some((cargo: string) => cargo.includes('atendente'));
        const isPreVendedor = cargosUsuario.some(
          (cargo: string) => cargo.includes('pré-vendedor') || cargo.includes('pre-vendedor'),
        );
        const isVendedor = cargosUsuario.some(
          (cargo: string) => cargo.includes('vendedor') && !cargo.includes('pré'),
        );

        let roleFilter: Prisma.AtendimentoWhereInput = {};

        if (!isGerenteVendas) {
          if (isAtendente) {
            roleFilter = {
              OR: [
                {
                  atendimentoResponsaveis: {
                    some: {
                      colaborador: { idUsuario },
                    },
                  },
                },
                {
                  compartilhamentos: {
                    some: {
                      colaborador: { idUsuario },
                    },
                  },
                },
              ],
            };
          } else if (isVendedor || isPreVendedor) {
            roleFilter = {
              OR: [
                { atendimentoResponsaveis: { none: {} } },
                {
                  atendimentoResponsaveis: {
                    some: {
                      colaborador: { idUsuario },
                    },
                  },
                },
                {
                  compartilhamentos: {
                    some: {
                      colaborador: { idUsuario },
                    },
                  },
                },
              ],
            };
          }
        }

        if (!Array.isArray((filtrosAtendimentosChat as any).AND)) {
          (filtrosAtendimentosChat as any).AND = [(filtrosAtendimentosChat as any).AND];
        }
        (filtrosAtendimentosChat as any).AND.push(roleFilter);
      }
    }

    const atendimentosChat = await this.prismaService.atendimento.findMany({
      where: filtrosAtendimentosChat,
      include: {
        cliente: true,
        clienteTemporario: true,
        atendimentoResponsaveis: {
          include: {
            colaborador: true,
          },
        },
        chat: true,
      },
      orderBy: filtro.orderBy
        ? { [filtro.orderBy]: filtro.orderDirection ?? 'asc' }
        : { criadoEm: 'desc' },
      skip: (paginaNumero - 1) * itensPorPagina,
      take: itensPorPagina,
    });

    const retornoAtendimentos = atendimentosChat.map((atendimento) => ({
      id: atendimento.id,
      titulo: atendimento.titulo || 'Atendimento',
      descricaoAtendimento: atendimento.descricaoAtendimento || '',
      origemAtendimento: atendimento.origemAtendimento,
      modoAtendimento: atendimento.modoAtendimento || MODO_ATENDIMENTO.VENDA,
      status: atendimento.status,
      temperatura: atendimento.temperatura || 'morno',
      arquivado: atendimento.isArchived,
      criadoEm: atendimento.criadoEm,
      atualizadoEm: atendimento.atualizadoEm,
      cliente: atendimento.cliente
        ? {
            nome: atendimento.cliente.nome,
            email: atendimento.cliente.email,
            telefone: atendimento.cliente.whatsapp,
            avatar: atendimento.cliente.urlAvatar,
          }
        : atendimento.clienteTemporario
        ? {
            nome: atendimento.clienteTemporario.nome,
            email: atendimento.clienteTemporario.email,
            telefone: atendimento.clienteTemporario.whatsapp,
            avatar: atendimento.clienteTemporario.avatar,
          }
        : null,
      chats: atendimento.chat?.map((c) => ({ id: c.id, canal: c.canal })) || [],
      responsaveis: atendimento.atendimentoResponsaveis.map((resp) => ({
        id: resp.idColaborador,
        nome: resp.colaborador?.nome,
        whatsapp: resp.colaborador?.whatsapp,
        idUsuario: resp.colaborador?.idUsuario,
      })),
    }));

    const retorno = [...retornoChats, ...retornoAtendimentos].sort((a, b) => {
      const aDate = new Date(a.criadoEm).getTime();
      const bDate = new Date(b.criadoEm).getTime();
      return bDate - aDate;
    });

    return {
      pesquisa,
      modoAtendimento,
      origem,
      status: STATUS_ATENDIMENTO.CHAT,
      colaboradorIds,
      pagina: paginaNumero,
      itensPagina: itensPorPagina,
      dataInicial,
      dataFinal,
      isArchived,
      atendimentos: retorno,
    };
  }

  private async obterInformacoesUsuario(idUsuario: string, idLoja: string) {
    const [colaborador, lojista] = await Promise.all([
      this.prismaService.colaborador.findFirst({
        where: { idUsuario, idLoja },
        include: { cargos: true },
      }),
      this.prismaService.lojista.findFirst({
        where: {
          idUsuario,
          loja: { id: idLoja },
        },
      }),
    ]);

    return {
      colaborador,
      isLojista: !!lojista,
      cargos: colaborador?.cargos.map((c) => c.cargo.toLowerCase()) || [],
    };
  }

  private construirFiltroRole(colaboradorInfo: any): Prisma.ChatWhereInput {
    if (!colaboradorInfo || colaboradorInfo.isLojista) {
      return {};
    }

    const { colaborador, cargos } = colaboradorInfo;

    const isPreVendedor = cargos.some(
      (cargo: string) =>
        cargo.includes('pré-vendedor') || cargo.includes('pre-vendedor'),
    );
    const isVendedor = cargos.some(
      (cargo: string) => cargo.includes('vendedor') && !cargo.includes('pré'),
    );

    if (isPreVendedor || isVendedor) {
      return {
        chatResponsaveis: {
          some: {
            colaborador: {
              idUsuario: colaborador.idUsuario,
            },
          },
        },
      };
    }

    return {};
  }

  private construirFiltrosChat(params: {
    idLoja: string;
    pesquisa: string;
    origensAtendimento: string[];
    dataInicial?: Date;
    dataFinal?: Date;
    roleBasedFilter: Prisma.ChatWhereInput;
    isArchived: string;
  }): Prisma.ChatWhereInput {
    const {
      idLoja,
      pesquisa,
      origensAtendimento,
      dataInicial,
      dataFinal,
      roleBasedFilter,
      isArchived,
    } = params;

    const filtrosBase: Prisma.ChatWhereInput = {
      AND: [
        { idLoja },
        { idAtendimento: null },
        isArchived === 'true' ? { arquivado: true } : { arquivado: false },
        roleBasedFilter,
        pesquisa && pesquisa !== ''
          ? {
              OR: [
                {
                  clienteTemporario: {
                    email: { contains: pesquisa, mode: 'insensitive' },
                  },
                },
                {
                  clienteTemporario: {
                    nome: { contains: pesquisa, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {},
        origensAtendimento.length > 0
          ? { canal: { in: origensAtendimento } }
          : {},
      ],
    };

    if (dataInicial || dataFinal) {
      filtrosBase.criadoEm = {
        ...(dataInicial && { gte: dataInicial }),
        ...(dataFinal && { lte: dataFinal }),
      };
    }

    return filtrosBase;
  }

  private async processarDistribuicaoAutomaticaLote(
    chats: any[],
    idLoja: string,
  ) {
    const colaboradoresDisponiveis =
      await this.distribuicaoAutomaticaService.obterColaboradorParaDistribuicao(
        idLoja,
      );

    if (!colaboradoresDisponiveis) return;
    const distribuicoes = chats.map((chat) => ({
      idChat: chat.id,
      idColaborador: colaboradoresDisponiveis,
      idLoja,
    }));

    await this.prismaService.chatResponsaveis.createMany({
      data: distribuicoes,
      skipDuplicates: true,
    });
  }

  async criarComentario(
    idAtendimento: string,
    idUsuario: string,
    comentario: CriarComentarioDto,
  ) {
    const atendimentoExiste = await this.prismaService.atendimento.findUnique({
      where: {
        id: idAtendimento,
      },
    });

    if (!atendimentoExiste) {
      throw new AppErrorNotFound('Atendimento não encontrado');
    }

    const comentarioCriado =
      await this.prismaService.comentariosAtendimento.create({
        data: {
          idAtendimento,
          idUsuario: idUsuario,
          comentario: comentario.comentario,
        },
        select: {
          id: true,
          comentario: true,
          criadoEm: true,
          usuario: {
            select: {
              nome: true,
            },
          },
        },
      });

    await this.prismaService.atendimento.update({where: {id: idAtendimento}, data: {atualizadoEm: new Date()}})

    this.eventoService.emitComentarioCriado({
      idAtendimento,
      idUsuario,
      nomeUsuario: comentarioCriado.usuario.nome,
      dadosNovos: {
        comentario: comentarioCriado.comentario,
        id: comentarioCriado.id,
      },
    });

    return comentarioCriado;
  }

  async listarComentarios(
    idAtendimento: string,
    idLoja: string,
    params: ListarComentariosDto,
  ) {
    const pagina = params.pagina ? Number(params.pagina) : 1;
    const itensPagina = params.itensPagina ? Number(params.itensPagina) : 10;

    await this.obterAtendimentoPorId(idAtendimento, idLoja);

    const comentarios =
      await this.prismaService.comentariosAtendimento.findMany({
        where: {
          idAtendimento,
        },
        include: {
          usuario: true,
        },
        skip: (pagina - 1) * itensPagina,
        take: itensPagina,
        orderBy: {
          criadoEm: 'desc',
        },
      });

    const resultado = comentarios.map((comentario) => ({
      id: comentario.id,
      comentario: comentario.comentario,
      criadoEm: comentario.criadoEm,
      idUsuario: comentario.idUsuario,
      nome: comentario.usuario.nome,
      avatar: getStringUrlAvatar(comentario.idUsuario),
    }));

    return {
      pagina,
      itensPagina,
      comentarios: resultado,
    };
  }

  async removerResponsaveis(
    idAtendimento: string,
    idLoja: string,
    idUsuario: string,
    idResponsaveis: string[],
  ) {
    const atendimento = await this.obterAtendimentoPorId(idAtendimento, idLoja);

    const responsaveisAtendimento = atendimento.atendimentoResponsaveis.map(
      (responsavel) => responsavel.idColaborador,
    );

    const loja = await this.prismaService.loja.findUnique({
      where: {
        id: idLoja,
      },
      select: {
        lojista: {
          select: {
            idUsuario: true,
          },
        },
      },
    });

    const isLojista = loja.lojista?.idUsuario === idUsuario;

    if (!isLojista) {
      throw new AppErrorForbidden(
        'Você não tem permissão para remover responsáveis desse atendimento',
      );
    }

    const responsaveisParaRemover = idResponsaveis.filter((id) =>
      responsaveisAtendimento.includes(id),
    );

    if (responsaveisParaRemover.length === 0) {
      throw new AppErrorBadRequest(
        'Nenhum dos responsáveis informados está vinculado ao atendimento',
      );
    }

    await this.prismaService.atendimentoResponsaveis.deleteMany({
      where: {
        idAtendimento,
        idColaborador: {
          in: responsaveisParaRemover,
        },
      },
    });

    this.eventoService.emitAtendimentoEditado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      contexto: {
        detalhes: {
          responsaveisRemovidos: atendimento.responsaveis.map((r) => ({
            nome: r.nome,
          })),
        },
      },
    });
  }

  async alterarTitulo(
    idAtendimento: string,
    idUsuario: string,
    idLoja: string,
    titulo: string,
  ) {
    await this.obterAtendimentoPorId(idAtendimento, idLoja);

    const atendimentoAtualizado = await this.prismaService.atendimento.update({
      where: {
        id: idAtendimento,
      },
      data: {
        titulo,
      },
    });

    this.eventoService.emitAtendimentoEditado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosNovos: { titulo: atendimentoAtualizado.titulo },
    });

    return atendimentoAtualizado;
  }

  async alterarDescricao(
    idAtendimento: string,
    idUsuario: string,
    idLoja: string,
    descricao: string,
  ) {
    await this.obterAtendimentoPorId(idAtendimento, idLoja);

    const atendimentoAtualizado = await this.prismaService.atendimento.update({
      where: {
        id: idAtendimento,
      },
      data: {
        descricaoAtendimento: descricao,
      },
    });

    this.eventoService.emitAtendimentoEditado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosNovos: { descricaoAtendimento: descricao },
    });

    return atendimentoAtualizado;
  }

  async listarArquivosDeChat(idAtendimento: string, idLoja: string) {
    await this.obterAtendimentoPorId(idAtendimento, idLoja);

    const chatsAtendimento = await this.prismaService.chat.findMany({
      where: {
        idAtendimento,
      },
    });

    const mensagens = await this.prismaService.mensagem.findMany({
      where: {
        AND: [
          {
            idChat: {
              in: chatsAtendimento.map((chat) => chat.id),
            },
          },
          {
            anexoMensagem: {
              not: null,
            },
          },
        ],
      },
      select: {
        id: true,
        idChat: true,
        canal: true,
        tipoAnexo: true,
        anexoMensagem: true,
        criadoEm: true,
        tipo: true,
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    const mensagensFiltradas = mensagens.filter((mensagem) => {
      if (mensagem.tipo === 'sticker') return false;
      if (!mensagem.tipoAnexo) return false;
      if (mensagem.tipoAnexo.includes('image')) return true;
      if (mensagem.tipoAnexo.includes('application')) return true;

      return false;
    });

    return mensagensFiltradas;
  }

  async alterarCliente(params: {
    idAtendimento: string;
    idUsuario: string;
    idLoja: string;
    idCliente: string;
  }) {
    const { idAtendimento, idLoja, idCliente, idUsuario } = params;

    const atendimento = await this.prismaService.atendimento.findUnique({
      where: {
        id: idAtendimento,
        idLoja,
      },
    });

    if (!atendimento) {
      throw new AppErrorNotFound('Atendimento não encontrado');
    }

    const cliente = await this.prismaService.cliente.findUnique({
      where: {
        id: idCliente,
        idLoja,
      },
    });

    if (!cliente) {
      throw new AppErrorNotFound('Cliente não encontrado');
    }

    const atendimentoAtualizado = await this.prismaService.atendimento.update({
      where: {
        id: idAtendimento,
        idLoja,
      },
      data: {
        idCliente,
        idClienteTemporario: null,
      },
    });

    this.eventoService.emitAtendimentoEditado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosNovos: {
        cliente: {
          nome: cliente?.nome,
          email: cliente?.email,
          whatsapp: cliente?.whatsapp,
        },
      },
    });

    return atendimentoAtualizado;
  }

  /**
   * Automatically archives attendances based on status and last interaction date
   * @param inactivityDays Number of inactivity days to archive (default: 30)
   */
  async archiveAttendancesAutomatically(
    inactivityDays: number = 30,
  ): Promise<void> {
    try {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - inactivityDays);

      const attendancesToArchive =
        await this.prismaService.atendimento.findMany({
          where: {
            isArchived: false,
            status: {
              in: [STATUS_ATENDIMENTO.SUCESSO, STATUS_ATENDIMENTO.PERDIDO],
            },
            atualizadoEm: {
              lt: limitDate,
            },
          },
          select: {
            id: true,
            idLoja: true,
            status: true,
          },
        });

      if (attendancesToArchive.length > 0) {
        await this.prismaService.atendimento.updateMany({
          where: {
            id: {
              in: attendancesToArchive.map((a) => a.id),
            },
          },
          data: {
            isArchived: true,
          },
        });

        this.logger.log(
          `Automatically archived ${attendancesToArchive.length} attendances`,
        );
      }
    } catch (error) {
      this.logger.error('Error automatically archiving attendances:', error);
    }
  }

  /**
   * Archives a specific attendance
   * @param idAtendimento Attendance ID
   * @param idLoja Store ID
   */
  async archiveAttendance(
    idAtendimento: string,
    idLoja: string,
    idUsuario: string,
  ): Promise<void> {
    const atendimento = await this.prismaService.atendimento.findFirst({
      where: {
        id: idAtendimento,
        idLoja,
      },
    });

    if (!atendimento) {
      throw new AppErrorNotFound('Attendance not found');
    }

    await this.prismaService.atendimento.update({
      where: {
        id: idAtendimento,
      },
      data: {
        isArchived: true,
      },
    });

    this.eventoService.emitAtendimentoArquivado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosNovos: { isArchived: true },
    });
  }

  /**
   * Unarchives a specific attendance
   * @param idAtendimento Attendance ID
   * @param idLoja Store ID
   */
  async unarchiveAttendance(
    idAtendimento: string,
    idLoja: string,
    idUsuario: string,
  ): Promise<void> {
    const atendimento = await this.prismaService.atendimento.findFirst({
      where: {
        id: idAtendimento,
        idLoja,
      },
    });

    if (!atendimento) {
      throw new AppErrorNotFound('Attendance not found');
    }

    await this.prismaService.atendimento.update({
      where: {
        id: idAtendimento,
      },
      data: {
        isArchived: false,
      },
    });

    this.eventoService.emitAtendimentoDesarquivado({
      idAtendimento,
      idUsuario,
      nomeUsuario: await this.obterNomeUsuarioPorId(idUsuario),
      dadosAntigos: { isArchived: true },
      dadosNovos: { isArchived: false },
    });
  }


  async excluirAtendimentoDesvinculandoChats(
    idAtendimento: string,
    idLoja: string,
    idUsuario: string,
  ): Promise<{ message: string; chatsDesvinculados: number }> {
    const atendimento = await this.prismaService.atendimento.findFirst({
      where: {
        id: idAtendimento,
        idLoja,
      },
    });

    if (!atendimento) {
      throw new AppErrorNotFound('Atendimento não encontrado');
    }

    const chatsVinculados = await this.prismaService.chat.findMany({
      where: { idAtendimento, idLoja },
      select: { id: true, canal: true },
    });

    await this.prismaService.$transaction(async (prisma) => {
      if (chatsVinculados.length > 0) {
        await prisma.chat.updateMany({
          where: { idAtendimento, idLoja },
          data: { idAtendimento: null },
        });

        for (const chat of chatsVinculados) {
          await prisma.mensagem.create({
            data: {
              remetente: Remetente.SISTEMA,
              idChat: chat.id,
              conteudo: 'Atendimento desvinculado e excluído.',
              canal: chat.canal as any,
            },
          });
        }
      }

      await prisma.atendimento.delete({ where: { id: idAtendimento } });
    });

    return {
      message: 'Atendimento excluído com sucesso. Chats foram desvinculados e preservados.',
      chatsDesvinculados: chatsVinculados.length,
    };
  }

  async obterHistoricoCliente(idLoja: string, params: HistoricoClienteDto) {
    if (!params.idCliente && !params.idClienteTemporario) {
      throw new AppErrorBadRequest(
        'É necessário informar o ID do cliente ou do cliente temporário',
      );
    }

    if (params.idCliente && params.idClienteTemporario) {
      throw new AppErrorBadRequest(
        'Informe apenas o ID do cliente OU do cliente temporário, não ambos',
      );
    }

    const pagina = parseInt(params.pagina || '1');
    const itensPagina = parseInt(params.itensPagina || '10');
    const skip = (pagina - 1) * itensPagina;

    const whereConditions: Prisma.AtendimentoWhereInput = {
      idLoja,
    };

    if (params.idCliente) {
      whereConditions.idCliente = params.idCliente;
    } else if (params.idClienteTemporario) {
      whereConditions.idClienteTemporario = params.idClienteTemporario;
    }

    if (params.pesquisa) {
      whereConditions.OR = [
        {
          titulo: {
            contains: params.pesquisa,
            mode: 'insensitive',
          },
        },
        {
          descricaoAtendimento: {
            contains: params.pesquisa,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [atendimentos, total] = await Promise.all([
      this.prismaService.atendimento.findMany({
        where: whereConditions,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true,
              whatsapp: true,
              urlAvatar: true,
            },
          },
          clienteTemporario: {
            select: {
              id: true,
              nome: true,
              email: true,
              whatsapp: true,
              avatar: true,
            },
          },
          atendimentoResponsaveis: {
            include: {
              colaborador: {
                select: {
                  id: true,
                  nome: true,
                  idUsuario: true,
                },
              },
            },
          },
          atendimentoTags: {
            include: {
              tag: {
                select: {
                  id: true,
                  nome: true,
                  cor: true,
                },
              },
            },
          },
          _count: {
            select: {
              comentariosAtendimento: true,
            },
          },
        },
        orderBy: {
          criadoEm: 'desc',
        },
        skip,
        take: itensPagina,
      }),
      this.prismaService.atendimento.count({
        where: whereConditions,
      }),
    ]);

    const atendimentosComAnexos = await Promise.all(
      atendimentos.map(async (atendimento) => {
        const totalAnexos = await this.prismaService.anexoAtendimento.count({
          where: {
            idAtendimento: atendimento.id,
          },
        });

        const cliente: any =
          atendimento.cliente || atendimento.clienteTemporario;

        return {
          id: atendimento.id,
          titulo: atendimento.titulo,
          descricaoAtendimento: atendimento.descricaoAtendimento,
          status: atendimento.status,
          modoAtendimento: atendimento.modoAtendimento,
          origemAtendimento: atendimento.origemAtendimento,
          temperatura: atendimento.temperatura,
          criadoEm: atendimento.criadoEm,
          atualizadoEm: atendimento.atualizadoEm,
          cliente: cliente
            ? {
                id: cliente.id,
                nome: cliente.nome,
                email: cliente.email,
                telefone: atendimento.cliente ? cliente.telefone : null,
                whatsapp: cliente.whatsapp,
                urlAvatar: atendimento.cliente
                  ? cliente.urlAvatar
                  : cliente.avatar,
                tipo: atendimento.cliente ? 'cliente' : 'clienteTemporario',
              }
            : null,
          responsaveis: atendimento.atendimentoResponsaveis.map((resp) => ({
            id: resp.colaborador.id,
            nome: resp.colaborador.nome,
            urlAvatar: getStringUrlAvatar(resp.colaborador.idUsuario),
          })),
          tags: atendimento.atendimentoTags.map((tagRel) => ({
            id: tagRel.tag.id,
            nome: tagRel.tag.nome,
            cor: tagRel.tag.cor,
          })),
          contadores: {
            comentarios: atendimento._count.comentariosAtendimento,
            anexos: totalAnexos,
          },
        };
      }),
    );

    const totalPaginas = Math.ceil(total / itensPagina);

    return {
      pesquisa: params.pesquisa || '',
      idCliente: params.idCliente || null,
      idClienteTemporario: params.idClienteTemporario || null,
      pagina,
      itensPagina,
      totalItens: total,
      totalPaginas,
      atendimentos: atendimentosComAnexos || atendimentos,
    };
  }
}
