export interface RotaResponse {
  id: string;
  codigo: string;
  cidadeInicio: string;
  cidades: string[];
  quantidadeDeDias: number;
}

export interface RotaRequest {
  cidadeInicio: string;
  cidades: string[];
  quantidadeDeDias: number;
}

export interface ClienteHistoricoRotaResponse {
  cliente: string;
  cidade: string | null;
  quantidadeCargas: number;
  ultimaCargaEm: string | null; // yyyy-MM-dd
}
