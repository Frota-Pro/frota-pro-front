import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { CargaDetalheComponent } from './carga-detalhe.component';

const CARGA = {
  id: 'c1',
  numeroCarga: 'CAR-000987',
  numeroCargaExibicao: '420605',
  codigoMotorista: 'MOT-000029',
  nomeMotorista: 'REGIO DE OLIVEIRA DANTAS',
  codigoCaminhao: 'CAM-000017',
  placaCaminhao: 'QSF0799',
  codigoRota: 'ROT-000033',
  statusCarga: 'FINALIZADA',
  clientes: [],
  notasComArquivo: [],
  ordemEntregaClientes: [],
  codigosAjudantes: [],
};

const CAMINHOES = {
  content: [
    { codigo: 'CAM-000017', placa: 'QSF0799', descricao: 'Truck 1' },
    { codigo: 'CAM-000018', placa: 'QSF0800', descricao: 'Truck 2' },
  ],
  totalElements: 2,
};

describe('CargaDetalheComponent - transferir caminhao', () => {
  let fixture: ComponentFixture<CargaDetalheComponent>;
  let comp: CargaDetalheComponent;
  let http: HttpTestingController;
  const api = environment.apiUrl;

  /** Responde o que o ngOnInit dispara (carga, paradas, resumo de desconto, postos). */
  function iniciar(carga: any = CARGA): void {
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${api}/carga/CAR-000987` && r.method === 'GET').flush(carga);
    http.match(() => true).forEach((r) => {
      if (r.request.url.includes('/parada')) {
        r.flush({ content: [], totalElements: 0 });
      } else {
        r.flush({ content: [], totalElements: 0 });
      }
    });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CargaDetalheComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'CAR-000987' } } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CargaDetalheComponent);
    comp = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  it('mostra o botao Transferir caminhao ao lado do Transferir motorista', () => {
    iniciar();

    const textos = Array.from(fixture.nativeElement.querySelectorAll('button')).map((b: any) => b.textContent.trim());
    expect(textos).toContain('Transferir motorista');
    expect(textos).toContain('Transferir caminhão');
  });

  it('abrir o modal carrega os caminhoes ativos uma unica vez', () => {
    iniciar();

    comp.abrirTransferirCaminhaoModal();
    const req = http.expectOne((r) => r.url === `${api}/caminhao`);
    expect(req.request.params.get('ativo')).toBe('true');
    req.flush(CAMINHOES);

    expect(comp.showTransferirCaminhaoModal).toBeTrue();
    expect(comp.caminhoesParaTransferencia.length).toBe(2);

    comp.fecharTransferirCaminhaoModal();
    comp.abrirTransferirCaminhaoModal();
    http.expectNone((r) => r.url === `${api}/caminhao`);
  });

  it('sem escolher caminhao nao chama a API', () => {
    iniciar();
    comp.abrirTransferirCaminhaoModal();
    http.expectOne((r) => r.url === `${api}/caminhao`).flush(CAMINHOES);

    comp.codigoCaminhaoTransferencia = '';
    comp.transferirCaminhao();

    http.expectNone(`${api}/carga/CAR-000987/transferir-caminhao`);
    expect(comp.showTransferirCaminhaoModal).toBeTrue();
  });

  it('transfere, fecha o modal e recarrega a carga', () => {
    iniciar();
    comp.abrirTransferirCaminhaoModal();
    http.expectOne((r) => r.url === `${api}/caminhao`).flush(CAMINHOES);

    comp.codigoCaminhaoTransferencia = 'CAM-000018';
    comp.transferirCaminhao();

    const patch = http.expectOne(`${api}/carga/CAR-000987/transferir-caminhao`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ codigoCaminhao: 'CAM-000018' });
    patch.flush({ ...CARGA, codigoCaminhao: 'CAM-000018', caminhaoDefinidoManualmente: true });

    expect(comp.showTransferirCaminhaoModal).toBeFalse();
    expect(comp.savingTransferirCaminhao).toBeFalse();

    const recarga = http.expectOne((r) => r.url === `${api}/carga/CAR-000987` && r.method === 'GET');
    recarga.flush({ ...CARGA, codigoCaminhao: 'CAM-000018', placaCaminhao: 'QSF0800', caminhaoDefinidoManualmente: true });
    http.match(() => true).forEach((r) => r.flush({ content: [], totalElements: 0 }));
    fixture.detectChanges();

    const tela = fixture.nativeElement.textContent as string;
    expect(tela).toContain('QSF0800');
    expect(tela).toContain('Transferido');
  });

  it('erro da API mantem o modal aberto e libera o botao', () => {
    iniciar();
    comp.abrirTransferirCaminhaoModal();
    http.expectOne((r) => r.url === `${api}/caminhao`).flush(CAMINHOES);

    comp.codigoCaminhaoTransferencia = 'CAM-000018';
    comp.transferirCaminhao();
    http.expectOne(`${api}/carga/CAR-000987/transferir-caminhao`)
      .flush({ message: 'Caminhão não encontrado' }, { status: 404, statusText: 'Not Found' });

    expect(comp.showTransferirCaminhaoModal).toBeTrue();
    expect(comp.savingTransferirCaminhao).toBeFalse();
  });

  it('sem a trava a tela nao mostra o selo Transferido no caminhao', () => {
    iniciar();

    expect((fixture.nativeElement.textContent as string)).not.toContain('Transferido');
  });
});
