import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { CargaApiService } from './carga-api.service';

describe('CargaApiService - transferencias', () => {
  let api: CargaApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CargaApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('transferirCaminhao manda PATCH com o codigo do caminhao', () => {
    let recebida: any;
    api.transferirCaminhao('CAR-000987', { codigoCaminhao: 'CAM-000018' }).subscribe((c) => (recebida = c));

    const req = http.expectOne(`${environment.apiUrl}/carga/CAR-000987/transferir-caminhao`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ codigoCaminhao: 'CAM-000018' });
    req.flush({ numeroCarga: 'CAR-000987', codigoCaminhao: 'CAM-000018', caminhaoDefinidoManualmente: true });

    expect(recebida.caminhaoDefinidoManualmente).toBeTrue();
  });

  it('transferirCaminhao codifica o numero da carga na URL', () => {
    api.transferirCaminhao('CAR 1/2', { codigoCaminhao: 'CAM-1' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/carga/CAR%201%2F2/transferir-caminhao`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('transferirMotorista continua indo para o endpoint do motorista', () => {
    api.transferirMotorista('CAR-000987', { codigoMotorista: 'MOT-000029' }).subscribe();

    const req = http.expectOne(`${environment.apiUrl}/carga/CAR-000987/transferir-motorista`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ codigoMotorista: 'MOT-000029' });
    req.flush({});
  });
});
