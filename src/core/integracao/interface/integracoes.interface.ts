interface ConteudoBase64 {
  base64: string;
}
export interface ConteudoWhatsapp {
  qrCode: ConteudoBase64;
  mensagem: string;
  status: string;
}

export interface RetornoWhatsapp {
  data: ConteudoWhatsapp;
}

export interface RetornoOlx {
  url: string;
}

export interface RetornoMeta {
  data: string;
}
