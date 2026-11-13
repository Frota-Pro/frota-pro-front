import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';

export interface AjudanteResponse {
  id: string;
  codigo: string;
  codigoExterno?: string | null;
  nome: string;
  status?: string | null;
  ativo: boolean;
}

export interface AjudanteRequest {
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class AjudanteApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  /** GET {{host}}/ajudantes — só os ativos. */
  listar(opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);
    return this.http.get<PageResponse<AjudanteResponse>>(`${this.apiUrl}/ajudantes`, { params });
  }

  /** POST {{host}}/ajudantes */
  criar(body: AjudanteRequest) {
    return this.http.post<AjudanteResponse>(`${this.apiUrl}/ajudantes`, body);
  }

  /** PUT {{host}}/ajudantes/{codigo} */
  atualizar(codigo: string, body: AjudanteRequest) {
    return this.http.put<AjudanteResponse>(`${this.apiUrl}/ajudantes/${encodeURIComponent(codigo)}`, body);
  }

  /** DELETE {{host}}/ajudantes/{codigo} — desativa (some da lista; o histórico fica). */
  desativar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/ajudantes/${encodeURIComponent(codigo)}`);
  }
}
