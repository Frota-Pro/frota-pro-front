import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { ConferenciaCargaZerada, ConferenciaTransportadoResponse } from './conferencia-transportado-api.models';

@Injectable({ providedIn: 'root' })
export class ConferenciaTransportadoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  /** mes no formato yyyy-MM; "atualizar" faz o servidor consultar o WinThor de novo em vez de usar o resultado recente. */
  buscar(mes: string, atualizar = false) {
    const params = new HttpParams().set('mes', mes).set('atualizar', String(atualizar));
    return this.http.get<ConferenciaTransportadoResponse>(`${this.apiUrl}/conferencia/transportado`, { params });
  }

  /** Só administrador: tira dos totais as cargas que ficaram sem nota porque as notas foram para outras cargas. */
  zerarTransferidas(mes: string) {
    const params = new HttpParams().set('mes', mes);
    return this.http.post<ConferenciaCargaZerada[]>(`${this.apiUrl}/conferencia/transportado/zerar-transferidas`, null, { params });
  }
}
