import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { CargaResponse } from './carga-api.models';

@Injectable({ providedIn: 'root' })
export class CargaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listarPorCaminhao(codigo: string, opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams().set('codigo', codigo);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<CargaResponse>>(`${this.apiUrl}/carga/caminhao`, { params });
  }
}
