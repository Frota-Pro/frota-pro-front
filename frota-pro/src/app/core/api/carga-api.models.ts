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

  statusCarga: string;

  codigoMotorista?: string | null;
  nomeMotorista?: string | null;

  codigoCaminhao?: string | null;
  placaCaminhao?: string | null;

  codigoRota?: string | null;
}
