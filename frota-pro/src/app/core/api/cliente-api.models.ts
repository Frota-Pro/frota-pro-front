export interface ClienteResponse {
  id: string;
  documento: string;
  nome: string;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
  /** codcli do WinThor, quando o cliente foi visto por lá. */
  codigoExterno?: string | null;
  atualizadoEm?: string | null;
}

export interface ClienteRequest {
  documento: string;
  nome: string;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  telefone?: string | null;
  email?: string | null;
}

/** Dados públicos de um CNPJ (Receita Federal via BrasilAPI), pra pré-preencher o cadastro. */
export interface ConsultaCnpjResponse {
  nome?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  telefone?: string | null;
}
