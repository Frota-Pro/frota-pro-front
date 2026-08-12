export interface CidadeResumoResponse {
  cidade: string;
  quantidadeClientes: number;
  quantidadeCargas: number;
}

export interface RoteirizacaoCidadeResponse {
  cidade: string;
  clientesOrdenados: string[];
  clientesSemPosicao: string[];
  /** Null = sem override — usa o padrão global de Parâmetros do Sistema. */
  tempoMinimoEntregaMinutos: number | null;
}

export interface RoteirizacaoCidadeRequest {
  clientesOrdenados: string[];
  /** Opcional — null/omitido = usa o padrão global de Parâmetros do Sistema. */
  tempoMinimoEntregaMinutos?: number | null;
}
