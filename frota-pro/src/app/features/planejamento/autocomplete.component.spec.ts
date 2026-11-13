import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutocompleteComponent } from './autocomplete.component';
import { OpcaoAuto, filtrarOpcoes, normalizarBusca, podeCadastrar } from './autocomplete.utils';

const MOTORISTAS: OpcaoAuto[] = [
  { codigo: 'MOT-1', rotulo: 'FRANCISCO LAMARK FORMIGA PIRES', detalhe: 'MOT-1' },
  { codigo: 'MOT-2', rotulo: 'JOSÉ BERNARDO DE SOUSA JUNIOR', detalhe: 'MOT-2' },
  { codigo: 'MOT-3', rotulo: 'CARLOS EDUARDO SILVA SANTOS', detalhe: 'MOT-3' },
];

const CAMINHOES: OpcaoAuto[] = [
  { codigo: 'CAM-1', rotulo: 'JNB1373', detalhe: 'D20' },
  { codigo: 'CAM-2', rotulo: 'OFA9954', detalhe: 'Mercedes' },
];

describe('autocomplete.utils', () => {
  it('normaliza sem acento, sem maiúscula e sem espaço sobrando', () => {
    expect(normalizarBusca('  José  ')).toBe('jose');
    expect(normalizarBusca(null)).toBe('');
  });

  it('acha em qualquer parte do nome, sem se importar com acento nem caixa', () => {
    expect(filtrarOpcoes(MOTORISTAS, 'jose').map((o) => o.codigo)).toEqual(['MOT-2']);
    expect(filtrarOpcoes(MOTORISTAS, 'SILVA').map((o) => o.codigo)).toEqual(['MOT-3']);
    expect(filtrarOpcoes(MOTORISTAS, 'xyz')).toEqual([]);
  });

  it('quem começa com o texto vem antes de quem só contém', () => {
    const lista: OpcaoAuto[] = [
      { codigo: 'A', rotulo: 'MARIA JOSÉ' },
      { codigo: 'B', rotulo: 'JOSÉ MARIA' },
    ];
    expect(filtrarOpcoes(lista, 'jose').map((o) => o.codigo)).toEqual(['B', 'A']);
  });

  it('acha a placa (e também pelo detalhe), mesmo digitada pela metade', () => {
    expect(filtrarOpcoes(CAMINHOES, 'jnb').map((o) => o.codigo)).toEqual(['CAM-1']);
    expect(filtrarOpcoes(CAMINHOES, '9954').map((o) => o.codigo)).toEqual(['CAM-2']);
    expect(filtrarOpcoes(CAMINHOES, 'mercedes').map((o) => o.codigo)).toEqual(['CAM-2']);
  });

  it('sem texto devolve as primeiras opções, e respeita o limite', () => {
    const muitas = Array.from({ length: 20 }, (_, i) => ({ codigo: String(i), rotulo: `NOME ${i}` }));
    expect(filtrarOpcoes(muitas, '').length).toBe(8);
    expect(filtrarOpcoes(muitas, 'nome', 3).length).toBe(3);
  });

  it('oferece cadastrar só quando o nome tem tamanho e não existe igual', () => {
    expect(podeCadastrar(MOTORISTAS, 'Rafael')).toBe(true);
    expect(podeCadastrar(MOTORISTAS, 'Ra')).toBe(false);
    expect(podeCadastrar(MOTORISTAS, 'josé bernardo de sousa junior')).toBe(false);
  });
});

describe('AutocompleteComponent', () => {
  let fixture: ComponentFixture<AutocompleteComponent>;
  let comp: AutocompleteComponent;
  let el: HTMLElement;

  function montar(entradas: Partial<AutocompleteComponent> = {}) {
    TestBed.configureTestingModule({ imports: [AutocompleteComponent] });
    fixture = TestBed.createComponent(AutocompleteComponent);
    comp = fixture.componentInstance;
    Object.assign(comp, { opcoes: MOTORISTAS, rotulo: 'Motorista', placeholder: 'nome', ...entradas });
    comp.ngOnChanges({ valorRotulo: { currentValue: comp.valorRotulo, previousValue: '', firstChange: true, isFirstChange: () => true } });
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    return el.querySelector('input') as HTMLInputElement;
  }

  function digitar(input: HTMLInputElement, texto: string) {
    input.dispatchEvent(new Event('focus'));
    input.value = texto;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  /** O ngModel escreve o texto no campo um instante depois da detecção de mudanças. */
  async function assentar() {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function itens(): string[] {
    return Array.from(el.querySelectorAll('.auto-lista li')).map((li) => (li.textContent ?? '').replace(/\s+/g, ' ').trim());
  }

  it('digitando um pedaço do nome aparece só quem combina', () => {
    const input = montar();

    digitar(input, 'carlos');

    expect(itens().length).toBe(1);
    expect(itens()[0]).toContain('CARLOS EDUARDO SILVA SANTOS');
  });

  it('escolher uma opção avisa o código e deixa o nome escrito no campo', async () => {
    const input = montar();
    const escolhidos: string[] = [];
    comp.escolher.subscribe((c: string) => escolhidos.push(c));

    digitar(input, 'fran');
    (el.querySelector('.auto-lista li') as HTMLElement).dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();

    await assentar();

    expect(escolhidos).toEqual(['MOT-1']);
    expect(input.value).toBe('FRANCISCO LAMARK FORMIGA PIRES');
    expect(el.querySelector('.auto-lista')).toBeNull();
  });

  it('Enter escolhe o primeiro da lista', () => {
    const input = montar({ opcoes: CAMINHOES });
    const escolhidos: string[] = [];
    comp.escolher.subscribe((c: string) => escolhidos.push(c));

    digitar(input, 'ofa');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(escolhidos).toEqual(['CAM-2']);
  });

  it('as setas mudam a opção e Esc fecha a lista', () => {
    const input = montar({ opcoes: CAMINHOES });

    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(itens().length).toBe(2);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(el.querySelectorAll('.auto-lista li')[1].classList).toContain('ativa');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el.querySelector('.auto-lista')).toBeNull();
  });

  it('mostra o que está escolhido e deixa limpar com o "×"', async () => {
    const input = montar({ valorRotulo: 'JNB1373', opcoes: CAMINHOES });
    await assentar();
    let limpou = false;
    comp.limpar.subscribe(() => (limpou = true));

    expect(input.value).toBe('JNB1373');
    (el.querySelector('.auto-limpar') as HTMLElement).dispatchEvent(new MouseEvent('mousedown'));

    expect(limpou).toBe(true);
  });

  it('sai do campo sem escolher: volta ao que estava escolhido', async () => {
    const input = montar({ valorRotulo: 'JNB1373', opcoes: CAMINHOES });

    digitar(input, 'xxx');
    input.dispatchEvent(new Event('blur'));
    await assentar();

    expect(input.value).toBe('JNB1373');
  });

  it('ajudante que não existe: oferece cadastrar e avisa o nome digitado', async () => {
    const input = montar({ permitirCriar: true, limparAoEscolher: true, limpavel: false });
    const nomes: string[] = [];
    comp.criar.subscribe((n: string) => nomes.push(n));

    digitar(input, 'Rafael');
    expect(itens()).toEqual(['+ Cadastrar "Rafael"']);

    (el.querySelector('.auto-lista li.criar') as HTMLElement).dispatchEvent(new MouseEvent('mousedown'));
    await assentar();

    expect(nomes).toEqual(['Rafael']);
    expect(input.value).toBe('');
  });

  it('não oferece cadastrar se o nome já existe', () => {
    const input = montar({ permitirCriar: true });

    digitar(input, 'Carlos Eduardo Silva Santos');

    expect(itens().some((i) => i.includes('Cadastrar'))).toBe(false);
  });

  it('não oferece cadastrar quando o campo não é de cadastro', () => {
    const input = montar({ permitirCriar: false });

    digitar(input, 'Rafael');

    expect(itens().some((i) => i.includes('Cadastrar'))).toBe(false);
  });

  it('para quem acumula (ajudantes), esvazia o campo depois de escolher', async () => {
    const input = montar({ limparAoEscolher: true, limpavel: false });

    digitar(input, 'jose');
    (el.querySelector('.auto-lista li') as HTMLElement).dispatchEvent(new MouseEvent('mousedown'));
    await assentar();

    expect(input.value).toBe('');
  });

  it('a lista aparece colada no campo mesmo dentro de um elemento com transform (que desloca o "fixed")', async () => {
    TestBed.configureTestingModule({ imports: [AutocompleteComponent] });
    fixture = TestBed.createComponent(AutocompleteComponent);
    comp = fixture.componentInstance;
    Object.assign(comp, { opcoes: MOTORISTAS, rotulo: 'Motorista', placeholder: 'nome' });
    el = fixture.nativeElement as HTMLElement;
    el.style.transform = 'translate(60px, 40px)'; // vira a referência de tudo que é position: fixed lá dentro
    fixture.detectChanges();
    const input = el.querySelector('input') as HTMLInputElement;

    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 20));
    fixture.detectChanges();

    const lista = el.querySelector('.auto-lista') as HTMLElement;
    const campo = input.getBoundingClientRect();
    const caixa = lista.getBoundingClientRect();
    expect(Math.abs(caixa.left - campo.left)).toBeLessThan(2);
    expect(Math.abs(caixa.top - (campo.bottom + 4))).toBeLessThan(2);
  });
});
