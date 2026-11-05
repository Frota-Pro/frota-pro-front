import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CaminhoesListComponent } from './caminhoes-list.component';

const FRIOS = { id: 'lin-1', nome: 'Frios', ativo: true };
const SECA = { id: 'lin-2', nome: 'Linha seca', ativo: true };
const INATIVA = { id: 'lin-3', nome: 'Antiga', ativo: false };

const CAMINHAO = {
  codigo: 'CAM-000001', placa: 'QSF0799', descricao: 'BAU', marca: 'VOLVO', modelo: 'FH',
  linhaId: 'lin-1', linhaNome: 'Frios', ativo: true,
};

describe('CaminhoesListComponent - linha de transporte', () => {
  let fixture: ComponentFixture<CaminhoesListComponent>;
  let comp: CaminhoesListComponent;
  let http: HttpTestingController;

  function iniciar(): void {
    fixture.detectChanges();
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/categorias-caminhao')).flush({ content: [] });
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/linhas-transporte')).flush([FRIOS, SECA, INATIVA]);
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/caminhao')).flush({
      content: [CAMINHAO], totalElements: 1, totalPages: 1,
    });
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CaminhoesListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(CaminhoesListComponent);
    comp = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista so as linhas ativas e mostra a linha de cada caminhao na tabela', () => {
    iniciar();

    expect(comp.linhas.map((l) => l.nome)).toEqual(['Frios', 'Linha seca']);
    const celulas = Array.from(fixture.nativeElement.querySelectorAll('tbody td .tag')).map((t: any) => t.textContent.trim());
    expect(celulas).toContain('Frios');
  });

  it('vincula a linha escolhida aos caminhoes marcados', () => {
    iniciar();
    comp.toggleOne('CAM-000001', true);
    comp.linhaSelecionada = 'lin-2';

    comp.aplicarLinha();
    const put = http.expectOne((r) => r.method === 'PUT' && r.url.endsWith('/caminhao/linha'));
    expect(put.request.body).toEqual({ linhaId: 'lin-2', caminhoesCodigo: ['CAM-000001'] });
    put.flush(null);
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/caminhao')).flush({ content: [CAMINHAO], totalElements: 1, totalPages: 1 });

    expect(comp.linhaSelecionada).toBe('');
  });

  it('nao vincula sem escolher a linha nem sem marcar caminhao', () => {
    iniciar();

    comp.aplicarLinha();
    comp.linhaSelecionada = 'lin-1';
    comp.aplicarLinha();

    http.expectNone((r) => r.method === 'PUT');
    expect(comp.toasts.length).toBe(2);
  });

  it('cria a linha com o nome sem espacos e recarrega a lista de linhas', () => {
    iniciar();
    comp.openLinhaModal();
    comp.linhaNome = '  Congelados ';

    comp.salvarLinha();
    const post = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/linhas-transporte'));
    expect(post.request.body).toEqual({ nome: 'Congelados' });
    post.flush({ id: 'lin-9', nome: 'Congelados', ativo: true });
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/linhas-transporte')).flush([FRIOS, SECA]);

    expect(comp.showLinhaModal).toBeFalse();
  });

  it('nome de linha curto demais nem chega na API', () => {
    iniciar();
    comp.linhaNome = ' F ';

    comp.salvarLinha();

    http.expectNone((r) => r.method === 'POST');
    expect(comp.toasts[0].type).toBe('warning');
  });

  it('o novo caminhao pode nascer ja com a linha escolhida', () => {
    iniciar();
    comp.openNovoCaminhao();
    comp.form = { ...comp.form, descricao: 'Bau', marca: 'Volvo', modelo: 'FH', placa: 'QSF0799', linhaId: 'lin-1' };

    comp.salvarCaminhao();
    const post = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/caminhao'));
    expect(post.request.body.linhaId).toBe('lin-1');
    post.flush({ ...CAMINHAO });
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/caminhao')).flush({ content: [CAMINHAO], totalElements: 1, totalPages: 1 });
  });
});
