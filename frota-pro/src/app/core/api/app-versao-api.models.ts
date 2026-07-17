export interface AppVersaoAtualResponse {
  versaoNome: string;
  notas: string | null;
  obrigatoria: boolean;
  tamanhoBytes: number;
  publicadoEm: string;
  urlDownload: string;
}

export interface AppVersaoResponse {
  id: number;
  versaoNome: string;
  notas: string | null;
  obrigatoria: boolean;
  tamanhoBytes: number;
  publicadoEm: string;
}
