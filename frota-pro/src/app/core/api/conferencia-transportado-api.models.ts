export interface ConferenciaTotais {
  vendaFaturada: number;
  notasVendaFaturada: number;
  transportadoWinThor: number;
  cargasWinThor: number;
  transportadoFrotaPro: number;
  cargasFrotaPro: number;
  diferenca: number;
}

export interface ConferenciaLinhaPonte {
  codigo: string;
  titulo: string;
  explicacao: string;
  quantidade: number;
  valor: number;
}

export interface ConferenciaTransferenciaInfo {
  deCarga: number | null;
  paraCarga: number | null;
  quando: string | null;
  motivo: string | null;
}

export interface ConferenciaNotaDetalhe {
  numNota: number;
  valor: number;
  paraCarga: number | null;
  motivo: string;
  /** Transferências da nota entre carregamentos (log do WinThor), da mais antiga para a mais nova. */
  historico?: ConferenciaTransferenciaInfo[];
}

/** O mesmo valor sai de deCarga (diminui) e entra em paraCarga (aumenta). */
export interface ConferenciaMovimento {
  deCarga: number | null;
  paraCarga: number | null;
  motivo: string | null;
  notas: number;
  valor: number;
  primeira: string | null;
  ultima: string | null;
  numerosNotas: number[];
}

export interface ConferenciaResumoMovimentos {
  transferencias: number;
  notas: number;
  valor: number;
}

export interface ConferenciaCargaDiferenca {
  numCar: number;
  categoria: string;
  explicacao: string;
  valorWinThor: number;
  valorFrotaPro: number;
  diferenca: number;
  dataWinThor: string | null;
  dataFrotaPro: string | null;
  statusFrotaPro: string | null;
  notas: ConferenciaNotaDetalhe[];
  /** Carga que ficou sem nota (SINCRONIZADA) e cujas notas foram todas para outras cargas, com a saída no log. */
  podeSerZerada?: boolean;
}

/** Carga de peso baixo: em geral reentrega ou sobra de transferência, e o motorista não lembra da viagem. */
export interface ConferenciaCargaPequena {
  numCar: number;
  dataFaturamento: string | null;
  valor: number;
  pesoKg: number;
  status: string;
  motorista: string | null;
  placa: string | null;
  motoristaExterno: boolean;
  origem: 'REENTREGA' | 'TRANSFERENCIA' | 'SEM_NOTA' | 'COMUM';
  origemDe: string | null;
  notas: number;
  explicacao: string;
}

/** Motorista fora da frota com caminhão da frota: km e abastecimento só à mão. */
export interface ConferenciaLancamentoManual {
  numCar: number;
  codMotorista: string;
  valor: number;
  notas: number;
  cargaNoFrotaPro: boolean;
  explicacao: string;
}

export interface ConferenciaManifestoSemNota {
  numMdfe: number;
  codMotorista: number | null;
  codVeiculo: string | null;
  situacao: string | null;
  data: string | null;
  pesoKg: number | null;
  caminhaoDaFrota: boolean;
  motoristaDaFrota: boolean;
  explicacao: string;
}

export interface ConferenciaResumoDevolucoes {
  notas: number;
  valor: number;
  pesoKg: number;
}

export interface ConferenciaDevolucaoNota {
  numNota: number;
  numCar: number | null;
  valorNota: number | null;
  valorDevolvido: number;
  pesoDevolvidoKg: number;
}

export interface ConferenciaCargaZerada {
  numCar: number;
  valorAntes: number;
  transferidaPara: string;
}

export interface ConferenciaNotaFora {
  numNota: number;
  dtSaida: string | null;
  codCli: number | null;
  condVenda: number | null;
  numCar: number | null;
  valor: number;
  motivo: string;
}

export interface ConferenciaTransportadoResponse {
  mes: string;
  geradoEm: string;
  totais: ConferenciaTotais;
  ponteVendaParaTransportado: ConferenciaLinhaPonte[];
  ponteWinThorParaFrotaPro: ConferenciaLinhaPonte[];
  cargasComDiferenca: ConferenciaCargaDiferenca[];
  notasForaDoTransporte: ConferenciaNotaFora[];
  notasForaTotal: number;
  fechou: boolean;
  resumoMovimentos?: ConferenciaResumoMovimentos;
  movimentosEntreCargas?: ConferenciaMovimento[];
  limitePequenaKg?: number;
  cargasPequenas?: ConferenciaCargaPequena[];
  lancamentoManual?: ConferenciaLancamentoManual[];
  manifestosSemNota?: ConferenciaManifestoSemNota[];
  resumoDevolucoes?: ConferenciaResumoDevolucoes;
  devolucoes?: ConferenciaDevolucaoNota[];
}
