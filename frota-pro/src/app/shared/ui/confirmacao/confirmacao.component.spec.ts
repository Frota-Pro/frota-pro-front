import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmacaoComponent, PedidoDeConfirmacao } from './confirmacao.component';

function pedido(parcial: Partial<PedidoDeConfirmacao> = {}): PedidoDeConfirmacao {
  return {
    tipo: 'perigo',
    titulo: 'Tirar da planilha?',
    mensagem: 'Eles somem desta planilha.',
    itens: ['423360 · PICUI', '423337 · SOUSA'],
    rodape: 'Não aparecem em nenhuma outra planilha.',
    textoConfirmar: 'Tirar',
    textoCancelar: 'Voltar',
    aoConfirmar: () => undefined,
    ...parcial,
  };
}

describe('ConfirmacaoComponent', () => {
  let fixture: ComponentFixture<ConfirmacaoComponent>;
  let comp: ConfirmacaoComponent;

  function montar(p: PedidoDeConfirmacao = pedido()) {
    TestBed.configureTestingModule({ imports: [ConfirmacaoComponent] });
    fixture = TestBed.createComponent(ConfirmacaoComponent);
    comp = fixture.componentInstance;
    comp.pedido = p;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra o título, a mensagem, a lista e o rodapé', () => {
    const el = montar();

    expect(el.querySelector('h2')!.textContent).toContain('Tirar da planilha?');
    expect(el.querySelector('.mensagem')!.textContent).toContain('Eles somem desta planilha.');
    expect(Array.from(el.querySelectorAll('.itens li')).map((li) => li.textContent)).toEqual(['423360 · PICUI', '423337 · SOUSA']);
    expect(el.querySelector('.rodape')!.textContent).toContain('Não aparecem em nenhuma outra');
  });

  it('o que não foi pedido não aparece (sem lista, sem rodapé)', () => {
    const el = montar(pedido({ itens: undefined, rodape: undefined, mensagem: undefined }));

    expect(el.querySelector('.itens')).toBeNull();
    expect(el.querySelector('.rodape')).toBeNull();
    expect(el.querySelector('.mensagem')).toBeNull();
  });

  it('os botões levam o texto pedido e avisam quem chamou', () => {
    const el = montar();
    let confirmou = 0;
    let cancelou = 0;
    comp.confirmar.subscribe(() => confirmou++);
    comp.cancelar.subscribe(() => cancelou++);

    (el.querySelector('.btn-cancelar') as HTMLButtonElement).click();
    (el.querySelector('.btn-confirmar') as HTMLButtonElement).click();

    expect((el.querySelector('.btn-cancelar') as HTMLElement).textContent).toContain('Voltar');
    expect((el.querySelector('.btn-confirmar') as HTMLElement).textContent).toContain('Tirar');
    expect(cancelou).toBe(1);
    expect(confirmou).toBe(1);
  });

  it('clicar fora da caixa cancela; clicar dentro não', () => {
    const el = montar();
    let cancelou = 0;
    comp.cancelar.subscribe(() => cancelou++);

    (el.querySelector('.caixa') as HTMLElement).click();
    expect(cancelou).toBe(0);

    (el.querySelector('.fundo') as HTMLElement).click();
    expect(cancelou).toBe(1);
  });

  it('Esc cancela', () => {
    montar();
    let cancelou = 0;
    comp.cancelar.subscribe(() => cancelou++);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cancelou).toBe(1);
  });

  it('o tipo muda a cor e o ícone', () => {
    const el = montar(pedido({ tipo: 'aviso' }));

    expect(el.querySelector('.caixa')!.classList).toContain('aviso');
    expect(el.querySelector('.icone i')!.classList).toContain('fa-exclamation-triangle');
  });

  it('dá para escolher o ícone', () => {
    const el = montar(pedido({ tipo: 'info', icone: 'fa-lock' }));

    expect(el.querySelector('.icone i')!.classList).toContain('fa-lock');
  });

  it('fica no <body> (para nada em volta cortar a janela) e sai de lá quando fecha', () => {
    const el = montar();

    expect(el.parentElement).toBe(document.body);

    fixture.destroy();
    expect(document.body.contains(el)).toBe(false);
  });

  it('o foco nasce no botão de confirmar', async () => {
    const el = montar();

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(document.activeElement).toBe(el.querySelector('.btn-confirmar'));
  });
});
