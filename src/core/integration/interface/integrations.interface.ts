interface ContentBase64 {
  base64: string;
}
export interface ContentWhatsapp {
  qrCode: ContentBase64;
  message: string;
  status: string;
}

export interface ResultWhatsapp {
  data: ContentWhatsapp;
}

export interface ResultOlx {
  url: string;
}

export interface ResultMeta {
  data: string;
}
