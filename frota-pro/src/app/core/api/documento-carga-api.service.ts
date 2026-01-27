import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { DocumentoCargaResponse, TipoDocumentoCarga } from './documento-carga-api.models';

@Injectable({ providedIn: 'root' })
export class DocumentoCargaApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  /**
   * GET {{host}}/carga/{numeroCarga}/documentos
   */
  listar(
    numeroCarga: string,
    opts: { page?: number; size?: number; sort?: string } = {}
  ) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<DocumentoCargaResponse>>(
      `${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}/documentos`,
      { params }
    );
  }

  /**
   * POST {{host}}/carga/{numeroCarga}/documentos
   * multipart/form-data:
   * - tipoDocumento (TEXT)
   * - observacao (TEXT)
   * - arquivo (FILE)
   */
  upload(
    numeroCarga: string,
    arquivo: File,
    tipoDocumento: TipoDocumentoCarga | string,
    observacao?: string | null
  ) {
    const form = new FormData();
    form.append('tipoDocumento', String(tipoDocumento));

    if (observacao != null && String(observacao).trim().length > 0) {
      form.append('observacao', String(observacao));
    }

    form.append('arquivo', arquivo);

    return this.http.post<DocumentoCargaResponse>(
      `${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}/documentos`,
      form
    );
  }

  /**
   * GET {{host}}/arquivos/{arquivoId}/preview
   */
  previewBlob(arquivoId: string) {
    return this.http.get(
      `${this.apiUrl}/arquivos/${encodeURIComponent(arquivoId)}/preview`,
      { responseType: 'blob' }
    );
  }

  /**
   * GET {{host}}/arquivos/{arquivoId}/download
   */
  downloadBlob(arquivoId: string) {
    return this.http.get(
      `${this.apiUrl}/arquivos/${encodeURIComponent(arquivoId)}/download`,
      { responseType: 'blob' }
    );
  }
}
