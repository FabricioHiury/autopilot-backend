import { IntegracoesEnum } from 'src/core/loja/modules/chat/enum/canal.enum';

export interface MensagemComErro {
  id: string;
  idLoja: string;
  mensagem: string;
  email: string;
  celular: string;
  anexoMensagem: string;
  urlAvatar: string;
  idMensagem: string;
  canal: IntegracoesEnum;
  idDestinatarioApiExterna: string;
  timestamp: Date;
  erro: string;
  status: number;
  retryCount: number;
  code: string;
}
