import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { DevolucaoResponse, TransferenciaResponse } from './devolucao-transferencia-api.models';

/**
 * Detalhe de devolução (produto a produto) e transferência de pedido
 * (nota a nota) de uma carga — buscado na hora no WinThor, nada fica salvo no servidor.
 */
@Injectable({ providedIn: 'root' })
export class DevolucaoTransferenciaApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  private base(numeroCarga: string): string {
    return `${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}`;
  }

  devolucoes(numeroCarga: string) {
    return this.http.get<DevolucaoResponse[]>(`${this.base(numeroCarga)}/devolucoes`);
  }

  transferencias(numeroCarga: string) {
    return this.http.get<TransferenciaResponse[]>(`${this.base(numeroCarga)}/transferencias`);
  }
}
