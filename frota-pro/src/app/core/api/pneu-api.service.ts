import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import {
  PneuRequest,
  PneuResponse,
  PneuVidaUtilResponse,
  PneuMovimentacaoRequest,
  PneuMovimentacaoResponse,
} from './pneu-api.models';

@Injectable({ providedIn: 'root' })
export class PneuApiService extends BaseApiService {

  constructor(http: HttpClient) { super(http); }

  listar(opts: { q?: string; status?: string; page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.q) params = params.set('q', opts.q);
    if (opts.status) params = params.set('status', opts.status);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<PneuResponse>>(`${this.apiUrl}/pneus`, { params });
  }

  buscar(codigo: string) {
    return this.http.get<PneuResponse>(`${this.apiUrl}/pneus/${encodeURIComponent(codigo)}`);
  }

  criar(payload: PneuRequest) {
    return this.http.post<PneuResponse>(`${this.apiUrl}/pneus`, payload);
  }

  atualizar(codigo: string, payload: PneuRequest) {
    return this.http.put<PneuResponse>(`${this.apiUrl}/pneus/${encodeURIComponent(codigo)}`, payload);
  }

  deletar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/pneus/${encodeURIComponent(codigo)}`);
  }

  vidaUtil(codigo: string) {
    return this.http.get<PneuVidaUtilResponse>(`${this.apiUrl}/pneus/${encodeURIComponent(codigo)}/vida-util`);
  }

  movimentacao(codigo: string, payload: PneuMovimentacaoRequest) {
    return this.http.post<void>(`${this.apiUrl}/pneus/${encodeURIComponent(codigo)}/movimentacoes`, payload);
  }

  // Se você tiver endpoint de listagem de movimentações no back:
  // GET /pneus/{codigo}/movimentacoes?page=0&size=20
  listarMovimentacoes(codigo: string, page = 0, size = 20) {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponse<PneuMovimentacaoResponse>>(`${this.apiUrl}/pneus/${encodeURIComponent(codigo)}/movimentacoes`, { params });
  }
}
