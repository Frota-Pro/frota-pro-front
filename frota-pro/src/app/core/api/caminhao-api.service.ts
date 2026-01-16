import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import {
  CaminhaoDetalheResponse,
  CaminhaoRequest,
  CaminhaoResponse,
  VincularCategoriaCaminhaoEmLoteRequest,
} from './caminhao-api.models';

@Injectable({ providedIn: 'root' })
export class CaminhaoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar(opts: { page?: number; size?: number; sort?: string; ativo?: boolean | null; q?: string | null } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    if (opts.ativo !== undefined && opts.ativo !== null) params = params.set('ativo', String(opts.ativo));
    if (opts.q) params = params.set('q', opts.q);

    return this.http.get<PageResponse<CaminhaoResponse>>(`${this.apiUrl}/caminhao`, { params });
  }

  ativar(codigo: string) {
    return this.http.patch<void>(`${this.apiUrl}/caminhao/${encodeURIComponent(codigo)}/ativar`, {});
  }



  buscarPorCodigo(codigo: string) {
    return this.http.get<CaminhaoResponse>(`${this.apiUrl}/caminhao/${encodeURIComponent(codigo)}`);
  }

  detalhes(codigo: string) {
    return this.http.get<CaminhaoDetalheResponse>(`${this.apiUrl}/caminhao/${encodeURIComponent(codigo)}/detalhes`);
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

  vincularCategoriaEmLote(payload: VincularCategoriaCaminhaoEmLoteRequest) {
    return this.http.put<void>(`${this.apiUrl}/caminhao/categoria`, payload);
  }
}
