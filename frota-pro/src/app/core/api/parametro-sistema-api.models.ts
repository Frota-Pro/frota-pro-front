export interface ParametroSistemaResponse {
  diasAntecedenciaVencimentoDocumento: number;
  kmAntecedenciaManutencaoPreventiva: number;
  diasManutencaoEstagnada: number;
  diasAntecedenciaPrazoMulta: number;

  validarMotivoAlteracaoPesoValorCarga: boolean;
  codigosDevolucaoPermitidos: string | null;
  permitirAtualizacaoPorTransferencia: boolean;

  validarTempoMinimoCarga: boolean;
  tempoMinimoEntregaPadraoMinutos: number;

  diasRetencaoAuditoria: number;

  percentualLimiteAnomaliaAbastecimento: number;
}

export interface ParametroSistemaUpdateRequest {
  diasAntecedenciaVencimentoDocumento: number;
  kmAntecedenciaManutencaoPreventiva: number;
  diasManutencaoEstagnada: number;
  diasAntecedenciaPrazoMulta: number;

  validarMotivoAlteracaoPesoValorCarga: boolean;
  codigosDevolucaoPermitidos: string | null;
  permitirAtualizacaoPorTransferencia: boolean;

  validarTempoMinimoCarga: boolean;
  tempoMinimoEntregaPadraoMinutos: number;

  diasRetencaoAuditoria: number;

  percentualLimiteAnomaliaAbastecimento: number;
}
