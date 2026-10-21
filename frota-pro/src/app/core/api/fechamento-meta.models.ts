/** DESATIVADO | EM_ANDAMENTO (mês não acabou) | ABERTO (acabou, dentro do prazo) | CONFIRMADO | FECHADO (prazo venceu). */
export type SituacaoFechamento = 'DESATIVADO' | 'EM_ANDAMENTO' | 'ABERTO' | 'CONFIRMADO' | 'FECHADO';

export interface FechamentoMetaResumoItem {
  codigo: string;
  nome: string;
  situacao: SituacaoFechamento;
  /** Mês já fechado para o motorista (confirmou ou o prazo venceu). */
  finalizado: boolean;
  confirmadoEm?: string | null;
  origem?: 'APP' | 'ADMIN' | null;
}

/** Quem já finalizou e quem não a meta de um mês (GET /metas/fechamento/resumo). */
export interface FechamentoMetaResumoResponse {
  /** Primeiro dia do mês (yyyy-MM-dd). */
  mesReferencia: string;
  ativo: boolean;
  diasUteisFechamento: number;
  /** Último dia em que o mês ainda aceita cargas para todo mundo (yyyy-MM-dd). */
  dataLimite: string;
  mesEncerrado: boolean;
  totalMotoristas: number;
  confirmados: number;
  fechadosPeloPrazo: number;
  emAberto: number;
  emAndamento: number;
  finalizados: number;
  motoristas: FechamentoMetaResumoItem[];
}
