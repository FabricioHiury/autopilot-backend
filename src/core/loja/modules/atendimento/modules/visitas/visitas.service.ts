import { Injectable } from '@nestjs/common';
import { CriarVisitaDto } from './dto/criar-visita.dto';
import { EditarTarefaDto } from './dto/editar-visita.dto';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { AppErrorNotFound } from 'src/utils/errors/app-errors';
import { EventoService } from '../eventos/evento.service';
import { TarefasAtendimento, VisitasAtendimento } from '@prisma/client';
import { USUARIO_PERFIL } from 'src/core/usuario/enum/perfil.enum';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';
import { TiposNotificacaoEnum } from 'src/utils/enum/notificacoes.enum';

@Injectable()
export class VisitasService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventoService: EventoService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

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

  private async pegarAtendimentoPorId(idAtendimento: string, idLoja: string) {
    const atendimento = await this.prismaService.atendimento.findFirst({
      where: {
        id: idAtendimento,
        idLoja,
      },
      include: {
        cliente: true,
        clienteTemporario: true,
      },
    });

    if (!atendimento) {
      throw new AppErrorNotFound(
        'Nenhum atendimento com este ID foi encontrado',
      );
    }

    return atendimento;
  }

  private async pegarColaboradorPorIdUsuario(
    idUsuario: string,
    idLoja: string,
  ) {
    const usuario = await this.prismaService.usuario.findUnique({
      where: {
        id: idUsuario,
      },
      include: {
        colaborador: true,
      },
    });

    if (!usuario) {
      throw new AppErrorNotFound('Usuário não encontrado');
    }

    if (!usuario.colaborador && usuario.perfil === USUARIO_PERFIL.LOJISTA) {
      return {
        idColaborador: null,
        idUsuario: usuario.id,
        idLoja,
        nome: usuario.nome,
      };
    }

    const colaborador = await this.prismaService.colaborador.findFirst({
      where: {
        idUsuario: idUsuario,
        idLoja,
      },
    });

    if (!colaborador) {
      throw new AppErrorNotFound('Colaborador não encontrado');
    }

    return colaborador;
  }

  private async criarNotificacaoVisitaDia(
    visita: VisitasAtendimento,
    atendimento: any,
  ) {
    try {
      const nomeCliente =
        atendimento.cliente?.nome ??
        atendimento.clienteTemporario?.nome ??
        'cliente';

      const responsaveis =
        await this.prismaService.atendimentoResponsaveis.findMany({
          where: {
            idAtendimento: visita.idAtendimento,
          },
          select: {
            colaborador: {
              select: {
                idUsuario: true,
              },
            },
          },
        });

      let horaFormatada = '';
      if (visita.horaInicio) {
        const [horas, minutos] = visita.horaInicio.split(':');
        const horasFormatadas = horas.padStart(2, '0');
        const minutosFormatados = minutos ? minutos.padStart(2, '0') : '00';
        horaFormatada = ` às ${horasFormatadas}:${minutosFormatados}`;
      }

      for (const responsavel of responsaveis) {
        if (responsavel.colaborador?.idUsuario) {
          await this.notificacoesService.criarNovaNotificacao({
            idUsuario: responsavel.colaborador.idUsuario,
            idReferencia: visita.idAtendimento,
            tipo: TiposNotificacaoEnum.VISITA_DIA,
            mensagem: `Você tem uma visita de ${visita.tipo} agendada para hoje${horaFormatada} com ${nomeCliente}`,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao criar notificação de visita do dia:', error);
    }
  }

  private async criarNotificacaoVisitaConcluida(
    visita: VisitasAtendimento,
    atendimento: any,
  ) {
    try {
      const nomeCliente =
        atendimento.cliente?.nome ??
        atendimento.clienteTemporario?.nome ??
        'cliente';

      const responsaveis =
        await this.prismaService.atendimentoResponsaveis.findMany({
          where: {
            idAtendimento: visita.idAtendimento,
          },
          select: {
            colaborador: {
              select: {
                idUsuario: true,
              },
            },
          },
        });

      for (const responsavel of responsaveis) {
        if (responsavel.colaborador?.idUsuario) {
          await this.notificacoesService.criarNovaNotificacao({
            idUsuario: responsavel.colaborador.idUsuario,
            idReferencia: visita.idAtendimento,
            tipo: TiposNotificacaoEnum.VISITA_REALIZADA,
            mensagem: `A visita de ${visita.tipo} com ${nomeCliente} foi concluída`,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao criar notificação de visita concluída:', error);
    }
  }

  private verificarVisitaParaHoje(data: Date): boolean {
    const hoje = new Date();
    const diaHoje = hoje.getDate();
    const mesHoje = hoje.getMonth();
    const anoHoje = hoje.getFullYear();

    const dataAgendada = new Date(data);
    const diaAgendado = dataAgendada.getDate();
    const mesAgendado = dataAgendada.getMonth();
    const anoAgendado = dataAgendada.getFullYear();

    const resultado =
      diaHoje === diaAgendado &&
      mesHoje === mesAgendado &&
      anoHoje === anoAgendado;

    return resultado;
  }

  async criarVisita(
    idUsuario: string,
    createVisitaDto: CriarVisitaDto,
    idAtendimento: string,
    idLoja: string,
  ) {
    const atendimento = await this.pegarAtendimentoPorId(idAtendimento, idLoja);
    await this.pegarColaboradorPorIdUsuario(idUsuario, idLoja);

    const visitaData =
      createVisitaDto.data instanceof Date
        ? createVisitaDto.data
        : new Date(createVisitaDto.data);

    const visitaCriada = await this.prismaService.visitasAtendimento.create({
      data: {
        ...createVisitaDto,
        idAtendimento,
      },
    });

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    this.eventoService.emitVisitaCriada({
      idAtendimento,
      idUsuario,
      nomeUsuario: nomeUsuarioLogado,
      dadosNovos: {
        tipo: createVisitaDto.tipo,
        data: createVisitaDto.data,
        horaInicio: createVisitaDto.horaInicio,
        horaFim: createVisitaDto.horaFim,
        observacoes: createVisitaDto.observacoes,
        clienteNome:
          atendimento.cliente?.nome ?? atendimento.clienteTemporario?.nome,
      },
      contexto: {
        detalhes: {
          acao: 'visita_agendada',
          clienteNome:
            atendimento.cliente?.nome ?? atendimento.clienteTemporario?.nome,
          tipoVisita: createVisitaDto.tipo,
        },
      },
    });

    if (this.verificarVisitaParaHoje(visitaCriada.data)) {
      await this.criarNotificacaoVisitaDia(visitaCriada, atendimento);
    }

    const responsaveis =
      await this.prismaService.atendimentoResponsaveis.findMany({
        where: {
          idAtendimento,
        },
        select: {
          colaborador: {
            select: {
              idUsuario: true,
            },
          },
        },
      });

    const nomeCliente =
      atendimento.cliente?.nome ??
      atendimento.clienteTemporario?.nome ??
      'cliente';
    const dataFormatada = new Date(visitaCriada.data).toLocaleDateString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    );

    let horaFormatada = '';
    if (visitaCriada.horaInicio) {
      const [horas, minutos] = visitaCriada.horaInicio.split(':');
      const horasFormatadas = horas.padStart(2, '0');
      const minutosFormatados = minutos ? minutos.padStart(2, '0') : '00';
      horaFormatada = ` às ${horasFormatadas}:${minutosFormatados}`;
    }

    for (const responsavel of responsaveis) {
      if (responsavel.colaborador?.idUsuario) {
        await this.notificacoesService.criarNovaNotificacao({
          idUsuario: responsavel.colaborador.idUsuario,
          idReferencia: idAtendimento,
          tipo: TiposNotificacaoEnum.VISITA_AGENDADA,
          mensagem: `Nova visita de ${visitaCriada.tipo} agendada para ${dataFormatada}${horaFormatada} com ${nomeCliente}`,
        });
      }
    }

    return visitaCriada;
  }

  async listarVisitas(idAtendimento: string, idLoja: string) {
    await this.pegarAtendimentoPorId(idAtendimento, idLoja);

    const visita = await this.prismaService.visitasAtendimento.findFirst({
      where: {
        idAtendimento,
        concluida: false,
      },
      include: {
        atendimento: {
          include: {
            cliente: true,
            clienteTemporario: true,
          },
        },
      },
      orderBy: {
        criadoEm: 'desc',
      },
    });

    return visita ? [visita] : [];
  }

  async pegarVisita(idVisita: string) {
    const visita = await this.prismaService.visitasAtendimento.findUnique({
      where: {
        id: idVisita,
      },
      include: {
        atendimento: {
          include: {
            cliente: true,
            clienteTemporario: true,
          },
        },
      },
    });

    if (!visita) {
      throw new AppErrorNotFound('Nenhuma visita com este ID foi encontrada');
    }

    return visita;
  }

  async concluirVisita(idUsuario: string, idVisita: string) {
    const visita = await this.pegarVisita(idVisita);

    if (visita.concluida) {
      return visita;
    }

    const visitaAlterada = await this.prismaService.visitasAtendimento.update({
      where: {
        id: idVisita,
      },
      data: {
        concluida: true,
      },
    });

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    this.eventoService.emitVisitaConcluida({
      idAtendimento: visita.idAtendimento,
      idUsuario,
      nomeUsuario: nomeUsuarioLogado,
      dadosAntigos: { concluida: false },
      dadosNovos: { concluida: true },
      contexto: {
        detalhes: {
          acao: 'visita_concluida',
          tipoVisita: visitaAlterada.tipo,
          dataVisita: visitaAlterada.data,
          clienteNome:
            visita.atendimento.cliente?.nome ??
            visita.atendimento.clienteTemporario?.nome,
        },
      },
    });

    await this.criarNotificacaoVisitaConcluida(
      visitaAlterada,
      visita.atendimento,
    );

    return visitaAlterada;
  }

  async excluirVisita(params: {
    idLoja: string;
    idUsuario: string;
    idVisita: string;
    idAtendimento: string;
  }) {
    const { idLoja, idAtendimento, idUsuario, idVisita } = params;
    await this.pegarColaboradorPorIdUsuario(idUsuario, idLoja);
    const visita = await this.pegarVisita(idVisita);

    const visitaExcluida = await this.prismaService.visitasAtendimento.delete({
      where: {
        id: idVisita,
        atendimento: {
          id: idAtendimento,
          idLoja,
        },
      },
    });

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    this.eventoService.emitVisitaExcluida({
      idAtendimento: visita.idAtendimento,
      idUsuario,
      nomeUsuario: nomeUsuarioLogado,
      dadosAntigos: {
        tipo: visita.tipo,
        data: visita.data,
        horaInicio: visita.horaInicio,
        horaFim: visita.horaFim,
        observacoes: visita.observacoes,
      },
      contexto: {
        detalhes: {
          acao: 'visita_excluida',
          tipoVisita: visita.tipo,
        },
      },
    });

    return visitaExcluida;
  }

  /**
   * Método para ser executado por um job agendado diariamente
   * Cria notificações para todas as visitas agendadas para o dia atual
   */
  async criarNotificacoesVisitasDoDia() {
    const hoje = new Date();
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataHoje = `${ano}-${mes}-${dia}`;

    const inicioHoje = new Date(
      Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0),
    );
    const fimHoje = new Date(
      Date.UTC(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const visitasHoje = await this.prismaService.visitasAtendimento.findMany({
      where: {
        data: {
          gte: inicioHoje,
          lte: fimHoje,
        },
        concluida: false,
      },
      include: {
        atendimento: {
          include: {
            cliente: true,
            clienteTemporario: true,
          },
        },
      },
    });

    for (const visita of visitasHoje) {
      await this.criarNotificacaoVisitaDia(visita, visita.atendimento);
    }

    return {
      mensagem: `Notificações criadas para ${visitasHoje.length} visitas agendadas para hoje (${dataHoje}).`,
    };
  }
}
