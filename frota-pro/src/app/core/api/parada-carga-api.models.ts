export type TipoParada =
  | 'ABASTECIMENTO'
  | 'ALIMENTACAO'
  | 'PERNOITE'
  | 'MANUTENCAO'
  | 'OUTROS';

export interface DespesaParadaResponse {
  id: string;
  tipoDespesa?: string | null;
  dataHora?: string | null;
  valor?: number | null;
  descricao?: string | null;
  cidade?: string | null;
  uf?: string | null;
}

export interface ManutencaoResponse {
  id?: string;
  codigo?: string;
  descricao?: string | null;
  dataInicioManutencao?: string | null;
  dataFimManutencao?: string | null;
  tipoManutencao?: string | null;
  itensTrocados?: string[];
  observacoes?: string | null;
  valor?: number | null;
  statusManutencao?: string | null;
}

export interface ParadaCargaResponse {
  id: string;
  Codigocarga?: string | null;
  tipoParada?: string | null;
  dtInicio?: string | null;
  dtFim?: string | null;
  cidade?: string | null;
  local?: string | null;
  kmOdometro?: number | null;
  observacao?: string | null;
  despesaParadas?: DespesaParadaResponse[];
  manutencao?: ManutencaoResponse | null;
}

export interface ParadaCargaRequest {
  carga: string;
  tipoParada: string;
  dtInicio: string;
  dtFim?: string | null;
  cidade?: string | null;
  local?: string | null;
  kmOdometro?: number | null;
  observacao?: string | null;
  valorDespesa?: number | null;
  descricaoDespesa?: string | null;
  abastecimento?: any;
  manutencao?: any;
}

export interface ArquivoResponse {
  id: string;
  nomeOriginal?: string;
  contentType?: string;
  tamanhoBytes?: number;
  criadoEm?: string;
}

export interface AnexoParadaResponse {
  id: string;
  tipoAnexo: string;
  observacao?: string | null;
  arquivo: ArquivoResponse;
}
