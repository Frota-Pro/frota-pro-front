import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { OficinaRequest, OficinaResponse } from './oficina-api.models';
import { OficinaDashboardResponse } from './oficina-dashboard.models';

@Injectable({ providedIn: 'root' })
export class OficinaApiService extends BaseApiService {

  constructor(http: HttpClient) { super(http); }

  listar(opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);
    return this.http.get<PageResponse<OficinaResponse>>(`${this.apiUrl}/oficinas`, { params });
  }

  buscarPorCodigo(codigo: string) {
    return this.http.get<OficinaResponse>(`${this.apiUrl}/oficinas/codigo/${encodeURIComponent(codigo)}`);
  }

  criar(payload: OficinaRequest) {
    return this.http.post<OficinaResponse>(`${this.apiUrl}/oficinas`, payload);
  }

  atualizar(codigo: string, payload: OficinaRequest) {
    return this.http.put<OficinaResponse>(`${this.apiUrl}/oficinas/${encodeURIComponent(codigo)}`, payload);
  }

  deletar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/oficinas/${encodeURIComponent(codigo)}`);
  }

  dashboard(codigo: string, inicio: string, fim: string) {
    let params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<OficinaDashboardResponse>(`${this.apiUrl}/oficinas/${encodeURIComponent(codigo)}/dashboard`, { params });
  }
}
