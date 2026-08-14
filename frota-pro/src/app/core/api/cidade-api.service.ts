import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { CidadeResumoResponse, RoteirizacaoCidadeRequest, RoteirizacaoCidadeResponse } from './cidade-api.models';
import { ClienteHistoricoRotaResponse } from './rota-api.models';

@Injectable({ providedIn: 'root' })
export class CidadeApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar(opts: { page?: number; size?: number } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));

    return this.http.get<PageResponse<CidadeResumoResponse>>(`${this.apiUrl}/cidades`, { params });
  }

  clientes(cidade: string) {
    return this.http.get<ClienteHistoricoRotaResponse[]>(
      `${this.apiUrl}/cidades/${encodeURIComponent(cidade)}/clientes`
    );
  }

  roteirizacao(cidade: string) {
    return this.http.get<RoteirizacaoCidadeResponse>(
      `${this.apiUrl}/cidades/${encodeURIComponent(cidade)}/roteirizacao`
    );
  }

  salvarRoteirizacao(cidade: string, payload: RoteirizacaoCidadeRequest) {
    return this.http.put<RoteirizacaoCidadeResponse>(
      `${this.apiUrl}/cidades/${encodeURIComponent(cidade)}/roteirizacao`,
      payload
    );
  }
}
