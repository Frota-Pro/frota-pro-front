export interface ParametroSistemaResponse {
  diasUteisFechamentoMeta: number;
  diasAntecedenciaVencimentoDocumento: number;
  kmAntecedenciaManutencaoPreventiva: number;
  diasManutencaoEstagnada: number;
  diasAntecedenciaPrazoMulta: number;

  validarMotivoAlteracaoPesoValorCarga: boolean;
  codigosDevolucaoPermitidos: string | null;
  sufixosRotaIgnorados: string | null;
  permitirAtualizacaoPorTransferencia: boolean;

  validarTempoMinimoCarga: boolean;
  tempoMinimoEntregaPadraoMinutos: number;

  diasRetencaoAuditoria: number;

  percentualLimiteAnomaliaAbastecimento: number;
}

export interface ParametroSistemaUpdateRequest {
  diasUteisFechamentoMeta: number;
  diasAntecedenciaVencimentoDocumento: number;
  kmAntecedenciaManutencaoPreventiva: number;
  diasManutencaoEstagnada: number;
  diasAntecedenciaPrazoMulta: number;

  validarMotivoAlteracaoPesoValorCarga: boolean;
  codigosDevolucaoPermitidos: string | null;
  sufixosRotaIgnorados: string | null;
  permitirAtualizacaoPorTransferencia: boolean;

  validarTempoMinimoCarga: boolean;
  tempoMinimoEntregaPadraoMinutos: number;

  diasRetencaoAuditoria: number;

  percentualLimiteAnomaliaAbastecimento: number;
}
