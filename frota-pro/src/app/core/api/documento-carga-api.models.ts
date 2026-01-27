export type TipoDocumentoCarga =
  | 'CTE'
  | 'MDFE'
  | 'NOTAS_FISCAIS'
  | 'CANHOTO_ASSINADO'
  | 'COMPROVANTE_ENTREGA'
  | 'COMPROVANTE_DEVOLUCAO'
  | 'OUTROS';

export interface ArquivoResumoResponse {
  id: string;
  nomeOriginal: string;
  urlPreview?: string | null;
  urlDownload?: string | null;
  contentType: string;
  tamanhoBytes: number;
}

export interface DocumentoCargaResponse {
  id: string;

  tipoDocumento: TipoDocumentoCarga | string;
  observacao?: string | null;

  // auditoria
  criadoEm?: string | null;
  criadoPor?: string | null;

  // ✅ esperado
  arquivo: ArquivoResumoResponse;

  // fallback
  arquivoId?: string | null;
}
