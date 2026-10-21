import { formatKgFromTon, parseNumberLike, tonToKg } from './weight';

describe('weight', () => {
  describe('parseNumberLike', () => {
    it('número normal passa como está', () => {
      expect(parseNumberLike(12.5)).toBe(12.5);
      expect(parseNumberLike(0)).toBe(0);
      expect(parseNumberLike(-3)).toBe(-3);
    });

    it('nulo, vazio ou em branco vale zero', () => {
      expect(parseNumberLike(null)).toBe(0);
      expect(parseNumberLike(undefined)).toBe(0);
      expect(parseNumberLike('')).toBe(0);
      expect(parseNumberLike('   ')).toBe(0);
    });

    it('número infinito ou NaN vale zero', () => {
      expect(parseNumberLike(Infinity)).toBe(0);
      expect(parseNumberLike(NaN)).toBe(0);
    });

    it('vírgula sozinha é o separador decimal', () => {
      expect(parseNumberLike('12,5')).toBe(12.5);
      expect(parseNumberLike(' 0,75 ')).toBe(0.75);
    });

    it('ponto sozinho é decimal (formato que o backend manda)', () => {
      expect(parseNumberLike('12.5')).toBe(12.5);
      expect(parseNumberLike('12.500')).toBe(12.5);
    });

    it('ponto e vírgula juntos seguem o padrão brasileiro', () => {
      expect(parseNumberLike('1.234,5')).toBe(1234.5);
      expect(parseNumberLike('1.234.567,89')).toBe(1234567.89);
    });

    it('texto que não é número vale zero', () => {
      expect(parseNumberLike('abc')).toBe(0);
      expect(parseNumberLike('12 kg')).toBe(0);
    });
  });

  describe('tonToKg', () => {
    it('multiplica por mil', () => {
      expect(tonToKg(2.5)).toBe(2500);
      expect(tonToKg('0,5')).toBe(500);
      expect(tonToKg(null)).toBe(0);
    });
  });

  describe('formatKgFromTon', () => {
    it('mostra em kg com ponto de milhar', () => {
      expect(formatKgFromTon(12.5)).toBe('12.500');
      expect(formatKgFromTon(0.75)).toBe('750');
    });

    it('respeita as casas decimais pedidas', () => {
      expect(formatKgFromTon(1.2345, 1)).toBe('1.234,5');
      expect(formatKgFromTon(2, 2)).toBe('2.000,00');
    });

    it('valor nulo mostra zero', () => {
      expect(formatKgFromTon(null)).toBe('0');
    });
  });
});
