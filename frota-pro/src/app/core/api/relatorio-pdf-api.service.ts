import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { BaseApiService } from './base-api.service';

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
  vidaUtilPneu(codigoCaminhao?: string) {
    let params = new HttpParams();
    if (codigoCaminhao) params = params.set('codigoCaminhao', codigoCaminhao);

    return this.http.get(`${this.apiUrl}/relatorios/pdf/pneus/vida-util`, {
      params,
      responseType: 'blob',
      observe: 'response',
    });
  }
}
