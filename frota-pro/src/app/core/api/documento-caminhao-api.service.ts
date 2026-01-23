import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { DocumentoCaminhaoResponse, TipoDocumentoCaminhao } from './documento-caminhao-api.models';

@Injectable({ providedIn: 'root' })
export class DocumentoCaminhaoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  /**
   * GET {{host}}/caminhao/{id}/documentos
   */
  listar(
    caminhaoId: string,
    opts: { page?: number; size?: number; sort?: string } = {}
  ) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<DocumentoCaminhaoResponse>>(
      `${this.apiUrl}/caminhao/${encodeURIComponent(caminhaoId)}/documentos`,
      { params }
    );
  }

  /**
   * POST {{host}}/caminhao/{id}/documentos
   * multipart/form-data:
   * - tipoDocumento (TEXT)
   * - observacao (TEXT)
   * - arquivo (FILE)
   */
  upload(
    caminhaoId: string,
    arquivo: File,
    tipoDocumento: TipoDocumentoCaminhao,
    observacao?: string | null
  ) {
    const form = new FormData();
    form.append('tipoDocumento', tipoDocumento);

    if (observacao != null && String(observacao).trim().length > 0) {
      form.append('observacao', String(observacao));
    }

    form.append('arquivo', arquivo);

    return this.http.post<DocumentoCaminhaoResponse>(
      `${this.apiUrl}/caminhao/${encodeURIComponent(caminhaoId)}/documentos`,
      form
    );
  }

  /**
   * GET {{host}}/arquivos/{arquivoId}/preview
   * Retorna BLOB (para IMG ou IFRAME via blob:)
   */
  previewBlob(arquivoId: string) {
    return this.http.get(
      `${this.apiUrl}/arquivos/${encodeURIComponent(arquivoId)}/preview`,
      { responseType: 'blob' }
    );
  }

  /**
   * GET {{host}}/arquivos/{arquivoId}/download
   * Retorna BLOB (download seguro com Authorization)
   */
  downloadBlob(arquivoId: string) {
    return this.http.get(
      `${this.apiUrl}/arquivos/${encodeURIComponent(arquivoId)}/download`,
      { responseType: 'blob' }
    );
  }
}
