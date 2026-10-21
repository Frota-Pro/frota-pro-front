import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastMessage, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let atual: ToastMessage[];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
    atual = [];
    service.toasts$.subscribe((t) => (atual = t));
  });

  it('começa sem avisos', () => {
    expect(atual).toEqual([]);
  });

  it('cada tipo tem o título padrão e o tipo certos', fakeAsync(() => {
    service.success('a');
    service.info('b');
    service.warn('c');
    service.error('d');

    const porMensagem = (m: string) => atual.find((t) => t.message === m)!;
    expect(porMensagem('a')).toEqual(jasmine.objectContaining({ type: 'ok', title: 'Sucesso' }));
    expect(porMensagem('b')).toEqual(jasmine.objectContaining({ type: 'info', title: 'Info' }));
    expect(porMensagem('c')).toEqual(jasmine.objectContaining({ type: 'warn', title: 'Atenção' }));
    expect(porMensagem('d')).toEqual(jasmine.objectContaining({ type: 'err', title: 'Erro' }));

    tick(10000);
  }));

  it('aceita um título próprio', fakeAsync(() => {
    service.error('falhou', 'Não foi possível concluir');

    expect(atual[0].title).toBe('Não foi possível concluir');
    tick(10000);
  }));

  it('o aviso mais novo aparece primeiro', fakeAsync(() => {
    service.info('primeiro');
    service.info('segundo');

    expect(atual.map((t) => t.message)).toEqual(['segundo', 'primeiro']);
    tick(10000);
  }));

  it('mostra no máximo cinco avisos, descartando os mais antigos', fakeAsync(() => {
    for (let i = 1; i <= 7; i++) service.info(`aviso ${i}`);

    expect(atual.length).toBe(5);
    expect(atual[0].message).toBe('aviso 7');
    expect(atual[4].message).toBe('aviso 3');
    tick(10000);
  }));

  it('cada aviso tem um id próprio', fakeAsync(() => {
    service.info('a');
    service.info('b');

    expect(atual[0].id).not.toBe(atual[1].id);
    tick(10000);
  }));

  it('dismiss remove só o aviso pedido', fakeAsync(() => {
    service.info('fica');
    service.info('sai');
    const idSai = atual.find((t) => t.message === 'sai')!.id;

    service.dismiss(idSai);

    expect(atual.map((t) => t.message)).toEqual(['fica']);
    tick(10000);
  }));

  it('some sozinho depois de 4,5 segundos', fakeAsync(() => {
    service.success('temporário');
    expect(atual.length).toBe(1);
    expect(atual[0].ttlMs).toBe(4500);

    tick(4499);
    expect(atual.length).toBe(1);

    tick(1);
    expect(atual.length).toBe(0);
  }));

  it('remover um aviso que já saiu não quebra', fakeAsync(() => {
    service.info('x');
    const id = atual[0].id;

    service.dismiss(id);
    tick(5000);

    expect(atual).toEqual([]);
  }));
});
