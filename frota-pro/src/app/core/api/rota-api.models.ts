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

  // Endereço do Cliente vinculado, quando já cadastrado — null enquanto a
  // nota ainda não foi enriquecida (sync do WinThor ou XML da nota).
  documento: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  uf: string | null;
  cep: string | null;
}
