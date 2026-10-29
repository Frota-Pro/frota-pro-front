export interface ParametroSistemaResponse {
  diasUteisFechamentoMeta: number;
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

  bloquearSenhaPadrao: boolean;
  vincularDispositivo: boolean;
}

export interface ParametroSistemaUpdateRequest {
  diasUteisFechamentoMeta: number;
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

  bloquearSenhaPadrao?: boolean;
  vincularDispositivo?: boolean;
}
