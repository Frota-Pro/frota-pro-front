import {
  normalizeStatusDesempenho,
  statusDesempenhoClass,
  statusDesempenhoLabel,
} from './meta-performance-status';

describe('meta-performance-status', () => {
  describe('normalizeStatusDesempenho', () => {
    it('BATEU e DENTRO viram BATEU', () => {
      expect(normalizeStatusDesempenho('BATEU')).toBe('BATEU');
      expect(normalizeStatusDesempenho('DENTRO')).toBe('BATEU');
    });

    it('NAO_BATEU e FORA viram NAO_BATEU', () => {
      expect(normalizeStatusDesempenho('NAO_BATEU')).toBe('NAO_BATEU');
      expect(normalizeStatusDesempenho('FORA')).toBe('NAO_BATEU');
    });

    it('mantém NAO_INICIADO e SEM_META', () => {
      expect(normalizeStatusDesempenho('NAO_INICIADO')).toBe('NAO_INICIADO');
      expect(normalizeStatusDesempenho('SEM_META')).toBe('SEM_META');
    });

    it('ignora caixa, espaços nas pontas e troca espaço do meio por sublinhado', () => {
      expect(normalizeStatusDesempenho('  bateu ')).toBe('BATEU');
      expect(normalizeStatusDesempenho('nao bateu')).toBe('NAO_BATEU');
      expect(normalizeStatusDesempenho('Nao  Iniciado')).toBe('NAO_INICIADO');
    });

    it('valor desconhecido, vazio ou nulo devolve nulo', () => {
      expect(normalizeStatusDesempenho('QUALQUER')).toBeNull();
      expect(normalizeStatusDesempenho('')).toBeNull();
      expect(normalizeStatusDesempenho(null)).toBeNull();
      expect(normalizeStatusDesempenho(undefined)).toBeNull();
    });
  });

  describe('statusDesempenhoLabel', () => {
    it('texto de cada situação', () => {
      expect(statusDesempenhoLabel('BATEU')).toBe('Meta atingida');
      expect(statusDesempenhoLabel('FORA')).toBe('Meta não atingida');
      expect(statusDesempenhoLabel('NAO_INICIADO')).toBe('Não iniciado');
      expect(statusDesempenhoLabel('SEM_META')).toBe('Sem meta');
    });

    it('situação desconhecida mostra um traço', () => {
      expect(statusDesempenhoLabel('???')).toBe('—');
      expect(statusDesempenhoLabel(null)).toBe('—');
    });
  });

  describe('statusDesempenhoClass', () => {
    it('verde para bateu, vermelho para não bateu', () => {
      expect(statusDesempenhoClass('BATEU')).toBe('success');
      expect(statusDesempenhoClass('DENTRO')).toBe('success');
      expect(statusDesempenhoClass('NAO_BATEU')).toBe('danger');
      expect(statusDesempenhoClass('FORA')).toBe('danger');
    });

    it('o resto fica neutro', () => {
      expect(statusDesempenhoClass('NAO_INICIADO')).toBe('neutral');
      expect(statusDesempenhoClass('SEM_META')).toBe('neutral');
      expect(statusDesempenhoClass(undefined)).toBe('neutral');
      expect(statusDesempenhoClass('xyz')).toBe('neutral');
    });
  });
});
