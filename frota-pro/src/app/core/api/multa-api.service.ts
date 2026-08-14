import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import {
  MultaAnexoResponse,
  MultaRequest,
  MultaResponse,
  StatusPagamentoMulta,
  TipoAnexoMulta,
} from './multa-api.models';

@Injectable({ providedIn: 'root' })
export class MultaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listar(opts: {
    page?: number;
    size?: number;
    sort?: string;
    caminhao?: string | null;
    motorista?: string | null;
    status?: StatusPagamentoMulta | null;
    inicio?: string | null;
    fim?: string | null;
  } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);
    if (opts.caminhao) params = params.set('caminhao', opts.caminhao);
    if (opts.motorista) params = params.set('motorista', opts.motorista);
    if (opts.status) params = params.set('status', opts.status);
    if (opts.inicio) params = params.set('inicio', opts.inicio);
    if (opts.fim) params = params.set('fim', opts.fim);

    return this.http.get<PageResponse<MultaResponse>>(`${this.apiUrl}/multas`, { params });
  }

  buscarPorId(id: string) {
    return this.http.get<MultaResponse>(`${this.apiUrl}/multas/${encodeURIComponent(id)}`);
  }

  criar(payload: MultaRequest) {
    return this.http.post<MultaResponse>(`${this.apiUrl}/multas`, payload);
  }

  atualizar(id: string, payload: MultaRequest) {
    return this.http.put<MultaResponse>(`${this.apiUrl}/multas/${encodeURIComponent(id)}`, payload);
  }

  atualizarStatus(id: string, statusPagamento: StatusPagamentoMulta) {
    return this.http.patch<MultaResponse>(
      `${this.apiUrl}/multas/${encodeURIComponent(id)}/status`,
      { statusPagamento }
    );
  }

  deletar(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/multas/${encodeURIComponent(id)}`);
  }

  listarAnexos(id: string) {
    return this.http.get<MultaAnexoResponse[]>(`${this.apiUrl}/multas/${encodeURIComponent(id)}/anexos`);
  }

  uploadAnexo(id: string, arquivo: File, tipoAnexo: TipoAnexoMulta) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    const params = new HttpParams().set('tipoAnexo', tipoAnexo);

    return this.http.post<MultaAnexoResponse>(
      `${this.apiUrl}/multas/${encodeURIComponent(id)}/anexos`,
      formData,
      { params }
    );
  }
}
