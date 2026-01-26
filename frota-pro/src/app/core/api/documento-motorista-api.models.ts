export type TipoDocumentoMotorista =
  | 'CNH'
  | 'RG'
  | 'CPF'
  | 'COMPROVANTE_RESIDENCIA'
  | 'ASO'
  | 'FOTO'
  | 'OUTRO'
  | string;

export interface ArquivoResponse {
  id: string;
  nomeOriginal?: string | null;
  urlPreview?: string | null;
  urlDownload?: string | null;
  contentType?: string | null;
  tamanhoBytes?: number | null;
}

export interface DocumentoMotoristaResponse {
  id: string;
  tipoDocumento?: string | null;
  observacao?: string | null;
  arquivo?: ArquivoResponse | null;
}
