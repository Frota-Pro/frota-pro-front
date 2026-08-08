import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { CidadeResumoResponse } from './cidade-api.models';
import { ClienteHistoricoRotaResponse } from './rota-api.models';

@Injectable({ providedIn: 'root' })
export class CidadeApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  listar() {
    return this.http.get<CidadeResumoResponse[]>(`${this.apiUrl}/cidades`);
  }

  clientes(cidade: string) {
    return this.http.get<ClienteHistoricoRotaResponse[]>(
      `${this.apiUrl}/cidades/${encodeURIComponent(cidade)}/clientes`
    );
  }
}
