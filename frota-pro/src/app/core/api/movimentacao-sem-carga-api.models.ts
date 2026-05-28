export interface MovimentacaoSemCargaResponse {
  id: string;
  dataMovimentacao: string;
  codigoCaminhao: string;
  placaCaminhao: string;
  numeroCargaInicio: string;
  kmOrigem: number;
  kmDestino: number;
  kmRodado: number;
  mediaKmLitroUsada: number;
  valorLitroMedio: number;
  custoEstimado: number;
}

export interface MovimentacaoSemCargaResumoResponse {
  codigoCaminhao: string;
  periodoInicio: string;
  periodoFim: string;
  totalKmRodado: number;
  custoEstimadoTotal: number;
}
