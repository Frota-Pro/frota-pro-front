import { StatusDesempenhoMeta, StatusDesempenhoMetaMotorista } from '../../core/api/meta-api.models';

export type StatusDesempenhoUi = StatusDesempenhoMeta | 'SEM_META';
export type StatusDesempenhoClass = 'success' | 'danger' | 'neutral';

export function normalizeStatusDesempenho(
  status: StatusDesempenhoMetaMotorista | string | null | undefined
): StatusDesempenhoUi | null {
  const value = String(status || '').trim().toUpperCase().replace(/\s+/g, '_');

  switch (value) {
    case 'BATEU':
    case 'DENTRO':
      return 'BATEU';
    case 'NAO_BATEU':
    case 'FORA':
      return 'NAO_BATEU';
    case 'NAO_INICIADO':
      return 'NAO_INICIADO';
    case 'SEM_META':
      return 'SEM_META';
    default:
      return null;
  }
}

export function statusDesempenhoLabel(
  status: StatusDesempenhoMetaMotorista | string | null | undefined
): string {
  switch (normalizeStatusDesempenho(status)) {
    case 'BATEU':
      return 'Meta atingida';
    case 'NAO_BATEU':
      return 'Meta não atingida';
    case 'NAO_INICIADO':
      return 'Não iniciado';
    case 'SEM_META':
      return 'Sem meta';
    default:
      return '—';
  }
}

export function statusDesempenhoClass(
  status: StatusDesempenhoMetaMotorista | string | null | undefined
): StatusDesempenhoClass {
  switch (normalizeStatusDesempenho(status)) {
    case 'BATEU':
      return 'success';
    case 'NAO_BATEU':
      return 'danger';
    default:
      return 'neutral';
  }
}
