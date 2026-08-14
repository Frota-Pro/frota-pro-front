import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import {
  AnalyticsAbastecimentoResponse,
  AnalyticsCaminhaoResponse,
  AnalyticsFrotaResponse,
  AnalyticsMotoristaResponse,
} from './analytics-api.models';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  /** GET {{host}}/analytics/frota?inicio=&fim= */
  frota(inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<AnalyticsFrotaResponse>(`${this.apiUrl}/analytics/frota`, { params });
  }

  /** GET {{host}}/analytics/motorista/{codigo}?inicio=&fim= */
  motorista(codigo: string, inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<AnalyticsMotoristaResponse>(
      `${this.apiUrl}/analytics/motorista/${encodeURIComponent(codigo)}`,
      { params }
    );
  }

  /** GET {{host}}/analytics/caminhao/{codigo}?inicio=&fim= */
  caminhao(codigo: string, inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<AnalyticsCaminhaoResponse>(
      `${this.apiUrl}/analytics/caminhao/${encodeURIComponent(codigo)}`,
      { params }
    );
  }

  /** GET {{host}}/analytics/abastecimento?inicio=&fim= */
  abastecimento(inicio: string, fim: string) {
    const params = new HttpParams().set('inicio', inicio).set('fim', fim);
    return this.http.get<AnalyticsAbastecimentoResponse>(`${this.apiUrl}/analytics/abastecimento`, { params });
  }
}
