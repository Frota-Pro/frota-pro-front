import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import {
  CargaMinResponse,
  CargaRequest,
  CargaResponse,
  ImportarNotaFiscalResponse,
  RelatorioCargasSumidasWinThorResponse,
  TransferirMotoristaCargaRequest
} from './carga-api.models';

@Injectable({ providedIn: 'root' })
export class CargaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  /**
   * GET {{host}}/carga?q=&inicio=&fim=
   * Filtros:
   * - q: numeroCarga, numeroCargaExterno, placa do caminhão ou nome do motorista (contém)
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

  /** POST {{host}}/carga/verificar-winthor — roda a reconciliação agora, sem esperar o job de 3h. */
  verificarWinThor() {
    return this.http.post<void>(`${this.apiUrl}/carga/verificar-winthor`, {});
  }

  /** GET {{host}}/carga/relatorio-sumidas — cargas marcadas como não encontradas mais no WinThor. */
  relatorioSumidas(opts: { inicio?: string | null; fim?: string | null; motorista?: string | null; caminhao?: string | null } = {}) {
    let params = new HttpParams();
    if (opts.inicio) params = params.set('inicio', opts.inicio);
    if (opts.fim) params = params.set('fim', opts.fim);
    if (opts.motorista) params = params.set('motorista', opts.motorista);
    if (opts.caminhao) params = params.set('caminhao', opts.caminhao);

    return this.http.get<RelatorioCargasSumidasWinThorResponse>(`${this.apiUrl}/carga/relatorio-sumidas`, { params });
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

  /** PATCH {{host}}/carga/{numeroCarga}/transferir-motorista */
  transferirMotorista(numeroCarga: string, request: TransferirMotoristaCargaRequest) {
    return this.http.patch<CargaResponse>(
      `${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}/transferir-motorista`,
      request
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

  /** POST {{host}}/carga — cadastro manual de carga (independente de integração). */
  criar(request: CargaRequest) {
    return this.http.post<CargaResponse>(`${this.apiUrl}/carga`, request);
  }

  /**
   * POST {{host}}/carga/{numeroCarga}/notas/xml (multipart) — lê o(s) XML(s)
   * de NFe já emitidos em outro sistema e cadastra cliente/cidade/nota/peso/
   * valor na carga. Não emite nem assina nota nenhuma, só lê o que o XML
   * já traz pronto.
   */
  importarNotasXml(numeroCarga: string, arquivos: File[]) {
    const formData = new FormData();
    arquivos.forEach((arquivo) => formData.append('arquivos', arquivo, arquivo.name));

    return this.http.post<ImportarNotaFiscalResponse>(
      `${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}/notas/xml`,
      formData
    );
  }
}
