import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { MotoristaRequest, MotoristaResponse, RelatorioMetaMensalMotoristaResponse } from './motorista-api.models';

@Injectable({ providedIn: 'root' })
export class MotoristaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listar(opts: { page?: number; size?: number; sort?: string; ativo?: boolean | null; q?: string | null } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    if (opts.ativo !== undefined && opts.ativo !== null) params = params.set('ativo', String(opts.ativo));
    if (opts.q) params = params.set('q', opts.q);

    return this.http.get<PageResponse<MotoristaResponse>>(`${this.apiUrl}/motorista`, { params });
  }

  buscarPorCodigo(codigo: string) {
    return this.http.get<MotoristaResponse>(`${this.apiUrl}/motorista/${encodeURIComponent(codigo)}`);
  }

  criar(payload: MotoristaRequest) {
    return this.http.post<MotoristaResponse>(`${this.apiUrl}/motorista`, payload);
  }

  atualizar(codigo: string, payload: MotoristaRequest) {
    return this.http.put<MotoristaResponse>(`${this.apiUrl}/motorista/${encodeURIComponent(codigo)}`, payload);
  }

  deletar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/motorista/${encodeURIComponent(codigo)}`);
  }

  metaMensal(codigoMotorista: string, inicioYYYYMMDD: string, fimYYYYMMDD: string) {
    const params = new HttpParams()
      .set('inicio', inicioYYYYMMDD)
      .set('fim', fimYYYYMMDD);

    return this.http.get<RelatorioMetaMensalMotoristaResponse>(
      `${this.apiUrl}/motorista/${encodeURIComponent(codigoMotorista)}/meta-mensal`,
      { params }
    );
  }
}
