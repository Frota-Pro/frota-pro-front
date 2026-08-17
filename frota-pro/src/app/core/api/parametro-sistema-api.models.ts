export interface ParametroSistemaResponse {
  diasAntecedenciaVencimentoDocumento: number;
  kmAntecedenciaTrocaPneu: number;
  diasManutencaoEstagnada: number;
  diasAntecedenciaPrazoMulta: number;

  validarMotivoAlteracaoPesoValorCarga: boolean;
  codigosDevolucaoPermitidos: string | null;
  permitirAtualizacaoPorTransferencia: boolean;

  validarTempoMinimoCarga: boolean;
  tempoMinimoEntregaPadraoMinutos: number;

  diasRetencaoAuditoria: number;
}

export interface ParametroSistemaUpdateRequest {
  diasAntecedenciaVencimentoDocumento: number;
  kmAntecedenciaTrocaPneu: number;
  diasManutencaoEstagnada: number;
  diasAntecedenciaPrazoMulta: number;

  validarMotivoAlteracaoPesoValorCarga: boolean;
  codigosDevolucaoPermitidos: string | null;
  permitirAtualizacaoPorTransferencia: boolean;

  validarTempoMinimoCarga: boolean;
  tempoMinimoEntregaPadraoMinutos: number;

  diasRetencaoAuditoria: number;
}
