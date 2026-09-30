import { MensagemComErro } from './mensagem-com-erro.interface';

export interface RespostaMensagensComErro {
  message: string;
  statusCode: number;
  data: MensagemComErro[];
}
