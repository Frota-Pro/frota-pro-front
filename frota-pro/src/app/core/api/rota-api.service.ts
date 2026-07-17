import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { ClienteHistoricoRotaResponse, RotaRequest, RotaResponse } from './rota-api.models';

@Injectable({ providedIn: 'root' })
export class RotaApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar(opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<RotaResponse>>(`${this.apiUrl}/rota`, { params });
  }

  buscarPorCodigo(codigo: string) {
    return this.http.get<RotaResponse>(`${this.apiUrl}/rota/${encodeURIComponent(codigo)}`);
  }

  criar(payload: RotaRequest) {
    return this.http.post<RotaResponse>(`${this.apiUrl}/rota`, payload);
  }

  atualizar(codigo: string, payload: RotaRequest) {
    return this.http.put<RotaResponse>(`${this.apiUrl}/rota/${encodeURIComponent(codigo)}`, payload);
  }

  deletar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/rota/${encodeURIComponent(codigo)}`);
  }

  clientesHistorico(codigo: string) {
    return this.http.get<ClienteHistoricoRotaResponse[]>(
      `${this.apiUrl}/rota/${encodeURIComponent(codigo)}/clientes`
    );
  }
}
