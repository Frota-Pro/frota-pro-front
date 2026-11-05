export interface LinhaTransporteResponse {
  id: string;
  nome: string;
  ativo: boolean;
}

export interface LinhaTransporteRequest {
  nome: string;
  ativo?: boolean;
}
