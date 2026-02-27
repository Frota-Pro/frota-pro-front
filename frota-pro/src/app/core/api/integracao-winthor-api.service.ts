import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IntegracaoWinthorLogsResponse, IntegracaoLogSource } from './integracao-winthor-api.models';


import { BaseApiService } from './base-api.service';
import {
  IntegracaoJobTipo,
  IntegracaoWinthorConfigResponse,
  IntegracaoWinthorConfigUpdateRequest,
  IntegracaoWinthorJobResponse,
  IntegracaoWinthorStatusResponse,
  StatusSincronizacao,
} from './integracao-winthor-api.models';

@Injectable({ providedIn: 'root' })
export class IntegracaoWinthorApiService extends BaseApiService {
  private readonly base = '/api/integracao/winthor';
  private readonly baseIntegracao = '/api/integracao';

  constructor(protected override http: HttpClient) {
    super(http);
  }

  getConfig() {
    return this.http.get<IntegracaoWinthorConfigResponse>(`${this.apiUrl}${this.base}/config`);
  }

  updateConfig(body: IntegracaoWinthorConfigUpdateRequest) {
    return this.http.put<IntegracaoWinthorConfigResponse>(`${this.apiUrl}${this.base}/config`, body);
  }

  getStatus() {
    return this.http.get<IntegracaoWinthorStatusResponse>(`${this.apiUrl}${this.base}/status`);
  }

  listJobs(opts: { tipo?: IntegracaoJobTipo; status: StatusSincronizacao[]; page?: number; size?: number }) {
    let params = new HttpParams();
    params = params.set('tipo', (opts.tipo || 'TODOS').toString());
    (opts.status || []).forEach((s) => {
      params = params.append('status', s);
    });
    params = params.set('page', String(opts.page ?? 0));
    params = params.set('size', String(opts.size ?? 50));

    return this.http.get<IntegracaoWinthorJobResponse[]>(`${this.apiUrl}${this.base}/jobs`, { params });
  }

  retryJob(tipo: 'CARGAS' | 'CAMINHOES' | 'MOTORISTAS', jobId: string) {
    return this.http.post<any>(`${this.apiUrl}${this.base}/jobs/${tipo}/${jobId}/retry`, {});
  }

  syncMotoristas(empresaId: string, codigosMotoristas?: number[]) {
    let params = new HttpParams().set('empresaId', empresaId);
    if ((codigosMotoristas || []).length > 0) {
      params = params.set('codigosMotoristas', (codigosMotoristas || []).join(','));
    }
    return this.http.post<any>(`${this.apiUrl}${this.baseIntegracao}/motoristas/sincronizar`, null, { params });
  }

  syncCaminhoes(empresaId: string, codFilial?: number | null, codigosCaminhoes?: number[]) {
    let params = new HttpParams().set('empresaId', empresaId);
    if (codFilial != null) params = params.set('codFilial', String(codFilial));
    if ((codigosCaminhoes || []).length > 0) {
      params = params.set('codigosCaminhoes', (codigosCaminhoes || []).join(','));
    }
    return this.http.post<any>(`${this.apiUrl}${this.baseIntegracao}/caminhoes/sincronizar`, null, { params });
  }

  syncCargas(
    empresaId: string,
    dataInicial: string,
    dataFinal: string,
    codigosCaminhoes?: number[],
    codigosMotoristas?: number[],
    tipoCarga?: string,
    origem?: string,
    solicitadoPor?: string
  ) {
    let params = new HttpParams()
      .set('empresaId', empresaId)
      .set('dataInicial', dataInicial)
      .set('dataFinal', dataFinal);

    if ((codigosCaminhoes || []).length > 0) {
      params = params.set('codigosCaminhoes', (codigosCaminhoes || []).join(','));
    }
    if ((codigosMotoristas || []).length > 0) {
      params = params.set('codigosMotoristas', (codigosMotoristas || []).join(','));
    }
    if (tipoCarga) params = params.set('tipoCarga', tipoCarga);
    if (origem) params = params.set('origem', origem);
    if (solicitadoPor) params = params.set('solicitadoPor', solicitadoPor);

    return this.http.post<any>(`${this.apiUrl}${this.baseIntegracao}/cargas/sincronizar`, null, { params });
  }

  getLogs(source: IntegracaoLogSource, lines: number) {
    let params = new HttpParams()
      .set('source', source)
      .set('lines', String(lines));
    return this.http.get<IntegracaoWinthorLogsResponse>(`${this.apiUrl}${this.base}/logs`, { params });
  }

}
