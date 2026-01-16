import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { MetaResponse } from './meta-api.models';

@Injectable({ providedIn: 'root' })
export class MetaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  metaAtivaCaminhao(codigo: string, dataReferenciaIso: string) {
    return this.http.get<MetaResponse>(
      `${this.apiUrl}/metas/ativas/caminhao/${encodeURIComponent(codigo)}`,
      { params: { dataReferencia: dataReferenciaIso } }
    );
  }
}
