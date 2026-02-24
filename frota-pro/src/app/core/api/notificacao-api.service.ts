import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseApiService } from './base-api.service';
import { NotificacaoPageResponse } from './notificacao-api.models';

@Injectable({ providedIn: 'root' })
export class NotificacaoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar(naoLidas: boolean, page = 0, size = 20) {
    const params = new HttpParams()
      .set('naoLidas', naoLidas)
      .set('page', page)
      .set('size', size)
      .set('sort', 'criadoEm,desc');

    return this.http.get<NotificacaoPageResponse>(`${this.apiUrl}/notificacoes`, { params });
  }

  totalNaoLidas() {
    return this.http.get<number>(`${this.apiUrl}/notificacoes/nao-lidas/total`);
  }

  marcarComoLida(id: string) {
    return this.http.patch<void>(`${this.apiUrl}/notificacoes/${id}/ler`, {});
  }

  marcarTodasComoLidas() {
    return this.http.patch<void>(`${this.apiUrl}/notificacoes/ler-todas`, {});
  }
}
