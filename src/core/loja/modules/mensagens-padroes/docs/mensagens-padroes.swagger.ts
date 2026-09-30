import { ApiOperationOptions } from '@nestjs/swagger';

export const criarMensagemPadraoSwagger: ApiOperationOptions = {
  summary: 'Criar mensagem padrão',
  description: 'Cria uma nova mensagem padrão para a loja',
};

export const listarMensagensPadroesSwagger: ApiOperationOptions = {
  summary: 'Listar mensagens padrões',
  description: 'Lista todas as mensagens padrões da loja com filtros e paginação',
};

export const obterMensagemPadraoPorIdSwagger: ApiOperationOptions = {
  summary: 'Obter mensagem padrão por ID',
  description: 'Retorna os detalhes de uma mensagem padrão específica',
};

export const editarMensagemPadraoSwagger: ApiOperationOptions = {
  summary: 'Editar mensagem padrão',
  description: 'Atualiza uma mensagem padrão existente',
};

export const deletarMensagemPadraoSwagger: ApiOperationOptions = {
  summary: 'Deletar mensagem padrão',
  description: 'Remove uma mensagem padrão da loja',
};
