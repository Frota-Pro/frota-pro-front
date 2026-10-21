import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { FechamentoMetaResumoResponse } from '../../../core/api/fechamento-meta.models';
import { mesAnteriorAHoje, mesDeHoje, deslocarMes } from '../../../shared/utils/fechamento-meta';
import { FechamentoMetasCardComponent } from './fechamento-metas-card.component';

function resposta(parcial: Partial<FechamentoMetaResumoResponse> = {}): FechamentoMetaResumoResponse {
  return {
    mesReferencia: '2026-10-01',
    ativo: true,
    diasUteisFechamento: 5,
    dataLimite: '2026-11-06',
    mesEncerrado: true,
    totalMotoristas: 4,
    confirmados: 2,
    fechadosPeloPrazo: 0,
    emAberto: 2,
    emAndamento: 0,
    finalizados: 2,
    motoristas: [
      { codigo: 'M1', nome: 'Ana', situacao: 'CONFIRMADO', finalizado: true },
      { codigo: 'M2', nome: 'Bruno', situacao: 'ABERTO', finalizado: false },
      { codigo: 'M3', nome: 'Carlos', situacao: 'CONFIRMADO', finalizado: true },
      { codigo: 'M4', nome: 'Diana', situacao: 'ABERTO', finalizado: false },
    ],
    ...parcial,
  };
}

describe('FechamentoMetasCardComponent', () => {
  let fixture: ComponentFixture<FechamentoMetasCardComponent>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/metas/fechamento/resumo`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FechamentoMetasCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(FechamentoMetasCardComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const campo = (id: string) => (fixture.nativeElement as HTMLElement).querySelector(`[data-testid="${id}"]`);

  function iniciarCom(r: FechamentoMetaResumoResponse) {
    fixture.detectChanges();
    http.expectOne((req) => req.url === url).flush(r);
    fixture.detectChanges();
  }

  it('pede o resumo do mês anterior, o que os motoristas estão fechando', () => {
    fixture.detectChanges();

    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('mes')).toBe(mesAnteriorAHoje());
    req.flush(resposta());
  });

  it('mostra quantos já finalizaram e quem ainda falta', () => {
    iniciarCom(resposta());

    expect(campo('fechamento-card')).toBeTruthy();
    expect(campo('fechamento-resumo')!.textContent).toContain('2 de 4 motoristas já finalizaram');
    expect(campo('fechamento-pendentes')!.textContent).toContain('Bruno');
    expect(campo('fechamento-pendentes')!.textContent).toContain('Diana');
    expect(campo('fechamento-pendentes')!.textContent).not.toContain('Ana');
    expect(texto()).toContain('prazo até 06/11/2026');
  });

  it('não aparece quando o fechamento por dias úteis está desligado', () => {
    iniciarCom(resposta({ ativo: false }));

    expect(campo('fechamento-card')).toBeNull();
  });

  it('some se a API falhar', () => {
    fixture.detectChanges();
    http.expectOne((r) => r.url === url).flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(campo('fechamento-card')).toBeNull();
  });

  it('avisa que o mês ainda não terminou quando for o caso', () => {
    iniciarCom(resposta({ mesEncerrado: false, finalizados: 0, confirmados: 0, emAberto: 0, emAndamento: 4, motoristas: [] }));

    expect(campo('fechamento-resumo')!.textContent).toContain('ainda não terminou');
    expect(campo('fechamento-pendentes')).toBeNull();
    expect(texto()).toContain('mês em andamento');
  });

  it('troca de mês pelas setas e pede o resumo do novo mês', () => {
    iniciarCom(resposta());

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Mês anterior"]')!.click();

    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('mes')).toBe(deslocarMes(mesAnteriorAHoje(), -1));
    req.flush(resposta());
  });

  it('não deixa avançar além do mês de hoje', () => {
    iniciarCom(resposta());
    const proximo = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[aria-label="Próximo mês"]')!;

    // começa no mês anterior: ainda dá para avançar uma vez, até o mês de hoje
    expect(proximo.disabled).toBeFalse();
    proximo.click();
    http.expectOne((r) => r.url === url).flush(resposta({ mesEncerrado: false }));
    fixture.detectChanges();

    expect(fixture.componentInstance.mes).toBe(mesDeHoje());
    expect(proximo.disabled).toBeTrue();
  });
});
