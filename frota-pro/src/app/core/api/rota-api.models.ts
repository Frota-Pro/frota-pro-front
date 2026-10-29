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

export interface UnificarRotasRepetida {
  codigo: string;
  nome: string;
  quantidadeCargas: number;
}

export interface UnificarRotasGrupo {
  codigoMantida: string;
  nomeAtual: string;
  nomeFinal: string;
  repetidas: UnificarRotasRepetida[];
}

export interface UnificarRotasResponse {
  simulacao: boolean;
  rotasRemovidas: number;
  cargasMovidas: number;
  grupos: UnificarRotasGrupo[];
}
