import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

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
    params = params.set('status', (opts.status || []).join(','));
    params = params.set('page', String(opts.page ?? 0));
    params = params.set('size', String(opts.size ?? 50));

    return this.http.get<IntegracaoWinthorJobResponse[]>(`${this.apiUrl}${this.base}/jobs`, { params });
  }

  retryJob(tipo: 'CARGAS' | 'CAMINHOES' | 'MOTORISTAS', jobId: string) {
    return this.http.post<any>(`${this.apiUrl}${this.base}/jobs/${tipo}/${jobId}/retry`, {});
  }

  syncMotoristas() {
    return this.http.post<any>(`${this.apiUrl}${this.base}/sync/motoristas`, {});
  }

  syncCaminhoes(codFilial?: number | null) {
    let params = new HttpParams();
    if (codFilial != null) params = params.set('codFilial', String(codFilial));
    return this.http.post<any>(`${this.apiUrl}${this.base}/sync/caminhoes`, {}, { params });
  }

  syncCargas(data?: string | null) {
    let params = new HttpParams();
    if (data) params = params.set('data', data);
    return this.http.post<any>(`${this.apiUrl}${this.base}/sync/cargas`, {}, { params });
  }
}
