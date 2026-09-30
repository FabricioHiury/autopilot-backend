export interface IAssinaturaComLoja {
  id: string;
  status: string;
  duracaoPlano: number;
  formaPagamento: string;
  dataAquisicao: Date;
  dataRenovacao: Date | null;
  dataCancelamento: Date | null;
  plano: {
    nome: string;
    valor: number;
    periodo: string;
  };
  loja: {
    id: string;
    nomeEmpresa: string;
    cnpj: string; 
    criadoEm:string,
    enderecoLoja:{
      rua?: string;
      cep?: string;
      cidade: string;
      uf: string;
      bairro?: string;
      numero?: string;
      complemento?: string;
      filial: boolean; 
    }[],
    lojista: {
      usuario: {
        id: string;
        email: string;
      };
    };
    contatoLoja: {
      telefone?: string;
      celular?: string;
    }[];
  };
}

export interface IAssinaturaFormatada {
  idAssinatura: string;
  plano: string;
  duracaoPlano: number;
  valorPlano: number;
  periodo: string;
  status: string;
  formaPagamento: string;
  dataAquisicao: Date;
  dataRenovacao?: Date | null;
  dataCancelamento?: Date | null;
  dataFimCarencia?: Date | null;
  diasRestantesCarencia?: number;
  emCarencia?: boolean;
  loja: {
    idLoja: string;
    nomeEmpresa: string;
    cnpj: string;
    criadoEm:string;
    email: string;
    avatarUrl?: string | null;
    telefone?: string | null;
    celular?: string | null;
    enderecosLoja:
      {
        rua?: string;
        cep?: string;
        cidade: string;
        uf: string;
        bairro?: string;
        numero?: string;
        complemento?: string;
        filial: boolean; 
      }[]
  };
}
