import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { MetaRequest, MetaResponse } from './meta-api.models';

@Injectable({ providedIn: 'root' })
export class MetaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  private toApiDate(value: string | null | undefined): string {
    const v = (value || '').trim();
    if (!v) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v; // dd/MM/yyyy
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {           // YYYY-MM-DD
      const [yyyy, mm, dd] = v.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    return v;
  }

  listar(opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<MetaResponse>>(`${this.apiUrl}/metas`, { params });
  }

  buscarPorId(id: string) {
    return this.http.get<MetaResponse>(`${this.apiUrl}/metas/${encodeURIComponent(id)}`);
  }

  criar(payload: MetaRequest) {
    const body: MetaRequest = {
      ...payload,
      dataIncio: this.toApiDate(payload.dataIncio),
      dataFim: this.toApiDate(payload.dataFim),
    };
    return this.http.post<MetaResponse>(`${this.apiUrl}/metas`, body);
  }

  atualizar(id: string, payload: MetaRequest) {
    const body: MetaRequest = {
      ...payload,
      dataIncio: this.toApiDate(payload.dataIncio),
      dataFim: this.toApiDate(payload.dataFim),
    };
    return this.http.put<MetaResponse>(`${this.apiUrl}/metas/${encodeURIComponent(id)}`, body);
  }

  deletar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/metas/${encodeURIComponent(id)}`);
  }

  metaAtivaCaminhao(codigo: string, dataReferenciaIso: string) {
    return this.http.get<MetaResponse>(
      `${this.apiUrl}/metas/ativas/caminhao/${encodeURIComponent(codigo)}`,
      { params: { dataReferencia: dataReferenciaIso } }
    );
  }

  historico(opts: {
    caminhao?: string | null;
    categoria?: string | null;
    motorista?: string | null;
    inicio: string; // YYYY-MM-DD
    fim: string;    // YYYY-MM-DD
  }) {
    let params = new HttpParams();
    if (opts.caminhao) params = params.set('caminhao', opts.caminhao);
    if (opts.categoria) params = params.set('categoria', opts.categoria);
    if (opts.motorista) params = params.set('motorista', opts.motorista);
    params = params.set('inicio', opts.inicio);
    params = params.set('fim', opts.fim);

    return this.http.get<MetaResponse[]>(`${this.apiUrl}/metas/historico`, { params });
  }
}
