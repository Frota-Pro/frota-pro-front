export interface ParametroSistemaResponse {
  diasAntecedenciaVencimentoDocumento: number;
  kmAntecedenciaTrocaPneu: number;
  diasManutencaoEstagnada: number;
  diasAntecedenciaPrazoMulta: number;
}

export interface ParametroSistemaUpdateRequest {
  diasAntecedenciaVencimentoDocumento: number;
  kmAntecedenciaTrocaPneu: number;
  diasManutencaoEstagnada: number;
  diasAntecedenciaPrazoMulta: number;
}
