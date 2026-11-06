import {
  deltaNum,
  formatDeltaKg,
  formatDeltaMoney,
  formatKgDeTon,
  formatMoney,
  tipoItemClass,
  tipoItemLabel,
} from './sincronizacao-historico';

describe('sincronizacao-historico', () => {
  it('traduz o tipo do item para o texto e a cor da tela', () => {
    expect(tipoItemLabel('BLOQUEADA')).toBe('Diminuição retida');
    expect(tipoItemClass('BLOQUEADA')).toBe('chip warn');
    expect(tipoItemClass('DESCARTADA')).toBe('chip err');
    expect(tipoItemLabel('NOVA')).toBe('Nova');
    expect(tipoItemLabel(null)).toBe('-');
  });

  it('mostra o peso em kg a partir de toneladas', () => {
    expect(formatKgDeTon(6.89)).toBe('6.890');
    expect(formatKgDeTon(null)).toBe('-');
  });

  it('calcula a diferença sem sobra de ponto flutuante', () => {
    expect(deltaNum(6.89, 4.394)).toBe(-2.496);
    expect(deltaNum(0.1 + 0.2, 0.3)).toBe(0);
    expect(deltaNum(null, 5)).toBe(0);
  });

  it('formata a diminuição de valor e de peso com sinal', () => {
    expect(formatDeltaKg(6.89, 4.394).replace(/\s/g, ' ')).toBe('− 2.496 kg');
    expect(formatDeltaKg(4.394, 6.89)).toBe('+ 2.496 kg');
    expect(formatDeltaKg(5, 5)).toBe('');
    expect(formatDeltaMoney(66108.54, 42632.96)).toContain('−');
    expect(formatDeltaMoney(66108.54, 42632.96)).toContain('23.475,58');
    expect(formatDeltaMoney(1, 1)).toBe('');
  });

  it('formata dinheiro e devolve traço quando não há valor', () => {
    expect(formatMoney(42632.96)).toContain('42.632,96');
    expect(formatMoney(undefined)).toBe('-');
  });
});
