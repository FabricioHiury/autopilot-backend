import { Injectable } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { LogAtividadesService } from '../log-atividades/log-atividades.service';

export interface AtendimentoEventData {
  idAtendimento: string;
  idUsuario?: string;
  nomeUsuario?: string;
  dadosAntigos?: any;
  dadosNovos?: any;
  operacao:
    | 'criar'
    | 'editar'
    | 'arquivar'
    | 'desarquivar'
    | 'comentar'
    | 'tarefa'
    | 'visita'
    | 'suspensao'
    | 'distribuicao';
  entidade: 'atendimento' | 'tarefa' | 'visita' | 'comentario' | 'cliente' | 'suspensao' | 'distribuicao';
  contexto?: {
    detalhes?: any;
  };
}

@Injectable()
export class EventoService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logAtividadesService: LogAtividadesService,
  ) {
    console.log('🚀 EventoService inicializado');
    console.log('🔍 EventEmitter disponível:', !!this.eventEmitter);
  }

  @OnEvent('atendimento.criado')
  async handleAtendimentoCriado(data: AtendimentoEventData) {
    try {
      console.log('🎯 Listener atendimento.criado capturou:', data);
      await this.logAtividadesService.registrarLogAutomatico({
        idAtendimento: data.idAtendimento,
        idUsuario: data.idUsuario,
        nomeUsuario: data.nomeUsuario,
        dadosAntigos: data.dadosAntigos,
        dadosNovos: data.dadosNovos,
        operacao: data.operacao,
        entidade: data.entidade,
        contexto: data.contexto
      });
    } catch (error) {
      console.error('❌ Erro no listener atendimento.criado:', error);
    }
  }

  @OnEvent('atendimento.editado')
  async handleAtendimentoEditado(data: AtendimentoEventData) {
    try {
      console.log('🎯 Listener atendimento.editado capturou:', data);
      await this.logAtividadesService.registrarLogAutomatico({
        idAtendimento: data.idAtendimento,
        idUsuario: data.idUsuario,
        nomeUsuario: data.nomeUsuario,
        dadosAntigos: data.dadosAntigos,
        dadosNovos: data.dadosNovos,
        operacao: data.operacao,
        entidade: data.entidade,
        contexto: data.contexto
      });
    } catch (error) {
      console.error('❌ Erro no listener atendimento.editado:', error);
    }
  }

  @OnEvent('atendimento.arquivado')
  async handleAtendimentoArquivado(data: AtendimentoEventData) {
    try {
      console.log('🎯 Listener atendimento.arquivado capturou:', data);
      await this.logAtividadesService.registrarLogAutomatico({
        idAtendimento: data.idAtendimento,
        idUsuario: data.idUsuario,
        nomeUsuario: data.nomeUsuario,
        dadosAntigos: data.dadosAntigos,
        dadosNovos: data.dadosNovos,
        operacao: data.operacao,
        entidade: data.entidade,
        contexto: data.contexto
      });
    } catch (error) {
      console.error('❌ Erro no listener atendimento.arquivado:', error);
    }
  }

  @OnEvent('atendimento.desarquivado')
  async handleAtendimentoDesarquivado(data: AtendimentoEventData) {
    try {
      console.log('🎯 Listener atendimento.desarquivado capturou:', data);
      await this.logAtividadesService.registrarLogAutomatico({
        idAtendimento: data.idAtendimento,
        idUsuario: data.idUsuario,
        nomeUsuario: data.nomeUsuario,
        dadosAntigos: data.dadosAntigos,
        dadosNovos: data.dadosNovos,
        operacao: data.operacao,
        entidade: data.entidade,
        contexto: data.contexto
      });
    } catch (error) {
      console.error('❌ Erro no listener atendimento.desarquivado:', error);
    }
  }

  @OnEvent('atendimento.comentario')
  async handleComentarioCriado(data: AtendimentoEventData) {
    try {
      console.log('🎯 Listener atendimento.comentario capturou:', data);
      await this.logAtividadesService.registrarLogAutomatico({
        idAtendimento: data.idAtendimento,
        idUsuario: data.idUsuario,
        nomeUsuario: data.nomeUsuario,
        dadosAntigos: data.dadosAntigos,
        dadosNovos: data.dadosNovos,
        operacao: data.operacao,
        entidade: data.entidade,
        contexto: data.contexto
      });
    } catch (error) {
      console.error('❌ Erro no listener atendimento.comentario:', error);
    }
  }

  @OnEvent('atendimento.tarefa')
  async handleTarefaCriada(data: AtendimentoEventData) {
    try {
      console.log('🎯 Listener atendimento.tarefa capturou:', data);
      await this.logAtividadesService.registrarLogAutomatico({
        idAtendimento: data.idAtendimento,
        idUsuario: data.idUsuario,
        nomeUsuario: data.nomeUsuario,
        dadosAntigos: data.dadosAntigos,
        dadosNovos: data.dadosNovos,
        operacao: data.operacao,
        entidade: data.entidade,
        contexto: data.contexto
      });
    } catch (error) {
      console.error('❌ Erro no listener atendimento.tarefa:', error);
    }
  }

  @OnEvent('atendimento.tarefa.editada')
  async handleTarefaEditada(eventData: AtendimentoEventData) {
    console.log('🎯 Tarefa editada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de edição de tarefa:', error);
    }
  }

  @OnEvent('atendimento.tarefa.concluida')
  async handleTarefaConcluida(eventData: AtendimentoEventData) {
    console.log('🎯 Tarefa concluída:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de conclusão de tarefa:', error);
    }
  }

  @OnEvent('atendimento.tarefa.excluida')
  async handleTarefaExcluida(eventData: AtendimentoEventData) {
    console.log('🎯 Tarefa excluída:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de exclusão de tarefa:', error);
    }
  }

  @OnEvent('atendimento.suspensao.criada')
  async handleSuspensaoCriada(eventData: AtendimentoEventData) {
    console.log('🎯 Suspensão criada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de suspensão:', error);
    }
  }

  @OnEvent('atendimento.suspensao.atualizada')
  async handleSuspensaoAtualizada(eventData: AtendimentoEventData) {
    console.log('🎯 Suspensão atualizada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de atualização de suspensão:', error);
    }
  }

  @OnEvent('atendimento.suspensao.removida')
  async handleSuspensaoRemovida(eventData: AtendimentoEventData) {
    console.log('🎯 Suspensão removida:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de remoção de suspensão:', error);
    }
  }

  @OnEvent('atendimento.distribuicao.configurada')
  async handleDistribuicaoConfigurada(eventData: AtendimentoEventData) {
    console.log('🎯 Distribuição configurada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de configuração de distribuição:', error);
    }
  }

  @OnEvent('atendimento.distribuicao.redistribuidos')
  async handleAtendimentosRedistribuidos(eventData: AtendimentoEventData) {
    console.log('🎯 Atendimentos redistribuídos:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de redistribuição:', error);
    }
  }

  @OnEvent('atendimento.distribuicao.monitoramento')
  async handleMonitoramentoExecutado(eventData: AtendimentoEventData) {
    console.log('🎯 Monitoramento executado:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de monitoramento:', error);
    }
  }

  @OnEvent('atendimento.arquivado.automatico')
  async handleAtendimentosArquivadosAutomaticamente(eventData: AtendimentoEventData) {
    console.log('🎯 Atendimentos arquivados automaticamente:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de arquivamento automático:', error);
    }
  }

  @OnEvent('atendimento.visita.criada')
  async handleVisitaCriada(eventData: AtendimentoEventData) {
    console.log('🎯 Visita criada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de visita:', error);
    }
  }

  @OnEvent('atendimento.visita.concluida')
  async handleVisitaConcluida(eventData: AtendimentoEventData) {
    console.log('🎯 Visita concluída:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de conclusão de visita:', error);
    }
  }

  @OnEvent('atendimento.visita.excluida')
  async handleVisitaExcluida(eventData: AtendimentoEventData) {
    console.log('🎯 Visita excluída:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de exclusão de visita:', error);
    }
  }

  @OnEvent('atendimento.compartilhamento.criado')
  async handleCompartilhamentoCriado(eventData: AtendimentoEventData) {
    console.log('🎯 Compartilhamento criado:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de compartilhamento:', error);
    }
  }

  @OnEvent('atendimento.compartilhamento.removido')
  async handleCompartilhamentoRemovido(eventData: AtendimentoEventData) {
    console.log('🎯 Compartilhamento removido:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de remoção de compartilhamento:', error);
    }
  }

  @OnEvent('atendimento.tarefa.nome.alterado')
  async handleTarefaNomeAlterado(eventData: AtendimentoEventData) {
    console.log('🎯 Nome da tarefa alterado:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de alteração de nome de tarefa:', error);
    }
  }

  @OnEvent('atendimento.tarefa.observacoes.alteradas')
  async handleTarefaObservacoesAlteradas(eventData: AtendimentoEventData) {
    console.log('🎯 Observações da tarefa alteradas:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de alteração de observações de tarefa:', error);
    }
  }

  @OnEvent('atendimento.tarefa.responsavel.alterado')
  async handleTarefaResponsavelAlterado(eventData: AtendimentoEventData) {
    console.log('🎯 Responsável da tarefa alterado:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de alteração de responsável de tarefa:', error);
    }
  }

  @OnEvent('atendimento.tarefa.hora.inicio.alterada')
  async handleTarefaHoraInicioAlterada(eventData: AtendimentoEventData) {
    console.log('🎯 Hora de início da tarefa alterada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de alteração de hora de início de tarefa:', error);
    }
  }

  @OnEvent('atendimento.tarefa.hora.fim.alterada')
  async handleTarefaHoraFimAlterada(eventData: AtendimentoEventData) {
    console.log('🎯 Hora de fim da tarefa alterada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de alteração de hora de fim de tarefa:', error);
    }
  }

  @OnEvent('atendimento.tarefa.data.alterada')
  async handleTarefaDataAlterada(eventData: AtendimentoEventData) {
    console.log('🎯 Data da tarefa alterada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de alteração de data de tarefa:', error);
    }
  }

  emitAtendimentoCriado(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.criado', {
      ...data,
      operacao: 'criar',
      entidade: 'atendimento',
    });
  }

  emitAtendimentoEditado(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    console.log('📤 Emitindo evento atendimento.editado:', data);
    
    const eventData = {
      ...data,
      operacao: 'editar' as const,
      entidade: 'atendimento' as const,
    };
    
    try {
      const result = this.eventEmitter.emit('atendimento.editado', eventData);
      console.log('✅ Evento emitido - resultado:', result);
    } catch (error) {
      console.error('❌ Erro ao emitir evento:', error);
    }
  }

  emitAtendimentoArquivado(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.arquivado', {
      ...data,
      operacao: 'arquivar',
      entidade: 'atendimento',
    });
  }
  emitAtendimentoDesarquivado(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.desarquivado', {
      ...data,
      operacao: 'desarquivar',
      entidade: 'atendimento',
    });
  }

  emitComentarioCriado(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.comentario', {
      ...data,
      operacao: 'comentar',
      entidade: 'comentario',
    });
  }

  emitTarefaCriada(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitSuspensaoCriada(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.suspensao.criada', {
      ...data,
      operacao: 'suspensao',
      entidade: 'suspensao',
    });
  }

  emitSuspensaoAtualizada(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.suspensao.atualizada', {
      ...data,
      operacao: 'suspensao',
      entidade: 'suspensao',
    });
  }

  emitSuspensaoRemovida(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.suspensao.removida', {
      ...data,
      operacao: 'suspensao',
      entidade: 'suspensao',
    });
  }

  emitDistribuicaoConfigurada(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.distribuicao.configurada', {
      ...data,
      operacao: 'distribuicao',
      entidade: 'distribuicao',
    });
  }

  emitAtendimentosRedistribuidos(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.distribuicao.redistribuidos', {
      ...data,
      operacao: 'distribuicao',
      entidade: 'distribuicao',
    });
  }

  emitMonitoramentoExecutado(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.distribuicao.monitoramento', {
      ...data,
      operacao: 'distribuicao',
      entidade: 'distribuicao',
    });
  }

  emitAtendimentosArquivadosAutomaticamente(
    data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>,
  ) {
    this.eventEmitter.emit('atendimento.arquivado.automatico', {
      ...data,
      operacao: 'arquivar',
      entidade: 'atendimento',
    });
  }

  emitVisitaCriada(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.visita.criada', {
      ...data,
      operacao: 'visita',
      entidade: 'visita',
    });
  }

  emitVisitaConcluida(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.visita.concluida', {
      ...data,
      operacao: 'visita',
      entidade: 'visita',
    });
  }

  @OnEvent('atendimento.visita.confirmada')
  async handleVisitaConfirmada(eventData: AtendimentoEventData) {
    console.log('🎯 Visita confirmada:', eventData);
    try {
      await this.logAtividadesService.registrarLogAutomatico(eventData);
    } catch (error) {
      console.error('❌ Erro ao processar evento de confirmação de visita:', error);
    }
  }

  emitVisitaConfirmada(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.visita.confirmada', {
      ...data,
      operacao: 'visita',
      entidade: 'visita',
    });
  }

  emitVisitaExcluida(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.visita.excluida', {
      ...data,
      operacao: 'visita',
      entidade: 'visita',
    });
  }

  emitTarefaEditada(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.editada', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitTarefaConcluida(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.concluida', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitTarefaExcluida(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.excluida', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitCompartilhamentoCriado(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.compartilhamento.criado', {
      ...data,
      operacao: 'comentar',
      entidade: 'comentario',
    });
  }

  emitCompartilhamentoRemovido(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.compartilhamento.removido', {
      ...data,
      operacao: 'comentar',
      entidade: 'comentario',
    });
  }

  emitTarefaNomeAlterado(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.nome.alterado', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitTarefaObservacoesAlteradas(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.observacoes.alteradas', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitTarefaResponsavelAlterado(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.responsavel.alterado', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitTarefaHoraInicioAlterada(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.hora.inicio.alterada', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitTarefaHoraFimAlterada(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.hora.fim.alterada', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }

  emitTarefaDataAlterada(data: Omit<AtendimentoEventData, 'operacao' | 'entidade'>) {
    this.eventEmitter.emit('atendimento.tarefa.data.alterada', {
      ...data,
      operacao: 'tarefa',
      entidade: 'tarefa',
    });
  }
}
