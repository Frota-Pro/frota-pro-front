export type StatusCaminhao = 'DISPONIVEL' | 'EM_ROTA' | 'SINCRONIZADA' | 'FINALIZADA' | string;

export interface CaminhaoResponse {
  codigo: string;
  codigoExterno?: string | null;

  descricao: string;
  modelo: string;
  marca: string;
  placa: string;

  cor?: string | null;
  antt?: string | null;
  renavan?: string | null;
  chassi?: string | null;

  tara?: number | null;
  maxPeso?: number | null;

  categoriaCodigo?: string | null;
  categoriaDescricao?: string | null;

  // API envia no padrão dd/MM/yyyy
  dtLicenciamento?: string | null;

  status?: StatusCaminhao | null;
  ativo: boolean;
}

export interface CaminhaoRequest {
  codigoExterno?: string | null;
  descricao: string;
  modelo: string;
  marca: string;
  placa: string;

  cor?: string | null;
  antt?: string | null;
  renavan?: string | null;
  chassi?: string | null;
  tara?: number | null;
  maxPeso?: number | null;

  categoria?: string | null;

  // dd/MM/yyyy
  dtLicenciamento?: string | null;
}
