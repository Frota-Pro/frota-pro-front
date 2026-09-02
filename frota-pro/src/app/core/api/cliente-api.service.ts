import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { ClienteResponse } from './cliente-api.models';

@Injectable({ providedIn: 'root' })
export class ClienteApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  /** GET {{host}}/cliente?q=&page=&size=&sort= */
  listar(opts: { q?: string | null; page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.q) params = params.set('q', opts.q);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<ClienteResponse>>(`${this.apiUrl}/cliente`, { params });
  }

  buscarPorId(id: string) {
    return this.http.get<ClienteResponse>(`${this.apiUrl}/cliente/${encodeURIComponent(id)}`);
  }
}
