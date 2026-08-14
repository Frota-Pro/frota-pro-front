/** Um item devolvido (uma linha de produto) de uma nota fiscal desta carga, vindo ao vivo do WinThor. */
export interface DevolucaoResponse {
  codDevolucao?: number | null;
  numNota: number;
  numPedido?: number | null;
  dtEntrada?: string | null;
  motivo?: string | null;

  codCliente?: number | null;
  nomeCliente?: string | null;

  codProduto?: number | null;
  descricaoProduto?: string | null;
  quantidade?: number | null;
  unidade?: string | null;
  embalagem?: string | null;

  valorDevolucao?: number | null;
  pesoTotalKg?: number | null;

  fornecedor?: string | null;
  nomeMotoristaDevolucao?: string | null;
}

export type DirecaoTransferencia = 'PERDIDA' | 'RECEBIDA';

/** Um registro de transferência de pedido entre carregamentos, vindo ao vivo do WinThor. */
export interface TransferenciaResponse {
  numNota: number;
  numCarAtual?: number | null;
  numCarAnterior?: number | null;
  dtTransferencia?: string | null;
  motivo?: string | null;
  direcao: DirecaoTransferencia;
}
