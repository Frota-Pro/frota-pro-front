import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import {
  MovimentacaoSemCargaResponse,
  MovimentacaoSemCargaResumoResponse,
} from './movimentacao-sem-carga-api.models';

@Injectable({ providedIn: 'root' })
export class MovimentacaoSemCargaApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar(opts: {
    codigoCaminhao?: string | null;
    inicio?: string | null;
    fim?: string | null;
    page?: number;
    size?: number;
    sort?: string;
  } = {}) {
    let params = new HttpParams();
    if (opts.codigoCaminhao) params = params.set('codigoCaminhao', opts.codigoCaminhao);
    if (opts.inicio) params = params.set('inicio', opts.inicio);
    if (opts.fim) params = params.set('fim', opts.fim);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<MovimentacaoSemCargaResponse>>(
      `${this.apiUrl}/movimentacoes-sem-carga`,
      { params }
    );
  }

  resumo(codigoCaminhao: string, inicio: string, fim: string) {
    const params = new HttpParams()
      .set('codigoCaminhao', codigoCaminhao)
      .set('inicio', inicio)
      .set('fim', fim);

    return this.http.get<MovimentacaoSemCargaResumoResponse>(
      `${this.apiUrl}/movimentacoes-sem-carga/resumo`,
      { params }
    );
  }
}
