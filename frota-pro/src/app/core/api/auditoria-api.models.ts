export interface LogAuditoriaResponse {
  id: string;
  dataHora: string;
  usuarioLogin?: string | null;
  usuarioNome?: string | null;
  acao: string;
  acaoLabel: string;
  entidade?: string | null;
  descricao?: string | null;
  metodoHttp?: string | null;
  endpoint?: string | null;
  statusHttp?: number | null;
  ip?: string | null;
  dadosAntes?: Record<string, unknown> | null;
  dadosDepois?: Record<string, unknown> | null;
}
