export interface AnalyticsPontoSemanal {
  inicioSemana: string;
  cargasFinalizadas: number;
  kmRodado: number;
  litros: number;
  custoCombustivel: number;
}

export interface AnalyticsRankingMotoristaItem {
  codigoMotorista: string;
  nomeMotorista: string;
  totalCargas: number;
  totalKmRodado: number;
  totalTonelada: number;
}

export interface AnalyticsRankingCaminhaoItem {
  caminhao: string;
  mediaKmPorLitro: number;
  totalLitros: number;
}

export interface AnalyticsFrotaResponse {
  periodoInicio: string;
  periodoFim: string;

  totalCargasFinalizadas: number;
  totalKmRodado: number;
  totalLitros: number;
  totalCustoCombustivel: number;
  mediaKmPorLitro: number;

  serieSemanal: AnalyticsPontoSemanal[];

  topMotoristas: AnalyticsRankingMotoristaItem[];
  piorMotoristas: AnalyticsRankingMotoristaItem[];

  topCaminhoesConsumo: AnalyticsRankingCaminhaoItem[];
  piorCaminhoesConsumo: AnalyticsRankingCaminhaoItem[];
}

// ===== Por motorista =====

export interface AnalyticsMotoristaPontoSemanal {
  inicioSemana: string;
  cargasFinalizadas: number;
  kmRodado: number;
}

export interface AnalyticsMotoristaResponse {
  codigoMotorista: string;
  nomeMotorista: string;

  periodoInicio: string;
  periodoFim: string;

  totalCargas: number;
  totalKmRodado: number;
  totalTonelada: number;
  totalValorCargas: number;

  cargasNoPrazo: number;
  mediaDiasAtrasoChegada: number;
  percentualCargasNoPrazo: number;

  totalLitros: number;
  mediaKmPorLitro: number;

  mediaKmPorCargaFrota: number;
  mediaKmPorCargaMotorista: number;

  serieSemanal: AnalyticsMotoristaPontoSemanal[];
}

// ===== Por caminhão =====

export interface AnalyticsCaminhaoPontoSemanal {
  inicioSemana: string;
  kmRodado: number;
  litros: number;
  custoCombustivel: number;
}

export interface AnalyticsCaminhaoResponse {
  codigoCaminhao: string;
  placaCaminhao: string;
  descricaoCaminhao: string;

  periodoInicio: string;
  periodoFim: string;

  totalCargas: number;
  totalKmRodado: number;

  totalLitros: number;
  totalCustoCombustivel: number;
  mediaKmPorLitro: number;

  totalCustoManutencao: number;
  qtdManutencoes: number;

  mediaKmPorLitroFrota: number;

  serieSemanal: AnalyticsCaminhaoPontoSemanal[];
}

// ===== Abastecimento =====

export interface AnalyticsAbastecimentoPontoSemanal {
  inicioSemana: string;
  litros: number;
  custo: number;
}

export interface AnalyticsResumoPosto {
  posto: string;
  totalLitros: number;
  totalValor: number;
}

export interface AnalyticsResumoCaminhao {
  caminhao: string;
  totalLitros: number;
  totalValor: number;
  mediaKmPorLitro: number | null;
}

export interface AnalyticsAbastecimentoResponse {
  periodoInicio: string;
  periodoFim: string;

  totalLitros: number;
  totalCusto: number;
  mediaPrecoLitro: number;

  serieSemanal: AnalyticsAbastecimentoPontoSemanal[];
  porPosto: AnalyticsResumoPosto[];
  porCaminhao: AnalyticsResumoCaminhao[];
}
