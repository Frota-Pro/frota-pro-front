import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PageResponse } from './page.models';

import {
  UsuarioResponse,
  UsuarioCreateRequest,
  UsuarioUpdateRequest,
  UsuarioSenhaUpdateRequest,
  UsuarioSenhaSelfRequest
} from './usuario-api.models';

@Injectable({ providedIn: 'root' })
export class UsuarioApiService extends BaseApiService {

  constructor(http: HttpClient) { super(http); }

  listar(opts: { q?: string; ativo?: boolean; page?: number; size?: number; sort?: string } = {}) {
    let params = new HttpParams();

    if (opts.q) params = params.set('q', opts.q);
    if (opts.ativo !== undefined && opts.ativo !== null) params = params.set('ativo', String(opts.ativo));
    if (opts.page != null) params = params.set('page', String(opts.page));
    if (opts.size != null) params = params.set('size', String(opts.size));
    params = params.set('sort', opts.sort ?? 'criadoEm,desc');

    return this.http.get<PageResponse<UsuarioResponse>>(`${this.apiUrl}/usuario`, { params });
  }

  buscarPorId(id: string) {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/usuario/${encodeURIComponent(id)}`);
  }

  criar(payload: UsuarioCreateRequest) {
    return this.http.post<UsuarioResponse>(`${this.apiUrl}/usuario`, payload);
  }

  atualizar(id: string, payload: UsuarioUpdateRequest) {
    return this.http.put<UsuarioResponse>(`${this.apiUrl}/usuario/${encodeURIComponent(id)}`, payload);
  }

  atualizarAtivo(id: string, ativo: boolean) {
    return this.http.patch<UsuarioResponse>(
      `${this.apiUrl}/usuario/${encodeURIComponent(id)}/ativo`,
      null,
      { params: new HttpParams().set('ativo', String(ativo)) }
    );
  }

  atualizarSenha(id: string, payload: UsuarioSenhaUpdateRequest) {
    return this.http.put<void>(`${this.apiUrl}/usuario/${encodeURIComponent(id)}/senha`, payload);
  }

  atualizarMinhaSenha(payload: UsuarioSenhaSelfRequest) {
    return this.http.put<void>(`${this.apiUrl}/usuario/me/senha`, payload);
  }

  /**
   * POST /usuario/motoristas?matriculas=MOT-000164
   */
  criarUsuarioMotorista(matricula: string) {
    const params = new HttpParams().set('matriculas', matricula);
    return this.http.post<string[]>(`${this.apiUrl}/usuario/motoristas`, null, { params });
  }
}
