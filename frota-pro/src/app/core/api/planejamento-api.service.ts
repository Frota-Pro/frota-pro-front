import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApiService } from './base-api.service';
import { PlanejamentoPlanilha, PlanejamentoResumo } from './planejamento-api.models';

@Injectable({ providedIn: 'root' })
export class PlanejamentoApiService extends BaseApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  private base(id: string) {
    return `${this.apiUrl}/planejamento/planilhas/${encodeURIComponent(id)}`;
  }

  /** GET {{host}}/planejamento/planilhas */
  listar() {
    return this.http.get<PlanejamentoResumo[]>(`${this.apiUrl}/planejamento/planilhas`);
  }

  /** GET {{host}}/planejamento/planilhas/{id} */
  obter(id: string) {
    return this.http.get<PlanejamentoPlanilha>(this.base(id));
  }

  /** POST {{host}}/planejamento/planilhas — cria a planilha do dia e já traz os carregamentos do WinThor. */
  criar(data?: string | null) {
    return this.http.post<PlanejamentoPlanilha>(`${this.apiUrl}/planejamento/planilhas`, { data: data || null });
  }

  /** Busca de novo no WinThor: acrescenta os que apareceram e atualiza peso/pedidos/valor/faturamento. */
  atualizar(id: string) {
    return this.http.post<PlanejamentoPlanilha>(`${this.base(id)}/atualizar-planilha`, {});
  }

  fechar(id: string) {
    return this.http.post<PlanejamentoPlanilha>(`${this.base(id)}/fechar-planilha`, {});
  }

  reabrir(id: string) {
    return this.http.post<PlanejamentoPlanilha>(`${this.base(id)}/reabrir-planilha`, {});
  }

  /** "Tirar" vários de uma vez: saem da planilha e não voltam mais (ex.: cliente vem buscar). */
  tirar(id: string, numeros: number[]) {
    return this.http.post<PlanejamentoPlanilha>(`${this.base(id)}/tirar-carregamentos`, { numeros });
  }

  /** Vários carregamentos viram complemento do mesmo principal. */
  juntar(id: string, principal: number, numeros: number[]) {
    return this.http.post<PlanejamentoPlanilha>(`${this.base(id)}/juntar-carregamentos`, { principal, numeros });
  }

  /** Desfaz o complemento de vários: cada um volta a ser um carregamento solto. */
  separar(id: string, numeros: number[]) {
    return this.http.post<PlanejamentoPlanilha>(`${this.base(id)}/separar-carregamentos`, { numeros });
  }

  /** Motorista, ajudantes (vários) e caminhão da rota (códigos do cadastro); vazios limpam. */
  definirRota(id: string, numero: number, motoristaCodigo: string | null, ajudantesCodigos: string[], caminhaoCodigo: string | null) {
    return this.http.post<PlanejamentoPlanilha>(`${this.base(id)}/carregamentos/${numero}/definir-rota`, {
      motoristaCodigo: motoristaCodigo || null,
      ajudantesCodigos,
      caminhaoCodigo: caminhaoCodigo || null,
    });
  }

  /** Box e saída (dia + turno) da rota; vazios limpam. */
  definirSaida(id: string, numero: number, boxNumero: number | null, diaSaida: string | null, turnoSaida: string | null) {
    return this.http.post<PlanejamentoPlanilha>(`${this.base(id)}/carregamentos/${numero}/definir-saida`, {
      boxNumero,
      diaSaida: diaSaida || null,
      turnoSaida: turnoSaida || null,
    });
  }
}
