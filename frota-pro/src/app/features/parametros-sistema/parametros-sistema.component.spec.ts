import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ParametrosSistemaComponent } from './parametros-sistema.component';

const PARAMETROS = {
  diasUteisFechamentoMeta: 0,
  diasAntecedenciaVencimentoDocumento: 5,
  kmAntecedenciaManutencaoPreventiva: 500,
  diasManutencaoEstagnada: 7,
  diasAntecedenciaPrazoMulta: 5,
  validarMotivoAlteracaoPesoValorCarga: false,
  codigosDevolucaoPermitidos: null,
  permitirAtualizacaoPorTransferencia: true,
  validarTempoMinimoCarga: false,
  tempoMinimoEntregaPadraoMinutos: 30,
  diasRetencaoAuditoria: 180,
  percentualLimiteAnomaliaAbastecimento: 25,
  bloquearSenhaPadrao: false,
  vincularDispositivo: false,
};

describe('ParametrosSistemaComponent - abas, busca e alteracoes', () => {
  let fixture: ComponentFixture<ParametrosSistemaComponent>;
  let comp: ParametrosSistemaComponent;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/parametros-sistema`;

  function titulosVisiveis(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.card .card-header h2')).map((h: any) => h.textContent.trim());
  }

  function iniciar(): void {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.method === 'GET' && r.url.includes('parametro'));
    req.flush(PARAMETROS);
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.removeItem('parametros-sistema:aba');
    TestBed.configureTestingModule({
      imports: [ParametrosSistemaComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    fixture = TestBed.createComponent(ParametrosSistemaComponent);
    comp = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('abre na aba Metas mostrando so os cartoes dela', () => {
    iniciar();

    expect(titulosVisiveis()).toEqual(['Fechamento da meta mensal']);
  });

  it('trocar de aba mostra so os cartoes da aba e lembra a escolha', () => {
    iniciar();

    comp.irParaAba('avisos');
    fixture.detectChanges();

    expect(titulosVisiveis()).toEqual(['Vencimentos e manutenção', 'Multas', 'Detecção de preço fora do padrão']);
    expect(localStorage.getItem('parametros-sistema:aba')).toBe('avisos');
  });

  it('a busca encontra parametro de qualquer aba, sem acento e por palavra solta', () => {
    iniciar();

    comp.busca = 'celular';
    fixture.detectChanges();
    expect(titulosVisiveis()).toEqual(['Senha padrão e celular do motorista']);

    comp.busca = 'AUDITORIA';
    fixture.detectChanges();
    expect(titulosVisiveis()).toEqual(['Retenção da trilha de auditoria']);

    comp.busca = 'transferencia pedido';
    fixture.detectChanges();
    expect(titulosVisiveis()).toEqual(['Transferência']);

    comp.busca = 'multa antecedencia';
    fixture.detectChanges();
    expect(titulosVisiveis()).toEqual(['Multas']);
  });

  it('busca sem resultado avisa e contagem por aba aparece nas abas', () => {
    iniciar();

    comp.busca = 'xyzinexistente';
    fixture.detectChanges();
    expect(titulosVisiveis()).toEqual([]);
    expect(fixture.nativeElement.querySelector('.vazio')?.textContent).toContain('Nenhum parâmetro encontrado');

    comp.busca = 'peso';
    fixture.detectChanges();
    expect(comp.contagem('winthor')).toBe(2);
    expect(comp.contagem('metas')).toBe(0);
    expect(comp.totalResultados()).toBe(2);
  });

  it('limpar a busca volta para a aba que estava aberta', () => {
    iniciar();
    comp.irParaAba('auditoria');

    comp.busca = 'meta';
    fixture.detectChanges();
    comp.busca = '';
    fixture.detectChanges();

    expect(titulosVisiveis()).toEqual(['Retenção da trilha de auditoria']);
  });

  it('so deixa salvar quando algo mudou e descartar volta ao que estava salvo', () => {
    iniciar();
    const salvar = () => fixture.nativeElement.querySelector('.actions-bar .btn.primary') as HTMLButtonElement;

    expect(comp.alterado).toBeFalse();
    expect(salvar().disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.actions-bar .status').textContent).toContain('Tudo salvo');

    comp.form.diasUteisFechamentoMeta = 3;
    fixture.detectChanges();
    expect(comp.alterado).toBeTrue();
    expect(salvar().disabled).toBeFalse();
    expect(fixture.nativeElement.querySelector('.actions-bar .status').textContent).toContain('alterações não salvas');

    comp.descartar();
    fixture.detectChanges();
    expect(comp.form.diasUteisFechamentoMeta).toBe(0);
    expect(comp.alterado).toBeFalse();
  });

  it('depois de salvar volta a ficar sem pendencia', () => {
    iniciar();
    comp.form.diasUteisFechamentoMeta = 4;

    comp.salvar();
    const put = http.expectOne((r) => r.method === 'PUT' && r.url.includes('parametro'));
    expect(put.request.body.diasUteisFechamentoMeta).toBe(4);
    put.flush({ ...PARAMETROS, diasUteisFechamentoMeta: 4 });
    fixture.detectChanges();

    expect(comp.alterado).toBeFalse();
  });

  it('lembra a ultima aba aberta ao entrar de novo', () => {
    localStorage.setItem('parametros-sistema:aba', 'seguranca');

    iniciar();

    expect(titulosVisiveis()).toEqual(['Senha padrão e celular do motorista']);
  });
});
