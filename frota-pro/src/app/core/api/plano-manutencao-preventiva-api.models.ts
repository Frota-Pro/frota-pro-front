export interface PlanoManutencaoPreventivaResponse {
  id: string;
  codigoCaminhao: string;
  caminhao?: string | null;

  descricao: string;
  intervaloKm?: number | null;
  intervaloDias?: number | null;
  ativo: boolean;

  ultimoKmExecutado?: number | null;
  ultimaDataExecutada?: string | null;

  odometroAtualCaminhao?: number | null;

  proximoKm?: number | null;
  proximaData?: string | null;

  /** 'EM_DIA' | 'VENCENDO' | 'VENCIDO' */
  situacao?: string | null;
}

export interface PlanoManutencaoPreventivaRequest {
  caminhao: string; // codigo ou codigo externo
  descricao: string;
  intervaloKm?: number | null;
  intervaloDias?: number | null;
  ativo?: boolean | null;
}
