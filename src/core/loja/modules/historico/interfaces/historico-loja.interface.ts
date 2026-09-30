import { TIPOS_EVENTO_LOJA } from '../enum/historico-loja.enum';

export interface IHistoricoLojaDto {
  idLoja: string;
  tipoEvento: TIPOS_EVENTO_LOJA;
  descricao: string;
}
