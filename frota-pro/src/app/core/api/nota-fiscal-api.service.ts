import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { EnviarNotaFiscalEmailRequest, NotaFiscalResumoResponse } from './nota-fiscal-api.models';

/**
 * Documentos fiscais (XML/DANFE) de uma carga — buscados na hora no WinThor.
 * Só disponível enquanto a carga não for finalizada; nada fica salvo no servidor.
 */
@Injectable({ providedIn: 'root' })
export class NotaFiscalApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  private base(numeroCarga: string): string {
    return `${this.apiUrl}/carga/${encodeURIComponent(numeroCarga)}/notas-fiscais`;
  }

  listar(numeroCarga: string, cliente: string) {
    const params = new HttpParams().set('cliente', cliente);
    return this.http.get<NotaFiscalResumoResponse[]>(this.base(numeroCarga), { params });
  }

  baixarXmlBlob(numeroCarga: string, numeroNota: number) {
    return this.http.get(`${this.base(numeroCarga)}/${numeroNota}/xml`, { responseType: 'blob' });
  }

  baixarPdfBlob(numeroCarga: string, numeroNota: number) {
    return this.http.get(`${this.base(numeroCarga)}/${numeroNota}/pdf`, { responseType: 'blob' });
  }

  enviarEmail(numeroCarga: string, numeroNota: number, request: EnviarNotaFiscalEmailRequest) {
    return this.http.post<void>(`${this.base(numeroCarga)}/${numeroNota}/enviar-email`, request);
  }
}
