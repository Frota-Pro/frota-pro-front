export interface NotaFiscalResumoResponse {
  numeroNota: number;
  serie?: string | null;
  /** E-mail cadastrado do cliente no WinThor, se houver — só sugestão pra pré-preencher o campo de envio. */
  emailCliente?: string | null;
}

export interface EnviarNotaFiscalEmailRequest {
  destinatario: string;
}
