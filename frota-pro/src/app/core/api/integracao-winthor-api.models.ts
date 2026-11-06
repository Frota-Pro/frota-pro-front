export type StatusSincronizacao = 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
export type IntegracaoJobTipo = 'CARGAS' | 'CAMINHOES' | 'MOTORISTAS' | 'TODOS';

export interface IntegracaoWinthorConfigResponse {
  empresaId: string;
  ativo: boolean;
  intervaloMin: number | null;
  /** Horário (HH:mm:ss) do reforço diário — sincroniza do dia 1 do mês até hoje, além do ciclo normal. */
  horarioReforcoMensal: string | null;
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
  horarioReforcoMensal?: string | null;
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
  /** "Automático", "Reforço mensal", "Manual" ou "Reprocessado" — só pra jobs de CARGAS. */
  origem?: string | null;
  criadoEm?: string | null;
  atualizadoEm?: string | null;
  /** Só jobs de CARGAS, a partir do histórico de sincronização (nulos em jobs antigos). */
  periodoInicial?: string | null;
  periodoFinal?: string | null;
  qtdNovas?: number | null;
  qtdAtualizadas?: number | null;
  qtdSemMudanca?: number | null;
  qtdDescartadas?: number | null;
  qtdDiminuicaoBloqueada?: number | null;
}

/**
 * Uma linha do histórico de sincronização: o que uma rodada fez numa carga. Peso em TONELADAS, valor em R$.
 * NOVA, ATUALIZADA, BLOQUEADA (diminuição retida pelo bloqueio) ou DESCARTADA (motorista/caminhão não cadastrado).
 */
export type TipoItemSincronizacao = 'NOVA' | 'ATUALIZADA' | 'BLOQUEADA' | 'DESCARTADA';

export interface CargaSyncItemResponse {
  id: string;
  jobId: string;
  numeroCargaExterno: string;
  tipo: TipoItemSincronizacao;
  motivo?: string | null;
  pesoAntes?: number | null;
  pesoDepois?: number | null;
  valorAntes?: number | null;
  valorDepois?: number | null;
  /** O que a minuta do WinThor dizia naquela rodada. */
  pesoWinthor?: number | null;
  valorWinthor?: number | null;
  statusAntes?: string | null;
  statusDepois?: string | null;
  motoristaAntes?: string | null;
  motoristaDepois?: string | null;
  caminhaoAntes?: string | null;
  caminhaoDepois?: string | null;
  dtFaturamentoAntes?: string | null;
  dtFaturamentoDepois?: string | null;
  notasAntes?: number | null;
  notasDepois?: number | null;
  criadoEm: string;
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

