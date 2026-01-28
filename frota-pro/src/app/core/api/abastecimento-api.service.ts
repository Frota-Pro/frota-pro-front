import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { AbastecimentoRequest, AbastecimentoResponse } from './abastecimento-api.models';

@Injectable({ providedIn: 'root' })
export class AbastecimentoApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listar(opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<AbastecimentoResponse>>(`${this.apiUrl}/abastecimento`, { params });
  }

  filtrar(opts: {
    q?: string | null;
    caminhao?: string | null;
    motorista?: string | null;
    tipo?: string | null;
    forma?: string | null;
    inicio?: string | null; // ISO date-time
    fim?: string | null;    // ISO date-time
    page?: number;
    size?: number;
    sort?: string;
  } = {}) {
    let params = new HttpParams();
    if (opts.q) params = params.set('q', opts.q);
    if (opts.caminhao) params = params.set('caminhao', opts.caminhao);
    if (opts.motorista) params = params.set('motorista', opts.motorista);
    if (opts.tipo) params = params.set('tipo', opts.tipo);
    if (opts.forma) params = params.set('forma', opts.forma);
    if (opts.inicio) params = params.set('inicio', opts.inicio);
    if (opts.fim) params = params.set('fim', opts.fim);

    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<AbastecimentoResponse>>(`${this.apiUrl}/abastecimento/filtrar`, { params });
  }

  buscarPorCodigo(codigo: string) {
    return this.http.get<AbastecimentoResponse>(`${this.apiUrl}/abastecimento/${encodeURIComponent(codigo)}`);
  }

  criar(payload: AbastecimentoRequest) {
    return this.http.post<AbastecimentoResponse>(`${this.apiUrl}/abastecimento`, payload);
  }

  atualizar(codigo: string, payload: AbastecimentoRequest) {
    return this.http.put<AbastecimentoResponse>(`${this.apiUrl}/abastecimento/${encodeURIComponent(codigo)}`, payload);
  }

  deletar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/abastecimento/${encodeURIComponent(codigo)}`);
  }

  listarPorCaminhao(codigo: string, opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams().set('codigo', codigo);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<AbastecimentoResponse>>(`${this.apiUrl}/abastecimento/caminhao`, { params });
  }
}
