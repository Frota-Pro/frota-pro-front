import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import {
  DesempenhoCategoriaMetaResponse,
  DesempenhoMetasLinha,
  DesempenhoMetasParams,
  DesempenhoMetasResponse,
  MetaRequest,
  MetaResponse,
  TipoMetaResponse
} from './meta-api.models';

@Injectable({ providedIn: 'root' })
export class MetaApiService extends BaseApiService {
  private readonly invalidatedSubject = new Subject<void>();
  readonly invalidated$ = this.invalidatedSubject.asObservable();

  constructor(http: HttpClient) { super(http); }

  invalidate(): void {
    this.invalidatedSubject.next();
  }

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

  tipos() {
    return this.http.get<TipoMetaResponse[]>(`${this.apiUrl}/metas/tipos`);
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

  desempenhoCategoria(
    codigoCategoria: string,
    opts: { dataReferencia?: string | null; inicio?: string | null; fim?: string | null }
  ) {
    let params = new HttpParams();
    if (opts.inicio && opts.fim) {
      params = params.set('inicio', opts.inicio).set('fim', opts.fim);
    } else if (opts.dataReferencia) {
      params = params.set('dataReferencia', opts.dataReferencia);
    }

    return this.http.get<DesempenhoCategoriaMetaResponse>(
      `${this.apiUrl}/metas/categorias/${encodeURIComponent(codigoCategoria)}/desempenho`,
      { params }
    );
  }

  desempenho(paramsInput: DesempenhoMetasParams) {
    let params = new HttpParams()
      .set('inicio', paramsInput.inicio)
      .set('fim', paramsInput.fim);

    if (paramsInput.tipoMeta) params = params.set('tipoMeta', paramsInput.tipoMeta);
    if (paramsInput.caminhao) params = params.set('caminhao', paramsInput.caminhao);
    if (paramsInput.motorista) params = params.set('motorista', paramsInput.motorista);
    if (paramsInput.categoria) params = params.set('categoria', paramsInput.categoria);

    return this.http.get<DesempenhoMetasResponse | DesempenhoMetasLinha[]>(
      `${this.apiUrl}/metas/desempenho`,
      { params }
    );
  }

  historicoPorCaminhao(codigoCaminhao: string, inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<MetaResponse[]>(
      `${this.apiUrl}/metas/historico/caminhao/${encodeURIComponent(codigoCaminhao)}`,
      { params }
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
