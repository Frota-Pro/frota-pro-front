import { FechamentoMetaResumoResponse, SituacaoFechamento } from '../../core/api/fechamento-meta.models';

export interface SegmentoFechamento {
  chave: 'confirmados' | 'fechadosPeloPrazo' | 'emAberto' | 'emAndamento';
  rotulo: string;
  qtd: number;
  /** Fatia do total de motoristas, de 0 a 100. */
  pct: number;
  cor: string;
}

const NOMES_MES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Texto curto da situação de um motorista. */
export function situacaoRotulo(situacao: SituacaoFechamento | string | null | undefined): string {
  switch (situacao) {
    case 'CONFIRMADO':
      return 'Finalizou';
    case 'FECHADO':
      return 'Fechado pelo prazo';
    case 'ABERTO':
      return 'Ainda não finalizou';
    case 'EM_ANDAMENTO':
      return 'Mês em andamento';
    default:
      return '—';
  }
}

/** As quatro fatias do gráfico, na ordem de leitura (quem já finalizou primeiro). */
export function montarSegmentos(r: FechamentoMetaResumoResponse | null | undefined): SegmentoFechamento[] {
  if (!r) return [];
  const total = r.totalMotoristas || 0;
  const fatia = (qtd: number) => (total > 0 ? Math.round((qtd / total) * 1000) / 10 : 0);

  return [
    { chave: 'confirmados', rotulo: 'Finalizaram', qtd: r.confirmados, pct: fatia(r.confirmados), cor: '#16a34a' },
    { chave: 'fechadosPeloPrazo', rotulo: 'Fechados pelo prazo', qtd: r.fechadosPeloPrazo, pct: fatia(r.fechadosPeloPrazo), cor: '#2563eb' },
    { chave: 'emAberto', rotulo: 'Ainda não finalizaram', qtd: r.emAberto, pct: fatia(r.emAberto), cor: '#f59e0b' },
    { chave: 'emAndamento', rotulo: 'Mês em andamento', qtd: r.emAndamento, pct: fatia(r.emAndamento), cor: '#94a3b8' },
  ];
}

/** Fundo do anel (CSS conic-gradient) a partir das fatias; cinza claro quando não há ninguém. */
export function gradienteDoAnel(segmentos: SegmentoFechamento[]): string {
  const total = segmentos.reduce((s, x) => s + x.qtd, 0);
  if (total <= 0) return 'conic-gradient(#e2e8f0 0 100%)';

  let inicio = 0;
  const partes: string[] = [];
  for (const s of segmentos) {
    if (s.qtd <= 0) continue;
    const fim = inicio + (s.qtd / total) * 100;
    partes.push(`${s.cor} ${inicio.toFixed(2)}% ${fim.toFixed(2)}%`);
    inicio = fim;
  }
  return `conic-gradient(${partes.join(', ')})`;
}

/** Mês no formato yyyy-MM, deslocado `delta` meses (negativo = para trás). */
export function deslocarMes(mes: string, delta: number): string {
  const [ano, m] = mes.split('-').map(Number);
  const d = new Date(ano, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function mesDeHoje(hoje: Date = new Date()): string {
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
}

/** O mês que acabou de terminar: é o que os motoristas estão fechando. */
export function mesAnteriorAHoje(hoje: Date = new Date()): string {
  return deslocarMes(mesDeHoje(hoje), -1);
}

/** "2026-10" -> "Outubro de 2026". */
export function rotuloDoMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return `${NOMES_MES[m - 1] ?? mes} de ${ano}`;
}

/** "2026-11-06" -> "06/11/2026". */
export function dataBr(iso: string | null | undefined): string {
  if (!iso) return '';
  const [a, m, d] = iso.substring(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Quem ainda não finalizou (mês acabou, prazo aberto), em ordem de nome, com limite de linhas. */
export function pendentes(r: FechamentoMetaResumoResponse | null | undefined, limite = 8): { itens: string[]; restantes: number } {
  const todos = (r?.motoristas ?? []).filter((m) => m.situacao === 'ABERTO').map((m) => m.nome);
  return { itens: todos.slice(0, limite), restantes: Math.max(0, todos.length - limite) };
}
