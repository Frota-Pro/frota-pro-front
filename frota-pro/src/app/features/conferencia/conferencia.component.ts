import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { extrairMensagemErro } from '../../core/utils/api-error.util';
import { ConferenciaApiService } from '../../core/api/conferencia-api.service';
import { ConferenciaTipo } from '../../core/api/conferencia-api.models';

/** Caminho da tela de cada tipo de conferência (o tipo novo entra aqui e na rota). */
export const ROTA_POR_TIPO: Record<string, string> = {
  REENTREGA_MOTORISTA_CAMINHAO: 'reentrega-motorista-caminhao',
};

@Component({
  selector: 'app-conferencia',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './conferencia.component.html',
  styleUrls: ['./conferencia.component.css'],
})
export class ConferenciaComponent implements OnInit {
  tipos: ConferenciaTipo[] = [];
  loading = false;
  errorMsg: string | null = null;

  constructor(private api: ConferenciaApiService) {}

  ngOnInit(): void {
    this.loading = true;
    this.api
      .tipos()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (tipos) => (this.tipos = tipos),
        error: (err) => (this.errorMsg = extrairMensagemErro(err, 'Não foi possível carregar os tipos de conferência.')),
      });
  }

  rotaDoTipo(tipo: ConferenciaTipo): string | null {
    const caminho = ROTA_POR_TIPO[tipo.codigo];
    return caminho ? `/dashboard/conferencia/${caminho}` : null;
  }

  trackByCodigo(_: number, tipo: ConferenciaTipo): string {
    return tipo.codigo;
  }
}
