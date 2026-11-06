import { TipoItemSincronizacao } from '../../core/api/integracao-winthor-api.models';
import { formatKgFromTon } from './weight';

/**
 * Textos e contas do histórico de sincronização (modal "O que mudou" e aba da carga).
 * Peso chega em TONELADAS e é mostrado em kg, como no resto do sistema.
 */

export function tipoItemLabel(tipo?: TipoItemSincronizacao | string | null): string {
  switch (tipo) {
    case 'NOVA':
      return 'Nova';
    case 'ATUALIZADA':
      return 'Atualizada';
    case 'BLOQUEADA':
      return 'Diminuição retida';
    case 'DESCARTADA':
      return 'Descartada';
    default:
      return '-';
  }
}

export function tipoItemClass(tipo?: TipoItemSincronizacao | string | null): string {
  switch (tipo) {
    case 'NOVA':
      return 'chip ok';
    case 'ATUALIZADA':
      return 'chip info';
    case 'BLOQUEADA':
      return 'chip warn';
    case 'DESCARTADA':
      return 'chip err';
    default:
      return 'chip';
  }
}

export function formatMoney(v?: number | null): string {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '-';
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatKgDeTon(v?: number | null): string {
  if (v === null || v === undefined || !Number.isFinite(Number(v))) return '-';
  return formatKgFromTon(v);
}

/** depois − antes, arredondado para evitar "0,0000001" de ponto flutuante; 0 quando falta um dos lados. */
export function deltaNum(antes?: number | null, depois?: number | null): number {
  if (antes == null || depois == null) return 0;
  return Math.round((Number(depois) - Number(antes)) * 1000) / 1000;
}

export function formatDeltaMoney(antes?: number | null, depois?: number | null): string {
  const d = deltaNum(antes, depois);
  if (d === 0) return '';
  const abs = Math.abs(d).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (d < 0 ? '− ' : '+ ') + abs;
}

export function formatDeltaKg(antesTon?: number | null, depoisTon?: number | null): string {
  const d = deltaNum(antesTon, depoisTon);
  if (d === 0) return '';
  return (d < 0 ? '− ' : '+ ') + formatKgFromTon(Math.abs(d)) + ' kg';
}
