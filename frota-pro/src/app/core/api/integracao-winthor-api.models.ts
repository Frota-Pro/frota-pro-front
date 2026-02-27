export type StatusSincronizacao = 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
export type IntegracaoJobTipo = 'CARGAS' | 'CAMINHOES' | 'MOTORISTAS' | 'TODOS';

export interface IntegracaoWinthorConfigResponse {
  empresaId: string;
  ativo: boolean;
  intervaloMin: number | null;
  syncCaminhoes: boolean;
  syncMotoristas: boolean;
  syncCargas: boolean;
  codigosCaminhoes: number[];
  codigosMotoristas: number[];
  criadoEm?: string | null;
  atualizadoEm?: string | null;
}

export interface IntegracaoWinthorConfigUpdateRequest {
  ativo?: boolean;
  intervaloMin?: number | null;
  syncCaminhoes?: boolean;
  syncMotoristas?: boolean;
  syncCargas?: boolean;
  codigosCaminhoes?: number[];
  codigosMotoristas?: number[];
}

export interface IntegracaoWinthorJobResponse {
  jobId: string;
  tipo: 'CARGAS' | 'CAMINHOES' | 'MOTORISTAS';
  status: StatusSincronizacao;
  dataReferencia?: string | null;
  totalRegistros?: number | null;
  mensagemErro?: string | null;
  criadoEm?: string | null;
  atualizadoEm?: string | null;
}

export interface IntegracaoWinthorStatusResponse {
  apiOk: boolean;
  integradoraOk: boolean;
  oracleOk: boolean;
  integradoraStatus: string;
  oracleStatus: string;
  latenciaMs?: number | null;
  verificadoEm?: string | null;
}

export type IntegracaoLogSource = 'API' | 'INTEGRADORA';

export interface IntegracaoWinthorLogsResponse {
  source: IntegracaoLogSource;
  fetchedAt: string;
  linesRequested: number;
  linesReturned: number;
  lines: string[];
}

