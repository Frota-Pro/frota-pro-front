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
  pesoKg?: number | null;
  valorTotal?: number | null;
}

/** Resumo de quanto peso/valor a carga perdeu/recebeu, comparado com o que está gravado nela hoje. */
export interface ResumoDescontoCargaResponse {
  pesoAtualKg: number;
  valorAtual: number;

  pesoPerdidoKg: number;
  valorPerdido: number;

  pesoRecebidoKg: number;
  valorRecebido: number;

  pesoOriginalKg: number;
  valorOriginal: number;

  descontoBloqueado: boolean;
  houveMovimentacao: boolean;
  mensagem: string;
}
