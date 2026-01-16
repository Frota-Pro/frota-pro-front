export interface CategoriaCaminhaoResponse {
  id: string;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

export interface CategoriaCaminhaoRequest {
  codigo: string;
  descricao: string;
}
