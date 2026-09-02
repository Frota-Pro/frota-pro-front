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
