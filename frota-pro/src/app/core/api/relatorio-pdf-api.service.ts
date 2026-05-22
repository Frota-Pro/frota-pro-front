import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { DesempenhoMetasParams } from './meta-api.models';

export type PdfResponse = HttpResponse<Blob>;

@Injectable({ providedIn: 'root' })
export class RelatorioPdfApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  abastecimentos(inicio: string, fim: string, codigoCaminhao?: string, codigoMotorista?: string) {
    let params = new HttpParams().set('inicio', inicio).set('fim', fim);
    if (codigoCaminhao) params = params.set('codigoCaminhao', codigoCaminhao);
    if (codigoMotorista) params = params.set('codigoMotorista', codigoMotorista);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/abastecimentos`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  custoCaminhao(codigoCaminhao: string, inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/caminhao/${encodeURIComponent(codigoCaminhao)}/custo`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  manutencoesCaminhao(codigoCaminhao: string, inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/caminhao/${encodeURIComponent(codigoCaminhao)}/manutencoes`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  rankingMotoristas(inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/motoristas/ranking`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  metasMotoristas(inicio: string, fim: string, tipoMeta?: string) {
    let params = new HttpParams().set('inicio', inicio).set('fim', fim);
    if (tipoMeta) params = params.set('tipoMeta', tipoMeta);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/motoristas/metas`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  cargaCompleta(numeroCarga: string) {
    return this.http.get(`${this.apiUrl}/relatorios/pdf/carga/${encodeURIComponent(numeroCarga)}/completo`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  metaMensalMotorista(codigoMotorista: string, inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/motorista/${encodeURIComponent(codigoMotorista)}/meta-mensal`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  // (quando você ativar no back)
  vidaUtilPneu(codigoCaminhao?: string, codigoPneu?: string) {
    let params = new HttpParams();
    if (codigoCaminhao) params = params.set('codigoCaminhao', codigoCaminhao);
    if (codigoPneu) params = params.set('codigoPneu', codigoPneu);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/pneus/vida-util`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  despesasPorCategoria(inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/despesas/categorias`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  metasPorCategoria(
    codigoCategoria: string,
    opts: { dataReferencia?: string | null; inicio?: string | null; fim?: string | null }
  ) {
    let params = new HttpParams();
    if (opts.inicio && opts.fim) {
      params = params.set('inicio', opts.inicio).set('fim', opts.fim);
    } else if (opts.dataReferencia) {
      params = params.set('dataReferencia', opts.dataReferencia);
    }

    return this.http.get(`${this.apiUrl}/relatorios/pdf/metas/categorias/${encodeURIComponent(codigoCategoria)}`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }

  desempenhoMetas(paramsInput: DesempenhoMetasParams) {
    let params = new HttpParams()
      .set('inicio', paramsInput.inicio)
      .set('fim', paramsInput.fim);

    if (paramsInput.tipoMeta) params = params.set('tipoMeta', paramsInput.tipoMeta);
    if (paramsInput.caminhao) params = params.set('caminhao', paramsInput.caminhao);
    if (paramsInput.motorista) params = params.set('motorista', paramsInput.motorista);
    if (paramsInput.categoria) params = params.set('categoria', paramsInput.categoria);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/metas/desempenho`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }
}
