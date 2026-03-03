export interface PneuRequest {
  numeroSerie?: string | null;
  marca?: string | null;
  modelo?: string | null;
  medida?: string | null;
  nivelRecapagem?: number | null;
  status?: string | null;     // ESTOQUE | EM_USO | EM_RECAPAGEM | DESCARTADO
  kmMetaAtual?: number | null;
  dtCompra?: string | null;   // yyyy-MM-dd
}

export interface PneuResponse {
  codigo: string;
  numeroSerie?: string | null;
  marca?: string | null;
  modelo?: string | null;
  medida?: string | null;
  nivelRecapagem: number;
  status: string;
  kmMetaAtual: number;
  kmTotalAcumulado: number;
  dtCompra?: string | null;
  dtDescarte?: string | null;
}

export interface PneuVidaUtilResponse {
  codigoPneu: string;
  status: string;
  nivelRecapagem: number;

  kmMetaAtual: number;
  kmRodadoAtual: number;
  kmRestante: number;
  percentualVida: number; // 0..1

  kmTotalAcumulado: number;

  caminhaoAtual?: string | null;
  eixoNumero?: number | null;
  lado?: string | null;
  posicao?: string | null;

  kmInstalacao?: number | null;
  dataInstalacao?: string | null; // ISO
}

export interface PneuMovimentacaoRequest {
  tipo: string; // INSTALACAO | REMOVER | RODIZIO | TROCA_MANUTENCAO | ENVIO_RECAPAGEM | RETORNO_RECAPAGEM | DESCARTE
  kmEvento?: number | null;
  observacao?: string | null;

  caminhaoId?: string | null;
  caminhao?: string | null; // UUID ou codigo interno ou codigo externo ou placa
  manutencaoId?: string | null;
  paradaId?: string | null;

  eixoNumero?: number | null;
  lado?: string | null;
  posicao?: string | null;

  // obrigatório para INSTALACAO
  kmInstalacao?: number | null;
}

export interface PneuMovimentacaoResponse {
  id: string;
  tipo: string;
  dataEvento: string; // ISO
  kmEvento?: number | null;
  observacao?: string | null;

  caminhaoId?: string | null;
  manutencaoId?: string | null;
  paradaId?: string | null;

  eixoNumero?: number | null;
  lado?: string | null;
  posicao?: string | null;
}

export interface PneuVidaUtilRelatorioLinha {
  codigoPneu?: string | null;
  numeroSerie?: string | null;
  marca?: string | null;
  modelo?: string | null;
  medida?: string | null;
  status?: string | null;
  caminhao?: string | null;
  kmTotal?: number | null;
  kmMeta?: number | null;
  percentualVida?: number | null; // valor em percentual: ex. 20.58
}

export interface PneuVidaUtilRelatorioResponse {
  filtroCaminhao?: string | null;
  filtroPneu?: string | null;
  totalPneus?: number | null;
  linhas: PneuVidaUtilRelatorioLinha[];
}
