import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { ManutencaoRequest, ManutencaoResponse } from './manutencao-api.models';

@Injectable({ providedIn: 'root' })
export class ManutencaoApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listar(opts: {
    page?: number;
    size?: number;
    sort?: string;

    // filtros (se seu back tiver; se não tiver, o front filtra local)
    q?: string | null;
    inicio?: string | null; // yyyy-MM-dd
    fim?: string | null;    // yyyy-MM-dd
    status?: string | null;
    tipo?: string | null;
    caminhao?: string | null; // codigo
  } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    if (opts.q) params = params.set('q', opts.q);
    if (opts.inicio) params = params.set('inicio', opts.inicio);
    if (opts.fim) params = params.set('fim', opts.fim);
    if (opts.status) params = params.set('status', opts.status);
    if (opts.tipo) params = params.set('tipo', opts.tipo);
    if (opts.caminhao) params = params.set('caminhao', opts.caminhao);

    return this.http.get<PageResponse<ManutencaoResponse>>(
      `${this.apiUrl}/manutencao`,
      { params }
    );
  }

  buscarPorCodigo(codigo: string) {
    return this.http.get<ManutencaoResponse>(
      `${this.apiUrl}/manutencao/${encodeURIComponent(codigo)}`
    );
  }

  criar(payload: ManutencaoRequest) {
    return this.http.post<ManutencaoResponse>(`${this.apiUrl}/manutencao`, payload);
  }

  atualizar(codigo: string, payload: ManutencaoRequest) {
    return this.http.put<ManutencaoResponse>(
      `${this.apiUrl}/manutencao/${encodeURIComponent(codigo)}`,
      payload
    );
  }

  deletar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/manutencao/${encodeURIComponent(codigo)}`);
  }

  listarPorCaminhao(codigoCaminhao: string, opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<ManutencaoResponse>>(
      `${this.apiUrl}/manutencao/caminhao/${encodeURIComponent(codigoCaminhao)}`,
      { params }
    );
  }

  listarPorPeriodo(inicio: string, fim: string, opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams()
      .set('inicio', inicio)
      .set('fim', fim);

    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<ManutencaoResponse>>(
      `${this.apiUrl}/manutencao/periodo`,
      { params }
    );
  }
}
