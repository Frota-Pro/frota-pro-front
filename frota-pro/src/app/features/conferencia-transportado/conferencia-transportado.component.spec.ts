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

  function texto(): string {
    return fixture.nativeElement.textContent as string;
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

  // ------------------------------------------------------------------ resumo

  it('abre mostrando so os tres numeros que importam e os pontos de atencao, sem detalhes na tela', () => {
    iniciar();

    expect(texto()).toContain('Transportado no WinThor');
    expect(texto()).toContain('Transportado no FrotaPRO');
    expect(texto()).toContain('Diferença');
    expect(texto()).toContain('O que precisa de atenção');
    expect(fixture.nativeElement.querySelector('.janela')).toBeNull();
    // as pontes e as listas ficam dentro das janelas, nao na pagina
    expect(fixture.nativeElement.querySelector('.fundo')).toBeNull();
  });

  it('uma linha diz que as contas fecham e quantos pontos pedem atencao', () => {
    iniciar();

    expect(fixture.nativeElement.querySelector('.status.aviso')?.textContent).toContain('fecham ao centavo');
    expect(fixture.nativeElement.querySelector('.status.aviso')?.textContent).toContain('1 ponto pede atenção');
  });

  it('tudo conferido quando nao ha nada pedindo atencao', () => {
    iniciar({ ...RESPOSTA, cargasComDiferenca: [], totais: { ...RESPOSTA.totais, diferenca: 0 } });

    expect(fixture.nativeElement.querySelector('.status.ok')?.textContent).toContain('Tudo conferido');
    expect(texto()).toContain('Nada para conferir neste mês');
  });

  it('avisa quando as contas nao fecham', () => {
    iniciar({ ...RESPOSTA, fechou: false });

    expect(fixture.nativeElement.querySelector('.status.falha')).toBeTruthy();
  });

  it('cartoes so aparecem com o que tem algo, os que pedem acao primeiro, e o resto vira uma linha de sem pendencia', () => {
    iniciar({
      ...RESPOSTA,
      resumoMovimentos: { transferencias: 2, notas: 2, valor: 300 },
      movimentosEntreCargas: [{ deCarga: 1, paraCarga: 2, motivo: 'X', notas: 2, valor: 300, primeira: null, ultima: null, numerosNotas: [] }],
      lancamentoManual: [{ numCar: 9, codMotorista: '7', valor: 10, notas: 1, cargaNoFrotaPro: true, explicacao: 'x' }],
    });

    const titulos = comp.cartoes.map((c) => c.id);
    expect(titulos).toEqual(['diferencas', 'manual', 'transferencias']);
    expect(comp.qtdAtencao).toBe(2);
    expect(texto()).toContain('Sem pendência em:');
    expect(comp.semPendencia).toContain('Cargas pequenas');
    expect(comp.semPendencia).not.toContain('Lançamento manual de km');
  });

  it('atualizar pede ao servidor para consultar o WinThor de novo', () => {
    iniciar();

    comp.carregar(true);
    const req = http.expectOne((r) => r.url.includes('/conferencia/transportado'));
    expect(req.request.params.get('atualizar')).toBe('true');
    expect(req.request.params.get('mes')).toBe(comp.mes);
    req.flush(RESPOSTA);
  });

  // ------------------------------------------------------------------ janelas de detalhe

  it('clicar num numero abre a janela com as duas pontes', () => {
    iniciar();

    (fixture.nativeElement.querySelector('.numero') as HTMLButtonElement).click();
    fixture.detectChanges();

    const janela = fixture.nativeElement.querySelector('.janela');
    expect(janela).toBeTruthy();
    expect(janela.textContent).toContain('Como chegamos nesses números');
    expect(janela.textContent).toContain('Venda sem carregamento');
    expect(janela.textContent).toContain('Notas movidas');
  });

  it('clicar num cartao abre as cargas com diferenca; clicar numa carga mostra as notas dela', () => {
    iniciar();

    (fixture.nativeElement.querySelector('.cartao') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(comp.painel).toBe('diferencas');
    expect(fixture.nativeElement.querySelector('.janela')?.textContent).toContain('Cargas com diferença');

    comp.alternar(500);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detalhe')?.textContent).toContain('Movida para outra carga');
  });

  it('filtra as cargas por categoria dentro da janela', () => {
    iniciar();
    comp.abrir('diferencas');
    expect(comp.cargasFiltradas.length).toBe(2);

    comp.filtroCategoria = 'CARGA_SUMIDA_DO_WINTHOR';
    expect(comp.cargasFiltradas.map((c) => c.numCar)).toEqual([700]);

    comp.abrir('diferencas');
    expect(comp.filtroCategoria).toBe('');
  });

  it('fecha a janela com o X, com Esc e clicando fora', () => {
    iniciar();

    comp.abrir('pontes');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.fechar') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.janela')).toBeNull();

    comp.abrir('pontes');
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.janela')).toBeNull();

    comp.abrir('pontes');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.fundo') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.janela')).toBeNull();
  });

  it('a janela tem papel de dialogo para leitor de tela', () => {
    iniciar();
    comp.abrir('pontes');
    fixture.detectChanges();

    const janela = fixture.nativeElement.querySelector('.janela') as HTMLElement;
    expect(janela.getAttribute('role')).toBe('dialog');
    expect(janela.getAttribute('aria-modal')).toBe('true');
    expect(janela.getAttribute('aria-labelledby')).toBe('janela-titulo');
  });

  it('mostra as transferencias entre cargas: sai de uma, entra na outra, com o historico da nota', () => {
    iniciar({
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
    });

    comp.abrir('transferencias');
    fixture.detectChanges();
    expect(texto()).toContain('Sai de (diminui)');
    expect(texto()).toContain('Entra em (aumenta)');

    comp.abrir('diferencas');
    comp.alternar(500);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.detalhe')?.textContent).toContain('500 → 600 em 10/10 14:00');
  });

  it('cargas pequenas mostram a origem e o que conferir', () => {
    iniciar({
      ...RESPOSTA,
      limitePequenaKg: 500,
      cargasPequenas: [{
        numCar: 417575, dataFaturamento: '2026-09-15', valor: 188.68, pesoKg: 26.392, status: 'SINCRONIZADA',
        motorista: 'FRANCISCO GOMES', placa: 'TOT9B66', motoristaExterno: false, origem: 'REENTREGA', origemDe: '417085',
        notas: 1, explicacao: 'Carga de reentrega: o pedido voltou da carga 417085',
      }],
    });

    expect(comp.cartoes.find((c) => c.id === 'pequenas')?.quantidade).toBe(1);
    comp.abrir('pequenas');
    fixture.detectChanges();
    const janela = fixture.nativeElement.querySelector('.janela').textContent as string;
    expect(janela).toContain('417575');
    expect(janela).toContain('Reentrega');
    expect(janela).toContain('417085');
  });

  it('lancamento manual, manifestos e devolucoes abrem suas janelas', () => {
    iniciar({
      ...RESPOSTA,
      lancamentoManual: [{ numCar: 421900, codMotorista: '777', valor: 800, notas: 1, cargaNoFrotaPro: true, explicacao: 'x' }],
      manifestosSemNota: [{
        numMdfe: 9, codMotorista: 1, codVeiculo: '10', situacao: '100', data: '2026-10-03', pesoKg: 12000,
        caminhaoDaFrota: true, motoristaDaFrota: true, explicacao: 'viagem sem valor',
      }],
      resumoDevolucoes: { notas: 2, valor: 120.5, pesoKg: 7.5 },
      devolucoes: [{ numNota: 1, numCar: 100, valorNota: 944.55, valorDevolvido: 100.5, pesoDevolvidoKg: 5 }],
    });

    comp.abrir('manual');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.janela').textContent).toContain('421900');

    comp.abrir('manifestos');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.janela').textContent).toContain('viagem sem valor');

    comp.abrir('devolucoes');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.janela').textContent).toContain('não diminui');
  });

  // ------------------------------------------------------------------ tirar dos totais

  it('oferece tirar dos totais so quando ha carga que pode ser zerada e pede confirmacao', () => {
    const base = RESPOSTA.cargasComDiferenca[1];
    iniciar({ ...RESPOSTA, cargasComDiferenca: [{ ...base, podeSerZerada: true }] });
    expect(comp.zeraveis.length).toBe(1);
    expect(comp.cartoes.find((c) => c.id === 'zerar')?.quantidade).toBe(1);

    comp.abrir('zerar');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.janela').textContent).toContain('contado duas vezes');

    spyOn(window, 'confirm').and.returnValue(false);
    comp.zerarTransferidas();
    http.expectNone((r) => r.url.includes('/zerar-transferidas'));

    (window.confirm as jasmine.Spy).and.returnValue(true);
    comp.zerarTransferidas();
    const req = http.expectOne((r) => r.url.includes('/conferencia/transportado/zerar-transferidas'));
    expect(req.request.method).toBe('POST');
    req.flush([{ numCar: 700, valorAntes: 250, transferidaPara: '800' }]);
    http.expectOne((r) => r.method === 'GET' && r.url.includes('/conferencia/transportado')).flush(RESPOSTA);
    fixture.detectChanges();

    expect(comp.mensagemZerar).toContain('1 carga');
    expect(comp.painel).toBeNull();
    expect(texto()).toContain('1 carga(s) tirada(s) dos totais');
  });

  // ------------------------------------------------------------------ rotulos, erros

  it('caminhao de terceiro tem rotulo proprio', () => {
    expect(comp.motivo('CAMINHAO_FORA_DA_FROTA')).toContain('terceiro');
    expect(comp.categoria('CARGA_DE_TERCEIRO')).toContain('terceiro');
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
