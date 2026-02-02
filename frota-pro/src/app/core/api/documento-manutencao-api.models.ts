export type TipoDocumentoManutencao =
  | 'ORDEM_SERVICO'
  | 'NOTA_FISCAL'
  | 'ORCAMENTO'
  | 'FOTO'
  | 'OUTRO'
  | string;

export interface ArquivoResponse {
  id: string;
  nomeOriginal?: string | null;
  contentType?: string | null;
  tamanhoBytes?: number | null;
  urlPreview?: string | null;
  urlDownload?: string | null;
}

export interface DocumentoManutencaoResponse {
  id: string;
  tipoDocumento: string;
  observacao?: string | null;
  arquivo: ArquivoResponse;
}
