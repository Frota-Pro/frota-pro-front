export interface DashboardCargaRecenteResponse {
  numeroCarga: string;
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
