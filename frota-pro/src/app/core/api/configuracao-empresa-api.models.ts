export interface ArquivoResponse {
  id: string;
  nomeOriginal: string;
  urlPreview: string;
  urlDownload: string;
  contentType?: string | null;
  tamanhoBytes?: number | null;
}

export interface ConfiguracaoEmpresaResponse {
  nomeEmpresa?: string | null;
  logo?: ArquivoResponse | null;
  emailRemetente?: string | null;
  emailAssunto?: string | null;
  emailCorpoHtml?: string | null;
}

export interface ConfiguracaoEmpresaUpdateRequest {
  nomeEmpresa?: string | null;
  emailRemetente?: string | null;
  emailAssunto?: string | null;
  emailCorpoHtml?: string | null;
}
