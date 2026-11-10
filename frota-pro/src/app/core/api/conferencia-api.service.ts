import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import {
  ConferenciaConfirmadaResponse,
  ConferenciaMotoristaCaminhaoResponse,
  ConferenciaTipo,
} from './conferencia-api.models';

@Injectable({ providedIn: 'root' })
export class ConferenciaApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  /** GET {{host}}/conferencia/tipos */
  tipos() {
    return this.http.get<ConferenciaTipo[]>(`${this.apiUrl}/conferencia/tipos`);
  }

  /** GET {{host}}/conferencia/reentrega-motorista-caminhao?inicio=&fim= (só lê; nada muda). */
  listarReentregaMotoristaCaminhao(opts: { inicio?: string | null; fim?: string | null } = {}) {
    let params = new HttpParams();
    if (opts.inicio) params = params.set('inicio', opts.inicio);
    if (opts.fim) params = params.set('fim', opts.fim);
    return this.http.get<ConferenciaMotoristaCaminhaoResponse>(
      `${this.apiUrl}/conferencia/reentrega-motorista-caminhao`,
      { params },
    );
  }

  /** POST .../{numeroCargaExterno}/confirmar-troca — aplica na carga o motorista/caminhão do carregamento. */
  confirmarTrocaReentregaMotoristaCaminhao(numeroCargaExterno: string) {
    return this.http.post<ConferenciaConfirmadaResponse>(
      `${this.apiUrl}/conferencia/reentrega-motorista-caminhao/${encodeURIComponent(numeroCargaExterno)}/confirmar-troca`,
      {},
    );
  }

  /** POST .../{numeroCargaExterno}/ignorar-troca — "não é isso": o item sai da lista. */
  ignorarTrocaReentregaMotoristaCaminhao(numeroCargaExterno: string) {
    return this.http.post<void>(
      `${this.apiUrl}/conferencia/reentrega-motorista-caminhao/${encodeURIComponent(numeroCargaExterno)}/ignorar-troca`,
      {},
    );
  }
}
