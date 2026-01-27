export interface ClienteCargaResponse {
  cliente: string;
  notas: string[];
}

export interface CargaMinResponse {
  numeroCarga: string;
  numeroCargaExterno?: string | null;
  dtSaida?: string | null;
  pesoCarga?: number | null;
  valorTotal?: number | null;
  statusCarga: string;
  nomeMotorista?: string | null;
  placaCaminhao?: string | null;
}

export interface CargaResponse {
  id: string;
  numeroCarga: string;
  numeroCargaExterno?: string | null;

  dtSaida?: string | null;
  dtPrevista?: string | null;
  dtChegada?: string | null;

  pesoCarga?: number | null;
  valorTotal?: number | null;

  kmInicial?: number | null;
  kmFinal?: number | null;
  kmTotal?: number | null;

  diasAtraso?: number | null;

  clientes?: ClienteCargaResponse[];

  statusCarga: string;

  codigoMotorista?: string | null;
  nomeMotorista?: string | null;

  codigoCaminhao?: string | null;
  placaCaminhao?: string | null;

  codigoRota?: string | null;

  codigosAjudantes?: string[];

  ordemEntregaClientes?: string[];

  observacaoMotorista?: string | null;
}

export interface CargaRequest {
  dtSaida?: string | null;
  dtPrevista?: string | null;
  dtChegada?: string | null;

  pesoCarga?: number | null;
  valorTotal?: number | null;

  kmInicial?: number | null;
  kmFinal?: number | null;

  statusCarga?: string | null; // ex: EM_ROTA, FINALIZADA, CANCELADA (ajuste conforme seu enum)

  codigoMotorista: string;
  codigoCaminhao: string;
  codigoRota: string;

  codigosAjudantes?: string[] | null;
}
