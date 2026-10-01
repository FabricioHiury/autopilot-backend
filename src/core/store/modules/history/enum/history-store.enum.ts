export enum TYPES_EVENT_STORE {
  // Assinatura

  // Loja
  STORE_CREATED = 'storeCreated',
  STORE_EDITED = 'storeEdited',
  STORE_DELETED = 'storeDeleted',

  // Colaboradores
  EMPLOYEE_CREATED = 'employeeCreated',
  EMPLOYEE_EDITED = 'employeeEdited',
  EMPLOYEE_DELETED = 'employeeDeleted',

  // Clientes
  CUSTOMER_CREATED = 'customerCreated',
  CUSTOMER_EDITED = 'customerEdited',
  CUSTOMER_DELETED = 'customerDeleted',

  // Suporte
  TICKET_OPEN = 'ticketOpen',
  TICKET_RESOLVED = 'ticketResolved',
  TICKET_CLOSED = 'ticketClosed',

  // Integrações
  INTEGRATION_CONFIGURED = 'integrationAdded',
  INTEGRATION_REMOVED = 'integrationRemoved',

  // Mensagens
  MESSAGE_SENT = 'messageSent',
  MESSAGE_RECEIVED = 'messageReceived',

  // Atendimento
  DEAL_STARTED = 'dealCreated',
  DEAL_UPDATED = 'dealUpdated',
  DEAL_FINALIZED = 'dealFinalized',
  SELL_COMPLETED = 'sellCompleted',
  SELL_CANCELED = 'sellCanceled',
}
