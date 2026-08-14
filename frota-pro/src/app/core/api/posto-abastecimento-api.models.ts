export interface PostoAbastecimentoResponse {
  id: string;
  codigo: string;
  nome: string;
  cnpj?: string | null;
  cidade?: string | null;
  uf?: string | null;
  endereco?: string | null;
  observacao?: string | null;
  ativo: boolean;
}

export interface PostoAbastecimentoRequest {
  codigo: string;
  nome: string;
  cnpj?: string | null;
  cidade?: string | null;
  uf?: string | null;
  endereco?: string | null;
  observacao?: string | null;
  ativo?: boolean | null;
}
