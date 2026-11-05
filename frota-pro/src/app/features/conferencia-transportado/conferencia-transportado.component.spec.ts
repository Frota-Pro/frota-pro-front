import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ConferenciaTransportadoComponent } from './conferencia-transportado.component';
import { ConferenciaTransportadoResponse } from '../../core/api/conferencia-transportado-api.models';

const RESPOSTA: ConferenciaTransportadoResponse = {
  mes: '2026-10',
  geradoEm: '2026-11-05T14:00:00-03:00',
  fechou: true,
  totais: {
    vendaFaturada: 1000, notasVendaFaturada: 10, transportadoWinThor: 900, cargasWinThor: 3,
    transportadoFrotaPro: 950, cargasFrotaPro: 3, diferenca: 50,
  },
  ponteVendaParaTransportado: [
    { codigo: 'NAO_TRANSPORTADA_SEM_CARREGAMENTO', titulo: 'Venda sem carregamento', explicacao: 'Balcão', quantidade: 2, valor: -100 },
  ],
  ponteWinThorParaFrotaPro: [
    { codigo: 'NOTAS_MOVIDAS_AINDA_NA_CARGA', titulo: 'Notas movidas', explicacao: 'Transferência', quantidade: 1, valor: 50 },
  ],
  cargasComDiferenca: [
    {
      numCar: 500, categoria: 'VALOR_DIFERENTE', explicacao: 'FrotaPRO maior', valorWinThor: 700, valorFrotaPro: 750,
      diferenca: 50, dataWinThor: '2026-10-10', dataFrotaPro: '2026-10-10', statusFrotaPro: 'FINALIZADA',
      notas: [{ numNota: 10, valor: 50, paraCarga: 600, motivo: 'MOVIDA_PARA_OUTRA_CARGA' }],
    },
    {
      numCar: 700, categoria: 'CARGA_SUMIDA_DO_WINTHOR', explicacao: 'Sumiu', valorWinThor: 0, valorFrotaPro: 0,
      diferenca: 0, dataWinThor: null, dataFrotaPro: '2026-10-12', statusFrotaPro: 'SINCRONIZADA', notas: [],
    },
  ],
  notasForaDoTransporte: [],
  notasForaTotal: 0,
};

describe('ConferenciaTransportadoComponent', () => {
  let fixture: ComponentFixture<ConferenciaTransportadoComponent>;
  let comp: ConferenciaTransportadoComponent;
  let http: HttpTestingController;

  function iniciar(resposta: ConferenciaTransportadoResponse = RESPOSTA): void {
    fixture.detectChanges();
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/conferencia/transportado')).flush(resposta);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConferenciaTransportadoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(ConferenciaTransportadoComponent);
    comp = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carrega o mes escolhido ao abrir e mostra os totais e as duas pontes', () => {
    iniciar();

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Transportado no WinThor');
    expect(texto).toContain('Transportado no FrotaPRO');
    expect(texto).toContain('Venda sem carregamento');
    expect(texto).toContain('Notas movidas');
    expect(texto).toContain('As duas pontes fecham ao centavo');
  });

  it('avisa quando as pontes nao fecham', () => {
    iniciar({ ...RESPOSTA, fechou: false });

    expect(fixture.nativeElement.querySelector('.status.falha')).toBeTruthy();
  });

  it('atualizar pede ao servidor para consultar o WinThor de novo', () => {
    iniciar();

    comp.carregar(true);
    const req = http.expectOne((r) => r.url.includes('/conferencia/transportado'));
    expect(req.request.params.get('atualizar')).toBe('true');
    expect(req.request.params.get('mes')).toBe(comp.mes);
    req.flush(RESPOSTA);
  });

  it('filtra as cargas por categoria e mostra as notas ao abrir uma carga', () => {
    iniciar();
    expect(comp.cargasFiltradas.length).toBe(2);

    comp.filtroCategoria = 'CARGA_SUMIDA_DO_WINTHOR';
    expect(comp.cargasFiltradas.map((c) => c.numCar)).toEqual([700]);

    comp.filtroCategoria = '';
    comp.alternar(500);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detalhe')?.textContent).toContain('Movida para outra carga');
  });

  it('mostra as transferencias entre cargas: sai de uma, entra na outra, com o historico da nota', () => {
    const comTransferencia: ConferenciaTransportadoResponse = {
      ...RESPOSTA,
      resumoMovimentos: { transferencias: 1, notas: 1, valor: 300 },
      movimentosEntreCargas: [{
        deCarga: 500, paraCarga: 600, motivo: 'TRANSF. DE PEDIDO ENTRE CARGAS', notas: 1, valor: 300,
        primeira: '2026-10-10T14:00:00', ultima: '2026-10-10T14:00:00', numerosNotas: [10],
      }],
      cargasComDiferenca: [{
        ...RESPOSTA.cargasComDiferenca[0],
        notas: [{
          numNota: 10, valor: 300, paraCarga: 600, motivo: 'MOVIDA_PARA_OUTRA_CARGA',
          historico: [{ deCarga: 500, paraCarga: 600, quando: '2026-10-10T14:00:00', motivo: 'TRANSF.' }],
        }],
      }],
    };
    iniciar(comTransferencia);

    const secao = fixture.nativeElement.textContent as string;
    expect(secao).toContain('Transferências entre cargas');
    expect(secao).toContain('Sai de (diminui)');
    expect(secao).toContain('Entra em (aumenta)');

    comp.alternar(500);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detalhe')?.textContent).toContain('500 → 600 em 10/10 14:00');
  });

  it('caminhao de terceiro tem rotulo proprio', () => {
    expect(comp.motivo('CAMINHAO_FORA_DA_FROTA')).toContain('terceiro');
    expect(comp.categoria('CARGA_DE_TERCEIRO')).toContain('terceiro');
  });

  it('mostra no topo as cargas que precisam de lancamento manual e as cargas pequenas com a origem', () => {
    iniciar({
      ...RESPOSTA,
      limitePequenaKg: 500,
      lancamentoManual: [{ numCar: 421900, codMotorista: '777', valor: 800, notas: 1, cargaNoFrotaPro: true, explicacao: 'x' }],
      cargasPequenas: [{
        numCar: 417575, dataFaturamento: '2026-09-15', valor: 188.68, pesoKg: 26.392, status: 'SINCRONIZADA',
        motorista: 'FRANCISCO GOMES', placa: 'TOT9B66', motoristaExterno: false, origem: 'REENTREGA', origemDe: '417085',
        notas: 1, explicacao: 'Carga de reentrega: o pedido voltou da carga 417085',
      }],
      manifestosSemNota: [{
        numMdfe: 9, codMotorista: 1, codVeiculo: '10', situacao: '100', data: '2026-10-03', pesoKg: 12000,
        caminhaoDaFrota: true, motoristaDaFrota: true, explicacao: 'viagem sem valor',
      }],
      resumoDevolucoes: { notas: 2, valor: 120.5, pesoKg: 7.5 },
      devolucoes: [{ numNota: 1, numCar: 100, valorNota: 944.55, valorDevolvido: 100.5, pesoDevolvidoKg: 5 }],
    });

    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Lançar km e abastecimento à mão');
    expect(texto).toContain('417575');
    expect(texto).toContain('Reentrega');
    expect(texto).toContain('Manifestos sem nota');
    expect(texto).toContain('não diminui');
  });

  it('oferece tirar dos totais so quando ha carga que pode ser zerada e pede confirmacao', () => {
    const base = RESPOSTA.cargasComDiferenca[1];
    iniciar({ ...RESPOSTA, cargasComDiferenca: [{ ...base, podeSerZerada: true }] });
    expect(comp.zeraveis.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('ficaram sem nota');

    spyOn(window, 'confirm').and.returnValue(false);
    comp.zerarTransferidas();
    http.expectNone((r) => r.url.includes('/zerar-transferidas'));

    (window.confirm as jasmine.Spy).and.returnValue(true);
    comp.zerarTransferidas();
    const req = http.expectOne((r) => r.url.includes('/conferencia/transportado/zerar-transferidas'));
    expect(req.request.method).toBe('POST');
    req.flush([{ numCar: 700, valorAntes: 250, transferidaPara: '800' }]);
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/conferencia/transportado')).flush(RESPOSTA);
    expect(comp.mensagemZerar).toContain('1 carga');
  });

  it('mes invalido nao chama a API', () => {
    iniciar();
    comp.mes = '';

    comp.carregar(false);

    http.expectNone((r) => r.url.includes('/conferencia/transportado'));
    expect(comp.erro).toBe('Escolha o mês.');
  });

  it('erro do servidor aparece na tela', () => {
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/conferencia/transportado'))
      .flush({ message: 'WinThor fora do ar' }, { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();

    expect(comp.dados).toBeNull();
    expect(fixture.nativeElement.querySelector('.alert')?.textContent).toContain('WinThor fora do ar');
  });
});
