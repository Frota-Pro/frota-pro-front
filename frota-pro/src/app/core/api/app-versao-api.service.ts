import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { AppVersaoAtualResponse, AppVersaoResponse } from './app-versao-api.models';

@Injectable({ providedIn: 'root' })
export class AppVersaoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  /**
   * GET {{host}}/app-versao/atual/publico
   * Público, sem token. Retorna 404 se nenhuma versão foi publicada ainda.
   */
  atualPublico() {
    return this.http.get<AppVersaoAtualResponse>(`${this.apiUrl}/app-versao/atual/publico`);
  }

  /**
   * URL direta de download do APK público (usada em <a href>).
   */
  get urlDownloadPublico(): string {
    return `${this.apiUrl}/app-versao/download/publico`;
  }

  /**
   * POST {{host}}/app-versao
   * multipart/form-data:
   * - apk (FILE)
   * - versaoNome (TEXT)
   * - notas (TEXT, opcional)
   * - obrigatoria (BOOLEAN, opcional)
   */
  publicar(apk: File, versaoNome: string, notas?: string | null, obrigatoria?: boolean) {
    const form = new FormData();
    form.append('apk', apk);
    form.append('versaoNome', versaoNome);

    if (notas != null && String(notas).trim().length > 0) {
      form.append('notas', String(notas));
    }

    if (obrigatoria != null) {
      form.append('obrigatoria', String(obrigatoria));
    }

    return this.http.post<AppVersaoResponse>(`${this.apiUrl}/app-versao`, form);
  }
}
