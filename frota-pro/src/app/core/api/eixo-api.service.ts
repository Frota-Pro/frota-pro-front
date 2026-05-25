import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { EixoCaminhaoResponse, EixoRequest } from './eixo-api.models';

@Injectable({ providedIn: 'root' })
export class EixoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listarPorCaminhao(codigoCaminhao: string) {
    return this.http.get<EixoCaminhaoResponse[] | PageResponse<EixoCaminhaoResponse>>(
      `${this.apiUrl}/eixo/caminhao/${encodeURIComponent(codigoCaminhao)}`
    );
  }

  criar(payload: EixoRequest) {
    return this.http.post<void>(`${this.apiUrl}/eixo`, payload);
  }
}
