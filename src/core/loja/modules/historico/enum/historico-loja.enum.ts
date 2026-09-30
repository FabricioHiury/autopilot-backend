export enum TIPOS_EVENTO_LOJA {
  // Assinatura
  ASSINATURA_CANCELADA = 'assinaturaCancelada',
  ASSINATURA_ADQUIRIDA = 'assinaturaAdquirida',
  ASSINATURA_RENOVADA = 'assinaturaRenovada',
  ASSINATURA_BANIDA = 'assinaturaBanida',

  // Loja
  LOJA_CRIADA = 'lojaCriada',
  LOJA_EDITADA = 'lojaEditada',
  LOJA_DELETADA = 'lojaDeletada',

  // Colaboradores
  COLABORADOR_CRIADO = 'colaboradorCriado',
  COLABORADOR_EDITADO = 'colaboradorEditado',
  COLABORADOR_DELETADO = 'colaboradorDeletado',

  // Clientes
  CLIENTE_CRIADO = 'clienteCriado',
  CLIENTE_EDITADO = 'clienteEditado',
  CLIENTE_DELETADO = 'clienteDeletado',

  // Suporte
  TICKET_ABERTO = 'ticketAberto',
  TICKET_RESOLVIDO = 'ticketResolvido',
  TICKET_FECHADO = 'ticketFechado',

  // Integrações
  INTEGRACAO_CONFIGURADA = 'integracaoAdicionada',
  INTEGRACAO_REMOVIDA = 'integracaoRemovida',

  // Mensagens
  MENSAGEM_ENVIADA = 'mensagemEnviada',
  MENSAGEM_RECEBIDA = 'mensagemRecebida',

  // Atendimento
  ATENDIMENTO_INICIADO = 'atendimentoCriado',
  ATENDIMENTO_ATUALIZADO = 'atendimentoAtualizado',
  ATENDIMENTO_FINALIZADO = 'atendimentoFinalizado',
  VENDA_REALIZADA = 'vendaRealizada',
  VENDA_CANCELADA = 'vendaCancelada',
}
