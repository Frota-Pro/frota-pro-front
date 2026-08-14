import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { PostoAbastecimentoRequest, PostoAbastecimentoResponse } from './posto-abastecimento-api.models';

@Injectable({ providedIn: 'root' })
export class PostoAbastecimentoApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listar(opts: {
    page?: number;
    size?: number;
    sort?: string;
    q?: string | null;
    ativo?: boolean | null;
  } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.q) params = params.set('q', opts.q);
    if (opts.ativo != null) params = params.set('ativo', String(opts.ativo));

    return this.http.get<PageResponse<PostoAbastecimentoResponse>>(
      `${this.apiUrl}/postos-abastecimento`,
      { params }
    );
  }

  /** Lista enxuta (sem paginação) dos postos ativos — usada pelo seletor no form de abastecimento. */
  listarAtivos() {
    return this.http.get<PostoAbastecimentoResponse[]>(`${this.apiUrl}/postos-abastecimento/ativos`);
  }

  buscarPorCodigo(codigo: string) {
    return this.http.get<PostoAbastecimentoResponse>(
      `${this.apiUrl}/postos-abastecimento/${encodeURIComponent(codigo)}`
    );
  }

  criar(payload: PostoAbastecimentoRequest) {
    return this.http.post<PostoAbastecimentoResponse>(`${this.apiUrl}/postos-abastecimento`, payload);
  }

  atualizar(id: string, payload: PostoAbastecimentoRequest) {
    return this.http.put<PostoAbastecimentoResponse>(
      `${this.apiUrl}/postos-abastecimento/${encodeURIComponent(id)}`,
      payload
    );
  }

  deletar(codigo: string) {
    return this.http.delete<void>(`${this.apiUrl}/postos-abastecimento/${encodeURIComponent(codigo)}`);
  }
}
