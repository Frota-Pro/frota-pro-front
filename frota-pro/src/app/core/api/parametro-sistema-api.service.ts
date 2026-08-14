import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { ParametroSistemaResponse, ParametroSistemaUpdateRequest } from './parametro-sistema-api.models';

@Injectable({ providedIn: 'root' })
export class ParametroSistemaApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  buscar() {
    return this.http.get<ParametroSistemaResponse>(`${this.apiUrl}/parametro-sistema`);
  }

  atualizar(payload: ParametroSistemaUpdateRequest) {
    return this.http.put<ParametroSistemaResponse>(`${this.apiUrl}/parametro-sistema`, payload);
  }
}
