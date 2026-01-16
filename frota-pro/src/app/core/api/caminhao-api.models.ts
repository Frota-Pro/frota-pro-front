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

  categoria?: string | null; // CODIGO da categoria
  dtLicenciamento?: string | null; // dd/MM/yyyy
}

export interface CaminhaoDetalheResponse {
  caminhao: CaminhaoResponse;

  totalCargas: number;
  cargasFinalizadas: number;

  combustivelLitros: number;
  combustivelValor: number;

  pesoTransportado: number;

  ordensServicoAbertas: number;
}

export interface VincularCategoriaCaminhaoEmLoteRequest {
  categoriaCodigo: string;
  caminhoesCodigo: string[];
}
