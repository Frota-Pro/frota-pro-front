import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { CategoriaCaminhaoResponse } from './categoria-caminhao-api.models';

@Injectable({ providedIn: 'root' })
export class CategoriaCaminhaoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar(opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<CategoriaCaminhaoResponse>>(`${this.apiUrl}/categorias-caminhao`, { params });
  }
  listarTodas() {
    return this.listar({ page: 0, size: 2000, sort: 'descricao,asc' });
  }
}
