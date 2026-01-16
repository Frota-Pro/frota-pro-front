import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { CaminhaoRequest, CaminhaoResponse } from './caminhao-api.models';

@Injectable({ providedIn: 'root' })
export class CaminhaoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar(opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<CaminhaoResponse>>(`${this.apiUrl}/caminhao`, { params });
  }

  buscarPorCodigo(codigo: string) {
    return this.http.get<CaminhaoResponse>(`${this.apiUrl}/caminhao/${encodeURIComponent(codigo)}`);
  }

  criar(payload: CaminhaoRequest) {
    return this.http.post<CaminhaoResponse>(`${this.apiUrl}/caminhao`, payload);
  }

  atualizar(codigo: string, payload: CaminhaoRequest) {
    return this.http.put<CaminhaoResponse>(`${this.apiUrl}/caminhao/${encodeURIComponent(codigo)}`, payload);
  }

  deletar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/caminhao/${encodeURIComponent(codigo)}`);
  }
}
