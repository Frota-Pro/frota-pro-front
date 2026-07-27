import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { DashboardMetasResponse, DashboardResumoResponse, SaudeSistemaResponse } from './dashboard-api.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getResumo() {
    return this.http.get<DashboardResumoResponse>(`${this.apiUrl}/dashboard/resumo`);
  }

  getMetas() {
    return this.http.get<DashboardMetasResponse>(`${this.apiUrl}/dashboard/metas`);
  }

  getSaudeSistema(inicio?: string | null, fim?: string | null) {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);

    return this.http.get<SaudeSistemaResponse>(`${this.apiUrl}/dashboard/saude-sistema`, { params });
  }
}
