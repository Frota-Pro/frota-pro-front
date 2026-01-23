export type TipoDocumentoCaminhao =
  | 'CRLV'
  | 'CONTRATO_SEGURO'
  | 'VISTORIA'
  | 'FOTO_FRENTE'
  | 'FOTO_LATERAL'
  | 'FOTO_CHASSI'
  | 'OUTRO';

export interface ArquivoResumoResponse {
  id: string;
  nomeOriginal: string;
  urlPreview?: string | null;
  urlDownload?: string | null;
  contentType: string;
  tamanhoBytes: number;
}

export interface DocumentoCaminhaoResponse {
  id: string;

  tipoDocumento: TipoDocumentoCaminhao;
  observacao?: string | null;

  // auditoria
  criadoEm: string;
  criadoPor?: string | null;

  // ✅ vem do backend
  arquivo: ArquivoResumoResponse;

  // (opcional) se em algum endpoint antigo ainda vier assim
  arquivoId?: string | null;
}
