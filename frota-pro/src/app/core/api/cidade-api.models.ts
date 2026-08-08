export interface CidadeResumoResponse {
  cidade: string;
  quantidadeClientes: number;
  quantidadeCargas: number;
}

export interface RoteirizacaoCidadeResponse {
  cidade: string;
  clientesOrdenados: string[];
  clientesSemPosicao: string[];
}

export interface RoteirizacaoCidadeRequest {
  clientesOrdenados: string[];
}
