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
