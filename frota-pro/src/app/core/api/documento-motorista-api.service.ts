import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { DocumentoMotoristaResponse, TipoDocumentoMotorista } from './documento-motorista-api.models';

@Injectable({ providedIn: 'root' })
export class DocumentoMotoristaApiService extends BaseApiService {
  constructor(http: HttpClient) { super(http); }

  listar(motoristaId: string) {
    return this.http.get<DocumentoMotoristaResponse[]>(
      `${this.apiUrl}/motorista/${encodeURIComponent(motoristaId)}/documentos`
    );
  }

  upload(
    motoristaId: string,
    arquivo: File,
    tipoDocumento: TipoDocumentoMotorista,
    observacao?: string | null
  ) {
    const form = new FormData();
    form.append('tipoDocumento', tipoDocumento);

    if (observacao != null && String(observacao).trim().length > 0) {
      form.append('observacao', String(observacao));
    }

    form.append('arquivo', arquivo);

    return this.http.post<DocumentoMotoristaResponse>(
      `${this.apiUrl}/motorista/${encodeURIComponent(motoristaId)}/documentos`,
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
