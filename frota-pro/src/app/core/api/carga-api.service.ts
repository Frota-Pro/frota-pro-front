import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { CargaMinResponse, CargaResponse } from './carga-api.models';

@Injectable({ providedIn: 'root' })
export class CargaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  /**
   * GET {{host}}/carga?q=&inicio=&fim=
   * Filtros:
   * - q: numeroCarga ou numeroCargaExterno (contém)
   * - inicio/fim: periodo por dtSaida (ISO yyyy-MM-dd)
   */
  listar(
    opts: {
      q?: string | null;
      inicio?: string | null;
      fim?: string | null;
      page?: number;
      size?: number;
      sort?: string;
    } = {}
  ) {
    let params = new HttpParams();
    if (opts.q) params = params.set('q', opts.q);
    if (opts.inicio) params = params.set('inicio', opts.inicio);
    if (opts.fim) params = params.set('fim', opts.fim);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<CargaMinResponse>>(`${this.apiUrl}/carga`, { params });
  }

  /** GET {{host}}/carga/{numeroCarga} */
  buscar(numeroCarga: string) {
    return this.http.get<CargaResponse>(`${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}`);
  }

  /** GET {{host}}/carga/externo/{codigoExterno} */
  buscarPorExterno(codigoExterno: string) {
    return this.http.get<CargaResponse>(
      `${this.apiUrl}/carga/externo/${encodeURIComponent(codigoExterno)}`
    );
  }

  /** PATCH {{host}}/carga/{numeroCarga}/ordem-entrega */
  atualizarOrdemEntrega(numeroCarga: string, clientes: string[]) {
    return this.http.patch<void>(
      `${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}/ordem-entrega`,
      { clientes }
    );
  }

  /** PATCH {{host}}/carga/{numeroCarga}/observacao */
  atualizarObservacaoMotorista(numeroCarga: string, observacao: string) {
    return this.http.patch<void>(
      `${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}/observacao`,
      { observacao }
    );
  }

  listarPorCaminhao(codigo: string, opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams().set('codigo', codigo);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<CargaResponse>>(`${this.apiUrl}/carga/caminhao`, { params });
  }

  listarPorMotorista(codigoMotorista: string, opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams().set('codigo', codigoMotorista);
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<CargaResponse>>(`${this.apiUrl}/carga/motorista`, { params });
  }
}
