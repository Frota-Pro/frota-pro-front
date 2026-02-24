export function parseNumberLike(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = String(value).trim();
  if (!raw) return 0;

  const hasDot = raw.includes('.');
  const hasComma = raw.includes(',');

  let normalized = raw.replace(/\s/g, '');

  // If both separators appear, assume pt-BR: "." thousands, "," decimal.
  if (hasDot && hasComma) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    normalized = normalized.replace(',', '.');
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function tonToKg(value: number | string | null | undefined): number {
  return parseNumberLike(value) * 1000;
}

export function formatKgFromTon(value: number | string | null | undefined, dec = 0): string {
  const kg = tonToKg(value);
  return kg.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
