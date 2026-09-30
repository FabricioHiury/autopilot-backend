import { Injectable } from '@nestjs/common';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';
import { EditarTarefaDto } from './dto/editar-tarefa.dto';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { AppErrorNotFound } from 'src/utils/errors/app-errors';
import { EventoService } from '../eventos/evento.service';
import { TarefasAtendimento } from '@prisma/client';
import { NotificacoesService } from 'src/core/notificacoes/notificacoes.service';
import { TiposNotificacaoEnum } from 'src/utils/enum/notificacoes.enum';

@Injectable()
export class TarefasService {
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
    });

    if (!atendimento) {
      throw new AppErrorNotFound(
        'Nenhum atendimento com este ID foi encontrado',
      );
    }

    return atendimento;
  }

  private async pegarColaboradorPorId(idColaborador: string, idLoja: string) {
    const colaborador = await this.prismaService.colaborador.findFirst({
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

  private async emitirEventosEdicaoTarefa(
    tarefa: TarefasAtendimento & { colaborador: { nome: string } },
    idAtendimento: string,
    nomeUsuarioLogado: string,
    data: EditarTarefaDto,
  ) {
    if (data.nome) {
      this.eventoService.emitTarefaNomeAlterado({
        idAtendimento,
        idUsuario: nomeUsuarioLogado,
        dadosAntigos: {
          nome: tarefa.nome,
        },
        dadosNovos: {
          nome: data.nome,
        },
        contexto: {
          detalhes: {
            acao: 'tarefa_nome_alterado',
            tarefa: tarefa.nome,
          },
        },
      });
    }

    if (data.observacoes) {
      this.eventoService.emitTarefaObservacoesAlteradas({
        idAtendimento,
        idUsuario: nomeUsuarioLogado,
        dadosAntigos: {
          observacoes: tarefa.observacoes,
        },
        dadosNovos: {
          observacoes: data.observacoes,
        },
        contexto: {
          detalhes: {
            acao: 'tarefa_observacoes_alteradas',
            tarefa: tarefa.nome,
          },
        },
      });
    }

    if (data.idResponsavel) {
      const nomeResponsavel = await this.prismaService.colaborador.findUnique({
        where: {
          id: data.idResponsavel,
        },
        select: {
          nome: true,
        },
      });

      this.eventoService.emitTarefaResponsavelAlterado({
        idAtendimento,
        idUsuario: nomeUsuarioLogado,
        dadosAntigos: {
          idResponsavel: tarefa.idResponsavel,
          nomeResponsavel: tarefa.colaborador?.nome,
        },
        dadosNovos: {
          idResponsavel: data.idResponsavel,
          nomeResponsavel: nomeResponsavel,
        },
        contexto: {
          detalhes: {
            acao: 'tarefa_responsavel_alterado',
            tarefa: tarefa.nome,
          },
        },
      });
    }

    if (data.horaInicio) {
      this.eventoService.emitTarefaHoraInicioAlterada({
        idAtendimento,
        idUsuario: nomeUsuarioLogado,
        dadosAntigos: {
          horaInicio: tarefa.horaInicio,
        },
        dadosNovos: {
          horaInicio: data.horaInicio,
        },
        contexto: {
          detalhes: {
            acao: 'tarefa_hora_inicio_alterada',
            tarefa: tarefa.nome,
          },
        },
      });
    }

    if (data.horaFim) {
      this.eventoService.emitTarefaHoraFimAlterada({
        idAtendimento,
        idUsuario: nomeUsuarioLogado,
        dadosAntigos: {
          horaFim: tarefa.horaFim,
        },
        dadosNovos: {
          horaFim: data.horaFim,
        },
        contexto: {
          detalhes: {
            acao: 'tarefa_hora_fim_alterada',
            tarefa: tarefa.nome,
          },
        },
      });
    }

    if (data.data) {
      this.eventoService.emitTarefaDataAlterada({
        idAtendimento,
        idUsuario: nomeUsuarioLogado,
        dadosAntigos: {
          data: tarefa.data,
        },
        dadosNovos: {
          data: data.data,
        },
        contexto: {
          detalhes: {
            acao: 'tarefa_data_alterada',
            tarefa: tarefa.nome,
          },
        },
      });
    }
  }

  private async criarNotificacaoTarefaDia(tarefa: TarefasAtendimento) {
    try {
      const colaborador = await this.prismaService.colaborador.findUnique({
        where: {
          id: tarefa.idResponsavel,
        },
        select: {
          idUsuario: true,
        },
      });

      if (!colaborador?.idUsuario) return;

      let horaFormatada = '';
      if (tarefa.horaInicio) {
        const [horas, minutos] = tarefa.horaInicio.split(':');
        const horasFormatadas = horas.padStart(2, '0');
        const minutosFormatados = minutos ? minutos.padStart(2, '0') : '00';
        horaFormatada = ` às ${horasFormatadas}:${minutosFormatados}`;
      }

      await this.notificacoesService.criarNovaNotificacao({
        idUsuario: colaborador.idUsuario,
        idReferencia: tarefa.idAtendimento,
        tipo: TiposNotificacaoEnum.TAREFAS_DIA,
        mensagem: `Você tem a tarefa "${tarefa.nome}" agendada para hoje ${horaFormatada}`,
      });
    } catch (error) {
      console.error('Erro ao criar notificação de tarefa do dia:', error);
    }
  }

  private async criarNotificacaoTarefaConcluida(
    tarefa: TarefasAtendimento,
    concluida: boolean,
  ) {
    if (!concluida) return;

    try {
      const colaborador = await this.prismaService.colaborador.findUnique({
        where: {
          id: tarefa.idResponsavel,
        },
        select: {
          idUsuario: true,
        },
      });

      if (!colaborador?.idUsuario) return;

      await this.notificacoesService.criarNovaNotificacao({
        idUsuario: colaborador.idUsuario,
        idReferencia: tarefa.idAtendimento,
        tipo: TiposNotificacaoEnum.TAREFA_REALIZADA,
        mensagem: `A tarefa "${tarefa.nome}" foi concluída`,
      });
    } catch (error) {
      console.error('Erro ao criar notificação de tarefa concluída:', error);
    }
  }

  private verificarTarefaParaHoje(data: Date): boolean {
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

  async criarTarefa(
    idUsuario: string,
    createTarefaDto: CriarTarefaDto,
    idAtendimento: string,
    idLoja: string,
  ) {
    await this.pegarAtendimentoPorId(idAtendimento, idLoja);
    await this.pegarColaboradorPorId(createTarefaDto.idResponsavel, idLoja);

    const tarefaCriada = await this.prismaService.tarefasAtendimento.create({
      data: {
        ...createTarefaDto,
        idAtendimento,
      },
    });

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    this.eventoService.emitTarefaCriada({
      idAtendimento,
      idUsuario,
      nomeUsuario: nomeUsuarioLogado,
      dadosNovos: {
        nome: createTarefaDto.nome,
        observacoes: createTarefaDto.observacoes,
        data: createTarefaDto.data,
        idResponsavel: createTarefaDto.idResponsavel,
      },
      contexto: {
        detalhes: {
          acao: 'tarefa_criada',
          tarefaNome: createTarefaDto.nome,
        },
      },
    });

    if (this.verificarTarefaParaHoje(tarefaCriada.data)) {
      await this.criarNotificacaoTarefaDia(tarefaCriada);
    }

    const colaborador = await this.prismaService.colaborador.findUnique({
      where: {
        id: createTarefaDto.idResponsavel,
      },
      select: {
        idUsuario: true,
      },
    });

    if (colaborador?.idUsuario) {
      await this.notificacoesService.criarNovaNotificacao({
        idUsuario: colaborador.idUsuario,
        idReferencia: idAtendimento,
        tipo: TiposNotificacaoEnum.TAREFA_CRIADA,
        mensagem: `Uma nova tarefa "${tarefaCriada.nome}" foi atribuída a você`,
      });
    }

    return tarefaCriada;
  }

  async listarTarefas(idAtendimento: string, idLoja: string) {
    await this.pegarAtendimentoPorId(idAtendimento, idLoja);

    return this.prismaService.tarefasAtendimento.findMany({
      where: {
        idAtendimento,
      },
      include: {
        colaborador: {
          include: {
            usuario: {
              select: {
                nome: true,
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        data: 'asc',
      },
    });
  }

  async pegarTarefa(idTarefa: string) {
    const tarefa = await this.prismaService.tarefasAtendimento.findUnique({
      where: {
        id: idTarefa,
      },
      include: {
        atendimento: {
          select: {
            idLoja: true,
          },
        },
      },
    });

    if (!tarefa) {
      throw new AppErrorNotFound('Nenhuma tarefa com este ID foi encontrada');
    }

    return tarefa;
  }

  async editarTarefa(
    idUsuario: string,
    idTarefa: string,
    data: EditarTarefaDto,
  ) {
    const tarefa = await this.pegarTarefa(idTarefa);

    if (data.idResponsavel) {
      await this.pegarColaboradorPorId(
        data.idResponsavel,
        tarefa.atendimento.idLoja,
      );
    }

    const tarefaEditada = await this.prismaService.tarefasAtendimento.update({
      where: {
        id: idTarefa,
      },
      data: { ...data },
      include: {
        colaborador: {
          select: {
            nome: true,
          },
        },
      },
    });

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    this.emitirEventosEdicaoTarefa(
      tarefaEditada,
      tarefa.idAtendimento,
      nomeUsuarioLogado,
      data,
    );

    return tarefaEditada;
  }

  async alterarStatusTarefa(idUsuario: string, idTarefa: string) {
    const tarefa = await this.pegarTarefa(idTarefa);

    const tarefaAlterada = await this.prismaService.tarefasAtendimento.update({
      where: {
        id: idTarefa,
      },
      data: {
        concluida: !tarefa.concluida,
      },
    });

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    this.eventoService.emitTarefaConcluida({
      idAtendimento: tarefa.idAtendimento,
      idUsuario,
      nomeUsuario: nomeUsuarioLogado,
      dadosAntigos: { concluida: tarefa.concluida },
      dadosNovos: { concluida: tarefaAlterada.concluida },
      contexto: {
        detalhes: {
          acao: tarefaAlterada.concluida
            ? 'tarefa_concluida'
            : 'tarefa_reaberta',
          tarefaNome: tarefa.nome,
        },
      },
    });

    await this.criarNotificacaoTarefaConcluida(
      tarefaAlterada,
      tarefaAlterada.concluida,
    );

    return tarefaAlterada;
  }

  async deletarTarefa(idTarefa: string, idUsuario: string) {
    await this.pegarTarefa(idTarefa);

    const tarefa = await this.prismaService.tarefasAtendimento.delete({
      where: {
        id: idTarefa,
      },
    });

    const nomeUsuarioLogado = await this.obterNomeUsuarioPorId(idUsuario);

    this.eventoService.emitTarefaExcluida({
      idAtendimento: tarefa.idAtendimento,
      idUsuario,
      nomeUsuario: nomeUsuarioLogado,
      dadosAntigos: {
        nome: tarefa.nome,
        observacoes: tarefa.observacoes,
        data: tarefa.data,
        concluida: tarefa.concluida,
      },
      contexto: {
        detalhes: {
          acao: 'tarefa_excluida',
          tarefaNome: tarefa.nome,
        },
      },
    });

    return tarefa;
  }

  /**
   * Método para ser executado por um job agendado diariamente
   * Cria notificações para todas as tarefas agendadas para o dia atual
   */
  async criarNotificacoesTarefasDoDia() {
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

    const tarefasHoje = await this.prismaService.tarefasAtendimento.findMany({
      where: {
        data: {
          gte: inicioHoje,
          lte: fimHoje,
        },
        concluida: false,
      },
    });

    for (const tarefa of tarefasHoje) {
      await this.criarNotificacaoTarefaDia(tarefa);
    }

    return {
      mensagem: `Notificações criadas para ${tarefasHoje.length} tarefas agendadas para hoje (${dataHoje}).`,
    };
  }
}
