import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import {
  AppErrorNotFound,
  AppErrorBadRequest,
  AppErrorConflict,
  AppErrorUnauthorized,
} from 'src/utils/errors/app-errors';
import { EventoService } from '../eventos/evento.service';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';
import { TiposNotificacaoEnum } from 'src/utils/enum/notificacoes.enum';

@Injectable()
export class CompartilhamentoService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventoService: EventoService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  private async obterNomeUsuarioPorId(idUsuario: string) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: { id: idUsuario },
      select: { nome: true },
    });
    return usuario?.nome ?? '';
  }

  private async verificarPermissaoCompartilhamento(
    idUsuario: string,
    idAtendimento: string,
    idLoja: string,
  ) {
    const loja = await this.prismaService.loja.findUnique({
      where: { id: idLoja },
      include: {
        lojista: true,
      },
    });

    if (loja.lojista.idUsuario === idUsuario) {
      return;
    }

    const atendimento = await this.prismaService.atendimento.findUnique({
      where: { id: idAtendimento, idLoja },
      select: {
        atendimentoResponsaveis: {
          select: {
            colaborador: {
              select: {
                idUsuario: true,
              },
            },
          },
        },
      },
    });

    if (
      atendimento.atendimentoResponsaveis.some(
        (responsavel) => responsavel.colaborador.idUsuario === idUsuario,
      )
    ) {
      return;
    }

    throw new AppErrorUnauthorized(
      'Você não tem permissão para alterar configurações de compartilhamento deste atendimento',
    );
  }

  async criar(params: {
    idAtendimento: string;
    idLoja: string;
    idUsuario: string;
    idColaborador: string;
  }) {
    const { idAtendimento, idLoja, idUsuario, idColaborador } = params;

    await this.verificarPermissaoCompartilhamento(
      idUsuario,
      idAtendimento,
      idLoja,
    );

    const atendimento = await this.prismaService.atendimento.findUnique({
      where: {
        id: idAtendimento,
        idLoja,
      },
    });

    if (!atendimento) {
      throw new AppErrorNotFound('Atendimento não encontrado');
    }

    const colaborador = await this.prismaService.colaborador.findUnique({
      where: {
        id: idColaborador,
        idLoja,
      },
      include: {
        usuario: {
          select: {
            id: true,
          },
        },
        atendimentosCompartilhados: {
          select: {
            idAtendimento: true,
          },
        },
      },
    });

    if (!colaborador) {
      throw new AppErrorNotFound('Colaborador não encontrado');
    }

    if (colaborador.usuario.id === idUsuario) {
      throw new AppErrorBadRequest(
        'Você não pode compartilhar o atendimento com si mesmo',
      );
    }

    if (
      colaborador.atendimentosCompartilhados.some(
        (compartilhamento) => compartilhamento.idAtendimento === idAtendimento,
      )
    ) {
      throw new AppErrorConflict(
        'Este atendimento já está compartilhado com este colaborador',
      );
    }

    const compartilhamento =
      await this.prismaService.compartilhamentoAtendimento.create({
        data: {
          idAtendimento,
          idColaborador,
          idLoja,
          compartilhadoPor: idUsuario,
        },
      });

    const nomeUsuario = await this.obterNomeUsuarioPorId(idUsuario);

    this.eventoService.emitCompartilhamentoCriado({
      idAtendimento,
      idUsuario,
      nomeUsuario,
      dadosNovos: {
        colaboradorCompartilhado: colaborador.nome,
        idColaborador: colaborador.id,
      },
      contexto: {
        detalhes: {
          acao: 'compartilhamento_criado',
          colaborador: colaborador.nome,
        },
      },
    });

    await this.notificacoesService.criarNovaNotificacao({
      idUsuario: colaborador.idUsuario,
      idReferencia: idAtendimento,
      tipo: TiposNotificacaoEnum.ATENDIMENTO_COMPARTILHADO,
      mensagem: `${nomeUsuario} compartilhou um atendimento com você`,
    });

    return compartilhamento;
  }

  async listar(params: { idAtendimento: string; idLoja: string }) {
    const { idAtendimento, idLoja } = params;

    return await this.prismaService.compartilhamentoAtendimento.findMany({
      where: { idAtendimento, idLoja },
      include: {
        colaborador: {
          select: {
            id: true,
            nome: true,
            whatsapp: true,
            idUsuario: true,
            cargos: true,
          },
        },
      },
    });
  }

  async remover(params: {
    idAtendimento: string;
    idLoja: string;
    idUsuario: string;
    idColaborador: string;
  }) {
    const { idAtendimento, idLoja, idUsuario, idColaborador } = params;

    await this.verificarPermissaoCompartilhamento(
      idUsuario,
      idAtendimento,
      idLoja,
    );

    const compartilhamento =
      await this.prismaService.compartilhamentoAtendimento.findFirst({
        where: { idAtendimento, idLoja, idColaborador },
        include: {
          colaborador: {
            select: {
              nome: true,
              usuario: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

    if (!compartilhamento) {
      throw new AppErrorNotFound('Compartilhamento não encontrado');
    }

    await this.prismaService.compartilhamentoAtendimento.delete({
      where: { id: compartilhamento.id },
    });

    const nomeUsuario = await this.obterNomeUsuarioPorId(idUsuario);

    this.eventoService.emitCompartilhamentoRemovido({
      idAtendimento: compartilhamento.idAtendimento,
      idUsuario,
      nomeUsuario,
      dadosAntigos: {
        colaboradorCompartilhado: compartilhamento.colaborador.nome,
        idColaborador: compartilhamento.idColaborador,
      },
      contexto: {
        detalhes: {
          acao: 'compartilhamento_removido',
          colaborador: compartilhamento.colaborador.nome,
        },
      },
    });

    await this.notificacoesService.criarNovaNotificacao({
      idUsuario: compartilhamento.colaborador.usuario.id,
      idReferencia: compartilhamento.idAtendimento,
      tipo: TiposNotificacaoEnum.ATENDIMENTO_COMPARTILHADO,
      mensagem: `${nomeUsuario} removeu o compartilhamento de um atendimento com você`,
    });
  }
}
