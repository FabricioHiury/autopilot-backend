import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/persistence/database/prisma/prisma.service';
import { TIPO_EVENTO_LOG } from '../../utils/log-atividades.enum';
import { 
  STATUS_ATENDIMENTO_MAP, 
  MOTIVOS_PERDA_MAP, 
  SUB_MOTIVOS_PERDA_MAP 
} from 'src/utils/enum/atendimento.enum';

export interface LogAtividadeAutomaticoParams {
  idAtendimento: string;
  idUsuario?: string;
  nomeUsuario?: string;
  dadosAntigos?: any;
  dadosNovos?: any;
  operacao?:
    | 'criar'
    | 'editar'
    | 'arquivar'
    | 'desarquivar'
    | 'comentar'
    | 'tarefa'
    | 'visita'
    | 'suspensao'
    | 'distribuicao';
  entidade?: 'atendimento' | 'tarefa' | 'visita' | 'comentario' | 'cliente' | 'suspensao' | 'distribuicao';
  contexto?: {
    detalhes?: any;
  };
}

@Injectable()
export class LogAtividadesService {
  private readonly logger = new Logger(LogAtividadesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrarLogAutomatico(
    params: LogAtividadeAutomaticoParams,
  ): Promise<void> {
    console.log('📝 Iniciando registro de log automático:', params);
    try {
      const eventos = this.detectarEventos(params);
      console.log('🔍 Eventos detectados:', eventos.length);

      for (const evento of eventos) {
        console.log('💾 Registrando evento:', evento);
        await this.registrarLog(evento);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao registrar log automático: ${error.message}`,
        error.stack,
      );
      console.error('❌ Erro detalhado:', error);
    }
  }

  private detectarEventos(params: LogAtividadeAutomaticoParams): Array<{
    idAtendimento: string;
    idUsuario?: string;
    tipoEvento: TIPO_EVENTO_LOG;
    mensagem: string;
    dadosAntigos?: any;
    dadosNovos?: any;
  }> {
    const eventos = [];
    const {
      idAtendimento,
      idUsuario,
      nomeUsuario,
      dadosAntigos,
      dadosNovos,
      contexto,
      operacao,
      entidade,
    } = params;

    if (operacao === 'criar') {
      if (entidade === 'atendimento') {
        eventos.push({
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.CRIACAO,
          mensagem: `Atendimento criado por ${nomeUsuario || 'usuário'}`,
          dadosNovos,
        });
      } else if (entidade === 'comentario') {
        const comentarioTruncado =
          dadosNovos?.comentario?.length > 50
            ? dadosNovos.comentario.substring(0, 50) + '...'
            : dadosNovos?.comentario;

        eventos.push({
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.ADICAO_COMENTARIO,
          mensagem: `Comentário adicionado por ${nomeUsuario || 'usuário'}: "${comentarioTruncado}"`,
          dadosNovos,
        });
      }
      return eventos;
    }

    if (operacao === 'tarefa' && contexto?.detalhes?.acao === 'tarefa_criada') {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.CRIACAO_TAREFA,
        mensagem: `Tarefa "${dadosNovos?.nome || 'Nova tarefa'}" criada por ${nomeUsuario || 'usuário'}`,
        dadosNovos,
      });
    }

    if (operacao === 'visita' && contexto?.detalhes?.acao === 'visita_agendada') {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.AGENDAMENTO_VISITA,
        mensagem: `Visita agendada para ${dadosNovos?.data} por ${nomeUsuario || 'usuário'}`,
        dadosNovos,
      });
    }

    if (operacao === 'visita' && contexto?.detalhes?.acao === 'visita_confirmada') {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.CONFIRMACAO_VISITA,
        mensagem: `Visita confirmada por ${nomeUsuario || 'usuário'}`,
        dadosNovos,
      });
    }

    if (operacao === 'arquivar') {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.ARQUIVAMENTO,
        mensagem: `Atendimento arquivado por ${nomeUsuario || 'usuário'}`,
        dadosNovos: { isArchived: true },
      });
      return eventos;
    }

    if (operacao === 'desarquivar') {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.DESARQUIVAMENTO,
        mensagem: `Atendimento desarquivado por ${nomeUsuario || 'usuário'}`,
        dadosNovos: { isArchived: false },
      });
      return eventos;
    }

    if (operacao === 'editar' && entidade === 'atendimento') {
      if (dadosAntigos && dadosNovos) {
        const alteracoes = this.compararDados(dadosAntigos, dadosNovos);
        
        for (const alteracao of alteracoes) {
          const evento = this.criarEventoPorAlteracao(
            alteracao,
            idAtendimento,
            idUsuario,
            nomeUsuario,
            contexto,
          );
          if (evento) {
            eventos.push(evento);
          }
        }
      }
      
      if (eventos.length === 0) {
        eventos.push({
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.MUDANCA_STATUS,
          mensagem: `Atendimento editado por ${nomeUsuario || 'usuário'}`,
          dadosAntigos,
          dadosNovos,
        });
      }
      
      return eventos;
    }

    if (entidade === 'tarefa' && contexto?.detalhes?.acao) {
      const acao = contexto.detalhes.acao;
      const tarefaNome = contexto.detalhes.tarefa || dadosNovos?.nome || 'tarefa';

      switch (acao) {
        case 'tarefa_nome_alterado':
          eventos.push({
            idAtendimento,
            idUsuario,
            tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_NOME_TAREFA,
            mensagem: `Nome da tarefa alterado de "${dadosAntigos?.nome}" para "${dadosNovos?.nome}" por ${nomeUsuario || 'usuário'}`,
            dadosAntigos,
            dadosNovos,
          });
          break;

        case 'tarefa_observacoes_alteradas':
          const observacoesAntigas = dadosAntigos?.observacoes || 'sem observações';
          const observacoesNovas = dadosNovos?.observacoes?.length > 50 
            ? dadosNovos.observacoes.substring(0, 50) + '...' 
            : dadosNovos?.observacoes;
          
          eventos.push({
            idAtendimento,
            idUsuario,
            tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_OBSERVACOES_TAREFA,
            mensagem: `Observações da tarefa "${tarefaNome}" alteradas por ${nomeUsuario || 'usuário'}`,
            dadosAntigos,
            dadosNovos,
          });
          break;

        case 'tarefa_responsavel_alterado':
          const responsavelAntigo = dadosAntigos?.nomeResponsavel || 'sem responsável';
          const responsavelNovo = dadosNovos?.nomeResponsavel?.nome || 'sem responsável';
          
          eventos.push({
            idAtendimento,
            idUsuario,
            tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_RESPONSAVEL_TAREFA,
            mensagem: `Responsável da tarefa "${tarefaNome}" alterado de "${responsavelAntigo}" para "${responsavelNovo}" por ${nomeUsuario || 'usuário'}`,
            dadosAntigos,
            dadosNovos,
          });
          break;

        case 'tarefa_hora_inicio_alterada':
          eventos.push({
            idAtendimento,
            idUsuario,
            tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_HORA_INICIO_TAREFA,
            mensagem: `Hora de início da tarefa "${tarefaNome}" alterada para ${dadosNovos?.horaInicio}h por ${nomeUsuario || 'usuário'}`,
            dadosAntigos,
            dadosNovos,
          });
          break;

        case 'tarefa_hora_fim_alterada':
          eventos.push({
            idAtendimento,
            idUsuario,
            tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_HORA_FIM_TAREFA,
            mensagem: `Hora de fim da tarefa "${tarefaNome}" alterada para ${dadosNovos?.horaFim}h por ${nomeUsuario || 'usuário'}`,
            dadosAntigos,
            dadosNovos,
          });
          break;

        case 'tarefa_data_alterada':
          const dataFormatada = new Date(dadosNovos?.data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          });
          
          eventos.push({
            idAtendimento,
            idUsuario,
            tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_DATA_TAREFA,
            mensagem: `Data da tarefa "${tarefaNome}" alterada para ${dataFormatada} por ${nomeUsuario || 'usuário'}`,
            dadosAntigos,
            dadosNovos,
          });
          break;
      }
    }

    if (dadosAntigos && dadosNovos) {
      const alteracoes = this.compararDados(dadosAntigos, dadosNovos);

      for (const alteracao of alteracoes) {
        const evento = this.criarEventoPorAlteracao(
          alteracao,
          idAtendimento,
          idUsuario,
          nomeUsuario,
          contexto,
        );
        if (evento) {
          eventos.push(evento);
        }
      }
    }

    if (contexto?.detalhes?.responsaveisAdicionados?.length > 0) {
      for (const responsavel of contexto.detalhes.responsaveisAdicionados) {
        eventos.push({
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.ATRIBUICAO_RESPONSAVEL,
          mensagem: `${responsavel.nome} foi atribuído como responsável por ${nomeUsuario || 'usuário'}`,
          dadosNovos: { responsavel: responsavel.nome },
        });
      }
    }

    if (contexto?.detalhes?.responsaveisRemovidos?.length > 0) {
      for (const responsavel of contexto.detalhes.responsaveisRemovidos) {
        eventos.push({
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.REMOCAO_RESPONSAVEL,
          mensagem: `${responsavel.nome} foi removido como responsável por ${nomeUsuario || 'usuário'}`,
          dadosAntigos: { responsavel: responsavel.nome },
        });
      }
    }

    if (entidade === 'tarefa' && dadosNovos?.concluida === true) {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.CONCLUSAO_TAREFA,
        mensagem: `Tarefa "${dadosNovos.nome || 'tarefa'}" concluída por ${nomeUsuario || 'usuário'}`,
        dadosNovos,
      });
    }

    if (entidade === 'visita' && dadosNovos?.concluida === true) {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.CONCLUSAO_VISITA,
        mensagem: `Visita concluída por ${nomeUsuario || 'usuário'}`,
        dadosNovos,
      });
    }

    if (entidade === 'tarefa' && contexto?.detalhes?.acao === 'tarefa_excluida') {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.REMOCAO_TAREFA,
        mensagem: `Tarefa "${contexto.detalhes.tarefaNome || 'tarefa'}" removida por ${nomeUsuario || 'usuário'}`,
        dadosAntigos,
      });
    }

    if (entidade === 'visita' && contexto?.detalhes?.acao === 'visita_excluida') {
      eventos.push({
        idAtendimento,
        idUsuario,
        tipoEvento: TIPO_EVENTO_LOG.REMOCAO_VISITA,
        mensagem: `Visita de ${contexto.detalhes.tipoVisita} removida por ${nomeUsuario || 'usuário'}`,
        dadosAntigos,
      });
    }

    return eventos;
  }

  private criarEventoPorAlteracao(
    alteracao: { campo: string; valorAntigo: any; valorNovo: any },
    idAtendimento: string,
    idUsuario?: string,
    nomeUsuario?: string,
    contexto?: any,
  ) {
    const { campo, valorAntigo, valorNovo } = alteracao;

    switch (campo) {
      case 'status':
        const statusAntigo = STATUS_ATENDIMENTO_MAP[valorAntigo] || valorAntigo;
        const statusNovo = STATUS_ATENDIMENTO_MAP[valorNovo] || valorNovo;
        let mensagemStatus = `Status alterado de "${statusAntigo}" para "${statusNovo}" por ${nomeUsuario || 'usuário'}`;

        const dadosNovosStatus: any = { status: valorNovo };

        if (valorNovo === 'perdido' && contexto?.detalhes?.motivoPerdido) {
          const motivoLegivel = MOTIVOS_PERDA_MAP[contexto.detalhes.motivoPerdido] || contexto.detalhes.motivoPerdido;
          mensagemStatus += `. Motivo: ${motivoLegivel}`;
          
          dadosNovosStatus.motivo = motivoLegivel;
          
          if (contexto.detalhes.subMotivoPerdido) {
            const subMotivoLegivel = SUB_MOTIVOS_PERDA_MAP[contexto.detalhes.subMotivoPerdido] || contexto.detalhes.subMotivoPerdido;
            mensagemStatus += ` - ${subMotivoLegivel}`;
            
            dadosNovosStatus.subMotivo = subMotivoLegivel;
          }
        }

        return {
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.MUDANCA_STATUS,
          mensagem: mensagemStatus,
          dadosAntigos: { status: valorAntigo },
          dadosNovos: dadosNovosStatus,
        };

      case 'titulo':
        return {
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_TITULO,
          mensagem: `Título alterado de "${valorAntigo}" para "${valorNovo}" por ${nomeUsuario || 'usuário'}`,
          dadosAntigos: { titulo: valorAntigo },
          dadosNovos: { titulo: valorNovo },
        };

      case 'observacao':
        const observacaoAntigaTruncada =
          valorAntigo?.length > 30
            ? valorAntigo.substring(0, 30) + '...'
            : valorAntigo || 'vazia';
        const observacaoNovaTruncada =
          valorNovo?.length > 30
            ? valorNovo.substring(0, 30) + '...'
            : valorNovo || 'vazia';

        return {
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_OBSERVACAO,
          mensagem: `Observação alterada de "${observacaoAntigaTruncada}" para "${observacaoNovaTruncada}" por ${nomeUsuario || 'usuário'}`,
          dadosAntigos: { observacao: valorAntigo },
          dadosNovos: { observacao: valorNovo },
        };

      case 'temperatura':
        return {
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_TEMPERATURA,
          mensagem: `Temperatura alterada de "${valorAntigo}" para "${valorNovo}" por ${nomeUsuario || 'usuário'}`,
          dadosAntigos: { temperatura: valorAntigo },
          dadosNovos: { temperatura: valorNovo },
        };

      case 'modoAtendimento':
        return {
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_TIPO_ATENDIMENTO,
          mensagem: `Tipo de atendimento alterado de "${valorAntigo}" para "${valorNovo}" por ${nomeUsuario || 'usuário'}`,
          dadosAntigos: { tipo: valorAntigo },
          dadosNovos: { tipo: valorNovo },
        };

      case 'nome':
      case 'email':
      case 'whatsapp':
        return {
          idAtendimento,
          idUsuario,
          tipoEvento: TIPO_EVENTO_LOG.ALTERACAO_DADOS_CLIENTE,
          mensagem: `Dados do cliente alterados por ${nomeUsuario || 'usuário'}: ${campo} de "${valorAntigo}" para "${valorNovo}"`,
          dadosAntigos: { [campo]: valorAntigo },
          dadosNovos: { [campo]: valorNovo },
        };

      default:
        return null;
    }
  }

  private async registrarLog(params: {
    idAtendimento: string;
    idUsuario?: string;
    tipoEvento: TIPO_EVENTO_LOG;
    mensagem: string;
    dadosAntigos?: any;
    dadosNovos?: any;
  }): Promise<void> {
    await this.prisma.logAtividadesAtendimento.create({
      data: {
        idAtendimento: params.idAtendimento,
        idUsuario: params.idUsuario,
        tipoEvento: params.tipoEvento,
        mensagem: params.mensagem,
        dadosAntigos: params.dadosAntigos,
        dadosNovos: params.dadosNovos,
      },
    });

    this.logger.log(
      `Log registrado: ${params.tipoEvento} - ${params.mensagem}`,
    );
  }

  async listarLogsAtendimento(
    idAtendimento: string,
    pagina: number = 1,
    quantidade: number = 20,
  ) {
    const skip = (pagina - 1) * quantidade;

    const [logs, total] = await Promise.all([
      this.prisma.logAtividadesAtendimento.findMany({
        where: { idAtendimento },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              urlFoto: true,
            },
          },
        },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: quantidade,
      }),
      this.prisma.logAtividadesAtendimento.count({
        where: { idAtendimento },
      }),
    ]);

    if (!logs.length) {
      return {
        logs: [],
        total: 0,
        pagina,
        quantidade,
        totalPaginas: 0,
      };
    }

    return {
      logs,
      total,
      pagina,
      quantidade,
      totalPaginas: Math.ceil(total / quantidade),
    };
  }

  private compararDados(
    dadosAntigos: any,
    dadosNovos: any,
  ): Array<{ campo: string; valorAntigo: any; valorNovo: any }> {
    const alteracoes = [];
    const campos = new Set([
      ...Object.keys(dadosAntigos || {}),
      ...Object.keys(dadosNovos || {}),
    ]);

    for (const campo of campos) {
      const valorAntigo = dadosAntigos?.[campo];
      const valorNovo = dadosNovos?.[campo];

      if (typeof valorAntigo === 'string' && typeof valorNovo === 'string') {
        if (valorAntigo.trim() !== valorNovo.trim()) {
          alteracoes.push({
            campo,
            valorAntigo,
            valorNovo,
          });
        }
      } else if (JSON.stringify(valorAntigo) !== JSON.stringify(valorNovo)) {
        alteracoes.push({
          campo,
          valorAntigo,
          valorNovo,
        });
      }
    }

    return alteracoes;
  }
}
