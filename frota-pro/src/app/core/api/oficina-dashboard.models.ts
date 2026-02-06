export interface SerieMensalValorResponse {
  mes: string;   // "2026-02"
  total: number; // BigDecimal -> number
}

export interface TopCaminhaoCustoResponse {
  codigoCaminhao: string;
  descricaoCaminhao: string;
  total: number;
}

export interface OficinaDashboardResponse {
  codigoOficina: string;
  nomeOficina: string;

  inicio: string; // yyyy-MM-dd
  fim: string;

  totalOrcamentos: number;
  qtdManutencoes: number;
  ticketMedio: number;

  qtdAgendadas: number;
  qtdEmAndamento: number;
  qtdConcluidas: number;
  qtdCanceladas: number;

  totalPecas: number;
  totalServicos: number;

  serieMensal: SerieMensalValorResponse[];
  topCaminhoes: TopCaminhaoCustoResponse[];
}
