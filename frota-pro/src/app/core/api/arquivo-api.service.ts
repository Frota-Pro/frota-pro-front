import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class ArquivoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  previewBlob(arquivoId: string) {
    return this.http.get(`${this.apiUrl}/arquivos/${encodeURIComponent(arquivoId)}/preview`, {
      responseType: 'blob',
    });
  }

  downloadBlob(arquivoId: string) {
    return this.http.get(`${this.apiUrl}/arquivos/${encodeURIComponent(arquivoId)}/download`, {
      responseType: 'blob',
    });
  }
}
