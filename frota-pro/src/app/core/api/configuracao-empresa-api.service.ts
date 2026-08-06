import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { ConfiguracaoEmpresaResponse, ConfiguracaoEmpresaUpdateRequest } from './configuracao-empresa-api.models';

@Injectable({ providedIn: 'root' })
export class ConfiguracaoEmpresaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  buscar() {
    return this.http.get<ConfiguracaoEmpresaResponse>(`${this.apiUrl}/configuracao-empresa`);
  }

  atualizar(payload: ConfiguracaoEmpresaUpdateRequest) {
    return this.http.put<ConfiguracaoEmpresaResponse>(`${this.apiUrl}/configuracao-empresa`, payload);
  }

  atualizarLogo(arquivo: File) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    return this.http.post<ConfiguracaoEmpresaResponse>(`${this.apiUrl}/configuracao-empresa/logo`, formData);
  }
}
