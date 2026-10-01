import { ApiOperationOptions } from '@nestjs/swagger';

export const createMessageTemplateSwagger: ApiOperationOptions = {
  summary: 'Create message template',
  description: 'Cria a new message template for the store',
};

export const listMessagesTemplatesSwagger: ApiOperationOptions = {
  summary: 'List messages templates',
  description:
    'List all the messages templates of store with filters and pagination',
};

export const getMessageTemplateByIdSwagger: ApiOperationOptions = {
  summary: 'Get message template by ID',
  description: 'Returns the details of a message template specific',
};

export const editMessageTemplateSwagger: ApiOperationOptions = {
  summary: 'Edit message template',
  description: 'Updates a message template existing',
};

export const deleteMessageTemplateSwagger: ApiOperationOptions = {
  summary: 'Delete message template',
  description: 'Remove a message template of store',
};
