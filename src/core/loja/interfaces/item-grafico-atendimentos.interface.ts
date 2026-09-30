export interface IItemGraficoOrigemAtendimentos {
  data: string;
  contagem: IContagemOrigemAtendimentos;
}

export interface IContagemOrigemAtendimentos {
  anuncios?: number;
  loja?: number;
  redesSociais?: number;
  midiaFisica?: number;
  outros?: number;
}
