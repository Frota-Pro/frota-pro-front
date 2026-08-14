import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { PlanoManutencaoPreventivaRequest, PlanoManutencaoPreventivaResponse } from './plano-manutencao-preventiva-api.models';

@Injectable({ providedIn: 'root' })
export class PlanoManutencaoPreventivaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listar(opts: {
    page?: number;
    size?: number;
    sort?: string;
    caminhao?: string | null;
    ativo?: boolean | null;
  } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.caminhao) params = params.set('caminhao', opts.caminhao);
    if (opts.ativo != null) params = params.set('ativo', String(opts.ativo));

    return this.http.get<PageResponse<PlanoManutencaoPreventivaResponse>>(
      `${this.apiUrl}/planos-manutencao-preventiva`,
      { params }
    );
  }

  buscarPorId(id: string) {
    return this.http.get<PlanoManutencaoPreventivaResponse>(
      `${this.apiUrl}/planos-manutencao-preventiva/${encodeURIComponent(id)}`
    );
  }

  criar(payload: PlanoManutencaoPreventivaRequest) {
    return this.http.post<PlanoManutencaoPreventivaResponse>(
      `${this.apiUrl}/planos-manutencao-preventiva`,
      payload
    );
  }

  atualizar(id: string, payload: PlanoManutencaoPreventivaRequest) {
    return this.http.put<PlanoManutencaoPreventivaResponse>(
      `${this.apiUrl}/planos-manutencao-preventiva/${encodeURIComponent(id)}`,
      payload
    );
  }

  deletar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/planos-manutencao-preventiva/${encodeURIComponent(id)}`);
  }
}
