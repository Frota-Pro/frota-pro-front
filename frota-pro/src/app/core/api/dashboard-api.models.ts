export interface DashboardCargaRecenteResponse {
  numeroCarga: string;
  /** Número a ser exibido ao usuário: externo se a integração estiver ativa, senão interno. */
  numeroCargaExibicao: string;
  origem: string;
  destino: string;

  valorTotal: number | null;
  pesoCarga: number | null;

  status: string | null;
  dtSaida: string | null;
}

export interface DashboardResumoResponse {
  cargasAtivas: number;
  finalizadasHoje: number;

  litros30d: number;

  metasAtivas: number;
  osAbertas: number;

  cargasRecentes: DashboardCargaRecenteResponse[];
}

export interface DashboardMetaCategoriaDesempenho {
  categoriaCodigo?: string | null;
  categoriaDescricao?: string | null;
  percentual?: number | null;
  metaAtingida?: boolean | null;
  caminhoesForaMeta?: number | null;
}

export interface DashboardMetaCaminhaoDesempenho {
  caminhaoCodigo?: string | null;
  caminhaoDescricao?: string | null;
  tipoMeta?: string | null;
  valorMeta?: number | null;
  valorRealizado?: number | null;
  percentual?: number | null;
  metaAtingida?: boolean | null;
}

export interface DashboardMetasResponse {
  metasAtivas: number;
  metasVencendo: number;
  caminhoesForaMeta: number;
  categoriasPiorDesempenho: DashboardMetaCategoriaDesempenho[];
  topCaminhoesDentroMeta: DashboardMetaCaminhaoDesempenho[];
}

export interface MotoristaAcessoResponse {
  codigoMotorista: string;
  nomeMotorista: string;

  ultimoLoginEm: string | null;
  totalLogins: number;
  diasSemAcesso: number | null;

  dispositivoAppVersao: string | null;
  dispositivoAppReportadoEm: string | null;
}

export interface MotoristaAtrasoResponse {
  codigoMotorista: string;
  nomeMotorista: string;

  totalCargas: number;
  cargasAtrasoInicio: number;
  cargasAtrasoFim: number;

  mediaAtrasoInicioDias: number;
  mediaAtrasoFimDias: number;
}

export interface MetricasAtuadorResponse {
  statusGeral: string;
  statusComponentes: Record<string, string>;

  uptimeSegundos: number | null;

  memoriaUsadaMb: number | null;
  memoriaMaximaMb: number | null;

  cpuUsoPercentual: number | null;

  conexoesBancoAtivas: number | null;
  conexoesBancoMaximas: number | null;

  totalRequisicoesHttp: number;
}

export interface SaudeSistemaResponse {
  totalMotoristasComUsuario: number;
  motoristasAtivosUltimos7Dias: number;
  motoristasAtivosUltimos30Dias: number;
  motoristasNuncaAcessaram: number;
  totalAcessosAcumulado: number;
  motoristas: MotoristaAcessoResponse[];

  periodoInicio: string;
  periodoFim: string;
  totalCargasFinalizadasPeriodo: number;

  cargasComAtrasoInicio: number;
  cargasComAtrasoFim: number;

  percentualAtrasoInicio: number;
  percentualAtrasoFim: number;

  atrasoMedioInicioDias: number;
  atrasoMedioFimDias: number;

  rankingAtrasoMotoristas: MotoristaAtrasoResponse[];

  metricasAtuador: MetricasAtuadorResponse | null;
}
