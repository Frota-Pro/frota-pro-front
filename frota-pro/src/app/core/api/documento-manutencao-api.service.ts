import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';
import { DocumentoManutencaoResponse, TipoDocumentoManutencao } from './documento-manutencao-api.models';

@Injectable({ providedIn: 'root' })
export class DocumentoManutencaoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar(codigoManutencao: string, opts: { page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    if (opts.sort) params = params.set('sort', opts.sort);

    return this.http.get<PageResponse<DocumentoManutencaoResponse>>(
      `${this.apiUrl}/manutencao/${encodeURIComponent(codigoManutencao)}/documentos`,
      { params }
    );
  }

  upload(
    codigoManutencao: string,
    arquivo: File,
    tipoDocumento: TipoDocumentoManutencao,
    observacao?: string | null
  ) {
    const form = new FormData();
    form.append('tipoDocumento', tipoDocumento);

    if (observacao != null && String(observacao).trim().length > 0) {
      form.append('observacao', String(observacao));
    }

    form.append('arquivo', arquivo);

    return this.http.post<DocumentoManutencaoResponse>(
      `${this.apiUrl}/manutencao/${encodeURIComponent(codigoManutencao)}/documentos`,
      form
    );
  }

  previewBlob(arquivoId: string) {
    return this.http.get(
      `${this.apiUrl}/arquivos/${encodeURIComponent(arquivoId)}/preview`,
      { responseType: 'blob' }
    );
  }

  downloadBlob(arquivoId: string) {
    return this.http.get(
      `${this.apiUrl}/arquivos/${encodeURIComponent(arquivoId)}/download`,
      { responseType: 'blob' }
    );
  }
}
