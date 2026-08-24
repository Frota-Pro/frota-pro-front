import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { LogAuditoriaResponse } from './auditoria-api.models';

@Injectable({ providedIn: 'root' })
export class AuditoriaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listar(opts: {
    dataInicio: string; // yyyy-MM-dd
    dataFim: string;    // yyyy-MM-dd
    usuarioLogin?: string | null;
    page?: number;
    size?: number;
  }) {
    let params = new HttpParams()
      .set('dataInicio', opts.dataInicio)
      .set('dataFim', opts.dataFim)
      .set('sort', 'dataHora,desc');

    if (opts.usuarioLogin) params = params.set('usuarioLogin', opts.usuarioLogin);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));

    return this.http.get<PageResponse<LogAuditoriaResponse>>(`${this.apiUrl}/auditoria`, { params });
  }
}
