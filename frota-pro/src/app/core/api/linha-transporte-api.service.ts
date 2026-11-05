import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { LinhaTransporteRequest, LinhaTransporteResponse } from './linha-transporte-api.models';

@Injectable({ providedIn: 'root' })
export class LinhaTransporteApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar() {
    return this.http.get<LinhaTransporteResponse[]>(`${this.apiUrl}/linhas-transporte`);
  }

  criar(payload: LinhaTransporteRequest) {
    return this.http.post<LinhaTransporteResponse>(`${this.apiUrl}/linhas-transporte`, payload);
  }
}
