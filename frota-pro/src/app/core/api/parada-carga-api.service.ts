import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import {
  AnexoParadaResponse,
  ParadaCargaRequest,
  ParadaCargaResponse,
} from './parada-carga-api.models';

@Injectable({ providedIn: 'root' })
export class ParadaCargaApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listarPorCarga(numeroCarga: string, opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<ParadaCargaResponse>>(
      `${this.apiUrl}/parada-carga/carga/${encodeURIComponent(numeroCarga)}`,
      { params }
    );
  }

  buscar(id: string) {
    return this.http.get<ParadaCargaResponse>(`${this.apiUrl}/parada-carga/${encodeURIComponent(id)}`);
  }

  criar(request: ParadaCargaRequest) {
    return this.http.post<ParadaCargaResponse>(`${this.apiUrl}/parada-carga`, request);
  }

  listarAnexos(paradaId: string) {
    return this.http.get<AnexoParadaResponse[]>(
      `${this.apiUrl}/parada-carga/${encodeURIComponent(paradaId)}/anexos`
    );
  }

  uploadAnexo(paradaId: string, arquivo: File, tipoAnexo: string, observacao?: string | null) {
    const form = new FormData();
    form.append('tipoAnexo', tipoAnexo);
    if (observacao && observacao.trim().length > 0) form.append('observacao', observacao.trim());
    form.append('arquivo', arquivo);
    return this.http.post<AnexoParadaResponse>(
      `${this.apiUrl}/parada-carga/${encodeURIComponent(paradaId)}/anexos`,
      form
    );
  }
}
