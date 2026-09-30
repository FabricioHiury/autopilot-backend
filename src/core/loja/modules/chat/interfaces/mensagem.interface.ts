export interface ConteudoMensagemEnviada {
  message: string;
  statusCode: number;
  data: {
    message: string;
  };
}

export interface ReturnSendMessage {
  message: string;
  statusCode: number;
  data: {
    status: string;
    response: string;
  };
}
