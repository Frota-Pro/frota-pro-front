import { PageResponse } from './page.models';

export type NotificacaoTipo = 'INFO' | 'SUCESSO' | 'ALERTA' | 'ERRO';

export interface NotificacaoResponse {
  id: string;
  evento: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  referenciaTipo: string | null;
  referenciaId: string | null;
  referenciaCodigo: string | null;
  criadoEm: string;
  lidaEm: string | null;
  lida: boolean;
}

export type NotificacaoPageResponse = PageResponse<NotificacaoResponse>;
