import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { DashboardResumoResponse } from './dashboard-api.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getResumo() {
    return this.http.get<DashboardResumoResponse>(`${this.apiUrl}/dashboard/resumo`);
  }
}
